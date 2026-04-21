import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent / ".env")
url = os.getenv("EXPO_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SECRET_KEY")
if not url or not key:
    print("Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY")
    sys.exit(1)

if len(sys.argv) != 3:
    print("Usage: python v1.py <user_id> <mosque_id>")
    sys.exit(1)

user_id = sys.argv[1]
mosque_id = sys.argv[2]

supabase = create_client(url,key)

def fetch_user_data(supabase, user_id, mosque_id):
    prefs = (
        supabase.table("user_preferences")
        .select("*")
        .eq("user_id", user_id)
        .eq("mosque_id", mosque_id)
        .limit(1)
        .execute()
    )
    if not prefs.data:
        return None
    user = prefs.data[0]
    interests = (
        supabase.table("user_islamic_interests")
        .select("*")
        .eq("user_id", user_id)
        .eq("mosque_id", mosque_id)
        .execute()
    )
    goals = (
        supabase.table("user_islamic_goals")
        .select("*")
        .eq("user_id", user_id)
        .eq("mosque_id", mosque_id)
        .execute()
    )
    user["user_islamic_interests"] = interests.data or []
    user["user_islamic_goals"] = goals.data or []
    return user
    
def fetch_content_data(supabase , mosque_id):
    response = supabase.table("content_items").select("*, content_islamic_interests(*), content_islamic_goals(*)").eq("mosque_id", mosque_id).execute()
    return response.data if response.data else []
def fetch_user_content_interactions(supabase, user_id, mosque_id):
    response = supabase.table("user_content_interactions").select("*").eq("user_id", user_id).eq("mosque_id", mosque_id).eq("interaction_type","add").execute()
    return response.data if response.data else []
    
def filter_content(user, content_item, user_content_interactions):
    # Rule 1 - Mosque match
    if user["mosque_id"] != content_item["mosque_id"]:
        return False
    
    # Rule 2 - Gender match
    if content_item["gender"] != "All" and user["gender"] != content_item["gender"]:
        return False
    
    # Rule 3 - Expired content
    if content_item["end_date"] and content_item["end_date"] < datetime.now().isoformat():
        return False
    
    # Rule 4 - Sold out
    if content_item["max_capacity"] is not None and content_item["current_count"] >= content_item["max_capacity"]:
        return False
    
    # Rule 5 - Already engaged
    interacted_ids = [i["content_id"] for i in user_content_interactions]
    if content_item["content_id"] in interacted_ids:
        return False
    # change this later when the masjid updates the age restriction for themselves unless we already have a attribute for this
    current_year = datetime.now().year
    user_age = current_year - user["birth_year"]
    KIDS_MAX = 13      # 0 - 13
    TEEN_MAX = 21      # 14 - 21
    ADULT_MIN = 22     # 22 and above
    children_ages = user["children_ages"] or []
    if content_item["is_kids"] and user_age > KIDS_MAX and (user["has_children"] == False or not any(age <= KIDS_MAX for age in children_ages)):
        return False
    if content_item["is_fourteen_plus"] and user_age <= KIDS_MAX:
        return False
    if content_item["is_fourteen_plus"] and user_age > 21 and (user["has_children"] == False or not any(KIDS_MAX < age <= TEEN_MAX for age in children_ages)):
        return False
    return True
    
def check_the_contents(user, content_items, user_content_interactions):
    filtered_content = []
    for content_item in content_items:
        if filter_content(user, content_item, user_content_interactions):
            filtered_content.append(content_item)
    return filtered_content

def calculate_freshness_score(event_timestamp) -> float:
    if isinstance(event_timestamp, str):
        event_timestamp = datetime.fromisoformat(event_timestamp.replace("Z", "+00:00"))
    if event_timestamp.tzinfo is None:
        event_timestamp = event_timestamp.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    age  = (now - event_timestamp).total_seconds()
    days_old = age / (24 * 60 * 60)
    if days_old < 1:
        return 1
    return 1 / days_old    
def score_content(user,content_item):
    INTEREST_WEIGHT = 10
    GOAL_WEIGHT = 8
    DAY_WEIGHT = 3
    TIME_WEIGHT = 2
    FRESHNESS_WEIGHT = 1
    breakdown = {"interests": 0, "goals": 0, "days": 0, "time": 0, "freshness": 0}
    day_matches = len(set(content_item["days"] or []) & set(user["preferred_days"] or []))
    breakdown["days"] = DAY_WEIGHT * day_matches
    if content_item["start_time"] in (user["preferred_times"] or []):
        breakdown["time"] = TIME_WEIGHT
    breakdown["freshness"] = FRESHNESS_WEIGHT * calculate_freshness_score(content_item["created_at"])
    content_interests_id = [i["interest_id"] for i in content_item["content_islamic_interests"]]
    for interest in user["user_islamic_interests"]:
        if interest["interest_id"] in content_interests_id:
            breakdown["interests"] += INTEREST_WEIGHT * interest["interest_level"]
    content_goals_id = [i["goal_id"] for i in content_item["content_islamic_goals"]]
    for goal in user["user_islamic_goals"]:
        if goal["goal_id"] in content_goals_id:
            breakdown["goals"] += GOAL_WEIGHT * goal["priority"]
    total = sum(breakdown.values())
    return total, breakdown

def recommend(supabase,user_id, mosque_id):
    user = fetch_user_data(supabase, user_id, mosque_id)
    if user is None:
        return []
    content_items = fetch_content_data(supabase, mosque_id)
    interactions = fetch_user_content_interactions(supabase, user_id, mosque_id)
    filtered = check_the_contents(user, content_items, interactions)
    scored = []
    for item in filtered:
        score, breakdown = score_content(user, item)
        scored.append((score, breakdown, item))
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored

def write_recommendation_log(supabase, user_id, mosque_id, scored):
    supabase.table("recommendation_log").delete().eq("user_id", user_id).eq("mosque_id", mosque_id).execute()
    if not scored:
        return 0
    rows = [
        {
            "user_id": user_id,
            "mosque_id": mosque_id,
            "content_id": item["content_id"],
            "recommendation_score": score,
            "score_breakdown": breakdown,
            "was_shown": False,
            "was_clicked": False,
            "was_added": False,
        }
        for score, breakdown, item in scored
    ]
    supabase.table("recommendation_log").insert(rows).execute()
    return len(rows)


if __name__ == "__main__":
    results = recommend(supabase, user_id, mosque_id)
    inserted = write_recommendation_log(supabase, user_id, mosque_id, results)
    for score, breakdown, item in results:
        print(f"{score:.2f} -> {item['name']}")
    print(f"\nWrote {inserted} rows to recommendation_log.")


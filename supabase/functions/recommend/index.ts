import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FRESHNESS_TTL_MS = 60 * 60 * 1000;

const KIDS_MAX = 13;
const TEEN_MAX = 21;

const INTEREST_WEIGHT = 10;
const GOAL_WEIGHT = 8;
const DAY_WEIGHT = 3;
const TIME_WEIGHT = 2;
const FRESHNESS_WEIGHT = 1;

type UserPrefs = {
  mosque_id: string;
  gender: string | null;
  birth_year: number;
  has_children: boolean | null;
  children_ages: number[] | null;
  preferred_days: string[] | null;
  preferred_times: string[] | null;
};

type UserInterest = { interest_id: string; interest_level: number };
type UserGoal = { goal_id: string; priority: number };

type ContentRow = {
  content_id: string;
  mosque_id: string;
  gender: string | null;
  end_date: string | null;
  max_capacity: number | null;
  current_count: number | null;
  is_kids: boolean | null;
  is_fourteen_plus: boolean | null;
  days: string[] | null;
  start_time: string | null;
  created_at: string;
  content_islamic_interests: { interest_id: string }[];
  content_islamic_goals: { goal_id: string }[];
};

type User = UserPrefs & {
  user_islamic_interests: UserInterest[];
  user_islamic_goals: UserGoal[];
};

type Breakdown = {
  interests: number;
  goals: number;
  days: number;
  time: number;
  freshness: number;
};

async function fetchUser(
  supabase: SupabaseClient,
  userId: string,
  mosqueId: string,
): Promise<User | null> {
  const { data: prefs, error } = await supabase
    .from("user_preferences")
    .select(
      "mosque_id, gender, birth_year, has_children, children_ages, preferred_days, preferred_times",
    )
    .eq("user_id", userId)
    .eq("mosque_id", mosqueId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!prefs) return null;

  const [{ data: interests }, { data: goals }] = await Promise.all([
    supabase
      .from("user_islamic_interests")
      .select("interest_id, interest_level")
      .eq("user_id", userId)
      .eq("mosque_id", mosqueId),
    supabase
      .from("user_islamic_goals")
      .select("goal_id, priority")
      .eq("user_id", userId)
      .eq("mosque_id", mosqueId),
  ]);

  return {
    ...(prefs as UserPrefs),
    user_islamic_interests: (interests as UserInterest[]) ?? [],
    user_islamic_goals: (goals as UserGoal[]) ?? [],
  };
}

async function fetchContent(
  supabase: SupabaseClient,
  mosqueId: string,
): Promise<ContentRow[]> {
  const { data, error } = await supabase
    .from("content_items")
    .select(
      "content_id, mosque_id, gender, end_date, max_capacity, current_count, is_kids, is_fourteen_plus, days, start_time, created_at, content_islamic_interests(interest_id), content_islamic_goals(goal_id)",
    )
    .eq("mosque_id", mosqueId);
  if (error) throw error;
  return (data ?? []) as ContentRow[];
}

async function fetchAddedContentIds(
  supabase: SupabaseClient,
  userId: string,
  mosqueId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("user_content_interactions")
    .select("content_id")
    .eq("user_id", userId)
    .eq("mosque_id", mosqueId)
    .eq("interaction_type", "add");
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.content_id as string));
}

function passesFilter(
  user: User,
  item: ContentRow,
  addedIds: Set<string>,
): boolean {
  if (user.mosque_id !== item.mosque_id) return false;
  if (item.gender && item.gender !== "All" && user.gender !== item.gender)
    return false;
  if (item.end_date && item.end_date < new Date().toISOString()) return false;
  if (
    item.max_capacity !== null &&
    (item.current_count ?? 0) >= item.max_capacity
  )
    return false;
  if (addedIds.has(item.content_id)) return false;

  const age = new Date().getFullYear() - user.birth_year;
  const childrenAges = user.children_ages ?? [];
  const hasChildrenInRange = (lo: number, hi: number) =>
    childrenAges.some((a) => a >= lo && a <= hi);
  
  if (item.is_kids && age > KIDS_MAX) {
    if (!user.has_children || !hasChildrenInRange(0, KIDS_MAX)) return false;
  }
  if (item.is_fourteen_plus && age <= KIDS_MAX) return false;
  if (item.is_fourteen_plus && age > TEEN_MAX) {
    if (!user.has_children || !hasChildrenInRange(KIDS_MAX + 1, TEEN_MAX))
      return false;
  }
  return true;
}

function freshnessScore(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const ageDays = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return ageDays < 1 ? 1 : 1 / ageDays;
}

function score(user: User, item: ContentRow): { total: number; breakdown: Breakdown } {
  const breakdown: Breakdown = {
    interests: 0,
    goals: 0,
    days: 0,
    time: 0,
    freshness: 0,
  };

  const userDays = new Set(user.preferred_days ?? []);
  const itemDays = item.days ?? [];
  const dayMatches = itemDays.reduce((n, d) => n + (userDays.has(d) ? 1 : 0), 0);
  breakdown.days = DAY_WEIGHT * dayMatches;

  if (item.start_time && (user.preferred_times ?? []).includes(item.start_time)) {
    breakdown.time = TIME_WEIGHT;
  }

  breakdown.freshness = FRESHNESS_WEIGHT * freshnessScore(item.created_at);

  const itemInterestIds = new Set(
    item.content_islamic_interests.map((r) => r.interest_id),
  );
  for (const i of user.user_islamic_interests) {
    if (itemInterestIds.has(i.interest_id)) {
      breakdown.interests += INTEREST_WEIGHT * i.interest_level;
    }
  }

  const itemGoalIds = new Set(item.content_islamic_goals.map((r) => r.goal_id));
  for (const g of user.user_islamic_goals) {
    if (itemGoalIds.has(g.goal_id)) {
      breakdown.goals += GOAL_WEIGHT * g.priority;
    }
  }

  const total =
    breakdown.interests +
    breakdown.goals +
    breakdown.days +
    breakdown.time +
    breakdown.freshness;
  return { total, breakdown };
}



async function recompute(
  supabase: SupabaseClient,
  userId: string,
  mosqueId: string,
) {
  const user = await fetchUser(supabase, userId, mosqueId);
  console.log("[recompute] user:", user ? "found" : "null", {
    userId,
    mosqueId,
  });
  if (!user) return 0;
  const [items, addedIds] = await Promise.all([
    fetchContent(supabase, mosqueId),
    fetchAddedContentIds(supabase, userId, mosqueId),
  ]);
  console.log("[recompute] items fetched:", items.length, "added:", addedIds.size);

  const filtered = items.filter((it) => {
    const ok = passesFilter(user, it, addedIds);
    if (!ok) console.log("[recompute] filtered out:", it.content_id, it);
    return ok;
  });
  console.log("[recompute] passed filter:", filtered.length);

  const rows = filtered.map((it) => {
    const { total, breakdown } = score(user, it);
    return {
      content_id: it.content_id,
      recommendation_score: total,
      score_breakdown: breakdown,
      was_shown: false,
      was_clicked: false,
      was_added: false,
    };
  });

  const {error} = await supabase.rpc('upsert_recommendations',{
    p_user_id: userId,
    p_mosque_id: mosqueId,
    p_rows: rows,
  });
  if (error) throw error;
  return rows.length;
}

async function readLog(
  supabase: SupabaseClient,
  userId: string,
  mosqueId: string,
) {
  const { data, error } = await supabase
    .from("recommendation_log")
    .select(
      "content_id, recommendation_score, score_breakdown, content_items!inner(name, description, image, type, start_date, start_time)",
    )
    .eq("user_id", userId)
    .eq("mosque_id", mosqueId)
    .order("recommendation_score", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function latestLogTimestamp(
  supabase: SupabaseClient,
  userId: string,
  mosqueId: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("recommendation_log")
    .select("created_at")
    .eq("user_id", userId)
    .eq("mosque_id", mosqueId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.created_at ? new Date(data.created_at).getTime() : null;
}

async function resolveMosqueId(
  supabase: SupabaseClient,
  body: { mosque_id?: string; mosque_slug?: string },
): Promise<string | null> {
  if (body.mosque_id) return body.mosque_id;
  if (!body.mosque_slug) return null;
  const { data, error } = await supabase
    .from("mosques")
    .select("id")
    .eq("slug", body.mosque_slug)
    .maybeSingle();
  if (error) throw error;
  return (data?.id as string) ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as {
      user_id?: string;
      mosque_id?: string;
      mosque_slug?: string;
      force?: boolean;
    };
    if (!body.user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const mosqueId = await resolveMosqueId(supabase, body);
    if (!mosqueId) {
      return new Response(
        JSON.stringify({ error: "mosque_id or valid mosque_slug required" }),
        {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    let recomputed = false;
    if (body.force) {
      await recompute(supabase, body.user_id, mosqueId);
      recomputed = true;
    } else {
      const latest = await latestLogTimestamp(supabase, body.user_id, mosqueId);
      if (latest === null || Date.now() - latest > FRESHNESS_TTL_MS) {
        await recompute(supabase, body.user_id, mosqueId);
        recomputed = true;
      }
    }

    const items = await readLog(supabase, body.user_id, mosqueId);
    return new Response(
      JSON.stringify({ recomputed, count: items.length, items }),
      {
        status: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

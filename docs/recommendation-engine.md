# Recommendation Engine

How "User X at Masjid Y sees Content Z recommended to them." This document covers the full lifecycle from user preference collection through scoring to display. For table schemas, see [Data Model](./data-model.md).

---

## Table of Contents

1. [High-Level Flow](#high-level-flow)
2. [Input Data](#input-data)
3. [Filter Rules](#filter-rules)
4. [Scoring Algorithm](#scoring-algorithm)
5. [Worked Example](#worked-example)
6. [Caching & Invalidation](#caching--invalidation)
7. [Client-Side Hook](#client-side-hook)
8. [Known Gaps & TODOs](#known-gaps--todos)
9. [Key Files](#key-files)

---

## High-Level Flow

```
User completes onboarding at Mosque Y
        │
        ▼
┌──────────────────────────────────────────────┐
│  Supabase tables populated:                  │
│    user_preferences      (demographics)      │
│    user_islamic_interests (interest levels)   │
│    user_islamic_goals     (goal priorities)   │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
App calls useRecommendation() hook
        │
        ▼
Hook invokes `recommend` Edge Function via POST
  body: { user_id, mosque_slug }
        │
        ▼
┌──────────────────────────────────────────────┐
│  TTL Check                                   │
│  Read latest recommendation_log.created_at   │
│  for this user + mosque                      │
│                                              │
│  If < 1 hour old AND force != true:          │
│    → skip recompute, read cached log         │
│  Otherwise:                                  │
│    → recompute                               │
└──────────────────┬───────────────────────────┘
                   │ (recompute path)
                   ▼
┌──────────────────────────────────────────────┐
│  1. Resolve mosque_slug → mosques.id         │
│  2. Fetch user_preferences + interests +     │
│     goals for this user+mosque               │
│  3. Fetch ALL content_items for this mosque   │
│     with joined interests + goals            │
│  4. Fetch user_content_interactions where     │
│     interaction_type = 'add' (already added) │
│  5. Filter content (7 rules)                 │
│  6. Score each passing item (5 dimensions)   │
│  7. DELETE old recommendation_log rows       │
│  8. INSERT new scored rows                   │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  Read Log                                    │
│  SELECT from recommendation_log              │
│  JOIN content_items for display fields       │
│  ORDER BY recommendation_score DESC          │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
Response: { recomputed: bool, count: N, items: [...] }
        │
        ▼
Hook flattens nested content_items into
  RecommendationItem[] and returns to UI
```

---

## Input Data

The recommendation engine reads from these tables (see [Data Model](./data-model.md) for full schemas):

| Table | What it provides | Scope |
|---|---|---|
| `user_preferences` | Gender, birth_year, has_children, children_ages, preferred_days, preferred_times | Per user per mosque |
| `user_islamic_interests` | Interest IDs + interest_level (0-5) | Per user per mosque |
| `user_islamic_goals` | Goal IDs + priority (0-5) | Per user per mosque |
| `content_items` | All content for the mosque with type, gender, days, start_time, capacity, age flags | Per mosque |
| `content_islamic_interests` | Which interests each content item is tagged with | Per content item |
| `content_islamic_goals` | Which goals each content item is tagged with | Per content item |
| `user_content_interactions` | Which content the user has already "added" | Per user per mosque |

**Early exit:** If the user has no `user_preferences` row for this mosque, the engine returns 0 recommendations immediately.

---

## Filter Rules

Content items must pass all 7 rules (evaluated in order in `passesFilter()`). Any failure removes the item.

### 1. Mosque Match

```
user.mosque_id !== item.mosque_id → REJECT
```

Redundant safety check — both are already fetched by mosque_id.

### 2. Gender

```
item.gender is set AND item.gender !== "All" AND user.gender !== item.gender → REJECT
```

Content with `gender = "All"` or `null` passes everyone.

### 3. Expired

```
item.end_date < now() → REJECT
```

Only checked if `end_date` is set. Content without an end date never expires.

### 4. At Capacity

```
item.current_count >= item.max_capacity → REJECT
```

Only checked if `max_capacity` is set.

### 5. Already Added

```
item.content_id in user_content_interactions (where type = 'add') → REJECT
```

Only the `"add"` interaction type is checked. Clicks and saves do not filter out content.

### 6. Age-Appropriate (Kids)

```
item.is_kids = true:
  If user age > 13:
    Only show if user has_children AND at least one child aged 0-13
    Otherwise → REJECT
```

Kids content (ages 0-13) is shown to kids directly, or to parents of young children.

### 7. Age-Appropriate (14+)

```
item.is_fourteen_plus = true:
  If user age <= 13 → REJECT (too young)
  If user age > 21:
    Only show if user has_children AND at least one child aged 14-21
    Otherwise → REJECT
```

Youth content (ages 14-21) is shown to teens directly, or to parents of teens.

**Age calculation:** `current_year - user.birth_year`

---

## Scoring Algorithm

Each content item that passes filtering is scored across 5 dimensions. The total score is the sum of all dimensions.

### Weights

| Dimension | Weight | Calculation | Notes |
|---|---|---|---|
| **Interests** | 10 | For each user interest matching a content interest: `10 * interest_level` | Multiple matches compound |
| **Goals** | 8 | For each user goal matching a content goal: `8 * priority` | Multiple matches compound |
| **Days** | 3 | Count of matching days between `user.preferred_days` and `content.days`, times 3 | Max 7 days = 21 |
| **Time** | 2 | If `content.start_time` is in `user.preferred_times`: 2, else 0 | Binary match |
| **Freshness** | 1 | `1 / age_in_days` (capped at 1.0 for content < 1 day old) | Newer content scores higher |

### Formula

```
total = interests + goals + days + time + freshness

where:
  interests = SUM(INTEREST_WEIGHT * interest_level)   for each matching interest
  goals     = SUM(GOAL_WEIGHT * priority)             for each matching goal
  days      = DAY_WEIGHT * count_of_matching_days
  time      = TIME_WEIGHT if start_time matches, else 0
  freshness = FRESHNESS_WEIGHT * (ageDays < 1 ? 1 : 1/ageDays)
```

### Score Breakdown

The engine stores the per-dimension breakdown in `recommendation_log.score_breakdown` as JSON:

```json
{
  "interests": 40,
  "goals": 16,
  "days": 6,
  "time": 2,
  "freshness": 0.5
}
```

---

## Worked Example

**User profile:**
- Interest: "Fiqh" with `interest_level = 4`
- Interest: "Tafsir" with `interest_level = 3`
- Goal: "Learn Arabic" with `priority = 2`
- Preferred days: `["Monday", "Wednesday"]`
- Preferred times: `["19:00"]`

**Content item:** "Fiqh Foundations" class
- Tagged interests: "Fiqh"
- Tagged goals: "Learn Arabic"
- Days: `["Monday", "Thursday"]`
- Start time: `"19:00"`
- Created 3 days ago

**Score calculation:**

```
interests = 10 * 4                              = 40  (Fiqh matches)
            (Tafsir not tagged on content → 0)
goals     = 8 * 2                               = 16  (Learn Arabic matches)
days      = 3 * 1                               = 3   (Monday matches, Thursday does not)
time      = 2                                   = 2   (19:00 matches)
freshness = 1 * (1 / 3)                         = 0.33

total = 40 + 16 + 3 + 2 + 0.33                  = 61.33
```

---

## Caching & Invalidation

| Setting | Value |
|---|---|
| **TTL** | 1 hour (`FRESHNESS_TTL_MS = 60 * 60 * 1000`) |
| **Cache location** | `recommendation_log` table in Supabase |
| **Cache key** | `(user_id, mosque_id)` — all rows for that combo |
| **Recompute trigger** | TTL expired OR `force: true` in request body |
| **Invalidation method** | DELETE all existing rows for user+mosque, then INSERT new scored rows |

### How caching works

1. On each request, the edge function checks the `created_at` of the latest `recommendation_log` row for this user+mosque.
2. If the latest row is **less than 1 hour old** and `force` is not `true`, the function skips recomputation and reads the cached log directly.
3. If stale or forced, all existing rows for that user+mosque are deleted and fresh scores are inserted.
4. The response always reads from the log table (whether freshly computed or cached).

---

## Client-Side Hook

`useRecommendation()` at `src/hooks/use-Recommendation.ts`:

```
useQuery({
  queryKey: ['recommendations', userId, config.id],
  queryFn: async () => {
    invoke('recommend', { user_id, mosque_slug })
    → flatten response items
    → filter out null content_items (deleted content)
    → return RecommendationItem[]
  },
  enabled: isLoaded && !!userId,
})
```

**Behavior:**
- React Query with key `['recommendations', userId, config.id]`
- Invokes the edge function via `supabase.functions.invoke()`
- Flattens the nested `content_items` join into a flat `RecommendationItem` shape
- Filters out rows where the content join returned null (content was deleted after recommendation was cached)
- No pagination — returns all scored items
- No refetch interval — only refetches on component mount or manual `refetch()` call
- Returns: `{ recommendations, status, error, refetch }`

### `RecommendationItem` type

```typescript
{
  content_id: string;
  recommendation_score: number;
  score_breakdown: Record<string, number> | null;
  name: string | null;
  description: string | null;
  image: string | null;
  type: string | null;
  start_date: string | null;
  start_time: string | null;
}
```

---

## Known Gaps & TODOs

1. **Tracking booleans unused** — `was_shown`, `was_clicked`, `was_added` on `recommendation_log` are always set to `false` on insert. No code path updates them to `true`.
2. **No feedback loop** — User interactions after viewing recommendations (clicks, adds, dismissals) are not fed back to adjust future scores.
3. **No A/B testing** — No infrastructure for testing different weight configurations.
4. **Service-role key** — The edge function creates its own Supabase client with `SUPABASE_SERVICE_ROLE_KEY`, bypassing all RLS policies.
5. **No rate limiting** — The edge function has no request rate limiting.
6. **No preference mutation hooks** — `user_preferences`, `user_islamic_interests`, and `user_islamic_goals` tables are expected to be populated during onboarding, but there are currently no app-side hooks to write to these tables.
7. **No pagination** — All recommendations are returned in a single response. For mosques with large content libraries, this could become a performance concern.
8. **Delete-and-replace** — Recomputation deletes all cached rows before inserting new ones. A concurrent read during recomputation could return 0 results.

---

## Key Files

| File | Purpose |
|---|---|
| `supabase/functions/recommend/index.ts` | Complete edge function — filtering, scoring, caching |
| `src/hooks/use-Recommendation.ts` | Client-side React Query hook |
| `src/hooks/use-content-items.ts` | Direct content fetch hook (non-personalized) |
| `supabase/migrations/20260419000000_baseline_schema.sql` | Table definitions for all recommendation-related tables |

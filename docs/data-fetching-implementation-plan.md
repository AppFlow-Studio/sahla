# Data Fetching & Sync Implementation Plan

How to replace all mocked data with real Supabase queries and wire every feature to dynamic, mosque-scoped content. This document is an actionable roadmap — each section maps a feature to the tables, hooks, RLS policies, and edge functions needed to make it live.

For table schemas, see [Data Model](./data-model.md). For auth/config flow, see [Profile & Masjid Data Flow](./profile-and-masjid-data-flow.md).

---

## Table of Contents

1. [Current State: Real vs Mocked](#current-state-real-vs-mocked)
2. [Foundation: Profile Auto-Creation & RLS](#foundation-profile-auto-creation--rls)
3. [Prayer Times](#prayer-times)
4. [Today's Events](#todays-events)
5. [Featured Content](#featured-content)
6. [Programs](#programs)
7. [Jummah Schedule](#jummah-schedule)
8. [Watch / Reels](#watch--reels)
9. [Community Partners](#community-partners)
10. [Remembrances (Athkar)](#remembrances-athkar)
11. [User Preferences & Onboarding Writes](#user-preferences--onboarding-writes)
12. [Save / Bookmark Actions](#save--bookmark-actions)
13. [Quran Progress Cloud Sync](#quran-progress-cloud-sync)
14. [Profile Mutations](#profile-mutations)
15. [RLS Policy Rollout](#rls-policy-rollout)
16. [Hook & Query Conventions](#hook--query-conventions)
17. [Implementation Order](#implementation-order)

---

## Current State: Real vs Mocked

| Feature | Status | Current Source | Target Source |
|---|---|---|---|
| Mosque config (name, colors, features) | Real | `mosques` table + bundled defaults | No change needed |
| Content items (Discover) | Real | `content_items` via `useContentItems()` | No change needed |
| Recommendations | Real | `recommend` Edge Function via `useRecommendation()` | No change needed |
| User profile (read) | Real | `profiles` via `useProfile()` | No change needed |
| Onboarding state | Real | MMKV + Clerk metadata via `useOnboardingSync()` | No change needed |
| **Prayer times** | **Mocked** | `MOCK_PRAYER_TIMES` in `mock-home.ts` | `prayers` / `todays_prayers` table |
| **Today's events** | **Mocked** | `MOCK_EVENTS` in `mock-home.ts` | `content_items` filtered by today's date |
| **Featured content** | **Mocked** | `MOCK_FEATURED` in `mock-home.ts` | `content_items` with `is_featured` flag or admin selection |
| **Programs (Home)** | **Mocked** | `MOCK_PROGRAMS` in `mock-home.ts` | `content_items` filtered by type |
| **Jummah schedule** | **Mocked** | `MOCK_JUMMAH_SCHEDULE` in `mock-home.ts` | `jummah` table |
| **Watch/Reels** | **Mocked** | Hardcoded `REELS` array in `watch.tsx` | New `reels` or `clips` table |
| **Community partners** | **Mocked** | `MOCK_COMMUNITY_PARTNER` in `mock-home.ts` | New `community_partners` table |
| **Remembrances** | **Mocked** | Hardcoded UI strings | New `athkar` table or bundled JSON |
| **Profile creation** | **Missing** | No write path exists | Clerk webhook or post-signup mutation |
| **Profile updates** | **Missing** | No mutation hooks | New `useUpdateProfile()` hook |
| **User preferences write** | **Missing** | No mutation hooks | New hooks for onboarding data |
| **Save/bookmark persist** | **Missing** | UI-only (no persistence) | `saved_content` table mutations |
| **Quran cloud sync** | **Local only** | MMKV via `quran-tracker.ts` | `user_continue_read` table |

---

## Foundation: Profile Auto-Creation & RLS

Before wiring up feature-specific data, two foundational pieces must be in place.

### 1. Auto-Create `profiles` Row on Signup

**Problem:** After Clerk signup, `useProfile()` returns `null` because no code creates the Supabase row.

**Solution: Clerk Webhook → Supabase Edge Function**

Create a new edge function `create-profile` triggered by Clerk's `user.created` webhook:

```
Clerk user.created webhook
  → POST supabase.co/functions/v1/create-profile
  → Edge function:
      INSERT INTO profiles (id, first_name, last_name, profile_email, created_at)
      VALUES (clerk_user.id, clerk_user.first_name, clerk_user.last_name, clerk_user.email, now())
      ON CONFLICT (id) DO NOTHING
```

**Files to create:**
- `supabase/functions/create-profile/index.ts` — Edge function
- Clerk dashboard: Configure `user.created` webhook pointing to this function

**Alternative (no webhook):** Call an upsert mutation from the app after first successful sign-in. Simpler but requires the client to handle the write.

### 2. RLS Policies for Regular Users

**Problem:** Most tables only have `sahla_team` policies. Regular app users can't read their own data through authenticated queries.

**Solution:** Add per-user and per-org SELECT/INSERT/UPDATE policies. See [RLS Policy Rollout](#rls-policy-rollout) section below for the full migration.

---

## Prayer Times

### DB Tables

The schema already has two relevant tables:

- **`prayers`** — The mosque's configured prayer schedule (static times set by admin)
- **`todays_prayers`** — Today's computed prayer times (if using dynamic calculation)

### New Hook: `usePrayerTimes()`

```
File: src/hooks/use-prayer-times.ts

Hook: usePrayerTimes()
  queryKey: ['prayer-times', mosqueUuid, todayDateString]
  queryFn:
    SELECT prayer_name, athan_time, iqamah_time
    FROM prayers
    WHERE mosque_id = mosqueUuid
    ORDER BY athan_time ASC
  Returns: PrayerTime[] with status (passed / next / upcoming)
```

**Status calculation (client-side):**
- Compare each prayer's `athan_time` against `new Date()` in the mosque's timezone (from `config.timezone`)
- Mark prayers before now as `passed`
- Mark the first prayer after now as `next`
- Mark the rest as `upcoming`

**Countdown:**
- Derive "time until next iqamah" from the `next` prayer's `iqamah_time` minus current time
- Run a `setInterval` on the client to tick the countdown display

### Home Screen Integration

Replace `MOCK_PRAYER_TIMES`, `MOCK_NEXT_PRAYER`, and `MOCK_CURRENT_TIME` in `HomeHeader` and `PrayerTimesBar` with `usePrayerTimes()`.

### Prayer Screen Integration

Replace the hardcoded `PRAYERS` array in `app/(main)/prayer.tsx` (used for both the countdown ring and the prayer table) with the same `usePrayerTimes()` hook.

### Hijri Date

Replace hardcoded `"Ramadan 13, 1447"` with a client-side calculation using `Intl.DateTimeFormat` with `calendar: 'islamic-umalqura'`, or a lightweight library. No DB table needed.

**Key files to modify:**
- `src/hooks/use-prayer-times.ts` (new)
- `app/(main)/prayer.tsx`
- `src/components/home/home-header.tsx`
- `src/data/mock-home.ts` (remove prayer mocks)

---

## Today's Events

### Approach

No new table needed — reuse `content_items` with a date filter.

### New Hook: `useTodaysEvents()`

```
File: src/hooks/use-todays-events.ts

Hook: useTodaysEvents()
  queryKey: ['todays-events', mosqueUuid, todayDateString]
  queryFn:
    SELECT content_id, name, type, start_time, days, image
    FROM content_items
    WHERE mosque_id = mosqueUuid
      AND (
        -- recurring events: today's day name is in the days[] array
        (days && ARRAY[todayDayName])
        -- OR date-range events: today falls within start_date..end_date
        OR (start_date <= today AND (end_date IS NULL OR end_date >= today))
      )
    ORDER BY start_time ASC
  Returns: TodaysEvent[]
```

**Key files to modify:**
- `src/hooks/use-todays-events.ts` (new)
- `src/components/home/todays-events.tsx`
- `src/data/mock-home.ts` (remove `MOCK_EVENTS`)

---

## Featured Content

### Approach: Add `is_featured` Column

Add a boolean `is_featured` column to `content_items` (default `false`). Mosque admins flag one or more items as featured.

### Migration

```sql
ALTER TABLE content_items ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
```

### New Hook: `useFeaturedContent()`

```
File: src/hooks/use-featured-content.ts

Hook: useFeaturedContent()
  queryKey: ['featured', mosqueUuid]
  queryFn:
    SELECT content_id, name, description, image, type, start_time
    FROM content_items
    WHERE mosque_id = mosqueUuid AND is_featured = true
    ORDER BY created_at DESC
    LIMIT 3
  Returns: FeaturedItem[]
```

**Key files to modify:**
- `supabase/migrations/` — new migration for `is_featured` column
- `src/hooks/use-featured-content.ts` (new)
- `src/components/home/featured-card.tsx`
- `src/data/mock-home.ts` (remove `MOCK_FEATURED`)

---

## Programs

### Approach

Programs are already in `content_items` with a `type` field. Filter by type and group by category.

### New Hook: `usePrograms()`

```
File: src/hooks/use-programs.ts

Hook: usePrograms()
  queryKey: ['programs', mosqueUuid]
  queryFn:
    SELECT content_id, name, description, image, type, start_time,
           start_date, days, is_kids, is_fourteen_plus, speakers
    FROM content_items
    WHERE mosque_id = mosqueUuid
      AND type IN ('class', 'program')
      AND (end_date IS NULL OR end_date >= now())
    ORDER BY start_date ASC
  Returns: ProgramItem[]
```

**Category grouping (client-side):**
- `is_kids = true` → Kids Programs
- `is_fourteen_plus = true` → Youth Programs
- Neither → Adults Programs

**Key files to modify:**
- `src/hooks/use-programs.ts` (new)
- `src/components/home/programs-section.tsx`
- Discover screen program categories
- `src/data/mock-home.ts` (remove `MOCK_PROGRAMS`)

---

## Jummah Schedule

### DB Table

The schema already has a `jummah` table:

```
jummah
  id, mosque_id, speaker (uuid FK → speaker_data),
  topic, prayer_time, capacity_status, created_at
```

### New Hook: `useJummahSchedule()`

```
File: src/hooks/use-jummah-schedule.ts

Hook: useJummahSchedule()
  queryKey: ['jummah', mosqueUuid]
  queryFn:
    SELECT j.id, j.topic, j.prayer_time, j.capacity_status,
           s.speaker_name, s.speaker_creds, s.speaker_pic
    FROM jummah j
    LEFT JOIN speaker_data s ON s.speaker_id = j.speaker
    WHERE j.mosque_id = mosqueUuid
    ORDER BY j.prayer_time ASC
  Returns: JummahSlot[]
```

**Visibility logic:** Only show the Jummah card when:
- `config.features.jumaahRegistration` is enabled (already checked in Home)
- It's the current week's Friday (or configurable day range)

**Key files to modify:**
- `src/hooks/use-jummah-schedule.ts` (new)
- `src/components/home/jummah-schedule-card.tsx`
- `src/data/mock-home.ts` (remove `MOCK_JUMMAH_SCHEDULE`)

---

## Watch / Reels

### Approach: New Table

The current schema has no `reels` or `clips` table. We need one.

### Migration: Create `reels` Table

```sql
CREATE TABLE reels (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reel_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  mosque_id text NOT NULL REFERENCES mosques(id),
  creator_id text REFERENCES profiles(id),
  -- content
  arabic_text text,
  translation_text text,
  urdu_text text,
  source text,            -- e.g. "Sahih Bukhari, Hadith 1234"
  title text,
  -- media
  video_url text,         -- for future video reels
  background_image text,
  -- metadata
  like_count integer NOT NULL DEFAULT 0,
  share_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reels_mosque ON reels(mosque_id);

ALTER TABLE reels ENABLE ROW LEVEL SECURITY;
```

### Interaction Table: `reel_interactions`

```sql
CREATE TABLE reel_interactions (
  user_id text NOT NULL REFERENCES profiles(id),
  reel_id uuid NOT NULL REFERENCES reels(reel_id),
  interaction_type text NOT NULL,  -- 'like', 'save', 'share', 'not_interested'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reel_id, interaction_type)
);

ALTER TABLE reel_interactions ENABLE ROW LEVEL SECURITY;
```

### New Hook: `useReels()`

```
File: src/hooks/use-reels.ts

Hook: useReels(cursor?)
  queryKey: ['reels', mosqueUuid, cursor]
  queryFn:
    SELECT r.reel_id, r.arabic_text, r.translation_text, r.urdu_text,
           r.source, r.title, r.like_count, r.background_image,
           p.first_name as creator_name, p.profile_pic as creator_avatar
    FROM reels r
    LEFT JOIN profiles p ON p.id = r.creator_id
    WHERE r.mosque_id = mosqueUuid AND r.is_active = true
    ORDER BY r.created_at DESC
    LIMIT 10 OFFSET cursor
  Returns: { reels: Reel[], nextCursor }
```

### New Hook: `useReelInteraction()`

```
File: src/hooks/use-reel-interaction.ts

Mutations:
  toggleLike(reelId)   → INSERT/DELETE reel_interactions + increment/decrement like_count
  toggleSave(reelId)   → INSERT/DELETE reel_interactions
  markNotInterested(reelId) → INSERT reel_interactions
```

**Key files to modify:**
- `supabase/migrations/` — new migration for `reels` + `reel_interactions`
- `src/hooks/use-reels.ts` (new)
- `src/hooks/use-reel-interaction.ts` (new)
- `app/(main)/watch.tsx` — replace hardcoded `REELS` array

---

## Community Partners

### Approach: New Table

No `community_partners` table exists in the schema.

### Migration

```sql
CREATE TABLE community_partners (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text NOT NULL REFERENCES mosques(id),
  name text NOT NULL,
  description text,
  address text,
  phone text,
  email text,
  website text,
  image_url text,
  category text,          -- 'restaurant', 'store', 'service', etc.
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_partners_mosque ON community_partners(mosque_id);

ALTER TABLE community_partners ENABLE ROW LEVEL SECURITY;
```

### New Hook: `useCommunityPartners()`

```
File: src/hooks/use-community-partners.ts

Hook: useCommunityPartners()
  queryKey: ['community-partners', mosqueUuid]
  queryFn:
    SELECT id, name, description, address, phone, email, website, image_url, category
    FROM community_partners
    WHERE mosque_id = mosqueUuid AND is_active = true
    ORDER BY name ASC
  Returns: CommunityPartner[]
```

**Key files to modify:**
- `supabase/migrations/` — new migration
- `src/hooks/use-community-partners.ts` (new)
- `src/components/home/community-partners.tsx`
- `app/(main)/prayer.tsx` (also shows community partners)
- `src/data/mock-home.ts` (remove `MOCK_COMMUNITY_PARTNER`)

---

## Remembrances (Athkar)

### Approach: Bundled JSON + Optional DB Table

Athkar content is largely static (standard morning/evening supplications). Two options:

**Option A — Bundled JSON (recommended for v1):**
- Ship a JSON file in app assets with morning/evening athkar
- No network dependency, works offline
- Update via app releases

**Option B — DB table (for mosque-customized athkar):**
```sql
CREATE TABLE athkar (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id text REFERENCES mosques(id),  -- NULL = global
  category text NOT NULL,                 -- 'morning', 'evening', 'after_salah'
  arabic_text text NOT NULL,
  transliteration text,
  translation text,
  repetitions integer DEFAULT 1,
  source text,
  display_order integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Recommendation:** Start with Option A (bundled JSON), add Option B later if mosques want to customize.

**Key files to create:**
- `src/data/athkar.json` (new, bundled data)
- `src/hooks/use-athkar.ts` (new, reads from JSON or DB)

---

## User Preferences & Onboarding Writes

### Problem

The onboarding flow captures user name but doesn't write demographics, interests, or goals to Supabase. The recommendation engine depends on these tables being populated.

### New Hooks

**`useUpsertPreferences()`**
```
Mutation: upsert into user_preferences
  (user_id, mosque_id, gender, birth_year, has_children, children_ages,
   preferred_days, preferred_times)
ON CONFLICT (user_id, mosque_id) DO UPDATE
```

**`useUpsertInterests()`**
```
Mutation: batch upsert into user_islamic_interests
  For each selected interest:
    INSERT (user_id, interest_id, mosque_id, interest_level)
    ON CONFLICT (user_id, interest_id, mosque_id) DO UPDATE
```

**`useUpsertGoals()`**
```
Mutation: batch upsert into user_islamic_goals
  For each selected goal:
    INSERT (user_id, goal_id, mosque_id, priority)
    ON CONFLICT (user_id, goal_id, mosque_id) DO UPDATE
```

### Integration Point

These mutations should be called during onboarding (after the user selects preferences) and from a future "Edit Preferences" screen in the Profile tab.

**Key files to create:**
- `src/hooks/use-upsert-preferences.ts` (new)
- `src/hooks/use-upsert-interests.ts` (new)
- `src/hooks/use-upsert-goals.ts` (new)

**Key files to modify:**
- Onboarding screens (when preference selection UI is added)
- Profile settings (future)

---

## Save / Bookmark Actions

### Problem

The heart/save button on content detail and reels is UI-only — tapping it doesn't persist anything.

### Existing Table

`saved_content` already exists with `(user_id, content_id)` composite PK.

### New Hook: `useSavedContent()`

```
File: src/hooks/use-saved-content.ts

Query: useSavedContent()
  queryKey: ['saved-content', userId]
  queryFn:
    SELECT content_id FROM saved_content WHERE user_id = userId
  Returns: Set<string> of saved content IDs

Mutation: toggleSave(contentId)
  If saved → DELETE FROM saved_content WHERE user_id = X AND content_id = Y
  If not saved → INSERT INTO saved_content (user_id, content_id) VALUES (X, Y)
  Optimistic update via React Query cache
```

**Key files to modify:**
- `src/hooks/use-saved-content.ts` (new)
- `app/content/[id].tsx` — wire save button
- `app/(main)/watch.tsx` — wire reel bookmark

---

## Quran Progress Cloud Sync

### Problem

Quran reading progress is stored in MMKV only. Switching devices loses progress.

### Existing Tables

- `user_continue_read` — `(user_id, mosque_id)` with last read position
- `ramadan_quran_tracker` — per-surah progress

### New Hook: `useQuranSync()`

```
File: src/hooks/use-quran-sync.ts

Sync strategy: local-first with periodic push
  1. On app boot: pull cloud state → merge with local MMKV (latest wins)
  2. On page turn / surah complete: write to MMKV immediately (fast)
  3. On app background / periodic interval: push MMKV state to Supabase

Mutations:
  syncReadingPosition(surahNumber, ayahNumber, page)
    → UPSERT user_continue_read
  syncGoalProgress(daily, monthly, yearly pages)
    → UPSERT into appropriate tracking table
```

**Key files to modify:**
- `src/hooks/use-quran-sync.ts` (new)
- `src/lib/quran-tracker.ts` — add cloud sync calls alongside MMKV writes

---

## Profile Mutations

### New Hook: `useUpdateProfile()`

```
File: src/hooks/use-update-profile.ts

Mutation: updateProfile(fields)
  UPDATE profiles
  SET first_name = X, last_name = Y, phone_number = Z, profile_pic = W
  WHERE id = userId

  On success: invalidate queryKey ['profile', userId]
```

### Profile Photo Upload

```
1. Upload image to Supabase Storage bucket 'profile-pics'
2. Get public URL
3. Update profiles.profile_pic with URL
```

**Key files to create:**
- `src/hooks/use-update-profile.ts` (new)

**Key files to modify:**
- Profile edit screen (future)
- `components/profile/ProfileHeader.tsx`

---

## RLS Policy Rollout

All new and existing tables need proper RLS policies for regular app users. Here's the migration:

### Pattern

Every user-facing table needs at minimum:

```sql
-- Users can read their mosque's data
CREATE POLICY "org_members_select" ON table_name
  FOR SELECT USING (mosque_id = requesting_mosque_id());

-- Users can manage their own rows
CREATE POLICY "own_rows_insert" ON table_name
  FOR INSERT WITH CHECK (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

CREATE POLICY "own_rows_update" ON table_name
  FOR UPDATE USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());

CREATE POLICY "own_rows_delete" ON table_name
  FOR DELETE USING (user_id = requesting_user_id() AND mosque_id = requesting_mosque_id());
```

### Tables Needing User SELECT Policies

| Table | Policy | Filter |
|---|---|---|
| `content_items` | Org members can read | `mosque_id = requesting_mosque_id()` |
| `prayers` | Org members can read | `mosque_id = requesting_mosque_id()` |
| `jummah` | Org members can read | `mosque_id = requesting_mosque_id()` |
| `speaker_data` | Org members can read | `mosque_id = requesting_mosque_id()` |
| `community_partners` | Org members can read | `mosque_id = requesting_mosque_id()` |
| `reels` | Org members can read | `mosque_id = requesting_mosque_id()` |
| `islamic_interest_categories` | All authenticated can read | `true` (global lookup) |
| `islamic_goals` | All authenticated can read | `true` (global lookup) |
| `profiles` | User can read own row | `id = requesting_user_id()` |

### Tables Needing User INSERT/UPDATE Policies

| Table | Policy | Filter |
|---|---|---|
| `profiles` | Own row only | `id = requesting_user_id()` |
| `user_preferences` | Own rows at own mosque | `user_id + mosque_id` match |
| `user_islamic_interests` | Own rows at own mosque | `user_id + mosque_id` match |
| `user_islamic_goals` | Own rows at own mosque | `user_id + mosque_id` match |
| `saved_content` | Own rows | `user_id = requesting_user_id()` |
| `user_content_interactions` | Own rows at own mosque | `user_id + mosque_id` match |
| `reel_interactions` | Own rows | `user_id = requesting_user_id()` |
| `user_continue_read` | Own rows at own mosque | `user_id + mosque_id` match |

**File to create:**
- `supabase/migrations/YYYYMMDD_user_rls_policies.sql`

---

## Hook & Query Conventions

All new hooks should follow the established patterns:

### Read Hooks

```typescript
// Pattern from use-content-items.ts
export function useXxx() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const query = useQuery({
    queryKey: ['xxx', mosqueUuid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table')
        .select('columns')
        .eq('mosque_id', mosqueUuid!);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!mosqueUuid,
  });

  return {
    items: query.data ?? [],
    status: !mosqueUuid ? 'idle' : query.isPending ? 'loading' : query.isError ? 'error' : 'success',
    error: query.error?.message ?? null,
  };
}
```

### Mutation Hooks

```typescript
export function useToggleSave() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (contentId: string) => { /* INSERT or DELETE */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-content', userId] });
    },
  });
}
```

### Query Key Hierarchy

```
['prayer-times',       mosqueUuid, dateString]
['todays-events',      mosqueUuid, dateString]
['featured',           mosqueUuid]
['programs',           mosqueUuid]
['jummah',             mosqueUuid]
['reels',              mosqueUuid, cursor]
['community-partners', mosqueUuid]
['saved-content',      userId]
['profile',            userId]           // already exists
['content-items',      mosqueUuid]       // already exists
['recommendations',    userId, configId] // already exists
```

---

## Implementation Order

Work in priority tiers. Each tier builds on the previous.

### Tier 0: Foundation (do first, everything depends on this)

| # | Task | Type | Effort |
|---|---|---|---|
| 0.1 | RLS policies for all user-facing tables | Migration | Medium |
| 0.2 | Auto-create `profiles` row (webhook or post-auth upsert) | Edge function | Small |

### Tier 1: Core Data (highest user-facing impact)

| # | Task | Type | Depends On |
|---|---|---|---|
| 1.1 | `usePrayerTimes()` hook + replace mocks on Home & Prayer screens | Hook + Screen | 0.1 |
| 1.2 | `useTodaysEvents()` hook + replace mocks on Home | Hook + Screen | 0.1 |
| 1.3 | `useJummahSchedule()` hook + replace mocks on Home | Hook + Screen | 0.1 |
| 1.4 | `usePrograms()` hook + replace mocks on Home & Discover | Hook + Screen | 0.1 |
| 1.5 | `useFeaturedContent()` hook + add `is_featured` column | Migration + Hook | 0.1 |

### Tier 2: Engagement Features

| # | Task | Type | Depends On |
|---|---|---|---|
| 2.1 | `useSavedContent()` hook + wire save buttons | Hook + Screen | 0.1, 0.2 |
| 2.2 | `useReels()` + `useReelInteraction()` + `reels` table | Migration + Hooks + Screen | 0.1, 0.2 |
| 2.3 | `useCommunityPartners()` hook + `community_partners` table | Migration + Hook + Screen | 0.1 |

### Tier 3: Personalization Pipeline

| # | Task | Type | Depends On |
|---|---|---|---|
| 3.1 | Preference mutation hooks (`useUpsertPreferences`, `useUpsertInterests`, `useUpsertGoals`) | Hooks | 0.1, 0.2 |
| 3.2 | Onboarding preference collection screens (UI) | Screens | 3.1 |
| 3.3 | Recommendation engine becomes functional end-to-end | Integration | 3.2 |

### Tier 4: Sync & Polish

| # | Task | Type | Depends On |
|---|---|---|---|
| 4.1 | `useUpdateProfile()` hook + profile edit screen | Hook + Screen | 0.2 |
| 4.2 | Quran progress cloud sync | Hook | 0.1, 0.2 |
| 4.3 | Athkar bundled JSON or DB table | Data + Hook | — |
| 4.4 | Hijri date calculation (client-side) | Utility | — |

### Cleanup

After all tiers are complete:
- Delete `src/data/mock-home.ts` entirely
- Remove all hardcoded `REELS` data from `watch.tsx`
- Remove hardcoded `PRAYERS` data from `prayer.tsx`

---

## Key Files Reference

### Existing (to modify)

| File | Changes |
|---|---|
| `app/(main)/index.tsx` | Replace all mock data imports with hooks |
| `app/(main)/prayer.tsx` | Replace hardcoded prayers with `usePrayerTimes()` |
| `app/(main)/watch.tsx` | Replace `REELS` with `useReels()` |
| `app/(main)/discover.tsx` | Add program category filtering via `usePrograms()` |
| `app/content/[id].tsx` | Wire save button with `useSavedContent()` |
| `src/components/home/*.tsx` | Update all home components to accept hook data |
| `components/profile/ProfileHeader.tsx` | Wire profile mutations |
| `src/data/mock-home.ts` | Delete after migration complete |

### New (to create)

| File | Purpose |
|---|---|
| `src/hooks/use-prayer-times.ts` | Prayer times query + status calculation |
| `src/hooks/use-todays-events.ts` | Today's events from content_items |
| `src/hooks/use-featured-content.ts` | Featured content query |
| `src/hooks/use-programs.ts` | Programs by type/category |
| `src/hooks/use-jummah-schedule.ts` | Jummah slots with speaker join |
| `src/hooks/use-reels.ts` | Paginated reel feed |
| `src/hooks/use-reel-interaction.ts` | Like/save/report mutations |
| `src/hooks/use-community-partners.ts` | Partner listings |
| `src/hooks/use-saved-content.ts` | Save/bookmark toggle |
| `src/hooks/use-update-profile.ts` | Profile mutations |
| `src/hooks/use-upsert-preferences.ts` | User preferences mutations |
| `src/hooks/use-upsert-interests.ts` | Interest selection mutations |
| `src/hooks/use-upsert-goals.ts` | Goal selection mutations |
| `src/hooks/use-quran-sync.ts` | Cloud sync for reading progress |
| `src/hooks/use-athkar.ts` | Athkar data access |
| `supabase/functions/create-profile/index.ts` | Auto-create profile on signup |
| `supabase/migrations/YYYYMMDD_user_rls_policies.sql` | User-facing RLS policies |
| `supabase/migrations/YYYYMMDD_reels_table.sql` | Reels + interactions tables |
| `supabase/migrations/YYYYMMDD_community_partners_table.sql` | Community partners table |
| `supabase/migrations/YYYYMMDD_content_items_featured.sql` | `is_featured` column |

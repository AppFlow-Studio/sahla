# Data Model

Sahla's data layer spans two systems: **Clerk** for identity and organization membership, and **Supabase** for everything else — profiles, content, preferences, interactions, and recommendations. This document is the canonical schema reference. The other docs ([Recommendation Engine](./recommendation-engine.md), [Profile & Masjid Data Flow](./profile-and-masjid-data-flow.md)) cross-reference this one for table definitions.

---

## Table of Contents

1. [Data Ownership Map](#data-ownership-map)
2. [Entity-Relationship Diagram](#entity-relationship-diagram)
3. [Core Tables](#core-tables)
4. [User Preference Tables](#user-preference-tables)
5. [Content Tables](#content-tables)
6. [Interaction & Recommendation Tables](#interaction--recommendation-tables)
7. [Lookup Tables](#lookup-tables)
8. [Multi-Tenant Isolation](#multi-tenant-isolation)
9. [Known Gaps & TODOs](#known-gaps--todos)
10. [Key Files](#key-files)

---

## Data Ownership Map

| Domain | Clerk | Supabase |
|---|---|---|
| **User identity** | Email, phone, OAuth tokens, password | — |
| **Organization membership** | Org roles (`org:member`, `org:admin`) | — |
| **Session / JWT** | Issues tokens with `sub`, `org_id`, `org_role` claims | Consumes JWT for RLS |
| **Onboarding state** | `publicMetadata[orgId]` = `{ onboarded, firstName, joinedAt }` | — |
| **Profile data** | — | `profiles` table (first_name, last_name, email, phone, pic, stripe_id) |
| **Mosque config** | — | `mosques` table (name, colors, timezone, Stripe, subscription) |
| **Content & programs** | — | `content_items`, `lectures`, `speaker_data` |
| **User preferences** | — | `user_preferences`, `user_islamic_interests`, `user_islamic_goals` |
| **Interactions** | — | `user_content_interactions`, `saved_content`, `liked_lectures`, Quran tables |
| **Recommendations** | — | `recommendation_log` |
| **Payments** | — | `donations`, `projects`, `user_cart`, `ad_subscriptions` (Stripe IDs stored here) |

**Dual-homed field:** `first_name` exists in both Clerk `publicMetadata[orgId].firstName` and Supabase `profiles.first_name`. Neither is currently authoritative — the `profiles` row is not auto-created after signup, and the Clerk metadata `firstName` is only written during onboarding sync. See [Profile & Masjid Data Flow](./profile-and-masjid-data-flow.md) for details.

---

## Entity-Relationship Diagram

```
                        ┌──────────────────────┐
                        │       mosques         │
                        │  (tenant root)        │
                        │──────────────────────│
                        │  id: text (PK)        │
                        │  slug: text (unique)   │
                        │  clerk_org_id: text    │
                        │  name, city, state     │
                        │  timezone, colors      │
                        │  stripe_account_id     │
                        └──────────┬───────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               │                   │                    │
               ▼                   ▼                    ▼
   ┌──────────────────┐  ┌─────────────────┐  ┌────────────────────┐
   │  content_items    │  │ user_preferences│  │ recommendation_log │
   │──────────────────│  │─────────────────│  │────────────────────│
   │  content_id (uuid)│  │ user_id (FK)    │  │ user_id (FK)       │
   │  mosque_id (FK)   │  │ mosque_id (FK)  │  │ content_id (FK)    │
   │  type, name       │  │ gender          │  │ mosque_id (FK)     │
   │  gender, days     │  │ birth_year      │  │ recommendation_    │
   │  is_kids          │  │ has_children    │  │   score            │
   │  is_fourteen_plus │  │ children_ages[] │  │ score_breakdown    │
   │  max_capacity     │  │ preferred_days[]│  │ was_shown/clicked/ │
   │  current_count    │  │ preferred_times[]  │   added            │
   └────────┬─────────┘  └────────┬────────┘  └────────────────────┘
            │                     │
    ┌───────┴───────┐     ┌───────┴──────────┐
    │               │     │                  │
    ▼               ▼     ▼                  ▼
┌────────────┐ ┌────────────┐ ┌───────────────┐ ┌──────────────┐
│ content_   │ │ content_   │ │ user_islamic_ │ │ user_islamic_│
│ islamic_   │ │ islamic_   │ │ interests     │ │ goals        │
│ interests  │ │ goals      │ │───────────────│ │──────────────│
│────────────│ │────────────│ │ user_id (FK)  │ │ user_id (FK) │
│ content_id │ │ content_id │ │ interest_id   │ │ goal_id (FK) │
│ interest_id│ │ goal_id    │ │ mosque_id (FK)│ │ mosque_id(FK)│
└─────┬──────┘ └─────┬──────┘ │ interest_level│ │ priority     │
      │               │        └───────┬───────┘ └──────┬───────┘
      │               │                │                 │
      ▼               ▼                ▼                 ▼
┌─────────────────────────┐   ┌──────────────────────────────┐
│ islamic_interest_        │   │ islamic_goals                │
│ categories (lookup)      │   │ (lookup)                     │
│─────────────────────────│   │──────────────────────────────│
│ id: bigint (PK)          │   │ id: bigint (PK)              │
│ category_key (unique)    │   │ goal_key (unique)            │
│ category_name            │   │ goal_name                    │
│ icon_name                │   │ display_order                │
│ parent_category_id (self)│   └──────────────────────────────┘
└──────────────────────────┘

┌──────────────────────┐
│     profiles         │
│  (user root)         │
│──────────────────────│
│  id: text (PK)       │  ← equals Clerk user.id
│  first_name          │
│  last_name           │
│  profile_email       │
│  phone_number        │
│  profile_pic         │
│  stripe_id           │
│  created_at          │
└──────────────────────┘

user_content_interactions         saved_content           liked_lectures
─────────────────────────         ─────────────           ──────────────
user_id, content_id,              user_id (FK)            user_id (FK)
  mosque_id, interaction_type     content_id (FK)         lecture_id (FK)
```

**Key relationships:**

- `mosques.id` is a **text PK** (set to the Clerk org ID, e.g. `org_3CfxuY1bSbDRGv2y8LIcZRA6w7Q`). The human-readable slug lives in `mosques.slug`.
- `profiles.id` is a **text PK** equal to the Clerk `user.id`.
- All user-per-mosque tables use a `(user_id, mosque_id)` composite pattern — the same user has separate preferences at each mosque.
- `content_items` has both an auto-incrementing `id` (bigint) and a UUID `content_id`. All FK references from other tables point to `content_id`, not `id`.

---

## Core Tables

### `profiles`

The user's Supabase identity. PK is the Clerk user ID.

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | = Clerk `user.id` |
| `first_name` | text | |
| `last_name` | text | |
| `profile_email` | text | |
| `phone_number` | text | |
| `profile_pic` | text | URL |
| `stripe_id` | text | Stripe customer ID |
| `created_at` | timestamptz | |

### `mosques`

Tenant root table. Each row is one mosque/masjid.

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | Set to Clerk org ID |
| `slug` | text (unique) | Human-readable, matches `MASJID_ID` env var |
| `clerk_org_id` | text | Clerk Organization ID |
| `name` | text | Display name |
| `city`, `state`, `address` | text | Location |
| `timezone` | text | IANA timezone |
| `app_name`, `logo_url` | text | Branding |
| `colors` | jsonb | Theme colors |
| `stripe_account_id` | text | Connected Stripe account |
| `subscription_status` | text | |
| `onboarding_status` | text | Mosque admin onboarding progress |
| `calculation_method`, `school` | text | Prayer time settings |
| `created_at`, `updated_at` | timestamptz | |

---

## User Preference Tables

These are populated during onboarding and drive the recommendation engine. All are scoped per user per mosque.

### `user_preferences`

| Column | Type | Notes |
|---|---|---|
| `user_id` | text (FK → profiles) | |
| `mosque_id` | text (FK → mosques) | |
| `gender` | text | |
| `birth_year` | integer | Used for age calculation |
| `has_children` | boolean | |
| `children_ages` | integer[] | Array of child ages |
| `is_revert` | boolean | |
| `islamic_knowledge_level` | text | |
| `preferred_days` | text[] | e.g. `["Monday", "Friday"]` |
| `preferred_times` | text[] | e.g. `["19:00", "20:30"]` |

### `user_islamic_interests`

| Column | Type | Notes |
|---|---|---|
| `user_id` | text (FK → profiles) | |
| `interest_id` | bigint (FK → islamic_interest_categories) | |
| `mosque_id` | text (FK → mosques) | |
| `interest_level` | integer | 0-5, higher = more interested |

### `user_islamic_goals`

| Column | Type | Notes |
|---|---|---|
| `user_id` | text (FK → profiles) | |
| `goal_id` | bigint (FK → islamic_goals) | |
| `mosque_id` | text (FK → mosques) | |
| `priority` | integer | 0-5, higher = more important |

---

## Content Tables

### `content_items`

Programs, events, lectures, and classes offered by a mosque.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint (auto-PK) | Internal, not referenced by other tables |
| `content_id` | uuid (unique) | **All FKs point here** |
| `mosque_id` | text (FK → mosques) | |
| `type` | text | `"lecture"`, `"class"`, `"event"`, etc. |
| `name`, `description`, `image` | text | Display fields |
| `speakers` | text[] | |
| `days` | text[] | e.g. `["Monday", "Wednesday"]` |
| `start_date`, `end_date` | timestamptz | |
| `start_time` | time | |
| `gender` | text | `"All"`, `"Male"`, `"Female"` |
| `is_kids` | boolean | For children ≤ 13 |
| `is_fourteen_plus` | boolean | For youth 14-21 |
| `has_lectures`, `is_paid` | boolean | |
| `price` | double precision | |
| `max_capacity`, `current_count` | integer | |
| `created_at` | timestamptz | |

### `content_islamic_interests` (junction)

| Column | Type | Notes |
|---|---|---|
| `content_id` | uuid (FK → content_items.content_id) | |
| `interest_id` | bigint (FK → islamic_interest_categories) | |
| PK: `(content_id, interest_id)` | | |

### `content_islamic_goals` (junction)

| Column | Type | Notes |
|---|---|---|
| `content_id` | uuid (FK → content_items.content_id) | |
| `goal_id` | bigint (FK → islamic_goals) | |
| PK: `(content_id, goal_id)` | | |

---

## Interaction & Recommendation Tables

### `user_content_interactions`

Tracks user actions on content items.

| Column | Type | Notes |
|---|---|---|
| `user_id` | text (FK → profiles) | |
| `content_id` | uuid (FK → content_items.content_id) | |
| `mosque_id` | text (FK → mosques) | |
| `interaction_type` | text | `"add"`, `"click"`, `"save"` |
| `created_at` | timestamptz | |

### `saved_content`

User bookmarks.

| Column | Type | Notes |
|---|---|---|
| `user_id` | text (FK → profiles) | PK part |
| `content_id` | uuid (FK → content_items.content_id) | PK part |

### `liked_lectures`

| Column | Type | Notes |
|---|---|---|
| `user_id` | text (FK → profiles) | |
| `lecture_id` | bigint (FK → lectures) | |
| `mosque_id` | text (FK → mosques) | |
| Unique: `(user_id, lecture_id, mosque_id)` | | |

### `recommendation_log`

Cached scored recommendations. See [Recommendation Engine](./recommendation-engine.md) for the algorithm.

| Column | Type | Notes |
|---|---|---|
| `user_id` | text (FK → profiles) | |
| `content_id` | uuid (FK → content_items.content_id) | |
| `mosque_id` | text (FK → mosques) | |
| `recommendation_score` | double precision | Total weighted score |
| `score_breakdown` | jsonb | `{ interests, goals, days, time, freshness }` |
| `was_shown` | boolean | Default `false` (currently never updated) |
| `was_clicked` | boolean | Default `false` (currently never updated) |
| `was_added` | boolean | Default `false` (currently never updated) |
| `created_at` | timestamptz | Used for TTL check |

### Quran Interaction Tables

| Table | Key | What it records |
|---|---|---|
| `user_bookmarked_ayahs` | `(user_id, mosque_id, surah_number, ayah_number)` | Ayah bookmarks |
| `user_liked_ayahs` | `(user_id, mosque_id, surah_number, ayah_number)` | Ayah likes |
| `user_bookmarked_surahs` | `(user_id, mosque_id, surah_number)` | Surah bookmarks |
| `user_liked_surahs` | `(user_id, mosque_id, surah_number)` | Surah likes |
| `user_continue_read` | `(user_id, mosque_id)` | Reading position |
| `ramadan_quran_tracker` | `(id, mosque_id, surah)` | Ramadan progress (mosque-scoped, no user_id column) |

---

## Lookup Tables

### `islamic_interest_categories`

Global reference data. Supports a hierarchy via self-referencing `parent_category_id`.

| Column | Type | Notes |
|---|---|---|
| `id` | bigint (PK) | |
| `category_key` | text (unique) | Machine key |
| `category_name` | text | Display name |
| `icon_name` | text | |
| `display_order` | integer | |
| `parent_category_id` | bigint (FK → self) | Enables nested categories |

### `islamic_goals`

| Column | Type | Notes |
|---|---|---|
| `id` | bigint (PK) | |
| `goal_key` | text (unique) | Machine key |
| `goal_name` | text | Display name |
| `display_order` | integer | |

---

## Multi-Tenant Isolation

Tenant isolation operates at three layers:

### Layer 1: Build-Time

Each binary hardcodes a `MASJID_ID` env var that resolves to a mosque slug. The app can only access one mosque's configuration and data. See [White-Label Architecture](./white-label-architecture.md) for details.

### Layer 2: Application

Every data-fetching hook filters by `mosque_id`:

- `useContentItems()` — `.eq('mosque_id', mosqueUuid)`
- `useRecommendation()` — sends `mosque_slug` to the edge function
- `useProfile()` — scoped by Clerk `userId`

### Layer 3: Database (RLS)

RLS is enabled on every table. The following helper functions are defined:

| Function | Returns | Source |
|---|---|---|
| `requesting_user_id()` | `jwt->>'sub'` | Clerk user ID from JWT |
| `requesting_mosque_id()` | `jwt->>'org_id'` | Clerk org ID from JWT |
| `requesting_user_role()` | `jwt->>'org_role'` | `org:member` or `org:admin` |
| `is_sahla_org()` | boolean | Checks if `org_id` matches Sahla HQ config |
| `is_sahla_team()` | boolean | User is in `sahla_team` table or is Sahla HQ |
| `sahla_team_role()` | text | Returns `super_admin`, `admin`, etc. |

**Current policy state** (after F-RLS-01, migration `20260425153145_user_rls_policies.sql`):

The platform `sahla_select` / `sahla_write` policies remain on every table — Sahla admins continue to see and write everything cross-mosque. On top of those, regular app users now have:

- **Mosque-scoped reads** (`*_org_select`, predicate `mosque_id = requesting_mosque_id()`): `content_items`, `prayers`, `todays_prayers`, `jummah`, `speaker_data`, `lectures`, `ramadan_quran_tracker`.
- **Public reads** (`*_public_read`, predicate `true`): `mosques`, `islamic_interest_categories`, `islamic_goals`. RLS was enabled on the latter two as part of this migration to make the public read explicit.
- **Own-row read/write** scoped by `(user_id, mosque_id)` with full `_user_select` / `_insert` / `_update` / `_delete` set: `user_preferences`, `user_islamic_interests`, `user_islamic_goals`, `user_content_interactions`, `liked_lectures`, `user_bookmarked_ayahs`, `user_liked_ayahs`, `user_bookmarked_surahs`, `user_liked_surahs`, `user_continue_read`.
- **Own-row read/write** scoped by user only: `profiles` (predicate `id = requesting_user_id()`), `saved_content` (predicate `user_id = requesting_user_id()`; the table has a `mosque_id` column but the policy intentionally ignores it per the F-RLS-01 spec).
- **Pre-existing user policy** (unchanged): `prayer_notification_settings_user_*` from migration `20260423195730`.

Tables listed in the F-RLS-01 ticket but skipped: `community_partners` and `reels` (don't exist yet).

Schema deviation noted during F-RLS-01: `ramadan_quran_tracker` is documented elsewhere as a per-user table but the actual schema has only `(id, mosque_id, surah, surah_name, ayah_num, num_of_ayahs, created_at)` — no `user_id`. It was placed in the mosque-scoped read bucket for now; per-user tracking would require a schema change first.

The `recommend` edge function uses `SUPABASE_SERVICE_ROLE_KEY`, bypassing RLS entirely.

**Performance indexes:**

| Index | Table | Column(s) |
|---|---|---|
| `idx_rec_log_user` | `recommendation_log` | `user_id` |
| `idx_rec_log_mosque` | `recommendation_log` | `mosque_id` |
| `idx_content_items_mosque` | `content_items` | `mosque_id` |
| `idx_user_preferences_mosque` | `user_preferences` | `mosque_id` |

---

## Known Gaps & TODOs

1. **No auto-created `profiles` row** — After Clerk signup, no code inserts into the `profiles` table. `useProfile()` returns `null` for all new users.
2. **No mutation hooks** — There are no hooks to create or update `user_preferences`, `user_islamic_interests`, or `user_islamic_goals` from the app.
3. ~~**RLS policies incomplete**~~ — Closed by F-RLS-01 (`20260425153145_user_rls_policies.sql`). See Multi-Tenant Isolation → Current policy state.
4. **No unique constraint on interactions** — `user_content_interactions` has no unique constraint on `(user_id, content_id, interaction_type)`, allowing duplicate events.
5. **Tracking booleans unused** — `recommendation_log.was_shown`, `was_clicked`, `was_added` are always `false`.
6. **Dual `first_name`** — Lives in both Clerk `publicMetadata` and `profiles.first_name` with no sync mechanism.

---

## Key Files

| File | Purpose |
|---|---|
| `supabase/migrations/20260419000000_baseline_schema.sql` | Complete schema definition (all tables, RLS, indexes) |
| `supabase/migrations/20260421_add_clerk_org_id_to_mosques.sql` | Adds `clerk_org_id` column |
| `supabase/migrations/20260421_mosques_public_read_policy.sql` | Public read policy for mosques |
| `supabase/migrations/20260423195730_prayer_notification_settings_user_rls.sql` | Per-user RLS for prayer notification toggles |
| `supabase/migrations/20260425153145_user_rls_policies.sql` | F-RLS-01 — per-user RLS across user-facing tables |
| `database.types.ts` | Auto-generated TypeScript types from Supabase schema |

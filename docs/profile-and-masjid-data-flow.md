# Profile & Masjid Data Flow

How identity, profile data, and mosque configuration flow through the app — from Clerk signup through Supabase data access. Clerk handles authentication and organization membership; this document covers everything on the Supabase and app-state side. For table schemas, see [Data Model](./data-model.md). For config resolution details, see [White-Label Architecture](./white-label-architecture.md).

---

## Table of Contents

1. [Identity Flow](#identity-flow)
2. [Auth Token Flow](#auth-token-flow)
3. [Organization / Mosque Mapping](#organization--mosque-mapping)
4. [Mosque Config Resolution](#mosque-config-resolution)
5. [Profile Data Lifecycle](#profile-data-lifecycle)
6. [Onboarding State Sync](#onboarding-state-sync)
7. [Data Scoping: How Queries Are Mosque-Aware](#data-scoping-how-queries-are-mosque-aware)
8. [Known Gaps & TODOs](#known-gaps--todos)
9. [Key Files](#key-files)

---

## Identity Flow

```
User taps "Sign in with Apple" (or email/password)
        │
        ▼
Clerk SDK handles OAuth / email auth
  → Creates or retrieves Clerk user (user.id = "user_2x...")
  → Returns session token
        │
        ▼
App calls joinOrgDirect(userId, orgId)
  → POST to join-org Edge Function (via direct fetch, no Supabase session needed)
  → Edge Function calls Clerk Backend API:
      1. GET /organizations/{org_id}/memberships?user_id={user_id}
         → If already member: return { status: "already_member" }
      2. POST /organizations/{org_id}/memberships
         → Adds user as role "org:member"
         → Returns { status: "joined" }
        │
        ▼
App calls clerk.setActive({ organization: orgId })
  → Clerk session token now includes org claims
        │
        ▼
SupabaseProvider creates authenticated client
  → Uses session.getToken() as Supabase accessToken
  → All subsequent Supabase requests include Clerk JWT
```

**Two client paths for joining an org:**

| Function | When used | Auth method |
|---|---|---|
| `joinOrgDirect()` | During auth flows (sign-in, sign-up, OAuth) before Supabase client is ready | Direct `fetch()` with Supabase public API key |
| `joinMosqueOrg()` | After auth, when Supabase client has a session | `supabase.functions.invoke()` (authenticated) |

Both call the same `join-org` edge function. Both are idempotent — safe to call multiple times.

---

## Auth Token Flow

```
Clerk Session
     │
     ▼
session.getToken()
     │
     ▼
Supabase client accessToken() callback
     │
     ▼
Authorization: Bearer <Clerk JWT>
     │
     ▼
Supabase parses JWT and makes claims available to RLS:
     │
     ├── jwt->>'sub'      = user ID          → requesting_user_id()
     ├── jwt->>'org_id'   = Clerk org ID     → requesting_mosque_id()
     └── jwt->>'org_role' = "org:member"     → requesting_user_role()
            or "org:admin"

     │
     ▼
RLS policies evaluate using these functions
```

**Edge function note:** The `recommend` edge function does NOT use the caller's JWT. It creates its own Supabase client with `SUPABASE_SERVICE_ROLE_KEY`, bypassing RLS entirely. The `join-org` and `sync-onboarding` edge functions call the Clerk API directly using `CLERK_SECRET_KEY`.

---

## Organization / Mosque Mapping

There is a **1:1 mapping** between Clerk Organizations and Supabase mosque rows:

```
Clerk Organization                    Supabase mosques table
──────────────────                    ──────────────────────
org.id = "org_3Cfx..."       ←→      mosques.id = "org_3Cfx..."
                                      mosques.clerk_org_id = "org_3Cfx..."
                                      mosques.slug = "sahla"
```

| Field | Where | Example | Purpose |
|---|---|---|---|
| `org.id` | Clerk | `org_3CfxuY1bSbDRGv2y8LIcZRA6w7Q` | Organization identifier |
| `mosques.id` | Supabase | `org_3CfxuY1bSbDRGv2y8LIcZRA6w7Q` | PK, set to Clerk org ID |
| `mosques.clerk_org_id` | Supabase | `org_3CfxuY1bSbDRGv2y8LIcZRA6w7Q` | Explicit FK to Clerk org |
| `mosques.slug` | Supabase | `sahla` | Human-readable, matches `MASJID_ID` env var |
| `config.id` | App config | `sahla` | Bundled config slug, matches `mosques.slug` |
| `config.clerkOrgId` | App config | `org_3CfxuY1bSbDRGv2y8LIcZRA6w7Q` | Used for org join + onboarding namespace |

The `ConfigProvider` fetches the mosque row by slug and stores the `mosques.id` (UUID) as `mosqueUuid` in the Zustand store. All subsequent data queries use `mosqueUuid`, not the slug.

---

## Mosque Config Resolution

The full pipeline from build to runtime:

```
Build Time                     Boot Time                        Runtime
──────────                     ─────────                        ───────
MASJID_ID env var              Zustand store hydrates            ConfigProvider queries
  │                            from MMKV cache                   Supabase mosques table
  ▼                              │                                 │
app.config.ts                  Validates slug matches            Maps remote row fields
  extra.masjidId = "sahla"     current build                     to MasjidConfig shape
  │                              │                                 │
  ▼                              ▼                                 ▼
resolveBundledConfig()         If match: merge bundled           applyRemoteOverrides()
  looks up masjidRegistry      over cached (new fields           deep-merges into store
  falls back to defaultConfig  become visible)                     │
  │                            If mismatch: discard cache          ▼
  ▼                              │                               setMosqueUuid(mosques.id)
Returns MasjidConfig             ▼                               stores UUID for data queries
  with colors, features,       Store ready with
  timezone, clerkOrgId         local config
```

**Key detail:** The `mosqueUuid` stored in the config store is `mosques.id` (the Clerk org ID string), which is used as the `mosque_id` foreign key in all data tables (`content_items`, `user_preferences`, etc.).

---

## Profile Data Lifecycle

### Read Path (implemented)

`useProfile()` at `src/hooks/use-profile.ts`:

```
useQuery({
  queryKey: ['profile', userId],
  queryFn: () => supabase.from('profiles').select(...).eq('id', userId),
  enabled: isLoaded && !!userId,
})
```

Returns `ProfileRow | null` with: `id, first_name, last_name, profile_email, phone_number, profile_pic, stripe_id, created_at`.

### Write Path (NOT implemented)

There is currently **no code** to create or update a `profiles` row.

```
Clerk signup
  → user.id created in Clerk                     ✓
  → NO profiles INSERT happens in Supabase        ✗
  → useProfile() returns null for new users       ← gap

Onboarding captures first_name
  → Written to Clerk publicMetadata[orgId]        ✓  (via sync-onboarding edge fn)
  → Written to MMKV onboarding store              ✓  (local)
  → Written to Supabase profiles table            ✗  ← gap
```

### Profile Display Resolution

The `ProfileHeader` component resolves display data with a priority chain:

```
1. Supabase profiles table           (most authoritative, if row exists)
2. Clerk publicMetadata[orgId]       (org-specific, set during onboarding)
3. Clerk user object                 (global fallback — firstName, imageUrl)
```

```typescript
const firstName = profile?.first_name ?? metaFirstName ?? user?.firstName;
const lastName  = profile?.last_name  ?? user?.lastName;
const url       = profile?.profile_pic ?? user?.imageUrl;
```

---

## Onboarding State Sync

`useOnboardingSync()` at `src/hooks/use-onboarding-sync.ts` handles bidirectional sync between local MMKV and Clerk metadata.

### Local State (MMKV via Zustand)

```typescript
// onboarding-store.ts
{
  firstName: string;    // User's first name
  complete: boolean;    // Onboarding finished?
  userId: string;       // Clerk user ID (scoped)
}
```

### Clerk Metadata (per org)

```typescript
// publicMetadata[orgId]
{
  onboarded: boolean;
  firstName: string;
  joinedAt: string;     // ISO 8601
}
```

### Boot-Time Sync Logic

```
App boots → useOnboardingSync() runs
        │
        ▼
Is the Clerk user ID different from stored userId?
  │                         │
  YES                       NO
  │                         │
  ▼                         ▼
switchUser()             Is local complete = false
  atomically replaces    AND Clerk metadata says
  local state with       onboarded = true?
  Clerk metadata           │           │
  (handles sign-out →      YES         NO
   new sign-in)            │           │
                           ▼           ▼
                       Restore from    Nothing
                       Clerk metadata  to do
                       (new device
                        scenario)
```

### Post-Onboarding Write

After the user completes onboarding:

```
markComplete()  →  updates local MMKV store
        │
        ▼
syncOnboardingToClerk()
        │
        ▼
POST to sync-onboarding Edge Function
  body: { user_id, org_id, first_name }
        │
        ▼
Edge Function:
  1. GET Clerk user's current publicMetadata
  2. Merge: metadata[org_id] = { onboarded: true, firstName, joinedAt }
  3. PATCH back to Clerk
```

**Multi-mosque support:** Metadata is namespaced by org ID. A user who attends two mosques has separate onboarding state for each:

```json
{
  "org_3Cfx...": { "onboarded": true, "firstName": "Ahmed", "joinedAt": "2026-04-20T..." },
  "org_7Xyz...": { "onboarded": false }
}
```

---

## Data Scoping: How Queries Are Mosque-Aware

Every data hook uses the resolved `mosqueUuid` from the config store:

| Hook | Table | Filter |
|---|---|---|
| `useContentItems()` | `content_items` | `.eq('mosque_id', mosqueUuid)` |
| `useRecommendation()` | (edge function) | `body: { mosque_slug: config.id }` → resolves to `mosques.id` |
| `useProfile()` | `profiles` | `.eq('id', userId)` — not mosque-scoped (single profile per user) |

The recommendation edge function internally resolves `mosque_slug` → `mosques.id` and uses that for all its queries.

---

## Known Gaps & TODOs

1. **No `profiles` row creation** — After Clerk signup, no code creates the Supabase profile. `useProfile()` always returns `null` for new users. Needs either a webhook handler or a post-signup mutation.
2. **No profile update mutations** — No hooks to update `first_name`, `last_name`, `phone_number`, `profile_pic`, etc. in the `profiles` table.
3. **No Clerk → Supabase webhook** — If a user updates their name or email in Clerk, the `profiles` table won't reflect the change. A Clerk webhook → Supabase sync would close this gap.
4. **Dual `first_name` drift** — The name in Clerk `publicMetadata[orgId].firstName` and `profiles.first_name` can diverge. No reconciliation mechanism exists.
5. **Per-user RLS policies missing** — The RLS helper functions (`requesting_user_id()`, `requesting_mosque_id()`) are defined but no policies use them for regular app users. All data access currently goes through `sahla_team` policies or the service-role key.
6. **No multi-org runtime switching** — The app assumes a single active org per build. There is no UI for a user to switch between mosques at runtime.
7. **Onboarding data not persisted to Supabase** — The onboarding flow captures preferences (interests, goals, demographics) but there are no mutation hooks to write these to `user_preferences`, `user_islamic_interests`, and `user_islamic_goals` tables.

---

## Key Files

| File | Purpose |
|---|---|
| `src/hooks/use-profile.ts` | Profile read hook |
| `src/hooks/use-onboarding-sync.ts` | MMKV ↔ Clerk metadata sync + `syncOnboardingToClerk()` |
| `src/hooks/use-masjid-config.ts` | Returns active mosque config from Zustand |
| `src/stores/config-store.ts` | Zustand store: config + mosqueUuid + MMKV persistence |
| `src/stores/onboarding-store.ts` | Zustand store: firstName, complete, userId |
| `src/lib/clerk-org.ts` | `joinMosqueOrg()` — authenticated org join |
| `src/lib/join-org-direct.ts` | `joinOrgDirect()` — unauthenticated org join during auth flows |
| `src/providers/config-provider.tsx` | Fetches Supabase mosque row + applies remote overrides |
| `src/providers/supabase-provider.tsx` | Creates Supabase client with Clerk session token |
| `supabase/functions/join-org/index.ts` | Edge function: add user to Clerk org |
| `supabase/functions/sync-onboarding/index.ts` | Edge function: write onboarding state to Clerk metadata |
| `components/profile/ProfileHeader.tsx` | Profile display with fallback chain |
| `app/_layout.tsx` | Provider stack: Clerk → Supabase → Config → Theme |

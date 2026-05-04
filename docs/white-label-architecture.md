# White-Label Architecture

Sahla is a multi-tenant masjid app. Each masjid gets its own branded binary with isolated data. This document explains the full system from build time through runtime theming to data scoping.

---

## Table of Contents

1. [Overview](#overview)
2. [Build-Time Variants](#build-time-variants)
3. [Config Layer](#config-layer)
4. [Runtime Resolution & Merging](#runtime-resolution--merging)
5. [State & Persistence](#state--persistence)
6. [Provider Stack](#provider-stack)
7. [Runtime Theming](#runtime-theming)
8. [Data Scoping (Supabase)](#data-scoping-supabase)
9. [Adding a New Tenant](#adding-a-new-tenant)
10. [Known Gaps & TODOs](#known-gaps--todos)

---

## Overview

The white-label system has three layers:

```
Build Time          Runtime (boot)         Runtime (render)
───────────         ──────────────         ────────────────
MASJID_ID env var   Bundled config         ThemeRoot injects
    │               loaded from            CSS variables
    ▼               registry               from Zustand store
app.config.ts           │                      │
sets bundle ID,         ▼                      ▼
scheme, name      Config store hydrates   NativeWind resolves
    │             from MMKV cache         className="bg-primary"
    ▼                   │                 to runtime color
eas.json build          ▼
profile             ConfigProvider
                    fetches Supabase
                    mosques row &
                    merges overrides
```

Each build produces an **isolated binary** — there is no runtime tenant picker.

---

## Build-Time Variants

### Environment Variable

`MASJID_ID` is the single env var that drives everything. It's set per EAS build profile.

### `app.config.ts`

Reads `process.env.MASJID_ID` (defaults to `mas-si`) and:

- Sets a unique iOS `bundleIdentifier`: `com.appflowstudios.sahla.{MASJID_ID}`
- Sets a unique Android `package`: `com.appflowstudios.sahla.{MASJID_ID}` (hyphens replaced with underscores)
- Picks `displayName` from an inline lookup map (`BUILD_TIME_MASJIDS`)
- Passes the resolved ID to runtime via `extra.masjidId`

The inline map is intentionally simple — Expo's config evaluator runs in a restricted CJS context that can't follow arbitrary TS imports.

### `eas.json`

Build profiles follow the pattern `{masjid}-{env}`:

```
sahla-dev      → MASJID_ID=sahla, development client
sahla-preview  → MASJID_ID=sahla, internal distribution
sahla-prod     → MASJID_ID=sahla, store distribution
```

Each masjid needs its own set of profiles.

### Key Files

| File | Purpose |
|------|---------|
| `app.config.ts` | Dynamic Expo config, reads MASJID_ID |
| `eas.json` | EAS build profiles per tenant/environment |

---

## Config Layer

### Types (`src/config/types.ts`)

```typescript
MasjidConfig {
  id: string              // Canonical slug — matches MASJID_ID and mosques.slug
  displayName: string
  tagline?: string
  logoUrl?: string
  colors: MasjidColors    // RGB triplet strings ("10 38 30")
  features: MasjidFeatures // Boolean flags
  locale: string          // BCP-47 ("en", "ar")
  timezone: string        // IANA ("America/New_York")
  prayerCalculationMethod?: string
  clerkOrgId?: string     // Clerk Organization ID per tenant
}

MasjidColors {
  primary, primaryForeground, accent, accentForeground,
  background, foreground, muted, mutedForeground,
  border, card, cardForeground, depth, shadow,
  onboardingBackground, onboardingSurface, onboardingAccent,
  onboardingHalo1, onboardingHalo2, onboardingHalo3, onboardingLayer
}

MasjidFeatures {
  prayerTimes, events, donations, announcements, jumaahRegistration
}

RemoteMasjidOverrides = Partial<MasjidConfig>
  // Every field optional — server may only override a subset
```

### Color Format Convention

Colors are stored as **space-separated RGB triplets** (e.g., `"10 38 30"`) so they plug directly into NativeWind's `rgb(var(--color-x) / <alpha-value>)` pattern. This enables Tailwind opacity modifiers like `bg-primary/50`.

The `hexToRgbTriplet()` utility (`src/lib/color.ts`) converts hex values from Supabase to this format.

### Bundled Configs (`src/config/masjids/`)

Each tenant has a file that extends `defaultConfig`:

```
src/config/
├── types.ts          # MasjidConfig, MasjidColors, MasjidFeatures
├── default.ts        # Neutral fallback (Sahla brand defaults)
├── resolver.ts       # resolveBundledConfig() + mergeConfig()
└── masjids/
    ├── index.ts      # Registry map: slug → config
    ├── sahla.ts      # Demo tenant
    └── mas-si.ts     # MAS Staten Island
```

The **registry** (`masjids/index.ts`) is a plain `Record<string, MasjidConfig>` that maps slugs to configs.

### Key Files

| File | Purpose |
|------|---------|
| `src/config/types.ts` | Type definitions for all config shapes |
| `src/config/default.ts` | Default/fallback config with all color values |
| `src/config/resolver.ts` | `resolveBundledConfig()` and `mergeConfig()` |
| `src/config/masjids/index.ts` | Tenant registry |
| `src/config/masjids/*.ts` | Per-tenant bundled configs |
| `src/lib/color.ts` | `hexToRgbTriplet()` hex-to-RGB converter |

---

## Runtime Resolution & Merging

### `resolveBundledConfig()` (`src/config/resolver.ts`)

1. Reads `Constants.expoConfig.extra.masjidId` (set at build time)
2. Looks up the slug in `masjidRegistry`
3. Falls back to `defaultConfig` if not found

### `mergeConfig(base, overrides)` (`src/config/resolver.ts`)

Deep-merges a `RemoteMasjidOverrides` object onto a bundled config:

- Top-level scalar fields: override wins if present
- `colors`: shallow-merged (`{ ...base.colors, ...overrides.colors }`)
- `features`: shallow-merged (`{ ...base.features, ...overrides.features }`)
- Unknown fields from Supabase are ignored (prevents schema changes from breaking the app)

---

## State & Persistence

### Zustand Store (`src/stores/config-store.ts`)

```typescript
ConfigState {
  config: MasjidConfig        // Active merged config
  mosqueUuid: string | null   // UUID from mosques table
  lastSyncedAt: number | null // Timestamp of last Supabase fetch
  applyRemoteOverrides()      // Merge + persist to MMKV
  setMosqueUuid()
  reset()                     // Wipe cache, return to bundled default
}
```

### MMKV Persistence (`src/lib/mmkv.ts`)

- Storage instance namespaced as `sahla.default`
- JSON helpers (`kv.getJSON`, `kv.setJSON`) handle serialization
- Corrupt payloads are auto-deleted on read

### Boot Hydration

On cold start:

1. Read MMKV cache key `masjid-config.v1`
2. If cached config ID matches the build's bundled ID:
   - Merge bundled defaults OVER cached values (so new bundled fields appear without re-sync)
3. If IDs mismatch (reinstalled with a different variant):
   - Discard cache entirely
4. If no cache: use fresh bundled config

### Non-React Access

`getMasjidConfig()` provides synchronous access outside of React components (e.g., in plain functions or Edge Function payloads).

### Key Files

| File | Purpose |
|------|---------|
| `src/stores/config-store.ts` | Zustand store with MMKV hydration |
| `src/lib/mmkv.ts` | MMKV instance + JSON helpers |

---

## Provider Stack

The root layout (`app/_layout.tsx`) nests providers in this order:

```tsx
<ClerkProvider>           // Auth (Clerk session management)
  <ClerkLoaded>
    <GestureHandlerRootView>
      <SupabaseProvider>    // Provides typed Supabase client (uses Clerk session)
        <ConfigProvider>    // Fetches remote overrides from mosques table
          <ThemeRoot>       // Injects CSS variables from active config
            <DonationProvider>
              <RootNavigator />
            </DonationProvider>
          </ThemeRoot>
        </ConfigProvider>
      </SupabaseProvider>
    </GestureHandlerRootView>
  </ClerkLoaded>
</ClerkProvider>
```

### ConfigProvider (`src/providers/config-provider.tsx`)

Runs on mount:

1. Queries Supabase `mosques` table: `.eq('slug', config.id).maybeSingle()`
2. Stores the resolved mosque UUID via `setMosqueUuid()`
3. Converts `brand_color` and `accent_color` from hex to RGB triplets
4. Builds a `RemoteMasjidOverrides` object and calls `applyRemoteOverrides()`

**Non-blocking** — errors are logged as warnings; the app stays on the cached/bundled config.

### Key Files

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout with provider nesting order |
| `src/providers/config-provider.tsx` | Remote config sync on boot |
| `src/providers/supabase-provider.tsx` | Supabase client provider |

---

## Runtime Theming

### ThemeRoot (`src/components/theme-root.tsx`)

Reads the active config via `useMasjidConfig()` and injects NativeWind CSS variables:

```tsx
const themeVars = vars({
  '--color-primary': config.colors.primary,           // "10 38 30"
  '--color-accent': config.colors.accent,
  '--color-background': config.colors.background,
  // ... all theme tokens
});

return <View style={themeVars} className="flex-1 bg-background">{children}</View>;
```

### Tailwind Config (`tailwind.config.js`)

Maps CSS variables to Tailwind color utilities:

```js
colors: {
  primary: 'rgb(var(--color-primary) / <alpha-value>)',
  'primary-foreground': 'rgb(var(--color-primary-foreground) / <alpha-value>)',
  accent: 'rgb(var(--color-accent) / <alpha-value>)',
  background: 'rgb(var(--color-background) / <alpha-value>)',
  // ...
}
```

This enables:
- `className="bg-primary"` resolves to `rgb(10 38 30)`
- `className="text-accent/50"` resolves to `rgba(184 146 42 / 0.5)`
- Full Tailwind opacity modifier support

### How Components Consume Config

```tsx
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

function MyComponent() {
  const config = useMasjidConfig();

  // For Tailwind classes — just use the class names (they resolve via CSS vars):
  return <View className="bg-primary text-primary-foreground" />;

  // For inline styles where you need the raw RGB:
  const fg = `rgb(${config.colors.foreground.replace(/ /g, ',')})`;
  return <View style={{ borderColor: fg }} />;
}
```

### Key Files

| File | Purpose |
|------|---------|
| `src/components/theme-root.tsx` | Injects CSS variables at runtime |
| `tailwind.config.js` | Maps CSS vars to Tailwind utilities |
| `src/hooks/use-masjid-config.ts` | Hook to read active config |

---

## Data Scoping (Supabase)

All data is scoped per masjid via the `mosque_id` foreign key pattern.

### Slug-to-UUID Resolution

The app works with slugs (`config.id`), but Supabase tables use UUIDs. Resolution flow:

```
config.id ("mas-si")
    │
    ▼
mosques table: .eq('slug', 'mas-si') → UUID
    │
    ▼
All subsequent queries: .eq('mosque_id', uuid)
```

The resolved UUID is cached in the Zustand store as `mosqueUuid`.

### Query Scoping Pattern

Every data hook follows this pattern:

```typescript
const config = useMasjidConfig();

// Content items
const { data } = await supabase
  .from('content_items')
  .select('*')
  .eq('mosque_id', mosqueUuid);

// User preferences (composite key)
const { data } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', userId)
  .eq('mosque_id', mosqueUuid);
```

### Edge Functions

Server-side functions receive `mosque_slug` from the client and resolve it independently:

```typescript
// Client
await supabase.functions.invoke('recommend', {
  body: { user_id: userId, mosque_slug: config.id },
});

// Server
const mosqueId = await resolveMosqueId(supabase, body);
// All queries scoped by mosqueId
```

### Database Schema (Key Tables)

| Table | Scoping | Key |
|-------|---------|-----|
| `mosques` | Top-level tenant | `id` (UUID), `slug` |
| `content_items` | `mosque_id` FK | `content_id` |
| `user_preferences` | `(user_id, mosque_id)` composite | Per-user per-mosque |
| `user_islamic_interests` | `(user_id, mosque_id)` composite | Per-user per-mosque |
| `recommendation_log` | `(user_id, mosque_id, content_id)` | Per-user per-mosque |
| `activity_log` | `mosque_id` FK | Per-mosque |

### Auth Layer

Supabase uses Clerk's session token as a Bearer token (third-party auth integration). Two client tiers:

- **Authenticated client**: Uses Clerk session → full RLS access
- **Anon client**: Uses publishable key → limited to public/anon policies

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Client creation (auth + anon) |
| `src/providers/supabase-provider.tsx` | React context for Supabase client |
| `src/hooks/use-content-items.ts` | Example scoped data hook |
| `src/hooks/use-Recommendation.ts` | Example with Edge Function |
| `supabase/functions/recommend/index.ts` | Server-side scoping example |

---

## Adding a New Tenant

### Step 1: Bundled Config

Create `src/config/masjids/new-masjid.ts`:

```typescript
import { defaultConfig } from '../default';
import type { MasjidConfig } from '../types';

export const newMasjidConfig: MasjidConfig = {
  ...defaultConfig,
  id: 'new-masjid',
  displayName: 'New Masjid',
  tagline: 'Welcome to New Masjid',
  colors: {
    ...defaultConfig.colors,
    primary: '30 58 90',        // Custom brand blue
    accent: '220 180 50',       // Custom gold
    // Override any other colors as needed
  },
  features: {
    ...defaultConfig.features,
    donations: true,
  },
  locale: 'en',
  timezone: 'America/Chicago',
  prayerCalculationMethod: 'ISNA',
};
```

### Step 2: Register in Registry

In `src/config/masjids/index.ts`:

```typescript
import { newMasjidConfig } from './new-masjid';

export const masjidRegistry: Record<string, MasjidConfig> = {
  // ... existing entries
  [newMasjidConfig.id]: newMasjidConfig,
};
```

### Step 3: Build-Time Config

In `app.config.ts`, add to `BUILD_TIME_MASJIDS`:

```typescript
const BUILD_TIME_MASJIDS: Record<string, BuildTimeMasjid> = {
  // ... existing entries
  'new-masjid': { displayName: 'New Masjid' },
};
```

### Step 4: EAS Build Profiles

In `eas.json`, add profiles:

```json
{
  "new-masjid-dev": {
    "extends": "base",
    "env": { "MASJID_ID": "new-masjid" }
  },
  "new-masjid-preview": {
    "extends": "base",
    "distribution": "internal",
    "env": { "MASJID_ID": "new-masjid" }
  },
  "new-masjid-prod": {
    "extends": "base",
    "developmentClient": false,
    "distribution": "store",
    "env": { "MASJID_ID": "new-masjid" }
  }
}
```

### Step 5: Supabase Row

Insert a row in the `mosques` table with a matching `slug`:

```sql
INSERT INTO mosques (slug, name, app_name, brand_color, accent_color, timezone, calculation_method)
VALUES ('new-masjid', 'New Masjid', 'New Masjid App', '#1E3A5A', '#DCB432', 'America/Chicago', 'ISNA');
```

---

## Known Gaps & TODOs

### Missing Build Profiles

`mas-si` has a bundled config (`src/config/masjids/mas-si.ts`) but **no EAS build profiles** in `eas.json`. It cannot be built as a standalone variant.

### `mas-si` Has No Custom Colors

The MAS S.I config only overrides metadata (name, timezone, locale). It inherits all colors from `defaultConfig`, making it visually identical to Sahla.

### ConfigProvider Under-Syncs

Currently only `brand_color` and `accent_color` are pulled from Supabase and mapped to `primary` and `accent`. The following are **not synced from remote**:

- `secondary_color` (fetched but ignored)
- `background`, `foreground`, `card`, `muted`, `border` colors
- All onboarding colors
- `clerkOrgId`
- Feature flags (`features.*`)

### Unused Code in ConfigProvider

`useAuth().isLoaded` is destructured but never used in the effect or render logic.

### Dead Color Tokens

`depth` and `shadow` are defined in `MasjidColors` and `defaultConfig` but:
- Not injected as CSS variables in `ThemeRoot`
- Not mapped in `tailwind.config.js`

### No Staleness Check

`lastSyncedAt` is persisted in MMKV but never consulted. Every cold start re-fetches from Supabase regardless of how recently it synced.

### No Row-Level Security

Data isolation relies entirely on app-layer query filters (`.eq('mosque_id', ...)`). There are no Supabase RLS policies enforcing tenant isolation at the database level.

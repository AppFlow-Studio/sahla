# Adding a New Masjid — Setup Guide

Step-by-step guide for onboarding a new mosque tenant into the Sahla white-label system.

---

## Prerequisites

- A **Clerk Organization** created for the mosque (via Clerk dashboard or Sahla admin CRM)
- Access to **Supabase** (project: Sahla)
- Access to the **codebase** (this repo)

---

## How Data Flows Through the App

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUILD TIME                               │
│                                                                 │
│  .env / eas.json                                                │
│  ┌──────────────┐     ┌──────────────────┐                      │
│  │ MASJID_ID=   │────▶│  app.config.ts   │                      │
│  │  "mas-cnj"   │     │  Sets:           │                      │
│  └──────────────┘     │  - bundleId      │                      │
│                       │  - package name  │                      │
│                       │  - display name  │                      │
│                       │  - extra.masjidId│                      │
│                       └────────┬─────────┘                      │
│                                │                                │
│                       Baked into binary                          │
└────────────────────────────────┼────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                        APP BOOT                                 │
│                                │                                │
│  ┌─────────────────────────────▼──────────────────────────────┐ │
│  │  resolveBundledConfig()                                    │ │
│  │  Reads extra.masjidId → looks up masjidRegistry            │ │
│  │  Returns bundled MasjidConfig (colors, features, etc.)     │ │
│  └─────────────────────────────┬──────────────────────────────┘ │
│                                │                                │
│  ┌─────────────────────────────▼──────────────────────────────┐ │
│  │  config-store.ts (Zustand + MMKV)                          │ │
│  │  Hydrates from cache if slug matches, else uses bundled    │ │
│  └─────────────────────────────┬──────────────────────────────┘ │
│                                │                                │
│  ┌─────────────────────────────▼──────────────────────────────┐ │
│  │  ConfigProvider                                            │ │
│  │  Fetches: mosques WHERE slug = config.id                   │ │
│  │  Extracts: brand_color, accent_color → RGB triplets        │ │
│  │  Stores: mosqueUuid, clerkOrgId                            │ │
│  │  Calls: applyRemoteOverrides() → mergeConfig()             │ │
│  └─────────────────────────────┬──────────────────────────────┘ │
│                                │                                │
│  ┌─────────────────────────────▼──────────────────────────────┐ │
│  │  ThemeRoot                                                 │ │
│  │  Reads config.colors → injects NativeWind CSS variables    │ │
│  │  className="bg-primary" resolves to the masjid's color     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                        RUNTIME                                  │
│                                │                                │
│  ┌─────────────────────────────▼──────────────────────────────┐ │
│  │  Auth (Clerk)                                              │ │
│  │  After sign-in/up: setActive({ organization: clerkOrgId }) │ │
│  │  JWT now contains o.id = mosque's Clerk org ID             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Data Queries (Supabase)                                   │ │
│  │  All hooks use .eq('mosque_id', mosqueUuid)                │ │
│  │  Future: RLS reads o.id from JWT automatically             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  UI Components                                             │ │
│  │  useMasjidConfig() → config.displayName, config.colors     │ │
│  │  className="bg-primary" → resolves to masjid's brand color │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Create the Clerk Organization

1. Go to **Clerk Dashboard** → Organizations → Create Organization
2. Set the name (e.g., "MAS Central New Jersey")
3. Copy the **Organization ID** (e.g., `org_3Blv5OuI4uRo42jFdvz31KQAjxP`)

This org ID becomes the tenant's identity across Clerk and Supabase.

---

## Step 2: Create the Supabase Row

Insert a row into the `mosques` table. The `slug` must be unique and URL-safe — this is the key that links the app binary to the database.

```sql
INSERT INTO public.mosques (
  id,
  slug,
  name,
  app_name,
  brand_color,
  accent_color,
  timezone,
  calculation_method,
  clerk_org_id
) VALUES (
  'org_3Blv5OuI4uRo42jFdvz31KQAjxP',  -- Use the Clerk org ID as the row ID
  'mas-cnj',                             -- URL-safe slug (matches MASJID_ID)
  'MAS Central New Jersey',              -- Full name
  'MAS Central NJ',                      -- Short name for app UI
  '#1E3A5A',                             -- Primary brand color (hex)
  '#3B82F6',                             -- Accent color (hex, nullable)
  'America/New_York',                    -- IANA timezone
  2,                                     -- Prayer calculation method
  'org_3Blv5OuI4uRo42jFdvz31KQAjxP'     -- Clerk org ID
);
```

**Key fields:**
| Field | Purpose |
|-------|---------|
| `slug` | Must match `MASJID_ID` in the app — this is how ConfigProvider finds the row |
| `brand_color` | Overrides the bundled `primary` color at runtime (hex format) |
| `accent_color` | Overrides the bundled `accent` color at runtime (hex, nullable) |
| `clerk_org_id` | Links to Clerk org — set on JWT after sign-in for future RLS |
| `calculation_method` | Prayer time calculation: 1=MWL, 2=ISNA, 3=Egypt, 4=Makkah, 5=Karachi |

---

## Step 3: Create the Bundled Config

Create `src/config/masjids/<slug>.ts`:

```typescript
import { defaultConfig } from '../default';
import type { MasjidConfig } from '../types';

export const masCnjConfig: MasjidConfig = {
  ...defaultConfig,
  id: 'mas-cnj',                              // Must match the DB slug
  displayName: 'MAS Central New Jersey',
  tagline: 'Muslim American Society — Central New Jersey',
  colors: {
    ...defaultConfig.colors,
    primary: '30 58 90',                       // RGB triplet format
    primaryForeground: '255 251 242',
    accent: '59 130 246',
    // ... override any colors you want
    // Colors not overridden fall back to defaultConfig
    onboardingBackground: '15 30 50',
    onboardingSurface: '255 251 242',
    onboardingAccent: '59 130 246',
  },
  locale: 'en',
  timezone: 'America/New_York',
  prayerCalculationMethod: 'ISNA',
};
```

**Color format:** Space-separated RGB triplets (`"30 58 90"` not `"#1E3A5A"`). This plugs into NativeWind's `rgb(var(--color-x) / <alpha-value>)` pattern and supports Tailwind opacity modifiers like `bg-primary/50`.

Use `src/lib/color.ts` → `hexToRgbTriplet('#1E3A5A')` to convert hex to triplets if needed.

---

## Step 4: Register in the Config System

### 4a. Add to registry (`src/config/masjids/index.ts`)

```typescript
import { masCnjConfig } from './mas-cnj';

export const masjidRegistry: Record<string, MasjidConfig> = {
  // ... existing entries
  [masCnjConfig.id]: masCnjConfig,
};

export { masCnjConfig };
```

### 4b. Add to build-time map (`app.config.ts`)

```typescript
const BUILD_TIME_MASJIDS: Record<string, BuildTimeMasjid> = {
  // ... existing entries
  'mas-cnj': { displayName: 'MAS Central New Jersey' },
};
```

This inline map is intentionally simple — Expo's config evaluator can't follow TS imports.

---

## Step 5: Add EAS Build Profiles

In `eas.json`, add three profiles:

```json
{
  "mas-cnj-dev": {
    "extends": "base",
    "env": { "MASJID_ID": "mas-cnj" }
  },
  "mas-cnj-preview": {
    "extends": "base",
    "distribution": "internal",
    "env": { "MASJID_ID": "mas-cnj" }
  },
  "mas-cnj-prod": {
    "extends": "base",
    "developmentClient": false,
    "distribution": "store",
    "env": { "MASJID_ID": "mas-cnj" }
  }
}
```

Each profile produces a binary with a unique bundle ID: `com.appflowstudios.sahla.mas-cnj`.

---

## Step 6: Test Locally

```bash
# 1. Set the masjid in .env
MASJID_ID=mas-cnj

# 2. Clear cache and start
npx expo start --clear

# 3. Verify:
#    - Welcome screen shows the masjid name and correct theme colors
#    - Sign up works and sets the Clerk org
#    - Data queries return content scoped to this mosque
```

To switch back: change `MASJID_ID=sahla` in `.env` and restart.

---

## Step 7: Build for Distribution

```bash
# Development build
eas build --profile mas-cnj-dev --platform ios

# Preview (TestFlight / internal)
eas build --profile mas-cnj-preview --platform all

# Production (App Store / Play Store)
eas build --profile mas-cnj-prod --platform all --auto-submit
```

---

## What Gets Overridden at Runtime

The bundled config is the **baseline**. When the app boots, `ConfigProvider` fetches the Supabase `mosques` row and overrides these fields if present:

| Supabase Column | Config Field | Notes |
|----------------|-------------|-------|
| `app_name` or `name` | `displayName` | App name shown in UI |
| `logo_url` | `logoUrl` | Remote logo |
| `brand_color` | `colors.primary` | Converted from hex to RGB triplet |
| `accent_color` | `colors.accent` | Converted from hex to RGB triplet |
| `timezone` | `timezone` | IANA timezone |
| `calculation_method` | `prayerCalculationMethod` | Cast to string |
| `clerk_org_id` | `clerkOrgId` | Clerk Organization ID |

All other color tokens (background, foreground, onboarding colors, etc.) come from the **bundled config only**. To change those, update the TypeScript config file and redeploy.

---

## Current Tenants

| Slug | Name | Brand | Clerk Org |
|------|------|-------|-----------|
| `sahla` | Sahla Demo Masjid | Teal green `#0D7C5F` | `org_3CfxuY1bSbDRGv2y8LIcZRA6w7Q` |
| `mas-cnj` | MAS Central New Jersey | Navy blue `#1E3A5A` | `org_3Blv5OuI4uRo42jFdvz31KQAjxP` |

---

## File Reference

| File | Purpose |
|------|---------|
| `src/config/types.ts` | `MasjidConfig`, `MasjidColors`, `MasjidFeatures` types |
| `src/config/default.ts` | Default/fallback config (all color values) |
| `src/config/resolver.ts` | `resolveBundledConfig()` + `mergeConfig()` |
| `src/config/masjids/index.ts` | Tenant registry |
| `src/config/masjids/*.ts` | Per-tenant bundled configs |
| `src/stores/config-store.ts` | Zustand + MMKV persistence |
| `src/providers/config-provider.tsx` | Fetches remote overrides from Supabase |
| `src/components/theme-root.tsx` | Injects CSS variables from active config |
| `src/hooks/use-masjid-config.ts` | Hook to read active config in components |
| `src/lib/color.ts` | `hexToRgbTriplet()` converter |
| `app.config.ts` | Build-time config (bundle ID, display name) |
| `eas.json` | EAS build profiles per tenant |

# Sahla — Session Memory

Snapshot of the onboarding build so a fresh Claude session (or teammate) can pick up cold.
Last updated: 2026-04-15.

---

## Who & what

- **Ahmad** — founder at AppFlow Studio, building Sahla.
- **Sahla** — SaaS app template for masjids. Multi-tenant: each masjid gets its own branded build (colors, name, logo, prayer calc method) driven by a `mosques` row in Supabase.
- Tech: React Native + Expo 54, Expo Router v6, Clerk auth, Supabase, NativeWind 4, Reanimated 4, MMKV + Zustand, expo-google-fonts.
- Repo: `https://github.com/AppFlow-Studio/sahla` — current branch **`hamoudeh-dev`** (pushed).

## PM directive — don't hardcode

Everything brand-touching (colors, tenant name/logo, tagline) must route through `MasjidConfig` tokens so each masjid can customize. Hardcoded hex from Figma defeats the white-label model. Universal Islamic content (Arabic greetings, geometric pattern, mosque silhouette) is fine to inline — it's Sahla brand decoration, not tenant-specific. App-shell copy ("Welcome", "Continue with Apple") is fine hardcoded for now; will live in an i18n layer later.

## Brand palette (confirmed against Sahla Brand Guide)

- Primary bg: `#0A261E` → token `onboarding-bg` (triplet `10 38 30`)
- Cream surface: `#FFFBF2` → `onboarding-surface` (`255 251 242`) — use instead of pure white
- Gold accent: `#B8922A` → `onboarding-accent` (`184 146 42`)
- Layering depth: `#071F18` → `onboarding-layer` (`7 31 24`) — "only for depth and layering graphic elements"
- Halo glow (lighter greens, for welcome screen only): `#0f3b30` / `#14503f` / `#1a6650` → `onboarding-halo-1/2/3`
- Brand guide rules: no pure white/black, Playfair for headers used strategically, SF Pro for body, section titles ALL CAPS + bottom border.

## Token pipeline

1. `src/config/types.ts` — `MasjidColors` type.
2. `src/config/default.ts` — Sahla defaults (also spread into `src/config/masjids/sahla.ts`).
3. `src/providers/config-provider.tsx` — fetches the `mosques` row and maps hex → `"R G B"` triplet via `src/lib/color.ts`.
4. `src/components/theme-root.tsx` — injects `--color-*` CSS vars via NativeWind `vars()`.
5. `tailwind.config.js` — exposes classes like `bg-onboarding-bg`, `text-onboarding-accent`.
6. Opacity modifiers: `text-onboarding-surface/50` etc. work via `<alpha-value>` in the tailwind config.

**DB → config mapping (`src/providers/config-provider.tsx`)**: only `primary` and `accent` are wired to `brand_color`/`accent_color`. Onboarding colors are bundled defaults today; add DB columns + mapping if a masjid needs to override onboarding palette.

## Fonts

Loaded in `app/_layout.tsx` via `expo-font` + `expo-google-fonts`:

- `PlayfairDisplay_500Medium` → title strings ("Welcome", "Create Account", "Never miss a prayer", "Where do you pray?")
- `Amiri_400Regular` → "السلام عليكم"
- Body text uses system SF Pro (no family needed on iOS).

Fonts are deliberately NOT tokenized — user wants exact Figma match.

## Onboarding flow

Order: `welcome → create-account → name → notifications → location → welcome-full → home`.

App is force-routed into onboarding while building — see the `router.replace` in `app/_layout.tsx`'s `RootNavigator` useEffect. Remove when gating on Clerk auth.

### Screens built

| File | Step | Status |
|---|---|---|
| `app/(onboarding)/welcome.tsx` | — | Animated (see below). Halo + mosque + SafeArea text/CTA. |
| `app/(onboarding)/create-account.tsx` | — | Pattern header, Apple (primary) + Google + Email buttons. All route to `/name` currently (no real auth). |
| `app/(onboarding)/name.tsx` | 1 of 4 | Stub — FIRST NAME underline input. Figma design not yet pulled. |
| `app/(onboarding)/notifications.tsx` | 2 of 4 | Figma-accurate. Permission request is TODO. |
| `app/(onboarding)/location.tsx` | 3 of 4 | Figma-accurate. Permission request is TODO. |
| welcome-full, sign-in redesign, returning-user splash | — | Not started. |

### Shared scaffold

`src/components/onboarding/scaffold.tsx` — pattern header (30% top), 4-segment progress bar with gold for completed + surface/20 for remaining, back arrow, "STEP N OF M" label, Playfair title, optional body text, optional `children` slot (used by name screen for the input), primary pill button, optional secondary text-button, footer note.

### Welcome screen animation (Reanimated 4)

Shared values: `mosqueY`, `mosqueOpacity`, `mosqueColor`, `haloPulse`, `textOpacity`.

Timeline:
- t=0: halo + CTAs visible, text fades in at 300ms over 700ms.
- t=700ms: mosque starts sliding up (translateY 200 → 0, opacity 0 → 1, ease-out cubic, 1.4s).
- t=2100ms: mosque lands. Immediately: mosque color animates — holds gold `#B8922A` for 600ms, then transitions to dark `#071F18` over 2.2s (ease-in-out cubic). Same shared value drives the Arabic + "Welcome" text color (gold → cream `#FFFBF2`).
- t=2100–4900ms: halo breathes — 2 cycles of scale 1 → 1.08 → 1, each 1.4s, in/out quad. Stops exactly when color transition ends.

Mosque SVG `fill="#071A15"` was globally rewritten to `currentColor` so we can animate the whole silhouette via its `color` prop (wrapped in `Animated.createAnimatedComponent(Mosque)` with `useAnimatedProps`).

## Assets

- `assets/onboarding/mosque.svg` — dome + two minarets + crescent silhouette, 402×574 viewBox, all fills are `currentColor`.
- `assets/onboarding/pattern.svg` — Islamic geometric stars, 424×262 viewBox, linear gradient stops flipped so it reads **gold-at-top → transparent-at-bottom** (Figma export had it reversed).
- `react-native-svg-transformer` lets us `import Mosque from '.../mosque.svg'` and use as a component; TS types in `svg.d.ts`.

## Feedback memories (persist across all Sahla conversations)

- **No hardcoded brand values** — every color/tenant text goes through `MasjidConfig`. Three-question gate: "Would a masjid with a different brand want this different?" → if yes, token; if no (universal), inline.
- **Always double check** — re-read and verify code before reporting a task done. Build the UI in the simulator, don't just trust types.

## Outstanding TODOs

1. Install `expo-notifications` + `expo-location` and wire real permission requests in notifications.tsx and location.tsx.
2. Pull Figma design for the real **name** screen when it exists.
3. Build `welcome-full` portal transition screen.
4. Redesigned sign-in + returning-user "Welcome Back" splash.
5. MMKV + Zustand onboarding completion flag (mirror `src/stores/config-store.ts` pattern).
6. Remove the force-route `router.replace('/(onboarding)/welcome')` in `app/_layout.tsx` once auth gate is ready.
7. Consider adding a `SectionTitle` component (caps + bottom border, per brand guide) when we hit the first settings/profile section.
8. Decide whether to expose onboarding palette in DB (currently bundled defaults only).

## Gotchas already hit

- **NativeWind class cache**: after adding tokens to `tailwind.config.js`, always restart Metro with `npx expo start -c`. Otherwise new classes fall back to transparent.
- **react-native-svg-transformer**: also caches. `-c` usually solves; if not, `npx expo run:ios` for a native rebuild (needed after adding fonts).
- **Stray `</content>` tags**: several tool-generated files had trailing tags the editor didn't strip. If the app errors "Unexpected token `</content>`", grep the file and delete.
- **SVG single-fill convention**: mosque.svg relies on all paths using the same `currentColor`. If a future SVG has multiple colors, `currentColor` won't be enough — strip fills selectively.

## Plan file

Full original plan with details I haven't copied here: `/Users/ahmadhamoudeh/.claude/plans/abundant-waddling-forest.md`.

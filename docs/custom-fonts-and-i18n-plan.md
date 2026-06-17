# Plan: Per-Masjid Custom Fonts + User Language Selection (i18n + RTL)

**Status:** Proposed / not started
**Author:** drafted with Claude Code
**Last updated:** 2026-06-14

This doc covers two related features and the strategy for building them together:

1. **Custom fonts** — each masjid picks from a curated set of font themes; the
   choice is set by the masjid admin during onboarding (sahla-web) and stored on
   the `mosques` row, exactly like `brand_color` works today.
2. **Language selection (i18n)** — users choose a language on first load and can
   change it later in settings. **Includes Arabic, so full RTL layout support is
   in scope.**

> **Why one doc:** both features require a mechanical sweep across the same ~200
> screen/component files (fonts: replace hardcoded `fontFamily`; i18n: replace
> hardcoded strings). Doing them as a single coordinated pass is meaningfully
> cheaper than two separate sweeps. See [Shared Sweep Strategy](#shared-sweep-strategy).

---

## Table of contents

- [Current state](#current-state)
- [Feature 1 — Custom fonts](#feature-1--custom-fonts)
- [Feature 2 — Language selection (i18n + RTL)](#feature-2--language-selection-i18n--rtl)
- [Shared sweep strategy](#shared-sweep-strategy)
- [Effort estimates](#effort-estimates)
- [Open decisions](#open-decisions)

---

## Current state

### Fonts
- Loaded at startup in `app/_layout.tsx` via Expo `useFonts` (splash held until
  loaded):
  ```ts
  // app/_layout.tsx:162
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    CormorantGaramond_400Regular,
    UthmanicHafs: require('../assets/fonts/UthmanicHafs_V22.ttf'),
  });
  ```
- Bundled families: Playfair Display, Cormorant Garamond, Inter, Amiri (Google
  Fonts packages) + `UthmanicHafs_V22.ttf` (Quran font) in `assets/fonts/`.
- **Application is fragmented**: ~70 files reference fonts directly — hardcoded
  names (`PlayfairDisplay_500Medium`, `CormorantGaramond_500Medium`) or inline
  `Platform.select({ ios: 'SF Pro Text', android: 'Roboto' })`. `components/themed-text.tsx`
  exists but is barely used and doesn't manage font family. **There is no single
  switch to flip.**

### Multi-tenant config (the rails both features reuse for masjid-level settings)
- Bundled config → Supabase `mosques` row override → merged → cached in MMKV.
- Type: `src/config/types.ts` (`MasjidConfig`).
- Remote merge: `src/providers/config-provider.tsx`.
- CSS-variable injection: `src/components/theme-root.tsx` (colors today).
- Tailwind tokens: `tailwind.config.js` (colors only; **no `fontFamily` block yet**).

### i18n
- **No i18n library installed.** No translation files. ~400–450 hardcoded
  English strings across ~198 files.
- Onboarding **already collects** a language choice but it is **inert** (stored,
  never applied):
  ```ts
  // app/(onboarding)/confirm.tsx:18
  const LANGUAGES = ['English','Arabic','Urdu','Bengali','Turkish','Spanish','French','Bosnian','Somali','Other'];
  // written via src/hooks/use-onboarding-submit.ts:65 → user_preferences.preferred_language
  ```
- `MasjidConfig.locale` exists but isn't wired to anything.
- Dates/times use `Intl` (good foundation) but hardcode `'en-US'` / `'en-CA'`.
- **RTL**: only the Quran reader screens (`SurahScreen`, `MushafPageScreen`,
  `PageTurnView`) handle RTL, as a special case. The main app assumes LTR.

---

## Feature 1 — Custom fonts

**Model:** curated picklist, set by masjid admin in onboarding/web, stored on
`mosques`. No runtime font downloading — all fonts are bundled, so startup stays
instant and there's no network/fallback risk.

### 1.1 Define font themes (design decision)
Pick 3–6 named themes, each a complete pairing so the whole app switches
coherently. The Quran/Arabic font (`UthmanicHafs`) stays **locked** regardless of
choice — masjids should not be able to break Arabic rendering.

| Theme key | Display / headings | Body / UI | Quran |
|---|---|---|---|
| `classic` (default) | Playfair Display | Inter | UthmanicHafs |
| `modern` | Inter | Inter | UthmanicHafs |
| `elegant` | Cormorant Garamond | Inter | UthmanicHafs |
| `…` | _TBD_ | _TBD_ | UthmanicHafs |

> All weights used by a theme must be bundled. Today the code assumes specific
> weights exist (`PlayfairDisplay_400Regular`, `_500Medium`, etc.) — each theme's
> required weights must be added to the `useFonts` call.

**Bringing in the fonts:**
- Prefer `@expo-google-fonts/*` packages where available (already the pattern) —
  add the package, import the weights, register in `useFonts`.
- For non-Google fonts, drop `.ttf`/`.otf` files into `assets/fonts/` and
  `require()` them like `UthmanicHafs`.
- Keep total bundle size in mind: only bundle weights a theme actually uses.

### 1.2 Config plumbing (small, low-risk)
- Add to `MasjidConfig` (`src/config/types.ts`):
  ```ts
  /** Font theme key, e.g. "classic" | "modern" | "elegant". Defaults to "classic". */
  fontTheme?: string;
  ```
  Also add `fontTheme` to `RemoteMasjidOverrides` (already a `Partial<Omit<...>>`,
  so it's picked up automatically once on `MasjidConfig`).
- Add a `font_theme text` column to the `mosques` table (**staging migration** —
  per the staging-only deploy rule).
- Read it in `src/providers/config-provider.tsx` alongside the other remote
  overrides (`app_name`, `brand_color`, …).

### 1.3 Central font tokens
Create a single source of truth mapping a theme key → font-family names, e.g.
`src/theme/fonts.ts`:
```ts
export const FONT_THEMES = {
  classic: { display: 'PlayfairDisplay_500Medium', body: 'Inter_400Regular', /* + weights */ },
  modern:  { display: 'Inter_600SemiBold',         body: 'Inter_400Regular' },
  elegant: { display: 'CormorantGaramond_500Medium', body: 'Inter_400Regular' },
} as const;
export const QURAN_FONT = 'UthmanicHafs'; // locked
```

### 1.4 Injection — two paths (pick one; can start lower-friction)
- **Lower-friction (recommended to start):** inject `--font-display` / `--font-body`
  as NativeWind CSS variables in `ThemeRoot` (mirror the color pattern), and add a
  `fontFamily` block to `tailwind.config.js`:
  ```js
  // tailwind.config.js → theme.extend
  fontFamily: {
    display: 'var(--font-display)',
    body: 'var(--font-body)',
  },
  ```
  Then components use `className="font-display"` / `font-body`. Allows incremental
  adoption — convert screens over time.
- **Cleaner long-term:** build an `<AppText variant="display|body">` wrapper and
  migrate to it. More upfront work, better forever. Can be layered on later.

### 1.5 The real work — centralization sweep
Replace the ~70 hardcoded `fontFamily` references and `Platform.select` font
blocks so they read from the central tokens / Tailwind classes. This is ~80% of
the feature's effort and is mechanical. **Do this in the same pass as the i18n
string sweep** — see below.

> **iOS caveat:** some screens hardcode native `SF Pro Text` / `SF Pro Display`.
> Custom fonts can't override native system fonts; those references just get
> replaced with the chosen theme font like everything else.

### 1.6 Admin UI (sahla-web repo)
A dropdown in onboarding with a live preview of each theme, writing `font_theme`
to the `mosques` row. Spans into sahla-web like the brand-color / business-ads
flows.

---

## Feature 2 — Language selection (i18n + RTL)

**Recommended stack:** `i18next` + `react-i18next` + `expo-localization`
(device-language auto-detect for a smart first-load default). Standard RN combo,
plays fine with the existing Zustand/MMKV pattern.

> **RTL is the cost driver.** Arabic (and Urdu) flip the entire layout. Building
> RTL into the foundation from day one is far cheaper than retrofitting it.

### Phase 1 — Foundation (no visible change)
- Install `i18next`, `react-i18next`, `expo-localization`.
- Create `locales/en.json` as the first catalog (English is the source of truth).
- Create a `language-store` (mirror `src/stores/config-store.ts`), persisted in
  MMKV. Hydrate from `user_preferences.preferred_language` on login; fall back to
  device locale, then `en`.
- Initialize i18next from the store at app entry.
- Wire `Intl.DateTimeFormat` / `toLocaleDateString` / `Intl.NumberFormat` calls
  (~12+) to read the active locale instead of hardcoded `'en-US'`. Update custom
  formatters (`formatTo12Hour`, `formatCountdown` in `use-prayer-times.ts`).

### Phase 2 — RTL plumbing
- Add at app entry: `I18nManager.allowRTL(true)` and `forceRTL(isRTL)`.
- **UX gotcha:** flipping RTL in React Native **requires an app reload** to fully
  apply. The language picker must handle this — a "restart to apply" prompt or an
  `expo-updates` reload. Design for this explicitly.
- Establish a logical-properties convention: `start`/`end`, `marginStart`/
  `marginEnd`, `paddingStart`/`paddingEnd` instead of `left`/`right`. NativeWind
  supports `rtl:` variants which helps.
- Audit the ~50–100 layout-bearing components: `flexDirection`, text alignment,
  padding/margins, directional icons (chevrons/back arrows), and navigation order.
- Quran screens already handle RTL — verify they still behave once app-wide RTL is on.

### Phase 3 — String extraction (the big sweep)
- Replace ~400–450 hardcoded strings with `t('key')` across ~198 files.
- Includes `Alert.alert` messages (~50–60).
- Mechanical and parallelizable. **Combine with the font sweep** (same files).
- Establish a key naming convention (e.g. `screen.section.label`).

### Phase 4 — Translation + pickers
- Get **human** Arabic translations (do not ship machine-translated Arabic in a
  religious app). Add `locales/ar.json`, etc.
- Build the **settings language picker** (currently missing) and the **first-load
  selector**. Reuse the existing onboarding `LANGUAGES` list.
- On change: update the store + `user_preferences.preferred_language`, and trigger
  reload if the RTL direction changed.
- Test on real devices in both directions.

### Backend (low effort, partly built)
- `user_preferences.preferred_language` already exists and is written at
  onboarding.
- Expand `useProfile()` to fetch it; add a `useUpdateLanguage()` mutation to sync
  changes. Optionally mirror to Clerk metadata for CRM.

---

## Shared sweep strategy

Phase 3 of i18n (string extraction) and step 1.5 of fonts (font centralization)
**edit the same ~200 files**. Do them together:

1. Land both foundations first (font tokens + Tailwind `fontFamily`; i18n init +
   `en.json` + language store). No screen changes yet.
2. Then do **one pass per file**: in each component, simultaneously
   - replace hardcoded `fontFamily` / `Platform.select` font blocks with
     `font-display` / `font-body` (or `<AppText>`), and
   - replace hardcoded user-facing strings with `t('key')`.
3. RTL audit can ride along in the same pass (swap `left`/`right` for logical
   props while you're in the file).

This turns three separate full-codebase sweeps into one.

---

## Effort estimates

Rough, single-developer; parallelizing the sweep shrinks the big items.

| Work | Estimate |
|---|---|
| **Fonts** — theme design + sourcing/bundling | ~0.5 day |
| **Fonts** — config plumbing (type, migration, provider, ThemeRoot, Tailwind) | ~0.5–1 day |
| **Fonts** — sweep (~70 refs) | folded into shared sweep |
| **Fonts** — sahla-web admin UI + preview | ~1–2 days |
| **i18n** — Phase 1 foundation | ~2–3 days |
| **i18n** — Phase 2 RTL plumbing + component audit | ~3–5 days |
| **i18n** — Phase 3 string sweep (~400–450 strings) | the bulk; ~1–1.5 weeks solo |
| **i18n** — Phase 4 translations (human Arabic) + pickers | ~1 week (translator-dependent) |
| **Shared sweep** (fonts + strings + RTL, one pass) | combined, see above |

**Ballpark for a solid MVP (English + Arabic, fonts live):** ~2.5–3.5 weeks of
eng work, plus translator turnaround. Additional languages are incremental after
the foundation exists.

---

## Open decisions

- [ ] Final list of font themes and the exact display/body pairings + weights.
- [ ] Font injection path: NativeWind CSS variables (incremental) vs `<AppText>`
      wrapper (cleaner). Recommendation: start with variables.
- [ ] Whether `font_theme` should ever be a *user* preference too, or masjid-only.
      (Current decision: masjid-only, set in onboarding.)
- [ ] Initial language set to ship (English + Arabic confirmed; which others first).
- [ ] RTL reload UX: in-app "restart to apply" prompt vs `expo-updates` reload.
- [ ] Translator/source for Arabic (and other) catalogs.

---

## Key file touchpoints (quick reference)

| Concern | File |
|---|---|
| Font loading / splash | `app/_layout.tsx` (≈162) |
| Font files | `assets/fonts/` |
| Config type | `src/config/types.ts` |
| Remote config merge | `src/providers/config-provider.tsx` |
| CSS-var injection | `src/components/theme-root.tsx` |
| Tailwind tokens | `tailwind.config.js` |
| Bundled tenant configs | `src/config/masjids/` |
| Onboarding language list | `app/(onboarding)/confirm.tsx` (≈18) |
| Language write | `src/hooks/use-onboarding-submit.ts` (≈65) |
| Prayer time formatters | `src/hooks/use-prayer-times.ts` |
| Quran RTL precedent | `SurahScreen.tsx`, `MushafPageScreen.tsx`, `PageTurnView.tsx` |

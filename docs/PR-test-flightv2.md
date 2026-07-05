# test-flightv2 → temur-dev

Lands the i18n/RTL + Quran-reader work onto `temur-dev` for a new TestFlight
build. Branches diverged (test-flightv2 +5 / temur-dev +5 from base `cbea56a`),
but a trial merge is **conflict-free** — `permission-prompt.tsx` auto-merges.
The merge also pulls in temur-dev's 5 commits (incl. `fix: added notification
logic` + test-flightv1 PR merges #24/25/27/28). The 1.5M-line diff is almost
entirely the 604 bundled mushaf `.qsvg` page files (data, not logic).

## What's included

### 🌍 Internationalization + full RTL (new)
- 7 languages: English, العربية (Arabic), Türkçe, Español, Bosanski, Shqip, اردو (Urdu)
- Arabic + Urdu render full right-to-left; one Arabic-capable font (IBM Plex Sans Arabic) for RTL UI
- Language selector sheet in Profile → APP, with restart prompt on LTR↔RTL flips
- `i18next` + `react-i18next` + `expo-localization`; ~815 keys/locale
- ⚠️ Translations are machine-generated — pending native-speaker QA before public release

### 📖 Quran reader
- iOS-native page-curl (Apple Books style) via a `UIPageViewController` module (`modules/ios-page-curl/`)
- Reader chrome tap-toggle; bundled mushaf SVG pages (604) + bbox registry
- Android keeps the existing Skia curl

### 🎨 Per-masjid font themes
- classic / modern / elegant, driven by `mosques.font_theme`

### 💳 Ads, payments & Stripe
- Per-account Stripe customers (multi-tenant fix)
- Admin ad timing + payment history; ad payments & admin reporting

### 🧭 Discover / programs
- Admin-managed program category cards + content filtering

### 👤 Profile
- Date-of-birth field (native picker); Bunny avatar/photo uploads; saved-clips filters

### 🔔 Notifications & infra
- Notification permission prompt on main tabs
- EAS Update support; runtime/pods updates

### 🗄️ Backend (already applied to staging)
- 9 migrations (program categories, ad payments, DOB, Stripe-per-account, storage buckets, …)
- Edge functions: stripe-customer, upload-content-image / -profile-pic / -speaker-photo, notify-mosque-live, payment fns

## Build / release checklist
- [ ] `npm install`
- [ ] `cd ios && pod install` → expect `Installing IOSPageCurlPoc`
- [ ] Fresh **native** EAS build (NOT an OTA update — this adds native code: `expo-localization` + `ios-page-curl`)
- [ ] Confirm Supabase migrations/edge functions are deployed to **staging** (deployments target staging only)
- [ ] Smoke test: language switch + Arabic RTL; Quran reader (iOS curl + Android Skia)

## Known limitations
- Machine-translated locales — native QA pending
- Android Quran reader stays on Skia (no Apple-equivalent curl API)
- Urdu uses Naskh (IBM Plex Arabic), not Nastaliq

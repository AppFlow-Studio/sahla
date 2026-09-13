# Going Live — Shipping a Masjid to the App Stores

The runbook for taking a mosque from **ready** in the CRM to **live** on the
App Store / Play Store. It picks up where [`adding-a-new-masjid.md`](./adding-a-new-masjid.md)
(repo scaffolding) leaves off, and assumes the architecture in
[`white-label-architecture.md`](./white-label-architecture.md): one codebase,
one Clerk instance, one EAS project — each masjid is its own build (unique
bundle id + deep-link scheme) and its own Clerk **Organization**.

---

## TL;DR flow

1. Mosque flips to `live` → `notify-mosque-live` fires → GitHub Action runs
   `generate-tenant.mjs` (repo config) **and** `provision-tenant.mjs` (Clerk +
   Apple) → opens a **tenant PR**.
2. Review + merge the PR.
3. Register the bundle id under **Clerk → Native applications** (the one step
   with no API).
4. `eas build --profile <slug>-prod --platform ios,android`.
5. **Verify the built bundle id**, then `eas submit … --id <build>`.
6. Later JS-only changes: `MASJID_ID=<slug> eas update --channel <slug>-prod --environment production`.

---

## One-time setup (done once for the whole platform)

You do these **once**. New masjids do **not** repeat them.

| Area | What | Where |
| --- | --- | --- |
| Clerk prod instance | Deployed with custom domain `clerk.sahla.co` (certs deployed, not just DNS) | Clerk Dashboard |
| Google OAuth | One Google Cloud OAuth client; redirect URI = `https://clerk.sahla.co/v1/oauth_callback`; client id/secret pasted into Clerk | Google Cloud + Clerk |
| Apple SSO connection | Enable **Apple** as an SSO connection on the **prod** Clerk instance, with Services ID + Sign in with Apple key (`.p8`) + Team ID + Key ID (details: *Sign in with Apple* appendix) | Apple Developer + Clerk |
| Apple Pay | One **shared** merchant id `merchant.com.sahla` — register it in Apple, create its payment-processing cert, link it in Stripe (details: *Apple Pay* appendix) | Apple Developer + Stripe |
| Shared SSO redirect | `sahlaauth://oauth-callback` added to **Clerk → Native applications → Allowlist for mobile SSO redirect** (covers every tenant — see `src/lib/oauth-redirect.ts`) | Clerk Dashboard |
| EAS prod env | `EXPO_PUBLIC_*` prod values (Supabase, Clerk `pk_live`, Stripe `pk_live`) in the EAS **production** environment | `eas env:create --environment production …` |
| Prod Supabase ↔ Clerk | Clerk (prod) added as **Third-Party Auth** provider; edge-function secret `CLERK_SECRET_KEY = sk_live` | Supabase Dashboard + `supabase secrets set` |
| CI provisioning secrets | `CLERK_SECRET_KEY`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY`, `APPLE_TEAM_ID` | GitHub → repo → Settings → Secrets |

> **SSO + Apple Pay are one-time.** Because there's a single Clerk instance and a
> single FAPI, Google needs **no** per-masjid config, and Apple's SSO connection,
> `.p8`/Services ID, and the shared Apple Pay merchant id are all configured
> **once** for the whole platform. The only per-tenant repeat is registering the
> new bundle id: the Apple "Sign in with Apple" capability (automated by
> `provision-tenant.mjs`) and the bundle id under Clerk → Native applications
> (manual, step 3).

---

## Per-masjid go-live (repeatable)

### 1. Trigger provisioning
Flipping `mosques.onboarding_status = 'live'` fires `notify-mosque-live`, which
dispatches the **Generate masjid tenant** workflow. It runs:
- `generate-tenant.mjs` — writes `src/config/masjids/<slug>.ts`, the registry
  entry, the `BUILD_TIME_MASJIDS` name, and the `<slug>-prod` EAS profile.
- `provision-tenant.mjs` — ensures the Clerk org, allowlists the shared SSO
  redirect, and registers the iOS bundle id + Sign in with Apple (ASC API).

Then it opens a PR. (Manual re-run: `workflow_dispatch` with the slug, or
`node scripts/generate-tenant.mjs <slug>` + `node scripts/provision-tenant.mjs <slug>` locally.)

### 2. Review + merge the tenant PR
Check `src/config/masjids/<slug>.ts` branding and that the EAS profile's
`MASJID_ID` **exactly equals `mosques.slug`** (including any random suffix like
`-mt93mzuj`) — otherwise remote config never loads and the app falls back to
default branding.

### 3. Register the bundle id in Clerk (manual, ~30s)
**Clerk → Native applications →** add the iOS app: bundle id + Team ID
`R8467JY5X8`. No public API for this. **If skipped, clerk-js won't initialize
and the app is black after the splash.** This registration also lets Clerk
validate the `aud` of the native Sign-in-with-Apple identity token (the token's
`aud` is the bundle id) — without it, native Apple sign-in fails even when the
Apple connection is enabled.

### 4. App Store Connect / Play listings
`eas submit` will auto-create the App Store Connect app from the IPA's bundle
id, or create it yourself first for name/SKU control (Apple app names are
globally unique). For Android, create the Play listing with the package name.

### 5. Build
```bash
eas build --profile <slug>-prod --platform ios      # and android
```
Store builds pull the `production` EAS environment (prod backend). The profile
sets `MASJID_ID` (→ bundle id, branding) and, if the app was registered under a
pre-existing id, `IOS_BUNDLE_ID` / `ANDROID_PACKAGE`.

### 6. Verify the bundle id BEFORE submitting
`eas submit` resolves the target app from `app.config.ts`, **not** the IPA — so
verify what actually got built:
```bash
# download the .ipa artifact, then:
unzip -p <app>.ipa 'Payload/*.app/Info.plist' | plutil -extract CFBundleIdentifier raw -
# must equal the intended bundle id
```

### 7. Submit — always with `--id`, never `--latest`
```bash
eas submit --platform ios --profile <slug>-prod --id <build-id>
```
Pin `ascAppId` in the `submit.<slug>-prod` profile once the app exists so submit
can never drift to the wrong app.

### 8. OTA updates
JS-only changes ship without a rebuild. **Set `MASJID_ID` and pull the `production`
environment** — omit either and the update ships the default `sahla` tenant
(`app.config.ts` bakes `extra.masjidId` from the env, and the OTA overwrites the
manifest's `extra`) and/or inlines your local test-backend `EXPO_PUBLIC_*` keys:
```bash
MASJID_ID=<slug> eas update --channel <slug>-prod --environment production --message "…"
```
Only reaches builds on the same `runtimeVersion` (the `appVersion`, e.g. `1.0.8`).
Native changes (new bundle id, permissions, **Apple Pay merchant id**) are *not*
OTA-able — they need a rebuild. The tail warning `No compatible builds found for
the following fingerprints` is benign under the `appVersion` policy: delivery keys
on the version string, not the fingerprint.

---

## Gotchas (from real incidents)

- **`eas submit` picks the bundle id from `app.config.ts`, not the IPA.** Run
  without the profile env and it resolves to the default `com.sahla.sahla` and
  targets the wrong app. Fix: pin `ascAppId`, or prefix the command with
  `MASJID_ID=<slug> IOS_BUNDLE_ID=<id>`.
- **`--latest` grabs the newest build across all profiles** — submit with `--id`.
- **Merges can silently revert `eas.json` / `app.config.ts` overrides.** Always
  run the step-6 bundle-id check before submitting.
- **Black screen after splash = Clerk can't initialize** — bundle id not
  registered under Native applications, or the prod instance isn't fully deployed.
- **Build numbers**: a brand-new app starts at `1`; resubmits to an existing app
  need a higher build number. Bumping the marketing `version` (new
  `CFBundleShortVersionString`) lets the build number reset; resubmitting the
  *same* version needs `"autoIncrement": true` on the build profile (note:
  auto-increment can't reliably write back to a dynamic `app.config.ts` under
  `appVersionSource: "local"` — set `ios.buildNumber` explicitly, or switch to
  `appVersionSource: "remote"`).
- **`oauth_token_apple does not match … parameter strategy`**: Apple isn't enabled
  as an SSO connection on the Clerk instance the app talks to. Store apps use
  `pk_live` → the **prod** instance, but the connection is often set up on dev
  only. Server-side fix — no rebuild. (Email login still works, so only Apple breaks.)
- **Apple Pay fails while cards work**: the merchant id disagrees somewhere. It
  must be the shared `merchant.com.sahla` in **both** `app.config.ts` (native
  entitlement) and `app/_layout.tsx` (`StripeProvider`), and provisioned in Apple +
  Stripe. The entitlement is native → the fix is a **rebuild**, not an OTA.

---

## Appendix — App Store Connect API key (`ASC_*` secrets)

The provisioning script (and `eas submit`) authenticate to Apple with an App
Store Connect **API key**. You need three values: `ASC_KEY_ID`,
`ASC_ISSUER_ID`, and `ASC_PRIVATE_KEY` (the `.p8`).

### Generate the key
1. Sign in to **App Store Connect** as an **Account Holder** or **Admin**.
2. **Users and Access → Integrations** tab → **App Store Connect API** →
   **Team Keys**.
3. Click **+** (Generate API Key).
   - Name: e.g. `Sahla EAS Provisioning`.
   - Access: **Admin** (registering Bundle IDs and enabling capabilities needs
     Identifiers access; App Manager is enough for submit-only keys).
4. **Download the `.p8`** — you can only do this **once**. Store it in your
   password manager; don't commit it.

### Read off the three values
- **`ASC_KEY_ID`** — the ~10-char ID shown next to the key in the list
  (also in the filename `AuthKey_<KEYID>.p8`).
- **`ASC_ISSUER_ID`** — the UUID shown at the top of the Team Keys page (one per
  team, shared by all keys).
- **`ASC_PRIVATE_KEY`** — the contents of the `.p8` file.

### Put it in GitHub secrets
The `.p8` is multi-line PEM. Either paste it whole, or base64-encode it (the
script accepts both — it decodes if it doesn't see a `BEGIN` line):
```bash
base64 -i AuthKey_<KEYID>.p8 | pbcopy   # paste into the ASC_PRIVATE_KEY secret
```
Set `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY`, `APPLE_TEAM_ID`
(`R8467JY5X8`) under **GitHub → repo → Settings → Secrets and variables →
Actions**.

> EAS already manages its own ASC key for submissions ("EAS Submit …", stored on
> EAS servers and not downloadable). Generate a **separate** key for the
> provisioning script — you need the `.p8` in hand, which EAS-managed keys don't
> give you.

---

## Appendix — Sign in with Apple (Clerk SSO)

Native iOS uses Clerk's token flow (`useSignInWithApple` → `startAppleAuthenticationFlow`,
strategy `oauth_token_apple`); Android/web fall back to the browser redirect
(`oauth_apple`, via `sahlaauth://oauth-callback` — see `src/lib/oauth-redirect.ts`).
**One Clerk instance serves every tenant, so this is configured once.**

### Credentials (Apple account-level — reused across all apps)
Create these once at **developer.apple.com/account → Certificates, Identifiers &
Profiles**. They're tied to the Apple *account*, not an app, so one set signs for
every bundle id:

| Clerk field | Where in Apple |
| --- | --- |
| **Team ID** | Membership page — `R8467JY5X8` |
| **Services ID** (Client ID) | Identifiers → **+** → **Services IDs** → enable "Sign in with Apple" → Configure: domain `clerk.sahla.co`, Return URL = the one Clerk shows (`https://clerk.sahla.co/v1/oauth_callback`). Used **only** by the web/Android redirect flow. |
| **Key ID** + **Private key (`.p8`)** | **Keys** → **+** → check "Sign in with Apple" → Register → **download the `.p8` once** (Apple never shows it again). Key ID is the 10-char id next to the key. |

> Not the same `.p8` as the App Store Connect API key above — that one is under
> **Users & Access → Integrations**. Sign-in-with-Apple keys live under **Keys**.

### Wire it into Clerk (once)
**Prod instance** (`clerk.sahla.co` — confirm the instance switcher; this is the #1
mistake) → **Configure → SSO Connections → Apple → Use custom credentials** → paste
Services ID, Team ID, Key ID, `.p8`. Enabling the connection is what makes
`oauth_token_apple` an allowed strategy. If you already set Apple up on the **dev**
instance, copy the same four values across (only the `.p8` can't be re-downloaded).

### Per tenant (repeat at go-live)
The App ID's "Sign in with Apple" capability is enabled automatically by
`provision-tenant.mjs`; the bundle id under **Clerk → Native applications** is
manual (step 3). The native token's `aud` is the bundle id, so Clerk needs each one.

---

## Appendix — Apple Pay (Stripe)

Card payments work without any of this; **Apple Pay** needs a merchant id that agrees
in four places. Sahla uses **one shared merchant id `merchant.com.sahla`** for every
tenant (Apple lets one merchant id serve many bundle ids), so it's set up once.

| Place | Value | Set at |
| --- | --- | --- |
| `app.config.ts` `@stripe/stripe-react-native` plugin | `merchant.com.sahla` | build time (native entitlement) |
| `app/_layout.tsx` `StripeProvider` `merchantIdentifier` | `merchant.com.sahla` | runtime |
| Apple Developer → Identifiers → **Merchant IDs** | `merchant.com.sahla` + Apple Pay Payment Processing cert | manual, once |
| Stripe Dashboard → Apple Pay | merchant id registered + cert (Stripe issues the CSR you use in Apple) | manual, once |

Payments run through **Stripe Connect** (`stripeAccountId`), so the merchant id lives
on the **platform** Stripe account, not the mosque's connected account — one setup
covers every tenant's connected charges.

**The merchant id is baked into the native entitlement, so changing it needs a rebuild
+ resubmit — it can't be OTA'd.** A mismatch is silent: Apple Pay just fails while
card payments keep working.

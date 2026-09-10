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
6. Later JS-only changes: `eas update --channel <slug>-prod`.

---

## One-time setup (done once for the whole platform)

You do these **once**. New masjids do **not** repeat them.

| Area | What | Where |
| --- | --- | --- |
| Clerk prod instance | Deployed with custom domain `clerk.sahla.co` (certs deployed, not just DNS) | Clerk Dashboard |
| Google OAuth | One Google Cloud OAuth client; redirect URI = `https://clerk.sahla.co/v1/oauth_callback`; client id/secret pasted into Clerk | Google Cloud + Clerk |
| Apple SSO crypto | Services ID + Sign in with Apple key (`.p8`) + Team ID + Key ID | Apple Developer + Clerk |
| Shared SSO redirect | `sahlaauth://oauth-callback` added to **Clerk → Native applications → Allowlist for mobile SSO redirect** (covers every tenant — see `src/lib/oauth-redirect.ts`) | Clerk Dashboard |
| EAS prod env | `EXPO_PUBLIC_*` prod values (Supabase, Clerk `pk_live`, Stripe `pk_live`) in the EAS **production** environment | `eas env:create --environment production …` |
| Prod Supabase ↔ Clerk | Clerk (prod) added as **Third-Party Auth** provider; edge-function secret `CLERK_SECRET_KEY = sk_live` | Supabase Dashboard + `supabase secrets set` |
| CI provisioning secrets | `CLERK_SECRET_KEY`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY`, `APPLE_TEAM_ID` | GitHub → repo → Settings → Secrets |

> **Google is one-time.** Because Google SSO is browser-based through Clerk's
> single FAPI, new masjids need **no** Google config. Apple's `.p8`/Services ID
> are one-time too; only the per-bundle-id capability is repeated (automated).

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
and the app is black after the splash.**

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
JS-only changes ship without a rebuild:
```bash
eas update --channel <slug>-prod
```

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
  need `"autoIncrement": true` on the build profile.

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

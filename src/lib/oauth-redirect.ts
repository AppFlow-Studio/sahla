import * as AuthSession from 'expo-auth-session';

/**
 * Single, tenant-independent OAuth callback URL for Clerk SSO.
 *
 * Every masjid app registers the shared `sahlaauth` scheme (see `scheme` in
 * `app.config.ts`) alongside its per-tenant `sahla-<slug>` deep-link scheme.
 * Pointing every SSO flow at this one constant means Clerk's mobile-SSO
 * allowlist only ever needs `sahlaauth://oauth-callback` — added once, it
 * covers every current and future masjid, so shipping a new tenant needs no
 * Clerk redirect change.
 *
 * The redirect is captured by the auth session (ASWebAuthenticationSession /
 * Custom Tabs) that opened it, not by the app's deep-link handler, so the
 * shared scheme is unambiguous even with several masjid apps installed and
 * never routes through expo-router.
 */
export const OAUTH_REDIRECT_URL = AuthSession.makeRedirectUri({
  native: 'sahlaauth://oauth-callback',
});

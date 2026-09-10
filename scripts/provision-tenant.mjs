#!/usr/bin/env node
/**
 * Auth provisioner — the "go-live" companion to `generate-tenant.mjs`.
 *
 * `generate-tenant.mjs` makes the repo edits a masjid needs to *build*; this
 * makes the external-platform config a masjid needs to *sign in*. Both key off
 * a `mosques.slug` and are idempotent, so a mosque flipping to `live` can run
 * them back to back (see `.github/workflows/generate-tenant.yml`).
 *
 * What it does (each step is skipped cleanly if its credentials are absent):
 *   1. Clerk — ensure the tenant's Organization exists; write the id back to
 *      `mosques.clerk_org_id` so the app's `setActive({ organization })` works.
 *   2. Clerk — ensure the shared mobile-SSO redirect `sahlaauth://oauth-callback`
 *      is allowlisted. This is tenant-independent (see src/lib/oauth-redirect.ts)
 *      so it only ever creates the entry once; every later run is a no-op.
 *   3. Apple — register the iOS bundle id and enable "Sign in with Apple" via
 *      the App Store Connect API. (EAS also capability-syncs this at build time
 *      from the `usesAppleSignIn` entitlement, so this is belt-and-suspenders /
 *      lets submit skip the "create app" prompt.)
 *
 * What it can NOT do (no public API): register the bundle id under Clerk's
 * "Native applications" page — the one gate that, if missing, leaves the app on
 * a black screen after the splash. It's printed as the single manual step.
 *
 * Usage:  node scripts/provision-tenant.mjs <slug>
 *
 * Env (falls back to .env):
 *   SUPABASE_URL, SUPABASE_SECRET_KEY            (required — reads/writes the row)
 *   CLERK_SECRET_KEY                             (steps 1-2)
 *   ASC_KEY_ID, ASC_ISSUER_ID, ASC_PRIVATE_KEY   (step 3; .p8 contents, may be base64)
 *   APPLE_TEAM_ID                                (fallback if mosques.apple_team_id is null)
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Tenant-independent OAuth redirect — mirrors src/lib/oauth-redirect.ts. */
const SHARED_REDIRECT_URL = 'sahlaauth://oauth-callback';

// --- tiny .env loader (no dep), same contract as generate-tenant.mjs --------
function loadEnv() {
  const out = { ...process.env };
  const envPath = join(ROOT, '.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && out[m[1]] === undefined) out[m[1]] = m[2];
    }
  }
  return out;
}

// --- Supabase --------------------------------------------------------------
async function fetchMosque(env, slug) {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SECRET_KEY');
  const res = await fetch(
    `${url}/rest/v1/mosques?slug=eq.${encodeURIComponent(slug)}&select=*`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  if (!rows.length) throw new Error(`No mosque with slug "${slug}"`);
  return { row: rows[0], url, key };
}

async function patchMosque(sb, slug, patch) {
  const res = await fetch(`${sb.url}/rest/v1/mosques?slug=eq.${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: {
      apikey: sb.key,
      Authorization: `Bearer ${sb.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${res.status}: ${await res.text()}`);
}

// --- Clerk -----------------------------------------------------------------
const clerk = (secret) => async (method, path, body) => {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`Clerk ${method} ${path} → ${res.status}: ${text}`);
  return data;
};

async function ensureClerkOrg(api, mosque, sb, slug) {
  if (mosque.clerk_org_id) {
    // Verify it still exists; onboarding usually created it already.
    try {
      await api('GET', `/organizations/${mosque.clerk_org_id}`);
      return { id: mosque.clerk_org_id, created: false };
    } catch {
      /* fall through and recreate */
    }
  }
  const name = mosque.app_name || mosque.name || slug;
  const org = await api('POST', '/organizations', { name, slug });
  await patchMosque(sb, slug, { clerk_org_id: org.id });
  return { id: org.id, created: true };
}

async function ensureRedirectUrl(api) {
  const existing = await api('GET', '/redirect_urls');
  const list = Array.isArray(existing) ? existing : existing?.data ?? [];
  if (list.some((r) => r.url === SHARED_REDIRECT_URL)) return { created: false };
  await api('POST', '/redirect_urls', { url: SHARED_REDIRECT_URL });
  return { created: true };
}

// --- App Store Connect -----------------------------------------------------
/** ES256 JWT for the ASC API. `dsaEncoding: 'ieee-p1363'` yields the raw r||s JOSE signature. */
function ascToken({ keyId, issuerId, privateKey }) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'ES256', kid: keyId, typ: 'JWT' });
  const body = b64({ iss: issuerId, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' });
  const sig = crypto
    .sign('sha256', Buffer.from(`${head}.${body}`), { key: privateKey, dsaEncoding: 'ieee-p1363' })
    .toString('base64url');
  return `${head}.${body}.${sig}`;
}

const asc = (token) => async (method, path, body) => {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`ASC ${method} ${path} → ${res.status}: ${text}`);
  return data;
};

async function ensureBundleAndAppleSignIn(api, { bundleId, name }) {
  const found = await api(
    'GET',
    `/v1/bundleIds?filter[identifier]=${encodeURIComponent(bundleId)}&limit=1`,
  );
  let id = found.data?.[0]?.id;
  let created = false;
  if (!id) {
    const res = await api('POST', '/v1/bundleIds', {
      data: {
        type: 'bundleIds',
        attributes: { identifier: bundleId, name: name.slice(0, 50), platform: 'IOS' },
      },
    });
    id = res.data.id;
    created = true;
  }
  // Enable Sign in with Apple (ignore "already exists" style conflicts).
  let capability = 'added';
  try {
    await api('POST', '/v1/bundleIdCapabilities', {
      data: {
        type: 'bundleIdCapabilities',
        attributes: { capabilityType: 'SIGN_IN_WITH_APPLE' },
        relationships: { bundleId: { data: { type: 'bundleIds', id } } },
      },
    });
  } catch (e) {
    capability = /409|already|exist/i.test(String(e)) ? 'already enabled' : `error: ${e.message}`;
  }
  return { created, capability };
}

// --- main ------------------------------------------------------------------
const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/provision-tenant.mjs <slug>');
  process.exit(1);
}

const env = loadEnv();
const sb = await fetchMosque(env, slug);
const mosque = sb.row;
const bundleId = mosque.bundle_id || `com.sahla.${slug}`;
const teamId = mosque.apple_team_id || env.APPLE_TEAM_ID || null;
const summary = [];

console.log(`\n▶ Provisioning auth for "${slug}" (${mosque.app_name || mosque.name})`);
console.log(`  bundle id: ${bundleId}\n`);

// 1 + 2. Clerk
if (env.CLERK_SECRET_KEY) {
  const api = clerk(env.CLERK_SECRET_KEY);
  const org = await ensureClerkOrg(api, mosque, sb, slug);
  summary.push(`Clerk org        : ${org.id} (${org.created ? 'created' : 'existing'})`);
  const rd = await ensureRedirectUrl(api);
  summary.push(`Clerk redirect   : ${SHARED_REDIRECT_URL} (${rd.created ? 'added' : 'already present'})`);
} else {
  summary.push('Clerk            : skipped (no CLERK_SECRET_KEY)');
}

// 3. Apple
if (env.ASC_KEY_ID && env.ASC_ISSUER_ID && env.ASC_PRIVATE_KEY) {
  let pk = env.ASC_PRIVATE_KEY;
  // Accept either raw PEM (with \n) or base64-encoded .p8.
  if (!pk.includes('BEGIN')) pk = Buffer.from(pk, 'base64').toString('utf8');
  pk = pk.replace(/\\n/g, '\n');
  const token = ascToken({ keyId: env.ASC_KEY_ID, issuerId: env.ASC_ISSUER_ID, privateKey: pk });
  const res = await ensureBundleAndAppleSignIn(asc(token), {
    bundleId,
    name: (mosque.app_name || mosque.name || slug).replace(/[^\w ]/g, ''),
  });
  summary.push(`Apple bundle id  : ${bundleId} (${res.created ? 'registered' : 'existing'})`);
  summary.push(`Sign in w/ Apple : ${res.capability}`);
} else {
  summary.push('Apple            : skipped (no ASC_* credentials)');
}

console.log(summary.map((l) => `  ✓ ${l}`).join('\n'));

console.log(`\n  ⚠ MANUAL (no public API): Clerk Dashboard → Native applications →`);
console.log(`    add iOS app  bundle "${bundleId}"  team "${teamId ?? '<APPLE_TEAM_ID>'}".`);
console.log(`    Without it, clerk-js won't initialize and the app is black after the splash.\n`);

import { useUser } from '@clerk/clerk-expo';
import { useEffect } from 'react';

import { useMasjidConfig } from './use-masjid-config';
import { useSupabase } from './use-supabase';
import { useOnboardingStore } from '../stores/onboarding-store';

// ── Types ────────────────────────────────────────────────────────────────────

/** Per-org onboarding data stored under `publicMetadata[orgId]`. */
type OrgOnboardingData = {
  onboarded: boolean;
  firstName: string;
  joinedAt?: string; // ISO 8601
};

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Syncs onboarding state between local MMKV and Clerk user publicMetadata.
 *
 * On boot: if a different user signed in (or stale data from a previous user
 * is in MMKV), atomically replaces the local store with the new user's state
 * from Clerk metadata. This prevents a new user from inheriting the previous
 * user's `complete: true` flag.
 *
 * After onboarding: `syncOnboardingToClerk()` writes the completion
 * status to Clerk via Edge Function so it persists across devices.
 *
 * Metadata is namespaced by org ID so the same user can onboard
 * separately per mosque.
 */
export function useOnboardingSync() {
  const { user } = useUser();
  const config = useMasjidConfig();
  const orgId = config.clerkOrgId;

  useEffect(() => {
    if (!user || !orgId) return;

    const { userId: storedUserId, complete: storedComplete } =
      useOnboardingStore.getState();

    // Same user, already onboarded locally — nothing to do
    if (user.id === storedUserId && storedComplete) return;

    // Check Clerk metadata for this user+org
    const raw = (user.publicMetadata ?? {}) as Record<string, any>;
    const orgData = raw[orgId] as OrgOnboardingData | undefined;

    if (user.id !== storedUserId) {
      // Different user (or pre-migration data with no userId) — atomic switch
      useOnboardingStore.getState().switchUser(user.id, {
        firstName: orgData?.firstName ?? '',
        complete: orgData?.onboarded ?? false,
      });
    } else if (orgData?.onboarded) {
      // Same user, not locally complete but Clerk says onboarded (new device)
      const { setFirstName, markComplete } = useOnboardingStore.getState();
      if (orgData.firstName) setFirstName(orgData.firstName);
      markComplete();
    }
  }, [user, orgId]);
}

// ── Write helper ─────────────────────────────────────────────────────────────

/**
 * Writes onboarding completion to Clerk user publicMetadata via Edge Function.
 * Call this in welcome-full.tsx after markComplete().
 */
export async function syncOnboardingToClerk(
  user: { id: string; publicMetadata: Record<string, any> },
  orgId: string | undefined,
  firstName: string,
  supabase: { functions: { invoke: (name: string, options: any) => Promise<any> } },
): Promise<void> {
  if (!orgId) return;

  try {
    const { error } = await supabase.functions.invoke('sync-onboarding', {
      body: { user_id: user.id, org_id: orgId, first_name: firstName },
    });

    if (error) {
      console.warn('[onboarding-sync] Edge Function error:', error);
    }
  } catch (err) {
    console.warn('[onboarding-sync] Failed to sync to Clerk:', err);
  }
}

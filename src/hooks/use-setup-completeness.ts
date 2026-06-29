import { useMemo } from 'react';

import { useProfile } from '@/src/hooks/use-profile';
import { useUserPreferences } from '@/src/hooks/use-user-preferences';
import { useNotificationStatus } from '@/src/hooks/use-notification-status';

export type SetupKey = 'profile' | 'personalization' | 'notifications';

export type SetupCompleteness = {
  profile: boolean;
  personalization: boolean;
  notifications: boolean;
  incompleteCount: number;
  /** First outstanding step in priority order — useful for "Complete Profile" routing. */
  firstIncomplete: SetupKey | null;
};

const nonEmpty = (s: string | null | undefined) => (s?.trim().length ?? 0) > 0;

/**
 * Single source of truth for "what's left for the user to set up." Drives:
 *  - the red "1" pills on each setup row in the Profile tab,
 *  - the aggregate count on the Profile bottom-nav icon,
 *  - whether the "Complete Profile" header CTA shows at all.
 *
 * Each predicate is conservative — when the upstream data is still loading we
 * treat the item as INCOMPLETE so the affordance shows by default rather than
 * flashing into existence after a delayed fetch.
 */
export function useSetupCompleteness(): SetupCompleteness {
  const { profile } = useProfile();
  const { preferences } = useUserPreferences();
  const { enabled: notificationsEnabled } = useNotificationStatus();

  return useMemo(() => {
    const profileComplete =
      !!profile &&
      nonEmpty(profile.first_name) &&
      nonEmpty(profile.last_name) &&
      nonEmpty(profile.phone_number) &&
      nonEmpty(profile.profile_pic);

    // Canonical RC-MA signal is `personalization_completed_at`. Fall back to
    // the per-field check when the flag is null AND a row exists — covers
    // accounts that finished the flow before the timestamp column shipped.
    const personalizationComplete = (() => {
      if (!preferences) return false;
      if (preferences.personalization_completed_at) return true;
      return (
        nonEmpty(preferences.gender) &&
        preferences.birth_year != null &&
        nonEmpty(preferences.islamic_knowledge_level) &&
        (preferences.attendance_reasons?.length ?? 0) >= 3
      );
    })();

    const notificationsComplete = notificationsEnabled;

    let incompleteCount = 0;
    if (!profileComplete) incompleteCount++;
    if (!personalizationComplete) incompleteCount++;
    if (!notificationsComplete) incompleteCount++;

    const firstIncomplete: SetupKey | null = !profileComplete
      ? 'profile'
      : !personalizationComplete
        ? 'personalization'
        : !notificationsComplete
          ? 'notifications'
          : null;

    return {
      profile: profileComplete,
      personalization: personalizationComplete,
      notifications: notificationsComplete,
      incompleteCount,
      firstIncomplete,
    };
  }, [profile, preferences, notificationsEnabled]);
}

import { useNotificationStatusStore } from '@/src/stores/notification-status-store';
import { useTutorialStore } from '@/src/stores/tutorial-store';

export type ProfileNudges = {
  /** Notifications aren't enabled (OS permission not granted, once known). */
  notifications: boolean;
  /** User was shown the tour but didn't finish it. */
  tutorial: boolean;
  /** Number of active nudges (0–2). */
  count: number;
  /** Whether any nudge is active (drives the Profile tab-bar dot). */
  any: boolean;
};

/**
 * The "finish setting up" nudges surfaced on the Profile screen:
 *   - `notifications` — notifications aren't enabled (drives the Profile enable
 *     card); shows whenever the OS permission isn't granted.
 *   - `tutorial` — the tour was shown but not finished.
 * Fully reactive — each clears the moment the user resolves it (enables
 * notifications / finishes the tour).
 */
export function useProfileNudges(): ProfileNudges {
  const permission = useNotificationStatusStore((s) => s.permission);
  const seen = useTutorialStore((s) => s.seen);
  const completed = useTutorialStore((s) => s.completed);

  // Notifications: simply not enabled. `unknown` means we haven't read the OS
  // status yet — don't show on a guess, only once we know they're off.
  const notifications = permission !== 'granted' && permission !== 'unknown';
  // Tutorial: they've been shown the tour but didn't reach the end.
  const tutorial = seen && !completed;

  const count = (notifications ? 1 : 0) + (tutorial ? 1 : 0);
  return { notifications, tutorial, count, any: count > 0 };
}

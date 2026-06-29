import { useNotificationStatusStore } from '@/src/stores/notification-status-store';
import { useTutorialStore } from '@/src/stores/tutorial-store';

export type ProfileNudges = {
  /** User skipped/denied notifications and they're still off. */
  notifications: boolean;
  /** User was shown the tour but didn't finish it. */
  tutorial: boolean;
  /** Number of active nudges (0–2). */
  count: number;
  /** Whether any nudge is active (drives the Profile tab-bar dot). */
  any: boolean;
};

/**
 * The first-run "go back and finish setting up" nudges, surfaced as dots on the
 * Profile tab and the relevant Profile rows. A nudge only fires AFTER the user
 * has skipped the step in question, so we never badge something they were never
 * offered. Fully reactive — dots clear the moment the user resolves a step.
 */
export function useProfileNudges(): ProfileNudges {
  const promptSeen = useNotificationStatusStore((s) => s.promptSeen);
  const permission = useNotificationStatusStore((s) => s.permission);
  const seen = useTutorialStore((s) => s.seen);
  const completed = useTutorialStore((s) => s.completed);

  // Notifications: they answered the soft prompt but notifications still aren't
  // on. `unknown` means we haven't read the OS status yet — don't badge on a guess.
  const notifications =
    promptSeen && permission !== 'granted' && permission !== 'unknown';
  // Tutorial: they've been shown the tour but didn't reach the end.
  const tutorial = seen && !completed;

  const count = (notifications ? 1 : 0) + (tutorial ? 1 : 0);
  return { notifications, tutorial, count, any: count > 0 };
}

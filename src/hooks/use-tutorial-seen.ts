import { useTutorialStore } from '@/src/stores/tutorial-store';

/**
 * Convenience accessor for the first-run walkthrough "seen" flag and its
 * mutators. Thin wrapper over `tutorial-store` so call sites read like the rest
 * of the hooks layer:
 *
 *   const { seen, markSeen, replay } = useTutorialSeen();
 *
 * `seen` is reactive — flipping it (via `replay()` from the Profile row, or
 * `markSeen()` when the tour finishes) re-renders any subscribed component,
 * including the mounted `AppTutorial` overlay.
 */
export function useTutorialSeen() {
  const seen = useTutorialStore((s) => s.seen);
  const markSeen = useTutorialStore((s) => s.markSeen);
  const replay = useTutorialStore((s) => s.replay);
  return { seen, markSeen, replay };
}

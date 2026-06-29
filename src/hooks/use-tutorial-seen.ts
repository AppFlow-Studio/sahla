import { useTutorialStore } from '@/src/stores/tutorial-store';

/**
 * Convenience accessor for the first-run walkthrough "seen" flag and its
 * mutators. Thin wrapper over `tutorial-store` so call sites read like the rest
 * of the hooks layer:
 *
 *   const { seen, completed, complete, skip, replay } = useTutorialSeen();
 *
 * Everything is reactive — flipping `seen` (via `replay()` from the Profile
 * row, or `complete()`/`skip()` when the tour ends) re-renders any subscribed
 * component, including the mounted `AppTutorial` overlay and the nudge dots.
 */
export function useTutorialSeen() {
  const seen = useTutorialStore((s) => s.seen);
  const completed = useTutorialStore((s) => s.completed);
  const complete = useTutorialStore((s) => s.complete);
  const skip = useTutorialStore((s) => s.skip);
  const replay = useTutorialStore((s) => s.replay);
  return { seen, completed, complete, skip, replay };
}

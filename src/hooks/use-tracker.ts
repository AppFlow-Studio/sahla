import { useEffect, useState } from 'react';
import { subscribe } from '../lib/quran-tracker';

/**
 * Bumps a version counter every time the tracker store mutates. Consumers
 * read the getters they need inside `useMemo([version])` to keep snapshot
 * identity stable between mutations.
 */
export function useTrackerVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);
  return version;
}

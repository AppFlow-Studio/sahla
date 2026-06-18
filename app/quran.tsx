import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

import { initQuranDb } from '@/src/db/quranDb';
import { getLastViewed, type LastViewed } from '@/src/lib/quran-tracker';
import QuranScreen from '@/src/screens/QuranScreen';

// Root-level full-screen Quran reader, opened from the Home "Quran" quick
// action. Lives outside the tab group so it presents over the whole app (with
// its own close button) and resumes at the last-viewed page, rather than
// deep-linking into a tab.
export default function QuranRoute() {
  const [initial] = useState<LastViewed | null>(() => getLastViewed());

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      initQuranDb().catch(() => {});
    });
    return () => handle.cancel();
  }, []);

  return <QuranScreen onClose={() => router.back()} initial={initial} />;
}

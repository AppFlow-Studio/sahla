import type { MasjidConfig } from '@/src/config/types';
import { useConfigStore } from '@/src/stores/config-store';

/**
 * Read-only accessor for the active masjid config. Subscribes the caller to
 * changes so a remote override triggers a re-render.
 */
export function useMasjidConfig(): MasjidConfig {
  return useConfigStore((s) => s.config);
}

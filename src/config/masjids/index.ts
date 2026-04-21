import type { MasjidConfig } from '../types';
import { masSiConfig } from './mas-si';
import { sahlaConfig } from './sahla';

/**
 * Registry of every tenant whose bundled default config ships in this repo.
 * To add a new masjid: drop a file next to this one, import it here, and add
 * a matching EAS build profile in `eas.json`.
 */
export const masjidRegistry: Record<string, MasjidConfig> = {
  [sahlaConfig.id]: sahlaConfig,
  [masSiConfig.id]: masSiConfig,
};

export { masSiConfig, sahlaConfig };

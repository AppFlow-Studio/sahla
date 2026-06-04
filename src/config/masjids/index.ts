import type { MasjidConfig } from '../types';
import { masCnjConfig } from './mas-cnj';
import { sahlaConfig } from './sahla';

/**
 * Registry of every tenant whose bundled default config ships in this repo.
 * To add a new masjid: drop a file next to this one, import it here, and add
 * a matching EAS build profile in `eas.json`.
 */
export const masjidRegistry: Record<string, MasjidConfig> = {
  [sahlaConfig.id]: sahlaConfig,
  [masCnjConfig.id]: masCnjConfig,
};

export { masCnjConfig, sahlaConfig };

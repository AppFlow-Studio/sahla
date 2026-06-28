import type { MasjidConfig } from '../types';
import { masCnjConfig } from './mas-cnj';
import { sahlaConfig } from './sahla';
import { masBrooklynMqb18esxConfig } from './mas-brooklyn-mqb18esx';

/**
 * Registry of every tenant whose bundled default config ships in this repo.
 * To add a new masjid: drop a file next to this one, import it here, and add
 * a matching EAS build profile in `eas.json`.
 */
export const masjidRegistry: Record<string, MasjidConfig> = {
  [sahlaConfig.id]: sahlaConfig,
  [masCnjConfig.id]: masCnjConfig,
  [masBrooklynMqb18esxConfig.id]: masBrooklynMqb18esxConfig,
};

export { masBrooklynMqb18esxConfig, masCnjConfig, sahlaConfig };

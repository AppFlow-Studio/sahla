/**
 * MasjidConfig is the contract between the app shell and any tenant-specific
 * branding/feature data. The same shape is used by:
 *   - bundled default configs (src/config/masjids/*.ts)
 *   - the `public.mosques` row fetched from Supabase after login
 *   - the MMKV cache
 *
 * Keep this lean: if a field is only used by one screen, put it on a feature
 * config instead of polluting the top-level type.
 */

/**
 * Colors are stored as `"R G B"` space-separated triplets so they plug
 * directly into NativeWind's `rgb(var(--color-x) / <alpha-value>)` pattern
 * and support opacity modifiers (`bg-primary/50`).
 */
export type MasjidColors = {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  card: string;
  cardForeground: string;
  /** Deeper than primary; used for layering/depth overlays on the dark surfaces. */
  depth: string;
  /** True shadow color (used for drop shadows / cast shadows only). */
  shadow: string;
};

export type MasjidFeatures = {
  prayerTimes: boolean;
  events: boolean;
  donations: boolean;
  announcements: boolean;
  jumaahRegistration: boolean;
};

export type MasjidConfig = {
  /** Canonical slug. Matches the build-time MASJID_ID and `mosques.slug`. */
  id: string;
  displayName: string;
  tagline?: string;
  /** Remote URL; bundled configs may leave this undefined and use a local asset. */
  logoUrl?: string;
  colors: MasjidColors;
  features: MasjidFeatures;
  /** BCP-47 locale, e.g. "en", "ar", "en-US". */
  locale: string;
  /** IANA timezone, e.g. "America/New_York". Used for prayer time calculations. */
  timezone: string;
  /** Calculation method name, resolved by the prayer-times feature later. */
  prayerCalculationMethod?: string;
};

/**
 * Partial shape that the runtime can merge onto a bundled config after
 * fetching from Supabase. Every field is optional because the server may
 * only override a subset.
 */
export type RemoteMasjidOverrides = Partial<
  Omit<MasjidConfig, 'id' | 'colors' | 'features'>
> & {
  colors?: Partial<MasjidColors>;
  features?: Partial<MasjidFeatures>;
};

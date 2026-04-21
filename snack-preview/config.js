// Inline masjid config — no Zustand, no Supabase, no MMKV
export const COLORS = {
  primary: 'rgb(10, 38, 30)',
  primaryForeground: 'rgb(255, 251, 242)',
  accent: 'rgb(184, 146, 42)',
  accentForeground: 'rgb(10, 38, 30)',
  background: 'rgb(255, 251, 242)',
  foreground: 'rgb(10, 38, 30)',
  muted: 'rgb(241, 237, 228)',
  mutedForeground: 'rgb(92, 110, 103)',
  border: 'rgb(221, 216, 209)',
  card: 'rgb(255, 251, 242)',
  cardForeground: 'rgb(10, 38, 30)',
  depth: 'rgb(7, 31, 24)',
  shadow: 'rgb(0, 0, 0)',
};

// Alpha variants
export function withAlpha(rgbString, alpha) {
  return rgbString.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
}

export const CONFIG = {
  id: 'sahla',
  displayName: 'Sahla Demo Masjid',
  tagline: 'A sample tenant for local development',
  timezone: 'America/New_York',
};

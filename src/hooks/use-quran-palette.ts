import { useMemo } from 'react';
import { useMasjidConfig } from './use-masjid-config';

function rgb(triplet: string, alpha = 1) {
  const [r, g, b] = triplet.split(' ');
  return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type QuranPalette = {
  brandDark: string;
  cream: string;
  gold: string;
  goldTint: string;
  goldTint10: string;
  goldTint15: string;
  mutedInk: string;
  mutedLight: string;
  divider: string;
  divider08: string;
  track: string;
  backdrop: string;
  handleBg: string;
  faintText: string;
  faintTextDarker: string;
  veryLightBg: string;
  badgeBg: string;
  placeholderText: string;
  closeBtnBorder: string;
};

export function useQuranPalette(): QuranPalette {
  const { colors } = useMasjidConfig();
  return useMemo(
    () => ({
      brandDark: rgb(colors.primary),
      // Mushaf paper colour — overrides the per-masjid background so the
      // Quran reader has its own warm cream regardless of tenant theme.
      cream: '#f8f4e6',
      gold: rgb(colors.accent),
      goldTint: rgb(colors.accent, 0.2),
      goldTint10: rgb(colors.accent, 0.1),
      goldTint15: rgb(colors.accent, 0.15),
      mutedInk: rgb(colors.primary, 0.6),
      mutedLight: rgb(colors.primary, 0.4),
      divider: rgb(colors.primary, 0.1),
      divider08: rgb(colors.primary, 0.08),
      track: rgb(colors.primary, 0.08),
      backdrop: rgb(colors.primary, 0.18),
      handleBg: rgb(colors.primary, 0.25),
      faintText: rgb(colors.primary, 0.3),
      faintTextDarker: rgb(colors.primary, 0.35),
      veryLightBg: rgb(colors.primary, 0.03),
      badgeBg: rgb(colors.primary, 0.15),
      placeholderText: rgb(colors.primary, 0.35),
      closeBtnBorder: rgb(colors.primary, 0.2),
    }),
    [colors]
  );
}

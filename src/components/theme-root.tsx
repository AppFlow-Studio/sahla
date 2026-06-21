import { vars } from 'nativewind';
import { View } from 'react-native';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { resolveFontTheme } from '@/src/theme/fonts';

/**
 * Injects the active masjid's colors and font theme as NativeWind CSS
 * variables so every `className="bg-primary"` / `text-foreground` /
 * `font-display` / `font-body` resolves at runtime.
 *
 * Tailwind custom property names are kebab-case and consumed via
 * `rgb(var(--color-x) / <alpha-value>)` (colors) and `var(--font-x)`
 * (fonts) — see `tailwind.config.js`.
 */
export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const config = useMasjidConfig();
  const fonts = resolveFontTheme(config.fontTheme);

  const themeVars = vars({
    '--font-display': fonts.display,
    '--font-display-regular': fonts.displayRegular,
    '--font-body': fonts.body,
    '--font-body-medium': fonts.bodyMedium,
    '--font-body-semibold': fonts.bodySemibold,
    '--color-primary': config.colors.primary,
    '--color-primary-foreground': config.colors.primaryForeground,
    '--color-accent': config.colors.accent,
    '--color-accent-foreground': config.colors.accentForeground,
    '--color-background': config.colors.background,
    '--color-foreground': config.colors.foreground,
    '--color-muted': config.colors.muted,
    '--color-muted-foreground': config.colors.mutedForeground,
    '--color-border': config.colors.border,
    '--color-card': config.colors.card,
    '--color-card-foreground': config.colors.cardForeground,
    '--color-depth': config.colors.depth,
    '--color-onboarding-bg': config.colors.onboardingBackground,
    '--color-onboarding-surface': config.colors.onboardingSurface,
    '--color-onboarding-accent': config.colors.onboardingAccent,
    '--color-onboarding-halo-1': config.colors.onboardingHalo1,
    '--color-onboarding-halo-2': config.colors.onboardingHalo2,
    '--color-onboarding-halo-3': config.colors.onboardingHalo3,
    '--color-onboarding-layer': config.colors.onboardingLayer,
  });

  return (
    <View style={themeVars} className="flex-1 bg-background">
      {children}
    </View>
  );
}

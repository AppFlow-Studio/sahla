import type { MasjidConfig } from "./types";

/**
 * Neutral fallback config. Used when:
 *   - `MASJID_ID` is unset (local dev without explicit variant)
 *   - The bundled registry has no entry for the current `MASJID_ID`
 *   - A Supabase row omits a field that a screen needs
 */
export const defaultConfig: MasjidConfig = {
  id: "sahla",
  displayName: "Sahla",
  tagline: "Your masjid, in your pocket",
  colors: {
    primary: "10 38 30", //            #0A261E  brand primary (no pure black)
    primaryForeground: "255 251 242", //#FFFBF2  brand cream (no pure white)
    accent: "184 146 42", //           #B8922A  brand marigold
    accentForeground: "10 38 30", //   #0A261E  brand primary
    background: "255 251 242", //      #FFFBF2  brand cream
    foreground: "10 38 30", //         #0A261E  brand primary
    muted: "241 237 228", //           #F1EDE4  cream surface tint
    mutedForeground: "92 110 103", //  #5C6E67  corduroy / 60% primary
    border: "221 216 209", //          #DDD8D1
    card: "255 251 242", //            #FFFBF2  cream (no pure white)
    cardForeground: "10 38 30", //     #0A261E  brand primary
    depth: "7 31 24", //               #071F18  layering / depth on dark surfaces
    shadow: "0 0 0", //                #000000  shadow effect color (cast/drop shadows)
    onboardingBackground: "10 38 30", //   #0a261e  deep green
    onboardingSurface: "255 251 242", //   #fffbf2  cream
    onboardingAccent: "184 146 42", //     #b8922a  gold
    onboardingHalo1: "15 59 48", //        #0f3b30  outer halo
    onboardingHalo2: "20 80 63", //        #14503f  mid halo
    onboardingHalo3: "26 102 80", //       #1a6650  inner halo
    onboardingLayer: "7 31 24", //         #071F18  depth/layering (brand: darker than bg)
  },
  features: {
    prayerTimes: true,
    events: true,
    donations: false,
    announcements: true,
    jumaahRegistration: false,
  },
  locale: "en",
  timezone: "UTC",
  prayerCalculationMethod: "ISNA",
  clerkOrgId: "org_3CfxuY1bSbDRGv2y8LIcZRA6w7Q",
};

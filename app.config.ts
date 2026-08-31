import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Dynamic app config.
 *
 * Each masjid gets its own EAS build profile that sets `MASJID_ID` (see
 * `eas.json`). This file reads that env var to:
 *   1. Pick which bundled config ships in the binary (via `extra.masjidId`,
 *      consumed at runtime by `src/config/resolver.ts`).
 *   2. Set a unique `bundleIdentifier` / `package` so two variants can
 *      coexist on the same device / store.
 *   3. Set the display `name` from the tenant's branding.
 *
 * Expo's config evaluator runs this file in a restricted CJS context that
 * doesn't follow arbitrary TS imports, so the build-time tenant lookup below
 * is intentionally a plain inline map. The full runtime config (colors,
 * features, etc.) lives in `src/config/masjids/*.ts` and is read at runtime
 * via `src/config/resolver.ts`.
 *
 * Docs: https://docs.expo.dev/tutorial/eas/multiple-app-variants/
 */

type BuildTimeMasjid = { displayName: string };

const BUILD_TIME_MASJIDS: Record<string, BuildTimeMasjid> = {
  sahla: { displayName: "Sahla App" },
  "mas-cnj": { displayName: "MAS Central New Jersey" },
  "mas-brooklyn-mqb18esx": { displayName: "MAS BK" },
};

const MASJID_ID = process.env.MASJID_ID ?? "sahla";
const masjid = BUILD_TIME_MASJIDS[MASJID_ID] ?? { displayName: "Sahla" };

/** "10 38 30" -> "#0A261E" */
const tripletToHex = (triplet: string) =>
  "#" +
  triplet
    .trim()
    .split(/\s+/)
    .map((c) => Number(c).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

/**
 * Reads one color token out of the active tenant's runtime config so nothing
 * brand-related is written twice. The native chrome configured below (splash
 * background, notification tint, Android icon plate) has to be baked into the
 * binary, but it stays the *same* color the JS theme paints at runtime — a
 * masjid with a navy theme gets a navy splash, not Sahla's green.
 *
 * The evaluator can't follow TS imports (see the note above), so this reads
 * the file rather than importing it, and falls through to `default.ts` for any
 * token the tenant didn't override.
 */
function themeColor(token: string): string {
  const files = [
    join(process.cwd(), `src/config/masjids/${MASJID_ID}.ts`),
    join(process.cwd(), "src/config/default.ts"),
  ];
  for (const file of files) {
    try {
      const match = readFileSync(file, "utf8").match(
        new RegExp(`${token}:\\s*["']([\\d\\s]+)["']`),
      );
      if (match) return tripletToHex(match[1]);
    } catch {
      // Tenant has no bundled config file yet — fall through to the default.
    }
  }
  throw new Error(`app.config: no "${token}" color found for "${MASJID_ID}"`);
}

/** Matches the animated BootSplash background (`colors.onboardingBackground`). */
const SPLASH_BG = themeColor("onboardingBackground");
/** The masjid's brand color, used for native chrome outside the JS theme. */
const BRAND_COLOR = themeColor("primary");

const IOS_BUNDLE_ID = `com.sahla.${MASJID_ID}`;
const ANDROID_PACKAGE = `com.sahlaco.${MASJID_ID.replace(/-/g, "_")}`;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: masjid.displayName,
  slug: "sahla",
  version: "1.0.5",
  orientation: "portrait",
  icon: "./assets/images/sahla-logo-arabic.png",
  scheme: `sahla-${MASJID_ID}`,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  updates: {
    url: "https://u.expo.dev/f5b5a34b-5283-4351-9e3c-b1059c5671a0",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: IOS_BUNDLE_ID,
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: BRAND_COLOR,
      foregroundImage: "./assets/images/sahla-logo-arabic.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: ANDROID_PACKAGE,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "16.0",
        },
      },
    ],
    "expo-router",
    "expo-localization",
    "expo-sqlite",
    "expo-asset",
    "expo-apple-authentication",
    "@react-native-community/datetimepicker",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow $(PRODUCT_NAME) to access your photos to set your profile picture.",
        cameraPermission:
          "Allow $(PRODUCT_NAME) to access your camera to take a profile picture.",
      },
    ],
    "expo-video",
    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier: `merchant.${IOS_BUNDLE_ID}`,
        enableGooglePay: true,
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/sahla-logo-arabic.png",
        color: BRAND_COLOR,
      },
    ],
    [
      // The OS splash paints the masjid's brand color and nothing else — the
      // logo animation is owned by `src/components/boot-splash.tsx`, which
      // hides this one only after it has drawn its first frame.
      //
      // `image` is a deliberately blank transparent PNG rather than omitted:
      // prebuild always writes `windowSplashScreenAnimatedIcon =
      // @drawable/splashscreen_logo` into the Android theme, but only emits
      // that drawable when an image is configured. With no image the reference
      // dangles and `aapt2` fails the Android build with "resource
      // drawable/splashscreen_logo not found".
      "expo-splash-screen",
      {
        image: "./assets/images/splash-blank.png",
        imageWidth: 32,
        resizeMode: "contain",
        backgroundColor: SPLASH_BG,
        dark: {
          backgroundColor: SPLASH_BG,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "f5b5a34b-5283-4351-9e3c-b1059c5671a0",
    },
    masjidId: MASJID_ID,
    /** Read from `.env` when Metro / prebuild evaluates this file — reliable for dev bypass. */
    devBypassAuth: process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === "true",
  },
});

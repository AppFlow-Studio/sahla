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
  sahla: { displayName: "Sahla Demo Masjid" },
  "mas-cnj": { displayName: "MAS Central New Jersey" },
  "mas-brooklyn-mqb18esx": { displayName: "MAS BK" },
};

const MASJID_ID = process.env.MASJID_ID ?? "sahla";
const masjid = BUILD_TIME_MASJIDS[MASJID_ID] ?? { displayName: "Sahla" };

const IOS_BUNDLE_ID = `com.sahla.${MASJID_ID}`;
const ANDROID_PACKAGE = `com.sahla.${MASJID_ID.replace(/-/g, "_")}`;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: masjid.displayName,
  slug: "sahla",
  version: "1.0.3",
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
      backgroundColor: "#E6F4FE",
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
        color: "#0A261E",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
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

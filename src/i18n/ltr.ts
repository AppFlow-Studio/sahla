import { I18nManager } from 'react-native';

/**
 * Helpers for pinning a subtree to a left-to-right *visual* order even when the
 * app is running under `I18nManager.forceRTL` (see `./rtl.ts`).
 *
 * The home header is deliberately exempt from mirroring: its layout is a fixed
 * piece of masjid branding (logo + name, then the bell) and the prayer strip
 * always reads Fajr → Isha left-to-right, so it looks identical in every
 * language. Text inside it still translates normally.
 *
 * `row-reverse` is used instead of the `direction: 'ltr'` style prop because the
 * latter is iOS-only in React Native; reversing the flex axis works on both
 * platforms. `I18nManager.isRTL` is read once at module load, which is safe —
 * a direction change only takes effect after a full app reload.
 */

/** `flexDirection` that always renders children physically left-to-right. */
export const LTR_ROW = I18nManager.isRTL ? 'row-reverse' : 'row';

/** Cross-axis alignment that always resolves to the physical left edge. */
export const LTR_START = I18nManager.isRTL ? 'flex-end' : 'flex-start';

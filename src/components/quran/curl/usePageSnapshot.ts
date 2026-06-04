import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { makeImageFromView, type SkImage } from '@shopify/react-native-skia';

/**
 * Snapshots a referenced RN view into a Skia image. The consumer attaches the
 * returned `viewRef` to a `<View>` whose contents should be captured. The hook
 * (re)captures whenever `recaptureKey` changes.
 *
 * Page content (e.g. mushaf text loaded from sqlite) may arrive after the
 * initial render. We capture at three offsets so the latest pass replaces
 * any earlier "loading state" snapshot. Captures are fire-and-forget; the
 * latest non-null result wins.
 */
export function usePageSnapshot(recaptureKey: number | string | null) {
  const viewRef = useRef<View>(null);
  const [image, setImage] = useState<SkImage | null>(null);

  useEffect(() => {
    if (recaptureKey == null) {
      setImage(null);
      return;
    }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const capture = (attempt: number) => {
      if (cancelled || !viewRef.current) {
        console.log(`[curl-snapshot] page=${recaptureKey} attempt=${attempt} skip — no ref`);
        return;
      }
      const refForCapture = viewRef as unknown as React.RefObject<
        React.Component<unknown, unknown>
      >;
      makeImageFromView(refForCapture)
        .then((img) => {
          if (cancelled) return;
          if (!img) {
            console.log(`[curl-snapshot] page=${recaptureKey} attempt=${attempt} returned null`);
            return;
          }
          console.log(
            `[curl-snapshot] page=${recaptureKey} attempt=${attempt} ok ` +
              `(${img.width()}x${img.height()})`,
          );
          setImage(img);
        })
        .catch((err) => {
          console.log(`[curl-snapshot] page=${recaptureKey} attempt=${attempt} threw`, err);
        });
    };

    // First-paint, mid-load, settled. Three passes cover most timing of the
    // sqlite-driven mushaf page render.
    timers.push(setTimeout(() => capture(1), 80));
    timers.push(setTimeout(() => capture(2), 400));
    timers.push(setTimeout(() => capture(3), 1100));

    return () => {
      cancelled = true;
      for (const t of timers) clearTimeout(t);
    };
  }, [recaptureKey]);

  return { viewRef, image };
}

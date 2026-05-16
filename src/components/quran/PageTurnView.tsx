import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  BlurMask,
  Canvas,
  Group,
  Image as SkiaImage,
  ImageShader,
  Path,
  Skia,
  Vertices,
  type SkPoint,
} from '@shopify/react-native-skia';
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  bendVertex,
  computeFold,
  originCorner,
  progressFromTouch,
  project,
  shouldCommit,
} from './curl/curlMath';
import { usePageSnapshot } from './curl/usePageSnapshot';

export type PageTurnViewRef = {
  goToPage: (page: number) => void;
};

export type PageTurnViewProps = {
  pageNumber: number;
  totalPages: number;
  renderPage: (pageNumber: number) => ReactNode;
  direction?: 'rtl' | 'ltr';
  onPageChange: (newPage: number) => void;
  pageBackgroundColor?: string;
};

const COLS = 18;
const ROWS = 24;
const FOCAL_LENGTH = 1100;
const SHADOW_BLUR = 24;

export const PageTurnView = forwardRef<PageTurnViewRef, PageTurnViewProps>(
  function PageTurnView(
    {
      pageNumber,
      totalPages,
      renderPage,
      direction = 'rtl',
      onPageChange,
      pageBackgroundColor,
    },
    ref,
  ) {
    const [stage, setStage] = useState({ w: 0, h: 0 });
    const onLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      if (width !== stage.w || height !== stage.h) setStage({ w: width, h: height });
    };

    const prevNum = pageNumber - 1 >= 1 ? pageNumber - 1 : null;
    const nextNum = pageNumber + 1 <= totalPages ? pageNumber + 1 : null;

    const prev = usePageSnapshot(prevNum);
    const curr = usePageSnapshot(pageNumber);
    const next = usePageSnapshot(nextNum);

    useImperativeHandle(
      ref,
      () => ({ goToPage: (p: number) => onPageChange(p) }),
      [onPageChange],
    );

    // Gesture state — all UI thread
    const turnDir = useSharedValue<0 | 1 | -1>(0);
    const startY = useSharedValue(0);
    const touchX = useSharedValue(0);
    const touchY = useSharedValue(0);
    // Mirror layout dimensions to shared values so worklets see updated sizes
    // when the screen rotates or resizes.
    const pageWSV = useSharedValue(0);
    const pageHSV = useSharedValue(0);

    const [gestureActive, setGestureActive] = useState(false);
    const [activeDir, setActiveDir] = useState<0 | 1 | -1>(0);
    // Delayed-unmount handle. After commit we keep the Skia canvas mounted
    // for a beat so the live RN view of the new page can finish its sqlite
    // load + render before it takes over visibility — without this delay
    // the user sees a brief flash of the MushafPage spinner.
    const endTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onGestureStart = useCallback((dir: 1 | -1) => {
      if (endTimeoutRef.current) {
        clearTimeout(endTimeoutRef.current);
        endTimeoutRef.current = null;
      }
      setActiveDir(dir);
      setGestureActive(true);
    }, []);
    const onGestureEnd = useCallback(
      (delta: 0 | 1 | -1) => {
        if (delta !== 0) {
          const newPage = pageNumber + delta;
          if (newPage >= 1 && newPage <= totalPages) onPageChange(newPage);
        }
        if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
        // Commit: hold the canvas for ~220ms so the new MushafPage settles.
        // Spring-back: no delay needed, just clean up immediately.
        const holdMs = delta !== 0 ? 220 : 0;
        endTimeoutRef.current = setTimeout(() => {
          setGestureActive(false);
          setActiveDir(0);
          endTimeoutRef.current = null;
        }, holdMs);
      },
      [pageNumber, totalPages, onPageChange],
    );

    useEffect(() => {
      return () => {
        if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
      };
    }, []);

    const pageW = stage.w;
    const pageH = stage.h;
    useEffect(() => {
      pageWSV.value = pageW;
      pageHSV.value = pageH;
    }, [pageW, pageH, pageWSV, pageHSV]);

    const pan = useMemo(() => {
      return Gesture.Pan()
        .minDistance(2)
        // Only activate on dominantly-horizontal motion so the mushaf page's
        // ScrollView keeps owning vertical scroll.
        .activeOffsetX([-4, 4])
        .failOffsetY([-16, 16])
        .onStart((e) => {
          'worklet';
          if (pageW === 0) {
            turnDir.value = 0;
            return;
          }
          // Direction is decided from where the gesture starts on x-axis.
          // RTL forward = grab leading (left) edge → start on left half.
          // RTL backward = peel back the page on top → start on right half.
          const fromLeft = e.x < pageW / 2;
          const goingForward = direction === 'rtl' ? fromLeft : !fromLeft;
          const hasTarget = goingForward
            ? nextNum != null
            : prevNum != null;
          if (!hasTarget) {
            turnDir.value = 0;
            return;
          }
          const dir = goingForward ? 1 : -1;
          turnDir.value = dir;
          startY.value = e.y;
          touchX.value = e.x;
          touchY.value = e.y;
          runOnJS(onGestureStart)(dir);
        })
        .onUpdate((e) => {
          'worklet';
          if (turnDir.value === 0) return;
          touchX.value = e.x;
          touchY.value = e.y;
        })
        .onEnd((e) => {
          'worklet';
          if (turnDir.value === 0) return;
          const goingForward = turnDir.value === 1;
          const progress = progressFromTouch(e.x, pageW, direction);
          const effective = goingForward ? progress : 1 - progress;
          const commit = shouldCommit(effective, e.velocityX, direction);
          if (commit) {
            // Past threshold (>40% across or fast enough flick) → finish the
            // turn for the user. Spring touchX to the spine, then bump the
            // page number on completion.
            const targetX = goingForward
              ? direction === 'rtl' ? pageW : 0
              : direction === 'rtl' ? 0 : pageW;
            touchX.value = withSpring(
              targetX,
              { damping: 18, stiffness: 160, mass: 0.7 },
              () => {
                turnDir.value = 0;
                runOnJS(onGestureEnd)(goingForward ? 1 : -1);
              },
            );
          } else {
            // Released early → spring back to the leading edge, no page change.
            const restX = goingForward
              ? direction === 'rtl' ? 0 : pageW
              : direction === 'rtl' ? pageW : 0;
            touchX.value = withSpring(
              restX,
              { damping: 22, stiffness: 200, mass: 0.7 },
              () => {
                turnDir.value = 0;
                runOnJS(onGestureEnd)(0);
              },
            );
          }
        })
        .onFinalize(() => {
          'worklet';
          // Cancellation safety net — if the gesture aborts we still clear
          // the active flag so the live RN view becomes visible again.
          if (turnDir.value !== 0) {
            turnDir.value = 0;
            runOnJS(onGestureEnd)(0);
          }
        });
    }, [
      pageW,
      direction,
      prevNum,
      nextNum,
      onGestureStart,
      onGestureEnd,
      turnDir,
      startY,
      touchX,
      touchY,
    ]);

    // Origin corner: locked in y per gesture, x depends on direction
    const fold = useDerivedValue(() => {
      const dir = turnDir.value;
      const w = pageWSV.value;
      const h = pageHSV.value;
      if (dir === 0 || w === 0) {
        return computeFold(0, 0, 0, 0);
      }
      const goingForward = dir === 1;
      const origin = originCorner(startY.value, w, h, direction);
      const ox = goingForward
        ? origin.x
        : direction === 'rtl' ? w : 0;
      return computeFold(ox, origin.y, touchX.value, touchY.value);
    });

    // Front-side mesh: bent positions projected to 2D
    const frontVertices = useDerivedValue<SkPoint[]>(() => {
      const f = fold.value;
      const w = pageWSV.value;
      const h = pageHSV.value;
      const cx = w / 2;
      const cy = h / 2;
      const n = COLS * ROWS;
      const out = new Array<SkPoint>(n);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = (c / (COLS - 1)) * w;
          const y = (r / (ROWS - 1)) * h;
          const b = bendVertex(x, y, f);
          const p = project(b.x, b.y, b.z, FOCAL_LENGTH, cx, cy);
          out[r * COLS + c] = { x: p.x, y: p.y };
        }
      }
      return out;
    });

    // Per-vertex curl angle, used to mask the back-of-page render
    const angles = useDerivedValue<number[]>(() => {
      const f = fold.value;
      const w = pageWSV.value;
      const h = pageHSV.value;
      const out = new Array<number>(COLS * ROWS);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = (c / (COLS - 1)) * w;
          const y = (r / (ROWS - 1)) * h;
          const b = bendVertex(x, y, f);
          out[r * COLS + c] = b.theta;
        }
      }
      return out;
    });

    // Static UVs and triangle indices
    const textures = useMemo<SkPoint[]>(() => {
      if (pageW === 0) return [];
      const t: SkPoint[] = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          t.push({
            x: (c / (COLS - 1)) * pageW,
            y: (r / (ROWS - 1)) * pageH,
          });
        }
      }
      return t;
    }, [pageW, pageH]);

    const indices = useMemo<number[]>(() => {
      const idx: number[] = [];
      for (let r = 0; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS - 1; c++) {
          const tl = r * COLS + c;
          const tr = r * COLS + c + 1;
          const bl = (r + 1) * COLS + c;
          const br = (r + 1) * COLS + c + 1;
          idx.push(tl, tr, bl, tr, br, bl);
        }
      }
      return idx;
    }, []);

    // Mirrored UVs for the back-of-page texture pass — flips the U coord so
    // the front-page print appears horizontally reversed when sampled,
    // mimicking the way real Quran-paper print bleeds through to the back
    // (you'd see the text mirrored if you looked at the page from behind).
    const mirroredTextures = useMemo<SkPoint[]>(() => {
      if (pageW === 0) return [];
      const t: SkPoint[] = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          t.push({
            x: pageW - (c / (COLS - 1)) * pageW,
            y: (r / (ROWS - 1)) * pageH,
          });
        }
      }
      return t;
    }, [pageW, pageH]);

    // Back-of-page index buffer: subset of indices where ALL THREE corners
    // of the triangle wrap past 90°. We use index filtering instead of per-
    // vertex alpha because Skia's <Vertices> with `colors` doesn't honor
    // vertex alpha in this configuration — alpha-0 vertices render as
    // opaque white with the ColorShader base. Index filtering sidesteps
    // the issue: a triangle is either drawn (back side) or skipped (front).
    const backIndices = useDerivedValue<number[]>(() => {
      const a = angles.value;
      const HALF = Math.PI / 2;
      const result: number[] = [];
      for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];
        if (a[i0] > HALF && a[i1] > HALF && a[i2] > HALF) {
          result.push(i0, i1, i2);
        }
      }
      return result;
    });

    // Cast shadow: a soft path projected from the curl ridge onto the
    // background. Approximated by tracing the perimeter of the curling mesh.
    const shadowPath = useDerivedValue(() => {
      const f = fold.value;
      const verts = frontVertices.value;
      if (verts.length === 0 || f.R < 1e-2) return Skia.Path.Make();
      const path = Skia.Path.Make();
      // Top edge of mesh (row 0) projected as the shadow leading edge
      for (let c = 0; c < COLS; c++) {
        const v = verts[c];
        if (c === 0) path.moveTo(v.x, v.y + 4);
        else path.lineTo(v.x, v.y + 4);
      }
      // Bottom edge of mesh (last row) — close the shape
      for (let c = COLS - 1; c >= 0; c--) {
        const v = verts[(ROWS - 1) * COLS + c];
        path.lineTo(v.x, v.y + 4);
      }
      path.close();
      return path;
    });

    // Highlight along the cylinder apex (one R away from the fold midpoint
    // in the curl-normal direction). Project to screen-space so the
    // highlight visually rides the top of the bend.
    const highlightPath = useDerivedValue(() => {
      const f = fold.value;
      const w = pageWSV.value;
      const h = pageHSV.value;
      const path = Skia.Path.Make();
      if (f.R < 1e-2 || w === 0) return path;
      const cx = w / 2;
      const cy = h / 2;
      const apexX = f.midX + f.R * f.normalX;
      const apexY = f.midY + f.R * f.normalY;
      // z = R at the apex (theta = π/2)
      const proj = project(apexX, apexY, f.R, FOCAL_LENGTH, cx, cy);
      const len = Math.max(w, h) * 1.5;
      const x1 = proj.x - f.dirX * len;
      const y1 = proj.y - f.dirY * len;
      const x2 = proj.x + f.dirX * len;
      const y2 = proj.y + f.dirY * len;
      path.moveTo(x1, y1);
      path.lineTo(x2, y2);
      return path;
    });

    // The curling page is ALWAYS the current page being peeled off; what's
    // revealed beneath depends on direction (next page on forward turn, prev
    // page on backward turn).
    const bgImage = activeDir === -1 ? prev.image : next.image;
    const curlImage = curr.image;
    const showCanvas = gestureActive && pageW > 0 && curlImage != null;

    return (
      <View style={styles.root} onLayout={onLayout}>
        {/* Hidden snapshot stage for prev + next pages.
            They're laid out but pushed off-screen via translateX so RN still
            paints them and Skia can capture the rendered content. */}
        <View
          pointerEvents="none"
          style={[
            styles.hiddenStage,
            { width: pageW, height: pageH },
          ]}
        >
          {prevNum != null && pageW > 0 ? (
            <View
              ref={prev.viewRef}
              collapsable={false}
              style={[
                styles.snapshotBox,
                {
                  width: pageW,
                  height: pageH,
                  backgroundColor: pageBackgroundColor,
                },
              ]}
            >
              {renderPage(prevNum)}
            </View>
          ) : null}
          {nextNum != null && pageW > 0 ? (
            <View
              ref={next.viewRef}
              collapsable={false}
              style={[
                styles.snapshotBox,
                {
                  width: pageW,
                  height: pageH,
                  marginTop: pageH,
                  backgroundColor: pageBackgroundColor,
                },
              ]}
            >
              {renderPage(nextNum)}
            </View>
          ) : null}
        </View>

        {/* Live current page. Doubles as the snapshot source via curr.viewRef.
            We only hide it once the Canvas can actually render the curl —
            otherwise the user sees nothing until the snapshot lands. */}
        <View
          ref={curr.viewRef}
          collapsable={false}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: pageBackgroundColor },
            showCanvas ? styles.invisible : null,
          ]}
          pointerEvents={showCanvas ? 'none' : 'auto'}
        >
          {renderPage(pageNumber)}
        </View>

        {/* Skia overlay during gesture */}
        {showCanvas ? (
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Background page (revealed under the curl) */}
            {bgImage ? (
              <SkiaImage
                image={bgImage}
                x={0}
                y={0}
                width={pageW}
                height={pageH}
                fit="fill"
              />
            ) : null}

            {/* Soft cast shadow under the curl — opacity tuned for a
                tangible rolled-tube feel without darkening the underlying
                page too much. */}
            <Path path={shadowPath} color="rgba(0,0,0,0.42)" style="fill">
              <BlurMask blur={SHADOW_BLUR} style="normal" />
            </Path>

            {/* Front side of the curling page (texture from current snapshot) */}
            {curlImage ? (
              <Vertices
                vertices={frontVertices}
                textures={textures}
                indices={indices}
                mode="triangles"
              >
                <ImageShader
                  image={curlImage}
                  tx="clamp"
                  ty="clamp"
                  fit="fill"
                  rect={{ x: 0, y: 0, width: pageW, height: pageH }}
                />
              </Vertices>
            ) : null}

            {/* Back-of-page overlay: solid fill on the subset of triangles
                where all 3 corners are past 90°. Slightly darker than the
                front page colour so the rolled-tube reads as a separate
                surface even though both are warm cream. */}
            <Vertices
              vertices={frontVertices}
              indices={backIndices}
              mode="triangles"
              color="#e8dec5"
            />

            {/* Mirrored print bleeding through from the front — same texture
                with horizontally-flipped UVs, drawn at low opacity over the
                beige fill so the back of the page shows faint reversed Quran
                text (matches Revealed's see-through-paper look). */}
            {curlImage ? (
              <Group opacity={0.22}>
                <Vertices
                  vertices={frontVertices}
                  textures={mirroredTextures}
                  indices={backIndices}
                  mode="triangles"
                >
                  <ImageShader
                    image={curlImage}
                    tx="clamp"
                    ty="clamp"
                    fit="fill"
                    rect={{ x: 0, y: 0, width: pageW, height: pageH }}
                  />
                </Vertices>
              </Group>
            ) : null}

            {/* Specular highlight along the cylinder apex */}
            <Path
              path={highlightPath}
              style="stroke"
              strokeWidth={2}
              color="rgba(255,255,255,0.4)"
            >
              <BlurMask blur={3} style="solid" />
            </Path>
          </Canvas>
        ) : null}

        {/* Gesture detector covers entire page */}
        <GestureDetector gesture={pan}>
          <View style={StyleSheet.absoluteFill} />
        </GestureDetector>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  hiddenStage: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    transform: [{ translateX: -100000 }],
  },
  snapshotBox: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  invisible: { opacity: 0 },
});

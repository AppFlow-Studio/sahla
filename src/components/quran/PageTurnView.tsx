import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
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
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
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

    // 3-phase state machine drives canvas + live-view visibility:
    //   idle       — live view at full opacity; canvas unmounted
    //   dragging   — live view hidden; canvas mounted at opacity 1
    //   committing — live view at full opacity (new page rendering); canvas
    //                still mounted but its opacity is animating 1→0
    const [phase, setPhase] = useState<'idle' | 'dragging' | 'committing'>(
      'idle',
    );
    const [activeDir, setActiveDir] = useState<0 | 1 | -1>(0);

    // Drives the canvas wrapper's opacity. We can't smoothly mount/unmount
    // the Skia Canvas, so instead we keep it mounted through the commit and
    // fade an Animated.View wrapper around it.
    const canvasFadeOpacity = useSharedValue(0);
    const animatedCanvasStyle = useAnimatedStyle(() => ({
      opacity: canvasFadeOpacity.value,
    }));

    // Drives only the curl decoration's opacity (mesh + back + highlight +
    // shadow). bgImage stays at full opacity. On commit the curl fades out
    // first, revealing the next-page bgImage cleanly — without that, the
    // half-wrapped curl is still showing the OLD page's texture on the
    // right side of the screen when the spring lands, which reads as "the
    // page we're already on" right before the canvas hands off.
    const curlOpacity = useSharedValue(1);

    const onGestureStart = useCallback(
      (dir: 1 | -1) => {
        setActiveDir(dir);
        setPhase('dragging');
        // Snap both canvas + curl decoration to full opacity; also cancels
        // any in-flight commit fade if a new gesture starts during one.
        canvasFadeOpacity.value = 1;
        curlOpacity.value = 1;
      },
      [canvasFadeOpacity, curlOpacity],
    );

    // Spring-back complete (released early, no page change). Reset both
    // opacities so the next gesture starts fresh.
    const endGestureNoCommit = useCallback(() => {
      setActiveDir(0);
      setPhase('idle');
      canvasFadeOpacity.value = 0;
      curlOpacity.value = 1;
    }, [canvasFadeOpacity, curlOpacity]);

    // Final cleanup once the commit's canvas fade has finished — restore
    // curlOpacity to 1 so the next gesture starts with the curl visible.
    const finishCommit = useCallback(() => {
      setActiveDir(0);
      setPhase('idle');
      curlOpacity.value = 1;
    }, [curlOpacity]);

    const beginCommit = useCallback(
      (delta: 1 | -1) => {
        const newPage = pageNumber + delta;
        if (newPage >= 1 && newPage <= totalPages) onPageChange(newPage);
        setPhase('committing');
        // One quick parallel fade — curl + canvas both dissolve over the
        // same 120ms onto the live RN view (which has had the full spring
        // duration to start loading its new MushafPage). Total commit
        // phase post-spring ≈ 120ms, so a release feels like one
        // continuous turning motion rather than multiple sequential
        // phases.
        curlOpacity.value = withTiming(0, { duration: 120 });
        canvasFadeOpacity.value = withTiming(
          0,
          { duration: 120 },
          (finished) => {
            if (finished) {
              runOnJS(finishCommit)();
            }
          },
        );
      },
      [
        pageNumber,
        totalPages,
        onPageChange,
        canvasFadeOpacity,
        curlOpacity,
        finishCommit,
      ],
    );

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
            // Past threshold → spring touchX to the natural half-wrap
            // position at the spine. The curl decoration is then faded
            // out separately in beginCommit, so the page doesn't need to
            // be thrown off-screen to read as "turned".
            const targetX = goingForward
              ? direction === 'rtl' ? pageW : 0
              : direction === 'rtl' ? 0 : pageW;
            touchX.value = withSpring(
              targetX,
              { damping: 30, stiffness: 400, mass: 0.6 },
              () => {
                turnDir.value = 0;
                runOnJS(beginCommit)(goingForward ? 1 : -1);
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
                runOnJS(endGestureNoCommit)();
              },
            );
          }
        })
        .onFinalize(() => {
          'worklet';
          // Cancellation safety net — if the gesture aborts mid-flight (no
          // onEnd path taken) we still clear active state so the live RN
          // view becomes visible again.
          if (turnDir.value !== 0) {
            turnDir.value = 0;
            runOnJS(endGestureNoCommit)();
          }
        });
    }, [
      pageW,
      direction,
      prevNum,
      nextNum,
      onGestureStart,
      beginCommit,
      endGestureNoCommit,
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

    // Cast shadow: a stroked line along the curl's apex (the highest point
    // of the cylinder bend). Stroke width + BlurMask widen it into a soft
    // band — this is where a real curl casts its strongest shadow because
    // it's where the page is furthest off the surface below. Avoids the
    // self-intersecting polygon problem of tracing the full mesh outline.
    const shadowPath = useDerivedValue(() => {
      const f = fold.value;
      const h = pageHSV.value;
      const path = Skia.Path.Make();
      if (h === 0 || f.R < 1e-2) return path;
      // Apex (ground-projected): one R away from the fold midpoint in the
      // curl-normal direction.
      const apexX = f.midX + f.R * f.normalX;
      const apexY = f.midY + f.R * f.normalY;
      // Extend the line generously along the fold direction so it spans
      // the page even when the fold is angled (corner curl).
      const halfLen = h * 1.5;
      path.moveTo(apexX - f.dirX * halfLen, apexY - f.dirY * halfLen);
      path.lineTo(apexX + f.dirX * halfLen, apexY + f.dirY * halfLen);
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
    const showCanvas = phase !== 'idle' && pageW > 0 && curlImage != null;
    const isDragging = phase === 'dragging';

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
            Only hidden during 'dragging' — during 'committing' it stays at
            full opacity behind the fading canvas so the new page is fully
            in place by the time the fade completes. */}
        <View
          ref={curr.viewRef}
          collapsable={false}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: pageBackgroundColor },
            isDragging ? styles.invisible : null,
          ]}
          pointerEvents={isDragging ? 'none' : 'auto'}
        >
          {renderPage(pageNumber)}
        </View>

        {/* Skia overlay during gesture + commit fade */}
        {showCanvas ? (
          <Animated.View
            style={[StyleSheet.absoluteFill, animatedCanvasStyle]}
            pointerEvents="none"
          >
            <Canvas style={StyleSheet.absoluteFill}>
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

            {/* Curl decoration group — fades out on commit so the page
                doesn't get left as a half-wrapped tube on the right side
                of the screen. bgImage above stays at full opacity so the
                next-page snapshot remains during the dissolve. */}
            <Group opacity={curlOpacity}>
              {/* Soft cast shadow under the curl — a thick stroked line at
                  the apex, heavily blurred into a soft band. */}
              <Path
                path={shadowPath}
                style="stroke"
                strokeWidth={28}
                color="rgba(0,0,0,0.45)"
              >
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
                  where all 3 corners are past 90°. */}
              <Vertices
                vertices={frontVertices}
                indices={backIndices}
                mode="triangles"
                color="#e8dec5"
              />

              {/* Mirrored print bleeding through from the front */}
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
            </Group>
            </Canvas>
          </Animated.View>
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

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
const SHADOW_BLUR = 28;

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
    const startX = useSharedValue(0);
    const startY = useSharedValue(0);
    const touchX = useSharedValue(0);
    const touchY = useSharedValue(0);
    // Set to true while a commit/cancel spring is animating. Read by
    // onFinalize so it doesn't tear down state out from under the spring.
    const springInFlight = useSharedValue(false);
    // True once a fast-flick has handed off finger-tracking to the commit
    // spring mid-gesture. onUpdate and onEnd short-circuit while this is
    // set so neither the per-frame mesh update nor onEnd's commit/cancel
    // branch fight the in-flight auto-finish.
    const earlyCommitFired = useSharedValue(false);
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
    // Set true the moment a CANCEL spring starts. Tells the bgImage path
    // to render null even though activeDir is still 1, so the next-page
    // snapshot can't show through the collapsing mesh during the spring's
    // final approach (when R shrinks below the "still rendered as a
    // partial curl" threshold and the mesh briefly stops covering the
    // canvas).
    const [cancelInFlight, setCancelInFlight] = useState(false);

    const onGestureStart = useCallback((dir: 1 | -1) => {
      setActiveDir(dir);
      setPhase('dragging');
      setCancelInFlight(false);
    }, []);

    // Spring-back finished. No page change.
    //
    // For BACKWARD cancel we don't clear `turnDir`: the spring overshoots
    // off-screen, the mesh is rendered there until the canvas unmounts,
    // and clearing turnDir mid-flight would snap-flatten the mesh into
    // its (now-stale) backward texture on-screen for one frame.
    //
    // For FORWARD cancel we DO clear `turnDir`. As the spring approaches
    // the origin, R shrinks toward zero and the mesh collapses into a
    // tiny back-facing wad near the touch — bgImage (= next.image) then
    // shows through everywhere else, which reads as "the next page
    // flashes for a split second" right before doCancel unmounts the
    // canvas. Clearing turnDir flattens the mesh (R=0 → all vertices
    // back at z=0, covering the bgImage with the CURRENT page texture)
    // for the brief window between this worklet update and React
    // unmounting the canvas. The mesh's texture is `curr.image` so the
    // flat mesh is the same content the live view will show one frame
    // later — no visible texture change.
    const doCancel = useCallback(
      (wasForward: boolean) => {
        if (wasForward) {
          turnDir.value = 0;
        }
        setActiveDir(0);
        setPhase('idle');
        setCancelInFlight(false);
      },
      [turnDir],
    );

    // Commit spring finished — the page has actually visibly completed
    // its turn (mesh is off-screen for forward, fully flat for backward).
    // Now and only now do we swap pageNumber + tear down the canvas, so
    // the live view re-renders to the destination page seamlessly.
    // Same `turnDir` reasoning as doCancel above.
    const doCommit = useCallback(
      (delta: 1 | -1) => {
        const newPage = pageNumber + delta;
        if (newPage >= 1 && newPage <= totalPages) onPageChange(newPage);
        // For BACKWARD commit, clear turnDir so the fold derived value
        // immediately returns no-curl and the mesh snaps strictly flat at
        // z=0 with `curlImage` (= prev page = the destination) covering
        // the whole canvas. Without this, residual wrap vertices project
        // onto the left edge of screen and paint partial letters from the
        // top-left of the prev page's snapshot for one frame before the
        // canvas unmounts. Safe because curlImage is the same page the
        // live view will re-render to a moment later.
        //
        // For FORWARD commit we DON'T clear — there curlImage = curr.image
        // is the OLD current page, and snapping the mesh flat would flash
        // the old page for one frame before the canvas unmounts.
        if (delta === -1) {
          turnDir.value = 0;
        }
        setActiveDir(0);
        setPhase('idle');
      },
      [pageNumber, totalPages, onPageChange, turnDir],
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
          startX.value = e.x;
          startY.value = e.y;
          touchX.value = e.x;
          touchY.value = e.y;
          earlyCommitFired.value = false;
          runOnJS(onGestureStart)(dir);
        })
        .onUpdate((e) => {
          'worklet';
          if (turnDir.value === 0) return;
          if (earlyCommitFired.value) return;

          // Above ~2200 px/s the finger moves so fast per frame that the
          // mesh visibly steps and shadow/highlight/paper-edge derived
          // paths can't keep up — reads as buggy/glitchy. Hand off to the
          // same commit spring onEnd would have run so the page finishes
          // the turn smoothly while still respecting the flick's momentum.
          const FAST_FLICK_THRESHOLD = 2200;
          const goingForward = turnDir.value === 1;
          const commitSignPositive = goingForward
            ? direction === 'rtl'
            : direction === 'ltr';
          const isFastFlick = commitSignPositive
            ? e.velocityX > FAST_FLICK_THRESHOLD
            : e.velocityX < -FAST_FLICK_THRESHOLD;
          if (isFastFlick) {
            earlyCommitFired.value = true;
            // Anchor spring origin at the current finger position so the
            // hand-off is continuous (no visible jump backward). Honor
            // the live y too so a diagonal flick doesn't snap-flatten
            // the bend right before the auto-finish kicks in.
            touchX.value = e.x;
            touchY.value = e.y;
            const targetX = goingForward
              ? direction === 'rtl' ? pageW * 1.5 : -pageW * 0.5
              : direction === 'rtl' ? 0 : pageW;
            // Past ~2500 px/s the spring lands so fast we're back in the
            // per-frame-jump zone we're trying to avoid — defeats it.
            const SPRING_V_CAP = 2500;
            const cappedV = e.velocityX > SPRING_V_CAP
              ? SPRING_V_CAP
              : e.velocityX < -SPRING_V_CAP
                ? -SPRING_V_CAP
                : e.velocityX;
            springInFlight.value = true;
            touchX.value = withSpring(
              targetX,
              { damping: 25, stiffness: 220, mass: 0.7, velocity: cappedV },
              (finished) => {
                springInFlight.value = false;
                if (finished) {
                  runOnJS(doCommit)(goingForward ? 1 : -1);
                }
              },
            );
            return;
          }

          touchX.value = e.x;
          // touchY follows the finger so the fold actually reacts to
          // where the swipe is. The "wall pose" we're trying to avoid
          // is now prevented at the curl-amount level — R is driven by
          // horizontal drag only, so even if the finger goes
          // straight up/down, R stays at 0 and there's no curl to flip
          // vertical. Backward is unaffected (its fold derivation
          // hard-codes touch.y = startY for the vertical seam).
          touchY.value = e.y;
        })
        .onEnd((e) => {
          'worklet';
          if (turnDir.value === 0) return;
          // Fast-flick already handed off to the commit spring; let it land.
          if (earlyCommitFired.value) return;
          const goingForward = turnDir.value === 1;
          const progress = progressFromTouch(e.x, pageW, direction);
          const effective = goingForward ? progress : 1 - progress;
          const commit = shouldCommit(effective, e.velocityX, direction);
          if (commit) {
            // Forward (corner-peel): overshoot the spine by half a page
            // width so the curl mesh keeps translating after the natural
            // half-wrap position and visibly EXITS the screen — that's
            // the "page completes the turn" animation. Without overshoot
            // the spring just lands at the half-wrap and the dissolve
            // does all the work, which reads as a snap.
            //
            // Backward (vertical-seam sweep): target is the origin (0 in
            // RTL, pageW in LTR) so R → 0 and the mesh lands flat with
            // the incoming page fully covering the screen.
            const targetX = goingForward
              ? direction === 'rtl' ? pageW * 1.5 : -pageW * 0.5
              : direction === 'rtl' ? 0 : pageW;
            // Sequential commit: the spring drives the mesh from where the
            // finger let go to the fully-turned position, with the release
            // velocity carried into the spring so it feels continuous and
            // not like a canned animation. The page state swap (and the
            // canvas teardown) only fire from onAnimationEnd, so the mesh
            // visibly completes its turn BEFORE the page swap — that's
            // the missing completion animation.
            springInFlight.value = true;
            touchX.value = withSpring(
              targetX,
              {
                damping: 25,
                stiffness: 220,
                mass: 0.7,
                velocity: e.velocityX,
              },
              (finished) => {
                springInFlight.value = false;
                if (finished) {
                  runOnJS(doCommit)(goingForward ? 1 : -1);
                }
              },
            );
          } else {
            // Released before threshold — spring touch back so the fold
            // unwinds and the canvas can tear down on a fully-flat mesh.
            //
            // Forward: spring touchX AND touchY back to the gesture's
            // start point. Origin is at (0, startY), so when touch ==
            // (0, startY) we have R=0 and the mesh is genuinely flat
            // before doCancel unmounts the canvas. Without springing
            // touchY too, a residual fold of |touchY - startY|/π would
            // be left and you'd see a snap when the canvas disappears.
            //
            // Backward: overshoot past the entry edge so the wrap rolls
            // off-screen. touchY is locked to startY by the fold math
            // anyway, so no Y spring is needed.
            const restX = goingForward
              ? direction === 'rtl' ? 0 : pageW
              : direction === 'rtl' ? pageW * 1.5 : -pageW * 0.5;
            springInFlight.value = true;
            // Tell React to drop bgImage for the duration of the cancel
            // so the next-page snapshot can't peek through the collapsing
            // mesh near the end of the spring.
            runOnJS(setCancelInFlight)(true);
            touchX.value = withSpring(
              restX,
              {
                damping: 22,
                stiffness: 200,
                mass: 0.7,
                velocity: e.velocityX,
              },
              (finished) => {
                springInFlight.value = false;
                if (finished) {
                  runOnJS(doCancel)(goingForward);
                }
              },
            );
            if (goingForward) {
              touchY.value = withSpring(startY.value, {
                damping: 22,
                stiffness: 200,
                mass: 0.7,
                velocity: e.velocityY,
              });
            }
          }
        })
        .onFinalize(() => {
          'worklet';
          // Safety net for handler cancellation (e.g. another gesture
          // interrupts before onEnd). DON'T clear state if a spring is
          // mid-flight — the spring's callback owns the teardown and will
          // run doCommit / doCancel when the animation lands.
          if (turnDir.value !== 0 && !springInFlight.value) {
            const wasForward = turnDir.value === 1;
            turnDir.value = 0;
            runOnJS(doCancel)(wasForward);
          }
        });
    }, [
      pageW,
      direction,
      prevNum,
      nextNum,
      onGestureStart,
      doCommit,
      doCancel,
      turnDir,
      startY,
      touchX,
      touchY,
      springInFlight,
      earlyCommitFired,
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
      if (goingForward) {
        // Forward (going to next page) — corner peel. Origin anchors at
        // the nearest real page corner so the fold tilts diagonally and
        // the lifted region reads as a triangular dog-ear. The curl
        // AMOUNT (R) is driven by horizontal drag DELTA from where the
        // finger first landed — NOT by absolute touchX. Using touchX
        // directly would make R = startX/π pop a curl in the instant
        // the finger touches the page mid-screen. The delta is 0 at
        // gesture start and grows as the finger swipes in the commit
        // direction, so the curl starts at ~0 and grows smoothly.
        const origin = originCorner(startY.value, w, h, direction);
        const horizontalDrag =
          direction === 'rtl'
            ? touchX.value - startX.value
            : startX.value - touchX.value;
        return computeFold(
          origin.x,
          origin.y,
          touchX.value,
          touchY.value,
          Math.max(0, horizontalDrag),
        );
      }
      // Backward (going to previous page) — vertical-seam sweep: origin
      // sits at the commit-target edge so the curl radius shrinks to zero
      // as touch reaches it, and origin.y == touch.y forces the seam to
      // stay strictly vertical regardless of vertical finger drift.
      const ox = direction === 'rtl' ? 0 : w;
      const oy = startY.value;
      return computeFold(ox, oy, touchX.value, oy);
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

    // Index buffers partition the mesh into a STRICT front set and a
    // catch-all back set. A triangle goes into the front set only if all
    // three corners are strictly front-facing (theta < π/2); the back set
    // takes everything else, including apex-straddler triangles where
    // just one corner has crossed the half-cylinder.
    //
    // Why the partition matters: the front mesh paints the page texture
    // (current page for forward, previous for backward) and the back
    // overlay paints the darker cream tint + mirrored bleed. If a
    // straddler triangle ended up in BOTH (the old logic: front used the
    // full buffer, back used "all 3 corners > π/2"), the front's light
    // texture would leak into the cream back surface near the apex, which
    // is exactly what was showing up as "the lighter color interferes
    // with the darker color" on the curl.
    const frontFacingIndices = useDerivedValue<number[]>(() => {
      const a = angles.value;
      const HALF = Math.PI / 2;
      const result: number[] = [];
      for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];
        if (a[i0] < HALF && a[i1] < HALF && a[i2] < HALF) {
          result.push(i0, i1, i2);
        }
      }
      return result;
    });

    // Fade the back-of-page layer out as the cylinder collapses toward R=0.
    // For tiny R, vertices at vx=0 still clamp to theta=π (across/R explodes)
    // and project to the very-left strip of screen — the back-mesh's solid
    // cream then paints a thin yellow strip there. Easing back-opacity to 0
    // over the last ~15px of touchX (the spring's final approach for the
    // backward commit) eliminates that strip without affecting the curl
    // visual during the meaningful range of the gesture.
    const backOpacity = useDerivedValue(() => {
      const r = fold.value.R;
      return Math.max(0, Math.min(1, (r - 2) / 6));
    });

    const backIndices = useDerivedValue<number[]>(() => {
      const a = angles.value;
      const HALF = Math.PI / 2;
      const result: number[] = [];
      for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i];
        const i1 = indices[i + 1];
        const i2 = indices[i + 2];
        // ANY corner past π/2 → back set. Catches apex straddlers so the
        // cream tint covers them completely, not just fully back-facing.
        if (a[i0] > HALF || a[i1] > HALF || a[i2] > HALF) {
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
      const w = pageWSV.value;
      const path = Skia.Path.Make();
      if (h === 0 || f.R < 1e-2) return path;
      // Apex (ground-projected): one R away from the fold midpoint in the
      // curl-normal direction.
      const apexX = f.midX + f.R * f.normalX;
      const apexY = f.midY + f.R * f.normalY;
      // Hide when the apex is within blur+stroke distance of either edge.
      // The shadow's 34px stroke + 28px blur extends ~45px on each side,
      // so we need to gate well before the apex actually reaches the
      // edge — otherwise the blur leaks onto the page as a dark vertical
      // band on the right (forward commit overshoot) or on the left
      // (backward commit, as touchX shrinks toward 0 and apex with it).
      const APEX_EDGE_MARGIN = 45;
      if (apexX > w - APEX_EDGE_MARGIN || apexX < APEX_EDGE_MARGIN) {
        return path;
      }
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
      // Same edge-margin gate as the shadow — the cream highlight + the
      // paper-edge band (both use this path) would otherwise leak onto
      // the far edge during commit overshoot / approach.
      const APEX_EDGE_MARGIN = 45;
      if (apexX > w - APEX_EDGE_MARGIN || apexX < APEX_EDGE_MARGIN) {
        return path;
      }
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

    // Two distinct rendering modes per direction:
    //   forward  — classic corner-peel. Curl mesh shows the CURRENT page
    //              peeling off; the NEXT page is painted into the canvas
    //              as a bgImage so it's revealed beneath the curl.
    //   backward — vertical-seam sweep. Curl mesh shows the PREVIOUS
    //              (incoming) page sliding over; no bgImage needed.
    // Live current view stays visible underneath the canvas in both modes
    // — the canvas content sits on top via Skia, so where the mesh and
    // bgImage cover the screen the live view is hidden, and where the
    // canvas is transparent (e.g. snapshots not captured yet on a fresh
    // forward swipe) the live view still shows so we never go blank.
    const curlImage = activeDir === 1 ? curr.image : prev.image;
    const bgImage =
      activeDir === 1 && !cancelInFlight ? next.image : null;
    const showCanvas = phase !== 'idle' && pageW > 0 && curlImage != null;

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

        {/* Live current page — always visible. The canvas overlay on top
            covers it wherever the curl mesh or bgImage is opaque. When
            canvas content is null (e.g. fresh forward swipe before
            snapshots have been captured), the live view shows through so
            we never present a blank page. */}
        <View
          ref={curr.viewRef}
          collapsable={false}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: pageBackgroundColor },
          ]}
        >
          {renderPage(pageNumber)}
        </View>

        {/* Skia overlay — mounted while the gesture is active or the
            commit spring is animating, unmounted immediately on idle.
            The spring drives the mesh through the full completion motion
            BEFORE doCommit fires, so the canvas can just disappear at
            phase=idle without a cross-fade. */}
        {showCanvas ? (
          <View
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            <Canvas style={StyleSheet.absoluteFill}>
            {/* Background page — only painted during a forward gesture, where
                the curl mesh shows the current page peeling off and the next
                page needs to be revealed beneath it. On a backward gesture
                the live current view (visible underneath the canvas) is the
                background instead. */}
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

            <Group>
              {/* Soft cast shadow under the curl — a thick stroked line at
                  the apex, heavily blurred into a soft band. Deeper +
                  wider than a pure half-cylinder needs, so the lifted
                  page reads as further off the surface and the curl
                  looks like real paper with weight. */}
              <Path
                path={shadowPath}
                style="stroke"
                strokeWidth={34}
                color="rgba(0,0,0,0.55)"
              >
                <BlurMask blur={SHADOW_BLUR} style="normal" />
              </Path>

              {/* Front side of the curling page (incoming-page texture).
                  Uses the strict front index buffer so apex straddlers
                  fall through to the back overlay below and the front
                  texture can't leak into the cream back surface. The
                  flat half of the fold (theta=0 everywhere) is naturally
                  included because 0 < π/2. */}
              {curlImage ? (
                <Vertices
                  vertices={frontVertices}
                  textures={textures}
                  indices={frontFacingIndices}
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

              {/* Back-of-page overlay (cream fill + mirrored bleed). Wrapped
                  in a single group whose opacity fades to zero as the
                  cylinder collapses, so the back layer can't paint the
                  thin yellow strip on the screen edge during the spring's
                  final approach. */}
              <Group opacity={backOpacity}>
                <Vertices
                  vertices={frontVertices}
                  indices={backIndices}
                  mode="triangles"
                  color="#e8dec5"
                />
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
              </Group>

              {/* Paper-edge thickness band — a soft cream stroke along
                  the cylinder apex so the curl reads as paper with a
                  real cut edge rather than a zero-thickness mesh. The
                  specular highlight below sits on top of it for a
                  bright glint along the visible page edge. */}
              <Path
                path={highlightPath}
                style="stroke"
                strokeWidth={5}
                color="rgba(245,238,218,0.85)"
              >
                <BlurMask blur={1.5} style="solid" />
              </Path>

              {/* Specular highlight along the cylinder apex */}
              <Path
                path={highlightPath}
                style="stroke"
                strokeWidth={2}
                color="rgba(255,255,255,0.5)"
              >
                <BlurMask blur={3} style="solid" />
              </Path>
            </Group>
            </Canvas>
          </View>
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
});

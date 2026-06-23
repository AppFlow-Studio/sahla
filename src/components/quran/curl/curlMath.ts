/**
 * Worklet-safe math for a 3D page-curl using a perpendicular-bisector fold.
 *
 * Model: the user "grabs" a leading corner of the page; that corner is pulled
 * toward the touch point. The page bends along the perpendicular bisector of
 * (originCorner, touch). Vertices on the curl side wrap around a half-cylinder
 * whose radius is chosen so the original corner wraps exactly π radians.
 *
 *   R = |origin - touch| / (2π)
 *
 * No React/Skia imports — every function below is callable from a worklet.
 */

export type FoldFrame = {
  midX: number;
  midY: number;
  /** Unit vector along the fold line. */
  dirX: number;
  dirY: number;
  /** Unit vector across the fold, pointing toward the curl side (origin). */
  normalX: number;
  normalY: number;
  /** Cylinder radius. */
  R: number;
};

const EPS = 1e-3;

export function computeFold(
  originX: number,
  originY: number,
  touchX: number,
  touchY: number,
): FoldFrame {
  'worklet';
  const dx = originX - touchX;
  const dy = originY - touchY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < EPS) {
    return {
      midX: touchX,
      midY: touchY,
      dirX: 0,
      dirY: 1,
      normalX: 1,
      normalY: 0,
      R: 0,
    };
  }
  const nx = dx / len;
  const ny = dy / len;
  // Fold passes through the touch point so the visible fold edge tracks the
  // finger 1:1. Radius is len/π so a half-cylinder wrap (θ = π at the leading
  // corner) lands the lifted corner exactly under the finger in the XY
  // plane — no lateral lag.
  return {
    midX: touchX,
    midY: touchY,
    dirX: -ny,
    dirY: nx,
    normalX: nx,
    normalY: ny,
    R: len / Math.PI,
  };
}

export type BentVertex = {
  x: number;
  y: number;
  z: number;
  /** Curl angle: 0 = flat, π = wrapped half. */
  theta: number;
};

export function bendVertex(vx: number, vy: number, f: FoldFrame): BentVertex {
  'worklet';
  if (f.R < EPS) {
    return { x: vx, y: vy, z: 0, theta: 0 };
  }
  const rx = vx - f.midX;
  const ry = vy - f.midY;
  const along = rx * f.dirX + ry * f.dirY;
  const across = rx * f.normalX + ry * f.normalY;
  if (across <= 0) {
    return { x: vx, y: vy, z: 0, theta: 0 };
  }
  const theta = Math.min(Math.PI, across / f.R);
  const wrapped = f.R * Math.sin(theta);
  const z = f.R * (1 - Math.cos(theta));
  return {
    x: f.midX + along * f.dirX + wrapped * f.normalX,
    y: f.midY + along * f.dirY + wrapped * f.normalY,
    z,
    theta,
  };
}

/**
 * Project page-coord (x, y, z) to 2D screen with weak perspective. z>0 lifts
 * the vertex toward the camera, slightly enlarging it.
 */
export function project(
  x: number,
  y: number,
  z: number,
  focalLength: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  'worklet';
  const w = focalLength / Math.max(1, focalLength - z);
  return {
    x: cx + (x - cx) * w,
    y: cy + (y - cy) * w,
  };
}

/**
 * The point on the leading edge that the curl emanates from. X is fixed to
 * the leading edge of the page; Y tracks the finger's start Y so the fold
 * stays small at gesture-start and grows as the finger drags toward the
 * spine.
 *
 * Note: the corner-edge stroke uses a separate, corner-snapped pivot
 * computed inline in PageTurnView — this function intentionally does NOT
 * snap, because that would change how the mesh swipe feels.
 */
export function originCorner(
  startY: number,
  pageW: number,
  // pageH retained for signature stability but unused now.
  _pageH: number,
  direction: 'rtl' | 'ltr',
): { x: number; y: number } {
  'worklet';
  const x = direction === 'rtl' ? 0 : pageW;
  return { x, y: startY };
}

/**
 * Touch progress 0..1 measured along the spine direction. 0 at the leading
 * edge, 1 once the touch has reached the spine.
 */
export function progressFromTouch(
  touchX: number,
  pageW: number,
  direction: 'rtl' | 'ltr',
): number {
  'worklet';
  const t = direction === 'rtl' ? touchX / pageW : (pageW - touchX) / pageW;
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t;
}

/**
 * RTL forward turn: vx > 0. LTR forward turn: vx < 0.
 * Commit if past 40% progress OR if release velocity is high in the turn dir.
 */
export function shouldCommit(
  progress: number,
  velocityX: number,
  direction: 'rtl' | 'ltr',
): boolean {
  'worklet';
  if (progress > 0.4) return true;
  const VEL = 800;
  if (direction === 'rtl' && velocityX > VEL) return true;
  if (direction === 'ltr' && velocityX < -VEL) return true;
  return false;
}

/**
 * For a given (touch.x), the touch.y at gesture-start determined the origin
 * corner. Given a desired progress 0..1, return the touch position the curl
 * would end at — used during spring-to-commit / spring-to-release on the UI
 * thread.
 */
export function touchForProgress(
  progress: number,
  startY: number,
  pageW: number,
  pageH: number,
  direction: 'rtl' | 'ltr',
): { x: number; y: number } {
  'worklet';
  const origin = originCorner(startY, pageW, pageH, direction);
  // commit destination = spine corner on the same y-half as origin
  const spineX = direction === 'rtl' ? pageW : 0;
  const destY = origin.y;
  return {
    x: origin.x + (spineX - origin.x) * progress,
    y: origin.y + (destY - origin.y) * progress,
  };
}

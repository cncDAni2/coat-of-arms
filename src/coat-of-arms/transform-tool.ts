/**
 * Photoshop-style free transform for a single placed object:
 *  - drag inside the box → move
 *  - drag a corner dot → uniform scale (around the center)
 *  - drag outside the box (but where rotation is allowed) → rotate around the center, in 45° steps
 *    (heraldry only knows describable positions: upright, bendwise, fesswise, reversed…)
 * Pure geometry + drawing; the caller owns pointer events and state.
 */

export interface Placement {
  x: number, // center
  y: number,
  width: number, // unscaled
  height: number,
  scale: number,
  rotation: number // radians
}

export type Hit =
  | { type: 'move' }
  | { type: 'scale', corner: number }
  | { type: 'rotate' };

export interface DragState {
  hit: Hit,
  startX: number,
  startY: number,
  start: Placement
}

const HANDLE_RADIUS = 4.5;
const HANDLE_HIT_RADIUS = 9;
const ROTATE_SNAP = Math.PI / 4; // 45°
const COLOR = '#1e90ff';

function toLocal(p: Placement, px: number, py: number): [number, number] {
  const dx = px - p.x;
  const dy = py - p.y;
  const cos = Math.cos(-p.rotation);
  const sin = Math.sin(-p.rotation);
  return [dx * cos - dy * sin, dx * sin + dy * cos];
}

/** Corner points in canvas coordinates: top-left, top-right, bottom-right, bottom-left. */
export function corners(p: Placement): [number, number][] {
  const hw = (p.width * p.scale) / 2;
  const hh = (p.height * p.scale) / 2;
  const cos = Math.cos(p.rotation);
  const sin = Math.sin(p.rotation);
  return ([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]] as [number, number][])
    .map(([lx, ly]) => [p.x + lx * cos - ly * sin, p.y + lx * sin + ly * cos]);
}

export function containsPoint(p: Placement, px: number, py: number): boolean {
  const [lx, ly] = toLocal(p, px, py);
  return Math.abs(lx) <= (p.width * p.scale) / 2 && Math.abs(ly) <= (p.height * p.scale) / 2;
}

export function hitTest(p: Placement, px: number, py: number, canRotate: boolean): Hit | null {
  const cornerIndex = corners(p).findIndex(([cx, cy]) => Math.hypot(px - cx, py - cy) <= HANDLE_HIT_RADIUS);
  if (cornerIndex >= 0) return { type: 'scale', corner: cornerIndex };
  if (containsPoint(p, px, py)) return { type: 'move' };
  if (canRotate) return { type: 'rotate' };
  return null;
}

export function applyDrag(drag: DragState, px: number, py: number, minScale: number): Placement {
  const s = drag.start;
  switch (drag.hit.type) {
    case 'move':
      return { ...s, x: s.x + px - drag.startX, y: s.y + py - drag.startY };

    case 'scale': {
      const startDist = Math.hypot(drag.startX - s.x, drag.startY - s.y) || 1;
      const dist = Math.hypot(px - s.x, py - s.y);
      return { ...s, scale: Math.max(minScale, (s.scale * dist) / startDist) };
    }

    case 'rotate': {
      const a0 = Math.atan2(drag.startY - s.y, drag.startX - s.x);
      const a1 = Math.atan2(py - s.y, px - s.x);
      const rotation = Math.round((s.rotation + a1 - a0) / ROTATE_SNAP) * ROTATE_SNAP;
      return { ...s, rotation };
    }
  }
}

const ROTATE_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
  '<path d="M18.5 8.5A7.5 7.5 0 1 0 19.5 14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
  '<path d="M18.5 8.5A7.5 7.5 0 1 0 19.5 14" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/>' +
  '<path d="M21 3.5 20 10.5 13.5 8Z" fill="#000" stroke="#fff" stroke-width="1"/>' +
  '</svg>'
)}") 12 12, crosshair`;

export function cursorFor(hit: Hit | null, p: Placement): string {
  if (!hit) return 'default';
  if (hit.type === 'move') return 'move';
  if (hit.type === 'rotate') return ROTATE_CURSOR;

  // Pick the resize cursor that matches the (rotated) corner direction
  const [cx, cy] = corners(p)[hit.corner];
  const deg = ((Math.atan2(cy - p.y, cx - p.x) * 180) / Math.PI + 360) % 180;
  if (deg < 22.5 || deg >= 157.5) return 'ew-resize';
  if (deg < 67.5) return 'nwse-resize';
  if (deg < 112.5) return 'ns-resize';
  return 'nesw-resize';
}

/** The blue helper border with thicker corner dots. */
export function drawGizmo(ctx: CanvasRenderingContext2D, p: Placement) {
  const pts = corners(p);
  ctx.save();

  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.stroke();
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = COLOR;
  ctx.stroke();

  // Center cross
  ctx.beginPath();
  ctx.moveTo(p.x - 4, p.y);
  ctx.lineTo(p.x + 4, p.y);
  ctx.moveTo(p.x, p.y - 4);
  ctx.lineTo(p.x, p.y + 4);
  ctx.lineWidth = 1;
  ctx.stroke();

  for (const [x, y] of pts) {
    ctx.beginPath();
    ctx.arc(x, y, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLOR;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
  }
  ctx.restore();
}

export interface Bounds {
  left: number,
  top: number,
  width: number,
  height: number
}

type Pt = [number, number];

export type LineStyle = 'straight' | 'wavy' | 'engrailed' | 'invected' | 'indented' | 'dancetty' | 'embattled';
export const LINE_STYLES: LineStyle[] = ['straight', 'wavy', 'engrailed', 'invected', 'indented', 'dancetty', 'embattled'];

export type DivisionId =
  | 'plain' | 'perPale' | 'perFess' | 'perBend' | 'perBendSinister' | 'quarterly' | 'perSaltire'
  | 'perChevron' | 'perChevronInverted' | 'perPall' | 'perPallReversed' | 'tiercedPale' | 'tiercedFess'
  | 'perPile' | 'chape' | 'gyronny6' | 'gyronny8' | 'gyronny12';

export interface DivisionDef {
  id: DivisionId,
  /** Number of independently tinctured areas */
  areas: number,
  /** Which offsets the user may adjust */
  x: boolean,
  y: boolean
}

export const DIVISIONS: DivisionDef[] = [
  { id: 'plain', areas: 1, x: false, y: false },
  { id: 'perPale', areas: 2, x: true, y: false },
  { id: 'perFess', areas: 2, x: false, y: true },
  { id: 'perBend', areas: 2, x: false, y: true },
  { id: 'perBendSinister', areas: 2, x: false, y: true },
  { id: 'quarterly', areas: 2, x: true, y: true },
  { id: 'perSaltire', areas: 2, x: true, y: true },
  { id: 'perChevron', areas: 2, x: false, y: true },
  { id: 'perChevronInverted', areas: 2, x: false, y: true },
  { id: 'perPall', areas: 3, x: false, y: true },
  { id: 'perPallReversed', areas: 3, x: false, y: true },
  { id: 'tiercedPale', areas: 3, x: false, y: false },
  { id: 'tiercedFess', areas: 3, x: false, y: false },
  { id: 'perPile', areas: 2, x: false, y: false },
  { id: 'chape', areas: 2, x: false, y: false },
  { id: 'gyronny6', areas: 2, x: true, y: true },
  { id: 'gyronny8', areas: 2, x: true, y: true },
  { id: 'gyronny12', areas: 2, x: true, y: true }
];

/** Offsets are limited to this fraction of the shield size ("enhanced" / "abased" positions). */
export const MAX_OFFSET = 0.12;

const MARGIN = 40;

// ------------------------------------------------------------------ Lines of partition

interface Ornament {
  period: number,
  amp: number,
  /** Offset in units of amp, phase in [0, 1) */
  f: (phase: number) => number,
  /** A phase where f is 0 (or jumps through 0): lines start there, so rays meet exactly at their common point */
  zero: number,
  /** Phases (in [0, 1)) where a point must be placed: corners, jumps and, for curves, a fine sampling grid */
  breaks: number[]
}

const grid = (n: number) => Array.from({ length: n }, (_, i) => i / n);
const tri = (u: number) => 1 - 4 * Math.abs(u - 0.5); // -1 at 0, +1 at 0.5
const arc = (u: number) => Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2));

function ornament(style: LineStyle, size: number): Ornament | null {
  switch (style) {
    case 'straight': return null;
    case 'wavy': return { period: size / 5, amp: size * 0.03, f: u => Math.sin(u * 2 * Math.PI), zero: 0, breaks: grid(32) };
    case 'indented': return { period: size / 12, amp: size * 0.022, f: tri, zero: 0.25, breaks: [0, 0.5] };
    case 'dancetty': return { period: size / 3, amp: size * 0.06, f: tri, zero: 0.25, breaks: [0, 0.5] };
    case 'engrailed': return { period: size / 7, amp: size * 0.035, f: u => -arc(u), zero: 0, breaks: grid(32) };
    case 'invected': return { period: size / 7, amp: size * 0.035, f: arc, zero: 0, breaks: grid(32) };
    case 'embattled': return { period: size / 7, amp: size * 0.03, f: u => (u < 0.5 ? 1 : -1), zero: 0, breaks: [0, 0.5] };
  }
}

const frac = (x: number) => ((x % 1) + 1) % 1;

/**
 * Points from a to b along an (optionally ornamented) line.
 * The pattern is laid on a grid anchored at `origin` (by default a, the meeting point of the rays) in a
 * canonical orientation, so two rays forming one straight line (e.g. per pale = up-ray + down-ray)
 * produce one continuous pattern, rays meeting at an angle start exactly at their common point, and two
 * areas sharing a line always get the very same boundary. Points are placed exactly on the pattern's
 * corners and jumps, so every tooth / battlement / scallop comes out identical.
 */
function linePoints(a: Pt, b: Pt, orn: Ornament | null, origin: Pt = a): Pt[] {
  if (!orn) return [a, b];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  // Canonical direction: flip rays pointing "backwards" so collinear rays share orientation
  const sign = ux < -1e-9 || (Math.abs(ux) < 1e-9 && uy < 0) ? -1 : 1;
  const nx = -uy * sign;
  const ny = ux * sign;
  // Canonical coordinate (in periods) of the point at distance s along the ray, and its inverse
  const d0 = (a[0] - origin[0]) * ux + (a[1] - origin[1]) * uy;
  const phaseAt = (s: number) => (sign * (d0 + s)) / orn.period + orn.zero;
  const sAt = (g: number) => sign * (g - orn.zero) * orn.period - d0;

  const stops = new Set<number>([0, len]);
  const g0 = phaseAt(0);
  const g1 = phaseAt(len);
  for (let k = Math.floor(Math.min(g0, g1)) - 1; k <= Math.ceil(Math.max(g0, g1)); k++) {
    for (const br of orn.breaks) {
      const sv = sAt(k + br);
      if (sv > 1e-9 && sv < len - 1e-9) stops.add(sv);
    }
  }

  const at = (s: number, off: number): Pt => [a[0] + ux * s + nx * off * orn.amp, a[1] + uy * s + ny * off * orn.amp];
  const eps = 1e-6 * orn.period;
  const pts: Pt[] = [];
  if (origin === a) pts.push(a); // the rays' common point, exactly
  for (const sv of [...stops].sort((x, y) => x - y)) {
    const before = orn.f(frac(phaseAt(sv - eps)));
    const after = orn.f(frac(phaseAt(sv + eps)));
    if (Math.abs(before - after) > 0.5) {
      // A jump (embattled): a straight step across the line
      if (sv > 0) pts.push(at(sv, before));
      if (sv < len) pts.push(at(sv, after));
    } else {
      pts.push(at(sv, orn.f(frac(phaseAt(sv)))));
    }
  }
  return pts;
}

// ------------------------------------------------------------------ Builders

interface Frame { l: number, t: number, r: number, b: number }

/** Where the ray from c at angle `deg` (canvas degrees, clockwise from +x) leaves the frame. */
function rayEnd(c: Pt, deg: number, f: Frame): Pt {
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let tMin = Infinity;
  if (dx > 1e-9) tMin = Math.min(tMin, (f.r - c[0]) / dx);
  if (dx < -1e-9) tMin = Math.min(tMin, (f.l - c[0]) / dx);
  if (dy > 1e-9) tMin = Math.min(tMin, (f.b - c[1]) / dy);
  if (dy < -1e-9) tMin = Math.min(tMin, (f.t - c[1]) / dy);
  return [c[0] + dx * tMin, c[1] + dy * tMin];
}

/** Position along the frame's perimeter, clockwise from the top-left corner. */
function perimeterPos(p: Pt, f: Frame): number {
  const w = f.r - f.l;
  const h = f.b - f.t;
  const eps = 1e-6;
  if (Math.abs(p[1] - f.t) < eps) return p[0] - f.l;
  if (Math.abs(p[0] - f.r) < eps) return w + (p[1] - f.t);
  if (Math.abs(p[1] - f.b) < eps) return w + h + (f.r - p[0]);
  return 2 * w + h + (f.b - p[1]);
}

/** Frame corners passed when walking clockwise along the perimeter from p to q. */
function cornersBetween(p: Pt, q: Pt, f: Frame): Pt[] {
  const w = f.r - f.l;
  const h = f.b - f.t;
  const per = 2 * (w + h);
  const corners: [number, Pt][] = [[0, [f.l, f.t]], [w, [f.r, f.t]], [w + h, [f.r, f.b]], [2 * w + h, [f.l, f.b]]];
  const s0 = perimeterPos(p, f);
  let s1 = perimeterPos(q, f);
  if (s1 <= s0 + 1e-9) s1 += per;
  const result: Pt[] = [];
  for (const offset of [0, per]) {
    for (const [s, pt] of corners) {
      const sv = s + offset;
      if (sv > s0 + 1e-9 && sv < s1 - 1e-9) result.push(pt);
    }
  }
  return result;
}

/**
 * Splits the frame into wedges around c, bounded by rays at the given angles (clockwise order).
 * Wedge k lies between ray k and ray k+1.
 */
function wedges(c: Pt, angles: number[], f: Frame, orn: Ornament | null): Path2D[] {
  const ends = angles.map(a => rayEnd(c, a, f));
  const rays = ends.map(e => linePoints(c, e, orn));
  return angles.map((_, k) => {
    const next = (k + 1) % angles.length;
    const pts: Pt[] = [
      ...rays[k],
      ...cornersBetween(ends[k], ends[next], f),
      ...[...rays[next]].reverse()
    ];
    return polygon(pts);
  });
}

function polygon(pts: Pt[]): Path2D {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

function union(paths: Path2D[]): Path2D {
  const p = new Path2D();
  paths.forEach(part => p.addPath(part));
  return p;
}

/** Areas alternating around the center (quarterly, per saltire, gyronny). */
function alternating(parts: Path2D[]): Path2D[] {
  return [union(parts.filter((_, i) => i % 2 === 0)), union(parts.filter((_, i) => i % 2 === 1))];
}

function deg(dx: number, dy: number) {
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Builds the areas of a division, in heraldic order (chief before base, dexter before sinister).
 * Returned paths are in logical canvas coordinates and extend beyond the shield (it is masked later).
 */
export function divisionAreas(id: DivisionId, sb: Bounds, offsetX: number, offsetY: number, line: LineStyle, perBendDegOffset = 0): Path2D[] {
  const f: Frame = { l: sb.left - MARGIN, t: sb.top - MARGIN, r: sb.left + sb.width + MARGIN, b: sb.top + sb.height + MARGIN };
  const cx = sb.left + sb.width / 2 + offsetX * sb.width;
  const cy = sb.top + sb.height / 2 - offsetY * sb.height;
  const c: Pt = [cx, cy];
  const orn = ornament(line, Math.min(sb.width, sb.height));

  switch (id) {
    case 'plain':
      return [polygon([[f.l, f.t], [f.r, f.t], [f.r, f.b], [f.l, f.b]])];
    case 'perPale': return wedges(c, [90, 270], f, orn);
    case 'perFess': return wedges(c, [180, 0], f, orn);
    case 'perBend': return wedges(c, [225 + perBendDegOffset, 45 + perBendDegOffset], f, orn);
    case 'perBendSinister': return wedges(c, [135 - perBendDegOffset, 315 - perBendDegOffset], f, orn);
    case 'quarterly': return alternating(wedges(c, [180, 270, 0, 90], f, orn));
    case 'perSaltire': return alternating(wedges(c, [225, 315, 45, 135], f, orn));
    case 'gyronny6':
    case 'gyronny8':
    case 'gyronny12': {
      const n = id === 'gyronny6' ? 6 : id === 'gyronny8' ? 8 : 12;
      return alternating(wedges(c, Array.from({ length: n }, (_, i) => 180 + (360 / n) * i), f, orn));
    }
    case 'perChevron': {
      const apex: Pt = [sb.left + sb.width / 2, cy - sb.height * 0.12];
      const [below, above] = wedges(apex, [45, 135], f, orn);
      return [above, below];
    }
    case 'perChevronInverted': {
      const apex: Pt = [sb.left + sb.width / 2, cy + sb.height * 0.12];
      const [above, below] = wedges(apex, [225, 315], f, orn);
      return [above, below];
    }
    case 'perPall': {
      const j: Pt = [sb.left + sb.width / 2, cy - sb.height * 0.05];
      const [chief, sinister, dexter] = wedges(j, [225, 315, 90], f, orn);
      return [chief, dexter, sinister];
    }
    case 'perPallReversed': {
      const j: Pt = [sb.left + sb.width / 2, cy + sb.height * 0.05];
      const [sinister, base, dexter] = wedges(j, [270, 45, 135], f, orn);
      return [dexter, sinister, base];
    }
    case 'perPile': {
      // A pile: triangle from the chief, its point near the base
      const point: Pt = [sb.left + sb.width / 2, sb.top + sb.height * 0.92];
      const aL = deg(sb.left + sb.width * 0.2 - point[0], sb.top - point[1]);
      const aR = deg(sb.left + sb.width * 0.8 - point[0], sb.top - point[1]);
      const [pile, field] = wedges(point, [aL + 360, aR + 360].map(a => a % 360), f, orn);
      return [field, pile];
    }
    case 'chape': {
      // Lines from the middle chief to the dexter and sinister base
      const apex: Pt = [sb.left + sb.width / 2, sb.top];
      const aR = deg(sb.width / 2, sb.height);
      const aL = deg(-sb.width / 2, sb.height);
      const [field, chape] = wedges(apex, [aR, aL], f, orn);
      return [field, chape];
    }
    case 'tiercedPale': {
      const x1 = sb.left + sb.width / 3;
      const x2 = sb.left + (2 * sb.width) / 3;
      const l1 = linePoints([x1, f.t], [x1, f.b], orn, [x1, sb.top + sb.height / 2]);
      const l2 = linePoints([x2, f.t], [x2, f.b], orn, [x2, sb.top + sb.height / 2]);
      return [
        polygon([[f.l, f.t], ...l1, [f.l, f.b]]),
        polygon([...l1, ...[...l2].reverse()]),
        polygon([...l2, [f.r, f.b], [f.r, f.t]])
      ];
    }
    case 'tiercedFess': {
      const y1 = sb.top + sb.height / 3;
      const y2 = sb.top + (2 * sb.height) / 3;
      const l1 = linePoints([f.l, y1], [f.r, y1], orn, [sb.left + sb.width / 2, y1]);
      const l2 = linePoints([f.l, y2], [f.r, y2], orn, [sb.left + sb.width / 2, y2]);
      return [
        polygon([[f.l, f.t], [f.r, f.t], ...[...l1].reverse()]),
        polygon([...l1, ...[...l2].reverse()]),
        polygon([...l2, [f.r, f.b], [f.l, f.b]])
      ];
    }
  }
}

/** Which areas touch each other (for the "no two adjacent areas of the same tincture" rule). */
export function divisionAdjacency(id: DivisionId): [number, number][] {
  const def = DIVISIONS.find(d => d.id === id)!;
  if (def.areas === 2) return [[0, 1]];
  if (id === 'tiercedPale' || id === 'tiercedFess') return [[0, 1], [1, 2]];
  if (def.areas === 3) return [[0, 1], [0, 2], [1, 2]];
  return [];
}

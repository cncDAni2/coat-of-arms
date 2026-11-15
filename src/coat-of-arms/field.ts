import { Bounds } from './geometry';
import { hexOf, Tincture } from './tinctures';

/**
 * What can cover a field area besides its tincture:
 *  - variations of the field (two tinctures repeating),
 *  - semé (a scatter of small charges),
 *  - furs: ermine (spots on the field) and vair (interlocking panes).
 * The area's own tincture is always the first (ground) tincture.
 */
export type VariationKind = 'barry' | 'paly' | 'bendy' | 'bendySinister' | 'chequy' | 'lozengy';
export type VairStyle = 'vair' | 'counterVair' | 'potent';
export type Variation =
  | { kind: VariationKind, second: Tincture, count: number }
  | { kind: 'seme', charge: 'roundel' | 'annulet', tincture: Tincture, density: number, size: number }
  | { kind: 'ermine', spot: Tincture, density: number, size: number }
  | { kind: 'vair', second: Tincture, rows: number, style: VairStyle };

export type FurKind = 'ermine' | 'vair';
export type OptionKind = VariationKind | 'seme' | FurKind;

export interface AreaFill {
  tincture: Tincture,
  variation: Variation | null
}

/** Allowed piece counts; the defaults are the conventional ones. */
export const VARIATION_COUNTS: Record<VariationKind, { min: number, max: number, step: number, def: number }> = {
  barry: { min: 4, max: 10, step: 2, def: 6 }, // even number of pieces
  paly: { min: 4, max: 10, step: 2, def: 6 },
  bendy: { min: 4, max: 10, step: 2, def: 6 },
  bendySinister: { min: 4, max: 10, step: 2, def: 6 },
  chequy: { min: 4, max: 8, step: 1, def: 6 }, // columns
  lozengy: { min: 3, max: 7, step: 1, def: 5 } // columns
};
export const SEME_DENSITY = { min: 3, max: 8, step: 1, def: 5 };
export const SEME_SIZE = { min: 30, max: 90, step: 5, def: 60 };
export const ERMINE_DENSITY = { min: 3, max: 8, step: 1, def: 5 };
export const ERMINE_SIZE = { min: 40, max: 90, step: 5, def: 65 };
export const VAIR_ROWS = { min: 3, max: 8, step: 1, def: 4 };
export const VAIR_STYLES: VairStyle[] = ['vair', 'counterVair', 'potent'];

/** The traditional, named furs: ground and spot/pane tinctures. */
export const ERMINE_PRESETS: { key: string, field: Tincture, spot: Tincture }[] = [
  { key: 'ermine', field: 'argent', spot: 'sable' },
  { key: 'ermines', field: 'sable', spot: 'argent' },
  { key: 'erminois', field: 'or', spot: 'sable' },
  { key: 'pean', field: 'sable', spot: 'or' }
];
export const VAIR_PRESETS: { key: string, field: Tincture, second: Tincture }[] = [
  { key: 'vair', field: 'argent', second: 'azure' }
];

export const OUTLINE = '#000000';

/** Thin black outline used for every drawn piece (heraldic drawings outline everything in black). */
function outline(ctx: CanvasRenderingContext2D, path: Path2D, width: number) {
  ctx.lineWidth = width;
  ctx.strokeStyle = OUTLINE;
  ctx.lineJoin = 'round';
  ctx.stroke(path);
}

function ermineSpot(p: Path2D, cx: number, cy: number, h: number) {
  const s = (x: number, y: number): [number, number] => [cx + x * h, cy + y * h];
  const dot = (x: number, y: number, r: number) => {
    const [px, py] = s(x, y);
    p.moveTo(px + r * h, py);
    p.arc(px, py, r * h, 0, Math.PI * 2);
  };
  dot(0, -0.4, 0.1);
  dot(-0.16, -0.24, 0.09);
  dot(0.16, -0.24, 0.09);
  p.moveTo(...s(0, -0.22));
  p.quadraticCurveTo(...s(-0.05, 0.1), ...s(-0.26, 0.42));
  p.lineTo(...s(-0.09, 0.33));
  p.lineTo(...s(0, 0.5));
  p.lineTo(...s(0.09, 0.33));
  p.lineTo(...s(0.26, 0.42));
  p.quadraticCurveTo(...s(0.05, 0.1), ...s(0, -0.22));
  p.closePath();
}

function fillFlat(ctx: CanvasRenderingContext2D, t: Tincture) {
  const big = 4000;
  ctx.fillStyle = hexOf(t);
  ctx.fillRect(-big, -big, big * 2, big * 2);
}

/** Ermine spots in staggered rows, symmetric about the pale line. */
function erminePieces(v: Extract<Variation, { kind: 'ermine' }>, sb: Bounds): Path2D {
  const p = new Path2D();
  const cell = sb.width / v.density;
  const rowH = cell * 0.9;
  const cx = sb.left + sb.width / 2;
  const h = cell * (v.size / 100);
  for (let j = 0; j * rowH < sb.height + rowH; j++) {
    const offset = j % 2 === 0 ? 0 : cell / 2;
    for (let k = -v.density; k <= v.density; k++) {
      ermineSpot(p, cx + (k - (v.density - 1) / 2) * cell + offset, sb.top + rowH * (j + 0.5), h);
    }
  }
  return p;
}

/**
 * Vair panes of the second tincture, `rows` rows from the chief down:
 *  - vair: upright bells, each row offset by half a pane (interlocking with inverted bells of the ground)
 *  - counter-vair: no offset, every second row inverted, so panes of the same tincture meet base to base
 *  - potent: like vair, but T-shaped (crutch) panes
 */
function vairPieces(v: Extract<Variation, { kind: 'vair' }>, sb: Bounds): Path2D {
  const p = new Path2D();
  const h = sb.height / v.rows;
  const w = h * 1.1;
  // The coloured panes repeat every w; their half-width at depth t satisfies hw(t) + hw(1 - t) = w / 2,
  // so the gaps between them are the very same pane turned upside down (the ground's inverted bells / T's).
  const period = w;
  const cx = sb.left + sb.width / 2;
  const columns = Math.ceil(sb.width / period) + 2;
  for (let j = 0; j < v.rows + 1; j++) {
    const y = sb.top + j * h;
    const inverted = v.style === 'counterVair' && j % 2 === 1;
    const offset = v.style === 'counterVair' || j % 2 === 0 ? 0 : period / 2;
    for (let k = -columns; k <= columns; k++) {
      const x = cx + k * period + offset - w / 2;
      // Shape in pane-local coordinates (u across 0..1, t down 0..1), base at t = 1
      const shape: [number, number][] = v.style === 'potent'
        // "⊥": narrow stem on a wide foot
        ? [[0.15, 1], [0.15, 0.5], [0.35, 0.5], [0.35, 0], [0.65, 0], [0.65, 0.5], [0.85, 0.5], [0.85, 1]]
        // bell: narrow neck, sloping shoulders, wide skirt
        : [[0.15, 1], [0.15, 0.65], [0.35, 0.35], [0.35, 0], [0.65, 0], [0.65, 0.35], [0.85, 0.65], [0.85, 1]];
      shape.forEach(([u, t], i) => {
        const px = x + u * w;
        const py = y + (inverted ? 1 - t : t) * h;
        if (i === 0) p.moveTo(px, py);
        else p.lineTo(px, py);
      });
      p.closePath();
    }
  }
  return p;
}

/** The pieces of the second tincture of a variation, aligned to the shield's bounds. */
function variationPieces(kind: VariationKind, count: number, sb: Bounds): Path2D {
  const p = new Path2D();
  const { left, top, width, height } = sb;
  switch (kind) {
    case 'barry': {
      const h = height / count;
      for (let i = 1; i < count; i += 2) p.rect(left - 50, top + i * h, width + 100, h);
      break;
    }
    case 'paly': {
      const w = width / count;
      for (let i = 1; i < count; i += 2) p.rect(left + i * w, top - 50, w, height + 100);
      break;
    }
    case 'bendy':
    case 'bendySinister': {
      // Bands perpendicular to the bend, measured from the dexter (or sinister) chief corner
      const sinister = kind === 'bendySinister';
      const ox = sinister ? left + width : left;
      const total = (width + height) / Math.SQRT2;
      const b = total / count;
      const m = new DOMMatrix().translate(ox, top).rotate(sinister ? 135 : 45);
      for (let i = 1; i < count; i += 2) {
        const band = new Path2D();
        band.rect(i * b, -2000, b, 4000);
        p.addPath(band, m);
      }
      break;
    }
    case 'chequy': {
      const s = width / count;
      const rows = Math.ceil(height / s) + 1;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < count; i++) {
          if ((i + j) % 2 === 1) p.rect(left + i * s, top + j * s, s, s);
        }
      }
      break;
    }
    case 'lozengy': {
      // Lozenges of the first tincture centred on the pale line with a whole one at the chief;
      // the second tincture fills the interlocking lozenges between them.
      const w = width / count;
      const h = w * 1.5;
      const cx = left + width / 2;
      for (let j = -1; j * h < height + h; j++) {
        for (let k = -count; k <= count; k++) {
          const x = cx + (k + 0.5) * w;
          const y = top + (j + 1) * h;
          p.moveTo(x, y - h / 2);
          p.lineTo(x + w / 2, y);
          p.lineTo(x, y + h / 2);
          p.lineTo(x - w / 2, y);
          p.closePath();
        }
      }
      break;
    }
  }
  return p;
}

function semePieces(v: Extract<Variation, { kind: 'seme' }>, sb: Bounds): { fill: Path2D, rings: Path2D } {
  const cell = sb.width / v.density;
  const rowH = cell * 0.866;
  const r = (cell / 2) * (v.size / 100);
  const cx = sb.left + sb.width / 2;
  const fill = new Path2D();
  const rings = new Path2D();
  for (let j = 0; j * rowH < sb.height + rowH; j++) {
    const y = sb.top + rowH * (j + 0.5);
    const offset = j % 2 === 0 ? 0 : cell / 2;
    for (let k = -v.density; k <= v.density; k++) {
      const x = cx + (k - (v.density - 1) / 2) * cell + offset;
      fill.moveTo(x + r, y);
      fill.arc(x, y, r, 0, Math.PI * 2);
      if (v.charge === 'annulet') {
        const ri = r * 0.6;
        fill.moveTo(x + ri, y);
        fill.arc(x, y, ri, 0, Math.PI * 2, true);
        rings.moveTo(x + ri, y);
        rings.arc(x, y, ri, 0, Math.PI * 2);
      }
    }
  }
  return { fill, rings };
}

/** Draws an area: clips to its path, paints the tincture and what covers it, outlines the pieces. */
export function drawAreaFill(ctx: CanvasRenderingContext2D, path: Path2D, fill: AreaFill, sb: Bounds, lineWidth = 1) {
  ctx.save();
  ctx.clip(path);
  fillFlat(ctx, fill.tincture);

  const v = fill.variation;
  if (!v) {
    // nothing else
  } else if (v.kind === 'seme') {
    const { fill: shapes, rings } = semePieces(v, sb);
    ctx.fillStyle = hexOf(v.tincture);
    ctx.fill(shapes, 'evenodd');
    outline(ctx, shapes, lineWidth);
    if (v.charge === 'annulet') outline(ctx, rings, lineWidth);
  } else if (v.kind === 'ermine') {
    // Ermine spots are drawn solid, without an outline (an outline would blur the small tails)
    ctx.fillStyle = hexOf(v.spot);
    ctx.fill(erminePieces(v, sb));
  } else if (v.kind === 'vair') {
    const panes = vairPieces(v, sb);
    ctx.fillStyle = hexOf(v.second);
    ctx.fill(panes);
    outline(ctx, panes, lineWidth * 0.7);
  } else {
    const pieces = variationPieces(v.kind, v.count, sb);
    ctx.fillStyle = hexOf(v.second);
    ctx.fill(pieces);
    outline(ctx, pieces, lineWidth);
  }
  ctx.restore();
}

/** Small preview image (data URL) of a tincture, for the picker swatches. */
export function tinctureSwatch(t: Tincture, size = 64): string {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  fillFlat(ctx, t);
  return c.toDataURL();
}

/** The secondary tincture of an option (the one that must differ from / contrast with the ground). */
export function secondTincture(v: Variation): Tincture {
  switch (v.kind) {
    case 'seme': return v.tincture;
    case 'ermine': return v.spot;
    default: return v.second;
  }
}

/** A copy of the option with another second tincture. */
export function withSecond(v: Variation, tinc: Tincture): Variation {
  switch (v.kind) {
    case 'seme': return { ...v, tincture: tinc };
    case 'ermine': return { ...v, spot: tinc };
    default: return { ...v, second: tinc };
  }
}

/** Options whose second tincture lies *on* the ground (rule of tincture applies), not beside it. */
export function secondLiesOnGround(v: Variation): boolean {
  return v.kind === 'seme' || v.kind === 'ermine' || v.kind === 'vair';
}

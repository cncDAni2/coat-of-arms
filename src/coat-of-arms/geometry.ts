import { BaseInfo } from './coat-types';

export interface Bounds {
  left: number,
  top: number,
  width: number,
  height: number
}

/** Large enough to cover the whole canvas from any center point. */
const R = 2000;

function transformed(build: (p: Path2D) => void, matrix: DOMMatrix): Path2D {
  const raw = new Path2D();
  build(raw);
  const result = new Path2D();
  result.addPath(raw, matrix);
  return result;
}

/** Two half-planes split by a line through (px, py), rotated `deg` clockwise from vertical. [left/top, right/bottom] */
function halves(px: number, py: number, deg: number): Path2D[] {
  const m = new DOMMatrix().translate(px, py).rotate(deg);
  return [
    transformed(p => p.rect(-R, -R, R, 2 * R), m),
    transformed(p => p.rect(0, -R, R, 2 * R), m)
  ];
}

/** `n` equal wedges around (px, py). The first starts pointing left, then goes clockwise. */
function gyronny(px: number, py: number, n: number, shifted: boolean): Path2D[] {
  const step = (2 * Math.PI) / n;
  const start = shifted ? step / 2 : 0;
  const parts: Path2D[] = [];
  for (let k = 0; k < n; k++) {
    const a = Math.PI + start + k * step;
    const p = new Path2D();
    p.moveTo(px, py);
    p.arc(px, py, R, a, a + step);
    p.closePath();
    parts.push(p);
  }
  return parts;
}

/**
 * Builds the field division as a list of parts (in logical canvas coordinates).
 * Part k belongs to area `k % divided` (gyronny repeats its areas around the center).
 */
export function divisionParts(divisionId: string, bounds: Bounds, base: BaseInfo, offsetX: number, offsetY: number): Path2D[] {
  const px = bounds.left + bounds.width / 2 + offsetX;
  const py = bounds.top + bounds.height / 2 - offsetY;

  switch (divisionId) {
    case 'perpale': return halves(px, py, 0);
    case 'Perfess': return halves(px, py, 90);
    case 'Perbend': return halves(px, py, 135 + (base.perBendDegOffset || 0));
    case 'Perbentsinister': return halves(px, py, 45 - (base.perBendDegOffset || 0));
    case 'persaltire': return gyronny(px, py, 4, true);
    case 'quaterly': return gyronny(px, py, 4, false);
    case 'Gyronny6F': return gyronny(px, py, 6, false);
    case 'Gyronny6T': return gyronny(px, py, 6, true);
    case 'Gyronny8F': return gyronny(px, py, 8, false);
    case 'Gyronny8T': return gyronny(px, py, 8, true);
    case 'Gyronny12F': return gyronny(px, py, 12, false);
    case 'Gyronny12T': return gyronny(px, py, 12, true);
    case 'flat':
    default: {
      const p = new Path2D();
      p.rect(-R, -R, 2 * R, 2 * R);
      return [p];
    }
  }
}

/** Union of all parts that belong to the given area. */
export function areaPath(parts: Path2D[], divided: number, area: number): Path2D {
  const path = new Path2D();
  parts.forEach((part, k) => {
    if (k % divided === area) path.addPath(part);
  });
  return path;
}

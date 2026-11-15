import { drawCharge } from './charge-draw';
import { ChargeLayer, CoaState } from './coat-types';
import { AreaFill, secondLiesOnGround, secondTincture } from './field';
import { Bounds, divisionAdjacency } from './geometry';
import { t } from './i18n';
import { categoryOf, Tincture, TinctureCategory } from './tinctures';

/** Grid resolution of the analysis (logical canvas is 500×500). */
const N = 200;
const SIZE = 500;
const F = N / SIZE;

/** Thresholds (fractions) */
export const LIMITS = {
  outside: 0.02, // a free charge may stick out of its shield/area by this much (anti-aliasing, outline)
  touch: 0.2, // share of the upper charge over the lower one: up to this = touching / issuing from
  lieOn: 0.9, // from this = the upper charge lies on the lower one
  hidden: 0.5, // the upper charge may hide at most this much of the lower one (unless it lies on it)
  surface: 0.1, // an area counts as "under" a charge if it carries at least this share of it
  aboveTop: 0.01
};

export interface Problem {
  scope: { areas?: number[], chargeId?: number },
  text: () => string
}

interface ChargeAnalysis {
  raw: Uint8Array,
  vis: Uint8Array,
  rawCount: number,
  visCount: number,
  outsideShield: number,
  outsideArea: number,
  touchesBottom: boolean,
  aboveTop: number,
  /** Field areas under the charge (pixels not covered by lower charges): area index → share */
  surfaces: Map<number, number>
}

export interface Analysis {
  charges: Map<number, ChargeAnalysis>,
  overlaps: Map<string, number> // "lowerId:upperId" → ratio (intersection / smaller charge)
}

export interface AnalysisInput {
  shieldMask: CanvasImageSource,
  bounds: Bounds,
  areaPaths: Path2D[],
  charges: ChargeLayer[],
  images: Map<string, HTMLImageElement>
}

function grid(): CanvasRenderingContext2D {
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  return c.getContext('2d', { willReadFrequently: true })!;
}

function alphaMask(ctx: CanvasRenderingContext2D): Uint8Array {
  const data = ctx.getImageData(0, 0, N, N).data;
  const mask = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) mask[i] = data[i * 4 + 3] > 127 ? 1 : 0;
  return mask;
}

/** Pixel-level geometry of the current coat: what lies where, and on what. */
export function analyze(input: AnalysisInput): Analysis {
  const ctx = grid();
  const b = input.bounds;

  // Shield silhouette
  ctx.drawImage(input.shieldMask, b.left * F, b.top * F, b.width * F, b.height * F);
  const shield = alphaMask(ctx);
  const top = new Int16Array(N).fill(-1);
  const bottom = new Int16Array(N).fill(-1);
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      if (shield[y * N + x]) {
        if (top[x] < 0) top[x] = y;
        bottom[x] = y;
      }
    }
  }

  // Area map: index of the area under each pixel
  const areaMap = new Int8Array(N * N).fill(-1);
  input.areaPaths.forEach((path, k) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, N, N);
    ctx.setTransform(F, 0, 0, F, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fill(path);
    const m = alphaMask(ctx);
    for (let i = 0; i < N * N; i++) if (m[i] && shield[i]) areaMap[i] = k;
  });

  // Charges, bottom → top
  const charges = new Map<number, ChargeAnalysis>();
  const below = new Uint8Array(N * N); // union of the visible pixels of the charges drawn so far
  for (const layer of input.charges) {
    const img = input.images.get(layer.charge.url);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, N, N);
    if (img) {
      ctx.setTransform(F, 0, 0, F, 0, 0);
      drawCharge(ctx, layer, img);
    }
    const raw = alphaMask(ctx);
    const vis = new Uint8Array(N * N);
    let rawCount = 0, visCount = 0, outShield = 0, outArea = 0, above = 0;
    let touchesBottom = false;
    const surfaceCounts = new Map<number, number>();
    let surfaceTotal = 0;

    for (let i = 0; i < N * N; i++) {
      if (!raw[i]) continue;
      rawCount++;
      const x = i % N;
      const y = (i - x) / N;
      if (top[x] >= 0 && y < top[x]) above++;
      if (!shield[i]) {
        outShield++;
        continue;
      }
      if (layer.area !== 'all' && areaMap[i] !== layer.area) {
        outArea++;
        continue;
      }
      vis[i] = 1;
      visCount++;
      if (bottom[x] - y <= 2) touchesBottom = true;
      if (!below[i] && areaMap[i] >= 0) {
        surfaceCounts.set(areaMap[i], (surfaceCounts.get(areaMap[i]) || 0) + 1);
        surfaceTotal++;
      }
    }
    const surfaces = new Map<number, number>();
    surfaceCounts.forEach((count, area) => surfaces.set(area, count / (surfaceTotal || 1)));

    charges.set(layer.id, {
      raw, vis, rawCount, visCount,
      outsideShield: rawCount ? outShield / rawCount : 0,
      outsideArea: rawCount ? outArea / rawCount : 0,
      touchesBottom,
      aboveTop: rawCount ? above / rawCount : 0,
      surfaces
    });
    for (let i = 0; i < N * N; i++) if (vis[i]) below[i] = 1;
  }

  // Pairwise overlaps (shared visible pixels)
  const overlaps = new Map<string, number>();
  const layers = input.charges;
  for (let i = 0; i < layers.length; i++) {
    for (let j = i + 1; j < layers.length; j++) {
      const a = charges.get(layers[i].id)!;
      const c = charges.get(layers[j].id)!;
      if (!a.visCount || !c.visCount) continue;
      let inter = 0;
      for (let p = 0; p < N * N; p++) if (a.vis[p] && c.vis[p]) inter++;
      overlaps.set(`${layers[i].id}:${layers[j].id}`, inter);
    }
  }
  return { charges, overlaps };
}

// ------------------------------------------------------------------ Rules

function sameFill(a: AreaFill, b: AreaFill) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Every tincture an area shows: its ground, plus the second tincture of its variation / semé / fur. */
export function fillTinctures(fill: AreaFill): Tincture[] {
  return fill.variation ? [fill.tincture, secondTincture(fill.variation)] : [fill.tincture];
}

/**
 * A charge of category `cat` may stand on an area only if the area shows a tincture of the other category.
 * A field mixing a metal and a colour may carry either; a field of two metals (e.g. barry Or and Argent)
 * is still all metal, so a metal charge on it is metal on metal.
 */
function offersContrast(fill: AreaFill, cat: TinctureCategory) {
  return fillTinctures(fill).some(x => categoryOf(x) !== cat);
}

/** "Or" or "Or and Argent" — the tinctures of an area, for messages. */
export function fillTincturesText(fill: AreaFill) {
  return fillTinctures(fill).map(tn).join(t('word.and'));
}

const tn = (x: Tincture) => t('tincture.' + x);
const chargeName = (layer: ChargeLayer) => t('charge.' + layer.charge.id);
const ruleText = (cat: TinctureCategory) => t(cat === 'metal' ? 'err.rule.metal' : 'err.rule.colour');

export function evaluate(state: CoaState, areaCount: number, analysis: Analysis | null): Problem[] {
  const problems: Problem[] = [];
  const areas = state.areas.slice(0, areaCount);

  // Adjacent areas of the same tincture
  for (const [a, b] of divisionAdjacency(state.division.id)) {
    if (sameFill(areas[a], areas[b])) {
      problems.push({
        scope: { areas: [a, b] },
        text: () => t('err.sameAdjacent', { a: a + 1, b: b + 1, tincture: tn(areas[a].tincture) })
      });
    }
  }

  // Variations, semé and furs: the second tincture must differ from the ground,
  // and where it lies on the ground (semé, ermine spots, vair panes) it must be of the other category
  areas.forEach((fill, k) => {
    const v = fill.variation;
    if (!v) return;
    const second = secondTincture(v);
    if (second === fill.tincture) {
      problems.push({ scope: { areas: [k] }, text: () => t('err.variationSame', { area: k + 1, tincture: tn(second) }) });
    } else if (secondLiesOnGround(v) && categoryOf(second) === categoryOf(fill.tincture)) {
      problems.push({
        scope: { areas: [k] },
        text: () => t('err.optionTincture', {
          area: k + 1, option: t('variation.' + v.kind), second: tn(second), field: tn(fill.tincture), rule: ruleText(categoryOf(second))
        })
      });
    }
  });

  if (!analysis) return problems;

  // Charges
  state.charges.forEach((layer, index) => {
    const a = analysis.charges.get(layer.id);
    if (!a || !a.rawCount) return;
    const scope = { chargeId: layer.id };
    const name = () => chargeName(layer);

    if (layer.charge.anchor === 'free') {
      if (a.outsideShield > LIMITS.outside) {
        problems.push({ scope, text: () => t('err.outsideShield', { charge: name() }) });
      } else if (layer.area !== 'all' && a.outsideArea > LIMITS.outside) {
        const area = layer.area + 1;
        problems.push({ scope, text: () => t('err.outsideArea', { charge: name(), area }) });
      }
    } else {
      if (!a.touchesBottom) problems.push({ scope, text: () => t('err.baseNotTouching', { charge: name() }) });
      if (a.aboveTop > LIMITS.aboveTop) problems.push({ scope, text: () => t('err.baseTop', { charge: name() }) });
    }

    // Overlaps with the charges below
    let liesOnCharge = false;
    for (const lower of state.charges.slice(0, index)) {
      const inter = analysis.overlaps.get(`${lower.id}:${layer.id}`) ?? 0;
      const lowerA = analysis.charges.get(lower.id)!;
      if (!inter || !lowerA.visCount) continue;
      const onLower = inter / a.visCount; // how much of this charge lies on the lower one
      const hidden = inter / lowerA.visCount; // how much of the lower one it hides
      if (onLower < LIMITS.lieOn && hidden > LIMITS.hidden) {
        problems.push({ scope, text: () => t('err.covers', { upper: name(), lower: chargeName(lower) }) });
      } else if (onLower < LIMITS.lieOn && onLower > LIMITS.touch && hidden > LIMITS.touch) {
        // Touching / issuing from one another is fine when either of them is only slightly involved
        // (e.g. a cross issuing from a crown: little of the cross is hidden)
        const percent = Math.round(Math.min(onLower, hidden) * 100);
        problems.push({ scope, text: () => t('err.overlap', { upper: name(), lower: chargeName(lower), percent }) });
      } else if (onLower >= LIMITS.lieOn) {
        liesOnCharge = true;
        const cat = categoryOf(layer.charge.tincture);
        if (!layer.charge.exempt && cat === categoryOf(lower.charge.tincture)) {
          problems.push({
            scope,
            text: () => t('err.chargeOnCharge', {
              upper: name(), upperTincture: tn(layer.charge.tincture),
              lower: chargeName(lower), lowerTincture: tn(lower.charge.tincture), rule: ruleText(cat)
            })
          });
        }
      }
    }

    // Rule of tincture against the field
    if (liesOnCharge || layer.charge.exempt) return;
    const cat = categoryOf(layer.charge.tincture);
    const under = [...a.surfaces.entries()].filter(([, share]) => share >= LIMITS.surface).map(([k]) => k);
    if (!under.length) return;
    if (under.some(k => offersContrast(areas[k], cat))) return;
    const surface = areas[under[0]];
    problems.push({
      scope: { ...scope, areas: under },
      text: () => t('err.tinctureRule', {
        charge: name(), chargeTincture: tn(layer.charge.tincture),
        surface: fillTincturesText(surface), rule: ruleText(cat)
      })
    });
  });

  return problems;
}

/**
 * Why `candidate` can't be placed against `other` by the rule of tincture (null = allowed).
 * `what` describes the thing that is already there (in the current language).
 */
export function tinctureConflict(candidate: Tincture, other: Tincture, what: string, forCharge = false): string | null {
  const c = categoryOf(candidate);
  if (c !== categoryOf(other)) return null;
  if (forCharge) return t(c === 'metal' ? 'reason.metalOnMetalCharge' : 'reason.colourOnColourCharge', { what });
  return c === 'metal'
    ? t('reason.metalOnMetal', { what, colours: ['gules', 'azure', 'vert', 'sable', 'purpure'].map(x => t('tincture.' + x)).join(', ') })
    : t('reason.colourOnColour', { what });
}

import { ChargeLayer } from './coat-types';

/** How far (in logical units) a base charge is continued downwards: past the bottom of any shield. */
const BASE_EXTENT = 1000;

/**
 * Draws a charge layer. A charge issuing from the base (e.g. a trimount) is drawn as its top only
 * (the mounds); the program continues its last pixel row (fill + side outlines) straight down, so it
 * always rises from the base of the shield, clipped by the shield / its area like everything else.
 * Base charges are never rotated or flipped vertically, so "down" in the layer is down on the shield.
 */
export function drawCharge(ctx: CanvasRenderingContext2D, layer: ChargeLayer, img: HTMLImageElement) {
  const { width: w, height: h } = layer;
  ctx.save();
  ctx.translate(layer.x, layer.y);
  ctx.rotate(layer.rotation);
  ctx.scale(layer.scale * (layer.flipX ? -1 : 1), layer.scale * (layer.flipY ? -1 : 1));
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  if (layer.charge.anchor === 'base' && img.naturalHeight > 2) {
    const overlap = 0.5 / layer.scale; // hide the seam
    ctx.drawImage(img, 0, img.naturalHeight - 2, img.naturalWidth, 1,
      -w / 2, h / 2 - overlap, w, BASE_EXTENT / layer.scale);
  }
  ctx.restore();
}

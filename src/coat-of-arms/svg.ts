const textCache = new Map<string, Promise<string>>();

function loadSvgText(url: string): Promise<string> {
  let text = textCache.get(url);
  if (!text) {
    text = fetch(url).then(r => {
      if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status}`);
      return r.text();
    });
    textCache.set(url, text);
  }
  return text;
}

function parse(text: string): SVGSVGElement {
  return new DOMParser().parseFromString(text, 'image/svg+xml').documentElement as unknown as SVGSVGElement;
}

/** Intrinsic size of an SVG, taken from its viewBox (falling back to width/height). */
export async function svgSize(url: string): Promise<{ width: number, height: number }> {
  const root = parse(await loadSvgText(url));
  const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if (viewBox && viewBox.length === 4) return { width: viewBox[2], height: viewBox[3] };
  return { width: parseFloat(root.getAttribute('width') || '100'), height: parseFloat(root.getAttribute('height') || '100') };
}

export interface SvgPaint {
  fill?: string,
  stroke?: string
}

/**
 * Rasterizes an SVG to an image of exactly width×height pixels.
 * `paint` overrides the fill/stroke of every shape (used for the shield mask and outline).
 */
export async function rasterizeSvg(url: string, width: number, height: number, paint?: SvgPaint): Promise<HTMLImageElement> {
  const root = parse(await loadSvgText(url));
  root.setAttribute('width', String(Math.max(1, Math.round(width))));
  root.setAttribute('height', String(Math.max(1, Math.round(height))));
  root.setAttribute('preserveAspectRatio', 'none');

  if (paint) {
    root.querySelectorAll<SVGElement>('path, circle, ellipse, rect, polygon, polyline').forEach(shape => {
      if (paint.fill !== undefined) shape.style.fill = paint.fill;
      if (paint.stroke !== undefined) shape.style.stroke = paint.stroke;
    });
  }

  const blob = new Blob([new XMLSerializer().serializeToString(root)], { type: 'image/svg+xml' });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

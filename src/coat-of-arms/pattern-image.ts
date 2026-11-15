import { patternOptions } from './coat-types';

/**
 * Builds a canvas tile from a pattern SVG: recolors its shapes, then applies background, padding and scale.
 * The result is used as the source of a CanvasPattern.
 */
export async function createCanvasImageSourceFromSVG(options: patternOptions): Promise<CanvasImageSource> {
  try {
    const modifiedSVG = await loadAndModifySVG(options.url, options.shapeColors || [], options.multipleColors);
    const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(modifiedSVG);
    return await createCanvasImageSource(svgDataUrl, options.padding || 0, options.bgColor || 'rgba(0,0,0,0)', options.scale || 1);
  } catch (error) {
    throw new Error('Failed to load image: ' + error);
  }
}

// #1, color modification
async function loadAndModifySVG(url: string, colors: string[], multipleColors?: number[][]): Promise<string> {
  const response = await fetch(url);
  const svgText = await response.text();
  const svgDoc = new DOMParser().parseFromString(svgText, 'image/svg+xml');

  let allIndex = 0;
  // Order matters: circles, then paths, then rects (shapeColors / multipleColors indexes rely on it)
  for (const selector of ['circle', 'path', 'rect']) {
    svgDoc.querySelectorAll(selector).forEach((shape) => {
      shape.setAttribute('fill', colors[convertAllIndex(allIndex, multipleColors)] || 'black');
      allIndex++;
    });
  }

  return new XMLSerializer().serializeToString(svgDoc);
}

/**
 * Search index in the matrix, then return the index of the array if multipleColors is provided
 */
function convertAllIndex(index: number, multipleColors?: number[][]): number {
  if (!multipleColors) return index;
  for (let i = 0; i < multipleColors.length; i++) {
    if (multipleColors[i].includes(index)) return i;
  }
  return index;
}

// #2, create the canvas, add bgColor, padding, scale
function createCanvasImageSource(url: string, padding: number, bgColor = 'rgba(0, 0, 0, 0)', scale = 1): Promise<CanvasImageSource> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // This is necessary if the image is from a different origin
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return reject(new Error('2D canvas context is not available'));

      const width = img.width * scale + 2 * padding;
      const height = img.height * scale + 2 * padding;
      canvas.width = width;
      canvas.height = height;

      context.fillStyle = bgColor;
      context.fillRect(0, 0, width, height);
      context.drawImage(img, padding, padding, img.width * scale, img.height * scale);

      resolve(canvas);
    };

    img.onerror = (error) => reject(new Error('Failed to load image: ' + error));
  });
}

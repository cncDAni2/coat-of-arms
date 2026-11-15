import * as fabric from 'fabric';

export async function flat(baseObject: fabric.Object) {
  const all = await baseObject.clone();
  all.set({
    hoverCursor: 'default',
    selectable: false
  });
  return [all];
}

export async function divide2(baseObject: fabric.Object, deg = 0, offsetY = 0, offsetX = 0) {
  // Create left half by clipping
  const bounds = baseObject.getBoundingRect();
  const leftHalf = await baseObject.clone();

  const leftHalfClipPath = new fabric.Rect({
    left: bounds.left + (bounds.width / 2) - bounds.height + offsetX,
    top: bounds.top - bounds.height * 0.5 - offsetY,
    width: bounds.height,
    height: bounds.height * 2, // Make sure it covers
    absolutePositioned: true
  });
  rotateRectangleByRightCenter(leftHalfClipPath, deg);
  leftHalf.set({
    selectable: false,
    hoverCursor: 'default',
    fill: 'blue',
    clipPath: leftHalfClipPath
  });

  const rightHalfClipPath = await new fabric.Rect({
    left: bounds.left + (bounds.width / 2) + offsetX,
    top: bounds.top - bounds.height * 0.5 - offsetY,
    width: bounds.height,
    height: bounds.height * 2, // Make sure it covers
    absolutePositioned: true
  });
  rotateRectangleByRightCenter(rightHalfClipPath, deg, 'left');
  const rightHalf = await baseObject.clone();
  rightHalf.set({
    fill: 'red',
    selectable: false,
    hoverCursor: 'default',
    clipPath: rightHalfClipPath
  });

  return [leftHalf, rightHalf];

  function rotateRectangleByRightCenter(rect: fabric.Rect, angle: number, side = 'right') {
    // Get the right center point of the rectangle
    const rightCenterX = rect.left + (side == 'left' ? 0 : rect.width);
    const rightCenterY = rect.top + rect.height / 2;

    // Set the origin of transformation to the right center of the rectangle
    rect.set({
      originX: side,
      originY: 'center',
      angle: angle
    });

    // Move the rectangle back to its original position
    rect.set({
      left: rightCenterX,
      top: rightCenterY
    });
  }
}

/** gyronny (2, 4, 8, 12, + feles-eltolás opció kéne*/
export async function gyronny(baseObject: fabric.Object, numberOfPart: number, isShifted = false, centerOffsetX = 0, centerOffsetY = 0): Promise<fabric.Object[]> {
  return new Promise((resolve, reject) => {
    const bounds = baseObject.getBoundingRect();

    fabric.loadSVGFromURL(`coat-of-arms/pattern-gyronny-${numberOfPart}.svg`, async (_orig, baseTriangle) => {
      if (!baseTriangle) {
        return reject(new Error('Failed to load SVG'));
      }

      const parts: fabric.Object[] = [];
      const baseObjectCenterX = bounds.left + (bounds.width / 2) + centerOffsetX;
      const baseObjectCenterY = bounds.top + (bounds.height / 2) + centerOffsetY;
      baseTriangle.scaleToHeight(bounds.height);

      baseTriangle.set({
        originX: 'right',
        originY: 'bottom'
      });
      let myColor = 'blue';
      const indexStep = 360 / numberOfPart;
      for (let i = isShifted ? (indexStep / 2) : 0; i < 360; i += indexStep) {
        const step = await baseObject.clone();
        const triangle = await baseTriangle.clone();
        triangle.rotate(i);
        triangle.set({
          left: baseObjectCenterX,
          top: baseObjectCenterY,
          absolutePositioned: true
        });

        myColor = myColor === 'blue' ? 'red' : 'blue';
        step.set({
          fill: myColor,
          // fill: `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`,
          selectable: false,
          hoverCursor: 'default',
          clipPath: triangle
        });

        parts.push(step);
      }
      resolve(parts);
    });
  });
}

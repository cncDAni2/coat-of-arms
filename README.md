# Coat of Arms Creator

A frontend-only app for building coats of arms (escutcheon shape, field division, colors/patterns, charge) and downloading the result as an image.

Vite + TypeScript, no framework and no canvas library: rendering and the charge transform tool are native Canvas 2D.

## Using charges

1. Under **Charges → Add charge**, pick where the charge goes: the whole shield or one of the division's areas.
2. Click a charge. It appears in the middle of that area, already selected, and gets a row in the layer list.
3. On the shield:
   - **drag inside the blue box** to move it (it is always clipped to its area)
   - **drag a corner dot** to scale it
   - **drag outside the box, still on the shield**, to rotate it (hold Shift to snap to 15°)
4. Drag the rows in the layer list to change stacking (top row = front). A row's dropdown moves the charge to another area.

Keyboard: arrow keys nudge (Shift = 10 px), Delete removes, Esc deselects.

## Commands

- `pnpm install` installs the dependencies
- `pnpm dev` starts the dev server (http://localhost:5173) with live reload
- `pnpm build` runs a type check and builds production into `dist/`
- `pnpm preview` serves the built `dist/` locally

## Structure

- `index.html` is the entry page
- `src/main.ts` mounts the creator on `#app`
- `src/coat-of-arms/creator.ts` holds the creator (state, option panel, rendering, pointer handling)
- `src/coat-of-arms/coat-database.ts` lists the selectable shapes, divisions, patterns and charges
- `src/coat-of-arms/geometry.ts` builds the field divisions as `Path2D` parts (also used as charge clip regions)
- `src/coat-of-arms/transform-tool.ts` is the move / scale / rotate tool (hit-testing, drag math, blue gizmo)
- `src/coat-of-arms/svg.ts` loads SVGs and rasterizes them (shield mask and outline, charges)
- `src/coat-of-arms/pattern-image.ts` recolors pattern SVGs and turns them into canvas tiles
- `src/embers.ts` is the background ember effect
- `src/coat-of-arms/range-slider.ts` and `dom.ts` are the slider and a small DOM builder helper
- `public/coat-of-arms/` holds the images (shapes, divisions, patterns, charges)

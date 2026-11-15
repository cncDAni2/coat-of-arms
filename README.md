# Coat of Arms Creator

A frontend-only app for building coats of arms (escutcheon shape, field division, colors/patterns, charge) and downloading the result as an image.

Vite + TypeScript, no framework. The canvas is handled by [fabric.js](https://fabricjs.com/).

## Commands

- `pnpm install` installs the dependencies
- `pnpm dev` starts the dev server (http://localhost:5173) with live reload
- `pnpm build` runs a type check and builds production into `dist/`
- `pnpm preview` serves the built `dist/` locally

## Structure

- `index.html` is the entry page
- `src/main.ts` mounts the creator on `#app`
- `src/coat-of-arms/creator.ts` holds the creator (state, option panel, canvas logic)
- `src/coat-of-arms/coat-database.ts` lists the selectable shapes, divisions, patterns and charges
- `src/coat-of-arms/divisions/utils.ts` contains the field division geometry
- `src/coat-of-arms/pattern-image.ts` recolors pattern SVGs and turns them into canvas tiles
- `src/coat-of-arms/range-slider.ts` and `dom.ts` are the slider and a small DOM builder helper
- `public/coat-of-arms/` holds the images (shapes, divisions, patterns, charges)

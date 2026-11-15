import { BaseInfo, ChargeArea, ChargeData, ChargeLayer, CoaState, DividentImagesInfo, PatternData } from './coat-types';
import * as db from './coat-database';
import { createCanvasImageSourceFromSVG } from './pattern-image';
import { rangeSlider } from './range-slider';
import { h } from './dom';
import { areaPath, Bounds, divisionParts } from './geometry';
import { rasterizeSvg, svgSize } from './svg';
import { applyDrag, containsPoint, cursorFor, DragState, drawGizmo, hitTest } from './transform-tool';

/**
 * https://coamaker.com
 * https://en.wikipedia.org/wiki/Coat_of_arms
 * https://heraldry.sca.org/armory/newprimer/h4f5.html
 * https://hu.pinterest.com/pin/60939401202910889/
 *
 * https://svgcrop.com/
 * https://vectorizer.com
 */

/** Logical canvas size; all geometry is in these units. */
const SIZE = 500;
/** The escutcheon's larger side, in logical units. */
const BASE_SIZE = 300;
/** Export resolution multiplier. */
const EXPORT_RATIO = 2;
/** Resolution multiplier for rasterized assets (masks, pattern tiles), so they stay crisp on export too. */
const RASTER_RATIO = Math.max(EXPORT_RATIO, window.devicePixelRatio || 1);
/** Larger side of rasterized charge images, in pixels. */
const CHARGE_RASTER_SIZE = 1024;

interface Shield {
  bounds: Bounds,
  mask: HTMLImageElement, // silhouette, used with destination-in
  outline: HTMLImageElement, // stroke only, drawn on top
  hitAlpha: Uint8ClampedArray // alpha of the silhouette at SIZE×SIZE, for "inside the shield" checks
}

export class CoatOfArmsCreator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private optionsEl: HTMLElement;
  private workCanvases = new Map<number, HTMLCanvasElement>();

  private shield: Shield | null = null;
  private shieldLoadId = 0;
  private parts: Path2D[] = [];
  private patternFills: (CanvasPattern | null)[] = [null, null, null, null];
  private chargeImages = new Map<string, HTMLImageElement>();
  private nextChargeId = 1;

  private drag: DragState | null = null;
  private drawScheduled = false;
  private draggedLayerId: number | null = null;

  private state: CoaState = {
    backgroundColor: 'transparent',
    selectedBase: {
      shape: db.baseInfo[0],
      background: '#000000',
      stroke: '#000000',
      offsetX: 0,
      offsetY: 0
    },
    selectedDiv: {
      shape: db.dividentImagesInfo[0],
      colors: ['#FF0000', '#0000FF', '#FFFF00', '#FFFFFF'],
      pattern: [null, null, null, null]
    },
    charges: [],
    selectedChargeId: null,
    chargeTarget: 'all'
  };

  constructor(root: HTMLElement) {
    db.dividentImagesInfo.forEach((o, i) => o.i = i);
    db.patternData.forEach((o, i) => o.i = i);

    this.optionsEl = h('div', { class: 'coa-creator-options' });
    this.canvas = h('canvas', { class: 'coa-canvas' });
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not supported');
    this.ctx = ctx;

    root.append(
      h('div', { class: 'coa-creator' }, [
        this.optionsEl,
        h('div', { class: 'coa-creator-display' }, [
          h('header', { class: 'coa-header' }, [
            h('h1', {}, ['Coat of Arms']),
            h('p', {}, ['Ars Heraldica · design your device'])
          ]),
          h('div', { class: 'canvas-frame' }, [this.canvas]),
          h('div', { class: 'download-image' }, [
            h('button', { type: 'button', onclick: () => this.saveCanvasAsImage() }, ['Download image'])
          ])
        ])
      ])
    );

    this.resizeCanvas();
    window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', () => this.resizeCanvas());
    this.bindCanvasEvents();
    this.bindKeyboard();

    this.render();
    this.loadShield();
  }

  // ================================================================ Panel UI

  /** Rebuilds the option panel from the current state, keeping open <details> open. */
  private render() {
    const openKeys = new Set(
      [...this.optionsEl.querySelectorAll<HTMLDetailsElement>('details[data-key]')]
        .filter(d => d.open)
        .map(d => d.dataset['key'])
    );
    const scrollTop = this.optionsEl.scrollTop;

    this.optionsEl.replaceChildren(
      ...this.renderGeneral(),
      ...this.renderEscutcheon(),
      ...this.renderFieldAreas(),
      ...this.renderCharges()
    );

    this.optionsEl.querySelectorAll<HTMLDetailsElement>('details[data-key]').forEach(d => {
      d.open = openKeys.has(d.dataset['key']);
    });
    this.optionsEl.scrollTop = scrollTop;
  }

  private details(key: string, summary: string, content: (Node | null | false)[]) {
    // The unfold animation class is only added on a real click, so re-renders don't replay it
    const el = h('details', { 'data-key': key }, [
      h('summary', { onclick: () => el.classList.add('animate-open') }, [summary]),
      h('div', { class: 'detail-content' }, content)
    ]);
    return el;
  }

  private colorOption(label: string, inputs: HTMLElement[]) {
    return h('div', { class: 'coa-option' }, [
      h('div', { class: 'coa-option-name' }, [label]),
      h('div', { class: 'coa-option-value' }, inputs)
    ]);
  }

  private colorInput(value: string, onChange: (color: string) => void, extraClass = '') {
    const input = h('input', { type: 'color', value, class: extraClass, onchange: () => onChange(input.value) });
    return input;
  }

  private renderGeneral() {
    const isTransparent = this.state.backgroundColor === 'transparent';
    return [
      h('span', { class: 'coa-title' }, ['General']),
      h('div', { class: 'coa-option' }, [
        h('div', { class: 'coa-option-name' }, ['Background color']),
        h('div', { class: 'coa-option-value' }, [
          this.colorInput(
            isTransparent ? '#000000' : this.state.backgroundColor,
            c => this.changeBackgroundColor(c),
            isTransparent ? 'unused-input' : ''
          )
        ]),
        h('div', {
          class: 'delete-button',
          title: 'Remove background',
          onclick: () => this.changeBackgroundColor('transparent')
        }, ['✕'])
      ])
    ];
  }

  private renderEscutcheon() {
    const { selectedBase, selectedDiv } = this.state;
    const div = selectedDiv.shape;

    return [
      h('span', { class: 'coa-title' }, ['Escutcheon']),
      this.details('base', 'Choose escutcheon shape', [
        ...db.baseInfo.map(item => h('img', {
          src: 'coat-of-arms/base_' + item.id + '.svg',
          alt: 'base' + item.id,
          title: String(item.id),
          class: 'selectable-shape' + (selectedBase.shape.id === item.id ? ' selected' : ''),
          onclick: () => this.selectBase(item)
        })),
        this.colorOption('Stroke color', [this.colorInput(selectedBase.stroke, c => this.switchBaseColor(c))])
      ]),
      this.details('division', 'Choose field division', [
        ...db.dividentImagesInfo.map(item => h('img', {
          src: 'coat-of-arms/divides/' + item.id + '.png',
          alt: 'divide_' + item.id,
          title: item.id,
          class: 'selectable-shape' + (div.id === item.id ? ' selected' : ''),
          onclick: () => this.selectDiv(item)
        })),
        div.divided > 1 && h('div', { class: 'dual-option' }, [
          div.x && rangeSlider({ min: -75, max: 75, step: 1, title: 'Horizontal position' }, selectedBase.offsetX, v => {
            selectedBase.offsetX = v;
            this.updateDivision();
          }),
          div.y && rangeSlider({ min: -60, max: 60, step: 1, title: 'Vertical position' }, selectedBase.offsetY, v => {
            selectedBase.offsetY = v;
            this.updateDivision();
          })
        ])
      ])
    ];
  }

  private renderFieldAreas() {
    const { selectedDiv } = this.state;
    const areas: HTMLElement[] = [h('span', { class: 'coa-title' }, ['Field Areas'])];

    for (let areaIndex = 0; areaIndex < this.areaCount; areaIndex++) {
      const pattern = selectedDiv.pattern[areaIndex];
      type PatternNumberKey = 'scale' | 'padding' | 'offsetX' | 'offsetY';
      const patternSlider = (title: string, min: number, max: number, step: number, key: PatternNumberKey) =>
        pattern && rangeSlider({ min, max, step, title }, pattern[key], v => {
          pattern[key] = v;
          this.refreshPattern(areaIndex);
        });

      areas.push(this.details('area' + areaIndex, 'Area #' + (areaIndex + 1), [
        this.colorOption('Area background color', [
          this.colorInput(selectedDiv.colors[areaIndex], c => this.switchDivColor(areaIndex, c))
        ]),
        h('span', { class: 'detail-option' }, ['Select pattern']),
        h('br'),
        h('div', { class: 'shapes-box' }, db.patternData.map(item => {
          const selected = pattern ? pattern.i === item.i : item.i === 0;
          return h('div', { class: 'selectable-shape-box' }, [
            h('img', {
              src: 'coat-of-arms/patterns/' + item.preview,
              alt: item.name,
              title: item.name,
              class: 'selectable-shape' + (selected ? ' selected' : ''),
              onclick: () => this.modifyPattern(areaIndex, item)
            })
          ]);
        })),
        !!pattern && h('div', { class: 'dual-option' }, [
          patternSlider('Scale', 0.1, 5, 0.1, 'scale'),
          patternSlider('Gap', 0, 20, 1, 'padding')
        ]),
        !!pattern && h('div', { class: 'dual-option' }, [
          patternSlider('X offset', -50, 50, 1, 'offsetX'),
          patternSlider('Y offset', -50, 50, 1, 'offsetY')
        ]),
        !!pattern && this.colorOption('Pattern shape colors', pattern.shapeColors.map((color, idx) =>
          this.colorInput(color, c => this.changePatternColor(pattern.shapeColors, idx, c))
        ))
      ]));
    }
    return areas;
  }

  private areaLabel(area: ChargeArea) {
    return area === 'all' ? 'Whole shield' : 'Area #' + (area + 1);
  }

  private renderCharges() {
    const { charges, chargeTarget, selectedChargeId } = this.state;
    const targets: ChargeArea[] = ['all', ...Array.from({ length: this.areaCount > 1 ? this.areaCount : 0 }, (_, i) => i)];

    // Top of the list = topmost on the shield
    const rows = [...charges].reverse().map(layer => this.renderChargeRow(layer, targets, layer.id === selectedChargeId));

    const chip = (area: ChargeArea) => h('button', {
      type: 'button',
      class: 'chip' + (area === chargeTarget ? ' selected' : ''),
      onclick: () => {
        this.state.chargeTarget = area;
        this.render();
      }
    }, [this.areaLabel(area)]);
    const areaTargets = targets.filter(area => area !== 'all');

    return [
      h('span', { class: 'coa-title' }, ['Charges']),
      this.details('charge', 'Add charge', [
        h('div', { class: 'place-in' }, [
          h('span', { class: 'detail-option' }, ['Place in']),
          chip('all')
        ]),
        areaTargets.length > 0 && h('div', { class: 'chip-row' }, areaTargets.map(chip)),
        h('span', { class: 'detail-option' }, ['Choose charge']),
        h('div', { class: 'charge-picker' }, db.chargeData.map(item => h('img', {
          src: item.url,
          alt: item.name,
          title: item.name,
          class: 'selectable-shape charge-shape',
          onclick: () => this.addCharge(item)
        })))
      ]),
      charges.length
        ? h('ul', { class: 'charge-layers', 'aria-label': 'Charge layers (top is front)' }, rows)
        : h('p', { class: 'charge-empty' }, ['No charges yet. Add one above, then drag it on the shield.'])
    ];
  }

  private renderChargeRow(layer: ChargeLayer, targets: ChargeArea[], selected: boolean) {
    const areaSelect = h('select', {
      class: 'layer-area',
      title: 'Area this charge is clipped to',
      onchange: () => {
        layer.area = areaSelect.value === 'all' ? 'all' : Number(areaSelect.value);
        this.scheduleDraw();
      }
    }, targets.map(area => {
      const option = h('option', { value: String(area) }, [this.areaLabel(area)]);
      option.selected = area === layer.area;
      return option;
    }));

    const row = h('li', {
      class: 'charge-layer' + (selected ? ' selected' : ''),
      draggable: 'true',
      'data-id': layer.id,
      onclick: (e: Event) => {
        if ((e.target as HTMLElement).closest('select, button')) return;
        this.selectCharge(layer.id);
      },
      ondragstart: (e: Event) => {
        this.draggedLayerId = layer.id;
        (e as DragEvent).dataTransfer?.setData('text/plain', String(layer.id));
        if ((e as DragEvent).dataTransfer) (e as DragEvent).dataTransfer!.effectAllowed = 'move';
        requestAnimationFrame(() => row.classList.add('dragging'));
      },
      ondragend: () => {
        this.draggedLayerId = null;
        row.classList.remove('dragging');
        this.optionsEl.querySelectorAll('.drop-before, .drop-after').forEach(el => el.classList.remove('drop-before', 'drop-after'));
      },
      ondragover: (e: Event) => {
        if (this.draggedLayerId === null || this.draggedLayerId === layer.id) return;
        e.preventDefault();
        const after = this.isLowerHalf(row, e as DragEvent);
        row.classList.toggle('drop-after', after);
        row.classList.toggle('drop-before', !after);
      },
      ondragleave: () => row.classList.remove('drop-before', 'drop-after'),
      ondrop: (e: Event) => {
        e.preventDefault();
        if (this.draggedLayerId !== null) this.moveLayer(this.draggedLayerId, layer.id, this.isLowerHalf(row, e as DragEvent));
      }
    }, [
      h('span', { class: 'layer-grip', 'aria-hidden': 'true' }, ['⠿']),
      h('img', { class: 'layer-thumb', src: layer.charge.url, alt: '' }),
      h('span', { class: 'layer-name' }, [layer.charge.name]),
      areaSelect,
      h('button', {
        type: 'button',
        class: 'delete-button layer-delete',
        title: 'Remove charge',
        onclick: () => this.removeCharge(layer.id)
      }, ['✕'])
    ]);
    return row;
  }

  private isLowerHalf(el: HTMLElement, e: DragEvent) {
    const rect = el.getBoundingClientRect();
    return e.clientY > rect.top + rect.height / 2;
  }

  // ================================================================ Actions

  private get areaCount() {
    return Math.min(this.state.selectedDiv.shape.divided, 4);
  }

  changeBackgroundColor(color: string) {
    this.state.backgroundColor = color;
    this.render();
    this.scheduleDraw();
  }

  selectBase(baseInfo: BaseInfo) {
    this.state.selectedBase.shape = baseInfo;
    this.state.selectedBase.offsetY = baseInfo.offsetY || 0;
    this.state.selectedBase.offsetX = baseInfo.offsetX || 0;
    this.render();
    this.loadShield();
  }

  switchBaseColor(newColor: string) {
    this.state.selectedBase.background = newColor;
    this.state.selectedBase.stroke = newColor;
    this.loadShield();
  }

  selectDiv(i: DividentImagesInfo) {
    this.state.selectedDiv.shape = i;
    this.state.selectedBase.offsetY = this.state.selectedBase.shape.offsetY || 0;
    this.state.selectedBase.offsetX = this.state.selectedBase.shape.offsetX || 0;

    // Charges in areas that no longer exist fall back to the whole shield
    const valid = (area: ChargeArea) => area === 'all' || (i.divided > 1 && area < this.areaCount);
    this.state.charges.forEach(layer => { if (!valid(layer.area)) layer.area = 'all'; });
    if (!valid(this.state.chargeTarget)) this.state.chargeTarget = 'all';

    this.updateDivision();
    this.render();
  }

  switchDivColor(index: number, newColor: string) {
    this.state.selectedDiv.colors[index] = newColor;
    const pattern = this.state.selectedDiv.pattern[index];
    if (pattern) {
      pattern.bgColor = newColor;
      this.refreshPattern(index);
    } else {
      this.scheduleDraw();
    }
  }

  modifyPattern(index: number, patternOption: PatternData) {
    if (patternOption.url == '') {
      this.state.selectedDiv.pattern[index] = null;
      this.patternFills[index] = null;
      this.scheduleDraw();
    } else {
      this.state.selectedDiv.pattern[index] = {
        url: patternOption.url,
        bgColor: this.state.selectedDiv.colors[index],
        padding: patternOption.basePadding,
        scale: patternOption.baseScale,
        offsetY: 0,
        offsetX: 0,
        shapeColors: [...patternOption.shapeColors],
        multipleColors: patternOption.multipleColors,
        i: patternOption.i
      };
      this.refreshPattern(index);
    }
    this.render();
  }

  changePatternColor(colorArray: string[], index: number, color: string) {
    colorArray[index] = color;
    this.refreshPattern();
  }

  async addCharge(charge: ChargeData) {
    if (!this.shield) return;
    const area = this.state.chargeTarget;
    const [size] = await Promise.all([svgSize(charge.url), this.loadChargeImage(charge)]);

    // Unscaled size: larger side = 100 logical units
    const ratio = 100 / Math.max(size.width, size.height);
    const width = size.width * ratio;
    const height = size.height * ratio;

    // Start in the middle of the chosen area, sized to fit comfortably inside it
    const region = this.measureRegion(area);
    const scale = Math.max(0.1, 0.6 * Math.min(region.width / width, region.height / height));

    const layer: ChargeLayer = {
      id: this.nextChargeId++,
      charge,
      area,
      x: region.cx,
      y: region.cy,
      width,
      height,
      scale,
      rotation: 0
    };
    this.state.charges.push(layer);
    this.state.selectedChargeId = layer.id;
    this.render();
    this.scheduleDraw();
  }

  selectCharge(id: number | null) {
    if (this.state.selectedChargeId === id) return;
    this.state.selectedChargeId = id;
    this.render();
    this.scheduleDraw();
  }

  removeCharge(id: number) {
    this.state.charges = this.state.charges.filter(layer => layer.id !== id);
    if (this.state.selectedChargeId === id) this.state.selectedChargeId = null;
    this.render();
    this.scheduleDraw();
  }

  /** Moves a layer before/after another one in the list (list order is top → bottom). */
  private moveLayer(draggedId: number, targetId: number, after: boolean) {
    if (draggedId === targetId) return;
    const list = [...this.state.charges].reverse();
    const dragged = list.find(layer => layer.id === draggedId);
    if (!dragged) return;
    const without = list.filter(layer => layer.id !== draggedId);
    const targetIndex = without.findIndex(layer => layer.id === targetId);
    without.splice(targetIndex + (after ? 1 : 0), 0, dragged);
    this.state.charges = without.reverse();
    this.render();
    this.optionsEl.querySelector(`.charge-layer[data-id="${draggedId}"]`)?.classList.add('just-dropped');
    this.scheduleDraw();
  }

  private get selectedCharge(): ChargeLayer | undefined {
    return this.state.charges.find(layer => layer.id === this.state.selectedChargeId);
  }

  saveCanvasAsImage() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = SIZE * EXPORT_RATIO;
    exportCanvas.height = SIZE * EXPORT_RATIO;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;
    this.drawScene(ctx, EXPORT_RATIO, false);

    const link = document.createElement('a');
    link.href = exportCanvas.toDataURL('image/png');
    link.download = 'coa_img.png';
    link.click();
  }

  // ================================================================ Assets

  private async loadShield() {
    const loadId = ++this.shieldLoadId;
    const url = 'coat-of-arms/base_' + this.state.selectedBase.shape.id + '.svg';
    const size = await svgSize(url);

    const scale = BASE_SIZE / Math.max(size.width, size.height);
    const bounds: Bounds = {
      width: size.width * scale,
      height: size.height * scale,
      left: (SIZE - size.width * scale) / 2,
      top: (SIZE - size.height * scale) / 2
    };
    const pxW = bounds.width * RASTER_RATIO;
    const pxH = bounds.height * RASTER_RATIO;
    const [mask, outline] = await Promise.all([
      rasterizeSvg(url, pxW, pxH, { fill: '#000', stroke: 'none' }),
      rasterizeSvg(url, pxW, pxH, { fill: 'none', stroke: this.state.selectedBase.stroke })
    ]);
    if (loadId !== this.shieldLoadId) return; // a newer shape was picked meanwhile

    const hitCanvas = document.createElement('canvas');
    hitCanvas.width = SIZE;
    hitCanvas.height = SIZE;
    const hitCtx = hitCanvas.getContext('2d', { willReadFrequently: true })!;
    hitCtx.drawImage(mask, bounds.left, bounds.top, bounds.width, bounds.height);

    this.shield = { bounds, mask, outline, hitAlpha: hitCtx.getImageData(0, 0, SIZE, SIZE).data };
    this.updateDivision();
  }

  private updateDivision() {
    if (!this.shield) return;
    const { shape, offsetX, offsetY } = this.state.selectedBase;
    this.parts = divisionParts(this.state.selectedDiv.shape.id, this.shield.bounds, shape, offsetX, offsetY);
    this.refreshPattern(); // pattern origin follows the shield
    this.scheduleDraw();
  }

  private async loadChargeImage(charge: ChargeData) {
    if (this.chargeImages.has(charge.url)) return;
    const size = await svgSize(charge.url);
    const ratio = CHARGE_RASTER_SIZE / Math.max(size.width, size.height);
    this.chargeImages.set(charge.url, await rasterizeSvg(charge.url, size.width * ratio, size.height * ratio));
  }

  async refreshPattern(areaIndex?: number) {
    if (areaIndex === undefined) {
      for (let i = 0; i < 4; i++) {
        if (this.state.selectedDiv.pattern[i]) this.refreshPattern(i);
      }
      return;
    }
    const pattern = this.state.selectedDiv.pattern[areaIndex];
    if (!pattern || !this.shield) return;

    let extraOffset = 1; // Make offset smoother for larger scales
    if (pattern.scale > 1) extraOffset = 1 + ((pattern.scale - 1) / 2);

    const tile = await createCanvasImageSourceFromSVG({
      url: pattern.url,
      padding: pattern.padding * extraOffset * RASTER_RATIO,
      bgColor: pattern.bgColor,
      scale: pattern.scale * RASTER_RATIO,
      shapeColors: pattern.shapeColors,
      multipleColors: pattern.multipleColors
    });
    if (this.state.selectedDiv.pattern[areaIndex] !== pattern) return; // replaced meanwhile

    const fill = this.ctx.createPattern(tile, 'repeat');
    if (fill) {
      const { left, top } = this.shield.bounds;
      fill.setTransform(new DOMMatrix()
        .translate(left + pattern.offsetX * extraOffset, top + pattern.offsetY * extraOffset)
        .scale(1 / RASTER_RATIO));
    }
    this.patternFills[areaIndex] = fill;
    this.scheduleDraw();
  }

  /** Centroid and bounding box of an area (clipped to the shield), used to place new charges. */
  private measureRegion(area: ChargeArea) {
    const shield = this.shield!;
    const factor = 0.25;
    const n = SIZE * factor;
    const c = document.createElement('canvas');
    c.width = n;
    c.height = n;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.scale(factor, factor);
    ctx.drawImage(shield.mask, shield.bounds.left, shield.bounds.top, shield.bounds.width, shield.bounds.height);
    if (area !== 'all' && this.parts[area]) {
      // The first part of the area is enough (gyronny repeats it around the center)
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fill(this.parts[area]);
    }

    const data = ctx.getImageData(0, 0, n, n).data;
    let sumX = 0, sumY = 0, count = 0, minX = n, minY = n, maxX = 0, maxY = 0;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (data[(y * n + x) * 4 + 3] > 127) {
          sumX += x; sumY += y; count++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (!count) return { cx: SIZE / 2, cy: SIZE / 2, width: 100, height: 100 };
    return {
      cx: (sumX / count + 0.5) / factor,
      cy: (sumY / count + 0.5) / factor,
      width: (maxX - minX + 1) / factor,
      height: (maxY - minY + 1) / factor
    };
  }

  // ================================================================ Rendering

  private resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(SIZE * ratio);
    this.canvas.height = Math.round(SIZE * ratio);
    this.canvas.style.width = SIZE + 'px';
    this.canvas.style.height = SIZE + 'px';
    this.scheduleDraw();
  }

  private scheduleDraw() {
    if (this.drawScheduled) return;
    this.drawScheduled = true;
    requestAnimationFrame(() => {
      this.drawScheduled = false;
      this.drawScene(this.ctx, this.canvas.width / SIZE, true);
    });
  }

  private workCanvas(ratio: number) {
    let c = this.workCanvases.get(ratio);
    if (!c) {
      c = document.createElement('canvas');
      c.width = Math.round(SIZE * ratio);
      c.height = Math.round(SIZE * ratio);
      this.workCanvases.set(ratio, c);
    }
    return c;
  }

  /**
   * Layers: background → field areas (color/pattern) → charges (each clipped to its area)
   * → everything masked to the shield silhouette → outline → transform gizmo (screen only).
   */
  private drawScene(ctx: CanvasRenderingContext2D, ratio: number, withOverlay: boolean) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (this.state.backgroundColor !== 'transparent') {
      ctx.fillStyle = this.state.backgroundColor;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }
    const shield = this.shield;
    if (!shield) return;

    const work = this.workCanvas(ratio);
    const w = work.getContext('2d')!;
    w.setTransform(1, 0, 0, 1, 0, 0);
    w.globalCompositeOperation = 'source-over';
    w.clearRect(0, 0, work.width, work.height);
    w.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Field areas
    const divided = this.state.selectedDiv.shape.divided;
    this.parts.forEach((part, k) => {
      const area = k % divided;
      w.fillStyle = this.patternFills[area] ?? this.state.selectedDiv.colors[area];
      w.fill(part);
    });

    // Charges, bottom → top, each clipped to its own area
    for (const layer of this.state.charges) {
      const img = this.chargeImages.get(layer.charge.url);
      if (!img) continue;
      w.save();
      if (layer.area !== 'all') w.clip(areaPath(this.parts, divided, layer.area));
      w.translate(layer.x, layer.y);
      w.rotate(layer.rotation);
      w.scale(layer.scale, layer.scale);
      w.drawImage(img, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
      w.restore();
    }

    // Keep only what is inside the shield
    w.globalCompositeOperation = 'destination-in';
    w.drawImage(shield.mask, shield.bounds.left, shield.bounds.top, shield.bounds.width, shield.bounds.height);
    w.globalCompositeOperation = 'source-over';

    ctx.drawImage(work, 0, 0, SIZE, SIZE);
    ctx.drawImage(shield.outline, shield.bounds.left, shield.bounds.top, shield.bounds.width, shield.bounds.height);

    const selected = this.selectedCharge;
    if (withOverlay && selected) drawGizmo(ctx, selected);
  }

  // ================================================================ Canvas interaction

  private toCanvasPoint(e: PointerEvent): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    return [((e.clientX - rect.left) * SIZE) / rect.width, ((e.clientY - rect.top) * SIZE) / rect.height];
  }

  private insideShield(x: number, y: number) {
    const shield = this.shield;
    if (!shield) return false;
    const ix = Math.floor(x), iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= SIZE || iy >= SIZE) return false;
    return shield.hitAlpha[(iy * SIZE + ix) * 4 + 3] > 0;
  }

  /** Topmost charge whose box contains the point. */
  private chargeAt(x: number, y: number) {
    return [...this.state.charges].reverse().find(layer => containsPoint(layer, x, y));
  }

  private bindCanvasEvents() {
    this.canvas.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const [x, y] = this.toCanvasPoint(e);
      let layer = this.selectedCharge;
      let hit = layer ? hitTest(layer, x, y, this.insideShield(x, y)) : null;

      if (!hit) {
        // Nothing selected (or clicked outside the shield): pick the charge under the pointer, if any
        layer = this.chargeAt(x, y);
        this.selectCharge(layer?.id ?? null);
        hit = layer ? { type: 'move' } : null;
      }
      if (!layer || !hit) return;

      e.preventDefault();
      this.canvas.setPointerCapture(e.pointerId);
      this.drag = { hit, startX: x, startY: y, start: { ...layer } };
      this.canvas.classList.add('is-dragging');
    });

    this.canvas.addEventListener('pointermove', e => {
      const [x, y] = this.toCanvasPoint(e);
      const layer = this.selectedCharge;

      if (this.drag && layer) {
        Object.assign(layer, applyDrag(this.drag, x, y, e.shiftKey));
        this.scheduleDraw();
        return;
      }
      if (layer) {
        this.canvas.style.cursor = cursorFor(hitTest(layer, x, y, this.insideShield(x, y)), layer);
      } else {
        this.canvas.style.cursor = this.chargeAt(x, y) ? 'pointer' : 'default';
      }
    });

    const endDrag = (e: PointerEvent) => {
      if (!this.drag) return;
      this.drag = null;
      this.canvas.classList.remove('is-dragging');
      if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    };
    this.canvas.addEventListener('pointerup', endDrag);
    this.canvas.addEventListener('pointercancel', endDrag);
  }

  private bindKeyboard() {
    document.addEventListener('keydown', e => {
      const layer = this.selectedCharge;
      if (!layer || (e.target as HTMLElement).closest('input, select, textarea')) return;

      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'Delete':
        case 'Backspace': this.removeCharge(layer.id); break;
        case 'Escape': this.selectCharge(null); break;
        case 'ArrowLeft': layer.x -= step; break;
        case 'ArrowRight': layer.x += step; break;
        case 'ArrowUp': layer.y -= step; break;
        case 'ArrowDown': layer.y += step; break;
        default: return;
      }
      e.preventDefault();
      this.scheduleDraw();
    });
  }
}

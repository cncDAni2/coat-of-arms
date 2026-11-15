import * as fabric from 'fabric';
import { gyronny, divide2, flat } from './divisions/utils';
import { BaseInfo, ChargeData, CoaLayers, CoaState, DividentImagesInfo, PatternData } from './coat-types';
import * as db from './coat-database';
import { createCanvasImageSourceFromSVG } from './pattern-image';
import { rangeSlider } from './range-slider';
import { h } from './dom';

/**
 * https://coamaker.com
 * https://en.wikipedia.org/wiki/Coat_of_arms
 * https://heraldry.sca.org/armory/newprimer/h4f5.html
 * https://hu.pinterest.com/pin/60939401202910889/
 *
 * https://svgcrop.com/
 * https://vectorizer.com
 */
export class CoatOfArmsCreator {
  private canvas: fabric.Canvas;
  private optionsEl: HTMLElement;
  private layers: CoaLayers = {};
  private baseScaleFactor = 1;

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
    }
  };

  constructor(root: HTMLElement) {
    db.dividentImagesInfo.forEach((o, i) => o.i = i);
    db.patternData.forEach((o, i) => o.i = i);

    this.optionsEl = h('div', { class: 'coa-creator-options' });
    const canvasEl = h('canvas', { width: 500, height: 500 });
    root.append(
      h('div', { class: 'coa-creator' }, [
        this.optionsEl,
        h('div', { class: 'coa-creator-display' }, [
          canvasEl,
          h('div', { class: 'download-image' }, [
            h('button', { type: 'button', onclick: () => this.saveCanvasAsImage() }, ['Download image'])
          ])
        ])
      ])
    );

    this.canvas = new fabric.Canvas(canvasEl, { selection: true });
    this.canvas.backgroundColor = 'transparent';
    this.canvas.renderAll();

    this.render();
    this.loadSVG('coat-of-arms/base_1.svg', 300, 'base');
  }

  // ---------------------------------------------------------------- UI

  /** Rebuilds the option panel from the current state, keeping open <details> open. */
  private render() {
    const openKeys = new Set(
      [...this.optionsEl.querySelectorAll<HTMLDetailsElement>('details[data-key]')]
        .filter(d => d.open)
        .map(d => d.dataset['key'])
    );

    this.optionsEl.replaceChildren(
      ...this.renderGeneral(),
      ...this.renderEscutcheon(),
      ...this.renderFieldAreas(),
      ...this.renderCharge()
    );

    this.optionsEl.querySelectorAll<HTMLDetailsElement>('details[data-key]').forEach(d => {
      d.open = openKeys.has(d.dataset['key']);
    });
  }

  private details(key: string, summary: string, content: (Node | null | false)[]) {
    return h('details', { 'data-key': key }, [
      h('summary', {}, [summary]),
      h('div', { class: 'detail-content' }, content)
    ]);
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
        }, ['❌'])
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
            this.createDivision();
          }),
          div.y && rangeSlider({ min: -60, max: 60, step: 1, title: 'Vertical position' }, selectedBase.offsetY, v => {
            selectedBase.offsetY = v;
            this.createDivision();
          })
        ])
      ])
    ];
  }

  private renderFieldAreas() {
    const { selectedDiv } = this.state;
    const areas: HTMLElement[] = [h('span', { class: 'coa-title' }, ['Field Areas'])];

    for (let areaIndex = 0; areaIndex < Math.min(selectedDiv.shape.divided, 4); areaIndex++) {
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

  private renderCharge() {
    return [
      h('span', { class: 'coa-title' }, ['Charge']),
      this.details('charge', 'Choose charge', db.chargeData.map(item => h('img', {
        src: 'coat-of-arms/charges/' + item.preview,
        alt: item.name,
        title: item.name,
        class: 'selectable-shape',
        onclick: () => this.addCharge(item)
      })))
    ];
  }

  // ---------------------------------------------------------------- Actions

  changeBackgroundColor(color: string) {
    this.canvas.backgroundColor = color;
    this.state.backgroundColor = color;
    this.canvas.renderAll();
    this.render();
  }

  selectBase(baseInfo: BaseInfo) {
    this.state.selectedBase.shape = baseInfo;
    this.state.selectedBase.offsetY = baseInfo.offsetY || 0;
    this.state.selectedBase.offsetX = baseInfo.offsetX || 0;
    this.loadSVG('coat-of-arms/base_' + baseInfo.id + '.svg', 300, 'base');
    this.render();
  }

  switchBaseColor(newColor: string) {
    this.state.selectedBase.background = newColor;
    this.state.selectedBase.stroke = newColor;
    this.layers['base'][0].set({
      fill: this.state.selectedBase.background,
      stroke: this.state.selectedBase.stroke
    });
    this.canvas.renderAll();
    this.createDivision();
  }

  selectDiv(i: DividentImagesInfo) {
    this.state.selectedDiv.shape = i;
    this.state.selectedBase.offsetY = this.state.selectedBase.shape.offsetY || 0;
    this.state.selectedBase.offsetX = this.state.selectedBase.shape.offsetX || 0;
    this.createDivision();
    this.render();
  }

  switchDivColor(index: number, newColor: string) {
    this.state.selectedDiv.colors[index] = newColor;
    this._setAreaColor(index, newColor);
  }

  modifyPattern(index: number, patternOption: PatternData) {
    if (patternOption.url == '') {
      this.state.selectedDiv.pattern[index] = null;
      this.createDivision();
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

  async addCharge(chargeData: ChargeData) {
    fabric.loadSVGFromURL(chargeData.url, async (_orig, converted) => {
      const clipp = await this.layers['division'][0].clone();
      clipp.opacity = 0;
      converted.set({
        selectable: true,
        hoverCursor: 'default',
        fill: 'blue',
        clipPath: clipp
      });

      this.canvas.add(converted);
    });
  }

  saveCanvasAsImage() {
    //TODO: Remove BG!
    const link = document.createElement('a');
    link.href = this.canvas.toDataURL();
    link.download = 'coa_img.png';
    link.click();
  }

  // ---------------------------------------------------------------- Canvas

  private loadSVG(svgFile: string, size: number, layerName: string): void {
    fabric.loadSVGFromURL(svgFile, (_orig, converted) => {
      // Calculate the scale factor to resize proportionately
      this.baseScaleFactor = size / Math.max(converted.width, converted.height);
      converted.scale(this.baseScaleFactor);

      // Center the object on the canvas
      converted.set({
        left: (this.canvas.getWidth() - converted.getScaledWidth()) / 2,
        top: (this.canvas.getHeight() - converted.getScaledHeight()) / 2,
        selectable: false,
        hoverCursor: 'default',
        fill: this.state.selectedBase.background,
        stroke: this.state.selectedBase.stroke
      });

      // Remove the existing layer if it exists
      if (this.layers[layerName]) {
        this.canvas.remove(this.layers[layerName][0]);
      }

      this.canvas.add(converted);
      this.layers[layerName] = [converted];
      this.canvas.renderAll();
      this.createDivision();
    });
  }

  async createDivision() {
    if (!this.layers['base']) return;

    this.layers['division']?.forEach(area => this.canvas.remove(area));

    const base = this.layers['base'][0];
    const baseShape = this.state.selectedBase.shape;
    const { offsetX, offsetY } = this.state.selectedBase;

    switch (this.state.selectedDiv.shape.id) {
      case 'flat': this.layers['division'] = await flat(base); break;
      case 'perpale': this.layers['division'] = await divide2(base, 0, offsetY, offsetX); break;
      case 'Perfess': this.layers['division'] = await divide2(base, 90, offsetY, offsetX); break;
      case 'Perbend': this.layers['division'] = await divide2(base, 135 + (baseShape.perBendDegOffset || 0), offsetY, offsetX); break;
      case 'Perbentsinister': this.layers['division'] = await divide2(base, 45 - (baseShape.perBendDegOffset || 0), offsetY, offsetX); break;
      case 'persaltire': this.layers['division'] = await gyronny(base, 4, true, offsetX, -offsetY); break;
      case 'quaterly': this.layers['division'] = await gyronny(base, 4, false, offsetX, -offsetY); break;
      case 'Gyronny6F': this.layers['division'] = await gyronny(base, 6, false, offsetX, -offsetY); break;
      case 'Gyronny6T': this.layers['division'] = await gyronny(base, 6, true, offsetX, -offsetY); break;
      case 'Gyronny8F': this.layers['division'] = await gyronny(base, 8, false, offsetX, -offsetY); break;
      case 'Gyronny8T': this.layers['division'] = await gyronny(base, 8, true, offsetX, -offsetY); break;
      case 'Gyronny12F': this.layers['division'] = await gyronny(base, 12, false, offsetX, -offsetY); break;
      case 'Gyronny12T': this.layers['division'] = await gyronny(base, 12, true, offsetX, -offsetY); break;
      default: break;
    }

    this.layers['division']?.forEach(area => this.canvas.add(area));
    this._setAreaColor();
    this.refreshPattern();
  }

  private _setAreaColor(areaIndex?: number, newColor?: string) {
    if (areaIndex == undefined) {
      for (let i = 0; i < this.state.selectedDiv.shape.divided; i++) {
        this._setAreaColor(i, this.state.selectedDiv.colors[i]);
      }
      return;
    }
    if (!newColor) newColor = this.state.selectedDiv.colors[areaIndex];
    const pattern = this.state.selectedDiv.pattern[areaIndex];
    if (pattern) {
      pattern.bgColor = newColor;
      this.refreshPattern(areaIndex);
      return;
    }
    this._getIndexArray(areaIndex).forEach(i => {
      this.layers['division']?.[i]?.set({ fill: newColor });
    });
    this.canvas.renderAll();
  }

  /** Gyronny divisions repeat the same area every 2nd slice. */
  private _getIndexArray(areaIndex: number) {
    const indexes = [areaIndex];
    switch (this.state.selectedDiv.shape.id) {
      case 'Gyronny6F': case 'Gyronny6T': indexes.push(areaIndex + 2, areaIndex + 4); break;
      case 'Gyronny8F': case 'Gyronny8T': indexes.push(areaIndex + 2, areaIndex + 4, areaIndex + 6); break;
      case 'Gyronny12F': case 'Gyronny12T': indexes.push(areaIndex + 2, areaIndex + 4, areaIndex + 6, areaIndex + 8, areaIndex + 10); break;
      default: break;
    }
    return indexes;
  }

  async refreshPattern(areaIndex?: number) {
    if (areaIndex == undefined) {
      for (let i = 0; i < 4; i++) {
        if (this.state.selectedDiv.pattern[i]) this.refreshPattern(i);
      }
      return;
    }
    const currPattern = this.state.selectedDiv.pattern[areaIndex];
    if (!currPattern) return;

    let extraOffset = 1; // Make offset smoother for larger scales
    if (currPattern.scale > 1) extraOffset = 1 + ((currPattern.scale - 1) / 2);

    const patternCanvas = await createCanvasImageSourceFromSVG({
      url: currPattern.url,
      padding: currPattern.padding * (1 / this.baseScaleFactor) * extraOffset,
      bgColor: currPattern.bgColor,
      scale: currPattern.scale * (1 / this.baseScaleFactor),
      shapeColors: currPattern.shapeColors,
      multipleColors: currPattern.multipleColors
    });
    const fabricPattern = new fabric.Pattern({
      source: patternCanvas,
      offsetX: (1 / this.baseScaleFactor) * currPattern.offsetX * extraOffset,
      offsetY: (1 / this.baseScaleFactor) * currPattern.offsetY * extraOffset
    });

    this._getIndexArray(areaIndex).forEach(i => {
      this.layers['division']?.[i]?.set({ fill: fabricPattern });
    });
    this.canvas.renderAll();
  }
}

import { BaseInfo, ChargeArea, ChargeData, ChargeLayer, CoaState } from './coat-types';
import * as db from './coat-database';
import { rangeSlider } from './range-slider';
import { h } from './dom';
import { Bounds, DIVISIONS, DivisionDef, divisionAreas, DivisionId, LINE_STYLES, LineStyle, MAX_OFFSET } from './geometry';
import {
  AreaFill, drawAreaFill, ERMINE_DENSITY, ERMINE_PRESETS, ERMINE_SIZE, FurKind, OptionKind, OUTLINE, SEME_DENSITY, SEME_SIZE,
  secondLiesOnGround, secondTincture, withSecond, VAIR_PRESETS, VAIR_ROWS, VAIR_STYLES, Variation, VARIATION_COUNTS, VariationKind
} from './field';
import { rasterizeSvg, svgSize } from './svg';
import { drawCharge } from './charge-draw';
import { applyDrag, containsPoint, cursorFor, DragState, drawGizmo, hitTest } from './transform-tool';
import { getLang, Lang, onLangChange, setLang, t } from './i18n';
import { initTooltips, refreshTooltip } from './tooltip';
import { closeTincturePicker, openTincturePicker, tinctureButton } from './tincture-picker';
import { categoryOf, Tincture } from './tinctures';
import { analyze, Analysis, evaluate, fillTinctures, fillTincturesText, Problem, tinctureConflict } from './validation';

/** Logical canvas size; all geometry is in these units. */
const SIZE = 500;
/** The escutcheon's larger side, in logical units. */
const BASE_SIZE = 300;
/** Export resolution multiplier. */
const EXPORT_RATIO = 2;
/** Resolution multiplier for rasterized assets (masks), so they stay crisp on export too. */
const RASTER_RATIO = Math.max(EXPORT_RATIO, window.devicePixelRatio || 1);
/** Larger side of rasterized charge images, in pixels. */
const CHARGE_RASTER_SIZE = 1024;
/** Smallest allowed charge: its larger side relative to the shield's larger side. */
const MIN_CHARGE_FRACTION = 0.12;
/** Outline width of the division lines and pattern pieces (logical units). */
const LINE_WIDTH = 1.2;

const VARIATIONS: (VariationKind | 'seme')[] = ['barry', 'paly', 'bendy', 'bendySinister', 'chequy', 'lozengy', 'seme'];
const FURS: FurKind[] = ['ermine', 'vair'];

interface Shield {
  bounds: Bounds,
  mask: HTMLImageElement, // silhouette, used with destination-in
  outline: HTMLImageElement, // stroke only, drawn on top
  hitAlpha: Uint8ClampedArray // alpha of the silhouette at SIZE×SIZE, for "inside the shield" checks
}

// ------------------------------------------------------------------ Generated preview icons

const iconCache = new Map<string, string>();
function icon(key: string, draw: (ctx: CanvasRenderingContext2D, sb: Bounds) => void): string {
  let url = iconCache.get(key);
  if (!url) {
    const c = document.createElement('canvas');
    c.width = 80;
    c.height = 80;
    const ctx = c.getContext('2d')!;
    const sb = { left: 6, top: 4, width: 68, height: 72 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(sb.left, sb.top, sb.width, sb.height);
    ctx.clip();
    draw(ctx, sb);
    ctx.restore();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.strokeRect(sb.left, sb.top, sb.width, sb.height);
    url = c.toDataURL();
    iconCache.set(key, url);
  }
  return url;
}

const ICON_TINCTURES: Tincture[] = ['gules', 'argent', 'azure'];

function divisionIcon(def: DivisionDef) {
  return icon('div-' + def.id, (ctx, sb) => {
    divisionAreas(def.id, sb, 0, 0.04, 'straight').forEach((path, k) => {
      drawAreaFill(ctx, path, { tincture: ICON_TINCTURES[k], variation: null }, sb, 1.5);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke(path);
    });
  });
}

function lineIcon(style: LineStyle) {
  return icon('line-' + style, (ctx, sb) => {
    const big = { left: sb.left - 40, top: sb.top, width: sb.width + 80, height: sb.height };
    divisionAreas('perFess', big, 0, 0, style).forEach((path, k) => {
      drawAreaFill(ctx, path, { tincture: ICON_TINCTURES[k], variation: null }, sb, 1.5);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke(path);
    });
  });
}

function defaultVariation(kind: OptionKind, fill: AreaFill): Variation {
  const metal = categoryOf(fill.tincture) === 'metal';
  switch (kind) {
    case 'seme':
      return { kind, charge: 'roundel', tincture: metal ? 'gules' : 'or', density: SEME_DENSITY.def, size: SEME_SIZE.def };
    case 'ermine':
      return { kind, spot: metal ? 'sable' : 'argent', density: ERMINE_DENSITY.def, size: ERMINE_SIZE.def };
    case 'vair':
      return { kind, second: metal ? 'azure' : 'argent', rows: VAIR_ROWS.def, style: 'vair' };
    default:
      return { kind, second: metal ? 'azure' : 'argent', count: VARIATION_COUNTS[kind].def };
  }
}

function variationIcon(kind: OptionKind | 'none') {
  return icon('var-' + kind, (ctx, sb) => {
    const rect = new Path2D();
    rect.rect(0, 0, 80, 80);
    const fill: AreaFill = { tincture: 'argent', variation: null };
    if (kind !== 'none') fill.variation = defaultVariation(kind, fill);
    const v = fill.variation;
    if (v?.kind === 'seme' || v?.kind === 'ermine') v.density = 3;
    if (v?.kind === 'vair') v.rows = 3;
    drawAreaFill(ctx, rect, fill, sb, 1.5);
  });
}

// ------------------------------------------------------------------ The creator

export class CoatOfArmsCreator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private optionsEl: HTMLElement;
  private headerEl: HTMLElement;
  private langEl: HTMLElement;
  private downloadButton: HTMLButtonElement;
  private summaryEl: HTMLElement;
  private workCanvases = new Map<number, HTMLCanvasElement>();
  /** Error boxes inside the panel, keyed by scope ("area-0", "charge-3") */
  private problemSlots = new Map<string, HTMLElement>();

  private shield: Shield | null = null;
  private shieldLoadId = 0;
  private areaPaths: Path2D[] = [];
  private chargeImages = new Map<string, HTMLImageElement>();
  private nextChargeId = 1;

  private analysis: Analysis | null = null;
  private problems: Problem[] = [];
  private validateTimer: ReturnType<typeof setTimeout> | null = null;

  private drag: DragState | null = null;
  private drawScheduled = false;
  private draggedLayerId: number | null = null;

  private state: CoaState = {
    backgroundColor: 'transparent',
    base: db.baseInfo[0],
    division: { id: 'plain', line: 'straight', offsetX: 0, offsetY: 0 },
    areas: [
      { tincture: 'gules', variation: null },
      { tincture: 'argent', variation: null },
      { tincture: 'azure', variation: null }
    ],
    charges: [],
    selectedChargeId: null,
    chargeTarget: 'all'
  };

  constructor(root: HTMLElement) {
    initTooltips();

    this.optionsEl = h('div', { class: 'coa-creator-options' });
    this.canvas = h('canvas', { class: 'coa-canvas' });
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not supported');
    this.ctx = ctx;

    this.headerEl = h('header', { class: 'coa-header' });
    this.langEl = h('div', { class: 'lang-switch' });
    this.downloadButton = h('button', { type: 'button', onclick: () => this.saveCanvasAsImage() });
    this.summaryEl = h('div', { class: 'coa-summary' });

    root.append(
      this.langEl,
      h('div', { class: 'coa-creator' }, [
        this.optionsEl,
        h('div', { class: 'coa-creator-display' }, [
          this.headerEl,
          h('div', { class: 'canvas-frame' }, [this.canvas]),
          h('div', { class: 'download-image' }, [this.downloadButton]),
          this.summaryEl
        ])
      ])
    );

    onLangChange(() => this.renderAll());

    this.resizeCanvas();
    window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', () => this.resizeCanvas());
    this.bindCanvasEvents();
    this.bindKeyboard();

    this.renderAll();
    this.loadShield();
  }

  // ================================================================ Rendering of the UI

  private renderAll() {
    document.documentElement.lang = getLang();
    document.title = t('app.docTitle');
    this.renderLang();
    this.renderHeader();
    this.render();
    this.renderProblems();
    refreshTooltip();
  }

  private renderLang() {
    const btn = (lang: Lang, label: string) => h('button', {
      type: 'button',
      class: 'lang-button' + (getLang() === lang ? ' selected' : ''),
      'aria-pressed': getLang() === lang ? 'true' : 'false',
      onclick: () => setLang(lang)
    }, [label]);
    this.langEl.setAttribute('aria-label', t('lang.switch'));
    this.langEl.replaceChildren(btn('hu', 'HU'), btn('en', 'EN'));
  }

  private renderHeader() {
    this.headerEl.replaceChildren(h('h1', {}, [t('app.title')]), h('p', {}, [t('app.subtitle')]));
  }

  /** Rebuilds the option panel from the current state, keeping open <details> open. */
  private render() {
    closeTincturePicker();
    const openKeys = new Set(
      [...this.optionsEl.querySelectorAll<HTMLDetailsElement>('details[data-key]')]
        .filter(d => d.open)
        .map(d => d.dataset['key'])
    );
    const scrollTop = this.optionsEl.scrollTop;
    this.problemSlots.clear();

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
    this.fillProblemSlots();
  }

  private details(key: string, summary: (Node | string)[], content: (Node | null | false)[]) {
    // The unfold animation class is only added on a real click, so re-renders don't replay it
    const el = h('details', { 'data-key': key }, [
      h('summary', { onclick: () => el.classList.add('animate-open') }, summary),
      h('div', { class: 'detail-content' }, content)
    ]);
    return el;
  }

  private option(label: string, value: (Node | null | false)[]) {
    return h('div', { class: 'coa-option' }, [
      h('div', { class: 'coa-option-name' }, [label]),
      h('div', { class: 'coa-option-value' }, value)
    ]);
  }

  private problemSlot(key: string) {
    const el = h('div', { class: 'problem-slot' });
    this.problemSlots.set(key, el);
    return el;
  }

  private renderGeneral() {
    const isTransparent = this.state.backgroundColor === 'transparent';
    const input = h('input', {
      type: 'color',
      value: isTransparent ? '#000000' : this.state.backgroundColor,
      class: isTransparent ? 'unused-input' : '',
      onchange: () => this.changeBackgroundColor(input.value)
    });
    return [
      h('span', { class: 'coa-title' }, [t('section.general')]),
      h('div', { class: 'coa-option' }, [
        h('div', { class: 'coa-option-name' }, [t('general.background')]),
        h('div', { class: 'coa-option-value' }, [input]),
        h('button', {
          type: 'button',
          class: 'delete-button',
          'data-tip': t('general.removeBackground'),
          onclick: () => this.changeBackgroundColor('transparent')
        }, ['✕'])
      ]),
      h('p', { class: 'coa-note' }, [t('general.backgroundNote')])
    ];
  }

  private renderEscutcheon() {
    const { base, division } = this.state;
    const def = this.divisionDef;

    const shapes = db.baseInfo.map(item => h('img', {
      src: 'coat-of-arms/base_' + item.id + '.svg',
      alt: t('shape.' + item.id),
      'data-tip': t('shape.' + item.id),
      class: 'selectable-shape' + (base.id === item.id ? ' selected' : ''),
      onclick: () => this.selectBase(item)
    }));

    const divisions = DIVISIONS.map(d => h('img', {
      src: divisionIcon(d),
      alt: t('division.' + d.id),
      'data-tip': t('division.' + d.id),
      class: 'selectable-shape division-shape' + (division.id === d.id ? ' selected' : ''),
      onclick: () => this.selectDivision(d.id)
    }));

    const lines = def.areas > 1 && h('div', { class: 'line-styles' }, [
      h('span', { class: 'detail-option' }, [t('escutcheon.line')]),
      h('div', { class: 'shapes-row' }, LINE_STYLES.map(style => h('img', {
        src: lineIcon(style),
        alt: t('line.' + style),
        'data-tip': t('line.' + style),
        class: 'selectable-shape' + (division.line === style ? ' selected' : ''),
        onclick: () => {
          division.line = style;
          this.updateDivision();
          this.render();
        }
      })))
    ]);

    const pct = (v: number) => Math.round(v * 100);
    const sliders = (def.x || def.y) && h('div', { class: 'dual-option' }, [
      def.x && rangeSlider({ min: -pct(MAX_OFFSET), max: pct(MAX_OFFSET), step: 1, title: t('escutcheon.posX') + ' (%)' }, pct(division.offsetX), v => {
        division.offsetX = v / 100;
        this.updateDivision();
      }),
      def.y && rangeSlider({ min: -pct(MAX_OFFSET), max: pct(MAX_OFFSET), step: 1, title: t('escutcheon.posY') + ' (%)' }, pct(division.offsetY), v => {
        division.offsetY = v / 100;
        this.updateDivision();
      })
    ]);

    return [
      h('span', { class: 'coa-title' }, [t('section.escutcheon')]),
      this.details('base', [t('escutcheon.chooseShape') + ': ', h('em', {}, [t('shape.' + base.id)])], [
        h('div', { class: 'shapes-row' }, shapes),
        h('p', { class: 'coa-note' }, [t('escutcheon.shapeNote')])
      ]),
      this.details('division', [t('escutcheon.chooseDivision') + ': ', h('em', {}, [t('division.' + division.id)])], [
        h('div', { class: 'shapes-row' }, divisions),
        lines,
        sliders,
        this.problemSlot('division')
      ])
    ];
  }

  private renderFieldAreas() {
    const result: HTMLElement[] = [h('span', { class: 'coa-title' }, [t('section.fieldAreas')])];
    for (let k = 0; k < this.areaCount; k++) {
      const fill = this.state.areas[k];
      const v = fill.variation;
      const current = v ? v.kind : 'none';

      const optionTile = (kind: OptionKind | 'none') => h('img', {
        src: variationIcon(kind),
        alt: t('variation.' + kind),
        'data-tip': t('variation.' + kind),
        class: 'selectable-shape' + (current === kind ? ' selected' : ''),
        onclick: () => this.setVariation(k, kind)
      });
      const variations = h('div', { class: 'shapes-row' }, (['none', ...VARIATIONS] as const).map(optionTile));
      const furs = h('div', { class: 'shapes-row' }, FURS.map(optionTile));

      const chip = (label: string, selected: boolean, onclick: () => void, tip?: string) => h('button', {
        type: 'button',
        class: 'chip' + (selected ? ' selected' : ''),
        ...(tip ? { 'data-tip': tip } : {}),
        onclick
      }, [label]);
      const secondButton = (label: string) => v && this.option(label, [tinctureButton(secondTincture(v), b => this.pickSecondTincture(b, k))]);
      // "Custom" is selected automatically as soon as the tinctures match none of the named variants;
      // clicking it opens the picker of the second tincture
      const customChip = (selected: boolean) => {
        const el = chip(t('area.custom'), selected, () => this.pickSecondTincture(el, k), t('area.customTip'));
        return el;
      };

      const controls: (HTMLElement | false | null)[] = [];
      if (v && v.kind === 'seme') {
        controls.push(
          secondButton(t('area.semeTincture')),
          this.option(t('area.semeShape'), (['roundel', 'annulet'] as const).map(shape =>
            chip(t('seme.' + shape), v.charge === shape, () => {
              v.charge = shape;
              this.areaChanged();
            }))),
          h('div', { class: 'dual-option' }, [
            rangeSlider({ ...SEME_DENSITY, title: t('area.density') }, v.density, val => {
              v.density = val;
              this.areaChanged(false);
            }),
            rangeSlider({ ...SEME_SIZE, title: t('area.size') }, v.size, val => {
              v.size = val;
              this.areaChanged(false);
            })
          ])
        );
      } else if (v && v.kind === 'ermine') {
        controls.push(
          this.variantBox(k, [
            ...ERMINE_PRESETS.map(p =>
              chip(t('tincture.' + p.key), fill.tincture === p.field && v.spot === p.spot, () => {
                fill.tincture = p.field;
                v.spot = p.spot;
                this.areaChanged();
              }, `${t('tincture.' + p.field)} – ${t('tincture.' + p.spot)}`)),
            customChip(!ERMINE_PRESETS.some(p => fill.tincture === p.field && v.spot === p.spot))
          ], secondButton(t('area.spotTincture'))),
          h('div', { class: 'dual-option' }, [
            rangeSlider({ ...ERMINE_DENSITY, title: t('area.density') }, v.density, val => {
              v.density = val;
              this.areaChanged(false);
            }),
            rangeSlider({ ...ERMINE_SIZE, title: t('area.size') }, v.size, val => {
              v.size = val;
              this.areaChanged(false);
            })
          ])
        );
      } else if (v && v.kind === 'vair') {
        controls.push(
          // Labelled by its tinctures: the name "vair" is already the arrangement chip below
          this.variantBox(k, [
            ...VAIR_PRESETS.map(p =>
              chip(`${t('tincture.' + p.field)} – ${t('tincture.' + p.second)}`, fill.tincture === p.field && v.second === p.second, () => {
                fill.tincture = p.field;
                v.second = p.second;
                this.areaChanged();
              }, t('tincture.' + p.key))),
            customChip(!VAIR_PRESETS.some(p => fill.tincture === p.field && v.second === p.second))
          ], secondButton(t('area.paneTincture'))),
          this.option(t('area.vairStyle'), VAIR_STYLES.map(style =>
            chip(t('vair.' + style), v.style === style, () => {
              v.style = style;
              this.areaChanged();
            }))),
          h('div', { class: 'dual-option' }, [
            rangeSlider({ ...VAIR_ROWS, title: t('area.rows') }, v.rows, val => {
              v.rows = val;
              this.areaChanged(false);
            })
          ])
        );
      } else if (v) {
        const range = VARIATION_COUNTS[v.kind];
        controls.push(
          secondButton(t('area.second')),
          h('div', { class: 'dual-option' }, [
            rangeSlider({ ...range, title: t('area.count') }, v.count, val => {
              v.count = val;
              this.areaChanged(false);
            })
          ])
        );
      }

      result.push(this.details('area' + k, [t('area.title', { n: k + 1 }) + ': ', h('em', {}, [this.fillName(fill)])], [
        this.option(t('area.tincture'), [tinctureButton(fill.tincture, b => this.pickAreaTincture(b, k))]),
        h('span', { class: 'detail-option' }, [t('area.variation')]),
        variations,
        h('span', { class: 'detail-option' }, [t('area.fur')]),
        furs,
        ...controls,
        this.problemSlot('area-' + k)
      ]));
    }
    return result;
  }

  /** Bordered box of the colour variants of a fur: named variants + "custom", then the tincture controls. */
  private variantBox(k: number, chips: HTMLElement[], ...controls: (HTMLElement | false | null)[]) {
    return h('div', { class: 'variant-box', 'data-area': k }, [
      h('div', { class: 'variant-box-title' }, [t('area.presets')]),
      h('div', { class: 'chip-row' }, chips),
      ...controls
    ]);
  }

  private fillName(fill: AreaFill) {
    const v = fill.variation;
    const first = t('tincture.' + fill.tincture);
    if (!v) return first;
    const second = t('tincture.' + secondTincture(v));
    switch (v.kind) {
      case 'seme':
        return `${first}, ${t('variation.seme')} (${t('seme.' + v.charge)}, ${second})`;
      case 'ermine': {
        const preset = ERMINE_PRESETS.find(p => p.field === fill.tincture && p.spot === v.spot);
        return preset ? t('tincture.' + preset.key) : `${t('variation.ermined')}: ${first} – ${second}`;
      }
      case 'vair': {
        const preset = v.style === 'vair' && VAIR_PRESETS.find(p => p.field === fill.tincture && p.second === v.second);
        return preset ? t('tincture.' + preset.key) : `${t('vair.' + v.style)}: ${first} – ${second}`;
      }
      default:
        return `${t('variation.' + v.kind)} (${v.count}): ${first} – ${second}`;
    }
  }

  private areaLabel(area: ChargeArea) {
    return area === 'all' ? t('charges.whole') : t('area.title', { n: area + 1 });
  }

  private renderCharges() {
    const { charges, chargeTarget, selectedChargeId } = this.state;
    const targets: ChargeArea[] = ['all', ...Array.from({ length: this.areaCount > 1 ? this.areaCount : 0 }, (_, i) => i)];

    // Top of the list = topmost on the shield
    const rows = [...charges].reverse().flatMap(layer => [
      this.renderChargeRow(layer, targets, layer.id === selectedChargeId),
      this.problemSlot('charge-' + layer.id)
    ]);

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
      h('span', { class: 'coa-title' }, [t('section.charges')]),
      this.details('charge', [t('charges.add')], [
        h('div', { class: 'place-in' }, [
          h('span', { class: 'detail-option' }, [t('charges.placeIn')]),
          chip('all')
        ]),
        areaTargets.length > 0 && h('div', { class: 'chip-row' }, areaTargets.map(chip)),
        h('span', { class: 'detail-option' }, [t('charges.choose')]),
        h('div', { class: 'charge-picker' }, db.chargeData.map(item => {
          const reason = this.chargeConflict(item, chargeTarget);
          const tip = [
            t('charge.' + item.id),
            `${this.chargeClass(item)} (${t('tincture.' + item.tincture)})`,
            t('charges.anchor.' + item.anchor),
            reason
          ].filter(Boolean).join('\n');
          return h('img', {
            src: item.url,
            alt: t('charge.' + item.id),
            'data-tip': tip,
            class: 'selectable-shape charge-shape' + (reason ? ' disabled' : ''),
            'aria-disabled': reason ? 'true' : 'false',
            onclick: () => { if (!reason) this.addCharge(item); }
          });
        })),
        h('p', { class: 'coa-note' }, [t('charges.hint')])
      ]),
      charges.length
        ? h('ul', { class: 'charge-layers' }, rows)
        : h('p', { class: 'charge-empty' }, [t('charges.empty')])
    ];
  }

  private chargeClass(item: ChargeData) {
    if (item.exempt) return t('charges.class.exempt');
    return t(categoryOf(item.tincture) === 'metal' ? 'charges.class.metal' : 'charges.class.colour');
  }

  /** Why a charge can't be added to the target area (rule of tincture), or null. */
  private chargeConflict(item: ChargeData, target: ChargeArea): string | null {
    if (item.exempt) return null;
    let area: number | null = null;
    if (target !== 'all') area = target;
    else if (this.areaCount === 1) area = 0;
    if (area === null) return null; // a divided field: it depends on where it is placed (checked afterwards)
    const fill = this.state.areas[area];
    // A field showing a tincture of the other category (e.g. barry Or and Gules) may carry either
    const cat = categoryOf(item.tincture);
    if (fillTinctures(fill).some(x => categoryOf(x) !== cat)) return null;
    return tinctureConflict(item.tincture, fill.tincture, t('reason.field', { tincture: fillTincturesText(fill) }), true);
  }

  private renderChargeRow(layer: ChargeLayer, targets: ChargeArea[], selected: boolean) {
    const areaSelect = h('select', {
      class: 'layer-area',
      'data-tip': t('charges.areaSelect'),
      onchange: () => {
        layer.area = areaSelect.value === 'all' ? 'all' : Number(areaSelect.value);
        this.chargesChanged();
      }
    }, targets.map(area => {
      const option = h('option', { value: String(area) }, [this.areaLabel(area)]);
      option.selected = area === layer.area;
      return option;
    }));

    const flip = (axis: 'flipX' | 'flipY', symbol: string) => h('button', {
      type: 'button',
      class: 'icon-button' + (layer[axis] ? ' selected' : ''),
      'data-tip': t(axis === 'flipX' ? 'charges.flipX' : 'charges.flipY'),
      'aria-pressed': layer[axis] ? 'true' : 'false',
      onclick: () => {
        layer[axis] = !layer[axis];
        this.chargesChanged();
        this.render();
      }
    }, [symbol]);

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
        const dt = (e as DragEvent).dataTransfer;
        if (dt) {
          dt.setData('text/plain', String(layer.id));
          dt.effectAllowed = 'move';
        }
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
      h('span', { class: 'layer-name' }, [t('charge.' + layer.charge.id)]),
      areaSelect,
      flip('flipX', '⇋'),
      // A base charge can't be turned upside down: it rises from the base
      layer.charge.anchor === 'base' ? null : flip('flipY', '⇅'),
      h('button', {
        type: 'button',
        class: 'delete-button layer-delete',
        'data-tip': t('charges.remove'),
        onclick: () => this.removeCharge(layer.id)
      }, ['✕'])
    ]);
    return row;
  }

  private isLowerHalf(el: HTMLElement, e: DragEvent) {
    const rect = el.getBoundingClientRect();
    return e.clientY > rect.top + rect.height / 2;
  }

  // ================================================================ Problems (validation results)

  private renderProblems() {
    const blocked = this.problems.length > 0;
    this.downloadButton.textContent = t('download');
    this.downloadButton.disabled = blocked;
    this.summaryEl.replaceChildren(...(blocked
      ? [h('div', { class: 'coa-error coa-error-summary', role: 'alert' }, [
          h('strong', {}, [t('download.blocked')]),
          h('ul', {}, this.problems.map(p => h('li', {}, [p.text()])))
        ])]
      : []));
    this.fillProblemSlots();
  }

  private fillProblemSlots() {
    this.problemSlots.forEach(slot => slot.replaceChildren());
    const box = (p: Problem) => h('div', { class: 'coa-error', role: 'alert' }, [p.text()]);
    for (const p of this.problems) {
      if (p.scope.chargeId !== undefined) {
        this.problemSlots.get('charge-' + p.scope.chargeId)?.append(box(p));
      } else if (p.scope.areas) {
        // Adjacency problems belong to the division, the others to their area
        const slot = p.scope.areas.length > 1 ? this.problemSlots.get('division') : this.problemSlots.get('area-' + p.scope.areas[0]);
        slot?.append(box(p));
        if (p.scope.areas.length > 1) p.scope.areas.forEach(a => this.problemSlots.get('area-' + a)?.append(box(p)));
      }
    }
  }

  /** Re-runs the rules (debounced: the pixel analysis needs the charges' final position). */
  private scheduleValidate() {
    if (this.validateTimer) clearTimeout(this.validateTimer);
    this.validateTimer = setTimeout(() => this.validate(), 120);
  }

  private validate() {
    this.validateTimer = null;
    this.analysis = this.shield ? this.runAnalysis() : null;
    const problems = evaluate(this.state, this.areaCount, this.analysis);
    const key = (ps: Problem[]) => ps.map(p => p.text()).join('\n');
    const changed = key(problems) !== key(this.problems);
    this.problems = problems;
    if (changed) this.renderProblems();
  }

  private runAnalysis(): Analysis | null {
    if (!this.shield) return null;
    return analyze({
      shieldMask: this.shield.mask,
      bounds: this.shield.bounds,
      areaPaths: this.areaPaths,
      charges: this.state.charges,
      images: this.chargeImages
    });
  }

  // ================================================================ Tincture pickers

  /**
   * The area tinctures after picking `cand` for the ground (`which = 'first'`) or the second tincture:
   * picking the tincture the other slot already has swaps the two instead of being refused.
   */
  private withTincture(k: number, which: 'first' | 'second', cand: Tincture): AreaFill {
    const fill = this.state.areas[k];
    const v = fill.variation;
    if (!v) return { ...fill, tincture: cand };
    const first = fill.tincture;
    const second = secondTincture(v);
    const newFirst = which === 'first' ? cand : cand === first ? second : first;
    const newSecond = which === 'second' ? cand : cand === second ? first : second;
    return { tincture: newFirst, variation: withSecond(v, newSecond) };
  }

  /** Why picking `cand` would break the rule of tincture for a charge standing on area k (null = fine). */
  private chargeReason(k: number, next: AreaFill, cand: Tincture, analysis: Analysis | null): string | null {
    if (!analysis) return null;
    const areas = this.state.areas.map((a, i) => (i === k ? next : a));
    const problem = evaluate({ ...this.state, areas }, this.areaCount, analysis).find(p =>
      p.scope.chargeId !== undefined && p.scope.areas?.includes(k));
    if (!problem) return null;
    const layer = this.state.charges.find(c => c.id === problem.scope.chargeId)!;
    return tinctureConflict(cand, layer.charge.tincture, t('reason.chargeOnField', { charge: t('charge.' + layer.charge.id) }))
      ?? t('reason.chargeOnFieldGeneric', { charge: t('charge.' + layer.charge.id) });
  }

  private pickAreaTincture(anchor: HTMLElement, k: number) {
    const fill = this.state.areas[k];
    // The charges' geometry doesn't depend on tinctures, so one fresh analysis serves every candidate
    const analysis = this.runAnalysis();
    const v = fill.variation;
    openTincturePicker(anchor, {
      current: fill.tincture,
      disabled: cand => {
        if (v && cand !== secondTincture(v) && secondLiesOnGround(v)) {
          const reason = tinctureConflict(cand, secondTincture(v), t('reason.optionOnField', { option: t('variation.' + v.kind) }));
          if (reason) return reason;
        }
        return this.chargeReason(k, this.withTincture(k, 'first', cand), cand, analysis);
      },
      note: cand => (v && cand === secondTincture(v)
        ? t('reason.swapWithSecond', { option: t('variation.' + v.kind), tincture: t('tincture.' + fill.tincture) })
        : null),
      onPick: tinc => {
        this.state.areas[k] = this.withTincture(k, 'first', tinc);
        this.areaChanged();
      }
    });
  }

  /** The second tincture of a variation / semé / fur. */
  private pickSecondTincture(anchor: HTMLElement, k: number) {
    const fill = this.state.areas[k];
    const v = fill.variation;
    if (!v) return;
    const analysis = this.runAnalysis();
    openTincturePicker(anchor, {
      current: secondTincture(v),
      disabled: cand => {
        if (cand !== fill.tincture && secondLiesOnGround(v)) {
          const reason = tinctureConflict(cand, fill.tincture, t('reason.field', { tincture: t('tincture.' + fill.tincture) }));
          if (reason) return reason;
        }
        return this.chargeReason(k, this.withTincture(k, 'second', cand), cand, analysis);
      },
      note: cand => (cand === fill.tincture
        ? t('reason.swapWithFirst', { tincture: t('tincture.' + secondTincture(v)) })
        : null),
      onPick: tinc => {
        this.state.areas[k] = this.withTincture(k, 'second', tinc);
        this.areaChanged();
      }
    });
  }

  // ================================================================ Actions

  private get divisionDef(): DivisionDef {
    return DIVISIONS.find(d => d.id === this.state.division.id)!;
  }

  private get areaCount() {
    return this.divisionDef.areas;
  }

  changeBackgroundColor(color: string) {
    this.state.backgroundColor = color;
    this.render();
    this.scheduleDraw();
  }

  selectBase(base: BaseInfo) {
    this.state.base = base;
    this.render();
    this.loadShield();
  }

  selectDivision(id: DivisionId) {
    this.state.division.id = id;
    this.state.division.offsetX = 0;
    this.state.division.offsetY = 0;

    // Charges in areas that no longer exist fall back to the whole shield
    const valid = (area: ChargeArea) => area === 'all' || (this.areaCount > 1 && area < this.areaCount);
    this.state.charges.forEach(layer => { if (!valid(layer.area)) layer.area = 'all'; });
    if (!valid(this.state.chargeTarget)) this.state.chargeTarget = 'all';

    this.updateDivision();
    this.render();
  }

  private setVariation(k: number, kind: OptionKind | 'none') {
    const fill = this.state.areas[k];
    if (kind === 'none') fill.variation = null;
    else if (fill.variation?.kind !== kind) fill.variation = defaultVariation(kind, fill);
    this.areaChanged();
  }

  /** Something in a field area changed; `rerender` is off for slider drags (keeps the slider alive). */
  private areaChanged(rerender = true) {
    if (rerender) this.render();
    this.scheduleDraw();
    this.scheduleValidate();
  }

  private chargesChanged() {
    this.scheduleDraw();
    this.scheduleValidate();
  }

  private minScale(layer: { width: number, height: number }) {
    return (MIN_CHARGE_FRACTION * BASE_SIZE) / Math.max(layer.width, layer.height);
  }

  async addCharge(charge: ChargeData) {
    if (!this.shield) return;
    const area = this.state.chargeTarget;
    const [size] = await Promise.all([svgSize(charge.url), this.loadChargeImage(charge)]);

    // Unscaled size: larger side = 100 logical units
    const ratio = 100 / Math.max(size.width, size.height);
    const width = size.width * ratio;
    const height = size.height * ratio;
    const layer: ChargeLayer = {
      id: this.nextChargeId++, charge, area, x: 0, y: 0, width, height, scale: 1, rotation: 0, flipX: false, flipY: false
    };

    const region = this.measureRegion(area);
    if (charge.anchor === 'base') {
      // Issues from the base: as wide as the shield, the mounds' feet at about a third of its height
      // (the program fills below them down to the base, see drawCharge)
      const b = this.shield.bounds;
      layer.scale = b.width / width;
      layer.x = b.left + b.width / 2;
      layer.y = this.shieldBottomAt(layer.x) - b.height * 0.32 - (height * layer.scale) / 2;
    } else {
      // Free: in the middle of the chosen area, sized to fit comfortably inside it
      layer.scale = 0.6 * Math.min(region.width / width, region.height / height);
      layer.x = region.cx;
      layer.y = region.cy;
    }
    layer.scale = Math.max(this.minScale(layer), layer.scale);

    this.state.charges.push(layer);
    this.state.selectedChargeId = layer.id;
    this.render();
    this.chargesChanged();
  }

  private shieldBottomAt(x: number) {
    const shield = this.shield!;
    const ix = Math.round(x);
    for (let y = SIZE - 1; y >= 0; y--) {
      if (shield.hitAlpha[(y * SIZE + ix) * 4 + 3] > 127) return y;
    }
    return shield.bounds.top + shield.bounds.height;
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
    this.chargesChanged();
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
    this.chargesChanged();
  }

  private get selectedCharge(): ChargeLayer | undefined {
    return this.state.charges.find(layer => layer.id === this.state.selectedChargeId);
  }

  saveCanvasAsImage() {
    if (this.validateTimer) this.validate(); // never export on stale results
    if (this.problems.length) return;
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
    const url = 'coat-of-arms/base_' + this.state.base.id + '.svg';
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
      rasterizeSvg(url, pxW, pxH, { fill: 'none', stroke: OUTLINE })
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
    const { division, base } = this.state;
    this.areaPaths = divisionAreas(
      division.id, this.shield.bounds, division.offsetX, base.offsetY + division.offsetY, division.line, base.perBendDegOffset || 0
    );
    this.scheduleDraw();
    this.scheduleValidate();
  }

  private async loadChargeImage(charge: ChargeData) {
    if (this.chargeImages.has(charge.url)) return;
    const size = await svgSize(charge.url);
    const ratio = CHARGE_RASTER_SIZE / Math.max(size.width, size.height);
    this.chargeImages.set(charge.url, await rasterizeSvg(charge.url, size.width * ratio, size.height * ratio));
  }

  /**
   * Centroid and bounding box of an area (clipped to the shield), used to place new charges.
   * Uses the first connected piece of the area (an alternating area, like a quarter, has several).
   */
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
    if (area !== 'all' && this.areaPaths[area]) {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fill(this.areaPaths[area]);
    }
    const data = ctx.getImageData(0, 0, n, n).data;
    const inside = (i: number) => data[i * 4 + 3] > 127;

    // Flood fill from the first pixel found (reading order → the chief / dexter-most piece)
    const start = Array.from({ length: n * n }, (_, i) => i).find(inside);
    if (start === undefined) return { cx: SIZE / 2, cy: SIZE / 2, width: 100, height: 100 };
    const seen = new Uint8Array(n * n);
    const stack = [start];
    seen[start] = 1;
    let sumX = 0, sumY = 0, count = 0, minX = n, minY = n, maxX = 0, maxY = 0;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % n;
      const y = (i - x) / n;
      sumX += x; sumY += y; count++;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (const j of [x > 0 ? i - 1 : -1, x < n - 1 ? i + 1 : -1, i - n, i + n]) {
        if (j >= 0 && j < n * n && !seen[j] && inside(j)) {
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    return {
      cx: (sumX / count + 0.5) / factor,
      cy: (sumY / count + 0.5) / factor,
      width: (maxX - minX + 1) / factor,
      height: (maxY - minY + 1) / factor
    };
  }

  // ================================================================ Rendering of the shield

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
   * Layers: background → field areas (tincture/variation, outlined) → charges (each clipped to its area)
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

    // Field areas, then the partition lines on top
    this.areaPaths.forEach((path, k) => drawAreaFill(w, path, this.state.areas[k], shield.bounds, LINE_WIDTH));
    if (this.areaPaths.length > 1) {
      w.lineWidth = LINE_WIDTH * 1.4;
      w.strokeStyle = OUTLINE;
      w.lineJoin = 'round';
      this.areaPaths.forEach(path => w.stroke(path));
    }

    // Charges, bottom → top, each clipped to its own area
    for (const layer of this.state.charges) {
      const img = this.chargeImages.get(layer.charge.url);
      if (!img) continue;
      w.save();
      if (layer.area !== 'all' && this.areaPaths[layer.area]) w.clip(this.areaPaths[layer.area]);
      drawCharge(w, layer, img);
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
  /** Base charges always stand upright: they rise from the base of the shield. */
  private canRotate(layer: ChargeLayer, x: number, y: number) {
    return layer.charge.anchor !== 'base' && this.insideShield(x, y);
  }

  private chargeAt(x: number, y: number) {
    return [...this.state.charges].reverse().find(layer => containsPoint(layer, x, y));
  }

  private bindCanvasEvents() {
    this.canvas.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const [x, y] = this.toCanvasPoint(e);
      let layer = this.selectedCharge;
      let hit = layer ? hitTest(layer, x, y, this.canRotate(layer, x, y)) : null;

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
        Object.assign(layer, applyDrag(this.drag, x, y, this.minScale(layer)));
        this.chargesChanged();
        return;
      }
      if (layer) {
        this.canvas.style.cursor = cursorFor(hitTest(layer, x, y, this.canRotate(layer, x, y)), layer);
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
      if (!layer || (e.target as Element | null)?.closest?.('input, select, textarea')) return;

      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'Delete':
        case 'Backspace': this.removeCharge(layer.id); return;
        case 'Escape': this.selectCharge(null); return;
        case 'ArrowLeft': layer.x -= step; break;
        case 'ArrowRight': layer.x += step; break;
        case 'ArrowUp': layer.y -= step; break;
        case 'ArrowDown': layer.y += step; break;
        default: return;
      }
      e.preventDefault();
      this.chargesChanged();
    });
  }
}

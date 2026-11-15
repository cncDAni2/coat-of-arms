import { h } from './dom';
import { tinctureSwatch } from './field';
import { t } from './i18n';
import { CATEGORIES, Tincture, TINCTURES } from './tinctures';

const swatches = new Map<Tincture, string>();
function swatch(tinc: Tincture) {
  let url = swatches.get(tinc);
  if (!url) {
    url = tinctureSwatch(tinc);
    swatches.set(tinc, url);
  }
  return url;
}

export interface PickerOptions {
  current: Tincture,
  /** Reason why a tincture can't be chosen here (shown as tooltip), or null if it can */
  disabled: (tinc: Tincture) => string | null,
  /** A non-blocking remark shown as tooltip (e.g. "the two tinctures will swap"); the tincture stays clickable */
  note?: (tinc: Tincture) => string | null,
  onPick: (tinc: Tincture) => void
}

let open: { el: HTMLElement, close: () => void } | null = null;

export function closeTincturePicker() {
  open?.close();
}

/** Opens the categorized tincture dialog next to `anchor`. */
export function openTincturePicker(anchor: HTMLElement, options: PickerOptions) {
  closeTincturePicker();

  const groups = CATEGORIES.map(cat => h('div', { class: 'picker-group' }, [
      h('div', { class: 'picker-group-title' }, [t('category.' + cat)]),
      h('div', { class: 'picker-swatches' }, TINCTURES.filter(x => x.category === cat).map(info => {
        const reason = options.disabled(info.key);
        const note = reason ? null : options.note?.(info.key) ?? null;
        const name = t('tincture.' + info.key);
        // Tooltip only when it says something the swatch doesn't (a reason or a remark), never the name again
        const tip = reason ?? note;
        const btn = h('button', {
          type: 'button',
          class: 'picker-swatch' + (info.key === options.current ? ' selected' : '') + (reason ? ' disabled' : '') + (note ? ' swap' : ''),
          ...(tip ? { 'data-tip': tip } : {}),
          'aria-disabled': reason ? 'true' : 'false',
          onclick: () => {
            if (reason) return;
            options.onPick(info.key);
            close();
          }
        }, [
          h('img', { src: swatch(info.key), alt: '' }),
          h('span', {}, [name])
        ]);
        return btn;
      }))
    ]));

  const el = h('div', { class: 'tincture-picker', role: 'dialog', 'aria-label': t('picker.title') }, [
    h('div', { class: 'picker-title' }, [t('picker.title')]),
    ...groups
  ]);
  document.body.appendChild(el);

  // Position under (or above) the anchor, kept inside the viewport
  const rect = anchor.getBoundingClientRect();
  const margin = 8;
  let left = Math.min(rect.left, window.innerWidth - el.offsetWidth - margin);
  left = Math.max(margin, left);
  let top = rect.bottom + 6;
  if (top + el.offsetHeight > window.innerHeight - margin) top = Math.max(margin, rect.top - el.offsetHeight - 6);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;

  const onDown = (e: PointerEvent) => {
    if (!el.contains(e.target as Node) && !anchor.contains(e.target as Node)) close();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  function close() {
    el.remove();
    document.removeEventListener('pointerdown', onDown, true);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', close);
    open = null;
  }
  document.addEventListener('pointerdown', onDown, true);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', close);
  open = { el, close };
}

/** The round swatch button that shows the current tincture and opens the picker. */
export function tinctureButton(current: Tincture, onClick: (button: HTMLElement) => void, label?: string): HTMLElement {
  const name = t('tincture.' + current);
  const btn = h('button', {
    type: 'button',
    class: 'tincture-button',
    'aria-label': label ? `${label}: ${name}` : name,
    onclick: () => onClick(btn)
  }, [
    h('img', { src: swatch(current), alt: '' }),
    h('span', {}, [name])
  ]);
  return btn;
}

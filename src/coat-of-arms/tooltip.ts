/**
 * Custom tooltip: any element with a `data-tip` attribute shows it instantly on hover / focus.
 * One shared bubble for the whole page, positioned above the element (below if there is no room).
 */

let bubble: HTMLDivElement | null = null;
let anchor: HTMLElement | null = null;

function ensureBubble() {
  if (!bubble) {
    bubble = document.createElement('div');
    bubble.className = 'coa-tooltip';
    bubble.setAttribute('role', 'tooltip');
    document.body.appendChild(bubble);
  }
  return bubble;
}

function show(el: HTMLElement) {
  const text = el.dataset['tip'];
  if (!text) return hide();
  anchor = el;
  const b = ensureBubble();
  b.textContent = text;
  b.classList.add('visible');

  const rect = el.getBoundingClientRect();
  const bw = b.offsetWidth;
  const bh = b.offsetHeight;
  const margin = 8;
  let left = rect.left + rect.width / 2 - bw / 2;
  left = Math.max(margin, Math.min(window.innerWidth - bw - margin, left));
  let top = rect.top - bh - 8;
  const below = top < margin;
  if (below) top = rect.bottom + 8;
  b.classList.toggle('below', below);
  b.style.left = `${left}px`;
  b.style.top = `${top}px`;
  b.style.setProperty('--arrow-x', `${rect.left + rect.width / 2 - left}px`);
}

function hide() {
  anchor = null;
  bubble?.classList.remove('visible');
}

export function initTooltips() {
  document.addEventListener('mouseover', e => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (el !== anchor) el ? show(el) : hide();
  });
  document.addEventListener('focusin', e => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    el ? show(el) : hide();
  });
  document.addEventListener('focusout', hide);
  document.addEventListener('scroll', hide, true);
  document.addEventListener('pointerdown', hide);
}

/** Re-shows the tooltip of the hovered element after its content changed (e.g. language switch). */
export function refreshTooltip() {
  if (anchor && document.body.contains(anchor)) show(anchor);
  else hide();
}

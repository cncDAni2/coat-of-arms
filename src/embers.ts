/**
 * Decorative background effect: a few slowly rising, flickering embers.
 * Purely CSS-animated; each ember gets randomised position, size, speed and drift.
 */
export function spawnEmbers(container: HTMLElement, count = 22) {
  const layer = document.createElement('div');
  layer.className = 'embers';
  layer.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < count; i++) {
    const ember = document.createElement('span');
    const size = 2 + Math.random() * 3;
    ember.style.setProperty('--x', `${Math.random() * 100}vw`);
    ember.style.setProperty('--size', `${size}px`);
    ember.style.setProperty('--drift', `${(Math.random() - 0.5) * 160}px`);
    ember.style.setProperty('--duration', `${12 + Math.random() * 14}s`);
    ember.style.setProperty('--delay', `${-Math.random() * 26}s`);
    layer.append(ember);
  }

  container.prepend(layer);
}

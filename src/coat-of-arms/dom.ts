type Child = Node | string | null | undefined | false;
type Props = Record<string, string | number | EventListener>;

/**
 * Small DOM builder: h('img', { class: 'x', src: 'a.svg', onclick: fn }, [children])
 * Function-valued props whose key starts with "on" become event listeners, everything else an attribute.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  children: Child[] = []
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function') {
      el.addEventListener(key.replace(/^on/, '').toLowerCase(), value);
    } else {
      el.setAttribute(key, String(value));
    }
  }
  el.append(...children.filter((c): c is Node | string => !!c));
  return el;
}

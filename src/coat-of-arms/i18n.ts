import hu from './i18n/hu.json';
import en from './i18n/en.json';

/**
 * A language entry is either plain UI text, or a heraldic technical term:
 * `checked: true` means the term was verified against the given source (literature / wiki),
 * `checked: false` means it is our best knowledge but still needs verification.
 */
export type Entry = string | { text: string, checked: boolean, source?: string, note?: string };
type Dictionary = Record<string, Entry>;

export type Lang = 'hu' | 'en';

const dictionaries: Record<Lang, Dictionary> = { hu, en };
const STORAGE_KEY = 'coa-lang';
const listeners = new Set<() => void>();

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'hu' || stored === 'en') return stored;
  } catch { /* storage unavailable */ }
  return navigator.language?.toLowerCase().startsWith('hu') ? 'hu' : 'en';
}

let current: Lang = initialLang();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang) {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch { /* storage unavailable */ }
  listeners.forEach(fn => fn());
}

export function onLangChange(fn: () => void) {
  listeners.add(fn);
}

/** Translates a key; `{name}` placeholders are filled from params. Falls back to English, then to the key. */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const entry = dictionaries[current][key] ?? dictionaries.en[key];
  const text = entry === undefined ? key : typeof entry === 'string' ? entry : entry.text;
  return text.replace(/\{(\w+)\}/g, (_, name) => (name in params ? String(params[name]) : `{${name}}`));
}

/**
 * Heraldic tinctures: the closed set of "colours" a coat of arms may use.
 * Shades are not part of heraldry; the hex values are only how we paint them.
 * Furs (ermine, vair) are not flat tinctures here: they are field options with their own settings (see field.ts).
 */

export type Metal = 'or' | 'argent';
export type Colour = 'gules' | 'azure' | 'vert' | 'sable' | 'purpure';
export type Tincture = Metal | Colour;
export type TinctureCategory = 'metal' | 'colour';

export interface TinctureInfo {
  key: Tincture,
  category: TinctureCategory,
  hex: string
}

export const TINCTURES: TinctureInfo[] = [
  { key: 'or', category: 'metal', hex: '#FCDD09' },
  { key: 'argent', category: 'metal', hex: '#FFFFFF' },
  { key: 'gules', category: 'colour', hex: '#DA121A' },
  { key: 'azure', category: 'colour', hex: '#0F47AF' },
  { key: 'vert', category: 'colour', hex: '#078930' },
  { key: 'sable', category: 'colour', hex: '#000000' },
  { key: 'purpure', category: 'colour', hex: '#9C2E8E' }
];

const byKey = new Map(TINCTURES.map(t => [t.key, t]));

export function categoryOf(t: Tincture): TinctureCategory {
  return byKey.get(t)!.category;
}

export function hexOf(t: Tincture): string {
  return byKey.get(t)!.hex;
}

export const CATEGORIES: TinctureCategory[] = ['metal', 'colour'];

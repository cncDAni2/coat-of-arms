import { BaseInfo, ChargeData } from './coat-types';

/** Escutcheon shapes (public/coat-of-arms/base_<id>.svg); names are in the i18n files as shape.<id>. */
export const baseInfo: BaseInfo[] = [
  { id: 1, offsetY: 0.12 },
  { id: 2, offsetY: 0.02, perBendDegOffset: 8 },
  { id: 3, offsetY: 0 },
  { id: 4, offsetY: 0, perBendDegOffset: 5 },
  { id: 5, offsetY: 0 },
  { id: 6, offsetY: 0.12 },
  { id: 7, offsetY: 0.02, perBendDegOffset: 6 },
  { id: 8, offsetY: 0.03 },
  { id: 9, offsetY: 0.12 },
  { id: 10, offsetY: 0 },
  { id: 11, offsetY: 0.12 }
];

export const chargeData: ChargeData[] = [
  // The double cross as drawn in today's arms of Hungary (stands on the crown, flat foot)
  { id: 'doubleCross', url: 'coat-of-arms/charges/double-cross.svg', tincture: 'argent', anchor: 'free' },
  // The double cross of Béla IV's later seals (slightly flared arms, spiked foot)
  { id: 'doubleCrossBela4', url: 'coat-of-arms/charges/double-cross-bela4.svg', tincture: 'argent', anchor: 'free' },
  { id: 'crown', url: 'coat-of-arms/charges/crown.svg', tincture: 'or', anchor: 'free' },
  // A mount of vert is a tolerated exception to the rule of tincture (sky and earth)
  { id: 'trimount', url: 'coat-of-arms/charges/triple-mount.svg', tincture: 'vert', exempt: true, anchor: 'base' }
];

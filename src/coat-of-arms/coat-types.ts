import { AreaFill } from './field';
import { DivisionId, LineStyle } from './geometry';
import { Tincture } from './tinctures';

export interface BaseInfo {
  id: number,
  offsetY: number, // vertical position of the division center (shape-dependent optical correction)
  perBendDegOffset?: number
}

/**
 * How a charge relates to the edge of the shield:
 *  - free: floats in the field, must lie entirely inside the shield and its area
 *  - base: issues from the base (e.g. a mount), must touch the bottom edge, may run off at the bottom/sides
 */
export type ChargeAnchor = 'free' | 'base';

export interface ChargeData {
  id: string, // also the i18n key suffix: charge.<id>
  url: string,
  /** The fixed tincture the charge is drawn in */
  tincture: Tincture,
  /** Tolerated exception to the rule of tincture (e.g. a mount of vert) */
  exempt?: boolean,
  anchor: ChargeAnchor
}

/** Which field area a charge lives in (and is clipped to): an area index, or the whole shield. */
export type ChargeArea = number | 'all';

/** A charge placed on the shield. Position/size are in logical canvas units (500×500). */
export interface ChargeLayer {
  id: number,
  charge: ChargeData,
  area: ChargeArea,
  x: number, // center
  y: number,
  width: number, // unscaled size
  height: number,
  scale: number,
  rotation: number, // radians, multiples of 45°
  flipX: boolean, // contourné
  flipY: boolean // reversed
}

export interface CoaState {
  backgroundColor: string,
  base: BaseInfo,
  division: {
    id: DivisionId,
    line: LineStyle,
    offsetX: number, // fraction of the shield width
    offsetY: number // fraction of the shield height
  },
  areas: AreaFill[],
  /** Bottom → top render order */
  charges: ChargeLayer[],
  selectedChargeId: number | null,
  /** Area that newly added charges go into */
  chargeTarget: ChargeArea
}

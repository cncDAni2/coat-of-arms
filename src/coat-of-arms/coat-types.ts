export interface BaseInfo {
  id: number | string,
  offsetX?: number,
  offsetY: number,
  perBendDegOffset?: number
}
export interface patternOptions {
  url: string,
  padding?: number,
  scale?: number,
  bgColor?: string,
  shapeColors?: string[],
  multipleColors?: number[][]
}
export interface DividentImagesInfo {
  id: string, // Image file name (+png) and resourceKey
  divided: number, // How many part will be there which is configurable
  x: boolean, // Is custom X offset possible?
  y: boolean, // Is custom Y offset possible?
  i?: number // Index of the shape
}
export interface PatternData {
  preview: string,
  url: string,
  name: string,
  baseScale: number,
  basePadding: number,
  shapeColors: string[],
  multipleColors?: number[][],
  i?: number
}
export interface ChargeData {
  url: string,
  name: string
}
export interface SelectedPattern {
  url: string,
  bgColor: string,
  padding: number,
  scale: number,
  offsetX: number,
  offsetY: number,
  shapeColors: string[],
  multipleColors?: number[][],
  i?: number
}

/** Which field area a charge lives in (and is clipped to): an area index, or the whole shield. */
export type ChargeArea = number | 'all';

/** A charge placed on the shield. Position/size are in logical canvas units (500×500). */
export interface ChargeLayer {
  id: number,
  charge: ChargeData,
  area: ChargeArea,
  x: number, // center
  y: number, // center
  width: number, // unscaled size
  height: number,
  scale: number,
  rotation: number // radians
}

export interface CoaState {
  backgroundColor: string,
  selectedBase: {
    shape: BaseInfo,
    background: string,
    stroke: string,
    offsetX: number,
    offsetY: number
  },
  selectedDiv: {
    shape: DividentImagesInfo,
    colors: string[],
    pattern: (SelectedPattern | null)[]
  },
  /** Bottom → top render order */
  charges: ChargeLayer[],
  selectedChargeId: number | null,
  /** Area that newly added charges go into */
  chargeTarget: ChargeArea
}

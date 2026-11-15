import * as fabric from 'fabric';

export type CoaLayers = Record<string, fabric.Object[]>;
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
  preview: string,
  url: string,
  name: string,
  scale: number,
  i?: number
}export interface SelectedPattern {
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
  }
}

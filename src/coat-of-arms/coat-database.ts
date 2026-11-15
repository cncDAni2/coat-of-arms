import { BaseInfo, ChargeData, DividentImagesInfo, PatternData } from './coat-types';

export const dividentImagesInfo: DividentImagesInfo[] = [
  { id: 'flat', divided: 1, x: false, y: false },
  { id: 'perpale', divided: 2, x: true, y: false },
  { id: 'Perfess', divided: 2, x: false, y: true },
  { id: 'Perbend', divided: 2, x: false, y: true },
  { id: 'Perbentsinister', divided: 2, x: false, y: true },
  { id: 'persaltire', divided: 4, x: true, y: true },
  { id: 'quaterly', divided: 4, x: true, y: true },
  { id: 'Gyronny6F', divided: 2, x: true, y: true },
  { id: 'Gyronny6T', divided: 2, x: true, y: true },
  { id: 'Gyronny8F', divided: 2, x: true, y: true },
  { id: 'Gyronny8T', divided: 2, x: true, y: true },
  { id: 'Gyronny12F', divided: 2, x: true, y: true },
  { id: 'Gyronny12T', divided: 2, x: true, y: true }
];
export const baseInfo: BaseInfo[] = [{
  id: 1,
  offsetY: 36
}, {
  id: 2,
  offsetY: 5,
  perBendDegOffset: 8
}, {
  id: 3,
  offsetY: 0
}, {
  id: 4,
  offsetY: 0,
  perBendDegOffset: 5
}, {
  id: 5,
  offsetY: 0
}, {
  id: 6,
  offsetY: 36
}, {
  id: 7,
  offsetY: 5,
  perBendDegOffset: 6
}, {
  id: 8,
  offsetY: 10
}, {
  id: 9,
  offsetY: 36
}, {
  id: 10,
  offsetY: 0
}, {
  id: 11,
  offsetY: 36
}];
export const patternData:PatternData[] = [{
  preview: 'none.png',
  url: '',
  name: 'Delete pattern',
  basePadding: 0,
  baseScale: 1,
  shapeColors: []
}, {
  preview: 'circles_preview.png',
  url: 'coat-of-arms/patterns/circles.svg',
  name: '3 circles',
  basePadding: 3,
  baseScale: 2,
  shapeColors: ['#4444FF', '#0000FF', '#FFFF00']
}, {
  preview: 'circle_preview.png',
  url: 'coat-of-arms/patterns/circle.svg',
  name: 'Circle',
  basePadding: 3,
  baseScale: 1,
  shapeColors: ['#000000']
}, {
  preview: 'ring_preview.png',
  url: 'coat-of-arms/patterns/ring.svg',
  name: 'Ring',
  basePadding: 3,
  baseScale: 1,
  shapeColors: ['#000000']
}, {
  preview: 'JdM_preview.png',
  url: 'coat-of-arms/patterns/JdM.svg',
  name: 'Jean de Montfort',
  basePadding: 3,
  baseScale: 2,
  shapeColors: ['#000000']
}, {
  preview: 'stripe_preview.png',
  url: 'coat-of-arms/patterns/stripe.svg',
  name: 'Stripes',
  basePadding: 0,
  baseScale: 2.5,
  shapeColors: ['#FF0000', '#FFFFFF']
}, {
  preview: 'square_preview.png',
  url: 'coat-of-arms/patterns/square.svg',
  name: 'Squares',
  basePadding: 0,
  baseScale: 2,
  shapeColors: ['#000000', '#FFFFFF'],
  multipleColors: [[0,1], [2,3]]
}, {
  preview: 'diamond_preview.png',
  url: 'coat-of-arms/patterns/diamond.svg',
  name: 'Diamonds',
  basePadding: 0,
  baseScale: 2,
  shapeColors: ['#FF0000', '#000000', '#0281c9'],
  multipleColors: [[0], [1,4], [2,3]]
}];
export const chargeData: ChargeData[] = [{
  url: 'coat-of-arms/charges/double-cross.svg',
  name: 'Double cross (IV Béla)'
}, {
  url: 'coat-of-arms/charges/crown.svg',
  name: 'Crown'
}, {
  url: 'coat-of-arms/charges/triple-mount.svg',
  name: 'Triple mount'
}];
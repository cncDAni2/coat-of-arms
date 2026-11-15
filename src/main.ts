import './style.scss';
import { CoatOfArmsCreator } from './coat-of-arms/creator';

const root = document.getElementById('app');
if (!root) throw new Error('#app element is missing from index.html');

new CoatOfArmsCreator(root);

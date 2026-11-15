import '@fontsource/cinzel-decorative/700.css';
import '@fontsource/cinzel/500.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/400-italic.css';
import '@fontsource/spectral/500.css';
import '@fontsource/spectral/700.css';
import '@fontsource/spectral-sc/500.css';
import '@fontsource/spectral-sc/700.css';
import './style.scss';
import { CoatOfArmsCreator } from './coat-of-arms/creator';
import { spawnEmbers } from './embers';

const root = document.getElementById('app');
if (!root) throw new Error('#app element is missing from index.html');

spawnEmbers(document.body);
new CoatOfArmsCreator(root);

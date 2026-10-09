import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base from '../../../vite-review-correction.config.mjs';

const owner=path.dirname(fileURLToPath(import.meta.url));
const preview=path.resolve(owner,'../../..');
const normalize=id=>id.split('?')[0].replaceAll('\\','/');
const original=normalize(path.join(preview,'ManifoldOperationObjects.jsx'));
const overlay=path.join(owner,'ManifoldOperationObjects.jsx');
const visualOverlay={
  name:'exact-probability-arrow-overlay', enforce:'pre',
  resolveId(source,importer) {
    if(!importer||!source.startsWith('.')) return;
    if(normalize(path.resolve(path.dirname(normalize(importer)),source))===original) return overlay;
  },
};
export default {
  ...base, publicDir:false,
  plugins:[visualOverlay,...base.plugins],
  cacheDir:path.join(owner,'.vite-cache'),
  server:{...base.server,port:5196,strictPort:true},
  preview:{...base.preview,port:5196,strictPort:true},
  build:{...base.build,outDir:path.join(owner,'build-private'),emptyOutDir:false},
};

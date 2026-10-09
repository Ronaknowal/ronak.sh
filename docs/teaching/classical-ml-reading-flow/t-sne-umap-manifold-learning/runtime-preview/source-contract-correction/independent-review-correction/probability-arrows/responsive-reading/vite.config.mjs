import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base from '../vite.config.mjs';

const owner=path.dirname(fileURLToPath(import.meta.url));
const preview=path.resolve(owner,'../../../..');
const normalize=id=>id.split('?')[0].replaceAll('\\','/');
const original=normalize(path.join(preview,'manifold-reader.css'));
const overlay=path.join(owner,'manifold-reader.css');
const readingOverlay={
  name:'bounded-manifold-responsive-reading',enforce:'pre',
  resolveId(source,importer) {
    if(!importer||!source.startsWith('.')) return;
    if(normalize(path.resolve(path.dirname(normalize(importer)),source))===original) return overlay;
  },
};
export default {
  ...base,publicDir:false,
  plugins:[readingOverlay,...base.plugins],
  cacheDir:path.join(owner,'.vite-cache'),
  server:{...base.server,port:5197,strictPort:true},
  preview:{...base.preview,port:5197,strictPort:true},
  build:{...base.build,outDir:path.join(owner,'build-private'),emptyOutDir:false},
};

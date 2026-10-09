import path from 'node:path';
import {fileURLToPath} from 'node:url';
import base from '../reading-and-crowding/vite.config.mjs';
const owner=path.dirname(fileURLToPath(import.meta.url)),preview=path.resolve(owner,'../../../..');
const normalize=id=>id.split('?')[0].replaceAll('\\','/');
const overlay=path.join(owner,'manifold-reader.css');
const targets=new Set([path.join(preview,'manifold-reader.css'),path.resolve(owner,'../reading-and-crowding/manifold-reader.css')].map(normalize));
const correction={name:'bounded-manifold-relative-inline-math',enforce:'pre',resolveId(source,importer){
  if(!importer||!source.startsWith('.'))return;
  if(targets.has(normalize(path.resolve(path.dirname(normalize(importer)),source))))return overlay;
}};
export default {...base,publicDir:false,plugins:[correction,...base.plugins],cacheDir:path.join(owner,'.vite-cache'),
  server:{...base.server,port:5199,strictPort:true},preview:{...base.preview,port:5199,strictPort:true},
  build:{...base.build,outDir:path.join(owner,'build-private'),emptyOutDir:false}};

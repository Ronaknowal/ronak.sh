import path from 'node:path';
import {fileURLToPath} from 'node:url';
import base from '../responsive-reading/vite.config.mjs';
const owner=path.dirname(fileURLToPath(import.meta.url)),preview=path.resolve(owner,'../../../..');
const normalize=id=>id.split('?')[0].replaceAll('\\','/');
const overlays=new Map(['AffinityFigures.jsx','manifold-reader.css'].map(name=>[normalize(path.join(preview,name)),path.join(owner,name)]));
const correction={name:'bounded-manifold-reading-and-crowding',enforce:'pre',resolveId(source,importer){
  if(!importer||!source.startsWith('.'))return;
  return overlays.get(normalize(path.resolve(path.dirname(normalize(importer)),source)));
}};
export default {...base,publicDir:false,plugins:[correction,...base.plugins],cacheDir:path.join(owner,'.vite-cache'),
  server:{...base.server,port:5198,strictPort:true},preview:{...base.preview,port:5198,strictPort:true},
  build:{...base.build,outDir:path.join(owner,'build-private'),emptyOutDir:false}};

import path from 'node:path';
import {fileURLToPath} from 'node:url';
import base from '../../vite.config.mjs';
const owner=path.dirname(fileURLToPath(import.meta.url));
const sourceOwner=path.resolve(owner,'../..');
const preview=path.resolve(sourceOwner,'..');
const normalize=id=>id.split('?')[0].replaceAll('\\','/');
const targets=new Map([
  [normalize(path.join(sourceOwner,'NativeReadingObjects.jsx')),path.join(owner,'NativeReadingObjects.jsx')],
  [normalize(path.join(preview,'preview-entry.jsx')),path.join(owner,'preview-entry.jsx')],
]);
const wiring={name:'root-native-held-out-dependency-correction',enforce:'pre',resolveId(source,importer){
  if(source==='/preview-entry.jsx')return path.join(owner,'preview-entry.jsx');
  if(!importer||!source.startsWith('.'))return;
  return targets.get(normalize(path.resolve(path.dirname(normalize(importer)),source)));
}};
export default {...base,plugins:[wiring,...base.plugins],cacheDir:path.join(owner,'.vite-cache'),
  server:{...base.server,port:5203,strictPort:true},preview:{...base.preview,port:5203,strictPort:true},
  build:{...base.build,outDir:path.join(owner,'build-private'),emptyOutDir:false}};

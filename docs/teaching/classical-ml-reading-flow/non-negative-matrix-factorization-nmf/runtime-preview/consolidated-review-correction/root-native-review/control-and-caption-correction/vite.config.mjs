import path from 'node:path';
import {fileURLToPath} from 'node:url';
import base from '../readability-correction/vite.config.mjs';
const owner=path.dirname(fileURLToPath(import.meta.url));
const sourceOwner=path.resolve(owner,'../..');
const normalize=id=>id.split('?')[0].replaceAll('\\','/');
const original=normalize(path.join(sourceOwner,'IdentifiabilityFigures.jsx'));
const entry=normalize(path.join(owner,'../readability-correction/preview-entry.jsx'));
const correction={name:'nmf-native-control-and-caption-correction',enforce:'pre',resolveId(source,importer){
  if(!importer)return;
  if(source==='./readability.css'&&normalize(importer)===entry)return path.join(owner,'native-corrections.css');
  if(source.startsWith('.')&&normalize(path.resolve(path.dirname(normalize(importer)),source))===original)return path.join(owner,'IdentifiabilityFigures.jsx');
}};
export default {...base,plugins:[correction,...base.plugins],cacheDir:path.join(owner,'.vite-cache'),server:{...base.server,port:5206,strictPort:true},preview:{...base.preview,port:5206,strictPort:true},build:{...base.build,outDir:path.join(owner,'build-private'),emptyOutDir:false}};

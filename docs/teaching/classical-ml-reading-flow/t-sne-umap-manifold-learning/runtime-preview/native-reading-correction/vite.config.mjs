import path from 'node:path';
import {fileURLToPath} from 'node:url';
import base from '../source-contract-correction/independent-review-correction/probability-arrows/relative-inline-math/vite.config.mjs';
const owner=path.dirname(fileURLToPath(import.meta.url)),preview=path.resolve(owner,'..');
const normalize=id=>id.split('?')[0].replaceAll('\\','/');
const names=['ManifoldDrawing.jsx','ManifoldObjects.jsx','ManifoldInvestigations.jsx','GeometryFigures.jsx','AffinityFigures.jsx','ManifoldOperationObjects.jsx','manifold-lesson.jsx','manifold-reader.css'];
const directories=['.', 'source-contract-correction', 'source-contract-correction/independent-review-correction', 'source-contract-correction/independent-review-correction/probability-arrows','source-contract-correction/independent-review-correction/probability-arrows/reading-and-crowding','source-contract-correction/independent-review-correction/probability-arrows/relative-inline-math'];
export const successorTargets=new Map(directories.flatMap(dir=>names.map(name=>[normalize(path.resolve(preview,dir,name)),path.join(owner,name)])));
const correction={name:'consolidated-manifold-native-reading',enforce:'pre',resolveId(source,importer){
  if(!importer||!source.startsWith('.'))return;
  return successorTargets.get(normalize(path.resolve(path.dirname(normalize(importer)),source)));
}};
export default {...base,publicDir:false,plugins:[correction,...base.plugins],cacheDir:path.join(owner,'.vite-cache'),
  server:{...base.server,port:5201,strictPort:true},preview:{...base.preview,port:5201,strictPort:true},
  build:{...base.build,outDir:path.join(owner,'build-private'),emptyOutDir:false}};

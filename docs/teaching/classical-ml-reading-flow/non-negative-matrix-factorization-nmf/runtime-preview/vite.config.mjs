import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const owner=path.dirname(fileURLToPath(import.meta.url)),app=path.resolve(owner,'../../../../..');
const delivery=JSON.parse(fs.readFileSync(path.join(owner,'file-payloads.json'),'utf8'));
const normalize=id=>id.split('?')[0].replaceAll('\\','/');
const foreign=id=>normalize(id).includes('/src/learn/data/topics/')||normalize(id).endsWith('/src/learn/data/generated/lesson-imports.js');
const payloads=new Map(delivery.files.map(row=>[row.url,path.resolve(app,row.source.path)]));
function privateTopic(){
 const middleware=(req,res,next)=>{const file=payloads.get((req.url||'').split('?')[0]);if(!file){if((req.url||'').startsWith(delivery.prefix)){res.statusCode=404;res.end('Unknown complete lesson file');}else next();return;}res.setHeader('Content-Type',file.endsWith('.json')?'application/json; charset=utf-8':'text/plain; charset=utf-8');res.setHeader('Cache-Control','no-store');fs.createReadStream(file).on('error',()=>{res.statusCode=500;res.end('Complete file unavailable');}).pipe(res);};
 return {name:'isolated-nmf-exact-files',enforce:'pre',configureServer(server){server.middlewares.use(middleware);},configurePreviewServer(server){server.middlewares.use(middleware);},resolveId(source,importer){const from=importer&&normalize(importer);if(normalize(source).endsWith('lesson-loader.js')&&from?.endsWith('/src/learn/hooks/useTopicResource.js'))return path.join(owner,'preview-loader.js');const resolved=source.startsWith('.')&&from?path.resolve(path.dirname(from),source):source;if(foreign(resolved))this.error(`Foreign lesson body forbidden: ${resolved}`);},moduleParsed(info){if(foreign(info.id))this.error(`Foreign lesson body reached private build: ${info.id}`);},generateBundle(_options,output){const ids=[...new Set(Object.values(output).filter(row=>row.type==='chunk').flatMap(row=>Object.keys(row.modules)))];if(ids.some(foreign))this.error('Foreign body in NMF bundle');const sources=[...new Set(ids.filter(id=>!id.startsWith('\0')).map(normalize))].filter(file=>fs.existsSync(file)&&fs.statSync(file).isFile()).map(file=>{const raw=fs.readFileSync(file);return{path:path.relative(app,file).replaceAll('\\','/'),bytes:raw.length,sha256:crypto.createHash('sha256').update(raw).digest('hex')};});this.emitFile({type:'asset',fileName:'private-module-map.json',source:JSON.stringify({schema:'private-topic-built-module-map/v1',topic:'non-negative-matrix-factorization-nmf',publicDir:false,foreignLessonBodies:[],moduleIds:ids.map(id=>id.startsWith('\0')?id:path.relative(app,id).replaceAll('\\','/')),sourceBindings:sources},null,2)+'\n'});}};
}
export default defineConfig({root:owner,publicDir:false,cacheDir:path.join(owner,'.vite-cache'),plugins:[privateTopic(),react()],server:{host:'127.0.0.1',port:5200,strictPort:true,fs:{allow:[app]}},preview:{host:'127.0.0.1',port:5200,strictPort:true},build:{outDir:path.join(owner,'build-private'),emptyOutDir:false,sourcemap:false,manifest:true}});

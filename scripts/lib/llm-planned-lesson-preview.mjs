// Preview newly authored accepted-content lessons in the normal reader.
// In-memory routing/metadata only; published manifests and original outlines stay untouched.
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
const root=process.cwd();
const scope=JSON.parse(fs.readFileSync('docs/teaching/llm-architecture-training/pretraining-alignment-scope.json'));
function staged(){
  const ledger=JSON.parse(fs.readFileSync('docs/teaching/lesson-delivery-progress.json'));
  return scope.topics.filter(t=>!t.source&&ledger.topics[t.id].content.status==='complete').flatMap(t=>{
    const manuscript=ledger.topics[t.id].content.manuscript;
    const jsx=manuscript.endsWith('.md')?manuscript.replace(/\.md$/,'.jsx'):manuscript;
    if(!fs.existsSync(jsx))return [];
    const readTime=fs.readFileSync(jsx,'utf8').match(/readTime:\s*['"]([^'"]+)['"]/)?.[1];
    return [{id:t.id,jsx,readTime,module:`${root.replaceAll('\\','/')}/src/learn/data/topics/__staged-${t.id}.jsx`}];
  });
}
let entries=staged();
const generated=path.resolve('src/learn/data/generated').replaceAll('\\','/');
const server=await createServer({configFile:false,root,cacheDir:'scratch/llm-planned-preview-cache',
  optimizeDeps:{noDiscovery:true,include:['react','react-dom','react-dom/client','react/jsx-runtime','react-router-dom','react-markdown','remark-gfm','cookie','katex']},
  plugins:[{name:'accepted-new-lesson-preview',enforce:'pre',
    resolveId(id){const file=id.replace(/^\/@fs\//,'').replaceAll('\\','/');return entries.find(t=>t.module===file)?.module;},
    load(id){
      const file=id.split('?')[0].replaceAll('\\','/');
      const stagedEntry=entries.find(t=>t.module===file);
      if(stagedEntry)return fs.readFileSync(stagedEntry.jsx,'utf8').replaceAll('../../../../src/learn/','../../');
      if(file===`${generated}/lesson-imports.js`){
        return fs.readFileSync(file,'utf8')+'\n'+entries.map(t=>`lessonModules[${JSON.stringify(t.id)}]=()=>import(${JSON.stringify('/@fs/'+t.module)});`).join('\n');
      }
      if(file===`${generated}/navigation.js`){
        return fs.readFileSync(file,'utf8')+`\nfor(const entry of ${JSON.stringify(entries)}){const row=allTopicsOrdered.find(t=>t.id===entry.id);if(row)Object.assign(row,{status:'published',hasOutline:false,hasIntegratedGuide:true,...(entry.readTime?{readTime:entry.readTime}:{})});}\n`;
      }
    },
    configureServer(s){s.middlewares.use((request,response,next)=>{
      if(request.url!=='/__llm_refresh')return next();entries=staged();s.moduleGraph.invalidateAll();response.end('Accepted new lesson preview refreshed');
    });}
  },react()],server:{host:'127.0.0.1',port:4252,strictPort:true,watch:null}});
await server.listen();server.printUrls();console.log(`Planned LLM preview PID ${process.pid}; ${entries.length} accepted-content routes`);

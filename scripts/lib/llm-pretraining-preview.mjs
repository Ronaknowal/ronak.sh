// Scoped accepted manuscripts in the normal reader, without publication changes.
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
const root=process.cwd();
const folder='docs/teaching/llm-architecture-training';
const scope=JSON.parse(fs.readFileSync(`${folder}/pretraining-alignment-scope.json`));
function mappings(){
  const ledger=JSON.parse(fs.readFileSync('docs/teaching/lesson-delivery-progress.json'));
  return new Map(scope.topics.filter(t=>t.source&&ledger.topics[t.id].content.status==='complete').map(t=>{
    const manuscript=ledger.topics[t.id].content.manuscript;
    const runtimeSuccessor=path.join(path.dirname(manuscript),'lesson.jsx');
    const rendered=['rlhf-reinforcement-learning-from-human-feedback','dpo-direct-preference-optimization','simpo-simple-preference-optimization'].includes(t.id)&&fs.existsSync(runtimeSuccessor)
      ?runtimeSuccessor:manuscript.endsWith('.md')?manuscript.replace(/\.md$/,'.jsx'):manuscript;
    return [path.resolve(t.source).replaceAll('\\','/'),path.resolve(fs.existsSync(rendered)?rendered:manuscript)];
  }));
}
let mapping=mappings();
const server=await createServer({configFile:false,root,cacheDir:'scratch/llm-pretraining-vite-cache',optimizeDeps:{noDiscovery:true,include:['react','react-dom','react-dom/client','react/jsx-runtime','react-router-dom','react-markdown','remark-gfm','cookie','katex']},plugins:[{
  name:'llm-pretraining-staged-reader',enforce:'pre',
  load(id){const draft=mapping.get(id.split('?')[0].replaceAll('\\','/'));if(draft)return fs.readFileSync(draft,'utf8').replaceAll('../../../../src/learn/','../../');},
  configureServer(s){
    s.middlewares.use((request,response,next)=>{if(request.url!=='/__llm_refresh')return next();mapping=mappings();for(const file of mapping.values())s.watcher.add(file);s.moduleGraph.invalidateAll();response.end('Accepted staged source mappings refreshed; reload only your own page');});
    for(const file of mapping.values())s.watcher.add(file);
    s.watcher.on('change',file=>{if([...mapping.values()].includes(path.resolve(file))){s.moduleGraph.invalidateAll();s.ws.send({type:'full-reload'});}});
  }
},react()],server:{host:'127.0.0.1',port:4250,strictPort:true,watch:null}});
await server.listen();server.printUrls();console.log(`LLM pretraining preview PID ${process.pid}`);

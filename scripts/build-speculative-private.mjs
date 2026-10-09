import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
const folder='docs/teaching/llm-architecture-training/speculative-decoding';
const files=[`${folder}/lesson.jsx`,'src/learn/data/speculative-decoding-models.js',...['SpeculativeElements','SpeculativeFoundations','SpeculativeCacheCost','SpeculativeProposers','SpeculativeEvidence','SpeculativeDecodingFlow'].map(n=>`src/learn/components/lesson-labs/${n}.jsx`),'src/learn/components/lesson-labs/speculative-decoding-flow.css'];
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inputs=files.map(path=>({path,sha256:sha(path)}));
const outDir=`scratch/speculative-private-build-${Date.now()}`;
let failure;
try{await build({configFile:false,publicDir:false,plugins:[react()],build:{outDir,emptyOutDir:false,lib:{entry:path.resolve(`${folder}/lesson.jsx`),formats:['es'],fileName:'lesson'},rollupOptions:{external:['react','react-dom','react/jsx-runtime','react-router-dom']}}});}catch(error){failure=error.stack;}
if(inputs.some(i=>sha(i.path)!==i.sha256))failure=(failure||'')+'\nSource changed during build';
fs.writeFileSync(`${folder}/runtime-build.json`,JSON.stringify({passed:!failure,failure,inputs,outDir,scope:'Isolated production-mode bundle of private accepted-manuscript lesson; no canonical publication or scientific execution.'},null,2)+'\n');
if(failure)throw Error(failure);

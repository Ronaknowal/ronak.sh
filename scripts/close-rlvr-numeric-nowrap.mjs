import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {build,transform} from 'esbuild';
const topic='docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards';
const folder=`${topic}/runtime-independent-preparation/study-closure`;
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),checks=[];
const packet=JSON.parse(fs.readFileSync(`${topic}/runtime-study-corrections/source-inputs.json`));
function check(name,passed){checks.push({name,passed:!!passed});}
for(const row of packet.bindings)check(`guard ${row.path}`,hash(fs.readFileSync(row.path))===row.sha256);
check('source predecessor retained',hash(fs.readFileSync(`${topic}/runtime-study-corrections/source-inputs-before-numeric-nowrap.json`))==='736fffeacb48277e33aa4ae7e7573264a2518d04e638e13885b17724f08806d5');
const before=fs.readFileSync(`${folder}/RLVRFlow.jsx`,'utf8'),after=fs.readFileSync('src/learn/components/lesson-labs/RLVRFlow.jsx','utf8');
function outsideTable(s){const start=s.indexOf('export function RLVRTable('),stop=s.indexOf('export function Svg(',start);return s.slice(0,start)+s.slice(stop);}
check('all source outside table unchanged',outsideTable(before)===outsideTable(after));
const cases=[0,-12,257,'0.316406','-.5','−.5','2.','2e-9','2E+12','9.8381191492e-5','0 / 96','native loss','unknown','Infinity','abc','a'.repeat(64)];
const numeric=cases.map((_,i)=>i<10);
const source=`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {RLVRTable} from './src/learn/components/lesson-labs/RLVRFlow.jsx';export default ${JSON.stringify(cases)}.map(v=>renderToStaticMarkup(React.createElement(RLVRTable,{headers:['value'],rows:[[v]]})));`;
const result=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'},external:['react','react-dom/server']});
const mod={exports:{}},require=createRequire(import.meta.url);
new Function('require','module','exports',result.outputFiles[0].text)(require,mod,mod.exports);
mod.exports.default.forEach((html,i)=>{check(`actual table numeric nowrap ${JSON.stringify(cases[i])}`,html.includes('white-space:nowrap')===numeric[i]);check(`literal preserved ${i}`,html.includes(String(cases[i])));});
check('hash keeps dedicated wrap class',mod.exports.default.at(-1).includes('class="rlvr-hash"'));
fs.copyFileSync('src/learn/components/lesson-labs/RLVRFlow.jsx',`${folder}/RLVRFlow-numeric-nowrap.jsx`);
const receipt={passed:checks.every(c=>c.passed),checks,sourcePacket:hash(fs.readFileSync(`${topic}/runtime-study-corrections/source-inputs.json`)),scientificReplays:0,actualPaintAcceptance:false};
fs.writeFileSync(`${folder}/numeric-nowrap-checks.json`,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({passed:receipt.passed,conditions:checks.length,failed:checks.filter(c=>!c.passed)}));if(!receipt.passed)process.exitCode=1;

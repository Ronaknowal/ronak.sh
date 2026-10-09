import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as m from '../src/learn/data/dynamic-tokenization-models.js';

const owner='docs/teaching/llm-architecture-training/dynamic-tokenization-adat-boundlessbpe-litetoken';
const at=process.argv.indexOf('--receipt');
const receipt=at<0?`${owner}/model-evidence.json`:process.argv[at+1];
if(fs.existsSync(receipt))throw Error('Use a fresh receipt; passed evidence is retained.');
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let checks=0;
const same=(a,b,name)=>{assert.deepEqual(a,b,name);checks++;};
const near=(a,b,name)=>{assert.ok(Math.abs(a-b)<1e-11,`${name}: ${a} != ${b}`);checks++;};
const ok=(value,name)=>{assert.ok(value,name);checks++;};
const study=JSON.parse(fs.readFileSync('public/learn/examples/dynamic-tokenization/measured-study.json','utf8'));
const reference=study['boundless-reference'];
same(m.rankedTrace('Tip of the hat').groups.flat().map(m.pieceLabel),reference.hand_trace.pieces,'actual Python saved-rule pieces');
same(m.rankedTrace('ab',m.DELETE_RULES).groups.flat(),reference.deletion_trace.final_pieces,'deletion/rank floor');
for(const text of ['','aaaa','Tip of the hat','Tip 123 hat','Tip of, the hat','है café🙂','a\nb']) {
 const trace=m.rankedTrace(text);
 same(trace.groups.flat().join(''),m.byteString(text),`byte conservation ${text}`);
 same(trace.bytes,new TextEncoder().encode(text).length,'independent UTF8 byte count');
 ok(trace.history.every((step,i)=>!i||step.rank>trace.history[i-1].rank),'strict rank chronology');
}
same(m.mergePieces(['a','a','a'],'a','a'),['aa','a'],'non-overlap replacement');
same(m.mergeCompetition(12,12,90,100,120,.9).winner,'super','cross-kind tie');
same(m.mergeCompetition(12,14,90,100,120,.9).deleteLeft,false,'strict threshold equality');
same(m.mergeCompetition(12,14,100,100,120,.9,true).deleteLeft,false,'base protected');
same(m.mergeCompetition(12,14,100,100,120,.9,false,'super').deleteLeft,false,'super never deletes');
same(m.mergeCompetition(0,0,100,100,120,.9,false,'regular').winner,null,'no observed merge candidate');
same(m.mergeCompetition(0,0,100,100,120,.9,false,'regular').deleteLeft,false,'no candidate cannot delete');

// Independent recursive enumeration, with no DP/edge call to the browser model.
function paths(raw,weights){if(!raw)return[{pieces:[],weight:1}];const result=[];m.LATTICE_PIECES.forEach((piece,i)=>{if(raw.startsWith(piece))for(const tail of paths(raw.slice(piece.length),weights))result.push({pieces:[piece,...tail.pieces],weight:weights[i]*tail.weight});});return result;}
for(const ab of [.01,.1,.4,.8]) {
 const weights=[...m.LATTICE_WEIGHTS];weights[2]=ab;const sum=weights.reduce((a,b)=>a+b,0),probabilities=weights.map(v=>v/sum);
 for(const text of ['','a','ab','aba','abab']) {
  const actual=m.unigramLattice(text,weights),expected=paths(text,probabilities),marginal=expected.reduce((sum,row)=>sum+row.weight,0);
  near(actual.marginal,marginal,'independent forward total');
  same(actual.best.map(e=>e.piece),expected.sort((a,b)=>b.weight-a.weight)[0].pieces,'maximum-product Viterbi');
  same(actual.minimum.length,Math.min(...expected.map(p=>p.pieces.length)),'minimum count');
  for(const piece of m.LATTICE_PIECES){const count=expected.reduce((sum,row)=>sum+row.weight*row.pieces.filter(p=>p===piece).length/marginal,0);near(actual.expected[piece]??0,count,'independent posterior expected count');}
 }
}
near(m.unigramLattice().marginal,study.adaptive.hand_lattice.marginal_probability,'actual Python forward marginal');
near(m.unigramLattice().expected.ab,.328/.2171,'independent ab EM count');
same(m.unigramLattice('abab',m.LATTICE_WEIGHTS,['a','ab','aba','abab']).covered,false,'missing coverage');
const sampled=new Set(Array.from({length:40},(_,i)=>m.seededSample(m.unigramLattice().paths,1,i+1).pieces.join('|')));
ok(sampled.size>1,'seed control changes real sampled path');
same(m.seededSample([],1,13),null,'no sample without path');
near(m.lossStatistics(.5,4).sum,4*Math.log(2),'independent CE sum');
same(m.lossStatistics(.1,0).mean,null,'unobserved difficulty');
same(m.lossStatistics(0,4).sum,Infinity,'zero mass limit');
near(m.adaptivePriority(4,8,4,.5).momentum,2+4/Math.log(9),'unnormalized momentum');
near(m.adaptivePriority(4,8,4,0).momentum,4/Math.log(9),'beta zero');
same(m.adaptivePriority(0,0).mean,null,'unknown priority');
same(m.entropyBits([7,0,0,0]),0,'one-neighbor0bits');
same(m.entropyBits([1,1,1,1]),2,'four-neighbor2bits');
same(m.entropyBits([0,0]),null,'unobserved entropy');
same(m.residueDecision(2,30,[1,1],[2]).excluded,true,'low ratio/context');
same(m.residueDecision(2,30,[1,1,1,1],[1,1,1,1]).excluded,false,'diverse affix retained');
same(m.residueDecision(2,30,[1,1],[2],.2,1.5,true).excluded,false,'protected piece');
const cleanup=m.cleanupTrace(),python=study.residue.corruption_fixture;
for(const [field,nativeField] of [['original','original'],['split','split_only'],['remerged','remerged']])same(cleanup[field].map(n=>n.piece),python[nativeField],`actual Python/HF cleanup ${field}`);
same(m.cleanupTrace('corruptions',['ruptions']).split.map(n=>n.piece),['cor','ruption','s'],'only outer residue');
for(const text of ['','cor','corruption','corruptions','corruptions corruptions','है'])for(const excluded of [[],['ruptions'],['ruption','ruptions']]) {
 const result=m.cleanupTrace(text,excluded);
 for(const field of ['original','split','remerged'])same(result[field].map(n=>n.piece).join(''),m.byteString(text),'cleanup byte conservation');
}
for(const tied of [false,true])for(const ids of [[0],[0,2,4],[0,1,2,3,4],[4,2,0]]) {
 const result=m.compactModel(ids,tied);
 const rows=tied?m.INPUT_ROWS:m.OUTPUT_ROWS;
 const logits=rows.map((row,i)=>row.reduce((sum,value,j)=>sum+value*m.HIDDEN[j],m.OUTPUT_BIAS[i]));
 same(result.selected,ids.map(id=>logits[id]),'independent gathered logits');
 const exp=ids.map(id=>Math.exp(logits[id])),total=exp.reduce((a,b)=>a+b,0);
 result.compacted.forEach((value,i)=>near(value,exp[i]/total,'independent masked normalization'));
}
const contract=m.compactModel();contract.selected.forEach((value,i)=>near(value,study.contract.retained_logits[i],'actual Torch retained logits'));
contract.compacted.forEach((value,i)=>near(value,study.contract.compacted_probabilities[i],'actual Torch softmax'));
same([contract.parametersBefore,contract.parametersAfter],study.contract.untied_parameters_before_after,'actual Torch untied parameter count');
same([m.compactModel([0,2,4],true).parametersBefore,m.compactModel([0,2,4],true).parametersAfter],study.contract.tied_parameters_before_after,'actual tied unique parameters');
same(m.prefixState([0,2,4],[0,1,4]).old.map(row=>row.key),study.contract.prefix.old_keys,'actual Python position dependency');
same(m.prefixState([0,2,4],[0,1,4]).reusable,1,'first prefix changed');
same(m.prefixState([0,2,4],[0,2,4],'v1','v2').reusable,0,'version invalidates');
for(const count of [2,4]){near(m.tokenMetrics(8,4,count).bitsPerByte,4/(8*Math.log(2)),'byte unit');near(m.tokenMetrics(8,4,count).perplexity,Math.exp(4/count),'target denominator');}
same(m.tokenMetrics(0,0,0).bitsPerByte,null,'undefined byte metric');
same(m.tokenMetrics(0,0,0).perplexity,null,'undefined PPL');
same(m.rowBudget(3).parameters,27,'untied append cost');same(m.rowBudget(6).accepted,3,'bounded capacity');same(m.rowBudget(0).parameters,0,'no append');

const components='src/learn/components/lesson-labs/DynamicTokenizationFlow.jsx';
const manuscript=`${owner}/manuscript.jsx`;
for(const file of [components,manuscript]){parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']});checks++;}
const names=['DictionaryContract','AdaptationTimeline','SupermergeGroups','MergeCompetition','RankedReplay','PathLattice','ProbeLoss','AdaptivePriority','ResidueTree','NeighborEntropy','SplitAndRemerge','RowCompaction','PrefixState','MetricsComparison','BudgetRows'];
const bundled=await build({entryPoints:[components],bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',external:['react','react/jsx-runtime'],loader:{'.css':'empty'}});
const modulePath='scratch/dynamic-tokenization/ssr-flow.mjs';
fs.writeFileSync(modulePath,bundled.outputFiles[0].text);
const warnings=[];const originalError=console.error;console.error=(...args)=>warnings.push(args.join(' '));
const renders=[];
try {const module=await import(pathToFileURL(path.resolve(modulePath)).href);for(const name of names){const html=renderToStaticMarkup(React.createElement(module[name]));ok(html.includes('data-dt-figure='),`${name} actual SSR`);renders.push({name,characters:html.length});}}
finally{console.error=originalError;}
same(warnings,[],'no React SSR warnings');
const files=[components,manuscript,'src/learn/data/dynamic-tokenization-models.js','src/learn/components/lesson-labs/dynamic-tokenization-flow.css','public/learn/examples/dynamic-tokenization/measured-study.json','scripts/verify-dynamic-tokenization-model.mjs',`${owner}/native-evidence/report.json`,`${owner}/native-evidence/contract-tied-receipt.json`];
fs.mkdirSync(path.dirname(receipt),{recursive:true});
fs.writeFileSync(receipt,JSON.stringify({passed:true,checks,checkedAt:new Date().toISOString(),sourceHashes:Object.fromEntries(files.map(file=>[file,hash(file)])),renders,
 scope:'Independent enumeration/CE/entropy/matrix references, actual retained Python/Torch/HF outputs, UTF8/history/null guards and all15 SSR; no browser paint claim'},null,2));
console.log(JSON.stringify({passed:true,checks,receipt}));

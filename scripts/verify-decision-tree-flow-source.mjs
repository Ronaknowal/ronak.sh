import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from '@babel/parser';
import { decisionTreeExamples } from '../src/learn/data/decision-tree-examples.js';
import { inspectionRows, growTree, treePrediction, pruningReport, forestReport } from '../src/learn/data/decision-tree-models.js';
const owner='docs/teaching/classical-ml-reading-flow/decision-trees-random-forests';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const read=file=>fs.readFileSync(file,'utf8');
const baseline=JSON.parse(read(`${owner}/reading-flow-baseline.json`));
const assertions=[];
function check(condition,name){assert(condition,name);assertions.push(name);}
for(const item of baseline.originals){
  check(hash(fs.readFileSync(item.original))===item.originalSha256,`protected original ${item.path}`);
  if(item.path!=='src/learn/data/topics/decision-trees-random-forests.jsx')check(hash(fs.readFileSync(item.path))===item.sha256,`unchanged historical owner ${item.path}`);
}
for(const item of baseline.programmes){
  const example=decisionTreeExamples.find(x=>x.id===item.id);
  check(hash(example.code)===item.codeSha256,`retained complete code ${item.id}`);
  check(hash(example.expected)===item.expectedSha256,`retained exact output ${item.id}`);
}
const paths=['src/learn/data/topics/decision-trees-random-forests.jsx',
  'src/learn/components/lesson-labs/DecisionTreeFlowDrawings.jsx','src/learn/components/lesson-labs/DecisionTreeFlowLabs.jsx',
  'src/learn/components/lesson-labs/DecisionTreeFlowExtensions.jsx','src/learn/components/lesson-labs/DecisionTreeFlowStudy.jsx',
  'src/learn/components/lesson-labs/decision-tree-flow.css','src/learn/data/decision-tree-models.js','src/learn/data/decision-tree-examples.js'];
for(const file of paths.filter(f=>f.endsWith('.jsx')))check(Boolean(parse(read(file),{sourceType:'module',plugins:['jsx']})),`parsed ${file}`);
const source=read(paths[0]);
check((source.match(/<Practice title=/g)||[]).length===13,'all thirteen independent solved practices');
check((source.match(/<Example id=/g)||[]).length===10,'all ten full historical programs visible at their intended places');
const headings=[...source.matchAll(/<H2>(\d+)\. ([^<]+)<\/H2>/g)];
check(headings.length===14&&headings.every((h,i)=>Number(h[1])===i+1),'fourteen stable numbered sections');
check(source.includes('opening="route"'),'actual first-pass opening annotation');
check(!/DecisionTreeLabs\.jsx|DecisionTreeIntuition\.jsx/.test(source),'old framed instructional owners retired from runtime imports');
const section7=source.slice(source.indexOf('<H2>7.'),source.indexOf('<H2>8.'));
for(const token of ['<BootstrapDrawDrawing','<PerNodeFeatureDrawing','<ProbabilityMeanDrawing'])check(section7.indexOf(token)<section7.indexOf('<Example id="scratch-tree-forest"'),`D2 first operation before complete program ${token}`);
const section8=source.slice(source.indexOf('<H2>8.'),source.indexOf('<H2>9.'));
check(section8.indexOf('<ForestOobLab')<section8.indexOf('<BootstrapForestLab'),'OOB first new operation in section eight');
check(source.includes('#2-make-every-residual-visible')&&source.includes('Why the mean appears even without Gaussian noise'),'D3 actual owner anchor plus named subsection');
const core=read('public/learn-assets/decision-trees/decision_tree_core.py');
const original=decisionTreeExamples.find(x=>x.id==='scratch-tree-forest').code;
check(core===original.slice(0,original.indexOf('class BinaryForest:')),'exact extracted BinaryTree dependency, no forest before section seven');
for(const file of ['regression-tree.py','cost-complexity-pruning.py','tree-criteria.py','forest-weight-contracts.py','decision-tree-wdbc-experiment.py','decision_tree_core.py'])check(source.includes(`filename="${file}"`)&&fs.existsSync(`public/learn-assets/decision-trees/${file}`),`visible complete new source ${file}`);
for(const alpha of [0,.04,15/128,.3]){const p=pruningReport(alpha);check(p.candidates.length===6,`six candidate costs ${alpha}`);check(p.best.leaves===(alpha<15/128?5:1),`smaller exact-tie training winner ${alpha}`);}
const forest=forestReport();check(forest.members[0].sampleIndices.map(i=>inspectionRows[i].id).join('')==='BHFFFCGB','exact eight replacement slots');
check(forest.members[1].tree.consideredFeatures[0]===1&&forest.members[1].tree.left.consideredFeatures[0]===0,'fresh feature candidate at two actual nodes');
check(forest.oobCount===5&&forest.oobProbability===.8,'actual default A OOB probabilities');
for(let B=1;B<=12;B++){const configured=forestReport({trees:B});check(configured.members.slice(0,Math.min(B,6)).every((m,i)=>JSON.stringify(m.sampleIndices)===JSON.stringify(forest.members[i].sampleIndices)),`stable prior members B=${B}`);}
let credit=[0,0];
function visit(node){if(node.left){credit[node.feature]+=node.count/8*node.gain;visit(node.left);visit(node.right);}}
visit(growTree());check(Math.abs(credit[0]-41/96)<1e-14&&Math.abs(credit[1]-1/24)<1e-14,'every MDI node credit and feature bin');
check(treePrediction(growTree(inspectionRows,{maxDepth:2}),[4.5,2]).path.every(step=>step.direction==='left'),'both equality branches');
const prose=(source.match(/<Prose[^>]*>.*?<\/Prose>/gs)||[]);const caution=prose.filter(p=>/not prove|does not|not automatically|not a (?:claim|guarantee|proof)|not universally|doesn.t/.test(p));
const receipt={count:assertions.length,assertions,sourceHashes:Object.fromEntries(paths.map(file=>[file,hash(fs.readFileSync(file))])),
  voice:{prose:prose.length,cautionParagraphs:caution.length,ratio:caution.length/prose.length},
  notes:'Source conservation/order/calculations only. No historical programs, fits or writers executed. Author heuristic reading and actual paint are separate.'};
fs.writeFileSync(`${owner}/reading-flow-source-author.json`,JSON.stringify(receipt,null,2));
console.log(JSON.stringify({passed:assertions.length,voice:receipt.voice,receipt:`${owner}/reading-flow-source-author.json`}));

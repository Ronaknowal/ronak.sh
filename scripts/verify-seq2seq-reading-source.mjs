import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
import katex from 'katex';
const folder='docs/teaching/deep-learning-beginner/sequence-to-sequence-encoder-decoder/';
const topic='src/learn/data/topics/sequence-to-sequence-encoder-decoder.jsx';
const sourceFiles=[topic,'src/learn/components/lesson-labs/Seq2SeqDrawings.jsx','src/learn/components/lesson-labs/Seq2SeqFlowLabs.jsx','src/learn/components/lesson-labs/Seq2SeqLabs.jsx','src/learn/components/lesson-labs/Seq2SeqIntuitionFigures.jsx','src/learn/components/lesson-labs/seq2seq-flow.css','src/learn/components/lesson-labs/seq2seq-labs.css','src/learn/components/lesson-labs/seq2seq-intuition.css','src/learn/data/seq2seq-models.js','src/learn/data/seq2seq-measurements.json','public/learn-code/sequence-to-sequence-encoder-decoder/explicit-inflector.py'];
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const body=fs.readFileSync(topic,'utf8'),original=fs.readFileSync('docs/teaching/deep-learning-beginner/original/seq2seq-before-reading-flow/'+topic,'utf8');
const groups=[],trees={};
for(const path of sourceFiles.filter(f=>f.endsWith('.jsx')))trees[path]=parse(fs.readFileSync(path,'utf8'),{sourceType:'module',plugins:['jsx']});
groups.push('All five current JSX sources parse');
assert.equal((body.match(/<H2>/g)||[]).length,12);
assert.equal((body.match(/data-lesson-exercise=/g)||[]).length,(original.match(/data-lesson-exercise=/g)||[]).length);
assert.equal((body.match(/<summary>/g)||[]).length,(original.match(/<summary>/g)||[]).length);
assert.equal((body.match(/data-lesson-exercise=/g)||[]).length,8);
assert.ok(body.includes('lesson-flow'));
groups.push('Twelve section owners and every original practice/hint/solution retained');
let equations=0;
function walk(node){
 if(!node||typeof node!=='object')return;
 if(node.type==='JSXElement'&&['InlineMath','MathBlock'].includes(node.openingElement.name.name)){
  const tex=node.children.map(child=>child.type==='JSXText'?child.value:child.type==='JSXExpressionContainer'&&child.expression.type==='StringLiteral'?child.expression.value:null);
  assert.ok(tex.every(v=>v!==null),'Math must be explicit taught source, not undeclared JSX expression');
  katex.renderToString(tex.join(''),{throwOnError:true});equations++;
 }
 for(const value of Object.values(node))if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);
}
walk(trees[topic]);groups.push(equations+' exact TeX expressions render without errors or undeclared JSX symbols');
for(const needle of ['451','1,353','149','447','37,408','1328','1323','1287','0.434670','0.410888','34.81','0.809014','0.70055696','0.00556958','0.169993','8.881784197001252','1.074011445'])assert.ok(body.includes(needle),needle);
for(const name of ['inflection-seq2seq.py','sequence-mechanics.py','saved-inflection.py','explicit-inflector.py','recurrent-cells.py'])assert.ok(body.includes(name));
assert.ok(!/commitGuess|submitGuess|predictionEntry|until its improved page is published/.test(body));
groups.push('Retained numerical protocol/deep branches and complete native/scratch file routes present');
const drawing=fs.readFileSync(sourceFiles[1],'utf8'),labs=fs.readFileSync(sourceFiles[2],'utf8');
for(const name of ['seq2seq-encoder-anatomy','seq2seq-decoder-anatomy','seq2seq-lookup','seq2seq-joint-credit','seq2seq-grouped-split','seq2seq-prefix-intervention','seq2seq-interface-attention','seq2seq-support-smoothing'])assert.ok(drawing.includes(name));
assert.ok(labs.includes('resourcePromise=null'));
assert.ok(labs.includes('prefixTrace:generatedTrace'));
assert.ok(!/import .*seed-one|calculated-inputs/.test(labs));
groups.push('Actual foundational/advanced drawing owners, shared fixed-resource retry and unchanged-context reuse');
for(const name of ['reading-flow-native.json','reading-flow-example.json','reading-flow-values.json','reading-flow-scientific-dependencies.json']){
 const receipt=JSON.parse(fs.readFileSync(folder+name));assert.equal(receipt.passed,true);
 for(const [file,expected] of Object.entries(receipt.sourceHashes??{}))assert.equal(hash(file),expected,'Changed checked dependency '+file);
}
groups.push('New native composition/example and complementary value receipts bind current dependencies');
const record={passed:true,checkedAt:new Date().toISOString(),groups,equations,sourceHashes:Object.fromEntries(sourceFiles.map(file=>[file,hash(file)])),verifierHash:hash('scripts/verify-seq2seq-reading-source.mjs'),limits:'Author source conservation/TeX/contracts. Independent review, painted readability, controls and parent shared integration are separate.'};
fs.writeFileSync(folder+'reading-flow-source.json',JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({passed:true,groups:groups.length,equations,files:sourceFiles.length}));

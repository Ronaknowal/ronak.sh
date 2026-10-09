// Reading-flow conservation and displayed claims; native/model campaigns are separate.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import parser from '@babel/parser';

const folder='docs/teaching/deep-learning-beginner/convnext-modern-cnn-designs';
const topicPath='src/learn/data/topics/convnext-modern-cnn-designs.jsx';
const sourcePaths=[topicPath,'src/learn/components/lesson-labs/ConvNeXtDrawings.jsx','src/learn/components/lesson-labs/ConvNeXtLabs.jsx','src/learn/components/lesson-labs/convnext-flow.css','public/learn-assets/convnext-modern-cnn-designs/convnext-worked-block.py','scripts/generate-convnext-lesson.mjs'];
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const topic=fs.readFileSync(topicPath,'utf8');
const previous=fs.readFileSync('docs/teaching/deep-learning-beginner/original/convnext-before-reading-flow/'+topicPath,'utf8');
const checks=[];
const checked=(label,fn)=>{fn();checks.push(label);};
const ast=source=>parser.parse(source,{sourceType:'module',plugins:['jsx']});
const walk=(node,visit)=>{if(!node||typeof node!=='object')return;visit(node);for(const value of Object.values(node))if(value&&typeof value==='object')if(Array.isArray(value))value.forEach(child=>walk(child,visit));else walk(value,visit);};
const strings=node=>{const values=[];walk(node,child=>{if(child.type==='StringLiteral'||child.type==='JSXText')values.push(child.value)});return values.join(' ').replace(/\s/g,'');};
const elements=(source,predicate)=>{const result=[];walk(ast(source),node=>{if(node.type==='JSXElement'&&predicate(node))result.push(node)});return result;};
const headings=source=>elements(source,node=>node.openingElement.name.name==='H2').map(strings);
const practices=source=>elements(source,node=>node.openingElement.attributes.some(attr=>attr.type==='JSXAttribute'&&attr.name.name==='data-lesson-exercise')).map(strings);
checked('All topic/lab/drawing JSX parses and decoded strings contain no escaped control characters',()=>{
  for(const path of sourcePaths.filter(path=>path.endsWith('.jsx'))){walk(ast(fs.readFileSync(path,'utf8')),node=>{if(node.type==='StringLiteral')assert(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(node.value),`${path}: invalid decoded string`)})}
});
checked('Every original H2 and all eight complete practice statements/hints/solutions remain, with whitespace repairs only',()=>{
  assert.deepEqual(headings(topic),headings(previous));assert.equal(practices(previous).length,8);assert.deepEqual(practices(topic),practices(previous));
});
checked('Pre-revision numerical model and six-fit data raw hashes remain unchanged',()=>{
  const snapshots=JSON.parse(fs.readFileSync('docs/teaching/deep-learning-beginner/original/convnext-before-reading-flow/sources.json','utf8'));
  for(const path of ['src/learn/data/convnext-models.js','src/learn/data/convnext-measurements.json'])assert.equal(sha(path),snapshots.find(item=>item.path===path).sha256);
});
const measured=JSON.parse(fs.readFileSync('src/learn/data/convnext-measurements.json','utf8'));
checked('Published six final MSEs and probe counts agree with recorded raw predictions; untrained trajectories retained',()=>{
  assert.equal(measured.runs.length,6);assert.equal(measured.training_source_ids.length,280);assert.equal(measured.development_source_ids.length,120);
  assert(topic.includes(measured.baseline_masked_development_mse.toFixed(6)));
  for(const run of measured.runs){assert(topic.includes(run.trace.at(-1).development_masked_mse.toFixed(6).replace(/^0/,'')));assert.deepEqual(run.trace.map(row=>row.step),[0,1,100,300,600]);assert.equal(run.linear_probe.development_correct,run.linear_probe.development_predictions.filter((value,index)=>value===measured.development_labels[index]).length);assert.equal(run.linear_probe.training_correct,280)}
  assert.equal(measured.raw_pixel_linear_probe.development_correct,measured.raw_pixel_linear_probe.development_predictions.filter((value,index)=>value===measured.development_labels[index]).length);
});
const runtime='scratch/dl-library-tools/Scripts/python.exe';
const handArguments=['-B','-c',"import sys,runpy; sys.path.append('scratch/lesson-tools/Lib/site-packages'); runpy.run_path('public/learn-assets/convnext-modern-cnn-designs/convnext-worked-block.py',run_name='__main__')"];
const hand=spawnSync(runtime,handArguments,{encoding:'utf8'});
checked('Actual complete two-channel V1 block agrees with independent Python math.erf arithmetic at 1e-12; printed values agree with prose',()=>{assert.equal(hand.status,0,hand.stderr);for(const value of ['0.984134470441','3.084134420441']){assert(hand.stdout.includes(value));assert(topic.includes(value))}});
const calculations={
  layerNormMeans:[2,102],wholeMean:52,wholeVariance:2501,
  v1Parameters:8*96**2+58*96,v1ChannelWeights:8*96**2,v2Parameters:8*96**2+65*96,v2Extra:7*96,
  expectedRetainedContributions:18*(1-.05),visiblePatches:6,hiddenPatches:10,hiddenPixels:10*4,hiddenPercent:10/16*100,
  grnNorms:[5,12],grnDenominator:8.5+1e-6,grnGammaGradients:[5/(8.5+1e-6)*25,12/(8.5+1e-6)*144],
  targetSampleVariance:2,targetStandardized:[-1/Math.SQRT2,1/Math.SQRT2],
  practice2Parameters:6*64**2+33*64,practice2Macs:196*(25*64+6*64**2),
  fineAttentionPairs:(56**2)**2,coarseAttentionPairs:(14**2)**2,
};
checked('New and retained hand-calculation prose values are independently recomputed',()=>{
  const integers=[calculations.v1Parameters,calculations.v1ChannelWeights,calculations.v2Parameters,calculations.v2Extra,calculations.practice2Parameters,calculations.practice2Macs,calculations.fineAttentionPairs,calculations.coarseAttentionPairs];
  for(const value of integers)assert(topic.includes(value.toLocaleString('en-US')));
  for(const value of [...calculations.grnGammaGradients,calculations.targetStandardized[1]])assert(topic.includes(value.toFixed(6)));
  for(const value of [calculations.expectedRetainedContributions,calculations.hiddenPercent])assert(topic.includes(value.toFixed(1)));
  assert.equal(calculations.v1Parameters,79296);assert.equal(calculations.v2Parameters,79968);assert.equal(calculations.practice2Parameters,26688);assert.equal(calculations.practice2Macs,5130496);assert.equal(calculations.fineAttentionPairs/calculations.coarseAttentionPairs,256);
});
checked('Reconstruction intervention prose agrees with fresh independent native fixtures, including hidden-input invariance',()=>{
  const report=JSON.parse(fs.readFileSync(folder+'/reading-flow-native.json','utf8'));
  const selected=kind=>report.fixtures.find(fixture=>fixture.grn&&fixture.source===251&&fixture.kind===kind);
  const original=selected('original'),hidden=selected('hidden-edit'),visible=selected('visible-edit');
  assert.deepEqual(original.output,hidden.output);
  for(const value of [original.mse,hidden.mse])assert(topic.includes(value.toFixed(6)));
  const maximum=Math.max(...original.output.flat(Infinity).map((value,index)=>Math.abs(value-visible.output.flat(Infinity)[index])));
  assert(topic.includes(maximum.toFixed(6)));
});
checked('Core structures are real drawings; old sentence-box core file is absent; common hierarchy base cannot clip one ratio independently',()=>{
  const drawing=fs.readFileSync(sourcePaths[1],'utf8'),labs=fs.readFileSync(sourcePaths[2],'utf8'),css=fs.readFileSync(sourcePaths[3],'utf8');
  assert(drawing.includes('expanded: 4C'));assert(drawing.includes('width={width}'));assert(drawing.includes('mask={mask}'));assert(drawing.includes('className="cnx-data-wire"'));assert(drawing.includes('result.foldedKernel'));assert(labs.includes('cnx-stage-scale'));assert(css.includes('width:min(100%,12rem)'));assert(!fs.existsSync('src/learn/components/lesson-labs/ConvNeXtFlowFigures.jsx'));
});
const report={passed:true,checks,calculations,handTrace:{command:[runtime,...handArguments],stdout:hand.stdout.trim(),exitCode:hand.status},sourceHashes:Object.fromEntries(sourcePaths.map(path=>[path,sha(path)])),verifierSha256:sha('scripts/verify-convnext-reading-source.mjs'),limits:['JSX/static source and focused numerical checks do not certify rendered layout or browser control behavior. Parent owns current production/browser integration.','Existing native and independent model campaigns are recorded separately and reused rather than rerun here.']};
fs.writeFileSync(folder+'/reading-flow-source-check.json',JSON.stringify(report,null,2)+'\n');
console.log(`Passed ${checks.length} scoped source/conservation/displayed-claim checks.`);

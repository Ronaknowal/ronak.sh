import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';

const root = 'docs/teaching/deep-learning-beginner/rwkv-linear-attention-models';
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const baseline = JSON.parse(fs.readFileSync(`${root}/reading-flow-baseline.json`));
const science = baseline.scientificComparisons.map(row => row.file);
for (const file of science) assert.equal(sha(file), baseline.sourceHashes[file], `${file}: conserved scientific bytes changed`);
const owners = ['src/learn/data/topics/rwkv-linear-attention-models.jsx', ...['RwkvFlowDrawings','RwkvFlowLabs','RwkvTrajectoryFlow','RwkvFlowPrograms'].map(name => `src/learn/components/lesson-labs/${name}.jsx`), 'src/learn/components/lesson-labs/rwkv-flow.css', 'src/learn/components/lesson-labs/RwkvMemoryLabs.jsx'];
for (const file of owners) {
  const source = fs.readFileSync(file,'utf8');
  assert(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(source), `${file}: C0 control character`);
  if (file.endsWith('.jsx')) parse(source,{sourceType:'module',plugins:['jsx']});
}
const lesson=fs.readFileSync(owners[0],'utf8');
assert.equal((lesson.match(/data-lesson-exercise=/g)||[]).length,10);
assert(lesson.includes('lesson-flow rwkv-reading-flow'));
assert(!lesson.includes('RwkvMemoryLabs.jsx'));
for (const match of lesson.matchAll(/<RwkvProgram file="([^"]+)"/g)) assert(fs.existsSync(`public/learn-code/rwkv-linear-attention-models/${match[1]}`));
const newPrograms=['linear-memory-operators.py','rwkv-weighted-state.py','delta-memory-operators.py','goose-transformers-state.py'].map(file=>`public/learn-code/rwkv-linear-attention-models/${file}`);
const files=[...owners,...science,...newPrograms,'public/learn-assets/rwkv-linear-attention-models/trajectory-reading-flow-models.json',`${root}/reading-flow-revision.md`,'docs/teaching/deep-learning-beginner/original/rwkv-before-reading-flow/accepted-reading-flow-design.md','scripts/verify-rwkv-flow-native.py','scripts/verify-rwkv-flow-models.mjs','scripts/verify-rwkv-flow-browser.cjs','scripts/check-rwkv-flow-source.mjs'];
const sourceHashes=Object.fromEntries(files.map(file=>[file,sha(file)]));
fs.writeFileSync(`${root}/reading-flow-scientific-dependencies.json`,JSON.stringify({passed:true,purpose:'Exact raw comparison with all fourteen original scientific identities; no date-based recertification or historical receipt overwrite.',files:science.map(file=>({file,currentRaw:sha(file),originalRaw:baseline.sourceHashes[file],exactRawMatch:true}))},null,2)+'\n');
fs.writeFileSync(`${root}/reading-flow-sources.json`,JSON.stringify({topic:'rwkv-linear-attention-models',capturedAt:new Date().toISOString(),status:'Frozen whole-source candidate for independent final review; current painted checks and parent integration separately pending',sourceHashes,checks:{originalScience:science.length,retainedPractices:10,jsxOwnersParsed:owners.filter(file=>file.endsWith('.jsx')).length,C0Scan:true,publicProgrammeLinks:true},limits:['No official full checkpoint was provided; bundled-model route is source-only.','No refit; original four fits and reports unchanged.','Source checks are not independent review or browser acceptance.']},null,2)+'\n');
console.log(`PASS current source contracts; ${science.length} exact conserved scientific owners; ten practices`);

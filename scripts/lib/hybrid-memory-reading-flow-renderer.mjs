// Authoring-only renderer. It never trains, regenerates scientific arrays or writes implicitly.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './prepared-lesson-renderer.mjs';

const operation = process.argv[2];
if (!['--preview', '--check', '--write-reading-flow'].includes(operation)) {
  throw new Error('Select --preview, --check or --write-reading-flow explicitly.');
}
const id = 'hybrid-ssm-transformer-architectures-jamba';
const draft = `docs/teaching/drafts/${id}`;
const record = `docs/teaching/deep-learning-beginner/${id}`;
const target = `src/learn/data/topics/${id}.jsx`;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const science = JSON.parse(fs.readFileSync(`${record}/reading-flow-scientific-dependencies.json`));
for (const [path, identity] of Object.entries(science.sourceHashes)) {
  if (hash(fs.readFileSync(path)) !== identity.sha256) throw new Error(`Protected scientific source changed: ${path}`);
}

const views = {
  records: '<HybridRecordEditFlow />',
  summary: '<HybridSummaryFlow />',
  addressed: '<HybridAddressFlow />',
  collision: '<HybridCollisionDrawing />',
  order: '<HybridRecordOrderFlow />',
  'memory-case': '<HybridMemoryCaseFlow />',
  depth: '<HybridDepthDrawing />',
  residual: '<HybridResidualDrawing />',
  'original-cycle': '<HybridOriginalCycleDrawing />',
  'selective-objects': '<HybridTinyStateFlow view="objects" />',
  'selective-coefficients': '<HybridTinyStateFlow view="coefficients" />',
  'selective-state': '<HybridTinyStateFlow view="state" />',
  'selective-live': '<HybridTinyStateFlow view="output" />',
  discretization: '<HybridDiscretizationFlow />',
  'affine-scan': '<HybridAffineScanDrawing />',
  'attention-anatomy': '<HybridAttentionAnatomyDrawing />',
  'grouped-heads': '<HybridGroupedHeadsDrawing />',
  'cache-anatomy': '<HybridCacheAnatomyDrawing />',
  'budget-request': '<HybridBudgetFlow view="request" />',
  'budget-state': '<HybridBudgetFlow view="state" />',
  'budget-heads': '<HybridBudgetFlow view="heads" />',
  'budget-history': '<HybridBudgetFlow view="history" />',
  window: '<HybridWindowFlow />',
  'budget-case': '<HybridBudgetCaseFlow />',
  'causal-pairs': '<HybridCausalPairsDrawing />',
  swiglu: '<HybridSwiGluDrawing />',
  'router-scores': '<HybridRouterScoreFlow />',
  'router-values': '<HybridRouterValueFlow />',
  'router-convention': '<HybridRouterConventionFlow />',
  'expert-bank': '<HybridExpertBankDrawing />',
  precision: '<HybridPrecisionDrawing />',
  'study-selection': '<HybridStudySelectionFlow />',
  'study-edit': '<HybridStrokeEditFlow />',
  embedding: '<HybridEmbeddingFlow />',
  'trained-stack': '<HybridStudyArchitectureDrawing />',
  'layer-trace': '<HybridLayerTraceFlow />',
  'state-cell': '<HybridStateCellFlow />',
  'attention-cell': '<HybridAttentionCellFlow />',
  classifier: '<HybridClassifierFlow />',
  histories: '<HybridTrainingHistoriesDrawing />',
  'prefix-cache': '<HybridPrefixCacheFlow />',
  'boundary-continuation': '<HybridContinuationFlow view="boundary" />',
  'separate-cache-faults': '<HybridContinuationFlow view="separate" />',
  'position-fault': '<HybridContinuationFlow view="position" />',
  'request-fork': '<HybridRequestForkDrawing />',
  'donor-fault': '<HybridContinuationFlow view="identity" />',
  'study-case': '<HybridStudyCaseFlow />',
  'alternative-routes': '<HybridAlternativeRoutesDrawing />',
  'shared-weight-counterexample': '<HybridSharedWeightsDrawing />',
  'diagonal-order': '<HybridDiagonalOrderDrawing />',
  'application-interventions': '<HybridApplicationInterventionsDrawing />',
};
const programs = ['hybrid_mechanisms.py', 'stroke_models.py', 'inspect_stroke.py', 'hybrid_cache_tools.py', 'deployment_example.py'];
const codeByFile = Object.fromEntries(programs.map(file => [file, fs.readFileSync(`${draft}/${file}`, 'utf8').replaceAll('\r\n', '\n').trimEnd()]));
const memoryExcerpt = 'import math\nimport numpy as np\n\ndef memory_read' + codeByFile['hybrid_mechanisms.py'].split('def memory_read')[1].split('\ndef cache_bytes')[0].trimEnd();
const replacements = [], seen = new Set();
let manuscript = fs.readFileSync(`${draft}/lesson.md`, 'utf8');
manuscript = manuscript.replace(/\[Visual H(\d+) ([^\]]+)\]/g, (_, number, key) => {
  if (!views[key] || seen.has(key)) throw new Error(`Unknown/duplicate drawing: ${key}`);
  seen.add(key);
  const anchor = `HYBRID_DRAWING_${number}_${key}_END`;
  replacements.push([anchor, views[key]]);
  return anchor;
});
if (seen.size !== Object.keys(views).length) throw new Error('Missing planned drawing.');
replacements.push(['[Download index hybrid-files]', '<HybridFlowDownloads />']);
const rendered = renderPreparedLesson(manuscript, {
  assetBase: `/learn-assets/${id}/`, replacements,
  opening: [['**What you will understand.', 'summary'], ['**Before starting.', 'prerequisites'], ['**Read and investigate.', 'exploration']],
  endings: [
    { level: 'H2', title: '13. Practice, independent reproduction and the next question', kind: 'practice' },
    { level: 'H3', title: 'Foundations: two complementary explanations', kind: 'further-learning' },
    { level: 'H3', title: 'References and other ways to learn', kind: 'references' },
    { level: 'H3', title: 'Build and reproduce', kind: 'resources' },
    { level: 'H3', title: 'What to learn next', kind: 'next' },
  ],
});
const usedPrograms = new Set();
let memoryExcerptCount = 0;
const jsx = rendered.jsx.replace(/<CodeBlock language=\{"python"\}>\{("[\s\S]*?")}<\/CodeBlock>/g, (block, quoted) => {
  const code = JSON.parse(quoted);
  const found = programs.filter(file => codeByFile[file] === code.trimEnd());
  if (!found.length && code.trimEnd() === memoryExcerpt) { memoryExcerptCount++; return block; }
  if (found.length !== 1 || usedPrograms.has(found[0])) throw new Error('A full program fence differs from its exact canonical file or repeats.');
  usedPrograms.add(found[0]);
  return `<HybridFlowProgram file="${found[0]}" />`;
});
if (rendered.sections.length !== 13 || usedPrograms.size !== 5 || memoryExcerptCount !== 1 || (manuscript.match(/^### \d+\./gm) || []).length !== 11) {
  throw new Error('Whole teaching, solved practice or complete program contract is missing.');
}
const required = new Set([...Object.values(views).join('\n').matchAll(/<(Hybrid\w+)/g)].map(match => match[1]));
['HybridMemoryFlowProvider', 'HybridMemoryStudyProvider', 'HybridFlowProgram', 'HybridFlowDownloads'].forEach(name => required.add(name));
const imports = ['Figures', 'Labs', 'Study'].map(suffix => {
  const source = fs.readFileSync(`src/learn/components/lesson-labs/HybridMemoryFlow${suffix}.jsx`, 'utf8');
  parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const names = [...source.matchAll(/export function (\w+)/g)].map(match => match[1]).filter(name => required.has(name));
  names.forEach(name => required.delete(name));
  return `import { ${names.join(', ')} } from '../../components/lesson-labs/HybridMemoryFlow${suffix}.jsx';`;
}).join('\n');
if (required.size) throw new Error(`Unknown view exports: ${[...required]}`);
const body = `// Generated from the complete Hybrid Memory manuscript by its explicit guarded renderer.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
${imports}
import '../../components/lesson-labs/neural-lesson-neutral.css';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/hybrid-memory-flow.css';
export default {
  title: 'Hybrid SSM–Transformer Architectures: Jamba and Complementary Memory',
  readTime: '~90 min read + investigations and practice', hasIntegratedGuide: true,
  content: () => <HybridMemoryFlowProvider><HybridMemoryStudyProvider><div className="neural-lesson neural-lesson-neutral lesson-flow hybrid-memory-flow">
${jsx}
  </div></HybridMemoryStudyProvider></HybridMemoryFlowProvider>,
};
`;
parse(body, { sourceType: 'module', plugins: ['jsx'] });
if (operation === '--preview') {
  fs.writeFileSync('scratch/reading-flow/hybrid-authored-preview.jsx', body
    .replaceAll("from '../../components/", "from '../../src/learn/components/")
    .replaceAll("import '../../components/", "import '../../src/learn/components/"));
} else if (operation === '--check') {
  if (fs.readFileSync(target, 'utf8') !== body) throw new Error('Published lesson differs from the whole manuscript.');
  if (!fs.readFileSync(`${draft}/hybrid_cache_tools.py`).equals(fs.readFileSync(`public/learn-assets/${id}/hybrid_cache_tools.py`))) throw new Error('Request-tools download differs.');
} else {
  const authorizationPath = `${record}/reading-flow-publication-authorization.json`;
  if (!fs.existsSync(authorizationPath)) throw new Error('Whole-source independent acceptance must be recorded before publication.');
  const authorization = JSON.parse(fs.readFileSync(authorizationPath));
  if (authorization.verdict !== 'accepted' || authorization.generatedSha256 !== hash(Buffer.from(body)) ||
      !authorization.independentReview?.path ||
      hash(fs.readFileSync(authorization.independentReview.path)) !== authorization.independentReview.sha256) {
    throw new Error('The current rendered lesson lacks exact independent publication acceptance.');
  }
  for (const [path, sha256] of Object.entries(authorization.reviewedSourceHashes ?? {})) {
    if (hash(fs.readFileSync(path)) !== sha256) throw new Error(`Accepted authored source changed: ${path}`);
  }
  if (Object.keys(authorization.reviewedSourceHashes ?? {}).length < 7) throw new Error('The whole authored source binding is incomplete.');
  const bindingPath = `${record}/reading-flow-render-binding.json`;
  const original = JSON.parse(fs.readFileSync(`${record}/../original/jamba-before-reading-flow/sources.json`));
  const expected = fs.existsSync(bindingPath) ? JSON.parse(fs.readFileSync(bindingPath)).generatedSha256 : original.sources[target].sha256;
  if (hash(fs.readFileSync(target)) !== expected) throw new Error('Refusing to overwrite an unrecognized lesson edit.');
  const supplement = `public/learn-assets/${id}/hybrid_cache_tools.py`;
  const bytes = fs.readFileSync(`${draft}/hybrid_cache_tools.py`);
  if (fs.existsSync(supplement) && !fs.readFileSync(supplement).equals(bytes)) throw new Error('Unrecognized request-tools download edit.');
  fs.writeFileSync(supplement, bytes);
  fs.writeFileSync(target + '.tmp', body);
  fs.renameSync(target + '.tmp', target);
  fs.writeFileSync(bindingPath, JSON.stringify({ purpose: 'Mutable render identity only; not phase completion or independent review',
    generatedSha256: hash(Buffer.from(body)), manuscriptSha256: hash(fs.readFileSync(`${draft}/lesson.md`)),
    sections: rendered.sections.length, drawings: seen.size, programs: [...usedPrograms] }, null, 2) + '\n');
}
console.log(JSON.stringify({ operation, sections: rendered.sections.length, drawings: seen.size, programs: usedPrograms.size, protectedScience: Object.keys(science.sourceHashes).length }));

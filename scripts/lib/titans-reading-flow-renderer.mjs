// Pure lesson rendering and explicit topic-owned preview. No historical scientific writer is imported.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './prepared-lesson-renderer.mjs';
const mode = process.argv[2];
if (!['--preview', '--verify-preview'].includes(mode)) throw new Error('Choose --preview or --verify-preview. Publication is owned by the root integration task.');
const id = 'titans-multi-memory-architecture', draft = `docs/teaching/drafts/${id}`, record = `docs/teaching/deep-learning-beginner/${id}`;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const retained = JSON.parse(fs.readFileSync(`${record}/retained-source-inventory.json`));
for (const source of retained.baselineFiles) {
  if (hash(fs.readFileSync(source.path)) !== source.sha256 || hash(fs.readFileSync(source.rollback)) !== source.sha256) throw new Error(`Protected source/copy changed: ${source.path}`);
}
const names = {
  places: '<PlacesDrawing />', 'association-first': '<AssociativeFlow view="first" />', 'association-second': '<AssociativeFlow view="second" />', 'association-query': '<AssociativeFlow view="query" />', 'association-keys': '<AssociativeFlow view="keys" />', 'association-targets': '<AssociativeFlow view="targets" />',
  'zero-key': '<ZeroKeyDrawing />', sensitivity: '<SensitivityDrawing />', 'signed-update': '<SignedUpdateDrawing />', 'association-update': '<AssociativeFlow view="update" />', 'association-history': '<AssociativeFlow view="history" />', reset: '<ResetDrawing />', 'fixed-factors': '<FixedFactorsDrawing />', stability: '<StabilityFlow />',
  nonlinear: '<NonlinearFlow />', xor: '<XorDrawing />', projection: '<ProjectionDrawing />', junctions: '<JunctionsDrawing />', causal: '<CausalDrawing />', 'gated-token': '<GatedFlow view="token" />', 'gated-flags': '<GatedFlow view="flags" />', 'gated-extent': '<GatedFlow view="extent" />', 'gated-continuity': '<GatedFlow view="continuity" />',
  'outer-scalar': '<OuterFlow />', 'outer-nonlinear': '<NonlinearOuterFlow />', 'rental-seed': '<RentalFlow view="seed" />', 'rental-network': '<RentalFlow view="network" />', 'rental-timeline': '<RentalTimelineDrawing />', 'rental-arrival': '<RentalFlow view="arrival" />', 'rental-inspect': '<RentalFlow view="inspect" />', 'rental-metrics': '<RentalMetricsDrawing />', 'score-timing': '<ScoreTimingDrawing />',
  'chunk-core': '<ChunkFlow view="core" />', 'chunk-inputs': '<ChunkFlow view="inputs" />', 'chunk-schedule': '<ChunkFlow view="schedule" />', scan: '<ScanDrawing />', budget: '<BudgetDrawing />', objective: '<ObjectiveFlow />', 'window-objective': '<WindowObjectiveDrawing />', frequencies: '<FrequencyDrawing />', distillation: '<DistillationDrawing />', vision: '<VisionDrawing />',
};
const replacements = [], seen = new Set();
const manuscriptBytes = fs.readFileSync(`${draft}/reading-flow-lesson.md`);
const manuscript = manuscriptBytes.toString().replace(/\[Titans drawing ([^\]]+)\]/g, (_, name) => {
  if (!names[name] || seen.has(name)) throw new Error(`Unknown or duplicate visual ${name}`);
  seen.add(name); const marker = `TITANS_DRAWING_${name}_END`; replacements.push([marker, names[name]]); return marker;
});
if (seen.size !== Object.keys(names).length) throw new Error('The whole drawing map is incomplete.');
replacements.push(['[Titans downloads]', '<TitansFlowDownloads />']);
const rendered = renderPreparedLesson(manuscript, { assetBase: `/learn-assets/${id}/`, replacements,
  opening: [['**Explore as you read.', 'exploration'], ['**What you will understand.', 'summary'], ['**Before starting.', 'prerequisites']],
  endings: [{ level: 'H2', title: '12. Practice: carry the idea to a changed case', kind: 'practice' }, { level: 'H2', title: 'Ready to move on?', kind: 'next' }, { level: 'H2', title: 'References and another way to learn it', kind: 'references' }],
});
const programs = ['memory_write_walkthrough.py', 'titans_learning_routes.py', 'neural_memory.py', 'memory_mechanisms.py', 'rental_memory_study.py'];
const codes = Object.fromEntries(programs.map(file => [file, fs.readFileSync(`${draft}/${file}`, 'utf8').replaceAll('\r\n', '\n').trimEnd()])), used = new Set();
let jsx = rendered.jsx.replace(/<CodeBlock language=\{\"python\"\}>\{(\"(?:[^\"\\]|\\.)*\")\}<\/CodeBlock>/g, (match, literal) => {
  const code = JSON.parse(literal), file = programs.find(file => codes[file] === code);
  if (!file) return match;
  if (used.has(file)) throw new Error(`Duplicate instructional file ${file}`);
  used.add(file); return `<TitansFlowProgram file="${file}" />`;
});
if (used.size !== 5 || (manuscript.match(/^### \d+\./gm) || []).length !== 10) throw new Error('Complete programs or solved practice missing.');
const required = new Set([...Object.values(names).join('\n').matchAll(/<(\w+)/g)].map(match => match[1]));
['TitansFlowProvider', 'TitansStudyProvider', 'TitansFlowDownloads', 'TitansFlowProgram'].forEach(name => required.add(name));
const componentPaths = ['TitansDrawings.jsx', 'TitansFlowLabs.jsx', 'TitansFlowStudy.jsx'].map(file => `src/learn/components/lesson-labs/${file}`);
const imports = componentPaths.map(path => {
  const source = fs.readFileSync(path, 'utf8'); parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const exports = [...source.matchAll(/export function (\w+)/g)].map(match => match[1]).filter(name => required.has(name)); exports.forEach(name => required.delete(name));
  return `import { ${exports.join(', ')} } from '../../components/lesson-labs/${path.split('/').at(-1)}';`;
}).join('\n');
if (required.size) throw new Error(`Unresolved drawing exports: ${[...required]}`);
const body = `// Review preview generated only from the complete current Titans manuscript.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
${imports}
import '../../components/lesson-labs/neural-lesson-neutral.css';
import '../../components/lesson-labs/lesson-flow.css';
export default {
  title: 'Titans: a memory that learns while a sequence arrives',
  readTime: '~90 min read + investigations and practice', hasIntegratedGuide: true,
  content: () => <TitansFlowProvider><TitansStudyProvider><div className="neural-lesson neural-lesson-neutral">
${jsx}
  </div></TitansStudyProvider></TitansFlowProvider>,
};
`;
parse(body, { sourceType: 'module', plugins: ['jsx'] });
const preview = body.replaceAll("from '../../components/", "from '../../src/learn/components/").replaceAll("import '../../components/", "import '../../src/learn/components/");
const path = 'scratch/reading-flow/titans-authored-preview.jsx';
if (mode === '--preview') { fs.mkdirSync('scratch/reading-flow', { recursive: true }); fs.writeFileSync(path, preview); }
else if (fs.readFileSync(path, 'utf8') !== preview) throw new Error('Preview differs from complete manuscript.');
console.log(JSON.stringify({ mode, manuscriptSha256: hash(manuscriptBytes), generatedSha256: hash(Buffer.from(body)), previewSha256: hash(Buffer.from(preview)), drawings: seen.size, programs: used.size, sections: rendered.sections.length, protectedSources: retained.baselineFiles.length }));

import fs from 'node:fs';
import crypto from 'node:crypto';
import { parse } from '@babel/parser';
import { renderPreparedLesson } from './prepared-lesson-renderer.mjs';

const operation = process.argv[2];
const id = 'neural-ode-continuous-depth-models';
const draft = `docs/teaching/drafts/${id}`;
const record = `docs/teaching/deep-learning-beginner/${id}`;
const target = `src/learn/data/topics/${id}.jsx`;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const science = JSON.parse(fs.readFileSync(`${record}/reading-flow-scientific-dependencies.json`));
for (const [file, identity] of Object.entries(science.sourceHashes)) {
  if (hash(fs.readFileSync(file)) !== identity.sha256) throw new Error(`Protected scientific source changed: ${file}`);
}
const views = {
  'decay-step': '<OdeDecayStepDrawing />',
  'tiny-field': '<OdeTinyFieldDrawing />',
  'field-solver-readout': '<OdeFieldSolverReadoutDrawing />',
  'rotation-field': '<OdeRotationFieldDrawing />',
  'rotation-euler': '<OdeRotationEulerDrawing />',
  'rk-stages': '<OdeRkStagesDrawing />',
  'fixed-matrix': '<OdeFixedMatrixLab />',
  'fixed-initial': '<OdeFixedInitialLab />',
  'fixed-resolution': '<OdeFixedResolutionLab />',
  'fixed-work': '<OdeFixedWorkLab />',
  'fixed-stage': '<OdeFixedStageLab />',
  'adaptive-estimate': '<OdeAdaptiveEstimateDrawing />',
  'adaptive-scale': '<OdeAdaptiveScaleDrawing />',
  'adaptive-attempts': '<OdeAdaptiveAttemptsDrawing />',
  'adaptive-rates': '<OdeAdaptiveRatesLab />',
  'adaptive-initial': '<OdeAdaptiveInitialLab />',
  'adaptive-tolerances': '<OdeAdaptiveTolerancesLab />',
  'adaptive-inspect': '<OdeAdaptiveInspectLab />',
  'stiffness': '<OdeStiffnessDrawing />',
  'discrete-reverse': '<OdeDiscreteReverseDrawing />',
  'continuous-reverse': '<OdeContinuousReverseDrawing />',
  'observation-adjoint': '<OdeObservationAdjointDrawing />',
  'gradient-comparison': '<OdeGradientComparisonDrawing />',
  'gradient-field': '<OdeGradientFieldLab />',
  'gradient-loss': '<OdeGradientLossLab />',
  'gradient-resolution': '<OdeGradientResolutionLab />',
  'reverse-conditioning': '<OdeReverseConditioningDrawing />',
  'nonautonomous-sensitivity': '<OdeClockSensitivityDrawing />',
  'program-sensitivities': '<OdeVisibleProgram file="ode_sensitivities.py" />',
  'solver-api-clocks': '<OdeSolverClocksDrawing />',
  'ordering': '<OdeOrderingDrawing />',
  'lift': '<OdeLiftDrawing />',
  'lift-points': '<OdeLiftPointsLab />',
  'lift-readout': '<OdeLiftReadoutLab />',
  'order-numerical': '<OdeOrderNumericalDrawing />',
  'parameterizations': '<OdeParameterizationsDrawing />',
  'study-histories': '<OdeHistoryDrawing />',
  'worked-study': '<OdeWorkedStudyDrawing />',
  'study-model': '<OdeStudyModelLab />',
  'study-feature': '<OdeStudyFeatureLab />',
  'study-solver': '<OdeStudySolverLab />',
  'study-trace': '<OdeStudyTraceLab />',
  'study-projection': '<OdeStudyProjectionLab />',
  'study-field': '<OdeStudyFieldLab />',
  'study-stage': '<OdeStudyStageLab />',
  'study-readout': '<OdeStudyReadoutLab />',
  'observations': '<OdeObservationDrawing />',
  'observation-events': '<OdeObservationEventsLab />',
  'observation-propagation': '<OdeObservationPropagationLab />',
  'observation-assimilation': '<OdeObservationAssimilationLab />',
  'latent-inference': '<OdeLatentDrawing />',
  'event-rate': '<OdeEventRateDrawing />',
  'density-patch': '<OdeDensityPatchDrawing />',
  'density-accumulator': '<OdeDensityAccumulatorDrawing />',
  'trace-probe': '<OdeTraceProbeDrawing />',
  'regularizer-accumulators': '<OdeRegularizerDrawing />',
  'conditional-paths': '<OdeConditionalPathsDrawing />',
  'conditional-mean': '<OdeConditionalPathsDrawing mean />',
  'known-correction': '<OdeKnownCorrectionDrawing />',
  'hamiltonian': '<OdeHamiltonianDrawing />',
  'solution-residual': '<OdeSolutionResidualDrawing />',
  'event-reset': '<OdeEventResetDrawing />',
  'controlled-stochastic': '<OdeControlledStochasticDrawing />',
  'reversible-step': '<OdeReversibleStepDrawing />',
  'program-calculations': '<OdeVisibleProgram file="ode_calculations.py" />',
};
const seen = new Set();
const replacements = [];
let manuscript = fs.readFileSync(`${draft}/lesson.md`, 'utf8').replace(/^~~~/gm, '```');
manuscript = manuscript.replace(/\[Flow ODE — ([^\]]+)\]/g, (_, key) => {
  if (!views[key] || seen.has(key)) throw new Error(`Unknown or duplicate flow anchor: ${key}`);
  seen.add(key);
  const marker = `ODE_VIEW_${key}_END`;
  replacements.push([marker, views[key]]);
  return marker;
});
if (seen.size !== Object.keys(views).length) throw new Error('A planned drawing or code view is absent.');
const { jsx, sections } = renderPreparedLesson(manuscript, {
  assetBase: `/learn-assets/${id}/`, replacements,
  opening: [['**Explore as you read.', 'exploration'], ['**First pass.', 'route']],
  endings: [{ level: 'H2', title: '12. Practice: transfer the mechanism', kind: 'practice' },
    { level: 'H3', title: 'What to learn next', kind: 'next' },
    { level: 'H3', title: 'References and other ways to learn', kind: 'references' },
    { level: 'H3', title: 'Build and reproduce', kind: 'resources' }],
});
let programs = 0;
const rendered = jsx.replace(/<CodeBlock language=\{"python"\}>\{("[\s\S]*?")}<\/CodeBlock>/g, (whole, quoted) => {
  const code = JSON.parse(quoted);
  if (code.includes('from torchdiffeq import')) { programs++; return '<OdeVisibleProgram file="solver_library_bridge.py" />'; }
  if (code.includes('class VectorField')) { programs++; return '<OdeVisibleProgram file="neural_ode_study.py" />'; }
  return whole;
});
if (sections.length !== 13 || programs !== 2 || !manuscript.includes('### 10. Implement a clock-correct sensitivity')) {
  throw new Error('Full sections, visible programs or preserved/extended practice contract changed.');
}
const ownerNames = suffix => fs.readFileSync(`src/learn/components/lesson-labs/NeuralOdeFlow${suffix}.jsx`, 'utf8')
  .matchAll(/export (?:function|const) (\w+)/g);
const imports = ['Figures', 'Labs', 'Study'].map(suffix => `import { ${[...ownerNames(suffix)].map(match => match[1]).join(', ')} } from '../../components/lesson-labs/NeuralOdeFlow${suffix}.jsx';`).join('\n');
const body = `// Generated from the complete Neural ODE manuscript; guarded authoring renderer owns this source.
import { Prose, H2, H3, CodeBlock } from '../../components/content';
import { Math as InlineMath, MathBlock } from '../../components/content/Math.jsx';
import { NeuralTable } from '../../components/lesson-labs/NeuralLessonElements.jsx';
import { LessonIntro } from '../../components/lesson-labs/LessonElements.jsx';
${imports}
import '../../components/lesson-labs/neural-lesson-neutral.css';
import '../../components/lesson-labs/lesson-flow.css';
import '../../components/lesson-labs/neural-ode-flow.css';
export default { title: 'Neural ODEs and Continuous-Depth Models', readTime: '~90 min read + investigations and practice', hasIntegratedGuide: true,
  content: () => <OdeFlowContexts><OdeStudyContext><div className="neural-lesson neural-lesson-neutral lesson-flow neural-ode-flow">
    <LessonIntro prerequisites="Weighted sums, derivatives and backpropagation; their exact prerequisite lessons are linked below, and every solver operation is introduced here.">Learn a local rule, calculate its trajectory, differentiate the executed program and test the same rule on measured data.</LessonIntro>
${rendered}
  </div></OdeStudyContext></OdeFlowContexts> };
`;
parse(body, { sourceType: 'module', plugins: ['jsx'] });
for (const suffix of ['Figures', 'Labs', 'Study']) parse(fs.readFileSync(`src/learn/components/lesson-labs/NeuralOdeFlow${suffix}.jsx`, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
if (operation === '--preview') {
  fs.writeFileSync('scratch/reading-flow/neural-ode-authored-preview.jsx',
    body.replaceAll("from '../../components/", "from '../../src/learn/components/")
      .replaceAll("import '../../components/", "import '../../src/learn/components/"));
} else if (operation === '--check') {
  if (fs.readFileSync(target, 'utf8') !== body) throw new Error('Published module differs from the complete authored manuscript.');
  if (!fs.readFileSync(`${draft}/ode_sensitivities.py`).equals(fs.readFileSync(`public/learn-assets/${id}/ode_sensitivities.py`))) throw new Error('Supplement download differs.');
} else if (operation === '--write-reading-flow') {
  const bindingPath = `${record}/reading-flow-render-binding.json`;
  const baseline = JSON.parse(fs.readFileSync(`${record}/../original/ode-before-reading-flow/sources.json`));
  const expected = fs.existsSync(bindingPath) ? JSON.parse(fs.readFileSync(bindingPath)).generatedSha256 : baseline.sources[target].sha256;
  if (hash(fs.readFileSync(target)) !== expected) throw new Error('Refusing to replace an unrecognized topic edit.');
  const supplement = `public/learn-assets/${id}/ode_sensitivities.py`;
  const bytes = fs.readFileSync(`${draft}/ode_sensitivities.py`);
  if (fs.existsSync(supplement) && !fs.readFileSync(supplement).equals(bytes)) throw new Error('Unrecognized supplement edit.');
  fs.writeFileSync(supplement, bytes);
  fs.writeFileSync(target + '.tmp', body);
  fs.renameSync(target + '.tmp', target);
  fs.writeFileSync(bindingPath, JSON.stringify({ purpose: 'Mutable pure-render binding; not independent acceptance or phase completion',
    generatedSha256: hash(Buffer.from(body)), manuscriptSha256: hash(fs.readFileSync(`${draft}/lesson.md`)),
    sections: sections.length, anchors: seen.size, programs: 4 }, null, 2) + '\n');
} else throw new Error('Use --check, --preview or --write-reading-flow.');
console.log(JSON.stringify({ operation, sections: sections.length, anchors: seen.size, protectedScientificFiles: Object.keys(science.sourceHashes).length, visiblePrograms: 4 }));

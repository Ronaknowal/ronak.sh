// Bounded SAME-reviewer correction closure. No build, Python/main, fitting,
// scientific campaign, browser automation or mutation outside this review owner.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { transformSync } from 'esbuild';
import { parse } from '@babel/parser';

const review = path.dirname(fileURLToPath(import.meta.url));
const owner = path.resolve(review, '..');
const app = path.resolve(owner, '../../../../..');
const correction = path.join(owner, 'source-contract-correction/independent-review-correction');
const hash = raw => crypto.createHash('sha256').update(raw).digest('hex');
const read = file => fs.readFileSync(file, 'utf8');
const json = file => JSON.parse(read(file));
const relative = file => path.relative(app, file).replaceAll('\\', '/');
const inputs = new Map(), conditions = [], served = [], selected = [];
function binding(file) {
  const raw = fs.readFileSync(file);
  const value = { path: relative(file), bytes: raw.length, sha256: hash(raw) };
  inputs.set(value.path, value); return value;
}
function check(name, condition) { assert.ok(condition, name); conditions.push(name); }
function bound(row, label = row.path) {
  const actual = binding(path.resolve(app, row.path));
  check(`Exact source ${label}`, actual.bytes === row.bytes && actual.sha256 === row.sha256);
}
const freezePath = path.join(correction, 'author-ready-built-source.json');
const freeze = json(freezePath);
check('Current built handoff e12f3863', binding(freezePath).sha256.startsWith('e12f3863'));
for (const row of freeze.currentSourceBindings) bound(row);
for (const row of freeze.acceptedContentReferences) bound(row);
for (const row of freeze.completeDelivery) bound(row.source);
for (const row of [...freeze.independentReview, freeze.priorFrozenAuthorPacket, freeze.authorReview,
  freeze.contractAmendments, freeze.delta, freeze.forwardPatch, freeze.inversePatch,
  freeze.focusedCheck, freeze.actualCheckCommand, freeze.sourceOnlyFreeze,
  freeze.successorBuild, freeze.actualHttp, freeze.previewAndNativeAvailability]) bound(row);

const delta = json(path.resolve(app, freeze.delta.path));
for (const change of delta.changes) {
  const actual = fs.readFileSync(path.join(owner, change.path));
  bound(change.successor);
  if (change.operation === 'create-known-new-owner') {
    check(`Known new owner exact ${change.path}`, actual.equals(Buffer.from(change.createdBase64, 'base64')));
    continue;
  }
  const beforePath = path.join(correction, change.predecessor.predecessor);
  const before = fs.readFileSync(beforePath);
  const old = binding(beforePath);
  check(`Predecessor exact ${change.path}`, old.bytes === change.predecessor.bytes && old.sha256 === change.predecessor.sha256);
  const removed = Buffer.from(change.removedBase64, 'base64'), inserted = Buffer.from(change.insertedBase64, 'base64');
  check(`Byte window exact ${change.path}`, removed.length === change.removedBytes && inserted.length === change.insertedBytes && before.subarray(change.start, change.start + removed.length).equals(removed));
  check(`Forward exact ${change.path}`, Buffer.concat([before.subarray(0, change.start), inserted, before.subarray(change.start + removed.length)]).equals(actual));
  check(`Inverse exact ${change.path}`, Buffer.concat([actual.subarray(0, change.start), removed, actual.subarray(change.start + inserted.length)]).equals(before));
}
const prior = json(path.resolve(app, freeze.priorFrozenAuthorPacket.path));
const changed = new Set(delta.changes.map(row => relative(path.join(owner, row.path))));
for (const row of prior.currentSourceBindings) if (!changed.has(row.path)) bound(row, `unchanged predecessor owner ${row.path}`);
check('Actual accepted manuscript and setup conserved', freeze.acceptedContentReferences.every(row => prior.acceptedContentReferences.some(old => old.path === row.path && old.sha256 === row.sha256 && old.bytes === row.bytes)));
check('All 35 delivery descriptors conserved', JSON.stringify(freeze.completeDelivery) === JSON.stringify(prior.completeDelivery));

const build = json(path.resolve(app, freeze.successorBuild.path));
for (const row of [build.command, build.config, build.inheritedConfig, build.manifest, build.moduleMap,
  ...build.files, ...build.builtSourceBindings]) bound(row);
const command = json(path.resolve(app, build.command.path));
check('Recorded author build exits zero /89 modules; no reviewer rebuild', command.actualToolResult.exit_code === 0 && command.actualToolResult.output.includes('89 modules transformed'));
check('Recorded size warning retained /no foreign body', build.warningRetained.includes('500kB') && build.foreignLessonBodies.length === 0);
const http = json(path.resolve(app, freeze.actualHttp.path));
check('Current server is5195, not predecessor5194', http.origin === 'http://127.0.0.1:5195' && freeze.preview.port === 5195);
const currentAssets = http.artifacts.filter(row => !row.url.match(/\.(woff2?|ttf)$/));
for (const row of [...http.payloads, ...currentAssets]) {
  const response = await fetch(row.url);
  const raw = Buffer.from(await response.arrayBuffer());
  check(`Current HTTP exact ${row.url}`, response.status === 200 && raw.length === row.bytes && hash(raw) === row.sha256);
  served.push({ url: row.url, status: response.status, bytes: raw.length, sha256: hash(raw) });
}
const arrival = await fetch(http.lessonUrl), arrivalRaw = Buffer.from(await arrival.arrayBuffer());
check('Current lesson deep URL serves exact current index', arrival.status === 200 && hash(arrivalRaw) === http.lessonRoute.sha256);

const require = createRequire(path.join(app, 'package.json'));
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
const cache = new Map();
function load(file) {
  const [bare, query] = file.split('?');
  if (query === 'raw') return read(bare);
  if (bare.endsWith('.json')) return json(bare);
  if (bare.endsWith('.css')) return {};
  if (cache.has(bare)) return cache.get(bare).exports;
  const module = { exports: {} }; cache.set(bare, module);
  binding(bare);
  const code = transformSync(read(bare), { loader: 'jsx', format: 'cjs', jsx: 'automatic', target: 'node20', sourcefile: bare }).code;
  new Function('require', 'module', 'exports', code)(source => source.startsWith('.') ? load(path.resolve(path.dirname(bare), source)) : require(source), module, module.exports);
  return module.exports;
}
const model = load(path.join(owner, 'manifold-models.mjs'));
const drawing = load(path.join(owner, 'ManifoldDrawing.jsx'));
const labs = load(path.join(owner, 'ManifoldInvestigations.jsx'));
const affinity = load(path.join(owner, 'AffinityFigures.jsx'));
const geometry = load(path.join(owner, 'GeometryFigures.jsx'));
const operation = load(path.join(owner, 'ManifoldOperationObjects.jsx'));
// React may place empty hydration-boundary comments between adjacent text nodes.
// Remove only those comments for literal label comparisons, never product text.
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props)).replaceAll('<!-- -->', '');
const near = (a, b, tolerance = 1e-12) => Math.abs(a - b) < tolerance;
// Original risk cases plus the all-raw-underflow boundary introduced by the correction.
for (const input of [{distances:[1,2,3],sigma:.1}, {distances:[4,2,3],sigma:.1}, {distances:[6,5,4],sigma:.1}]) {
  const row = model.gaussianRow(input.distances, input.sigma), html = render(labs.GaussianView, input);
  check(`R1 valid shifted denominator ${input.distances}`, row.shiftedSum >= 1 && near(row.probabilities.reduce((a,b)=>a+b,0),1));
  check(`R1 tiny nonzero distinct ${input.distances}`, row.raw.every(v => v === 0 || drawing.adaptiveNumber(v,9) !== '0'));
  check(`R1 operation and common-factor explanation ${input.distances}`, html.includes('common factor cancels') && html.includes('shifted sum') && html.includes('Self probability is exactly 0 by exclusion') && !html.includes('NaN'));
  check(`R1/R2 interval retains true widths and BCD keys ${input.distances}`, row.probabilities.every((p,i) => html.includes(`width:${100*p}%`) && html.includes(`color:${drawing.hues[i+1]}">${['B','C','D'][i]}:`)));
  if (row.rawSum === 0) check('All raw underflow explicitly named', html.includes('Raw sum 0 (underflow)') && row.probabilities[2] === 1);
  selected.push({input, raw:row.raw, rawSum:row.rawSum, shifted:row.shifted, shiftedSum:row.shiftedSum, probabilities:row.probabilities, rawLabels:row.raw.map(v => v === 0 ? '0 (underflow)' : drawing.adaptiveNumber(v,9)), renderedBytes:Buffer.byteLength(html), renderedSha256:hash(html)});
}
const force = render(affinity.ForceAnatomy), density = render(affinity.DensityRadius), anatomy = render(geometry.RecordAnatomy);
check('R2 signed pair lanes and stable B/C density products', ['AB ', 'AC ', 'AD ', 'A net '].every(text => force.includes(text)) && density.includes('B: 1·1²') && density.includes('C: .5·3²'));
check('R3 two saved PCA labels /no jointly-chosen label', anatomy.includes('saved PCA projection coordinates') && anatomy.includes('same 300 IDs · saved PCA projection') && !anatomy.includes('jointly chosen'));
const merge = render(operation.ConditionalMerge);
check('R4 two domains/selected branches/both joint cells', ['Condition on A','Condition on B','M280 45 H345 V440 H180','M280 255 H325 V440 H180','AB cell','BA cell','.175','2n = 8','separate from the following saved'].every(text=>merge.includes(text)));
const derivative = model.orderedDerivativeObjects();
const ab = derivative.ordered.find(pair => pair.i === 0 && pair.j === 1), ba = derivative.ordered.find(pair => pair.i === 1 && pair.j === 0);
// Hand derivation: Δ_AB=-1, Δ_BA=+1; both dΔ²/dA=-2, t=.5,
// dt/dA=.5, dlogt/dA=1. Across all A pairs dZ/dA=2(.5+.16+.06)=1.44.
check('R4 two ordered chain signs match hand derivative', ab.delta === -1 && ba.delta === 1 && [ab,ba].every(pair=>pair.squaredDerivative===-2 && pair.kernelDerivative===.5 && near(pair.attractive,-model.fixedP[0][1])));
check('R4 complete normalization derivative matches hand sum', derivative.ordered.length===12 && near(derivative.zDerivative,2*(.5+.16+.06)) && near(derivative.repulsive,.36) && near(derivative.attractive+derivative.repulsive,-derivative.state.displacement[0]));
const chain = render(operation.OrderedDependency);
check('R4 actual derivative chain and Z dependency rendered in source order', ['Ordered AB','Ordered BA','d(Δ²)/dA','dt/dA','d(log t)/dA','All 12 ordered kernels','dZ/dA','d(log Z)/dA','Negative gradient'].every(text=>chain.includes(text)));
const reference = render(geometry.FixedReferenceRoutes), grid = render(operation.GridConvolution), preservation = render(geometry.PreservationQuestions);
check('D31 labels and input graph reach training combination /optional reference scope', ['Target graph','Input graph','combine graphs','Altered training graph','Held-out labels do not enter','reference.transform','source-only API'].every(text=>reference.includes(text)));
check('D33 translated kernel and return field open actual operation /finite scope', ['Convolution kernel x','Convolution kernel y','Interpolate field back','query(1.2,1.3)','finite convolution','not an FFT execution'].every(text=>grid.includes(text)));
check('D07 plain mechanisms precede explicit later terminology signposts', ['called a Gram matrix','weighted-neighbor recipe','§4 names','§5 builds','§9 explains'].every(text=>preservation.includes(text)));
const ast = text => parse(text,{sourceType:'module',plugins:['jsx']});
const declaration = (text,name) => ast(text).program.body.find(node=>node.type==='ExportNamedDeclaration'&&node.declaration?.id?.name===name).declaration;
const normalized = node => JSON.stringify(node,(key,value)=>['loc','start','end','extra'].includes(key)?undefined:value);
for(const name of ['ExactControl','WidthLab','DistanceRowLab','ForceStepLab']) check(`Unchanged control AST ${name}`, normalized(declaration(read(path.join(owner,'ManifoldInvestigations.jsx')),name))===normalized(declaration(read(path.join(correction,'predecessors/ManifoldInvestigations.jsx')),name)));
const reader = read(path.join(owner,'manifold-lesson.jsx'));
const operationSource = read(path.join(owner,'ManifoldOperationObjects.jsx'));
const gaussianSource = operationSource.slice(operationSource.indexOf('export function GaussianBranches'),operationSource.indexOf('export function ConditionalMerge'));
check('Residual R4 evidence: prose names arrow widths while Gaussian branch paths do not encode probability width', reader.includes('The widest arrow ends at the nearest candidate') && reader.includes('At width 2 the three arrows are more even') && !gaussianSource.includes('strokeWidth={') && gaussianSource.includes('width={280 * stage.value}'));
const reviewerChecker = binding(fileURLToPath(import.meta.url));
const receipt = {schema:'manifold-same-reviewer-bounded-correction-closure/v1',status:'PASS_BOUNDED_GUARDS_RESIDUAL_R4_REPRESENTATION_AND_ROOT_NATIVE_NORMAL_PENDING',reviewer:'/root/ica_normal_integration_review',conditions,conditionCount:conditions.length,inputs:[...inputs.values()],served,selectedGaussianCases:selected,sourceFreeze:binding(freezePath),originalWholeReport:binding(path.join(review,'review.md')),reviewerChecker,requiredRemainingFinding:'Original R4/D10 drawing-to-walkthrough correspondence: two preserved prose sentences describe varying arrow widths; current Gaussian branches instead vary bar lengths and use constant-width operation paths. Add actual probability-width candidate arrows or explicitly amend manuscript/runtime wording to the actual bars with Root acceptance.',native:{inventory:{apps:[],browsers:[]},personallyViewedWindows:[],rootComplement:'pending; separately attributed'},limitations:['Passing guards do not close the explicitly retained R4 prose/representation finding.','SSR/source and exact HTTP are not browser paint/event/keyboard/clipboard/download acceptance.','No build, original science/main/fit or full numerical campaign replayed.','Normal route destinations/Back/CSS scoping/loading remain Root integration obligations.','Original scientific and native qualifications remain; previous reports unchanged.']};
const output=path.join(review,'same-correction-check.json');
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,conditions:conditions.length,inputs:inputs.size,served:served.length,receipt:binding(output)}));

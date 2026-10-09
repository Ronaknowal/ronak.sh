import bundleText from './ensemble-serving-flow-bundle.json?raw';
import checksumPayload from './ensemble-serving-checksum-payload.json?raw';
import recordedEvidence from './ensemble-serving-flow-evidence.json';

const deepFreeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
};
export const ensembleServingBundle = deepFreeze(JSON.parse(bundleText));
export const ensembleServingEvidence = deepFreeze(recordedEvidence);
const nativePayload = deepFreeze(JSON.parse(checksumPayload));
const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])) : value;
const payloadOnly = bundle => Object.fromEntries(Object.entries(bundle).filter(([key]) => key !== 'checksum'));
const same = (a, b) => JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));
const expectedFeatures = ensembleServingBundle.feature_order;
const expectedColumns = ['line:P(class=1)', 'bayes:P(class=1)', 'neighbor:P(class=1)'];
const finiteVector = (value, n) => Array.isArray(value) && value.length === n && value.every(Number.isFinite);
const finiteMatrix = (value, n, m) => Array.isArray(value) && value.length === n && value.every(row => finiteVector(row, m));
const requireState = (condition, message) => { if (!condition) throw new Error(message); };

let identityPromise;
export function verifyEnsembleServingIdentity() {
  if (!identityPromise) identityPromise = (async () => {
    const sha = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))))
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
    const [artifactSHA256, nativePayloadSHA256] = await Promise.all([sha(bundleText), sha(checksumPayload)]);
    requireState(artifactSHA256 === recordedEvidence.provenance.bundle.sha256, 'Saved bundle artifact bytes differ.');
    requireState(nativePayloadSHA256 === ensembleServingBundle.checksum && nativePayloadSHA256 === recordedEvidence.provenance.nativePayloadSHA256,
      'Whole-state checksum differs.');
    requireState(same(payloadOnly(ensembleServingBundle), nativePayload), 'Checksum payload and saved state differ.');
    validateEnsembleServingBundle(ensembleServingBundle);
    return { artifactSHA256, nativePayloadSHA256 };
  })();
  return identityPromise;
}

export function validateEnsembleServingBundle(bundle) {
  requireState(bundle && bundle.schema_version === 1, 'Unknown saved schema version.');
  requireState(same(bundle.feature_order, expectedFeatures) && bundle.feature_schema_sha256 === ensembleServingBundle.feature_schema_sha256,
    'Feature schema differs: names/order no longer match the saved preprocessing and parameters.');
  requireState(same(bundle.class_order, [0, 1]) && bundle.positive_class === 'malignant', 'Class schema differs: 0 is benign and 1 is malignant.');
  requireState(same(bundle.meta_column_order, expectedColumns), 'Meta schema differs: the named line/Bayes/neighbor columns are misordered.');
  for (const group of ['full_bases', 'blend_bases']) {
    requireState(Array.isArray(bundle[group]) && same(bundle[group].map(x => x.name), ['line', 'bayes', 'neighbor']), 'Saved member order differs.');
    for (const base of bundle[group]) {
      requireState(same(base.classes, [0, 1]) && Array.isArray(base.fit_ids) && base.fit_ids.length >= 9 &&
        base.fit_ids.every(Number.isInteger) && new Set(base.fit_ids).size === base.fit_ids.length, 'Saved class/row identities differ.');
      if (base.scaler) requireState(finiteVector(base.scaler.mean, 30) && finiteVector(base.scaler.scale, 30) && base.scaler.scale.every(x => x > 0),
        'Invalid saved scaler: all thirty scales must be positive and finite.');
      if (base.name === 'line') requireState(base.kind === 'binary-logistic' && finiteVector(base.coefficients, 30) && Number.isFinite(base.intercept), 'Invalid saved logistic coefficients.');
      if (base.name === 'bayes') requireState(base.kind === 'gaussian' && finiteMatrix(base.mean, 2, 30) && finiteMatrix(base.variance, 2, 30) &&
        base.variance.every(row => row.every(x => x > 0)) && finiteVector(base.prior, 2) && base.prior.every(x => x > 0) &&
        Math.abs(base.prior.reduce((a,b) => a+b,0)-1) <= 1e-10, 'Invalid saved Gaussian mean/variance/prior arrays.');
      if (base.name === 'neighbor') requireState(base.kind === 'uniform-neighbor' && base.neighbors === 9 &&
        finiteMatrix(base.training_features, base.fit_ids.length, 30) && finiteVector(base.training_labels, base.fit_ids.length) &&
        base.training_labels.every(x => x === 0 || x === 1), 'Invalid saved neighbor rows, labels or nine-neighbor count.');
    }
  }
  requireState(Number.isFinite(bundle.prior) && bundle.prior >= 0 && bundle.prior <= 1 && Number.isFinite(bundle.threshold) && bundle.threshold >= 0 && bundle.threshold <= 1,
    'Invalid saved prior/threshold.');
  requireState(finiteVector(bundle.simplex_weights, 3) && bundle.simplex_weights.every(x => x >= 0) &&
    Math.abs(bundle.simplex_weights.reduce((a,b) => a+b,0)-1) <= 1e-10, 'Invalid saved simplex weights.');
  requireState(finiteVector(bundle.stack_theta, 4) && finiteVector(bundle.blend_theta, 4), 'Invalid saved meta intercept/slopes.');
  requireState(bundle.checksum === ensembleServingBundle.checksum && same(payloadOnly(bundle), nativePayload),
    'Whole saved state differs from its bound checksum payload. Refreshing a checksum cannot restore feature meaning or old evaluation.');
  return true;
}

export function servingFaultBundle(fault) {
  if (fault === 'valid') return ensembleServingBundle;
  const bundle = JSON.parse(bundleText);
  if (fault === 'feature-order') [bundle.feature_order[0], bundle.feature_order[1]] = [bundle.feature_order[1], bundle.feature_order[0]];
  else if (fault === 'meta-order') bundle.meta_column_order.reverse();
  else if (fault === 'class-order') bundle.class_order.reverse();
  else if (fault === 'zero-scale') bundle.full_bases[0].scaler.scale[0] = 0;
  else if (fault === 'changed-coefficient') bundle.stack_theta[1] += .1;
  else throw new Error('Unknown bundle state.');
  return bundle;
}

export const servingSigmoid = score => score >= 0 ? 1 / (1 + Math.exp(-score)) : Math.exp(score) / (1 + Math.exp(score));
const sum = values => values.reduce((total, value) => total + value, 0);

export function ensembleServingBase(base, query) {
  const coordinates = base.scaler ? query.map((x,i) => (x - base.scaler.mean[i]) / base.scaler.scale[i]) : [...query];
  if (base.kind === 'binary-logistic') {
    const products = coordinates.map((x,i) => x * base.coefficients[i]), score = base.intercept + sum(products);
    return { name: base.name, kind: base.kind, coordinates, products, score, probability: servingSigmoid(score), base };
  }
  if (base.kind === 'gaussian') {
    const classes = base.classes.map((id,c) => {
      const terms = coordinates.map((x,j) => {
        const delta = x-base.mean[c][j], squared = delta*delta, standardizedSquare = squared/base.variance[c][j];
        const logNormalization = Math.log(2*Math.PI*base.variance[c][j]);
        return { delta, squared, standardizedSquare, logNormalization, contribution: -.5*(logNormalization+standardizedSquare) };
      });
      return { id, prior: base.prior[c], terms, joint: Math.log(base.prior[c])+sum(terms.map(x=>x.contribution)) };
    });
    const maximum = Math.max(...classes.map(x=>x.joint));
    const exponentials = classes.map(x=>Math.exp(x.joint-maximum)), normalizer = sum(exponentials);
    return { name: base.name, kind: base.kind, coordinates, classes, maximum, exponentials, normalizer,
      probability: exponentials[base.classes.indexOf(1)]/normalizer, base };
  }
  const neighbors = base.training_features.map((row,index) => {
    const deltas = row.map((x,j) => x-coordinates[j]), squares = deltas.map(x=>x*x);
    return { id: base.fit_ids[index], label: base.training_labels[index], deltas, squares, squaredDistance: sum(squares) };
  }).sort((a,b) => a.squaredDistance-b.squaredDistance || a.id-b.id).slice(0,base.neighbors);
  const positiveCount = neighbors.filter(x=>x.label===1).length;
  return { name: base.name, kind: base.kind, coordinates, neighbors, positiveCount, probability: positiveCount/9, base };
}

export const servingCandidateNames = { prior:'Training prior', line:'Single logistic line', bayes:'Single Gaussian Bayes', neighbor:'Single nine-neighbor',
  soft:'Equal soft mean', simplex:'Simplex blend', stack:'OOF logistic stack', blend:'Disjoint holdout blend' };

export function ensembleServingForward(bundle, query, selected = 'line') {
  validateEnsembleServingBundle(bundle);
  requireState(finiteVector(query,30) && query.every(x=>Math.abs(x)<=1e6), 'Supply thirty finite query features from −1e6 to +1e6 in the saved order.');
  requireState(Object.hasOwn(servingCandidateNames,selected), 'Unknown saved candidate.');
  const full = bundle.full_bases.map(base=>ensembleServingBase(base,query)), blend = bundle.blend_bases.map(base=>ensembleServingBase(base,query));
  const p = full.map(x=>x.probability), kept = blend.map(x=>x.probability);
  const stackProducts = p.map((x,i)=>x*bundle.stack_theta[i+1]), blendProducts = kept.map((x,i)=>x*bundle.blend_theta[i+1]);
  const stackScore = bundle.stack_theta[0]+sum(stackProducts), blendScore = bundle.blend_theta[0]+sum(blendProducts);
  const predictions = { prior:bundle.prior,line:p[0],bayes:p[1],neighbor:p[2],soft:sum(p)/3,simplex:sum(p.map((x,i)=>x*bundle.simplex_weights[i])),
    stack:servingSigmoid(stackScore),blend:servingSigmoid(blendScore) };
  const group = selected === 'blend' ? blend : full, inputs = group.map(x=>x.probability);
  let combination;
  if (selected === 'stack' || selected === 'blend') {
    const theta = selected === 'blend' ? bundle.blend_theta : bundle.stack_theta;
    const products = inputs.map((x,i)=>x*theta[i+1]);
    combination = { kind:'score-link',inputs,weights:theta.slice(1),products,intercept:theta[0],total:theta[0]+sum(products),link:'sigmoid' };
  } else if (selected === 'soft' || selected === 'simplex') {
    const weights = selected === 'soft' ? [1/3,1/3,1/3] : bundle.simplex_weights;
    const products = inputs.map((x,i)=>x*weights[i]);
    combination = { kind:'probability-sum',inputs,weights,products,intercept:0,total:sum(products),link:'identity' };
  } else combination = { kind:selected==='prior'?'prior':'single-base',selected: ['line','bayes','neighbor'].indexOf(selected),total:predictions[selected],link:'identity' };
  return { query, selected, predictions, full, blend, group, combination, probability:predictions[selected],
    selectedThreshold: bundle.threshold, selectedRuleID:bundle.selected_id, selectedRuleAction:predictions[bundle.selected_id]>=bundle.threshold,
    fittedRows: group[0].base.fit_ids.length };
}

import './normalization-buildup.css';

// Colour follows the module vocabulary (docs/teaching/deep-learning-beginner/visual-vocabulary.md):
// cyan supplied values, violet computed values, amber learned parameters, orange gradients,
// thick white outline for the element the reader is following. Example letters A–D carry identity.

const epsilon = 1e-5;
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const normalize = values => {
  const center = mean(values), spread = Math.sqrt(mean(values.map(value => (value - center) ** 2)) + epsilon);
  return values.map(value => (value - center) / spread);
};
const minus = text => String(text).replace(/-/g, '−');
const superscript = digits => [...digits].map(digit => '⁰¹²³⁴⁵⁶⁷⁸⁹'[digit]).join('');
const formatSlope = slope => {
  if (slope >= .001) return slope.toFixed(3);
  const [mantissa, exponent] = slope.toExponential(1).split('e-');
  return `${mantissa} × 10⁻${superscript(exponent)}`;
};
const tanhCells = values => values.map(z => ({ z, output: Math.tanh(z), slope: 1 - Math.tanh(z) ** 2 }));
const kind = (label, role) => <span className={`normalization-kind normalization-kind-${role}`}>{label}</span>;

// The problem and its repair: one tanh unit, four examples, three moments.
export function ScaleDriftFigure() {
  const early = [-1.5, -.5, .5, 1.5], later = [6, 8, 10, 12];
  const rows = [
    { name: 'Early in training', note: 'scores sit where tanh still bends', cells: tanhCells(early) },
    { name: 'Later, after upstream weights changed', note: 'every score is deep in tanh’s flat tail', cells: tanhCells(later), flat: true },
    { name: 'The later scores, normalized first', note: 'subtract their mean 9, divide by their spread √5, then apply tanh', cells: tanhCells(normalize(later)) },
  ];
  return <figure className="normalization-buildup" data-figure="scale-drift" aria-label="One tanh unit receives four examples. Early scores from minus 1.5 to 1.5 give slopes between 0.18 and 0.79. Later scores 6 to 12 give outputs near 1 and slopes of at most 0.000025. Normalizing the later scores first gives slopes between 0.24 and 0.82.">
    <div className="normalization-drift">{rows.map(row => <div className={`normalization-drift-row${row.flat ? ' is-flat' : ''}`} key={row.name}>
      <div className="normalization-drift-label"><strong>{row.name}</strong><span>{row.note}</span></div>
      {row.cells.map((cell, index) => <div className="normalization-drift-cell" key={index}>
        <span className="normalization-drift-chip">{'ABCD'[index]} · score {minus(Number(cell.z.toFixed(3)))}</span>
        <span>tanh <span className="normalization-nowrap">{minus(Math.abs(cell.output) > .999 ? cell.output.toFixed(5) : cell.output.toFixed(3))}</span></span>
        <span>slope <span className="normalization-nowrap">{formatSlope(cell.slope)}</span></span>
      </div>)}
    </div>)}</div>
    <figcaption>Each box is one training example, A–D, entering the same tanh unit: the score it brings, tanh’s output, and tanh’s local slope at that score. Exact arithmetic.</figcaption>
  </figure>;
}

// The whole repair drawn as one layer, with every step tagged by where its numbers come from.
export function NormalizationNetworkFigure() {
  const scores = [6, 8, 10, 12];
  const center = mean(scores), variance = mean(scores.map(value => (value - center) ** 2)), spread = Math.sqrt(variance + epsilon);
  const normalized = scores.map(value => (value - center) / spread);
  const gamma = 1, beta = 0, scaled = normalized.map(value => gamma * value + beta);
  const vector = (values, role) => <div className={`normalization-network-values is-${role}`}>{values.map((value, index) => <span key={index}><small>{'ABCD'[index]}</small><strong>{minus(Number.isInteger(value) ? value : value.toFixed(3))}</strong></span>)}</div>;
  return <figure className="normalization-buildup" data-figure="normalization-in-network" id="normalization-layer-anatomy" aria-label="Inside one normalization layer. Step 1, supplied scores 6, 8, 10, 12 for examples A to D. Step 2, computed mean 9, variance 5, spread about 2.23607. Step 3, computed normalized values minus 1.342, minus 0.447, 0.447, 1.342. Step 4, learned gamma 1 and beta 0 leave them unchanged. Step 5, tanh gives minus 0.872, minus 0.420, 0.420, 0.872.">
    <p className="normalization-key">Tags say where each number comes from: {kind('supplied', 'supplied')} arrives from the layer before, {kind('computed each pass', 'computed')} is measured again for every new batch, {kind('learned', 'learned')} is a parameter the optimizer updates.</p>
    <ol className="normalization-network-flow">
      <li className="normalization-network-stage"><div className="normalization-stage-head"><strong>1 · Weighted sum, one score per example</strong>{kind('supplied', 'supplied')}</div><span>z = weights × incoming activations + bias. These scores are the x of the normalization equation.</span>{vector(scores, 'supplied')}</li>
      <li className="normalization-network-stage"><div className="normalization-stage-head"><strong>2 · Measure the group</strong>{kind('computed each pass', 'computed')}</div>
        <span>The group is this unit’s four values, one per example: {'{'}A, B, C, D{'}'}.</span>
        <dl className="normalization-anatomy-steps">
          <div><dt>μ, the mean</dt><dd>(6 + 8 + 10 + 12) / 4 = {center}</dd></div>
          <div><dt>v, the variance</dt><dd>((−3)² + (−1)² + 1² + 3²) / 4 = {variance}</dd></div>
          <div><dt>s, the spread</dt><dd>√(v + ε) = √(5 + 0.00001) ≈ {spread.toFixed(5)}</dd></div>
        </dl></li>
      <li className="normalization-network-stage"><div className="normalization-stage-head"><strong>3 · Normalize each example</strong>{kind('computed each pass', 'computed')}</div><span>x̂ = (x − μ) / s, with the same μ and s for all four</span>{vector(normalized, 'computed')}</li>
      <li className="normalization-network-stage"><div className="normalization-stage-head"><strong>4 · Scale and shift</strong>{kind('learned', 'learned')}</div><span>y = γ · x̂ + β, one γ and one β for this unit (here γ = {gamma}, β = {beta})</span>{vector(scaled, 'computed')}</li>
      <li className="normalization-network-stage"><div className="normalization-stage-head"><strong>5 · Activation</strong></div><span>tanh(y) for each example, sent on to the next layer</span>{vector(scaled.map(Math.tanh), 'computed')}</li>
    </ol>
    <figcaption>One unit, four examples A–D, followed down the layer. Values are rounded to three decimals.</figcaption>
  </figure>;
}

// Learned scale and shift move the normalized values to whatever range helps the next layer.
export function AffineChoiceFigure() {
  const raw = [6, 8, 10, 12], normalized = normalize(raw), identityScale = Math.sqrt(5 + epsilon);
  const rows = [
    { name: 'Normalized x̂', formula: 'γ = 1, β = 0: mean 0, spread ≈ 1', values: normalized },
    { name: 'γ = 2, β = 1', formula: '2x̂ + 1: twice the spread, centre moved to 1', values: normalized.map(value => 2 * value + 1) },
    { name: 'γ = √(5 + ε), β = 9', formula: 'copied from this batch’s spread and mean', values: normalized.map(value => identityScale * value + 9) },
  ];
  return <figure className="normalization-buildup" data-figure="affine-choice" aria-label="Normalized values minus 1.342, minus 0.447, 0.447, 1.342 become minus 1.683, 0.106, 1.894, 3.683 with gamma 2 and beta 1, and return to 6, 8, 10, 12 with gamma root of 5 plus epsilon and beta 9.">
    <div className="normalization-affine">{rows.map(row => <div className="normalization-affine-row" key={row.name}>
      <div className="normalization-drift-label"><strong>{row.name}</strong><span>{row.formula}</span></div>
      {row.values.map((value, index) => <span className="normalization-affine-cell" key={index}>{'ABCD'[index]} · {minus(Number(value.toFixed(3)))}</span>)}
    </div>)}</div>
    <figcaption>The same four examples A–D after step 3 of the layer, under three choices of the learned pair (γ, β).</figcaption>
  </figure>;
}

// Before the image tensor: one small layer, two ways to choose who shares a mean.
export function LayerPoolingFigure() {
  const rows = [
    { example: 'A', values: [1, 6, -3] },
    { example: 'B', values: [0, 8, -1] },
    { example: 'C', values: [2, 10, 0] },
    { example: 'D', values: [1, 12, 4] },
  ];
  const unitMean = mean(rows.map(row => row.values[1]));
  const exampleMean = mean(rows[0].values);
  const table = mode => <table className="normalization-pool-table">
    <thead><tr><th scope="col"><abbr title="example" aria-label="example">ex.</abbr></th>{['unit 0', 'unit 1', 'unit 2'].map(unit => <th scope="col" key={unit}>{unit}</th>)}</tr></thead>
    <tbody>{rows.map((row, r) => <tr key={row.example}><th scope="row">{row.example}</th>{row.values.map((value, u) => {
      const hit = mode === 'batch' ? u === 1 : r === 0;
      return <td key={u} className={hit ? 'normalization-pool-hit' : undefined}>{minus(value)}{hit ? <span className="normalization-pool-mark" aria-hidden="true"> ●</span> : null}</td>;
    })}</tr>)}</tbody>
  </table>;
  return <figure className="normalization-buildup" data-figure="layer-pooling" id="layer-pooling" aria-label="A layer of three units for four examples. BatchNorm groups one unit down the four examples: 6, 8, 10, 12, mean 9. LayerNorm groups one example across its three units: 1, 6, minus 3, mean 4 over 3.">
    <div className="flow-columns-2">
      <div><p className="normalization-panel-label">BatchNorm: one unit, down the batch</p>{table('batch')}<p className="normalization-panel-note">Group for unit 1: 6, 8, 10, 12, so μ = {unitMean}. Each unit gets its own group.</p></div>
      <div><p className="normalization-panel-label">LayerNorm: one example, across its units</p>{table('layer')}<p className="normalization-panel-note">Group for example A: 1, 6, −3, so μ = {Number(exampleMean.toFixed(3))}. Each example gets its own group.</p></div>
    </div>
    <figcaption>Rows are four examples, columns are three units of one layer; unit 1 holds the opening’s scores 6, 8, 10, 12. Outlined cells marked ● form one statistics group. The twelve numbers are the same in both panels.</figcaption>
  </figure>;
}

const tensorCells = Array.from({ length: 16 }, (_, index) => ({ index, value: index + 1, n: Math.floor(index / 8), c: Math.floor(index % 8 / 2) }));
const groupingRules = [
  { name: 'BatchNorm (training)', rule: 'same channel, every example', group: cell => cell.c, tag: cell => `ch${cell.c}` },
  { name: 'LayerNorm over C, H, W', rule: 'one whole example', group: cell => cell.n, tag: cell => `ex${cell.n}` },
  { name: 'GroupNorm, 2 groups', rule: 'one example, two adjacent channels', group: cell => cell.n * 2 + Math.floor(cell.c / 2), tag: cell => `ex${cell.n}·g${Math.floor(cell.c / 2)}` },
  { name: 'InstanceNorm', rule: 'one example, one channel', group: cell => cell.n * 4 + cell.c, tag: cell => `ex${cell.n}·ch${cell.c}` },
];

export function AxisGroupingFigure() {
  return <figure className="normalization-buildup" data-figure="axis-grouping" aria-label="The same 16-value tensor partitioned four ways. BatchNorm forms four groups of four, one per channel across both examples. LayerNorm forms two groups of eight, one per example. GroupNorm forms four groups of four inside the examples. InstanceNorm forms eight groups of two.">
    <div className="normalization-grouping-panels">{groupingRules.map(rule => {
      const count = new Set(tensorCells.map(rule.group)).size;
      return <div className="normalization-grouping-panel" key={rule.name}>
        <p className="normalization-panel-label">{rule.name}</p>
        <p className="normalization-panel-note">{rule.rule}: {count} groups of {16 / count} values</p>
        <div className="normalization-grouping-examples">{[0, 1].map(n => <div key={n}>
          <span className="normalization-grouping-example">example {n}</span>
          {[0, 1, 2, 3].map(c => <div className="normalization-grouping-row" key={c}>{tensorCells.filter(cell => cell.n === n && cell.c === c).map(cell => {
            const group = rule.group(cell);
            return <span key={cell.index} className={`normalization-group-cell normalization-group-${group % 4}${group >= 4 ? ' normalization-group-striped' : ''}`}><strong>{cell.value}</strong><small>{rule.tag(cell)}</small></span>;
          })}</div>)}
        </div>)}</div>
      </div>;
    })}</div>
    <figcaption>Shape (N, C, H, W) = (2, 4, 1, 2): two examples side by side, four channel rows each, two positions per row. Cells with the same tag are averaged together; the tag names the group and the shading only repeats it. The dashed line separates example 0 from example 1; only BatchNorm’s groups cross it.</figcaption>
  </figure>;
}

// Training versus evaluation: which statistics the output reads, and what is written.
export function BatchNormModeDiagram({ values, batchMean, batchVariance, correctedVariance, buffers, momentum, gamma, beta, training }) {
  const epsilonValue = 1e-5, round = (value, digits = 4) => minus(Number(value.toFixed(digits)));
  const next = { mean: (1 - momentum) * buffers.mean + momentum * batchMean, variance: (1 - momentum) * buffers.variance + momentum * correctedVariance };
  const trainingOutput = values.map(value => gamma * (value - batchMean) / Math.sqrt(batchVariance + epsilonValue) + beta);
  const evaluationOutput = values.map(value => gamma * (value - buffers.mean) / Math.sqrt(buffers.variance + epsilonValue) + beta);
  const list = items => `[${items.map(item => round(item, 3)).join(', ')}]`;
  const step = (label, text, className = '') => <div className={`normalization-mode-step ${className}`}><strong>{label}</strong><span>{text}</span></div>;
  const down = <span className="normalization-mode-arrow" aria-hidden="true">↓</span>;
  const panel = (mode, active, content) => <div className={`normalization-mode-panel${active ? ' is-current' : ''}`} data-mode={mode}>
    <p className="normalization-mode-name">{mode === 'training' ? 'Training mode' : 'Evaluation mode'}{active ? <span className="normalization-mode-current">selected</span> : null}</p>{content}</div>;
  return <figure className="normalization-buildup normalization-mode-figure" data-figure="batchnorm-modes" id="batchnorm-modes" aria-label={`BatchNorm routes for batch ${list(values)}. Training: batch mean ${round(batchMean)} and variance ${round(batchVariance)} feed the output ${list(trainingOutput)} and are written into the running buffers, mean ${round(buffers.mean)} to ${round(next.mean)}, variance ${round(buffers.variance)} to ${round(next.variance)}. Evaluation: running mean ${round(buffers.mean)} and variance ${round(buffers.variance)} feed the output ${list(evaluationOutput)}; batch statistics are not used and nothing is written.`}>
    <div className="flow-columns-2">
      {panel('training', training, <>
        {step('Batch in', list(values), 'is-supplied')}{down}
        {step('Batch statistics · computed now', <>μ<sub>B</sub> = {round(batchMean)}, v<sub>B</sub> = {round(batchVariance)}</>, 'is-used is-computed')}{down}
        {step('Normalize', <>x̂ = (x − μ<sub>B</sub>) / √(v<sub>B</sub> + ε)</>)}{down}
        {step('Scale and shift · learned', `γ = ${round(gamma)}, β = ${round(beta)}`, 'is-learned')}{down}
        {step('Output', list(trainingOutput), 'is-computed')}
        <div className="normalization-mode-write"><span aria-hidden="true">⇢</span><div><strong>Side path: this training pass writes the buffers</strong><span>μ<sub>run</sub>: {round(buffers.mean)} → (1 − m)·{round(buffers.mean)} + m·{round(batchMean)} = {round(next.mean)}</span><span>v<sub>run</sub>: {round(buffers.variance)} → (1 − m)·{round(buffers.variance)} + m·{round(correctedVariance)} = {round(next.variance)}</span><span>m = {round(momentum)}; the stored variance divides by M − 1.</span></div></div>
      </>)}
      {panel('evaluation', !training, <>
        {step('Batch in', list(values), 'is-supplied')}
        {step('Batch statistics', 'not used in evaluation', 'is-unused')}
        {step('Stored buffers · read only', <>μ<sub>run</sub> = {round(buffers.mean)}, v<sub>run</sub> = {round(buffers.variance)}</>, 'is-used')}{down}
        {step('Normalize', <>x̂ = (x − μ<sub>run</sub>) / √(v<sub>run</sub> + ε)</>)}{down}
        {step('Scale and shift · learned', `γ = ${round(gamma)}, β = ${round(beta)}`, 'is-learned')}{down}
        {step('Output', list(evaluationOutput), 'is-computed')}
        <div className="normalization-mode-write is-off"><span aria-hidden="true">✕</span><div><strong>Writes nothing</strong><span>The buffers stay at μ<sub>run</sub> = {round(buffers.mean)}, v<sub>run</sub> = {round(buffers.variance)}.</span></div></div>
      </>)}
    </div>
    <figcaption>Both panels use the same batch, buffers and parameters. A thick white outline marks the statistics each output actually reads; the dashed box is the training-only side path that writes memory.</figcaption>
  </figure>;
}

// The derivative for each input comes from three routes; all bars share one scale.
export function BackwardPathsFigure() {
  const x = [1, 3, -2], upstream = [.3, -.2, .8];
  const center = mean(x), variance = mean(x.map(value => (value - center) ** 2)), spread = Math.sqrt(variance + epsilon);
  const h = x.map(value => (value - center) / spread), meanU = mean(upstream), meanUH = mean(upstream.map((value, i) => value * h[i]));
  const rows = x.map((value, i) => ({ value, direct: upstream[i] / spread, mean: -meanU / spread, spread: -h[i] * meanUH / spread }));
  const scale = .4, bar = value => ({ width: `${Math.abs(value) / scale * 50}%`, [value < 0 ? 'right' : 'left']: '50%' });
  const paths = [['direct', 'Direct: uᵢ / s'], ['mean', 'Through the mean: −mean(u) / s'], ['spread', 'Through the spread: −x̂ᵢ mean(u x̂) / s']];
  const directSum = rows.reduce((sum, row) => sum + row.direct, 0);
  return <figure className="normalization-buildup" data-figure="backward-paths" aria-label="For inputs 1, 3 and minus 2 with incoming derivatives 0.3, minus 0.2 and 0.8, direct contributions 0.146, minus 0.097 and 0.389 sum to 0.438. Mean contributions of minus 0.146 each and spread contributions 0.032, 0.224 and minus 0.256 bring the totals to 0.032, minus 0.019 and minus 0.013, which sum to zero.">
    <p className="normalization-key">Group x = [1, 3, −2]: μ = 2/3, v = 38/9, s = √(v + ε) ≈ {spread.toFixed(4)}. Incoming derivatives u = [0.3, −0.2, 0.8]. Each orange bar is one route’s contribution to an input’s derivative; the centre line is zero and all bars share one scale.</p>
    <div className="normalization-paths">{rows.map((row, i) => <div className="normalization-paths-input" key={i}>
      <strong>Input {i}: x = {minus(row.value)}, x̂ ≈ {minus(h[i].toFixed(3))}</strong>
      {paths.map(([key, label]) => <div className={`normalization-path-row normalization-path-${key}`} key={key}>
        <span>{label}</span><span className="normalization-path-track" aria-hidden="true"><span style={bar(row[key])} /></span><span>{minus(row[key].toFixed(3))}</span>
      </div>)}
      <div className="normalization-path-total">Total derivative {minus((row.direct + row.mean + row.spread).toFixed(3))}</div>
    </div>)}</div>
    <figcaption>The direct bars alone sum to {directSum.toFixed(3)}; with both statistics routes added, the three totals [0.032, −0.019, −0.013] sum to 0. Central finite differences and PyTorch’s LayerNorm backward give the same totals.</figcaption>
  </figure>;
}

// The experiment's network, drawn before its code.
export function NormalizationModelStrip() {
  const stages = [
    ['Image', '64 pixel values', 'supplied'],
    ['Linear', '64 → 32 scores, weights and bias', 'learned'],
    ['Normalization', 'none, BatchNorm, LayerNorm or RMSNorm', 'operation'],
    ['tanh', '32 activations', 'operation'],
    ['Linear', '32 → 10 logits, one per digit', 'learned'],
  ];
  return <figure className="normalization-buildup" data-figure="normalization-model" id="normalization-model" aria-label="The experiment's network: 64 pixel values, a learned linear layer to 32 scores, a normalization step, tanh, and a learned linear layer to 10 logits.">
    <ol className="normalization-model-strip">{stages.map(([name, detail, role], index) => <li key={index} className={`is-${role}`}><strong>{name}</strong><span>{detail}</span></li>)}</ol>
    <figcaption>Data flows left to right; on narrow screens, top to bottom. The normalization slot is the only part that changes between the four runs.</figcaption>
  </figure>;
}

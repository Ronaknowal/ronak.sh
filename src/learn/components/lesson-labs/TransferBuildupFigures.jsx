import { useState } from 'react';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { FlowLab, FlowControls, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import features from '../../data/transfer-learning-features.json';
import experiment from '../../data/transfer-learning-experiment.json';
import { transferStrategy } from '../../data/transfer-learning-strategy.js';
import featureProgramUrl from '../../assets/transfer-learning/feature-inspection.py?url';
import './transfer-buildup.css';

export { featureProgramUrl };

// Colour vocabulary (docs/teaching/deep-learning-beginner/visual-vocabulary.md): cyan supplied
// inputs, amber learned parameters, violet computed values, grey frozen parameters, dashed
// amber added-and-trained parameters, orange dashed backward signals. Each figure labels its parts.

/** The source network split into backbone and head, before any adaptation strategy. */
export function TransferNetworkFigure() {
  return <figure className="tb-figure" data-figure="transfer-network-anatomy">
    <div className="tb-anatomy">
      <div className="tb-anatomy-input"><strong>Image x</strong><span>8 × 8 pixels, divided by 16</span><b>64 input values</b><span className="tb-tag is-input">supplied data</span></div>
      <span className="tb-flow-arrow" aria-hidden="true">→</span>
      <div className="tb-backbone-boundary">
        <p className="tb-boundary-label">Backbone g<sub>ψ</sub> · weights ψ learned on digits 0–4</p>
        <div className="tb-backbone-layers">
          <div><strong>Lower layer</strong><span className="tb-neuron-marks" aria-hidden="true">○ ○ ○ ⋯</span><span>32 tanh neurons</span><span className="tb-param">W 32 × 64 · b 32</span></div>
          <span className="tb-flow-arrow" aria-hidden="true">→</span>
          <div><strong>Upper layer</strong><span className="tb-neuron-marks" aria-hidden="true">○ ○ ○ ⋯</span><span>16 tanh neurons</span><span className="tb-param">W 16 × 32 · b 16</span></div>
        </div>
      </div>
      <span className="tb-flow-arrow" aria-hidden="true">→</span>
      <div className="tb-feature-junction"><strong>Features h</strong><span>16 numbers for this image</span><span className="tb-tag is-computed">computed, not stored</span></div>
    </div>
    <p className="tb-branch-label">The 16 features go to one of two heads. They are alternatives, not successive layers:</p>
    <div className="tb-head-branches" aria-label="Alternative heads attached after the 16 features">
      <div className="tb-head-route is-source"><p>h → <strong>Original source head</strong> (W 5 × 16 · b 5) → logits z</p><div className="tb-class-scores" aria-label="Five source score meanings">{[0, 1, 2, 3, 4].map(digit => <span key={digit}>score for <b>{digit}</b></span>)}</div><p>Kept aside unchanged, so we can later check the old task.</p></div>
      <div className="tb-head-route is-target"><p>h → <strong>New target head f<sub>θ</sub></strong> (W 5 × 16 · b 5) → logits z</p><div className="tb-class-scores" aria-label="Five target score meanings">{[5, 6, 7, 8, 9].map(digit => <span key={digit}>score for <b>{digit}</b></span>)}</div><p>New random weights θ, trained to give these five meanings.</p></div>
    </div>
    <figcaption>Follow the arrows: they carry numbers forward, from the image to the features. Cyan marks supplied data, amber the learned weights inside the outlined backbone, violet the features computed for one image; the new head is dashed amber because it is added and trained. Each circle sketches one neuron; the written counts give the real widths, and weight shapes are written outputs × inputs, as in PyTorch, for one image; a batch adds a leading dimension N.</figcaption>
  </figure>;
}

/** Backward-through is different from updating a frozen parameter. */
export function FrozenGradientFigure() {
  return <figure className="tb-figure" data-figure="transfer-frozen-gradient-path">
    <div className="tb-gradient-route">
      <div><p className="tb-row-label">1 · Forward, toward the loss</p><ol><li><strong>Earlier trainable module</strong><span>produces u = (2, 1)</span></li><li className="is-frozen"><strong>Frozen layer: y = Wu</strong><span>W = I₂ (grey: frozen), so y = (2, 1)</span></li><li><strong>Loss against target (0, 0)</strong><span>L = (2² + 1²) / 2 = 2.5</span></li></ol></div>
      <div className="is-backward"><p className="tb-row-label">2 · Backward, toward the earlier module</p><ol><li><strong>Starts from the output error</strong><span>∂L/∂y = (2, 1)</span></li><li className="is-frozen"><strong>Passes through the stored Wᵀ</strong><span>W takes part; no W gradient is stored</span></li><li><strong>Learning signal reaches u</strong><span>∂L/∂u = Wᵀ(2, 1) = (2, 1)</span></li></ol></div>
    </div>
    <div className="tb-probe-route">
      <p className="tb-row-label">3 · Contrast: a linear probe, where nothing before the head trains</p>
      <ol>
        <li className="is-frozen"><strong>Frozen backbone g<sub>ψ</sub></strong><span>computes features h</span></li>
        <li className="is-added"><strong>New head f<sub>θ</sub> trains</strong><span>∂L/∂θ is computed and stored</span></li>
        <li className="is-backward-stop"><strong>Backward stops at the head</strong><span>⇠ nothing flows on into g<sub>ψ</sub>, so h can be computed once and cached</span></li>
      </ol>
    </div>
    <figcaption>Each row lists its steps in the order they happen: the forward row toward the loss, the orange backward row from the output error back to u. Grey boxes are frozen; the dashed amber head is added and trained. See the <a href="https://docs.pytorch.org/docs/2.14/notes/autograd.html#setting-requires-grad">PyTorch autograd guide</a> for the difference between parameter gradients and graph recording.</figcaption>
  </figure>;
}

/** The section-1 two-number example, drawn: class averages, one new code, its two distances. */
export function NearestMeanToyFigure() {
  const unit = 26, ox = 30, oy = 214;
  const px = x => ox + x * unit, py = y => oy - y * unit;
  const P = [[1, 3], [3, 1]], Q = [[5, 5], [7, 7]], mP = [2, 2], mQ = [6, 6], query = [2, 4];
  const dist = ([a, b], [c, d]) => Math.hypot(a - c, b - d);
  return <figure className="tb-figure" data-figure="transfer-nearest-mean-toy">
    <div className="tb-toy">
      <svg viewBox="0 0 250 240" role="img" aria-label="Class P codes (1,3) and (3,1) average to (2,2); class Q codes (5,5) and (7,7) average to (6,6); the new code (2,4) is 2 from P's average and about 4.47 from Q's">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(t => <g key={t}><line x1={px(t)} x2={px(t)} y1={py(0)} y2={py(7.5)} stroke="#26241f" /><line x1={px(0)} x2={px(7.5)} y1={py(t)} y2={py(t)} stroke="#26241f" /></g>)}
        <line x1={px(0)} x2={px(7.6)} y1={py(0)} y2={py(0)} stroke="#8c8476" /><line x1={px(0)} x2={px(0)} y1={py(0)} y2={py(7.6)} stroke="#8c8476" />
        <line x1={px(query[0])} y1={py(query[1])} x2={px(mP[0])} y2={py(mP[1])} stroke="#c7a5ee" strokeWidth="2.5" />
        <line x1={px(query[0])} y1={py(query[1])} x2={px(mQ[0])} y2={py(mQ[1])} stroke="#c7a5ee" strokeWidth="2" strokeDasharray="5 4" />
        {P.map(([x, y]) => <circle key={`p${x}`} cx={px(x)} cy={py(y)} r="6" fill="#dfd8c8" />)}
        {Q.map(([x, y]) => <rect key={`q${x}`} x={px(x) - 6} y={py(y) - 6} width="12" height="12" fill="none" stroke="#dfd8c8" strokeWidth="2" />)}
        {[mP, mQ].map(([x, y]) => <text key={`m${x}`} x={px(x)} y={py(y) + 6} textAnchor="middle" className="tb-toy-mean">×</text>)}
        <text x={px(mP[0]) - 10} y={py(mP[1]) + 5} textAnchor="end" className="tb-toy-label">P avg</text>
        <text x={px(mQ[0]) + 10} y={py(mQ[1]) + 5} className="tb-toy-label">Q avg</text>
        <circle cx={px(query[0])} cy={py(query[1])} r="7" fill="none" stroke="#f4f0e6" strokeWidth="3" />
        <text x={px(query[0]) - 10} y={py(query[1]) - 10} textAnchor="end" className="tb-toy-label">new</text>
        <text x={px(query[0]) + 8} y={py(3) + 5} className="tb-toy-dist">2.00</text>
        <text x={px(3.4)} y={py(4.95)} textAnchor="end" className="tb-toy-dist">4.47</text>
      </svg>
      <ul className="tb-toy-key">
        <li><span aria-hidden="true">●</span> class P training codes (1, 3) and (3, 1); their average × is (2, 2)</li>
        <li><span aria-hidden="true">□</span> class Q training codes (5, 5) and (7, 7); their average × is (6, 6)</li>
        <li><span aria-hidden="true">◯</span> new code (2, 4), outlined because it is the point being classified</li>
        <li><span className="tb-violet" aria-hidden="true">━</span> distance to P’s average: <strong>{dist(query, mP).toFixed(2)}</strong></li>
        <li><span className="tb-violet" aria-hidden="true">┅</span> distance to Q’s average: <strong>{dist(query, mQ).toFixed(2)}</strong></li>
        <li>Nearest average is P’s, so the rule answers <strong>P</strong>.</li>
      </ul>
    </div>
    <figcaption>Constructed two-number example; both axes use the same unit scale, so the drawn lengths are the true distances. Violet lines are computed distances.</figcaption>
  </figure>;
}

/** Yosinski et al.'s cut-and-lock experiment, sketched on an eight-layer network. */
export function CoAdaptationFigure() {
  const rows = [
    { name: 'baseB', note: 'all 8 layers trained on task B', states: Array(8).fill('trains') },
    { name: 'B4B', note: 'layers 1–4 copied from baseB and locked; 5–8 start random and retrain on B', states: [...Array(4).fill('frozen'), ...Array(4).fill('added')] },
    { name: 'B4B+', note: 'layers 1–4 copied from baseB and fine-tuned; 5–8 start random; all retrain on B', states: [...Array(4).fill('trains'), ...Array(4).fill('added')] },
  ];
  return <figure className="tb-figure" data-figure="transfer-coadaptation">
    <div className="tb-coadapt">{rows.map(row => <div key={row.name} className="tb-coadapt-row">
      <p><strong>{row.name}</strong> · {row.note}</p>
      <ol aria-label={`${row.name}: ${row.note}`}>{row.states.map((state, i) => <li key={i} className={`tb-coadapt-layer is-${state}${i === 3 ? ' is-cut' : ''}`}>{i + 1}</li>)}</ol>
    </div>)}</div>
    <p className="tb-key-line"><span className="tb-key is-trains">solid amber: trains (baseB from its own random start; B4B+ layers 1–4 from baseB’s weights)</span> <span className="tb-key is-added">dashed amber: re-initialized after the cut, trains</span> <span className="tb-key is-frozen">grey: copied and locked</span> <span className="tb-key is-cut-key">white bar: cut after layer 4</span></p>
    <figcaption>A sketch of the procedure on Yosinski et al.’s eight-layer ImageNet network; no measured values are drawn. Each numbered square is one layer, input on the left.</figcaption>
  </figure>;
}

/** Which modules are in which mode under the common frozen-backbone BatchNorm policy. */
export function BatchNormPolicyFigure() {
  return <figure className="tb-figure" data-figure="transfer-batchnorm-policy">
    <p className="tb-row-label"><code>model.train()</code>, then <code>model.backbone.eval()</code>: one model, two modes</p>
    <div className="tb-bn-policy">
      <div className="tb-bn-part is-frozen"><p className="tb-part-title">Backbone · eval mode · frozen</p><ul><li>BatchNorm normalizes with its <strong>stored</strong> running mean and variance</li><li>those buffers are <strong>not</strong> rewritten by target batches</li><li>dropout is off</li><li>weights frozen: <code>requires_grad_(False)</code>, not in the optimizer</li></ul></div>
      <span className="tb-flow-arrow" aria-hidden="true">→</span>
      <div className="tb-bn-part is-added"><p className="tb-part-title">Head · train mode · trains</p><ul><li>weights receive gradients and are in the optimizer</li><li>any head dropout or normalization behaves as in training</li></ul></div>
    </div>
    <figcaption>Grey: the frozen backbone; dashed amber: the added head that trains. Features flow from the backbone to the head, following the arrow.</figcaption>
  </figure>;
}

export function LoraLocationFigure() {
  return <figure className="tb-figure" data-figure="transfer-lora-location">
    <div className="tb-lora-split"><strong>Layer input x · k values</strong><span>For the lower layer, x is the image’s 64 values; for the upper layer, the 32 lower-layer activations.</span></div>
    <p className="tb-fork" aria-hidden="true"><span>↙</span><span>the same x enters both routes, which run in parallel</span><span>↘</span></p>
    <div className="tb-lora-routes">
      <div className="tb-route is-frozen-route"><p className="tb-part-title"><span className="tb-route-tag">Route 1 of 2 · frozen</span>Base route</p><p><strong>W x + b</strong></p><p>stored weights W and bias b</p><p>k inputs → d outputs</p><p className="tb-route-tail">↓ into ⊕</p></div>
      <div className="tb-route is-added-route"><p className="tb-part-title"><span className="tb-route-tag">Route 2 of 2 · added, trains</span>Correction route</p><ol><li><strong>A x</strong><span>k inputs → r measurements</span></li><li><strong>s B(Ax)</strong><span>r measurements → d corrections</span></li></ol><p className="tb-route-tail">↓ into ⊕</p></div>
    </div>
    <div className="tb-lora-join"><strong>⊕ Add: y = W x + b + s B(Ax)</strong><span>Both routes give d values, so matching coordinates are added.</span><span aria-hidden="true">↓</span><strong>tanh(y) → next layer</strong></div>
    <div className="tb-table" role="region" tabIndex={0} aria-label="LoRA shapes in the digit model"><table><caption>The same symbols in our digit model (rank r = 2, α = 2, so s = α / r = 1)</caption><thead><tr><th scope="col">Layer</th><th scope="col">x (k)</th><th scope="col">W, frozen</th><th scope="col">A, starts random N(0, 0.1²)</th><th scope="col">B, starts at 0</th><th scope="col">correction (d)</th></tr></thead><tbody><tr><th scope="row">Lower</th><td>64</td><td>32 × 64</td><td>2 × 64</td><td>32 × 2</td><td>32</td></tr><tr><th scope="row">Upper</th><td>32</td><td>16 × 32</td><td>2 × 32</td><td>16 × 2</td><td>16</td></tr></tbody></table></div>
    <figcaption>Grey: the frozen base route; dashed amber: the added correction route, whose factors A and B train. The routes share x, not each other’s outputs, and rejoin only at ⊕. The drawing includes the fixed bias b of our digit model; the formula below omits that unchanged bias.</figcaption>
  </figure>;
}

/** Visible source of the validation-only feature inspection. */
export function FeatureInspectionProgram() {
  return <RemoteCodeBlock source={featureProgramUrl} language="python" filename="feature-inspection.py" title="Read the feature-inspection program" />;
}
const seedOne = features.seeds[0];
const fixed = (value, digits = 2) => value.toFixed(digits).replace('-', '−');

function FeatureStrip({ label, values }) {
  return <div className="tb-strip-row"><p className="tb-strip-label">{label}</p><ol className="tb-strip" aria-label={`${label}: ${values.map(v => fixed(v)).join(', ')}`}>{values.map((value, i) => {
    const strength = Math.min(1, Math.abs(value));
    const limit = Math.abs(value) > .95;
    return <li key={i} className={`${value >= 0 ? 'is-positive' : 'is-negative'}${strength < .5 ? ' is-faint' : ''}${limit ? ' is-limit' : ''}`} style={{ '--tb-strength': strength }}><span className="tb-cell-index">f{i + 1}</span><span className="tb-cell-value">{fixed(value)}</span></li>;
  })}</ol></div>;
}

/** Sixteen actual feature values for one real target image, before and after source training. */
export function FeatureVectorFigure() {
  const five = seedOne.specimens.find(row => row.digit === 5);
  const limitCount = five.learned_features.filter(v => Math.abs(v) > .95).length;
  return <figure className="tb-figure" data-figure="transfer-feature-vector">
    <p className="tb-row-label">A handwritten 5 (source ID {five.source_id}), seed-1 backbone. Each cell is one of the 16 features f1–f16: amber when positive, blue when negative, stronger colour closer to tanh’s limits ±1; a white outline marks a value within 0.05 of a limit.</p>
    <FeatureStrip label="Untrained random backbone" values={five.random_features} />
    <FeatureStrip label="After 400 source updates on digits 0–4" values={five.learned_features} />
    <figcaption>{limitCount} of the learned values sit at a limit; every random value lies between −0.5 and 0.5. Values come from the feature-inspection program in section 3.</figcaption>
  </figure>;
}

const viewLabels = { raw_pixels: 'Raw pixels (64)', random_lower_layer: 'Random lower layer (32)', learned_lower_layer: 'Learned lower layer (32)', random_backbone: 'Random backbone (16)', learned_backbone: 'Learned backbone (16)' };
const countFor = (seed, key) => key.endsWith('_lower_layer') ? seed.lower_layer_nearest_centroid_correct_of_60[key] : seed.nearest_centroid_correct_of_60[key];

function Confusion({ label, table, caption }) {
  return <div className="tb-table" role="region" tabIndex={0} aria-label={label}><table className="tb-votes"><caption>{caption}</caption><thead><tr><th scope="col">True ↓ · nearest →</th>{[5, 6, 7, 8, 9].map(j => <th key={j} scope="col">{j}</th>)}</tr></thead><tbody>{Object.entries(table).map(([digit, counts]) => <tr key={digit}><th scope="row">{digit}</th>{counts.map((count, j) => <td key={j} className={j + 5 === Number(digit) ? 'is-diagonal' : count >= 4 ? 'is-collision' : count ? 'is-some' : ''}>{count}</td>)}</tr>)}</tbody></table></div>;
}

/** Nearest-mean test on the features themselves: measured, validation rows only. */
export function FeatureTestFigure() {
  const confusion = seedOne.nearest_centroid_confusion;
  return <figure className="tb-figure" data-figure="transfer-feature-test">
    <div className="tb-table" role="region" tabIndex={0} aria-label="Nearest-mean correct counts"><table><caption>Validation images assigned their correct digit, out of 60, by the nearest-mean rule</caption><thead><tr><th scope="col">Representation</th>{features.seeds.map(s => <th key={s.seed} scope="col">Seed {s.seed}</th>)}</tr></thead><tbody>{Object.keys(viewLabels).map(key => <tr key={key} className={key.startsWith('learned') ? 'is-focus' : ''}><th scope="row">{viewLabels[key]}</th>{features.seeds.map(s => <td key={s.seed}>{countFor(s, key)}</td>)}</tr>)}</tbody></table></div>
    <p className="tb-row-label">Where the learned features go wrong: seed 1, the same 60 validation images. Each row is one true digit’s 12 images; each column is the digit whose mean was nearest.</p>
    <div className="tb-confusions">
      <Confusion label="Nearest-mean confusion, random backbone" table={confusion.random_backbone} caption="16 random-backbone features" />
      <Confusion label="Nearest-mean confusion, learned backbone" table={confusion.learned_backbone} caption="16 learned source features" />
    </div>
    <figcaption>Outlined cells on the diagonal are correct; lightly shaded cells are mistakes; filled cells are 4 or more mistakes in one place. For example, the 7 row, 6 column counts sevens whose nearest mean was the six mean. Produced by the feature-inspection program in section 3, from target training and validation rows only.</figcaption>
  </figure>;
}

/** The old head's summary of the same images, all three seeds. */
export function SourceVotesFigure() {
  const votes = seedOne.source_head_votes;
  const pct = features.seeds.map(s => Math.round(100 * s.saturated_share.learned_backbone));
  return <figure className="tb-figure" data-figure="transfer-source-votes">
    <div className="tb-table" role="region" tabIndex={0} aria-label="Source head votes on new digits"><table className="tb-votes"><caption>Seed 1. Rows are the true new digit; columns the old digit the unchanged source model names</caption><thead><tr><th scope="col">True digit</th>{[0, 1, 2, 3, 4].map(j => <th key={j} scope="col">“{j}”</th>)}</tr></thead><tbody>{Object.entries(votes).map(([digit, counts]) => <tr key={digit}><th scope="row">{digit}</th>{counts.map((count, j) => <td key={j} className={count >= 10 ? 'is-collision' : count ? 'is-some' : ''}>{count}</td>)}</tr>)}</tbody></table></div>
    <figcaption>Shaded cells hold at least one image; filled cells hold 10 or more. Fives called “3”: {features.seeds.map(s => s.source_head_votes['5'][3]).join(', ')} of 12 in seeds 1, 2, 3; nines called “3”: {features.seeds.map(s => s.source_head_votes['9'][3]).join(', ')}. Source training also pushed many features to tanh’s flat ends: {pct.join('%, ')}% of learned validation feature values are within 0.05 of ±1 in seeds 1, 2, 3; 0% for the random backbone.</figcaption>
  </figure>;
}

/** A rank-one weight change built from one input measurement and one output direction. */
export function OuterProductFigure() {
  const a = [1, -1], b = [1, 2], x = [2, 1];
  const delta = b.map(bi => a.map(aj => bi * aj));
  const measurement = a[0] * x[0] + a[1] * x[1];
  const full = delta.map(row => row[0] * x[0] + row[1] * x[1]);
  return <figure className="tb-figure" data-figure="transfer-outer-product">
    <div className="tb-outer">
      <div className="tb-outer-grid" role="table" aria-label="Outer product b times a">
        <div role="row" className="tb-outer-row"><span role="columnheader" className="tb-corner">b ↓ · a →</span>{a.map((value, j) => <span role="columnheader" key={j} className="tb-head">a{j + 1} = {fixed(value, 0)}</span>)}</div>
        {delta.map((row, i) => <div role="row" key={i} className="tb-outer-row"><span role="rowheader" className="tb-head">b{i + 1} = {b[i]}</span>{row.map((value, j) => <span role="cell" key={j} className="tb-outer-cell">{b[i]} × {fixed(a[j], 0)} = <strong>{fixed(value, 0)}</strong></span>)}</div>)}
      </div>
      <div className="tb-routes">
        <div><p className="tb-part-title">Route 1: multiply by the whole ΔW</p><p>ΔW x for x = (2, 1): row 1 gives 1·2 − 1·1 = {full[0]}; row 2 gives 2·2 − 2·1 = {full[1]}.</p><p className="tb-violet"><strong>Change = ({full.join(', ')})</strong></p></div>
        <div><p className="tb-part-title">Route 2: measure once, then distribute</p><p>a · x = 2 − 1 = <strong className="tb-violet">{measurement}</strong>. Multiply b by that one number: {measurement} × (1, 2).</p><p className="tb-violet"><strong>Change = ({b.map(v => v * measurement).join(', ')})</strong></p></div>
      </div>
    </div>
    <figcaption>Amber headers are the factors: the row a along the top, the column b down the side. The grid cells are their products, ΔW. Violet values are computed for this input x = (2, 1).</figcaption>
  </figure>;
}

const blockNames = { lower: 'Lower layer 64 → 32', upper: 'Upper layer 32 → 16', adapter: 'Adapter 16 → 4 → 16', head: 'New head 16 → 5' };
const stateWords = { trains: 'trains', added: 'added, trains', frozen: 'frozen' };

const presets = {
  scratch: { start: 'random', lower: true, upper: true, lora: false, adapter: false, slowLower: false },
  probe: { start: 'learned', lower: false, upper: false, lora: false, adapter: false, slowLower: false },
  partial: { start: 'learned', lower: false, upper: true, lora: false, adapter: false, slowLower: false },
  full: { start: 'learned', lower: true, upper: true, lora: false, adapter: false, slowLower: false },
  discriminative: { start: 'learned', lower: true, upper: true, lora: false, adapter: false, slowLower: true },
  lora2: { start: 'learned', lower: false, upper: false, lora: true, adapter: false, slowLower: false },
  adapter4: { start: 'learned', lower: false, upper: false, lora: false, adapter: true, slowLower: false },
};
const presetLabels = { scratch: 'Scratch', probe: 'Linear probe', partial: 'Partial: upper + head', full: 'Full fine-tuning', discriminative: 'Discriminative rates', lora2: 'LoRA rank 2', adapter4: 'Adapter width 4' };
const layerOptions = ['probe', 'partial', 'full', 'scratch'];
const measuredOptions = ['scratch', 'probe', 'full', 'discriminative', 'lora2', 'adapter4'];

/**
 * One network, one choice: which strategy.
 * stage "layers" (section 2): start point and which layers train; counts and the retention guarantee.
 * stage "all" (section 7): the six strategies the experiment ran, with their saved seed-1 results.
 */
export function TransferStrategyMap({ stage = 'layers' }) {
  const all = stage === 'all';
  const [choice, setChoice] = useState(all ? 'lora2' : 'probe');
  const plan = transferStrategy(presets[choice]);
  const run = all && experiment.runs.find(row => row.seed === 1 && row.method === plan.method);
  return <FlowLab id={'transfer-strategy-' + stage} label={all ? 'Measured strategies on one network' : 'Choose which layers may change'}>
    <ol className="tb-network" aria-label="Network blocks and their training state">
      <li className="tb-block is-input"><strong>64 pixels ÷ 16</strong><span>input; nothing to learn</span></li>
      {plan.blocks.map(block => { const state = block.name === 'head' ? 'added' : block.state; return <li key={block.name} className={'tb-block is-' + state}><strong>{blockNames[block.name]}</strong><span>{block.description}</span><span className="tb-block-count"><span className="tb-state-word">{stateWords[state]}</span> · {block.trainable.toLocaleString('en-US')} trainable</span></li>; })}
    </ol>
    <FlowControls>
      <FlowChoice label="Strategy" options={(all ? measuredOptions : layerOptions).map(key => [key, presetLabels[key]])} value={choice} onChange={setChoice} />
    </FlowControls>
    <FlowReadout>
      <span data-testid={'transfer-strategy-count-' + stage}>Trains <strong>{plan.trainable.toLocaleString('en-US')}</strong> of {plan.total.toLocaleString('en-US')} values ({plan.countExplanation.replace(/\.$/, '')}; counts include weights and biases).</span>{' '}
      <span data-testid={'transfer-strategy-retention-' + stage}>Old digits 0–4 afterwards: {plan.retention}</span>{!all && <>{' '}<span>The learning rates shown are the ones section 3 declares for the experiment.</span></>}
      {all && run && <>{' '}<span data-testid="transfer-strategy-result">Seed-1 result after 300 updates: validation cross-entropy <strong>{run.validation.ce.toFixed(6)}</strong>, <strong>{run.validation.correct}/60</strong> correct{run.source_after ? <>; afterwards the original head names <strong>{run.source_after.correct}/50</strong> source holdout images correctly ({run.source_before.correct}/50 before adaptation)</> : ''}.</span></>}
    </FlowReadout>
  </FlowLab>;
}

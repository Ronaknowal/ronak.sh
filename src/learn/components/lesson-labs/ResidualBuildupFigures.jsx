import { useState } from 'react';
import { anatomyState, identityRequirement, scalarChain, joinBoth, projectionBlock, highwayBlock, degradationTable, shortcutTable } from '../../data/residual-buildup-model.js';
import { FlowControls, FlowChoice, FlowSlider, FlowReadout } from './LessonFlow.jsx';
import './residual-buildup.css';

const fmt = value => {
  const rounded = Math.abs(value) < 5e-13 ? 0 : Number(value.toFixed(4));
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 4 }).replace('-', '−');
};
const term = value => value < 0 ? `(${fmt(value)})` : fmt(value);
const vec = values => `[${values.map(fmt).join(', ')}]`;
const mat = rows => `[${rows.map(vec).join(', ')}]`;

// A residual block drawn top to bottom: input, two routes, the join, optional direct-path operations, output.
// Positions stay fixed in backward mode so each part keeps its place; only the arrows and values change.
function Block({ input, skip, branch, join, after = [], output, backward = false, compact = false, skipRemoved = false }) {
  const arrow = <span className="rb-arrow" aria-hidden="true">{backward ? '⇡' : '↓'}</span>;
  return <div className={`rb-block${compact ? ' rb-block--compact' : ''}${backward ? ' rb-block--backward' : ''}`}>
    {input && <div className="rb-node rb-node--input"><span className="rb-tag">{input.tag}</span>{input.value && <b className="rb-value">{input.value}</b>}{input.note && <small>{input.note}</small>}</div>}
    {input && <div className="rb-lanes rb-fork" aria-hidden="true"><span>{backward ? '⇡ into x' : '↓ x'}</span><span>{backward ? '⇡ into x' : '↓ x'}</span></div>}
    <div className="rb-lanes">
      <div className={`rb-lane rb-lane--skip${skipRemoved ? ' rb-lane--removed' : ''}`}>
        <p className="rb-lane-title">{skip.title}</p>
        {skip.steps?.map((step, i) => <p key={i} className={`rb-step${step.learned ? ' rb-step--learned' : ''}`}>{step.label}{step.learned && <em> learned</em>}</p>)}
        {skip.value && <b className="rb-value">{skip.value}</b>}
      </div>
      <div className="rb-lane rb-lane--branch">
        <p className="rb-lane-title">{branch.title}</p>
        {branch.steps.map((step, i) => <p key={i} className={`rb-step${step.learned ? ' rb-step--learned' : ''}`}>{step.label}{step.learned && <em> learned</em>}</p>)}
        {branch.value && <b className="rb-value">{branch.value}</b>}
      </div>
    </div>
    <div className="rb-lanes rb-merge" aria-hidden="true"><span>{backward ? '⇡ g' : '↓ into ⊕'}</span><span>{backward ? '⇡ g' : '↓ into ⊕'}</span></div>
    <div className="rb-join"><span aria-hidden="true">⊕</span> {join}</div>
    {after.map((step, i) => <div key={i} className="rb-after">{arrow}<p className="rb-step rb-step--stream">{step} <em>on the direct path</em></p></div>)}
    {output && arrow}
    {output && <div className="rb-node rb-node--output"><span className="rb-tag">{output.tag}</span>{output.value && <b className="rb-value">{output.value}</b>}{output.note && <small>{output.note}</small>}</div>}
  </div>;
}

// The block with every number filled in. Forward: values flow down. Backward: derivatives flow up.
export function ResidualBlockAnatomy({ initialDirection = 'forward', allowBackward = true, id }) {
  const [direction, setDirection] = useState(initialDirection);
  const [weights, setWeights] = useState('lesson');
  const zeroBranch = weights === 'zero';
  const s = anatomyState(zeroBranch), backward = direction === 'backward';
  const w = s.weight;
  const forwardSteps = [
    { label: `weights W = ${mat(w)}`, learned: true },
    { label: `c₁ = ${term(w[0][0])} × 2 + ${term(w[0][1])} × (−1) = ${fmt(s.correction[0])}` },
    { label: `c₂ = ${term(w[1][0])} × 2 + ${term(w[1][1])} × (−1) = ${fmt(s.correction[1])}` },
  ];
  const backwardSteps = [
    { label: `receives g = ${vec(s.upstream)}` },
    { label: `to its input: Wᵀg = ${vec(s.branchGradient)}` },
    { label: `to its weights: g xᵀ = ${mat(s.weightGradient)}`, learned: true },
  ];
  return <figure className="rb-figure" data-figure="residual-block-anatomy" id={id}>
    {backward
      ? <Block backward
          input={{ tag: 'input x = [2, −1]', value: `∂L/∂x = g + Wᵀg = ${vec(s.totalGradient)}`, note: 'The two routes’ contributions add here.' }}
          skip={{ title: 'Skip passes g back unchanged', value: vec(s.upstream) }}
          branch={{ title: 'Branch F', steps: backwardSteps, value: vec(s.branchGradient) }}
          join="The addition sends the same g into both routes"
          output={{ tag: `output y = ${vec(s.output)}, target t = [1, 0]`, value: `g = ∂L/∂y = y − t = ${vec(s.upstream)}`, note: `Loss L = ½‖y − t‖² = ${fmt(s.loss)}` }} />
      : <Block
          input={{ tag: 'input x', value: vec(s.input), note: 'Two numbers describing one example (supplied).' }}
          skip={{ title: 'Skip · identity', steps: [{ label: 'copies x, computes nothing, has no weights' }], value: vec(s.input) }}
          branch={{ title: 'Branch F(x) = Wx', steps: forwardSteps, value: `F(x) = [c₁, c₂] = ${vec(s.correction)}` }}
          join="Add matching coordinates"
          output={{ tag: 'output y = x + F(x)', value: vec(s.output) }} />}
    <FlowControls>
      {allowBackward && <FlowChoice label="Show" value={direction} onChange={setDirection} options={[['forward', 'Forward values'], ['backward', 'Backward derivatives']]} />}
      <FlowChoice label="Branch weights" value={weights} onChange={setWeights} options={[['lesson', 'W from the text'], ['zero', 'All zero']]} />
    </FlowControls>
    <FlowReadout>{backward
      ? <><span className="rb-ink--backward">g</span> + <span className="rb-ink--backward">Wᵀg</span> = <span className="rb-ink--backward">{vec(s.upstream)}</span> + <span className="rb-ink--backward">{vec(s.branchGradient)}</span> = <strong>{vec(s.totalGradient)}</strong>. {zeroBranch
        ? 'With a zero branch only the skip carries g back, yet the branch weights still receive g xᵀ, so they can start learning.'
        : 'The second coordinate nearly cancels: −0.5 + 0.45 = −0.05.'}</>
      : <><span className="rb-ink--skip">x</span> + <span className="rb-ink--branch">F(x)</span> = <span className="rb-ink--skip">{vec(s.input)}</span> + <span className="rb-ink--branch">{vec(s.correction)}</span> = <strong>{vec(s.output)}</strong>{zeroBranch ? ': with every branch weight at 0 the output equals the input exactly.' : '.'}</>}</FlowReadout>
  </figure>;
}

// Plain block y = F(x) beside residual block y = x + F(x), on the same branch.
export function IdentityRequirementFigure() {
  const [branch, setBranch] = useState('linear');
  const [setting, setSetting] = useState('zero');
  const s = identityRequirement(branch, setting);
  const branchLabel = branch === 'tanh' ? 'F(x) = W₂ tanh(W₁x), W₁ = I' : 'F(x) = Wx';
  const weightName = branch === 'tanh' ? 'W₂' : 'W';
  const verdict = keeps => keeps ? 'equals x: the block changes nothing' : 'differs from x';
  return <figure className="rb-figure" data-figure="residual-identity-requirement">
    <p className="rb-mono">x = [2, −1] · {branchLabel}{branch === 'tanh' && <> · tanh(x) = {vec(s.hidden)}</>} · F(x) = <span className="rb-ink--branch">{vec(s.correction)}</span></p>
    <div className="rb-compare flow-columns-2">
      <section className={s.plainKeepsX ? 'rb-ok' : ''}><h5>Plain block · y = F(x)</h5><p className="rb-value">{vec(s.plain)}</p><p>{verdict(s.plainKeepsX)}</p></section>
      <section className={s.residualKeepsX ? 'rb-ok' : ''}><h5>Residual block · y = x + F(x)</h5><p className="rb-value">{vec(s.residual)}</p><p>{verdict(s.residualKeepsX)}</p></section>
    </div>
    <FlowControls>
      <FlowChoice label="Branch" value={branch} onChange={setBranch} options={[['linear', 'One matrix Wx'], ['tanh', 'Two layers with tanh']]} />
      <FlowChoice label={`${weightName} set to`} value={setting} onChange={setSetting} options={[['zero', 'All zero'], ['identity', 'Identity I']]} />
    </FlowControls>
    <FlowReadout>{branch === 'tanh'
      ? (setting === 'zero' ? 'With W₂ = 0 the residual block returns x exactly; the plain block returns [0, 0].' : 'With W₂ = I the plain block returns tanh(x), squeezed into (−1, 1), not x; the residual block adds that squeezed value to x.')
      : (setting === 'zero' ? 'With W = 0 the residual block returns x; the plain block returns [0, 0].' : 'With W = I the plain block returns x; the residual block returns 2x.')}</FlowReadout>
  </figure>;
}

function stackCaption(s, slope, skips) {
  const near = value => Math.abs(value) < 1e-9;
  if (!skips) {
    if (near(Math.abs(slope) - 1)) return slope > 0 ? 'A well-scaled plain stack: each layer has gain 1, so the derivative stays 1 with no skips at all. Good initialization does this; the Weight Initialization lesson chose scales for exactly this reason. What this toy stack lacks is an easy “change nothing” setting: each scalar branch must equal its input, not zero.' : `Each layer has gain magnitude 1, so the derivative keeps magnitude 1 but flips sign at every layer: three layers give ${fmt(s.total)}. The size of the signal is preserved without skips; its sign alternates.`;
    return `Without skips every value passes through every branch, so the derivative is a³ = ${fmt(s.total)}. Branch gain ${fmt(Math.abs(slope))} per layer is a badly scaled plain network: ${Math.abs(slope) < 1 ? 'the product vanishes' : 'the product grows'} with depth.`;
  }
  if (!near(s.lambda - 1)) return `The skip is no longer an identity. Its purely direct term is λ³ = ${fmt(s.directTerm)}${s.lambda < 1 ? ', shrinking with every added block' : ', growing with every added block'}, whatever the branches do. He et al. 2016 tested λ = 0.5 and several other modified shortcuts in ResNet-110; all trained worse than the identity (table below).`;
  if (near(s.multiplier)) return 'At a = −1 each branch cancels its skip exactly: skips everywhere, yet the derivative is 0.';
  if (Math.abs(s.multiplier) < 0.02) return `Each branch nearly cancels its skip: 1 + a = ${fmt(s.multiplier)}, so three blocks give ${fmt(s.total)}.`;
  if (Math.abs(slope) <= 0.1 + 1e-9) return `Small branches keep each block's gain near 1.`;
  return `Each block multiplies by 1 + a = ${fmt(s.multiplier)}, so three blocks give ${fmt(s.total)}. Skips do not stop a product of imperfect gains from growing or shrinking with depth.`;
}

// Three scalar blocks in a row. mode "skips": slope and skips on/off. mode "lambda": scale the skip by λ.
export function ResidualStackFigure({ id, mode = 'skips' }) {
  const [slopeChoice, setSlope] = useState(0.1);
  const slope = mode === 'lambda' ? 0 : slopeChoice;
  const [skipChoice, setSkipChoice] = useState('on');
  const [skipScale, setSkipScale] = useState(mode === 'lambda' ? 0.5 : 1);
  const skips = mode === 'lambda' ? true : skipChoice === 'on';
  const lambda = mode === 'lambda' ? skipScale : 1;
  const s = scalarChain(slope, skips, 3, 1, lambda);
  const identity = skips && Math.abs(lambda - 1) < 1e-9;
  const perBlock = !skips ? 'a' : identity ? '1 + a' : 'λ + a';
  const sub = '₀₁₂₃';
  return <figure className="rb-figure" data-figure={mode === 'lambda' ? 'residual-stack-lambda' : 'residual-stack'} id={id}>
    <ol className="rb-chain">
      <li className="rb-chain-state"><span>x₀ = {fmt(s.values[0])}</span><span className="rb-sens">∂x₃/∂x₀ = {fmt(s.sensitivities[0])}</span></li>
      {s.corrections.map((correction, k) => <li key={k} className="rb-chain-block">
        <div className={`rb-chain-lane rb-lane--skip${skips ? '' : ' rb-lane--removed'}`}>{skips ? (identity ? `skip carries x${sub[k]}` : `skip carries ${fmt(lambda)} × x${sub[k]} = ${fmt(lambda * s.values[k])}`) : '× skip removed'}</div>
        <div className="rb-chain-lane rb-lane--branch">block {k + 1}: F{sub[k]} = a × x{sub[k]} = {fmt(correction)}</div>
        <div className="rb-chain-state"><span>x{sub[k + 1]} = {skips ? `${fmt(lambda * s.values[k])} + ${term(correction)} = ` : ''}{fmt(s.values[k + 1])}</span><span className="rb-sens">∂x₃/∂x{sub[k + 1]} = {fmt(s.sensitivities[k + 1])}</span></div>
      </li>)}
    </ol>
    <FlowControls>
      {mode === 'lambda'
        ? <FlowSlider name="Skip multiplier λ" value={skipScale} onChange={setSkipScale} min={0} max={1.5} step={0.05} format={fmt} />
        : <><FlowChoice label="Skips" value={skipChoice} onChange={setSkipChoice} options={[['on', 'Keep the skips'], ['off', 'Remove the skips']]} />
      <FlowSlider name="Branch slope a" value={slope} onChange={setSlope} min={-1.5} max={1.5} step={0.05} format={fmt} /></>}
    </FlowControls>
    <FlowReadout>Final value x₃ = <strong>{fmt(s.values[3])}</strong>; end-to-end derivative ∂x₃/∂x₀ = {skips ? `(${perBlock})³` : 'a³'} = {term(s.multiplier)}³ = <strong>{fmt(s.total)}</strong>.{stackCaption(s, slope, skips)}</FlowReadout>
  </figure>;
}

// Four published blocks drawn in one layout; the only difference is where operations sit.
export function ResidualPlacementFigure() {
  const designs = [
    { title: 'Original ResNet', source: 'He et al. 2015 Fig. 2, with BatchNorm after each weight (§3.4); Torchvision BasicBlock', steps: ['weight', 'BatchNorm', 'ReLU', 'weight', 'BatchNorm'], after: ['ReLU'] },
    { title: 'Full pre-activation ResNet', source: 'He et al. 2016 Fig. 1(b)', steps: ['BatchNorm', 'ReLU', 'weight', 'BatchNorm', 'ReLU', 'weight'], after: [] },
    { title: 'Post-norm Transformer sublayer', source: 'Vaswani et al. 2017', steps: ['attention or MLP'], after: ['LayerNorm'] },
    { title: 'Pre-norm Transformer sublayer', source: 'GPT-2 and many later language models', steps: ['LayerNorm', 'attention or MLP'], after: [] },
  ];
  return <figure className="rb-figure" data-figure="residual-placement">
    <div className="flow-columns-2">{designs.map(design => <section key={design.title}><h5>{design.title}</h5><p className="rb-source">{design.source}</p>
      <Block compact input={{ tag: 'x' }} skip={{ title: 'identity' }} branch={{ title: 'branch', steps: design.steps.map(label => ({ label })) }} join="add" after={design.after} output={{ tag: design.after.length ? 'y' : 'y: skip value reaches the output untouched' }} />
    </section>)}</div>
  </figure>;
}

// Shapes differ: the skip becomes a 3×2 projection.
export function ResidualProjectionDiagram() {
  const s = projectionBlock();
  return <figure className="rb-figure" data-figure="residual-projection">
    <Block
      input={{ tag: 'input x · 2 features', value: vec(s.input) }}
      skip={{ title: 'Skip · projection P (3×2)', steps: [{ label: `P = ${mat(s.projection)}`, learned: true }, { label: 'row 3 means “x₁ + x₂”' }], value: `Px = ${vec(s.skip)}` }}
      branch={{ title: 'Branch F: must output 3 features', steps: [{ label: 'its own layers', learned: true }], value: `F(x) = ${vec(s.correction)}` }}
      join="Add: both inputs now have 3 coordinates"
      output={{ tag: 'output y · 3 features', value: vec(s.output) }} />
  </figure>;
}

// The whole classifier used in the experiment, with tensor shapes.
export function DigitNetworkDiagram() {
  return <figure className="rb-figure" data-figure="residual-digit-network">
    <div className="rb-network">
      <div className="rb-node rb-node--input"><span className="rb-tag">pixels / 16 (supplied)</span><b className="rb-value">[N, 64]</b></div>
      <span className="rb-arrow" aria-hidden="true">↓</span>
      <div className="rb-node"><span className="rb-tag">stem: Linear 64 → 32, then tanh</span><b className="rb-value">h₀ [N, 32]</b></div>
      <span className="rb-arrow" aria-hidden="true">↓</span>
      <div className="rb-repeat"><p className="rb-repeat-label">× L blocks</p>
        <Block compact skip={{ title: 'identity [N, 32]', steps: [{ label: 'hₖ unchanged in the three residual modes' }] }} branch={{ title: 'branch F [N, 32]', steps: [{ label: 'LayerNorm', learned: true }, { label: 'Linear 32 → 32', learned: true }, { label: 'tanh' }, { label: 'Linear 32 → 32', learned: true }, { label: '× scale: 1, 1/√L, or a learned α that starts at 0' }] }} join="hₖ₊₁ = hₖ + scale × F(hₖ)" />
        <p className="rb-note">Plain mode deletes the skip lane and returns F(hₖ).</p>
      </div>
      <span className="rb-arrow" aria-hidden="true">↓</span>
      <div className="rb-node"><span className="rb-tag">head: Linear 32 → 10</span><b className="rb-value">logits [N, 10]</b></div>
      <span className="rb-arrow" aria-hidden="true">↓</span>
      <div className="rb-node rb-node--output"><span className="rb-tag">cross-entropy with the true digits</span><b className="rb-value">one scalar loss</b></div>
    </div>
  </figure>;
}

export function AddConcatFigure() {
  const s = joinBoth();
  const cells = (values, kinds) => <span className="rb-cells">{values.map((value, i) => <span key={i} className={`rb-cell rb-cell--${kinds[i]}`}>{fmt(value)}</span>)}</span>;
  return <figure className="rb-figure" data-figure="residual-add-concat">
    <div className="rb-compare flow-columns-2">
      <section><h5>Addition (ResNet): 2 numbers</h5>{cells(s.added, ['mixed', 'mixed'])}<p>Each output mixes one <span className="rb-ink--skip">skip value</span> with its matching <span className="rb-ink--branch">correction</span>; the width never grows.</p></section>
      <section><h5>Concatenation (DenseNet): 4 numbers</h5>{cells(s.concatenated, ['skip', 'skip', 'branch', 'branch'])}<p>The <span className="rb-ink--skip">skip values</span> and the <span className="rb-ink--branch">correction</span> stay in separate positions; the next layer sees a wider input.</p></section>
    </div>
  </figure>;
}

export function HighwayBlockDiagram() {
  const s = highwayBlock();
  const closedStart = highwayBlock(1, -3);
  return <figure className="rb-figure" data-figure="residual-highway">
    <Block
      input={{ tag: 'input x', value: fmt(s.x), note: <>gate T(x) = sigmoid(w<sub>T</sub>x + b<sub>T</sub>) = {fmt(s.gate)}, between 0 and 1, with gate weights w<sub>T</sub> = 1, b<sub>T</sub> = 0 <em className="rb-inline-tag">learned</em></>}}
      skip={{ title: 'Carry route', steps: [{ label: `⊗ (1 − T) = ${fmt(1 - s.gate)}` }], value: fmt(s.carry) }}
      branch={{ title: 'Transform route H', steps: [{ label: `H(x) = 2x = ${fmt(s.transform)}`, learned: true }, { label: `⊗ T = ${fmt(s.gate)}` }], value: fmt(s.carried) }}
      join="Add the two scaled routes"
      output={{ tag: 'output y', value: fmt(s.output) }} />
    <figcaption>With gate bias b<sub>T</sub> = −3 the same block gives T = {fmt(closedStart.gate)} and output {fmt(closedStart.output)}, close to x = 1: it starts mostly carrying its input.</figcaption>
  </figure>;
}

export function DegradationTable() {
  return <figure className="rb-figure" data-figure="residual-degradation">
    <div className="rb-table" role="region" tabIndex={0} aria-label="He et al. 2015 Table 2, top-1 error"><table><caption>ImageNet validation top-1 error (%, 10-crop; lower is better), He et al. 2015, Table 2</caption><thead><tr><th scope="col">Depth</th><th scope="col">Plain</th><th scope="col">ResNet (same layers + identity skips)</th></tr></thead><tbody>{degradationTable.map(row => <tr key={row.depth}><th scope="row">{row.depth} layers</th><td>{row.plain.toFixed(2)}</td><td>{row.residual.toFixed(2)}</td></tr>)}</tbody></table></div>
  </figure>;
}

export function ShortcutVariantsTable() {
  return <figure className="rb-figure" data-figure="residual-shortcut-variants">
    <div className="rb-table" role="region" tabIndex={0} aria-label="He et al. 2016 Table 1 excerpt, test error by shortcut"><table><caption>ResNet-110 on CIFAR-10 with every unit's shortcut changed (He et al. 2016, Table 1 excerpt). Test error %; “fail” means above 20%.</caption><thead><tr><th scope="col">Shortcut</th><th scope="col">Skip ×</th><th scope="col">Branch ×</th><th scope="col">Error %</th></tr></thead><tbody>{shortcutTable.map((row, i) => <tr key={i}><th scope="row">{row.variant}</th><td>{row.shortcut}</td><td>{row.branch}</td><td>{row.error}</td></tr>)}</tbody></table></div>
  </figure>;
}

// A zero last layer leaves the block an identity; whether the branch can start learning depends on its last operation.
export function ResidualZeroBranchFigure() {
  const [last, setLast] = useState('linear');
  const relu = last === 'relu';
  const steps = [
    { label: 'W₁ = I → h = φ(W₁x) = [1, 2]', learned: true },
    { label: 'W₂ = 0 → W₂h = [0, 0]', learned: true },
    ...(relu ? [{ label: 'ReLU(W₂h) = [0, 0]' }] : []),
  ];
  return <figure className="rb-figure" data-figure="residual-zero-branch">
    <Block
      input={{ tag: 'input x', value: '[1, 2]' }}
      skip={{ title: 'Skip · identity', value: '[1, 2]' }}
      branch={{ title: relu ? 'Branch F ending in ReLU' : 'Branch F ending in a linear layer', steps, value: 'F(x) = [0, 0]' }}
      join="Add matching coordinates"
      output={{ tag: 'output y = x + F(x), loss ½‖y‖² = 2.5', value: '[1, 2]', note: 'g = ∂L/∂y = y = [1, 2] enters from below' }} />
    <FlowControls>
      <FlowChoice label="Branch's last operation" value={last} onChange={setLast} options={[['linear', 'Linear W₂h'], ['relu', 'ReLU after W₂h']]} />
    </FlowControls>
    <FlowReadout>{relu
      ? <>ReLU's derivative at 0 is 0 in PyTorch, so no gradient passes below it: <span className="rb-ink--backward">∇W₂ = [[0, 0], [0, 0]]</span> and <span className="rb-ink--backward">∇W₁ = 0</span>. The block passes x through, yet its branch cannot begin learning.</>
      : <>The gradient reaches the last layer: <span className="rb-ink--backward">∇W₂ = g hᵀ = [[1, 2], [2, 4]]</span>. It does not yet reach W₁, because W₂ᵀg = [0, 0]; after W₂ moves, it will.</>}</FlowReadout>
  </figure>;
}

import { useState } from 'react';
import { colors, initialPrompt, realRows, query, WK, WV, head, inputAttention,
  promptStep, finitePrompt, inputPositions } from '../../data/soft-prompt-models.js';
import { Figure, Controls, Select, Range, Check, Scroll, Matrix, Lanes, Mask, Bars,
  Operation, Arrow, fmt, vec, useObservation, ObservationState } from './SoftPromptShared.jsx';

const rowIdentityColors = [colors.prompt, colors.taskB, colors.real, colors.value];

export function SoftSharedBase() {
  const [task, setTask] = useState('sentiment');
  const chosen = task === 'sentiment' ? colors.prompt : colors.taskB;
  return <Figure id="P01" caption="Two task-owned arrays share one frozen base. This routing drawing shows parameter ownership and differentiation, without invented task-quality outputs.">
    <div className="soft-comparison">
      <Matrix title="Sentiment task rows φA" rows={initialPrompt} rowLabels={['A0', 'A1']} color={colors.prompt} />
      <Matrix title="Extraction task rows φB — constructed" rows={[[.1, .3], [-.2, .4]]} rowLabels={['B0', 'B1']} color={colors.taskB} />
    </div>
    <Arrow color={chosen}>Selected {task} array ↓ joins real token vectors</Arrow>
    <Scroll label="Shared base with an activation derivative through its frozen blocks">
      <svg viewBox="0 0 576 260" className="soft-network" role="img" aria-label="Selected task inputs pass through two frozen residual blocks to logits and loss; the derivative returns to the selected task array.">
        <g fill="none" stroke={colors.fixed} strokeWidth="1.5">
          <path d="M288 15V245" />
          {[45, 120].map(y => <g key={y}><rect x="160" y={y} width="255" height="46" fill="#20252d" />
            <path d={`M415 ${y + 40}H443V${y + 6}H415`} /></g>)}
          <path d="M160 221H99V20H160" stroke={chosen} strokeWidth="2" strokeDasharray="6 4" />
          <path d="M151 15L160 20L151 25" stroke={chosen} />
        </g>
        <text x="288" y="10" textAnchor="middle" style={{ fill: chosen }}>task vectors + real vectors</text>
        <text x="288" y="74" textAnchor="middle">frozen block θ₀</text>
        <text x="288" y="149" textAnchor="middle">frozen block θ₁</text>
        <text x="288" y="204" textAnchor="middle">fixed output head → answer loss</text>
        <text x="72" y="105" textAnchor="middle" style={{ fill: chosen }}>∂L/∂φ</text>
        <text x="288" y="252" textAnchor="middle">θ values stay fixed; activation derivatives flow</text>
      </svg>
    </Scroll>
    <Controls><Select label="Task state to route" value={task} options={[
      ['sentiment', 'Sentiment φA'], ['extraction', 'Extraction φB']]} onChange={setTask} /></Controls>
    <Operation>Shared θ identity: the same frozen blocks in both routes. Only the selected task array receives its loss derivative.</Operation>
  </Figure>;
}

export function SoftThreeChoices() {
  const [cut, setCut] = useState(false);
  const [baseMoves, setBaseMoves] = useState(false);
  return <Figure id="P02" caption="Target selection, attention visibility and parameter ownership are separate decisions. A no_grad forward cuts the needed derivative even if the prompt was declared trainable.">
    <Lanes label="Targets and context aligned on one response" rows={[
      { name: 'input positions', values: ['P0', 'P1', 'BOS', 'verse', 'positive', 'EOS'], colors: [colors.prompt, colors.prompt, ...Array(4).fill(colors.real)] },
      { name: 'target loss counts?', values: ['no', 'no', 'no', 'no', 'yes', 'yes'], color: colors.target },
      { name: 'visible to verse query?', values: ['yes', 'yes', 'yes', 'yes', 'future ×', 'future ×'], color: colors.real },
    ]} />
    <div className="soft-comparison">
      <div><Operation color={colors.prompt}>Trainable φ → fixed forward operations → response loss</Operation>
        <Arrow color={cut ? colors.blocked : colors.prompt}>{cut ? '× no_grad removes the autograd graph' : '← derivative through fixed matrices ←'}</Arrow>
        <Operation color={colors.prompt}>{cut ? 'No loss-to-prompt derivative is available.' : 'Prompt derivative remains available.'}</Operation></div>
      <div><Operation color={colors.fixed}>θ values: {baseMoves ? 'included as trainable parameters' : 'requires_grad = false'}</Operation>
        <Arrow>optimizer parameter list</Arrow>
        <Operation color={baseMoves ? colors.target : colors.prompt}>{baseMoves ? 'θ and φ may move: a different tuning recipe' : 'Only φ may move; θ remains exact'}</Operation></div>
    </div>
    <Controls><Check label="Wrap the forward in no_grad (broken training path)" checked={cut} onChange={setCut} />
      <Check label="Also make base parameters trainable" checked={baseMoves} onChange={setBaseMoves} /></Controls>
    <p>{cut ? 'Changing the optimizer list cannot repair a graph that was never recorded.'
      : 'eval() can keep dropout deterministic while this derivative graph remains live.'}</p>
  </Figure>;
}

export function SoftVectors() {
  const [coordinate, setCoordinate] = useState(.2);
  const embeddings = [[.2, .1], [-.4, .5], [.7, -.2]];
  const row = [coordinate, -.4];
  const distances = embeddings.map(values => Math.hypot(...values.map((value, i) => value - row[i])));
  const closest = distances.indexOf(Math.min(...distances));
  return <Figure id="P03" caption="A constructed vocabulary table makes the two input routes visible. Continuous rows have coordinates but no required vocabulary ID. Nearest distance is only a geometric diagnostic.">
    <div className="soft-comparison"><div>
      <Matrix title="Fixed embedding table E: ID selects a stored row" rows={embeddings} rowLabels={['ID 0', 'ID 1', 'ID 2']} color={colors.real} selectedRows={[1]} />
      <Arrow color={colors.real}>real ID 1 → E[1] = [−0.4, 0.5]</Arrow>
    </div><div><Matrix title="Learned P: values supplied directly" rows={[row, initialPrompt[1]]}
      rowLabels={['P0', 'P1']} color={colors.prompt} selected={[0, 0]} />
      <Arrow color={colors.prompt}>bypass ID lookup ↓</Arrow></div></div>
    <Matrix title="Common input-vector interface [P; E(x)]" rows={[row, initialPrompt[1], embeddings[1]]}
      rowLabels={['virtual 0', 'virtual 1', 'real ID 1']}
      rowColors={[colors.prompt, colors.prompt, colors.real]} />
    <Controls reset={() => setCoordinate(.2)}><Range label="P0 coordinate 0" value={coordinate} min={-1} max={1} onChange={setCoordinate} /></Controls>
    <p>Nearest stored row: ID {closest}, Euclidean distance {fmt(distances[closest])}. Editing P0 leaves every E row unchanged; the nearest ID does not translate the learned prompt into a word.</p>
  </Figure>;
}

export function SoftPositions() {
  const [count, setCount] = useState(2);
  const layout = inputPositions(count);
  return <Figure id="P04" caption="Target-style labels belong to target positions; the immediately preceding output predicts them. White outlines mark the two predictor rows. Virtual and instruction targets are ignored, while their context remains visible.">
    <Lanes label="Expanded input and target positions" rows={[
      { name: 'expanded position', values: layout.tokens.map((_, i) => i), selected: layout.predictors },
      { name: 'input', values: layout.tokens, colors: layout.tokens.map((_, i) => i < count ? colors.prompt : colors.real) },
      { name: 'target label', values: layout.targets, color: colors.target },
    ]} />
    <Mask rows={layout.mask} columns={layout.tokens} labels={layout.tokens} active={count + 1} prefix={count} />
    <Controls reset={() => setCount(2)}><Range label="Virtual input rows m" min={0} max={3} step={1} value={count} onChange={setCount} /></Controls>
    <output className="soft-result">A: target {count + 2} ← predictor {count + 1}. EOS: target {count + 3} ← predictor {count + 2}.</output>
    <p>{count === 0 ? 'No virtual rows: this is the ordinary real-token position layout.' : 'Changing m shifts indices while preserving the identities of both selected targets.'}</p>
  </Figure>;
}

export function SoftProjection() {
  const [coordinate, setCoordinate] = useState(.2);
  const prompt = [[coordinate, -.4], initialPrompt[1]];
  const result = inputAttention(prompt);
  return <Figure id="P05" caption="One fixed real query reads two prompt rows and two real rows. Editing the source coordinate updates both its key and value through their fixed matrices. The colours preserve each branch's role.">
    <Matrix title="Source rows: two coordinates per row" rows={[...prompt, ...realRows]} rowLabels={['P0', 'P1', 'real 0', 'real 1']} rowColors={rowIdentityColors} selected={[0, 0]} />
    <div className="soft-comparison"><div><Arrow color={colors.key}>× W_K → key branch</Arrow>
      <Matrix title="Fixed W_K" rows={WK} color={colors.fixed} />
      <Matrix title="K = source × W_K" rows={result.keys} rowLabels={['P0', 'P1', 'real 0', 'real 1']} rowColors={rowIdentityColors} />
    </div><div><Arrow color={colors.value}>× W_V → value branch</Arrow>
      <Matrix title="Fixed W_V" rows={WV} color={colors.fixed} />
      <Matrix title="V = source × W_V" rows={result.values} rowLabels={['P0', 'P1', 'real 0', 'real 1']} rowColors={rowIdentityColors} />
    </div></div>
    <Operation color={colors.real}>q = {vec(query)}. Each score s_j = (q₀K_j0 + q₁K_j1) / √2.</Operation>
    <Lanes label="Scores become normalized attention weights" rows={[
      { name: 'key identity', values: ['P0', 'P1', 'real 0', 'real 1'], colors: rowIdentityColors },
      { name: 'score', values: result.scores.map(value => fmt(value)), colors: rowIdentityColors },
      { name: 'softmax weight', values: result.weights.map(value => fmt(value)), colors: rowIdentityColors },
    ]} />
    <Controls reset={() => setCoordinate(.2)}><Range label="P0 coordinate 0 — both K and V change" value={coordinate} min={-1} max={1} onChange={setCoordinate} /></Controls>
    <output className="soft-result">Attention mass sums to {fmt(result.weights.reduce((a, b) => a + b, 0))}.</output>
  </Figure>;
}

export function SoftReadout() {
  const [target, setTarget] = useState(0);
  const result = inputAttention(initialPrompt, target);
  const contributions = result.values.map((row, i) => row.map(value => value * result.weights[i]));
  return <Figure id="P06" caption="Each output coordinate adds the four corresponding weighted value coordinates. The fixed head finishes this constructed two-class calculation; changing the target changes the loss and derivative, not the forward probabilities.">
    <Matrix title="Contributions a_j × V_j to the output" rows={contributions} rowLabels={['P0', 'P1', 'real 0', 'real 1']} rowColors={rowIdentityColors} />
    <Arrow>sum down each coordinate ↓</Arrow>
    <Operation color={colors.value}>o = {vec(result.output)}</Operation>
    <Matrix title="Fixed classifier C — output coordinates × classes" rows={head} columns={['class 0', 'class 1']} />
    <Arrow>o C → logits {vec(result.logits)} → softmax</Arrow>
    <Bars label="Two class probabilities" names={['class 0', 'class 1']} values={result.probabilities} />
    <Controls><Select label="Target class" value={target} options={[[0, 'Class 0'], [1, 'Class 1']]} onChange={value => setTarget(Number(value))} /></Controls>
    <output className="soft-result">Loss = −log({fmt(result.probabilities[target])}) = {fmt(result.loss)}.</output>
    <p>Logit derivative p − onehot(target) = {vec(result.dLogits)}.</p>
  </Figure>;
}

export function SoftBackward() {
  const [target, setTarget] = useState(0);
  const [rate, setRate] = useState(.2);
  const [coordinate, setCoordinate] = useState('0,0');
  const [row, column] = coordinate.split(',').map(Number);
  const result = promptStep(initialPrompt, rate, target);
  const finite = finitePrompt(initialPrompt, row, column, target);
  return <Figure id="P07" caption="The prompt receives two derivative paths. Fixed matrices participate in this chain without changing their values. The single-query fixture has no prompt-query path; a full decoder later includes that additional dependence.">
    <Operation color={colors.target}>class error z̄ = {vec(result.before.dLogits)} → fixed Cᵀ → ō = {vec(result.before.dOutput)}</Operation>
    <div className="soft-comparison"><div><Arrow color={colors.key}>ō → ā → softmax derivative → s̄ → K̄</Arrow>
      <Matrix title="Key path K̄_P W_Kᵀ" rows={result.before.keyPath} color={colors.key} selected={[row, column]} />
    </div><div><Arrow color={colors.value}>ō → attention-weighted V̄</Arrow>
      <Matrix title="Value path V̄_P W_Vᵀ" rows={result.before.valuePath} color={colors.value} selected={[row, column]} /></div></div>
    <Arrow>add the two coordinate derivatives ↓</Arrow>
    <Matrix title="Total derivative P̄" rows={result.before.gradient} color={colors.prompt} selected={[row, column]} />
    <Matrix title="One update P − η P̄" rows={result.updated} color={colors.prompt} selected={[row, column]} />
    <Controls reset={() => { setRate(.2); setTarget(0); setCoordinate('0,0'); }}>
      <Range label="Learning rate η" value={rate} min={0} max={1} step={.05} onChange={setRate} />
      <Select label="Target" value={target} options={[[0, 'Class 0'], [1, 'Class 1']]} onChange={value => setTarget(Number(value))} />
      <Select label="Derivative coordinate" value={coordinate} options={['0,0', '0,1', '1,0', '1,1'].map(key => [key, `P[${key}]`])} onChange={setCoordinate} />
    </Controls>
    <output className="soft-result">Loss {fmt(result.before.loss)} → {fmt(result.after.loss)}. {rate === 0 ? 'Zero rate preserves every prompt value.' : 'One computed step; no fitted performance claim.'}</output>
    <p>Central difference at ε = 10⁻⁶: {fmt(finite, 8)}; manual derivative: {fmt(result.before.gradient[row][column], 8)}. W_K, W_V and C are unchanged.</p>
  </Figure>;
}

export function DecoderDiagram({ layer = 0, prefix = false }) {
  return <Scroll label={prefix ? 'Real-token decoder with separate per-layer key and value memory' : 'Complete two-block decoder with virtual and real rows'}>
    <svg className="soft-network" viewBox="0 0 576 652" role="img" aria-label="Input embeddings and positions enter two complete pre-normalized Transformer blocks, each with attention and feed-forward residual paths, then final normalization and output head.">
      <text x="280" y="24" textAnchor="middle" style={{ fill: colors.real }}>{prefix ? '4 real rows × width 8' : 'P0 P1 + 4 real rows → 6 × 8'}</text>
      <path d="M280 34V70" stroke={colors.real} fill="none" />
      <text x="280" y="57" textAnchor="middle">embeddings + positions</text>
      {[0, 1].map(index => {
        const top = 85 + index * 240;
        return <g key={index}>
          <rect x="162" y={top} width="238" height="210" fill="none" stroke={index === layer ? '#f0f2f5' : '#596374'} strokeWidth={index === layer ? 2 : 1} />
          <text x="176" y={top + 21}>block {index}</text>
          <path d={`M280 ${top}V${top + 206}`} stroke={colors.fixed} fill="none" />
          <path d={`M280 ${top + 30}H418V${top + 105}H280 M280 ${top + 117}H437V${top + 188}H280`} stroke={colors.real} fill="none" />
          {[['LN₁ → Q/K/V', 40], ['causal attention → W_O', 75], ['+ residual', 110], ['LN₂ → FFN', 150], ['+ residual', 190]].map(([text, dy]) =>
            <g key={dy}><rect x="179" y={top + dy - 17} width="204" height="26" fill="#20252d" />
              <text x="281" y={top + dy} textAnchor="middle">{text}</text></g>)}
          {prefix && <g><rect x="12" y={top + 37} width="120" height="54" fill="none" stroke={colors.prompt} />
            <text x="72" y={top + 58} textAnchor="middle" style={{ fill: colors.prompt }}>Kᵖ{index} / Vᵖ{index}</text>
            <text x="72" y={top + 80} textAnchor="middle">each 2 × 8</text>
            <path d={`M132 ${top + 72}H179`} stroke={colors.prompt} fill="none" /></g>}
          {!prefix && <text x="25" y={top + 105} style={{ fill: colors.prompt }}>P rows ↓</text>}
          <text x="455" y={top + 106} style={{ fill: colors.real }}>skip</text>
          <path d={`M280 ${top + 210}V${top + 239}`} stroke={colors.fixed} />
        </g>;
      })}
      <text x="280" y="590" textAnchor="middle">final LN → vocabulary head</text>
      <text x="280" y="622" textAnchor="middle">gather 4 real predictor rows → [1, 4, 11]</text>
      <text x="280" y="648" textAnchor="middle" style={{ fill: colors.fixed }}>fixed block weights; live activation derivatives</text>
    </svg>
  </Scroll>;
}

export function SoftFullDecoder() {
  const [layer, setLayer] = useState(0);
  const [row, setRow] = useState(1);
  const state = useObservation('/learn-assets/p-tuning-soft-prompt-methods/native-batch.json');
  const trace = state.data?.decoder;
  return <Figure id="P08" caption="The exact random TinyLM fixture has two full residual blocks, width 8 and vocabulary 11. Two virtual rows travel through every normalization, attention and FFN operation before real logits are gathered.">
    <DecoderDiagram layer={layer} />
    <Controls><Select label="Inspect block" value={layer} options={[[0, 'Block 0'], [1, 'Block 1']]} onChange={value => setLayer(Number(value))} />
      <Range label="Real row" value={row} min={0} max={3} step={1} onChange={setRow} /></Controls>
    <Operation color={colors.real}>Real row {row} occupies expanded row {row + 2}. At block {layer}, its query reads the two prompt rows and real rows 0–{row}. Heads have shape [1, 2, 6, 4]; the residual stream is [1, 6, 8].</Operation>
    <ObservationState state={state} />
    {trace && <><Matrix title={`Actual block ${layer} input: selected real row and its loss derivative`}
      rows={[trace.layers[layer].hidden[row + 2], trace.layers[layer].derivative[row + 2]]}
      rowLabels={['activation h', '∂L/∂h']} color={colors.real} />
      <Matrix title="Full loss derivative reaching the two input prompt rows"
        rows={trace.prompt_gradient} rowLabels={['P0', 'P1']} color={colors.prompt} /></>}
    <p>Prompt derivatives include key/value paths and the virtual rows' own query/FFN paths across blocks. The full prompt-gradient norm is 0.0200727. Intermediate activation derivatives describe different points on the same chain; adding their norms would not give a valid decomposition.</p>
  </Figure>;
}

export function SoftTrainingGeneration() {
  const state = useObservation('decoder.json');
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState('both');
  const observed = state.data?.cases.find(row => row.route === 'input');
  const sequence = observed?.generated_ids[0] || [];
  return <Figure id="P09" caption="Training supplies true earlier tokens and selects explicit predictor labels. The separate recorded random-model generation starts from [1, 2], receives no supplied answer and appends its own IDs; no new model runs in this browser.">
    <Lanes label="Real-predictor training convention" rows={[
      { name: 'real input row', values: [1, 2, 3, 4] },
      { name: 'expanded row with m2', values: [2, 3, 4, 5] },
      { name: 'already aligned target', values: ['−100', '−100', selected === 'none' ? '−100' : 4, selected === 'both' ? 5 : '−100'], color: colors.target },
    ]} />
    <Controls><Select label="Inspect selected training targets" value={selected} options={[
      ['both', 'Targets 4 and 5'], ['first', 'Only target 4'], ['none', 'No targets: objective undefined']]} onChange={setSelected} /></Controls>
    <p>{selected === 'none' ? 'There is no positive target count; this state cannot define the intended mean loss.' : `${selected === 'both' ? 2 : 1} selected predictor rows. These labels must not be shifted again.`}</p>
    <ObservationState state={state} />
    {observed && <><Lanes label="Recorded free-generation prefix" rows={[
      { name: 'available prefix', values: sequence.slice(0, 2 + step), color: colors.real },
    ]} /><Arrow>recompute current prefix → select next ID {sequence[2 + step]}</Arrow>
      <Controls><Range label="Recorded generation step" value={step} min={0} max={2} step={1} onChange={setStep} /></Controls>
      <p>Observed full sequence: {vec(sequence)}. This small fixture uses three fixed steps; the scientific evaluator later handles actual EOS and per-example lengths.</p></>}
  </Figure>;
}

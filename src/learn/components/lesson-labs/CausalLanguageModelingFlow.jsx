import { useEffect, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { CLM_TOKENS, DEFAULT_LOGITS, distribution, attentionTrace, targetLoss, packedMask, objectiveMask, categorical, scoringWindow } from '../../data/causal-language-modeling-models.js';
import './causal-language-modeling-flow.css';

const tokenColor = { the: '#e2b55a', cat: '#60a5fa', sat: '#c084fc', EOS: '#f472b6', A: '#e2b55a', B: '#60a5fa' };
const style = color => ({ '--clm-color': color });
function Token({ text, selected = false }) {
  return <span className={`clm-token${selected ? ' clm-selected' : ''}`} style={style(tokenColor[text] || '#bbb')}>{text}</span>;
}
function Figure({ name, label, children, caption }) {
  return <figure className="clm-figure" data-clm-figure={name} aria-label={label}>{children}{caption && <figcaption>{caption}</figcaption>}</figure>;
}
function Scroll({ label, children }) {
  return <div className="clm-scroll" tabIndex={0} role="region" aria-label={label}>{children}</div>;
}
function ProbabilityBars({ probabilities, target = null }) {
  return <div className="clm-bars">{CLM_TOKENS.map((token, index) => <div className="clm-bar-row" key={token.text} style={style(token.color)}>
    <span className={`clm-bar-name${target === index ? ' clm-observed' : ''}`}>{token.text}</span>
    <div className="clm-bar-track"><div className="clm-bar-fill" style={{ width: `${100 * probabilities[index]}%` }} /></div>
    <span>{flowNumber(probabilities[index], 3)}</span>
  </div>)}</div>;
}
function CompactPredictions() {
  const inputs = ['BOS', 'the', 'cat', 'sat'];
  const targets = ['the', 'cat', 'sat', 'EOS'];
  return <div className="clm-compact-predictions"><p>position · input → next target</p>{inputs.map((text, index) => <div className="clm-step" key={text}><span>i = {index}</span><Token text={text} /><span>→</span><Token text={targets[index]} /></div>)}</div>;
}
function Matrix({ mask, row = null, labels, caption }) {
  return <Scroll label={caption}><table className="clm-matrix"><caption>{caption}</caption><thead><tr><th scope="col">query ↓ / key →</th>{mask.map((_, index) => <th scope="col" key={index}>{labels?.[index] || index}</th>)}</tr></thead>
    <tbody>{mask.map((entries, index) => <tr key={index} data-selected={row === index}><th scope="row">{labels?.[index] || index}</th>{entries.map((allowed, col) => <td key={col} data-allowed={allowed} aria-label={`row ${index}, column ${col}: ${allowed ? 'allowed' : 'blocked'}`}>{allowed ? '1' : '—'}</td>)}</tr>)}</tbody>
  </table></Scroll>;
}

export function DistributionFigure() {
  return <Figure name="distribution" label="Next-token probability distribution" caption="Prefix: the cat. Bar length is probability on a common 0–1 scale; underline marks the observed next token.">
    <p><Token text="the" /> <Token text="cat" /> <span aria-hidden="true">→</span> next token</p>
    <ProbabilityBars probabilities={[.5, .25, .125, .125]} target={0} />
    <p className="clm-muted">0 ← probability → 1 · total = 1</p>
  </Figure>;
}

export function ShiftFigure() {
  return <Figure name="shift" label="The input and target are one token apart" caption="Each input–target pair is one prediction. The same labelled token keeps its colour as it moves from target to the next input. EOS is scored, then the sequence ends.">
    <div className="clm-wide-predictions"><Scroll label="Four aligned next-token predictions"><div className="clm-alignment">
      <strong>position i</strong>{[0, 1, 2, 3].map(index => <span key={index}>{index}</span>)}
      <strong>input xᵢ</strong>{['BOS', 'the', 'cat', 'sat'].map(text => <Token key={text} text={text} />)}
      <span />{[0, 1, 2, 3].map(index => <span className="clm-arrow" key={index}>↓ predicts</span>)}
      <strong>target xᵢ₊₁</strong>{['the', 'cat', 'sat', 'EOS'].map(text => <Token key={text} text={text} />)}
    </div></Scroll></div><CompactPredictions />
  </Figure>;
}

export function CausalMaskLab() {
  const [row, setRow] = useState(1);
  const [futureValue, setFutureValue] = useState(4);
  const [causal, setCausal] = useState(true);
  const trace = attentionTrace(row, futureValue, causal);
  const mask = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => !causal || j <= i));
  return <FlowLab label="Change a future value and inspect causal invariance">
    <Figure name="causal-mask" label="Visibility matrix and the selected attention row" caption="1 means visible; a dash means blocked. White lines select the query row. Equal allowed scores produce equal weights; this isolates the effect of the mask.">
      <Matrix mask={mask} row={row} caption="Which input columns can each query read?" />
      <div className="clm-contributions">{trace.values.map((value, index) => <div className="clm-contribution" key={index} style={style(CLM_TOKENS[index].color)}>
        <span>key {index}: v = {value}</span><span>weight {flowNumber(trace.weights[index], 3)}</span><span>↓</span><strong>{flowNumber(value * trace.weights[index], 3)}</strong>
      </div>)}</div>
      <p>Weighted sum at row {row}: <strong>{flowNumber(trace.result, 4)}</strong></p>
    </Figure>
    <FlowControls>
      <FlowSlider name="Query row" value={row} onChange={setRow} min={0} max={3} step={1} />
      <FlowSlider name="Value at key 3" value={futureValue} onChange={setFutureValue} min={-4} max={8} step={1} />
      <FlowChoice label="Visibility" value={causal} onChange={setCausal} options={[[true, 'Causal'], [false, 'Unmasked']]} />
      <button type="button" onClick={() => { setRow(1); setFutureValue(4); setCausal(true); }}>Reset mask</button>
    </FlowControls>
    <FlowReadout>{causal && row < 3 ? 'Key 3 is in the future: its value has zero contribution.' : row === 3 ? 'At the last row there is no future column. Causal and unmasked visibility agree.' : 'The unmasked row reads key 3, so changing its value changes this earlier output.'}</FlowReadout>
  </FlowLab>;
}

export function LossLab() {
  const [logits, setLogits] = useState([...DEFAULT_LOGITS]);
  const [target, setTarget] = useState(0);
  const result = distribution(logits, target);
  const update = (index, value) => {
    if (Number.isFinite(value)) setLogits(values => values.map((old, i) => i === index ? Math.max(-20, Math.min(20, value)) : old));
  };
  return <FlowLab label="Trace logits through probability loss and gradient">
    <Figure name="loss" label="Logits become probabilities and loss derivatives">
      <ProbabilityBars probabilities={result.probabilities} target={target} />
      <p>Observed target: <strong style={{ color: CLM_TOKENS[target].color }}>{CLM_TOKENS[target].text}</strong>. −ln p = <strong>{flowNumber(result.loss)}</strong> nats.</p>
      <p className="clm-muted">Gradient ∂loss/∂logit · −1 ← 0 → +1</p>
      {result.gradient.map((value, index) => <div className="clm-gradient-row" key={index} style={style(CLM_TOKENS[index].color)}>
        <span className="clm-bar-name">{CLM_TOKENS[index].text}</span><div className="clm-gradient-track"><div className="clm-gradient-mark" style={{ left: `${value < 0 ? 50 + value * 50 : 50}%`, width: `${Math.abs(value) * 50}%` }} /></div><span>{flowNumber(value, 3)}</span>
      </div>)}
      <figcaption>Gradient descent subtracts this derivative: the negative target derivative raises its logit; positive derivatives lower the alternatives.</figcaption>
    </Figure>
    <div className="clm-inputs">{CLM_TOKENS.map((token, index) => <label key={token.text} style={style(token.color)}>{token.text} logit<input type="number" min={-20} max={20} step={.1} value={logits[index]} onChange={event => update(index, event.target.valueAsNumber)} /></label>)}</div>
    <FlowControls><FlowChoice label="Observed token" value={target} onChange={setTarget} options={CLM_TOKENS.map((token, index) => [index, token.text])} />
      <button type="button" onClick={() => setLogits([0, 0, 0, 0])}>Uniform logits</button><button type="button" onClick={() => { setLogits([...DEFAULT_LOGITS]); setTarget(0); }}>Reset loss</button>
    </FlowControls>
    <FlowReadout>Target probability {flowNumber(result.probabilities[target])}; one-target perplexity {flowNumber(Math.exp(result.loss))}. The four derivatives sum to {flowNumber(result.gradient.reduce((sum, value) => sum + value, 0))}.</FlowReadout>
  </FlowLab>;
}

export function LossMaskLab() {
  const [enabled, setEnabled] = useState([true, true, true, true]);
  const result = targetLoss(enabled);
  const rows = [['A0', 'the', .5], ['A1', 'EOS', .5], ['B0', 'cat', .25], ['B1', 'EOS', .25]];
  return <FlowLab label="Choose which targets contribute to the loss">
    <Figure name="loss-mask" label="Individual target losses and their denominator" caption="These four assigned target probabilities are a controlled example. Padding contributes neither a loss nor a count; a real EOS contributes both.">
      <Scroll label="Target eligibility and individual losses"><table className="clm-loss-table"><thead><tr><th>Score?</th><th>Position</th><th>Target</th><th>p(target)</th><th>Contribution</th></tr></thead><tbody>
        {rows.map(([position, text, probability], index) => <tr key={position}><td><input type="checkbox" aria-label={`Score ${position} ${text}`} checked={enabled[index]} onChange={() => setEnabled(values => values.map((value, i) => i === index ? !value : value))} /></td><td>{position}</td><td><Token text={text} /></td><td>{probability}</td><td>{enabled[index] ? flowNumber(result.losses[index]) : 'excluded'}</td></tr>)}
        <tr><td><input type="checkbox" disabled checked={false} aria-label="Padding is always excluded" readOnly /></td><td>B2</td><td><Token text="PAD" /></td><td>—</td><td>excluded</td></tr>
      </tbody></table></Scroll>
      <p><strong>{flowNumber(result.sum)}</strong> nats ÷ <strong>{result.count}</strong> targets → <strong>{flowNumber(result.mean)}</strong> nats/target</p>
    </Figure>
    <FlowControls><button type="button" onClick={() => setEnabled([false, false, false, false])}>Exclude all</button><button type="button" onClick={() => setEnabled([true, true, true, true])}>Restore all</button></FlowControls>
    <FlowReadout>{result.count ? <>Perplexity = exp(mean) = <strong>{flowNumber(result.perplexity)}</strong>. Exclusions change both numerator and denominator.</> : 'No eligible targets: mean and perplexity are undefined. Skip the optimizer step.'}</FlowReadout>
  </FlowLab>;
}

export function PackingLab() {
  const [independent, setIndependent] = useState(false);
  const labels = ['BOSₐ', 'A', 'EOSₐ', 'BOSᵦ', 'B', 'EOSᵦ'];
  return <FlowLab label="Compare continuous and independent document packing">
    <Figure name="packing" label="Packed documents with attention and boundary targets" caption="Document membership is shown by brackets and labels. EOS remains an end-token identity in both documents; it is not an attention reset operation.">
      <div className="clm-documents">{['A', 'B'].map(doc => <div className="clm-document" key={doc}><span>doc {doc}:</span><Token text="BOS" /><Token text={doc} /><Token text="EOS" /></div>)}</div>
      <Matrix mask={packedMask(independent)} labels={labels} caption="Packed visibility: query rows × key columns" />
      <p>Across the boundary: EOSₐ → BOSᵦ is <strong>{independent ? 'excluded from loss' : 'a scored next-token transition'}</strong>.</p>
      <p>Other scored pairs: BOSₐ → A → EOSₐ; BOSᵦ → B → EOSᵦ.</p>
    </Figure>
    <FlowControls><FlowChoice label="Training objective" value={independent} onChange={setIndependent} options={[[false, 'Continuous stream'], [true, 'Independent documents']]} /></FlowControls>
    <FlowReadout>{independent ? 'The second triangle cannot read the first document. Excluding the boundary target and blocking cross-document attention enforce the independent-document objective.' : 'The second document can read the first. EOS tells the model a boundary occurred, but the lower-left attention entries remain allowed.'}</FlowReadout>
  </FlowLab>;
}

function Tensor({ cols = 4, rows = 4, color = '#60a5fa' }) {
  return <div className="clm-tensor" style={{ '--clm-cols': cols }} aria-hidden="true">{Array.from({ length: cols * rows }, (_, index) => <i key={index} style={style(color)} />)}</div>;
}
export function DecoderFigure() {
  return <Figure name="decoder" label="A pre-norm decoder with residual connections and tensor dimensions" caption="Cells depict tensor shape, not measured activations. Blue follows the residual hidden stream; amber follows attention projections, violet the MLP expansion, and rose the vocabulary output. Every operation preserves the token-row axis T.">
    <div className="clm-architecture">
      <div className="clm-tensor-row"><Token text="IDs" /><span>lookup + position →</span><Tensor /><span>T × d</span></div>
      <span>↓</span>
      <div className="clm-residual"><span>LayerNorm → Q, K, V projections</span><div className="clm-branches">{['Q', 'K', 'V'].map(name => <div key={name}><span>{name}: T × d</span><Tensor color="#e2b55a" /></div>)}</div>
        <span>QKᵀ / √dₕ → causal mask → softmax</span><Matrix mask={objectiveMask('causal')} caption="Per-head attention T × T (T = 4 sketch)" />
        <span>weights × V → join heads → projection</span><div className="clm-tensor-row"><Tensor /><span>⊕ add original hidden stream</span></div>
      </div>
      <span>↓ T × d</span>
      <div className="clm-residual"><span>LayerNorm → token-local MLP</span><div className="clm-tensor-row"><Tensor rows={1} cols={2} /><span>→</span><Tensor rows={1} cols={8} color="#c084fc" /><span>→</span><Tensor rows={1} cols={2} /></div><span>d → 4d + GELU → d · each row separately</span><span>⊕ add original hidden stream</span></div>
      <span>↓ repeat blocks → final LayerNorm</span>
      <div className="clm-tensor-row"><Tensor /><span>× Wᵤ →</span><Tensor cols={6} color="#f472b6" /><span>T × V logits</span></div>
    </div>
  </Figure>;
}

export function StudyFigure() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ data: null, error: false });
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, error: false });
    fetch('/learn-code/causal-language-modeling/study.json', { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Study unavailable');
      return response.json();
    }).then(data => {
      if (!Array.isArray(data.history) || !data.bigram) throw new Error('Invalid study');
      setState({ data, error: false });
    }).catch(error => { if (error.name !== 'AbortError') setState({ data: null, error: true }); });
    return () => controller.abort();
  }, [attempt]);
  if (state.error) return <div role="alert">The saved study could not load. <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry study</button></div>;
  if (!state.data) return <p role="status">Loading the saved CPU study…</p>;
  const data = state.data;
  const x = step => 65 + step / 300 * 485;
  const y = loss => 225 - (loss - 2) / 2.5 * 190;
  const points = split => data.history.map(point => `${x(point.step)},${y(point[split].mean_nats)}`).join(' ');
  return <Figure name="study" label="Measured train and heldout loss versus updates" caption="Saved run: seed 17, 300 CPU updates. Blue=train, rose=heldout; dashed grey=heldout bigram baseline. All losses are natural-log nats per scored character.">
    <div className="clm-study-data"><span>Train: {data.train_characters.toLocaleString()} characters</span><span>Heldout: {data.heldout_characters.toLocaleString()} characters</span><span>{data.heldout_unknown} heldout unknown · {data.vocabulary} IDs</span></div>
    <Scroll label="Measured loss chart"><svg className="clm-chart" viewBox="0 0 620 300" role="img" aria-label="Train and heldout loss decline; heldout ends at 2.521 above bigram 2.497">
      {[2, 2.5, 3, 3.5, 4, 4.5].map(loss => <g key={loss}><line x1={65} x2={550} y1={y(loss)} y2={y(loss)} stroke="#444" /><text x={52} y={y(loss) + 5} textAnchor="end">{loss}</text></g>)}
      {[0, 100, 200, 300].map(step => <text key={step} x={x(step)} y={255} textAnchor="middle">{step}</text>)}
      <text x={310} y={282} textAnchor="middle">training updates</text><text x={65} y={20}>nats / character ↓ better</text>
      <line x1={65} x2={550} y1={y(data.bigram.mean_nats)} y2={y(data.bigram.mean_nats)} stroke="#bbb" strokeDasharray="6 5" />
      <polyline points={points('train')} className="clm-train" strokeWidth={3} /><polyline points={points('heldout')} className="clm-heldout" strokeWidth={3} />
      {data.history.map(point => <g key={point.step}><circle cx={x(point.step)} cy={y(point.train.mean_nats)} r={4} fill="#60a5fa" /><circle cx={x(point.step)} cy={y(point.heldout.mean_nats)} r={4} fill="#f472b6" /></g>)}
    </svg></Scroll>
    <Scroll label="Exact measured loss table"><table className="clm-loss-table"><thead><tr><th>Update</th><th>Train nats/char</th><th>Heldout nats/char</th><th>Heldout targets</th></tr></thead><tbody>{data.history.map(point => <tr key={point.step}><td>{point.step}</td><td>{flowNumber(point.train.mean_nats)}</td><td>{flowNumber(point.heldout.mean_nats)}</td><td>{point.heldout.targets}</td></tr>)}</tbody></table></Scroll>
    <p>Heldout bigram: <strong>{flowNumber(data.bigram.mean_nats)}</strong> nats/character. Its lower loss wins this comparison.</p>
    <p>Greedy sample, unedited:</p><div className="clm-sample">{data.greedy}</div>
    <p>Sampling at temperature 1, unedited:</p><div className="clm-sample">{data.sample_temperature_1}</div>
  </Figure>;
}

export function GenerationLab() {
  const [temperature, setTemperature] = useState(1);
  const [uniform, setUniform] = useState(.6);
  const [greedy, setGreedy] = useState(false);
  const probabilities = distribution(DEFAULT_LOGITS, 0, temperature).probabilities;
  const sample = categorical(probabilities, uniform);
  const selected = greedy ? probabilities.indexOf(Math.max(...probabilities)) : sample.selected;
  return <FlowLab label="Inspect temperature and a categorical draw">
    <Figure name="generation" label="Probability intervals select the next token" caption="Interval length is probability. The white marker is the fixed uniform draw u; intervals include their left boundary and exclude their right. Temperature changes the intervals, not the random marker.">
      <ProbabilityBars probabilities={probabilities} target={selected} />
      <div className="clm-intervals" aria-label="Cumulative probability intervals">{sample.intervals.map((interval, index) => <div key={index} className="clm-interval" style={{ ...style(CLM_TOKENS[index].color), width: `${100 * probabilities[index]}%` }} />)}{!greedy && <div className="clm-cursor" style={{ left: `${100 * uniform}%` }}><span>u={flowNumber(uniform, 2)}</span></div>}</div>
      <p>{sample.intervals.map((interval, index) => <span key={index} style={{ color: CLM_TOKENS[index].color }}>{CLM_TOKENS[index].text} [{flowNumber(interval.start, 3)}, {flowNumber(interval.end, 3)}){index < 3 ? ' · ' : ''}</span>)}</p>
      <p>Chosen token → <strong style={{ color: CLM_TOKENS[selected].color }}>{CLM_TOKENS[selected].text}</strong> → append to prefix → recompute next distribution.</p>
    </Figure>
    <FlowControls><FlowSlider name="Temperature" value={temperature} onChange={setTemperature} min={.25} max={2} step={.25} /><FlowSlider name="Uniform draw u" value={uniform} onChange={setUniform} min={0} max={.99} step={.01} /><FlowChoice label="Selection" value={greedy} onChange={setGreedy} options={[[false, 'Sample'], [true, 'Greedy']]} /><button type="button" onClick={() => { setTemperature(1); setUniform(.6); setGreedy(false); }}>Reset generation</button></FlowControls>
    <FlowReadout>{greedy ? 'Greedy takes the highest-probability token and ignores u. Positive temperature preserves this argmax here.' : `The draw falls inside ${CLM_TOKENS[selected].text}'s interval; changing temperature can move a boundary across the same draw.`}</FlowReadout>
    <Figure name="greedy-tree" label="A two-step counterexample to greedy sequence optimality" caption="A separate constructed two-step tree: path probability multiplies edge probabilities. Greedy selects A first, even though B followed by its best continuation has the larger product.">
      <Scroll label="Two-step probability tree with four complete paths"><svg className="clm-tree" viewBox="0 0 640 320" role="img" aria-label="Prefix branches to A with probability 0.6 and B with probability 0.4. A branches equally to two endings, each path probability 0.30. B branches with probabilities 0.9 and 0.1, giving paths 0.36 and 0.04.">
        <g fill="none" strokeWidth="2"><path stroke="#e2b55a" d="M320 38 L170 110 M170 140 L80 225 M170 140 L230 225" /><path stroke="#60a5fa" d="M320 38 L470 110 M470 140 L410 225 M470 140 L560 225" /></g>
        <g textAnchor="middle"><text x="320" y="25">same prefix</text><g fill="#e2b55a"><text x="230" y="65">0.6</text><text x="170" y="130">A · greedy first</text><text x="112" y="177">0.5</text><text x="226" y="177">0.5</text><text x="80" y="250">A₁</text><text x="230" y="250">A₂</text><text x="80" y="279">0.6 × 0.5</text><text x="230" y="279">0.6 × 0.5</text><text x="80" y="307">= 0.30</text><text x="230" y="307">= 0.30</text></g><g fill="#60a5fa"><text x="410" y="65">0.4</text><text x="470" y="130">B</text><text x="414" y="177">0.9</text><text x="540" y="177">0.1</text><text x="410" y="250">B₁ · best path</text><text x="560" y="250">B₂</text><text x="410" y="279">0.4 × 0.9</text><text x="560" y="279">0.4 × 0.1</text><text x="410" y="307">= 0.36</text><text x="560" y="307">= 0.04</text></g></g>
      </svg></Scroll>
    </Figure>
  </FlowLab>;
}

export function TrainingGenerationFigure() {
  return <Figure name="training-generation" label="Observed training prefixes versus generated prefixes" caption="Training predictions can run together because their inputs already exist. Generation must append each chosen output before the next forward pass.">
    <p>Training: observed text supplies every prefix</p><div className="clm-wide-predictions"><Scroll label="Parallel observed training columns"><div className="clm-alignment"><strong>input</strong>{['BOS', 'the', 'cat', 'sat'].map(text => <Token key={text} text={text} />)}<strong>target</strong>{['the', 'cat', 'sat', 'EOS'].map(text => <Token key={text} text={text} />)}</div></Scroll></div><CompactPredictions />
    <p>Generation: selected tokens become later inputs</p><div className="clm-step-lanes">{[['the'], ['the', 'cat'], ['the', 'cat', 'sat']].map((prefix, index) => <div className="clm-step" key={index}><span>step {index + 1}</span>{prefix.map(text => <Token key={text} text={text} />)}<span>→ predict →</span><Token text={['cat', 'sat', 'EOS'][index]} selected /><span>{index === 2 ? 'stop' : '↳ append for next step'}</span></div>)}</div>
  </Figure>;
}

export function WindowLab() {
  const [target, setTarget] = useState(1);
  const context = scoringWindow(target);
  return <FlowLab label="Inspect each target's finite context">
    <Figure name="window" label="A moving four-input context with exactly one scored target" caption="Indices are original positions, not token IDs. Blue underlines mark input-only context. White outline marks the single target scored on this step.">
      <Scroll label="Seven original positions and current context"><div className="clm-window">{Array.from({ length: 7 }, (_, index) => <div className="clm-window-item" key={index} data-context={context.includes(index)} data-target={target === index}><span>pos {index}</span><Token text={`x${index}`} /><span>{target === index ? 'score' : context.includes(index) ? 'input' : '—'}</span></div>)}</div></Scroll>
      <p>Read positions [{context.join(', ')}] → predict position {target}. Local positional indices restart at 0.</p>
      <p>Already counted: {target === 1 ? 'none' : `positions 1–${target - 1}`} · count after this step: <strong>{target}</strong></p>
    </Figure>
    <FlowControls><FlowSlider name="Scored target position" value={target} onChange={setTarget} min={1} max={6} step={1} /><button type="button" onClick={() => setTarget(1)}>Reset window</button></FlowControls>
    <FlowReadout>{target === 6 ? 'Final step: six eligible targets have appeared once each. Position 0 supplied context and was never scored.' : `The next target is position ${target + 1}; context may repeat, but its loss is not counted again.`}</FlowReadout>
  </FlowLab>;
}

export function ObjectiveFigure() {
  const [kind, setKind] = useState('causal');
  const labels = kind === 'masked' ? ['the', '[MASK]', 'sat', 'EOS'] : ['BOS', 'the', 'cat', 'sat'];
  return <FlowLab label="Separate visibility from scored targets in different objectives">
    <Figure name="objectives" label="Objective-specific visibility matrix and target positions" caption="Visibility alone does not define an objective. Read the corresponding inputs and scored targets together; the masked target's true token is absent from its input.">
      <Matrix mask={objectiveMask(kind)} labels={labels} caption={kind === 'prefix' ? 'First two positions form a fully visible prefix' : kind === 'masked' ? 'Corrupted input is visible in both directions' : 'Every row sees only its own prefix'} />
      <p>Input: {labels.map((label, index) => <span key={index}><Token text={label} />{' '}</span>)}</p>
      <p>Scored outputs: <strong>{kind === 'causal' ? 'the, cat, sat, EOS — one shifted target per row' : kind === 'prefix' ? 'cat after the prefix, then sat, then EOS; no loss inside the prefix' : 'cat at the [MASK] position; other positions supply context'}</strong>.</p>
    </Figure>
    <FlowControls><FlowChoice label="Objective" value={kind} onChange={setKind} options={[[ 'causal', 'Causal' ], [ 'prefix', 'Prefix' ], [ 'masked', 'Masked' ]]} /></FlowControls>
    <FlowReadout>{kind === 'masked' ? 'Bidirectional context is legitimate because the original target token was corrupted. This leads into the next lesson.' : kind === 'prefix' ? 'The prefix can read itself in both directions; suffix predictions remain causal. Targets begin immediately after the supplied prefix.' : 'Each true next token remains outside its predicting row’s visible inputs.'}</FlowReadout>
    <Figure name="encoder-decoder" label="Separate encoder states supply keys and values to a causal decoder" caption="The decoder's cross-attention reads encoder states as keys and values. Its own target-side self-attention stays causal; these are two different connections.">
      <div className="clm-branches">
        <div><span>source inputs</span><Tensor rows={3} cols={3} color="#e2b55a" /><span>↓ bidirectional encoder</span><Tensor rows={3} cols={3} color="#e2b55a" /><span>encoder states: K, V</span></div>
        <div><span>shifted target inputs</span><Tensor rows={3} cols={3} /><span>↓ causal self-attention</span><Tensor rows={3} cols={3} /><span>decoder states: Q</span></div>
      </div>
      <p style={{ textAlign: 'center' }}>encoder K,V ↘ cross-attention ↙ decoder Q</p>
      <div className="clm-architecture"><Tensor rows={3} cols={3} color="#c084fc" /><span>↓ decoder MLP + output projection</span><Tensor rows={3} cols={5} color="#f472b6" /><span>target vocabulary logits</span></div>
    </Figure>
    <p className="clm-muted">T5 uses separate encoder and decoder stacks. The single-stack prefix matrix above is a different construction.</p>
  </FlowLab>;
}

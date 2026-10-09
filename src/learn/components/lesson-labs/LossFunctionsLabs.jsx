import { useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber as fmt } from './LessonFlow.jsx';
import { LossCurvePlot } from './LossIntuitionFigures.jsx';
import { regressionSlope, fittedConstant, focalTerm, confusionAt, tripletGeometry, candidateCompetition } from '../../data/loss-functions-models.js';
import measurements from '../../data/loss-functions-measurements.js';
import './neural-lesson-neutral.css';
import './loss-functions-labs.css';

// Labs and structure diagrams for the loss-functions lesson, in the reading flow.
// Colours follow docs/teaching/deep-learning-beginner/visual-vocabulary.md: cyan supplied
// values, amber learned parameters, violet computed values, white-outline operations,
// orange dashed backward flow. Function colours stay fixed across the lesson:
// squared error blue, absolute error violet, Huber rose, cross-entropy amber.

const Value = ({ kind, children }) => <span className={`lf-value lf-value-${kind}`}>{children}</span>;

// The whole training step for one example: forward to the penalty, backward to the
// parameters, then the update returns new parameters to the model.
export function LossUpdateFigure() {
  return <figure className="lf-figure lf-update" data-figure="loss-training-loop" id="loss-training-loop">
    <p className="lf-figure-label">Steps 1–3 forward, 4–6 backward (dashed), 7 update · <span className="lf-tag lf-tag-input">supplied</span> <span className="lf-tag lf-tag-param">learned</span> <span className="lf-tag lf-tag-computed">computed</span> <span className="lf-tag lf-tag-back">backward</span></p>
    <div className="lf-cycle">
      <div className="lf-rail" aria-hidden="true"><span className="lf-rail-head">▲</span><span className="lf-rail-label">new w, b go back into the model</span></div>
      <div className="lf-cycle-body">
        <div className="lf-forward" aria-label="Forward pass">
          <div className="lf-stage"><p className="lf-stage-name">1 · predict</p><Value kind="input">input x = 1</Value><span className="lf-down" aria-hidden="true">↓</span><div className="lf-op">model ŷ = w·x + b<span><Value kind="param">w = 3</Value> <Value kind="param">b = 0</Value></span></div><span className="lf-down" aria-hidden="true">↓</span><Value kind="computed">prediction ŷ = 3</Value></div>
          <span className="lf-across" aria-hidden="true">→</span>
          <div className="lf-stage"><p className="lf-stage-name">2 · compare</p><Value kind="input">target y = 5</Value><span className="lf-down" aria-hidden="true">↓</span><div className="lf-op">subtract r = ŷ − y<span>3 − 5</span></div><span className="lf-down" aria-hidden="true">↓</span><Value kind="computed">residual r = −2</Value></div>
          <span className="lf-across" aria-hidden="true">→</span>
          <div className="lf-stage"><p className="lf-stage-name">3 · penalize</p><span className="lf-spacer" /><div className="lf-op">square L = r²<span>(−2)²</span></div><span className="lf-down" aria-hidden="true">↓</span><Value kind="computed">penalty L = 4</Value></div>
        </div>
        <p className="lf-turn"><span aria-hidden="true">↓</span> backward starts at the penalty and retraces the steps in reverse order</p>
        <div className="lf-backward" aria-label="Backward pass">
          <div className="lf-back-step"><p className="lf-stage-name">6 · through the model</p><span>∂ŷ/∂w = x = 1 · ∂ŷ/∂b = 1</span><strong>∂L/∂w = −4 · ∂L/∂b = −4</strong></div>
          <span className="lf-across lf-across-back" aria-hidden="true">←</span>
          <div className="lf-back-step"><p className="lf-stage-name">5 · through the subtraction</p><span>∂r/∂ŷ = 1; the target stays fixed</span><strong>∂L/∂ŷ = −4 × 1 = −4</strong></div>
          <span className="lf-across lf-across-back" aria-hidden="true">←</span>
          <div className="lf-back-step"><p className="lf-stage-name">4 · start at the penalty</p><span>∂L/∂r = 2r</span><strong>2 × (−2) = −4</strong></div>
        </div>
        <p className="lf-turn"><span aria-hidden="true">↓</span> the parameter derivatives reach the optimizer</p>
        <div className="lf-update-step"><p className="lf-stage-name">7 · update the learned parameters (learning rate .1)</p><span><Value kind="param">w ← 3 − .1 × (−4) = 3.4</Value> <Value kind="param">b ← 0 − .1 × (−4) = .4</Value></span><span>Up the rail into the model and run the same input again: ŷ = 3.8, r = −1.2, L = 1.44.</span></div>
      </div>
    </div>
  </figure>;
}

// Where the −4 of the update figure appears on the loss curve.
export function TangentFigure() {
  return <figure className="lf-figure" data-figure="loss-tangent" id="loss-tangent">
    <LossCurvePlot ariaLabel="Squared error (ŷ − 5)² against the prediction ŷ from 1 to 7. At prediction 3 the loss is 4 and the dashed tangent has slope −4, reaching zero at prediction 4. After one update the prediction is 3.8 and the loss 1.44. The curve's lowest point is at the target 5."
      xLabel="prediction ŷ" yLabel="squared error L" xDomain={[1, 7]} yDomain={[0, 16]} xTicks={[1, 3, 4, 5, 7]} yTicks={[0, 4, 8, 16]}
      series={[
        { label: 'L = (ŷ − 5)²', color: '#83b4e8', labelAt: [6.4, 7], values: Array.from({ length: 61 }, (_, i) => [1 + i / 10, (1 + i / 10 - 5) ** 2]) },
        { label: 'tangent, slope −4', color: '#f0a878', dashed: true, labelAt: [2.05, 10.4], values: [[2, 8], [4, 0]] },
      ]}
      points={[
        { x: 3, y: 4, color: '#c7a5ee', label: 'ŷ = 3, L = 4', dx: 10, dy: -12 },
        { x: 3.8, y: 1.44, color: '#c7a5ee', label: 'after the update: ŷ = 3.8, L = 1.44', dx: 16, dy: -16 },
      ]} />
  </figure>;
}

const regressionRows = [['mse', 'Squared error', 'mean'], ['mae', 'Absolute error', 'median'], ['huber', 'Huber, δ = 1', 'Huber answer']];
const axisMin = -5, axisMax = 105;
const axisPosition = v => `${(v - axisMin) / (axisMax - axisMin) * 100}%`;
function balanceSentence(method, late, c) {
  const pull = residual => Math.abs(regressionSlope(residual, method));
  if (late === 0) return 'every measurement is 0, so nothing pulls and the answer is 0.';
  if (method === 'mae') return 'the late delivery pulls up with 1; the six measurements at 0 sit exactly at the answer and can pull back with anything up to 6, so 0 balances.';
  const down = 6 * pull(c), up = pull(c - late);
  const capped = method === 'huber' && late - c > 1 ? ' (capped at 1)' : '';
  return `six zeros pull down 6 × ${fmt(pull(c), 4)} = ${fmt(down, 4)}; the late delivery pulls up ${fmt(up, 4)}${capped}.`;
}
export function RegressionInfluenceLab() {
  const [late, setLate] = useState(10);
  const values = [0, 0, 0, 0, 0, 0, late];
  const fits = Object.fromEntries(regressionRows.map(([key]) => [key, fittedConstant(values, key)]));
  return <FlowLab id="loss-regression" label="Move the late delivery and watch each loss's answer">
    <div className="lf-fit-rows" role="img" aria-label={`Seven delays: six at 0 and one at ${late}. Squared error answers ${fmt(fits.mse, 4)}, absolute error ${fmt(fits.mae, 4)}, Huber ${fmt(fits.huber, 4)}.`}>
      <div className="lf-fit-scale" aria-hidden="true"><span style={{ left: axisPosition(0) }}>0</span><span style={{ left: axisPosition(50) }}>50</span><span style={{ left: axisPosition(100) }}>100 minutes</span></div>
      {regressionRows.map(([key, name, kind]) => <div key={key} className={`lf-fit-row lf-fn-${key}`}>
        <span className="lf-fit-name">{name}</span>
        <div className="lf-fit-track">{values.map((v, i) => <i key={i} className="lf-fit-dot" style={{ left: axisPosition(v) }} />)}<i className="lf-fit-mark" style={{ left: axisPosition(fits[key]) }} /></div>
        <span className="lf-fit-value">{kind} {fmt(fits[key], 3)}</span>
      </div>)}
      <p className="lf-figure-note">cyan dots: the seven delays (six overlap at 0) · coloured line: the constant each loss prefers · fixed scale from −5 to 105 minutes</p>
    </div>
    <FlowControls><FlowSlider name="Late delivery, minutes" value={late} onChange={setLate} min={0} max={100} step={1} /></FlowControls>
    <div className="lf-readout-lines">{regressionRows.map(([key, name]) => <FlowReadout key={key} className={`lf-fn-${key}`}><strong className="lf-fn-name">{name} → {fmt(fits[key], 4)}:</strong> {balanceSentence(key, late, fits[key])}</FlowReadout>)}</div>
  </FlowLab>;
}

export function FocalContributionLab() {
  const [count, setCount] = useState(1000),
    [gamma, setGamma] = useState(2),
    [classFactor, setClassFactor] = useState('none');
  const alpha = classFactor === 'alpha' ? .25 : null;
  const n = focalTerm(.01, 0, gamma, alpha), p = focalTerm(.1, 1, gamma, alpha);
  const crowd = count * n.slope, total = crowd + p.slope;
  const ce = count * .01 + .1 - 1;
  const extent = Math.max(Math.abs(crowd), Math.abs(p.slope), Math.abs(total), .001);
  const rows = [[`${count} negatives, each p = .01`, crowd], ['1 positive, p = .1', p.slope], ['net push on the bias', total]];
  return <FlowLab id="loss-focal" label="Which group moves a shared bias under focal loss">
    <div className="lf-signed" role="img" aria-label={`Summed derivatives on one scale: negatives ${fmt(crowd, 6)}, positive ${fmt(p.slope, 6)}, net ${fmt(total, 6)}.`}>
      <div className="lf-signed-row lf-signed-scale" aria-hidden="true"><span /><div><span>← raises the bias</span><span>0</span><span>lowers the bias →</span></div><span /></div>
      {rows.map(([label, value], i) => <div key={label} className={`lf-signed-row${i === 2 ? ' lf-signed-net' : ''}`}>
        <span>{label}</span>
        <div className="lf-signed-track"><i className="lf-signed-zero" /><i className="lf-signed-fill" style={{ left: value < 0 ? `${50 + value / extent * 50}%` : '50%', width: `${Math.abs(value) / extent * 50}%` }} /></div>
        <strong>{fmt(value, 6)}</strong>
      </div>)}
      <p className="lf-figure-note">bars are summed derivatives of the loss with respect to the shared bias (orange: gradient values); gradient descent subtracts them, so a negative total raises the bias</p>
    </div>
    <FlowControls>
      <FlowSlider name="Focusing γ" value={gamma} onChange={setGamma} min={0} max={5} step={.25} />
      <FlowSlider name="Number of easy negatives" value={count} onChange={setCount} min={10} max={2000} step={10} format={v => String(v)} />
      <FlowChoice label="Class factor" value={classFactor} onChange={setClassFactor} options={[['none', 'none'], ['alpha', 'α = .25 positives, .75 negatives']]} />
    </FlowControls>
    <FlowReadout>Net push <strong>{fmt(total, 6)}</strong>: {Math.abs(total) < 1e-10 ? 'no first-order change to the bias' : total < 0 ? 'gradient descent raises the bias, toward the positive' : 'gradient descent lowers the bias, so the crowd wins'}. {gamma === 0 && !alpha ? 'At γ = 0 with no class factor this is plain cross-entropy.' : `Plain cross-entropy on the same probabilities gives ${fmt(ce, 6)}.`} The losses are a different quantity: the negatives' summed focal loss is {fmt(count * n.loss, 6)} and the positive's {fmt(p.loss, 6)}.</FlowReadout>
  </FlowLab>;
}

const objectives = [['bce', 'Cross-entropy'], ['positive_weight_9', 'Positive weight 9'], ['focal_gamma_2', 'Focal, γ = 2']];
export function LossDecisionLab() {
  const [objective, setObjective] = useState('bce'),
    [threshold, setThreshold] = useState(.5),
    [clicked, setClicked] = useState(null);
  const run = measurements.records.find(record => record.seed === 1 && record.objective === objective);
  const specimens = measurements.validation_source_ids.map(id => measurements.specimens.find(row => row.source_id === id));
  const labels = specimens.map(row => row.digit === 9 ? 1 : 0);
  const probabilities = run.validation_probabilities;
  const counts = confusionAt(probabilities, labels, threshold);
  const nineIndices = labels.flatMap((l, i) => l ? [i] : []);
  const hardestNine = nineIndices.reduce((a, b) => probabilities[a] <= probabilities[b] ? a : b);
  const selected = clicked ?? hardestNine;
  const below = probabilities.filter(p => p < threshold), above = probabilities.filter(p => p >= threshold);
  const lower = below.length ? Math.max(...below) : 0, upper = above.length ? Math.min(...above) : 1;
  const specimen = specimens[selected];
  const jitter = i => ((i * 37) % 19 - 9) * 1.4;
  // Row labels sit in their own left gutter so the dots can never cover them.
  const x = p => 150 + p * 430;
  const thresholdAnchor = threshold > .85 ? 'end' : threshold < .15 ? 'start' : 'middle';
  return <FlowLab id="loss-decisions" label="Move the threshold over fixed recorded probabilities">
    <svg className="lf-strip" viewBox="0 0 600 170" role="img" aria-label={`Seed 1, ${objective}: 120 validation images placed by their stored probability of nine; threshold ${fmt(threshold, 2)}.`}>
      <rect x={x(threshold)} y="14" width={x(1) - x(threshold)} height="118" className="lf-strip-called" />
      {threshold < .8 && <text x={x(1) - 4} y="28" textAnchor="end" className="lf-strip-note">called nine</text>}
      {threshold > .2 && <text x={x(0) + 4} y="28" className="lf-strip-note">called other</text>}
      <text x="8" y="76" className="lf-strip-row">12 nines</text>
      <text x="8" y="100" className="lf-strip-row"><tspan x="8">108 other</tspan><tspan x="8" dy="1.15em">digits</tspan></text>
      <line x1={x(0)} x2={x(1)} y1="140" y2="140" className="lf-strip-axis" />
      {[0, .25, .5, .75, 1].map(t => <text key={t} x={x(t)} y="160" textAnchor="middle" className="lf-strip-tick">{t}</text>)}
      {probabilities.map((probability, i) => <circle key={i} cx={x(probability)} cy={(labels[i] ? 72 : 102) + jitter(i)} r={i === selected ? 6.5 : 4} className={`lf-strip-dot ${labels[i] ? 'lf-strip-nine' : 'lf-strip-other'}${i === selected ? ' lf-strip-selected' : ''}`} onClick={() => setClicked(i)}><title>{`Source ${specimens[i].source_id}, digit ${specimens[i].digit}, p ${fmt(probability, 4)}`}</title></circle>)}
      <line x1={x(threshold)} x2={x(threshold)} y1="10" y2="140" className="lf-strip-threshold" />
      <text x={x(threshold)} y="9" textAnchor={thresholdAnchor} className="lf-strip-tick">threshold {fmt(threshold, 2)}</text>
    </svg>
    <div className="lf-decision flow-columns-2">
      <div className="lf-confusion" role="table" aria-label="Confusion counts at this threshold">
        <div role="row"><span role="columnheader" /><span role="columnheader">called nine</span><span role="columnheader">called other</span></div>
        <div role="row"><span role="rowheader">actual nine</span><span role="cell" className="lf-cm-good">{counts.tp} caught</span><span role="cell" className="lf-cm-bad">{counts.fn} missed</span></div>
        <div role="row"><span role="rowheader">actual other</span><span role="cell" className="lf-cm-bad">{counts.fp} false {counts.fp === 1 ? 'alarm' : 'alarms'}</span><span role="cell" className="lf-cm-good">{counts.tn} rejected</span></div>
      </div>
      <div className="lf-specimen">
        <div className="lf-pixels" role="img" aria-label={`8 by 8 scan, source ${specimen.source_id}, digit ${specimen.digit}`}>{Array.from({ length: 64 }, (_, i) => <span key={i} style={{ '--pixel': `rgb(${specimen[`pixel_${i}`] / 16 * 255},${specimen[`pixel_${i}`] / 16 * 255},${specimen[`pixel_${i}`] / 16 * 255})` }} />)}</div>
        <p>Source {specimen.source_id}: a <strong>{specimen.digit}</strong>, stored p(nine) = {fmt(probabilities[selected], 4)}, called <strong>{probabilities[selected] >= threshold ? 'nine' : 'other'}</strong>.</p>
      </div>
    </div>
    <FlowControls>
      <FlowChoice label="Trained with" value={objective} onChange={value => { setObjective(value); setClicked(null); }} options={objectives} />
      <FlowSlider name="Decision threshold" value={threshold} onChange={setThreshold} min={0} max={1} step={.01} format={v => fmt(v, 2)} />
    </FlowControls>
    <FlowReadout>At threshold <strong>{fmt(threshold, 2)}</strong>: {counts.tp} of 12 nines caught, {counts.fp} false {counts.fp === 1 ? 'alarm' : 'alarms'} among 108 other digits. The decisions stay the same for any threshold above {fmt(lower, 6)} and up to {fmt(upper, 6)}. All 12 nines are caught for thresholds up to {fmt(probabilities[hardestNine], 6)}. Nothing is retrained: average precision {fmt(run.average_precision, 6)}, Brier score {fmt(run.brier, 6)} and log loss {fmt(run.unweighted_log_loss, 6)} stay fixed. Click any dot to see that image.</FlowReadout>
  </FlowLab>;
}

// Default negatives lie on one line through the anchor, with squared distances .25, 1.44 and 4:
// the same distances as the on-axis examples in the prose and API snippet, but visibly apart from p.
const startingPoints = [[0, 0], [1, 0], [.3, .4], [.72, .96], [1.2, 1.6]];
const boardMin = -2, boardMax = 3, boardScale = 72, boardPad = 20;
const boardX = v => boardPad + (v - boardMin) * boardScale;
const boardY = v => boardPad + (boardMax - v) * boardScale;
const clampBoard = v => Math.max(boardMin, Math.min(boardMax, Math.round(v * 100) / 100));
const kindName = { hard: 'hard', 'semi-hard': 'semi-hard', easy: 'easy' };
function NegativeMarker({ x, y, kind }) {
  return kind === 'hard' ? <polygon points={`${x},${y - 10} ${x - 9},${y + 7} ${x + 9},${y + 7}`} className="lf-board-negative" /> : kind === 'semi-hard' ? <rect x={x - 8} y={y - 8} width="16" height="16" className="lf-board-negative" /> : <polygon points={`${x},${y - 10} ${x + 10},${y} ${x},${y + 10} ${x - 10},${y}`} className="lf-board-negative" />;
}
function StepArrow({ from, direction, className, marker }) {
  const length = Math.hypot(...direction);
  if (!(length > 1e-12)) return null;
  const unit = direction.map(v => v / length), reach = .45;
  const end = [from[0] + unit[0] * reach, from[1] + unit[1] * reach];
  return <line x1={boardX(from[0])} y1={boardY(from[1])} x2={boardX(end[0])} y2={boardY(end[1])} className={className} markerEnd={`url(#${marker})`} />;
}
export function TripletGeometryLab() {
  const [points, setPoints] = useState(startingPoints),
    [margin, setMargin] = useState(1),
    [dragging, setDragging] = useState(null);
  const svg = useRef(null);
  const tags = ['a', 'p', 'n0', 'n1', 'n2'];
  const result = tripletGeometry(points, margin, true);
  const [a, p] = points;
  const inner = Math.sqrt(result.positive), outer = Math.sqrt(result.positive + margin);
  const mined = result.selected === null ? null : points[result.selected + 2];
  const collapsed = points.every(point => point[0] === points[0][0] && point[1] === points[0][1]);
  const move = (index, next) => setPoints(points.map((point, i) => i === index ? next.map(clampBoard) : point));
  const toData = event => {
    const matrix = svg.current.getScreenCTM().inverse();
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
    return [boardMin + (local.x - boardPad) / boardScale, boardMax - (local.y - boardPad) / boardScale];
  };
  const onKey = index => event => {
    const step = event.shiftKey ? .5 : .1;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[event.key];
    if (!delta) return;
    event.preventDefault();
    move(index, [points[index][0] + delta[0], points[index][1] + delta[1]]);
  };
  const zoneLabel = (radius, text) => radius > .25 && radius < 2.2 ? <text x={boardX(a[0] - radius * Math.cos(.35))} y={boardY(a[1] - radius * Math.sin(.35)) + 5} textAnchor="middle" className="lf-board-zone">{text}</text> : null;
  const describe = i => `${tags[i + 2]} ${kindName[result.candidates[i].kind]} (D² ${fmt(result.candidates[i].distance, 3)}, loss ${fmt(result.candidates[i].loss, 3)})`;
  return <FlowLab id="loss-triplet" label="Drag the points and change the margin to see which negative teaches">
    <svg ref={svg} className="lf-board" viewBox="0 0 400 400" role="group" aria-label="Equal-scale board from −2 to 3 on both axes, centred on the anchor a at the origin"
      onPointerMove={event => { if (dragging !== null) move(dragging, toData(event)); }}
      onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)}>
      <defs>{[['lf-pull-head', 'lf-board-pull-head'], ['lf-push-head', 'lf-board-push-head']].map(([id, className]) => <marker key={id} id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" className={className} /></marker>)}</defs>
      <line x1={boardX(boardMin)} y1={boardY(0)} x2={boardX(boardMax)} y2={boardY(0)} className="lf-board-axis" />
      <line x1={boardX(0)} y1={boardY(boardMin)} x2={boardX(0)} y2={boardY(boardMax)} className="lf-board-axis" />
      {[-2, 2, 3].map(v => <g key={v}><text x={boardX(v)} y={boardY(0) + 18} textAnchor="middle" className="lf-board-tick">{fmt(v)}</text><text x={boardX(0) - 7} y={boardY(v) + 5} textAnchor="end" className="lf-board-tick">{fmt(v)}</text></g>)}
      {outer > inner && <circle cx={boardX(a[0])} cy={boardY(a[1])} r={(inner + outer) / 2 * boardScale} className="lf-board-band" style={{ strokeWidth: (outer - inner) * boardScale }} />}
      {inner > 0 && <circle cx={boardX(a[0])} cy={boardY(a[1])} r={inner * boardScale} className="lf-board-ring" />}
      {outer > 0 && <circle cx={boardX(a[0])} cy={boardY(a[1])} r={outer * boardScale} className="lf-board-edge" />}
      {zoneLabel(inner / 2, 'hard')}
      {zoneLabel((inner + outer) / 2, 'semi-hard')}
      {zoneLabel(outer + .32, 'easy')}
      {points.slice(1).map(([px, py], i) => <line key={i} x1={boardX(a[0])} y1={boardY(a[1])} x2={boardX(px)} y2={boardY(py)} className="lf-board-spoke" />)}
      {mined && <><StepArrow from={p} direction={[a[0] - p[0], a[1] - p[1]]} className="lf-board-pull" marker="lf-pull-head" /><StepArrow from={mined} direction={[mined[0] - a[0], mined[1] - a[1]]} className="lf-board-push" marker="lf-push-head" /></>}
      <circle cx={boardX(a[0])} cy={boardY(a[1])} r="8" className="lf-board-anchor" />
      {points.map(([px, py], i) => i === 0 ? null : <g key={i} className="lf-board-handle" tabIndex={0} role="button"
        aria-label={`${i === 1 ? 'Positive p' : `Negative ${tags[i]}, ${kindName[result.candidates[i - 2].kind]}`} at (${fmt(px, 2)}, ${fmt(py, 2)}). Drag, or use arrow keys to move by 0.1 (Shift for 0.5).`}
        onPointerDown={event => { event.currentTarget.ownerSVGElement.setPointerCapture?.(event.pointerId); setDragging(i); }} onKeyDown={onKey(i)}>
        <circle cx={boardX(px)} cy={boardY(py)} r="16" className="lf-board-hit" />
        {i === 1 ? <circle cx={boardX(px)} cy={boardY(py)} r="7.5" className="lf-board-positive" /> : <NegativeMarker x={boardX(px)} y={boardY(py)} kind={result.candidates[i - 2].kind} />}
        {i > 1 && result.selected === i - 2 && <circle cx={boardX(px)} cy={boardY(py)} r="14" className="lf-board-selected" />}
      </g>)}
      {/* n0 starts close to the anchor, so its label goes above-left, clear of p's pull arrow on the axis. */}
      {points.map(([px, py], i) => <text key={i} x={boardX(px) + (i === 0 || i === 2 ? -12 : 14)} y={boardY(py) + (i < 3 ? -12 : 22)} textAnchor={i === 0 || i === 2 ? 'end' : 'start'} className="lf-board-label">{tags[i]}{i > 1 && result.selected === i - 2 ? ' · mined' : ''}</text>)}
    </svg>
    <p className="lf-figure-note">white a: the anchor, fixed at the origin · amber p: the positive · blue shapes: negatives (triangle hard, square semi-hard, diamond easy) · dashed amber ring: the positive's distance · shaded band: out to the margin · arrows: the direction of one gradient step (the anchor is held fixed here), amber pull on p, blue push on the mined negative</p>
    <FlowControls>
      <FlowSlider name="Margin α" value={margin} onChange={setMargin} min={0} max={4} step={.1} format={v => fmt(v, 2)} />
      <button type="button" onClick={() => setPoints(Array.from({ length: 5 }, () => [0, 0]))}>Collapse every point onto a</button>
      <button type="button" onClick={() => { setPoints(startingPoints); setMargin(1); }}>Restore the starting points</button>
    </FlowControls>
    <FlowReadout>{collapsed ? <>Every point sits on the anchor: each triplet's loss is the margin <strong>{fmt(margin, 2)}</strong>, but every derivative is zero, so nothing moves.</> : <>Positive D² = <strong>{fmt(result.positive, 3)}</strong>, so the semi-hard band is D² between {fmt(result.positive, 3)} and {fmt(result.positive + margin, 3)}. {result.candidates.map((_, i) => describe(i)).join('; ')}. {result.selected === null ? 'No semi-hard candidate: this anchor is skipped and nothing is pulled or pushed.' : <>The miner picks <strong>{tags[result.selected + 2]}</strong>, the nearest semi-hard negative.</>}</>}</FlowReadout>
  </FlowLab>;
}

const candidateCases = [['lead', 'the positive leads (.8, .2, −.1)', [.8, .2, -.1]], ['negative', 'a negative leads (.8, .9, −.1)', [.8, .9, -.1]], ['tie', 'all tied (.4, .4, .4)', [.4, .4, .4]]];
export function InfoNceLab() {
  const [caseKey, setCaseKey] = useState('lead'),
    [temperature, setTemperature] = useState(.2);
  const scores = candidateCases.find(([key]) => key === caseKey)[2];
  const result = candidateCompetition(scores, temperature);
  return <FlowLab id="loss-infonce" label="Lower the temperature and watch the shares sharpen">
    <div className="lf-shares" role="table" aria-label="Similarity, scaled logit and probability for three captions">
      <div role="row" className="lf-shares-head"><span role="columnheader">caption</span><span role="columnheader">similarity s</span><span role="columnheader">logit s ÷ τ</span><span role="columnheader">share</span></div>
      {scores.map((score, i) => <div role="row" key={i} className={i === 0 ? 'lf-shares-positive' : ''}>
        <span role="cell"><strong>caption {i}</strong>{i === 0 ? <em> correct</em> : ''}</span>
        <span role="cell">{fmt(score)}</span>
        <span role="cell">{fmt(result.logits[i], 3)}</span>
        <span role="cell" className="lf-bar-cell"><i className="lf-bar lf-bar-share" style={{ width: `${Math.max(1, result.probabilities[i] * 100)}%` }} />{fmt(result.probabilities[i] * 100, 2)}%</span>
      </div>)}
    </div>
    <FlowControls>
      <FlowChoice label="Similarities" value={caseKey} onChange={setCaseKey} options={candidateCases.map(([key, text]) => [key, text])} />
      <FlowSlider name="Temperature τ" value={temperature} onChange={setTemperature} min={.05} max={2} step={.05} format={v => fmt(v, 2)} />
    </FlowControls>
    <FlowReadout>Loss = −log share of caption 0 = <strong>{fmt(result.loss, 6)}</strong> nats; with no information the loss would be log 3 = {fmt(Math.log(3), 6)}. {caseKey === 'tie' ? 'All three similarities tie, so no temperature can separate them.' : caseKey === 'negative' ? 'A negative wins: lowering τ makes the correct caption even less probable.' : 'The positive leads: lowering τ hands it more of the probability.'}</FlowReadout>
  </FlowLab>;
}

export function LossScalingFigure() {
  return <figure className="lf-figure" data-figure="score-matrix-storage">
    <div className="lf-matrix-area">
      <div><div className="lf-matrix lf-matrix-small" /><p className="lf-figure-note">N = 1024: 1,048,576 scores, 4 MiB</p></div>
      <div><div className="lf-matrix lf-matrix-large" /><p className="lf-figure-note">N = 4096: 16,777,216 scores, 64 MiB</p></div>
    </div>
    <p className="lf-figure-note">squares drawn to scale: four times the side is sixteen times the area · float32 scores only, without encoder activations or gradients</p>
  </figure>;
}

export function ReductionFigure() {
  const sequences = [['short sequence, padded', [[4, 1], [0, 0], [0, 0]]], ['long sequence', [[1, 1], [1, 1], [1, 1]]]];
  const ways = [['Sum of real tokens', '4 + 1 + 1 + 1 = 7', 'every real token equally; longer data counts more'], ['Masked token mean Σ mᵢLᵢ ÷ Σ mᵢ', '7 ÷ 4 = 1.75', 'long sequence 3/4, short 1/4'], ['Mean of the two sequence means', '(4 + 1) ÷ 2 = 2.5', 'each sequence 1/2'], ['Token mean that ignores the mask', '(4 + 0 + 0 + 1 + 1 + 1) ÷ 6 = 1.1667', 'bug: padding counts as two perfect predictions'], ['Masked mean of an all-zero mask', '0 ÷ 0: undefined', 'needs an explicit rule']];
  return <figure className="lf-figure" data-figure="loss-reductions" id="loss-reductions">
    <div className="lf-tokens" role="table" aria-label="Per-token losses and masks for two sequences">{sequences.map(([name, tokens]) => <div role="row" key={name}><span role="rowheader">{name}</span>{tokens.map(([loss, mask], i) => <span role="cell" key={i} className={mask ? 'lf-token' : 'lf-token lf-token-pad'}>{mask ? `L = ${loss}` : 'pad × (L = 0)'}<small>mask {mask}</small></span>)}</div>)}</div>
    <ol className="lf-ways">{ways.map(([name, computation, weight], k) => <li key={name} className={k === 3 ? 'lf-way-bug' : ''}><strong>{name}</strong><span className="lf-way-value">{computation}</span><span>{weight}</span></li>)}</ol>
  </figure>;
}

import { useState } from 'react';
import { boostingPresets, ensembleNumber } from '../../data/ensemble-methods-models.js';
import { exponentialLineSearch, suppliedEdgeBounds } from '../../data/ensemble-boosting-flow-models.js';
import { EnsembleFlowFigure, EnsembleFlowCanvas } from './EnsembleFlowCombination.jsx';
import { EnsembleQuantity } from './EnsembleFlowControls.jsx';
import { useRetainedBoosting } from './EnsembleFlowBoostingControls.jsx';
import './ensemble-flow-boosting.css';

const positive = '#7fc9ba';
const negative = '#b2b7e1';
const mix = '#e8bb60';
const number = value => ensembleNumber(value, 8);
const sign = value => value > 0 ? '+1' : '−1';
const rowID = index => String.fromCharCode(65 + index);

function Operation({ x, y, width = 170, title, values, color = '#bdbdc5' }) {
  return <g>
    <rect x={x} y={y} width={width} height={40 + values.length * 25} fill="#17171b" stroke={color} />
    <text x={x + 12} y={y + 25} fill={color}>{title}</text>
    {values.map((value, index) => <text x={x + 12} y={y + 51 + index * 25} key={index}>{value}</text>)}
  </g>;
}

function Connection({ x1, y1, x2, y2, color = '#92929b' }) {
  const middle = (x1 + x2) / 2;
  return <g stroke={color} fill="none">
    <path d={`M${x1},${y1} H${middle} V${y2} H${x2}`} />
    <path d={`M${x2 - 7},${y2 - 4} L${x2},${y2} L${x2 - 7},${y2 + 4}`} />
  </g>;
}

export function EnsembleMechanismsFigure() {
  return <EnsembleFlowFigure job="D17" title="Three different objects determine the next fitting operation">
    <EnsembleFlowCanvas title="Independent bootstrap row multisets branch to separate fits and a prediction average" width={890} height={280}>
      <text x={16} y={25}>Bagging · fits can branch after samples are chosen</text>
      <Operation x={16} y={102} title="Training rows" values={['A–F: x, y']} />
      {['A,A,C,D,D,F', 'B,C,C,E,E,F', 'A,B,B,D,E,E'].map((rows, index) => <g key={rows}>
        <Connection x1={186} y1={134} x2={236} y2={69 + index * 81} />
        <Operation x={236} y={38 + index * 81} width={230} title={`Fit bag ${index + 1}`} values={[rows]} color={[positive, negative, '#db96af'][index]} />
        <Connection x1={466} y1={69 + index * 81} x2={550} y2={134} />
      </g>)}
      <Operation x={550} y={100} width={310} title="Saved prediction rule" values={['(f₁(x)+f₂(x)+f₃(x))/3']} color={mix} />
    </EnsembleFlowCanvas>
    <EnsembleFlowCanvas title="Current row loss determines masses for the next signed stump fit" width={1050} height={170}>
      <text x={16} y={25}>AdaBoost · the next fit depends on the current loss state</text>
      <Operation x={16} y={65} width={170} title="Current masses" values={['Dₜ over row IDs']} />
      <Connection x1={186} y1={97} x2={225} y2={97} />
      <Operation x={225} y={65} width={185} title="Weighted stump fit" values={['hₜ; weighted εₜ']} color={positive} />
      <Connection x1={410} y1={97} x2={452} y2={97} />
      <Operation x={452} y={65} width={260} title="Loss multiplication" values={['Dₜ exp(−αₜ y hₜ) / Zₜ']} color={mix} />
      <Connection x1={712} y1={97} x2={755} y2={97} />
      <Operation x={755} y={65} width={265} title="Next fit inputs" values={['Dₜ₊₁ → weighted hₜ₊₁']} />
    </EnsembleFlowCanvas>
    <EnsembleFlowCanvas title="Held-out row prediction cells become the fitting data for a meta learner" width={950} height={190}>
      <text x={16} y={25}>Stacking · fit a combiner on unseen-row member forecasts</text>
      <Operation x={16} y={65} width={240} title="Fit without held row i" values={['fresh member 1, member 2']} />
      <Connection x1={256} y1={97} x2={295} y2={97} />
      <Operation x={295} y={65} width={265} title="Write original row i" values={['P[i,1], P[i,2]', 'held xᵢ only; no held yᵢ']} color={positive} />
      <Connection x1={560} y1={97} x2={606} y2={97} />
      <Operation x={606} y={65} width={318} title="Meta fit" values={['completed P with target y', 'learn combining state']} color={mix} />
    </EnsembleFlowCanvas>
    <p>The row objects and dependencies differ. These paths encode fitting mechanisms and make no measured speed or performance comparison.</p>
  </EnsembleFlowFigure>;
}

export function WeightedStumpFigure() {
  const state = useRetainedBoosting();
  const frame = state.frame;
  const min = Math.min(...state.x) - .5;
  const max = Math.max(...state.x) + .5;
  const px = value => 100 + 600 * (value - min) / (max - min);
  const split = px(frame.stump.threshold);
  const wrong = frame.stump.predictions.flatMap((prediction, index) => prediction !== state.y[index] ? [index] : []);
  return <EnsembleFlowFigure job="D18" title="Fit a threshold using the current row masses">
    <EnsembleFlowCanvas title={`Attempt ${frame.round}: signed labels, before-fit mass and selected weighted stump`} width={860} height={400}>
      <text x={16} y={25}>Before-fit D{frame.round} · {state.stage === 0 ? 'first candidate; no vote accepted yet' : frame.status}</text>
      <text x={16} y={54}>Teal = true +1; periwinkle = true −1; amber outline = wrong stump sign</text>
      <line x1={100} x2={740} y1={118} y2={118} stroke="#414148" />
      <line x1={100} x2={740} y1={248} y2={248} stroke="#414148" />
      <text x={69} y={124} fill={positive}>+1</text><text x={69} y={254} fill={negative}>−1</text>
      <line x1={split} x2={split} y1={76} y2={293} stroke={mix} strokeDasharray="5 5" />
      <text x={Math.max(120, Math.min(700, split))} y={81} textAnchor="middle" fill={mix}>x ≤ {number(frame.stump.threshold)}</text>
      {state.x.map((x, index) => {
        const y = state.y[index] > 0 ? 118 : 248;
        return <g key={index}>
          <circle cx={px(x)} cy={y} r={36 * Math.sqrt(frame.before[index])} fill={state.y[index] > 0 ? positive : negative}
            stroke={wrong.includes(index) ? mix : '#ededf0'} strokeWidth={wrong.includes(index) ? 3 : 1} />
          <text x={px(x)} y={y + 45} textAnchor="middle">{rowID(index)}</text>
          <text x={px(x)} y={317} textAnchor="middle">x={x}</text>
        </g>;
      })}
      <text x={100} y={347}>Left returns {sign(frame.stump.polarity)}; right returns {sign(-frame.stump.polarity)}</text>
      <text x={100} y={380} fill={mix}>Weighted ε = {wrong.length ? wrong.map(index => `${rowID(index)}:${number(frame.before[index])}`).join(' + ') : '0 wrong mass'} = {number(frame.stump.error)}</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-boosting-table" tabIndex={0} role="region" aria-label="Original signed row labels, before-fit mass and selected stump output; pan if needed">
      <table><caption>Exact masses for the plotted bubble areas</caption>
        <thead><tr><th>Row</th><th>x / true y</th><th>Before-fit D</th><th>Stump h</th><th>Wrong mass</th></tr></thead>
        <tbody>{state.x.map((x, index) => <tr key={index}><th scope="row">{rowID(index)}</th>
          <td>{x} / {sign(state.y[index])}</td><td>{number(frame.before[index])}</td>
          <td>{sign(frame.stump.predictions[index])}</td><td>{wrong.includes(index) ? number(frame.before[index]) : '0'}</td></tr>)}</tbody>
      </table>
    </div>
    <div className="ensemble-flow-controls">
      <label>Signed training fixture<select aria-label="Signed boosting fixture" value={state.fixture} onChange={event => state.changeFixture(event.target.value)}>
        {Object.entries(boostingPresets).map(([id, fixture]) => <option key={id} value={id}>{fixture.label}</option>)}
      </select></label>
      <div className="ensemble-boosting-stage">
        <EnsembleQuantity label="Trace stage" value={state.stage} onChange={state.setStage} min={0} max={state.frames.length} integer revision={state.revision} />
        <div><button type="button" disabled={!state.stage} onClick={() => state.setStage(value => value - 1)}>Back one stage</button>
          <button type="button" disabled={state.stage === state.frames.length} onClick={() => state.setStage(value => value + 1)}>Advance one stage</button></div>
      </div>
      <details><summary>Advanced: allowed rounds</summary>
        <EnsembleQuantity label="Allowed round limit" value={state.rounds} onChange={state.changeRounds} min={1} max={12} integer revision={state.revision} />
      </details>
      <button type="button" onClick={state.reset}>Reset signed fixture, stages and query</button>
    </div>
    <p aria-live="polite">Stage {state.stage} of {state.frames.length} available attempts, allowed limit {state.rounds}.
      The shown stump uses D{frame.round}, not the after-update buffer. Its wrong rows are {wrong.length ? wrong.map(rowID).join(', ') : 'none'}.
      Bubble area is row mass, not probability of a predicted class.
      {frame.status === 'perfect' && ' Error zero stops with a dominating perfect member; there is no finite optimal coefficient.'}
      {frame.status === 'no-edge' && ' Error one half stops without adding a positive-edge vote.'}</p>
  </EnsembleFlowFigure>;
}

export function BoostingUpdateFigure() {
  const state = useRetainedBoosting();
  const frame = state.frame;
  if (state.stage === 0 || frame.status !== 'accepted') {
    return <EnsembleFlowFigure job="D19" title="Keep an unavailable update separate from the fitting buffer">
      <EnsembleFlowCanvas title="Current before-fit masses; no multiply/normalize update committed" width={790} height={110 + state.x.length * 42}>
        <text x={16} y={25}>{state.stage === 0 ? 'Stage 0: no update committed; advance to the first accepted step' : frame.status === 'perfect' ? 'Perfect: ε=0; no finite α or after-update D is stored' : 'No edge: ε=.5; α=0; no new distribution is accepted'}</text>
        {frame.before.map((mass, index) => <g key={index}>
          <text x={16} y={68 + 42 * index}>{rowID(index)} · before D = {number(mass)}</text>
          <circle cx={340} cy={62 + 42 * index} r={24 * Math.sqrt(mass)} fill={state.y[index] > 0 ? positive : negative} />
          <text x={395} y={68 + 42 * index}>after: unavailable</text>
        </g>)}
      </EnsembleFlowCanvas>
      <p>{state.stage === 0 ? 'The initial distribution is ready for fitting; the first update has not been accepted.' :
        frame.status === 'perfect' ? 'The saved perfect branch dominates inference instead of inventing a finite α.' : 'The existing saved votes are retained; a failed edge does not fabricate another update.'}</p>
    </EnsembleFlowFigure>;
  }
  const products = frame.before.map((mass, index) => {
    const signedCorrectness = state.y[index] * frame.stump.predictions[index];
    const factor = Math.exp(-frame.alpha * signedCorrectness);
    return { mass, signedCorrectness, factor, unnormalized: mass * factor, after: frame.after[index] };
  });
  return <EnsembleFlowFigure job="D19" title="Multiply each row, sum u into Z, then divide each contribution">
    <EnsembleFlowCanvas title={`Round ${frame.round}: actual before, exponential factors, unnormalized masses, sum and normalized after buffer`} width={1190} height={110 + state.x.length * 63}>
      <text x={16} y={25}>Round {frame.round} · α={number(frame.alpha)} · before D → unnormalized u → after D</text>
      <text x={16} y={54}>Row</text><text x={80} y={54}>D mass</text><text x={267} y={54}>× exp(−αyh)</text>
      <text x={467} y={54}>u</text><text x={851} y={54}>Row · u / Z</text><text x={1090} y={54}>after mass</text>
      {products.map((row, index) => {
        const y = 89 + 63 * index;
        const color = state.y[index] > 0 ? positive : negative;
        return <g key={index}>
          <text x={16} y={y + 5}>{rowID(index)}</text>
          <circle cx={91} cy={y} r={30 * Math.sqrt(row.mass)} fill={color} />
          <text x={128} y={y + 5}>{number(row.mass)}</text>
          <path d={`M240,${y} H258 M420,${y} H456`} stroke={color} fill="none" />
          <text x={267} y={y + 5}>{number(row.factor)}</text>
          <text x={267} y={y + 28}>y h = {sign(row.signedCorrectness)}</text>
          <text x={467} y={y + 5}>{number(row.unnormalized)}</text>
          <path d={`M580,${y} H604 V220 H634`} stroke={color} fill="none" />
          <path d={`M809,220 H830 V${y} H850`} stroke={color} fill="none" />
          <text x={851} y={y + 5}>{rowID(index)} · u/Z={number(row.after)}</text>
          <circle cx={1130} cy={y} r={30 * Math.sqrt(row.after)} fill={color} />
        </g>;
      })}
      <Operation x={634} y={176} width={175} title="Σ all u → Z" values={[number(frame.normalizer), 'divide every u by Z']} color={mix} />
      <text x={16} y={98 + state.x.length * 63}>After mass sum = {number(frame.after.reduce((sum, value) => sum + value, 0))}; wrong-row total = {number(products.reduce((sum, row) => sum + (row.signedCorrectness < 0 ? row.after : 0), 0))}</text>
    </EnsembleFlowCanvas>
    <p aria-live="polite">Round {frame.round} α={number(frame.alpha)}; Z={number(frame.normalizer)}.
      The wrong subset receives one half of the after distribution. This is a share of mass, not a fraction of rows.
      The stage control above changes all current stump, before and after operands together.</p>
  </EnsembleFlowFigure>;
}

export function SavedBoostingVoteFigure() {
  const state = useRetainedBoosting();
  const height = Math.max(170, 110 + state.votes.length * 78 + (state.dominant ? 80 : 0));
  return <EnsembleFlowFigure job="D20" title="A new query reads saved branches and their vote coefficients">
    <EnsembleFlowCanvas title="Retained signed route: branch sign times alpha, sum then score>=0 chooses+1" width={1080} height={height}>
      <text x={16} y={25}>Query x={number(state.query)} · saved votes only; no training D input</text>
      {state.votes.map((vote, index) => {
        const y = 63 + index * 78;
        return <g key={vote.round}>
          <text x={16} y={y}>h{vote.round}: x ≤ {number(vote.threshold)}?</text>
          <text x={16} y={y + 25}>left {sign(vote.polarity)} / right {sign(-vote.polarity)}</text>
          <Connection x1={229} y1={y + 7} x2={279} y2={y + 7} />
          <Operation x={279} y={y - 20} width={270} title={`returned h${vote.round} = ${sign(vote.sign)}`} values={[`× α${vote.round}=${number(vote.alpha)}`]} color={vote.sign > 0 ? positive : negative} />
          <Connection x1={549} y1={y + 7} x2={585} y2={y + 7} />
          <text x={594} y={y + 12} fill={vote.sign > 0 ? positive : negative}>{number(vote.contribution)}</text>
          <path d={`M711,${y + 7} H746 V94 H782`} stroke={mix} fill="none" />
        </g>;
      })}
      <Operation x={782} y={52} width={282} title={`Σ αh = ${number(state.score)}`} values={[
        state.dominant ? 'perfect member overrides finite sum' : 'F ≥ 0 → +1; F < 0 → −1',
        `prediction: ${sign(state.prediction)}`
      ]} color={mix} />
      {state.dominant && <text x={16} y={height - 38}>Dominating perfect h{state.dominant.round}: x ≤ {state.dominant.stump.threshold}; returned {sign(state.prediction)}. No finite α invented.</text>}
      {!state.votes.length && !state.dominant && <text x={16} y={80}>No saved positive-edge votes → F=0 → +1</text>}
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <EnsembleQuantity label="Saved signed-rule query x" value={state.query} onChange={state.setQuery} min={-1e6} max={1e6} step={.1} revision={state.revision} />
      <button type="button" onClick={state.reset}>Reset signed fixture, stages and query</button>
    </div>
    <p aria-live="polite">Stage {state.stage}: {state.dominant ? `perfect h${state.dominant.round} dominates` : `${state.votes.length} saved votes; F=${number(state.score)}`}.
      Predicted class {sign(state.prediction)} under this retained zero→+1 convention.
      The later N7 implementation declares its separate zero→−1 policy.</p>
  </EnsembleFlowFigure>;
}

export function ExponentialLineSearchFigure() {
  const [alpha, setAlpha] = useState(.5 * Math.log(5));
  const [error, setError] = useState(1 / 6);
  const [revision, setRevision] = useState(0);
  const state = exponentialLineSearch(error, alpha);
  const samples = Array.from({ length: 81 }, (_, index) => exponentialLineSearch(error, index * 1.6 / 80));
  const ymax = Math.max(1, Math.ceil(Math.max(...samples.map(row => row.total))));
  const px = x => 80 + x / 1.6 * 560;
  const py = y => 305 - y / ymax * 210;
  return <EnsembleFlowFigure job="D21" title="Correct and wrong mass contributions form the coefficient objective">
    <EnsembleFlowCanvas title="Numeric alpha axis and actual correct/wrong exponential contributions and sum" width={920} height={407}>
      <text x={16} y={25}>Z(α)=(1−ε)e⁻ᵅ + εeᵅ · fixed current ε={number(error)}</text>
      {[0, ymax / 2, ymax].map(value => <g key={value}>
        <line x1={80} x2={640} y1={py(value)} y2={py(value)} stroke="#414148" />
        <text x={67} y={py(value) + 5} textAnchor="end">{number(value)}</text>
      </g>)}
      <text x={80} y={76}>mass multiplier</text>
      {[0, .4, .8, 1.2, 1.6].map(value => <g key={value}>
        <line x1={px(value)} x2={px(value)} y1={305} y2={312} stroke="#92929b" />
        <text x={px(value)} y={335} textAnchor="middle">{value}</text>
      </g>)}
      <text x={325} y={365}>candidate coefficient α</text>
      {[['correct', positive], ['wrong', negative], ['total', mix]].map(([key, color]) => <g key={key}>
        <path d={samples.map((row, index) => `${index ? 'L' : 'M'}${px(row.alpha)},${py(row[key])}`).join(' ')} fill="none" stroke={color} strokeWidth={2} />
        <circle cx={px(alpha)} cy={py(state[key])} r={4} fill={color} />
      </g>)}
      <line x1={px(alpha)} x2={px(alpha)} y1={95} y2={305} stroke="#bdbdc5" strokeDasharray="4 4" />
      <text x={677} y={122} fill={positive}>(1−ε)e⁻ᵅ={number(state.correct)}</text>
      <text x={677} y={158} fill={negative}>εeᵅ={number(state.wrong)}</text>
      <text x={677} y={194} fill={mix}>Z={number(state.total)}</text>
      <text x={677} y={230}>Z′={number(state.derivative)}</text>
      {state.optimum !== null && state.optimum <= 1.6 && <>
        <circle cx={px(state.optimum)} cy={py(state.optimumZ)} r={7} fill="none" stroke={mix} />
        <text x={80} y={397}>Minimum α*={number(state.optimum)}, Z*={number(state.optimumZ)}</text>
      </>}
      {(state.optimum === null || state.optimum > 1.6) && <text x={80} y={397}>{state.optimum === null ? 'ε=0: infimum 0 as α→∞; no finite minimum' : `α*=${number(state.optimum)} lies beyond this labelled α window`}</text>}
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <EnsembleQuantity label="Candidate coefficient alpha" value={alpha} onChange={setAlpha} min={0} max={1.6} step={.02} revision={revision} />
      <EnsembleQuantity label="Weighted error epsilon" value={error} onChange={setError} min={0} max={.5} step={.01} revision={revision} />
      <button type="button" onClick={() => { setAlpha(.5 * Math.log(5)); setError(1 / 6); setRevision(value => value + 1); }}>Reset coefficient objective</button>
    </div>
    <p aria-live="polite">At α={number(alpha)}, correct contribution {number(state.correct)} and wrong contribution {number(state.wrong)} sum to {number(state.total)}.
      {state.status === 'perfect-no-finite-minimum' ? ' Perfect error 0 has no finite minimizing coefficient.' :
        state.status === 'no-positive-edge' ? ' Error .5 has α*=0 and no positive edge.' : ` The finite optimum is ${number(state.optimum)}; at that value the two derivative contributions cancel.`}{' '}
      The curve uses the whole exact entered error, including tiny positive errors; it does not clip them into another fitting rule.</p>
  </EnsembleFlowFigure>;
}

export function BoostingProductBoundFigure() {
  const state = useRetainedBoosting();
  const sequences = suppliedEdgeBounds();
  const accepted = state.committed.filter(frame => frame.status === 'accepted');
  const product = accepted.reduce((value, frame) => value * frame.normalizer, 1);
  const px = round => 80 + (round - 1) * 48;
  const py = value => 290 - value * 220;
  return <EnsembleFlowFigure job="D22" title="Products of training normalizers need an explicit edge assumption">
    <EnsembleFlowCanvas title="Each accepted trace normalizer feeds the product; exact training statement is separate from hypothetical edges" width={1070} height={170 + accepted.length * 34}>
      <text x={16} y={25}>Retained stage {state.stage}: actual accepted factors; no future-error curve</text>
      {accepted.map((frame, index) => <g key={frame.round}>
        <text x={16} y={65 + index * 34}>Round {frame.round}: Z={number(frame.normalizer)}</text>
        <path d={`M305,${60 + index * 34} H353 V87 H395`} stroke={mix} fill="none" />
      </g>)}
      <Operation x={395} y={51} width={650} title={`Π accepted Z = ${number(product)}`} values={[
        state.dominant ? 'perfect stopping convention: loss/bound 0' : `actual exponential training loss = ${number(state.stage ? state.frame.loss : 1)}`,
        'nonpositive-margin event ≤ exponential loss; no future-risk claim'
      ]} color={mix} />
      {!accepted.length && <text x={16} y={70}>Empty product = 1</text>}
    </EnsembleFlowCanvas>
    <EnsembleFlowCanvas title="Two declared mathematical edge sequences and their product/exponential training bounds" width={1020} height={400}>
      <text x={16} y={25}>Supplied hypotheses: constant γ=1/8; shrinking γₜ=1/[4(t+1)]</text>
      {[0, .5, 1].map(value => <g key={value}>
        <line x1={80} x2={608} y1={py(value)} y2={py(value)} stroke="#414148" />
        <text x={64} y={py(value) + 5} textAnchor="end">{value}</text>
      </g>)}
      <text x={80} y={54}>training upper-bound value</text>
      {[1, 4, 8, 12].map(round => <text key={round} x={px(round)} y={322} textAnchor="middle">{round}</text>)}
      <text x={290} y={357}>round count T</text>
      {Object.entries(sequences).map(([name, rows]) => <g key={name}>
        <path d={rows.map((row, index) => `${index ? 'L' : 'M'}${px(row.round)},${py(row.product)}`).join(' ')} fill="none" stroke={name === 'uniform' ? positive : negative} strokeWidth={2} />
        <path d={rows.map((row, index) => `${index ? 'L' : 'M'}${px(row.round)},${py(row.exponentialUpper)}`).join(' ')} fill="none" stroke={name === 'uniform' ? positive : negative} strokeDasharray="5 5" />
      </g>)}
      <text x={650} y={95} fill={positive}>Uniform: solid Π√(1−4γ²)</text>
      <text x={650} y={126} fill={negative}>Shrinking: solid Π√(1−4γₜ²)</text>
      <text x={650} y={161}>Dashed: exp(−2Σγₜ²)</text>
      <text x={650} y={211}>At T 12, Σγ²:</text>
      <text x={650} y={243} fill={positive}>uniform {number(sequences.uniform.at(-1).squaredEdges)}</text>
      <text x={650} y={275} fill={negative}>shrinking {number(sequences.shrinking.at(-1).squaredEdges)}</text>
      <text x={16} y={390}>A sustained lower edge gives a growing exponent. Shrinking positive edges alone do not.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-boosting-table" tabIndex={0} role="region" aria-label="Exact supplied edge-sequence factors and cumulative bounds; pan if needed">
      <table><caption>These two mathematical sequences are assumptions, not measured model runs</caption>
        <thead><tr><th>Round</th><th>Uniform γ / Z / product</th><th>Shrinking γ / Z / product</th><th>Shrinking Σγ² / exp bound</th></tr></thead>
        <tbody>{sequences.uniform.map((row, index) => <tr key={row.round}>
          <th scope="row">{row.round}</th><td>{number(row.edge)} / {number(row.normalizer)} / {number(row.product)}</td>
          <td>{number(sequences.shrinking[index].edge)} / {number(sequences.shrinking[index].normalizer)} / {number(sequences.shrinking[index].product)}</td>
          <td>{number(sequences.shrinking[index].squaredEdges)} / {number(sequences.shrinking[index].exponentialUpper)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p>The shrinking sequence is the same hypothesis as practice F. Its squared-edge series converges, so positive edge at each round does not supply a uniform exponential guarantee. The current trace's training statements and these supplied hypotheses are separate objects.</p>
  </EnsembleFlowFigure>;
}

export function NormalizedMarginFigure() {
  const state = useRetainedBoosting();
  const px = margin => 110 + (margin + 1) * 255;
  const py = fraction => 300 - fraction * 205;
  const segments = [];
  if (state.margins) {
    let fraction = 0;
    let x = px(-1);
    for (const group of state.groups) {
      segments.push(`M${x},${py(fraction)} H${px(group.margin)} V${py(group.cdf)}`);
      x = px(group.margin);
      fraction = group.cdf;
    }
    segments.push(`M${x},${py(fraction)} H${px(1)}`);
  }
  return <EnsembleFlowFigure job="D23" title="Each indexed signed vote makes one finite normalized-margin observation">
    <EnsembleFlowCanvas title="Exact empirical cumulative counts with unavailable zero-vote/perfect-limit states" width={1000} height={426}>
      <text x={16} y={25}>Stage {state.stage}: denominator Σ accepted finite α = {number(state.totalAlpha)}</text>
      <text x={110} y={66}>fraction with margin ≤ θ</text>
      {[0, .5, 1].map(value => <g key={value}>
        <line x1={110} x2={620} y1={py(value)} y2={py(value)} stroke="#414148" />
        <text x={96} y={py(value) + 5} textAnchor="end">{value}</text>
      </g>)}
      {[-1, -.5, 0, .5, 1].map(value => <text x={px(value)} y={329} key={value} textAnchor="middle">{value}</text>)}
      <text x={258} y={363}>normalized threshold θ</text>
      {state.margins ? <>
        <path d={segments.join(' ')} fill="none" stroke={mix} strokeWidth={2} />
        {state.groups.map((group, index) => <g key={index}>
          <circle cx={px(group.margin)} cy={py(group.cdf)} r={4} fill={mix} />
          <line x1={px(group.margin)} x2={650} y1={py(group.cdf)} y2={100 + (state.groups.length - 1 - index) * 38} stroke="#777780" />
          <text x={660} y={106 + (state.groups.length - 1 - index) * 38}>{group.ids.join(', ')}: m={number(group.margin)}; count {group.count}/{state.margins.length}</text>
        </g>)}
        <text x={16} y={403}>At θ 0: nonpositive-margin fraction = {number(state.nonpositiveFraction)}; this bound event includes vote ties.</text>
      </> : <text x={110} y={204}>{state.dominant ? 'Perfect dominating member: finite α denominator not defined' : 'No positive vote mass: normalized margin unavailable'}</text>}
    </EnsembleFlowCanvas>
    {state.margins && <div className="ensemble-boosting-table" tabIndex={0} role="region" aria-label="Original row identity, signed vote numerator and normalized margin; pan if needed">
      <table><caption>Divide each actual yF by the same saved positive vote total</caption>
        <thead><tr><th>Row</th><th>y</th><th>F</th><th>yF</th><th>Σα</th><th>Margin</th></tr></thead>
        <tbody>{state.margins.map(row => <tr key={row.id}><th scope="row">{row.id}</th><td>{sign(row.label)}</td>
          <td>{number(row.score)}</td><td>{number(row.numerator)}</td><td>{number(state.totalAlpha)}</td><td>{number(row.margin)}</td></tr>)}</tbody>
      </table>
    </div>}
    <div className="ensemble-flow-controls">
      <label>Saved trace stage<select aria-label="Margin trace stage" value={state.stage} onChange={event => state.setStage(Number(event.target.value))}>
        {Array.from({ length: state.frames.length + 1 }, (_, index) => <option key={index} value={index}>{index === 0 ? '0: no accepted votes' : `${index}: ${state.frames[index - 1].status}`}</option>)}
      </select></label>
      <button type="button" onClick={state.reset}>Reset signed fixture, stages and query</button>
    </div>
    <p aria-live="polite">{state.margins ? `${state.margins.length} actual row margins; cumulative counting uses ≤, including exact ties. Labels share a mark only when their actual margins coincide.` :
      state.dominant ? 'A perfect dominating vote has no finite normalized-margin denominator in this stopping policy.' : 'No positive accepted vote mass: retain unavailable margins, rather than a fabricated zero distribution.'}{' '}
      The retained hard prediction still uses zero→+1. A nonpositive margin is the event bounded by exponential loss; it is not a redefinition of that prediction tie.</p>
  </EnsembleFlowFigure>;
}

import { ensembleNumber, oofOwnershipState } from '../../data/ensemble-methods-models.js';
import { ensembleProductNumber } from '../../data/ensemble-combination-flow-models.js';
import { EnsembleFlowFigure, EnsembleFlowCanvas } from './EnsembleFlowCombination.jsx';
import { EnsembleQuantity } from './EnsembleFlowControls.jsx';
import { CombinerMatrixEntry, useStackingOwnership, useEditedCombiner } from './EnsembleFlowStackingControls.jsx';
import './ensemble-flow-stacking.css';

const hues = ['#7fc9ba', '#b2b7e1', '#db96af', '#80b3e8', '#d8aece'];
const mix = '#e8bb60';
const id = index => String.fromCharCode(65 + index);
const names = indices => indices.map(id).join(', ');
const number = value => Number.isFinite(value) && Math.abs(value) >= 1e7 ? value.toExponential(5) : ensembleNumber(value, 8);
const completeHonest = oofOwnershipState('honest', 3, 2.5);

function OwnershipReset({ reset }) {
  return <button type="button" onClick={reset}>Reset OOF trace, provenance and query</button>;
}

function RowSelector({ label, row, setRow }) {
  return <label>{label}<select aria-label={label} value={row} onChange={event => setRow(Number(event.target.value))}>
    {Array.from({ length: 6 }, (_, index) => <option key={index} value={index}>{id(index)}</option>)}
  </select></label>;
}

function PredictionMatrix({ state, caption, selected = null }) {
  return <div className="ensemble-stacking-table" tabIndex={0} role="region" aria-label={`${caption}; pan if needed`}>
    <table><caption>{caption}</caption>
      <thead><tr><th>Original row</th><th>x</th><th style={{ color: hues[0] }}>Member A: nearest</th>
        <th style={{ color: hues[1] }}>Member B: line</th><th>Separate target y</th></tr></thead>
      <tbody>{[1, 2, 2, 6, 7, 8].map((target, index) => <tr key={index} aria-current={selected === index ? 'true' : undefined}>
        <th scope="row">{id(index)}</th><td>{index}</td>
        <td>{state.matrix[index][0] === null ? 'unavailable' : number(state.matrix[index][0])}</td>
        <td>{state.matrix[index][1] === null ? 'unavailable' : number(state.matrix[index][1])}</td><td>{target}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function Wire({ x1, y1, x2, y2, color = '#92929b' }) {
  return <g stroke={color} fill="none">
    <path d={`M${x1},${y1} H${(x1 + x2) / 2} V${y2} H${x2}`} />
    <path d={`M${x2 - 7},${y2 - 4} L${x2},${y2} L${x2 - 7},${y2 + 4}`} />
  </g>;
}

function Operand({ x, y, width = 220, title, lines, color = '#bdbdc5' }) {
  return <g>
    <rect x={x} y={y} width={width} height={42 + lines.length * 26} fill="#17171b" stroke={color} />
    <text x={x + 12} y={y + 25} fill={color}>{title}</text>
    {lines.map((line, index) => <text key={index} x={x + 12} y={y + 53 + index * 26}>{line}</text>)}
  </g>;
}

export function CompleteOOFMatrixFigure() {
  return <EnsembleFlowFigure job="D24" title="Complete honest P, observed y and learned w are separate objects">
    <EnsembleFlowCanvas title="Fold-specific permitted fit rows produce original-position cells, then P/y fit the two-vector" width={1040} height={385}>
      <text x={16} y={25}>Six all-training rows A–F → six unseen-row meta examples</text>
      {completeHonest.stages.map((fold, index) => <g key={index}>
        <Operand x={16} y={53 + index * 99} width={245} title={`Fit fresh bases on ${names(fold.train)}`} lines={[`held destinations ${names(fold.held)}`]} />
        <Wire x1={261} y1={87 + index * 99} x2={307} y2={87 + index * 99} />
        <Operand x={307} y={53 + index * 99} width={365} title={`Write P[${names(fold.held)}, nearest/line]`} lines={fold.held.map((row, position) => `${id(row)} → [${fold.predictions[position].map(number).join(', ')}]`)} color={hues[0]} />
        <Wire x1={672} y1={87 + index * 99} x2={711} y2={184} />
      </g>)}
      <Operand x={711} y={110} width={310} title="Completed P[6,2] with y[6]" lines={[
        'fit combiner; no held y in base fits',
        `wA=${number(completeHonest.weightNearest)}`,
        `wB=${number(1 - completeHonest.weightNearest)}`
      ]} color={mix} />
      <text x={16} y={371}>This complete honest matrix remains visible while the separate construction trace below is partial.</text>
    </EnsembleFlowCanvas>
    <PredictionMatrix state={completeHonest} caption="Complete honest row-by-member matrix; target column is outside the base inputs" />
  </EnsembleFlowFigure>;
}

export function HeldFoldConstructionFigure() {
  const state = useStackingOwnership();
  const fold = state.active;
  return <EnsembleFlowFigure job="D25" title="Fresh fits omit held targets and write into their original row positions">
    <EnsembleFlowCanvas title={`Honest fold ${Math.max(1, state.completed)} permitted/held ownership and actual cell writes`} width={1060} height={292}>
      <text x={16} y={25}>{state.completed ? `Most recently filled fold ${state.completed}` : 'No fold filled; first pending fold shown without a write'}</text>
      <Operand x={16} y={65} width={257} title={`Permitted fit rows ${names(fold.train)}`} lines={[
        `x=[${fold.train.join(', ')}]`,
        `y=[${fold.train.map(index => state.rows[index].y).join(', ')}]`
      ]} />
      <Wire x1={273} y1={106} x2={314} y2={106} />
      <Operand x={314} y={65} width={277} title="Fresh cloned member fits" lines={[
        'nearest on permitted rows',
        `line: b=${number(fold.line.intercept)}`,
        `slope=${number(fold.line.slope)}`
      ]} color={hues[0]} />
      <Wire x1={591} y1={106} x2={631} y2={106} />
      <Operand x={631} y={65} width={411} title={`Held x only: ${names(fold.held)}`} lines={fold.held.map((index, position) =>
        `${id(index)} x=${index} → [${fold.predictions[position].map(number).join(', ')}]`)} color={hues[1]} />
      <text x={16} y={232}>Held targets do not enter these base fits. Original IDs are the matrix destinations.</text>
      <text x={16} y={265} fill={mix}>Inspected {id(state.row)}: {state.trace.matrix[state.row][0] === null ? 'both cells unavailable in this partial trace' : `[${state.trace.matrix[state.row].map(number).join(', ')}] written at original row position`}</text>
    </EnsembleFlowCanvas>
    <PredictionMatrix state={state.trace} caption={`${state.completed} of 3 honest folds filled; unavailable cells are not zeros`} selected={state.row} />
    <div className="ensemble-flow-controls">
      <EnsembleQuantity label="Completed honest folds" value={state.completed} onChange={state.setCompleted} min={0} max={3} integer revision={state.revision} />
      <RowSelector label="Inspect construction row" row={state.row} setRow={state.setRow} />
      <OwnershipReset reset={state.reset} />
    </div>
    <p aria-live="polite">{state.completed * 2} of 6 rows are covered in this partial construction.
      Complete honest P and the current complete inference remain available independently.
      The named leakage comparison changes a separate provenance mode, not this honest fold protocol.</p>
  </EnsembleFlowFigure>;
}

export function MemorizationContrastFigure() {
  const state = useStackingOwnership();
  const row = state.row;
  const heldFold = state.honest.stages.find(fold => fold.held.includes(row));
  const target = state.rows[row].y;
  return <EnsembleFlowFigure job="D26" title="The same target-copying neighbor needs a different provenance interpretation">
    <div className="ensemble-stacking-table" tabIndex={0} role="region" aria-label="Honest unseen-row nearest forecasts beside target-copy in-sample forecasts; pan if needed">
      <table><caption>All six original identities stay fixed across the two ownership modes</caption>
        <thead><tr><th>Row / target</th><th>Honest neighbor</th><th>Target-copy neighbor</th><th>Current neighbor residual</th></tr></thead>
        <tbody>{state.rows.map((source, index) => <tr key={source.id} aria-current={index === row ? 'true' : undefined}>
          <th scope="row">{source.id} / {source.y}</th><td>{state.honest.matrix[index][0]}</td><td>{source.y}</td>
          <td>{number(state.full.matrix[index][0] - source.y)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <EnsembleFlowCanvas title="Inspected row ownership causes either legal nearest reading or in-sample memorization, before the weight fit" width={1090} height={240}>
      <text x={16} y={25}>Current mode: {state.mode === 'honest' ? 'honest unseen-row forecasts' : 'leaked: fit all rows before predicting them'}</text>
      <Operand x={16} y={62} width={269} title={state.mode === 'honest' ? `Fit rows ${names(heldFold.train)}` : 'Fit rows A,B,C,D,E,F'} lines={[
        state.mode === 'honest' ? `${id(row)} target excluded` : `${id(row)} target ${target} used in this fit`,
        `read x=${row}`
      ]} />
      <Wire x1={285} y1={103} x2={325} y2={103} />
      <Operand x={325} y={62} width={285} title={`Nearest column, row ${id(row)}`} lines={[
        `forecast=${number(state.full.matrix[row][0])}`,
        `target=${target}; residual=${number(state.full.matrix[row][0] - target)}`
      ]} color={hues[0]} />
      <Wire x1={610} y1={103} x2={650} y2={103} />
      <Operand x={650} y={62} width={424} title="Fit using the complete current P and y" lines={[
        `neighbor w=${number(state.full.weightNearest)}`,
        `line w=${number(1 - state.full.weightNearest)}`,
        `meta-training MSE=${number(state.full.trainMse)}`
      ]} color={mix} />
      <text x={16} y={227}>Zero residual follows target-copy ownership here; a small error alone does not establish that ownership.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <label>Combiner-training provenance<select aria-label="Combiner-training provenance" value={state.mode} onChange={event => state.setMode(event.target.value)}>
        <option value="honest">Honest held-row predictions</option><option value="leaky">Incorrect in-sample target-copy predictions</option>
      </select></label>
      <RowSelector label="Inspect contrast row" row={state.row} setRow={state.setRow} />
      <OwnershipReset reset={state.reset} />
    </div>
    <p aria-live="polite">The current complete matrix learns neighbor weight {number(state.full.weightNearest)}.
      {state.mode === 'leaky' ? ' Its target-copy column contains the answers, so zero fitted error and weight 1 do not assess unseen-row behavior.' : ' Every honest cell came from a fit excluding that row’s target.'}{' '}
      This mode supplies the saved combination used below.</p>
  </EnsembleFlowFigure>;
}

export function FullRefitInferenceFigure() {
  const state = useStackingOwnership();
  const current = state.full;
  const weight = current.weightNearest;
  const selected = state.rows.reduce((best, source, index) => Math.abs(source.x - state.query) < Math.abs(state.rows[best].x - state.query) ? index : best, 0);
  return <EnsembleFlowFigure job="D27" title="Read full-training saved bases and the already learned combining weight">
    <EnsembleFlowCanvas title="Full six-row nearest/line rules read a new query, multiply by saved weights and add" width={1240} height={314}>
      <text x={16} y={25}>Query x={number(state.query)} · bases refitted on A–F · saved {state.mode === 'honest' ? 'honest OOF' : 'leaked in-sample'} weight</text>
      <Operand x={16} y={101} width={170} title="New feature only" lines={[`x=${number(state.query)}`]} />
      <Wire x1={186} y1={133} x2={230} y2={80} />
      <Wire x1={186} y1={133} x2={230} y2={215} />
      <Operand x={230} y={46} width={328} title={`Full nearest chooses row ${id(selected)}`} lines={[
        `distance=${number(Math.abs(selected - state.query))}`,
        `target read=${number(current.nearest)}`
      ]} color={hues[0]} />
      <Operand x={230} y={179} width={328} title="Full saved line: slope × x + b" lines={[
        `${number(current.fullLine.slope)} × ${number(state.query)}`,
        `+ ${number(current.fullLine.intercept)} = ${number(current.linear)}`
      ]} color={hues[1]} />
      <Wire x1={558} y1={80} x2={600} y2={80} color={hues[0]} />
      <Wire x1={558} y1={215} x2={600} y2={215} color={hues[1]} />
      <Operand x={600} y={46} width={277} title={`× saved wA=${number(weight)}`} lines={[`product=${number(weight * current.nearest)}`]} color={hues[0]} />
      <Operand x={600} y={179} width={277} title={`× saved wB=${number(1 - weight)}`} lines={[`product=${number((1 - weight) * current.linear)}`]} color={hues[1]} />
      <Wire x1={877} y1={80} x2={919} y2={145} color={hues[0]} />
      <Wire x1={877} y1={215} x2={919} y2={145} color={hues[1]} />
      <Operand x={919} y={107} width={302} title="Add both weighted forecasts" lines={[`forecast=${number(current.ensemble)}`]} color={mix} />
      <text x={16} y={307}>Equal nearest distances choose the earliest original row. Neither a new target nor the partial OOF trace enters inference.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <EnsembleQuantity label="Full-refit query x" value={state.query} onChange={state.setQuery} min={0} max={5} step={.1} revision={state.revision} />
      <OwnershipReset reset={state.reset} />
    </div>
    <p aria-live="polite">Nearest {number(current.nearest)} and line {number(current.linear)} combine to {number(current.ensemble)}{' '}
      under the saved {state.mode === 'honest' ? 'honest' : 'leaked'} weight. The construction trace currently has {state.completed} completed folds;
      that trace does not remove this complete saved rule.</p>
  </EnsembleFlowFigure>;
}

export function GeneralCombinerFitFigure() {
  const state = useEditedCombiner();
  const count = state.weights.length;
  const sumX = 100 + 195 * count;
  const width = sumX + 340;
  const height = 128 + 64 * state.rows.length;
  const gradientProducts = state.rows.map(row => row.forecasts.map(value => value * row.residual));
  return <EnsembleFlowFigure job="D28" title="Each row sends a weighted prediction forward and derivative products back">
    <div className="ensemble-stacking-table" tabIndex={0} role="region" aria-label="Complete current prediction matrix and separate target vector; pan if needed">
      <table><caption>P[{state.rows.length},{count}] and y[{state.rows.length}], current constraint {state.constraint}</caption>
        <thead><tr><th>Row</th>{Array.from({ length: count }, (_, member) => <th key={member} style={{ color: hues[member] }}>Member {id(member)}</th>)}<th>Target y</th></tr></thead>
        <tbody>{state.rows.map(row => <tr key={row.id}><th scope="row">{row.id}</th>
          {row.forecasts.map((value, member) => <td key={member}>{number(value)}</td>)}<td>{number(row.target)}</td></tr>)}</tbody>
      </table>
    </div>
    <EnsembleFlowCanvas title="Actual per-row member products, sum and residual under current coefficients" width={width} height={height}>
      <text x={16} y={25}>{state.status === 'converged' ? 'Fitted weights' : 'Current iterate; no converged fitted rule'} · w[{count}]</text>
      {state.weights.map((weight, member) => <text key={member} x={95 + 195 * member} y={55} fill={hues[member]}>w{id(member)}={number(weight)}</text>)}
      <text x={sumX} y={55}>sum P w → residual P w − y</text>
      {state.rows.map((row, index) => <g key={row.id}>
        <text x={16} y={94 + 64 * index}>{row.id}</text>
        {row.forecasts.map((value, member) => <g key={member}>
          <text x={95 + 195 * member} y={90 + 64 * index} fill={hues[member]}>{number(value)} × {number(state.weights[member])}</text>
          <text x={95 + 195 * member} y={113 + 64 * index} fill={hues[member]}>= {ensembleProductNumber([value, state.weights[member]], 6)}</text>
          <path d={`M${265 + 195 * member},${118 + 64 * index} V${134 + 64 * index} H${sumX - 45} V${100 + 64 * index} H${sumX - 28}`} stroke={hues[member]} fill="none" />
        </g>)}
        <circle cx={sumX - 15} cy={100 + 64 * index} r={12} fill="#17171b" stroke={mix} />
        <text x={sumX - 15} y={106 + 64 * index} textAnchor="middle" fill={mix}>Σ</text>
        <text x={sumX} y={91 + 64 * index}>{row.id}: forecast {number(row.prediction)}</text>
        <text x={sumX} y={116 + 64 * index}>{number(row.prediction)} − {number(row.target)} = {number(row.residual)}</text>
      </g>)}
      <text x={16} y={height - 8}>Products retain underflow magnitudes in scientific notation. Sum uses scaled row coordinates.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-stacking-table" tabIndex={0} role="region" aria-label="Each row residual times every prediction column feeds its coefficient derivative; pan if needed">
      <table><caption>Transpose return: derivative contribution P[i,j] × residual[i]</caption>
        <thead><tr><th>Row / residual</th>{Array.from({ length: count }, (_, member) => <th key={member} style={{ color: hues[member] }}>to coefficient {id(member)}</th>)}</tr></thead>
        <tbody>{state.rows.map((row, index) => <tr key={row.id}><th scope="row">{row.id} / {number(row.residual)}</th>
          {row.forecasts.map((value, member) => <td key={member}>{number(value)} × {number(row.residual)} = {ensembleProductNumber([value, row.residual], 6)}</td>)}
        </tr>)}</tbody>
        <tfoot><tr><th>Sum all rows</th>{state.weights.map((_, member) => <td key={member}>{number(gradientProducts.reduce((sum, row) => sum + row[member], 0))}</td>)}</tr></tfoot>
      </table>
    </div>
    <EnsembleFlowCanvas title="Actual derivative sums divide by row count and add ridge coordinate; gradient returns to projected coefficient step" width={Math.max(850, count * 235 + 30)} height={244}>
      {state.weights.map((weight, member) => {
        const x = 16 + member * 235;
        return <g key={member}>
          <Operand x={x} y={24} width={218} title={`Coefficient ${id(member)}`} lines={[
            `Σ P r=${number(gradientProducts.reduce((sum, row) => sum + row[member], 0))}`,
            `÷ ${state.rows.length}; add λw=${number(state.strength * weight)}`,
            `g${id(member)}=${number(state.gradient[member])}`
          ]} color={hues[member]} />
          <path d={`M${x + 109},145 V174`} fill="none" stroke={hues[member]} />
          <text x={x} y={198}>w{id(member)} − η g{id(member)}</text>
        </g>;
      })}
      <text x={16} y={233}>{state.status === 'numerical-resolution' ? 'No finite next step is certified; retain the entered matrix and current iterate' :
        `η=${number(state.step)} → ${state.constraint === 'simplex' ? 'Euclidean simplex projection' : state.constraint === 'nonnegative' ? 'clip negative coordinates to 0' : 'unrestricted next coordinates'}`}</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <label>Coefficient constraint<select aria-label="Coefficient constraint" value={state.constraint} onChange={event => state.setConstraint(event.target.value)}>
        <option value="simplex">Simplex: nonnegative and sum 1</option><option value="nonnegative">Nonnegative only; sum free</option><option value="unrestricted">Unrestricted ridge</option>
      </select></label>
      <EnsembleQuantity label="Combiner ridge strength" value={state.strength} onChange={state.setStrength} min={0} max={10} step={.1} revision={state.revision} />
      <CombinerMatrixEntry problem={state.problem} onChange={state.setProblem} revision={state.revision} />
      <button type="button" onClick={state.reset}>Reset general matrix fit</button>
    </div>
    <p aria-live="polite">Status: {state.status}. {state.message} Coefficient sum {number(state.weights.reduce((a, b) => a + b, 0))};
      objective {number(state.objective)}; projected mapping {number(state.mapping)}, direct stationarity {number(state.stationarity)},
      feasibility {number(state.feasibility)}; steps {state.iteration}. {state.uniqueness}.
      {state.residualScale !== 0 && state.scaledResidualSquares !== 0 && state.objective === 0 && <>
        Positive residual objective magnitude {ensembleProductNumber([state.residualScale, state.residualScale, state.scaledResidualSquares], 6)} lies below a floating-point product.
      </>}{' '}
      Changing P, y or its constraint fits this combining problem; it does not refit any base model.</p>
    <p>{state.constraint === 'simplex' ? 'At a simplex optimum, active coefficients share a gradient. Redistributing mass keeps their sum fixed, so the common gradient shift is removed by projection; the raw gradient need not be zero.' :
      state.constraint === 'nonnegative' ? 'A positive coefficient needs gradient zero. At a zero coefficient, a nonnegative gradient asks for a forbidden negative step and can satisfy the boundary condition.' :
      'Without coefficient constraints, every gradient coordinate must approach zero.'}</p>
  </EnsembleFlowFigure>;
}

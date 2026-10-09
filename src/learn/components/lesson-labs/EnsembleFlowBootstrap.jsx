import { useState } from 'react';
import { bootstrapRows, bootstrapAbsenceLaw, editedBootstrapState } from '../../data/ensemble-bootstrap-flow-models.js';
import { ensembleNumber } from '../../data/ensemble-methods-models.js';
import { EnsembleFlowFigure, EnsembleFlowCanvas } from './EnsembleFlowCombination.jsx';
import { EnsembleQuantity } from './EnsembleFlowControls.jsx';
import { BootstrapDrawEntry, useBootstrapBags } from './EnsembleFlowBootstrapControls.jsx';
import './ensemble-flow-bootstrap.css';

const bagColors = ['#7fc9ba', '#b2b7e1', '#db96af'];
const mix = '#e8bb60';
const number = value => ensembleNumber(value, 8);
const ids = rows => rows.map(row => `${row.id}${row.position + 1}`).join(', ');

function ResetBags({ reset }) {
  return <button type="button" onClick={reset}>Reset draws, bag and inspected row</button>;
}

export function BootstrapDrawFigure() {
  const state = useBootstrapBags();
  const { fits } = editedBootstrapState(state.bags, state.row);
  const fit = fits[state.selectedBag];
  const color = bagColors[state.selectedBag];
  const height = Math.max(378, 70 + fit.occurrences.length * 28);
  return <EnsembleFlowFigure job="D13" title="A draw position retains its original row identity">
    <EnsembleFlowCanvas title={`Bag ${state.selectedBag + 1} routes every ordered occurrence from its source row`} width={740} height={height}>
      <text x={16} y={25}>Original all-training rows</text>
      <text x={330} y={25} fill={color}>Bag {state.selectedBag + 1}: draw position → identity</text>
      {bootstrapRows.map((row, index) => <g key={row.id}>
        <rect x={16} y={45 + 50 * index} width={204} height={36} fill="#17171b" stroke="#777780" />
        <text x={27} y={69 + 50 * index}>{row.id} · x={row.x} · y={row.y}</text>
        <circle cx={225} cy={63 + 50 * index} r={3} fill={fit.counts[index] ? color : '#777780'} />
        <text x={550} y={69 + 50 * index}>{row.id} count = {fit.counts[index]}</text>
      </g>)}
      {fit.occurrences.map(row => {
        const y = 63 + row.position * 28;
        const sourceY = 63 + row.index * 50;
        return <g key={row.position}>
          <path d={`M229,${sourceY} C275,${sourceY} 280,${y} 326,${y}`} stroke={color} fill="none" />
          <path d={`M319,${y - 4} L326,${y} L319,${y + 4}`} stroke={color} fill="none" />
          <rect x={330} y={y - 12} width={170} height={24} fill="#17171b" stroke={color} />
          <text x={341} y={y + 6} fill={color}>#{row.position + 1} → {row.id}, y={row.y}</text>
        </g>;
      })}
      <text x={16} y={height - 12}>Count vector A–F: [{fit.counts.join(', ')}] · total draws = {fit.occurrences.length}</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <label>Selected bag<select aria-label="Selected bootstrap bag" value={state.selectedBag}
        onChange={event => state.setSelectedBag(Number(event.target.value))}>
        {[0, 1, 2].map(index => <option key={index} value={index}>Bag {index + 1}</option>)}
      </select></label>
      <label>Named draw example<select aria-label="Bootstrap draw example" value={state.preset}
        onChange={event => state.changePreset(event.target.value)}>
        <option value="repeated">Repeated six-draw samples</option>
        <option value="allRows">Every row appears once</option>
        <option value="smallBags">Three draws per sample</option>
        {state.preset === 'edited' && <option value="edited">Current edited samples</option>}
      </select></label>
      <ResetBags reset={state.reset} />
    </div>
    <p aria-live="polite">Bag {state.selectedBag + 1} contains {fit.occurrences.length} training contributions
      from {fit.counts.filter(count => count > 0).length} distinct rows. An arrow belongs to a draw position;
      repeated {fit.occurrences.map(row => row.id).join(', ')} identities have not been deduplicated.</p>
  </EnsembleFlowFigure>;
}

function Leaf({ x, y, width, label, rows, mean, sse, color }) {
  const chunks = [];
  for (let start = 0; start < rows.length; start += 3) chunks.push(rows.slice(start, start + 3));
  return <g>
    <rect x={x} y={y} width={width} height={94 + chunks.length * 25} fill="#17171b" stroke={color} />
    <text x={x + 12} y={y + 25} fill={color}>{label} · {rows.length} contributions</text>
    {chunks.map((chunk, index) => <text key={index} x={x + 12} y={y + 51 + index * 25}>
      {chunk.map(row => `${row.id}#${row.position + 1}:${row.y}`).join(' · ')}
    </text>)}
    <text x={x + 12} y={y + 62 + chunks.length * 25}>mean = {number(mean)}</text>
    <text x={x + 12} y={y + 86 + chunks.length * 25}>SSE = {number(sse)} target²</text>
  </g>;
}

function BootstrapRegressionPlot({ fit, color }) {
  const px = x => 74 + 96 * x;
  const py = y => 260 - 26 * y;
  return <EnsembleFlowCanvas title="Actual feature/target positions, multiplicity areas and the fitted mean-leaf rule" width={680} height={330}>
    {[0, 2, 4, 6, 8].map(y => <g key={y}>
      <line x1={74} x2={600} y1={py(y)} y2={py(y)} stroke="#414148" />
      <text x={60} y={py(y) + 5} textAnchor="end">{y}</text>
    </g>)}
    <text x={16} y={25}>target y</text>
    <line x1={74} x2={600} y1={260} y2={260} stroke="#92929b" />
    <line x1={74} x2={74} y1={35} y2={260} stroke="#92929b" />
    {fit.threshold === null ? <line x1={74} x2={600} y1={py(fit.leftMean)} y2={py(fit.leftMean)} stroke={mix} strokeWidth={2} /> : <g>
      <path d={`M74,${py(fit.leftMean)} H${px(fit.threshold)} V${py(fit.rightMean)} H600`} stroke={mix} strokeWidth={2} fill="none" />
      <line x1={px(fit.threshold)} x2={px(fit.threshold)} y1={35} y2={260} stroke={mix} strokeDasharray="5 5" />
      <text x={px(fit.threshold)} y={30} textAnchor="middle" fill={mix}>split {fit.threshold}</text>
    </g>}
    {bootstrapRows.map((row, index) => <g key={row.id}>
      <circle cx={px(row.x)} cy={py(row.y)} r={fit.counts[index] ? 6 * Math.sqrt(fit.counts[index]) : 6}
        fill={fit.counts[index] ? color : '#08080b'} stroke={fit.counts[index] ? color : '#92929b'} />
      <text x={px(row.x) + (index === 0 ? 12 : 0)} y={py(row.y) - 10 - 6 * Math.sqrt(fit.counts[index])}
        textAnchor={index === 0 ? 'start' : 'middle'}>{row.id} ×{fit.counts[index]}</text>
      <text x={px(row.x)} y={283} textAnchor="middle">{row.x}</text>
    </g>)}
    <text x={290} y={316}>feature x · fixed source rows</text>
  </EnsembleFlowCanvas>;
}

export function BootstrapFitFigure() {
  const state = useBootstrapBags();
  const fit = editedBootstrapState(state.bags, state.row).fits[state.selectedBag];
  const color = bagColors[state.selectedBag];
  const leafHeight = 94 + 25 * Math.ceil(Math.max(fit.left.length, fit.right.length) / 3);
  return <EnsembleFlowFigure job="D14" title="Every drawn occurrence contributes to its fitted mean leaf">
    <EnsembleFlowCanvas title={`Bag ${state.selectedBag + 1} fitted split and target contributions`} width={820} height={leafHeight + 164}>
      <text x={16} y={25} fill={color}>Bag {state.selectedBag + 1}: [{ids(fit.occurrences)}]</text>
      {fit.threshold === null ? <>
        <text x={16} y={60}>No selected improving split → one constant mean leaf</text>
        <Leaf x={16} y={83} width={540} label="Constant leaf" rows={fit.left} mean={fit.leftMean} sse={fit.leftSSE} color={color} />
      </> : <>
        <rect x={290} y={43} width={224} height={38} fill="#17171b" stroke={color} />
        <text x={307} y={68}>x ≤ {fit.threshold}?</text>
        <path d="M335,81 V98 H195 V124 M469,81 V98 H620 V124" stroke={color} fill="none" />
        <text x={241} y={113}>yes</text><text x={539} y={113}>no</text>
        <Leaf x={16} y={126} width={380} label="Left leaf" rows={fit.left} mean={fit.leftMean} sse={fit.leftSSE} color={color} />
        <Leaf x={422} y={126} width={380} label="Right leaf" rows={fit.right} mean={fit.rightMean} sse={fit.rightSSE} color={color} />
      </>}
    </EnsembleFlowCanvas>
    <BootstrapRegressionPlot fit={fit} color={color} />
    <div className="ensemble-bootstrap-table" tabIndex={0} role="region" aria-label="Candidate split squared-error comparison; pan if needed">
      <table><caption>Distinct-value midpoint candidates; compare both children</caption>
        <thead><tr><th>Threshold</th><th>Left SSE</th><th>Right SSE</th><th>Total SSE</th><th>Selected</th></tr></thead>
        <tbody>{fit.candidates.length ? fit.candidates.map(candidate => <tr key={candidate.threshold}>
          <th scope="row">{candidate.threshold}</th><td>{number(candidate.leftSSE)}</td><td>{number(candidate.rightSSE)}</td>
          <td>{number(candidate.leftSSE + candidate.rightSSE)}</td><td>{candidate.threshold === fit.threshold ? 'yes' : 'no'}</td>
        </tr>) : <tr><th scope="row">No legal midpoint</th><td colSpan={4}>One constant leaf; SSE {number(fit.sse)}</td></tr>}</tbody>
      </table>
    </div>
    <div className="ensemble-flow-controls">
      <BootstrapDrawEntry draws={state.bags[state.selectedBag]} onChange={state.changeDraws}
        selectedBag={state.selectedBag} revision={state.revision} />
      <ResetBags reset={state.reset} />
    </div>
    <p aria-live="polite">Bag {state.selectedBag + 1}: {fit.threshold === null ? 'one constant leaf' : `threshold ${fit.threshold}`};
      fitted mean {number(fit.leftMean)}{fit.threshold !== null && <> / {number(fit.rightMean)}</>},
      total SSE {number(fit.sse)} target² from all {fit.occurrences.length} contributions.
      Circle area is proportional to multiplicity; a hollow point was omitted.</p>
  </EnsembleFlowFigure>;
}

export function BootstrapOOBFigure() {
  const state = useBootstrapBags();
  const current = editedBootstrapState(state.bags, state.row);
  const row = bootstrapRows[state.row];
  const eligibleValues = current.eligible.map(index => current.fits[index].predictions[state.row]);
  return <EnsembleFlowFigure job="D15" title="Apply the row-specific exclusion mask before averaging">
    <div className="ensemble-bootstrap-table" tabIndex={0} role="region" aria-label="Every row and bag: count, prediction and OOB eligibility; pan if needed">
      <table><caption>Fit membership is separate from a fitted prediction</caption>
        <thead><tr><th>Row / target</th>{[0, 1, 2].map(index => <th key={index} style={{ color: bagColors[index] }}>Bag {index + 1}: count / forecast / OOB</th>)}</tr></thead>
        <tbody>{bootstrapRows.map((source, rowIndex) => <tr key={source.id} aria-current={rowIndex === state.row ? 'true' : undefined}>
          <th scope="row">{source.id} · y={source.y}</th>{current.fits.map((fit, index) => <td key={index}>
            {fit.counts[rowIndex]} / {number(fit.predictions[rowIndex])} / {fit.counts[rowIndex] ? 'excluded' : 'eligible'}
          </td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <EnsembleFlowCanvas title={`${row.id}: only absent-from-fit members connect to the OOB average`} width={860} height={310}>
      <text x={16} y={25}>{row.id} query x={row.x}: separate eligibility and forecast value</text>
      {current.fits.map((fit, index) => {
        const y = 72 + index * 68;
        const eligible = fit.counts[state.row] === 0;
        return <g key={index}>
          <text x={16} y={y} fill={bagColors[index]}>Bag {index + 1}: {number(fit.predictions[state.row])}</text>
          <text x={195} y={y}>{fit.counts[state.row]} copies → {eligible ? 'eligible' : 'excluded'}</text>
          {eligible ? <path d={`M403,${y - 5} H464 V135 H515`} fill="none" stroke={bagColors[index]} /> : <>
            <line x1={404} x2={425} y1={y - 13} y2={y + 3} stroke={bagColors[index]} />
            <line x1={404} x2={425} y1={y + 3} y2={y - 13} stroke={bagColors[index]} />
          </>}
        </g>;
      })}
      <rect x={515} y={87} width={327} height={96} fill="#17171b" stroke={mix} />
      <text x={529} y={112} fill={mix}>{current.eligible.length ? `Eligible sum = ${number(eligibleValues.reduce((sum, value) => sum + value, 0))}` : 'No eligible forecast'}</text>
      <text x={529} y={143}>{current.eligible.length ? `÷ ${current.eligible.length} = ${number(current.oobPrediction)}` : 'Unavailable; no division by zero'}</text>
      <text x={16} y={265} fill={mix}>Separate all-bag mean = ({current.fits.map(fit => number(fit.predictions[state.row])).join(' + ')}) / 3</text>
      <text x={16} y={293} fill={mix}>= {number(current.ensemblePrediction)} · includes fitted-on-row members</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <label>Inspect original row<select aria-label="Inspect OOB row" value={state.row} onChange={event => state.setRow(Number(event.target.value))}>
        {bootstrapRows.map((source, index) => <option key={source.id} value={index}>{source.id}: x={source.x}, y={source.y}</option>)}
      </select></label>
      <ResetBags reset={state.reset} />
    </div>
    <p aria-live="polite">{row.id}'s OOB mean is {current.oobPrediction === null ? 'unavailable: all bags used this row' :
      `${number(current.oobPrediction)} from bag${current.eligible.length === 1 ? '' : 's'} ${current.eligible.map(index => index + 1).join(', ')}`}.
      The separate all-bag mean is {number(current.ensemblePrediction)}. Edit a bag's draws above to change its membership and fitted rule together.</p>
  </EnsembleFlowFigure>;
}

function LawPlot({ title, values, selected, ymax, xLabel, yLabel, color, integerTicks = false }) {
  const px = index => 70 + 360 * index / (values.length - 1);
  const py = value => 216 - 156 * value / ymax;
  return <EnsembleFlowCanvas title={title} width={510} height={294}>
    <text x={16} y={24}>{title}</text>
    {[0, ymax / 2, ymax].map(value => <g key={value}>
      <line x1={70} x2={430} y1={py(value)} y2={py(value)} stroke="#414148" />
      <text x={56} y={py(value) + 5} textAnchor="end">{number(value)}</text>
    </g>)}
    <text x={70} y={49}>{yLabel}</text>
    <line x1={70} x2={70} y1={60} y2={216} stroke="#92929b" />
    <line x1={70} x2={430} y1={216} y2={216} stroke="#92929b" />
    <path d={values.map((value, index) => `${index ? 'L' : 'M'}${px(index)},${py(value)}`).join(' ')} stroke={color} fill="none" />
    {values.map((value, index) => integerTicks ? <circle key={index} cx={px(index)} cy={py(value)} r={2} fill={color} /> : null)}
    {[0, Math.floor((values.length - 1) / 2), values.length - 1].map(index => <g key={index}>
      <line x1={px(index)} x2={px(index)} y1={216} y2={223} stroke="#92929b" />
      <text x={px(index)} y={246} textAnchor="middle">{index + 1}</text>
    </g>)}
    <line x1={px(selected - 1)} x2={px(selected - 1)} y1={60} y2={216} stroke={mix} strokeDasharray="4 4" />
    <circle cx={px(selected - 1)} cy={py(values[selected - 1])} r={5} fill={mix} />
    <text x={70} y={282}>{xLabel} · selected {selected}: {number(values[selected - 1])}</text>
  </EnsembleFlowCanvas>;
}

export function BootstrapAbsenceFigure() {
  const [drawCount, setDrawCount] = useState(6);
  const [bagCount, setBagCount] = useState(3);
  const [revision, setRevision] = useState(0);
  const law = bootstrapAbsenceLaw(drawCount, bagCount);
  const laws = Array.from({ length: 12 }, (_, index) => bootstrapAbsenceLaw(index + 1, bagCount));
  const noEligible = Array.from({ length: 50 }, (_, index) => bootstrapAbsenceLaw(drawCount, index + 1).noEligible);
  return <EnsembleFlowFigure job="D16" title="Three sampling quantities have different units and denominators">
    <LawPlot title="Named row absent from one sample" values={laws.map(row => row.absence)} selected={drawCount}
      ymax={1} xLabel="replacement draws m" yLabel="probability q" color={bagColors[0]} integerTicks />
    <LawPlot title="Expected distinct rows in one sample" values={laws.map(row => row.expectedDistinct)} selected={drawCount}
      ymax={6} xLabel="replacement draws m" yLabel="expected identity count" color={bagColors[1]} integerTicks />
    <LawPlot title="No OOB-eligible bag for a named row" values={noEligible} selected={bagCount}
      ymax={1} xLabel="independent bags B" yLabel="probability (1−q)^B" color={bagColors[2]} />
    <div className="ensemble-flow-controls">
      <EnsembleQuantity label="Replacement draws m" value={drawCount} onChange={setDrawCount} min={1} max={12} integer revision={revision} />
      <EnsembleQuantity label="Independent bags B" value={bagCount} onChange={setBagCount} min={1} max={50} integer revision={revision} />
      <button type="button" onClick={() => { setDrawCount(6); setBagCount(3); setRevision(value => value + 1); }}>Reset sampling-law counts</button>
    </div>
    <p aria-live="polite">Fixed n=6. Absence q=5^{drawCount}/6^{drawCount}={law.numerator}/{law.denominator}={number(law.absence)}.
      Expected distinct identities 6(1−q)={number(law.expectedDistinct)}.
      No eligible bag across {bagCount} independent bags: (1−q)^{bagCount}={number(law.noEligible)}.
      These probabilities describe independently generated samples; they do not assert what occurred in the three edited bags above.</p>
  </EnsembleFlowFigure>;
}

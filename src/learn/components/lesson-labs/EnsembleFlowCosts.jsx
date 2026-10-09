import { useState } from 'react';
import { ensembleFitWork, ensembleServingPath, latencySum } from '../../data/ensemble-cost-flow-models.js';
import { EnsembleFlowFigure, EnsembleFlowCanvas } from './EnsembleFlowCombination.jsx';
import { EnsembleQuantity, EnsembleVectorEntry } from './EnsembleFlowControls.jsx';
import './ensemble-flow-costs.css';

const hues = ['#7fc9ba', '#b2b7e1', '#db96af', '#80b3e8', '#d8aece'];
const amber = '#e8bb60';
const memberName = index => String.fromCharCode(65 + index);

export function FittingWorkFigure() {
  const [bases, setBases] = useState(3), [folds, setFolds] = useState(3), [rows, setRows] = useState(216), [revision, setRevision] = useState(0);
  const state = ensembleFitWork(bases, folds, rows);
  const width = Math.max(760, 160 + folds * 146), gridBottom = 102 + bases * 66, height = gridBottom + 276;
  return <EnsembleFlowFigure job="D39" title="Count each fit and its actual permitted training rows">
    <EnsembleFlowCanvas width={width} height={height} title={`${bases} member rows by ${folds} held-fold columns, followed by ${bases} full refits and one meta fit`}>
      <text x={16} y={25}>Mathematical row work; no elapsed-time measurements</text>
      <text x={16} y={56}>One cell = one fresh base fit. Every fold excludes its named held rows.</text>
      {state.heldCounts.map((held, fold) => <g key={fold}>
        <text x={167 + fold * 146} y={83}>Fold {fold + 1}</text><text x={167 + fold * 146} y={104}>hold {held} rows</text>
      </g>)}
      {Array.from({ length: bases }, (_, base) => <g key={base}>
        <text x={16} y={148 + base * 66} fill={hues[base % hues.length]}>Member {memberName(base)}</text>
        {state.trainingCounts.map((count, fold) => <g key={fold}>
          <rect x={160 + fold * 146} y={118 + base * 66} width={132} height={49} fill="#17171b" stroke={hues[base % hues.length]} />
          <text x={170 + fold * 146} y={139 + base * 66}>fit {count} rows</text>
          <text x={170 + fold * 146} y={160 + base * 66} fill={hues[base % hues.length]}>{rows} − {state.heldCounts[fold]}</text>
        </g>)}
      </g>)}
      <text x={16} y={gridBottom + 42}>Fold fits: {bases}×{folds}={state.foldFits}; row uses: {bases}×({state.trainingCounts.join('+')})={state.foldRowWork}</text>
      <path d={`M${width / 2},${gridBottom + 53} V${gridBottom + 79}`} stroke={amber} fill="none" />
      <path d={`M${width / 2 - 4},${gridBottom + 73} L${width / 2},${gridBottom + 79} L${width / 2 + 4},${gridBottom + 73}`} stroke={amber} fill="none" />
      <text x={16} y={gridBottom + 101}>Then refit each base on all {rows} training rows for serving:</text>
      {Array.from({ length: bases }, (_, base) => <g key={base}>
        <circle cx={42 + base * 63} cy={gridBottom + 128} r={18} fill="#17171b" stroke={hues[base % hues.length]} />
        <text x={42 + base * 63} y={gridBottom + 134} textAnchor="middle" fill={hues[base % hues.length]}>{memberName(base)}</text>
      </g>)}
      <text x={16} y={gridBottom + 171}>{bases} full refits × {rows} rows = {state.fullRowWork} row uses.</text>
      <text x={16} y={gridBottom + 204} fill={amber}>Base row work = {state.foldRowWork}+{state.fullRowWork} = {state.baseRowWork} = BKn.</text>
      <text x={16} y={gridBottom + 237}>Separate meta fit: one {rows}×{bases} completed OOF matrix and {rows} target rows.</text>
      <text x={16} y={gridBottom + 270}>Served collection: {bases} full-refit bases + 1 meta learner; the {state.foldFits} fold fits are not served.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <EnsembleQuantity label="Base count B" value={bases} onChange={setBases} min={1} max={10} integer revision={revision} />
      <EnsembleQuantity label="Fold count K" value={folds} onChange={setFolds} min={2} max={Math.min(10, rows)} integer revision={revision} />
      <EnsembleQuantity label="Training rows n" value={rows} onChange={setRows} min={10} max={1000} integer revision={revision} />
      <button onClick={() => { setBases(3); setFolds(3); setRows(216); setRevision(x => x + 1); }}>Reset fitting counts</button>
    </div>
    <p aria-live="polite">{state.foldFits} fold base fits + {state.fullFits} full refits + 1 meta fit. Base training uses {state.baseRowWork} rows in total; meta work is additional.
      Held counts [{state.heldCounts.join(', ')}] total {rows}, including unequal folds. Each original row appears in K−1 fold fits per member.</p>
  </EnsembleFlowFigure>;
}

export function ServingDependencyFigure() {
  const [latencies, setLatencies] = useState([1, 8, 15]), [mode, setMode] = useState('sequential'), [revision, setRevision] = useState(0);
  const state = ensembleServingPath(latencies, mode);
  const timelineX = 260, timelineWidth = 560, metaX = timelineX + timelineWidth * state.metaOffset;
  return <EnsembleFlowFigure job="D40" title="Wait for the required member outputs before the meta operation">
    <EnsembleFlowCanvas width={1080} height={515} title={`Hypothetical ${mode} base timeline, explicit join then fixed one-unit meta operation and action`}>
      <text x={16} y={25}>Hypothetical latency units; execution mode: {mode === 'parallel' ? 'ideal parallel bases' : 'sequential bases'}</text>
      <text x={260} y={59}>0</text><text x={820} y={59} textAnchor="end">total {state.total.text}</text>
      <line x1={timelineX} y1={67} x2={820} y2={67} stroke="#aaaab2" />
      {state.branches.map(branch => {
        const x = timelineX + branch.offset * timelineWidth, end = x + branch.width * timelineWidth, y = 119 + branch.index * 78;
        return <g key={branch.index}>
          <text x={16} y={y - 14} fill={hues[branch.index]}>Member {memberName(branch.index)}</text>
          <text x={16} y={y + 8} fill={hues[branch.index]}>{latencySum([branch.duration]).text} units</text>
          {branch.width > 0 && <rect x={x} y={y - 18} width={branch.width * timelineWidth} height={29} fill={hues[branch.index]} />}
          <circle cx={end} cy={y - 3} r={4} fill={hues[branch.index]} />
          <path d={`M${end},${y - 3} V${y + 24} H861 V346`} fill="none" stroke={hues[branch.index]} />
          <text x={16} y={y + 29}>{branch.duration === 0 ? 'zero; output required' : 'bar: time · dot: ready'}</text>
        </g>;
      })}
      <circle cx={861} cy={346} r={9} stroke={amber} fill="#17171b" /><text x={889} y={352}>join all three</text>
      <path d={`M861,356 V362 H${metaX} V374`} stroke={amber} fill="none" />
      <text x={16} y={393} fill={amber}>Meta: 1 unit after join</text>
      {state.metaWidth > 0 && <rect x={metaX} y={374} width={timelineWidth * state.metaWidth} height={29} fill={amber} />}
      <path d="M820,410 V429 H886" fill="none" stroke={amber} />
      <path d="M880,425 L886,429 L880,433" fill="none" stroke={amber} />
      <text x={900} y={435}>action</text>
      <text x={16} y={467}>Sequential sum + 1 = {state.sequential.text}; ideal parallel max + 1 = {state.parallel.text}.</text>
      <text x={16} y={502}>20-unit budget: {state.budgets[0].within ? 'within' : 'exceeds'}; 50-unit budget: {state.budgets[1].within ? 'within' : 'exceeds'} under this mode.</text>
    </EnsembleFlowCanvas>
    <div className="ensemble-flow-controls">
      <EnsembleVectorEntry label="Hypothetical member latencies A, B, C" values={latencies} onChange={setLatencies} min={0} max={Number.MAX_VALUE} revision={revision} />
      <label className="ensemble-flow-field">Execution assumption<select aria-label="Execution assumption" value={mode} onChange={e => setMode(e.target.value)}>
        <option value="sequential">Sequential required branches</option><option value="parallel">Ideal parallel required branches</option>
      </select></label>
      <button onClick={() => { setLatencies([1, 8, 15]); setMode('sequential'); setRevision(x => x + 1); }}>Reset serving path</button>
    </div>
    <p aria-live="polite">Hypothetical {mode === 'parallel' ? 'ideal parallel' : 'sequential'} total {state.total.text} units.
      All three outputs remain required. Meta duration stays 1; scheduling and transfer overhead are not measured here.</p>
    <p>Bars share one current time scale. A very small positive duration can be visually subpixel; its numeric label still gives the declared value.
      A zero duration has an output-ready dot and no duration bar. Scientific labels preserve totals beyond finite binary64 storage.</p>
  </EnsembleFlowFigure>;
}

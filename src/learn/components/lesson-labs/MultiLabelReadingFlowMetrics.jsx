import { useMemo, useState } from 'react';
import { metricLabels, metricPooling, metricPredictions, metricTruth, multilabelMetricCounts, rankPairTrace } from '../../data/multilabel-reading-flow-metric-models.js';
import { labelIdentities } from '../../data/multilabel-reading-flow-foundation-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';

const kindDescription = { TP: 'true positive', TN: 'true negative', FP: 'false positive', FN: 'false negative', '?': 'unobserved truth' };
const knownMetricMask = () => metricTruth.map(row => row.map(() => true));

function CountPorts({ counts, x, y, width = 450 }) {
  return <g>
    {['tp', 'fp', 'fn'].map((name, index) => <g key={name}>
      <path d={`M${x + width / 2},${y - 25} H${x + index * width / 3 + 36} V${y - 13}`} stroke="#bcb4c6" fill="none" />
      <circle cx={x + index * width / 3 + 36} cy={y + 6} r={19} fill="#111114" stroke={name === 'tp' ? '#ece8ef' : '#ef8ca4'} />
      <text x={x + index * width / 3 + 36} y={y + 12} textAnchor="middle">{counts[name]}</text>
      <text x={x + index * width / 3 + 36} y={y + 47} textAnchor="middle">{name.toUpperCase()}</text>
    </g>)}
  </g>;
}

export function WrongBitsFigure() {
  const [predictions, setPredictions] = useState(metricPredictions);
  const [unknownHardware, setUnknownHardware] = useState(false);
  const mask = knownMetricMask();
  mask[3][1] = !unknownHardware;
  const state = multilabelMetricCounts(metricTruth, predictions, mask);
  return <MultiLabelFigure job="D07" description="Four original repair-message vectors show cell errors and complete-vector failures separately">
    <MultiLabelTable caption="Original repair-message fixture: compare each observed truth bit with its prediction">
      <thead><tr><th>Message</th>{metricLabels.map(label => <th key={label.id} style={{ color: label.color }}>{label.name}<br />truth → prediction</th>)}<th>Whole known vector</th></tr></thead>
      <tbody>{state.rows.map((row, index) => <tr key={index}>
        <th scope="row">Message {index + 1}</th>
        {row.cells.map((cell, column) => <td key={column}><span style={{ color: metricLabels[column].color }}>{cell.observed ? cell.truth : '?'} → {cell.prediction}</span><br /><span className={cell.kind === 'FP' || cell.kind === 'FN' ? 'mlf-mismatch' : undefined}>{cell.kind} · {kindDescription[cell.kind]}</span></td>)}
        <td>{row.exact === null ? 'not fully observed' : row.exact ? '✓ all three match' : '× at least one differs'}</td>
      </tr>)}</tbody>
    </MultiLabelTable>
    <MultiLabelCanvas width={710} height={195} title="Observed cells accumulate into separate true-positive, false-positive and false-negative counters">
      <text x={18} y={28}>{state.total.observed} observed comparisons</text>
      <path d="M270,24 H350 V50" stroke="#ece8ef" fill="none" />
      <CountPorts counts={state.total} x={20} y={79} width={660} />
      <text x={18} y={181}>{state.total.fp + state.total.fn} wrong cells / {state.total.observed} observed cells</text>
    </MultiLabelCanvas>
    <FlowControls>
      <fieldset className="mlf-bit-editor"><legend>Edit the prediction grid · each button toggles one binary cell</legend>
        <div className="mlf-table-scroll" tabIndex={0} role="region" aria-label="Editable prediction matrix; pan if needed">
          <table><thead><tr><th>Message</th>{metricLabels.map(label => <th key={label.id} style={{ color: label.color }}>{label.name}</th>)}</tr></thead>
            <tbody>{predictions.map((row, index) => <tr key={index}><th scope="row">{index + 1}</th>{row.map((value, column) => <td key={column}>
              <button type="button" className="mlf-bit" style={{ '--label-color': metricLabels[column].color }} data-positive={value === 1}
                aria-label={`Message ${index + 1}, ${metricLabels[column].name} predicted bit ${value}; toggle`} aria-pressed={value === 1}
                onClick={() => setPredictions(previous => previous.map((values, other) => values.map((bit, output) => other === index && output === column ? 1 - bit : bit)))}>{value}</button>
            </td>)}</tr>)}</tbody></table>
        </div>
      </fieldset>
      <label><input type="checkbox" checked={unknownHardware} onChange={event => setUnknownHardware(event.target.checked)} />Message 4 Hardware truth is unknown</label>
      <button type="button" onClick={() => { setPredictions(metricPredictions()); setUnknownHardware(false); }}>Reset predictions and observation mask</button>
    </FlowControls>
    <FlowReadout>TP {state.total.tp}, FP {state.total.fp}, FN {state.total.fn}; observed-bit Hamming loss is {number(state.hamming)}. Exact-vector accuracy among {state.completeRows} fully observed rows is {number(state.exactAccuracy)}. {unknownHardware ? 'Message 4 has an unknown truth cell, so it cannot certify a complete-vector match.' : 'All four vectors are fully observed; one wrong cell is enough to fail a whole vector.'}</FlowReadout>
  </MultiLabelFigure>;
}

function PoolingStructure({ state, rule }) {
  const elements = rule === 'micro' ? [state.total] : rule === 'macro' ? state.columns : state.rows;
  const width = rule === 'micro' ? 600 : Math.max(600, elements.length * 195);
  return <MultiLabelCanvas width={width} height={260} title={`${rule} pooling: ${rule === 'micro' ? 'sum observed cell counters before dividing' : 'compute separate F1 values before taking their arithmetic mean'}`}>
    {elements.map((counts, index) => {
      const x = rule === 'micro' ? 220 : index * 195 + 20;
      const color = rule === 'macro' ? metricLabels[index].color : '#ece8ef';
      return <g key={index} style={{ color }}>
        <text x={x} y={26}>{rule === 'micro' ? 'all cells together' : rule === 'macro' ? metricLabels[index].name : `Message ${index + 1}`}</text>
        {['tp', 'fp', 'fn'].map((name, position) => <g key={name}>
          <circle cx={x + position * 54 + 17} cy={69} r={16} fill="#111114" stroke={color} />
          <text x={x + position * 54 + 17} y={75} textAnchor="middle">{counts[name]}</text>
          <text className="mlf-small-text" x={x + position * 54 + 17} y={104} textAnchor="middle">{name.toUpperCase()}</text>
        </g>)}
        <path d={`M${x + 17},120 H${x + 125} M${x + 71},120 V150`} stroke={color} fill="none" />
        <text x={x} y={178}>F1 {number(rule === 'micro' ? state.micro.f1 : counts.f1)}</text>
        {rule !== 'micro' && <path d={`M${x + 71},192 V219 H${width / 2}`} stroke={color} fill="none" />}
      </g>;
    })}
    {rule !== 'micro' && <text x={width / 2} y={249} textAnchor="middle">arithmetic mean → {number(state[rule].f1)}</text>}
  </MultiLabelCanvas>;
}

export function PoolingFigure() {
  const [rule, setRule] = useState('micro');
  const [zeroDivision, setZeroDivision] = useState(0);
  const state = metricPooling(metricTruth, metricPredictions(), zeroDivision);
  const emptyComparison = metricPooling([...metricTruth, [0, 0, 0]], [...metricPredictions(), [0, 0, 0]], zeroDivision);
  return <MultiLabelFigure job="D08" description="Micro pools counters, macro pools named-output scores and samples pools observation scores">
    <PoolingStructure state={state} rule={rule} />
    <MultiLabelTable caption="All three pooling results on the same original complete arrays">
      <thead><tr><th>Pooling</th><th>F1</th><th>Jaccard</th><th>What receives equal weight?</th></tr></thead>
      <tbody>{['micro', 'macro', 'samples'].map(name => <tr key={name} aria-current={name === rule ? 'true' : undefined}><th scope="row">{name}</th><td>{number(state[name].f1)}</td><td>{number(state[name].jaccard)}</td><td>{name === 'micro' ? 'One pooled collection of cell counts' : name === 'macro' ? 'Each named output' : 'Each message'}</td></tr>)}</tbody>
    </MultiLabelTable>
    <p>Separate constructed comparison: append one fully observed, correctly empty message. Its F1 and Jaccard are {zeroDivision} by the selected zero-division convention; samples F1 becomes {number(emptyComparison.samples.f1)}. No empty observation is inserted into the original table.</p>
    <FlowControls>
      <label>Inspect pooling<select aria-label="Metric averaging rule" value={rule} onChange={event => setRule(event.target.value)}>{['micro', 'macro', 'samples'].map(name => <option key={name}>{name}</option>)}</select></label>
      <label>Zero-division convention<select aria-label="Metric zero-division convention" value={zeroDivision} onChange={event => setZeroDivision(Number(event.target.value))}><option value={0}>0 · undefined empty-set score is zero</option><option value={1}>1 · undefined empty-set score is one</option></select></label>
      <button type="button" onClick={() => { setRule('micro'); setZeroDivision(0); }}>Reset pooling and convention</button>
    </FlowControls>
    <FlowReadout>{rule} F1 is {number(state[rule].f1)} and Jaccard is {number(state[rule].jaccard)}. {rule === 'micro' ? 'Add TP/FP/FN first, then divide once.' : rule === 'macro' ? 'Compute Code, Hardware and Energy scores separately; their supports do not weight this mean.' : 'Compute each message score separately, then give the four messages equal weight.'} The appended empty-message comparison makes the selected convention visible.</FlowReadout>
  </MultiLabelFigure>;
}

export function NonlinearAverageFigure() {
  const truth = Array.from({ length: 2 }, () => [1, 1, 1, 1, 1]);
  const strategies = [
    { name: 'A', predictions: [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0]], color: '#f0b45b' },
    { name: 'B', predictions: [[1, 1, 0, 0, 0], [1, 1, 0, 0, 0]], color: '#75adff' },
  ].map(strategy => ({ ...strategy, state: metricPooling(truth, strategy.predictions) }));
  const curve = Array.from({ length: 101 }, (_, index) => {
    const j = index / 100;
    return `${80 + 380 * j},${260 - 200 * 2 * j / (1 + j)}`;
  }).join(' ');
  return <MultiLabelFigure job="D09" description="Two actual strategies reverse their ordering when per-row nonlinear F1 and Jaccard scores are averaged">
    <MultiLabelTable caption="Retained two-row comparison: each truth row contains all five labels">
      <thead><tr><th>Strategy / row</th><th>Truth</th><th>Prediction</th><th>Intersection / union</th><th>Jaccard</th><th>F1</th></tr></thead>
      <tbody>{strategies.flatMap(strategy => strategy.state.rows.map((row, index) => <tr key={`${strategy.name}${index}`}><th scope="row" style={{ color: strategy.color }}>{strategy.name} / {index + 1}</th><td>11111</td><td>{strategy.predictions[index].join('')}</td><td>{row.tp} / {row.tp + row.fp + row.fn}</td><td>{number(row.jaccard)}</td><td>{number(row.f1)}</td></tr>))}</tbody>
    </MultiLabelTable>
    <MultiLabelCanvas width={730} height={340} title="Per-row conversion follows F1 = 2J/(1+J), but converting the mean Jaccard does not give the mean F1">
      <path d="M80,50 V260 H475" stroke="#bcb4c6" fill="none" />
      <polyline points={curve} stroke="#ece8ef" strokeWidth={2} fill="none" />
      <text x={12} y={38}>F1</text><text x={232} y={309}>Jaccard J</text>
      {[0, .5, 1].map(value => <g key={value}><text x={80 + value * 380} y={286} textAnchor="middle">{value}</text><text x={61} y={266 - value * 200} textAnchor="end">{value}</text></g>)}
      {strategies.map(strategy => <g key={strategy.name} style={{ color: strategy.color }}>
        {strategy.state.rows.filter((_, index) => strategy.name === 'A' || index === 0).map((row, index) => <g key={index}>
          <circle cx={80 + row.jaccard * 380} cy={260 - row.f1 * 200} r={strategy.name === 'A' ? 7 : 10} fill="#111114" stroke={strategy.color} strokeWidth={2} />
          <text x={strategy.name === 'A' ? 94 + row.jaccard * 350 : 251} y={strategy.name === 'A' ? 248 - row.f1 * 180 : 125}>{strategy.name === 'B' ? 'B1 / B2' : `${strategy.name}${index + 1}`}</text>
        </g>)}
        <text x={510} y={90 + (strategy.name === 'A' ? 0 : 95)}>{strategy.name}: mean J {number(strategy.state.samples.jaccard)}</text>
        <text x={510} y={119 + (strategy.name === 'A' ? 0 : 95)}>mean F1 {number(strategy.state.samples.f1)}</text>
      </g>)}
      <text x={510} y={279}>J prefers A; F1 prefers B</text>
    </MultiLabelCanvas>
    <figcaption>The curve converts each row's Jaccard before averaging. Strategy B's two row points coincide at (2/5, 4/7); neither row has been displaced to invent different scores.</figcaption>
  </MultiLabelFigure>;
}

export function RankingFigure() {
  const [scores, setScores] = useState([.8, .8, .3, .1]);
  const [truth, setTruth] = useState([1, 0, 1, 0]);
  const [selected, setSelected] = useState(0);
  const [revision, setRevision] = useState(0);
  const state = useMemo(() => rankPairTrace(scores, truth), [scores, truth]);
  const labels = labelIdentities.slice(0, 4);
  return <MultiLabelFigure job="D10" description="Four label scores expose maximal tied ranks and every relevant–irrelevant comparison">
    <MultiLabelCanvas width={730} height={420} title="Scores use a shared vertical 0–1 axis; separate labelled lanes preserve exact ties">
      <path d="M60,40 V350" stroke="#bcb4c6" fill="none" />
      {[0, .2, .4, .6, .8, 1].map(value => <g key={value}><path d={`M55,${350 - value * 300} H65`} stroke="#bcb4c6" /><text x={45} y={356 - value * 300} textAnchor="end">{value}</text></g>)}
      <text x={16} y={24}>score</text>
      {state.labels.map((object, index) => <g key={index} style={{ color: labels[index].color }}>
        <path d={`M${125 + index * 165},350 V${350 - object.score * 300}`} stroke={labels[index].color} strokeDasharray="4 4" />
        <circle cx={125 + index * 165} cy={350 - object.score * 300} r={14} fill={object.relevant ? labels[index].color : '#111114'} stroke={labels[index].color} strokeWidth={selected === index ? 3 : 1} />
        {selected === index && <circle cx={125 + index * 165} cy={350 - object.score * 300} r={19} fill="none" stroke="#fff" />}
        <text x={145 + index * 165} y={356 - object.score * 300}>{number(object.score)}</text>
        <text x={125 + index * 165} y={380} textAnchor="middle">{labels[index].id}: y={truth[index]}</text>
        <text x={125 + index * 165} y={409} textAnchor="middle">rank {object.rank}</text>
      </g>)}
    </MultiLabelCanvas>
    <MultiLabelTable caption="Oriented pairs: a relevant label must score strictly above an irrelevant label">
      <thead><tr><th>Relevant → irrelevant</th><th>Scores</th><th>Current API comparison</th></tr></thead>
      <tbody>{state.pairs.map(pair => <tr key={`${pair.positive}${pair.negative}`}><th scope="row"><span style={{ color: labels[pair.positive].color }}>{labels[pair.positive].id}</span> → <span style={{ color: labels[pair.negative].color }}>{labels[pair.negative].id}</span></th><td>{number(scores[pair.positive])} {pair.tied ? '=' : pair.wrong ? '<' : '>'} {number(scores[pair.negative])}</td><td>{pair.tied ? 'tie · counts as a rank-loss error' : pair.wrong ? 'reversed · error' : 'correct order'}</td></tr>)}</tbody>
    </MultiLabelTable>
    <MultiLabelTable caption="Relevant labels use their maximal tied rank, with all scores at least as large counted">
      <thead><tr><th>Label</th><th>Relevant at or above / all at or above</th><th>LRAP term</th></tr></thead>
      <tbody>{state.labels.filter(object => object.relevant).map(object => <tr key={object.id}><th scope="row" style={{ color: labels[object.id].color }}>{labels[object.id].id}</th><td>{object.relevantAtOrAbove} / {object.rank}</td><td>{number(object.precision)}</td></tr>)}</tbody>
    </MultiLabelTable>
    <FlowControls>
      <label>Inspected label<select aria-label="Ranking label" value={selected} onChange={event => setSelected(Number(event.target.value))}>{labels.map((label, index) => <option key={label.id} value={index}>{label.id}</option>)}</select></label>
      <MultiLabelQuantity label="Inspected label score" value={scores[selected]} min={0} max={1} step={.01} revision={`${revision}:${selected}`}
        onChange={value => setScores(previous => previous.map((score, index) => index === selected ? value : score))} />
      <label><input type="checkbox" checked={Boolean(truth[selected])} onChange={event => setTruth(previous => previous.map((bit, index) => index === selected ? Number(event.target.checked) : bit))} />Inspected label is relevant</label>
      <button type="button" onClick={() => { setScores([.8, .8, .3, .1]); setTruth([1, 0, 1, 0]); setSelected(0); setRevision(value => value + 1); }}>Reset rankings and relevance</button>
    </FlowControls>
    <FlowReadout>{state.pairs.filter(pair => pair.wrong).length} / {state.pairs.length} reversed-or-tied pairs give ranking loss {number(state.rankingLoss)}. LRAP is {number(state.lrap)}; coverage is {state.coverage} of four positions. {state.positiveCount === 0 ? 'With no relevant labels, the API conventions are rank loss 0, LRAP 1 and coverage 0.' : state.negativeCount === 0 ? 'With all labels relevant, rank loss is 0, LRAP 1 and coverage 4.' : 'Coverage uses the worst maximal rank among the relevant labels.'}</FlowReadout>
    <figcaption>Different axis: per-label average precision ranks observations for one fixed output. In the separate constructed observation order O1=.9 (positive), O2=.6 (negative), O3=.2 (positive), the two positive precisions are 1 and 2/3, giving AP=5/6. LRAP above instead ranks labels within one observation.</figcaption>
  </MultiLabelFigure>;
}

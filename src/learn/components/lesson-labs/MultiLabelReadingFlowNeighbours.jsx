import { useState } from 'react';
import { labelIdentities as labels } from '../../data/multilabel-reading-flow-foundation-models.js';
import { countHistograms, countPosterior, nearestNamedRows, neighbourQuery, neighbourRows, pairMargin } from '../../data/multilabel-reading-flow-neighbour-rank-models.js';
import { FlowControls, FlowReadout, MultiLabelCanvas, MultiLabelFigure, MultiLabelQuantity, MultiLabelTable, multilabelNumber as number } from './MultiLabelReadingFlowControls.jsx';

function OutputBits({ row, x, y }) {
  return <g>{row.bits.map((bit, column) => <g key={column}><circle cx={x + column * 28} cy={y} r={11} fill={bit ? labels[column].color : '#111114'} stroke={labels[column].color} /><text x={x + column * 28} y={y + 6} textAnchor="middle" style={{ fill: bit ? '#111114' : labels[column].color }}>{bit}</text></g>)}</g>;
}

export function NeighbourIdentityFigure() {
  const [query, setQuery] = useState(1.2);
  const [k, setK] = useState(2);
  const [revision, setRevision] = useState(0);
  const state = neighbourQuery(query, k);
  const scale = value => 75 + (value + 1) * 65;
  const duplicates = [{ id: 10, x: 1, bits: [1, 1] }, { id: 11, x: 1, bits: [1, 0] }, { id: 12, x: 2, bits: [0, 1] }];
  const duplicateSelection = nearestNamedRows(duplicates, 1, 1, 10);
  return <MultiLabelFigure job="D34" description="Actual named observations and distances choose neighbours; a separate duplicate-coordinate example excludes only the queried row ID">
    <MultiLabelCanvas width={736} height={355} title="Six training points keep A/B bits while query position and k change the nearest set">
      <text x={16} y={30}>A amber · B blue. White rings mark selected neighbours.</text>
      <path d="M75,169 H660" stroke="#b8b0c1" />
      {Array.from({ length: 10 }, (_, index) => index - 1).map(x => <g key={x}><path d={`M${scale(x)},163 V175`} stroke="#b8b0c1" /><text x={scale(x)} y={200} textAnchor="middle">{x}</text></g>)}
      {neighbourRows.map(row => <g key={row.id}>
        <circle cx={scale(row.x)} cy={135} r={10} fill="#111114" stroke={state.selected.some(neighbour => neighbour.id === row.id) ? '#fff' : '#9e95a9'} strokeWidth={state.selected.some(neighbour => neighbour.id === row.id) ? 3 : 1} />
        <text x={scale(row.x)} y={72} textAnchor="middle">r{row.id}</text><OutputBits row={row} x={scale(row.x) - 14} y={98} />
        <path d={`M${scale(row.x)},145 V169`} stroke="#a99db3" />
      </g>)}
      <path d={`M${scale(query)},217 V241`} stroke="#fff" /><path d={`M${scale(query) - 10},227 L${scale(query)},217 L${scale(query) + 10},227`} fill="none" stroke="#fff" /><text x={scale(query)} y={267} textAnchor="middle">query {number(query)}</text>
      <path d={`M${scale(Math.max(-1, query - state.radius))},304 V290 H${scale(Math.min(8, query + state.radius))} V304`} fill="none" stroke="#d7cada" />
      <text x={16} y={345}>Radius to kth row: {number(state.radius)}. Stable row ID breaks equal distances.</text>
    </MultiLabelCanvas>
    <FlowControls><MultiLabelQuantity label="Neighbour query position" value={query} min={-1} max={8} revision={revision} onChange={setQuery} /><MultiLabelQuantity label="Neighbour count k" value={k} min={1} max={5} integer revision={revision} onChange={setK} /><button type="button" onClick={() => { setQuery(1.2); setK(2); setRevision(value => value + 1); }}>Reset neighbour query</button></FlowControls>
    <FlowReadout>Query {number(query)} chooses {state.selected.map(row => `r${row.id}`).join(', ')}; positive counts are A={state.counts[0]}, B={state.counts[1]}. The query has no training self to remove. Its raw neighbour fractions are {state.counts.map(count => number(count / k)).join(', ')}.</FlowReadout>
    <MultiLabelTable caption="All candidate distances, in actual distance/row-ID order"><thead><tr><th>Row ID</th><th>x</th><th>Distance</th><th>A/B bits</th><th>Selected</th></tr></thead><tbody>{state.distances.map(row => <tr key={row.id}><th>r{row.id}</th><td>{row.x}</td><td>{number(row.distance)}</td><td>{row.bits.join('')}</td><td>{row.selected ? 'Yes' : 'No'}</td></tr>)}</tbody></MultiLabelTable>
    <MultiLabelCanvas width={736} height={208} title="Separate self-exclusion illustration: r10 and r11 have identical x but different observation identities">
      <text x={16} y={30}>Separate identity illustration · training query r10 at x=1</text>
      {duplicates.map((row, index) => <g key={row.id}><circle cx={112 + index * 230} cy={95} r={20} fill="#111114" stroke={row.id === 10 ? '#ef8ca4' : '#fff'} /><text x={112 + index * 230} y={101} textAnchor="middle">{row.id}</text><text x={112 + index * 230} y={143} textAnchor="middle">x={row.x} · d={Math.abs(row.x - 1)}</text><text x={112 + index * 230} y={182} textAnchor="middle">{row.id === 10 ? 'Self ID excluded' : duplicateSelection.some(neighbour => neighbour.id === row.id) ? 'Selected other row' : 'More distant'}</text></g>)}
    </MultiLabelCanvas>
  </MultiLabelFigure>;
}

export function NeighbourHistogramFigure() {
  const [column, setColumn] = useState(0);
  const [rowID, setRowID] = useState(0);
  const state = countHistograms();
  const row = state.rows[rowID];
  const color = labels[column].color;
  return <MultiLabelFigure job="D35" description="Leave-self-out neighbours yield a positive count; the row's own true bit assigns that count to one class-conditional histogram">
    <MultiLabelCanvas width={736} height={485} title="Neighbour-count evidence is a histogram over training rows, not a query probability">
      <text x={16} y={30}>Training r{rowID} · own {labels[column].id} bit {row.bits[column]}</text>
      <circle cx={87} cy={91} r={24} fill="#111114" stroke={color} /><text x={87} y={97} textAnchor="middle">r{rowID}</text>
      {row.neighbours.map((neighbour, index) => <g key={neighbour.id}><path d={`M111,91 H181 V${74 + index * 58} H220`} stroke="#b8aabe" fill="none" /><circle cx={245} cy={74 + index * 58} r={22} fill="#111114" stroke={color} /><text x={245} y={80 + index * 58} textAnchor="middle">r{neighbour.id}</text><text x={283} y={80 + index * 58} style={{ fill: color }}>{labels[column].id}={neighbour.bits[column]}</text></g>)}
      <path d="M368,74 H414 V100 H436 M368,132 H414 V100" stroke={color} fill="none" /><circle cx={460} cy={100} r={23} fill="#111114" stroke={color} /><text x={460} y={106} textAnchor="middle">Σ</text><text x={505} y={106}>count {row.counts[column]}</text>
      {state.histograms[column].map((histogram, bit) => <g key={bit} transform={`translate(${16 + bit * 372},210)`}>
        <text x={0} y={0}>Own true bit {bit} · three rows</text><path d="M24,171 H305" stroke="#b6aabc" />
        {histogram.map((height, count) => <g key={count}><rect x={40 + count * 87} y={171 - height * 35} width={55} height={height * 35} fill={color} fillOpacity={.5} stroke={row.bits[column] === bit && row.counts[column] === count ? '#fff' : color} strokeWidth={row.bits[column] === bit && row.counts[column] === count ? 3 : 1} /><text x={67 + count * 87} y={151 - height * 35} textAnchor="middle">{height}</text><text x={67 + count * 87} y={209} textAnchor="middle">r={count}</text></g>)}
      </g>)}
      <path d={`M460,123 V183 H${row.bits[column] ? 375 : 7} V229 H${48 + row.bits[column] * 372 + row.counts[column] * 87} V${381 - state.histograms[column][row.bits[column]][row.counts[column]] * 17.5} H${56 + row.bits[column] * 372 + row.counts[column] * 87}`} stroke="#fff" fill="none" />
      <path d={`M${50 + row.bits[column] * 372 + row.counts[column] * 87},${375 - state.histograms[column][row.bits[column]][row.counts[column]] * 17.5} L${56 + row.bits[column] * 372 + row.counts[column] * 87},${381 - state.histograms[column][row.bits[column]][row.counts[column]] * 17.5} L${50 + row.bits[column] * 372 + row.counts[column] * 87},${387 - state.histograms[column][row.bits[column]][row.counts[column]] * 17.5}`} stroke="#fff" fill="none" />
      <text x={16} y={476}>White bin receives this selected row; histogram height counts rows.</text>
    </MultiLabelCanvas>
    <FlowControls><label>Histogram label<select aria-label="Histogram label" value={column} onChange={event => setColumn(Number(event.target.value))}><option value={0}>A</option><option value={1}>B</option></select></label><label>Selected training row<select aria-label="Histogram training row" value={rowID} onChange={event => setRowID(Number(event.target.value))}>{neighbourRows.map(row => <option key={row.id} value={row.id}>r{row.id} · x={row.x}</option>)}</select></label><button type="button" onClick={() => { setColumn(0); setRowID(0); }}>Reset count histogram</button></FlowControls>
    <FlowReadout>r{rowID} excludes its own ID and takes {row.neighbours.map(neighbour => `r${neighbour.id}`).join(', ')}. Its {labels[column].id} count {row.counts[column]} contributes one row to C_{labels[column].id}{row.bits[column]}({row.counts[column]}). Histogram 0 is [{state.histograms[column][0].join(', ')}]; histogram 1 is [{state.histograms[column][1].join(', ')}].</FlowReadout>
    <MultiLabelTable caption="All six leave-self-out observations establish the histogram"><thead><tr><th>Training row</th><th>Nearest other IDs</th><th>Own A/B bits</th><th>Neighbour A/B counts</th></tr></thead><tbody>{state.rows.map(row => <tr key={row.id}><th>r{row.id}</th><td>{row.neighbours.map(neighbour => `r${neighbour.id}`).join(', ')}</td><td>{row.bits.join('')}</td><td>{row.counts.join(', ')}</td></tr>)}</tbody></MultiLabelTable>
  </MultiLabelFigure>;
}

export function NeighbourPosteriorFigure() {
  const [count, setCount] = useState(2);
  const [smoothing, setSmoothing] = useState(1);
  const [revision, setRevision] = useState(0);
  const state = countPosterior(count, smoothing);
  const referenceB = countPosterior(1, smoothing, 1);
  return <MultiLabelFigure job="D36" description="Both A-bit Bayes branches multiply prior by smoothed count likelihood and share a numerator-sum denominator">
    <MultiLabelCanvas width={736} height={475} title="A observed neighbour count enters the two empirical likelihoods before normalized posterior">
      <text x={16} y={30}>Observed A neighbour count r={count} · smoothing s={number(smoothing)}</text>
      {state.branches.map((branch, bit) => { const y = 114 + bit * 135; return <g key={bit}>
        <text x={16} y={y - 33} style={{ fill: labels[0].color }}>A={bit}</text>
        <text x={16} y={y + 5}>Prior {number(branch.prior)}</text>
        <text x={175} y={y - 23}>({number(smoothing)}+{branch.histogram[count]})/{number(branch.denominator)}</text><text x={175} y={y + 47}>Likelihood {number(branch.likelihood)}</text>
        <path d={`M132,${y} H351 M321,${y + 55} H372 V${y + 21} M393,${y} H456 V310 H489`} stroke="#c0b1ca" fill="none" />
        <circle cx={372} cy={y} r={21} fill="#111114" stroke={labels[0].color} /><text x={372} y={y + 6} textAnchor="middle">×</text>
        <text x={480} y={y - 28}>{number(branch.numerator)}</text>
      </g>; })}
      <circle cx={511} cy={310} r={22} fill="#111114" stroke="#e6d8ec" /><text x={511} y={316} textAnchor="middle">Σ</text><text x={423} y={360}>Denominator</text><text x={423} y={387}>{number(state.denominator)}</text>
      <path d="M393,249 H581 V405 H591 M533,310 H612 V384" stroke="#d5c2e0" fill="none" /><circle cx={612} cy={405} r={21} fill="#111114" stroke="#e6d8ec" /><text x={612} y={411} textAnchor="middle">÷</text>
      <text x={16} y={420}>P(A=1 | count) = {number(state.posterior)}</text><text x={16} y={465}>≥.5 decision: {state.decision}. Separate label posterior; no complete-vector law.</text>
    </MultiLabelCanvas>
    <FlowControls><MultiLabelQuantity label="Observed A neighbour count" value={count} min={0} max={2} integer revision={revision} onChange={setCount} /><MultiLabelQuantity label="Count smoothing s" value={smoothing} min={.1} max={5} revision={revision} onChange={setSmoothing} /><button type="button" onClick={() => { setCount(2); setSmoothing(1); setRevision(value => value + 1); }}>Reset count posterior</button></FlowControls>
    <FlowReadout>A count {count} gives numerators {state.branches.map(branch => number(branch.numerator)).join(' and ')}, normalized positive posterior {number(state.posterior)} and decision {state.decision}. The reference query’s B count remains 1, with posterior {number(referenceB.posterior)} and tie-positive decision {referenceB.decision}. Raw votes and smoothed posteriors answer different questions.</FlowReadout>
  </MultiLabelFigure>;
}

export function PairMarginFigure() {
  const [pair, setPair] = useState(0);
  const [margin, setMargin] = useState(.4);
  const [revision, setRevision] = useState(0);
  const state = pairMargin(pair, margin);
  return <MultiLabelFigure job="D37" description="A relevant–irrelevant score margin sends opposite hinge derivatives to actual named weight columns">
    <MultiLabelCanvas width={736} height={510} title="Linear relevant–irrelevant pair: x=[1,−1], an adjustable bias difference, and explicit weight-column pullbacks">
      <text x={16} y={30}>Truth A/C; irrelevant B. Two constraints: A&gt;B and C&gt;B.</text>
      <text x={16} y={87}>x=[1,−1]</text><path d="M126,81 H172 V135 H217 M172,81 V260 H217" stroke="#baadc3" fill="none" />
      {[state.relevant, state.irrelevant].map((column, index) => { const y = 135 + index * 125; const gradient = index ? state.irrelevantGradient : state.relevantGradient; return <g key={column}>
        <rect x={218} y={y - 38} width={159} height={76} fill="#111114" stroke={labels[column].color} /><text x={298} y={y - 8} textAnchor="middle" style={{ fill: labels[column].color }}>W_{labels[column].id}</text><text x={298} y={y + 23} textAnchor="middle">{index ? '[0,0]' : '[.2,−.2]'}</text>
        <path d={`M377,${y} H437`} stroke={labels[column].color} fill="none" /><text x={451} y={y + 6}>s_{labels[column].id}={number(index ? 0 : margin)}</text>
        <text x={218} y={y + 73} style={{ fill: labels[column].color }}>∂hinge/∂W_{labels[column].id} = [{gradient.join(', ').replace(/-/g, '−')}]</text>
      </g>; })}
      <path d="M558,135 H630 V175 M558,260 H682 V196 H651 M630,217 V299" stroke="#d3c1df" fill="none" />
      <circle cx={630} cy={196} r={21} fill="#111114" stroke="#d3c1df" /><text x={630} y={202} textAnchor="middle">−</text><text x={412} y={237}>Δs={number(margin)}</text>
      <circle cx={630} cy={320} r={21} fill="#111114" stroke="#d3c1df" /><path d="M616,327 H628 L642,311" stroke="#d3c1df" fill="none" /><text x={591} y={361}>hinge</text>
      <path d="M609,320 H579 V188 H298 V173 M292,181 L298,173 L304,181" stroke={labels[state.relevant].color} fill="none" />
      <path d="M609,320 H559 V313 H298 V298 M292,306 L298,298 L304,306" stroke={labels[state.irrelevant].color} fill="none" />
      <text x={16} y={380}>Relevant bias difference = {number(state.biasDifference)}; base dot product=.4.</text>
      <text x={16} y={422}>Margin {number(margin)} → max(0,1−margin)={number(state.hinge)}</text>
      <text x={16} y={464}>{state.active ? 'Active: −x to relevant weights, +x to B weights.' : 'Inactive: zero pullback; at margin 1 choose zero subgradient.'}</text>
      <text x={16} y={503}>The intercept pullbacks are {state.biasGradients.join(', ').replace(/-/g, '−')}.</text>
    </MultiLabelCanvas>
    <FlowControls><label>Selected margin pair<select aria-label="Margin pair" value={pair} onChange={event => setPair(Number(event.target.value))}><option value={0}>A &gt; B</option><option value={1}>C &gt; B</option></select></label><MultiLabelQuantity label="Pair margin via bias difference" value={margin} min={-2} max={2} revision={revision} onChange={setMargin} /><button type="button" onClick={() => { setPair(0); setMargin(.4); setRevision(value => value + 1); }}>Reset pair margin</button></FlowControls>
    <FlowReadout>{labels[state.relevant].id}−B margin is {number(margin)} and unit hinge is {number(state.hinge)}. The two weight destinations keep their own identities. This first-use picture teaches the linear hinge; the numerical reference below uses a separately declared mean-pair squared-hinge objective.</FlowReadout>
    <MultiLabelCanvas width={736} height={166} title="Kernel connection preserves the pair-feature inner product rather than replacing it with an unexplained probability">
      <text x={16} y={30}>Pair feature z: +x̃ in the relevant block, −x̃ in B’s block</text><path d="M16,85 H185 M185,85 H420 M420,85 H702" stroke="#c3b2ce" /><circle cx={185} cy={85} r={20} fill="#111114" stroke="#c3b2ce" /><text x={185} y={91} textAnchor="middle">·</text><text x={229} y={77}>zᵀz′</text><text x={229} y={115}>linear inner product</text><text x={477} y={77}>K_pair(z,z′)</text><text x={477} y={115}>kernel similarity</text><text x={16} y={161}>A kernel solver changes optimization and storage; it is not run by this lab.</text>
    </MultiLabelCanvas>
  </MultiLabelFigure>;
}

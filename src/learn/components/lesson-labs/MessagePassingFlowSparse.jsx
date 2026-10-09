import { FlowLab, FlowControls, FlowReadout, FlowSlider, flowNumber as number } from './LessonFlow.jsx';
import { Drawing, Arrow, Cells, paperHues } from './MessagePassingFlowElements.jsx';
import { useSparsePath } from './MessagePassingSparseState.jsx';
import { directedSparseTrace } from '../../data/message-sparse-flow-models.js';
import './message-sparse-flow.css';

const amber = '#e4b752', violet = '#c1a4f5';
const text = (y, value, hue = '#eee', x = 16) => <text x={x} y={y} fill={hue}>{value}</text>;

function ScalarCell({ x, y, value, hue = '#666', width = 100 }) {
  return <g><rect x={x} y={y} width={width} height={38} fill="#101010" stroke={hue} />
    <text x={x + width / 2} y={y + 25} textAnchor="middle">{number(value, 6)}</text></g>;
}

function CurrentPath({ trace }) {
  const at = id => 114 + id * 171;
  return <Drawing width={336} height={554} label={`Current three-node path; feature rows 1,2,${trace.features[2]}; both 1–2 routes ${trace.rightEdge ? 'present' : 'absent'}; closed receiving degrees ${trace.degree}; own routes are added explicitly`}>
    {text(26, 'Circles: semantic node IDs')}
    {text(58, 'GCN adds the curved own routes')}
    {[0, 1].filter(id => id === 0 || trace.rightEdge).map(id => <g key={id}>
      <Arrow x1={42} y1={at(id) + 27} x2={42} y2={at(id + 1) - 27} />
      <Arrow x1={74} y1={at(id + 1) - 27} x2={74} y2={at(id) + 27} />
      {text(at(id) + 91, `${id}→${id + 1} and ${id + 1}→${id}`, '#aaa', 103)}
    </g>)}
    {trace.features.map((value, id) => <g key={id}>
      <path d={`M35,${at(id)}C8,${at(id) - 9} 15,${at(id) - 49} 43,${at(id) - 17}`} fill="none" stroke={paperHues[id]} />
      <path d={`M34,${at(id) - 22}L43,${at(id) - 17}L40,${at(id) - 27}`} fill="none" stroke={paperHues[id]} />
      <circle cx={58} cy={at(id)} r={23} stroke={paperHues[id]} strokeWidth={2} fill="#101010" />
      <text x={58} y={at(id) + 6} textAnchor="middle" fill={paperHues[id]}>{id}</text>
      {text(at(id) + 5, `Feature = ${number(value)}`, paperHues[id], 105)}
      {text(at(id) + 38, `Closed degree = ${trace.degree[id]}`, '#eee', 105)}
    </g>)}
    {text(541, 'Two arrow directions = two routes')}
  </Drawing>;
}

function ReceivingMatrix({ matrix, cached = false }) {
  return <Drawing width={336} height={369} label={`${cached ? 'Original cached' : 'Rebuilt current'} S matrix: receiver rows 0,1,2, sender columns 0,1,2; white row is traced receiver 1`}>
    {text(26, cached ? 'Cached original path S' : 'Rebuilt current graph S', cached ? '#e7a6da' : '#eee')}
    {text(61, 'Columns: sender IDs')}
    {[0, 1, 2].map(id => <text key={id} x={87 + id * 88} y={97} textAnchor="middle" fill={paperHues[id]}>{id}</text>)}
    <Cells x={45} y={116} values={matrix} labels={['0', '1', '2']} identities={[0, 1, 2]} cellWidth={88} digits={5} signFill={false} />
    <rect x={42} y={161} width={267} height={46} fill="none" stroke="#fff" />
    {text(298, 'Rows: receiver IDs; trace row 1')}
    {text(335, 'Entry × sender value → product')}
  </Drawing>;
}

function GatherReceiver({ trace }) {
  const routes = trace.gcnRoutes.filter(route => route.receiver === 1), bottom = 92 + routes.length * 184;
  return <Drawing width={336} height={bottom + 155} label="Receiver 1 sparse gather/scatter: each projected sender value times its current coefficient, then all products accumulate at one receiving row; identity scalar projection W1, bias 0">
    {text(26, 'Project each node once: W = 1', amber)}
    {text(60, 'Gather sender rows; trace receiver 1')}
    {routes.map((route, index) => {
      const y = 94 + index * 184;
      return <g key={route.sender}>
        {text(y - 11, `Sender ${route.sender}`, paperHues[route.sender])}
        {text(y - 11, 'S[1,sender]', amber, 174)}
        <ScalarCell x={16} y={y} value={route.projection} hue={paperHues[route.sender]} />
        <ScalarCell x={174} y={y} width={130} value={route.coefficient} hue={amber} />
        <Arrow x1={119} y1={y + 19} x2={132} y2={y + 19} />
        <Arrow x1={170} y1={y + 19} x2={161} y2={y + 19} />
        <circle cx={147} cy={y + 19} r={13} stroke="#aaa" fill="#101010" /><text x={147} y={y + 24} textAnchor="middle">×</text>
        <Arrow x1={147} y1={y + 35} x2={147} y2={y + 63} />
        <ScalarCell x={91} y={y + 69} width={112} value={route.product} hue={violet} />
        <path d={`M207,${y + 88}H322V${bottom + 29}H196`} stroke={paperHues[route.sender]} fill="none" />
        {text(y + 134, 'One weighted edge message', violet)}
      </g>;
    })}
    <circle cx={170} cy={bottom + 29} r={24} stroke={violet} fill="#101010" /><text x={170} y={bottom + 35} textAnchor="middle">Σ</text>
    {text(bottom + 75, 'index_add_: accumulate at row 1')}
    {text(bottom + 112, `Sparse = ${number(trace.sparseOutput[1], 8)}`, violet)}
    {text(bottom + 147, `Dense = ${number(trace.denseOutput[1], 8)}`)}
  </Drawing>;
}

function RouteTable({ trace }) {
  return <div className="mp-sparse-scroll" tabIndex={0} role="region" aria-label="Every current closed sender-to-receiver route">
    <table className="mp-sparse-table"><caption>Source/target columns and every current edge message</caption><thead><tr><th>Source / sender</th><th>Target / receiver</th><th>Closed degree pair</th><th>Coefficient</th><th>Gathered projection</th><th>Product</th></tr></thead>
      <tbody>{trace.gcnRoutes.map(route => <tr key={`${route.sender}-${route.receiver}`}><th>{route.sender}</th><td>{route.receiver}</td><td>{trace.degree[route.receiver]}, {trace.degree[route.sender]}</td><td>{number(route.coefficient, 8)}</td><td>{number(route.projection)}</td><td>{number(route.product, 8)}</td></tr>)}</tbody></table>
  </div>;
}

export function MessagePassingSparseGcnLab() {
  const state = useSparsePath(), { trace } = state;
  return <FlowLab id="message-sparse-gather-scatter" label="Compare current dense and sparse GCN, then inspect the deliberately cached original normalizer">
    <div className="mp-sparse-grid"><CurrentPath trace={trace} /><ReceivingMatrix matrix={trace.matrix} /><GatherReceiver trace={trace} /></div>
    <FlowControls><label className="mp-sparse-toggle"><input type="checkbox" checked={state.rightEdge} onChange={event => state.setRightEdge(event.target.checked)} />Both routes for edge 1—2</label>
      <FlowSlider name="Endpoint 2 feature" value={state.endpointValue} onChange={state.setEndpointValue} min={-2} max={6} step={.25} />
      <button type="button" onClick={state.reset}>Reset</button></FlowControls>
    <FlowReadout>The current closed degrees are <strong>[{trace.degree.join(', ')}]</strong>. Dense and sparse receiver 1 both give <strong>{number(trace.sparseOutput[1], 8)}</strong>; their maximum difference over all three nodes is {number(trace.maximumDenseSparseDifference, 12)}. {trace.rightEdge ? 'Changing the feature changes the messages while the same normalization remains valid.' : 'Removing 1—2 removes both directed routes and rebuilds all affected coefficients.'}</FlowReadout>
    <RouteTable trace={trace} />
    <div className="mp-sparse-grid"><ReceivingMatrix matrix={trace.cachedMatrix} cached />
      <Drawing width={336} height={362} label="Rebuilt versus deliberately cached original outputs, for the same current feature values; an edge edit invalidates the original graph cache">
        {text(26, 'Same current features; two operators')}
        {text(66, 'Node', '#eee', 16)}{text(66, 'Rebuilt', '#eee', 103)}{text(66, 'Original cache', '#e7a6da', 203)}
        {trace.features.map((_, id) => <g key={id}><text x={16} y={115 + id * 68} fill={paperHues[id]}>{id}</text><text x={101} y={115 + id * 68}>{number(trace.denseOutput[id], 5)}</text><text x={205} y={115 + id * 68} fill="#e7a6da">{number(trace.cachedOutput[id], 5)}</text></g>)}
        {text(302, trace.cacheCurrent ? 'Original cache still matches this graph' : 'Original cache is stale after edge edit', '#e7a6da')}
        {text(344, 'It still stores the original 1—2 routes')}
      </Drawing></div>
    <p className="flow-note">The pink comparison deliberately keeps the original path operator. It is a diagnostic contrast, not the sparse calculation. All numerical labels are rounded.</p>
  </FlowLab>;
}

export function MessagePassingSparseSageFigure() {
  const { trace } = useSparsePath(), row = trace.sage[2];
  return <FlowLab id="message-sparse-mean-sage" label="Same current graph: endpoint 2 open-neighbor mean, neighbor-map bias and independent own branch">
    <div className="mp-sparse-grid">
      <Drawing width={336} height={812} label="Endpoint 2: raw donor rows are reduced before projection; empty-neighbor mean 0 still receives neighbor-map bias 1, independent own weight 2 acts on its input">
        {text(26, 'Follow endpoint 2 on the same graph')}
        {text(61, 'Open neighbors; no extra own loop')}
        {text(105, row.count ? 'Gather sender 1' : 'No donor row exists', row.count ? paperHues[1] : '#aaa')}
        {row.count > 0 && <><ScalarCell x={16} y={122} value={trace.features[1]} hue={paperHues[1]} /><Arrow x1={66} y1={163} x2={66} y2={178} /></>}
        {text(201, 'Donor sum')}{text(201, 'Donor count', '#eee', 218)}
        <ScalarCell x={16} y={211} value={row.sum} hue={violet} />
        <ScalarCell x={218} y={211} value={row.count} hue={amber} />
        {row.count > 0 ? <><Arrow x1={121} y1={230} x2={154} y2={282} /><Arrow x1={214} y1={230} x2={183} y2={282} /><circle cx={168} cy={297} r={16} stroke="#aaa" fill="#101010" /><text x={168} y={303} textAnchor="middle">÷</text><Arrow x1={168} y1={317} x2={168} y2={338} /></>
          : text(309, 'Count 0: use 0; do not divide by 0')}
        {text(365, row.count ? 'Mean of open donor rows' : 'Zero summary by empty policy')}
        <ScalarCell x={116} y={375} value={row.mean} hue={violet} />
        <Arrow x1={168} y1={419} x2={168} y2={432} />
        {text(459, `Neighbor weight 1; then bias +1`, amber)}
        {text(500, `Neighbor term = ${number(row.neighborTerm)}`, violet)}
        {text(552, `Own row: 2 × ${number(trace.features[2])}`, paperHues[2])}
        <ScalarCell x={16} y={571} value={row.ownTerm} hue={paperHues[2]} />
        <ScalarCell x={218} y={571} value={row.neighborTerm} hue={violet} />
        <Arrow x1={121} y1={590} x2={150} y2={590} /><Arrow x1={214} y1={590} x2={185} y2={590} />
        <circle cx={168} cy={590} r={16} stroke="#aaa" fill="#101010" /><text x={168} y={596} textAnchor="middle">+</text>
        <Arrow x1={168} y1={610} x2={168} y2={653} />
        {text(688, `Endpoint 2 output = ${number(row.output)}`, violet)}
        {text(730, 'Own branch and bias survive isolation')}
        {text(790, 'Fixed maps: neighbor 1; own 2; bias 1', amber)}
      </Drawing>
      <Drawing width={336} height={367} label="All current Mean-SAGE open counts, means and outputs under fixed neighbor weight 1, own weight 2 and bias 1">
        {text(26, 'Mean-SAGE: all current node rows')}
        {text(65, 'ID / count / mean / own / output')}
        {trace.sage.map((v, id) => <g key={id}>{text(124 + id * 63, `${id} / ${v.count} / ${number(v.mean)} / ${number(v.ownTerm)} / ${number(v.output)}`, paperHues[id])}</g>)}
        {text(327, 'Bias +1 acts after the neighbor mean', amber)}
      </Drawing>
    </div>
    <FlowReadout>Endpoint 2 has <strong>{row.count}</strong> open neighbors. Its neighbor summary is {number(row.mean)}, then the fixed neighbor map adds bias 1. The own branch contributes {number(row.ownTerm)}, giving <strong>{number(row.output)}</strong>. {row.count === 0 && 'Putting that bias inside an empty reduction would incorrectly remove it.'}</FlowReadout>
  </FlowLab>;
}

function ReceiverSegment({ segment }) {
  const bottom = 128 + segment.routes.length * 114;
  return <Drawing width={336} height={bottom + 190} label={`One GAT head: receiver ${segment.receiver} has its own allowed sender segment, maximum ${segment.maximum}, shifted exponential sum ${segment.denominator} and probabilities summing to 1`}>
    {text(26, `Receiving segment ${segment.receiver}`, paperHues[segment.receiver])}
    {text(63, 'Projection 1; receiver/sender scores 1', amber)}
    {text(99, `Segment maximum = ${number(segment.maximum)}`)}
    {segment.routes.map((route, index) => {
      const y = 143 + index * 114;
      return <g key={route.sender}>
        {text(y, `Sender ${route.sender}: ${number(route.raw)} → ${number(route.score)}`, paperHues[route.sender])}
        {text(y + 31, `exp(${number(route.shifted)}) = ${number(route.mass, 5)}`)}
        <line x1={16} y1={y + 57} x2={307} y2={y + 57} stroke="#777" />
        <rect x={16} y={y + 47} width={291 * route.coefficient} height={20} fill={paperHues[route.sender]} />
        {text(y + 94, `α ${number(route.coefficient, 5)} × value ${number(route.projection)}`)}
      </g>;
    })}
    {text(bottom + 33, `Exponential sum = ${number(segment.denominator, 6)}`)}
    {text(bottom + 69, 'Each mass / this receiving sum')}
    {text(bottom + 105, 'Bars: α on the same 0—1 scale')}
    {text(bottom + 147, `Weighted sum = ${number(segment.output, 6)}`, violet)}
    {text(bottom + 184, 'All incoming α sum to 1')}
  </Drawing>;
}

export function MessagePassingSparseGatFigure() {
  const { trace } = useSparsePath();
  return <FlowLab id="message-sparse-segment-softmax" label="GAT normalizes each receiving segment separately; compare an intentionally wrong global edge softmax on the same graph">
    <p className="flow-note">Use the same current scalar rows with an identity projection and fixed sender/receiver score weights 1. The score is their sum, followed by LeakyReLU with negative slope .2. This is one constructed head; each head in the ordinary implementation needs its own receiving-segment normalization.</p>
    <div className="mp-sparse-grid">{trace.gat.map(segment => <ReceiverSegment key={segment.receiver} segment={segment} />)}</div>
    <div className="mp-sparse-scroll" tabIndex={0} role="region" aria-label="All current GAT edge scores, shifted masses and local probabilities">
      <table className="mp-sparse-table"><caption>Per-edge operations before the receiving sum</caption><thead><tr><th>Sender → receiver</th><th>Raw score</th><th>LeakyReLU score</th><th>Score − local max</th><th>Exponential mass</th><th>Local α</th><th>α × projected value</th></tr></thead><tbody>{trace.gat.flatMap(segment => segment.routes.map(route => <tr key={`${route.sender}-${route.receiver}`}><th>{route.sender} → {route.receiver}</th><td>{number(route.raw)}</td><td>{number(route.score)}</td><td>{number(route.shifted)}</td><td>{number(route.mass, 8)}</td><td>{number(route.coefficient, 8)}</td><td>{number(route.product, 8)}</td></tr>))}</tbody></table>
    </div>
    <FlowReadout>Each receiver’s own incoming attention weights sum to <strong>1</strong>. The three locally normalized outputs are <strong>[{trace.gat.map(v => number(v.output, 5)).join(', ')}]</strong>. One global edge denominator would instead give [{trace.wrongGlobal.map(v => number(v, 5)).join(', ')}].</FlowReadout>
    <p>Under the deliberately wrong global denominator, the receiving segments get total masses [{trace.wrongMass.map(v => number(v, 5)).join(', ')}], sharing one unit of attention across unrelated receivers. This changes the operation; it is not a faster way to compute the local softmax.</p>
  </FlowLab>;
}

function DirectedSupport({ support, caption }) {
  const trace = directedSparseTrace(support), at = [[58, 114], [58, 285], [58, 456], [244, 285]];
  return <Drawing width={336} height={685} label={`${caption}: four actual directed supports and two-channel features, closed receiving degrees ${trace.degree}, normalized 1→0 coefficient ${trace.matrix[0][1]}, own 3 coefficient 1`}>
    {text(26, caption)}
    {text(60, 'Curves: own; degrees: incoming + own')}
    {trace.openRoutes.map(([sender, receiver]) => {
      const [sx, sy] = at[sender], [tx, ty] = at[receiver];
      if (sender === 3) return <Arrow key={`${sender}-${receiver}`} x1={sx - 28} y1={sy - 12} x2={tx + 28} y2={ty - 12} hue={paperHues[3]} />;
      return <Arrow key={`${sender}-${receiver}`} x1={sender < receiver ? 42 : 74} y1={sy + (sender < receiver ? 27 : -27)} x2={sender < receiver ? 42 : 74} y2={ty + (sender < receiver ? -27 : 27)} />;
    })}
    {at.map(([x, y], id) => <g key={id}>
      <path d={id === 3 ? `M${x + 23},${y}C${x + 60},${y - 9} ${x + 54},${y - 49} ${x + 15},${y - 17}` : `M${x - 23},${y}C${x - 50},${y - 9} ${x - 43},${y - 49} ${x - 15},${y - 17}`} fill="none" stroke={paperHues[id]} />
      <path d={id === 3 ? `M${x + 24},${y - 22}L${x + 15},${y - 17}L${x + 18},${y - 27}` : `M${x - 24},${y - 22}L${x - 15},${y - 17}L${x - 18},${y - 27}`} fill="none" stroke={paperHues[id]} />
      <circle cx={x} cy={y} r={23} stroke={paperHues[id]} strokeWidth={2} fill="#101010" />
      <text x={x} y={y + 6} textAnchor="middle" fill={paperHues[id]}>{id}</text>
      {id === 3 ? <><text x={x} y={y + 50} textAnchor="middle">degree {trace.degree[id]}</text><text x={x} y={y + 85} textAnchor="middle" fill={paperHues[id]}>[3, .1]</text></>
        : <>{text(y + 6, `degree ${trace.degree[id]}`, '#eee', 102)}{text(y + 40, `[${trace.vectorFeatures[id].map(v => number(v)).join(', ')}]`, paperHues[id], 102)}</>}
    </g>)}
    {text(545, `1→0 coefficient: ${number(trace.matrix[0][1], 8)}`, amber)}
    {text(583, `3→3 own coefficient: ${number(trace.matrix[3][3])}`, amber)}
    {text(621, support === 'added' ? `New 3→1: ${number(trace.matrix[1][3], 8)}` : 'No 3→1 route exists', paperHues[3])}
    {text(667, 'Receiving-degree convention is fixed')}
  </Drawing>;
}

export function MessagePassingSparseDirectedFigure() {
  const removed = directedSparseTrace('removed'), added = directedSparseTrace('added');
  return <FlowLab id="message-sparse-directed-customization" label="Original path-and-isolate, both 1–2 routes removed, then only 3→1 added; receiving-degree changes alter an existing 1→0 route">
    <div className="mp-sparse-grid"><DirectedSupport support="original" caption="Start: path 0—1—2; isolate 3" /><DirectedSupport support="removed" caption="Remove both 1→2 and 2→1" /><DirectedSupport support="added" caption="Then add only 3→1" /></div>
    <FlowReadout>After removal the closed receiving degrees are <strong>[{removed.degree.join(', ')}]</strong>; adding only 3→1 gives <strong>[{added.degree.join(', ')}]</strong>. The existing 1→0 coefficient changes from <strong>1/2</strong> to <strong>1/√6</strong>, because sender 1’s receiving degree changed. Node 3’s own coefficient stays 1.</FlowReadout>
    <p>These drawings keep the four-node fixture’s two input coordinates fixed. The outgoing route changes a receiving-degree factor used elsewhere. It does not give node 3 an incoming neighbor. Node 3’s own GCN route therefore stays unchanged, while its feature can still affect another node’s output and loss.</p>
  </FlowLab>;
}

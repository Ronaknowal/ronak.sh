import { useState } from 'react';
import { FlowLab, FlowControls, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { Drawing } from './MessagePassingFlowElements.jsx';
import { AttentionSelect } from './MessagePassingAttentionState.jsx';
import examples from '../../data/message-passing-examples.json';
import { observedNeighborhood } from '../../data/message-study-flow-models.js';
import './message-study-flow.css';

export const clubHues = ['#82d3ed', '#e4b752'];
export const observedRole = id => Object.keys(examples.roles).find(role => examples.roles[role].includes(id));
export const observedNodeChoices = examples.graph.nodes.map(node => [node.id, `Member ${node.id}`]);

export function MemberMark({ id, x, y, role = true, selected = false }) {
  const shape = role ? observedRole(id) : 'fit';
  const hue = clubHues[examples.graph.nodes[id].club];
  const style = { stroke: hue, fill: '#101010', strokeWidth: 2 };
  return <g>
    {selected && <circle cx={x} cy={y} r={24} stroke="#fff" fill="none" strokeWidth={2} />}
    {shape === 'fit' ? <circle cx={x} cy={y} r={17} {...style} />
      : shape === 'development' ? <rect x={x - 17} y={y - 17} width={34} height={34} {...style} />
        : <path d={`M${x},${y - 22}L${x + 22},${y}L${x},${y + 22}L${x - 22},${y}Z`} {...style} />}
    <text x={x} y={y + 5} textAnchor="middle" fill={hue}>{id}</text>
  </g>;
}

export function MessagePassingObservedGraphFigure() {
  const positions = examples.graph.nodes.map((_, id) => {
    const angle = 2 * Math.PI * id / 34 - Math.PI / 2;
    return [352 + 292 * Math.cos(angle), 337 + 292 * Math.sin(angle)];
  });
  return <FlowLab id="message-observed-network" label="All observed relationships, semantic member IDs, class annotations and fixed label roles" data-job="D24">
    <Drawing width={704} height={810} label="Zachary network: 34 members and 78 binary undirected relationships; circle fitting, square development, diamond assessment; cyan Mr.Hi class 0, amber Officer class 1">
      {examples.graph.edges.map(([left, right]) => <line key={`${left}-${right}`} x1={positions[left][0]} y1={positions[left][1]} x2={positions[right][0]} y2={positions[right][1]} stroke="#555" />)}
      {positions.map(([x, y], id) => <MemberMark key={id} id={id} x={x} y={y} />)}
      <text x={20} y={675}>34 member IDs · 78 undirected observed relationships</text>
      <text x={20} y={711}>Circle: 10 fitting · square: 6 development · diamond: 18 assessment</text>
      <text x={20} y={747} fill={clubHues[0]}>Cyan annotation: class 0 / Mr.Hi</text>
      <text x={20} y={779} fill={clubHues[1]}>Amber annotation: class 1 / Officer</text>
    </Drawing>
    <p className="flow-note">Node positions are a display layout. Class colour is an answer annotation, not a feature. Lines use binary strength 1; original interaction-context counts remain in the source.</p>
    <div className="mp-study-scroll" tabIndex={0} role="region" aria-label="Every observed member and its fixed experimental role">
      <table className="mp-study-table"><caption>Complete member annotations</caption><thead><tr><th>Semantic ID</th><th>Paper ID</th><th>Label role</th><th>Club answer annotation</th></tr></thead><tbody>{examples.graph.nodes.map(node => <tr key={node.id}><th>{node.id}</th><td>{node.paper_id}</td><td>{observedRole(node.id)}</td><td>{node.club} / {node.club ? 'Officer' : 'Mr.Hi'}</td></tr>)}</tbody></table>
    </div>
    <div className="mp-study-scroll" tabIndex={0} role="region" aria-label="All 78 observed relationships and their original interaction-context counts">
      <table className="mp-study-table"><caption>Complete observed relationships</caption><thead><tr><th>Member IDs</th><th>Original context count</th><th>Fitted binary strength</th></tr></thead><tbody>{examples.graph.edges.map(([left, right, count]) => <tr key={`${left}-${right}`}><th>{left}—{right}</th><td>{count}</td><td>1</td></tr>)}</tbody></table>
    </div>
  </FlowLab>;
}

function NeighborhoodPicture({ trace }) {
  const positions = new Map(trace.neighbors.map((id, index) => {
    const angle = 2 * Math.PI * index / trace.neighbors.length - Math.PI / 2;
    return [id, [352 + 263 * Math.cos(angle), 312 + 263 * Math.sin(angle)]];
  }));
  return <Drawing width={704} height={715} label={`Member ${trace.selected}: ${trace.degree} neighbors and ${trace.connectedPairs.length} connected neighbor pairs; white selected member, violet counted neighbor edges`}>
    {trace.neighbors.map(id => <line key={id} x1={352} y1={312} x2={positions.get(id)[0]} y2={positions.get(id)[1]} stroke="#aaa" />)}
    {trace.connectedPairs.map(([left, right]) => <line key={`${left}-${right}`} x1={positions.get(left)[0]} y1={positions.get(left)[1]} x2={positions.get(right)[0]} y2={positions.get(right)[1]} stroke="#c1a4f5" strokeWidth={2} />)}
    {trace.neighbors.map(id => <MemberMark key={id} id={id} x={positions.get(id)[0]} y={positions.get(id)[1]} />)}
    <MemberMark id={trace.selected} x={352} y={312} selected />
    <text x={20} y={632}>White halo: selected member {trace.selected}</text>
    <text x={20} y={669} fill="#c1a4f5">Violet edge: one connected neighbor pair counted</text>
    <text x={20} y={704}>Club colours retain answer annotations; they are not input channels.</text>
  </Drawing>;
}

export function MessagePassingObservedFeaturesLab() {
  const [selected, setSelected] = useState(0);
  const trace = observedNeighborhood(examples.graph, selected);
  return <FlowLab id="message-observed-features" label="Compute a member's three structural input channels from actual observed neighbors" data-job="D25">
    <NeighborhoodPicture trace={trace} />
    <div className="mp-study-grid">
      <Drawing width={288} height={330} label={`Degree ${trace.degree}; divide by 33 possible other members, giving ${trace.features[1]}`}>
        <text x={20} y={34}>Count distinct neighbor IDs</text>
        <text x={20} y={86}>Degree k = {trace.degree}</text>
        <path d="M144,109V147" stroke="#aaa" /><path d="M138,138l6,9l6,-9" stroke="#aaa" fill="none" />
        <text x={20} y={195}>Divide by 33 other members</text>
        <text x={20} y={249} fill="#c1a4f5">Channel 2 = {number(trace.features[1])}</text>
        <text x={20} y={308}>Channel 1 is the constant 1</text>
      </Drawing>
      <Drawing width={288} height={330} label={`${trace.connectedPairs.length} connected pairs of ${trace.possiblePairs} possible; clustering ${trace.clustering}`}>
        <text x={20} y={34}>Count connected neighbor pairs</text>
        <text x={20} y={86}>t = {trace.connectedPairs.length}</text>
        <text x={20} y={140}>Possible: k(k−1)/2 = {trace.possiblePairs}</text>
        <text x={20} y={194}>Clustering: {trace.possiblePairs ? `${trace.connectedPairs.length}/${trace.possiblePairs}` : '0 by zero-pair policy'}</text>
        <text x={20} y={249} fill="#c1a4f5">Channel 3 = {number(trace.clustering)}</text>
        <text x={20} y={308}>No club-label input</text>
      </Drawing>
    </div>
    <FlowControls><AttentionSelect label="Observed semantic member" value={selected} choices={observedNodeChoices} onChange={setSelected} /><button type="button" onClick={() => setSelected(0)}>Reset</button></FlowControls>
    <FlowReadout>Member {selected} has <strong>{trace.degree}</strong> neighbors and <strong>{trace.connectedPairs.length}/{trace.possiblePairs}</strong> connected/possible neighbor pairs. Its input row is <strong>[1, {number(trace.features[1])}, {number(trace.clustering)}]</strong>. {trace.possiblePairs === 0 && 'No neighbor pair exists, so clustering is defined as 0.'}</FlowReadout>
    <p>Neighbors: {trace.neighbors.join(', ') || 'none'}. Counted pairs: {trace.connectedPairs.map(pair => pair.join('—')).join(', ') || 'none'}.</p>
  </FlowLab>;
}

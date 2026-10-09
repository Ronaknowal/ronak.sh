import { memo, useId } from 'react';
import { Drawing, Arrow, Cells } from './MessagePassingFlowElements.jsx';
import { MemberMark, clubHues, observedRole } from './MessagePassingFlowObserved.jsx';
import { flowNumber as number } from './LessonFlow.jsx';
import { inspectorEdges, inspectorFeatureNames, inspectorFamilyNames, inspectorLabels } from '../../data/message-inspector-flow-models.js';
import './message-inspector-flow.css';

export const inspectorClassNames = ['Mr. Hi', 'Officer'];
export const inspectorMemberChoices = Array.from({ length: 34 }, (_, id) => [id, `Member ${id}`]);
export function InspectorSelect({ label, value, choices, onChange, numeric = true }) {
  const id = useId();
  return <label className="mp-inspector-select" htmlFor={id}><span id={`${id}-label`}>{label}</span><select id={id} aria-labelledby={`${id}-label`} value={value}
    onChange={event => onChange(numeric ? Number(event.target.value) : event.target.value)}>
    {choices.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
  </select></label>;
}

export function InspectorInputIdentity({ family, inputs, summary, pinned = false }) {
  return <p className="mp-inspector-identity">{pinned ? 'Pinned' : 'Current'} {inspectorFamilyNames[family]}, saved seed 11;
    {' '}member {inputs.receiver}, projected channel {inputs.hiddenChannel};
    {' '}{inputs.reversed ? 'reversed' : 'original'} storage;
    {' '}{summary.featureEdits.length} edited feature coordinates and {summary.removedEdges.length} absent original relationships.
    {' '}Local input snapshot {inputs.revision}.</p>;
}

export function InspectorClassLegend() {
  return <p className="mp-inspector-legend"><span style={{ color: clubHues[0] }}>Cyan: Mr. Hi, class 0</span>;
    {' '}<span style={{ color: clubHues[1] }}>amber: Officer, class 1</span>. These club colours are answer annotations.
    Circle = fitting member, square = development member, diamond = assessment member. White outline = selected receiver.</p>;
}

export const InspectorGraph = memo(function InspectorGraph({ adjacency, receiver, edgeIndex = null, label = 'Current observed relationships' }) {
  const locations = Array.from({ length: 34 }, (_, id) => {
    const angle = -Math.PI / 2 + id * 2 * Math.PI / 34;
    return [352 + 292 * Math.cos(angle), 366 + 292 * Math.sin(angle)];
  });
  const selected = edgeIndex === null ? null : inspectorEdges[edgeIndex];
  return <Drawing label={label} height={748}>
    <text x={24} y={28}>{label}</text><text x={24} y={54}>IDs stay attached to members; outlines carry roles.</text>
    {inspectorEdges.map(([left, right]) => {
      const present = Boolean(adjacency[left][right]), highlighted = selected?.[0] === left && selected?.[1] === right;
      return <line key={`${left}-${right}`} x1={locations[left][0]} y1={locations[left][1]} x2={locations[right][0]} y2={locations[right][1]}
        stroke={highlighted ? '#e7a6da' : '#777'} strokeWidth={highlighted ? 4 : 1.2} opacity={highlighted ? 1 : present ? .45 : .15}
        strokeDasharray={present ? undefined : '5 7'} />;
    })}
    {locations.map(([x, y], id) => <MemberMark key={id} id={id} x={x} y={y} selected={id === receiver} />)}
    <text x={24} y={712}>Solid: present. Faint dashed: original pair now absent.</text>
    {selected && <text x={24} y={738} fill="#e7a6da">Pink pair: {selected[0]}—{selected[1]}; {adjacency[selected[0]][selected[1]] ? 'present' : 'absent'}.</text>}
  </Drawing>;
});

export function InspectorProjection({ input, weights, title, coordinate, original = null }) {
  const products = input.map((value, field) => value * weights[field]);
  return <Drawing label={title} width={624} height={332}>
    <text x={24} y={26}>{title}</text>
    <text x={170} y={62} textAnchor="middle">input</text><text x={338} y={62} textAnchor="middle">copied weight</text>
    <text x={524} y={62} textAnchor="middle">product</text>
    {input.map((value, field) => <g key={field}>
      <text x={20} y={100 + field * 56}>x{field}</text>
      <Cells x={110} y={76 + field * 56} values={[[value]]} cellWidth={124} digits={5} />
      <text x={264} y={104 + field * 56}>×</text>
      <Cells x={278} y={76 + field * 56} values={[[weights[field]]]} cellWidth={124} digits={5} />
      <Arrow x1={416} y1={96 + field * 56} x2={448} y2={96 + field * 56} />
      <Cells x={464} y={76 + field * 56} values={[[products[field]]]} cellWidth={124} digits={5} />
    </g>)}
    <text x={20} y={278}>Sum → projected channel {coordinate}: {number(products.reduce((a, b) => a + b, 0))}</text>
    {original && <text x={20} y={306}>Original selected row: [{original.map(value => number(value, 4)).join(', ')}]</text>}
  </Drawing>;
}

export function InspectorLayerTerms({ layer, label, kind, outputCoordinate, rectified = false }) {
  const n = layer.incoming.length, rowHeight = 78, sumY = 96 + Math.max(n, 1) * rowHeight;
  return <Drawing label={label} height={sumY + (rectified ? 394 : 308)}>
    <text x={24} y={28}>{label}</text>
    <text x={24} y={55}>Receiver member {layer.receiver} → stored row {layer.row}</text>
    <text x={24} y={86}>sender / row</text><text x={194} y={86}>projected value</text>
    <text x={362} y={86}>coefficient</text><text x={558} y={86}>product</text>
    {layer.incoming.map((term, i) => <g key={term.sender}>
      <text x={24} y={126 + rowHeight * i}>{term.sender} / {term.senderRow}</text>
      <Cells x={176} y={100 + rowHeight * i} values={[[term.projected]]} cellWidth={138} digits={5} />
      <text x={328} y={128 + rowHeight * i}>×</text>
      <Cells x={356} y={100 + rowHeight * i} values={[[term.coefficient]]} cellWidth={138} digits={5} />
      <Arrow x1={508} y1={120 + rowHeight * i} x2={534} y2={120 + rowHeight * i} />
      <Cells x={550} y={100 + rowHeight * i} values={[[term.product]]} cellWidth={138} digits={5} />
      <text x={176} y={160 + rowHeight * i}>{kind === 'gcn' ? `closed degrees: sender ${term.closedSenderDegree}, receiver ${term.closedReceiverDegree}`
        : kind === 'sage' ? `open-neighbor count ${term.openReceiverDegree}; no self message`
          : `local mass ${number(term.mass, 4)} / total ${number(term.denominator, 4)}`}</text>
    </g>)}
    {!n && <text x={24} y={130}>{kind === 'mlp' ? 'No message paths: own projection supplies this channel.' : 'No open neighbors: the message sum is exactly 0.'}</text>}
    <text x={80} y={sumY + 24}>message sum</text><text x={288} y={sumY + 24}>{kind === 'sage' ? 'self projection' : kind === 'mlp' ? 'own projection' : 'extra own term'}</text><text x={496} y={sumY + 24}>copied bias</text>
    <Cells x={80} y={sumY + 44} values={[[layer.neighborSum]]} cellWidth={128} digits={5} />
    <Cells x={288} y={sumY + 44} values={[[layer.own]]} cellWidth={128} digits={5} />
    <Cells x={496} y={sumY + 44} values={[[layer.bias]]} cellWidth={128} digits={5} />
    <Arrow x1={144} y1={sumY + 94} x2={328} y2={sumY + 142} />
    <Arrow x1={352} y1={sumY + 94} x2={352} y2={sumY + 126} />
    <Arrow x1={560} y1={sumY + 94} x2={376} y2={sumY + 142} />
    <circle cx={352} cy={sumY + 150} r={23} fill="#101010" stroke="#eee" strokeWidth={2} /><text x={352} y={sumY + 157} textAnchor="middle">+</text>
    <text x={24} y={sumY + 188}>{!layer.ownWeights ? 'Self, if allowed, is already in the message sum.' : 'Own weights are independent of the neighbor weights.'}</text>
    <Arrow x1={352} y1={sumY + 200} x2={352} y2={sumY + 222} />
    <Cells x={280} y={sumY + 236} values={[[layer.preactivation]]} cellWidth={148} digits={6} />
    <text x={448} y={sumY + 264}>{rectified ? 'preactivation' : `class ${outputCoordinate} logit`}</text>
    {rectified ? <>
      <Arrow x1={352} y1={sumY + 284} x2={352} y2={sumY + 314} />
      <Cells x={280} y={sumY + 328} values={[[Math.max(0, layer.preactivation)]]} cellWidth={148} digits={6} />
      <text x={448} y={sumY + 356}>ReLU = max(0, input)</text>
    </> : <text x={24} y={sumY + 302}>No ReLU on the two last-layer logits.</text>}
  </Drawing>;
}

export function InspectorProbabilityFigure({ trace, label = 'Two logits become two class probabilities' }) {
  return <Drawing label={label} height={330}>
    <text x={24} y={28}>{label}</text><text x={24} y={54}>Same member {trace.first.receiver}, stored row {trace.row}</text>
    {trace.logits.map((value, c) => <g key={c}>
      <text x={24} y={100 + c * 84} fill={clubHues[c]}>Class {c}</text>
      <Cells x={102} y={74 + c * 84} values={[[value]]} cellWidth={128} digits={5} />
      <Arrow x1={244} y1={94 + c * 84} x2={274} y2={94 + c * 84} />
      <Cells x={294} y={74 + c * 84} values={[[trace.masses[c]]]} cellWidth={128} digits={5} />
      <Arrow x1={436} y1={94 + c * 84} x2={466} y2={94 + c * 84} />
      <Cells x={486} y={74 + c * 84} values={[[trace.probabilities[c]]]} cellWidth={128} digits={6} />
      <text x={108} y={136 + c * 84}>logit</text><text x={294} y={136 + c * 84}>exp(logit − max)</text><text x={486} y={136 + c * 84}>mass / total</text>
    </g>)}
    <text x={24} y={268}>Shared maximum {number(trace.maximum)}; mass total {number(trace.normalizer)}</text>
    <text x={24} y={302}>Larger probability → {inspectorClassNames[trace.predicted]}, class {trace.predicted}</text>
  </Drawing>;
}

export const InspectorParameterTables = memo(function InspectorParameterTables({ model }) {
  return Object.entries(model.state).map(([key, values]) => {
    const matrix = Array.isArray(values[0]) ? values : [values], fields = matrix[0].length;
    return <div className="mp-inspector-table-pan" key={key} tabIndex={0} role="region" aria-label={`Complete copied ${key}. Scroll horizontally when needed.`}>
      <table className="mp-inspector-values"><caption>Copied {key}: {Array.isArray(values[0]) ? `${matrix.length} output rows × ${fields} input columns` : `${fields} coordinates`}. Values rounded for display; original saved file retains full precision.</caption>
        <thead><tr><th scope="col">Row</th>{matrix[0].map((_, field) => <th scope="col" key={field}>{field}</th>)}</tr></thead>
        <tbody>{matrix.map((row, r) => <tr key={r}><th scope="row">{r}</th>{row.map((value, c) => <td key={c}>{number(value, 6)}</td>)}</tr>)}</tbody>
      </table>
    </div>;
  });
});

export function InspectorProbabilityTable({ trace }) {
  return <div className="mp-inspector-table-pan" tabIndex={0} role="region" aria-label="All 34 current probabilities; scroll horizontally when needed.">
    <table className="mp-inspector-values"><caption>Every semantic member in the current saved-model inference. True clubs are answer annotations, not features.</caption>
      <thead><tr>{['Stored row', 'Member', 'Role', 'True club', 'P(Mr. Hi)', 'P(Officer)'].map(text => <th scope="col" key={text}>{text}</th>)}</tr></thead>
      <tbody>{trace.order.map((id, row) => <tr key={id} data-selected={id === trace.first.receiver}><th scope="row">{row}</th><td>{id}</td><td>{observedRole(id)}</td>
        <td>{inspectorClassNames[inspectorLabels[id]]}</td>
        {trace.result.probabilities[row].map((value, c) => <td key={c}>{number(value, 8)}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}

export const InspectorFeatureTable = memo(function InspectorFeatureTable({ features, order, receiver }) {
  return <div className="mp-inspector-table-pan" tabIndex={0} role="region" aria-label="All current feature rows and semantic identities; scroll horizontally when needed.">
    <table className="mp-inspector-values"><caption>Current feature storage: columns are {inspectorFeatureNames.join(', ')}. Rows follow the declared order.</caption>
      <thead><tr>{['Stored row', 'Member', 'Role', ...inspectorFeatureNames].map(text => <th scope="col" key={text}>{text}</th>)}</tr></thead>
      <tbody>{order.map((id, row) => <tr key={id} data-selected={id === receiver}><th scope="row">{row}</th><td>{id}</td><td>{observedRole(id)}</td>
        {features[id].map((value, c) => <td key={c}>{number(value, 8)}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
});

export const InspectorAdjacencyFigure = memo(function InspectorAdjacencyFigure({ adjacency, order, receiver, label }) {
  const pitch = 34, left = 156, top = 118, size = 34 * pitch;
  return <Drawing label={label} width={left + size + 24} height={top + size + 78}>
    <text x={24} y={28}>{label}</text><text x={24} y={54}>Columns: source members. Rows: receiving members. 1 = present, 0 = absent.</text>
    <text x={24} y={84}>stored column</text><text x={24} y={110}>member ID</text>
    {order.map((id, c) => <g key={id}><text x={left + c * pitch + pitch / 2} y={84} textAnchor="middle">{c}</text><text x={left + c * pitch + pitch / 2} y={110} textAnchor="middle">{id}</text></g>)}
    {order.map((id, r) => <g key={id}>
      <text x={left - 12} y={top + r * pitch + 23} textAnchor="end">row {r}: ID {id}</text>
      {order.map((source, c) => <g key={source}>
        <rect x={left + c * pitch} y={top + r * pitch} width={pitch} height={pitch} stroke="#555" fill={adjacency[id][source] ? '#203044' : '#0b0b0b'} />
        <text x={left + c * pitch + pitch / 2} y={top + r * pitch + 23} textAnchor="middle">{adjacency[id][source]}</text>
      </g>)}
    </g>)}
    <rect x={left} y={top + order.indexOf(receiver) * pitch} width={size} height={pitch} stroke="#fff" strokeWidth={3} fill="none" />
    <rect x={left + order.indexOf(receiver) * pitch} y={top} width={pitch} height={size} stroke="#fff" strokeWidth={3} fill="none" />
    <text x={24} y={top + size + 38}>White row/column outlines locate member {receiver}, not a different graph.</text>
  </Drawing>;
});

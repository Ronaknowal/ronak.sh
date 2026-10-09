import React, { useId } from 'react';
import { hues, number, adaptiveNumber, Plot, Table, Matrix } from '../../../ManifoldDrawing.jsx';
import { orderedDerivativeObjects, gridConvolutionObjects } from '../../../manifold-models.mjs';

function ArrowMarker({ id }) {
  return <defs><marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke" /></marker></defs>;
}
export function GaussianBranches({ row, distances }) {
  const marker = useId().replaceAll(':', '');
  return <><div className="manifold-scene">
    <svg viewBox="0 0 360 310" role="img" aria-label="Focus A selects B, C or D; arrow stroke width equals 8 times normalized selection probability; self excluded">
      <defs><marker id={`${marker}selection`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3" markerHeight="3" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="context-stroke" /></marker></defs>
      {['B', 'C', 'D'].map((id, i) => <g key={id}>
        <circle cx="35" cy={65 + 90 * i} r="7" fill={hues[0]} />
        <text x="35" y={45 + 90 * i} textAnchor="middle" fill={hues[0]}>A</text>
        {row.probabilities[i] > 0 && <line data-probability-candidate={id} x1="43" y1={65 + 90 * i} x2="302" y2={65 + 90 * i} stroke={hues[i + 1]} strokeWidth={8 * row.probabilities[i]} markerEnd={`url(#${marker}selection)`} />}
        <circle cx="312" cy={65 + 90 * i} r="6" fill={hues[i + 1]} />
        <text x="180" y={29 + 90 * i} textAnchor="middle" fill={hues[i + 1]}>{id} · distance {number(distances[i])}</text>
        <text x="180" y={49 + 90 * i} textAnchor="middle" fill={hues[i + 1]}>p({id}|A) = {adaptiveNumber(row.probabilities[i], 9)}</text>
      </g>)}
      <text x="180" y="290" textAnchor="middle">Self A→A excluded · p(A|A) = 0</text>
    </svg>
    <p>The same focus A repeats in each lane. Selection arrows run from A to candidate B, C or D. Their stroke width is exactly 8 times normalized probability, with no minimum; zero-probability arrows are absent. Tiny arrows may be imperceptible, so fixed candidate circles and printed probabilities preserve their identities. The following uniform-width connectors show operations; their widths do not encode probabilities.</p>
  </div>{['B', 'C', 'D'].map((id, i) => <div className="manifold-scene" key={id}>
    <svg viewBox="0 0 360 410" role="img" aria-label={`${id}: distance ${distances[i]}, raw exponential ${row.raw[i] === 0 ? 'numerical underflow' : adaptiveNumber(row.raw[i])}, shifted weight ${adaptiveNumber(row.shifted[i])}, candidate-selection probability ${adaptiveNumber(row.probabilities[i])}`}>
      <ArrowMarker id={`${marker}${id}`} />
      <circle cx="180" cy="30" r="6" fill={hues[i + 1]} />
      <text x="180" y="16" textAnchor="middle" fill={hues[i + 1]}>{id} · distance {number(distances[i])}</text>
      <path d="M180 37 V65 H305 V90" fill="none" stroke={hues[i + 1]} markerEnd={`url(#${marker}${id})`} />
      <text x="25" y="60">log r = {adaptiveNumber(row.logWeights[i])}</text>
      {[
        { y: 100, value: row.raw[i], title: 'Raw exp(log r)', underflow: row.raw[i] === 0 },
        { y: 225, value: row.shifted[i], title: 'Shifted exp(log r − max log r)', underflow: row.shifted[i] === 0 },
        { y: 350, value: row.probabilities[i], title: 'Selection probability', underflow: row.probabilities[i] === 0 },
      ].map(stage => <g key={stage.y}>
        <text x="25" y={stage.y - 10}>{stage.title}</text>
        <rect x="25" y={stage.y} width="280" height="16" fill="none" stroke="#777" />
        <rect x="25" y={stage.y} width={280 * stage.value} height="16" fill={hues[i + 1]} />
        <text x="25" y={stage.y + 42} fill={hues[i + 1]}>{stage.underflow ? '0 in floating point (underflow)' : adaptiveNumber(stage.value, 9)}</text>
      </g>)}
      <path d="M305 116 V225 M305 241 V350" fill="none" stroke={hues[i + 1]} markerEnd={`url(#${marker}${id})`} />
      <text x="25" y="180">Subtract common log {adaptiveNumber(row.logShift)}</text>
      <text x="25" y="305">Divide by shifted sum {adaptiveNumber(row.shiftedSum, 9)}</text>
    </svg>
    <p>{id} keeps its colour through every branch. Each weight/probability bar has the same true 0–1 scale; tiny bars are not enlarged.</p>
  </div>)}<div className="manifold-scene"><svg viewBox="0 0 360 190" role="img" aria-label="Self branch A to A excluded before candidate normalization; its probability is exactly zero">
    <ArrowMarker id={`${marker}self`} />
    <circle cx="180" cy="65" r="7" fill={hues[0]} /><text x="180" y="38" textAnchor="middle">Focus A</text>
    <path d="M187 65 C300 0 300 135 187 75" stroke={hues[0]} fill="none" markerEnd={`url(#${marker}self)`} />
    <path d="M260 48 L280 82 M280 48 L260 82" stroke={hues[0]} strokeWidth="3" />
    <text x="180" y="130" textAnchor="middle">Self A→A excluded before weights</text>
    <text x="180" y="165" textAnchor="middle">p(A|A) = 0 exactly</text>
  </svg><p>Self exclusion is a mathematical zero. A distinct record at distance0 is still a candidate and retains its own branch.</p></div></>;
}

export function ConditionalMerge() {
  const marker = useId().replaceAll(':', '');
  const domains = [
    { id: 'A', y: 85, candidates: ['B', 'C', 'D'], masses: [.8, .15, .05], colors: [1, 2, 3] },
    { id: 'B', y: 295, candidates: ['A', 'C', 'D'], masses: [.6, .3, .1], colors: [0, 2, 3] },
  ];
  return <div className="manifold-scene"><svg viewBox="0 0 360 690" role="img" aria-label="Two complete separate conditional domains A and B; selected A to B point8 and B to A point6 merge, divide by8, and feed both AB and BA joint cells point175">
    <ArrowMarker id={marker} />
    {domains.map((domain, row) => <g key={domain.id}>
      <text x="20" y={domain.y - 65}>Condition on {domain.id} · row sum 1</text>
      <circle cx="45" cy={domain.y} r="7" fill={hues[row]} />
      <text x="25" y={domain.y + 27}>{domain.id}</text>
      {domain.candidates.map((id, j) => <g key={id}>
        <line x1="52" y1={domain.y} x2="265" y2={domain.y - 40 + 50 * j} stroke={hues[domain.colors[j]]} strokeWidth={8 * domain.masses[j]} markerEnd={`url(#${marker})`} />
        <circle cx="275" cy={domain.y - 40 + 50 * j} r="5" fill={hues[domain.colors[j]]} />
        <text x="275" y={domain.y - 48 + 50 * j} textAnchor="middle" fill={hues[domain.colors[j]]}>{id}: {domain.masses[j]}</text>
      </g>)}
      <text x="20" y={domain.y + 90}>Self {domain.id}→{domain.id}: 0 (excluded)</text>
    </g>)}
    <path d="M280 45 H345 V440 H180" fill="none" stroke={hues[1]} strokeWidth="2" markerEnd={`url(#${marker})`} />
    <path d="M280 255 H325 V440 H180" fill="none" stroke={hues[0]} strokeWidth="2" markerEnd={`url(#${marker})`} />
    <circle cx="180" cy="440" r="6" fill={hues[1]} />
    <text x="20" y="420">Selected opposite branches only</text>
    <text x="180" y="473" textAnchor="middle">.8 + .6 = 1.4</text>
    <path d="M180 480 V535 M180 535 L90 585 M180 535 L270 585" fill="none" stroke={hues[1]} strokeWidth="2" markerEnd={`url(#${marker})`} />
    <text x="200" y="515">÷ (2n = 8)</text>
    {[90, 270].map((x, i) => <g key={x}>
      <rect x={x - 45} y="590" width="90" height="55" fill={hues[1]} fillOpacity=".12" stroke={hues[1]} />
      <text x={x} y="612" textAnchor="middle">{i ? 'BA cell' : 'AB cell'}</text>
      <text x={x} y="635" textAnchor="middle">.175</text>
    </g>)}
    <text x="180" y="677" textAnchor="middle">Two equal ordered cells · combined mass .35</text>
  </svg><p>Each complete conditional domain has its own normalization before the selected opposite branches merge. Branch thickness is 8 times conditional mass. These are constructed .8/.6 rows, separate from the following saved four-point matrix.</p></div>;
}

export function OrderedDependency() {
  const marker = useId().replaceAll(':', '');
  const model = orderedDerivativeObjects();
  const pairs = [model.ordered.find(pair => pair.i === 0 && pair.j === 1), model.ordered.find(pair => pair.i === 1 && pair.j === 0)];
  return <>
    {pairs.map(pair => <div className="manifold-scene" key={pair.i}>
      <svg viewBox="0 0 360 620" role="img" aria-label={`${pair.i ? 'BA' : 'AB'} ordered derivative with respect to A: squared distance derivative minus2, kernel derivative point5, log kernel derivative1, attractive contribution ${number(pair.attractive, 9)}`}>
        <ArrowMarker id={`${marker}${pair.i}`} />
        <text x="180" y="22" textAnchor="middle">Ordered {pair.i ? 'BA' : 'AB'} · differentiate at A</text>
        <line x1="55" x2="305" y1="75" y2="75" stroke="#777" />
        {[[-1.5, 'A', 0], [-.5, 'B', 1]].map(([v, id, color]) => <g key={id}><circle cx={205 + 100 * v} cy="75" r="5" fill={hues[color]} /><text x={205 + 100 * v} y="105" textAnchor="middle">{id} {v}</text></g>)}
        <line x1={pair.i ? 55 : 155} x2={pair.i ? 155 : 55} y1="50" y2="50" stroke={hues[1]} markerEnd={`url(#${marker}${pair.i})`} />
        <text x="180" y="139" textAnchor="middle">Δ_{pair.i ? 'BA' : 'AB'} = {pair.delta}; Δ² = {pair.squared}</text>
        {[
          { y: 205, value: pair.squaredDerivative, label: 'd(Δ²)/dA', detail: pair.i ? '2Δ_BA × (−1)' : '2Δ_AB × 1' },
          { y: 320, value: pair.kernelDerivative, label: 'dt/dA', detail: `−t² × d(Δ²)/dA; t=${pair.t}` },
          { y: 435, value: pair.kernelDerivative / pair.t, label: 'd(log t)/dA', detail: '(dt/dA) ÷ t' },
          { y: 550, value: pair.attractive, label: '−P × d(log t)/dA', detail: `P_${pair.i ? 'BA' : 'AB'} fixed = ${number(pair.p, 9)}` },
        ].map((stage, i) => <g key={stage.y}>
          {i > 0 && <path d={`M320 ${stage.y - 98} V${stage.y - 22}`} stroke={hues[1]} fill="none" markerEnd={`url(#${marker}${pair.i})`} />}
          <text x="20" y={stage.y - 32}>{stage.label} = {number(stage.value, 9)}</text>
          <line x1="40" x2="320" y1={stage.y} y2={stage.y} stroke="#777" />
          <line x1="180" x2={180 + 20 * stage.value} y1={stage.y} y2={stage.y} stroke={hues[1]} strokeWidth="3" markerEnd={`url(#${marker}${pair.i})`} />
          <text x="180" y={stage.y + 24} textAnchor="middle">0</text>
          <text x="20" y={stage.y + 49}>{stage.detail}</text>
        </g>)}
      </svg>
      <p>The top arrow shows the actual first-minus-second displacement Δ, not a conditioning arrow. Derivative arrows use multiplier20 from zero to the signed value. Both orientations give −{number(-pair.attractive, 9)} to the attractive gradient at A; their negative-gradient signs reverse, matching §5's force convention.</p>
    </div>)}
    <div className="manifold-scene"><svg viewBox="0 0 360 890" role="img" aria-label="All12 ordered kernel bars feed common Z4; the six involving A feed derivative Z and log Z, with six unrelated derivatives zero">
      <ArrowMarker id={`${marker}z`} />
      <text x="180" y="22" textAnchor="middle">All 12 ordered kernels → same Z</text>
      {model.ordered.map((pair, i) => <g key={`${pair.i}-${pair.j}`}>
        <text x="20" y={55 + i * 42}>{['A', 'B', 'C', 'D'][pair.i]}{['A', 'B', 'C', 'D'][pair.j]}</text>
        <rect x="60" y={42 + i * 42} width={120 * pair.t} height="14" fill={hues[pair.i === 0 ? pair.j : pair.j === 0 ? pair.i : 6]} />
        <text x="130" y={55 + i * 42}>{number(pair.t, 3)}</text>
        <path d={`M185 ${49 + i * 42} H${225 + i * 7} V575 H180`} stroke="#777" fill="none" />
      </g>)}
      <circle cx="180" cy="575" r="6" fill={hues[0]} />
      <text x="180" y="608" textAnchor="middle">Z = Σ ordered kernels = {number(model.state.z)}</text>
      <path d="M310 620 V675" stroke={hues[0]} fill="none" markerEnd={`url(#${marker}z)`} />
      <text x="180" y="650" textAnchor="middle">Differentiate every input</text>
      <text x="180" y="672" textAnchor="middle">with respect to A</text>
      <text x="180" y="705" textAnchor="middle">dZ/dA = {number(model.zDerivative, 9)}</text>
      <path d="M180 715 V765" stroke={hues[0]} fill="none" markerEnd={`url(#${marker}z)`} />
      <text x="210" y="745">÷ Z = 4</text>
      <text x="180" y="795" textAnchor="middle">d(log Z)/dA = {number(model.repulsive, 9)}</text>
      <text x="180" y="830" textAnchor="middle">Attraction + repulsion = {number(model.attractive + model.repulsive, 9)}</text>
      <text x="180" y="865" textAnchor="middle">Negative gradient = {number(model.state.displacement[0], 9)}</text>
    </svg><p>Kernel-bar lengths use a common 0–1 scale. Every bar feeds the common total, including pairs unrelated to A. Only the six A-endpoint terms have nonzero derivatives.</p></div>
    <Table caption="Complete ordered chain rule with fixed P, differentiating endpoint A" headers={['pair', 'Δ', 'dΔ²/dA', 't', 'dt/dA', '−P dlogt/dA']} rows={model.ordered.map(pair => [`${['A', 'B', 'C', 'D'][pair.i]}${['A', 'B', 'C', 'D'][pair.j]}`, ...[pair.delta, pair.squaredDerivative, pair.t, pair.kernelDerivative, pair.attractive].map(v => number(v, 9))])} />
  </>;
}

export function SupervisedTrainingBranch() {
  const marker = useId().replaceAll(':', '');
  return <div className="manifold-scene"><svg viewBox="0 0 360 420" role="img" aria-label="Symbolic training labels y_A and y_B enter the target graph, which combines with the input training graph to alter its same A B edge before fitting the map">
    <ArrowMarker id={marker} />
    <text x="180" y="22" textAnchor="middle">Supervised branch · training rows only</text>
    {[[75, 'A', 'y_A', 0], [285, 'B', 'y_B', 1]].map(([x, id, label, color]) => <g key={id}>
      <circle cx={x} cy="65" r="7" fill={hues[color]} /><text x={x} y="48" textAnchor="middle">{id}: {label}</text>
      <path d={`M${x} 73 V140`} stroke={hues[color]} fill="none" markerEnd={`url(#${marker})`} />
      <circle cx={x} cy="150" r="6" fill={hues[color]} /><text x={x} y="179" textAnchor="middle">{id}</text>
    </g>)}
    <line x1="82" x2="278" y1="150" y2="150" stroke={hues[2]} strokeWidth="3" />
    <text x="180" y="127" textAnchor="middle">Target graph: label relationship</text>
    <path d="M180 150 V240 M85 250 H170" stroke={hues[2]} fill="none" markerEnd={`url(#${marker})`} />
    <text x="20" y="215">Input graph</text>
    <circle cx="20" cy="250" r="5" fill={hues[0]} /><circle cx="80" cy="250" r="5" fill={hues[1]} /><line x1="25" x2="75" y1="250" y2="250" stroke="#aaa" />
    <circle cx="180" cy="250" r="8" stroke={hues[2]} fill="none" /><text x="200" y="255">combine graphs</text>
    <path d="M180 260 V335" stroke={hues[2]} fill="none" markerEnd={`url(#${marker})`} />
    <circle cx="75" cy="340" r="6" fill={hues[0]} /><circle cx="285" cy="340" r="6" fill={hues[1]} /><line x1="82" x2="278" y1="340" y2="340" stroke={hues[2]} strokeWidth="3" />
    <text x="75" y="368" textAnchor="middle">A</text><text x="285" y="368" textAnchor="middle">B</text>
    <text x="180" y="402" textAnchor="middle">Altered training graph → fit reference map</text>
  </svg><p>Symbolic dependency branch: labels enter target-graph construction and change the training graph before map fitting. No target metric, combination weight, numeric supervised edge or fitted coordinates were retained here; widths do not encode invented strengths. Held-out labels do not enter this branch.</p></div>;
}

export function ReferenceApiBranch() {
  const marker = useId().replaceAll(':', '');
  return <div className="manifold-scene"><svg viewBox="0 0 360 420" role="img" aria-label="Optional source-only openTSNE fit returns a fixed reference embedding; a separate new query uses transform against those reference points, with no new-query interaction">
    <ArrowMarker id={marker} />
    <text x="180" y="22" textAnchor="middle">Optional openTSNE · source-only API</text>
    {['T₁', 'T₂', 'T₃'].map((id, i) => <g key={id}>
      <rect x={35 + i * 105} y="45" width="80" height="32" fill="none" stroke={hues[i + 1]} />
      <text x={75 + i * 105} y="66" textAnchor="middle">{id}: x row</text>
    </g>)}
    <path d="M180 80 V130" stroke={hues[0]} fill="none" markerEnd={`url(#${marker})`} />
    <text x="200" y="110">fit</text>
    {[[75, 150], [285, 150], [240, 205]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="6" fill={hues[i + 1]} /><text x={x} y={y - 14} textAnchor="middle">T{i + 1}</text></g>)}
    <text x="20" y="235">Returned reference embedding stays fixed</text>
    <circle cx="95" cy="295" r="7" fill={hues[0]} /><text x="95" y="326" textAnchor="middle">new query</text>
    {[[75, 150], [285, 150], [240, 205]].map(([x, y], i) => <path key={i} d={`M95 288 L${x} ${y + 8}`} stroke={hues[i + 1]} fill="none" strokeDasharray="4 3" markerEnd={`url(#${marker})`} />)}
    <path d="M105 295 H255 V350" stroke={hues[0]} fill="none" markerEnd={`url(#${marker})`} />
    <text x="180" y="282" textAnchor="middle">reference.transform</text>
    <circle cx="255" cy="365" r="7" fill={hues[0]} /><text x="180" y="403" textAnchor="middle">Placed query; reference IDs unchanged</text>
  </svg><p>Positions and links show API dependency only, with schematic coordinates. The optional fit returns an embedding object; its transform places each new query against fixed reference points, independently of other new queries. No optional fit or transform output is claimed here.</p></div>;
}

export function GridConvolution() {
  const grid = gridConvolutionObjects(), multiplier = 160;
  return <>
    <Plot points={grid.source.map(([x, y], i) => ({ x, y, id: `S${i}: ${number(grid.weights[i], 2)}`, color: hues[i + 1] })).concat([{ x: grid.charge[0], y: grid.charge[1], id: 'charge1', color: hues[0] }])} edges={[[4, 0], [4, 1], [4, 2], [4, 3]]} caption="Constructed charge(4.2,4.6) → four grid charges, bilinear weights sum1" />
    <Plot points={grid.source.map(([x, y], i) => ({ x, y, id: `S${i}`, color: hues[i + 1] })).concat([{ x: 1, y: 1, id: 'T0', color: hues[5] }])} arrows={grid.kernels[0].map((v, j) => [1, 1, 1 + multiplier * grid.weights[j] * v[0], 1 + multiplier * grid.weights[j] * v[1], hues[j + 1]])} caption="Translated source-kernel contributions at T0; arrow multiplier160" />
    <Matrix values={grid.kernels.map(row => row.map(v => v[0]))} labels={['T0', 'T1', 'T2', 'T3']} columnLabels={['S0', 'S1', 'S2', 'S3']} caption="Convolution kernel x components F_x(T−S); multiply each column by its source charge" digits={9} />
    <Matrix values={grid.kernels.map(row => row.map(v => v[1]))} labels={['T0', 'T1', 'T2', 'T3']} columnLabels={['S0', 'S1', 'S2', 'S3']} caption="Convolution kernel y components F_y(T−S); sum each weighted row" digits={9} />
    <Plot points={grid.nodes.map(([x, y], i) => ({ x, y, id: `T${i}`, color: hues[i + 5] })).concat([{ x: grid.query[0], y: grid.query[1], id: 'query', color: hues[0] }])} edges={[[4, 0], [4, 1], [4, 2], [4, 3]]} arrows={grid.fields.map((v, i) => [grid.nodes[i][0], grid.nodes[i][1], grid.nodes[i][0] + multiplier * v[0], grid.nodes[i][1] + multiplier * v[1], hues[i + 5]])} caption="Convolved vector field at four query-cell nodes; multiplier160" />
    <Plot points={[{ x: grid.query[0], y: grid.query[1], id: 'query', color: hues[0] }]} arrows={grid.fields.map((v, i) => [grid.query[0], grid.query[1], grid.query[0] + multiplier * grid.interpolation[i] * v[0], grid.query[1] + multiplier * grid.interpolation[i] * v[1], hues[i + 5]]).concat([[grid.query[0], grid.query[1], grid.query[0] + multiplier * grid.returned[0], grid.query[1] + multiplier * grid.returned[1], hues[0]]])} caption="Interpolate field back: four weighted arrows and amber resultant; multiplier160" />
    <Table caption="Complete finite grid convolution and return interpolation" headers={['node', 'field x,y', 'return weight', 'weighted field x,y']} rows={grid.fields.map((v, i) => [`T${i}(${grid.nodes[i].join(',')})`, v.map(a => number(a, 9)).join(', '), number(grid.interpolation[i]), v.map(a => number(a * grid.interpolation[i], 9)).join(', ')]).concat([['query(1.2,1.3)', 'sum of four weighted fields', 'sum1', grid.returned.map(a => number(a, 9)).join(', ')]])} />
    <p>Constructed force-related kernel F(r)=r/(1+‖r‖²)². At each grid node T, sum charge(S)F(T−S); all other charges are zero. The same translated kernel defines the finite convolution. Bilinear query weights(.56,.14,.24,.06) return the field to(1.2,1.3). This opens distribution→convolution→interpolation; it is not an FFT execution, a fitted map, a complete normalized t-SNE force, or a measured approximation error.</p>
  </>;
}

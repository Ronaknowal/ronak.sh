import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber as number } from './LessonFlow.jsx';
import { paperFeatures, paperGcnTrace, paperChannelTrace, paperBiasTrace, scalarGraphUpdate } from '../../data/message-passing-flow-models.js';
import { paperHues, channelHues, Drawing, Arrow, Paper, Cells } from './MessagePassingFlowElements.jsx';

function PathPapers({ y = 100, loops = false, degrees }) {
  return <g>
    {[0, 1].map(id => <Arrow key={id} x1={112 + id * 240 + 33} y1={y} x2={112 + (id + 1) * 240 - 33} y2={y} both />)}
    {[0, 1, 2].map(id => <g key={id}>
      <Paper id={id} x={112 + id * 240} y={y} />
      {loops && <g stroke={paperHues[id]} strokeWidth="2" fill="none">
        <path d={`M${132 + id * 240},${y + 20} C${183 + id * 240},${y + 95} ${41 + id * 240},${y + 95} ${92 + id * 240},${y + 20}`} />
        <polyline points={`${92 + id * 240},${y + 20} ${81 + id * 240},${y + 27} ${91 + id * 240},${y + 34}`} />
      </g>}
      {degrees && <text x={112 + id * 240} y={y + (loops ? 114 : 65)} textAnchor="middle">{loops ? 'closed degree' : 'incoming count'} {degrees[id]}</text>}
    </g>)}
  </g>;
}

export function MessagePassingTaskUnits() {
  return <figure data-mp-drawing="D03">
    <Drawing height={330} label="One score row per paper: a shared prediction head maps each two-feature row to two class scores">
      <PathPapers y={90} />
      <text x="352" y="140" textAnchor="middle">Node task · one score row per node</text>
      <Cells values={paperFeatures} x={115} y={179} labels={['paper 0', 'paper 1', 'paper 2']} identities={[0, 1, 2]} />
      <Arrow x1={250} y1={246} x2={307} y2={246} />
      <rect x="314" y="211" width="144" height="70" rx="5" fill="none" stroke="#ddd" />
      <text x="386" y="239" textAnchor="middle">Shared node</text><text x="386" y="264" textAnchor="middle">prediction head</text>
      <Arrow x1={464} y1={246} x2={484} y2={246} />
      <text x="502" y="164" textAnchor="middle">Paper</text><text x="559" y="164" textAnchor="middle">Class 1</text><text x="640" y="164" textAnchor="middle">Class 2</text>
      {[0, 1, 2].map(id => <g key={id}>
        <text x="502" y={205 + id * 48} textAnchor="middle" fill={paperHues[id]}>{id}</text>
        {[0,1].map(channel=><g key={channel}>
          <rect x={520+channel*81} y={178+id*48} width="77" height="40" fill="none" stroke={paperHues[id]} />
          <text x={558+channel*81} y={205+id*48} textAnchor="middle" fill={paperHues[id]}>score</text>
        </g>)}
      </g>)}
    </Drawing>
    <Drawing height={330} label="One candidate pair uses paper 0 and paper 2 representations without adding a message edge">
      <PathPapers y={90} />
      <text x="352" y="153" textAnchor="middle">Pair task · one result per candidate pair</text>
      <Cells values={[paperFeatures[0], paperFeatures[2]]} x={115} y={180} labels={['paper 0', 'paper 2']} identities={[0, 2]} />
      <Arrow x1={250} y1={225} x2={309} y2={225} dashed />
      <rect x="314" y="190" width="144" height="70" rx="5" fill="none" stroke="#ddd" />
      <text x="386" y="218" textAnchor="middle">Pair head</text><text x="386" y="243" textAnchor="middle">candidate 0 → 2</text>
      <Arrow x1={464} y1={225} x2={522} y2={225} />
      <circle cx="586" cy="225" r="48" fill="none" stroke="#c1a4f5" />
      <text x="586" y="231" textAnchor="middle" fill="#c1a4f5">1 pair result</text>
      <text x="352" y="315" textAnchor="middle">Dashed route selects endpoints; it does not permit a new graph message.</text>
    </Drawing>
    <Drawing height={330} label="Sum all paper rows to the graph vector 7,0, then predict one value for the whole graph">
      <PathPapers y={90} />
      <text x="352" y="153" textAnchor="middle">Graph task · one result per whole graph</text>
      <Cells values={paperFeatures} x={115} y={180} labels={['paper 0', 'paper 1', 'paper 2']} identities={[0, 1, 2]} />
      <Arrow x1={250} y1={246} x2={290} y2={246} />
      <circle cx="321" cy="246" r="26" fill="none" stroke="#ddd" /><text x="321" y="252" textAnchor="middle">sum</text>
      <Arrow x1={352} y1={246} x2={377} y2={246} />
      <Cells values={[[7, 0]]} x={383} y={226} />
      <text x="445" y="203" textAnchor="middle">graph row</text>
      <Arrow x1={514} y1={246} x2={543} y2={246} />
      <rect x="550" y="209" width="138" height="75" rx="5" fill="none" stroke="#ddd" />
      <text x="619" y="237" textAnchor="middle">Graph head</text><text x="619" y="263" textAnchor="middle">1 graph result</text>
    </Drawing>
    <figcaption>The input graph is unchanged in all three routes. Output labels show their shapes;
      no fitted head or numerical prediction is implied. The graph row [7, 0] is the actual sum of the supplied rows.</figcaption>
  </figure>;
}

export function MessagePassingSelfReads() {
  return <figure data-mp-drawing="D08">
    <Drawing height={255} label="Without self reads the path's incoming counts are 1,2,1">
      <text x="352" y="28" textAnchor="middle">Before adding self reads</text>
      <PathPapers y={110} degrees={[1, 2, 1]} />
      <text x="352" y="238" textAnchor="middle">Only the two relationships supply the incoming messages.</text>
    </Drawing>
    <Drawing height={500} label="One added self-loop per paper gives closed degrees 2,3,2 and diagonal degree matrix">
      <text x="352" y="28" textAnchor="middle">After adding one self read per paper</text>
      <PathPapers y={110} degrees={[2, 3, 2]} loops />
      <text x="352" y="276" textAnchor="middle">Each curved arrow adds one incoming permission at its own paper.</text>
      <text x="197" y="315" textAnchor="middle">Closed adjacency B</text>
      <Cells values={[[1, 1, 0], [1, 1, 1], [0, 1, 1]]} x={103} y={337} labels={['0', '1', '2']} identities={[0, 1, 2]} />
      <text x="513" y="315" textAnchor="middle">Degree matrix D</text>
      <Cells values={[[2, 0, 0], [0, 3, 0], [0, 0, 2]]} x={419} y={337} labels={['0', '1', '2']} identities={[0, 1, 2]} />
      <text x="352" y="492" textAnchor="middle">Both grids use receiver rows and source columns 0, 1, 2.</text>
    </Drawing>
    <figcaption>The curves are self messages. The degree is a count of permitted reads,
      not the value of a feature. A graph with no relationships still has degree 1 at each paper after these loops are added.</figcaption>
  </figure>;
}

export function MessagePassingNormalizedSumLab() {
  const [last, setLast] = useState(4);
  const [receiver, setReceiver] = useState(1);
  const state = paperGcnTrace(last, receiver);
  return <FlowLab id="graph-normalized-contributions" label="Trace a degree-normalized contribution from each source">
    <figure data-mp-drawing="D09">
      <div className="mp-flow-comparison">{[0, 1, 2].map(source => <Drawing key={source} width={336} height={295}
        label={`Source paper ${source}, degree ${state.degrees[source]}, contributes ${number(state.products[source])} into receiver ${receiver}`}>
        <Paper id={source} x={64} y={90} value={state.features[source]} selected={source === receiver} />
        <text x="236" y="47" textAnchor="middle">factor into paper {receiver}</text>
        <Cells values={[[state.operator[receiver][source]]]} x={188} y={66} cellWidth={100} digits={6} />
        <text x="64" y="25" textAnchor="middle">source degree {state.degrees[source]}</text>
        <text x="236" y="25" textAnchor="middle">receiver degree {state.degrees[receiver]}</text>
        <Arrow x1={64} y1={159} x2={140} y2={224} hue={paperHues[source]} />
        <Arrow x1={236} y1={112} x2={196} y2={224} />
        <circle cx="168" cy="240" r="23" fill="none" stroke="#ddd" /><text x="168" y="246" textAnchor="middle">×</text>
        <text x="168" y="289" textAnchor="middle" fill={paperHues[source]}>product = {number(state.products[source])}</text>
      </Drawing>)}</div>
      <Drawing width={336} height={268} label={`Add all three source products at paper ${receiver}`}>
        {[0, 1, 2].map(source => <g key={source}>
          <text x="102" y={35+source*49} textAnchor="middle" fill={paperHues[source]}>source {source}: {number(state.products[source],4)}</text>
          <Arrow x1={208} y1={29+source*49} x2={280} y2={29+source*49} hue={paperHues[source]} />
        </g>)}
        <path d="M280,29V215" fill="none" stroke="#b9b9b9" strokeWidth="2" />
        <Arrow x1={280} y1={215} x2={200} y2={215} />
        <circle cx="168" cy="215" r="27" fill="none" stroke="#ddd" /><text x="168" y="221" textAnchor="middle">sum</text>
        <text x="168" y="264" textAnchor="middle" fill={paperHues[receiver]}>paper {receiver}: {number(state.aggregate)}</text>
      </Drawing>
      <div className="mp-flow-comparison">
        <ScalarRows label="All receiver outputs" values={state.outputs} digits={4} />
        <ScalarRows label="Coefficient row sums" values={state.rowSums} digits={6} />
      </div>
      <figcaption>The white outline marks the traced receiver. Source hues follow the three papers.
        Each factor uses both the source degree and receiver degree. A factor of zero denies that contribution;
        the printed product is then zero. The default factors into paper 1 are 1/√6, 1/3, 1/√6.
        Cell fill shows sign rather than magnitude; coefficient row sums are not probabilities.</figcaption>
    </figure>
    <FlowControls><FlowSlider name="Paper 2 · feature 1" value={last} onChange={setLast} min={-4} max={6} />
      <FlowChoice label="Trace receiver" options={[[0, 'Paper 0'], [1, 'Paper 1'], [2, 'Paper 2']]} value={receiver} onChange={setReceiver} />
      <button type="button" onClick={() => { setLast(4); setReceiver(1); }}>Reset</button></FlowControls>
    <FlowReadout>Paper {receiver} receives products {state.products.map(value => number(value)).join(', ')};
      their sum is {number(state.aggregate)}. Its coefficients sum to {number(state.rowSums[receiver])},
      so they are normalization factors, not probabilities. Editing a feature leaves the degrees unchanged.</FlowReadout>
  </FlowLab>;
}

function ScalarRows({ label, values, digits = 4 }) {
  return <Drawing width={336} height={230} label={label}>
    <text x="168" y="28" textAnchor="middle">{label}</text>
    <Cells values={values.map(value=>[value])} x={172} y={57} cellWidth={108} digits={digits}
      labels={['paper 0','paper 1','paper 2']} identities={[0,1,2]} />
  </Drawing>;
}

function ChannelRows({ label, values }) {
  return <Drawing width={336} height={236} label={label}>
    <text x="168" y="26" textAnchor="middle">{label}</text>
    {[0,1].map(channel=><text key={channel} x={156+channel*100} y="60" textAnchor="middle" fill={channelHues[channel]}>channel {channel+1}</text>)}
    <Cells values={values} x={108} y={76} cellWidth={100} digits={4}
      labels={['paper 0','paper 1','paper 2']} identities={[0,1,2]} />
  </Drawing>;
}

function WeightGrid({ weights, transpose = false }) {
  const rows = transpose ? [[weights[0][0],weights[1][0]],[weights[0][1],weights[1][1]]] : weights;
  return <Drawing width={336} height={219} label={transpose ? 'Old weight storage: input rows and output columns' : 'Shared weights: output rows and input columns'}>
    <text x="168" y="27" textAnchor="middle" fill="#e4b752">{transpose ? 'W_old · input × output' : 'W · output × input'}</text>
    {[0,1].map(channel=><text key={channel} x={171+channel*88} y="73" textAnchor="middle" fill={channelHues[channel]}>{transpose?'output':'input'} {channel+1}</text>)}
    <Cells values={rows} x={129} y={95} cellWidth={88} labels={transpose?['in 1','in 2']:['out 1','out 2']}
      labelHues={channelHues} highlight={transpose?[1,0]:[0,1]} />
  </Drawing>;
}

function VerticalStep({ label }) {
  return <Drawing width={336} height={83} label={label}>
    <text x="168" y="25" textAnchor="middle">{label}</text>
    <Arrow x1={168} y1={39} x2={168} y2={76} />
  </Drawing>;
}

export function MessagePassingChannelLab() {
  const [entry, setEntry] = useState(.5);
  const state = paperChannelTrace(entry);
  return <FlowLab id="graph-shared-channel-map" label="Separate shared channel projection from neighborhood mixing">
    <figure data-mp-drawing="D10">
      <div className="mp-flow-sequence">
        <ChannelRows label="Input H · two channels per paper" values={paperFeatures} />
        <VerticalStep label="Apply the same W at every paper" />
        <WeightGrid weights={state.weights} />
        <p>At paper 1 the input row is (2, 1). Output channel 1 is {' '}1 × 2 + {number(entry)} × 1 = {number(state.projected[1][0])};
          output channel 2 is −1 × 2 + 2 × 1 = 0. The white outline selects the
          same W[0, 1] entry for every paper.</p>
        <ChannelRows label="After the shared channel map" values={state.projected} />
      </div>
      <div className="mp-flow-comparison">
        <div><p>Route A starts with those projected rows, then mixes neighbors.</p>
          <ChannelRows label="A · projected rows" values={state.projected} />
          <VerticalStep label="Mix paper rows using S" />
          <ChannelRows label="A · after graph mixing" values={state.mixed} />
        </div>
        <div><p>Route B starts with H, mixes neighbors first, then projects channels.</p>
          <ChannelRows label="B · graph mixing of H" values={state.mixedFirst} />
          <VerticalStep label="Apply the same W" />
          <ChannelRows label="B · after channel projection" values={state.otherOrder} />
        </div>
      </div>
      <p>The resulting tables agree before any activation or bias. ReLU acts on
        that common result afterward: it keeps positive values and replaces negative values by zero.</p>
      <div className="mp-flow-sequence">
        <VerticalStep label="Then apply ReLU" />
        <ChannelRows label="After ReLU · same paper rows" values={state.activated} />
      </div>
      <p>The earlier implementation stores the same weight map with input rows
        and output columns. Transpose swaps those storage axes, without changing the layer.</p>
      <div className="mp-flow-comparison">
        <WeightGrid weights={state.weights} /><WeightGrid weights={state.weights} transpose />
      </div>
      <figcaption>Paper row labels retain paper identity. Channel 1 is cyan and channel 2 pink;
        W is a learned parameter, labelled amber. The white cell follows the same selected weight
        through transposition. Cell fill shows sign, not magnitude. Both routes use unchanged S;
        no activation has been moved between their products.</figcaption>
    </figure>
    <FlowControls><FlowSlider name="Shared W[0, 1]" value={entry} onChange={setEntry} min={-2} max={2} />
      <button type="button" onClick={() => setEntry(.5)}>Reset</button></FlowControls>
    <FlowReadout>Changing W[0, 1] changes projected channel 1 at papers with a nonzero second feature.
      Paper 1’s projected channel 1 is {number(state.projected[1][0])}; its mixed value is {number(state.mixed[1][0])}.
      The second mixed channel is {number(state.mixed[1][1])}, which ReLU changes to {number(state.activated[1][1])}.</FlowReadout>
  </FlowLab>;
}

export function MessagePassingBiasLab() {
  const [bias, setBias] = useState(1);
  const state = paperBiasTrace(bias);
  return <FlowLab id="graph-bias-order" label="Compare adding bias before and after graph mixing">
    <figure data-mp-drawing="D11">{[true, false].map(before => <Drawing key={String(before)} height={285}
      label={before ? 'Add bias first, then mix: each receiver gets its coefficient row sum times the bias' : 'Mix first, then add one shared bias at each receiver'}>
      <text x="352" y="28" textAnchor="middle">{before ? 'Circuit A: add bias → graph mixing' : 'Circuit B: graph mixing → add bias'}</text>
      <text x="128" y="76" textAnchor="middle">Input x</text>
      <Cells values={state.features.map(value => [value])} x={86} y={90} cellWidth={90} labels={['0', '1', '2']} identities={[0, 1, 2]} />
      <Arrow x1={182} y1={161} x2={219} y2={161} />
      <circle cx="250" cy="161" r="26" fill="none" stroke="#ddd" /><text x="250" y="167" textAnchor="middle">{before ? '+' : 'S'}</text>
      <text x="250" y="115" textAnchor="middle">{before ? 'add b' : 'mix graph'}</text>
      <Arrow x1={282} y1={161} x2={305} y2={161} />
      <Cells values={(before ? state.beforeInput : state.outputs).map(value => [value])} x={316} y={90} cellWidth={100} digits={4} />
      <text x="364" y="76" textAnchor="middle">{before ? 'x + bias' : 'Sx'}</text>
      <Arrow x1={419} y1={161} x2={443} y2={161} />
      <circle cx="475" cy="161" r="26" fill="none" stroke="#ddd" /><text x="475" y="167" textAnchor="middle">{before ? 'S' : '+'}</text>
      <text x="475" y="115" textAnchor="middle">{before ? 'mix graph' : 'add b'}</text>
      <Arrow x1={507} y1={161} x2={580} y2={161} />
      <Cells values={(before ? state.before : state.after).map(value => [value])} x={592} y={90} cellWidth={100} digits={4} />
      <text x="640" y="76" textAnchor="middle">New values</text>
      <text x={before ? 250 : 475} y="253" textAnchor="middle" fill="#e4b752">bias b = {number(bias)}</text>
      <Arrow x1={before ? 250 : 475} y1={238} x2={before ? 250 : 475} y2={193} hue="#e4b752" />
      <text x="352" y="279" textAnchor="middle">All three tables align by paper rows 0, 1, 2.</text>
    </Drawing>)}</figure>
    <FlowControls><FlowSlider name="Shared scalar bias b" value={bias} onChange={setBias} min={-2} max={2} />
      <button type="button" onClick={() => setBias(1)}>Reset</button></FlowControls>
    <FlowReadout>At paper 0, adding bias before mixing gives {number(state.before[0])},
      while adding it afterward gives {number(state.after[0])}. Their difference is {number(state.differences[0])}
      = (row sum {number(state.rowSums[0])} − 1) × {number(bias)}.</FlowReadout>
  </FlowLab>;
}

export function MessagePassingScalarUpdateLab() {
  const [weight, setWeight] = useState(.5);
  const [rate, setRate] = useState(.1);
  const state = scalarGraphUpdate(weight, rate);
  return <FlowLab id="graph-scalar-update" label="Follow one supervised error back to a shared graph weight">
    <figure data-mp-drawing="D12">
      <Drawing width={336} height={470} label="Forward: receiver aggregate times shared weight gives the prediction and error. Dashed backward route returns to the same weight.">
        <text x="168" y="28" textAnchor="middle">Receiver 0 aggregate a</text>
        <circle cx="168" cy="80" r="39" fill="none" stroke="#c1a4f5" /><text x="168" y="86" textAnchor="middle" fill="#c1a4f5">{number(state.aggregate,4)}</text>
        <Arrow x1={168} y1={124} x2={168} y2={141} />
        <circle cx="168" cy="170" r="24" fill="none" stroke="#ddd" /><text x="168" y="176" textAnchor="middle">×</text>
        <text x="48" y="127" textAnchor="middle" fill="#e4b752">shared w</text>
        <circle cx="48" cy="170" r="26" fill="none" stroke="#e4b752" /><text x="48" y="176" textAnchor="middle" fill="#e4b752">{number(weight)}</text>
        <Arrow x1={79} y1={170} x2={139} y2={170} hue="#e4b752" />
        <Arrow x1={168} y1={199} x2={168} y2={221} />
        <circle cx="168" cy="265" r="39" fill="none" stroke="#c1a4f5" /><text x="168" y="271" textAnchor="middle" fill="#c1a4f5">{number(state.prediction,4)}</text>
        <text x="168" y="330" textAnchor="middle">Prediction a × w</text>
        <Arrow x1={168} y1={337} x2={168} y2={355} />
        <rect x="104" y="361" width="128" height="62" rx="5" fill="none" stroke="#ddd" />
        <text x="168" y="386" textAnchor="middle">half squared</text><text x="168" y="410" textAnchor="middle">error</text>
        <text x="278" y="338" textAnchor="middle" fill="#82d3ed">target 1</text>
        <Arrow x1={278} y1={346} x2={238} y2={379} hue="#82d3ed" />
        <text x="168" y="463" textAnchor="middle" fill="#c1a4f5">loss {number(state.loss)}</text>
        <path d="M238,402H318V214H48" fill="none" stroke="#ef9b65" strokeWidth="2" strokeDasharray="6 5" />
        <Arrow x1={48} y1={214} x2={48} y2={200} hue="#ef9b65" dashed />
        <text x="302" y="247" textAnchor="end" fill="#ef9b65">backward</text>
      </Drawing>
      <p>The dashed backward route returns to the same shared weight. Its derivative is
        residual × local effect of w on prediction:
        {' '}{number(state.residual)} × {number(state.aggregate)} = {number(state.derivative)}.</p>
      <p>The proposed step subtracts rate × derivative from that weight:
        {' '}{number(weight)} − {number(rate)} × ({number(state.derivative)}) = {number(state.nextWeight)}.</p>
      <table className="mp-flow-values"><thead><tr><th scope="col">Quantity</th><th scope="col">Current</th><th scope="col">Proposed</th></tr></thead>
        <tbody><tr><th scope="row">Shared w</th><td>{number(weight)}</td><td>{number(state.nextWeight)}</td></tr>
          <tr><th scope="row">Prediction</th><td>{number(state.prediction)}</td><td>{number(state.nextPrediction)}</td></tr>
          <tr><th scope="row">Loss</th><td>{number(state.loss)}</td><td>{number(state.nextLoss)}</td></tr></tbody>
      </table>
      <figcaption>The target enters only the error; graph edges and degrees stay fixed.
        Amber identifies the learned weight, violet the computed values, cyan the supplied target,
        and dashed orange the backward derivative route.</figcaption>
    </figure>
    <FlowControls><FlowSlider name="Shared scalar weight w" value={weight} onChange={setWeight} min={-1} max={1} step={.05} />
      <FlowSlider name="Step size η" value={rate} onChange={setRate} min={0} max={.2} step={.01} />
      <button type="button" onClick={() => { setWeight(.5); setRate(.1); }}>Reset</button></FlowControls>
    <FlowReadout>The derivative is {number(state.derivative)}. A rate of {number(rate)} proposes weight {number(state.nextWeight)} and prediction {number(state.nextPrediction)}; loss changes from {number(state.loss)} to {number(state.nextLoss)}.
      Rate zero leaves the weight unchanged.</FlowReadout>
  </FlowLab>;
}

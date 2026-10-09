import { useState } from 'react';
import { FlowLab, FlowControls, FlowReadout } from './LessonFlow.jsx';
import { AggregationQuantity } from './MessagePassingAggregationState.jsx';
import { useApplications } from './MessagePassingFlowApplicationsState.jsx';
import { Drawing, Arrow, Text, Op, Rows, Grid, Reduction, Graph, Select, num, paperHues, channelHues, hues } from './MessagePassingFlowExpressivenessElements.jsx';
import { cyclicOccurrences, sampledSageTrace, pairSamplingTrace, independentBatchTrace, typedMessageTrace, typedLibraryTrace, programTrace, trafficTrace } from '../../data/message-applications-flow-models.js';
import './message-applications-flow.css';
const vec = v => `[${v.map(x => num(x, 12)).join(', ')}]`;
function OccurrenceBranch({
  levels,
  supplies,
  title,
  context = false
}) {
  const width = Math.max(384, ...levels.map(l => l.length * 112)),
    height = 110 + levels.length * 125,
    positions = new Map();
  levels.forEach((level, r) => level.forEach((n, i) => positions.set(n.path, [(i + .5) * width / Math.max(1, level.length), 78 + r * 125])));
  return <Drawing width={width} height={height} label={title}>
    <Text x={width / 2} y={24}>
      {supplies ? 'Upward · supplies messages' : 'Downward · needs donor states'}
    </Text>
    {levels.flatMap(level => level.filter(n => n.parent !== null && positions.has(n.parent)).map(n => {
      const [px, py] = positions.get(n.parent),
        [cx, cy] = positions.get(n.path);
      return supplies ? <Arrow key={n.path} x1={cx} y1={cy - 24} x2={px} y2={py + 24} hue={paperHues[n.id]} /> : <Arrow key={n.path} x1={px} y1={py + 24} x2={cx} y2={cy - 24} dashed />;
    }))}
    {levels.flatMap(level => level.map(n => {
      const [x, y] = positions.get(n.path),
        hasChildren = levels.some(row => row.some(child => child.parent === n.path));
      return <g key={n.path}>
      <circle cx={x} cy={y} r={23} fill="#111" stroke={paperHues[n.id]} />
      <Text x={x} y={y + 6} hue={paperHues[n.id]}>ID {n.id}</Text>
      <Text x={hasChildren ? x + 32 : x} y={hasChildren ? y + 5 : y + 50} anchor={hasChildren ? 'start' : 'middle'}>
        {n.path}
        {context && n.parent === null ? ' · context' : ''}
      </Text>
    </g>;
    }))}
    <Text x={width / 2} y={height - 14}>
      {title}
    </Text>
  </Drawing>;
}
function TreePicture({
  trace,
  supplies = false
}) {
  const expanded = trace.occurrences <= 20;
  if (expanded && trace.levels.length >= 2 && Math.max(...trace.levels.map(l => l.length)) > 3) {
    const root = trace.levels[0];
    return <div className="mp-express-grid">
    {trace.levels[1].map(branch => {
        const levels = [root, [branch], ...trace.levels.slice(2).map(level => level.filter(n => n.path.startsWith(branch.path + '.')))];
        return <OccurrenceBranch key={branch.path} levels={levels} supplies={supplies} context title={'Complete branch ' + branch.path + ' · shared root'} />;
      })}
  </div>;
  }
  const levels = expanded ? trace.levels : trace.levels.map(level => level.slice(0, 1));
  return <OccurrenceBranch levels={levels} supplies={supplies} title={expanded ? 'Every occurrence drawn' : 'First occurrence path · exact counts below'} />;
}
function CyclicFigure({
  job
}) {
  const s = useApplications(),
    t = cyclicOccurrences(s.fanouts, s.replacement);
  return <figure data-mp-drawing={job}>
    <TreePicture trace={t} />
    <TreePicture trace={t} supplies />
    <Rows title="Exact occurrence accounting · cyclic complete four-ID graph" headers={['Depth', 'Fanout requested', 'Occurrences at level', 'Distinct IDs at level']} rows={t.levels.map((level, r) => [r, r ? s.fanouts[r - 1] : 'root', level.length, new Set(level.map(n => n.id)).size])} />
    <details>
      <summary>Read every occurrence path, parent and stored node ID</summary>
      <Rows title="Full cyclic occurrence index · no deduplication" headers={['Path', 'Parent path', 'Stored node ID']} rows={t.levels.flat().map(n => [n.path, n.parent ?? 'root', n.id])} />
    </details>
    <figcaption>The root is ID 0. Each stored ID has the other three IDs as incoming neighbors. This teaching selector cycles through that fixed neighbor order; it is not a uniform random sampler. With replacement, repeated IDs appear as distinct path occurrences and contribute separately. Without replacement, each parent's fanout caps at 3. Downward arrows express dependencies; upward arrows carry messages. Small wide trees split into complete labelled branches; the repeated root is context for the same root occurrence, not extra sampled nodes. More than 20 occurrences use one traced path and exact level counts, with the full occurrence index available above, rather than hundreds of unreadable circles.</figcaption>
  </figure>;
}
function CyclicReadout() {
  const s = useApplications(),
    t = cyclicOccurrences(s.fanouts, s.replacement);
  return <FlowReadout data-cyclic-occurrences={t.occurrences} data-cyclic-distinct={t.distinct} data-cyclic-fanouts={s.fanouts.join(',')} data-cyclic-replacement={String(s.replacement)}>Fanouts {vec(s.fanouts)}, {s.replacement ? 'with' : 'without'} replacement: {t.occurrences} path occurrences but {t.distinct} distinct stored IDs. Uncapped tree bound {t.unlimitedBound}; the graph stores four IDs even when the sampled computation repeats them.</FlowReadout>;
}
export function MessagePassingSamplingDepthLab() {
  const s = useApplications();
  return <FlowLab id="applications-occurrence-depth" label="Set cyclic sampling depth">
    <CyclicFigure job="D43a" />
    <FlowControls>
      <AggregationQuantity label="Cyclic sampling depth" value={s.fanouts.length} onChange={s.resize} min={1} max={3} integer revision={s.revision.depth} />
      <button type="button" onClick={s.resetDepth}>Reset depth to 2</button>
    </FlowControls>
    <CyclicReadout />
  </FlowLab>;
}
export function MessagePassingSamplingFanoutLab() {
  const s = useApplications();
  return <FlowLab id="applications-occurrence-fanouts" label="Set each cyclic sampling fanout">
    <CyclicFigure job="D43b" />
    <FlowControls>
      {s.fanouts.map((f, i) => <AggregationQuantity key={i} label={`Cyclic layer ${i + 1} fanout`} value={f} onChange={v => s.editFanout(i, v)} min={0} max={8} integer revision={s.revision.fanouts} />)}
      <button type="button" onClick={s.resetFanouts}>Reset fanouts</button>
    </FlowControls>
    <CyclicReadout />
  </FlowLab>;
}
export function MessagePassingSamplingReplacementLab() {
  const s = useApplications();
  return <FlowLab id="applications-occurrence-replacement" label="Compare cyclic sampling replacement policies">
    <CyclicFigure job="D43c" />
    <FlowControls>
      <Select label="Cyclic replacement policy" value={String(s.replacement)} onChange={v => s.setReplacement(v === 'true')} options={[["true", "With replacement"], ["false", "Without replacement"]]} />
      <button type="button" onClick={s.resetReplacement}>Reset replacement</button>
    </FlowControls>
    <CyclicReadout />
  </FlowLab>;
}
function BlockFigure({
  stage,
  layer
}) {
  const b = stage.block,
    permission = b.targets.map((_, r) => b.sources.map((_, c) => b.edges.filter(([s, t]) => s === c && t === r).length));
  return <div className="mp-express-grid">
    <Grid values={permission} title={`Layer ${layer + 1} · target × source permission counts`} rowLabels={b.targets.map(n => `ID ${n}`)} columnLabels={b.sources.map(n => `ID ${n}`)} rowIdentities={b.targets} columnIdentities={b.sources} />
    <Grid values={stage.input} title={`Layer ${layer + 1} · gathered source rows`} rowLabels={b.sources.map(n => `ID ${n}`)} rowIdentities={b.sources} />
    <Grid values={stage.means} title="Incoming occurrence means" rowLabels={b.targets.map(n => `ID ${n}`)} rowIdentities={b.targets} />
    <Grid values={stage.own} title="Own branch · .5 summed channels" rowLabels={b.targets.map(n => `ID ${n}`)} rowIdentities={b.targets} />
    <Grid values={stage.neighbor} title="Donor branch · .25 summed channels" rowLabels={b.targets.map(n => `ID ${n}`)} rowIdentities={b.targets} />
    <Grid values={stage.pre} title="Branch sum · before activation" rowLabels={b.targets.map(n => `ID ${n}`)} rowIdentities={b.targets} />
    <Grid values={stage.output} title={layer ? 'Final linear seed output' : 'Hidden · ReLU'} rowLabels={b.targets.map(n => `ID ${n}`)} rowIdentities={b.targets} />
    <Rows title={`Layer ${layer + 1} · global IDs → local rows`} headers={['Role', 'Ordered IDs / local edge rows']} rows={[["Sources", b.sources.join(', ')], ["Targets · source prefix", b.targets.join(', ')], ...b.occurrences.map((e, i) => [`Edge occurrence ${i}`, `global ${e.donor}→${e.receiver}; source row ${e.sourceRow}→target row ${e.targetRow}`])]} />
  </div>;
}
export function MessagePassingSeededBlocksLab() {
  const [seed, setSeed] = useState(7),
    [fanouts, setFanouts] = useState([2, 1]),
    [revision, setRevision] = useState(0),
    t = sampledSageTrace(fanouts, seed);
  return <FlowLab id="applications-seeded-layer-blocks" label="Build uniform sampled blocks backward and compute forward">
    <figure data-mp-drawing="D43d">
      <Graph incoming={t.incoming} values={t.features} title="Stored directed graph · incoming permissions" directed />
      <Drawing width={384} height={335} label="Backward sampling reverses fanouts then reverses blocks for forward computation">
        <Text y={25}>Seed row · global ID 1</Text>
        <Op y={59}>Backward build: [{[...fanouts].reverse().join(', ')}]</Op>
        <Arrow x1={192} y1={108} x2={192} y2={137} />
        <Op y={148}>Reverse blocks for execution</Op>
        <Arrow x1={192} y1={195} x2={192} y2={222} />
        <Op y={233}>Forward layers: [{fanouts.join(', ')}]</Op>
        <Text y={316}>Incoming edge occurrences only</Text>
      </Drawing>
      {t.stages.map((stage, i) => <BlockFigure key={i} stage={stage} layer={i} />)}
      <Drawing width={384} height={254} label="Only seed 1 participates in the binary loss">
        <Text y={25}>Seed 1 only · target 1</Text>
        <Op y={59}>logit = {num(t.logit)}</Op>
        <Arrow x1={192} y1={108} x2={192} y2={135} />
        <Op y={146}>BCE = softplus(−logit)</Op>
        <Text y={235} hue={hues.computed}>
          {num(t.loss, 12)}
        </Text>
      </Drawing>
      <figcaption>This separate sampler uniformly selects incoming edge occurrences without replacement using the native integer-seed convention. Requested fanouts may exceed candidate counts; target rows remain first in each source block so the own branch survives zero fanout. Repeated edges are distinct eligible occurrences, even when gathered global IDs share a storage row. In each permission grid, the row and column labels keep their global node's hue; the gathered feature grids instead use channel hues across columns. The mapped scratch and ordinary bipartite SAGE routes use neighbor lin_l and bias, own lin_r, with displayed weights. At seed 7/fanouts [2,1], the stored native example gathers sources [1,2,0,3], then [1,2], and computes logit 4.25. NeighborLoader's union n_id seed prefix and batch_size are a separate representation, not these two sampled realizations. The accepted optional backend failure remains disclosed; this view does not claim a new NeighborLoader execution.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Uniform sampler seed" value={seed} onChange={setSeed} min={0} max={9} integer revision={revision} />
      {fanouts.map((f, i) => <AggregationQuantity key={i} label={`Forward layer ${i + 1} fanout`} value={f} onChange={v => setFanouts(old => old.map((x, j) => j === i ? v : x))} min={0} max={8} integer revision={revision} />)}
      <button type="button" onClick={() => {
        setSeed(7);
        setFanouts([2, 1]);
        setRevision(r => r + 1);
      }}>Reset seeded blocks</button>
    </FlowControls>
    <FlowReadout data-sampled-logit={t.logit} data-sampled-loss={t.loss} data-sampled-source0={t.blocks[0].sources.join(',')}>Seed {seed}, forward fanouts {vec(fanouts)}: seed 1 logit {num(t.logit, 12)}, seed-only BCE {num(t.loss, 12)}. First gathered IDs {vec(t.blocks[0].sources)}; last target is global ID 1.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingSamplingBiasLab() {
  const [last, setLast] = useState(9),
    [revision, setRevision] = useState(0),
    t = pairSamplingTrace(last),
    equal = pairSamplingTrace(4, [4, 4, 4, 4]),
    relu = pairSamplingTrace(3, [-3, -1, 1, 3]);
  return <FlowLab id="applications-nonlinear-sample-bias" label="Enumerate sample means before applying a nonlinearity">
    <figure data-mp-drawing="D44">
      <Rows title="Every equally likely unordered pair · probability 1/6" headers={['Occurrence pair', 'Values', 'Mean', 'Squared mean']} rows={t.pairs.map(p => [p.ids.join(' + '), vec(p.values), p.mean, p.square])} />
      <Drawing width={512} height={385} label="Average then square versus square each sampled mean then average">
        <Text x={256} y={25}>Same six equally likely sample means</Text>
        <Arrow x1={246} y1={42} x2={128} y2={77} />
        <Arrow x1={266} y1={42} x2={384} y2={77} />
        <Op x={28} y={84} width={200}>Average sample means</Op>
        <Op x={284} y={84} width={200}>Square each, then average</Op>
        <Text x={128} y={162}>E[m] = {num(t.expectedMean)}</Text>
        <Text x={384} y={162}>E[m²] = {num(t.expectedSquare)}</Text>
        <Arrow x1={128} y1={180} x2={128} y2={213} />
        <Op x={28} y={225} width={200}>Square E[m]</Op>
        <Text x={128} y={309}>(E[m])² = {num(t.squareFull)}</Text>
        <Text x={384} y={278}>Difference = variance</Text>
        <Text x={384} y={318} hue={hues.computed}>
          {num(t.variance)}
        </Text>
        <Text x={256} y={365}>E[m²] − (E[m])² = {num(t.gap)}</Text>
      </Drawing>
      <Rows title="All-equal and ReLU boundaries · actual pairs" headers={['Case', 'Pair means', 'Nonlinear expectation', 'Nonlinearity of full mean']} rows={[["All equal [4,4,4,4]", equal.pairs.map(p => num(p.mean)).join(', '), equal.expectedSquare, equal.squareFull], ["ReLU [-3,-1,1,3]", relu.pairs.map(p => num(p.mean)).join(', '), relu.pairs.reduce((s, p) => s + p.relu, 0) / 6, Math.max(relu.full, 0)]]} />
      <figcaption>For uniform size 2 samples without replacement, the sample mean is unbiased. After squaring, its expected value exceeds the full-mean square by the displayed nonnegative variance. The six cases are a complete enumeration, not a Monte Carlo estimate. An all-equal population has zero gap. ReLU of a sampled mean also need not equal ReLU of the full mean. Nonuniform selection, different reductions and the training objective need their own expectation analysis.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Last donor in sampling population" value={last} onChange={setLast} min={-1} max={12} revision={revision} />
      <button type="button" onClick={() => {
        setLast(9);
        setRevision(r => r + 1);
      }}>Reset sampling population</button>
    </FlowControls>
    <FlowReadout data-sampling-mean={t.expectedMean} data-sampling-square={t.expectedSquare} data-sampling-gap={t.gap}>Population {vec(t.values)}: full mean {num(t.full, 12)}, expected sample mean {num(t.expectedMean, 12)}. Expected squared sample mean {num(t.expectedSquare, 12)} versus full square {num(t.squareFull, 12)}; gap {num(t.gap, 12)}.</FlowReadout>
  </FlowLab>;
}
function BatchLab({
  retained = false
}) {
  const [first, setFirst] = useState(8),
    [correct, setCorrect] = useState(true),
    [revision, setRevision] = useState(0),
    t = independentBatchTrace(first, correct, retained),
    incoming = t.adjacency.map(row => row.flatMap((v, i) => v ? Array(v).fill(i) : []));
  return <FlowLab id={retained ? 'applications-retained-batch-variant' : 'applications-independent-batch'} label={retained ? 'Preserve the closed-mean two plus two batch variant' : 'Batch unequal independent graphs with the correct offset'}>
    <figure data-mp-drawing={retained ? 'D45-retained' : 'D45'}>
      <Graph incoming={incoming} values={t.features} title={correct ? 'Correct disjoint donor permissions' : 'Wrong offset creates cross-graph permission'} />
      <Grid values={t.adjacency} title="Actual adjacency · receiver rows / donor columns" rowLabels={t.features.map((_, n) => `ID ${n}`)} columnLabels={t.features.map((_, n) => `ID ${n}`)} rowIdentities={t.features.map((_, n) => n)} columnIdentities={t.features.map((_, n) => n)} />
      <Rows title="Batch operands and separately retained graph membership" headers={['Operand', 'Value']} rows={[["Features", vec(t.features)], ["Graph membership", vec(t.membership)], ["Graph pointer boundaries", vec(t.ptr)], ["Offset added to BOTH endpoints", t.offset], ["Normalizer rule", t.rule], ["Actual outputs", vec(t.output)], ["Separate graph reference", vec(t.expected)], ["Graph sum readouts", vec(t.sumReadout)], ["Graph mean readouts", vec(t.meanReadout)], ["Global node mean · different question", t.globalMean]]} />
      <Drawing width={384} height={350} label="Concatenate rows, offset local edge endpoints, propagate independently, then reduce by membership">
        <Text y={25}>Local edges → disjoint global IDs</Text>
        <Op y={58}>Offset both B endpoints by {t.offset}</Op>
        <Arrow x1={192} y1={107} x2={192} y2={135} />
        <Op y={146}>
          {retained ? 'Closed receiver mean' : 'Own + open donor mean'}
        </Op>
        <Arrow x1={192} y1={195} x2={192} y2={223} />
        <Op y={234}>Readout uses graph membership</Op>
        <Text y={326}>
          {correct ? 'No cross-graph donor permissions' : 'Membership cannot repair wrong edges'}
        </Text>
      </Drawing>
      <figcaption>{retained ? 'The retained earlier fixture has two nodes in each graph and uses a closed receiver mean, including a unit own loop. Correct offset 2 makes both A outputs 2 and both B outputs (B+2)/2. Wrong offset 1 connects A1 to B0.' : 'The accepted expanded fixture has three A nodes and two B nodes. With correct offset 3, own-plus-open-neighbor-mean outputs [4,6,8,B+2,B+2]. Wrong offset 2 instead joins A2 to B0 and leaves B1 isolated with its own 2. At B=12, the correct graph sums are 18 and 28.'} Both adjacency axes name global nodes and keep the same identity hues as the graph. Feature edits stay inside their graph only under correct edge indexing. Membership and ptr describe storage/readout boundaries; they do not restrict a wrongly indexed message. Sum and graph mean retain separate questions from a single node-weighted global mean.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label={retained ? 'Retained graph B first feature' : 'Graph B first feature'} value={first} onChange={setFirst} min={-8} max={retained ? 8 : 12} revision={revision} />
      <Select label={retained ? 'Retained offset policy' : 'Disjoint offset policy'} value={String(correct)} onChange={v => setCorrect(v === 'true')} options={[["true", "Correct endpoint offsets"], ["false", "One-too-small offset fault"]]} />
      <button type="button" onClick={() => {
        setFirst(8);
        setCorrect(true);
        setRevision(r => r + 1);
      }}>Reset {retained ? 'retained ' : ''}batch</button>
    </FlowControls>
    <FlowReadout data-batch-kind={retained ? 'closed-2+2' : 'open-3+2'} data-batch-output={t.output.join(',')} data-batch-offset={t.offset}>{t.rule}; B first value {num(first, 12)}, offset {t.offset}: outputs {vec(t.output)}, graph sums {vec(t.sumReadout)}, graph means {vec(t.meanReadout)}. {correct ? 'Independent reference agrees.' : 'Cross-graph permissions break independence.'}</FlowReadout>
  </FlowLab>;
}
export function MessagePassingIndependentBatchLab() {
  return <BatchLab />;
}
export function MessagePassingRetainedBatchLab() {
  return <BatchLab retained />;
}
export function MessagePassingTypedMessageLab() {
  const [first, setFirst] = useState(1),
    [swapped, setSwapped] = useState(false),
    [revision, setRevision] = useState(0),
    t = typedMessageTrace(first, swapped);
  return <FlowLab id="applications-typed-messages" label="Preserve the association between donor state and edge type">
    <figure data-mp-drawing="D46">
      <Drawing width={512} height={395} label="Two typed donor edges multiply their corresponding donor values before receiver sum">
        <Text x={256} y={24}>Typed donor × relation map → receiver</Text>
        {t.donors.map((v, i) => <g key={i}>
          <circle cx={72} cy={95 + i * 150} r={29} fill="#111" stroke={paperHues[i + 1]} />
          <Text x={72} y={101 + i * 150} hue={paperHues[i + 1]}>
            {num(v)}
          </Text>
          <Text x={72} y={55 + i * 150}>donor {i + 1}</Text>
          <Arrow x1={105} y1={95 + i * 150} x2={152} y2={95 + i * 150} hue={paperHues[i + 1]} />
          <Op x={156} y={73 + i * 150} width={170}>type {t.relations[i]} · ×{t.maps[t.relations[i]]}</Op>
          <Text x={239} y={142 + i * 150} hue={paperHues[i + 1]}>message {num(t.products[i])}</Text>
          <Arrow x1={330} y1={95 + i * 150} x2={408} y2={176 + i * 20} hue={paperHues[i + 1]} />
        </g>)}
        <circle cx={451} cy={186} r={38} fill="#111" stroke={paperHues[0]} />
        <Text x={451} y={191} hue={paperHues[0]}>
          {num(t.output)}
        </Text>
        <Text x={451} y={251}>receiver 0</Text>
        <Text x={256} y={365}>Sum typed messages · no own/bias term</Text>
      </Drawing>
      <Rows title="Paired association, then separate graph readouts" headers={['Question', 'Values / result']} rows={[["Current donor–relation pairs", t.donors.map((v, i) => `(${num(v)}, type ${t.relations[i]})`).join(', ')], ["Original pairing products", vec(t.originalProducts)], ["Swapped pairing products", vec(t.swappedProducts)], ["One graph atom states", "[1,3] · sum 4 / mean 2"], ["Two disconnected copies", "[1,3,1,3] · sum 8 / mean 2"]]} />
      <figcaption>Donor values and relation labels can each have unchanged multisets while their pairing changes the message sum. With donors 1,3 and maps +2,−1, the original pairing gives 2−3=−1; swapping types gives −1+6=5. A permutation must move donor, edge and type together. Sum readout scales with the number of disconnected copies; mean does not. These are constructed atom/bond-like quantities with stated units, not a physical chemical-energy model.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Typed first donor" value={first} onChange={setFirst} min={-8} max={8} revision={revision} />
      <Select label="Donor type assignment" value={String(swapped)} onChange={v => setSwapped(v === 'true')} options={[["false", "Original pairing"], ["true", "Swap the two types"]]} />
      <button type="button" onClick={() => {
        setFirst(1);
        setSwapped(false);
        setRevision(r => r + 1);
      }}>Reset typed pairing</button>
    </FlowControls>
    <FlowReadout data-typed-message={t.output}>Products {vec(t.products)} sum to {num(t.output, 12)}. Relation maps are +2 and −1; their association with donor identities is part of the input.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingTypedLibraryFigure() {
  const {
    maps,
    donors,
    messages,
    output,
    nativeMaps
  } = typedLibraryTrace();
  return <FlowLab id="applications-typed-library" label="Transpose relation maps for ordinary NNConv">
    <figure data-mp-drawing="D46-library">
      <div className="mp-express-grid">
        {maps.map((map, i) => <div key={i}>
          <Grid values={[donors[i]]} title={`Constructed donor ${i + 1} · two input channels`} rowLabels={[`ID ${i + 1}`]} rowIdentities={[i + 1]} />
          <Grid values={map} columnLabels={['in c1', 'in c2']} title={`Type ${i} · scratch output × input map`} parameter nodeRows={false} />
          <Grid values={nativeMaps[i]} rowLabels={['in c1', 'in c2']} columnLabels={['out c1', 'out c2', 'out c3']} title={`Type ${i} · NNConv input × output map`} parameter nodeRows={false} />
          <Grid values={[messages[i]]} title={`Type ${i} · three-channel message`} rowLabels={[`ID ${i + 1}`]} rowIdentities={[i + 1]} />
        </div>)}
        <Grid values={[output]} title="Receiver 0 · summed three channels" rowLabels={['ID0']} />
      </div>
      <Drawing width={384} height={340} label="Construct NNConv then assign edge mapper weights using transpose convention">
        <Text y={24}>Two inputs → three outputs</Text>
        <Op y={59}>Construct · root_weight=False</Op>
        <Arrow x1={192} y1={109} x2={192} y2={137} />
        <Op y={148}>Assign transposed relation maps</Op>
        <Arrow x1={192} y1={196} x2={192} y2={224} />
        <Op y={235}>One-hot type → flat matrix</Op>
        <Text y={323}>bias=False · aggregate add</Text>
      </Drawing>
      <figcaption>This explicit non-square example explains the storage convention: scratch maps have shape (output,input), while NNConv reshapes each generated edge map as (input,output). One-hot relation attributes select the transposed map after layer construction. The displayed arithmetic is a new constructed explanation; the accepted saved native comparisons used separately generated non-square and empty-edge fixtures, and retain their forward, input/map derivative, equal .013 update and simultaneous node-renaming checks. Their programs were not rerun here. Empty typed edges give an all-zero output because this route has no own branch or bias.</figcaption>
    </figure>
  </FlowLab>;
}
export function MessagePassingProgramTransportLab() {
  const [a, setA] = useState(2),
    [revision, setRevision] = useState(0),
    t = programTrace(a);
  return <FlowLab id="applications-program-dependencies" label="Transport assignment values along typed program dependencies">
    <figure data-mp-drawing="D47">
      <pre className="mp-application-code">
        {`a = ${String(a)}\nb = 3\nc = a + b\nd = 2 * c`}
      </pre>
      <Drawing width={512} height={485} label="Definitions a and b supply c with plus-one maps, c supplies d with plus-two map">
        <Text x={256} y={25}>Value dependencies · typed use edges</Text>
        <Op x={28} y={70} width={190}>a = {num(a)}</Op>
        <Op x={294} y={70} width={190}>b = 3</Op>
        <Arrow x1={123} y1={120} x2={208} y2={195} hue={paperHues[0]} />
        <Text x={130} y={164} hue={hues.parameter}>use a · ×1</Text>
        <Arrow x1={389} y1={120} x2={304} y2={195} hue={paperHues[1]} />
        <Text x={396} y={164} hue={hues.parameter}>use b · ×1</Text>
        <Op x={148} y={208} width={216}>c = a + b = {num(a + 3)}</Op>
        <Text x={256} y={286}>syntax operator + · two operands</Text>
        <Arrow x1={256} y1={300} x2={256} y2={352} hue={paperHues[2]} />
        <Text x={369} y={333} hue={hues.parameter}>use c · ×2</Text>
        <Op x={148} y={364} width={216}>d = 2c = {num(t.output)}</Op>
        <Text x={256} y={459}>syntax * · literal 2 · operand c</Text>
      </Drawing>
      <Rows title="Synchronous transport · a and b clamped each round" headers={['Round', 'a', 'b', 'c', 'd']} rows={t.history.map((row, r) => [r, ...row])} />
      <Rows title="Semantic counterroutes" headers={['Route', 'a,b,c,d']} rows={[["Correct typed directed edges", vec(t.direct)], ["Collapse every map to 1", vec(t.collapsed)], ["Reverse the a→c use edge", vec(t.reversed)], ["Derivatives of final d", "∂d/∂a=2, ∂d/∂b=2"]]} />
      <figcaption>Syntax identifies operators and operands; directed definition-to-use dependencies transport values. Two synchronous rounds are necessary because d reads the previous-round c. Collapsing relation maps loses the multiplication by 2; reversing a→c denies a's contribution to c. Changing unused drawing tokens has no computational effect. This constructed recurrence verifies these four assignments, rather than making message passing an automatic interpreter or proving a learned code analysis correct.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Program input a" value={a} onChange={setA} min={-2} max={5} revision={revision} />
      <button type="button" onClick={() => {
        setA(2);
        setRevision(r => r + 1);
      }}>Reset program input</button>
    </FlowControls>
    <FlowReadout data-program-output={t.output}>a={num(a, 12)}, b=3: after two rounds c={num(a + 3, 12)}, d={num(t.output, 12)}. Collapsed maps yield d={num(a + 3, 12)}; reversed a permission yields d=6.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingTrafficBoundaryLab() {
  const [lag, setLag] = useState(4),
    [reversed, setReversed] = useState(false),
    [revision, setRevision] = useState(0),
    t = trafficTrace(lag, reversed);
  return <FlowLab id="applications-traffic-time-boundary" label="Separate spatial direction from the legal time cutoff">
    <figure data-mp-drawing="D48">
      <Drawing width={512} height={215} label="Road orientation chooses B's upstream sensor, separate from time direction">
        <Text x={256} y={25}>Spatial road direction</Text>
        {['A', 'B', 'C'].map((name, i) => <g key={name}>
          <circle cx={78 + i * 178} cy={97} r={30} fill="#111" stroke={paperHues[i]} />
          <Text x={78 + i * 178} y={103} hue={paperHues[i]}>
            {name}
          </Text>
          <Text x={78 + i * 178} y={157}>
            {i === 1 ? 'receiver B' : 'sensor'}
          </Text>
        </g>)}
        {[0, 1].map(i => <Arrow key={i} x1={reversed ? 224 + i * 178 : 111 + i * 178} y1={97} x2={reversed ? 112 + i * 178 : 223 + i * 178} y2={97} hue={paperHues[reversed ? i + 1 : i]} />)}
        <Text x={256} y={198}>Units · vehicles / minute</Text>
      </Drawing>
      <Rows title="Legal sensor history · t0 and t1 only" headers={['Sensor', 't0 · lag', 't1 · current', 't2 · future target']} rows={t.history.map((row, n) => [['A', 'B', 'C'][n], ...row, 'Denied as model input'])} />
      <Drawing width={512} height={338} label="Use B current and upstream lag, deny future target input">
        <Text x={256} y={25}>Time cutoff t1 → target at t2</Text>
        <Op x={30} y={60} width={200}>B(t1)=10 · ×.5</Op>
        <Op x={280} y={60} width={200}>{['A', 'B', 'C'][t.source]}(t0)={num(t.history[t.source][0])} · ×.5</Op>
        <Text x={130} y={136} hue={paperHues[1]}>own contribution 5</Text>
        <Text x={380} y={136} hue={paperHues[t.source]}>upstream {num(t.upstream)}</Text>
        <Arrow x1={130} y1={150} x2={227} y2={190} />
        <Arrow x1={380} y1={150} x2={287} y2={190} />
        <Op x={150} y={204} width={212}>B output = {num(t.output)}</Op>
        <Text x={256} y={296}>× future target → input is denied</Text>
        <path d="M95,276L120,301M120,276L95,301" stroke="#ddd" strokeWidth="2" />
      </Drawing>
      <figcaption>Road arrows select spatial upstream permissions. The time arrow selects legal history and predicts a later target. B uses half its current t1 observation and half the upstream sensor's t0 lag, never a t2 future target. Reversing the road selects C's lag 12 rather than A's editable lag. The model has no future-target argument, so moving a target label cannot leak it into the computation. This scalar construction illustrates the boundary; the connected recurrent-model lesson supplies richer temporal-state mechanisms.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Sensor A lag at t0" value={lag} onChange={setLag} min={0} max={20} revision={revision} />
      <Select label="Road direction" value={String(reversed)} onChange={v => setReversed(v === 'true')} options={[["false", "A → B → C"], ["true", "C → B → A"]]} />
      <button type="button" onClick={() => {
        setLag(4);
        setReversed(false);
        setRevision(r => r + 1);
      }}>Reset traffic boundary</button>
    </FlowControls>
    <FlowReadout data-traffic-output={t.output} data-traffic-upstream={t.source} data-traffic-cutoff={t.cutoff}>B output=.5×10 + .5×{num(t.history[t.source][0], 12)}={num(t.output, 12)} vehicles/min. Upstream sensor {['A', 'B', 'C'][t.source]}, cutoff t1; t2 target input is denied.</FlowReadout>
  </FlowLab>;
}

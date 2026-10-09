import { useState } from 'react';
import { FlowLab, FlowControls, FlowReadout } from './LessonFlow.jsx';
import { AggregationQuantity, useSageNeighborhood } from './MessagePassingAggregationState.jsx';
import { useExpressiveness } from './MessagePassingFlowExpressivenessState.jsx';
import { Drawing, Arrow, Text, Op, Rows, Grid, Reduction, Lift, Graph, Select, num, channelHues, hues } from './MessagePassingFlowExpressivenessElements.jsx';
import { multisetTrace, ginScalarTrace, ginMappedTrace, refinementTrace, structuralTrace } from '../../data/message-expressiveness-flow-models.js';
import './message-expressiveness-flow.css';
const rawOptions = [['sum', 'Sum'], ['mean', 'Mean'], ['max', 'Maximum']];
const vector = v => `[${v.map(x => num(x, 12)).join(', ')}]`;
function PairPictures({
  lists,
  raw = 'sum',
  lifted = true,
  selected = null
}) {
  return <div className="mp-express-grid">
    {['A', 'B'].map(name => <div key={name}>
      <Reduction values={lists[name]} name={raw} title={`List ${name} · raw ${raw}`} prefix={name} selected={selected?.list === name ? selected.occurrence : null} />
      {lifted && <Lift values={lists[name]} title={`List ${name} · summed lifted rows`} prefix={name} selected={selected?.list === name ? selected.occurrence : null} />}
    </div>)}
  </div>;
}
function PairReadout() {
  const s = useExpressiveness(),
    a = multisetTrace(s.lists.A),
    b = multisetTrace(s.lists.B);
  return <FlowReadout data-pair-a={s.lists.A.join(',')} data-pair-b={s.lists.B.join(',')} data-pair-raw={s.raw} data-pair-lifted={String(s.lifted)}>A={vector(s.lists.A)}, B={vector(s.lists.B)}. Raw {s.raw}: A {num(a[s.raw], 12)}, B {num(b[s.raw], 12)}; lifted sums A {vector(a.lifted)}, B {vector(b.lifted)}. Entries with equal values retain separate occurrence IDs.</FlowReadout>;
}
export function MessagePassingMultisetWorkedLab() {
  const [first, setFirst] = useState(1),
    [revision, setRevision] = useState(0),
    lists = {
      A: [first, 4 - first],
      B: [2, 2]
    };
  return <FlowLab id="expressiveness-first-collision" label="A raw sum can hide distinct multisets">
    <figure data-mp-drawing="D39">
      <PairPictures lists={lists} />
      <figcaption>This first worked family keeps A's total at 4 by changing the complement 4−x. Raw sums always collide. A per-occurrence map φ(x)=(x,x²), followed by addition, separates the pair except at x=2. The independent editor below does not impose this complement. The lift also collides for [1,1,4] and [0,3,3]: both totals are 6 and squared totals 18; this finite lift is not an injectivity theorem.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Worked first value x" value={first} onChange={setFirst} min={0} max={4} revision={revision} />
      <button type="button" onClick={() => {
        setFirst(1);
        setRevision(r => r + 1);
      }}>Reset worked pair</button>
    </FlowControls>
    <FlowReadout data-worked-square={multisetTrace(lists.A).lifted[1]}>A={vector(lists.A)}: raw sum 4, lifted sum {vector(multisetTrace(lists.A).lifted)}. B=[2,2]: raw sum 4, lifted sum [4,8].</FlowReadout>
  </FlowLab>;
}
export function MessagePassingMultisetSizeLab() {
  const s = useExpressiveness();
  return <FlowLab id="expressiveness-multiset-sizes" label="Choose independent multiset sizes">
    <figure data-mp-drawing="D39a">
      <PairPictures lists={s.lists} lifted={false} />
      <figcaption>Grow a list by appending zero-valued occurrences. Shrinking drops its tail. A and B have independent sizes and values; a repeated value is still a separate entry.</figcaption>
    </figure>
    <FlowControls>
      {['A', 'B'].map(name => <AggregationQuantity key={name} label={`List ${name} size`} value={s.lists[name].length} onChange={v => s.resize(name, v)} min={1} max={6} integer revision={s.revision.sizes} />)}
      <button type="button" onClick={s.resetSizes}>Reset sizes to 2</button>
    </FlowControls>
    <PairReadout />
  </FlowLab>;
}
export function MessagePassingMultisetValueLab() {
  const s = useExpressiveness();
  return <FlowLab id="expressiveness-occurrence-values" label="Edit one multiset occurrence">
    <figure data-mp-drawing="D39b">
      <PairPictures lists={s.lists} selected={s.selected} />
      <figcaption>Choose a list and its occurrence ID before editing its arbitrary real value. White outlines mark the selected occurrence; its identity hue remains on the label and value. Changing A0 leaves A1 and every B occurrence intact. Exact entry and the slider address one logical quantity.</figcaption>
    </figure>
    <FlowControls>
      <Select label="Edited list" value={s.selected.list} onChange={s.chooseList} options={['A', 'B'].map(n => [n, n])} />
      <AggregationQuantity label="Edited occurrence ID" value={s.selected.occurrence} onChange={v => s.setSelected(old => ({
        ...old,
        occurrence: v
      }))} min={0} max={s.lists[s.selected.list].length - 1} integer revision={s.revision.values} />
      <AggregationQuantity label="Occurrence value" value={s.lists[s.selected.list][s.selected.occurrence]} onChange={s.edit} min={-8} max={8} revision={`${s.revision.values}:${s.selected.list}:${s.selected.occurrence}`} />
      <button type="button" onClick={s.resetValues}>Reset values</button>
    </FlowControls>
    <PairReadout />
  </FlowLab>;
}
export function MessagePassingMultisetPermutationLab() {
  const s = useExpressiveness();
  return <FlowLab id="expressiveness-copy-permutation" label="Copy a reversed list without linking its storage">
    <figure data-mp-drawing="D39c">
      <PairPictures lists={s.lists} />
      <figcaption>Copying A in reverse into B preserves its multiset. Symmetric raw reductions and the lifted sum agree after the copy. B receives independent storage; later edits to A cannot change B.</figcaption>
    </figure>
    <FlowControls>
      <button type="button" onClick={s.copyReverse}>Copy A reversed into B</button>
      <button type="button" onClick={s.resetLists}>Reset both lists</button>
    </FlowControls>
    <PairReadout />
  </FlowLab>;
}
export function MessagePassingDuplicateWorkedLab() {
  const [copies, setCopies] = useState(1),
    [revision, setRevision] = useState(0),
    values = Array.from({
      length: copies
    }, () => [1, 3]).flat();
  return <FlowLab id="expressiveness-whole-duplication" label="Compare sum mean and max on whole-list duplicates">
    <figure data-mp-drawing="D40">
      <div className="mp-express-grid">
        {rawOptions.map(([name]) => <Reduction key={name} values={values} name={name} title={`Whole-list duplication · ${name}`} />)}
      </div>
      <figcaption>Repeat the entire [1,3] list, preserving every occurrence. Sum sees multiplicity, while mean and maximum agree across whole-list copies. Duplicating just 3 yields [1,3,3] with mean 7/3, so mean is not invariant to arbitrary unequal replication. Maximum can be negative. On an empty multiset, ordinary mean and maximum are undefined.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Whole-list copies" value={copies} onChange={setCopies} min={1} max={3} integer revision={revision} />
      <button type="button" onClick={() => {
        setCopies(1);
        setRevision(r => r + 1);
      }}>Reset duplication</button>
    </FlowControls>
    <FlowReadout data-duplicate-sum={4 * copies}>{copies} copies give {values.length} occurrences: sum {4 * copies}, mean 2, maximum 3.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingSageReductionLab() {
  const s = useExpressiveness(),
    g = useSageNeighborhood(),
    t = multisetTrace(g.sage.neighbors),
    a = g.sage.neighbors.length ? t[s.sageRule] : 0,
    own = g.sage.selfWeight * g.sage.own,
    donor = g.sage.neighborWeight * a;
  return <FlowLab id="expressiveness-sage-reducer" label="Change the reduction on the shared SAGE neighborhood">
    <figure data-mp-drawing="D40a">
      <div className="mp-express-grid">
        <Reduction values={g.sage.neighbors} name={s.sageRule} title="Shared donors · chosen reducer" emptyZero />
        <Drawing width={512} height={354} label="Both SAGE weighted products enter the final addition">
          <Text x={256} y={25}>Two separate weighted branches</Text>
          <Text x={128} y={68}>own = {num(g.sage.own)}</Text>
          <Text x={128} y={100} hue={hues.parameter}>coefficient = {num(g.sage.selfWeight)}</Text>
          <Text x={384} y={68}>donor {s.sageRule} = {num(a)}</Text>
          <Text x={384} y={100} hue={hues.parameter}>coefficient = {num(g.sage.neighborWeight)}</Text>
          <Op x={28} y={127} width={200}>× product = {num(own)}</Op>
          <Op x={284} y={127} width={200}>× product = {num(donor)}</Op>
          <Arrow x1={128} y1={179} x2={230} y2={224} />
          <Arrow x1={384} y1={179} x2={282} y2={224} />
          <circle cx={256} cy={241} r={26} fill="#111" stroke="#ddd" />
          <Text x={256} y={247}>+</Text>
          <Arrow x1={256} y1={273} x2={256} y2={301} />
          <Text x={256} y={333} hue={hues.computed}>final sum = {num(own + donor)}</Text>
        </Drawing>
      </div>
      <Rows title="Same shared donors · permanent reduction comparison" headers={['Rule', 'Raw result', 'Neighbor product', 'Final sum']} rows={rawOptions.map(([rule]) => {
        const v = g.sage.neighbors.length ? t[rule] : 0;
        return [rule, v, v * g.sage.neighborWeight, own + v * g.sage.neighborWeight];
      })} />
      <figcaption>These are the same own state, donor occurrences and coefficients used in the earlier SAGE views. This operator explicitly defines an empty donor reduction as 0 for all three choices; that is an operator convention, not an ordinary empty maximum. Doubling the whole current list is permitted only when its size is at most 3, keeping the existing 0–6 occurrence domain. Reset changes only the reducer.</figcaption>
    </figure>
    <FlowControls>
      <Select label="SAGE donor reduction" value={s.sageRule} onChange={s.setSageRule} options={rawOptions} />
      <button type="button" disabled={g.sage.neighbors.length > 3} onClick={() => g.edit('neighbors', [...g.sage.neighbors, ...g.sage.neighbors])}>Duplicate whole shared donor list</button>
      <button type="button" onClick={() => s.setSageRule('mean')}>Reset reducer</button>
    </FlowControls>
    <FlowReadout data-sage-reduction={s.sageRule} data-sage-reduction-output={own + donor}>{s.sageRule} of {vector(g.sage.neighbors)} is {num(a, 12)}. Own product {num(own, 12)} plus donor product {num(donor, 12)} gives {num(own + donor, 12)}. Change donor values and branch coefficients in the shared earlier views.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingMultisetReductionLab() {
  const s = useExpressiveness();
  return <FlowLab id="expressiveness-paired-reduction" label="Compare arbitrary multisets with raw and lifted routes">
    <figure data-mp-drawing="D40b">
      <PairPictures lists={s.lists} raw={s.raw} />
      <Drawing width={384} height={220} label="Chosen route selects either raw reducer or sum of transformed coordinates">
        <Text y={26}>Selected comparison route</Text>
        <Op y={62}>
          {s.lifted ? 'sum of φ(x) rows' : `raw ${s.raw}`}
        </Op>
        <Arrow x1={192} y1={112} x2={192} y2={144} />
        <Text y={174}>
          {s.lifted ? 'Two labelled coordinates' : 'One scalar result'}
        </Text>
      </Drawing>
      <figcaption>The paired editor supplies both routes. Raw reduction may be sum, mean or maximum; the lifted route always sums transformed coordinates, irrespective of the raw choice. Both computations remain visible so the selected route does not hide a collision.</figcaption>
    </figure>
    <FlowControls>
      <Select label="Paired raw reduction" value={s.raw} onChange={s.setRaw} options={rawOptions} />
      <Select label="Selected comparison route" value={String(s.lifted)} onChange={v => s.setLifted(v === 'true')} options={[["false", "Raw scalar"], ["true", "Lifted sum"]]} />
      <button type="button" onClick={s.resetRoute}>Reset comparison route</button>
    </FlowControls>
    <PairReadout />
  </FlowLab>;
}
export function MessagePassingGinScalarLab() {
  const [epsilon, setEpsilon] = useState(0),
    [first, setFirst] = useState(1),
    [revision, setRevision] = useState(0),
    t = ginScalarTrace(epsilon, first);
  return <FlowLab id="expressiveness-gin-scalar" label="Carry a self-weighted sum through an actual MLP">
    <figure data-mp-drawing="D41a">
      <div className="mp-express-grid">
        <Reduction values={t.neighbors} title="Open donors · sum" />
        <Drawing width={384} height={438} label="GIN own factor product plus neighbor sum">
          <Text y={24}>Own state 2 · no added self loop</Text>
          <Op y={60}>1 + ε = {num(t.selfFactor)}</Op>
          <Arrow x1={192} y1={108} x2={192} y2={136} />
          <Op y={145}>× own 2 = {num(t.selfProduct)}</Op>
          <Arrow x1={192} y1={192} x2={192} y2={220} />
          <Op y={231}>+ donor sum {num(t.neighborSum)}</Op>
          <Arrow x1={192} y1={280} x2={192} y2={308} />
          <Op y={320}>MLP input t = {num(t.input)}</Op>
          <Text y={411}>ε weights the separate own branch</Text>
        </Drawing>
        <Drawing width={384} height={440} label="Actual scalar MLP affine two channels then ReLU then difference">
          <Text y={24}>MLP · 1 → 2 → 1</Text>
          <Op y={65}>Affine: [t, −t]</Op>
          <Text y={138} hue={channelHues[0]}>c1 = {num(t.affine[0])}</Text>
          <Text y={174} hue={channelHues[1]}>c2 = {num(t.affine[1])}</Text>
          <Arrow x1={192} y1={185} x2={192} y2={215} />
          <Op y={226}>Coordinate ReLU</Op>
          <Text y={300}>[{t.hidden.map(x => num(x)).join(', ')}]</Text>
          <Arrow x1={192} y1={314} x2={192} y2={340} />
          <Op y={351}>c1 − c2 = {num(t.output)}</Op>
        </Drawing>
      </div>
      <figcaption>This supplied MLP realizes t exactly as ReLU(t)−ReLU(−t). GIN applies a shared learned transform after the self-weighted neighbor sum. Suitable ε, a countable feature domain, bounded multisets and sufficiently expressive transforms/readouts enter the injectivity argument; arbitrary floating-point raw sums are not injective. The fractional-base existence encoding is not a numerically stable recipe, and ε=0 is not a universal theorem guarantee.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="GIN epsilon ε" value={epsilon} onChange={setEpsilon} min={-.5} max={1} revision={revision} />
      <AggregationQuantity label="GIN first donor" value={first} onChange={setFirst} min={-2} max={4} revision={revision} />
      <button type="button" onClick={() => {
        setEpsilon(0);
        setFirst(1);
        setRevision(r => r + 1);
      }}>Reset scalar GIN</button>
    </FlowControls>
    <FlowReadout data-gin-input={t.input} data-gin-output={t.output}>(1+{num(epsilon, 12)})×2 + ({num(first, 12)}+3) = {num(t.input, 12)}; affine {vector(t.affine)}, ReLU {vector(t.hidden)}, final difference {num(t.output, 12)}.</FlowReadout>
  </FlowLab>;
}
export function MessagePassingGinLibraryFigure() {
  const t = ginMappedTrace(true),
    fixed = ginMappedTrace(false),
    p = t.parameters;
  return <FlowLab id="expressiveness-gin-library" label="Map the supplied two to three to two MLP into GINConv">
    <figure data-mp-drawing="D41-library">
      <Drawing width={384} height={427} label="Constructor reset before copying matched state, gradients, then equal SGD">
        <Text y={25}>Scratch ↔ ordinary GINConv</Text>
        <Op y={61}>Construct both · reset runs</Op>
        <Arrow x1={192} y1={111} x2={192} y2={139} />
        <Op y={149}>Copy MLP state and ε=.17</Op>
        <Arrow x1={192} y1={198} x2={192} y2={226} />
        <Op y={237}>Forward → probe derivatives</Op>
        <Arrow x1={192} y1={286} x2={192} y2={314} />
        <Op y={325}>Equal SGD step · rate .03</Op>
        <Text y={405}>Copy before construction is invalid</Text>
      </Drawing>
      <div className="mp-express-grid">
        <Grid values={t.features} title="X · 4 nodes × 2 input channels" />
        <Grid values={p.w1} rowLabels={['h1', 'h2', 'h3']} columnLabels={['in c1', 'in c2']} title="W1 · 3 output × 2 input" parameter nodeRows={false} />
        <Grid values={[p.b1]} rowLabels={['bias']} title="b1 · three hidden channels" parameter nodeRows={false} />
        <Grid values={p.w2} rowLabels={['out c1', 'out c2']} columnLabels={['h1', 'h2', 'h3']} title="W2 · 2 output × 3 hidden" parameter nodeRows={false} />
        <Grid values={[p.b2]} rowLabels={['bias']} title="b2 · two output channels" parameter nodeRows={false} />
        <Grid values={t.before.neighbors} title="Open incoming sums" />
        <Grid values={t.before.own} title="Own branch · 1.17 X" />
        <Grid values={t.before.inputs} title="MLP inputs · own + donors" />
        <Grid values={t.before.affine} title="Affine 1 · input W1ᵀ + b1" />
        <Grid values={t.before.hidden} title="Hidden · coordinate ReLU" />
        <Grid values={t.before.output} title="Output · hidden W2ᵀ + b2" />
        <Grid values={t.probe} title="Probe · arange(1,9) / 7" />
        <Grid values={t.inputDerivatives} title="Objective derivatives · input X" />
        <Grid values={t.gradient.w1} rowLabels={['h1', 'h2', 'h3']} columnLabels={['in c1', 'in c2']} title="dObjective/dW1" parameter nodeRows={false} />
        <Grid values={[t.gradient.b1]} rowLabels={['bias']} title="dObjective/db1" parameter nodeRows={false} />
        <Grid values={t.gradient.w2} rowLabels={['out c1', 'out c2']} columnLabels={['h1', 'h2', 'h3']} title="dObjective/dW2" parameter nodeRows={false} />
        <Grid values={[t.gradient.b2]} rowLabels={['bias']} title="dObjective/db2" parameter nodeRows={false} />
        <Grid values={t.after.output} title="Both routes · after equal .03 SGD" />
        <Grid values={fixed.after.output} title="Fixed ε buffer · after MLP-only SGD" />
      </div>
      <Rows title="Matched native route and isolate 3" headers={['Operand/check', 'Value']} rows={[["Directed edges", "0→1, 1→0, 2→1, 1→2; node 3 has none"], ["Isolate 3 input", vector(t.before.inputs[3])], ["Isolate 3 affine", vector(t.before.affine[3])], ["Isolate 3 ReLU", vector(t.before.hidden[3])], ["Isolate 3 output", vector(t.before.output[3])], ["Probe objective", t.objective], ["Trainable dObjective/dε", t.gradient.epsilon], ["Trainable ε after SGD", t.updated.epsilon], ["Fixed buffer ε after SGD", fixed.updated.epsilon], ["Native comparison", "Forward, input derivatives, all MLP/optional ε derivatives and equal updates agree"], ["State ownership", "Separate tensors; equal contents do not imply aliasing"]]} />
      <figcaption>These are the actual supplied MLP's operands and intermediates, not an identity-MLP substitute. The accepted float64 native scratch/PyG comparisons are retained without rerunning their program. Each derivative is of the displayed weighted probe objective. When train_eps=True, ε is a trainable parameter with derivative .73 and update .17−.03×.73=.1481; otherwise ε remains a .17 buffer and receives no optimizer arrow. The MLP parameters train in both routes. Both layers are constructed before copying state, because construction resets supplied modules. Shapes, directed donor permissions and the isolated own route match. Displayed analytic arithmetic complements the saved native evidence; it does not execute Torch in the browser.</figcaption>
    </figure>
  </FlowLab>;
}
export function MessagePassingRefinementLab() {
  const [rounds, setRounds] = useState(1),
    [revision, setRevision] = useState(0),
    t = refinementTrace(rounds),
    counts = values => Object.entries(values.reduce((o, v) => (o[v] = (o[v] ?? 0) + 1, o), {})).map(([k, v]) => `${k}:${v}`).join(', ');
  return <FlowLab id="expressiveness-wl-refinement" label="Refine categorical graph labels with a shared injective dictionary">
    <figure data-mp-drawing="D41b">
      <div className="mp-express-grid">
        <Graph incoming={t.left} values={t.current.slice(0, 4)} title="Path4 · categorical labels" />
        <Graph incoming={t.right} values={t.current.slice(4)} title="Star4 · categorical labels" />
      </div>
      <Rows title="Last synchronous round · shared old buffer" headers={['Global node', 'Self label', 'Sorted donor labels', 'Dictionary tuple', 'Next label']} rows={t.last ? t.last.keys.map((key, n) => {
        const [self, neighbors] = JSON.parse(key);
        return [`${n < 4 ? 'path' : 'star'} ${n % 4}`, String(self), neighbors.join(', '), key, t.last.next[n]];
      }) : t.current.map((v, n) => [`${n < 4 ? 'path' : 'star'} ${n % 4}`, v, 'Not read at round 0', 'No refinement yet', v])} />
      {t.last && <Rows title="One shared tuple dictionary across both graphs" headers={['Dictionary label', 'Exact tuple']} rows={t.last.dictionary.map(d => [d.label, JSON.stringify(d.key)])} />}
      <Rows title="Categorical count readouts · comparison across rounds" headers={['Round', 'Path label:count', 'Star label:count']} rows={t.history.map((labels, r) => [r, counts(labels.slice(0, 4)), counts(labels.slice(4))])} />
      <figcaption>Initial labels are all A. At each round, read every self label and sorted donor-label multiset from the old buffer, assign equal tuples equal new categorical labels through a single dictionary, then commit the entire new buffer. The disjoint joint indexing uses offset 4 and no cross-graph edges. Labels are category names, not learned scalar states; node permutation preserves tuple and count correspondence. Different counts distinguish this pair, while matching WL counts do not prove graph isomorphism.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Categorical refinement rounds" value={rounds} onChange={setRounds} min={0} max={3} integer revision={revision} />
      <button type="button" onClick={() => {
        setRounds(1);
        setRevision(r => r + 1);
      }}>Reset refinement</button>
    </FlowControls>
    <FlowReadout data-wl-rounds={rounds} data-wl-path={counts(t.current.slice(0, 4))} data-wl-star={counts(t.current.slice(4))}>Round {rounds}: path counts {counts(t.current.slice(0, 4))}; star counts {counts(t.current.slice(4))}. {rounds === 0 ? 'Initial labels coincide.' : 'The shared categorical histogram distinguishes path4 from star4.'}</FlowReadout>
  </FlowLab>;
}
export function MessagePassingStructuralLimitLab() {
  const [rounds, setRounds] = useState(1),
    [revision, setRevision] = useState(0),
    t = structuralTrace(rounds);
  return <FlowLab id="expressiveness-regular-counterexample" label="See a cycle and two triangles remain locally indistinguishable">
    <figure data-mp-drawing="D42">
      <div className="mp-express-grid">
        <Graph incoming={t.cycle.incoming} values={t.cycle.output} title="C6 · one connected cycle" />
        <Graph incoming={t.triangles.incoming} values={t.triangles.output} title="Two separate triangles" layout="triangles" />
      </div>
      <Rows title="Uniform-feature synchronous recurrence" headers={['Round', 'Each node · either graph', 'Graph sum · either graph']} rows={t.cycle.history.map((row, r) => [r, row[0], row.reduce((s, v) => s + v, 0)])} />
      <Drawing width={384} height={270} label="One old self and two old neighbor states produce three equal contributions">
        <Text y={25}>Same local inputs at every node</Text>
        <Op y={61}>old self + old donor 1 + donor 2</Op>
        <Arrow x1={192} y1={110} x2={192} y2={145} />
        <Op y={155}>3 × old value = {num(t.cycle.output[0])}</Op>
        <Text y={247}>Graph sum = 6 × node value</Text>
      </Drawing>
      <div className="mp-express-grid">
        <Graph incoming={t.changedCycle.incoming} values={t.changedCycle.output} title="Changed feature · C6 at round 2" />
        <Graph incoming={t.changedTriangles.incoming} values={t.changedTriangles.output} title="Changed feature · triangles at round 2" layout="triangles" />
      </div>
      <Rows title="Changed input example · initial [2,1,1,1,1,1]" headers={['Graph', 'Round 2 node states', 'Graph sum']} rows={[["C6", vector(t.changedCycle.output), t.changedCycle.graphSum], ["Two triangles", vector(t.changedTriangles.output), t.changedTriangles.graphSum]]} />
      <figcaption>The actual graphs differ in connectivity but have six degree 2 nodes and uniform initial state 1. The same local self-plus-neighbor sum gives 3ʳ at every node and 6×3ʳ at the graph readout, so these messages cannot distinguish them. Moving drawing positions adds no information. Giving node 0 a different feature changes the input problem: the two round 2 node histograms then differ, while their sums both remain 63. This is not a proof that the original uniform-feature structure can be distinguished. Positional inputs, richer substructures or a different task require their own information assumptions.</figcaption>
    </figure>
    <FlowControls>
      <AggregationQuantity label="Uniform message rounds" value={rounds} onChange={setRounds} min={0} max={3} integer revision={revision} />
      <button type="button" onClick={() => {
        setRounds(1);
        setRevision(r => r + 1);
      }}>Reset uniform rounds</button>
    </FlowControls>
    <FlowReadout data-structural-node={t.cycle.output[0]} data-structural-sum={t.cycle.graphSum}>Both graphs: each node {num(t.cycle.output[0])}; graph sum {num(t.cycle.graphSum)}. They have different component counts but identical supplied local messages.</FlowReadout>
  </FlowLab>;
}

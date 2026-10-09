import { predictCorrection, predictBoosting } from '../../../data/gradient-boosted-trees-models.js';
import { splitScan, sum } from '../../../data/gbt-reading-flow-model.js';
import { Figure, Scene, Table, Numeric, Controls, Targets, Arrow, number as n, useReading } from './Common.jsx';

export function SavedTree({ tree, query, label }) {
  if (tree.leaf) return <Scene label={label + '; unsplit mean leaf'} height={132}><text x={136} y={20} textAnchor="middle">x = {n(query)}</text><Arrow x1={136} y1={29} x2={136} y2={56} active /><g className="gbf-active"><rect x={66} y={57} width={140} height={50} /><text x={136} y={80} textAnchor="middle">w = {n(tree.value)}</text><text x={136} y={100} textAnchor="middle">{tree.indices.length} rows</text></g></Scene>;
  const left = query <= tree.threshold;
  return <Scene label={label + '; saved ≤ predicate and raw correction leaves'} height={254}>
    <text x={136} y={20} textAnchor="middle">x = {n(query)}</text><Arrow x1={136} y1={29} x2={136} y2={44} active />
    <g className="gbf-active"><polygon points="136,44 228,78 136,112 44,78" /><text x={136} y={83} textAnchor="middle">x ≤ {n(tree.threshold)}</text></g>
    <Arrow x1={90} y1={95} x2={68} y2={182} active={left} /><Arrow x1={182} y1={95} x2={204} y2={182} active={!left} />
    <text x={10} y={145}>yes ≤</text><text x={222} y={145}>no &gt;</text>
    {[tree.left, tree.right].map((leaf, i) => <g key={i} className={left === (i === 0) ? 'gbf-active' : ''}><rect x={10 + i * 136} y={182} width={116} height={52} /><text x={68 + i * 136} y={204} textAnchor="middle">w = {n(leaf.value)}</text><text x={68 + i * 136} y={226} textAnchor="middle">{leaf.indices.length} rows</text></g>)}
  </Scene>;
}
function Query() {
  const { state, update, resets } = useReading();
  return <Numeric label="Saved-path query x" value={state.found.query} min={-2} max={8} onChange={v => update('found', { query: v })} resetKey={resets.found} />;
}
function AppliedLeaf({ raw, rate, base, answer }) {
  return <Scene label="Raw leaf times rate, then baseline plus contribution" height={308}>
    <text x={62} y={20} textAnchor="middle">raw leaf w</text><text x={210} y={20} textAnchor="middle">rate η</text>
    <rect x={10} y={30} width={104} height={38} /><text x={62} y={55} textAnchor="middle">{n(raw)}</text>
    <rect x={158} y={30} width={104} height={38} /><text x={210} y={55} textAnchor="middle">{n(rate)}</text>
    <Arrow x1={62} y1={68} x2={120} y2={100} active /><Arrow x1={210} y1={68} x2={152} y2={100} active />
    <circle cx={136} cy={108} r={18} /><text x={136} y={114} textAnchor="middle">×</text><Arrow x1={136} y1={126} x2={136} y2={151} active />
    <rect x={76} y={151} width={120} height={40} /><text x={136} y={177} textAnchor="middle">{n(rate * raw)}</text>
    <Arrow x1={136} y1={191} x2={136} y2={220} active /><circle cx={136} cy={238} r={18} /><text x={136} y={244} textAnchor="middle">+</text>
    <text x={5} y={216}>F₀ = {n(base)}</text><Arrow x1={65} y1={231} x2={118} y2={238} active />
    <Arrow x1={136} y1={256} x2={136} y2={278} active /><text x={136} y={301} textAnchor="middle">F₁ = {n(answer)}</text>
  </Scene>;
}
export function TreeAnatomy() {
  const { state, model } = useReading(), query = state.found.query, tree = model.trees[0];
  return <Figure id="D01" label="Saved correction tree anatomy" caption={<>A saved feature predicate sends x={n(query)} to a raw leaf {n(predictCorrection(tree, query))}. The training memberships are shown; no query target enters inference. Query edits reuse the same saved tree.</>}>
    <SavedTree tree={tree} query={query} label="First saved correction tree" /><Controls group="found"><Query /></Controls>
  </Figure>;
}
export function OneContribution() {
  const { state, model } = useReading(), query = state.found.query, tree = model.trees[0], raw = predictCorrection(tree, query);
  return <Figure id="D02" label="One saved contribution" caption={<>Score units: F₀={n(model.base)}, raw leaf={n(raw)}, rate={n(model.rate)}. Multiply once, then add once: F₁={n(model.base + model.rate * raw)}. Rate and training targets are edited with the training calculation below.</>}>
    <div className="gbf-panels"><SavedTree tree={tree} query={query} label="First tree selected path" /><AppliedLeaf raw={raw} rate={model.rate} base={model.base} answer={model.base + model.rate * raw} /></div><Controls group="found"><Query /></Controls>
  </Figure>;
}
export function EnsembleSum() {
  const { state, model } = useReading(), query = state.found.query;
  const raw = model.trees.slice(0, 2).map(tree => predictCorrection(tree, query)), values = [model.base, ...raw.map(v => model.rate * v)];
  const totals = values.map((_, i) => sum(values.slice(0, i + 1)));
  return <Figure id="D03" label="Two saved trees and one intercept" caption={<>Blue tree1 and violet tree2 retain their text hues into the matching scaled contributions; amber marks the active path. Both paths use x={n(query)}. The intercept contributes once; each raw response is multiplied by η={n(model.rate)} once. F₂={n(totals.at(-1))}. These trees were learned sequentially, and these paths now use their saved rules.</>}>
    <div className="gbf-panels">{model.trees.slice(0, 2).map((tree, i) => <div key={i} className={'gbf-tree'+(i+1)}><p>Saved tree {i + 1}</p><SavedTree tree={tree} query={query} label={'Saved tree ' + (i + 1)} /></div>)}
      <Scene label="Intercept and two scaled contributions enter the connected sum" height={368}>
        <rect x={104} y={20} width={156} height={40} /><text x={182} y={46} textAnchor="middle">F₀ = {n(totals[0])}</text>
        {[1, 2].map(i => { const offset = (i - 1) * 144; return <g key={i}>
          <Arrow x1={182} y1={60 + offset} x2={182} y2={102 + offset} active />
          <text className={'gbf-tree'+i} x={8} y={78 + offset}>η f{i} = {n(values[i])}</text><Arrow x1={78} y1={88 + offset} x2={164} y2={120 + offset} active />
          <circle cx={182} cy={120 + offset} r={18} /><text x={182} y={126 + offset} textAnchor="middle">+</text><Arrow x1={182} y1={138 + offset} x2={182} y2={164 + offset} active />
          <rect x={104} y={164 + offset} width={156} height={40} /><text x={182} y={190 + offset} textAnchor="middle">F{i} = {n(totals[i])}</text>
        </g>; })}
      </Scene>
    </div><Controls group="found"><Query /></Controls>
  </Figure>;
}
export function ResidualRows() {
  const { state, update, resets, model } = useReading(), current = model.stages[state.found.round], row = state.found.row;
  const leaf = current.tree.leaf ? current.tree : model.x[row] <= current.tree.threshold ? current.tree.left : current.tree.right;
  const numerator = sum(leaf.indices.map(i => current.residual[i]));
  return <Figure id="D04" label="Aligned residual requests and applied updates" caption={<>Round {current.round}, row {row + 1}: target minus current score gives the request. The saved leaf supplies a shared raw answer; η={n(model.rate)} scales it before addition. A valid target vector is applied together and restarts round1. Row selection only changes emphasis.</>}>
    <Table caption={'Current fitted round ' + current.round + '; score/residual units'} headers={['row', 'x', 'target y', 'before F', 'r=y−F', 'raw f', 'η f', 'after F']} rows={model.x.map((x, i) => [i === row ? '→ ' + (i + 1) : i + 1, n(x), n(model.y[i]), n(current.before[i]), n(current.residual[i]), n(current.correction[i]), n(model.rate * current.correction[i]), n(current.prediction[i])])} />
    <Scene label={'Actual arithmetic route for row ' + (row + 1)} height={512}>
      <text x={8} y={22}>y = {n(model.y[row])}</text><text x={151} y={22}>F = {n(current.before[row])}</text>
      <Arrow x1={55} y1={30} x2={118} y2={74} active /><Arrow x1={205} y1={30} x2={154} y2={74} active />
      <circle cx={136} cy={82} r={19} /><text x={136} y={88} textAnchor="middle">−</text><Arrow x1={136} y1={101} x2={136} y2={129} active />
      <text x={136} y={153} textAnchor="middle">r = {n(current.residual[row])}</text><Arrow x1={136} y1={165} x2={136} y2={189} active />
      <text x={136} y={210} textAnchor="middle">leaf rows {leaf.indices.map(i => i + 1).join(', ')}</text>
      <text x={136} y={241} textAnchor="middle">Σr / count = {n(numerator)} / {leaf.indices.length}</text><Arrow x1={136} y1={252} x2={136} y2={275} active />
      <text x={136} y={298} textAnchor="middle">shared f = {n(current.correction[row])}</text><Arrow x1={136} y1={309} x2={136} y2={332} active />
      <text x={136} y={358} textAnchor="middle">η f = {n(model.rate * current.correction[row])}</text><Arrow x1={136} y1={369} x2={136} y2={411} active />
      <text x={8} y={397}>F={n(current.before[row])}</text><Arrow x1={66} y1={408} x2={118} y2={429} active/><circle cx={136} cy={429} r={18}/><text x={136} y={435} textAnchor="middle">+</text><Arrow x1={136} y1={447} x2={136} y2={477} active/>
      <text x={136} y={502} textAnchor="middle">after F={n(current.prediction[row])}</text>
    </Scene>
    <Controls group="found"><Targets /><Numeric label="Correction rate η" value={state.found.rate} min={0} max={1.5} step={.1} onChange={v => update('found', { rate: v })} resetKey={resets.found} /><Numeric label="Inspect training row" value={row + 1} min={1} max={6} integer step={1} onChange={v => update('found', { row: v - 1 })} resetKey={resets.found} /></Controls>
  </Figure>;
}
export function LeafProjection() {
  const { state, update, resets, model } = useReading(), stage = model.stages[state.found.round];
  const magnitude = Math.max(1, ...stage.residual.map(Math.abs), ...stage.correction.map(Math.abs)), y = v => 114 - v / magnitude * 72;
  const before = sum(stage.residual.map(v => v * v)), fitted = sum(stage.correction.map(v => v * v)), decrease = model.rate * (2 - model.rate) * fitted;
  return <Figure id="D05" label="Leaf projection and exact squared-loss identity" caption={<>Outlined bars are row requests; amber dots are repeated fitted leaf answers, in residual units. SSE {n(before)} − η(2−η)∥f∥² {n(decrease)} = {n(sum(stage.prediction.map((v, i) => (model.y[i] - v) ** 2)))}. This identity uses the full unweighted mean-leaf fit.</>}>
    <Scene label="Six requested residuals versus their shared leaf projections" height={252}><text x={8} y={20}>residual units</text><path d="M78,36V195M78,114H264" /><text x={4} y={48}>{n(magnitude, 2)}</text><text x={20} y={119}>0</text><text x={4} y={190}>−{n(magnitude, 2)}</text>
      {stage.residual.map((r, i) => { const x = 90 + i * 30, top = Math.min(114, y(r)), bottom = Math.max(114, y(r)); return <g key={i}>{r === 0 ? <path d={`M${x - 10},114H${x + 10}`} /> : <rect x={x - 10} y={top} width={20} height={bottom - top} />}<g className="gbf-active"><circle cx={x} cy={y(stage.correction[i])} r={4} /></g><text x={x} y={217} textAnchor="middle">{i + 1}</text></g>; })}<text x={150} y={246} textAnchor="middle">training row ID</text>
    </Scene>
    <Table caption="Request, projection and remaining difference" headers={['row', 'r', 'f', 'r−f']} rows={stage.residual.map((r, i) => [i + 1, n(r), n(stage.correction[i]), n(r - stage.correction[i])])} />
    <Controls group="found"><Numeric label="Inspect fitted round" value={state.found.round} min={1} max={8} integer step={1} onChange={v => update('found', { round: v })} resetKey={resets.found} /></Controls>
  </Figure>;
}
export function SplitScan() {
  const { state, model } = useReading(), stage = model.stages[state.found.round], candidates = splitScan(stage.residual), cut = stage.tree.leaf ? null : stage.tree.threshold;
  const cell = Math.max(52, ...stage.residual.map(v => n(v, 2).length * 8 + 16));
  return <Figure id="D06" label="Every distinct first-level residual split" caption={<>Six distinct ordered feature values admit five boundaries. Moving the boundary changes the two residual means and SSE. {cut === null ? 'No strictly positive improvement is available: the fitted tree remains one leaf.' : 'The fitted root chooses ≤' + n(cut) + '.'} No empty side or equal-value separation is admitted.</>}>
    <Scene label="Sorted values with the actual chosen boundary" height={130} width={cell * 6 + 8}>{model.x.map((x, i) => <g key={i}><rect x={4 + i * cell} y={25} width={cell - 8} height={40} /><text x={cell / 2 + i * cell} y={52} textAnchor="middle">{x}</text><text x={cell / 2 + i * cell} y={94} textAnchor="middle">{n(stage.residual[i], 2)}</text></g>)}{cut !== null && <g className="gbf-active"><path d={`M${(cut - .5) * cell},8V110`} /></g>}<text x={4} y={125}>top: x; bottom: residual r</text></Scene>
    <Table caption="All legal candidate means and remaining residual SSE" headers={['≤ cut', 'left count', 'left mean', 'right mean', 'SSE']} rows={candidates.map(c => [c.cut === cut ? '→ ' + n(c.cut) : n(c.cut), c.leftCount, n(c.left), n(c.right), n(c.error)])} />
  </Figure>;
}

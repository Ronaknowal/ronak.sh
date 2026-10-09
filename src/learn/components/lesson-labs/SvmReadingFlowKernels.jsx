import { useEffect, useMemo, useState } from 'react';
import { FlowLab, FlowSlider } from './LessonFlow.jsx';
import { xorKernelState, xorScore, SVM_XOR_POINTS, SVM_XOR_LABELS, svmPairStep, svmPairFixture, dot } from '../../data/svm-reading-flow-models.js';
import observations from '../../data/svm-reading-flow-observations.js';
import { Scene, Text, Wire, Port, Mark, Plane, Curve, Grid, number as n, vectorText as v, colors as c, FlowControls, FlowReadout, ExactInput, Select, Reset, ExactTable } from './SvmReadingFlowDrawing.jsx';

export function XorLift() {
  return <><Plane points={SVM_XOR_POINTS.map((x, i) => ({ x, y: SVM_XOR_LABELS[i], id: `row ${i}` }))} w={[0, 0]} range={2} size={360} field={x => x[0] * x[1]}/>
    <Scene label="Selected row (1,−1) constructs three polynomial features; only the middle coordinate separates the four corners" width={760} height={370}>
      <Port x={20} y={60} label="input (x₁,x₂)" value="(1, −1)" width={130}/>
      {[{ label: 'square x₁', value: '1² = 1', hue: c.first }, { label: '√2 × x₁ × x₂', value: '−√2', hue: c.second }, { label: 'square x₂', value: '(−1)² = 1', hue: c.first }].map((row, i) => <g key={i}><Wire x1={150} y1={81} x2={205} y2={50 + i * 90} hue={row.hue} arrow/><Port x={205} y={30 + i * 90} label={row.label} value={row.value} hue={row.hue} width={160}/><Wire x1={365} y1={51 + i * 90} x2={430} y2={160} hue={row.hue} arrow/></g>)}
      <Port x={430} y={140} label="feature φ" value="[1, −√2, 1]" width={150}/><Wire x1={580} y1={161} x2={625} y2={161} arrow/><Port x={625} y={140} label="dot [0,1/√2,0]" value="score −1" width={130}/>
      <Text x={25} y={310}>Four-corner projection: φ₁=φ₃=1 only for these inputs</Text><Wire x1={100} y1={340} x2={655} y2={340} arrow/><Wire x1={378} x2={378} y1={318} y2={360} dash="5 4"/><Mark x={185} y={340} kind={-1} label="φ₂=−√2"/><Mark x={570} y={340} kind={1} label="φ₂=+√2"/><Text x={390} y={365}>plane φ₂=0</Text>
    </Scene></>;
}
export function GramAssembly() {
  const state = xorKernelState('poly');
  return <><Scene label="Complete polynomial Gram with training identities on both axes" width={770} height={325}><Grid x={230} y={65} cell={130} matrix={state.gram} rows={['0 (−1,−1)', '1 (−1,+1)', '2 (+1,−1)', '3 (+1,+1)']} columns={['row 0', 'row 1', 'row 2', 'row 3']} rowHues={[c.positive, c.negative, c.negative, c.positive]}/><Text x={25} y={300}>Opposite corner cell (0,3): feature products 1 + 2 + 1 = 4; input dot (−2)² = 4</Text></Scene>
    <Scene label="Three independent matching-coordinate products join the Gram-entry sum" width={650} height={300}>{[1, 2, 1].map((value, i) => <g key={i}><Port x={20} y={45 + i * 95} label={['φ₁×φ₁', 'φ₂×φ₂', 'φ₃×φ₃'][i]} value={value} hue={i === 1 ? c.second : c.first} width={200}/><Wire x1={220} y1={66 + i * 95} x2={440} y2={161} hue={i === 1 ? c.second : c.first} arrow/></g>)}<Port x={440} y={140} label="sum all three products" value="1+2+1 = 4" width={180}/></Scene></>;
}
function SpectralLane({ matrix, input, label }) {
  const output = matrix.map(row => dot(row, input)), quadratic = dot(input, output), eigenvalue = input[0] ? output[0] / input[0] : 0;
  return <><div className="svm-flow-desktop"><Scene label={`${label}: actual matrix rows multiply the named coefficient vector`} width={710} height={250}>
    <Grid x={95} y={50} matrix={matrix} rows={['row 0', 'row 1']} columns={['ID 0', 'ID 1']} cell={90}/>
    <Port x={330} y={50} label="coefficient vector v" value={v(input)} hue={c.query} width={155}/><Wire x1={275} y1={74} x2={315} y2={74} arrow/>
    {matrix.map((row, i) => <g key={i}><Text x={325} y={135 + i * 45}>{n(row[0])}×{n(input[0])} + {n(row[1])}×{n(input[1])} = {n(output[i])}</Text><Wire x1={550} y1={130 + i * 45} x2={595} y2={130 + i * 45} arrow/><Text x={605} y={135 + i * 45}>row {i}</Text></g>)}
    <Text x={25} y={225}>Mv={v(output)} = {n(eigenvalue)}v; λ_K={n(eigenvalue)}; vᵀMv={n(quadratic)}</Text>
  </Scene></div><div className="svm-flow-compact"><Scene label={`${label}: matrix, coefficient vector and row operations stacked`} width={350} height={420}>
    <Grid x={95} y={55} matrix={matrix} rows={['row 0','row 1']} columns={['ID 0','ID 1']} cell={85}/><Port x={65} y={185} label="coefficient vector v" value={v(input)} hue={c.query} width={205}/><Wire x1={167} y1={226} x2={167} y2={255} arrow/>
    {matrix.map((row,i)=><g key={i}><Text x={20} y={285+i*45}>row {i}: {n(row[0])}×{n(input[0])} + {n(row[1])}×{n(input[1])} = {n(output[i])}</Text></g>)}<Text x={20} y={375}>Mv={v(output)} = {n(eigenvalue)}v</Text><Text x={20} y={405}>λ_K={n(eigenvalue)}; vᵀMv={n(quadratic)}</Text>
  </Scene></div><Scene label={`${label}: original and output coefficient-space directions`} width={360} height={240}>
    <Wire x1={35} y1={120} x2={315} y2={120} arrow/><Wire x1={170} y1={220} x2={170} y2={20} arrow/><Wire x1={170} y1={120} x2={170 + input[0] * 50} y2={120 - input[1] * 50} hue={c.query} arrow/><Wire x1={170} y1={120} x2={170 + output[0] * 50} y2={120 - output[1] * 50} hue={c.second} arrow/>
    <Text x={20} y={235}>amber v; violet Mv; axes are row-ID coefficients</Text><Text x={180} y={25}>ID 1</Text><Text x={305} y={143}>ID 0</Text>{output.every(x => x === 0) && <Text x={180} y={105}>Mv = zero vector</Text>}
  </Scene></>;
}
export function SpectralWitness() {
  return <><Scene label="Two weighted duplicate feature vectors sum head-to-tail to zero, whose squared length is zero" width={540} height={190}><Text x={20} y={30}>feature vector φ₀=φ₁=(1); weights v=(1,−1)</Text><Wire x1={70} y1={90} x2={330} y2={90} hue={c.first} arrow/><Text x={155} y={70}>+φ₀</Text><Wire x1={330} y1={120} x2={70} y2={120} hue={c.second} arrow/><Text x={150} y={148}>−φ₁</Text><Text x={20} y={180}>sum zero → squared length 0; negative squared length is impossible</Text></Scene>
    <SpectralLane label="Valid singular duplicate W" matrix={[[1, 1], [1, 1]]} input={[1, -1]}/><SpectralLane label="Duplicate common direction" matrix={[[1, 1], [1, 1]]} input={[1, 1]}/><SpectralLane label="Invalid proposed matrix" matrix={[[2, 3], [3, 2]]} input={[1, -1]}/>
  </>;
}
export function RbfLength({ fit, setFit }) {
  const gamma = fit.gamma, [dx, setDx] = useState(1), dy = 1, squared = dx * dx + dy * dy;
  return <FlowLab label="Squared displacement determines Gaussian similarity"><Scene label="Two displacement coordinates square and sum before gamma and exponential" width={760} height={260}>
    {[{ title: 'Δx₁', value: dx, hue: c.first }, { title: 'Δx₂', value: dy, hue: c.second }].map((row, i) => <g key={i}><Port x={20} y={45 + i * 125} label={row.title} value={n(row.value)} hue={row.hue} width={105}/><Wire x1={125} y1={66 + i * 125} x2={160} y2={66 + i * 125} arrow/><Port x={160} y={45 + i * 125} label="square" value={n(row.value ** 2)} hue={row.hue} width={100}/><Wire x1={260} y1={66 + i * 125} x2={300} y2={126} arrow/></g>)}
    <Port x={300} y={105} label="sum d²" value={n(squared)} width={105}/><Wire x1={405} y1={126} x2={440} y2={126} arrow/><Port x={440} y={105} label="multiply −γ" value={n(-gamma * squared)} width={115}/><Wire x1={555} y1={126} x2={590} y2={126} arrow/><Port x={590} y={105} label="exp" value={n(Math.exp(-gamma * squared))} width={145}/>
  </Scene><Scene label="Distances zero, one and two RBF length scales" width={610} height={135}><Wire x1={60} y1={65} x2={550} y2={65} arrow/>{[0, 1, 2].map((multiple, i) => <g key={i}><circle cx={80 + i * 210} cy="65" r="5" fill={c.query}/><Text x={80 + i * 210} y={40} anchor="middle">d={n(multiple / Math.sqrt(gamma))}</Text><Text x={80 + i * 210} y={100} anchor="middle">K={['1', 'e⁻¹≈.36788', 'e⁻⁴≈.01832'][i]}</Text></g>)}</Scene>
    <FlowControls><FlowSlider name="Gamma γ (shared with kernel fit)" value={gamma} onChange={gamma => setFit({ ...fit, gamma })} min={.05} max={4} step={.05}/><FlowSlider name="First displacement coordinate" value={dx} onChange={setDx} min={-3} max={3} step={.1}/><Reset onClick={() => { setDx(1); setFit({ ...fit, gamma: .5 }); }}/></FlowControls><FlowReadout>d²={n(squared)} gives similarity {n(Math.exp(-gamma * squared))}; the e⁻¹ length is {n(1 / Math.sqrt(gamma))}. The fit view below uses this same γ.</FlowReadout></FlowLab>;
}
export function KernelPrediction({ fit, setFit, query, setQuery, revision, reset }) {
  const s = xorKernelState(fit.kind, fit.c, fit.gamma, query);
  return <FlowLab label="Fit symmetric XOR coefficients, then trace a separate query through all four supports">
    <Plane points={SVM_XOR_POINTS.map((x, i) => ({ x, y: SVM_XOR_LABELS[i], id: String(i), support: true }))} w={[0, 0]} range={2} size={400} query={query} field={point => xorScore(point, fit.kind, fit.c, fit.gamma)}/>
    <FlowControls><Select name="Kernel" value={fit.kind} onChange={kind => setFit({ ...fit, kind })} options={[['linear', 'Linear'], ['poly', 'Homogeneous polynomial degree 2'], ['rbf', 'Gaussian RBF']]}/><ExactInput name="C (.05–4)" value={fit.c} min={.05} max={4} onChange={c => setFit({ ...fit, c })} revision={revision}/><FlowSlider name="Gamma γ" value={fit.gamma} onChange={gamma => setFit({ ...fit, gamma })} min={.05} max={4} step={.05}/><Reset onClick={reset}/></FlowControls>
    <FlowReadout>Current fit: {fit.kind}, C={n(fit.c)}, γ={n(fit.gamma)}; λ_K={n(s.eigenvalue)}, every α={n(s.alpha)}, b=0. P={n(s.primal)}, D={n(s.dual)}. The shaded sampled score field uses these coefficients; its opacity is score magnitude, not probability.</FlowReadout>
    <Scene label="Query kernels multiply signed coefficients and join one score" width={890} height={390}>
      <Port x={20} y={150} label="query x" value={v(query)} hue={c.query} width={135}/>
      {s.contributions.map((row, i) => <g key={i}><Wire x1={155} y1={171} x2={205} y2={66 + i * 82} arrow/><Port x={205} y={45 + i * 82} label={`K(row ${i}, x), y=${row.label}`} value={n(row.kernel)} hue={row.label < 0 ? c.negative : c.positive} width={180}/><Wire x1={385} y1={66 + i * 82} x2={420} y2={66 + i * 82} arrow/><Port x={420} y={45 + i * 82} label={`× signed α y = ${n(row.alpha * row.label)}`} value={n(row.value)} hue={row.label < 0 ? c.negative : c.positive} width={230}/><Wire x1={650} y1={66 + i * 82} x2={705} y2={170} arrow/></g>)}<Port x={705} y={150} label="sum + b=0" value={n(s.score)} width={150}/><Text x={705} y={240} hue={s.prediction === 1 ? c.positive : c.negative}>class {s.prediction === 1 ? '+1' : '−1'}</Text>
    </Scene>
    <FlowControls><FlowSlider name="Query x₁" value={query[0]} onChange={x => setQuery([x, query[1]])} min={-2} max={2} step={.1}/><FlowSlider name="Query x₂" value={query[1]} onChange={y => setQuery([query[0], y])} min={-2} max={2} step={.1}/><Reset onClick={() => setQuery([.5, .5])}/></FlowControls><FlowReadout>Query {v(query)} uses the same {fit.kind}/C={n(fit.c)}/γ={n(fit.gamma)} state above and has score {n(s.score)}. Exact zero uses the scratch +1 tie rule.</FlowReadout>
    <ExactTable caption="Complete current XOR Gram" columns={['Row', '0', '1', '2', '3']} rows={s.gram.map((row, i) => [String(i), ...row.map(value => n(value))])}/>
  </FlowLab>;
}
export function PairInvestigation({ model, setModel, pair, setPair, commits, setCommits, revision = 0, reset, gainOnly = false }) {
  const s = svmPairStep(model.points, model.labels, model.alpha, model.c, pair[0], pair[1]);
  const px = a => 80 + 270 * a / model.c, py = a => 330 - 270 * a / model.c;
  const candidateI = model.alpha[pair[0]] - s.sign * s.bestDelta, candidateJ = model.alpha[pair[1]] + s.bestDelta;
  const commit = () => { if (commits < 16) { setModel({ ...model, alpha: s.after }); setCommits(x => x + 1); } };
  return <FlowLab label={gainOnly ? 'Maximize the legal one-dimensional pair gain' : 'A pair can move only along its balance segment'}>
    {!gainOnly ? <Scene label="Coefficient box and balance diagonal with old and proposed pair positions" width={430} height={405}>
      <rect x="80" y="60" width="270" height="270" fill="none" stroke={c.neutral}/><Text x={90} y={30}>0 ≤ αᵢ, αⱼ ≤ C={n(model.c)}</Text><Text x={230} y={385}>αᵢ</Text><Text x={15} y={180}>αⱼ</Text>
      <Wire x1={px(model.alpha[pair[0]] - s.sign * s.lower)} y1={py(model.alpha[pair[1]] + s.lower)} x2={px(model.alpha[pair[0]] - s.sign * s.upper)} y2={py(model.alpha[pair[1]] + s.upper)} hue={c.query}/>
      <Mark x={px(model.alpha[pair[0]])} y={py(model.alpha[pair[1]])} kind={0} label="old"/><circle cx={px(candidateI)} cy={py(candidateJ)} r="6" fill="none" stroke={c.query} strokeWidth="2"/><Wire x1={px(model.alpha[pair[0]])} y1={py(model.alpha[pair[1]])} x2={px(candidateI)} y2={py(candidateJ)} hue={c.query} arrow/>
      <Text x={80} y={360}>{s.sign === 1 ? 'same labels: αᵢ decreases as αⱼ grows' : 'opposite labels: both grow together'}</Text>
    </Scene> : <><Curve xmin={s.lower === s.upper ? s.lower - .1 : s.lower} xmax={s.lower === s.upper ? s.upper + .1 : s.upper} ymin={Math.min(0, ...s.curve.map(r => r.gain)) - .05} ymax={Math.max(.1, ...s.curve.map(r => r.gain)) + .05} xLabel="legal δ" yLabel="dual gain" curves={[{ name: 'gδ − ½qδ²', hue: c.query, fn: delta => s.g * delta - .5 * s.q * delta ** 2 }]} dots={[{ x: s.bestDelta, y: s.improvement, label: 'chosen δ' }]}/>
      <Scene label="Zero curvature chooses an endpoint; zero curvature and zero slope keep the old state" width={590} height={135}><Wire x1={55} y1={90} x2={255} y2={30} hue={c.query}/><Text x={50} y={120}>q=0, g=2: gain rises to δ=.7</Text><Wire x1={350} y1={90} x2={550} y2={90} hue={c.second}/><Text x={325} y={120}>q=0, g=0: keep δ=0</Text></Scene></>}
    {!gainOnly && <FlowControls><Select name="Distinct row pair" value={pair.join(',')} options={model.points.flatMap((_, i) => model.points.slice(i + 1).map((__, j) => [`${i},${i + j + 1}`, `Rows ${i} and ${i + j + 1}`]))} onChange={value => setPair(value.split(',').map(Number))}/><Select name="Compare input configuration" value={model.points.length === 2 && model.points.every(row => row.every(x => x === 0)) ? 'duplicate' : 'current'} options={ [['current', 'Current arbitrary state'], ['duplicate', 'Opposite labels at identical input']] } onChange={value => { if (value === 'duplicate') { setModel(svmPairFixture(true)); setPair([0, 1]); setCommits(0); } }}/><Reset onClick={reset}/></FlowControls>}
    <FlowControls><button type="button" onClick={commit} disabled={commits >= 16}>Commit both coefficients · {commits}/16</button>{gainOnly && <Reset onClick={reset}/>}</FlowControls>
    <FlowReadout>Legal δ∈[{n(s.lower)},{n(s.upper)}], g={n(s.g)}, q={n(s.q)}; chosen δ={n(s.bestDelta)}. The proposed α is {v(s.after)}, balance {n(s.balance)}, and dual gain {n(s.improvement)}.</FlowReadout>
    {!gainOnly && <PairEditor model={model} onApply={next => { setModel(next); setPair([0, 1]); setCommits(0); }} resetRevision={`${revision}:${commits === 0 ? JSON.stringify(model) : ''}`}/>} 
  </FlowLab>;
}
function PairEditor({ model, onApply, resetRevision }) {
  const [draft, setDraft] = useState(() => structuredClone(model)), [row, setRow] = useState(0), [dimension, setDimension] = useState(0), [error, setError] = useState(''), [revision, setRevision] = useState(0), [json, setJson] = useState('');
  useEffect(() => { setDraft(structuredClone(model)); setRow(0); setError(''); setRevision(v => v + 1); }, [resetRevision]);
  const changeRow = (field, value) => setDraft(prev => ({ ...prev, [field]: prev[field].map((item, i) => i === row ? value : item) }));
  const apply = value => { try { svmPairStep(value.points, value.labels, value.alpha, value.c, 0, 1); onApply(structuredClone(value)); setError(''); } catch (e) { setError(e.message); } };
  return <div className="svm-flow-editor"><p>To investigate arbitrary rows, edit this pending state and apply the complete feasible vector. Until then, the diagram uses the committed state above. Every row needs two finite coordinates in [−6,6], a ±1 label and α in [0,C]; both labels and balance within 10⁻⁹ are required.</p>
    <ExactTable caption="Pending two-feature pair state" columns={['Row', 'x', 'y', 'α']} rows={draft.points.map((point, i) => [String(i), v(point), draft.labels[i], n(draft.alpha[i])])}/>
    <p>How many observations and how large a coefficient box?</p><FlowControls><ExactInput name="Pending row count (2–8)" value={draft.points.length} min={2} max={8} integer revision={revision} onChange={count => { const points = Array.from({ length: count }, (_, i) => draft.points[i] || [0, 0]), labels = Array.from({ length: count }, (_, i) => draft.labels[i] ?? (i ? 1 : -1)), alpha = Array.from({ length: count }, (_, i) => draft.alpha[i] ?? 0); setDraft({ ...draft, points, labels, alpha }); setRow(Math.min(row, count - 1)); }}/><ExactInput name="Pending C (.05–4)" value={draft.c} onChange={c => setDraft({ ...draft, c })} min={.05} max={4} revision={revision}/></FlowControls>
    <p>Which coordinate belongs to which observation?</p><FlowControls><Select name="Pending row" value={row} options={draft.points.map((_, i) => [i, `Row ${i}`])} onChange={value => setRow(Number(value))}/><Select name="Feature coordinate" value={dimension} onChange={value => setDimension(Number(value))} options={[[0, 'x₁'], [1, 'x₂']]}/><ExactInput name="Pending coordinate" value={draft.points[row][dimension]} onChange={value => changeRow('points', draft.points[row].map((x, i) => i === dimension ? value : x))} min={-6} max={6} revision={revision}/></FlowControls>
    <p>What is the selected row's label?</p><FlowControls><Select name="Pending label" value={draft.labels[row]} onChange={value => changeRow('labels', Number(value))} options={[[-1, '−1'], [1, '+1']]}/></FlowControls>
    <p>What coefficient mass does this row carry?</p><FlowControls><ExactInput name="Pending α" value={draft.alpha[row]} onChange={value => changeRow('alpha', value)} min={0} max={4} revision={revision}/><button type="button" onClick={() => apply(draft)}>Apply entire feasible state</button><Reset onClick={() => { setDraft(structuredClone(model)); setRow(0); setDimension(0); setError(''); setJson(''); setRevision(v => v + 1); }}/></FlowControls>
    {error && <p role="alert" className="svm-flow-error">{error} The committed diagram remains unchanged.</p>}
    <p>Optional exact state exchange uses JSON with points (2–8 arrays of two numbers), labels (±1), alpha (one per row), and c (.05–4). It applies the same full-state validation.</p><label>Optional state JSON<textarea value={json} onChange={e => setJson(e.target.value)}/></label><FlowControls><button type="button" onClick={() => { try { const parsed = JSON.parse(json); svmPairStep(parsed.points, parsed.labels, parsed.alpha, parsed.c, 0, 1); setDraft(structuredClone(parsed)); setRow(0); apply(parsed); } catch (e) { setError(e.message); } }}>Apply JSON state</button><button type="button" onClick={() => setJson(JSON.stringify(model, null, 2))}>Export committed state</button></FlowControls>
  </div>;
}
export function MaintainedGradient() {
  const p = observations['svm-mechanisms'].changed_pair;
  return <><Scene label="Both changed Q columns feed every gradient entry" width={950} height={315}>
    <Grid x={90} y={55} matrix={p.Q} rows={['ID 0', 'ID 1', 'ID 2']} columns={['ID 0', 'ID 1', 'ID 2']} rowHues={[c.first,c.second,c.positive]} columnHues={[c.first,c.second,c.positive]} selectedColumns={[0, 2]} cell={100}/>
    {p.G_before.map((value, i) => <g key={i}><Wire x1={390} y1={80 + i * 48} x2={425} y2={80 + i * 48} arrow/><Text x={435} y={85 + i * 48} hue={[c.first,c.second,c.positive][i]}>{n(value)} − {n(p.Q[i][0])}×δ − {n(p.Q[i][2])}×δ</Text><Wire x1={795} y1={80 + i * 48} x2={830} y2={80 + i * 48} arrow/><Text x={840} y={85 + i * 48} hue={[c.first,c.second,c.positive][i]}>{n(p.G_after[i])}</Text></g>)}
    <Text x={25} y={255}>old α={v(p.alpha_before)}; pair IDs 0/2; δ={n(p.delta)}</Text><Text x={25} y={285}>simultaneous new α={v(p.alpha_after)}; Gnew=Gold−Q[:,0]δ−Q[:,2]δ</Text>
  </Scene><ExactTable caption="Saved changed-pair arithmetic, with complete numeric precision" columns={['ID', 'G old', 'Q[:,0]δ', 'Q[:,2]δ', 'G new']} rows={p.G_before.map((g, i) => [i, String(g), String(p.Q[i][0] * p.delta), String(p.Q[i][2] * p.delta), String(p.G_after[i])])}/></>;
}
export function SavedSolver() {
  const [index, setIndex] = useState(0), record = observations['svm-mechanisms'], fit = record.fits[index];
  return <FlowLab label="Inspect saved solver certificates and owned state without running a fit"><Scene label="Actual saved primal and dual values at recorded iteration steps" width={610} height={330}>
    <Wire x1={75} y1={265} x2={550} y2={265} arrow/><Wire x1={75} y1={265} x2={75} y2={35} arrow/><Text x={75} y={25}>objective P / D</Text><Text x={250} y={315}>saved iteration</Text>
    {fit.trace.map((row, i) => <g key={i}>{[['primal', c.query], ['dual', c.first]].map(([field, hue]) => { const x = 95 + row.step / fit.steps * 390, y = 265 - row[field] / 5 * 210; return <g key={field}><circle cx={x} cy={y} r="5" fill={hue}/><Text x={x + (i === 0 ? 12 : -15)} y={y + (field === 'primal' ? -17 : 26)} anchor={i ? 'end' : 'start'} hue={hue}>{field === 'primal' ? 'P' : 'D'}={n(row[field])}</Text></g>; })}<Text x={95 + row.step / fit.steps * 390} y={293} anchor="middle">{row.step}</Text></g>)}
  </Scene><FlowControls><Select name="Recorded kernel fit" value={index} options={[[0, 'Linear, ten updates'], [1, 'RBF, twenty-two updates']]} onChange={value => setIndex(Number(value))}/><Reset onClick={() => setIndex(0)}/></FlowControls><FlowReadout>{fit.kernel}: {fit.status}; final P={n(fit.primal)}, D={n(fit.dual)}, gap={n(fit.gap)}. This did not pass the requested relative 10⁻⁹ gap criterion. Dots are recorded states; intervening iterations are not invented.</FlowReadout>
    <ExactTable caption="Owned six-row training state; feature order coordinate_a, coordinate_b; classes −1,+1" columns={['Row ID', 'x', 'y', 'α', 'signed αy']} rows={record.fit_inputs.x.map((row, i) => [`new-${i}`, v(row), record.fit_inputs.y[i], n(fit.alpha[i]), n(fit.alpha[i] * record.fit_inputs.y[i])])}/><p>Stored bias {n(fit.bias)}, C=.8, γ=.7. The saved query/library score difference is {n(fit.max_score_difference)}; score agreement does not convert the stop status into a certificate pass.</p>
  </FlowLab>;
}

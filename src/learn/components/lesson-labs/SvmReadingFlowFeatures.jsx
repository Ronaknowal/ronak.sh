import { useEffect, useId, useMemo, useState } from 'react';
import { FlowLab, FlowSlider } from './LessonFlow.jsx';
import { spectrumCounts, dot, sum, featureMatrix, nystrom, rbfMatrix, rffTransform, browserFrequencies } from '../../data/svm-reading-flow-models.js';
import observations from '../../data/svm-reading-flow-observations.js';
import { Scene, Text, Wire, Port, Mark, Grid, number as n, vectorText as v, colors as c, FlowControls, FlowReadout, ExactInput, Select, Reset, ExactTable } from './SvmReadingFlowDrawing.jsx';

const wordHue = word => ({ AA: c.first, AC: c.positive, CA: c.second, CC: c.query })[word] || (word[0] === 'A' ? c.first : c.second);
function SequenceEntry({ label, value, onChange, revision }) {
  const id = useId(), [draft, setDraft] = useState(value), [error, setError] = useState('');
  useEffect(() => { setDraft(value); setError(''); }, [value, revision]);
  const apply = () => { try { spectrumCounts(draft, 1); onChange(draft); setError(''); } catch (e) { setError(e.message); } };
  return <div className="svm-flow-exact"><label htmlFor={id}>{label}</label><span className="svm-flow-entry"><input id={id} aria-describedby={error ? `${id}-error` : undefined} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}/><button type="button" onClick={apply}>Apply</button></span>{error && <span id={`${id}-error`} role="alert">{error} Last valid sequence remains visible.</span>}</div>;
}
export function SequenceWindows() {
  const [left, setLeft] = useState('ACACA'), [right, setRight] = useState('CACAC'), [k, setK] = useState(2), [revision, setRevision] = useState(0), strings = [left, right, 'AACCA'], rows = strings.map(text => spectrumCounts(text, k));
  const words = Array.from({ length: 2 ** k }, (_, i) => i.toString(2).padStart(k, '0').replaceAll('0', 'A').replaceAll('1', 'C'));
  const counts = rows.map(row => words.map(word => row.counts[word] || 0)), raw = dot(counts[0], counts[1]), norm = Math.sqrt(dot(counts[0], counts[0]) * dot(counts[1], counts[1]));
  const reset = () => { setLeft('ACACA'); setRight('CACAC'); setK(2); setRevision(r => r + 1); };
  return <FlowLab label="Overlapping sequence windows become named count coordinates">
    <Scene label="The first sequence's overlapping pieces enter their identity bins" width={Math.max(630, words.length * 100 + 40, rows[0].windows.length * 52 + 70)} height={345}>
      <Text x={20} y={30}>first sequence “{left}”; each window has {k} letters</Text>{rows[0].windows.map((window, i) => <g key={i}><Text x={35 + i * 52} y={72} hue={wordHue(window.word)}>{window.word}</Text><Text x={35 + i * 52} y={100}>at {window.index}</Text><Wire x1={45 + i * 52} y1={110} x2={70 + words.indexOf(window.word) * 100} y2={180} hue={wordHue(window.word)} arrow/></g>)}
      {words.map((word, i) => <Port key={word} x={20 + i * 100} y={180} label={word} value={counts[0][i]} hue={wordHue(word)} width={90}/>)}<Text x={20} y={270}>Named coordinates retain piece identity when the window's position moves.</Text><Text x={20} y={310}>{rows[0].windows.length ? `${rows[0].windows.length} overlapping windows counted` : 'No windows: the feature vector is zero.'}</Text>
    </Scene>
    <FlowControls><SequenceEntry label="First A/C sequence (0–12 letters)" value={left} onChange={setLeft} revision={revision}/><SequenceEntry label="Second A/C sequence (0–12 letters)" value={right} onChange={setRight} revision={revision}/><Reset onClick={reset}/></FlowControls>
    <FlowReadout>The unnormalized kernel between the two current strings is {raw}; normalized similarity is {norm ? n(raw / norm) : 'undefined because at least one count vector is zero'}.</FlowReadout>
    <p>Which piece length defines the coordinate schema for both strings?</p><FlowControls><FlowSlider name="Word length k" value={k} onChange={setK} min={1} max={3} step={1}/><Reset onClick={() => setK(2)}/></FlowControls>
    <ExactTable caption="Complete count vectors, with the conserved third sequence AACCA" columns={['String', ...words]} rows={strings.map((text, i) => [text === '' ? '(empty)' : text, ...counts[i]])}/>
    <Scene label="Count-coordinate products join the sequence kernel" width={Math.max(630, words.length * 100 + 40)} height={180}>{words.map((word, i) => <g key={word}><Port x={20 + i * 100} y={55} label={word} value={`${counts[0][i]}×${counts[1][i]}`} hue={wordHue(word)} width={90}/><Text x={65 + i * 100} y={130} anchor="middle" hue={wordHue(word)}>{counts[0][i] * counts[1][i]}</Text></g>)}<Text x={20} y={172}>sum all matching-coordinate products = {raw}</Text></Scene>
  </FlowLab>;
}
export function StorageRoutes() {
  const [rows, setRows] = useState(10000), [supports, setSupports] = useState(200), [features, setFeatures] = useState(13), [revision, setRevision] = useState(0);
  return <FlowLab label="Count exact Gram storage separately from support and linear prediction routes"><Scene label="A full n by n Gram, separate bounded cache, support subset and collapsed linear weight" width={850} height={395}>
    {Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => <rect key={`${i}-${j}`} x={25 + j * 21} y={55 + i * 21} width="21" height="21" stroke="#747e91" fill={i < 2 ? '#89baff20' : 'none'}/>))}
    <Text x={25} y={30}>full Gram n×n</Text><Text x={25} y={250}>8n² = {8 * rows ** 2} bytes</Text><Text x={25} y={282}>grid depicts storage shape, not 64 observations</Text>
    <rect x="320" y="55" width="160" height="82" fill="none" stroke={c.query}/><Text x={333} y={85}>bounded cache</Text><Text x={333} y={112}>separate policy</Text>
    <Text x={540} y={30}>query-to-support route</Text>{Array.from({length:Math.min(4,supports)},(_,i) => <g key={i}><circle cx={565} cy={70 + i * 45} r="5" fill={c.neutral}/><Wire x1={570} y1={70 + i * 45} x2={630} y2={145} arrow/></g>)}{supports===0&&<Text x={535} y={78}>empty support state</Text>}<Port x={630} y={125} label="nSV kernel comparisons" value={supports} width={155}/><Text x={540} y={245}>work ∝ nSV×d = {supports * features}</Text><Text x={540} y={277}>marks depict the route, not all nSV rows</Text>
    <Wire x1={330} y1={330} x2={450} y2={330} arrow/><Port x={450} y={309} label="linear collapsed w·x+b" value={`${features} matching products`} width={310}/><Text x={25} y={365}>Training storage ≠ persistent support state ≠ one-query work; no timing is inferred.</Text>
  </Scene><FlowControls><ExactInput name="Training count n" value={rows} min={1} max={1000000} integer revision={revision} onChange={value => { setRows(value); setSupports(Math.min(value, supports)); }}/><ExactInput name="Support count nSV" value={supports} min={0} max={rows} integer revision={revision} onChange={setSupports}/><ExactInput name="Feature count d" value={features} min={1} max={20} integer revision={revision} onChange={setFeatures}/><Reset onClick={() => { setRows(10000); setSupports(200); setFeatures(13); setRevision(r => r + 1); }}/></FlowControls><FlowReadout>At n={rows}, a dense float64 Gram alone occupies {8 * rows ** 2} bytes ({n(8 * rows ** 2 / 1e6)} decimal MB). Query work depends on the retained {supports} support rows and {features} features; a linear score can use one collapsed weight vector.</FlowReadout></FlowLab>;
}
export function FeatureEditor({ state, setState, revision }) {
  const [row, setRow] = useState(0), [feature, setFeature] = useState(0), [queryRow, setQueryRow] = useState(0);
  useEffect(() => { setRow(0); setFeature(0); setQueryRow(0); }, [revision]);
  const rows = state.training.length, dimensions = state.training[0].length, queryRows = state.queries.length;
  // The other mounted editor can resize shared matrices before effects run.
  // Resolve every address during render, then synchronize the local selections.
  const activeRow = Math.min(row, rows - 1), activeFeature = Math.min(feature, dimensions - 1), activeQueryRow = Math.min(queryRow, queryRows - 1);
  useEffect(() => {
    setRow(index => Math.min(index, rows - 1));
    setFeature(index => Math.min(index, dimensions - 1));
    setQueryRow(index => Math.min(index, queryRows - 1));
  }, [rows, dimensions, queryRows]);
  const changeShape = (count, d) => { const resize = (matrix, nRows) => Array.from({ length: nRows }, (_, i) => Array.from({ length: d }, (_, j) => matrix[i]?.[j] ?? 0)); const training = resize(state.training, count), queries = resize(state.queries, state.queries.length); setState({ ...state, training, queries, indices: state.indices.filter(i => i < count).length ? state.indices.filter(i => i < count) : [0] }); setRow(Math.min(row, count - 1)); setFeature(Math.min(feature, d - 1)); };
  const edit = (field, r, value) => setState({ ...state, [field]: state[field].map((values, i) => i === r ? values.map((x, j) => j === activeFeature ? value : x) : values) });
  return <div className="svm-flow-editor"><p>These training and query matrices are shared by the RFF and Nyström views. Both use 1–100 rows, the same 1–20 named feature coordinates and finite values in [−1000,1000]. New rows/coordinates start at zero.</p>
    <FlowControls><ExactInput name="Training row count" value={rows} min={1} max={100} integer revision={revision} onChange={value => changeShape(value, dimensions)}/><ExactInput name="Feature count" value={dimensions} min={1} max={20} integer revision={revision} onChange={value => changeShape(rows, value)}/></FlowControls>
    <p>Which training measurement do you want to change?</p><FlowControls><Select name="Training row ID" value={activeRow} options={state.training.map((_, i) => [i, `train-${i}`])} onChange={value => setRow(Number(value))}/><Select name="Feature identity" value={activeFeature} options={state.training[0].map((_, i) => [i, `coordinate ${i}`])} onChange={value => setFeature(Number(value))}/><ExactInput name="Training coordinate" value={state.training[activeRow][activeFeature]} min={-1000} max={1000} revision={`${revision}:${activeRow}:${activeFeature}:${rows}:${dimensions}`} onChange={value => edit('training', activeRow, value)}/></FlowControls>
    <p>How many new query observations use that same feature schema?</p><FlowControls><ExactInput name="Query row count" value={state.queries.length} min={1} max={100} integer revision={revision} onChange={count => { setState({ ...state, queries: Array.from({ length: count }, (_, i) => state.queries[i] || Array(dimensions).fill(0)) }); setQueryRow(Math.min(queryRow, count - 1)); }}/></FlowControls>
    <p>Change one query coordinate without changing the saved training addresses.</p><FlowControls><Select name="Query row ID" value={activeQueryRow} options={state.queries.map((_, i) => [i, `query-${i}`])} onChange={value => setQueryRow(Number(value))}/><Select name="Query feature identity" value={activeFeature} options={state.queries[0].map((_, i) => [i, `coordinate ${i}`])} onChange={value => setFeature(Number(value))}/><ExactInput name="Query coordinate" value={state.queries[activeQueryRow][activeFeature]} min={-1000} max={1000} revision={`${revision}:${activeQueryRow}:${activeFeature}:${queryRows}:${dimensions}`} onChange={value => edit('queries', activeQueryRow, value)}/></FlowControls>
    <ExactTable caption="Full active training and query matrix state" columns={['Row identity', ...state.training[0].map((_, i) => `coordinate ${i}`)]} rows={[...state.training.map((row, i) => [`train-${i}`, ...row.map(x => n(x))]), ...state.queries.map((row, i) => [`query-${i}`, ...row.map(x => n(x))])]}/>
  </div>;
}
export function FourierFeatures({ state, setState, revision, reset }) {
  const [components, setComponents] = useState(12), [selected, setSelected] = useState(0), saved = observations['kernel-feature-mechanisms'];
  const dimensions = state.training[0].length, exactDraw = dimensions === 2 && components === 12;
  const frequencies = useMemo(() => exactDraw ? { omega: saved.rff.omega.map(row => row.map(x => x * Math.sqrt(state.gamma / .45))), phase: saved.rff.phase } : browserFrequencies(dimensions, components, state.gamma), [dimensions, components, state.gamma]);
  const active = Math.min(selected, components - 1);
  const train = rffTransform(state.training, frequencies.omega, frequencies.phase), query = rffTransform(state.queries, frequencies.omega, frequencies.phase), z = train[0], projection = dot(state.training[0], frequencies.omega.map(row => row[active]));
  const finiteGram = train.map(row => train.map(other => dot(row, other))), exact = rbfMatrix(state.training, state.training, state.gamma), difference = Math.max(...finiteGram.flatMap((row, i) => row.map((x, j) => Math.abs(x - exact[i][j]))));
  const queryDot = dot(query[0], train[0]), exactQuery = rbfMatrix([state.queries[0]], [state.training[0]], state.gamma)[0][0];
  useEffect(() => setSelected(i => Math.min(i, components - 1)), [components]);
  return <FlowLab label="Trace a random Fourier coordinate and compare the realized finite kernel"><Scene label="Hand frequencies expose dot, phase, cosine and scale operations without claiming a random draw" width={970} height={260}>
    {[{ omega: '[1,0]', dot: .5, phase: 0, feature: Math.cos(.5), hue: c.first }, { omega: '[0,1]', dot: -.25, phase: Math.PI / 2, feature: Math.sin(.25), hue: c.second }].map((row, i) => <g key={i}><Port x={20} y={55 + i * 125} label={`hand ω${i + 1}`} value={row.omega} hue={row.hue} width={105}/><Wire x1={125} y1={76 + i * 125} x2={160} y2={76 + i * 125} arrow/><Port x={160} y={55 + i * 125} label="dot x=(.5,−.25)" value={n(row.dot)} hue={row.hue} width={200}/><Wire x1={360} y1={76 + i * 125} x2={395} y2={76 + i * 125} arrow/><Port x={395} y={55 + i * 125} label={`phase +${i ? 'π/2' : '0'}`} value={n(row.dot + row.phase)} hue={row.hue} width={170}/><Wire x1={565} y1={76 + i * 125} x2={600} y2={76 + i * 125} arrow/><Port x={600} y={55 + i * 125} label="cos then ×√(2/2)" value={n(row.feature)} hue={row.hue} width={230}/></g>)}
  </Scene><Scene label="One active frequency's full coordinate construction from the current first training row" width={850} height={190}>
    <Port x={20} y={65} label={`train-0 · ω${active}`} value={n(projection)} hue={c.first} width={180}/><Wire x1={200} y1={86} x2={235} y2={86} arrow/><Port x={235} y={65} label={`add phase ${n(frequencies.phase[active])}`} value={n(projection + frequencies.phase[active])} hue={c.first} width={240}/><Wire x1={475} y1={86} x2={510} y2={86} arrow/><Port x={510} y={65} label={`cos ×√(2/${components})`} value={n(z[active])} hue={c.first} width={225}/><Text x={20} y={165}>Feature identity {active} retains its hue through this operation.</Text>
  </Scene><FlowControls><ExactInput name="Gamma γ (10⁻⁴–10)" value={state.gamma} min={.0001} max={10} revision={revision} onChange={gamma => setState({ ...state, gamma })}/><ExactInput name="Fourier component count" value={components} min={1} max={100} integer revision={revision} onChange={setComponents}/><Reset onClick={() => { setComponents(12); setSelected(0); reset(); }}/></FlowControls>
    <FlowReadout>{exactDraw ? 'The 2×12 frequency/phase draw is the stored NumPy seed-17 state; γ rescales its fixed normal draws.' : 'This changed shape uses the separately seeded browser LCG/Box–Muller draw, not NumPy coordinate parity.'} The realized training-Gram maximum error is {n(difference)}; a finite feature Gram is a dot matrix and therefore PSD, while remaining an approximation to RBF.</FlowReadout>
    <FlowControls><Select name="Coordinate to trace" value={selected} options={Array.from({ length: components }, (_, i) => [i, `feature ${i}`])} onChange={value => setSelected(Number(value))}/></FlowControls>
    <ExactTable caption="Owned frequency and phase state" columns={['Feature identity', ...state.training[0].map((_, i) => `ω coordinate ${i}`), 'phase']} rows={Array.from({ length: components }, (_, j) => [j, ...frequencies.omega.map(row => n(row[j])), n(frequencies.phase[j])])}/>
    <ExactTable caption="Complete transformed training and query feature coordinates" columns={['Row identity', ...Array.from({ length: components }, (_, i) => `z${i}`)]} rows={[...train.map((row, i) => [`train-${i}`, ...row.map(x => n(x))]), ...query.map((row, i) => [`query-${i}`, ...row.map(x => n(x))])]}/>
    <Scene label="Matching query and training Fourier coordinates multiply before their finite kernel sum" width={Math.max(650, components * 105 + 180)} height={285}>
      <Grid x={145} y={65} cell={105} matrix={[query[0], train[0], query[0].map((x, j) => x * train[0][j])]} rows={['query-0 z', 'train-0 z', 'matching product']} columns={Array.from({ length: components }, (_, i) => `feature ${i}`)} rowHues={[c.query,c.first,c.computed]}/><Text x={20} y={255}>sum products = {n(queryDot)}; exact RBF = {n(exactQuery)}; finite difference = {n(queryDot - exactQuery)}</Text>
    </Scene>
    <FeatureEditor state={state} setState={setState} revision={revision}/>
  </FlowLab>;
}
function LandmarkEntry({ state, onChange, revision }) {
  const id = useId(), [draft, setDraft] = useState(state.indices.join(', ')), [error, setError] = useState('');
  useEffect(() => { setDraft(state.indices.join(', ')); setError(''); }, [state.indices.join(','), revision]);
  const apply = () => { try { if (!draft.trim() || draft.split(',').some(x => !/^\s*\d+\s*$/.test(x))) throw Error('Enter comma-separated unique integer training row addresses.'); const indices = draft.split(',').map(Number); nystrom(state.training, indices, state.gamma, state.cutoff, state.queries); onChange(indices); setError(''); } catch (e) { setError(e.message); } };
  return <div className="svm-flow-exact"><label htmlFor={id}>Training landmark row IDs, in order</label><span className="svm-flow-entry"><input id={id} aria-describedby={error ? `${id}-error` : undefined} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}/><button type="button" onClick={apply}>Apply</button></span>{error && <span id={`${id}-error`} role="alert">{error} Last valid landmark state remains visible.</span>}</div>;
}
export function NystromFeatures({ state, setState, revision, reset }) {
  const [similarity, setSimilarity] = useState(.39752398781664455), [similarityRevision, setSimilarityRevision] = useState(0), [direction, setDirection] = useState(0);
  const result = useMemo(() => nystrom(state.training, state.indices, state.gamma, state.cutoff, state.queries), [state]);
  const retained = result.keep[direction] ?? result.keep[0], selectedBasis = result.basis.map(row => row[retained]), lambda = result.eigenvalues[retained];
  useEffect(() => setDirection(i => Math.min(i, result.keep.length - 1)), [result.keep.length]);
  const projection = result.B.map(row => dot(row, selectedBasis));
  return <FlowLab label="Project similarities onto retained landmark directions before inverse-root scaling">
    <div className="svm-flow-desktop"><Scene label="Duplicate landmark rows act on unit common and difference coefficient directions" width={800} height={365}>
      <Grid x={95} y={65} matrix={[[1, 1], [1, 1]]} rows={['ID 0', 'ID 1']} columns={['ID 0', 'ID 1']} cell={95}/>
      <Text x={340} y={50}>u₊=(1,1)/√2; u₋=(1,−1)/√2</Text><Text x={340} y={90}>both lengths 1; u₊·u₋=0</Text><Text x={340} y={135}>W u₊=(√2,√2)=2u₊</Text><Text x={340} y={180}>W u₋=(0,0)=0u₋</Text>
      <Wire x1={140} y1={290} x2={195} y2={235} hue={c.first} arrow/><Wire x1={140} y1={290} x2={195} y2={345} hue={c.second} arrow/><Text x={20} y={290}>coefficient space</Text><Text x={210} y={237} hue={c.first}>common direction</Text><Text x={210} y={348} hue={c.second}>difference direction</Text><Text x={380} y={275}>row 0/1: 1×(1/√2)+1×(1/√2)=√2</Text><Text x={380} y={315}>row 0/1: 1×(1/√2)+1×(−1/√2)=0</Text>
    </Scene><Scene label="A query's duplicate similarities project and scale to one coordinate; the zero direction is discarded" width={920} height={300}>
      <Port x={20} y={70} label="B columns IDs 0,1" value={`[${n(similarity)}, ${n(similarity)}]`} width={220}/><Wire x1={240} y1={91} x2={275} y2={91} hue={c.first} arrow/><Port x={275} y={70} label="B·u₊ = k/√2+k/√2" value={n(Math.SQRT2 * similarity)} hue={c.first} width={275}/><Wire x1={550} y1={91} x2={590} y2={91} hue={c.first} arrow/><Port x={590} y={70} label="divide √λ₊=√2" value={`feature ${n(similarity)}`} hue={c.first} width={240}/>
      <Wire x1={240} y1={91} x2={275} y2={216} hue={c.second} arrow/><Port x={275} y={195} label="B·u₋ = k/√2−k/√2" value="0" hue={c.second} width={275}/><Text x={590} y={210}>λ₋=0 ≤ cutoff 2×10⁻¹²</Text><Text x={590} y={245}>discard; no 1/√0 operation</Text>
    </Scene></div><div className="svm-flow-compact">
      <Scene label="Duplicate landmark Gram with named training identities" width={340} height={190}><Grid x={95} y={55} cell={85} matrix={[[1,1],[1,1]]} rows={['ID 0','ID 1']} columns={['ID 0','ID 1']}/><Text x={20} y={182}>Both IDs have coordinate (.6,−.4).</Text></Scene>
      <Scene label="Unit common and difference directions, their actual row products and eigenvalues" width={360} height={350}>
        <Text x={20} y={30}>u₊=(1,1)/√2; u₋=(1,−1)/√2</Text><Text x={20} y={62}>lengths 1; u₊·u₋=0</Text><Text x={20} y={108}>W row × u₊: 1/√2 + 1/√2 = √2</Text><Text x={20} y={145}>W row × u₋: 1/√2 − 1/√2 = 0</Text>
        <Wire x1={120} y1={240} x2={200} y2={160} hue={c.first} arrow/><Wire x1={120} y1={240} x2={200} y2={320} hue={c.second} arrow/><Text x={215} y={200} hue={c.first}>Wu₊=2u₊</Text><Text x={215} y={293} hue={c.second}>Wu₋=0u₋</Text><Text x={20} y={343}>λ₊=2 retained; λ₋=0 discarded</Text>
      </Scene>
      <Scene label="Common-direction projection and inverse-root scaling, stacked" width={350} height={345}>
        <Port x={20} y={45} label="B columns IDs 0,1" value={`[${n(similarity)}, ${n(similarity)}]`} width={310}/><Wire x1={175} y1={87} x2={175} y2={150} hue={c.first} arrow/>
        <Port x={20} y={150} label="B·u₊ = k/√2 + k/√2" value={n(Math.SQRT2*similarity)} hue={c.first} width={310}/><Wire x1={175} y1={192} x2={175} y2={255} hue={c.first} arrow/>
        <Port x={20} y={255} label="divide √λ₊ = √2" value={`feature ${n(similarity)}`} hue={c.first} width={310}/>
      </Scene>
      <Scene label="The difference projection is zero and has no inverse-root operation" width={350} height={190}><Port x={20} y={45} label="B·u₋ = k/√2 − k/√2" value="0" hue={c.second} width={310}/><Text x={20} y={125}>λ₋=0 ≤ cutoff 2×10⁻¹²</Text><Text x={20} y={163}>discard; never form 1/√0</Text></Scene>
    </div><FlowControls><ExactInput name="Hand duplicate similarity k (0–1)" value={similarity} min={0} max={1} revision={`${revision}:${similarityRevision}`} onChange={setSimilarity}/><Reset onClick={() => { setSimilarity(.39752398781664455); setSimilarityRevision(r => r + 1); }}/></FlowControls><FlowReadout>Duplicate-location features are 1 and 1; this row's feature is {n(similarity)}, its self-dot {n(similarity ** 2)}, and its dot with either duplicate row {n(similarity)}. The saved third-row k=exp(−.45×2.05)=.39752398781664455.</FlowReadout>
    <p>Now use the complete current training and query matrices. The initial landmark order [4,1,0] matches the stored new program; unique addresses can still contain equal coordinate rows.</p>
    <Scene label="Complete landmark Gram with both training identities; retained directions and eigenvalues" width={Math.max(640, state.indices.length * 100 + 170)} height={state.indices.length * 48 + 150}>
      <Grid x={140} y={70} cell={100} matrix={result.W} rows={state.indices.map(i => `train-${i}`)} columns={state.indices.map(i => `train-${i}`)}/><Text x={20} y={state.indices.length * 48 + 125}>W is {state.indices.length}×{state.indices.length}; rank {result.keep.length}; cutoff {n(result.cutoff)}</Text>
    </Scene>
    <FlowControls><ExactInput name="Gamma γ (10⁻⁴–10)" value={state.gamma} min={.0001} max={10} revision={revision} onChange={gamma => setState({ ...state, gamma })}/><ExactInput name="Relative eigenvalue cutoff (0–1)" value={state.cutoff} min={Number.MIN_VALUE} max={1 - Number.EPSILON} revision={revision} onChange={cutoff => { nystrom(state.training, state.indices, state.gamma, cutoff, state.queries); setState({ ...state, cutoff }); }}/><Reset onClick={() => { setSimilarity(.39752398781664455); setDirection(0); reset(); }}/></FlowControls>
    <FlowControls><LandmarkEntry state={state} onChange={indices => setState({ ...state, indices })} revision={revision}/></FlowControls>
    <ExactTable caption="Every eigenvalue and its retention decision" columns={['Direction ID', 'λ', 'Cutoff', 'Retain?']} rows={result.eigenvalues.map((e, i) => [i, String(e), String(result.cutoff), result.keep.includes(i) ? 'yes' : 'no'])}/>
    <FlowControls><Select name="Retained direction to trace" value={direction} options={result.keep.map((k, i) => [i, `direction ${k}, λ=${n(result.eigenvalues[k])}`])} onChange={value => setDirection(Number(value))}/></FlowControls>
    <ExactTable caption="Complete stored eigenbasis for the training landmark order" columns={['Training landmark ID', ...result.eigenvalues.map((_, i) => `u direction ${i}`)]} rows={result.basis.map((row, i) => [`train-${state.indices[i]}`, ...row.map(x => n(x))])}/>
    <Scene label="All query similarities with named landmark columns" width={Math.max(650, state.indices.length * 110 + 160)} height={state.queries.length * 48 + 125}><Grid x={130} y={65} cell={110} matrix={result.B} rows={state.queries.map((_, i) => `query-${i}`)} columns={state.indices.map(i => `train-${i}`)}/></Scene>
    <ExactTable caption={`Direction ${retained}: matching landmark products, projection and inverse-root feature`} columns={['Query row ID', ...state.indices.map((id, j) => `B(train-${id})×u=${n(selectedBasis[j])}`), 'projection sum', 'divide √λ', 'feature']} rows={result.B.map((row, i) => [`query-${i}`, ...row.map((x, j) => n(x * selectedBasis[j])), n(projection[i]), n(Math.sqrt(lambda)), n(projection[i] / Math.sqrt(lambda))])}/>
    <Scene label={`Actual query-0 landmark products feed projection and scaling for retained direction ${retained}`} width={Math.max(870, state.indices.length * 110 + 760)} height={310}>
      <Grid x={140} y={65} cell={110} matrix={[result.B[0], selectedBasis, result.B[0].map((x, j) => x * selectedBasis[j])]} rows={['query-0 B', `direction ${retained} u`, 'B × u product']} columns={state.indices.map(i => `train-${i}`)} rowHues={[c.query,c.second,c.computed]}/>
      <Wire x1={140 + state.indices.length * 110} y1={185} x2={180 + state.indices.length * 110} y2={155} arrow/><Port x={180 + state.indices.length * 110} y={135} label="sum matching products" value={n(projection[0])} width={205}/>
      <Wire x1={385 + state.indices.length * 110} y1={156} x2={Math.max(870, state.indices.length * 110 + 760)-190} y2={156} arrow/><Port x={Math.max(870, state.indices.length * 110 + 760)-190} y={135} label={`divide √λ=${n(Math.sqrt(lambda))}`} value={n(projection[0] / Math.sqrt(lambda))} hue={c.computed} width={180}/>
      <Text x={20} y={285}>Only the already retained positive direction is inverted; the zero directions have no scaling port.</Text>
    </Scene>
    <ExactTable caption="Complete retained query feature matrix" columns={['Query row ID', ...result.keep.map(k => `direction ${k}`)]} rows={result.features.map((row, i) => [`query-${i}`, ...row.map(x => n(x))])}/>
    <FlowReadout>B has shape {state.queries.length}×{state.indices.length}; the stored retained basis has {result.keep.length} columns. Projection and positive-root scaling produce {state.queries.length}×{result.keep.length} features. Jacobi residual {n(result.residual)} is a numerical check; eigenvector signs may differ while feature dot matrices agree.</FlowReadout>
    <FeatureEditor state={state} setState={setState} revision={revision}/>
  </FlowLab>;
}

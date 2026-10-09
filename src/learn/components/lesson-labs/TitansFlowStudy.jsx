import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { titansStudy as data, rentalAnatomy, rentalCase, scalar as f, vector as v } from '../../data/titans-reading-flow-models.js';
import { rentalMemoryReplay } from '../../data/titans-memory-models.js';
import { Drawing, Cells, Wire, Operator, Text, Route, WeightedTermsDrawing, ink } from './TitansDrawings.jsx';
import { Controls, NumberInput, Select, Button, Table, Live } from './TitansFlowLabs.jsx';

const base = '/learn-assets/titans-multi-memory-architecture/', Study = createContext(null);
export function TitansStudyProvider({ children }) {
  const [seed, setSeed] = useState(3), [day, setDay] = useState(548), [observed, setObserved] = useState(data.counts[548]), [inspect, setInspect] = useState(548);
  const [snapshotRecord, setSnapshot] = useState(null), [error, setError] = useState(false), [near, setNear] = useState(false), [attempt, setAttempt] = useState(0);
  const snapshot = snapshotRecord?.seed === seed ? snapshotRecord.data : null;
  const target = useRef(null), cache = useRef(new Map());
  useEffect(() => { const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); } }, { rootMargin: '600px' }); if (target.current) observer.observe(target.current); return () => observer.disconnect(); }, []);
  useEffect(() => {
    if (!near) return;
    setSnapshot(null); setError(false);
    if (cache.current.has(seed)) { setSnapshot({ seed, data: cache.current.get(seed) }); return; }
    const controller = new AbortController();
    fetch(`${base}rental-seed-${seed}.json`, { signal: controller.signal }).then(response => { if (!response.ok) throw new Error('Saved model unavailable'); return response.json(); }).then(value => {
      if (!Array.isArray(value.initial_parameters) || value.initial_parameters[0]?.length !== 8) throw new Error('Saved model shape differs');
      if (!controller.signal.aborted) { cache.current.set(seed, value); setSnapshot({ seed, data: value }); }
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [near, seed, attempt]);
  const replay = useMemo(() => snapshot ? rentalCase(snapshot, day, observed) : null, [snapshot, day, observed]);
  const value = { seed, setSeed, day, setDay, observed, setObserved, inspect, setInspect, snapshot, replay, error, retry: () => setAttempt(a => a + 1), target,
    reset: () => { setSeed(3); setDay(548); setObserved(data.counts[548]); setInspect(548); } };
  return <Study.Provider value={value}>{children}</Study.Provider>;
}
function Status({ state }) { return state.error ? <p role="alert" className="titans-error">The saved model could not be loaded. <Button onClick={state.retry}>Retry saved model</Button> Your edits remain available.</p> : !state.snapshot ? <p role="status">Loading the selected saved model; current date, arrival and inspection are preserved.</p> : null; }

export function RentalAnatomyDrawing({ model: m, date }) {
  return <><Drawing title="Seven dated observations match the seven input-count coordinates" width={1100} height={170}><Cells x={20} y={60} cell={140} rows={[m.rawDates]} role="data" label="already arrived dates / counts in rentals"/><Cells x={20} y={105} cell={140} rows={[m.raw]} role="data"/></Drawing><Drawing title={`${date}: seven arrived counts are standardized, concatenated with weekday and normalized as a whole nine-vector`} width={1710} height={410}>
    <Cells x={20} y={95} rows={m.raw.map(value => [value])} label="7 prior arrived counts" role="data" cell={110}/>
    <Text x={195} y={30} role="computed">2011-only μ={f(m.mean)}, σ={f(m.scale)}</Text>
    {m.raw.map((count, i) => <g key={i}><Wire x1={130} y1={112 + i * 35} x2={180} y2={112 + i * 35}/><Text x={195} y={118 + i * 35}>({count}−μ)/σ={f(m.standardized[i])}</Text><Wire x1={450} y1={112 + i * 35} x2={520} y2={112 + i * 35}/></g>)}
    <Cells x={535} y={95} rows={m.features.map(value => [value])} label="concat u: 9 coordinates" cell={110}/>
    <Text x={195} y={368} role="data">known weekday {m.weekday}: sin / cos</Text><Wire x1={475} y1={366} x2={520} y2={357} role="data"/><Wire x1={475} y1={366} x2={520} y2={392} role="data"/>
    <Wire x1={645} y1={240} x2={695} y2={240}/><Text x={710} y={175}>||u||₂=√Σ uⱼ²</Text><Text x={710} y={211} role="computed">={f(m.norm)}</Text><Text x={710} y={254}>divide every coordinate</Text><Wire x1={910} y1={240} x2={965} y2={240}/>
    <Cells x={985} y={95} rows={m.key.map(value => [value])} label="k=u/||u||₂" cell={115}/><Wire x1={1100} y1={240} x2={1175} y2={240}/><Text x={1190} y={224}>actual 9→8→1 memory</Text><Text x={1190} y={260} role="computed">prediction z={f(m.read.output)}</Text>
    <Wire x1={1470} y1={240} x2={1520} y2={240}/><Text x={1535} y={207}>×σ +μ</Text><Text x={1535} y={245} role="computed">{f(m.output)}</Text><Text x={1535} y={279}>rentals</Text>
  </Drawing></>;
}

export function RentalNetworkDrawing({ model: m }) {
  const [w1, b1, w2, b2] = m.parameters;
  return <><Drawing title="The actual selected saved 9→8→1 memory has eight weighted nine-coordinate reads, SiLU units and an output sum" width={1530} height={620}>
    <Cells x={20} y={90} cell={100} rows={m.key.map(x => [x])} label="nine k inputs" role="data"/>
    <Cells x={150} y={90} cell={89} rows={w1} label="W₁: actual 8×9 parameter grid" role="parameter"/>
    <Route points={[[120,240],[135,240],[135,397],[1100,397],[1100,262]]} role="data"/><Wire x1={951} y1={240} x2={1078} y2={240} role="parameter"/><Operator x={1100} y={240} label="×"/>
    <Wire x1={1122} y1={240} x2={1160} y2={240}/><Cells x={1180} y={90} cell={110} rows={m.read.pre.map((z,i) => [z-b1[i]])} label="8 row-product sums"/>
    <Cells x={20} y={440} cell={110} rows={[b1]} label="b₁: add each coordinate to its matching row sum" role="parameter"/>
    <Text x={20} y={525}>Each input wire enters every hidden row: product W₁ᵢⱼ×kⱼ, sum over j, add b₁ᵢ, apply SiLU.</Text>
    <Text x={20} y={562} role="parameter">W₂={v(w2[0])}; b₂={f(b2[0])}</Text><Text x={20} y={595} role="computed">Σᵢ W₂ᵢ×hᵢ+b₂={f(m.read.output)} → ×σ+μ={f(m.output)} rentals</Text>
  </Drawing><Drawing title="One actual rental hidden row exposes all nine products and the final output products" width={1430} height={270}>
    <Cells x={20} y={60} cell={140} rows={[m.key]} label="k" role="data"/><Cells x={20} y={95} cell={140} rows={[w1[0]]} role="parameter"/><Cells x={20} y={130} cell={140} rows={[w1[0].map((w,j) => w*m.key[j])]} role="computed"/>
    <Wire x1={1280} y1={112} x2={1340} y2={112}/><Text x={20} y={197}>Σ products={f(m.read.pre[0] - b1[0])}, +b₁={f(b1[0])} → z₁={f(m.read.pre[0])} → h₁={f(m.read.hidden[0])}</Text>
    <Text x={20} y={246}>Eight output products: {v(w2[0].map((w, i) => w * m.read.hidden[i]))}; sum +b₂={f(m.read.output)}.</Text>
  </Drawing><WeightedTermsDrawing inputs={m.key} weights={w1[0]} bias={b1[0]} inputLabel="key coordinate" weightLabel="W₁ first row coordinate" outputLabel="first preactivation z₁" title="Nine actual rental products feed the first hidden preactivation"/><Drawing title="Eight hidden sums receive their biases and SiLU activations" width={1250} height={405}>{m.read.pre.map((z,i) => <g key={i}><Text x={20} y={55+i*42} role="computed">row{i+1} sum={f(z-b1[i])}</Text><Wire x1={235} y1={50+i*42} x2={285} y2={50+i*42}/><Text x={300} y={55+i*42} role="parameter">+b₁={f(b1[i])}</Text><Wire x1={480} y1={50+i*42} x2={530} y2={50+i*42}/><Text x={545} y={55+i*42} role="computed">z={f(z)}</Text><Wire x1={700} y1={50+i*42} x2={750} y2={50+i*42}/><Text x={765} y={55+i*42}>SiLU → h={f(m.read.hidden[i])}</Text></g>)}</Drawing><WeightedTermsDrawing inputs={m.read.hidden} weights={w2[0]} bias={b2[0]} inputLabel="hidden h" weightLabel="W₂ coordinate" outputLabel="standardized output" title="Eight actual hidden/weight products feed the rental prediction"/></>;
}

export function RentalTimelineDrawing() { return <Drawing title="Forecast before arrival, then standardize the target and write before the next day" width={1200} height={270}><Cells x={20} y={65} cell={90} rows={[[ 't−7', 't−6', 't−5', 't−4', 't−3', 't−2', 't−1' ]]} label="already arrived inputs" role="data"/><Wire x1={650} y1={82} x2={690} y2={82}/><Text x={710} y={88}>key → forecast saved</Text><Wire x1={940} y1={82} x2={980} y2={82}/><Text x={995} y={88} role="data">day t ends</Text><Wire x1={1050} y1={106} x2={1050} y2={160}/><Text x={700} y={189}>target (countₜ−μ)/σ → loss → write φ′, S′</Text><Wire x1={690} y1={180} x2={650} y2={180}/><Text x={20} y={189}>next day: updated state + newest arrived count</Text><Text x={20} y={250}>The same-day forecast has no dependency on its target. July2 only changes the reporting label; it does not reset the state.</Text></Drawing>; }

export function RentalMetricsDrawing() {
  const rows = Object.entries(data.seeds).flatMap(([seed, value]) => ['frozen', 'adaptive'].map(mode => [`seed${seed} ${mode}`, value.windows.development[mode], value.windows.assessment[mode]]));
  const series = [...rows.map(([label, dev, assess]) => [label, assess.mae]), ['previous day', data.windows.assessment.previous_day.mae], ['previous week', data.windows.assessment.previous_week.mae]];
  return <><Drawing title="All retained assessment MAEs share the same zero-to-2000 rental axis" width={1050} height={460}>
    <path d="M300 25 V410 M300 410 H900" stroke="currentColor" fill="none"/>{[0, 500, 1000, 1500, 2000].map(n => <Text key={n} x={300 + n * .3} y={447} anchor="middle">{n}</Text>)}
    {series.map(([label, value], i) => <g key={label}><Text x={20} y={57 + 48 * i}>{label}</Text><line x1={300} y1={50 + 48 * i} x2={300 + value * .3} y2={50 + 48 * i} stroke={ink.computed}/><circle cx={300 + value * .3} cy={50 + 48 * i} r="5" fill={ink.computed}/><Text x={320 + value * .3} y={57 + 48 * i}>{value.toFixed(2)}</Text></g>)}
  </Drawing><Table caption="Retained development and assessment errors: original, unedited real-data replay" headers={['Method', 'Development MAE / RMSE', 'Assessment MAE / RMSE']} rows={[...rows.map(([label, dev, assess]) => [label, `${dev.mae.toFixed(2)} / ${dev.rmse.toFixed(2)}`, `${assess.mae.toFixed(2)} / ${assess.rmse.toFixed(2)}`]), ...['previous_day', 'previous_week'].map(name => [name.replace('_', ' '), `${data.windows.development[name].mae.toFixed(2)} / ${data.windows.development[name].rmse.toFixed(2)}`, `${data.windows.assessment[name].mae.toFixed(2)} / ${data.windows.assessment[name].rmse.toFixed(2)}`])]}/></>;
}

function ReplayPlot({ replay, day, inspect, delta = false }) {
  const lo = Math.max(365, Math.min(day, inspect) - 5), hi = Math.min(730, Math.max(day, inspect) + 9), rows = replay.edited.trace.filter(r => r.index >= lo && r.index <= hi);
  const old = replay.baseline.trace.filter(r => r.index >= lo && r.index <= hi), changes = rows.map(r => [r.index, r.adaptive - replay.baseline.trace[r.index - 365].adaptive]);
  const values = [...rows, ...old].flatMap(r => [r.adaptive, r.frozen, r.observed]), lower = delta ? -Math.max(1000, Math.ceil(Math.max(0, ...changes.map(([, v]) => Math.abs(v))) / 1000) * 1000) : Math.min(0, Math.floor(Math.min(0, ...values) / 2000) * 2000);
  const upper = delta ? -lower : Math.max(10000, Math.ceil(Math.max(0, ...values) / 2000) * 2000);
  const x = index => 110 + (index - lo) / Math.max(1, hi - lo) * 650, y = value => 350 - (value - lower) / (upper - lower) * 280;
  const series = delta ? [['adaptive change', changes, ink.parameter]] : [['arrived counts', rows.map(r => [r.index, r.observed]), ink.data], ['edited adaptive', rows.map(r => [r.index, r.adaptive]), ink.computed], ['original adaptive', old.map(r => [r.index, r.adaptive]), ink.parameter], ['edited frozen', rows.map(r => [r.index, r.frozen]), 'currentColor']];
  const identical = !delta && rows.every(r => r.adaptive === replay.baseline.trace[r.index-365].adaptive);
  const labelled = series.map(([name,points,color],i) => ({name,points,color,i,end:points.at(-1)})).sort((a,b)=>y(a.end[1])-y(b.end[1]) || a.i-b.i);
  return <Drawing title={delta ? 'Signed causal forecast change on a common symmetric scale' : 'Original and edited real-data forecasts share one rental axis'} width={1260} height={470}>
    <path d="M110 55 V350 H760" stroke="currentColor" fill="none"/>{[lower, (lower + upper) / 2, upper].map(n => <Text key={n} x={98} y={y(n) + 6} anchor="end">{f(n)}</Text>)}
    {labelled.map(({name,points,color,i,end},n) => <g key={name}><polyline data-series={name} points={points.map(([a,b])=>`${x(a)},${y(b)}`).join(' ')} fill="none" stroke={color} strokeWidth={i===1?4:2} strokeDasharray={i===2?'9 5':i===3?'2 5':undefined}/><polyline points={`${x(end[0])},${y(end[1])} 780,${y(end[1])} 825,${75+n*48} 850,${75+n*48}`} stroke={color} fill="none" strokeDasharray={i===2?'9 5':i===3?'2 5':undefined}/><Text x={865} y={81+n*48} color={color}>{name}{!delta && (i===2?' (dashed)':i===3?' (dotted)':i===1?' (solid)':'')}</Text></g>)}
    <Text x={110} y={390}>{data.dates[lo]} → {data.dates[hi]}; {delta ? 'rentals: current minus original adaptive' : 'rentals, same union domain for all curves'}</Text>
    <Wire x1={x(day)} y1={350} x2={x(day)} y2={320}/><Text x={865} y={285}>Edited arrival {data.dates[day]}</Text><Text x={865} y={325}>Inspect {data.dates[inspect]}</Text>
    <Text x={110} y={448}>{identical?'Adaptive curves coincide: the original dashed curve overlays the edited solid curve.':delta?'Zero means the edited and original adaptive forecasts agree.':'Original means the unedited history; edited curves use the current hypothetical arrival.'}</Text>
  </Drawing>;
}

export function RentalFlow({ view }) {
  const s = useContext(Study), { snapshot, replay } = s;
  const first = snapshot ? rentalAnatomy(snapshot, 365) : null;
  const row = replay?.edited.trace.find(r => r.index === s.inspect), old = replay?.baseline.trace[s.inspect - 365];
  const selected = useMemo(() => {
    if (!snapshot || !replay || !row) return null;
    const prefix = rentalMemoryReplay(snapshot, data.dates, replay.counts, { mean: data.mean, scale: data.scale, stop: s.inspect });
    return rentalAnatomy(snapshot, s.inspect, replay.counts, prefix.parameters);
  }, [snapshot, replay, row, s.inspect]);
  let controls;
  if (view === 'seed') controls = <><Select label="Saved fit seed" value={s.seed} onChange={seed => s.setSeed(Number(seed))} options={[3, 7, 19].map(n => [n, `${n}`])}/><Button onClick={s.reset}>Reset rental case</Button></>;
  else if (view === 'arrival') controls = <><Select label="Observation date to edit" value={s.day} onChange={value => { const index = Number(value); s.setDay(index); s.setObserved(data.counts[index]); s.setInspect(index); }} options={data.dates.slice(365).map((date, i) => [i + 365, date])}/><NumberInput label="Hypothetical arrived rentals" value={s.observed} onChange={s.setObserved} min={0} max={20000} integer/><Button onClick={() => s.setObserved(data.counts[s.day])}>Restore source observation</Button></>;
  else if (view === 'inspect') controls = <><NumberInput label="Inspect day index" value={s.inspect} onChange={s.setInspect} min={365} max={730} integer/><Button disabled={s.inspect >= 730} onClick={() => s.setInspect(i => i + 1)}>Inspect next day</Button></>;
  return <section data-titans-view={`rental-${view}`} ref={view === 'seed' ? s.target : undefined}>
    {view === 'seed' && first && <RentalAnatomyDrawing model={first} date={data.dates[365]}/>}
    {view === 'network' && first && <RentalNetworkDrawing model={first}/>}
    {(view === 'arrival' || view === 'inspect') && replay && <><ReplayPlot replay={replay} day={s.day} inspect={s.inspect}/><ReplayPlot replay={replay} day={s.day} inspect={s.inspect} delta/></>}
    {view === 'inspect' && selected && <RentalAnatomyDrawing model={selected} date={data.dates[s.inspect]}/>}
    {controls && <Controls>{controls}</Controls>}<Status state={s}/>
    {replay && (view === 'arrival' || view === 'inspect') && <><Live>Edited arrival {data.dates[s.day]}: {s.observed} rentals (source {data.counts[s.day]}). Its already recorded forecast is unchanged. First affected adaptive forecast: {replay.firstAffected === null ? 'none (same source observation)' : data.dates[replay.firstAffected]}. {replay.invalidIndex !== null && `Replay first becomes nonfinite on ${data.dates[replay.invalidIndex]}; curves stop at the last valid day.`}</Live>{row && <Table caption={`Selected ${row.date}: prediction before its target write; ${s.inspect < 548 ? 'development' : 'assessment'} reporting period`} headers={['Quantity', 'Original history', 'Current history']} rows={['observed', 'frozen', 'adaptive', 'prediction_z', 'loss_before_write', 'gradient_norm', 'update_norm'].map(key => [key, f(old[key]), f(row[key])])}/>}</>}
  </section>;
}
export function ScoreTimingDrawing() { return <Drawing title="Scoring after fitting a target can turn an error into a misleading perfect answer" width={1000} height={220}><Text x={20} y={50} role="data">w0=0, k=1, arrived target 4</Text><Wire x1={300} y1={45} x2={350} y2={45}/><Text x={370} y={51}>forecast0: error−4</Text><Wire x1={560} y1={45} x2={620} y2={45}/><Text x={640} y={51}>θ=1 write → w′=4</Text><Wire x1={740} y1={75} x2={740} y2={130}/><Text x={370} y={160}>read fitted target 4: error0; target has already entered φ′</Text><Text x={20} y={210}>The second number measures fitting, not a held-out forecast. Save and score the first number.</Text></Drawing>; }
export function TitansFlowProgram({ file }) { return <RemoteCodeBlock source={`${base}${file}`} filename={file} language="python"/>; }
export function TitansFlowDownloads() { return <nav aria-label="Titans programs, data and protocol downloads">{['memory_write_walkthrough.py', 'titans_learning_routes.py', 'neural_memory.py', 'memory_mechanisms.py', 'rental_memory_study.py', 'check_author_packet.py', 'mechanism-results.json', 'rental-results.json', 'bike-sharing-daily.csv', 'source-description.txt', 'experiment-protocol.md', 'data-provenance.md'].map(file => <p key={file}><a href={`${base}${file}`} download>{file}</a></p>)}</nav>; }

import { useEffect, useMemo, useState } from 'react';
import useLessonViewport from './useLessonViewport.js';
import RemoteCodeBlock from '../content/RemoteCodeBlock.jsx';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout, flowNumber as f } from './LessonFlow.jsx';
import { attentionRead, attentionTrajectory, multiHeadRead, mixtures, attentionStorage } from '../../data/self-attention-models.js';
import { AttentionMatrix, AttentionProjectionDrawing, AttentionMatchingDrawing, AttentionNormalizationDrawing, AttentionWeightDrawing, AttentionValueDrawing, AttentionLegalDrawing, AttentionHeadDrawing, AttentionBackwardDrawing, AttentionBlockDrawing, AttentionStorageDrawing, attentionFixture as fixture, attentionVector as vector } from './SelfAttentionFlowFigures.jsx';
import './self-attention-labs.css';
const names = ['A', 'B', 'C'];
const matrix = (label, values, rows = names, columns = names) => <AttentionMatrix label={label} rows={rows} columns={columns} values={values} />;
export function SelfAttentionFigure({
  kind
}) {
  if (kind === 'roles') return <AttentionProjectionDrawing />;
  if (kind === 'compare') return <AttentionMatchingDrawing />;
  if (kind === 'normalize') return <AttentionNormalizationDrawing />;
  if (kind === 'values') return <AttentionValueDrawing values={fixture.values} output={attentionRead([1, 0], fixture.keys, fixture.values).output} />;
  if (kind === 'causal') return <AttentionLegalDrawing />;
  if (kind === 'heads') return <SelfAttentionHeads />;
  if (kind === 'gradient') return <AttentionBackwardDrawing />;
  if (kind === 'blocks') return <AttentionBlockDrawing />;
  if (kind === 'worked') {
    const rows = fixture.queries.map(q => attentionRead(q, fixture.keys, fixture.values));
    return <figure className="attention-flow-matrices">{matrix('receiver rows × donor columns: matches', rows.map(r => r.raw))}<span>→</span>{matrix('each receiver: normalized weights', rows.map(r => r.weights))}<span>→</span>{matrix('mixed value coordinates', rows.map(r => r.output), names, ['1', '2'])}</figure>;
  }
  if (kind === 'padding') return <figure className="attention-flow-matrices">{matrix('key mask: real queries cannot read dummy donors', [[1, 1, '×'], [1, 1, '×'], [1, 1, '×']], ['real query 1', 'real query 2', 'dummy query'], ['real key 1', 'real key 2', 'dummy key'])}<span>compute →</span>{matrix('pooling: dummy query output excluded', [['•', '•', 'yes'], ['•', '•', 'yes'], ['•', '•', 'no']], ['real query 1', 'real query 2', 'dummy query'], ['coordinate 1', 'coordinate 2', 'mean?'])}</figure>;
  if (kind === 'rank') return <figure className="attention-flow-matrices">{matrix('rank-one scores', [[0, 0], [0, 1]], ['receiver 1', 'receiver 2'], ['donor 1', 'donor 2'])}<span>row softmax →</span>{matrix('rank-two weights', [[.5, .5], [1 / (1 + Math.E), Math.E / (1 + Math.E)]], ['receiver 1', 'receiver 2'], ['donor 1', 'donor 2'])}</figure>;
  if (kind === 'permutation') return <figure className="attention-flow-matrices">{matrix('original receivers and donors', fixture.queries.map(q => attentionRead(q, fixture.keys, fixture.values).weights))}<span>reverse both axes →</span>{matrix('same physical matches, reordered', [...fixture.queries].reverse().map(q => attentionRead(q, [...fixture.keys].reverse(), [...fixture.values].reverse()).weights), [...names].reverse(), [...names].reverse())}</figure>;
  if (kind === 'entropy') return <AttentionCurve kind="entropy" />;
  if (kind === 'copy') return <figure className="attention-copy-drawing" aria-label="Seventeen input positions, sixteen next-token targets"><div>Position 0 is given; every later input is the previous query's target.</div><div className="attention-copy-strip">{Array.from({
        length: 17
      }, (_, i) => <span key={i} style={{
        color: i < 8 ? '#77cddb' : i === 8 ? '#e4b752' : '#be9cf5'
      }}>{i === 8 ? 'SEP' : `s${i < 8 ? i : i - 9}`}<small>position {i}</small><small>{i === 0 ? 'given' : i < 8 ? 'fresh target' : i === 8 ? 'separator' : 'copied target'}</small></span>)}</div><p>Cyan symbols are fresh, violet symbols copy the source, amber SEP separates them.</p></figure>;
  if (kind === 'pipeline') return <AttentionPipeline />;
  return <SelfAttentionStorage />;
}
export function SelfAttentionMessageLab() {
  const [queryY, setQueryY] = useState(0),
    [keyY, setKeyY] = useState(0),
    [valueY, setValueY] = useState(1);
  const keys = [[1, keyY], [0, 1], [1, 1]],
    values = [[2, 0], [0, 2], [1, valueY]],
    query = [1, queryY],
    result = attentionRead(query, keys, values);
  return <FlowLab id="self-attention-message" label="Separate matching from message content"><AttentionMatchingDrawing query={query} keys={keys} values={values} /><div className="attention-flow-comparison"><AttentionWeightDrawing weights={result.weights} /><AttentionValueDrawing values={values} output={result.output} /></div><FlowControls><FlowSlider name="A query coordinate 2" value={queryY} min={-2} max={2} onChange={setQueryY} /><FlowSlider name="A key coordinate 2" value={keyY} min={-2} max={2} onChange={setKeyY} /><FlowSlider name="C value coordinate 2" value={valueY} min={-2} max={3} onChange={setValueY} /></FlowControls><FlowReadout>A's weights are {vector(result.weights)}, and its mixture is <strong>{vector(result.output)}</strong>. Editing the value changes a contribution without changing the matching weights.</FlowReadout></FlowLab>;
}
export function SelfAttentionMaskLab() {
  const [future, setFuture] = useState(false),
    [value, setValue] = useState(-2),
    allowed = [true, true, false, future],
    result = attentionRead([0, 1], [[1, 0], [0, 1], [1, 1], [.5, -1]], [[1, 0], [0, 2], [3, 1], [value, 3]], {
      allowed
    });
  return <FlowLab id="self-attention-mask" label="Future data requires an enabled edge"><AttentionLegalDrawing receiver={1} allowed={allowed} weights={result.weights} /><FlowControls><FlowChoice label="Future D → B edge" value={future} onChange={setFuture} options={[[false, 'Blocked'], [true, 'Allowed']]} /><FlowSlider name="Future D value coordinate 1" value={value} min={-4} max={4} onChange={setValue} /></FlowControls><FlowReadout>B outputs <strong>{vector(result.output)}</strong>, with future D weight {f(result.weights[3])}. {future ? 'The future edge leaks information into B.' : 'Editing D leaves B unchanged while its edge is blocked.'}</FlowReadout></FlowLab>;
}
export function SelfAttentionCachedLab() {
  const [position, setPosition] = useState(2),
    allowed = [0, 1, 2].map(p => p <= position),
    result = attentionRead([1, 1], fixture.keys, fixture.values, {
      allowed
    });
  return <FlowLab label="Absolute query position defines the cached prefix">{matrix('one query row × cached key absolute positions', [allowed.map(v => v ? 'allowed' : 'blocked')], [`query at ${position}`], ['0', '1', '2'])}<AttentionWeightDrawing weights={result.weights} labels={['key at 0', 'key at 1', 'key at 2']} /><FlowControls><FlowSlider name="Absolute query position" min={0} max={2} step={1} value={position} onChange={setPosition} /></FlowControls><FlowReadout>The query remains [1,1], but its legal prefix ends at {position}, giving <strong>{vector(result.output)}</strong>.</FlowReadout></FlowLab>;
}
function SelfAttentionHeads() {
  const [coordinate, setCoordinate] = useState(1),
    [zero, setZero] = useState(false),
    identity = [[1, 0], [0, 1]],
    inputs = [[coordinate, 0], [0, 1]],
    maps = {
      query: identity,
      key: identity,
      value: zero ? [[0, 0], [0, 0]] : identity,
      output: identity
    },
    one = multiHeadRead(inputs, maps, 1),
    two = multiHeadRead(inputs, maps, 2);
  return <FlowLab id="self-attention-heads" label="Head values mix separately before concatenation"><AttentionHeadDrawing one={one} two={two} inputs={inputs} /><FlowControls><FlowSlider name="Input A coordinate 1" value={coordinate} min={-2} max={2} onChange={setCoordinate} /><FlowChoice label="Value map" value={zero} onChange={setZero} options={[[false, 'Identity'], [true, 'Zero']]} /></FlowControls><FlowReadout>A's one-head output is <strong>{vector(one.output[0])}</strong>; its two-head output is <strong>{vector(two.output[0])}</strong>. Both partitions contain sixteen bias-free parameters.</FlowReadout></FlowLab>;
}
function AttentionCurve({
  kind = 'probability',
  gap = 0
}) {
  const entropy = kind === 'entropy',
    derivative = kind === 'derivative',
    curve = Array.from({
      length: 81
    }, (_, i) => {
      const x = entropy ? 1 + i / 5 : -8 + i / 5,
        p = 1 / (1 + Math.exp(-x));
      return [x, entropy ? Math.log(x) : derivative ? p * (1 - p) : p];
    }),
    ymax = entropy ? Math.log(17) : derivative ? .25 : 1,
    xmap = x => 62 + (entropy ? (x - 1) / 16 : (x + 8) / 16) * 480,
    ymap = y => 217 - 162 * y / ymax,
    p = 1 / (1 + Math.exp(-gap)),
    value = derivative ? p * (1 - p) : p;
  return <figure className="attention-flow-drawing"><svg viewBox="0 0 620 295" role="img" aria-label={entropy ? 'Uniform entropy ceiling against legal donor count' : `${derivative ? 'Derivative' : 'Probability'} against scaled score gap`}><line x1={62} x2={542} y1={217} y2={217} stroke="#aaa" /><line x1={62} x2={62} y1={55} y2={217} stroke="#aaa" /><polyline points={curve.map(([x, y]) => `${xmap(x)},${ymap(y)}`).join(' ')} stroke="#be9cf5" fill="none" strokeWidth={2} />{(entropy ? [1, 5, 9, 13, 17] : [-8, -4, 0, 4, 8]).map(x => <text key={x} x={xmap(x)} y={240} textAnchor="middle" fill="#ddd" fontSize={14}>{x}</text>)}{[0, ymax / 2, ymax].map(y => <text key={y} x={50} y={ymap(y) + 5} textAnchor="end" fill="#ddd" fontSize={14}>{f(y, 3)}</text>)}{!entropy && Math.abs(gap) <= 8 && <circle cx={xmap(gap)} cy={ymap(value)} r={6} fill="none" stroke="#fff" strokeWidth={2} />}<text x={62} y={24} fill="#ddd" fontSize={15}>{entropy ? 'uniform maximum entropy (nats)' : derivative ? 'derivative with respect to scaled gap' : 'first donor probability'}</text><text x={302} y={278} fill="#ddd" fontSize={15} textAnchor="middle">{entropy ? 'number of legal donors' : 'scaled score gap'}</text></svg></figure>;
}
export function SelfAttentionSensitivityLab() {
  const [raw, setRaw] = useState(2),
    [dimension, setDimension] = useState(2),
    [temperature, setTemperature] = useState(1),
    gap = raw / Math.sqrt(dimension) / temperature,
    p = 1 / (1 + Math.exp(-gap));
  return <FlowLab id="self-attention-sensitivity" label="Scaling and temperature change concentration"><AttentionCurve gap={gap} /><AttentionCurve kind="derivative" gap={gap} /><FlowControls><FlowSlider name="Raw score gap" value={raw} min={-8} max={8} onChange={setRaw} /><FlowSlider name="Per-head key width" value={dimension} min={1} max={64} step={1} onChange={setDimension} /><FlowSlider name="Temperature" value={temperature} min={.25} max={4} onChange={setTemperature} /></FlowControls><FlowReadout>Scaled gap <strong>{f(gap)}</strong> gives first probability {f(p)} and derivative {f(p * (1 - p))} with respect to that gap. {Math.abs(gap) > 8 ? 'This point is outside the fixed chart.' : 'The white ring marks the current state.'}</FlowReadout></FlowLab>;
}
export function SelfAttentionOffsetLab() {
  const [offset, setOffset] = useState(0),
    result = attentionRead([1, 0], fixture.keys, fixture.values, {
      offset
    }),
    maximum = Math.max(...result.scores);
  return <FlowLab label="Common score shift cancels in stable normalization">{matrix('subtract the largest receiver-row score', [result.scores, result.scores.map(s => s - maximum), result.scores.map(s => Math.exp(s - maximum)), result.weights], ['shifted scores', 'minus maximum', 'stable exponentials', 'weights'])}<FlowControls><FlowSlider name="Common score offset" min={0} max={1000} step={10} value={offset} onChange={setOffset} /></FlowControls><FlowReadout>Scores moved by {offset}; mixture remains <strong>{vector(result.output)}</strong>. {offset > 709 ? 'Direct exponentiation overflows here; shifted exponentials remain finite.' : 'The common shift cancels from each weight.'}</FlowReadout></FlowLab>;
}
export function SelfAttentionMixtureLab() {
  const [first, setFirst] = useState(0),
    [third, setThird] = useState(4),
    result = mixtures([.6, .3, .1], [.2, .3, .5], [first, 2, third]);
  return <FlowLab id="self-attention-mixtures" label="Different weights can yield the same value mixture"><figure className="attention-contributions">{[result.contributionsA, result.contributionsB].map((products, row) => <div key={row}><span>row {row ? 'B: [.2,.3,.5]' : 'A: [.6,.3,.1]'}</span>{products.map((v, i) => <div className="attention-contribution" key={i}><span>donor {i + 1} contribution {f(v, 3)}</span><div><i style={{
              left: v < 0 ? `${50 + v / 6 * 50}%` : '50%',
              width: `${Math.abs(v) / 6 * 50}%`
            }} /></div></div>)}<span>sum {f(row ? result.outputB : result.outputA)}; signed scale −6…6</span></div>)}</figure><FlowControls><FlowSlider name="Donor 1 scalar value" min={-6} max={6} value={first} onChange={setFirst} /><FlowSlider name="Donor 3 scalar value" min={-6} max={6} value={third} onChange={setThird} /></FlowControls><FlowReadout>A outputs <strong>{f(result.outputA)}</strong>; B outputs <strong>{f(result.outputB)}</strong>; difference {f(result.outputB - result.outputA)}. Equal first and third values remove the effect of redistributing their weights.</FlowReadout></FlowLab>;
}
function SelfAttentionStorage() {
  const [length, setLength] = useState(2048),
    [heads, setHeads] = useState(16),
    result = attentionStorage({
      length,
      heads
    });
  return <FlowLab label="Attention square and cached feature rows have different storage growth"><AttentionStorageDrawing length={length} heads={heads} {...result} /><FlowControls><FlowSlider name="Sequence length" min={64} max={8192} step={64} value={length} onChange={setLength} /><FlowChoice label="Heads at fixed width 1024" options={[[4, '4'], [8, '8'], [16, '16']]} value={heads} onChange={setHeads} /></FlowControls><FlowReadout>One weight tensor uses <strong>{f(result.matrixBytes / 2 ** 20)} MiB</strong>; twelve layers' KV cache uses <strong>{f(result.cacheBytes / 2 ** 20)} MiB</strong>. Projection products use {result.projectionMACs.toLocaleString()} multiply-accumulates, pair products {result.pairMACs.toLocaleString()}.</FlowReadout></FlowLab>;
}
function TrajectoryDrawing({
  points,
  selected = 22
}) {
  return <figure className="attention-flow-drawing attention-trajectory-drawing"><svg viewBox="0 0 360 360" role="img" aria-label={`Trajectory, selected point ${selected + 1}, start ring and end square`}><rect x={48} y={28} width={252} height={252} fill="none" stroke="#555" /><polyline points={points.map(p => `${48 + 252 * p[0]},${280 - 252 * p[1]}`).join(' ')} stroke="#999" fill="none" />{points.map((p, i) => <circle key={i} cx={48 + 252 * p[0]} cy={280 - 252 * p[1]} r={i === selected ? 6 : 2.5} fill="#77cddb" stroke={i === selected ? '#fff' : 'none'}><title>Point {i + 1}: {vector(p)}</title></circle>)}<circle cx={48 + 252 * points[0][0]} cy={280 - 252 * points[0][1]} r={10} stroke="#fff" fill="none" /><rect x={44 + 252 * points.at(-1)[0]} y={276 - 252 * points.at(-1)[1]} width={8} height={8} stroke="#fff" fill="none" /><text x={48} y={18} fill="#ddd" fontSize={14}>y coordinate · cyan points</text>{[0, .5, 1].map(v => <g key={v}><text x={48 + 252 * v} y={301} textAnchor="middle" fill="#ddd" fontSize={13}>{v}</text><text x={38} y={285 - 252 * v} textAnchor="end" fill="#ddd" fontSize={13}>{v}</text></g>)}<text x={175} y={322} fill="#ddd" fontSize={14} textAnchor="middle">x coordinate · selected point {selected + 1}</text><text x={175} y={350} fill="#ddd" fontSize={12} textAnchor="middle">start: white ring; end: white square</text></svg></figure>;
}
function AttentionPipeline() {
  return <figure className="attention-pipeline"><TrajectoryDrawing points={[[.2, .2], [.22, .35], [.35, .6], [.55, .7], [.7, .65], [.8, .45]]} selected={2} /><div className="attention-pipeline-grids"><AttentionMatrix label="coordinates: 45 rows × 2" rows={['point 1', 'point 2', '…']} columns={['x', 'y']} role="input" values={[[.2, .2], [.22, .35], ['…', '…']]} /><span>same learned map + tanh →</span>{matrix('features: 45 rows × 24', Array(3).fill(['•', '•', '…', '•']), ['point 1', 'point 2', '…'], ['1', '2', '…', '24'])}<span>two heads + original features →</span>{matrix('contextual features: 45 rows × 24', Array(3).fill(['•', '•', '…', '•']), ['point 1', 'point 2', '…'], ['1', '2', '…', '24'])}<span>mean over rows → 24 features → learned class map → 15 scores</span></div><p>Six points illustrate input shape; dots stand for computed features, not measured values. The live curve uses all 45 recorded points.</p></figure>;
}
function TrajectoryWorkspace({
  data,
  kind
}) {
  const [selected, setSelected] = useState(22),
    [points, setPoints] = useState(() => data.points.map(p => [...p])),
    [reverse, setReverse] = useState(false),
    [padding, setPadding] = useState(0),
    [maskKeys, setMaskKeys] = useState(true),
    [maskPool, setMaskPool] = useState(true);
  const source = useMemo(() => kind === 'order' && reverse ? [...data.points].reverse() : kind === 'edit' ? points : data.points, [data, kind, reverse, points]),
    input = useMemo(() => kind === 'padding' ? [...source, ...Array.from({
      length: padding
    }, () => [.75, .75])] : source, [kind, source, padding]),
    valid = useMemo(() => input.map((_, i) => i < 45), [input]),
    original = useMemo(() => attentionTrajectory(data.state_dict, data.points), [data]),
    result = useMemo(() => attentionTrajectory(data.state_dict, input, valid, maskKeys, maskPool), [data, input, valid, maskKeys, maskPool]),
    receiver = kind === 'order' && reverse ? 44 - selected : selected,
    delta = Math.max(...result.logits.map((v, i) => Math.abs(v - original.logits[i])));
  return <FlowLab id={`self-attention-trajectory-${kind}`} label={`Recorded trajectory ${kind} experiment`}><TrajectoryDrawing points={source} selected={receiver} />{kind !== 'padding' && [0, 1].map(head => <AttentionWeightDrawing key={head} weights={result.heads[head][receiver].weights} labels={input.map((_, i) => String(i + 1))} selected={receiver} label={`Head ${head + 1}, receiver ${receiver + 1}: donor coefficients`} />)}<FlowControls>{kind === 'edit' ? <><FlowSlider name="Point number" min={1} max={45} step={1} value={selected + 1} onChange={v => setSelected(v - 1)} />{[0, 1].map(axis => <FlowSlider key={axis} name={`Selected point ${axis ? 'y' : 'x'}`} min={0} max={1} step={.01} value={points[selected][axis]} onChange={v => setPoints(points.map((p, i) => i === selected ? p.map((c, j) => j === axis ? v : c) : p))} />)}</> : kind === 'order' ? <FlowChoice label="Visit order" value={reverse} onChange={setReverse} options={[[false, 'Original'], [true, 'Reverse']]} /> : <><FlowSlider name="Dummy points at (.75,.75)" min={0} max={5} step={1} value={padding} onChange={setPadding} /><FlowChoice label="Dummy keys" value={maskKeys} onChange={setMaskKeys} options={[[true, 'Exclude'], [false, 'Include']]} /><FlowChoice label="Dummy outputs in mean" value={maskPool} onChange={setMaskPool} options={[[true, 'Exclude'], [false, 'Include']]} /></>}</FlowControls><FlowReadout>The model chooses class <strong>{result.predicted}</strong>. Anticlockwise-arc probability is {f(result.probabilities[3] * 100, 3)}%, clockwise-arc probability {f(result.probabilities[4] * 100, 3)}%, and largest logit change is <strong>{f(delta, 9)}</strong>. {kind === 'order' ? 'The same physical receiver stays selected after reversal.' : kind === 'padding' ? `${padding} dummy points follow independent key and pooling masks.` : 'Selecting a point chooses the inspected rows; editing coordinates changes model input.'}</FlowReadout></FlowLab>;
}
function SelfAttentionResource({
  render
}) {
  const [value, setValue] = useState(null),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/learn-assets/self-attention-multi-head-attention/trajectory-model.json', {
      signal: controller.signal
    }).then(r => {
      if (!r.ok) throw new Error(`Resource returned ${r.status}`);
      return r.json();
    }).then(setValue).catch(e => {
      if (e.name !== 'AbortError') setError(e.message);
    });
    return () => controller.abort();
  }, [attempt]);
  if (error) return <p role="alert">{error} <button type="button" onClick={() => {
      setError('');
      setAttempt(attempt + 1);
    }}>Retry resource</button></p>;
  return value === null ? <p role="status">Loading recorded points and learned parameters…</p> : render(value);
}
export function SelfAttentionTrajectoryLab({
  kind = 'edit'
}) {
  const [ref, ready] = useLessonViewport();
  return <div ref={ref} id={kind === 'edit' ? 'self-attention-trajectory' : undefined}>{ready && <SelfAttentionResource render={data => <TrajectoryWorkspace data={data} kind={kind} />} />}</div>;
}
export function SelfAttentionProgram() {
  return <RemoteCodeBlock source="/learn-code/self-attention-multi-head-attention/author-calculations.py" language="python" filename="author-calculations.py" title="Complete data, model, fitting and verification program" />;
}

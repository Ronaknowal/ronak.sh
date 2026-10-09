import { createContext, useContext, useMemo, useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout, flowNumber as f } from './LessonFlow.jsx';
import { NeuralTable } from './NeuralLessonElements.jsx';
import { summaryDefaults, kernelSummary, weightedMemory, deltaMemory, gooseUpdate, dot } from '../../data/rwkv-memory-models.js';
import { RwkvFlowScroll, RwkvTranscriptDrawing, RwkvSummaryDrawing, RwkvChunkDrawing, RwkvWeightedDrawing, RwkvDeltaDrawing, RwkvAddressDrawing, RwkvGooseDrawing, RwkvMatrixRetentionDrawing } from './RwkvFlowDrawings.jsx';
export function RwkvFlowSelect({
  name,
  value,
  onChange,
  options
}) {
  return <label className="rwkv-flow-select"><span>{name}</span><select aria-label={name} value={value} onChange={event => onChange(event.target.value)}>
    {options.map(([key, label]) => <option key={String(key)} value={key}>{label}</option>)}
  </select></label>;
}
const SummaryContext = createContext(null);
const WeightedContext = createContext(null);
const AddressContext = createContext(null);
const workedSummary = () => ({
  ...summaryDefaults(),
  values: [2, 8, -1, 5]
});
const workedWeighted = () => ({
  keys: [0, Math.log(2), 0, Math.log(4)],
  values: [2, 8, -1, 5],
  retention: .5,
  bonus: Math.log(2),
  offset: 0
});
const vector = angle => [Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)];
const list = values => `[${values.map(v => f(v, 5)).join(', ')}]`;
export function RwkvFlowProvider({
  children
}) {
  const [summary, setSummary] = useState(workedSummary),
    [position, setPosition] = useState(1);
  const [weighted, setWeighted] = useState(workedWeighted),
    [token, setToken] = useState(1);
  const [address, setAddress] = useState(() => ({
    angles: [0, 90, 0],
    values: [2, 7, 5],
    initial: [0, 0],
    rate: 1,
    query: 0
  }));
  const [write, setWrite] = useState(2);
  return <SummaryContext.Provider value={{
    summary,
    setSummary,
    position,
    setPosition
  }}>
    <WeightedContext.Provider value={{
      weighted,
      setWeighted,
      token,
      setToken
    }}>
      <AddressContext.Provider value={{
        address,
        setAddress,
        write,
        setWrite
      }}>{children}</AddressContext.Provider>
    </WeightedContext.Provider>
  </SummaryContext.Provider>;
}
export function RwkvTranscriptFlow() {
  const [position, setPosition] = useState(1),
    [scores, setScores] = useState([0, Math.log(2), 0]);
  const weights = scores.map(v => Math.exp(v - Math.max(...scores)));
  const total = weights.reduce((a, b) => a + b, 0),
    output = dot(weights, [2, 8, -1]) / total;
  return <FlowLab id="rwkv-transcript" label="How does compatibility change the returned mixture?">
    <RwkvTranscriptDrawing scores={scores} />
    <FlowControls><RwkvFlowSelect name="Permitted score" value={position} onChange={v => setPosition(Number(v))} options={scores.map((_, i) => [i, `Score ${i + 1}`])} /><FlowSlider name="Score value" value={scores[position]} min={-4} max={4} step={.05} onChange={v => setScores(scores.map((s, i) => i === position ? v : s))} /></FlowControls>
    <FlowReadout>Changing score {position + 1} changes its normalized weight to {f(weights[position] / total)} and the mixture to {f(output)}; values stay [2, 8, −1].</FlowReadout>
  </FlowLab>;
}
export function RwkvSummaryFlow({
  study
}) {
  const {
    summary: input,
    setSummary,
    position,
    setPosition
  } = useContext(SummaryContext);
  const [coordinate, setCoordinate] = useState(0),
    [common, setCommon] = useState(4),
    [pin, setPin] = useState(null);
  const source = study === 'constant' ? {
    ...input,
    values: input.values.map(() => common)
  } : input;
  const rows = useMemo(() => kernelSummary(source), [source]),
    row = rows[position];
  const edit = (field, value, index = null) => setSummary(previous => ({
    ...previous,
    [field]: previous[field].map((entry, i) => i !== position ? entry : index === null ? value : entry.map((v, j) => j === index ? value : v))
  }));
  const positions = <RwkvFlowSelect name={study === 'query' ? 'Read position' : 'Write position'} value={position} onChange={v => setPosition(Number(v))} options={input.values.map((_, i) => [i, `Position ${i + 1}`])} />;
  const before = position === 0 ? [0, 0] : rows[position - 1].state;
  const normalizer = position === 0 ? [0, 0] : rows[position - 1].normalizer;
  const reset = () => {
    setSummary(workedSummary());
    setPosition(1);
    setPin(null);
  };
  return <FlowLab id={`rwkv-summary-${study}`} label={`Summary ${study} investigation`}>
    {study === 'chunk' ? <RwkvChunkDrawing length={Math.min(input.chunk, input.values.length - Math.floor(position / input.chunk) * input.chunk)} carried={row.carriedNumerator} local={row.localNumerator} denominator={row.denominator} /> : <RwkvSummaryDrawing key={position} keyVector={source.keys[position]} value={source.values[position]} query={source.queries[position]} before={before} priorNormalizer={normalizer} state={row.state} normalizer={row.normalizer} numerator={row.numerator} denominator={row.denominator} />}
    <FlowControls>
      {['key', 'value', 'query'].includes(study) && positions}
      {(study === 'key' || study === 'query') && <><RwkvFlowSelect name={study === 'key' ? 'Key coordinate' : 'Query coordinate'} value={coordinate} onChange={v => setCoordinate(Number(v))} options={[[0, 'First'], [1, 'Second']]} /><FlowSlider name="Coordinate value" value={input[study === 'key' ? 'keys' : 'queries'][position][coordinate]} min={0} max={4} step={.05} onChange={v => edit(study === 'key' ? 'keys' : 'queries', v, coordinate)} /></>}
      {study === 'value' && <FlowSlider name="Returned value" value={input.values[position]} min={-12} max={12} step={.1} onChange={v => edit('values', v)} />}
      {study === 'constant' && <FlowSlider name="Common value on a separate branch" value={common} min={-12} max={12} step={.1} onChange={setCommon} />}
      {study === 'chunk' && <><FlowSlider name="Chunk length" value={input.chunk} min={1} max={12} step={1} onChange={chunk => setSummary({
          ...input,
          chunk
        })} /><FlowSlider name="Inspected position" value={position + 1} min={1} max={input.values.length} step={1} onChange={v => setPosition(v - 1)} /></>}
      {study === 'extent' && <><button disabled={input.values.length >= 12} onClick={() => setSummary({
          ...input,
          queries: [...input.queries, [1, 1]],
          keys: [...input.keys, [1, 1]],
          values: [...input.values, 2]
        })}>Append write</button><button disabled={input.values.length <= 1} onClick={() => {
          setSummary({
            ...input,
            queries: input.queries.slice(0, -1),
            keys: input.keys.slice(0, -1),
            values: input.values.slice(0, -1)
          });
          setPosition(Math.min(position, input.values.length - 2));
        }}>Remove last write</button><button onClick={reset}>Reset summary fixture</button></>}
      {study === 'pin' && <button onClick={() => setPin(structuredClone(input))}>Pin current summary</button>}
    </FlowControls>
    <FlowReadout>Position {position + 1} reads numerator {f(row.numerator)} over mass {f(row.denominator)}: {row.output === null ? 'undefined because support is zero' : f(row.output)}. Saved S is {list(row.state)}; z is {list(row.normalizer)}.{study === 'chunk' && <> Earlier numerator {f(row.carriedNumerator)} plus local {f(row.localNumerator)} gives the same answer {f(row.chunkOutput)}.</>}{study === 'pin' && <> {pin ? `Pinned ${pin.values.length} writes, final answer ${f(kernelSummary(pin).at(-1).output)}; current final ${f(rows.at(-1).output)}.` : 'No pinned input yet.'}</>}</FlowReadout>
    {study === 'extent' && <NeuralTable caption="Current chronological computation" headers={['Position', 'Query', 'Key', 'Value', 'Answer']} rows={rows.map((r, i) => [i + 1, list(source.queries[i]), list(source.keys[i]), f(source.values[i]), r.output === null ? 'undefined' : f(r.output)])} />}
  </FlowLab>;
}
export function RwkvWeightedFlow({
  study
}) {
  const {
    weighted: input,
    setWeighted,
    token,
    setToken
  } = useContext(WeightedContext);
  const [common, setCommon] = useState(7);
  const source = study === 'constant' ? {
    ...input,
    values: input.values.map(() => common)
  } : input;
  const rows = weightedMemory(source.keys, source.values, source.retention, source.bonus, source.offset),
    row = rows[token];
  const prior = token === 0 ? {
    a: 0,
    b: 0,
    p: -Infinity
  } : rows[token - 1];
  // The picture changes to a safe shared scale; the labelled scale supplies its unit.
  const keyScale = Math.max(prior.p, source.keys[token] + source.offset);
  const oldA = prior.a * Math.exp(prior.p - keyScale),
    oldB = prior.b * Math.exp(prior.p - keyScale);
  const keyWeight = Math.exp(source.keys[token] + source.offset - keyScale);
  const edit = (field, value) => setWeighted(previous => ({
    ...previous,
    [field]: value
  }));
  return <FlowLab id={`rwkv-weighted-${study}`} label={`Weighted memory ${study}`}>
    <RwkvWeightedDrawing value={source.values[token]} keyWeight={keyWeight} bonusWeight={Math.exp(source.bonus)} retention={source.retention} oldA={oldA} oldB={oldB} />
    <FlowControls>
      {study === 'write' && <><RwkvFlowSelect name="Write position" value={token} onChange={v => setToken(Number(v))} options={input.values.map((_, i) => [i, `Position ${i + 1}`])} /><FlowSlider name="Log key" value={input.keys[token]} min={-8} max={8} step={.05} onChange={v => edit('keys', input.keys.map((x, i) => i === token ? v : x))} /><FlowSlider name="Value" value={input.values[token]} min={-12} max={12} step={.1} onChange={v => edit('values', input.values.map((x, i) => i === token ? v : x))} /></>}
      {study === 'bonus' && <><FlowSlider name="Current log bonus u" value={input.bonus} min={-4} max={4} step={.05} onChange={v => edit('bonus', v)} /><FlowSlider name="Read position" value={token + 1} min={1} max={input.values.length} step={1} onChange={v => setToken(v - 1)} /></>}
      {study === 'retention' && <><FlowSlider name="Retention λ" value={input.retention} min={.01} max={1} step={.01} onChange={v => edit('retention', v)} /><FlowSlider name="Inspected position" value={token + 1} min={1} max={input.values.length} step={1} onChange={v => setToken(v - 1)} /></>}
      {study === 'scale' && <FlowSlider name="Common log-key offset" value={input.offset} min={-1000} max={1000} step={1} onChange={v => edit('offset', v)} />}
      {study === 'constant' && <FlowSlider name="Common value on an empty-state branch" value={common} min={-12} max={12} step={.1} onChange={setCommon} />}
      {study === 'extent' && <><button disabled={input.values.length >= 12} onClick={() => setWeighted({
          ...input,
          keys: [...input.keys, 0],
          values: [...input.values, 2]
        })}>Append token</button><button disabled={input.values.length <= 1} onClick={() => {
          setWeighted({
            ...input,
            keys: input.keys.slice(0, -1),
            values: input.values.slice(0, -1)
          });
          setToken(Math.min(token, input.values.length - 2));
        }}>Remove last token</button><button onClick={() => {
          setWeighted(workedWeighted());
          setToken(1);
        }}>Reset weighted fixture</button></>}
    </FlowControls>
    <FlowReadout>The diagram's common log unit is {f(keyScale)}. Position {token + 1} answers {f(row.output)}; saved scaled a {f(row.a)}, b {f(row.b)}, p {f(row.p)}.{study === 'retention' && <> Half-life is {source.retention === 1 ? 'infinite at the constructed no-forgetting boundary' : `${f(Math.log(.5) / Math.log(source.retention))} storage updates`}.</>}{study === 'scale' && <> Raw exp(key) {source.keys[token] + source.offset > 709 ? 'overflows float64' : `is ${Math.exp(source.keys[token] + source.offset).toExponential(3)}`}; normalized answer stays finite.</>}</FlowReadout>
    {study === 'extent' && <NeuralTable caption="Read and saved history remain distinct" headers={['Position', 'Answer', 'a', 'b', 'p']} rows={rows.map((r, i) => [i + 1, f(r.output), f(r.a), f(r.b), f(r.p)])} />}
  </FlowLab>;
}
export function RwkvAddressFlow({
  study
}) {
  const {
    address: input,
    setAddress,
    write,
    setWrite
  } = useContext(AddressContext);
  const [coordinate, setCoordinate] = useState(0);
  const rows = deltaMemory(input.angles.map(vector), input.values, input.rate, input.initial),
    row = rows[write];
  const final = rows.at(-1),
    q = vector(input.query);
  const edit = (field, value) => setAddress(previous => ({
    ...previous,
    [field]: value
  }));
  return <FlowLab id={`rwkv-address-${study}`} label={`Associative memory ${study}`}>
    {study === 'query' ? <RwkvAddressDrawing angles={input.angles} query={input.query} memory={final.delta} /> : <RwkvDeltaDrawing before={row.before} keyVector={row.key} target={row.target} rate={input.rate} />}
    <FlowControls>
      {study === 'write' && <><RwkvFlowSelect name="Write index" value={write} onChange={v => setWrite(Number(v))} options={input.values.map((_, i) => [i, `Write ${i + 1}`])} /><FlowSlider name="Unit-key angle in degrees" value={input.angles[write]} min={-180} max={180} step={1} onChange={v => edit('angles', input.angles.map((x, i) => i === write ? v : x))} /><FlowSlider name="Target value" value={input.values[write]} min={-12} max={12} step={.1} onChange={v => edit('values', input.values.map((x, i) => i === write ? v : x))} /></>}
      {study === 'query' && <FlowSlider name="Query angle in degrees" value={input.query} min={-180} max={180} step={1} onChange={v => edit('query', v)} />}
      {study === 'rate' && <FlowSlider name="Correction strength β" value={input.rate} min={0} max={1} step={.01} onChange={v => edit('rate', v)} />}
      {study === 'initial' && <><RwkvFlowSelect name="Initial memory coordinate" value={coordinate} onChange={v => setCoordinate(Number(v))} options={[[0, 'First'], [1, 'Second']]} /><FlowSlider name="Initial signed value" value={input.initial[coordinate]} min={-6} max={6} step={.1} onChange={v => edit('initial', input.initial.map((x, i) => i === coordinate ? v : x))} /></>}
      {study === 'extent' && <><button disabled={input.values.length >= 10} onClick={() => setAddress({
          ...input,
          angles: [...input.angles, 0],
          values: [...input.values, 2]
        })}>Append address write</button><button disabled={input.values.length <= 1} onClick={() => {
          setAddress({
            ...input,
            angles: input.angles.slice(0, -1),
            values: input.values.slice(0, -1)
          });
          setWrite(Math.min(write, input.values.length - 2));
        }}>Remove last address write</button><button onClick={() => {
          setAddress({
            angles: [0, 90, 0],
            values: [2, 7, 5],
            initial: [0, 0],
            rate: 1,
            query: 0
          });
          setWrite(2);
        }}>Reset address fixture</button></>}
    </FlowControls>
    <FlowReadout>Write {write + 1} reads {f(row.read)} before changing memory; its target-minus-read residual is {f(row.residual)}. Final corrective memory {list(final.delta)} gives query {f(dot(final.delta, q))}; additive memory {list(final.additive)} gives {f(dot(final.additive, q))}.</FlowReadout>
    {study === 'extent' && <NeuralTable caption="Every changed association" headers={['Write', 'Key', 'Target', 'Residual', 'Memory']} rows={rows.map((r, i) => [i + 1, list(r.key), r.target, f(r.residual), list(r.delta)])} />}
  </FlowLab>;
}
export function RwkvGooseFlow() {
  const [angle, setAngle] = useState(0),
    removal = vector(angle),
    result = gooseUpdate(removal);
  return <FlowLab id="rwkv-goose-removal" label="Which address direction does the rank one term remove?">
    <RwkvGooseDrawing result={result} removal={removal} />
    <FlowControls><FlowSlider name="Unit removal angle in degrees" value={angle} min={-180} max={180} step={1} onChange={setAngle} /></FlowControls>
    <FlowReadout>Only removal direction changed to {list(removal)}; new rows are {result.next.map(list).join(' and ')}. Diagonal retention [.8, .9], erase strengths [.6, .2], replacement [1, 0] and value [5, 2] stay fixed.</FlowReadout>
  </FlowLab>;
}
export function RwkvNonunitFlow() {
  const [radius, setRadius] = useState(2),
    [rate, setRate] = useState(1);
  const key = [radius, 0],
    rows = deltaMemory([key], [3], rate);
  return <FlowLab id="rwkv-nonunit" label="How does address length change correction strength?">
    <RwkvDeltaDrawing before={[0, 0]} keyVector={key} target={3} rate={rate} />
    <FlowControls><FlowSlider name="Key radius" value={radius} min={0} max={3} step={.05} onChange={setRadius} /><FlowSlider name="Rate β" value={rate} min={0} max={1} step={.01} onChange={setRate} /></FlowControls>
    <FlowReadout>The read after one correction is {f(dot(rows[0].delta, key))}; effective step β‖k‖² is {f(rate * radius ** 2)}. A zero key cannot be corrected by this update.</FlowReadout>
  </FlowLab>;
}
export function RwkvRowGateFlow() {
  const [first, setFirst] = useState(.5),
    [second, setSecond] = useState(.5);
  const fixture = workedSummary();
  let state = [0, 0];
  const outputs = fixture.values.map((value, t) => {
    const gates = t === 2 ? [first, second] : [.5, .5];
    state = state.map((entry, i) => entry * gates[i] + fixture.keys[t][i] * value);
    return dot(fixture.queries[t], state);
  });
  return <FlowLab id="rwkv-row-gates" label="Which address row forgets at the third write?">
    <RwkvMatrixRetentionDrawing gates={[first, second]} state={[1, 8]} query={[1, 2]} />
    <FlowControls><FlowSlider name="Third-write first-row gate" value={first} min={0} max={1} step={.01} onChange={setFirst} /><FlowSlider name="Third-write second-row gate" value={second} min={0} max={1} step={.01} onChange={setSecond} /></FlowControls>
    <FlowReadout>Only the third gate changes. Unnormalized outputs are {list(outputs)}. No denominator makes these outputs a convex average.</FlowReadout>
  </FlowLab>;
}
export function RwkvCacheFlow() {
  const [positions, setPositions] = useState(4096);
  const mha = positions * 24576 / 2 ** 20,
    gqa = positions * 6144 / 2 ** 20;
  return <FlowLab id="rwkv-cache-bytes" label="How does persistent storage grow with context?">
    <figure className="rwkv-flow-drawing" data-figure="rwkv-cache-shapes"><RwkvFlowScroll label="Cache shapes and computed storage"><svg viewBox="0 0 350 640" role="img" aria-label="Fixed recurrent matrices beside cache rows growing with token count; computed storage only">
      <text x="70" y="20" textAnchor="middle" fill="#ddd">fixed matrix/head</text><text x="250" y="20" textAnchor="middle" fill="#ddd">five fixed R4 slots</text>
      {Array.from({
            length: 3
          }, (_, i) => Array.from({
            length: 3
          }, (_, j) => <rect key={`m${i}-${j}`} x={28 + j * 26} y={37 + i * 26} width="24" height="24" fill="#151515" stroke="#ddd" />))}
      {Array.from({
            length: 5
          }, (_, i) => Array.from({
            length: 3
          }, (_, j) => <rect key={`s${i}-${j}`} x={214 + j * 24} y={37 + i * 15} width="22" height="13" fill="#151515" stroke="#ddd" />))}
      <text x="70" y="132" textAnchor="middle" fill="#aaa">64×64; cutaway</text><text x="250" y="132" textAnchor="middle" fill="#aaa">512 each; cutaway</text>
      {[['K', 41], ['V', 218]].map(([name, left]) => <g key={name}><text x={left + 37} y="165" textAnchor="middle" fill="#ddd">{name}: {positions} rows</text>{Array.from({
              length: Math.min(positions, 4)
            }, (_, i) => Array.from({
              length: 3
            }, (_, j) => <rect key={`${i}-${j}`} x={left + j * 25} y={182 + i * 17} width="23" height="15" fill="#151515" stroke="#ddd" />))}<text x={left + 37} y="268" textAnchor="middle" fill="#aaa">{positions > 4 ? 'first 4 shown; …' : positions === 0 ? 'empty cache' : 'all rows shown'}</text></g>)}
      {[[320, 'matrix core', '8×64×64', 1.5], [400, 'R4 slots', '5×512', .1171875], [480, 'MHA KV', `${positions}×8×64×2`, mha], [560, 'GQA KV', `${positions}×2×64×2`, gqa]].map(([y, name, shape, bytes]) => <g key={name}>
        <text x="12" y={y} fill="#ddd">{name}</text><text x="12" y={y + 20} fill="#aaa">{shape} / layer</text>
        <rect x="160" y={y - 13} width={bytes / 192 * 175} height="19" fill="#c1a0dc" />
        <text x="160" y={y + 28} fill="#c1a0dc">{f(bytes, 5)} MiB</text>
      </g>)}<text x="175" y="630" textAnchor="middle" fill="#aaa">12 layers; batch 1; fixed scale 0…192 MiB</text>
    </svg></RwkvFlowScroll><figcaption>Matrix core uses float32, KV uses float16, R4 slots float32. Matrix core excludes shifts; all totals exclude parameters, activations, temporary buffers and allocator overhead.</figcaption></figure>
    <FlowControls><FlowSlider name="Cached positions T" value={positions} min={0} max={8192} step={1} onChange={setPositions} /></FlowControls>
    <FlowReadout>At {positions} positions, full KV needs {positions * 24576} bytes ({f(mha)} MiB); grouped KV needs {positions * 6144} bytes ({f(gqa)} MiB). Matrix core stays 1.5 MiB and five-vector R4 state stays 120 KiB; a zero-token cache has zero KV payload.</FlowReadout>
  </FlowLab>;
}

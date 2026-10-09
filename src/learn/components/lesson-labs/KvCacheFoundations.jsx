import { useState } from 'react';
import { cacheColors, traceAttention, causalReach, maskedTrace, poisonedTail } from '../../data/kv-cache-models.js';
import { Figure, Controls, Range, Check, Select, Scroll, Table, Matrix, Pair, Arrow, Tokens, Bars,
  VectorPlot, Slots, fmt, vec, useCacheObservations, ObservationStatus } from './KvCacheShared.jsx';

export function KvTokenLoop() {
  return <Figure id="D01" caption="Selecting an ID and processing it are different events. The first selected output has no stored K/V until the next call.">
    <Tokens title="Call 1 · prefill the three prompt positions" items={['the', 'cat', 'sat']} />
    <Arrow>↓ token + position embeddings → decoder layers → final row</Arrow>
    <Bars title="Illustrative vocabulary logits at prompt position 2" names={['the', 'cat', 'sat', 'down']} values={[-1, .2, .5, 2]} maximum={2} signed />
    <Arrow>select down → emit ID at position 3 → feed this ID into call 2</Arrow>
    <Tokens title="Just after selection · 3 processed / 1 selected" items={['the', 'cat', 'sat', 'down']} valid={3} selected={3} />
    <Arrow>↓ call 2 processes down, writes its K/V, then selects another ID</Arrow>
    <Slots title="After call 2 · four cache positions" length={4} capacity={4} labels />
  </Figure>;
}

export function KvCausalCone() {
  const [unrestricted, setUnrestricted] = useState(false);
  const [edit, setEdit] = useState(3);
  const reach = causalReach(edit, unrestricted);
  return <Figure id="D02" caption="An outline marks states that may depend on the edited input. This is a dependency graph, not a claim that every permitted path changes every numerical output.">
    <Scroll label="Two-layer causal dependency graph">
      <svg className="kv-dependency" viewBox="0 0 540 300" role="img" aria-label={`Edit at position ${edit}; ${unrestricted ? 'all-to-all' : 'causal'} attention`}>
        {[0, 1].flatMap(layer => [0, 1, 2, 3].flatMap(query => [0, 1, 2, 3].filter(key => unrestricted || key <= query).map(key =>
          <line key={`${layer}-${query}-${key}`} x1={115 + 110 * key} y1={50 + layer * 100} x2={115 + 110 * query} y2={150 + layer * 100}
            stroke={reach[layer][key] ? cacheColors[key] : '#535765'} opacity={reach[layer][key] ? .75 : .35} />))) }
        {reach.map((row, layer) => <g key={layer}>
          <text x="8" y={55 + layer * 100}>{['input', 'layer 1', 'layer 2'][layer]}</text>
          {row.map((changed, position) => <g key={position}>
            <circle cx={115 + 110 * position} cy={50 + layer * 100} r="20" fill="#1b1c21" stroke={changed ? '#fff' : cacheColors[position]} strokeWidth={changed ? 3 : 1} />
            <text x={115 + 110 * position} y={55 + layer * 100} textAnchor="middle" style={{ fill: cacheColors[position] }}>{position}</text>
          </g>)}
        </g>)}
      </svg>
    </Scroll>
    <p>Old positions affected at layer 2: {reach[2].slice(0, 3).flatMap((value, index) => value ? [index] : []).join(', ') || 'none'}.</p>
    <Controls reset={() => { setUnrestricted(false); setEdit(3); }}>
      <Range label="Edited input position" value={edit} min={0} max={3} onChange={setEdit} />
      <Check label="Unrestricted attention" checked={unrestricted} onChange={setUnrestricted} />
    </Controls>
  </Figure>;
}

export function KvLayerStores() {
  return <Figure id="D03" caption="Two illustrative layer stores. Axes: one batch, one shown head, three token positions, two coordinates per K or V. Each layer projects its own hidden rows; numbers below are a constructed structural example.">
    {[0, 1].map(layer => <div className="kv-stage" key={layer}>
      <p>Layer {layer + 1} · current hidden row → Q, K, V</p>
      <Pair><Matrix title={`Layer ${layer + 1} keys [1,1,3,2]`} rows={layer ? [[.5, 2], [1, -1], [2, .5]] : [[1, 0], [0, 1], [1, 1]]} rowLabels={['the · 0', 'cat · 1', 'sat · 2']} />
        <Matrix title={`Layer ${layer + 1} values [1,1,3,2]`} rows={layer ? [[2, 1], [-1, 2], [.5, 1]] : [[2, 0], [0, 2], [1, 1]]} rowLabels={['the · 0', 'cat · 1', 'sat · 2']} /></Pair>
      <p>Q reads this layer's K/V → attention output → discard this Q after its read.</p>
    </div>)}
  </Figure>;
}

export function KvAttentionRead() {
  const initial = Math.SQRT2 * Math.log(2);
  const [qx, setQx] = useState(initial);
  const [qy, setQy] = useState(0);
  const [value, setValue] = useState(2);
  const [equal, setEqual] = useState(false);
  const result = traceAttention({ qx, qy, value, equal });
  return <Figure id="D04" caption="Three occupied records, before the append. At the initial query the weights are 2/5, 1/5, 2/5 and the output is [6/5, 4/5]. Arrows use equal x/y scales and join head to tail.">
    <Pair><Matrix title={`Query ${vec(result.query)} reads these keys`} rows={result.keys} rowLabels={['the · 0', 'cat · 1', 'sat · 2']} />
      <Matrix title="Stored value coordinates" rows={result.values} rowLabels={['the · 0', 'cat · 1', 'sat · 2']} /></Pair>
    <Table label="Dot products become one probability distribution" headers={['record', 'q·k / √2', 'weight', 'weighted value']}
      rows={result.scores.map((score, index) => [index, score, result.weights[index], vec(result.contributions[index])])} />
    <VectorPlot title={`Weighted-value sum = ${vec(result.output)}`} chained vectors={result.contributions.map((valueAt, index) => ({ label: `record ${index}`, value: valueAt }))} />
    <Controls reset={() => { setQx(initial); setQy(0); setValue(2); setEqual(false); }}>
      <Range label="Query x" value={qx} min={-2} max={2} step="any" onChange={setQx} />
      <Range label="Query y" value={qy} min={-2} max={2} step={.05} onChange={setQy} />
      <Range label="Record 0 value x" value={value} min={-2} max={3} step={.1} onChange={setValue} disabled={equal} />
      <Check label="All values equal [1, 0.5]" checked={equal} onChange={setEqual} />
    </Controls>
  </Figure>;
}

export function KvAppend() {
  const [step, setStep] = useState(1);
  const [key, setKey] = useState(-1);
  const [value, setValue] = useState(-1);
  const result = traceAttention({ append: true, newKey: key, newValue: value });
  return <Figure id="D05" caption="The new projected record is written at position 3 before a read can include it. Steps reconstruct snapshots, so moving back and forward never appends twice.">
    <Slots title={step === 0 ? 'Before append' : 'After append'} length={step === 0 ? 3 : 4} capacity={6} labels />
    <Pair><Matrix title="K backing store" rows={[...result.keys.slice(0, step === 0 ? 3 : 4), ...Array.from({ length: step === 0 ? 3 : 2 }, () => ['unused', 'unused'])]} selected={step > 0 ? 3 : -1} />
      <Matrix title="V backing store" rows={[...result.values.slice(0, step === 0 ? 3 : 4), ...Array.from({ length: step === 0 ? 3 : 2 }, () => ['unused', 'unused'])]} selected={step > 0 ? 3 : -1} /></Pair>
    <p>{step < 2 ? 'Read preview after the write' : 'Current read over four occupied records'}: weights {vec(result.weights)} → output {vec(result.output)}.</p>
    <Controls reset={() => { setStep(1); setKey(-1); setValue(-1); }}>
      <Select label="Operation" value={step} onChange={valueAt => setStep(Number(valueAt))} options={[[0, 'Before append'], [1, 'Write position 3'], [2, 'Read occupied records']]} />
      <Range label="New key x" value={key} min={-2} max={2} step={.1} onChange={setKey} />
      <Range label="New value x" value={value} min={-2} max={2} step={.1} onChange={setValue} />
    </Controls>
  </Figure>;
}

export function KvOffsetMask() {
  const [past, setPast] = useState(3);
  const [count, setCount] = useState(2);
  const [mode, setMode] = useState('correct');
  const current = maskedTrace(past, count, mode);
  const correct = maskedTrace(past, count, 'correct');
  return <Figure id="D06" caption="Read permission requires both a valid stored key and key position ≤ query position. The wrong upper-left mask forgets the past-length offset; all comparisons use the same Q/K/V.">
    <Matrix title={`${count} query rows × ${past + count + 2} physical key slots`} rows={current.grid.map(row => row.map(cell => cell[mode] ? 'read' : '×'))}
      rowLabels={current.grid.map(row => `query ${row[0].position}`)} columnLabels={current.grid[0].map(cell => `key ${cell.key}`)} permitted={current.grid.map(row => row.map(cell => cell[mode]))} />
    <Table label="Actual finite attention outputs" headers={['query position', 'selected mask', 'correct offset mask']}
      rows={current.results.map((result, index) => [past + index, vec(result.output), vec(correct.results[index].output)])} />
    <Controls reset={() => { setPast(3); setCount(2); setMode('correct'); }}>
      <Range label="Past length P" value={past} min={0} max={4} onChange={setPast} />
      <Range label="New query rows T" value={count} min={1} max={3} onChange={setCount} />
      <Select label="Permission rule" value={mode} onChange={setMode} options={[["correct", 'Offset causal'], ['upperLeft', 'Wrong upper-left triangle']]} />
    </Controls>
  </Figure>;
}

export function KvPoisonedCapacity() {
  const [poison, setPoison] = useState(20);
  const [omit, setOmit] = useState(false);
  const result = poisonedTail(poison, omit);
  const reference = poisonedTail(poison, false);
  return <Figure id="D07" caption="Allocated tail rows exist physically but are not request history. Finite changes to their values leave the correctly masked output unchanged.">
    <Slots title="Occupied boundary" length={5} capacity={7} labels />
    <Matrix title="Value storage including unused slots 5 and 6" rows={result.values} permitted={result.valid.map(valid => [valid, valid])} />
    <Bars title="Attention mass by physical slot" names={result.weights.map((_, index) => `slot ${index}`)} values={result.weights} maximum={1} />
    <p>Current output {vec(result.output)}; correctly masked reference {vec(reference.output)}.</p>
    <Controls reset={() => { setPoison(20); setOmit(false); }}>
      <Range label="Unused-slot value" value={poison} min={-50} max={50} onChange={setPoison} />
      <Check label="Omit occupied-length validity mask" checked={omit} onChange={setOmit} />
    </Controls>
  </Figure>;
}

export function KvPadding() {
  return <Figure id="D08" caption="The validity mask identifies padding; token ID 0 can also be a real token. Logical positions count valid tokens while physical backing slots include the padding columns.">
    <Matrix title="Two padded input requests · physical columns 0–3" identity={false} columnLabels={['slot 0', 'slot 1', 'slot 2', 'slot 3']}
      rowLabels={['A token ID', 'A valid', 'A position', 'B token ID', 'B valid', 'B position']}
      rows={[[0, 0, 7, 8], [0, 0, 1, 1], ['—', '—', 0, 1], [0, 4, 5, 6], [1, 1, 1, 1], [0, 1, 2, 3]]} />
    <Pair><Tokens title="A logical history" items={['7', '8']} /><Tokens title="B logical history · leading ID 0 is valid" items={['0', '4', '5', '6']} /></Pair>
    <p>A's next real logical position is 2; B's is 4. Their shared rectangular backing length is four physical slots.</p>
  </Figure>;
}

function DecoderBlockDrawing({ layer }) {
  const color = cacheColors[layer];
  return <Scroll label={`Layer ${layer + 1} residual and cache paths`}>
    <svg viewBox="0 0 440 330" className="kv-decoder-block" role="img"
      aria-label="A width-16 hidden row splits into a residual bypass and normalized attention. Their sum splits into a second residual bypass and normalized MLP; a second sum yields the next layer row. Keys and values are written to this layer's cache and read by attention.">
      <g fill="none" stroke={color} strokeWidth="2">
        <path d="M190 28V55M190 28H35V150H175M190 120V135M190 165V195M190 180H35V285H175M190 250V270M190 300V325" />
        <rect x="100" y="55" width="180" height="65" />
        <rect x="100" y="195" width="180" height="55" />
        <circle cx="190" cy="150" r="15" /><circle cx="190" cy="285" r="15" />
        <path d="M280 75H360V105H280M350 69L360 75L350 81M290 99L280 105L290 111" />
      </g>
      <text x="190" y="20" textAnchor="middle">hidden row · 16</text>
      <text x="190" y="80" textAnchor="middle">normalize → Q/K/V</text>
      <text x="190" y="105" textAnchor="middle">attention → project</text>
      <text x="370" y="85">K/V</text><text x="370" y="110">store</text>
      <text x="190" y="156" textAnchor="middle">+</text>
      <text x="190" y="218" textAnchor="middle">normalize → MLP</text>
      <text x="190" y="242" textAnchor="middle">16 → 64 → 16</text>
      <text x="190" y="291" textAnchor="middle">+</text>
      <text x="44" y="43">bypass</text><text x="44" y="174">bypass</text>
    </svg>
  </Scroll>;
}

export function KvDecoder() {
  const { data, error, retry } = useCacheObservations();
  const [layer, setLayer] = useState(0);
  const [schedule, setSchedule] = useState(2);
  if (!data) return <Figure id="D09" caption="The complete decoder has three actual layers."><ObservationStatus error={error} retry={retry} /></Figure>;
  const record = data.decoder.cases[schedule];
  const steps = record.chunks;
  return <Figure id="D09" caption="Executed random TinyLM: two requests, three layers, model width 16, four heads of width 4. One request's current row follows the main path; each layer has its own K/V. Shapes are derived from the recorded architecture, not invented saved coordinates.">
    <Tokens title="Request A's eight supplied token IDs · selected chunk schedule below" items={[1, 4, 7, 2, 9, 3, 8, 5]} />
    <Arrow>token embedding + absolute position embedding · width 16</Arrow>
    <div className="kv-stack">{[0, 1, 2].map(index => <div key={index} className={`kv-stage ${layer === index ? 'kv-selected' : ''}`} style={{ '--kv-identity': cacheColors[index] }}>
      <p>Layer {index + 1} · two residual additions preserve a path for the current row</p>
      <Pair><DecoderBlockDrawing layer={index} />
        <div><Slots title={`Layer ${index + 1} K and V · 4 heads × 4 coordinates each`} length={8} capacity={10} color={cacheColors[index]} /><p>Each backing tensor has shape [2, 4, 10, 4]. Write new rows only; old rows stay stored.</p></div></Pair>
    </div>)}</div>
    <Arrow>final normalization → vocabulary head → logits for new rows</Arrow>
    <Table label="Recorded full-versus-cached comparison" headers={['quantity', 'value']}
      rows={[["chunk lengths", vec(steps)], ['maximum absolute logit error', record.max_absolute_error], ['occupied bytes', record.occupied_bytes], ['reserved bytes', record.reserved_bytes]]} />
    <Controls reset={() => { setLayer(0); setSchedule(2); }}>
      <Select label="Inspect layer" value={layer} onChange={value => setLayer(Number(value))} options={[[0, 'Layer 1'], [1, 'Layer 2'], [2, 'Layer 3']]} />
      <Select label="Recorded schedule" value={schedule} onChange={value => setSchedule(Number(value))} options={data.decoder.cases.map((row, index) => [index, vec(row.chunks)])} />
    </Controls>
  </Figure>;
}

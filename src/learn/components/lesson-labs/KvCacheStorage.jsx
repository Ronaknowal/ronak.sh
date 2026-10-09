import { useState } from 'react';
import { cacheColors, poolFixture, appendPool, releasePool, quantize, precisionTrace, latentTrace } from '../../data/kv-cache-models.js';
import { Figure, Controls, Range, Check, Select, Scroll, Table, Matrix, Pair, Arrow, Tokens, Bars, VectorPlot, Slots, fmt, vec } from './KvCacheShared.jsx';

export function KvPages() {
  const [pool, setPool] = useState(poolFixture);
  const [position, setPosition] = useState(9);
  const row = pool.requests.A;
  const selected = Math.min(position, row.length - 1);
  const logical = Math.floor(selected / pool.size);
  const physical = row.table[logical];
  const offset = selected % pool.size;
  return <Figure id="D20" caption="A scalar record coordinate makes addresses inspectable; the same table addresses complete K/V rows in the supplied program. Pages are exclusive here. Request B's release can free a nonadjacent page; exhausted appends leave live state unchanged.">
    <Table label="Request block tables" headers={['request', 'occupied records', 'physical pages in logical order']}
      rows={Object.entries(pool.requests).map(([id, entry]) => [id, entry.length, vec(entry.table)])} />
    <Arrow>position {selected} → logical block {logical}, offset {offset} → physical page {physical}</Arrow>
    <Matrix title="Physical page pool · each row is a page" rows={pool.pages.map(page => page.map(value => value == null ? 'free' : value))}
      rowLabels={pool.pages.map((_, index) => `page ${index}`)} selected={physical} columnLabels={['offset 0', 'offset 1', 'offset 2', 'offset 3']} />
    <p>Read record: {pool.pages[physical][offset]}. Free pages: {vec(pool.free)}.</p>
    {pool.error && <p role="status">{pool.error}</p>}
    <Controls reset={() => { setPool(poolFixture()); setPosition(9); }}>
      <Range label="Logical record position" value={selected} min={0} max={row.length - 1} onChange={setPosition} />
      <button type="button" onClick={() => setPool(previous => appendPool(previous, 'A', [previous.requests.A.length]))}>Append one A record</button>
      <button type="button" disabled={!pool.requests.B} onClick={() => setPool(previous => releasePool(previous, 'B'))}>Release request B</button>
    </Controls>
  </Figure>;
}

export function KvSharedPrefix() {
  return <Figure id="D21" caption="A shared read-only prefix can serve two continuations when its complete computation identity agrees. This drawing motivates sharing; this lesson's exclusive pool does not implement reference counts or copy-on-write.">
    <Tokens title="One valid prefix object" items={['the', 'cat', 'sat']} />
    <div className="kv-fork"><div className="kv-fork-line" /><Pair>
      <div><Arrow>↙ request A references the same prefix</Arrow><Tokens title="A owned continuation" items={['down', 'quietly']} offset={3} color={cacheColors[0]} /></div>
      <div><Arrow>↘ request B references the same prefix</Arrow><Tokens title="B owned continuation" items={['beside', 'Alice']} offset={3} color={cacheColors[1]} /></div>
    </Pair></div>
    <Slots title="A shared page of size 4 with three valid prefix cells" length={3} capacity={4} color={cacheColors[2]} labels />
    <p>The fourth slot is physically free but the page is shared. A continuation must not overwrite another request's history; private writable storage or copy-on-write resolves that next.</p>
  </Figure>;
}

export function KvPacking() {
  const [value, setValue] = useState(7 / 15);
  const [count, setCount] = useState(5);
  const [bits, setBits] = useState(4);
  const [constant, setConstant] = useState(false);
  const values = Array.from({ length: count }, (_, index) => constant ? 2.5 : [0, 1, value, 8 / 15, 3 / 15, .25, .7, .9][index]);
  const group = quantize(values, bits);
  return <Figure id="D22" caption="Each supplied array is one flattened group. Four-bit codes occupy low then high nibbles; an odd final count leaves one unused high nibble. One FP32 scale plus one FP32 offset costs eight bytes, separate from shape metadata and any full-precision residual.">
    <Matrix title="One group: values → codes → reconstructed coordinates" identity={false}
      rows={[group.source, group.codes, group.reconstructed]} rowLabels={['input FP32', `${bits}-bit code`, 'reconstructed']} />
    <p>Offset {fmt(group.offset)}; scale {fmt(group.scale)}. Constant groups use scale0/code0 and reconstruct the offset.</p>
    <Arrow>pack integer codes into bytes</Arrow>
    <div className="kv-byte-row">{group.payload.map((byte, index) => <div className="kv-byte" key={index}>
      <span>byte {index}: {byte}</span>
      {bits === 4 ? <div><span style={{ color: cacheColors[(2 * index + 1) % 5] }}>high {2 * index + 1 < count ? byte >> 4 : 'unused 0'}</span>
        <span style={{ color: cacheColors[(2 * index) % 5] }}>low {byte & 15}</span></div>
        : <span>{byte.toString(2).padStart(8, '0')}</span>}
    </div>)}</div>
    <Table label="Actual finite storage counts" headers={['part', 'bytes']}
      rows={[["Uint8 payload", group.bytes], ['FP32 scale + offset', 8], ['total of these parts', group.bytes + 8], ['same values in FP16', group.fp16]]} />
    <Controls reset={() => { setValue(7 / 15); setCount(5); setBits(4); setConstant(false); }}>
      <Range label="Third value" value={value} min={0} max={1} step="any" onChange={setValue} disabled={constant} />
      <Range label="Group coordinates" value={count} min={3} max={8} onChange={setCount} />
      <Select label="Code bits" value={bits} options={[[4, '4'], [8, '8']]} onChange={next => setBits(Number(next))} />
      <Check label="Constant group [2.5, …]" checked={constant} onChange={setConstant} />
    </Controls>
  </Figure>;
}

export function KvPrecision() {
  const [qx, setQx] = useState(.7);
  const [value, setValue] = useState(.12);
  const [route, setRoute] = useState('both');
  const [equal, setEqual] = useState(false);
  const trace = precisionTrace({ qx, value, route, equal });
  const threshold = quantize([0, .49, 1]);
  return <Figure id="D23" caption="Changing K changes scores and weights; changing V changes the values being mixed. These are numerical-coordinate experiments, not measured language-model quality. Equal values give a useful null even if attention weights move.">
    <Pair><Matrix title="Keys read by the selected route" rows={trace.currentKeys} />
      <Matrix title="Values read by the selected route" rows={trace.currentValues} /></Pair>
    <Pair><Bars title="Original attention weights" values={trace.exact.weights} maximum={1} />
      <Bars title="Selected-route attention weights" values={trace.current.weights} maximum={1} /></Pair>
    <VectorPlot title={`Original/changed outputs · max absolute difference ${fmt(trace.error)}`} vectors={[
      { label: 'original', value: trace.exact.output, color: cacheColors[0] },
      { label: 'selected route', value: trace.current.output, color: cacheColors[2] },
    ]} />
    <Controls reset={() => { setQx(.7); setValue(.12); setRoute('both'); setEqual(false); }}>
      <Range label="Query x (query y stays −0.4)" value={qx} min={-2} max={2} step={.05} onChange={setQx} />
      <Range label="First value x" value={value} min={-1} max={1} step={.01} onChange={setValue} disabled={equal} />
      <Select label="Quantized parts" value={route} options={[["keys", 'K only'], ['values', 'V only'], ['both', 'K and V']]} onChange={setRoute} />
      <Check label="All V coordinates equal 0.75" checked={equal} onChange={setEqual} />
    </Controls>
    <Table label="Separate constructed close-decision witness" headers={['coordinate', 'original', 'reconstructed', 'above 0.48?']}
      rows={[["middle of [0, .49, 1]", .49, threshold.reconstructed[1], 'original yes; reconstructed no']]} />
  </Figure>;
}

export function KvOffload() {
  return <Figure id="D24" caption="Storage-tier schedule, not measured transfer time. The host keeps other layers' cache; the device keeps model weights and the layer currently being processed. Arrows move cache state, not model weights.">
    <div className="kv-tier-grid">
      <div className="kv-stage"><p>Host RAM</p><Slots title="Layer 1 cache" length={4} capacity={4} color={cacheColors[0]} />
        <Slots title="Layer 2 cache" length={4} capacity={4} color={cacheColors[1]} /><Slots title="Layer 3 cache" length={4} capacity={4} color={cacheColors[2]} /></div>
      <div className="kv-stage"><p>Device memory</p><p>Model weights remain here</p><Slots title="Current layer 2 cache" length={4} capacity={4} color={cacheColors[1]} /></div>
    </div>
    <Scroll label="Host-device ordered transfer diagram">
      <svg viewBox="0 0 620 230" className="kv-transfer-drawing" role="img" aria-label="Ordered baseline: fetch layer 1, compute it, return its cache, then repeat for layers 2 and 3. Horizontal spacing is event order, not elapsed time. The table describes possible overlap separately.">
        <text x="5" y="55">host</text><text x="5" y="175">device</text>
        <path d="M85 50H600M85 170H600" stroke="#767a87" fill="none" />
        {[0, 1, 2].map((layer, index) => <g key={layer}>
          <path d={`M${110 + index * 165} 55v100l-5-9m5 9l5-9`} stroke={cacheColors[layer]} fill="none" strokeWidth="2" />
          <rect x={120 + index * 165} y="158" width="70" height="24" stroke={cacheColors[layer]} fill="#202127" />
          <text x={155 + index * 165} y="175" textAnchor="middle">layer {layer + 1}</text>
          <text x={110 + index * 165} y="32" textAnchor="middle">fetch K/V</text>
          <path d={`M${200 + index * 165} 157v-95l-5 9m5-9l5 9`} stroke={cacheColors[layer]} fill="none" strokeWidth="2" />
          <text x={200 + index * 165} y="213" textAnchor="middle">return K/V</text>
        </g>)}
      </svg>
    </Scroll>
    <p>Horizontal order shows dependencies only; bar widths are not measured durations. A transfer contains the layer's cache payload M bytes.</p>
    <Table label="Ordered transfer and compute events" headers={['stage', 'cache operation', 'overlap opportunity']}
      rows={[[1, 'fetch layer 1 cache → compute layer 1', 'prefetch layer 2 if resources permit'],
        [2, 'return layer 1; use layer 2', 'prefetch layer 3'], [3, 'return layer 2; use layer 3', 'later cleanup/return']]} />
    <p>Moving M bytes over effective bandwidth β bytes/second requires at least M/β seconds for that transfer. With no overlap, transfer and compute times add; ideal overlap can hide only the part that actually runs concurrently. A round trip counts both directions.</p>
  </Figure>;
}

export function KvLatent() {
  const [coefficient, setCoefficient] = useState(2);
  const [angle, setAngle] = useState(60);
  const row = latentTrace(coefficient, angle * Math.PI / 180);
  return <Figure id="D25" caption="Both paths use the same unscaled content scores and softmax. Reassociation is exact for these linear content projections; a position-dependent rotation cannot generally be moved through an arbitrary projection. The separate rotary-key cache is additional state.">
    <Matrix title="Latent cache C · token rows, latent coordinates" rows={row.latent} />
    <Pair><div><Arrow>C × Uₖ → expanded K; C × Uᵥ → expanded V</Arrow>
      <Matrix title="Uₖ · latent to key coordinates" rows={row.upKeys} identity={false} />
      <Matrix title="Expanded K" rows={row.keys} /><Matrix title="Expanded V" rows={row.values} />
      <p>q = {vec(row.query[0])}; direct scores {vec(row.scores)}.</p></div>
      <div><Arrow>q × Uₖᵀ → absorbed query → read C directly</Arrow>
        <Matrix title="Absorbed query" rows={row.absorbed} identity={false} />
        <p>Latent scores {vec(row.absorbedScores)}; shared weights {vec(row.weights)}.</p>
        <Matrix title="Mixed latent aC" rows={row.mixed} identity={false} />
        <Matrix title="Uᵥ · latent to value coordinates" rows={row.upValues} identity={false} />
        <Arrow>(aC) × Uᵥ → output</Arrow>
      </div></Pair>
    <Table label="Same content result" headers={['route', 'output coordinates']} rows={[["a × expanded V", vec(row.direct)], ['(aC) × Uᵥ', vec(row.output)]]} />
    <Pair><VectorPlot title="Projection and rotation order" vectors={[
      { label: 'project then rotate', value: row.after, color: cacheColors[0] },
      { label: 'rotate then project', value: row.before, color: cacheColors[2] },
    ]} /><div className="kv-stage"><p>Decoupled positional branch</p><p>position query × retained rotary key → add to content score</p>
      <Slots title="Paper example · latent components (representative 8 shown of 512)" length={8} capacity={8} color={cacheColors[3]} />
      <Slots title="Rotary components (representative 2 shown of 64)" length={2} capacity={2} color={cacheColors[4]} />
      <p>Actual dimensions: 512 + 64 = 576 elements per token per layer. Drawing uses representative columns, not a scale comparison.</p></div></Pair>
    <Controls reset={() => { setCoefficient(2); setAngle(60); }}>
      <Range label="C row 0, coordinate 1" value={coefficient} min={-2} max={3} step={.1} onChange={setCoefficient} />
      <Range label="Rotation angle in degrees" value={angle} min={0} max={90} onChange={setAngle} />
    </Controls>
  </Figure>;
}

export function KvDiagnosis() {
  return <Figure id="D26" caption="A concrete wrong-offset failure: [2, 0] comes from reading only record 0. More capacity or fewer bits cannot repair that permission error.">
    <Pair><Matrix title="Wrong upper-left mask · query at logical position 3" rows={[[1, 0, 0, 0]]} columnLabels={['key 0', 'key 1', 'key 2', 'key 3']} rowLabels={['allowed']} permitted={[[true, false, false, false]]} />
      <Matrix title="Correct offset mask · same query and records" rows={[[1, 1, 1, 1]]} columnLabels={['key 0', 'key 1', 'key 2', 'key 3']} rowLabels={['allowed']} /></Pair>
    <Pair><VectorPlot title="Observed wrong read" vectors={[{ label: 'only V₀', value: [2, 0] }]} />
      <VectorPlot title="Repaired read" vectors={[{ label: 'weighted V over all four', value: [1, 9 / 11], color: cacheColors[1] }]} /></Pair>
    <div className="kv-stack">{[
      ['1 · same input function', 'Compare weights, IDs and evaluation state. A mismatch here changes the intended computation.'],
      ['2 · positions and permission cells', 'Inspect the actual query/key indices. This example fails here: only key 0 is permitted.'],
      ['3 · each layer’s state', 'Check stored lengths, head dimensions and reset after an edited prefix; poison unused slots.'],
      ['4 · numerical comparison', 'Retain fixed-tolerance failures and discrete-ID agreement separately.'],
      ['5 · capacity, then performance', 'Count actual owned payload before interpreting matched timings, including slow calls.'],
    ].map(([title, text], index) => <div className="kv-stage" key={title} style={{ '--kv-identity': cacheColors[index] }}><p>{title}</p><p>{text}</p></div>)}</div>
  </Figure>;
}

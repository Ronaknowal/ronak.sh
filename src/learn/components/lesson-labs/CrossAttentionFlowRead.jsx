import { useState } from 'react';
import examples from '../../data/cross-attention-examples.json';
import { attention, affine, pullback, resizeFixture, exactFixture } from '../../data/cross-attention-flow-models.js';
import { projectMemory, readMemory } from '../../data/cross-attention-models.js';
import { FlowLab, FlowControls, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { CrossFigure, CrossMatrix, CrossVector, CrossArrow, CrossBranches, CrossNumber, CrossReadWiring, crossNumber as f } from './CrossAttentionFlowFigures.jsx';
import { useCrossFlow } from './CrossAttentionFlowState.jsx';

function resultOf(state) { return attention(state.query, state.key, state.value, state.allowed); }
const vec = values => values ? `[${values.map(v => f(v)).join(', ')}]` : 'undefined';
function reset(s) { s.setRead(exactFixture()); s.setReader(0); s.setCell(['key', 0, 0]); s.setPinned(null); }
export function CrossReadAnatomy() {
  const { read,reader } = useCrossFlow(), r = resultOf(read);
  return <CrossFigure job="D02" label="Requests match donor keys, then carry donor values" caption="Cyan denotes supplied features; violet denotes computed scores, shares and returned rows. These are constructed projected features, not pixel meanings. Each returned row follows its request.">
    <CrossReadWiring trace={r} reader={reader}/>
    <p>The white request route fans to the donor keys. Each donor's share multiplies its carried V; product routes join at + and return to the selected reader's answer. Pan the wiring horizontally if needed; the same arrays follow below in stacked stages.</p>
    <CrossMatrix values={read.query} label="Reader requests Q" rows={read.query.map((_, i) => `reader ${i}`)} role="input" />
    <CrossArrow>Each reader compares with every donor key.</CrossArrow>
    <CrossBranches><CrossMatrix values={read.key} label="Donor matching features K" rows={read.key.map((_, i) => `donor ${i}`)} role="input" />
      <CrossMatrix values={read.value} label="Donor carried information V" rows={read.value.map((_, i) => `donor ${i}`)} role="input" /></CrossBranches>
    <CrossArrow>Match keys → normalize scores → combine the carried values.</CrossArrow>
    <CrossMatrix values={r.output.map(row => row ?? rowOfNull(read.value[0].length))} label="One answer row per reader" rows={r.output.map((_, i) => `reader ${i}`)} />
    {r.output.some(row => row === null) && <p>An empty permission row has no defined answer; its table cells read undefined.</p>}
  </CrossFigure>;
}
const rowOfNull = n => Array(n).fill(null);
export function CrossReadTrace() {
  const s = useCrossFlow(), r = resultOf(s.read), i = s.reader, normalized = r.normalized[i];
  const kind = s.cell[0] === 'query' ? 'query' : 'key', row = Math.min(s.cell[1], s.read[kind].length - 1), col = s.cell[2];
  function edit(value) { s.setRead({ ...s.read, [kind]: s.read[kind].map((values, j) => j === row ? values.map((v, k) => k === col ? value : v) : values) }); }
  return <FlowLab id="cross-read-trace" label="Trace and edit one matching coordinate">
    <CrossFigure job="D03" label={`Complete numerical read for reader ${i}`} caption={`Reader ${i}: matching width2 gives divisor√2. Stable exponentials subtract the legal maximum; their normalized shares equal the unshifted exp(score) shares. Select a Q or K cell to edit it below.`}>
      <CrossMatrix values={s.read.query} label="Q: select a request coordinate" rows={s.read.query.map((_, j) => `reader ${j}`)} role="input"
        selected={kind === 'query' ? [row, col] : null} onSelect={(j, k) => s.setCell(['query', j, k])} />
      <CrossMatrix values={s.read.key} label="K: select a matching coordinate" rows={s.read.key.map((_, j) => `donor ${j}`)} role="input"
        selected={kind === 'key' ? [row, col] : null} onSelect={(j, k) => s.setCell(['key', j, k])} />
      <CrossMatrix values={s.read.key.map(k => k.map((v, j) => s.read.query[i][j] * v))} label={`Coordinate products Q[${i}] × each K`} rows={s.read.key.map((_, j) => `donor ${j}`)} />
      <CrossArrow>Sum each donor's products, then divide by√2.</CrossArrow>
      <CrossVector values={r.scores[i]} label="Matching scores, by donor" />
      {normalized ? <><CrossArrow>Exponentiate each permitted score; blocked donors get mass0.</CrossArrow>
        <CrossVector values={r.scores[i].map((v,j)=>s.read.allowed[i][j]?Math.exp(v):0)} label="Unshifted exponential masses, by donor" />
        <CrossArrow>Divide each mass by their sum {f(r.scores[i].reduce((total,v,j)=>total+(s.read.allowed[i][j]?Math.exp(v):0),0))}.</CrossArrow>
        <CrossVector values={r.weights[i]} label="Shares, by donor; sum1" />
        <CrossMatrix values={r.products[i]} label="Share × carried V: one contribution per donor" rows={s.read.key.map((_, j) => `donor ${j}`)} />
        <CrossArrow>Add contributions coordinate by coordinate.</CrossArrow><CrossVector values={r.output[i]} label={`Answer for reader ${i}`} />
        <CrossArrow>Equivalent stable implementation: subtract maximum {f(normalized.maximum)} before exp.</CrossArrow>
        <CrossVector values={normalized.masses} label={`Stable masses have sum${f(normalized.total)}; normalization yields the same shares`} />
      </> : <p role="status">No permitted donors. Choose an explicit empty-context policy; a normalized mixture is undefined.</p>}
    </CrossFigure>
    <FlowControls><FlowChoice label="Reader to trace" options={s.read.query.map((_, j) => [j, `reader ${j}`])} value={i} onChange={s.setReader} />
      <CrossNumber syncKey={s.read} label={`${kind === 'query' ? 'Q' : 'K'} row ${row}, coordinate ${col}`} value={s.read[kind][row][col]} min={-8} max={8} onChange={edit} /></FlowControls>
    <FlowReadout>Reader {i} returns {vec(r.output[i])}. Editing a matching feature can change the shares; the carried V coordinates are unchanged.</FlowReadout>
  </FlowLab>;
}
export function CrossPermissionRead() {
  const s = useCrossFlow(), r = resultOf(s.read), row = Math.min(s.cell[1], s.read.value.length - 1), col = s.cell[2];
  const edit = value => s.setRead({ ...s.read, value: s.read.value.map((v, j) => j === row ? v.map((x, k) => k === col ? value : x) : v) });
  const changeBit = (i, j) => s.setRead({ ...s.read, allowed: s.read.allowed.map((values, ri) => ri === i ? values.map((v, ci) => ci === j ? !v : v) : values) });
  return <FlowLab id="cross-permission-read" label="Permissions and carried-value edits">
    <CrossFigure job="D04" label="Permission precedes normalization" caption="Click a permission cell to change that reader's donor access. A blocked cell contributes no mass. Select any V coordinate; its arbitrary finite value can be−100…100.">
      <CrossMatrix values={s.read.allowed} label="Allowed donor grid" rows={s.read.query.map((_, i) => `reader ${i}`)} columns={s.read.key.map((_, i) => `donor ${i}`)} binary onSelect={changeBit} />
      <CrossArrow>Exclude blocked donors before normalizing each row.</CrossArrow>
      <CrossMatrix values={r.weights.map(row => row ?? rowOfNull(s.read.key.length))} label="Normalized donor shares" rows={s.read.query.map((_, i) => `reader ${i}`)} />
      <CrossMatrix values={s.read.value} label="V: select a carried coordinate" rows={s.read.key.map((_, i) => `donor ${i}`)} role="input" selected={[row, col]} onSelect={(j, k) => s.setCell(['value', j, k])} />
      <CrossArrow>Weight V using the same shares; then sum.</CrossArrow>
      <CrossMatrix values={r.output.map(row => row ?? rowOfNull(s.read.value[0].length))} label="Current returned rows" rows={s.read.query.map((_, i) => `reader ${i}`)} />
    </CrossFigure>
    <FlowControls><CrossNumber syncKey={s.read} label={`V donor ${row}, coordinate ${col}`} value={s.read.value[row][col]} min={-100} max={100} onChange={edit} /></FlowControls>
    <p>Use the exact boundary contrast as a reproducible starting case.</p>
    <div className="cross-flow-actions"><button type="button" onClick={()=>{const next=exactFixture();next.allowed[0][2]=false;s.setRead(next);s.setReader(0);s.setCell(['value',2,0]);}}>Restore fixture; block reader0→donor2</button>
      <button type="button" disabled={s.read.value.length<3} onClick={()=>s.setRead({...s.read,value:s.read.value.map((values,i)=>i===2?[100,-100]:values)})}>Set donor2 value to[100,−100]</button></div>
    <p>Keep a comparison,create an empty-context row,or reset the investigation.</p>
    <div className="cross-flow-actions"><button type="button" onClick={() => s.setPinned(r.output.map(row => row ? [...row] : null))}>Keep current answers for comparison</button>
      <button type="button" onClick={() => s.setRead({ ...s.read, allowed: s.read.allowed.map((row, i) => i === s.reader ? row.map(() => false) : row) })}>Block every donor for reader {s.reader}</button>
      <button type="button" onClick={() => reset(s)}>Reset the constructed read</button></div>
    <FlowReadout>{r.output.map((row, i) => `Reader ${i}: ${vec(row)}.`).join(' ')} {s.pinned && `Kept answers: ${s.pinned.map(vec).join('; ')}.`} {r.output.some(row => row === null) && 'The empty row has no defined mixture; no zero answer is fabricated.'}</FlowReadout>
  </FlowLab>;
}
export function CrossDonorPairing(){const s=useCrossFlow(),r=resultOf(s.read);
  function permute(paired){const order=s.read.key.map((_,i)=>s.read.key.length-1-i);s.setPinned(r.output.map(row=>row?[...row]:null));s.setRead({...s.read,key:paired?order.map(i=>s.read.key[i]):s.read.key,value:order.map(i=>s.read.value[i]),allowed:paired?s.read.allowed.map(row=>order.map(i=>row[i])):s.read.allowed});}
  return <FlowLab id="cross-donor-pairing" label="Preserve or break key,value and permission associations">
    <CrossMatrix values={r.output.map(row=>row??[null,null])} label="Current answers after donor-pairing operations"/>
    <FlowControls><button type="button" onClick={()=>permute(true)}>Reverse paired K/V and mask columns</button><button type="button" onClick={()=>permute(false)}>Reverse V only</button>
      <button type="button" onClick={()=>s.setRead({...s.read,query:s.read.query.map(()=>[...s.read.query[0]]),allowed:s.read.allowed.map(()=>[...s.read.allowed[0]])})}>Make all requests and permissions equal</button></FlowControls>
    <FlowReadout>{s.pinned&&`Before permutation:${s.pinned.map(vec).join('; ')}.`} Current answers:{r.output.map(vec).join('; ')}. A paired donor permutation preserves the mixture; a value-only permutation changes what each key carries. Matrix row labels denote current storage positions after permutation.</FlowReadout>
  </FlowLab>;
}
export function CrossSourceProjection() {
  const x = [[1, 0], [0, 1]], m = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const wq = [[Math.SQRT2, 0], [0, Math.SQRT2]], wk = [[Math.log(2), 0, 0], [0, Math.log(2), 0]], wv = [[2, 0, 2], [0, 4, 2]];
  return <CrossFigure job="D05" label="Separate sources pass through three learned maps" caption="Parameters are stored out×in. A row array uses source × Wᵀ. Biases here are zero. The memory supplies both K and V; the readers supply Q.">
    <CrossBranches><div><CrossMatrix values={x} label="Reader source X: 2×2" role="input" /><CrossArrow>Reader map</CrossArrow><CrossMatrix values={wq} label="WQ: 2×2, output rows × input columns" role="parameter" /><CrossArrow>X × WQᵀ</CrossArrow><CrossMatrix values={affine(x, wq)} label="Projected requests Q" /></div>
      <div><CrossMatrix values={m} label="Memory source M: 3×3" role="input" /><CrossArrow>Memory splits into two learned maps.</CrossArrow><CrossMatrix values={wk} label="WK: 2×3" role="parameter" /><CrossMatrix values={wv} label="WV: 2×3" role="parameter" /><CrossArrow>M × WKᵀ and M × WVᵀ</CrossArrow><CrossMatrix values={affine(m, wk)} label="Projected matching K" /><CrossMatrix values={affine(m, wv)} label="Projected carried V" /></div></CrossBranches>
  </CrossFigure>;
}
export function CrossRectangularShapes() {
  const s = useCrossFlow(), c = s.shape;
  function set(key, value) { s.setShape({ ...c, [key]: value }); }
  function resize(key, value) {
    s.setRead(resizeFixture(s.read, key === 'readers' ? value : s.read.query.length, key === 'memory' ? value : s.read.key.length));
    s.setReader(i => Math.min(i, (key === 'readers' ? value : s.read.query.length) - 1));
    s.setCell(([type, row, coordinate]) => [type, Math.min(row, (type === 'query' ? (key === 'readers' ? value : s.read.query.length) : (key === 'memory' ? value : s.read.key.length)) - 1), coordinate]);
  }
  return <FlowLab id="cross-rectangular-shapes" label="Entry counts, channel widths and head assembly">
    <CrossFigure job="D06" label="One rectangular matching grid per head" caption="N is an outer batch axis. These grids display dimensions, not allocated learned feature values. Counts change rows; widths change coordinates. Each head gets its own T×S grid.">
      <CrossBranches><CrossMatrix values={[[c.readers, c.readerWidth]]} label="Reader array X dimensions" columns={['T rows', 'dr input coordinates']} role="input" />
        <CrossMatrix values={[[c.memory, c.memoryWidth]]} label="Memory array M dimensions" columns={['S rows', 'dm input coordinates']} role="input" /></CrossBranches>
      <CrossArrow>WQ maps dr→Hdk; WK maps dm→Hdk; WV maps dm→Hdv.</CrossArrow>
      <div className="cross-flow-head-grids">{Array.from({ length: c.heads }, (_, h) => <div key={h}><p>Head {h}: Q {c.readers}×{c.keyWidth}, K {c.memory}×{c.keyWidth}, V {c.memory}×{c.valueWidth}.</p>
        <CrossMatrix values={Array.from({ length: Math.min(c.readers, 4) }, () => Array(Math.min(c.memory, 4)).fill('pair'))} label={`Head ${h} matching grid: ${c.readers}×${c.memory}`} />
        <p>At most4×4 pair cells drawn; full count {c.readers * c.memory}.</p></div>)}</div>
      <CrossArrow>Each head returns T×dv; join coordinates across H heads.</CrossArrow>
      <CrossMatrix values={[[c.readers, c.heads * c.valueWidth], [c.readers, c.readerWidth]]} label="Join, then output projection" rows={['concatenation', 'final output']} columns={['rows T', 'coordinates']} />
    </CrossFigure>
    <p>Change only counts and heads here; no feature tensors are allocated.</p><FlowControls>{[['readers', 'Readers T', 16], ['memory', 'Donors S', 16], ['heads', 'Heads H', 16]].map(([key, label, max]) => <CrossNumber syncKey={c} key={key} label={label} value={c[key]} min={1} max={max} integer onChange={v => set(key, v)} />)}</FlowControls>
    <p>The two matching widths must agree within a head. The carried width can differ.</p><FlowControls>{[['keyWidth', 'Matching width dk'], ['valueWidth', 'Carried width dv']].map(([key, label]) => <CrossNumber syncKey={c} key={key} label={label} value={c[key]} min={1} max={128} integer onChange={v => set(key, v)} />)}</FlowControls>
    <p>Reader and memory raw sources have their own input widths.</p><FlowControls>{[['readerWidth', 'Reader input dr'], ['memoryWidth', 'Memory input dm']].map(([key, label]) => <CrossNumber syncKey={c} key={key} label={label} value={c[key]} min={1} max={128} integer onChange={v => set(key, v)} />)}</FlowControls>
    <div className="cross-flow-actions"><button type="button" onClick={() => s.setShape({ readers: 7, memory: 11, heads: 4, keyWidth: 12, valueWidth: 8, readerWidth: 48, memoryWidth: 80 })}>Use the changed four-head shapes</button>
      <button type="button" onClick={() => s.setShape({ ...c, readers: c.memory, memory: c.readers })}>Swap reader and donor counts</button></div>
    <p>Now resize the earlier actual two-coordinate editor. Surviving IDs, values and permissions stay; every new row starts with zero coordinates and allowed permissions.</p>
    <FlowControls><CrossNumber syncKey={s.read} label="Constructed readers" value={s.read.query.length} min={2} max={4} integer onChange={v => resize('readers', v)} />
      <CrossNumber syncKey={s.read} label="Constructed donors" value={s.read.key.length} min={2} max={6} integer onChange={v => resize('memory', v)} /></FlowControls>
    <FlowReadout>The shape example returns {c.readers} rows, each with {c.readerWidth} coordinates. Its joined width is {c.heads * c.valueWidth}.</FlowReadout>
  </FlowLab>;
}
export function CrossHeadAssembly() {
  const [reader, setReader] = useState(0), [head, setHead] = useState(0), c = examples.cache;
  const cache = projectMemory(c.memory, c.state, 'retained-native', 2), r = readMemory(c.query, c.state, cache, c.allowed, 'retained-native');
  const q = affine(c.query, c.state.in_proj_weight.slice(0, 8), c.state.in_proj_bias.slice(0, 8));
  const joined = r.heads.flatMap(h => h.output[reader]);
  return <FlowLab id="cross-head-assembly" label="Follow the actual two-head split and join">
    <CrossFigure job="D07" label="Eight projected coordinates split into two groups of four" caption="This is the protected native two-head state. Each group normalizes its own donor shares; joining coordinates does not average heads. The output map is learned and can mix both groups.">
      <CrossVector values={q[reader]} label={`Projected Q for reader ${reader}: coordinates0–7`} />
      <CrossBranches>{r.heads.map((h, i) => <div key={i}><CrossVector values={q[reader].slice(i * 4, (i + 1) * 4)} label={`Head ${i} request: coordinates${i * 4}–${i * 4 + 3}`} />
        <CrossMatrix values={cache.keys[i]} label={`Head ${i} donor K`} /><CrossVector values={h.weights[reader]} label={`Head ${i} shares`} /><CrossVector values={h.output[reader]} label={`Head ${i} carried answer`} /></div>)}</CrossBranches>
      <CrossArrow>Join head0's four coordinates followed by head1's four.</CrossArrow><CrossVector values={joined} label="Eight joined coordinates" />
      <CrossMatrix values={c.state['out_proj.weight']} label="Actual output map: 8 output rows × 8 joined input columns" role="parameter" />
      <CrossVector values={r.output[reader]} label={`Native-state final answer for reader ${reader}`} />
      <CrossMatrix values={r.heads[head].products[reader]} label={`Head ${head}: every share × V coordinate product`} rows={c.memory.map((_, i) => `donor ${i}`)} />
    </CrossFigure><FlowControls><FlowChoice label="Reader" value={reader} options={c.query.map((_, i) => [i, String(i)])} onChange={setReader} />
      <FlowChoice label="Product head" value={head} options={[[0, 'head0'], [1, 'head1']]} onChange={setHead} /></FlowControls>
    <FlowReadout>The two carried four-coordinate rows join to {vec(joined)}; the output map returns {vec(r.output[reader])}.</FlowReadout>
  </FlowLab>;
}
export function CrossResidualDrawing() {
  const fixture = exactFixture(), r = resultOf(fixture), x = [[1, 0], [0, 1]], y = x.map((row, i) => row.map((v, j) => v + r.output[i][j]));
  return <CrossFigure job="D08" label="Unchanged reader bypass joins the projected read" caption="Here WO=I₂ and bias=0. The ⊕ joins the read with its same-row reader bypass. Only the value mixture before WO/residual is constrained to a convex combination of V rows; Y is not.">
    <CrossBranches><div><CrossMatrix values={x} label="Reader bypass X" role="input" /><CrossArrow>Unchanged reader lane</CrossArrow></div>
      <div><CrossMatrix values={r.output} label="Returned read" /><CrossMatrix values={[[1, 0], [0, 1]]} label="WO: identity output map" role="parameter" /><CrossArrow>Output map sends the read to ⊕.</CrossArrow></div></CrossBranches>
    <p className="cross-flow-add" aria-label="Add both same-row lanes">⊕</p><CrossMatrix values={y} label="Y = X + projected read" />
  </CrossFigure>;
}
export function CrossCreditDrawing() {
  const [value, setValue] = useState(2), fixture = exactFixture(); fixture.value[2][0] = value;
  const r = resultOf(fixture), target = [.5, 2.5], credit = [r.output[0].map((v, i) => v - target[i]), [0, 0]], b = pullback(r, credit);
  const loss = .5 * credit[0].reduce((a, v) => a + v * v, 0);
  return <FlowLab id="cross-credit" label="Matching credit differs from carried-value credit">
    <CrossFigure job="D09" label="Half-square loss sends separate credit to K and V" caption="Orange marks loss credit. The target is for reader0; reader1 contributes no loss. A donor's carried coordinates can receive nonzero credit even when its matching coordinates receive zero credit.">
      <CrossBranches><CrossVector values={r.output[0]} label="Reader0 answer" /><CrossVector values={target} label="Target answer" role="input" /></CrossBranches>
      <CrossArrow>Answer − target → output credit; half squared length → loss {f(loss)}.</CrossArrow><CrossMatrix values={credit} label="Output credit G" role="credit" />
      <CrossBranches><div><CrossArrow>AᵀG reaches carried values.</CrossArrow><CrossMatrix values={b.dValue} label="dV: carried-coordinate credit" role="credit" /></div>
        <div><CrossArrow>GVᵀ → softmax row pullback → matching scores.</CrossArrow><CrossMatrix values={b.dWeights} label="dA: share credit" role="credit" /><CrossMatrix values={b.dScores} label="dS: normalized-score credit" role="credit" /><CrossMatrix values={b.dKey} label="dK: matching-coordinate credit" role="credit" /><CrossMatrix values={b.dQuery} label="dQ: request-coordinate credit" role="credit" /></div></CrossBranches>
    </CrossFigure><FlowControls><CrossNumber label="Third donor V coordinate0" value={value} min={-8} max={8} onChange={setValue} /></FlowControls>
    <FlowReadout>Loss {f(loss)}. Third donor gets K credit {vec(b.dKey[2])} and V credit {vec(b.dValue[2])}. These describe different jobs.</FlowReadout>
  </FlowLab>;
}
export function CrossMaskConvention() {
  const [wrong, setWrong] = useState(false), allowed = [[true, true, false], [true, true, true]], fixture = exactFixture();
  const r = attention(fixture.query, fixture.key, fixture.value, wrong ? allowed.map(row => row.map(v => !v)) : allowed);
  return <FlowLab id="cross-mask-convention" label="The same allowed grid under two mask APIs">
    <CrossFigure job="D10" label="SDPA permissions and MHA blocked entries are opposite Boolean encodings" caption="For Boolean masks, SDPA True allows; MHA attn_mask True blocks. Use dropout_p=0 for deterministic SDPA and average_attn_weights=False to inspect MHA's separate heads.">
      <CrossBranches><CrossMatrix values={allowed} label="SDPA Boolean mask: True permits" binary />
        <CrossMatrix values={allowed.map(row => row.map(v => !v))} label="MHA Boolean mask: True blocks" binary trueText="blocked (True)" falseText="allowed (False)" /></CrossBranches>
      <CrossArrow>{wrong ? 'Wrong: pass the permitted grid directly as MHA blocked bits.' : 'Correct: complement permitted bits for MHA.'}</CrossArrow>
      <CrossMatrix values={r.output.map(row => row ?? [null, null])} label="Consequences of the selected encoding" />
      <CrossBranches><CrossMatrix values={Array.from({ length: 3 }, (_, i) => Array.from({ length: 5 }, (_, j) => j < [2, 4, 5][i]))} label="3×5 declared availability: counts2/4/5" binary />
        <CrossMatrix values={Array.from({ length: 3 }, (_, i) => Array.from({ length: 5 }, (_, j) => j <= i))} label="SDPA upper-left is_causal pattern: counts1/2/3" binary /></CrossBranches>
    </CrossFigure><FlowControls><FlowChoice label="Mask bridge" value={wrong} options={[[false, 'Complement for MHA'], [true, 'Use wrong polarity']]} onChange={setWrong} /></FlowControls>
    <FlowReadout>{wrong ? 'Reader1 blocks every donor; its mixture is undefined. Reader0 reads only the originally blocked third donor.' : 'Both APIs now encode the same intended permissions.'} Non-square causal alignment does not infer the task’s 2/4/5 availability.</FlowReadout>
  </FlowLab>;
}

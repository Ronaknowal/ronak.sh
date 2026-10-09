import { useState } from 'react';
import { colors, attention, initialPrompt, multiply, WK, WV, prefixMask, workCounts } from '../../data/soft-prompt-models.js';
import { Figure, Controls, Select, Range, Check, Scroll, Matrix, Mask, Bars, Operation, Arrow, fmt, vec } from './SoftPromptShared.jsx';
import { DecoderDiagram } from './SoftPromptFoundations.jsx';

export function SoftLayerMemory() {
  const [layer, setLayer] = useState(0);
  return <Figure id="P10" caption="Per-layer K/V enters the attention operation alongside real keys and values. It creates memory columns, while queries, residuals and FFNs keep only the four real rows.">
    <DecoderDiagram layer={layer} prefix />
    <Controls><Select label="Inspect memory at layer" value={layer} options={[[0, 'Layer 0'], [1, 'Layer 1']]} onChange={value => setLayer(Number(value))} /></Controls>
    <div className="soft-comparison"><Operation color={colors.key}>Layer {layer}: Kᵖ [2, 8] + real K [4, 8] → 6 key rows.</Operation>
      <Operation color={colors.value}>Layer {layer}: Vᵖ [2, 8] + real V [4, 8] → 6 value rows.</Operation></div>
    <Arrow>real Q [4, 8] × joined Kᵀ → 4 × 6 scores → weights × joined V</Arrow>
    <output className="soft-result">4 × 8 attention output. No virtual query or virtual FFN row is created.</output>
  </Figure>;
}

export function SoftMemoryMask() {
  const [query, setQuery] = useState(0);
  const [padded, setPadded] = useState(false);
  const rows = prefixMask(3, 2, padded);
  const names = ['P0', 'P1', 'real 0', 'real 1', 'real 2'];
  return <Figure id="P11" caption="Rows name real queries; columns name prefix and real keys. Each prefix column is visible, future real keys are blocked, and a padded real key is excluded independently of target-label selection.">
    <Mask rows={rows} columns={names} active={query} prefix={2} />
    <Controls reset={() => { setQuery(0); setPadded(false); }}>
      <Range label="Inspect real query" value={query} min={0} max={2} step={1} onChange={setQuery} />
      <Check label="Real row 2 is padding" checked={padded} onChange={setPadded} />
    </Controls>
    <output className="soft-result">Query {query} may read {names.filter((_, j) => rows[query][j]).join(', ')}.</output>
    <p>{padded && query === 2 ? 'This is a padded query row: its output is discarded. The drawing still shows how its allowed keys are computed.'
      : 'Visible entries add 0 to scores; blocked entries add −∞ and receive zero probability.'}</p>
  </Figure>;
}

export function SoftZeroMemory() {
  const [mode, setMode] = useState('zero');
  const [coordinate, setCoordinate] = useState(0);
  let keys = [], values = [];
  if (mode === 'zero') { keys = [[coordinate, 0], [0, 0]]; values = [[0, 0], [0, 0]]; }
  if (mode === 'projected') { keys = multiply(initialPrompt, WK); values = multiply(initialPrompt, WV); }
  const result = attention(keys, values, 1);
  const names = [...keys.map((_, i) => `prefix ${i}`), 'real 0', 'real 1'];
  return <Figure id="P12" caption="Removing memory changes the number of columns. Zeroing memory keeps its softmax denominator terms. The key and value derivatives are separate parameters on this direct-memory route.">
    <div className="soft-comparison"><div>
      {keys.length ? <Matrix title="Trainable Kᵖ" rows={keys} color={colors.key} /> : <Operation>No prefix K columns.</Operation>}
    </div><div>{values.length ? <Matrix title="Trainable Vᵖ" rows={values} color={colors.value} /> : <Operation>No prefix V columns.</Operation>}</div></div>
    <Bars names={names} values={result.weights} label="Normalized weights including all retained prefix rows" />
    <Operation color={colors.value}>o = {vec(result.output)}; class 1 loss = {fmt(result.loss)}.</Operation>
    {keys.length > 0 && <div className="soft-comparison">
      <Matrix title="Key-score derivative K̄ᵖ" rows={result.dKeys} color={colors.key} />
      <Matrix title="Value-return derivative V̄ᵖ" rows={result.dValues} color={colors.value} />
    </div>}
    <Controls reset={() => { setMode('zero'); setCoordinate(0); }}>
      <Select label="Memory operation" value={mode} options={[
        ['zero', 'Keep two zero K/V rows'], ['absent', 'Remove prefix columns'], ['projected', 'Use section 3 projected values']]} onChange={setMode} />
      {mode === 'zero' && <Range label="Change Kᵖ[0,0]; keep all Vᵖ zero" value={coordinate} min={-1} max={1} onChange={setCoordinate} />}
    </Controls>
    <p>{mode === 'absent' ? 'Only real rows normalize together: removal recovers the no-prefix calculation.'
      : mode === 'zero' && coordinate === 0 ? 'Each zero prefix score contributes exp(0) = 1. Its returned value is zero, but its attention mass is positive.'
        : 'Changing a key changes shared normalization. The direct K and V arrays can move independently.'}</p>
  </Figure>;
}

function AttentionArea({ prefix, realQueries, label }) {
  const n = 8;
  const m = prefix / 4;
  const queryRows = realQueries ? n : n + m;
  const keyRows = n + m;
  return <div><p>{label}: query rows × key columns</p>
    <Scroll label={`${label} dense attention area; each drawn cell represents sixteen entries`}>
      <div className="soft-area" style={{ gridTemplateColumns: `repeat(${keyRows}, .5rem)` }}>
        {Array.from({ length: queryRows * keyRows }, (_, i) => <i key={i} style={{ '--role':
          i % keyRows < m || (!realQueries && Math.floor(i / keyRows) < m) ? colors.prompt : colors.real }} />)}
      </div>
    </Scroll><p className="soft-small">One drawn cell = 4 × 4 actual entries. Pink: an added row or column.</p></div>;
}

export function SoftWorkCounts() {
  const [prefix, setPrefix] = useState(8);
  const [gqa, setGqa] = useState(false);
  const counts = workCounts(prefix, gqa ? 2 : 4);
  return <Figure id="P13" caption="Counts refer to n32, width128, six layers and head width32. Dense attention areas describe entries per layer/head, not measured latency. The GQA toggle changes stored KV heads only.">
    <div className="soft-comparison"><AttentionArea prefix={prefix} label="Input prompt" />
      <AttentionArea prefix={prefix} realQueries label="Direct K/V" /></div>
    <div className="soft-comparison"><Operation color={colors.prompt}>Input P: {prefix} × 128 = {counts.input.toLocaleString()} parameters.
      Dense scores: ({32}+{prefix})² = {counts.inputEntries.toLocaleString()} entries.</Operation>
      <Operation color={colors.key}>K/V: 2 × 6 × {prefix} × {gqa ? 2 : 4} × 32 = {counts.kv.toLocaleString()} parameters.
        Dense scores: 32 × ({32}+{prefix}) = {counts.kvEntries.toLocaleString()} entries.</Operation></div>
    <Controls reset={() => { setPrefix(8); setGqa(false); }}>
      <Range label="Virtual positions m" value={prefix} min={0} max={16} step={4} onChange={setPrefix} />
      <Check label="Count-only GQA variant: 2 KV heads, 4 query heads" checked={gqa} onChange={setGqa} />
    </Controls>
    <p>Raw FP32 prompt payload: {4 * counts.input} bytes; raw KV payload: {4 * counts.kv} bytes. These omit optimizer state, activations, cache and serialization metadata.</p>
    <p>{prefix === 0 ? 'Both routes recover 32² = 1,024 score entries and add zero task parameters.'
      : 'Added input rows also run projections and FFNs. Different entry counts alone cannot predict wall-clock speed.'}</p>
  </Figure>;
}

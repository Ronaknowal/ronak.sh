import { useState } from 'react';
import { colors, infixLayout } from '../../data/soft-prompt-models.js';
import { Figure, Controls, Select, Range, Check, Scroll, Matrix, Lanes, Mask, Bars,
  Operation, Arrow, fmt, vec, useObservation, ObservationState } from './SoftPromptShared.jsx';

export function SoftMlpEncoder() {
  const [changed, setChanged] = useState(false);
  const state = useObservation('encoders.json');
  const result = state.data?.encoders.find(row => row.kind === 'MLP');
  return <Figure id="P14" caption="The native encoder applies the same 128→32→32→128 MLP independently to each of eight latent rows. Three representative lanes show the dependency; the separate recorded width4 fixture checks the same row independence numerically.">
    <Scroll label="Three independent rowwise MLP paths with shared weights and no cross-row edges">
      <svg className="soft-wide-network" viewBox="0 0 736 265" role="img" aria-label="Each latent row passes through linear, ReLU, linear, ReLU, linear operations independently; matrices are shared across rows.">
        {[0, 1, 2].map(row => <g key={row}>
          <path d={`M40 ${65 + row * 70}H700`} stroke={changed && row === 1 ? colors.prompt : colors.fixed} strokeWidth="2" />
          {[['E row', 50], ['128→32', 195], ['ReLU', 315], ['32→32', 435], ['ReLU', 555], ['32→128', 675]].map(([name, x]) =>
            <g key={name + x}><rect x={x - 48} y={48 + row * 70} width="96" height="34" fill="#222731"
              stroke={changed && row === 1 ? colors.prompt : colors.fixed} />
              <text x={x} y={70 + row * 70} textAnchor="middle">{name === 'E row' ? `E${row}` : name}</text></g>)}
        </g>)}
        <text x="368" y="24" textAnchor="middle">Same three weight matrices; no path from E1 to P0 or P2</text>
        <text x="368" y="253" textAnchor="middle" style={{ fill: colors.prompt }}>Only the edited row's input changes; shared weights stay fixed</text>
      </svg>
    </Scroll>
    <ObservationState state={state} />
    {result && <Bars label="Observed absolute output-row changes in the small fixture"
      names={['small fixture row 0', 'small fixture row 1', 'small fixture row 2']}
      values={changed ? result.changed_row_absolute_differences : [0, 0, 0]} maximum={.12} color={colors.prompt} />}
    <Controls><Check label="Recorded edit: latent row 1, coordinate 0 += 0.25" checked={changed} onChange={setChanged} /></Controls>
    <p>{changed ? 'Recorded small-fixture change is nonzero only at output row 1.' : 'The unedited reference has zero difference at every output row.'} Updating a shared weight is a different operation and can change every row.</p>
  </Figure>;
}

function RecurrentGraph({ layer, position, direction }) {
  return <Scroll label="Two bidirectional recurrent layers preserve original virtual-row identity">
    <svg className="soft-network" viewBox="0 0 576 435" role="img" aria-label="Two layers each contain forward 0-to-2 and backward 2-to-0 chains. At each original row, both layer-zero hidden outputs concatenate and feed both directions in layer one. Cell states stay within their recurrent chains.">
      {[0, 1, 2].map(index => <g key={index} fill="none" stroke={colors.fixed}>
        <path d={`M${150 + index * 130} 70H${138 + index * 130}V177H${174 + index * 130}`} stroke={colors.prompt} />
        <path d={`M${235 + index * 130} 124H${247 + index * 130}V190H${227 + index * 130}`} stroke={colors.key} />
        <path d={`M${192 + index * 130} 208V235H${177 + index * 130}V262m-4 -7 4 7 4 -7`} />
        <path d={`M${192 + index * 130} 235H${247 + index * 130}V334H${235 + index * 130}m7 -4 -7 4 7 4`} />
        <rect x={157 + index * 130} y="164" width="70" height="44" fill="#222731" />
        <text x={192 + index * 130} y="182" textAnchor="middle" stroke="none" fill={colors.prompt}>h→</text>
        <text x={192 + index * 130} y="201" textAnchor="middle" stroke="none" fill={colors.key}>h←</text>
      </g>)}
      {[0, 1].map(current => <g key={current}>
        <text x="18" y={45 + current * 210}>layer {current}</text>
        {['forward', 'backward'].map((way, d) => <g key={way}>
          <text x="18" y={76 + current * 210 + d * 54}>{way === 'forward' ? '→ h,c' : '← h,c'}</text>
          {[0, 1, 2].map(index => <g key={index}>
            <rect x={150 + index * 130} y={52 + current * 210 + d * 54} width="85" height="36"
              fill="#222731" stroke={current === layer && way === direction && index === position ? '#f4f5f7' : way === 'forward' ? colors.prompt : colors.key}
              strokeWidth={current === layer && way === direction && index === position ? 3 : 1} />
            <text x={192 + index * 130} y={76 + current * 210 + d * 54} textAnchor="middle">row {index}</text>
            {index < 2 && <g fill="none" stroke={way === 'forward' ? colors.prompt : colors.key}>
              <path d={`M${235 + index * 130} ${70 + current * 210 + d * 54}H${280 + index * 130}`} />
              <path d={way === 'forward' ? `M${273 + index * 130} ${65 + current * 210 + d * 54}l7 5 -7 5`
                : `M${242 + index * 130} ${65 + current * 210 + d * 54}l-7 5 7 5`} />
            </g>}
          </g>)}
        </g>)}
      </g>)}
      <text x="18" y="180">join h</text>
      <text x="320" y="390" textAnchor="middle">Both h directions join at the same original row.</text>
      <text x="320" y="419" textAnchor="middle">Layer 1 pair → concatenate → output projection</text>
    </svg>
  </Scroll>;
}

export function SoftLstmEncoder() {
  const [layer, setLayer] = useState(0);
  const [position, setPosition] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [changed, setChanged] = useState(false);
  const state = useObservation('encoders.json');
  const result = state.data?.encoders.find(row => row.kind === 'LSTM');
  const chain = result?.gate_traces.find(row => row.layer === layer && row.direction === direction);
  const index = chain?.steps.findIndex(row => row.position === position);
  const cell = chain?.steps[index];
  const previous = index > 0 ? chain.steps[index - 1].cell[0] : [0, 0, 0];
  return <Figure id="P15" caption="The recorded two-layer bidirectional fixture has hidden width3 per direction. Gate values below inspect its unedited reference. The separate edit toggle displays observed output-row differences, without replacing reference gates with invented changed values.">
    <RecurrentGraph layer={layer} position={position} direction={direction} />
    <Controls><Select label="Recurrent layer" value={layer} options={[[0, 'Layer 0'], [1, 'Layer 1']]} onChange={value => setLayer(Number(value))} />
      <Select label="Traversal" value={direction} options={[['forward', 'Forward 0→1→2'], ['backward', 'Backward 2→1→0']]} onChange={setDirection} />
      <Range label="Original position" value={position} min={0} max={2} step={1} onChange={setPosition} /></Controls>
    <ObservationState state={state} />
    {cell && <><div className="soft-comparison"><div>
      <Operation color={colors.key}>old cell c = {vec(previous)}</Operation><Arrow>× forget gate f = {vec(cell.f[0])}</Arrow>
      <Operation color={colors.key}>retained = {vec(previous.map((value, i) => value * cell.f[0][i]))}</Operation>
    </div><div><Operation color={colors.prompt}>proposal g = tanh(a_g) = {vec(cell.g[0])}</Operation>
      <Arrow>× input gate i = {vec(cell.i[0])}</Arrow>
      <Operation color={colors.prompt}>new contribution = {vec(cell.i[0].map((value, i) => value * cell.g[0][i]))}</Operation></div></div>
      <Arrow>add both paths → c_new = {vec(cell.cell[0])}</Arrow>
      <Operation color={colors.value}>h_new = o × tanh(c_new), with o = {vec(cell.o[0])}, gives {vec(cell.hidden[0])}.</Operation></>}
    {result && <Bars label="Recorded absolute differences by final output row"
      names={['output row 0', 'output row 1', 'output row 2']} maximum={.006}
      values={changed ? result.changed_row_absolute_differences : [0, 0, 0]} color={colors.prompt} />}
    <Controls><Check label="Recorded middle-row edit: E[1,0] += 0.25" checked={changed} onChange={setChanged} /></Controls>
    <p>{changed ? 'All three final output rows changed in this fixture: the two traversal directions carry the edit outward.'
      : 'The reference has zero change. Select the recorded edit to inspect cross-row dependence.'} A possible recurrent path does not guarantee a nonzero derivative for every set of weights.</p>
  </Figure>;
}

export function SoftMaterialization() {
  const [kind, setKind] = useState('mlp');
  const [view, setView] = useState('training');
  const count = kind === 'mlp' ? 10432 : 80064;
  return <Figure id="P16" caption="Materialization exports the tensor consumed by the base. This flow preserves the inference input; it does not invert the encoder or recover its optimizer state.">
    {view === 'training' ? <><Operation color={colors.prompt}>8 × 128 latent rows + {kind === 'mlp' ? 'rowwise MLP' : 'BiLSTM'} parameters: {count.toLocaleString()} trainable numbers</Operation>
      <Arrow color={colors.prompt}>gφ(Eφ) — evaluate the encoder once ↓</Arrow></> : <Operation color={colors.fixed}>Encoder absent from the inference path. Separate training checkpoint is retained for resume.</Operation>}
    <Matrix title="Materialized prompt shape (entries schematic)" rows={Array.from({ length: 3 }, (_, i) => [`P${i},0`, '…', `P${i},127`])}
      columns={['coordinate 0', '…', 'coordinate 127']} rowLabels={['row 0', 'row 1', 'row 2 of 8']} color={colors.prompt} />
    <Arrow>same 8 × 128 values → matching frozen base → same specified inference input</Arrow>
    <Operation>1,024 FP32 values = 4,096 raw payload bytes. Observed flat/materialized-MLP tensor file: 4,216 bytes, excluding configuration and the shared base.</Operation>
    <Controls><Select label="Encoder" value={kind} options={[['mlp', 'MLP'], ['lstm', 'BiLSTM']]} onChange={setKind} />
      <Select label="State view" value={view} options={[['training', 'Training state'], ['inference', 'Materialized inference']]} onChange={setView} /></Controls>
    <p>Materialized P contains no Adam moments, RNG state or unique reconstruction of the {count.toLocaleString()} encoder parameters. Actual native precision qualifications are preserved in section 10.</p>
  </Figure>;
}

export function SoftInfix() {
  const [insertion, setInsertion] = useState(1);
  const [bidirectional, setBidirectional] = useState(false);
  const layout = infixLayout(insertion, bidirectional);
  return <Figure id="P17" caption="The selected real predictor is original row1 (‘context’). Inserting soft rows changes its expanded position. The task explicitly attaches a loss to that predictor; an ordinary next-token map across an infix can define a different operation.">
    <Lanes label="Infix construction and causal visibility" rows={[
      { name: 'expanded index', values: layout.tokens.map((_, i) => i), selected: [layout.predictor] },
      { name: 'input identity', values: layout.tokens, colors: layout.tokens.map(token => token[0] === 'P' ? colors.prompt : colors.real) },
      { name: 'visible to selected predictor', values: layout.visible.map(value => value ? 'yes' : 'future ×'), color: colors.target },
    ]} />
    <Lanes label="Original real position to expanded position" rows={[
      { name: 'original real row', values: [0, 1, 2, 3] },
      { name: 'expanded real row', values: layout.map, selected: [1] },
    ]} />
    <Controls reset={() => { setInsertion(1); setBidirectional(false); }}>
      <Range label="Insert two prompt rows before original index" value={insertion} min={0} max={4} step={1} onChange={setInsertion} />
      <Check label="Use bidirectional visibility instead" checked={bidirectional} onChange={setBidirectional} />
    </Controls>
    <output className="soft-result">{layout.promptVisible ? 'A prompt-to-predictor path is allowed.' : 'Both prompt rows are in the future: this selected loss gives exactly zero prompt gradient.'}</output>
    <p>{layout.promptVisible ? 'Allowed dependence can still have a zero numerical derivative for particular weights.' : 'Moving the prompt before the selected predictor restores a possible causal path.'}
      {bidirectional ? ' This is a separately labelled encoder visibility rule, not the causal decoder used in the fixture.' : ''}</p>
  </Figure>;
}

export function SoftTokenHead() {
  const [batch, setBatch] = useState(0);
  const [position, setPosition] = useState(1);
  const state = useObservation('token-head.json');
  const data = state.data;
  const valid = data?.attention_mask[batch];
  return <Figure id="P18" caption="A bidirectional encoder returns one vector per real token, then the same trainable three-class head acts at each position. Prefix K/V enters both encoder layers; special-label exclusion is distinct from padded-key exclusion.">
    <Operation color={colors.prompt}>Layer 0 Kᵖ/Vᵖ → bidirectional attention + residual + FFN</Operation><Arrow>5 real token vectors</Arrow>
    <Operation color={colors.prompt}>Layer 1 Kᵖ/Vᵖ → bidirectional attention + residual + FFN</Operation><Arrow>5 × 16 final vectors</Arrow>
    <Scroll label="Per-token classifier heads on five encoder outputs"><svg className="soft-network" viewBox="0 0 576 145" role="img" aria-label="Five hidden token vectors each pass through the shared 16-to-3 trainable classifier.">
      {[0, 1, 2, 3, 4].map(index => <g key={index}><circle cx={60 + index * 112} cy="20" r="11" fill="none" stroke={colors.real} />
        <path d={`M${60 + index * 112} 31V62`} stroke={colors.real} />
        <rect x={20 + index * 112} y="62" width="80" height="35" fill="none" stroke={index === position ? '#fff' : colors.target} />
        <text x={60 + index * 112} y="85" textAnchor="middle">16 → 3</text><text x={60 + index * 112} y="125" textAnchor="middle">token {index}</text></g>)}
    </svg></Scroll>
    <ObservationState state={state} />
    {data && <><Lanes label="Actual token classifier diagnostic batch" rows={[
      { name: `batch ${batch} input IDs`, values: data.input_ids[batch], selected: [position] },
      { name: 'valid key', values: valid, color: colors.real },
      { name: 'class label', values: data.labels[batch], color: colors.target },
    ]} />
      <Mask rows={Array.from({ length: 5 }, () => [...Array(3).fill(true), ...valid.map(Boolean)])}
        columns={['P0', 'P1', 'P2', 'r0', 'r1', 'r2', 'r3', 'r4']} active={position} prefix={3} /></>}
    <Controls><Select label="Batch record" value={batch} options={[[0, 'Record 0'], [1, 'Record 1']]} onChange={value => setBatch(Number(value))} />
      <Range label="Inspect token position" value={position} min={0} max={4} step={1} onChange={setPosition} /></Controls>
    {data && <output className="soft-result">Selected label: {data.labels[batch][position] === -100 ? 'ignored' : data.labels[batch][position]}. Key: {valid[position] ? 'visible context' : 'padding, blocked'}. Exactly 5 supervised positions across both records.</output>}
  </Figure>;
}

export function SoftHeadGradient() {
  const [headMoves, setHeadMoves] = useState(true);
  const state = useObservation('token-head.json');
  const native = state.data?.native_bert;
  return <Figure id="P19" caption="The declared diagnostic trains both prefix memory and the classifier. Disabling head updates below is an optimizer-ownership illustration, not a second fitted outcome.">
    <Operation color={colors.target}>Selected token losses → classifier derivatives and hidden-state derivatives</Operation>
    <div className="soft-comparison"><div><Arrow color={colors.target}>direct parameter derivative ↓</Arrow>
      <Operation color={headMoves ? colors.target : colors.fixed}>Classifier: W [16, 3] + bias [3] = 51 values. {headMoves ? 'Included in optimizer.' : 'Excluded from optimizer.'}</Operation></div>
      <div><Arrow color={colors.prompt}>through fixed encoder operations ↓</Arrow>
        <Operation color={colors.prompt}>Prefix [2 layers, 2 K/V, 3 rows, 16 width] = 192 values. Included in optimizer.</Operation></div></div>
    <Arrow>Fixed encoder parameters remain exact; their activation derivatives still transmit the signal.</Arrow>
    <Controls><Check label="Include the classifier in the optimizer" checked={headMoves} onChange={setHeadMoves} /></Controls>
    <output className="soft-result">Selected optimizer budget: {headMoves ? 243 : 192} parameters.</output>
    <ObservationState state={state} />
    {state.data && <p>Recorded random-fixture route: both groups trained for 30 updates. Explicit loss ends at 0.01324659; native loss ends at 0.01131616. {headMoves ? 'These are the declared executed routes.' : 'No quality or loss result is claimed for this head-disabled alternative.'}</p>}
    {native?.first_gradient_norms && <Matrix title="Native first-update gradient norms, recorded" rows={Object.values(native.first_gradient_norms).map(value => [value])}
      rowLabels={Object.keys(native.first_gradient_norms)} columns={['norm']} color={colors.target} />}
  </Figure>;
}

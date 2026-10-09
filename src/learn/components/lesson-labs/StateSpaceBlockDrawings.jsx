import { StateDrawing as Drawing, StateLabel as Label, StateWire as Wire, StateCells as Cells, StateOperation as Operation, StateValue as Value } from './StateSpaceDrawings.jsx';

// Exploded views retain named operands between drawings. Arrays are actual
// two/four-channel examples; the core then opens ONE channel or ONE head.
function Front({
  second = false
}) {
  return <Drawing name={second ? 'mamba-two-projections' : 'mamba-one-projections'} height={second ? 1148 : 1066} caption={second ? 'The filtered eight-channel cutaway contains four x channels, two B channels and two C channels. The gate z and positive step Δ bypass that filter. The next picture opens one two-value head.' : 'The four expanded channels are processed independently by their local filters. Their current features select the write/read/step coefficients; the next picture opens one channel.'} label={second ? 'Mamba2Simple projects x, B, C, z and delta in parallel. The causal convolution acts on x/B/C across earlier and current positions. Delta and the outside gate bypass it. The opened head has two value coordinates.' : 'Two normalized features expand to four x features and four gate features. The causal depthwise convolution follows each x channel across earlier and current positions, then SiLU produces four u features. A learned projection selects write, read and step from those features. The gate branch remains separate.'}>
    <Label x={12} y={22}>Normalized input: two-feature cutaway</Label>
    <Cells x={126} y={59} cell={48} values={[["f₀", "f₁"]]} role="input" />
    <Wire points={[[174, 107], [174, 150]]} /><Operation x={96} y={150} width={156} text="learned projection" />
    <Wire points={[[174, 182], [174, 215]]} /><Cells x={78} y={215} cell={48} values={[["x₀", "x₁", "x₂", "x₃"]]} />
    <Label x={12} y={292}>Expanded: twice input width</Label>
    <Wire points={[[252, 166], [341, 166], [341, 346], [270, 346]]} />
    <Cells x={78} y={322} cell={48} values={[["z₀", "z₁", "z₂", "z₃"]]} />
    <Label x={12} y={401}>Save z; no convolution</Label>
    {second && <><Cells x={12} y={439} cell={45} values={[["B₀", "B₁", "C₀", "C₁"]]} /><Label x={202} y={467}>B/C also convolve</Label><Cells x={248} y={510} cell={45} values={[["Δ₀", "Δ₁"]]} /><Label x={12} y={538}>Δ bypasses filtering</Label><Wire points={[[96, 182], [12, 182], [12, 417], [57, 417], [57, 439]]} /><Wire points={[[341, 346], [341, 532], [338, 532]]} /></>}
    <Label x={12} y={second ? 591 : 465}>Time ↓; channels →</Label>
    <Cells x={second ? 28 : 78} y={second ? 625 : 499} cell={second ? 38 : 48} values={[Array(second ? 8 : 4).fill("t−2"), Array(second ? 8 : 4).fill("t−1"), Array(second ? 8 : 4).fill("t")]} />
    <rect x={second ? 27 : 77} y={second ? 624 : 498} width={second ? 39 : 49} height={second ? 116 : 146} fill="none" stroke="#e2b55a" strokeWidth="2" />
    <Wire points={[[78, 239], [6, 239], [6, second ? 682 : 571], [second ? 28 : 78, second ? 682 : 571]]} />
    {second && <Wire points={[[192, 461], [199, 461], [199, 560], [351, 560], [351, 682], [332, 682]]} />}
    <Wire points={[[174, second ? 739 : 643], [174, second ? 811 : 685]]} /><Operation x={76} y={second ? 811 : 685} width={196} text="depthwise conv → SiLU" />
    <Wire points={[[174, second ? 843 : 717], [174, second ? 885 : 759]]} /><Cells x={78} y={second ? 885 : 759} cell={48} values={[["u₀", "u₁", "u₂", "u₃"]]} />
    {!second && <><Wire points={[[174, 807], [174, 870]]} /><Operation x={62} y={870} width={224} text="select B/C; positive Δ" />
      <Wire points={[[94, 902], [44, 902], [44, 946]]} /><Wire points={[[174, 902], [174, 946]]} /><Wire points={[[254, 902], [290, 902], [290, 946]]} />
      <Cells x={12} y={946} cell={32} values={[["B₀", "B₁"]]} /><Cells x={110} y={946} cell={32} values={[["Δ₀", "Δ₁", "Δ₂", "Δ₃"]]} /><Cells x={258} y={946} cell={32} values={[["C₀", "C₁"]]} />
      <Label x={12} y={1035}>Shared B/C; per-channel Δ</Label></>}
    {second && <><Wire points={[[272, 827], [341, 827], [341, 1010], [309, 1010]]} /><Cells x={213} y={986} cell={48} values={[["B₀", "B₁"], ["C₀", "C₁"]]} /><Label x={12} y={1036}>Filtered B/C</Label><Label x={12} y={1130}>Next: one two-value head</Label></>}
  </Drawing>;
}
function Core({
  second = false
}) {
  const p = second ? 2 : 1,
    old = second ? [['s₀₀', 's₀₁'], ['s₁₀', 's₁₁']] : [['h₀'], ['h₁']];
  return <Drawing name={second ? 'mamba-two-core' : 'mamba-one-core'} height={1666} caption={`Retained memory and the new write add coordinate by coordinate. Save that new state; C reads it into ${p} feature${p > 1 ? 's' : ''}, then D adds a separate current-input contribution. Only the returned features enter the outside gate.`} label={`An opened ${second ? 'head' : 'channel'} receives old state, current feature, selected delta/write/read and learned rate/direct coefficients as separate operands. Delta and A make retention; delta/B/current feature make the write; retained state and write add. C reads the new state into ${p} returned feature${p > 1 ? 's' : ''}, then a separate D times current feature joins the returned output. Saved state does not go directly into the outside feature gate.`}>
    <Label x={12} y={22}>{second ? 'One head: K=2 state rows, P=2 values' : 'One expanded channel: two state coordinates'}</Label>
    <Label x={12} y={57}>selected Δ</Label><Cells x={12} y={79} cell={48} values={[["Δ"]]} />
    <Label x={180} y={57} role="parameter">learned rates A</Label><Cells x={180} y={79} cell={48} values={second ? [["A"]] : [["A₀", "A₁"]]} role="parameter" />
    <Wire points={[[36, 127], [36, 174], [111, 174]]} /><Wire points={[[204, 127], [273, 127], [273, 174], [239, 174]]} /><Operation x={111} y={158} width={128} text="exp(Δ × A)" />
    <Wire points={[[175, 190], [175, 243]]} /><Cells x={second ? 151 : 127} y={243} cell={48} values={second ? [["a"]] : [["a₀", "a₁"]]} />
    <Label x={12} y={338}>old state</Label><Cells x={12} y={363} cell={58} values={old} role="input" />
    <Wire points={[[second ? 128 : 70, 421], [150, 421]]} /><Wire points={[[175, 291], [175, 396]]} /><Value x={175} y={421} value="⊗" role="ink" />
    <Wire points={[[175, 446], [175, 521]]} /><Cells x={117} y={521} cell={58} values={second ? [['aS₀₀', 'aS₀₁'], ['aS₁₀', 'aS₁₁']] : [['a₀h₀'], ['a₁h₁']]} />
    <Label x={32} y={682}>Separate write</Label>
    <Cells x={12} y={726} cell={48} values={[["B₀"], ["B₁"]]} /><Cells x={second ? 245 : 269} y={726} cell={48} values={second ? [["u₀", "u₁"]] : [["u"]]} />
    <Label x={12} y={710}>selected B</Label><Label x={245} y={710}>current u</Label>
    <Wire points={[[60, 774], [145, 774]]} /><Wire points={[[second ? 245 : 269, 774], [205, 774]]} /><Value x={175} y={774} value="⊗" role="ink" />
    <Wire points={[[175, 799], [175, 845]]} /><Operation x={133} y={845} width={84} text="× Δ" />
    <Wire points={[[36, 127], [12, 127], [12, 867], [133, 867]]} />
    <Wire points={[[175, 877], [175, 921]]} /><Cells x={117} y={921} cell={58} values={second ? [['w₀₀', 'w₀₁'], ['w₁₀', 'w₁₁']] : [['w₀'], ['w₁']]} />
    <Wire points={[[second ? 233 : 175, 579], [344, 579], [344, 1093], [205, 1093]]} /><Wire points={[[175, 1037], [175, 1068], [180, 1068]]} /><Value x={180} y={1093} value="⊕" role="ink" />
    <Label x={12} y={1144}>New persisted state</Label><Wire points={[[180, 1118], [180, 1171]]} /><Cells x={second ? 122 : 151} y={1171} cell={58} values={second ? [['S′₀₀', 'S′₀₁'], ['S′₁₀', 'S′₁₁']] : [['h′₀'], ['h′₁']]} />
    <Wire points={[[180, 1287], [180, 1330]]} /><Operation x={127} y={1330} width={106} text="read C" />
    <Cells x={12} y={1298} cell={48} values={[["C₀"], ["C₁"]]} /><Wire points={[[60, 1346], [127, 1346]]} />
    <Label x={12} y={1282}>selected C</Label>
    <Wire points={[[180, 1362], [180, 1510]]} /><Value x={180} y={1535} value="⊕" role="ink" />
    <Operation x={257} y={1435} width={91} text="D × u" />
    <Wire points={[[second ? 341 : 317, 774], [354, 774], [354, 1451], [348, 1451]]} /><Cells x={257} y={1370} cell={48} values={[["D"]]} role="parameter" /><Wire points={[[281, 1418], [281, 1435]]} />
    <Wire points={[[302, 1467], [302, 1535], [205, 1535]]} /><Wire points={[[180, 1560], [180, 1593]]} /><Cells x={second ? 132 : 156} y={1593} cell={48} values={second ? [["y₀", "y₁"]] : [["y"]]} />
  </Drawing>;
}
function Output({
  second = false
}) {
  return <Drawing name={second ? 'mamba-two-output' : 'mamba-one-output'} height={647} label={`The returned feature vector is distinct from persisted state. An activated outside gate multiplies it elementwise. ${second ? 'In Mamba2Simple default, gating comes before RMS normalization.' : 'Mamba1 does not put an output RMS normalization here.'} The final projection restores original model width; the enclosing residual was drawn separately.`}>
    <Label x={12} y={22}>Returned features, not the saved state array</Label>
    <Cells x={12} y={67} cell={48} values={[["y₀", "y₁", "y₂", "y₃"]]} />
    <Label x={145} y={169}>Repeat each core</Label>
    <Cells x={12} y={210} cell={48} values={[["z₀", "z₁", "z₂", "z₃"]]} />
    <Wire points={[[204, 234], [236, 234]]} /><Operation x={236} y={218} width={106} text="SiLU(z)" />
    <Wire points={[[108, 115], [108, 343], [149, 343]]} /><Wire points={[[289, 250], [289, 343], [199, 343]]} /><Value x={174} y={343} value="⊗" role="ink" />
    {second ? <><Wire points={[[174, 368], [174, 409]]} /><Operation x={113} y={409} width={122} text="RMSNorm" /><Wire points={[[174, 441], [174, 485]]} /></> : <Wire points={[[174, 368], [174, 485]]} />}
    <Operation x={113} y={485} width={122} text="project 4 → 2" /><Wire points={[[174, 517], [174, 562]]} /><Cells x={126} y={562} cell={48} values={[["δ₀", "δ₁"]]} />
    <Label x={12} y={640}>{second ? 'Simple default: gate BEFORE RMSNorm.' : 'Add saved input in its layer.'}</Label>
  </Drawing>;
}
export function StateMambaOneDrawing() {
  return <><Front /><Core /><Output /></>;
}
export function StateMambaTwoDrawing() {
  return <><Front second /><Core second /><Output second /></>;
}

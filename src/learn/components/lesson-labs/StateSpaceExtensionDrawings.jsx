import { StateDrawing as Drawing, StateLabel as Label, StateWire as Wire, StateCells as Cells, StateOperation as Operation, StateValue as Value } from './StateSpaceDrawings.jsx';
import { flowNumber as number } from './LessonFlow.jsx';
export function StateCacheSizeDrawing() {
  return <Drawing name="cache-size" height={356} caption="The two square areas share one scale: the K/V square has 256 times the area of the recurrent square. These count the specified retained arrays for one sequence, excluding parameters, temporary buffers and local-convolution caches." label="One small square represents forty-eight kibibytes of real recurrent state. A square sixteen times wider and sixteen times taller represents twelve mebibytes of full key/value cache: two hundred fifty-six times as many bytes. This is an exact specified-array comparison, not a measured throughput result.">
    <Label x={12} y={22}>Same area scale for retained bytes</Label>
    <Label x={12} y={68}>48 KiB</Label><Label x={148} y={68}>12 MiB</Label>
    <rect x={12} y={99} width={12} height={12} fill="#baa1e3" fillOpacity=".2" stroke="#baa1e3" />
    <rect x={148} y={99} width={192} height={192} fill="#baa1e3" fillOpacity=".2" stroke="#baa1e3" />
    <Label x={12} y={154}>recurrent</Label><Label x={12} y={184}>12 layers</Label><Label x={12} y={214}>64 channels</Label><Label x={12} y={244}>16 states</Label><Label x={12} y={274}>4 bytes each</Label>
    <Label x={148} y={328}>full K/V: ratio 256</Label>
  </Drawing>;
}
export function StateQuadratureDrawing() {
  return <Drawing name="endpoint-area" height={342} caption="Constructed forcing g(s)=s on one interval of length 1, with no decay. Its exact contribution is the triangular area 1/2. Averaging the two endpoint heights gives the same area; using only the right endpoint gives area 1." label="A rising line goes from zero to one on equal labelled time and forcing axes. The violet triangular area is the exact integrated forcing. A neutral outline rectangle of unit area depicts using only the right endpoint. Their areas are one half and one respectively.">
    <Label x={12} y={22}>Two endpoints recover a rising contribution</Label>
    <path d="M 67,75 V 269 H 309" stroke="#898989" fill="none" />
    <polygon points="77,259 267,259 267,69" fill="#baa1e3" fillOpacity=".2" stroke="#baa1e3" />
    <rect x={77} y={69} width={190} height={190} fill="none" stroke="#dedede" strokeDasharray="4 5" />
    <Label x={56} y={74} anchor="end">1</Label><Label x={56} y={263} anchor="end">0</Label>
    <Label x={77} y={291} anchor="middle">0</Label><Label x={267} y={291} anchor="middle">1</Label><Label x={293} y={292}>s</Label>
    <Label x={12} y={54}>g(s)</Label><Label x={112} y={235} role="computed">area 1/2</Label><Label x={101} y={111}>rectangle: 1</Label>
  </Drawing>;
}
export function StateSharedMemoryDrawing() {
  return <Drawing name="shared-mimo" height={974} label="Independent channel banks retain separate state vectors, while a multi-input multi-output system projects every input channel into one shared state. A separate C read matrix takes that state into three output channels.">
    <Label x={12} y={22}>Independent banks versus a shared state</Label>
    <Cells x={12} y={61} cell={65} values={[["u0", "u1", "u2"]]} role="input" />
    {[0, 1, 2].map(i => <g key={i}><Wire points={[[44.5 + i * 65, 126], [44.5 + i * 65, 173]]} /><Cells x={12 + i * 65} y={173} cell={65} values={[[`h${i}0`], [`h${i}1`]]} /></g>)}
    <Label x={12} y={356}>Three banks × two state coordinates = 6.</Label>
    <Cells x={12} y={396} cell={65} values={[["u0", "u1", "u2"]]} role="input" />
    <Wire points={[[109.5, 461], [109.5, 498]]} /><Operation x={39} y={498} width={141} text="B-bar: mix channels" />
    <Wire points={[[109.5, 530], [109.5, 573]]} /><Cells x={12} y={573} cell={65} values={[["h0", "h1", "h2"]]} />
    <Label x={12} y={657}>One shared 3-coordinate state</Label>
    <Cells x={12} y={698} cell={43} values={[["C₀₀", "C₀₁", "C₀₂"], ["C₁₀", "C₁₁", "C₁₂"], ["C₂₀", "C₂₁", "C₂₂"]]} role="parameter" />
    <Wire points={[[207, 605], [304, 605], [304, 761], [279, 761]]} /><Wire points={[[141, 762], [229, 762]]} /><Value x={254} y={762} value="⊗" role="ink" />
    <Wire points={[[254, 787], [254, 849]]} /><Cells x={157} y={849} cell={65} values={[["y0", "y1", "y2"]]} />
    <Label x={12} y={954}>Three outputs read the same shared state.</Label>
  </Drawing>;
}
export function StateEndpointsDrawing({
  mixture = .5,
  current = 6
}) {
  const oldContribution = .5,
    previousContribution = (1 - mixture) * .5 * 2,
    currentContribution = mixture * current;
  const total = oldContribution + previousContribution + currentContribution;
  return <Drawing name="two-endpoints" height={465} label={`Retain one half of old state one. The previous write two contributes ${previousContribution}; current write ${current} contributes ${currentContribution}. Their sum is ${total}.`}>
    <Label x={12} y={22}>Keep both endpoints of a changing input</Label>
    <Value x={57} y={85} value={1} role="input" /><Value x={180} y={85} value={2} role="input" /><Value x={303} y={85} value={current} role="input" />
    <Label x={18} y={48}>old state</Label><Label x={131} y={48}>old write</Label><Label x={254} y={48}>new write</Label>
    <Wire points={[[57, 110], [57, 153]]} /><Wire points={[[180, 110], [180, 153]]} /><Wire points={[[303, 110], [303, 153]]} />
    <Operation x={16} y={153} width={82} text="× .5" /><Operation x={128} y={153} width={104} text={`× ${number((1 - mixture) * .5, 4)}`} /><Operation x={262} y={153} width={82} text={`× ${number(mixture, 4)}`} />
    <Wire points={[[57, 185], [57, 225]]} /><Wire points={[[180, 185], [180, 225]]} /><Wire points={[[303, 185], [303, 225]]} />
    <Value x={57} y={250} value={oldContribution} /><Value x={180} y={250} value={previousContribution} /><Value x={303} y={250} value={currentContribution} />
    <Wire points={[[57, 275], [57, 330], [155, 330]]} /><Wire points={[[180, 275], [180, 305]]} /><Wire points={[[303, 275], [303, 330], [205, 330]]} /><Value x={180} y={330} value="⊕" role="ink" />
    <Wire points={[[180, 355], [180, 391]]} /><Value x={180} y={416} value={total} /><Label x={12} y={459}>Fixed Δ=1, B=1, retention α=.5.</Label>
  </Drawing>;
}
export function StateParityDrawing() {
  const bits = [1, 0, 1, 1],
    parity = [1, 1, 0, 1];
  return <Drawing name="rotation-parity" height={675} label="Starting at one and zero, a one bit rotates by pi and a zero bit leaves the state unchanged. Four independent equal-scale planes display the states for bits one, zero, one, one; odd/even parity is one, one, zero, one.">
    <Label x={12} y={22}>Rotation preserves a bit of discrete history</Label>
    {bits.map((bit, i) => {
      const x = i % 2 ? 266 : 85,
        y = i < 2 ? 181 : 435,
        sign = parity[i] ? -1 : 1;
      return <g key={i}>
        <Label x={x} y={y - 106} anchor="middle" role="input">bit {i}: {bit}</Label>
        <path d={`M ${x - 59},${y} H ${x + 59} M ${x},${y - 59} V ${y + 59}`} stroke="#666" fill="none" />
        <circle cx={x} cy={y} r="43" stroke="#666" fill="none" />
        <Wire points={[[x, y], [x + sign * 43, y]]} />
        <Label x={x} y={y + 94} anchor="middle" role="computed">[{sign},0]; parity {parity[i]}</Label>
      </g>;
    })}
    <Label x={12} y={603}>Same scale in all four planes: radius 1.</Label>
    <Label x={12} y={633}>Input 1: π rotation. Input 0: no rotation.</Label>
    <Label x={12} y={663}>This fixture: no write or decay.</Label>
  </Drawing>;
}
export function StateMovingFrameDrawing() {
  return <Drawing name="moving-frame" height={566} label="A direct state rotates through successive physical frames. Expressing it in a common running frame removes those repeated state rotations; both write and read coordinates rotate by the same accumulated angle. Their inner product is preserved.">
    <Label x={12} y={22}>Rotate the coordinate frame</Label>
    <path d="M 41,162 H 142 M 91,111 V 213 M 211,162 H 312 M 261,111 V 213" stroke="#666" fill="none" />
    <Wire points={[[91, 162], [126, 162]]} /><Wire points={[[261, 162], [261, 127]]} />
    <Label x={12} y={83}>before turn</Label><Label x={203} y={83}>after π/2 turn</Label>
    <Label x={12} y={253}>Direct frame: state direction changes.</Label>
    <Cells x={12} y={310} cell={62} values={[["B0", "B1"], ["C0", "C1"]]} role="input" />
    <Wire points={[[136, 372], [174, 372]]} /><Operation x={174} y={356} width={157} text="same accumulated R" />
    <Wire points={[[252, 388], [252, 434]]} /><Cells x={190} y={434} cell={62} values={[["B̃0", "B̃1"], ["C̃0", "C̃1"]]} />
    <Label x={12} y={563}>Running frame: rotate B and C together.</Label>
  </Drawing>;
}
export function StateRankDrawing() {
  return <Drawing name="rank-writes" height={826} label="One outer product of two-coordinate vectors can add a rank-one direction. Two independent outer products, one writing the first diagonal and one the second, add to the two-by-two identity without increasing the retained state shape.">
    <Label x={12} y={22}>Write two directions into one array</Label>
    <Cells x={12} y={63} values={[[1], [0]]} role="input" /><Cells x={180} y={63} values={[[1, 0]]} role="input" />
    <Wire points={[[55, 106], [107, 106]]} /><Wire points={[[180, 106], [157, 106]]} /><Value x={132} y={106} value="⊗" role="ink" />
    <Wire points={[[132, 131], [132, 199]]} /><Cells x={89} y={199} values={[[1, 0], [0, 0]]} />
    <Label x={12} y={337}>First direction</Label>
    <Cells x={12} y={373} values={[[0], [1]]} role="input" /><Cells x={180} y={373} values={[[0, 1]]} role="input" />
    <Wire points={[[55, 416], [107, 416]]} /><Wire points={[[180, 416], [157, 416]]} /><Value x={132} y={416} value="⊗" role="ink" />
    <Wire points={[[132, 441], [132, 489]]} /><Cells x={89} y={489} values={[[0, 0], [0, 1]]} />
    <Wire points={[[175, 242], [315, 242], [315, 633], [206, 633]]} /><Wire points={[[132, 575], [132, 633], [156, 633]]} /><Value x={181} y={633} value="⊕" role="ink" />
    <Wire points={[[181, 658], [181, 690]]} /><Cells x={138} y={690} values={[[1, 0], [0, 1]]} />
    <Label x={12} y={815}>Rank 2 write; retained shape still 2×2.</Label>
  </Drawing>;
}
export function StateMambaThreeDrawing() {
  return <Drawing name="mamba-three-block" height={1488} label="The maintained Mamba3 configuration projects parallel gate, values, B/C, step, decay, endpoint mixture and rotary coordinates. B/C RMS normalization precedes learned biases and shared rotations. The two-endpoint update accepts old state and previous write separately; its persisted new state is read with C into features before direct input and outside gating. Default output normalization is disabled; when enabled its RMS normalization comes before gating. Continuation stores angles, recurrent state, previous keys and previous values.">
    <Label x={12} y={22}>Current Mamba-3 configuration, not Mamba-1</Label>
    <Cells x={82} y={63} cell={49} values={[["f0", "f1", "f2", "f3"]]} role="input" />
    <Wire points={[[180, 112], [180, 162]]} /><Operation x={101} y={162} width={158} text="parallel projections" />
    <Wire points={[[259, 178], [341, 178], [341, 1229]]} /><Label x={282} y={233}>z</Label>
    <Cells x={12} y={260} cell={49} values={[["B0", "B1"], ["C0", "C1"]]} />
    <Cells x={210} y={260} cell={49} values={[["v0", "v1"]]} />
    <Wire points={[[150, 194], [61, 194], [61, 260]]} /><Wire points={[[211, 194], [259, 194], [259, 260]]} />
    <Wire points={[[61, 358], [61, 408]]} /><Operation x={12} y={408} width={106} text="B/C RMSNorm" />
    <Wire points={[[65, 440], [65, 492]]} /><Operation x={12} y={492} width={106} text="learned bias" />
    <Wire points={[[65, 524], [65, 566]]} /><Operation x={12} y={566} width={106} text="rotate B/C" />
    <Cells x={148} y={408} cell={39} values={[["Δ", "A", "λ"]]} />
    <Wire points={[[211, 194], [325, 194], [325, 427], [265, 427]]} />
    <Cells x={148} y={492} cell={39} values={[["θ"]]} /><Wire points={[[325, 427], [325, 511], [187, 511]]} />
    <Wire points={[[167, 531], [167, 582], [118, 582]]} />
    <Wire points={[[265, 427], [332, 427], [332, 633], [212, 633], [212, 644]]} />
    <Wire points={[[65, 598], [65, 660], [136, 660]]} /><Wire points={[[259, 309], [259, 660], [224, 660]]} />
    <Operation x={136} y={644} width={88} text="update" />
    <Label x={12} y={684}>old state</Label><Cells x={12} y={698} cell={32} values={[["S00", "S01"], ["S10", "S11"]]} role="input" />
    <Wire points={[[76, 730], [99, 730], [99, 694], [150, 694], [150, 676]]} />
    <Label x={12} y={827}>old write</Label><Cells x={12} y={849} cell={32} values={[["w00", "w01"], ["w10", "w11"]]} role="input" />
    <Wire points={[[76, 881], [110, 881], [110, 711], [209, 711], [209, 676]]} />
    <Wire points={[[180, 676], [180, 725]]} /><Cells x={137} y={725} values={[["S′00", "S′01"], ["S′10", "S′11"]]} />
    <Wire points={[[180, 811], [180, 891]]} /><Operation x={127} y={891} width={106} text="Cᵀ × state" />
    <Wire points={[[118, 582], [247, 582], [247, 907], [233, 907]]} />
    <Wire points={[[180, 923], [180, 965]]} /><Cells x={137} y={965} values={[["y0", "y1"]]} />
    <Operation x={252} y={960} width={86} text="D × v" /><Wire points={[[259, 309], [354, 309], [354, 976], [338, 976]]} />
    <Cells x={276} y={859} values={[["D"]]} role="parameter" /><Wire points={[[297, 902], [297, 960]]} />
    <Wire points={[[180, 1008], [180, 1045]]} /><Value x={180} y={1070} value="⊕" role="ink" /><Wire points={[[295, 992], [295, 1070], [205, 1070]]} />
    <Wire points={[[180, 1095], [180, 1130]]} /><Operation x={97} y={1130} width={166} text="optional output norm" />
    <Wire points={[[180, 1162], [180, 1244]]} /><Value x={180} y={1269} value="⊗" role="ink" />
    <Operation x={266} y={1213} width={75} text="SiLU(z)" /><Wire points={[[304, 1245], [304, 1269], [205, 1269]]} />
    <Wire points={[[180, 1294], [180, 1336]]} /><Operation x={111} y={1336} width={138} text="output projection" />
    <Label x={12} y={1430}>Default: no output norm, no short conv.</Label>
    <Label x={12} y={1460}>Cache supplies old state and write.</Label>
  </Drawing>;
}
export function StateMambaThreeCacheDrawing() {
  return <Drawing name="mamba-three-cache" height={956} label="A complete Mamba3 continuation needs four distinct arrays: cumulative angle, recurrent matrix state, previous key and previous value. The old key and value reconstruct the previous endpoint write; the angle sets the next rotation offset. The state alone cannot supply these dependencies.">
    <Label x={12} y={22}>A two-endpoint rotating block has four caches</Label>
    <Cells x={12} y={63} cell={58} values={[["θ0", "θ1"]]} /><Label x={159} y={83}>last angles</Label>
    <Cells x={12} y={242} cell={58} values={[["S00", "S01"], ["S10", "S11"]]} /><Label x={159} y={272}>recurrent matrix state</Label>
    <Cells x={12} y={443} cell={58} values={[["k0", "k1"]]} /><Label x={159} y={464}>previous key</Label>
    <Cells x={12} y={614} cell={58} values={[["v0", "v1"]]} /><Label x={159} y={635}>previous value</Label>
    {[92, 300, 472, 643].map(y => <Wire key={y} points={[[128, y], [339, y], [339, 789], [250, 789]]} />)}
    <Operation x={100} y={773} width={150} text="next-token block" />
    <Label x={12} y={862}>Angles offset the next coordinate rotation.</Label>
    <Label x={12} y={892}>Key × value supplies the old endpoint write.</Label>
    <Label x={12} y={922}>A new sequence must reset all four arrays.</Label>
    <Label x={12} y={951}>Array sketches are representative cutaways.</Label>
  </Drawing>;
}

import { StateDrawing as Drawing, StateLabel as Label, StateWire as Wire, StateCells as Cells, StateOperation as Operation, StateValue as Value } from './StateSpaceDrawings.jsx';
import { flowNumber as number } from './LessonFlow.jsx';
export function StateFFTDrawings() {
  return <Drawing name="fft-padding" height={662} label="Input one, zero, one and taps one, two are padded to at least four slots. Their full linear output one, two, one, two is cropped to the first three. A length-three circular transform would wrap the final two into the first output.">
    <Label x={12} y={22}>Keep the tail from wrapping to the start</Label>
    <Label x={12} y={60} role="input">input u</Label><Cells x={119} y={39} values={[[1, 0, 1, 0]]} role="input" />
    <Label x={12} y={130} role="parameter">taps</Label><Cells x={119} y={109} values={[[1, 2, 0, 0]]} role="parameter" />
    <Wire points={[[205, 82], [337, 82], [337, 180], [206, 180]]} /><Wire points={[[205, 152], [205, 180]]} />
    <Operation x={151} y={180} width={108} text="two FFTs" />
    <Wire points={[[205, 212], [205, 245]]} /><Value x={205} y={270} value="⊗" role="ink" />
    <Label x={12} y={247}>multiply</Label><Label x={12} y={279}>matching frequencies</Label>
    <Wire points={[[205, 295], [205, 329]]} /><Operation x={151} y={329} width={108} text="inverse FFT" />
    <Wire points={[[205, 361], [205, 395]]} /><Cells x={119} y={395} values={[[1, 2, 1, 2]]} />
    <Label x={12} y={423}>full tail</Label>
    <Wire points={[[205, 438], [205, 484]]} /><Cells x={119} y={484} values={[[1, 2, 1]]} /><Label x={265} y={513}>crop</Label>
    <Label x={12} y={565}>Keep 3 causal outputs; full length is 4.</Label>
    <path d="M 313,416 H 349 V 612 H 109" stroke="#898989" fill="none" strokeDasharray="4 5" />
    <Cells x={119} y={589} values={[[3, 2, 1]]} /><Label x={12} y={649}>Wrong size 3: last 2 wraps into first 1.</Label>
  </Drawing>;
}
export function StateTransientDrawing() {
  return <Drawing name="transient-growth" height={346} label="Both eigenvalues of the displayed transition are one half, yet state (0,1) becomes (4,.5). Equal axes show the initial norm grows before later decay.">
    <Label x={12} y={22}>Shrinking eigenmodes can still mix strongly</Label>
    <Cells x={12} y={51} values={[[.5, 4], [0, .5]]} role="parameter" />
    <Label x={116} y={75}>advance A-bar</Label><Label x={116} y={101}>eigenvalues .5, .5</Label>
    <path d="M 29,274 H 332 M 53,167 V 303" stroke="#898989" fill="none" />
    <Wire points={[[53, 274], [53, 234]]} /><Label x={63} y={229} role="input">old (0,1)</Label>
    <Wire points={[[53, 274], [213, 254]]} /><Label x={224} y={252} role="computed">new (4,.5)</Label>
    <Label x={12} y={338}>Both axes: 40 px per state unit.</Label>
  </Drawing>;
}
export function StateConjugateDrawing() {
  return <Drawing name="conjugate-read" height={420} label="The complex coordinates three minus i and its conjugate are multiplied by corresponding learned read weights one plus two i and its conjugate. The two products add to a real ten.">
    <Label x={12} y={22}>Store one pair; read both conjugates</Label>
    <Cells x={12} y={52} cell={94} values={[["3 − i"], ["3 + i"]]} role="input" />
    <Cells x={243} y={52} cell={94} values={[["1 + 2i"], ["1 − 2i"]]} role="parameter" />
    <Wire points={[[106, 99], [155, 99]]} /><Wire points={[[243, 99], [205, 99]]} /><Value x={180} y={99} value="⊗" role="ink" />
    <Wire points={[[106, 193], [155, 193]]} /><Wire points={[[243, 193], [205, 193]]} /><Value x={180} y={193} value="⊗" role="ink" />
    <Label x={125} y={146} role="computed">5 + 5i</Label><Label x={125} y={242} role="computed">5 − 5i</Label>
    <Wire points={[[180, 124], [119, 124], [119, 297], [155, 297]]} /><Wire points={[[180, 218], [180, 272]]} />
    <Value x={180} y={297} value="⊕" role="ink" /><Wire points={[[180, 322], [180, 357]]} /><Value x={180} y={382} value={10} />
    <Label x={12} y={403}>real output</Label>
  </Drawing>;
}
export function StateDPLRDrawing() {
  const amplitudes = [1, Math.sqrt(3), Math.sqrt(5)];
  const p = [Math.sqrt(.5), Math.sqrt(1.5), Math.sqrt(2.5)];
  const original = amplitudes.map((a, i) => amplitudes.map((b, j) => i === j ? -i - 1 : i > j ? -a * b : 0));
  const rank = p.map(a => p.map(b => a * b));
  const normal = original.map((row, i) => row.map((a, j) => a + rank[i][j]));
  return <Drawing name="normal-rank" height={911} label="A triangular three-coordinate HiPPO-inspired matrix receives an actual rank-one outer-product correction. The sum is normal. A unitary frame diagonalizes the sum, while subtracting the transformed correction retains the original dynamics.">
    <Label x={12} y={22}>Correct A; then change coordinates</Label>
    <Label x={12} y={56} role="parameter">A: original triangular rates</Label><Cells x={109} y={77} values={original} cell={56} role="parameter" />
    <Label x={12} y={271} role="parameter">p pᵀ: outer-product correction</Label><Cells x={109} y={292} values={rank} cell={56} role="parameter" />
    <Wire points={[[277, 161], [332, 161], [332, 499], [205, 499]]} /><Wire points={[[193, 460], [193, 474]]} /><Value x={180} y={499} value="⊕" role="ink" />
    <Wire points={[[180, 524], [180, 550]]} /><Cells x={109} y={550} values={normal} cell={56} />
    <Label x={12} y={750}>Symmetric part −I/2</Label>
    <Wire points={[[193, 718], [193, 783]]} /><Operation x={129} y={783} width={128} text="unitary frame U" />
    <Label x={12} y={859} role="parameter">Λ minus (U* p)(U* p)*</Label><Label x={12} y={892}>Keep the non-diagonal correction.</Label>
  </Drawing>;
}
export function StateWoodburyDrawing() {
  return <Drawing name="rank-one-solve" height={634} label="Solve a coupled system by diagonal reciprocal, a scalar denominator and a rank-one correction. The displayed subtraction returns .6 minus .2, rather than the uncoupled one and zero.">
    <Label x={12} y={22}>Retain the coupling without a dense inverse</Label>
    <Cells x={12} y={55} values={[[1, 0], [0, .5]]} role="parameter" /><Label x={113} y={82}>diagonal reciprocal R₀</Label>
    <Cells x={12} y={185} values={[[.4, .2], [.2, .1]]} /><Label x={113} y={211}>rank-one correction</Label><Label x={215} y={266}>divisor 2.5</Label>
    <Wire points={[[55, 141], [55, 321], [154, 321]]} /><Wire points={[[98, 228], [180, 228], [180, 296]]} /><Value x={180} y={321} value="−" role="ink" />
    <Wire points={[[180, 346], [180, 372]]} /><Cells x={137} y={372} values={[[.6, -.2], [-.2, .4]]} />
    <Cells x={12} y={500} values={[[1], [0]]} role="input" /><Wire points={[[55, 543], [152, 543]]} />
    <Wire points={[[180, 458], [180, 526]]} /><Operation x={152} y={526} width={56} text="×" />
    <Wire points={[[208, 542], [251, 542]]} /><Cells x={251} y={500} values={[[.6], [-.2]]} />
    <Label x={12} y={627}>Coupling changes both coordinates.</Label>
  </Drawing>;
}
export function StateFiniteKernelDrawing() {
  return <><Drawing name="finite-read-correction" height={886} label="Physical read row C multiplies the finite-length matrix I minus A-bar to the L power, producing C-tilde. At a regular frequency the bilinear variable s enters a resolvent solve on B. C-tilde reads that solved state, and the scalar factor two over one plus z gives the generating polynomial. Minus one uses the separate limit explained in the next drawing.">
    <Label x={12} y={22}>Finite length changes the read coefficient</Label>
    <Cells x={12} y={74} cell={58} values={[["C₀", "C₁"]]} role="parameter" /><Label x={12} y={57}>physical C</Label>
    <Cells x={220} y={74} cell={58} values={[["F₀₀", "F₀₁"], ["F₁₀", "F₁₁"]]} /><Label x={220} y={57}>F = I − Āᴸ</Label>
    <Wire points={[[70, 132], [70, 245], [155, 245]]} /><Wire points={[[278, 190], [278, 245], [205, 245]]} /><Value x={180} y={245} value="⊗" role="ink" />
    <Wire points={[[180, 270], [180, 313]]} /><Cells x={122} y={313} cell={58} values={[["C̃₀", "C̃₁"]]} />
    <Label x={120} y={416}>z ≠ −1</Label>
    <Cells x={12} y={458} cell={58} values={[["B₀"], ["B₁"]]} role="parameter" />
    <Wire points={[[70, 516], [115, 516]]} /><Operation x={115} y={500} width={197} text="solve (sI − A) state = B" />
    <Label x={120} y={612}>s=(2/Δ)(1−z)/(1+z)</Label>
    <Wire points={[[312, 516], [337, 516], [337, 658], [205, 658]]} /><Wire points={[[180, 371], [98, 371], [98, 658], [155, 658]]} /><Value x={180} y={658} value="⊗" role="ink" />
    <Wire points={[[180, 683], [180, 727]]} /><Operation x={111} y={727} width={138} text="× 2/(1 + z)" />
    <Wire points={[[180, 759], [180, 809]]} /><Value x={180} y={834} value="Gᴸ(z)" />
    <Label x={12} y={881}>L is a sequence length; Āᴸ is a matrix power.</Label>
  </Drawing><Drawing name="finite-frequency" height={650} label="A finite tap polynomial is evaluated at L equally spaced unit-circle points, including minus one for even length. Its finite-read correction was drawn separately. An inverse Fourier transform recovers exactly the retained taps.">
    <Label x={12} y={22}>Evaluate the finite tap polynomial</Label>
    <Cells x={12} y={55} cell={64} values={[["K₀", "K₁", "K₂", "K₃"]]} />
    <Label x={168} y={152}>L = 4</Label>
    <Wire points={[[140, 119], [140, 184]]} /><Operation x={91} y={184} width={98} text="evaluate G(z)" />
    <Wire points={[[140, 216], [140, 248], [180, 248], [180, 270]]} />
    <circle cx="180" cy="356" r="86" fill="none" stroke="#666" />
    {[[266, 356, '1'], [180, 270, 'i'], [94, 356, '−1'], [180, 442, '−i']].map(([x, y, name]) => <g key={name}><circle cx={x} cy={y} r="5" fill="#baa1e3" /><Label x={x + (name === '1' ? 13 : name === 'i' ? 13 : -9)} y={y + (name.includes('i') ? -13 : 29)} role="computed">{name}</Label></g>)}
    <Label x={198} y={501}>−1: finite limit</Label>
    <Wire points={[[180, 468], [180, 530]]} /><Operation x={122} y={530} width={116} text="inverse FFT" />
    <Wire points={[[180, 562], [180, 586]]} /><Cells x={12} y={586} cell={64} values={[["K₀", "K₁", "K₂", "K₃"]]} />
  </Drawing></>;
}
export function StateVandermondeDrawing() {
  const powers = [[1, .5, .25, .125], [1, .25, .0625, .015625]];
  const factors = [.5, -.1875],
    rows = powers.map((row, i) => row.map(value => factors[i] * value));
  // This fixture consists entirely of exact binary fractions. Fraction labels
  // keep the longest contributions exact without squeezing decimal digits.
  const fraction = value => {
    let denominator = 1;
    while (!Number.isInteger(value * denominator)) denominator *= 2;
    return denominator === 1 ? number(value) : `${number(value * denominator)}/${denominator}`;
  };
  return <Drawing name="diagonal-powers" height={862} caption="Each coefficient multiplies its corresponding power row. Computed contributions and taps use exact fractions; the equivalent decimal taps were worked in §3." label="Two diagonal modes independently generate powers of one half and one quarter. Actual write-read coefficient cells one half and minus three sixteenths enter the multiplication as a separate operand. Each coefficient multiplies its corresponding power row. The two computed rows add by column into the four exact taps of our worked two-mode system.">
    <Label x={12} y={22}>Each diagonal coordinate leaves its own trail</Label>
    <Cells x={71} y={58} cell={67} values={powers.map(row => row.map(fraction))} />
    <Label x={12} y={224}>Write × read factors</Label>
    <Cells x={12} y={236} cell={67} values={factors.map(value => [number(value, 4)])} />
    <Wire points={[[205, 192], [205, 411]]} /><Operation x={135} y={411} width={140} text="multiply each row" />
    <Wire points={[[79, 303], [105, 303], [105, 427], [135, 427]]} />
    <Wire points={[[205, 443], [205, 503]]} /><Cells x={71} y={503} cell={67} values={rows.map(row => row.map(fraction))} />
    <Label x={12} y={476}>Row contributions</Label>
    {[0, 1, 2, 3].map(i => <g key={i}><Wire points={[[104.5 + 67 * i, 637], [104.5 + 67 * i, 688]]} /><Value x={104.5 + 67 * i} y={711} value="Σ" radius={23} role="ink" /><Wire points={[[104.5 + 67 * i, 734], [104.5 + 67 * i, 778]]} /></g>)}
    <Cells x={71} y={778} cell={67} values={[rows[0].map((value, i) => fraction(value + rows[1][i]))]} />
    <Label x={12} y={859}>Exact taps in §3; one column sum per lag.</Label>
  </Drawing>;
}
export function StateShiftDrawing() {
  return <Drawing name="fixed-delay" height={354} label="A three-cell shift register stores current input and its previous two positions. A fixed read chooses the third cell, returning a two-step delay regardless of marker content.">
    <Label x={12} y={22}>A fixed age is a legitimate linear memory</Label>
    <Value x={47} y={81} value="u now" role="input" />
    <Wire points={[[72, 81], [124, 81]]} /><Cells x={124} y={59} cell={64} values={[["uₜ", "uₜ₋₁", "uₜ₋₂"]]} />
    <Wire points={[[156, 123], [156, 176], [220, 176], [220, 213]]} /><Wire points={[[220, 123], [220, 152], [284, 152], [284, 213]]} />
    <Cells x={124} y={213} cell={64} values={[["uₜ₊₁", "uₜ", "uₜ₋₁"]]} />
    <Label x={12} y={181}>next update</Label><Wire points={[[316, 91], [341, 91], [341, 306], [308, 306]]} /><Value x={283} y={306} value="y" />
    <Label x={12} y={342}>Fixed age; no marker-dependent read.</Label>
  </Drawing>;
}
export function StateGateInjectionDrawing({
  interval = Math.log(4),
  value = 10
}) {
  const retention = Math.exp(-interval),
    exact = retention * 2 + (1 - retention) * value;
  const maintained = retention * 2 + interval * value;
  return <Drawing name="selective-injection" height={827} label="The same interval gives exponential retention in both constructions. Exact held-input integration writes one minus retention; the maintained selective reference writes interval times B. Each distinct write adds the same separately retained old state two, giving its own output.">
    <Label x={12} y={22}>Equal retention, distinct writes</Label>
    <Value x={180} y={73} value="Δ" role="computed" /><Wire points={[[155, 73], [71, 73], [71, 134]]} /><Wire points={[[205, 73], [283, 73], [283, 134]]} />
    <Operation x={18} y={134} width={106} text="1 − exp(−Δ)" /><Operation x={244} y={134} text="Δ × B" />
    <Wire points={[[71, 166], [71, 227]]} /><Wire points={[[283, 166], [283, 227]]} />
    <Value x={71} y={252} value={1 - retention} /><Value x={283} y={252} value={interval} />
    <Label x={12} y={317}>exact</Label><Label x={218} y={317}>Δ B</Label>
    <Operation x={18} y={351} width={106} text={`× ${value}`} /><Operation x={230} y={351} width={106} text={`× ${value}`} />
    <Wire points={[[71, 277], [71, 351]]} /><Wire points={[[283, 277], [283, 351]]} />
    <Wire points={[[71, 383], [71, 409]]} /><Wire points={[[283, 383], [283, 409]]} />
    <Cells x={35} y={409} cell={72} values={[[(1 - retention) * value]]} /><Cells x={247} y={409} cell={72} values={[[interval * value]]} />
    <Label x={12} y={528}>Old state 2 has a separate retained route:</Label>
    <Value x={180} y={579} value={2} role="input" />
    <Wire points={[[180, 604], [180, 631]]} /><Operation x={116} y={631} width={128} text={`× ${Number(retention.toFixed(4))}`} />
    <Wire points={[[180, 663], [180, 696], [96, 696]]} /><Wire points={[[180, 696], [258, 696]]} />
    <Wire points={[[35, 445], [12, 445], [12, 696], [46, 696]]} /><Wire points={[[319, 445], [344, 445], [344, 696], [308, 696]]} />
    <Value x={71} y={696} value="⊕" role="ink" /><Value x={283} y={696} value="⊕" role="ink" />
    <Wire points={[[71, 721], [71, 754]]} /><Wire points={[[283, 721], [283, 754]]} />
    <Cells x={35} y={754} cell={72} values={[[exact]]} /><Cells x={247} y={754} cell={72} values={[[maintained]]} />
  </Drawing>;
}

import { useMemo, useState } from "react";
import { complexOperation, complexPolar, phasorSynthesis, harmonicProjection, squareConvergence, parseRealSamples, aliasState, windowSpectrum, convolutionState, multiplyComplex, filterResponse, laplaceRegion, harmonicValue } from "../../data/complex-transforms-models.js";
import { Figure, Compare, Plot, Plane, PolarGuide, ProjectionGuide, Arrow, Label, Scene, Ledger, Table, Range, Choice, Controls, SignalPlot, CoefficientStems, FiniteTransformDrawing, WindowDrawing, RocDrawing, StartupDrawing, TAU, fmt, ctext, values, unit, dft, finiteExponentialIntegral, signedLog } from "./ComplexTransformsDrawings.jsx";
function ComplexArithmeticLab() {
  const [operation, setOperation] = useState("multiply"), [re, setRe] = useState(2), [im, setIm] = useState(-1);
  const z = [1, 2], w = [re, im], undefinedResult = operation === "divide" && re === 0 && im === 0, s = undefinedResult ? null : complexOperation(z, w, operation), result = s?.result;
  const vectors = [{ end: z }, { end: w, tone: "blue" }, ...result ? [{ end: result, tone: "rose" }] : [], ...operation === "add" && result ? [{ start: z, end: result, tone: "blue", dashed: true }] : []];
  return <Figure id="arithmetic" caption="Gold is z=1+2i; cyan is w; rose is the current result. Addition translates w to z’s tip. Products multiply lengths and add angles; division reverses w’s length and angle. Zero has no direction." controls={<Controls onReset={() => {
    setOperation("multiply");
    setRe(2);
    setIm(-1);
  }}><Choice label="Operation" value={operation} onChange={setOperation} options={[["add", "Add z+w"], ["multiply", "Multiply zw"], ["divide", "Divide z/w"]]} /><Range label="Real coordinate of w" value={re} onChange={setRe} min={-3} max={3} step={0.25} /><Range label="Imaginary coordinate of w" value={im} onChange={setIm} min={-3} max={3} step={0.25} /></Controls>}>
 <Plane label={`Current complex ${operation}; ${undefinedResult ? "division by zero undefined" : ctext(result)}`} extent={12} vectors={vectors}>{({ X, Y }) => result && <PolarGuide X={X} Y={Y} phase={s.resultPolar.phase} radius={s.resultPolar.magnitude} />}</Plane>{undefinedResult ? <p role="status">Division by zero is undefined. Choose a nonzero w; z and w remain visible.</p> : <Ledger items={[[`${operation} result`, ctext(result)], ["length |result|", fmt(s.resultPolar.magnitude)], ["argument of result", s.resultPolar.phase === null ? "undefined at zero" : `${fmt(s.resultPolar.phase / Math.PI)}\u03C0 rad`], ["lengths |z|, |w|", `${fmt(s.zPolar.magnitude)}, ${fmt(s.wPolar.magnitude)}`]]} />}</Figure>;
}
function PhasorSynthesisLab() {
  const [index, setIndex] = useState(0), [phase, setPhase] = useState(Math.PI / 2), s = phasorSynthesis(index / 256, phase);
  return <Figure id="synthesis" caption="Individual circles preserve radii 2 V and 1 V. The rose waveform is the sum of their horizontal projections; its instantaneous complex sum is not a single fixed-frequency phasor." controls={<Controls onReset={() => {
    setIndex(0);
    setPhase(Math.PI / 2);
  }}><Range label="Time cursor index" value={index} onChange={setIndex} min={0} max={256} display={`${fmt(index / 256)} s`} /><Range label="Third-tone phase" value={phase} onChange={setPhase} min={-Math.PI} max={Math.PI} step={Math.PI / 12} display={`${fmt(phase / Math.PI)}\u03C0 rad`} /></Controls>}><Compare><Plane label="First tone 1 Hz; horizontal projection" extent={2.4} circle={2} unitLabel="V" vectors={[{ end: s.first }]}>{({ X, Y }) => <ProjectionGuide X={X} Y={Y} point={s.first} />}</Plane><Plane label="Third tone 3 Hz; horizontal projection" extent={2.4} circle={1} unitLabel="V" vectors={[{ end: s.third, tone: "blue" }]}>{({ X, Y }) => <ProjectionGuide X={X} Y={Y} point={s.third} tone="blue" />}</Plane></Compare><SignalPlot time={s.time} phase={phase} /><Ledger items={[[`time ${fmt(s.time)} s`, "same cursor in all three views"], ["first component (V)", fmt(s.first[0])], ["third component (V)", fmt(s.third[0])], ["real sum (V)", fmt(s.signal)]]} /></Figure>;
}
function HarmonicProjectionLab() {
  const [k, setK] = useState(3), [index, setIndex] = useState(256), s = harmonicProjection(2, 1, Math.PI / 2, 0, k), time = index / 256, current = s.points[index];
  return <Figure id="projection" caption="Products use the opposite rotation. Filled traces show signed real and imaginary integrands, accumulated only up to the cursor. The complex arrow is the analytic normalized accumulation, not a sampled approximation." controls={<Controls onReset={() => {
    setK(3);
    setIndex(256);
  }}><Range label="Candidate harmonic k" value={k} onChange={setK} min={-4} max={4} /><Range label="Integration endpoint index" value={index} onChange={setIndex} min={0} max={256} display={`${fmt(time)} s`} /></Controls>}><SignalPlot time={time} /><Plane label={`Opposite unit rotation at time ${fmt(time)} s`} extent={1.4} circle={1} vectors={[{ end: unit(-TAU * k * time), tone: "blue" }]} /><Compare><Plot label="Real product and signed accumulated area" xRange={[0, 1]} yRange={[-3, 3]} xLabel="time (s)" yLabel="Re integrand (V)" lines={[{ points: s.points.map((p) => [p.time, p.integrand[0]]) }]} areas={[{ points: s.points.slice(0, index + 1).map((p) => [p.time, p.integrand[0]]) }]} cursor={time} /><Plot label="Imaginary product and signed accumulated area" xRange={[0, 1]} yRange={[-3, 3]} xLabel="time (s)" yLabel="Im integrand (V)" lines={[{ points: s.points.map((p) => [p.time, p.integrand[1]]), tone: "blue" }]} areas={[{ points: s.points.slice(0, index + 1).map((p) => [p.time, p.integrand[1]]), tone: "blue" }]} cursor={time} /></Compare><Plane label={`Accumulation ${ctext(current.accumulated)}`} extent={2} unitLabel="V; normalized by T=1 s" vectors={[{ end: current.accumulated }]} /><Ledger items={[[`accumulation at ${fmt(time)} s`, ctext(current.accumulated)], ["complete-period c\u2096 (V)", ctext(s.coefficient)], ["opposite rotation at cursor", ctext(unit(-TAU * k * time))]]} /></Figure>;
}
function CoefficientFixtureLab() {
  const [phase, setPhase] = useState(Math.PI / 2), [offset, setOffset] = useState(0);
  return <Figure id="coefficients" caption="The first-frequency pair stays 1 V each. Phase rotates the cyan conjugate pair without changing its lengths; offset changes only the rose DC coefficient." controls={<Controls onReset={() => {
    setPhase(Math.PI / 2);
    setOffset(0);
  }}><Range label="Third-tone phase" value={phase} onChange={setPhase} min={-Math.PI} max={Math.PI} step={Math.PI / 12} display={`${fmt(phase / Math.PI)}\u03C0 rad`} /><Range label="DC offset" value={offset} onChange={setOffset} min={-2} max={2} step={0.25} display={`${fmt(offset)} V`} /></Controls>}><SignalPlot phase={phase} offset={offset} /><CoefficientStems phase={phase} offset={offset} /><Ledger items={[[`c\u2080 (V)`, fmt(offset)], ["c\u2083 (V)", ctext([0.5 * Math.cos(phase), 0.5 * Math.sin(phase)])], ["c\u208B\u2083 (V)", ctext([0.5 * Math.cos(phase), -0.5 * Math.sin(phase)])]]} /></Figure>;
}
function FourierConvergenceLab() {
  const [m, setM] = useState(4), s = squareConvergence(m);
  return <Figure id="convergence" caption="Gold is the finite odd-harmonic sum. Cyan dashed is the square wave; its jump value is zero. The peak moves toward the jump while approaching about 1.178980; shrinking mean-square error does not mean vanishing maximum error." controls={<Controls onReset={() => setM(4)}><Range label="Number of odd terms m" value={m} onChange={setM} min={1} max={64} /></Controls>}><Plot label="Full partial sum and target on common axes" xRange={[-0.25, 0.25]} yRange={[-1.4, 1.4]} xLabel="time (s)" yLabel="dimensionless signal" lines={[{ points: s.points.map((p) => [p.time, p.value]) }, { points: [[-0.25, -1], [-1e-8, -1]], tone: "blue", dashed: true }, { points: [[1e-8, 1], [0.25, 1]], tone: "blue", dashed: true }]} dots={[{ x: 0, y: 0, tone: "blue" }, { x: s.firstPeakTime, y: s.firstPeak, tone: "rose" }]} /><Plot label="Moving jump zoom" xRange={[0, 1.8]} yRange={[0, 1.4]} xLabel="scaled time 4mt" yLabel="dimensionless signal" lines={[{ points: s.nearPoints.map((p) => [p.scaledTime, p.value]) }, { points: [[0, 1.17898], [1.8, 1.17898]], tone: "rose", dashed: true }]} /><Ledger items={[[`moving peak t=${fmt(s.firstPeakTime)} s`, fmt(s.firstPeak)], ["fixed t=0.2 s", fmt(s.away)], ["jump t=0", fmt(s.midpoint)], ["mean-square error", fmt(s.meanSquaredError)], ["excess / jump size 2", fmt((s.firstPeak - 1) / 2)]]} /></Figure>;
}
function FiniteFourierLab() {
  const [active, setActive] = useState([1, 2, 0, -1]), [draft, setDraft] = useState("1, 2, 0, -1"), [bin, setBin] = useState(1), [error, setError] = useState("");
  function apply() {
    try {
      const next = parseRealSamples(draft);
      setActive(next);
      setBin(Math.min(bin, next.length - 1));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  return <Figure id="finite" caption="The draft changes the complete record only after Apply. Invalid input preserves every last committed sample, contribution, inverse and energy. Changing the bin changes the weights immediately." controls={<Controls onReset={() => {
    setActive([1, 2, 0, -1]);
    setDraft("1, 2, 0, -1");
    setBin(1);
    setError("");
  }}><label className="cx-control"><span>Draft: four or eight real samples in [−4,4]</span><input aria-label="Sample draft" type="text" value={draft} onChange={(e) => setDraft(e.target.value)} /></label><button type="button" onClick={apply}>Apply samples</button><Range label="Selected bin k" value={bin} onChange={setBin} min={0} max={active.length - 1} />{error && <p role="alert">{error} Last committed vector retained.</p>}</Controls>}><FiniteTransformDrawing samples={active} bin={bin} /></Figure>;
}
function ConjugateEditingLab() {
  const [bin, setBin] = useState(1), [mode, setMode] = useState("keep"), input = [1, 2, 0, -1], F = dft(input), partner = (4 - bin) % 4, edited = F.map((z, k) => mode === "one" && k === bin || mode === "pair" && (k === bin || k === partner) ? [0, 0] : z), inverse = dft(edited, true);
  return <Figure id="conjugates" caption="Gold shows original coefficients; cyan shows the edited spectrum. One-sided removal can leave a complex inverse. DC and Nyquist are their own partners, so pair removal affects only one bin there." controls={<Controls onReset={() => {
    setBin(1);
    setMode("keep");
  }}><Range label="Selected bin" value={bin} onChange={setBin} min={0} max={3} /><Choice label="Coefficient edit" value={mode} onChange={setMode} options={[["keep", "Keep all"], ["one", "Remove selected only"], ["pair", "Remove conjugate pair"]]} /></Controls>}><Compare><Plane label={`Original conjugate partners ${bin} and ${partner}`} extent={4} unitLabel="V" vectors={[{ end: F[bin] }, { end: F[partner], tone: "blue" }]} /><Plane label="Edited selected partners" extent={4} unitLabel="V" vectors={[{ end: edited[bin] }, { end: edited[partner], tone: "blue" }]} /></Compare><Plot label="Inverse real gold and imaginary cyan" xRange={[-0.5, 3.5]} yRange={[-4, 4]} xLabel="sample n" yLabel="inverse value (V)" stems={[{ points: inverse.map((z, n) => [n, z[0]]) }, { points: inverse.map((z, n) => [n, z[1]]), tone: "blue" }]} /><Table label="Complete edited spectrum and inverse" headers={["k / n", "edited X[k]", "inverse x[n]"]} rows={edited.map((z, n) => [n, ctext(z), ctext(inverse[n])])} /></Figure>;
}
function SamplingAliasLab() {
  const [f, setF] = useState(13), [fs, setFs] = useState(16), [phase, setPhase] = useState(Math.PI / 3), s = aliasState(f, fs, phase);
  return <Figure id="alias" caption="Gold and cyan continuous curves meet at every stored dot, but may disagree between dots. Positive folding reverses phase when the signed folded frequency is negative. This is equality of sampled sequences, not equality of continuous signals." controls={<Controls onReset={() => {
    setF(13);
    setFs(16);
    setPhase(Math.PI / 3);
  }}><Range label="Tone frequency" value={f} onChange={setF} min={0} max={24} step={0.25} display={`${fmt(f)} Hz`} /><Choice label="Sample rate" value={String(fs)} onChange={(v) => setFs(Number(v))} options={[[8, "8 samples/s"], [16, "16 samples/s"], [32, "32 samples/s"]]} /><Range label="Tone phase" value={phase} onChange={setPhase} min={-Math.PI} max={Math.PI} step={Math.PI / 12} display={`${fmt(phase / Math.PI)}\u03C0 rad`} /></Controls>}><Plot label="Original gold and folded cyan; common stored dots" xRange={[0, 1]} yRange={[-1.2, 1.2]} xLabel="time (s)" yLabel="signal (V)" lines={[{ points: s.curves.map((p) => [p.time, p.original]) }, { points: s.curves.map((p) => [p.time, p.alias]), tone: "blue", dashed: true }]} dots={s.samples.map((p) => ({ x: p.time, y: p.original }))} /><Ledger items={[[`signed fold in [\u2212fs/2,fs/2)`, `${fmt(s.signedAlias)} Hz`], ["positive folded frequency", `${fmt(s.foldedFrequency)} Hz`], ["folded phase", `${fmt(s.foldedPhase / Math.PI)}\u03C0 rad`], ["maximum sample mismatch", fmt(Math.max(...s.samples.map((p) => Math.abs(p.original - p.alias))))]]} /></Figure>;
}
function ObservationPaddingLab() {
  const [n, setN] = useState(64), [factor, setFactor] = useState(1), s = useMemo(() => windowSpectrum(n, n * factor, "rectangular", 5.5), [n, factor]);
  return <Figure id="padding" caption="Filled dots were observed; hollow zero positions were added. Padding samples the same finite-record transform more densely. Only changing N changes the observation record and its continuation period." controls={<Controls onReset={() => {
    setN(64);
    setFactor(1);
  }}><Choice label="Observation count N" value={String(n)} onChange={(v) => setN(Number(v))} options={[[32, "32"], [64, "64"], [128, "128"]]} /><Choice label="Padding factor" value={String(factor)} onChange={(v) => setFactor(Number(v))} options={[[1, "1: no added zeros"], [2, "2"], [4, "4"]]} /></Controls>}><Plot label="Observed samples and explicit added zero positions" xRange={[0, n * factor / 64]} yRange={[-1.2, 1.2]} xLabel="index divided by fs (s)" yLabel="sample (V)" stems={[{ points: s.samples.map((x, i) => [i / 64, x]) }, { points: Array.from({ length: n * (factor - 1) }, (_, i) => [(n + i) / 64, 0]), tone: "blue", hollow: true }]} cursor={n / 64} /><WindowDrawing state={s} /></Figure>;
}
function WindowTaperLab() {
  const [window, setWindow] = useState("rectangular"), [tone, setTone] = useState(5.5), s = useMemo(() => windowSpectrum(64, 256, window, tone), [window, tone]), other = useMemo(() => windowSpectrum(64, 256, window === "hann" ? "rectangular" : "hann", tone), [window, tone]);
  return <Figure id="taper" caption="Gold is the selected taper and its normalized transform; cyan dashed is the other taper. Their common frequency and amplitude scales preserve main-lobe and sidelobe comparisons. No zero is assumed for the sum of positive and negative real-tone contributions." controls={<Controls onReset={() => {
    setWindow("rectangular");
    setTone(5.5);
  }}><Choice label="Window taper" value={window} onChange={setWindow} options={[["rectangular", "Rectangular"], ["hann", "Periodic Hann"]]} /><Range label="Tone frequency" value={tone} onChange={setTone} min={3} max={9} step={0.125} display={`${fmt(tone)} Hz`} /></Controls>}><WindowDrawing state={s} compare={other} /></Figure>;
}
function SpectralNormalizationLab() {
  const [f, setF] = useState(5.5), [tone, setTone] = useState(5.5), s = useMemo(() => windowSpectrum(64, 256, "hann", tone), [tone]);
  let z = [0, 0];
  s.weighted.forEach((x, n) => {
    z[0] += x * Math.cos(TAU * f * n / 64);
    z[1] -= x * Math.sin(TAU * f * n / 64);
  });
  const factor = f === 0 ? 1 : 2, amplitude = factor * Math.hypot(...z) / s.weightSum, density = factor * (z[0] ** 2 + z[1] ** 2) / (64 * s.weightSquares), onGrid = Math.abs(f / 0.25 - Math.round(f / 0.25)) < 1e-10;
  return <Figure id="normalization" caption="Selected amplitude divides magnitude by coherent gain Σw. Density divides squared magnitude by fsΣw² and merges the real-data pair once. The complete FFT-grid density integral equals weighted mean square; an off-grid inspection is a direct finite-transform evaluation." controls={<Controls onReset={() => {
    setF(5.5);
    setTone(5.5);
  }}><Range label="Inspected frequency" value={f} onChange={setF} min={0} max={12} step={0.125} display={`${fmt(f)} Hz`} /><Range label="Tone frequency" value={tone} onChange={setTone} min={3} max={9} step={0.125} display={`${fmt(tone)} Hz`} /></Controls>}><WindowDrawing state={s} /><Plane label="Current weighted complex sum" extent={Math.max(1, s.weightSum * 1.1)} unitLabel="weighted coefficient (V)" vectors={[{ end: z }]} /><Ledger items={[[`${f} Hz inspection`, onGrid ? "stored FFT bin" : "off-grid DTFT evaluation"], ["weighted complex sum (V)", ctext(z)], ["normalized amplitude (V)", fmt(amplitude)], ["one-sided density (V\xB2/Hz)", fmt(density)], ["weighted mean square (V\xB2)", fmt(s.weightedMeanSquare)], ["complete-grid density integral (V\xB2)", fmt(s.densityIntegral)]]} /></Figure>;
}
function ConvolutionBoundaryLab() {
  const [circular, setCircular] = useState(false), [index, setIndex] = useState(0), s = convolutionState([1, 2, 0, -1], [1, 1], circular, index);
  function boundary(v) {
    setCircular(v === "circular");
    if (v === "circular" && index === 4) setIndex(3);
  }
  return <Figure id="convolution" caption="Gold stems are input values, cyan the reversed shifted kernel and rose their products at matching source indices. The selected sum is the selected output. Circular indexing visibly wraps contributing kernel indices; changing boundary clamps index 4 to 3 when needed." controls={<Controls onReset={() => {
    setCircular(false);
    setIndex(0);
  }}><Choice label="Boundary" value={circular ? "circular" : "linear"} onChange={boundary} options={[["linear", "Linear support"], ["circular", "Circular length 4"]]} /><Range label="Output index n" value={index} onChange={setIndex} min={0} max={circular ? 3 : 4} /></Controls>}><Compare><Plot label="Actual source and shifted kernel values" xRange={[-0.5, 3.5]} yRange={[-1.5, 3.5]} xLabel="source j" yLabel="value" stems={[{ points: s.terms.map((t) => [t.index, t.value]) }, { points: s.terms.map((t) => [t.index, t.weight]), tone: "blue" }]} /><Plot label="Actual products and selected output" xRange={[-0.5, 4.5]} yRange={[-1.5, 3.5]} xLabel="index j / n" yLabel="product / sum" stems={[{ points: s.terms.map((t) => [t.index, t.product]), tone: "rose" }]} dots={[{ x: index, y: s.output[index], r: 6 }]} /></Compare>{circular && <Scene label="Actual wrap routes of contributing indices" height={120}>{s.terms.filter((t) => t.wraps).map((t, i) => <g key={t.index}><Arrow a={[50 + 70 * t.index, 35]} b={[50 + 70 * t.kernelIndex, 75]} tone="blue" /><Label x={50 + 70 * t.index} y="23">j={t.index}</Label><Label x={50 + 70 * t.kernelIndex} y="100">h[{t.kernelIndex}]</Label></g>)}</Scene>}<Table label="Actual products and wrap indices" headers={["j", "h index", "x[j]", "h[n\u2212j]", "product", "wrap"]} rows={s.terms.map((t) => [t.index, t.kernelIndex, t.value, t.weight, t.product, t.wraps ? "yes" : "no"])} /><Ledger items={[[`y[${index}]`, fmt(s.output[index])], ["complete output", s.output.join(", ")]]} /></Figure>;
}
function FrequencyResponseLab() {
  const [a, setA] = useState(TAU), [phase, setPhase] = useState(Math.PI / 2), s = filterResponse(a, phase);
  return <Figure id="response" caption="H(iω)=a/(a+iω). Gold and cyan keep the 1 Hz and 3 Hz identities. The denominator triangles determine both gain and lag; the rose output is the steady particular solution and contains no initial-state correction." controls={<Controls onReset={() => {
    setA(TAU);
    setPhase(Math.PI / 2);
  }}><Range label="Filter rate a" value={a} onChange={setA} min={0.5} max={20} step="any" display={`${fmt(a)} s\u207B\xB9`} /><Range label="Third-tone input phase" value={phase} onChange={setPhase} min={-Math.PI} max={Math.PI} step={Math.PI / 12} display={`${fmt(phase / Math.PI)}\u03C0 rad`} /></Controls>}><Compare>{s.modes.map((m, i) => <Plane key={m.frequency} label={`${m.frequency} Hz denominator a+i\u03C9`} extent={21} unitLabel="s⁻¹" vectors={[{ end: [a, 0], tone: i ? "blue" : "gold" }, { start: [a, 0], end: [a, TAU * m.frequency], tone: i ? "blue" : "gold" }, { end: [a, TAU * m.frequency], tone: "rose" }]} />)}</Compare><Compare>{s.modes.map((m, i) => {
    const input = unit(m.phase).map((v) => v * m.amplitude / 2), output = multiplyComplex(input, unit(m.lag).map((v) => v * m.gain));
    return <div key={m.frequency}><Plane label={`${m.frequency} Hz input coefficient and H times coefficient`} extent={1.4} unitLabel="V" vectors={[{ end: input, tone: i ? "blue" : "gold" }, { end: output, tone: "rose" }]} /><p>Input c={ctext(input)} V; output Hc={ctext(output)} V.</p></div>;
  })}</Compare><Plot label="Gain with selected 1 Hz and 3 Hz markers" xRange={[0, 4]} yRange={[0, 1.1]} xLabel="frequency (Hz)" yLabel="gain (dimensionless)" lines={[{ points: values((f) => a / Math.hypot(a, TAU * f), 0, 4) }]} dots={s.modes.map((m, i) => ({ x: m.frequency, y: m.gain, tone: i ? "blue" : "gold" }))} /><Plot label="Phase lag" xRange={[0, 4]} yRange={[-Math.PI / 2, 0]} xLabel="frequency (Hz)" yLabel="lag (rad)" lines={[{ points: values((f) => -Math.atan2(TAU * f, a), 0, 4) }]} /><Plot label="Input gold and steady output rose" xRange={[0, 2]} yRange={[-3, 3]} xLabel="time (s)" yLabel="signal (V)" lines={[{ points: s.points.map((p) => [p.time, p.input]) }, { points: s.points.map((p) => [p.time, p.steady]), tone: "rose" }]} /><Ledger items={[["corner frequency (Hz)", fmt(a / TAU)], ...s.modes.map((m) => [`${m.frequency} Hz gain / lag`, `${fmt(m.gain)} / ${fmt(m.lag)} rad`])]} /></Figure>;
}
function StartupResponseLab() {
  const [initial, setInitial] = useState(0), [index, setIndex] = useState(0);
  return <Figure id="startup" caption="Changing y₀ changes only the homogeneous correction. Steady, correction and total share one fixed ordinate scale, and the total at t=0 always equals y₀." controls={<Controls onReset={() => {
    setInitial(0);
    setIndex(0);
  }}><Range label="Initial output y₀" value={initial} onChange={setInitial} min={-3} max={3} step={0.25} display={`${fmt(initial)} V`} /><Range label="Time cursor index" value={index} onChange={setIndex} min={0} max={512} display={`${fmt(index / 256)} s`} /></Controls>}><StartupDrawing initial={initial} time={index / 256} /></Figure>;
}
function LaplaceRegionLab() {
  const [side, setSide] = useState("right"), [sigma, setSigma] = useState(0), s = laplaceRegion(1, sigma, 1, 2, side);
  return <Figure id="roc" caption="Shading is the open region of absolute convergence for the selected support. The pole is × at −1. A finite supported integral exists even when its infinite limit fails; the rational expression alone does not identify the signal." controls={<Controls onReset={() => {
    setSide("right");
    setSigma(0);
  }}><Choice label="Signal support" value={side} onChange={setSide} options={[["right", "Right: exp(\u2212t), t\u22650"], ["left", "Left: \u2212exp(\u2212t), t\u22640"]]} /><Range label="Real part σ" value={sigma} onChange={setSigma} min={-3} max={3} step={0.25} display={`${fmt(sigma)} s\u207B\xB9`} /></Controls>}><Compare><Plot label="Supported original signal; no values joined across support edge" xRange={[-2, 2]} yRange={[-8, 2]} xLabel="time (s)" yLabel="dimensionless x(t)" lines={[{ points: side === "right" ? values((t) => Math.exp(-t), 0, 2) : values((t) => -Math.exp(-t), -2, 0) }, { points: side === "right" ? [[-2, 0], [-1e-8, 0]] : [[1e-8, 0], [2, 0]], tone: "blue" }]} /><RocDrawing side={side} sigma={sigma} omega={1} /></Compare><Ledger items={[[`finite integral over ${side === "right" ? "[0,2]" : "[\u22122,0]"} s`, `${ctext(s.value)} s`], ["rational 1/(s+1)", `${ctext(s.rational)} s`], ["absolute infinite integral", s.converges ? "converges in this open ROC" : s.boundary ? "boundary excluded" : "outside ROC: does not converge"]]} /></Figure>;
}
function LaplaceHorizonLab() {
  const [sigma, setSigma] = useState(0), [omega, setOmega] = useState(1), [T, setT] = useState(2), s = laplaceRegion(1, sigma, omega, T, "right"), pts = values((t) => t, 0, 8).map(([t]) => [t, finiteExponentialIntegral(1 + sigma, omega, t)]), cross = pts.filter(([, z]) => Math.max(...z.map(Math.abs)) > 4);
  return <Figure id="horizon" caption="The main ordinate is sign(I)log₁₀(1+|I|/(1 s)), a display transform of the integral. The linear inset has fixed range ±4 s; markers at its boundaries flag out-of-range values. Neither scale changes with the controls. The ledger gives actual untransformed values." controls={<Controls onReset={() => {
    setSigma(0);
    setOmega(1);
    setT(2);
  }}><Range label="Real part σ" value={sigma} onChange={setSigma} min={-3} max={3} step={0.25} display={`${fmt(sigma)} s\u207B\xB9`} /><Range label="Angular frequency ω" value={omega} onChange={setOmega} min={-4} max={4} step={0.25} display={`${fmt(omega)} rad/s`} /><Range label="Finite horizon T" value={T} onChange={setT} min={0.25} max={8} step={0.25} display={`${fmt(T)} s`} /></Controls>}><Plot label="Whole-range signed-log real gold / imaginary cyan accumulation" xRange={[0, 8]} yRange={[-7, 7]} xLabel="horizon (s)" yLabel="signed-log ordinate" cursor={T} lines={[{ points: pts.map(([t, z]) => [t, signedLog(z[0])]) }, { points: pts.map(([t, z]) => [t, signedLog(z[1])]), tone: "blue", dashed: true }]} /><Plot label="Fixed linear inset; clipped portions marked at boundary" xRange={[0, 8]} yRange={[-4, 4]} xLabel="horizon (s)" yLabel="integral (s)" cursor={T} lines={[{ points: pts.map(([t, z]) => [t, z[0]]) }, { points: pts.map(([t, z]) => [t, z[1]]), tone: "blue", dashed: true }]} dots={cross.filter((_, i) => i % 8 === 0).flatMap(([t, z]) => z.map((v, i) => ({ x: t, y: Math.max(-3.9, Math.min(3.9, v)), tone: i ? "blue" : "gold", open: true })))} /><Ledger items={[[`finite at T=${fmt(T)} s`, `${ctext(s.value)} s`], ["rational reference", s.rational ? `${ctext(s.rational)} s` : "undefined at pole"], ["infinite right-sided integral", s.converges ? "converges" : s.boundary ? "boundary excluded: does not converge" : "does not converge"]]} /><Table label="Actual finite horizon ladder" headers={["T (s)", "Re integral (s)", "Im integral (s)"]} rows={[1, 2, 4, 8].map((t) => [t, ...finiteExponentialIntegral(1 + sigma, omega, t).map((v) => fmt(v))])} /></Figure>;
}
export {
  CoefficientFixtureLab,
  ComplexArithmeticLab,
  ConjugateEditingLab,
  ConvolutionBoundaryLab,
  FiniteFourierLab,
  FourierConvergenceLab,
  FrequencyResponseLab,
  HarmonicProjectionLab,
  LaplaceHorizonLab,
  LaplaceRegionLab,
  ObservationPaddingLab,
  PhasorSynthesisLab,
  SamplingAliasLab,
  SpectralNormalizationLab,
  StartupResponseLab,
  WindowTaperLab
};

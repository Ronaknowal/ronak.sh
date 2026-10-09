import React, { useState } from 'react';
import { Figure, Panels, Matrix, Bars, Plot, Point, Curve, Controls, Range, Result, colors } from './Drawing.jsx';
import { X0, H0, W0, onesW, matmul, transpose, muSweep, halfLoss, divergence, gamma, signPair, fmt } from './nmf-model.js';
export function Ratio() {
  const s = muSweep(X0, onesW, H0);
  return <Figure id="D24" caption="Each elementwise ratio multiplies the old H cell. The selected C0/F2 cell is1×9/6=1.5; an old zero remains zero. No matrix inverse is involved."><Panels><Matrix label="Old H" values={H0} rows={['C0', 'C1']} componentRows selected={[0, 2]} /><Matrix label="Numerator Wᵀ X" values={s.hn} rows={['C0', 'C1']} selected={[0, 2]} /><Matrix label="Denominator Wᵀ W H" values={s.hd} rows={['C0', 'C1']} selected={[0, 2]} /><Matrix label="New H" values={s.h} rows={['C0', 'C1']} componentRows selected={[0, 2]} /></Panels></Figure>;
}
export function HistoricalMU() {
  const [step, setStep] = useState(0),
    x = [[2, 1, 3], [1, 2, 3], [3, 3, 6]],
    w0 = [[1, .5], [.5, 1], [1, 1]],
    h0 = [[1, .2, .8], [.2, 1, .8]],
    s = muSweep(x, w0, h0),
    w = step < 2 ? w0 : s.w,
    h = step === 0 ? h0 : s.h;
  return <Figure id="D25" caption="This direct one-step calculation uses the original supplied operands. H updates first; its new values feed W's Gram/cross products. It does not rerun the preserved forty-sweep program."><Panels><Matrix label={step < 2 ? 'Original W' : 'New W from new H'} values={w} columns={['C0', 'C1']} componentColumns /><Matrix label={step === 0 ? 'Original H' : 'New H · W block operand'} values={h} rows={['C0', 'C1']} componentRows /><Matrix label="Current prediction" values={matmul(w, h)} />{step > 0 && <><Matrix label="New H Hᵀ · W denominator cache" values={matmul(s.h, transpose(s.h))} rows={['C0', 'C1']} columns={['C0', 'C1']} /><Matrix label="X new Hᵀ · W numerator" values={s.wn} columns={['C0', 'C1']} /></>}</Panels><Controls onReset={() => setStep(0)}><button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button><button disabled={step === 2} onClick={() => setStep(step + 1)}>Step</button></Controls><Result>{['Initial supplied factors', 'H-first update complete', 'W update using new H complete'][step]}; half-loss {fmt(halfLoss(x, matmul(w, h)))}. Original rounded endpoints17.06 → .03944744.</Result></Figure>;
}
export function ZeroLock() {
  const [w, setW] = useState(0),
    mu = 2 * w / (w + 1);
  return <Figure id="D26" caption="The denominator w+1 is positive throughout. At exact zero, multiplication cannot enter an improving direction; a coordinate update can."><Panels><Bars label="Starting amount and both updated amounts" values={[w, mu, 1]} ids={['Start', 'MU', 'CD']} max={1} /><Matrix label="Actual predictions, losses and gradients" columns={['Prediction', 'Half-loss', 'Gradient']} rows={['Start', 'MU', 'CD']} values={[[w + 1, (1 - w) ** 2 / 2, w - 1], [mu + 1, (1 - mu) ** 2 / 2, mu - 1], [2, 0, 0]]} signed /></Panels><Controls onReset={() => setW(0)}><Range label="Starting amount; other contribution fixed1" value={w} onChange={setW} max={1} step={.05} /></Controls><Result>MU {fmt(w)}×2/({fmt(w)}+1)={fmt(mu)}; coordinate result1. {w === 0 ? 'Zero is unchanged despite gradient−1.' : w === 1 ? 'Both routes remain at the optimum.' : 'Both updates are shown from the same starting amount.'}</Result></Figure>;
}
export function Counts() {
  const [x, setX] = useState(4);
  return <Figure id="D27" caption="Two positive contributions predict a fixed count rate2. Their fractional ownership1/2 allocates the observed count; these fractions are explanatory allocations, not class posteriors."><Panels><Bars label="Fixed component rates" values={[1, 1]} ids={['C0', 'C1']} component max={6} /><Bars label="Allocated observed counts" values={[x / 2, x / 2]} ids={['C0', 'C1']} component max={6} /><Bars label="Observed count and unchanged rate" values={[x, 2]} ids={['Count', 'Rate']} max={6} /></Panels><Controls onReset={() => setX(4)}><Range label="Integer observed count" value={x} onChange={setX} max={6} step={1} /></Controls><Result>Count {x}, rate2, ratio {fmt(x / 2)}, allocations [{fmt(x / 2)},{fmt(x / 2)}]. Generalized KL {fmt(divergence(x, 2, 1))}; count0 gives zero allocations and KL2.</Result></Figure>;
}
export function Majorizer() {
  const [a, setA] = useState(1),
    f = z => (z - 2) ** 2,
    q = z => (a - 2) ** 2 + (2 * a - 4) * (z - a) + .5 * (2 + 1 / a) * (z - a) ** 2,
    z = 5 * a / (2 * a + 1);
  return <Figure id="D28" caption="The two exact curves touch at a. Their difference (z−a)²/(2a) is nonnegative; minimizing the upper curve gives a safe restricted-coordinate step, rather than a universal beta proof."><Plot label="Touching objective and auxiliary" xmax={3} ymax={18} xlabel="candidate z" ylabel="cost">{map => <><Curve map={map} xmax={3} fn={f} /><Curve map={map} xmax={3} fn={q} color={colors[1]} /><Point at={map([a, f(a)])} label="touch" open /><Point at={map([z, q(z)])} color={colors[1]} /><Point at={map([z, f(z)])} diamond open color="#f2c276" /></>}</Plot><Controls onReset={() => setA(1)}><Range label="Current positive coordinate a" value={a} onChange={setA} min={.25} max={2} step={.25} /></Controls><Result>Blue f, rose q; blue open circle is the touching point, rose circle is q minimum, amber diamond is the resulting f value. At a2 all three coincide at the fixed point. New z={fmt(z)}; f(new)={fmt(f(z))} ≤ q(new)={fmt(q(z))} ≤ q(a)=f(a)={fmt(f(a))}. Gap at new {fmt(q(z) - f(z))}.</Result></Figure>;
}
export function PSD() {
  const [d0, setD0] = useState(1),
    [d1, setD1] = useState(0),
    side = Math.abs(d0 - d1);
  return <Figure id="D29" caption="The diagonal auxiliary difference is PSD because Δᵀ[[1,−1],[−1,1]]Δ=(Δ0−Δ1)². The square displays its actual nonnegative area; the objective auxiliary includes the additional factor1/2."><Panels><Matrix label="G" values={[[2, 1], [1, 2]]} rows={['C0', 'C1']} columns={['C0', 'C1']} /><Matrix label="3I − G" values={[[1, -1], [-1, 1]]} signed rows={['C0', 'C1']} columns={['C0', 'C1']} /><div className="nmf-plot"><p className="nmf-object-label">Square side |Δ0−Δ1|</p><svg viewBox="0 0 300 250" role="img" aria-label={`Square side${fmt(side)}, area${fmt(side * side)}`}><rect x="40" y={220 - side * 90} width={side * 90} height={side * 90} fill={colors[0]} opacity=".55" /><path d="M40 30V220H230" stroke="currentColor" fill="none" /><text x="45" y="245">0 ≤ side ≤ 2</text></svg></div></Panels><Controls onReset={() => {
      setD0(1);
      setD1(0);
    }}><Range label="Increment Δ0" value={d0} onChange={setD0} min={-1} max={1} /><Range label="Increment Δ1" value={d1} onChange={setD1} min={-1} max={1} /></Controls><Result>Increment [{fmt(d0)},{fmt(d1)}], side {fmt(side)}, quadratic area {fmt(side * side)}. Equal increments give area0.</Result></Figure>;
}
export function BetaPower() {
  const [b, setB] = useState(0),
    g = gamma(b),
    next = 4 ** g;
  return <Figure id="D30" caption="The positive ratio4 is deliberately fixed to isolate the MM power. A beta-dependent exponent changes the step; the exponent-one heuristic agrees only on beta∈[1,2]. The persistent Jensen and tangent insets expose their separate assumptions."><Panels><Bars label="Updated coordinate · old coordinate1" values={[4, next]} ids={['Heuristic', 'MM']} max={4} /><Plot label="Convex t² · Jensen chord" xmax={6} ymax={36} xlabel="t" ylabel="φ(t)">{map => <><Curve map={map} xmax={6} fn={t => t * t} /><path d={`M${map([2, 4]).join(' ')}L${map([6, 36]).join(' ')}`} stroke={colors[1]} strokeWidth="2" /><Point at={map([5, 25])} label="φ(mean)" /><Point at={map([5, 28])} label="chord" color={colors[1]} /></>}</Plot><Plot label="Concave log · tangent at4" xmin={1} xmax={6} ymin={0} ymax={2} xlabel="t" ylabel="log(t)">{map => <><Curve map={map} xmin={1} xmax={6} fn={Math.log} /><Curve map={map} xmin={1} xmax={6} fn={t => Math.log(4) + (t - 4) / 4} color={colors[1]} /></>}</Plot></Panels><Controls onReset={() => setB(0)}><Range label="Beta" value={b} onChange={setB} max={3} step={.1} /></Controls><Result>gamma={fmt(g)}, MM1×4^gamma={fmt(next)} versus heuristic4. Jensen shares.25/.75: mean5, φ(mean)25, weighted heights28, gap3. Log tangent is an upper bound.</Result></Figure>;
}
export function Centering() {
  return <Figure id="D31" caption="Subtracting means[1,2,3] introduces signed entries. NMF initialization uses the uncentred nonnegative input, rather than silently importing PCA's centred fitted model."><Panels><Matrix label="Original X0" values={X0} /><Matrix label="Column means" values={[[1, 2, 3]]} rows={['Mean']} /><Matrix label="X0 − means · signed" values={[[1, -1, 0], [0, 1, 1], [-1, 0, -1]]} signed /></Panels></Figure>;
}
export function SignedTriplet() {
  return <Figure id="D32" caption="The known supplied Xt has a signed second singular term. Its positive part has two disjoint support rectangles; retaining one positive rank-one rectangle requires a paired-sign choice."><Panels><Matrix label="Xt · known supplied matrix" values={[[8.2, 2.4], [2.4, 6.8]]} max={10} /><Matrix label="First term · σ10 u=v[.8,.6]" values={[[6.4, 4.8], [4.8, 3.6]]} max={10} /><Matrix label="Second term · σ5 u=v[.6,−.8]" values={[[1.8, -2.4], [-2.4, 3.2]]} signed max={4} /><Matrix label="Positive part · two diagonal rectangles" values={[[1.8, 0], [0, 3.2]]} /></Panels></Figure>;
}
export function PairedSigns() {
  const [a, setA] = useState(.6),
    s = signPair(a);
  return <Figure id="D33" caption="Compare the products of paired sign-part norms before selecting and normalizing. Both candidates stay visible. Editing u gives a supplied triplet illustration, not another SVD of the original Xt."><Panels><Matrix label="Current supplied singular vectors" values={[s.u, s.v]} rows={['u', 'v']} columns={['entry0', 'entry1']} signed max={1} /><Matrix label="Positive-pair candidate · σ5" values={[[5 * s.positive, 0], [0, 0]]} /><Matrix label="Negative-pair candidate · σ5" values={[[0, 0], [0, 5 * s.negative]]} /><Matrix label="Selected nonnegative rank-one term" values={s.term} /></Panels><Controls onReset={() => setA(.6)}><Range label="u positive entry a" value={a} onChange={setA} max={1} step={.1} /></Controls><Result>Norm products positive {fmt(s.positive)}, negative {fmt(s.negative)}; {s.choosePositive ? 'positive' : 'negative'} pair selected. At a.8 the declared positive-pair tie applies. Zero-norm endpoints are never divided.</Result></Figure>;
}
export function FilledZeros() {
  const [d, setD] = useState(0),
    x = [[8.2, 2.4], [2.4, 6.8]],
    original = [[.8 * Math.sqrt(10), 0], [.6 * Math.sqrt(10), 4 / Math.sqrt(5)]],
    w = original.map(r => r.map(v => v === 0 ? d : v)),
    h = transpose(w),
    s = muSweep(x, w, h);
  return <Figure id="D34" caption="Only the original zeros receive δ. Filled and unfilled factors, initial product and one complete H-first/new-H W result remain visible. This edit is not guaranteed to improve the fit; the matrix mean4.95 is a separate nndsvda value outside the live range."><Panels><Matrix label="Unfilled W · H=Wᵀ" values={original} /><Matrix label="Filled initial W" values={w} /><Matrix label="Filled initial H" values={h} /><Matrix label="One-step new W" values={s.w} /><Matrix label="One-step new H" values={s.h} /><Matrix label="Initial / updated predictions" values={[...matmul(w, h), ...matmul(s.w, s.h)]} rows={['Initial R0', 'Initial R1', 'Updated R0', 'Updated R1']} max={12} /></Panels><Controls onReset={() => setD(0)}><Range label="Fill original zeros δ" value={d} onChange={setD} max={2} step={.1} /></Controls><Result>Initial half-loss {fmt(halfLoss(x, matmul(w, h)))}; after one complete update {fmt(halfLoss(x, matmul(s.w, s.h)))}. New H[1,0]={fmt(s.h[1][0])}, W[0,1]={fmt(s.w[0][1])}.</Result></Figure>;
}
export function PublicAnatomy() {
  return <Figure id="D35" caption="The numerical lane is a supplied hand decomposition, not invented sklearn factors. Public fit_transform learns new arrays; later transform uses its fitted dictionary. The shown query calculation explicitly uses supplied H0."><Panels><Matrix label="Hand X0 · 3×3" values={X0} /><Matrix label="Hand W · 3×2" values={W0} columns={['C0', 'C1']} /><Matrix label="Hand H0 · 2×3" values={H0} rows={['C0', 'C1']} /><Matrix label="Public fit_transform learned W · shape only" values={[["w00", "w01"], ["w10", "w11"], ["w20", "w21"]]} columns={['C0', 'C1']} /><Matrix label="Public components_ · shape only" values={[["h00", "h01", "h02"], ["h10", "h11", "h12"]]} rows={['C0', 'C1']} /><Matrix label="Supplied query → transform amounts" values={[[1.5, .5, 2], [1.5, .5, '—']]} rows={['Query F0/F1/F2', 'New C0/C1 amounts']} /><Matrix label="Contributions → inverse_transform prediction" values={[[1.5, 0, 1.5], [0, .5, .5], [1.5, .5, 2]]} rows={['C0 addend', 'C1 addend', 'Prediction']} /></Panels><p>Refused: query feature order[F1,F0,F2] differs from fitted[F0,F1,F2]; query[−1,0,1] contains a negative value. Neither request changes the fitted state.</p></Figure>;
}
export function SameBlock() {
  const [a, setA] = useState(1),
    cd = [2, 2.5],
    mu = [5 * a / (2 * a + 1), 7 / (a + 2)],
    lanes = [['Cyclic CD', cd], ['Simultaneous MU', mu]];
  return <Figure id="D36" caption="Both routes start from[a,1] with fixed H0. CD sends its new C0=2 into C1=(7−2)/2; MU sends old operands into both denominators2a+1 and a+2. One block is not a stationary coupled solution."><Panels><Matrix label="Fixed G and p · component axes" values={[[2, 1], [1, 2], [5, 7]]} rows={['G C0', 'G C1', 'p R1']} columns={['C0', 'C1']} />{lanes.map(([name, w]) => {
        const pred = matmul([w], H0)[0],
          g = [2 * w[0] + w[1] - 5, w[0] + 2 * w[1] - 7];
        return <div key={name}><Matrix label={`${name} amounts and addends`} values={[[...w, '—'], [w[0], 0, w[0]], [0, w[1], w[1]], pred, [1 - pred[0], 3 - pred[1], 4 - pred[2]]]} rows={['C0/C1 amounts', 'C0 addend', 'C1 addend', 'Prediction', 'Residual']} signed /><p>Half-loss {fmt(halfLoss([[1, 3, 4]], [pred]))}; gradient [{g.map(fmt).join(', ')}]; PG² {fmt(g[0] ** 2 + g[1] ** 2)}.</p></div>;
      })}</Panels><Controls onReset={() => setA(1)}><Range label="Initial C0 amount; initial C1=1" value={a} onChange={setA} min={.5} max={2} /></Controls><Result>Start [{fmt(a)},1]: CD loss.75; MU loss {fmt(halfLoss([[1, 3, 4]], matmul([mu], H0)))}. {halfLoss([[1, 3, 4]], matmul([mu], H0)) < .75 ? 'MU' : 'CD'} has lower loss at this selected block; neither has zero projected gradient.</Result></Figure>;
}
export function Publication() {
  return <Figure id="D37" caption="A complete fitted snapshot is published together only after supported validation and arithmetic succeed. Rejected candidates do not partially replace its H, features, fitted rank or diagnostics. Next-fit configuration and returned copies remain outside it."><Panels><Matrix label="Old fitted H0 · unchanged after refusal" values={H0} rows={['C0', 'C1']} /><Matrix label="Old ordered feature identities" values={[['F0', 'F1', 'F2']]} rows={['Order']} /><Matrix label="Old coherent fitted metadata slots" values={[[2, 'stored objective', 'stored stop reason']]} rows={['Fitted snapshot']} columns={['Fitted k', 'Diagnostic', 'Diagnostic']} /><Matrix label="Rejected negative candidate · stop before publication" values={[[-1, 0, 1]]} signed /><Matrix label="Other rejected candidates · separate examples" values={[['NaN', 0, 1], [1, 2, 'wrong width2']]} rows={['Nonfinite', 'Shape']} /><Matrix label="Valid new candidate · indexed values only" values={[['new h00', 'new h01', 'new h02'], ['new h10', 'new h11', 'new h12']]} rows={['new C0', 'new C1']} /><Matrix label="Old query reads old fitted k2 and H0" values={[[1.5, .5, 2], [1.5, .5, '—']]} rows={['Query', 'Two amounts']} /><Matrix label="Edited returned copy · no backward mutation" values={[[-99, 0, 1], [0, 1, 1]]} signed /></Panels><p>Next-fit configuration k1 cannot resize the old two-component query. Valid publication transfers H, ordered feature IDs, fitted k and diagnostics as one operation; it does not certify global optimality.</p></Figure>;
}
export function Penalty() {
  const [l, setL] = useState(0),
    w = Math.max(0, 2 - l),
    data = (2 - w) ** 2 / 2,
    paid = l * w;
  return <Figure id="D38" caption="A linear price moves the constrained optimum to max(0,2−λ), including the nonnegative boundary. The separate squared-price inset has λ1=0, λ2=1 and optimum1."><Panels><Plot label="Data + linear price = total" xmax={3} ymax={10} xlabel="amount w" ylabel="cost">{map => <><Curve map={map} xmax={3} fn={w => (2 - w) ** 2 / 2} /><Curve map={map} xmax={3} fn={w => l * w} color="#f2c276" /><Curve map={map} xmax={3} fn={w => (2 - w) ** 2 / 2 + l * w} color={colors[1]} /><Point at={map([w, data + paid])} label="best" color={colors[1]} /></>}</Plot><Plot label="Fixed squared price · .5w²" xmax={3} ymax={6} xlabel="amount w" ylabel="cost">{map => <><Curve map={map} xmax={3} fn={w => (2 - w) ** 2 / 2} /><Curve map={map} xmax={3} fn={w => w * w / 2} color="#f2c276" /><Curve map={map} xmax={3} fn={w => (2 - w) ** 2 / 2 + w * w / 2} color={colors[1]} /><Point at={map([1, 1])} label="best1" color={colors[1]} /></>}</Plot></Panels><Controls onReset={() => setL(0)}><Range label="Linear price λ" value={l} onChange={setL} max={3} /></Controls><Result>λ={fmt(l)}, best amount {fmt(w)}, data cost {fmt(data)}, price {fmt(paid)}, total {fmt(data + paid)}, total derivative {fmt(w - 2 + l)}. Blue data, amber price, rose total.</Result></Figure>;
}
export function ScalePenalty() {
  const [s, setS] = useState(1),
    w = W0.map(r => [r[0] / s, r[1]]),
    h = [H0[0].map(v => v * s), H0[1]],
    wm = 3 / s + 6,
    hm = 2 * s + 2;
  return <Figure id="D39" caption="The exact product stays X0, while dimension-scaled factor penalties change. With alphaW.1/alphaH.2,r1,n=d3, the prices are.3 per W unit and.6 per H unit. Zero alphas would cost0 at every scale."><Panels><Matrix label="Current compensated W" values={w} columns={['C0', 'C1']} componentColumns /><Matrix label="Current scaled H" values={h} rows={['C0', 'C1']} componentRows /><Matrix label="C0 contribution · invariant" color={colors[0]} values={W0.map(r => H0[0].map(v => v * r[0]))} /><Matrix label="C1 contribution · invariant" color={colors[1]} values={W0.map(r => H0[1].map(v => v * r[1]))} /><Matrix label="Same reconstructed X0" values={matmul(w, h)} /></Panels><Controls onReset={() => setS(1)}><Range label="C0 pattern scale s" value={s} onChange={setS} min={.5} max={3} /></Controls><Result>W mass {fmt(wm)} ×.3={fmt(.3 * wm)}; H mass {fmt(hm)} ×.6={fmt(.6 * hm)}; total penalty {fmt(.3 * wm + .6 * hm)}. Data half-loss0.</Result></Figure>;
}
export function MaskGram() {
  const [m, setM] = useState(1),
    root = Math.sqrt(m),
    g = [[1 + m, m], [m, 1 + m]],
    p = [[2 + 3 * m, 1 + 3 * m]];
  return <Figure id="D40" caption="Weights change the local Gram and cross product. F2 remains measured3 even when excluded from the objective. Square-root weighting produces the same G=AᵀA and p=Aᵀb; different masks require different caches."><Panels><Matrix label="Measured R0 · unchanged" values={[[2, 1, 3]]} /><Matrix label="Separate weights [1,1,m]" values={[[1, 1, m === 0 ? 'excluded' : m]]} /><Matrix label="Fixed H0" values={H0} rows={['C0', 'C1']} /><Matrix label="A = sqrt(weights) Hᵀ" values={[[1, 0], [0, 1], [root, root]]} rows={['F0', 'F1', 'F2']} columns={['C0', 'C1']} /><Matrix label="b = sqrt(weights) x" values={[[2], [1], [3 * root]]} rows={['F0', 'F1', 'F2']} columns={['Target']} /><Matrix label="Current local G" values={g} rows={['C0', 'C1']} columns={['C0', 'C1']} /><Matrix label="Current local p" values={p} columns={['C0', 'C1']} /><Matrix label="All-observed comparison G / p" values={[[2, 1], [1, 2], [5, 4]]} rows={['G C0', 'G C1', 'p']} columns={['C0', 'C1']} /><Matrix label="Second observation pattern · mask[1,0,0]" values={[[1, 0, 0]]} /><Matrix label="Second mask requires G=diag(1,0), p=[2,0]" values={[[1, 0], [0, 0], [2, 0]]} rows={['G C0', 'G C1', 'p']} columns={['C0', 'C1']} /></Panels><Controls onReset={() => setM(1)}><Range label="F2 observation weight m" value={m} onChange={setM} max={1} /></Controls><Result>m={fmt(m)}; offdiagonal contribution {fmt(m)}, each F2 cross contribution {fmt(3 * m)}. A third row [{fmt(root)},{fmt(root)}], target {fmt(3 * root)}. {m === 0 ? 'F2 is excluded.' : m === 1 ? 'All three cells observed equally.' : 'Fractional weighting differs from a binary observation mask.'}</Result></Figure>;
}
export function NoInformation() {
  return <Figure id="D41" caption="Identical placeholder values do not carry identical information. Missing quality0/0 is undefined; three measured zeros give MSE0/3=0. An unsupported dictionary column is a chosen convention, not estimated physical absence."><Panels><Matrix label="Missing lane · finite placeholders" values={[[0, 0, 0], ['not observed', 'not observed', 'not observed'], [0, 0, 0]]} rows={['Values', 'Mask0/0/0', 'Chosen prediction']} /><Matrix label="Measured-zero lane" values={[[0, 0, 0], [1, 1, 1], [0, 0, 0]]} rows={['Measured values', 'Mask', 'Prediction']} /><Matrix label="Both chosen amount rows" values={[[0, 0], [0, 0]]} rows={['Missing', 'Measured zero']} columns={['C0', 'C1']} /><Matrix label="Changed masks · F2 entirely unsupported" values={[[0, 0, 0], [1, 1, 0]]} /><Matrix label="Column support flags / chosen H column" values={[[true, true, false], [0, 0, 'chosen F2 column0']]} rows={['Supported?', 'H F2=[0,0]']} /></Panels><p>Missing included numerator0, denominator0: unknown predictive quality. Measured-zero numerator0, denominator3: observed-cell MSE0.</p></Figure>;
}

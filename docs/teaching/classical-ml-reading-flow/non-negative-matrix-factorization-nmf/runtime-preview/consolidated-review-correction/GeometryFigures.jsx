import React, { useState } from 'react';
import { Figure, Panels, Matrix, Bars, Plot, Point, Arrow, Curve, Controls, Range, Result, colors, Table } from './Drawing.jsx';
import { X0, H0, W0, onesW, matmul, transpose, coordinateBlock, cdSweep, halfLoss, coneQuery, shear, fmt } from './nmf-model.js';
import {Operation,Port,DotProduct} from './Operations.jsx';
export function Shear() {
  const [t, setT] = useState(.5),
    s = shear(t);
  return <Figure id="D07" caption="This separate supplied dictionary Hs permits a shear beyond scale or permutation. The plot shows its F0/F1 projection; the complete three-feature cells retain F2."><Panels><Matrix label="Original Hs" values={[[1, 1, 1], [0, 1, 1]]} rows={['C0', 'C1']} componentRows /><Matrix label="Changed Hs" values={s.h} rows={['C0', 'C1']} componentRows /><Matrix label="Changed amounts" values={s.w} columns={['C0', 'C1']} componentColumns /><Matrix label="Both products" values={[[2, 3, 3], ...matmul(s.w, s.h)]} rows={['Before', 'After']} /><Plot label="Pattern direction changes · projected rays" xmax={2} ymax={2}>{map => <><Arrow from={map([0, 0])} to={map([1, 1])} dashed /><Arrow from={map([0, 0])} to={map([1, 1 - t])} /><Arrow from={map([0, 0])} to={map([0, 1])} color={colors[1]} /><Point at={map([1, 1 - t])} label="C0" /><Point at={map([0, 1])} label="C1" color={colors[1]} /></>}</Plot></Panels><Controls onReset={() => setT(.5)}><Range label="Feasible shear t" value={t} onChange={setT} max={1} step={.1} /></Controls><Result>t={fmt(t)}; amounts [2,{fmt(1 + 2 * t)}] still reconstruct [2,3,3]. At t0 the original factors return; at t1 the edited pattern zeros remain valid.</Result></Figure>;
}
function ConePicture({
  u,
  v
}) {
  const q = coneQuery(u, v);
  return <Plot label="Fixed Hc · attainable cone and query" xmax={2} ymax={2}>{map => <><polygon points={[[0, 0], [2, 0], [2, 2]].map(p => map(p).join(',')).join(' ')} fill={colors[0]} opacity=".1" /><Arrow from={map([0, 0])} to={map([1.7, 0])} /><Arrow from={map([0, 0])} to={map([1.7, 1.7])} color={colors[1]} /><Arrow from={map(q.prediction)} to={map([u, v])} color="#f2c276" dashed /><Point at={map(q.prediction)} label={q.prediction[0] === u && q.prediction[1] === v ? undefined : "fit"} color={colors[1]} /><Point at={map([u, v])} label={q.prediction[0] === u && q.prediction[1] === v ? "q = fit" : "q"} diamond open color="#f2c276" /></>}</Plot>;
}
export function Cone({
  id = 'D13',
  frozen = false
}) {
  const [u, setU] = useState(frozen ? 0 : 1),
    [v, setV] = useState(frozen ? 1 : .5),
    q = coneQuery(u, v);
  return <Figure id={id} caption={frozen ? 'A query uses the stored feature order and fixed dictionary; only its new amounts change. Wrong shape or feature order is refused rather than refitting H.' : 'Nonnegative combinations of Hc rows fill the shaded cone, including its boundary and origin. Outside queries project onto a feasible ray.'}><Panels><Matrix label="Stored Hc · fixed F0/F1 order" values={[[1, 0], [1, 1]]} rows={['C0', 'C1']} componentRows /><ConePicture u={u} v={v} /><Matrix label="Query → new amounts → prediction" values={[[u, v], q.w, q.prediction]} rows={['Query', 'C0/C1 amounts', 'Prediction']} /></Panels><Controls onReset={() => {
      setU(frozen ? 0 : 1);
      setV(frozen ? 1 : .5);
    }}><Range label="Query F0" value={u} onChange={setU} max={2} /><Range label="Query F1" value={v} onChange={setV} max={2} /></Controls><Result>Amounts [{q.w.map(fmt).join(', ')}]; prediction [{q.prediction.map(fmt).join(', ')}]; half-loss {fmt(halfLoss([[u, v]], [q.prediction]))}. Hc is unchanged.</Result></Figure>;
}
export function ClipFailure() {
  return <Figure id="D14" caption="Clipping the unconstrained coefficients does not reoptimize the remaining positive coordinate. The clipped free-coordinate gradient1 becomes0 at the NNLS solution."><Panels><Plot label="Amount plane · feasible first quadrant" xmin={-1.5} xmax={1.5} ymax={1.5} xlabel="C0 amount" ylabel="C1 amount" equalUnits>{map => <><polygon points={[[0, 0], [1.5, 0], [1.5, 1.5], [0, 1.5]].map(p => map(p).join(',')).join(' ')} fill={colors[0]} opacity=".1" /><Point at={map([-1, 1])} label="LS" open /><Point at={map([0, 1])} label="clip" color={colors[1]} /><Point at={map([0, .5])} label="NNLS" color="#f2c276" /></>}</Plot><Plot label="Observation plane · three predictions" xmax={1.5} ymax={1.5}>{map => <><Point at={map([0, 1])} label="q / LS" open /><Point at={map([1, 1])} label="clip" color={colors[1]} /><Point at={map([.5, .5])} label="NNLS" color="#f2c276" /></>}</Plot></Panels><Matrix label="Amounts / reconstructed cells / half-loss" rows={['Unconstrained', 'Clipped', 'NNLS']} columns={['C0', 'C1', 'F0', 'F1', 'Loss']} values={[[-1, 1, 0, 1, 0], [0, 1, 1, 1, .5], [0, .5, .5, .5, .25]]} signed /></Figure>;
}
export function CoordinateSlice() {
  const [a, setA] = useState(1),
    prediction = [a, 1, a + 1];
  return <Figure id="D16" caption="Only C0 changes; C1 remains1. Its exact convex slice L(a)=a²−4a+7 has minimum a2 and loss3. This is one coordinate, not a complete solved fit."><Panels><Bars label="R1 minus current prediction" values={[1 - a, 2, 3 - a]} signed max={3} /><Plot label="Coordinate half-loss" xmax={3} ymax={7} xlabel="C0 amount a" ylabel="half-loss">{map => <><Curve map={map} xmax={3} fn={a => a * a - 4 * a + 7} /><Point at={map([a, a * a - 4 * a + 7])} label={a === 2 ? "now / min" : "now"} color={colors[1]} />{a !== 2 && <Point at={map([2, 3])} label="min" />}</>}</Plot></Panels><Controls onReset={() => setA(1)}><Range label="C0 amount; C1 fixed1" value={a} onChange={setA} max={3} /></Controls><Result>Prediction [{prediction.map(fmt).join(', ')}]; half-loss {fmt(a * a - 4 * a + 7)}; coordinate slope {fmt(2 * a - 4)}.</Result></Figure>;
}
export function Caches() {
  return <Figure id="D17" caption="G contracts feature bins into component pairs, while P contracts each observed row with each pattern. G01=1×0+0×1+1×1=1; P[R1,C1]=1×0+3×1+4×1=7."><Operation label="Build the Gram cache from two pattern operands"><Matrix label="H · component × feature" values={H0} rows={['C0','C1']} componentRows selectedCells={[[0,0],[0,1],[0,2]]} /><Port label="contract F0/F1/F2" symbol="×" /><Matrix label="Hᵀ · feature × component" values={transpose(H0)} rows={['F0','F1','F2']} columns={['C0','C1']} componentColumns selectedCells={[[0,1],[1,1],[2,1]]} /><Port label="sum feature paths" /><Matrix label="G = H Hᵀ" values={matmul(H0,transpose(H0))} rows={['C0','C1']} columns={['C0','C1']} selected={[0,1]} /></Operation><DotProduct left={H0[0]} right={H0[1]} ids={['F0','F1','F2']} leftLabel="H[C0,f]" rightLabel="H[C1,f]" resultLabel="Selected Gram entry G[C0,C1]" /><Operation label="Build the cross cache from an observation and a pattern"><Matrix label="X0 · select R1" values={X0} selectedCells={[[1,0],[1,1],[1,2]]} /><Port label="same feature order" symbol="×" /><Matrix label="Hᵀ · select C1" values={transpose(H0)} rows={['F0','F1','F2']} columns={['C0','C1']} componentColumns selectedCells={[[0,1],[1,1],[2,1]]} /><Port label="sum feature paths" /><Matrix label="P = X0 Hᵀ" values={matmul(X0,transpose(H0))} columns={['C0','C1']} selected={[1,1]} /></Operation><DotProduct left={X0[1]} right={H0[1]} ids={['F0','F1','F2']} leftLabel="X[R1,f]" rightLabel="H[C1,f]" resultLabel="Selected cross entry P[R1,C1]" /></Figure>;
}
export function Cyclic() {
  const [step, setStep] = useState(0),
    states = [[1, 1], [2, 1], [2, 2.5]],
    fresh = states[step],
    stale = step < 2 ? fresh : [2, 3];
  return <Figure id="D18" caption="Fresh earlier coordinates matter. The second cyclic slope uses C0=2; its stale branch still uses C0=1. Known exact[1,3] is a separate reference, not this sweep's result."><Panels><Matrix label="Cyclic · current operands" rows={['Amounts', 'Prediction']} columns={['0', '1', '2']} values={[[...fresh, '—'], matmul([fresh], H0)[0]]} /><Matrix label="Stale comparison · persistent branch" rows={['Amounts', 'Prediction']} columns={['0', '1', '2']} values={[[...stale, '—'], matmul([stale], H0)[0]]} /><Matrix label="Known exact reference" values={[[1, 3, '—'], [1, 3, 4]]} rows={['Amounts', 'Prediction']} /></Panels><Controls onReset={() => setStep(0)}><button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button><button disabled={step === 2} onClick={() => setStep(step + 1)}>Step</button></Controls><Result>{['Start [1,1]. First C0 slope−2; next update will set C0=2.', 'C0 updated to2. Fresh C1 slope−3; stale C1 slope−4.', 'Cyclic [2,2.5], loss.75; stale [2,3], loss1. Exact reference [1,3] has loss0.'][step]}</Result></Figure>;
}
export function KKT() {
  const [b, setB] = useState(.5),
    g = [b, 2 * b - 1],
    pg = [0, g[1]];
  return <Figure id="D19" caption="At zero C0, a positive outward slope is compatible with a constrained minimum. At positive C1 its gradient must be zero. At the origin C1 has an improving feasible direction."><Panels><Plot label="Feasible C0 motion and improving C1 direction" xmax={1} ymax={1} xlabel="C0 amount" ylabel="C1 amount">{map => <><Arrow from={map([0, b])} to={map([.35, b])} color={colors[0]} /><Arrow from={map([0, b])} to={map([0, b === .5 ? b : b < .5 ? Math.min(1, b + .35) : Math.max(0, b - .35)])} color={colors[1]} /><Point at={map([0, b])} label="w" /></>}</Plot><Matrix label="Gradient and projected gradient" rows={['Gradient', 'Projected']} columns={['C0', 'C1']} values={[g, b === 0 ? [0, -1] : pg]} signed /></Panels><Controls onReset={() => setB(.5)}><Range label="C1 amount; C0 fixed0" value={b} onChange={setB} max={1} step={.1} /></Controls><Result>Blue arrow is a feasible C0 increase, not an improving step; rose arrow shows C1 improvement and disappears at its optimum. Prediction [{fmt(b)},{fmt(b)}]; gradient [{g.map(fmt).join(', ')}]. {b === .5 ? 'Both KKT coordinate conditions hold.' : b === 0 ? 'C1 gradient−1 permits a feasible improvement.' : 'Positive C1 has a nonzero gradient; it is not stationary.'}</Result></Figure>;
}
export function Alternation() {
  const [step, setStep] = useState(0), s = cdSweep(X0, onesW, H0),
    w = step === 0 ? onesW : s.w, h = step < 2 ? H0 : s.h,
    prediction = matmul(w, h), newWG = matmul(transpose(s.w), s.w), newWP = matmul(transpose(s.w), X0);
  return <Figure id="D20" caption="This complete CD sweep changes W first, then changes H using the new W. Its operand order differs from the historical H-first multiplicative route.">
    <Operation label="W block holds H0 fixed, constructs caches, then updates W">
      <Matrix label="Held H0 · never changed by W block" values={H0} rows={['C0','C1']} componentRows />
      <Port label="H0 H0ᵀ and X0 H0ᵀ" />
      <div><Matrix label="W-block G" values={matmul(H0, transpose(H0))} rows={['C0','C1']} columns={['C0','C1']} /><Matrix label="W-block P" values={matmul(X0, transpose(H0))} columns={['C0','C1']} /></div>
      <Port label="cyclic CD from W start; publish new W" />
      <Matrix label={step === 0 ? 'W start · block not yet applied' : 'New W · H-block operand'} values={w} columns={['C0','C1']} componentColumns />
    </Operation>
    {step > 0 && <Operation label="H block rebuilds its operands from new W, not the old W">
      <Matrix label="New W · held for H block" values={s.w} columns={['C0','C1']} componentColumns />
      <Port label="new Wᵀ new W and new Wᵀ X0" />
      <div><Matrix label="H-block G · rebuilt from new W" values={newWG} rows={['C0','C1']} columns={['C0','C1']} /><Matrix label="H-block P · rebuilt from new W" values={newWP} rows={['C0','C1']} /></div>
      <Port label="cyclic CD from H0; publish new H" />
      <Matrix label={step === 1 ? 'H0 · H block not yet applied' : 'New H · from new W'} values={h} rows={['C0','C1']} componentRows />
    </Operation>}
    <Operation label="Current factor state reconstructs the full table"><Matrix label="Current W" values={w} componentColumns  columns={['C0','C1']}/><Port label="× current H" /><Matrix label="Current H" values={h} componentRows  rows={['C0','C1']}/><Port label="reconstruct" /><Matrix label="Current prediction" values={prediction} /></Operation>
    <Controls onReset={() => setStep(0)}><button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button><button disabled={step === 2} onClick={() => setStep(step + 1)}>Step</button></Controls>
    <Result>{['Initial factors', 'W block complete; H remains H0', 'H block complete using new W'][step]}; whole-table half-loss {fmt(halfLoss(X0, prediction))}. Expected checkpoints6 → 15/16 → 11733/26620.</Result>
  </Figure>;
}
export function Joint() {
  return <Figure id="D21" caption="Two feasible factor pairs reconstruct x1 exactly, while their factor midpoint predicts9/8 and has positive loss1/128. A separate fixed-H slice remains convex."><Panels><Plot label="Factor plane · wh=1" xmax={2.5} ymax={2} xlabel="w" ylabel="h">{map => <><Curve map={map} xmin={.5} xmax={2.5} fn={w => 1 / w} /><path d={`M${map([1, 1]).join(' ')}L${map([2, .5]).join(' ')}`} stroke={colors[1]} /><Point at={map([1, 1])} label="A" /><Point at={map([2, .5])} label="B" /><Point at={map([1.5, .75])} label="mid" color={colors[1]} /></>}</Plot><Plot label="Fixed h1 · convex slice" xmax={2.5} ymax={1.5} xlabel="w" ylabel="half-loss">{map => <Curve map={map} xmax={2.5} fn={w => (1 - w) ** 2 / 2} />}</Plot></Panels></Figure>;
}
export function Stationarity() {
  const [w, setW] = useState(0);
  return <Figure id="D22" caption="An unchanged zero-locked amount can have a substantial feasible gradient. A cap or zero loss-change does not certify stationarity."><Panels><Plot label="Exact scalar objective" xmax={1} ymax={.5} xlabel="w" ylabel="half-loss">{map => <><Curve map={map} xmax={1} fn={w => (1 - w) ** 2 / 2} /><Point at={map([w, (1 - w) ** 2 / 2])} label="now" /></>}</Plot><Bars label="Absolute projected gradient · tolerance1e−5" values={[1 - w]} ids={['PG']} max={1} /></Panels><Controls onReset={() => setW(0)}><Range label="Scalar amount w" value={w} onChange={setW} max={1} step={.1} /></Controls><Result>Half-loss {fmt((1 - w) ** 2 / 2)}; projected-gradient magnitude {fmt(1 - w)}. {w === 1 ? 'Stationary exact solution.' : 'Nonzero projected gradient despite a possible unchanged multiplicative state.'}</Result></Figure>;
}
export function Storage() {
  return <Figure id="D23" caption="Actual shapes make the storage terms concrete. X exists as input; training W may be returned, H and metadata support later queries, and Gram/cross/row diagnostics are workspace. A changed factor requires cache rebuilding.">
    <div className="nmf-lifetime"><h4>Caller input · not learned state</h4><Matrix label="Input X · nd=9 cells" values={X0} /></div>
    <div className="nmf-lifetime"><h4>Returned training result · caller lifetime</h4><Matrix label="Returned training W · nk=6" values={W0} columns={['C0','C1']} /><p>Returning W does not require keeping all training rows inside the fitted object for later queries.</p></div>
    <div className="nmf-lifetime nmf-lifetime--retained"><h4>Retained fitted state · later query lifetime</h4><Panels><Matrix label="Retained fitted H · kd=6" values={H0} rows={['C0','C1']} /><Matrix label="Retained metadata slots" values={[[2,'F0/F1/F2','stored objective','stored stop reason']]} columns={['Fitted k','Ordered features','Diagnostic','Diagnostic']} /></Panels></div>
    <div className="nmf-lifetime"><h4>Transient solver workspace · rebuild after operand changes</h4><Operation label="A changed H invalidates G and P"><Matrix label="Current H" values={H0} /><Port label="H changes → rebuild H Hᵀ and X Hᵀ" /><div><Matrix label="Workspace G · k²=4" values={matmul(H0, transpose(H0))} columns={['C0','C1']} rows={['C0','C1']} /><Matrix label="Workspace P · nk=6" values={matmul(X0, transpose(H0))} columns={['C0','C1']} /></div></Operation><p>For the H block, new W similarly replaces WᵀW and WᵀX. Caches belong to their exact current operands.</p></div>
    <div className="nmf-lifetime"><h4>Temporary row diagnostics · release after reduction</h4><Matrix label="One diagnostic row block · bd=3" values={[X0[0]]} /><p>A block reduces into diagnostic totals; explicitly requested history has its own retained lifetime.</p></div>
    <p>Cache construction O(ndk+(n+d)k²); q cyclic sweeps O(q(n+d)k²); reconstruction diagnostics O(ndk). Transient caches O(k²+max(nk,kd)), plus block diagnostics and explicitly retained history. These are operation/storage counts, not measured timings.</p>
  </Figure>;
}

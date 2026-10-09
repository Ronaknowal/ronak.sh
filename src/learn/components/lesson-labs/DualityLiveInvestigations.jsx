import { useState } from 'react';
import { projectionCertificateState, scalarKktState, sensitivityState, resourceDualAscentState } from '../../data/duality-kkt-models.js';
import { C, Figure, Facts, Panels, Plot, HalfPlane, CostAxis, Controls, useInputs, number, pointText } from './DualityDrawingPrimitives.jsx';
import { ResidualCostPlot, SensitivityPicture } from './DualityGeometryDrawings.jsx';
import { AllocationBars, LpPlane } from './DualityApplicationsDrawings.jsx';
export function BudgetProjectionLab() {
  const limits = {
      budget: [-2, 10]
    },
    input = useInputs({
      budget: 5
    }, limits),
    s = projectionCertificateState(input.state.budget);
  return <Figure id="D06" description={`At budget ${number(s.budget)}, the closest feasible point is ${pointText(s.optimum)} and squared distance is ${number(s.optimalValue)}. Only the budget changes; both coordinates may be negative.`}><HalfPlane budget={s.budget} foot={s.optimum} contours arrows extra={p => <>{p.line(s.target, [s.optimum[0], s.target[1]], C.objective)}{p.line([s.optimum[0], s.target[1]], s.optimum, C.objective)}</>} /><Controls input={input} labels={{
      budget: 'Budget b'
    }} limits={limits}>{[7, 9, 5.3, -2].map(b => <button key={b} type="button" onClick={() => input.setAll({
        budget: b
      })}>b = {b}</button>)}</Controls><Facts rows={[["Budget", number(s.budget)], ['Target', '(3,4)', 'objective'], ['Proved optimum', pointText(s.optimum), 'optimum'], ['Squared distance', number(s.optimalValue)], ['Unused budget', number(s.budget - s.optimum[0] - s.optimum[1])]]} /></Figure>;
}
export function CertificateLab() {
  const limits = {
      x: [-3, 8],
      y: [-3, 8],
      price: [-2, 12]
    },
    input = useInputs({
      x: 2,
      y: 2,
      price: 1
    }, limits),
    {
      x,
      y,
      price
    } = input.state,
    s = projectionCertificateState(5, [x, y], price);
  return <Figure id="D12" description={`Candidate ${pointText(s.candidate)}, price ${number(price)}: f=${number(s.objective)}, L=${number(s.lagrangian)}, q=${number(s.dualValue)}. ${s.certifiedGap === null ? 'No certificate: ' + (!s.primalFeasible ? 'the candidate violates the budget. ' : '') + (!s.dualFeasible ? 'The price is negative.' : '') : `Certified gap ${number(s.certifiedGap)}.`}`}><HalfPlane candidate={s.candidate} centre={s.minimizer} foot={s.optimum} extra={p => p.line(s.candidate, s.minimizer, C.candidate)} /><Controls input={input} limits={limits} labels={{
      x: 'Candidate x',
      y: 'Candidate y',
      price: 'Price λ'
    }}><button type="button" onClick={() => input.setAll({
        x: 2,
        y: 3,
        price: 2
      })}>Optimal pair</button><button type="button" onClick={() => input.setAll({
        x: 4,
        y: 4,
        price: 2
      })}>Infeasible point</button><button type="button" onClick={() => input.setAll({
        x: 2,
        y: 3,
        price: -1
      })}>Negative price</button></Controls><CostAxis items={[{
      label: 'q',
      value: s.dualValue,
      role: 'price'
    }, {
      label: 'L(candidate)',
      value: s.lagrangian,
      role: 'price'
    }, {
      label: 'f(candidate)',
      value: s.objective,
      role: 'candidate'
    }]} /><Facts rows={[["Candidate / primal status", `${pointText(s.candidate)}; ${s.primalFeasible ? 'feasible' : 'infeasible'}`, 'candidate'], ['Price / sign', `${number(price)}; ${s.dualFeasible ? 'allowed' : 'invalid'}`, 'price'], ['Priced minimizer', pointText(s.minimizer), 'price'], ['Squared displacement', number(s.minimizationGap)], ['Price × slack', number(s.complementarityGap)], ['Formal f−q', number(s.formalDifference)], ['Certificate', s.certifiedGap === null ? 'unavailable' : number(s.certifiedGap)]]} /></Figure>;
}
export function ScalarKktLab() {
  const limits = {
      center: [-2, 2],
      candidate: [-2, 4],
      price: [-2, 6]
    },
    input = useInputs({
      center: -1,
      candidate: 0,
      price: 2
    }, limits),
    s = scalarKktState(input.state.center, input.state.candidate, input.state.price);
  const hi = Math.max(7, s.objective + 2),
    forceLo = Math.min(-7, s.gradient - 1, s.constraintContribution - 1),
    forceHi = Math.max(7, s.gradient + 1, s.constraintContribution + 1);
  return <Figure id="D23" description={`Centre ${number(s.center)}, candidate ${number(s.candidate)}, price ${number(s.multiplier)}. Primal ${s.conditions.primal ? 'passes' : 'fails'}, sign ${s.conditions.dual ? 'passes' : 'fails'}, balance ${number(s.stationarity)}, complementary product ${number(s.complementaryProduct)}.`}><Plot domain={[-3, 5]} range={[-1, hi]} xLabel="candidate x" yLabel="(x−c)²">{p => <>{p.polygon([[0, -1], [5, -1], [5, hi], [0, hi]])}{p.curve(x => (x - s.center) ** 2)}{p.mark([s.center, 0], 'objective')}{p.mark([s.candidate, s.objective], 'candidate')}{p.mark([s.optimum, s.optimalValue], 'optimum')}</>}</Plot><Controls input={input} labels={{
      center: 'Bowl centre c',
      candidate: 'Candidate x',
      price: 'Price λ'
    }} limits={limits}><button type="button" onClick={() => input.setAll({
        ...input.state,
        candidate: s.optimum,
        price: s.optimalMultiplier
      })}>Optimal pair for c</button>{[-1, 0, 1].map(c => <button key={c} type="button" onClick={() => input.setAll({
        center: c,
        candidate: Math.max(0, c),
        price: 2 * Math.max(0, -c)
      })}>Optimal c = {c}</button>)}</Controls><Plot domain={[forceLo, forceHi]} range={[-1, 2]} xLabel="gradient contribution" yLabel="">{p => <>{p.vector([0, 1], [s.gradient, 1], C.objective)}{p.vector([0, 0], [s.constraintContribution, 0], C.price, true)}</>}</Plot><Facts rows={[["Primal residual −x", `${number(s.constraint)}; ${s.conditions.primal ? '≤0' : 'positive'}`], ['Multiplier sign', `${number(s.multiplier)}; ${s.conditions.dual ? '≥0' : 'negative'}`, 'price'], ['Objective gradient', number(s.gradient), 'objective'], ['Constraint force', number(s.constraintContribution), 'price'], ['Stationarity sum', `${number(s.stationarity)}; ${s.conditions.stationarity ? 'zero' : 'nonzero'}`], ['Complementarity product', `${number(s.complementaryProduct)}; ${s.conditions.complementarity ? 'zero' : 'nonzero'}`]]} /></Figure>;
}
export function SupportingGeometryLab() {
  const limits = {
      price: [0, 4]
    },
    input = useInputs({
      price: 1
    }, limits),
    l = input.state.price,
    q = 2 * l - l * l / 2,
    u = 2 - l,
    v = l * l / 2;
  return <Figure id="D28" description={`Price ${number(l)} gives supporting slope ${number(-l)}, contact ${pointText([u, v])}, and vertical intercept q=${number(q)}. ${l === 0 ? 'On the allowance epigraph the entire ray u≥2, v=0 is in contact.' : 'Both frontiers have this contact point.'}`}><ResidualCostPlot price={l} /><Controls input={input} labels={{
      price: 'Price λ'
    }} limits={limits}>{[0, 2, 4, 1.3].map(price => <button key={price} type="button" onClick={() => input.setAll({
        price
      })}>λ = {price}</button>)}</Controls><ResidualCostPlot price={l} allowance /><Facts rows={[["Supporting line", `v=${number(q)}−${number(l)}u`, 'price'], ['Contact in exact residual set', pointText([u, v]), 'optimum'], ['Intercept at original u=0', number(q), 'price'], ['Contact primal-feasible?', u <= 0 ? 'yes; residual ≤0' : 'no; residual >0'], ['Allowance contact', l === 0 ? 'entire ray u≥2, v=0' : pointText([u, v])]]} /></Figure>;
}
export function SensitivityLab() {
  const limits = {
      base: [0, 10],
      change: [-2, 2]
    },
    input = useInputs({
      base: 5,
      change: .5
    }, limits),
    s = sensitivityState('quadratic', input.state.base, input.state.change);
  const foot = b => {
      const t = Math.max(0, 7 - b) / 2;
      return [3 - t, 4 - t];
    },
    a = foot(s.base),
    b = foot(s.base + s.change);
  const remScale = Math.max(.01, s.supportingGap * 1.3);
  return <Figure id="D35" description={`Base budget ${number(s.base)}, change ${number(s.change)}: exact new cost ${number(s.changedValue)}, supporting estimate ${number(s.supportingValue)}, difference ${number(s.supportingGap)}. The base price is recomputed as ${number(s.price)}.`}><HalfPlane budget={s.base} foot={a} comparison={b} extra={p => p.line([-3, s.base + s.change + 3], [8, s.base + s.change - 8], C.neutral, {
      strokeDasharray: '5 4'
    })} /><Controls input={input} limits={limits} labels={{
      base: 'Base budget b',
      change: 'Budget change δ'
    }}><button type="button" onClick={() => input.setAll({
        base: 7,
        change: -.5
      })}>Zero price, tightening</button><button type="button" onClick={() => input.setAll({
        base: 9,
        change: .5
      })}>Unused capacity</button>{[-.1, .1].map(change => <button key={change} type="button" onClick={() => input.setAll({
        base: 5,
        change
      })}>δ = {change}</button>)}</Controls><SensitivityPicture base={s.base} change={s.change} /><Plot domain={[-2, 2]} range={[-.05 * remScale, remScale]} xLabel="change δ" yLabel="support remainder">{p => <>{p.curve(d => Math.max(0, 7 - s.base - d) ** 2 / 2 - s.originalValue + s.price * d, C.objective)}{p.mark([s.change, s.supportingGap], 'candidate')}</>}</Plot><Facts rows={[["Original / changed point", `${pointText(a)} → ${pointText(b)}`], ['Actual cost change', number(s.actualChange), 'objective'], ['Linear estimate', number(s.linearChange), 'price'], ['Remainder vertical scale', `0 to ${number(remScale)}; auto-scaled`]]} /></Figure>;
}
export function KinkLab() {
  const limits = {
      price: [0, 1],
      change: [-2, 2]
    },
    input = useInputs({
      price: .5,
      change: .5
    }, limits),
    s = sensitivityState('kink', 0, input.state.change, input.state.price);
  return <Figure id="D37" description={`At the fixed corner u=0, chosen price ${number(s.price)} and change ${number(s.change)} give actual value ${number(s.changedValue)}, support ${number(s.supportingValue)}, and gap ${number(s.supportingGap)}. Negative support values remain valid lower estimates.`}><Plot domain={[-2, 2]} range={[-2.5, 3]} xLabel="allowance u" yLabel="value">{p => <>{p.curve(u => Math.max(0, -u), C.objective)}{p.curve(u => -s.price * u, C.price, {
          strokeDasharray: '6 4'
        })}{p.mark([0, 0], 'optimum')}{p.mark([s.change, s.changedValue], 'candidate')}{p.mark([s.change, s.supportingValue], 'price')}</>}</Plot><Controls input={input} limits={limits} labels={{
      price: 'Supporting price λ₂',
      change: 'Allowance change δ'
    }}><button type="button" onClick={() => input.setAll({
        ...input.state,
        change: 0
      })}>Zero change</button><button type="button" onClick={() => input.setAll({
        ...input.state,
        change: -.5
      })}>Tighten by .5</button></Controls><Facts rows={[["Selected price", number(s.price), 'price'], ['Actual value', number(s.changedValue), 'objective'], ['Support value', number(s.supportingValue), 'price'], ['Support gap', number(s.supportingGap)], ['At zero change', 'all values zero while the supporting line rotates'], ['Directional derivatives', 'left −1; right 0']]} /></Figure>;
}
export function ResourcePriceLab() {
  const limits = {
      budget: [0, 8],
      rate: [.1, 4]
    },
    input = useInputs({
      budget: 5,
      rate: 1
    }, limits),
    [step, setStep] = useState(0),
    run = resourceDualAscentState(input.state.budget, input.state.rate, 0, 12),
    s = run.frames[step],
    resetInput = {
      ...input,
      reset: () => {
        input.reset();
        setStep(0);
      }
    };
  return <Figure id="D43" description={`After ${step} performed updates at budget ${number(run.budget)}, rate ${number(run.rate)}, price is ${number(s.price)}. Requests ${pointText(s.allocation)} total ${number(s.sum)}. Lower bound ${number(s.dualValue)}, repaired upper ${number(s.repairedObjective)}, stable gap ${number(s.certificateGap)}.`}><AllocationBars allocation={s.allocation} budget={s.budget} repaired={s.repaired} ><Controls input={resetInput} limits={limits} labels={{
      budget: 'Shared budget',
      rate: 'Price step size'
    }}><button type="button" disabled={step === 0} onClick={() => setStep(v => v - 1)}>Back</button><button type="button" disabled={step === 12} onClick={() => setStep(v => v + 1)}>Step</button><button type="button" onClick={() => setStep(12)}>After 12 updates</button><button type="button" onClick={() => input.setAll({
        budget: 5,
        rate: 3
      })}>Rate 3 cycle</button><button type="button" onClick={() => input.setAll({
        budget: 8,
        rate: 1
      })}>Spare capacity</button></Controls></AllocationBars><p>Twelve-update trajectory preview. The white diamond outline marks the current performed step; later points show what the same rule will produce.</p><Plot domain={[0, 12]} range={[-1, Math.max(9, ...run.frames.map(f => f.price)) + 1]} xLabel="update index" yLabel="price λ">{p => <>{run.frames.map((f, i) => <g key={i}>{i > 0 && p.line([i - 1, run.frames[i - 1].price], [i, f.price], C.price)}{p.mark([i, f.price], 'price')}{i === step && p.mark([i, f.price], 'selection')}</g>)}</>}</Plot><Facts rows={[["Performed updates", String(step)], ['Current price', number(s.price), 'price'], ['Total / excess', `${number(s.sum)} / ${number(s.violation)}`], ['Original requests feasible?', s.primalFeasible ? 'yes' : 'no'], ['Repaired feasible requests', pointText(s.repaired), 'witness'], ['Dual lower / repaired upper', `${number(s.dualValue)} / ${number(s.repairedObjective)}`], ['Stable nonnegative gap', number(s.certificateGap)], ['Unperformed next-update preview', `max(0, ${number(s.price)} + ${number(run.rate)}×${number(s.violation)}) = ${number(s.nextPrice)}`, 'price']]} /></Figure>;
}
export function DemandLab() {
  const limits = {
      demand: [3, 5]
    },
    input = useInputs({
      demand: 4
    }, limits),
    b = input.state.demand,
    z = [(3 * b - 6) / 2, (6 - b) / 2],
    cost = 2 * b + 6;
  return <Figure id="D49" description={`First demand ${number(b)} moves the intersection to ${pointText(z)}. Cost and dual certificate both equal ${number(cost)} at unchanged prices (2,1). This is the analytic browser model, not a SciPy execution.`}><LpPlane demand={b} /><Controls input={input} labels={{
      demand: 'First demand b₁'
    }} limits={limits}>{[3, 4.2, 5].map(demand => <button type="button" key={demand} onClick={() => input.setAll({
        demand
      })}>b₁ = {demand}</button>)}</Controls><Plot domain={[3, 5]} range={[11, 17]} xLabel="first demand b₁" yLabel="optimal cost">{p => <>{p.curve(x => 2 * x + 6, C.objective)}{p.mark([b, cost], 'optimum')}</>}</Plot><Facts rows={[["First / second demand", `${number(b)} / 6`], ['Optimal point', pointText(z), 'optimum'], ['Cost / bound', `${number(cost)} / ${number(cost)}`], ['Unchanged dual prices', '(2,1)', 'price'], ['First-demand sensitivity', '2 cost units per demand unit'], ['Gap decomposition', 'zᵀ(c−Aᵀλ)+λᵀ(Az−b)=0']]} /></Figure>;
}

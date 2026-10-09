import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { odeStep, numericalCooling, integrateScalar } from '../../data/ordinary-differential-equations-models.js';
import { OdeFigure, OdeScene, OdePlot, OdeLabel, OdeArrow, OdeTable,
  odeSamples, odeFormat as f, odeColours as colour } from './OrdinaryDifferentialEquationsReadingPrimitives.jsx';

const methods = [['euler', 'Euler'], ['midpoint', 'Explicit midpoint'], ['rk4', 'Classical RK4']];
const coefficients = (first, second) => {
  const values = [first, second, 0];
  for (let n = 1; n <= 13; n += 1) values[n + 2] = values[n - 1] / ((n + 2) * (n + 1));
  return values;
};

export function OrdinarySeriesChains() {
  const branches = [coefficients(1, 0), coefficients(0, 1)];
  return <OdeFigure id="E51" caption="For y″=ty, matching powers links each coefficient to the one three positions earlier. Two independent initial seeds create two separate nonzero chains; a₂=0 seeds the third zero chain. The plotted degree-15 polynomials are truncations of the infinite solutions.">
    <OdeScene label="Two actual nonzero coefficient chains, with their recurrence divisors" width={800} height={300}>
      {[0, 1].map(branch => <g key={branch}>
        {[0, 1, 2, 3].map(index => {
          const degree = branch + 3 * index, x = 75 + index * 210, y = 70 + branch * 130;
          return <g key={degree}>
            <circle cx={x} cy={y} r={28} stroke={branch ? colour.second : colour.state} fill="none" />
            <OdeLabel x={x} y={y + 5} anchor="middle">a{degree}</OdeLabel>
            <OdeLabel x={x} y={y + 52} anchor="middle">{f(branches[branch][degree], 5)}</OdeLabel>
            {index < 3 && <><OdeArrow x1={x + 35} y1={y} x2={x + 175} y2={y} colour={branch ? colour.second : colour.state} />
              <OdeLabel x={x + 105} y={y - 17} anchor="middle">÷{(degree + 3) * (degree + 2)}</OdeLabel></>}
          </g>;
        })}
      </g>)}
    </OdeScene>
    <OdePlot label="The two actual degree-15 truncated basis functions"
      xDomain={[0, 1]} yDomain={[0, 1.4]} xLabel="t" yLabel="polynomial state"
      series={branches.map((values, index) => ({ points: odeSamples(0, 1, t => values.reduce((sum, value, degree) => sum + value * t ** degree, 0)), colour: index ? colour.second : colour.state }))} />
  </OdeFigure>;
}

function StageDrawing({ method = 'rk4', step = .5 }) {
  const result = odeStep(method, (_time, state) => -.2 * state, 0, 40, step);
  const weights = method === 'rk4' ? [1 / 6, 2 / 6, 2 / 6, 1 / 6] : method === 'midpoint' ? [0, 1] : [1];
  return <>
    <OdePlot label="Trial stage states, their actual slopes and the one accepted endpoint"
      xDomain={[0, 1.5]} yDomain={[26, 42]} xLabel="elapsed time (min)" yLabel="temperature excess (K)"
      series={[{ points: odeSamples(0, 1.5, t => 40 * Math.exp(-.2 * t)), colour: '#bbb' },
        { points: [[0, 40], [step, result.state]], colour: colour.state, dashed: true, dots: true }]}>
      {({ x, y }) => <>
        {result.stages.map((stage, index) => <g key={index}>
          <circle cx={x(stage.time)} cy={y(stage.state)} r={5} fill={colour.input} />
          <OdeArrow x1={x(stage.time)} y1={y(stage.state)} x2={x(stage.time + .07)} y2={y(stage.state + stage.slope * .07)} colour={colour.input} />
        </g>)}
        <circle cx={x(step)} cy={y(result.state)} r={6} fill={colour.state} stroke="#eee" />
      </>}
    </OdePlot>
    <p className="ode-diagram-key">Grey is the exact solution. Cyan points probe rates; cyan arrows use the same .07-minute width. Amber is the single accepted endpoint and its secant from the start. Stage coordinates that coincide retain separate table rows.</p>
    <OdeScene label="Actual weighted slope contributions to the single accepted average" height={330}>
      <OdeLabel x={50} y={30}>Width is weight; height is |stage slope|.</OdeLabel>
      <line x1={70} y1={230} x2={570} y2={230} stroke="#888" />
      {result.stages.map((stage, index) => {
        const left = 70 + 500 * weights.slice(0, index).reduce((sum, weight) => sum + weight, 0);
        return weights[index] === 0 ? null : <g key={index}>
          <rect x={left} y={230 - Math.abs(stage.slope) * 20} width={500 * weights[index]}
            height={Math.abs(stage.slope) * 20} fill={colour.input} fillOpacity={index % 2 ? .22 : .12} stroke={colour.input} />
          <OdeLabel x={left + 250 * weights[index]} y={255} anchor="middle">k{index + 1}</OdeLabel>
        </g>;
      })}
      <OdeLabel x={50} y={305}>All slopes are negative: average={f(result.average)} K/min.</OdeLabel>
    </OdeScene>
    <OdeTable label="Actual stage times, states, slopes and weights in the accepted average"
      columns={['Stage', 'Time', 'Trial state', 'Slope (K/min)', 'Weight']}
      rows={result.stages.map((stage, index) => [`k${index + 1}`, f(stage.time), f(stage.state), f(stage.slope), f(weights[index])])} />
    <OdeTable label="The weighted rate produces exactly one full step"
      columns={['Result', 'Value']} rows={[
        ['weighted slope', f(result.average)], ['accepted time', f(step)], ['accepted state', f(result.state)],
        ['exact state at that same time', f(40 * Math.exp(-.2 * step))],
        ['local state defect: accepted minus exact', f(result.state - 40 * Math.exp(-.2 * step), 9)],
      ]} />
  </>;
}

export function EulerRateRectangle() {
  return <OdeFigure id="E52" caption="The first rate −8 is held across .5 minute, producing change −4 and endpoint 36. The exact curve reaches 36.193497 at that same time. This is one exact-start Euler step.">
    <StageDrawing method="euler" />
    <OdePlot label="Euler replaces the changing rate by a constant rate rectangle"
      xDomain={[0, .5]} yDomain={[-9, 0]} xLabel="elapsed time (min)" yLabel="rate (K/min)"
      series={[{ points: [[0, -8], [.5, -8]], colour: colour.input },
        { points: odeSamples(0, .5, t => -8 * Math.exp(-.2 * t)), colour: '#bbb' }]}>
      {({ x, y }) => <><rect x={x(0)} y={y(0)} width={x(.5) - x(0)} height={y(-8) - y(0)} fill={colour.input} fillOpacity={.12} />
        <OdeLabel x={x(.25)} y={y(-4)} anchor="middle">signed change −4 K</OdeLabel></>}
    </OdePlot>
  </OdeFigure>;
}

export function MidpointRateProbe() {
  return <OdeFigure id="E53" caption="The Euler half-step predicts 38 at .25 minute. Its rate −7.6, used across the full .5 minute, gives 36.2. The cyan midpoint is a rate probe rather than an accepted intermediate step.">
    <StageDrawing method="midpoint" />
  </OdeFigure>;
}

export function NumericalStageLab() {
  const [method, setMethod] = useState('rk4'), [step, setStep] = useState(.5);
  return <FlowLab id="ode-E54" label="Which rate probes contribute to one accepted step?">
    <OdeFigure id="E54"><StageDrawing method={method} step={step} /></OdeFigure>
    <FlowControls>
      <FlowChoice label="Method" options={methods} value={method} onChange={setMethod} />
      <FlowSlider name="Step width (min)" value={step} min={.1} max={1.5} step={.05} onChange={setStep} />
      <button type="button" onClick={() => { setMethod('rk4'); setStep(.5); }}>Reset</button>
    </FlowControls>
    <FlowReadout>Initial state 40 and rate constant .2 stay fixed. Each method uses its own stage weights; four probes are not four accepted time steps.</FlowReadout>
  </FlowLab>;
}

export function PropagatedNumericalDefects() {
  const step = .5, factor = 1 - .2 * step;
  const states = Array.from({ length: 5 }, (_, index) => 40 * factor ** index);
  const exact = index => 40 * Math.exp(-.2 * step * index);
  const defect = index => factor * exact(index) - exact(index + 1);
  return <OdeFigure id="E55" caption="For this cooling equation the signed error obeys eₙ₊₁=.9eₙ+dₙ, where dₙ is the exact-start one-step defect. The dynamics contract inherited error here. A general Lipschitz bound can be looser than this actual propagation.">
    <OdePlot label="The first step starts exactly, while later steps start from accumulated numerical states"
      xDomain={[0, 2]} yDomain={[24, 42]} xLabel="physical time (min)" yLabel="state (K)"
      series={[{ points: odeSamples(0, 2, t => 40 * Math.exp(-.2 * t)), colour: '#bbb' },
        { points: states.map((state, index) => [index * step, state]), dots: true }]} />
    <OdePlot label="Accumulated accepted-state error differs from each exact-start local defect"
      xDomain={[0, 4]} yDomain={[-.65, .05]} xLabel="accepted step index n (h=.5)" yLabel="signed error (K)"
      references={[{ value: 0 }]} series={[
        { points: states.map((state, index) => [index, state - exact(index)]), dots: true },
        { points: states.slice(1).map((_state, index) => [index + 1, defect(index)]), colour: colour.input, dots: true },
      ]} />
    <OdeTable label="Each existing error is propagated before the new defect is added"
      columns={['Step n→n+1', '.9eₙ', 'Exact-start defect dₙ', 'Sum = actual eₙ₊₁']}
      rows={states.slice(0, -1).map((state, index) => [index, f(factor * (state - exact(index))), f(defect(index)), f(states[index + 1] - exact(index + 1))])} />
  </OdeFigure>;
}

function HistoryDrawing({ method = 'euler', step = 1, refinement = true }) {
  const coarse = numericalCooling(method, step), fine = numericalCooling(method, step / 2);
  return <>
    <OdePlot label="All accepted states share the same physical horizon and initial condition"
      xDomain={[0, 5]} yDomain={[12, 42]} xLabel="physical time (min)" yLabel="temperature excess (K)"
      series={[{ points: odeSamples(0, 5, t => 40 * Math.exp(-.2 * t)), colour: '#bbb' },
        { points: coarse.history.map(row => [row.time, row.state]), dots: true },
        ...(refinement ? [{ points: fine.history.map(row => [row.time, row.state]), colour: colour.comparison, dots: true, dashed: true }] : [])]} />
    <OdeTable label="Actual attained horizons, work and final signed errors"
      columns={['Run', 'Steps', 'Final time', 'Final state', 'Signed error', 'Status']}
      rows={[['h', coarse.steps, f(coarse.endTime), f(coarse.history.at(-1).state), f(coarse.signedError, 9), coarse.status],
        ...(refinement ? [['h/2', fine.steps, f(fine.endTime), f(fine.history.at(-1).state), f(fine.signedError, 9), fine.status]] : [])]} />
    {refinement && <p>Absolute error ratio |error(h)|/|error(h/2)|: {fine.signedError === 0 ? 'undefined (the denominator is zero)' : f(Math.abs(coarse.signedError / fine.signedError))}.</p>}
    <OdeTable label="Every accepted coarse state, including the shortened final step" tall
      columns={['Index', 'Time', 'Actual step', 'Accepted state', 'Exact state at this time']}
      rows={coarse.history.map((row, index) => [index, f(row.time), index ? f(row.step) : 'initial', f(row.state), f(40 * Math.exp(-.2 * row.time))])} />
  </>;
}

export function CommonHorizonSteps() {
  const stopped = integrateScalar({ method: 'euler', derivative: (_time, state) => -.2 * state,
    initial: 40, endTime: 5, step: .7, maximumSteps: 3 });
  return <OdeFigure id="E56" caption="Width .7 advances seven full steps to 4.9, then a final .1 step to T=5. The exact final reference is 40/e. A budget-stopped run reports its attained time separately; it cannot substitute that point for the requested horizon.">
    <OdeScene label="The common endpoint requires a shortened last interval" height={180}>
      <line x1={60} y1={85} x2={590} y2={85} stroke="#888" />
      {Array.from({ length: 9 }, (_, index) => Math.min(index * .7, 5)).map((time, index) => <g key={index}>
        <line x1={60 + 530 * time / 5} y1={65} x2={60 + 530 * time / 5} y2={105} stroke={colour.state} />
        <OdeLabel x={60 + 530 * time / 5} y={index % 2 ? 135 : 45} anchor="middle">{f(time, 2)}</OdeLabel>
      </g>)}
      <OdeLabel x={60} y={175}>Seven .7 intervals, then .1; total physical time 5.</OdeLabel>
    </OdeScene>
    <HistoryDrawing step={.7} refinement={false} />
    <OdePlot label="A three-step budget stops at the actual attained time, with no invented continuation"
      xDomain={[0, 5]} yDomain={[12, 42]} xLabel="requested physical time (min)" yLabel="budget-limited state (K)"
      series={[{ points: stopped.history.map(row => [row.time, row.state]), colour: colour.comparison, dots: true }]} />
    <p>Three-step budget: attained time {f(stopped.endTime)}; {stopped.status}. This is separate from the complete-horizon run above.</p>
  </OdeFigure>;
}

export function NumericalRefinementLab() {
  const [method, setMethod] = useState('euler'), [step, setStep] = useState(1);
  return <FlowLab id="ode-E57" label="Compare two step widths over the same complete cooling interval">
    <OdeFigure id="E57"><HistoryDrawing method={method} step={step} /></OdeFigure>
    <FlowControls>
      <FlowChoice label="Method" options={methods} value={method} onChange={setMethod} />
      <FlowSlider name="Coarse width h (min)" value={step} min={.1} max={1.5} step={.05} onChange={setStep} />
      <button type="button" onClick={() => { setMethod('euler'); setStep(1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>Amber uses h and pink uses h/2; grey is the exact solution. Both runs start at 40, use rate .2 and finish at 5. Error ratios describe this example and do not replace convergence assumptions.</FlowReadout>
  </FlowLab>;
}

import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout } from './LessonFlow.jsx';
import { coolingState, waitingState, blowupState, logisticState } from '../../data/ordinary-differential-equations-models.js';
import {
  OdeFigure, OdeScene, OdePlot, OdeLabel, OdeArrow, OdeTable,
  odeSamples, odeFormat as f, odeColours as colour,
} from './OrdinaryDifferentialEquationsReadingPrimitives.jsx';

export function LocalTheoremRectangle() {
  return <OdeFigure id="E10" caption="The closed rectangle is inside the open domain. A rate bound 6 allows at most 3 units of motion in a half-minute, within the available state radius 10. This construction is local.">
    <OdePlot label="Interior time-state rectangle and the local bounded-rate cone"
      xDomain={[-.75, .75]} yDomain={[5, 35]} xLabel="time t(min), t₀=0" yLabel="state x(K)">
      {({ x, y }) => <>
        <rect x={x(-.65)} y={y(33)} width={x(.65) - x(-.65)} height={y(7) - y(33)}
          fill="none" stroke="#777" strokeDasharray="6 5" rx={12} />
        <rect x={x(-.5)} y={y(30)} width={x(.5) - x(-.5)} height={y(10) - y(30)}
          fill={colour.input} fillOpacity={.05} stroke={colour.input} />
        <polygon points={[[-.5, 17], [0, 20], [.5, 17], [.5, 23], [0, 20], [-.5, 23]]
          .map(point => `${x(point[0])},${y(point[1])}`).join(' ')} fill={colour.state} fillOpacity={.2} />
        <circle cx={x(0)} cy={y(20)} r={5} fill={colour.state} />
        <OdeLabel x={x(-.45)} y={y(28)}>closed rectangle; |f|≤6</OdeLabel>
        <OdeLabel x={x(-.45)} y={y(12)}>radius 10; L=.2</OdeLabel>
        <OdeLabel x={x(.08)} y={y(20) - 17}>initial (0,20)</OdeLabel>
        <OdeLabel x={x(-.6)} y={y(34)}>open surrounding domain</OdeLabel>
      </>}
    </OdePlot>
  </OdeFigure>;
}

export function LipschitzSeparations() {
  return <OdeFigure id="E11" caption="Two state inputs enter the same rate law at the same time. Cooling has a fixed separation ratio. The square-root law's ratio grows without bound near zero.">
    <OdePlot label="Square-root rate and two finite state-to-rate separations"
      xDomain={[0, 1]} yDomain={[0, 2.2]} xLabel="state x≥0" yLabel="rate2√x"
      series={[{ points: odeSamples(0, 1, value => 2 * Math.sqrt(value)), colour: colour.input }]}>
      {({ x, y }) => <>
        {[.01, .25].map((delta, index) => <g key={delta}>
          <line x1={x(0)} x2={x(delta)} y1={y(0)} y2={y(0)} stroke={index ? colour.comparison : colour.state} strokeWidth={4} />
          <line x1={x(delta)} x2={x(delta)} y1={y(0)} y2={y(2 * Math.sqrt(delta))} stroke={index ? colour.comparison : colour.state} />
          <circle cx={x(delta)} cy={y(2 * Math.sqrt(delta))} r={4} fill={index ? colour.comparison : colour.state} />
        </g>)}
        <OdeLabel x={x(.38)} y={y(.75)}>ratio2/√δ</OdeLabel>
      </>}
    </OdePlot>
    <OdeTable label="Actual rate difference divided by state difference"
      columns={['Law', 'Inputs', 'State gap', 'Rate gap magnitude', 'Ratio']}
      rows={[
        ['−.2x', '20,21', 1, .2, .2],
        ['2√x', '0,.25', .25, 1, 4],
        ['2√x', '0,.01', .01, .2, 20],
        ['2√x', '0,.0001', .0001, .02, 200],
      ]} />
  </OdeFigure>;
}

export function WaitingDepartureLab() {
  const [departure, setDeparture] = useState(1);
  const [time, setTime] = useState(2);
  const current = waitingState(time, departure);
  return <FlowLab id="ode-E12" label="Several whole waiting histories share identical initial data">
    <OdeFigure id="E12" caption="Pink/cyan/violet retain the departure 0/1/2 families. The dashed selected family and amber selected point use the current controls; all start at (0,0).">
      <OdePlot label="Waiting solution families of x′=2√|x|, x(0)=0"
        xDomain={[0, 3]} yDomain={[0, 10]} xLabel="time t" yLabel="state x"
        series={[
          ...[0, 1, 2].map((start, index) => ({ points: odeSamples(0, 3, t => waitingState(t, start).state),
            colour: [colour.comparison, colour.input, colour.second][index] })),
          { points: odeSamples(0, 3, t => waitingState(t, departure).state), colour: '#ddd', dashed: true },
          { points: [[time, current.state]], dots: true, connect: false },
        ]}>
        {({ x, y }) => <>
          {[0, 1, 2].map((start, index) => <OdeLabel key={start} x={x(2.75)} y={y(waitingState(2.75, start).state) - 13}
            anchor="end" colour={[colour.comparison, colour.input, colour.second][index]}>a={start}</OdeLabel>)}
          <circle cx={x(departure)} cy={y(0)} r={5} fill={colour.state} />
          <OdeLabel x={x(.1)} y={y(9)}>waiting segment and departure tangent: slope 0</OdeLabel>
        </>}
      </OdePlot>
      <OdeTable label="The selected path satisfies the same local equation"
        columns={['Departure a', 'Time t', 'x', 'Actual derivative', '2√|x|']}
        rows={[[departure, time, f(current.state), f(current.derivative), f(2 * Math.sqrt(Math.abs(current.state)))]]} />
    </OdeFigure>
    <FlowControls>
      <FlowSlider name="Departure a" value={departure} min={0} max={2} step={.1} onChange={setDeparture} />
      <FlowSlider name="Selected t" value={time} min={0} max={3} step={.1} onChange={setTime} />
      <button type="button" onClick={() => { setDeparture(1); setTime(2); }}>Reset</button>
    </FlowControls>
    <FlowReadout>At departure, both one-sided derivatives are <strong>zero</strong>. An Euler calculation that stays at zero finds one valid history; it does not establish uniqueness.</FlowReadout>
  </FlowLab>;
}

export function PicardFunctions() {
  const iterate = (time, degree) => {
    let term = 20, value = term;
    for (let order = 1; order <= degree; order += 1) { term *= -.2 * time / order; value += term; }
    return value;
  };
  return <OdeFigure id="E13" caption="Each iteration index names an entire function, not a new physical time. The four values at t=.5 approach the exact 18.096748; the integral of the preceding function builds the next.">
    <OdePlot label="Four whole Picard functions for one cooling initial-value problem"
      xDomain={[0, 1]} yDomain={[16, 21]} xLabel="physical time t(min)" yLabel="candidate history xₙ(t)"
      series={Array.from({ length: 4 }, (_, degree) => ({ points: odeSamples(0, 1, time => iterate(time, degree)),
        colour: [colour.comparison, colour.input, colour.second, colour.state][degree] }))} />
    <OdePlot label="Rate obtained from the previous whole Picard function"
      xDomain={[0, .5]} yDomain={[-4.2, 0]} xLabel="integration time s(min)" yLabel="−.2x₂(s)"
      series={[{ points: odeSamples(0, .5, time => -.2 * iterate(time, 2)), colour: colour.input }]}>
      {({ x, y }) => <>
        <polygon points={[[0, 0], ...odeSamples(0, .5, time => -.2 * iterate(time, 2)), [.5, 0]]
          .map(point => `${x(point[0])},${y(point[1])}`).join(' ')} fill={colour.input} fillOpacity={.15} />
        <OdeLabel x={x(.25)} y={y(-1.5)} anchor="middle">20+signed area=x₃(.5)</OdeLabel>
      </>}
    </OdePlot>
    <OdeTable label="One physical time, different whole-function iterations"
      columns={['Iteration', 'xₙ(.5)', 'Colour']}
      rows={Array.from({ length: 4 }, (_, degree) => [degree, f(iterate(.5, degree)), ['pink', 'cyan', 'violet', 'amber'][degree]])} />
  </OdeFigure>;
}

export function PerturbationEnvelope() {
  return <OdeFigure id="E14" caption="The common cooling law shrinks this initial gap. Its general Lipschitz envelope is larger and grows; a valid upper bound need not describe actual growth.">
    <OdePlot label="Two nearby initial conditions under the same cooling law"
      xDomain={[0, 4]} yDomain={[8, 21]} xLabel="time(min)" yLabel="state(K)"
      series={[20, 20.5].map((initial, index) => ({ points: odeSamples(0, 4, time => coolingState(time, initial).state),
        colour: index ? colour.comparison : colour.state }))} />
    <OdePlot label="Actual state separation and a larger common-domain bound"
      xDomain={[0, 4]} yDomain={[0, 1.2]} xLabel="time(min)" yLabel="separation(K)"
      series={[
        { points: odeSamples(0, 4, time => .5 * Math.exp(-.2 * time)) },
        { points: odeSamples(0, 4, time => .5 * Math.exp(.2 * time)), colour: colour.comparison, dashed: true },
      ]}>
      {({ x, y }) => <>
        <OdeLabel x={x(2.2)} y={y(.5 * Math.exp(.4)) + 26} colour={colour.comparison}>bound .5e^.2t</OdeLabel>
        <OdeLabel x={x(1.8)} y={y(.5 * Math.exp(-.4)) + 28}>actual .5e^−.2t</OdeLabel>
      </>}
    </OdePlot>
    <OdeTable label="Different statements at the same time" columns={['Time', 'Actual gap', 'Bound']}
      rows={[[2, f(.5 * Math.exp(-.4)), f(.5 * Math.exp(.4))]]} />
  </OdeFigure>;
}

export function FiniteLifetimeLab() {
  const [initial, setInitial] = useState(1);
  const [fraction, setFraction] = useState(.9);
  const boundary = 1 / initial, time = fraction * boundary;
  const current = blowupState(time, initial);
  const invalid = blowupState(1.1 * boundary, initial);
  return <FlowLab id="ode-E15" label="A smooth rate law with a finite solution lifetime">
    <OdeFigure id="E15" caption="The amber branch through the initial data ends before the singular time. The dashed pink negative branch lies in a disconnected interval and cannot continue that initial-value solution.">
      <OdePlot label="Two disconnected analytical branches and the selected valid state"
        xDomain={[0, 1.2 * boundary]} yDomain={[-45, 45]} xLabel="physical time t" yLabel="x=x₀/(1−x₀t)"
        references={[{ axis: 'x', value: boundary, colour: colour.comparison }, { value: 0 }]}
        series={[
          { points: odeSamples(0, .95 * boundary, t => blowupState(t, initial).state) },
          { points: odeSamples(1.05 * boundary, 1.2 * boundary, t => initial / (1 - initial * t)), colour: colour.comparison, dashed: true },
          { points: [[time, current.state]], dots: true, connect: false },
        ]}>
        {({ x, y }) => <>
          <OdeLabel x={x(.1 * boundary)} y={y(38)}>maximal interval: t&lt;{f(boundary)}</OdeLabel>
          <OdeLabel x={x(.08 * boundary)} y={y(-34)} colour={colour.comparison}>excluded disconnected branch</OdeLabel>
        </>}
      </OdePlot>
      <OdeTable label="A valid selection and a deliberately invalid sample"
        columns={['Sample', 'Time', 'State', 'IVP domain status']}
        rows={[
          ['selected', f(time), f(current.state), current.status],
          ['after singularity', f(invalid.time), 'undefined for this IVP', invalid.status],
        ]} />
    </OdeFigure>
    <FlowControls>
      <FlowSlider name="Initial x₀" value={initial} min={.5} max={2} step={.1} onChange={setInitial} />
      <FlowSlider name="Fraction of lifetime" value={fraction} min={0} max={.95} step={.05} onChange={setFraction} />
      <button type="button" onClick={() => { setInitial(1); setFraction(.9); }}>Reset</button>
    </FlowControls>
    <FlowReadout>The physical selection is <strong>t=fraction/x₀</strong>, always before the singularity. Doubling x₀ halves the lifetime; no value is clamped across its boundary.</FlowReadout>
  </FlowLab>;
}

export function UndefinedInitialTime() {
  return <OdeFigure id="E16" caption="Dividing tx′=1 by t gives a rate only on t≠0. The original equation would require 0=1 at the excluded starting time.">
    <OdeScene label="Disconnected time domains and the excluded initial time" height={240}>
      <OdeArrow x1={280} y1={100} x2={55} y2={100} colour={colour.input} />
      <OdeArrow x1={360} y1={100} x2={590} y2={100} colour={colour.input} />
      <circle cx={320} cy={100} r={8} fill="none" stroke={colour.comparison} strokeWidth={2} />
      <OdeLabel x={170} y={70} anchor="middle">t&lt;0</OdeLabel>
      <OdeLabel x={475} y={70} anchor="middle">t&gt;0</OdeLabel>
      <OdeLabel x={320} y={145} anchor="middle" colour={colour.comparison}>t₀=0 excluded</OdeLabel>
      <OdeLabel x={55} y={195}>x′=1/t on each interval; x=ln|t|+constant</OdeLabel>
      <OdeLabel x={55} y={228}>No classical interval through 0 satisfies tx′=1.</OdeLabel>
    </OdeScene>
  </OdeFigure>;
}

export function PreserveConstantBranches() {
  return <OdeFigure id="E17" caption="Before dividing by x(1−x/8), keep both roots. The two constant histories remain valid even though the separated nonzero-family derivation excludes them.">
    <OdePlot label="Logistic constant branches beside two separated nonconstant histories"
      xDomain={[0, 5]} yDomain={[0, 13]} xLabel="time" yLabel="state x"
      series={[
        { points: [[0, 0], [5, 0]], colour: colour.comparison },
        { points: [[0, 8], [5, 8]], colour: colour.input },
        ...[4, 12].map((initial, index) => ({ points: odeSamples(0, 5, t => logisticState(t, initial, .5, 8).state),
          colour: index ? colour.second : colour.state })),
      ]}>
      {({ x, y }) => <>
        <line x1={x(4.6)} y1={y(8)} x2={x(3)} y2={y(12)} stroke={colour.input} />
        <OdeLabel x={x(1)} y={y(12.4)} colour={colour.input}>x=8: division invalid, solution valid</OdeLabel>
        <OdeLabel x={x(1)} y={y(0) - 16} colour={colour.comparison}>x=0: division invalid, solution valid</OdeLabel>
      </>}
    </OdePlot>
  </OdeFigure>;
}

export function SeparatedCoordinate() {
  return <OdeFigure id="E18" caption="On either nonzero cooling branch, H=ln|x| changes by−.2t. The sign belongs to the chosen inverse branch; x=0 is a separate constant solution.">
    <OdePlot label="Log absolute state on its two nonzero branch domains"
      xDomain={[-45, 45]} yDomain={[1.3, 4]} xLabel="state x(K), zero excluded" yLabel="H=ln|x|"
      references={[{ axis: 'x', value: 0, colour: colour.comparison }]}
      series={[
        { points: odeSamples(-40, -5, value => Math.log(Math.abs(value))), colour: colour.second },
        { points: odeSamples(5, 40, value => Math.log(value)), colour: colour.state },
      ]} />
    <OdePlot label="Identical accumulated change in the transformed cooling coordinate"
      xDomain={[0, 3]} yDomain={[3, 3.8]} xLabel="time(min)" yLabel="H(x(t))"
      series={[{ points: odeSamples(0, 3, time => Math.log(40) - .2 * time), colour: colour.input }]} />
    <OdeTable label="The inverse branch preserves state sign" columns={['Initial branch', 'H(0)', 'H(1)−H(0)', 'x(1)']}
      rows={[[40, f(Math.log(40)), -.2, f(40 * Math.exp(-.2))], [-40, f(Math.log(40)), -.2, f(-40 * Math.exp(-.2))], [0, 'not defined', 'separate solution', 0]]} />
  </OdeFigure>;
}

export function ProductRuleStrips() {
  return <OdeFigure id="E19" caption="The original product is an area. A change in each factor creates one strip; the corner is second order. In the derivative limit, the two first-order contributions give μy′+μ′y.">
    <OdeScene label="A product rectangle, its two changed-factor strips and the second-order corner" height={330}>
      <rect x={150} y={100} width={240} height={150} fill={colour.state} fillOpacity={.12} stroke={colour.state} />
      <rect x={390} y={100} width={24} height={150} fill={colour.input} fillOpacity={.35} stroke={colour.input} />
      <rect x={150} y={85} width={240} height={15} fill={colour.comparison} fillOpacity={.4} stroke={colour.comparison} />
      <rect x={390} y={85} width={24} height={15} fill={colour.second} fillOpacity={.6} stroke={colour.second} />
      <OdeLabel x={270} y={170} anchor="middle">μy=6</OdeLabel>
      <OdeLabel x={270} y={285} anchor="middle">μ=2, Δμ=.2 →</OdeLabel>
      <OdeLabel x={30} y={170}>y=3</OdeLabel>
      <OdeArrow x1={260} y1={65} x2={260} y2={86} colour={colour.comparison} />
      <OdeLabel x={150} y={49} colour={colour.comparison}>μΔy=.6 (Δy=.3)</OdeLabel>
      <OdeArrow x1={510} y1={180} x2={412} y2={180} colour={colour.input} />
      <OdeLabel x={440} y={155} colour={colour.input}>yΔμ=.6</OdeLabel>
      <OdeArrow x1={510} y1={62} x2={413} y2={88} colour={colour.second} />
      <OdeLabel x={440} y={39} colour={colour.second}>ΔμΔy=.06</OdeLabel>
      <OdeLabel x={50} y={321}>finite difference has three pieces; derivative keeps two</OdeLabel>
    </OdeScene>
  </OdeFigure>;
}

export function WeightedScalarInput() {
  const weightedRates = odeSamples(0, 1, time => (1 + time) ** 3);
  return <OdeFigure id="E20" caption="For y′+2y/(1+t)=1+t, multiplication by μ=(1+t)² makes μy accumulate the weighted input. Divide the whole accumulated value by μ(1)=4, including the initial contribution.">
    <OdePlot label="Weighted forcing μ(s)g(s) and its accumulated signed area"
      xDomain={[0, 1]} yDomain={[0, 9]} xLabel="input time s, domain s&gt;−1" yLabel="μ(s)g(s)=(1+s)³"
      series={[{ points: weightedRates, colour: colour.input }]}>
      {({ x, y }) => <>
        <polygon points={[[0, 0], ...weightedRates, [1, 0]].map(point => `${x(point[0])},${y(point[1])}`).join(' ')}
          fill={colour.input} fillOpacity={.15} />
        <OdeLabel x={x(.45)} y={y(1.5)} anchor="middle">integral15/4</OdeLabel>
      </>}
    </OdePlot>
    <OdeTable label="Initial term and weighted input before dividing back"
      columns={['Time', 'μ(0)y₀', 'Weighted integral', 'μ(t)y(t)', 'μ(t)', 'y(t)']}
      rows={[[1, 1, '15/4', '19/4', 4, '19/16']]} />
  </OdeFigure>;
}

export function AffineSolutionFamily() {
  return <OdeFigure id="E21" caption="Amber and cyan solve y′+y=2. Their difference is homogeneous; their sum is forced by 4. The particular solution 2 shifts the homogeneous family.">
    <OdePlot label="Two forced histories, their homogeneous difference and their doubly forced sum"
      xDomain={[0, 4]} yDomain={[0, 9]} xLabel="time" yLabel="state y"
      series={[
        { points: odeSamples(0, 4, t => 2 + 3 * Math.exp(-t)) },
        { points: odeSamples(0, 4, t => 2 + Math.exp(-t)), colour: colour.input },
        { points: odeSamples(0, 4, t => 2 * Math.exp(-t)), colour: colour.comparison, dashed: true },
        { points: odeSamples(0, 4, t => 4 + 4 * Math.exp(-t)), colour: colour.second },
      ]} />
    <OdeTable label="The linear operator tracks forcing, not just path addition"
      columns={['History', 'Initial value', 'y′+y', 'Role']}
      rows={[
        ['amber y₁', 5, 2, 'same forced equation'],
        ['cyan y₂', 3, 2, 'same forced equation'],
        ['pink y₁−y₂', 2, 0, 'homogeneous difference'],
        ['violet y₁+y₂', 8, 4, 'doubled forcing'],
      ]} />
  </OdeFigure>;
}

export function ReciprocalSubstitution() {
  const end = Math.log(2);
  return <OdeFigure id="E22" caption="The nonzero starting value y₀=.5 maps to z₀=2. At t=ln 2, z=3 maps back to y=1/3. The original y=0 solution lies outside this reciprocal coordinate.">
    <OdeScene label="Corresponding nonzero states on the y and reciprocal z coordinates" height={300}>
      <line x1={80} y1={70} x2={580} y2={70} stroke={colour.axis} />
      <line x1={80} y1={230} x2={580} y2={230} stroke={colour.axis} />
      <OdeLabel x={30} y={76}>y</OdeLabel><OdeLabel x={30} y={236}>z</OdeLabel>
      {[[.5, 2, colour.state], [1 / 3, 3, colour.input]].map(([state, transformed, identity]) => <g key={state}>
        <circle cx={80 + state * 800} cy={70} r={5} fill={identity} />
        <circle cx={80 + transformed * 120} cy={230} r={5} fill={identity} />
        <OdeArrow x1={80 + state * 800} y1={85} x2={80 + transformed * 120} y2={215} colour={identity} />
        <OdeLabel x={80 + state * 800} y={45} anchor="middle" colour={identity}>{f(state, 3)}</OdeLabel>
        <OdeLabel x={80 + transformed * 120} y={268} anchor="middle" colour={identity}>{transformed}</OdeLabel>
      </g>)}
      <circle cx={80} cy={70} r={6} fill="none" stroke={colour.comparison} />
      <OdeLabel x={80} y={110} colour={colour.comparison}>0 excluded</OdeLabel>
      <OdeLabel x={470} y={165}>z=1/y</OdeLabel>
    </OdeScene>
    <OdeTable label="Original nonlinear and transformed linear rates at corresponding states"
      columns={['Time', 'y', 'y′=y²−y', 'z', 'z′=z−1']}
      rows={[0, end].map(t => { const z = 1 + Math.exp(t), y = 1 / z; return [f(t), f(y), f(y * y - y), f(z), f(z - 1)]; })} />
  </OdeFigure>;
}

export function ExactPotentialCurve() {
  const time = .5, state = (-time + Math.sqrt(4 - 3 * time * time)) / 2;
  const m = 2 * time + state, n = time + 2 * state;
  const contour = odeSamples(0, 2 * Math.PI, angle => angle, 128).map(([angle]) => {
    const t = 2 * Math.cos(angle) / Math.sqrt(3);
    return [t, Math.sin(angle) - t / 2];
  });
  return <OdeFigure id="E23" caption="The level F=t²+ty+y²=1 contains the selected initial data (0,1). Its gradient is perpendicular to the local tangent. A local y(t) branch requires N=t+2y≠0.">
    <OdePlot label="Exact potential level, selected initial point and perpendicular gradient/tangent"
      xDomain={[-1.5, 1.5]} yDomain={[-1.5, 1.5]} height={640} xLabel="time t" yLabel="state y"
      series={[{ points: contour }, { points: [[0, 1], [time, state]], dots: true, connect: false, colour: colour.comparison }]}>
      {({ x, y }) => <>
        <OdeArrow x1={x(time)} y1={y(state)} x2={x(time + .25 * m)} y2={y(state + .25 * n)} colour={colour.input} />
        <OdeArrow x1={x(time)} y1={y(state)} x2={x(time + .2 * n)} y2={y(state - .2 * m)} colour={colour.second} />
        <line x1={x(0)} y1={y(1)} x2={x(-.25)} y2={y(1.25)} stroke={colour.comparison} />
        <OdeLabel x={x(-.25)} y={y(1.32)} anchor="end" colour={colour.comparison}>initial (0,1)</OdeLabel>
        <OdeLabel x={x(.3)} y={y(.48)} anchor="end" colour={colour.comparison}>t=.5</OdeLabel>
        <OdeLabel x={x(-1.3)} y={y(-1.15)} colour={colour.input}>gradient(M,N)</OdeLabel>
        <OdeLabel x={x(-1.3)} y={y(-1.35)} colour={colour.second}>tangent(N,−M)</OdeLabel>
      </>}
    </OdePlot>
    <OdeTable label="Actual local branch and rate at t=.5"
      columns={['t', 'y', 'F', 'M', 'N', 'y′=−M/N']}
      rows={[[time, f(state), f(time * time + time * state + state * state), f(m), f(n), f(-m / n)]]} />
  </OdeFigure>;
}

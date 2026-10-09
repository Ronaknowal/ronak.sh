import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout } from './LessonFlow.jsx';
import { scalarPulse } from '../../data/ordinary-differential-equations-reading-models.js';
import { SpringObject } from './OrdinaryDifferentialEquationsMotionDrawings.jsx';
import { OdeFigure, OdeScene, OdePlot, OdeLabel, OdeArrow, OdeTable,
  odeSamples, odeFormat as f, odeColours as colour } from './OrdinaryDifferentialEquationsReadingPrimitives.jsx';

export function PropagatedInputTimeline() {
  const impulses = [{ time: .5, mass: 1 }, { time: 1.5, mass: 1 }];
  return <OdeFigure id="E41" caption="In y′=−y+b, each ideal unit impulse is a jump of 1 at its own time. Its later contribution decays for the remaining age t−s. These impulse responses illustrate the kernel; a continuous input is accumulated by integrating it.">
    <OdePlot label="Two equal impulse responses and the separately evolved initial state"
      xDomain={[0, 2]} yDomain={[0, 1.25]} xLabel="physical time t" yLabel="individual state contribution"
      series={[{ points: odeSamples(0, 2, time => Math.exp(-time)), colour: colour.comparison },
        ...impulses.map((impulse, index) => ({ points: odeSamples(impulse.time, 2, time => Math.exp(-(time - impulse.time))), colour: index ? colour.second : colour.input }))]}>
      {({ x, y }) => <>{impulses.map((impulse, index) => <g key={impulse.time}>
        <OdeArrow x1={x(impulse.time)} y1={y(0)} x2={x(impulse.time)} y2={y(1)} colour={index ? colour.second : colour.input} />
        <OdeLabel x={x(impulse.time) + 8} y={y(1.1)}>s={impulse.time}</OdeLabel>
      </g>)}</>}
    </OdePlot>
    <OdeTable label="Equal inputs have different ages at the same final time T=2"
      columns={['Contribution', 'Age', 'Final value']} rows={[
        ['initial y₀=1 (pink)', 2, f(Math.exp(-2))],
        ...impulses.map(impulse => [`unit impulse at s=${impulse.time}`, 2 - impulse.time, f(Math.exp(-(2 - impulse.time)))])]} />
  </OdeFigure>;
}

function PulseDrawing({ height = 2, start = 0, comparison = false }) {
  const selected = scalarPulse(2, height, start);
  return <>
    <OdePlot label="Held pulse height and its exact propagated interval contributions"
      xDomain={[0, 2]} yDomain={[0, 4.5]} xLabel="input time s" yLabel="input u(s)"
      series={[{ points: [[0, 0], [start, 0], [start, height], [start + .5, height], [start + .5, 0], [2, 0]], colour: colour.input }]}>
      {({ x, y }) => <>{selected.slabs.map((slab, index) => <rect key={index} x={x(slab.left)} y={y(height)}
        width={x(slab.right) - x(slab.left)} height={y(0) - y(height)} fill={colour.input}
        fillOpacity={index % 2 ? .18 : .09} stroke={colour.input} strokeOpacity={.35} />)}</>}
    </OdePlot>
    <OdePlot label="The exact state response before, during and after the pulse"
      xDomain={[0, 2]} yDomain={[0, 1.8]} xLabel="physical time t" yLabel="state y(t), y₀=0"
      series={[{ points: odeSamples(0, 2, time => scalarPulse(time, height, start).contribution) },
        ...(comparison ? [{ points: odeSamples(0, 2, time => scalarPulse(time, height, 1).contribution), colour: colour.comparison, dashed: true }] : [])]} />
    <OdeTable label="Each cyan interval contributes its exact integral at T=2; the drawn rectangles show input, not a quadrature approximation"
      columns={['Input interval', 'Age of its right end', 'Exact contribution at T=2']}
      rows={[...selected.slabs.map(slab => [`[${f(slab.left, 2)}, ${f(slab.right, 2)}]`, f(2 - slab.right, 2), f(slab.contribution)]),
        ['Sum of five contributions', 'initial contribution 0', f(selected.contribution)],
        ...(comparison ? [['pink pulse starting at 1', 'same height and width', f(scalarPulse(2, height, 1).contribution)]] : [])]} />
  </>;
}

export function SeparateInputIntervals() {
  return <OdeFigure id="E42" caption="The input is 2 on [0,.5] and 0 afterwards. At .5 the response is 2(1−e⁻⁰·⁵); at 1 it is that accumulated response multiplied by e⁻⁰·⁵. The later zero-input interval adds 0 while evolving what is already stored.">
    <PulseDrawing />
    <OdeTable label="Two held intervals, evaluated at t=1" columns={['Term', 'Value']}
      rows={[
        ['initial response', 0], ['first interval contribution', f(2 * (Math.exp(-.5) - Math.exp(-1)))],
        ['second interval contribution', 0], ['total y(1)', f(scalarPulse(1).contribution)],
        ['state at switching time y(.5)', f(scalarPulse(.5).contribution)],
      ]} />
  </OdeFigure>;
}

export function ResonantAccumulation() {
  const time = Math.PI / 4, position = time * Math.sin(2 * time) / 4;
  const velocity = Math.sin(2 * time) / 4 + time * Math.cos(2 * time) / 2;
  return <OdeFigure id="E43" caption="A mass of 1 and spring stiffness 4 have angular frequency 2. The input cos(2t) repeats at that frequency. With zero initial position and velocity, q=t sin(2t)/4 has the growing envelope ±t/4. This undamped displacement example does not locate every damped response peak.">
    <SpringObject position={position} velocity={velocity} damping={0} />
    <OdePlot label="Matched force cycles and the resulting accumulating displacement"
      xDomain={[0, 8]} yDomain={[-2.2, 2.2]} xLabel="physical time t" yLabel="displacement q (m)"
      references={[{ value: 0 }]} series={[
        { points: odeSamples(0, 8, t => t * Math.sin(2 * t) / 4, 200) },
        { points: [[0, 0], [8, 2]], colour: '#888', dashed: true },
        { points: [[0, 0], [8, -2]], colour: '#888', dashed: true },
      ]} />
    <OdePlot label="The actual forcing frequency and phase" xDomain={[0, 8]} yDomain={[-1.2, 1.2]}
      xLabel="physical time t" yLabel="force cos(2t) (N)"
      series={[{ points: odeSamples(0, 8, t => Math.cos(2 * t), 200), colour: colour.input }]} />
    <OdePlot label="The resonantly driven spring follows an expanding phase path"
      xDomain={[-2.5, 2.5]} yDomain={[-4.5, 4.5]} xLabel="position q (m)" yLabel="velocity v (m/time)"
      series={[{ points: odeSamples(0, 8, t => t).map(([t]) => [t * Math.sin(2 * t) / 4, Math.sin(2 * t) / 4 + t * Math.cos(2 * t) / 2]) }]} />
  </OdeFigure>;
}

export function PulseTimingLab() {
  const [height, setHeight] = useState(2), [start, setStart] = useState(0);
  return <FlowLab id="ode-E44" label="Earlier and later held inputs age differently before T=2">
    <OdeFigure id="E44"><PulseDrawing height={height} start={start} comparison /></OdeFigure>
    <FlowControls>
      <FlowSlider name="Pulse height" value={height} min={0} max={4} step={.25} onChange={setHeight} />
      <FlowSlider name="Pulse start" value={start} min={0} max={1.5} step={.1} onChange={setStart} />
      <button type="button" onClick={() => { setHeight(2); setStart(0); }}>Reset</button>
    </FlowControls>
    <FlowReadout>Width stays .5 and T stays 2. Amber is the selected state; pink dashed is the same-height pulse starting at 1. A zero-height pulse has zero contribution throughout.</FlowReadout>
  </FlowLab>;
}

export function AugmentedHeldInput() {
  return <OdeFigure id="E45" caption="For x′=u with u held constant, extend the state to (x,u). Its generator is [0,1;0,0], so its finite transition over h=.5 is [1,.5;0,1]. The upper-right .5 is the integrated input map Γ, even though A=0 has no inverse.">
    <OdeScene label="Stored position receives a held input while the input coordinate stays fixed" height={330}>
      <rect x={65} y={80} width={160} height={120} fill={colour.state} fillOpacity={.1} stroke={colour.state} />
      <OdeLabel x={145} y={125} anchor="middle">state x</OdeLabel>
      <OdeLabel x={145} y={165} anchor="middle" colour={colour.state}>0 → 1</OdeLabel>
      <rect x={405} y={80} width={160} height={120} fill={colour.input} fillOpacity={.1} stroke={colour.input} />
      <OdeLabel x={485} y={125} anchor="middle">held input u</OdeLabel>
      <OdeLabel x={485} y={165} anchor="middle" colour={colour.input}>2 → 2</OdeLabel>
      <OdeArrow x1={395} y1={115} x2={235} y2={115} colour={colour.input} />
      <OdeLabel x={315} y={85} anchor="middle">x′=u=2</OdeLabel>
      <OdeLabel x={65} y={250}>Over .5 time: Γu=.5×2=1; u′=0.</OdeLabel>
      <OdeLabel x={65} y={290}>The augmented transition acts on both coordinates.</OdeLabel>
    </OdeScene>
    <OdeTable label="Actual augmented matrix entries" columns={['Block', 'Generator', 'Finite transition']}
      rows={[['state-to-state', 'A=0', 'Φ=1'], ['input-to-state', 'B=1', 'Γ=.5'], ['state-to-input', 0, 0], ['input-to-input', 0, 1]]} />
  </OdeFigure>;
}

export function HeldAccelerationAreas() {
  return <OdeFigure id="E46" caption="For q′=v and v′=u, hold u=2 over h=.5 from (q,v)=(0,0). Integrating acceleration gives v=1; integrating the growing velocity gives q=.25. The exact input map is Γ=(h²/2,h)=(.125,.5).">
    <OdePlot label="Acceleration is a rectangle whose integral is the velocity increment"
      xDomain={[0, .5]} yDomain={[0, 2.5]} xLabel="elapsed time" yLabel="acceleration u (m/time²)"
      series={[{ points: [[0, 2], [.5, 2]], colour: colour.input }]}>
      {({ x, y }) => <><rect x={x(0)} y={y(2)} width={x(.5) - x(0)} height={y(0) - y(2)} fill={colour.input} fillOpacity={.12} />
        <OdeLabel x={x(.25)} y={y(1)} anchor="middle">area 2×.5=1</OdeLabel></>}
    </OdePlot>
    <OdePlot label="Velocity grows linearly so its integral is a triangular displacement"
      xDomain={[0, .5]} yDomain={[0, 1.25]} xLabel="elapsed time" yLabel="velocity v (m/time)"
      series={[{ points: [[0, 0], [.5, 1]], colour: colour.second }]}>
      {({ x, y }) => <><polygon points={`${x(0)},${y(0)} ${x(.5)},${y(1)} ${x(.5)},${y(0)}`} fill={colour.second} fillOpacity={.12} />
        <OdeLabel x={x(.35)} y={y(.25)} anchor="middle">area .25</OdeLabel></>}
    </OdePlot>
    <OdeTable label="Both coordinates receive the same held input through different integrals"
      columns={['Object', 'Exact value']} rows={[
        ['Φ', '[1,.5;0,1]'], ['Γ', '(.125,.5)'], ['Γ×u', '(.25,1)'], ['final (q,v)', '(.25,1)'],
      ]} />
  </OdeFigure>;
}

import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout } from './LessonFlow.jsx';
import { linearSystemState } from '../../data/ordinary-differential-equations-models.js';
import { CoupledCompartments } from './OrdinaryDifferentialEquationsLinearDrawings.jsx';
import {
  OdeFigure, OdeScene, OdePlot, OdeLabel, OdeArrow, OdeTable,
  odeSamples, odeFormat as f, odeColours as colour,
} from './OrdinaryDifferentialEquationsReadingPrimitives.jsx';

const norm = vector => Math.hypot(...vector);
const vectorText = vector => `(${vector.map(value => f(value, 4)).join(', ')})`;

export function StabilityPortraits() {
  const cases = [
    ['negative real parts', [[-1, 0], [0, -2]], 'asymptotic decay'],
    ['one positive real part', [[-1, 0], [0, 1]], 'unstable direction'],
    ['semisimple imaginary pair', [[0, -1], [1, 0]], 'bounded rotation'],
    ['zero Jordan block', [[0, 1], [0, 0]], 'unbounded shear'],
  ];
  const starts = [[1, 0], [0, 1], [1, 1]];
  const identities = [colour.state, colour.second, colour.input];
  return <OdeFigure id="E36" caption="All four panels use the same axes −4 to 4 and the same displayed time 0 to 1.25. Amber/violet/cyan preserve the initial vectors e₁,e₂,(1,1). The finite paths illustrate the mechanisms; the eigenvalue and Jordan conditions establish the long-time classification.">
    <OdeScene label="Four actual linear flows with growing, decaying, rotating and shearing directions" width={760} height={720}>
      {cases.map(([title, matrix, classification], index) => {
        const column = index % 2, row = Math.floor(index / 2);
        const originX = 190 + column * 380, originY = 180 + row * 360;
        const x = value => originX + value * 30, y = value => originY - value * 30;
        return <g key={title}>
          <OdeLabel x={25 + column * 380} y={27 + row * 360}>{title}</OdeLabel>
          <line x1={x(-4)} x2={x(4)} y1={y(0)} y2={y(0)} stroke={colour.axis} />
          <line x1={x(0)} x2={x(0)} y1={y(-4)} y2={y(4)} stroke={colour.axis} />
          <OdeLabel x={x(4)} y={y(0) + 23} anchor="middle">4</OdeLabel>
          <OdeLabel x={x(-4)} y={y(0) + 23} anchor="middle">−4</OdeLabel>
          <OdeLabel x={x(0) - 12} y={y(4) + 5} anchor="end">4</OdeLabel>
          <OdeLabel x={x(0) - 12} y={y(-4) + 5} anchor="end">−4</OdeLabel>
          <OdeLabel x={x(4)} y={y(0) - 12}>x₁</OdeLabel>
          <OdeLabel x={x(0) + 12} y={y(4) + 5}>x₂</OdeLabel>
          {starts.map((initial, start) => {
            const points = odeSamples(0, 1.25, t => t).map(([t]) => linearSystemState(matrix, initial, t).state);
            const selected = linearSystemState(matrix, initial, .6);
            return <g key={start}>
              <polyline points={points.map(point => `${x(point[0])},${y(point[1])}`).join(' ')}
                fill="none" stroke={identities[start]} strokeWidth={2} />
              <circle cx={x(initial[0])} cy={y(initial[1])} r={3} fill={identities[start]} />
              <OdeArrow x1={x(selected.state[0])} y1={y(selected.state[1])}
                x2={x(selected.state[0] + .2 * selected.derivative[0])}
                y2={y(selected.state[1] + .2 * selected.derivative[1])} colour={identities[start]} />
            </g>;
          })}
          <OdeLabel x={25 + column * 380} y={335 + row * 360}>{classification}</OdeLabel>
        </g>;
      })}
    </OdeScene>
    <OdeTable label="Conditions apply to every initial state, beyond the illustrated finite window"
      columns={['Example', 'Relevant structure', 'Long-time statement']}
      rows={[
        ['diagonal(−1,−2)', 'both real parts negative', 'all states tend to 0'],
        ['diagonal(−1,1)', 'a positive real part', 'some states grow'],
        ['rotation', 'imaginary-axis modes semisimple', 'bounded, not decaying'],
        ['nilpotent shear', 'nontrivial Jordan block at 0', 'linear growth exists'],
      ]} />
  </OdeFigure>;
}

export function HiddenGrowingMode() {
  const matrix = [[-1, 0], [0, 1]];
  return <OdeFigure id="E37" caption="The start (1,0) contains no growing component. The nearby start (1,.01) does. Their first coordinates agree, so observing only that coordinate hides the unstable mode.">
    <OdePlot label="One stable-direction trajectory and a nearby trajectory containing the growing mode"
      xDomain={[-.1, 1.6]} yDomain={[-.1, 1.6]} height={640}
      xLabel="first coordinate x₁" yLabel="second coordinate x₂"
      series={[[1, 0], [1, .01]].map((initial, index) => ({
        points: odeSamples(0, 5, t => t).map(([t]) => linearSystemState(matrix, initial, t).state),
        colour: index ? colour.comparison : colour.state,
      }))}>
      {({ x, y }) => <>
        <OdeArrow x1={x(.85)} y1={y(0)} x2={x(.25)} y2={y(0)} colour={colour.state} />
        <OdeArrow x1={x(0)} y1={y(.25)} x2={x(0)} y2={y(1.3)} colour={colour.second} />
        <OdeLabel x={x(.4)} y={y(.25)}>decaying e₁ direction</OdeLabel>
        <OdeLabel x={x(.15)} y={y(1.3)} colour={colour.second}>growing e₂ direction</OdeLabel>
      </>}
    </OdePlot>
    <OdeTable label="A small initial component becomes a different full state at t=5"
      columns={['Initial', 'x₁(5)', 'x₂(5)']}
      rows={[[vectorText([1, 0]), f(Math.exp(-5)), 0], [vectorText([1, .01]), f(Math.exp(-5)), f(.01 * Math.exp(5))]]} />
  </OdeFigure>;
}

export function StableTransientShape() {
  const matrix = [[-1, 4], [0, -1]], selected = linearSystemState(matrix, [0, 1], .5);
  const circle = odeSamples(0, 2 * Math.PI, angle => angle, 128).map(([angle]) => [Math.cos(angle), Math.sin(angle)]);
  const transformed = circle.map(initial => linearSystemState(matrix, initial, .5).state);
  return <OdeFigure id="E38" caption="The grey unit circle is sheared and decayed into the cyan ellipse. Some images lie outside the original circle even though both eigenvalues are −1. The amber path eventually returns to zero; its Euclidean length need not decrease monotonically.">
    <OdePlot label="A stable sheared flow, its image of the unit circle and one exact trajectory"
      xDomain={[-1.8, 1.8]} yDomain={[-1.8, 1.8]} height={640}
      xLabel="coordinate x₁" yLabel="coordinate x₂"
      series={[
        { points: circle, colour: '#777', dashed: true },
        { points: transformed, colour: colour.input },
        { points: odeSamples(0, 3, t => t).map(([t]) => linearSystemState(matrix, [0, 1], t).state) },
        { points: [selected.state], dots: true, connect: false },
      ]}>
      {({ x, y }) => <>
        <line x1={x(selected.state[0])} y1={y(selected.state[1])} x2={x(.8)} y2={y(1.45)} stroke={colour.state} />
        <OdeLabel x={x(.8)} y={y(1.55)} anchor="end">t=.5,norm={f(norm(selected.state), 4)}</OdeLabel>
      </>}
    </OdePlot>
    <OdeTable label="The same initial unit vector in the declared Euclidean norm"
      columns={['Time', 'State', 'Length']}
      rows={[0, .5, 1].map(time => { const state = linearSystemState(matrix, [0, 1], time).state; return [time, vectorText(state), f(norm(state))]; })} />
  </OdeFigure>;
}

function angleStart(angle) {
  if (angle === 0) return [1, 0];
  if (angle === 90) return [0, 1];
  if (angle === 180) return [-1, 0];
  return [Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180)];
}

export function TransientGainLab() {
  const [coupling, setCoupling] = useState(4);
  const [angle, setAngle] = useState(90);
  const [time, setTime] = useState(.5);
  const initial = angleStart(angle), matrix = [[-1, coupling], [0, -1]];
  const coupled = linearSystemState(matrix, initial, time);
  const uncoupled = linearSystemState([[-1, 0], [0, -1]], initial, time);
  const length = norm(coupled.state);
  const lengthRate = coupled.state.reduce((sum, value, index) => sum + value * coupled.derivative[index], 0) / length;
  return <FlowLab id="ode-E39" label="A common initial direction reveals or removes transient gain">
    <OdeFigure id="E39">
      <OdePlot label="Matched coupled and uncoupled complete-state paths"
        xDomain={[-3, 3]} yDomain={[-3, 3]} height={640} xLabel="coordinate x₁" yLabel="coordinate x₂"
        series={[
          { points: odeSamples(0, 3, t => t).map(([t]) => linearSystemState(matrix, initial, t).state) },
          { points: odeSamples(0, 3, t => t).map(([t]) => linearSystemState([[-1, 0], [0, -1]], initial, t).state), colour: colour.comparison, dashed: true },
          { points: [coupled.state], dots: true, connect: false },
          { points: [uncoupled.state], dots: true, connect: false, colour: colour.comparison },
        ]} />
      <OdePlot label="Matched Euclidean lengths against the same physical time"
        xDomain={[0, 3]} yDomain={[0, 3]} xLabel="time" yLabel="Euclidean length"
        references={[{ value: 1, colour: '#777' }]}
        series={[
          { points: odeSamples(0, 3, t => norm(linearSystemState(matrix, initial, t).state)) },
          { points: odeSamples(0, 3, t => Math.exp(-t)), colour: colour.comparison, dashed: true },
        ]} />
      <OdeTable label="Matched initial data, current lengths and the coupled length rate"
        columns={['Initial unit vector', 'Time', 'Coupled length', 'b=0 length', 'Coupled length rate']}
        rows={[[vectorText(initial), time, f(length), f(norm(uncoupled.state)), f(lengthRate)]]} />
    </OdeFigure>
    <FlowControls>
      <FlowSlider name="Coupling b" value={coupling} min={0} max={6} step={.1} onChange={setCoupling} />
      <FlowSlider name="Initial angle θ(degrees)" value={angle} min={0} max={180} step={1} onChange={setAngle} />
      <FlowSlider name="Selected time" value={time} min={0} max={3} step={.05} onChange={setTime} />
      <button type="button" onClick={() => { setCoupling(4); setAngle(90); setTime(.5); }}>Reset</button>
    </FlowControls>
    <FlowReadout>Amber uses coupling b; pink uses b=0 with identical initial data and time. Both flows eventually decay. A positive current length rate describes this direction and norm, rather than all starts.</FlowReadout>
  </FlowLab>;
}

export function ConservedAmount() {
  const matrix = [[-1, 2], [1, -2]];
  const rows = [0, .25, .5, 1, 3].map(time => linearSystemState(matrix, [9, 0], time));
  return <OdeFigure id="E40" caption="The rates cancel in x₁+x₂ because (1,1)A=0. The same-total line remains fixed while transfers approach (6,3). At equilibrium both opposing transfers are 6, so net rates vanish without transfer stopping.">
    <CoupledCompartments first={6} second={3} />
    <OdePlot label="The complete trajectory remains on the conserved total9 line"
      xDomain={[0, 10]} yDomain={[0, 10]} height={640}
      xLabel="amount x₁(units)" yLabel="amount x₂(units)"
      series={[
        { points: [[0, 9], [9, 0]], colour: '#777', dashed: true },
        { points: odeSamples(0, 3, t => t).map(([t]) => linearSystemState(matrix, [9, 0], t).state) },
        { points: [[6, 3]], dots: true, connect: false, colour: colour.comparison },
      ]}>
      {({ x, y }) => <>
        <OdeLabel x={x(.8)} y={y(8.8)}>x₁+x₂=9</OdeLabel>
        <OdeLabel x={x(5.4)} y={y(4)} colour={colour.comparison}>equilibrium (6,3)</OdeLabel>
      </>}
    </OdePlot>
    <OdeTable label="Literal evolving amounts preserve the same total"
      columns={['Time', 'x₁', 'x₂', 'Total']}
      rows={rows.map(row => [row.time, f(row.state[0]), f(row.state[1]), f(row.state[0] + row.state[1])])} />
  </OdeFigure>;
}

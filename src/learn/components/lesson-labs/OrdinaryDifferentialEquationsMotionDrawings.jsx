import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowReadout } from './LessonFlow.jsx';
import { oscillatorState } from '../../data/ordinary-differential-equations-models.js';
import {
  OdeFigure, OdeScene, OdePlot, OdeLabel, OdeArrow, OdeTable,
  odeSamples, odeFormat as f, odeColours as colour,
} from './OrdinaryDifferentialEquationsReadingPrimitives.jsx';

export function SpringObject({ position = 1, velocity = -.5, damping = 2 }) {
  const left = 340 + 40 * position, center = left + 40;
  const springForce = -4 * position, dampingForce = -damping * velocity;
  const coil = Array.from({ length: 13 }, (_, index) => [
    95 + index * (left - 110) / 12,
    index === 0 || index === 12 ? 135 : 135 + (index % 2 ? 12 : -12),
  ]);
  return <OdeScene label="Wall, spring, damper and one complete displacement-velocity state" height={345}>
    <line x1={65} y1={85} x2={65} y2={245} stroke="#aaa" strokeWidth={5} />
    <line x1={65} y1={135} x2={95} y2={135} stroke={colour.state} />
    <polyline points={coil.map(point => point.join(',')).join(' ')} fill="none" stroke={colour.state} strokeWidth={2} />
    <line x1={left - 15} y1={135} x2={left} y2={135} stroke={colour.state} />
    <rect x={left} y={110} width={80} height={75} rx={5} fill={colour.state} fillOpacity={.12} stroke={colour.state} />
    <OdeLabel x={center} y={153} anchor="middle">m=1 kg</OdeLabel>
    <line x1={65} y1={215} x2={155} y2={215} stroke={colour.second} />
    <path d={`M155 198V232H235V198 M190 215H${center}V185`} fill="none" stroke={colour.second} strokeWidth={2} />
    <OdeLabel x={135} y={103}>k=4 N/m</OdeLabel>
    <OdeLabel x={110} y={270}>c={f(damping)} N·s/m</OdeLabel>
    <line x1={380} y1={80} x2={380} y2={305} stroke="#777" strokeDasharray="4 4" />
    <OdeArrow x1={380} y1={290} x2={center} y2={290} colour={colour.state} />
    <OdeLabel x={420} y={315} colour={colour.state}>q={f(position, 3)} m</OdeLabel>
    {velocity !== 0 && <OdeArrow x1={center} y1={65} x2={center + velocity * 40} y2={65} colour={colour.second} />}
    <OdeLabel x={300} y={35} colour={colour.second}>velocity v={f(velocity, 3)} m/s</OdeLabel>
    <OdeArrow x1={center} y1={95} x2={center + springForce * 15} y2={95} colour={colour.state} />
    <OdeLabel x={440} y={99} colour={colour.state}>spring −kq</OdeLabel>
    <OdeArrow x1={center} y1={245} x2={center + dampingForce * 8} y2={245} colour={colour.second} />
    <OdeLabel x={440} y={228} colour={colour.second}>damper −cv</OdeLabel>
    <OdeLabel x={30} y={336}>spring −kq={f(springForce, 3)} N; damper −cv={f(dampingForce, 3)} N</OdeLabel>
  </OdeScene>;
}

export function CompleteMotionState() {
  return <OdeFigure id="E24" caption="The spring senses displacement and the damper senses velocity. Equal positions with different velocities therefore produce different future motion. With no external force, both values determine the state rate.">
    <SpringObject />
    <OdeTable label="One complete unforced state and its two rate coordinates"
      columns={['q(m)', 'v(m/s)', 'q′(m/s)', 'v′(m/s²)', 'Needed initial numbers']}
      rows={[[1, -.5, -.5, -3, 'q₀ and v₀']]} />
  </OdeFigure>;
}

export function DampingRoots() {
  const cases = [
    { damping: 0, roots: [[0, 2], [0, -2]], label: 'grey undamped: ±2i', colour: '#ddd' },
    { damping: 2, roots: [[-1, Math.sqrt(3)], [-1, -Math.sqrt(3)]], label: 'amber underdamped: −1±√3i', colour: colour.state },
    { damping: 4, roots: [[-2, 0]], label: 'cyan critical: repeated −2', colour: colour.input },
    { damping: 6, roots: [[-3 + Math.sqrt(5), 0], [-3 - Math.sqrt(5), 0]], label: 'violet overdamped: −3±√5', colour: colour.second },
  ];
  return <OdeFigure id="E25" caption="The same m=1,k=4 and q₀=1,v₀=0 produce different histories as c changes. Complex-conjugate roots correspond to real oscillation; the repeated critical root produces a time-times-exponential term.">
    <OdePlot label="Characteristic roots of λ²+cλ+4 in the real-imaginary plane"
      xDomain={[-6, .5]} yDomain={[-2.5, 2.5]} height={519}
      xLabel="real part Reλ(1/s)" yLabel="imaginary part Imλ(1/s)"
      references={[{ value: 0 }, { axis: 'x', value: 0 }]}
      series={cases.map(item => ({ points: item.roots, colour: item.colour, dots: true, connect: false }))} />
    <OdePlot label="Matching full real displacement-velocity paths for the four damping regimes"
      xDomain={[-1.1, 1.1]} yDomain={[-2.2, 2.2]} xLabel="displacement q(m)" yLabel="velocity v(m/s)"
      series={cases.map(item => ({ points: odeSamples(0, 3, t => t).map(([t]) => {
        const state = oscillatorState(t, item.damping);
        return [state.position, state.velocity];
      }), colour: item.colour }))}>
      {({ x, y }) => cases.map(item => {
        const state = oscillatorState(.4, item.damping);
        return <OdeArrow key={item.damping} x1={x(state.position)} y1={y(state.velocity)}
          x2={x(state.position + .1 * state.velocity)} y2={y(state.velocity + .1 * state.derivative[1])}
          colour={item.colour} />;
      })}
    </OdePlot>
    <OdeTable label="Root identities continue into the matching histories"
      columns={['c(N·s/m)', 'Roots and colour', 'Discriminant c²−16', 'q(1)']}
      rows={cases.map(item => [item.damping, item.label, item.damping ** 2 - 16, f(oscillatorState(1, item.damping).position)])} />
  </OdeFigure>;
}

function MotionTraces({ damping, initialVelocity, time }) {
  const rows = odeSamples(0, 3, t => t).map(([t]) => oscillatorState(t, damping, 1, initialVelocity));
  const selected = oscillatorState(time, damping, 1, initialVelocity);
  const x = t => 85 + t * 170;
  const q = value => 110 - value * 48;
  const v = value => 290 - value * 23;
  return <OdeScene label="Aligned displacement and velocity time traces with independent unit scales" height={415}>
    {[[q, 'q(m)', 1.5, -1.5, colour.state], [v, 'v(m/s)', 3, -3, colour.second]].map(([y, label, maximum, minimum, identity]) => <g key={label}>
      <line x1={x(0)} x2={x(3)} y1={y(minimum)} y2={y(minimum)} stroke={colour.axis} />
      <line x1={x(0)} x2={x(0)} y1={y(maximum)} y2={y(minimum)} stroke={colour.axis} />
      <OdeLabel x={30} y={y(maximum) - 13} colour={identity}>{label}</OdeLabel>
      {[maximum, 0, minimum].map(value => <OdeLabel key={value} x={73} y={y(value) + 5} anchor="end">{value}</OdeLabel>)}
      {[0, 1, 2, 3].map(t => <OdeLabel key={t} x={x(t)} y={y(minimum) + 23} anchor="middle">{t}</OdeLabel>)}
    </g>)}
    <polyline points={rows.map(row => `${x(row.time)},${q(row.position)}`).join(' ')} fill="none" stroke={colour.state} strokeWidth={2} />
    <polyline points={rows.map(row => `${x(row.time)},${v(row.velocity)}`).join(' ')} fill="none" stroke={colour.second} strokeWidth={2} />
    <line x1={x(time)} x2={x(time)} y1={35} y2={359} stroke={colour.comparison} strokeDasharray="5 4" />
    <circle cx={x(time)} cy={q(selected.position)} r={5} fill={colour.state} />
    <circle cx={x(time)} cy={v(selected.velocity)} r={5} fill={colour.second} />
    <OdeLabel x={340} y={408} anchor="middle">same time axis(s); separate vertical units and scales</OdeLabel>
  </OdeScene>;
}

export function DampedMotionLab() {
  const [damping, setDamping] = useState(2);
  const [initialVelocity, setInitialVelocity] = useState(0);
  const [time, setTime] = useState(1);
  const current = oscillatorState(time, damping, 1, initialVelocity);
  const path = odeSamples(0, 3, t => t).map(([t]) => oscillatorState(t, damping, 1, initialVelocity));
  return <FlowLab id="ode-E26" label="Damping changes motion, its full state and energy">
    <OdeFigure id="E26">
      <SpringObject position={current.position} velocity={current.velocity} damping={damping} />
      <MotionTraces damping={damping} initialVelocity={initialVelocity} time={time} />
      <OdePlot label="The same full displacement-velocity path and local state-rate direction"
        xDomain={[-1.6, 1.6]} yDomain={[-3, 3]} xLabel="q(m)" yLabel="v(m/s)"
        series={[{ points: path.map(row => [row.position, row.velocity]) },
          { points: [[current.position, current.velocity]], dots: true, connect: false, colour: colour.comparison }]}>
        {({ x, y }) => <OdeArrow x1={x(current.position)} y1={y(current.velocity)}
          x2={x(current.position + .1 * current.velocity)} y2={y(current.velocity + .1 * current.derivative[1])}
          colour={colour.input} />}
      </OdePlot>
      <OdeTable label="One selected physical state and energy balance"
        columns={['Time(s)', 'q(m)', 'v(m/s)', 'Energy(J)', 'E′(W)']}
        rows={[[time, f(current.position), f(current.velocity), f(current.energy), f(current.energyRate)]]} />
    </OdeFigure>
    <FlowControls>
      <FlowSlider name="Damping c(N·s/m)" value={damping} min={0} max={6} step={.1} onChange={setDamping} />
      <FlowSlider name="Initial v₀(m/s)" value={initialVelocity} min={-2} max={2} step={.1} onChange={setInitialVelocity} />
      <FlowSlider name="Selected time(s)" value={time} min={0} max={3} step={.1} onChange={setTime} />
      {[0, 4, 6].map(value => <button type="button" key={value} onClick={() => setDamping(value)}>c={value}</button>)}
      <button type="button" onClick={() => { setDamping(2); setInitialVelocity(0); setTime(1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>Both traces, the phase point and the physical object use the same time and complete state. Unforced damping removes <strong>cv²</strong> watts; q and v can still change sign.</FlowReadout>
  </FlowLab>;
}

export function EnergyExchange() {
  const path = odeSamples(0, 3, t => t).map(([t]) => oscillatorState(t, 2, 1, 2));
  return <OdeFigure id="E27" caption="Start at q₀=1 m,v₀=2 m/s with c=2. Displacement initially increases, while kinetic plus spring energy decreases. Spring exchange cancels in the total derivative; damping alone removes energy here.">
    <OdePlot label="Separate kinetic, spring and total energies along one exact phase history"
      xDomain={[0, 3]} yDomain={[0, 4.2]} xLabel="time(s)" yLabel="energy(J)"
      series={[
        { points: path.map(row => [row.time, 2 * row.position ** 2]) },
        { points: path.map(row => [row.time, .5 * row.velocity ** 2]), colour: colour.second },
        { points: path.map(row => [row.time, row.energy]), colour: colour.input, dashed: true },
      ]} />
    <OdeTable label="Roles in the energy derivative at the initial state"
      columns={['Quantity', 'Value', 'Unit', 'Meaning']}
      rows={[
        ['spring energy(amber)', 2, 'J', 'kq²/2'],
        ['kinetic energy(violet)', 2, 'J', 'mv²/2'],
        ['total energy(cyan)', 4, 'J', 'sum of both stores'],
        ['damping loss', -8, 'W', '−cv² at v=2'],
        ['position rate', 2, 'm/s', 'positive despite total loss'],
      ]} />
  </OdeFigure>;
}

export function HigherOrderState() {
  const identities = [colour.state, colour.second, colour.comparison];
  const state = [1, -.5, .25], rates = [state[1], state[2], -state[1] - 2 * state[2]];
  return <OdeFigure id="E28" caption="For q‴+2q″+q′=0, the complete state contains three initial quantities. The first two rates shift the existing coordinates; the final rate uses the original equation.">
    <OdeScene label="Third-order motion state and its actual coordinate dependencies" height={350}>
      {['q', 'q′', 'q″'].map((name, index) => <g key={name}>
        <circle cx={110 + index * 205} cy={85} r={40} fill={identities[index]} fillOpacity={.1} stroke={identities[index]} />
        <OdeLabel x={110 + index * 205} y={79} anchor="middle" colour={identities[index]}>x{index + 1}={name}</OdeLabel>
        <OdeLabel x={110 + index * 205} y={104} anchor="middle">{state[index]}</OdeLabel>
        <OdeArrow x1={110 + index * 205} y1={140} x2={110 + index * 205} y2={200} colour={identities[index]} />
        <OdeLabel x={110 + index * 205} y={233} anchor="middle">x{index + 1}′={rates[index]}</OdeLabel>
      </g>)}
      <OdeLabel x={110} y={269} anchor="middle">rate x₂</OdeLabel>
      <OdeLabel x={315} y={269} anchor="middle">rate x₃</OdeLabel>
      <OdeLabel x={520} y={269} anchor="middle">rate −x₂−2x₃</OdeLabel>
      <OdeLabel x={45} y={328}>Three coordinates; three initial data; one first-order system.</OdeLabel>
    </OdeScene>
  </OdeFigure>;
}

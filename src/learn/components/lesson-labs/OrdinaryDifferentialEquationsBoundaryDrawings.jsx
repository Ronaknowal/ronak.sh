import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { OdeFigure, OdeScene, OdePlot, OdeLabel, OdeArrow, OdeTable,
  odeSamples, odeFormat as f, odeColours as colour } from './OrdinaryDifferentialEquationsReadingPrimitives.jsx';

export function BoundarySelectsSlope() {
  const slopes = [0, .5, 1, 2], identities = ['#888', colour.input, colour.state, colour.second];
  return <OdeFigure id="E64" caption="All lines solve y″=0 and start at y(0)=0, but they have different initial slopes. The right condition y(1)=1 intersects exactly the slope-1 line. One specified initial position is not a complete second-order IVP.">
    <OdePlot label="The right boundary selects one member of the whole initial-slope family"
      xDomain={[0, 1]} yDomain={[-.1, 2.2]} xLabel="position of data t" yLabel="candidate y(t)=st"
      series={slopes.map((slope, index) => ({ points: [[0, 0], [1, slope]], colour: identities[index] }))}>
      {({ x, y }) => <>
        <line x1={x(1)} y1={y(0)} x2={x(1)} y2={y(2)} stroke="#bbb" strokeDasharray="4 4" />
        <circle cx={x(1)} cy={y(1)} r={7} fill="none" stroke="#eee" strokeWidth={2} />
        {slopes.map((slope, index) => <OdeLabel key={slope} x={x(.65)} y={y(.65 * slope) - 10} colour={identities[index]}>s={slope}</OdeLabel>)}
      </>}
    </OdePlot>
    <OdeTable label="Compare every launch with the same right condition"
      columns={['Initial slope s', 'Endpoint y(1)', 'Endpoint residual y(1)−1']}
      rows={slopes.map(slope => [slope, slope, slope - 1])} />
  </OdeFigure>;
}

function BoundaryFamily({ length = 'half-pi', target = 1, slope = 1 }) {
  const end = length === 'pi' ? Math.PI : Math.PI / 2;
  const floatingCoefficient = Math.sin(end);
  const coefficient = Math.abs(floatingCoefficient) <= 1e-12 ? 0
    : Math.abs(floatingCoefficient - 1) <= 1e-12 ? 1 : floatingCoefficient;
  const slopes = [-2, -1, 0, 1, 2];
  const path = value => odeSamples(0, end, t => value * Math.sin(t)).map(([time, state], index, rows) => [time, index === rows.length - 1 ? value * coefficient : state]);
  const selectedValue = slope * coefficient, residual = selectedValue - target;
  const classification = coefficient === 0 ? target === 0 ? 'infinitely many solutions' : 'no solution' : 'one solution: s=1×right value';
  return <>
    <OdePlot label="Actual sine trajectory family and the selected right-boundary mismatch"
      xDomain={[0, Math.PI]} yDomain={[-2.3, 2.3]} xLabel="data location t" yLabel="state y(t)=s sin(t)"
      references={[{ value: 0 }, { axis: 'x', value: end }]}
      series={[...slopes.map(value => ({ points: path(value), colour: '#777', dashed: true })),
        { points: path(slope), colour: colour.state }]}>
      {({ x, y }) => <>
        <circle cx={x(end)} cy={y(target)} r={7} fill="none" stroke={colour.input} strokeWidth={2} />
        <circle cx={x(end)} cy={y(selectedValue)} r={5} fill={colour.state} />
        <line x1={x(end)} y1={y(selectedValue)} x2={x(end)} y2={y(target)} stroke={colour.comparison} strokeWidth={3} />
      </>}
    </OdePlot>
    <OdePlot label="The shooting residual depends on the initial slope through the endpoint coefficient"
      xDomain={[-2, 2]} yDomain={[-3.3, 2.3]} xLabel="initial slope s" yLabel="boundary residual s sin(L)−right value"
      references={[{ value: 0 }]} series={[{ points: [[-2, -2 * coefficient - target], [2, 2 * coefficient - target]], colour: colour.second }]}>
      {({ x, y }) => <circle cx={x(slope)} cy={y(residual)} r={6} fill={colour.state} />}
    </OdePlot>
    <p className="ode-diagram-key">Amber is the selected slope; dashed grey curves are other launches. Cyan is the requested right value; pink is the selected mismatch. A flat violet residual at zero admits every slope; a flat residual away from zero admits none.</p>
    <OdeTable label="Exact symbolic endpoint data determine the solution set"
      columns={['Length L', 'sin(L)', 'Right value', 'Selected slope', 'Selected endpoint', 'Residual', 'Classification']}
      rows={[[length === 'pi' ? 'π' : 'π/2', coefficient, target, f(slope), f(selectedValue), f(residual), classification]]} />
    <p>Endpoints use the exact preset identities sin(π)=0 and sin(π/2)=1. Display calculations treat values within 10⁻¹² of these preset identities as zero or one; this floating-point display convention is separate from exact solvability.</p>
  </>;
}

export function ResonantBoundaryCollapse() {
  return <OdeFigure id="E65" caption="At L=π the endpoint map sends every slope to zero. Right value 0 admits every sine launch; right value 1 admits none. At L=π/2 the endpoint retains the slope and selects one. Two conditions alone are not a uniqueness theorem.">
    <BoundaryFamily length="pi" target={0} />
    <OdeTable label="Changing location or right data changes rank and solvability"
      columns={['L', 'Right value', 'Endpoint map', 'Solution set']}
      rows={[['π', 0, 's→0', 'all real slopes'], ['π', 1, 's→0', 'none'], ['π/2', 1, 's→s', 's=1']]} />
  </OdeFigure>;
}

export function BoundaryFamilyLab() {
  const [length, setLength] = useState('half-pi'), [target, setTarget] = useState('1'), [slope, setSlope] = useState(1);
  return <FlowLab id="ode-E66" label="Change boundary data and inspect the resulting solution family">
    <OdeFigure id="E66"><BoundaryFamily length={length} target={Number(target)} slope={slope} /></OdeFigure>
    <FlowControls>
      <FlowChoice label="Right location L" value={length} onChange={setLength} options={[[ 'half-pi', 'π/2' ], [ 'pi', 'π' ]]} />
      <FlowChoice label="Requested right value" value={target} onChange={setTarget} options={[[ '0', '0' ], [ '1', '1' ]]} />
      <FlowSlider name="Selected initial slope s" value={slope} min={-2} max={2} step={.1} onChange={setSlope} />
      <button type="button" onClick={() => { setLength('half-pi'); setTarget('1'); setSlope(1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>The curve follows the selected slope even when it misses the right condition. The classification concerns the entire family, rather than just this one displayed launch.</FlowReadout>
  </FlowLab>;
}

export function CheckCandidateObligations() {
  const state = time => 40 * Math.exp(-.2 * time), selected = 2, rate = -.2 * state(selected);
  return <OdeFigure id="E67" caption="For the candidate y=40e⁻⁰·²ᵗ on [0,5], the initial value, derivative equation, full domain and right value are distinct checks. The exact algebra makes the differential residual zero at every domain point. A sampled small residual for another candidate would require a separate stability argument to bound its error.">
    <OdePlot label="One complete candidate is inspected for data, local derivative and interval"
      xDomain={[0, 5]} yDomain={[10, 44]} xLabel="time (min), declared domain [0,5]" yLabel="candidate y (K)"
      series={[{ points: odeSamples(0, 5, state) }]}>
      {({ x, y }) => <>
        <circle cx={x(0)} cy={y(40)} r={6} fill={colour.input} />
        <line x1={x(0)} y1={y(40)} x2={x(.45)} y2={y(42)} stroke={colour.input} />
        <OdeLabel x={x(.45)} y={y(42)} colour={colour.input}>initial y(0)=40</OdeLabel>
        <OdeArrow x1={x(selected)} y1={y(state(selected))} x2={x(selected + .4)} y2={y(state(selected) + .4 * rate)} colour={colour.second} />
        <OdeLabel x={x(1.7)} y={y(35)} colour={colour.second}>local rate y′=−.2y</OdeLabel>
        <circle cx={x(5)} cy={y(state(5))} r={6} fill={colour.comparison} />
        <line x1={x(5)} y1={y(state(5))} x2={x(4.6)} y2={y(25)} stroke={colour.comparison} />
        <OdeLabel x={x(4.6)} y={y(26)} anchor="end" colour={colour.comparison}>right value 40/e</OdeLabel>
      </>}
    </OdePlot>
    <OdeTable label="Four separate obligations for this exact candidate"
      columns={['Obligation', 'Actual check', 'Conclusion']}
      rows={[
        ['initial data', '40e⁰=40', 'matches'], ['differential equation', 'y′+.2y=−8e⁻⁰·²ᵗ+8e⁻⁰·²ᵗ', 'identically zero'],
        ['domain', 'finite differentiable exponential throughout [0,5]', 'defined on whole interval'],
        ['right boundary if required', `y(5)=40/e=${f(40 / Math.E)}`, 'matches that additional specified value'],
      ]} />
  </OdeFigure>;
}

export function StructuralMethodObjects() {
  const panels = [
    ['Separated coordinate', colour.state], ['Product / integrating factor', colour.input],
    ['Evolving independent columns', colour.second], ['Timed input contribution', colour.input],
    ['Accepted numerical states', colour.state], ['Boundary intersections', colour.comparison],
  ];
  return <OdeFigure id="E68" caption="Choose from the equation’s actual structure. Each small drawing recalls an operation already derived: change a scalar coordinate, differentiate a product, evolve independent columns, propagate an input, accumulate accepted numerical updates or select a boundary-compatible launch.">
    <OdeScene label="Six concrete mathematical objects guide the method choice" width={1080} height={560}>
      {panels.map(([name, identity], index) => {
        const column = index % 3, row = Math.floor(index / 3);
        return <g key={name} transform={`translate(${column * 355},${row * 270})`}>
          <OdeLabel x={20} y={30} colour={identity}>{name}</OdeLabel>
          <line x1={40} y1={210} x2={310} y2={210} stroke="#888" />
          <line x1={40} y1={65} x2={40} y2={210} stroke="#888" />
          {index === 0 && <>
            <polyline points="40,190 90,150 150,100 220,75 300,65" fill="none" stroke={identity} strokeWidth={2} />
            <OdeLabel x={70} y={250}>integrate 1/b(y) on a branch</OdeLabel>
          </>}
          {index === 1 && <>
            <rect x={90} y={80} width={140} height={110} fill={identity} fillOpacity={.1} stroke={identity} />
            <rect x={230} y={80} width={30} height={110} fill={colour.second} fillOpacity={.2} />
            <rect x={90} y={65} width={140} height={15} fill={colour.state} fillOpacity={.3} />
            <OdeLabel x={90} y={250}>μy′+μ′y=(μy)′</OdeLabel>
          </>}
          {index === 2 && <>
            <polyline points="70,195 200,195 280,90 150,90 70,195" fill="none" stroke="#888" />
            <OdeArrow x1={70} y1={195} x2={200} y2={195} colour={colour.state} />
            <OdeArrow x1={70} y1={195} x2={150} y2={90} colour={colour.second} />
            <OdeLabel x={70} y={250}>x₀₁Ue₁+x₀₂Ue₂</OdeLabel>
          </>}
          {index === 3 && <>
            <rect x={65} y={90} width={70} height={120} fill={identity} fillOpacity={.2} stroke={identity} />
            <polyline points="65,210 135,95 195,130 260,160 305,175" fill="none" stroke={colour.state} strokeWidth={2} />
            <OdeLabel x={55} y={250}>each input ages for t−s</OdeLabel>
          </>}
          {index === 4 && <>
            <polyline points="55,80 115,110 175,140 235,160 295,180" fill="none" stroke={identity} strokeWidth={2} />
            {[[55, 80], [115, 110], [175, 140], [235, 160], [295, 180]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={5} fill={identity} />)}
            <OdeLabel x={55} y={250}>one accepted state per update</OdeLabel>
          </>}
          {index === 5 && <>
            {[110, 150, 190].map(end => <line key={end} x1={55} y1={200} x2={290} y2={end} stroke={end === 150 ? identity : '#888'} strokeWidth={2} />)}
            <line x1={290} y1={65} x2={290} y2={210} stroke={colour.input} strokeDasharray="4 3" />
            <circle cx={290} cy={150} r={7} fill="none" stroke={identity} />
            <OdeLabel x={55} y={250}>test the endpoint map’s rank</OdeLabel>
          </>}
        </g>;
      })}
    </OdeScene>
  </OdeFigure>;
}

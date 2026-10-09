import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { orderedShears } from '../../data/ordinary-differential-equations-reading-models.js';
import { OdeFigure, OdePlot, OdeLabel, OdeArrow, OdeTable,
  odeFormat as f, odeColours as colour } from './OrdinaryDifferentialEquationsReadingPrimitives.jsx';

const vector = values => `(${values.map(value => f(value, 4)).join(', ')})`;
const matrix = values => values.map(row => `[${row.map(value => f(value, 4)).join(', ')}]`).join(' ');
const square = operator => [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]
  .map(point => operator.map(row => row[0] * point[0] + row[1] * point[1]));

export function TwoTimeBasis() {
  const times = [.5, .75, 1], shear = time => time ** 2;
  return <OdeFigure id="E47" caption="For A(t)=2tN with N=[0,1;0,0], U(t)=I+t²N. U(s)⁻¹ first removes the basis shear at s; U(t) then installs the basis at t. The two actual increments .3125 and .4375 add to .75, and the later transition multiplies on the left.">
    <OdePlot label="The actual evolving basis at s=.5, r=.75 and t=1"
      xDomain={[-.2, 2.2]} yDomain={[-.2, 2.2]} height={640}
      xLabel="first coordinate" yLabel="second coordinate"
      series={times.map((time, index) => ({ points: square([[1, shear(time)], [0, 1]]), colour: [colour.input, colour.second, colour.state][index] }))}>
      {({ x, y }) => <>{times.map((time, index) => <g key={time}>
        <OdeArrow x1={x(0)} y1={y(0)} x2={x(shear(time))} y2={y(1)} colour={[colour.input, colour.second, colour.state][index]} />
        <line x1={x(shear(time))} y1={y(1)} x2={x(.1 + index * .4)} y2={y(1.15 + index * .1)} stroke={[colour.input, colour.second, colour.state][index]} />
        <OdeLabel x={x(.1 + index * .4)} y={y(1.19 + index * .1)} colour={[colour.input, colour.second, colour.state][index]}>U({time})e₂</OdeLabel>
      </g>)}</>}
    </OdePlot>
    <OdeTable label="Remove the old basis before installing the new one"
      columns={['Transition', 'Matrix', 'Second basis column at its end']}
      rows={[
        ['U(s), s=.5', matrix([[1, .25], [0, 1]]), '(.25,1)'],
        ['Φ(r,s), r=.75', matrix([[1, .3125], [0, 1]]), '(.5625,1)'],
        ['Φ(t,r), t=1', matrix([[1, .4375], [0, 1]]), '(1,1)'],
        ['Φ(t,r)Φ(r,s)=Φ(t,s)', matrix([[1, .75], [0, 1]]), '(1,1)'],
        ['det Φ for every interval here', 1, 'trace A=0'],
      ]} />
  </OdeFigure>;
}

function OrderDrawing({ horizontal = 1, vertical = 1, selected = 'upper', bases = false }) {
  const result = orderedShears(horizontal, vertical);
  const paths = [result.upperFirst, result.lowerFirst];
  const identities = [colour.state, colour.second];
  return <>
    <OdePlot label="Both real two-stage state paths expose their different intermediates"
      xDomain={[-.4, 7.5]} yDomain={[-.4, 7.5]} height={640}
      xLabel="state x₁" yLabel="state x₂" references={[{ value: 0 }, { axis: 'x', value: 0 }]}
      series={paths.map((path, index) => ({ points: [result.initial, path.intermediate, path.final],
        colour: identities[index], dashed: (selected === 'upper' ? 0 : 1) !== index, dots: true }))}>
      {({ x, y }) => <>{paths.map((path, index) => <g key={index}>
        <OdeArrow x1={x(result.initial[0])} y1={y(result.initial[1])} x2={x(path.intermediate[0])} y2={y(path.intermediate[1])} colour={identities[index]} />
        <OdeArrow x1={x(path.intermediate[0])} y1={y(path.intermediate[1])} x2={x(path.final[0])} y2={y(path.final[1])} colour={identities[index]} />
      </g>)}</>}
    </OdePlot>
    <p className="ode-diagram-key">Amber is horizontal then vertical (YX). Violet is vertical then horizontal (XY). Both complete paths stay visible; the selected order has a solid path.</p>
    {bases && <OdePlot label="The same two ordered operators produce different images of the unit square"
      xDomain={[-.3, 7.5]} yDomain={[-.3, 7.5]} height={640} xLabel="first basis coordinate" yLabel="second basis coordinate"
      series={[{ points: square([[1, 0], [0, 1]]), colour: '#888', dashed: true },
        ...paths.map((path, index) => ({ points: square(path.matrix), colour: identities[index] }))]} />}
    <OdeTable label="Actual operators, intermediate states and finals"
      columns={['Stage or comparison', 'Matrix or state']}
      rows={[
        ['horizontal X', matrix(result.upper)], ['vertical Y', matrix(result.lower)],
        ['amber Xx₀', vector(result.upperFirst.intermediate)], ['amber YXx₀', vector(result.upperFirst.final)],
        ['violet Yx₀', vector(result.lowerFirst.intermediate)], ['violet XYx₀', vector(result.lowerFirst.final)],
        ['YX', matrix(result.upperFirst.matrix)], ['XY', matrix(result.lowerFirst.matrix)],
        ['amber final minus violet final', vector(result.difference)],
      ]} />
  </>;
}

export function SwappedShearPaths() {
  return <OdeFigure id="E48" caption="Start at (1,1). X then Y reaches (2,1) then (2,3); Y then X reaches (1,2) then (3,2). Each later shear sees the intermediate state produced by the first, and its factor acts on the left.">
    <OrderDrawing />
  </OdeFigure>;
}

export function OrderedShearLab() {
  const [horizontal, setHorizontal] = useState(1), [vertical, setVertical] = useState(1);
  const [selected, setSelected] = useState('upper');
  return <FlowLab id="ode-E49" label="Which intermediate state creates the final order difference?">
    <OdeFigure id="E49"><OrderDrawing horizontal={horizontal} vertical={vertical} selected={selected} bases /></OdeFigure>
    <FlowControls>
      <FlowSlider name="Horizontal shear strength" value={horizontal} min={0} max={2} step={.1} onChange={setHorizontal} />
      <FlowSlider name="Vertical shear strength" value={vertical} min={0} max={2} step={.1} onChange={setVertical} />
      <FlowChoice label="Emphasized order" value={selected} onChange={setSelected}
        options={[[ 'upper', 'Horizontal then vertical' ], [ 'lower', 'Vertical then horizontal' ]]} />
      <button type="button" onClick={() => { setHorizontal(1); setVertical(1); setSelected('upper'); }}>Reset</button>
    </FlowControls>
    <FlowReadout>The initial state (1,1) and axes stay fixed. A zero-strength shear is the identity; both orders then agree. Dashed grey is the original unit square, and coloured parallelograms show both complete ordered maps.</FlowReadout>
  </FlowLab>;
}

export function CommutingVariableShear() {
  return <OdeFigure id="E50" caption="Every A(t)=2tN uses the same nilpotent direction N, so all pairs commute. Between s=.5 and t=1, the integrated shear is t²−s²=.75. Pairwise commutation is sufficient for the integral-exponential formula; perpendicular shear generators generally do not commute.">
    <OdePlot label="Successive same-direction shear increments combine into one actual shear"
      xDomain={[-.2, 2]} yDomain={[-.2, 1.5]} height={535} xLabel="first coordinate" yLabel="second coordinate"
      series={[{ points: square([[1, 0], [0, 1]]), colour: '#888', dashed: true },
        { points: square([[1, .3125], [0, 1]]), colour: colour.input },
        { points: square([[1, .75], [0, 1]]), colour: colour.state }]} />
    <OdeTable label="Same-direction increments commute; changing direction can change the operator"
      columns={['Operation', 'Actual operator']}
      rows={[
        ['first .3125, then .4375', '[1,.75;0,1]'],
        ['first .4375, then .3125', '[1,.75;0,1]'],
        ['unit horizontal then unit vertical', '[1,1;1,2]'],
        ['unit vertical then unit horizontal', '[2,1;1,1]'],
      ]} />
  </OdeFigure>;
}

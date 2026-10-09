import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { exponential2, linearSystemState } from '../../data/ordinary-differential-equations-models.js';
import {
  OdeFigure, OdeScene, OdePlot, OdeLabel, OdeArrow, OdeTable,
  odeSamples, odeFormat as f, odeColours as colour,
} from './OrdinaryDifferentialEquationsReadingPrimitives.jsx';

const matrixText = matrix => matrix.map(row => `[${row.map(value => f(value, 4)).join(', ')}]`).join(' ');
const vectorText = vector => `(${vector.map(value => f(value, 4)).join(', ')})`;
const determinant = matrix => matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

export function CoupledCompartments({ first = 9, second = 0 }) {
  return <OdeScene label="Two stored amounts and conserved transfers in opposite directions" height={330}>
    {[[110, first, colour.state, 'x₁'], [465, second, colour.second, 'x₂']].map(([x, amount, identity, name]) => <g key={name}>
      <rect x={x - 65} y={70} width={130} height={160} rx={5} fill={identity} fillOpacity={.1} stroke={identity} />
      <OdeLabel x={x} y={130} anchor="middle" colour={identity}>{name}={f(amount)} units</OdeLabel>
      <OdeLabel x={x} y={165} anchor="middle">stored amount</OdeLabel>
    </g>)}
    {first !== 0 && <OdeArrow x1={185} y1={100} x2={390} y2={100} colour={colour.state} />}
    <OdeLabel x={288} y={78} anchor="middle" colour={colour.state}>x₁={f(first)} units/time →</OdeLabel>
    {second !== 0 && <OdeArrow x1={390} y1={195} x2={185} y2={195} colour={colour.second} />}
    <OdeLabel x={288} y={228} anchor="middle" colour={colour.second}>← 2x₂={f(2 * second)} units/time</OdeLabel>
    <OdeLabel x={40} y={285}>x₁′=−x₁+2x₂={f(-first + 2 * second)}</OdeLabel>
    <OdeLabel x={370} y={285}>x₂′=x₁−2x₂={f(first - 2 * second)}</OdeLabel>
    <OdeLabel x={40} y={320}>The two rates sum to 0; transfer stays within the boundary.</OdeLabel>
  </OdeScene>;
}

export function CouplingAtAState() {
  return <OdeFigure id="E29" caption="Each transfer removes exactly the amount it adds elsewhere. At (9,0), the complete rate is (−9,9); each matrix row computes one coordinate rate.">
    <CoupledCompartments />
    <OdeTable label="Actual row products and column contributions"
      columns={['Rate coordinate', 'From x₁=9', 'From x₂=0', 'Total']}
      rows={[["x₁′", -9, 0, -9], ["x₂′", 9, 0, 9]]} />
  </OdeFigure>;
}

export function BasisDrawing({ matrix = [[-1, 0], [0, -2]], initial = [1, 1], time = .75, positiveFrame = false }) {
  const result = linearSystemState(matrix, initial, time);
  const columns = [[result.transition[0][0], result.transition[1][0]], [result.transition[0][1], result.transition[1][1]]];
  const weighted = columns.map((column, index) => column.map(value => value * initial[index]));
  const corners = [[0, 0], columns[0], columns[0].map((value, index) => value + columns[1][index]), columns[1], [0, 0]];
  const extent = Math.max(1, ...[...columns, ...weighted, ...corners, initial, result.state].flat().map(Math.abs)) * 1.3;
  return <>
    <OdePlot label="Initial and evolved basis columns, their parallelogram and the weighted state"
      xDomain={[positiveFrame ? -.15 : -extent, extent]} yDomain={[positiveFrame ? -.15 : -extent, extent]} height={640}
      xLabel="state coordinate x₁" yLabel="state coordinate x₂"
      references={[{ value: 0 }, { axis: 'x', value: 0 }]}
      series={[
        { points: [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]], colour: '#777', dashed: true },
        { points: corners, colour: '#999' },
      ]}>
      {({ x, y }) => <>
        {columns.map((column, index) => <g key={index}>
          <OdeArrow x1={x(0)} y1={y(0)} x2={x(column[0])} y2={y(column[1])}
            colour={index ? colour.second : colour.state} />
          <line x1={x(column[0])} y1={y(column[1])} x2={x(extent * .45)} y2={y(extent * (.85 - index * .22))}
            stroke={index ? colour.second : colour.state} strokeDasharray="3 3" />
          <OdeLabel x={x(extent * .45)} y={y(extent * (.9 - index * .22))} anchor="end"
            colour={index ? colour.second : colour.state}>U(t)e{index + 1}</OdeLabel>
        </g>)}
        <OdeArrow x1={x(0)} y1={y(0)} x2={x(initial[0])} y2={y(initial[1])} colour={colour.comparison} dashed />
        <OdeArrow x1={x(0)} y1={y(0)} x2={x(weighted[0][0])} y2={y(weighted[0][1])} colour={colour.state} dashed />
        <OdeArrow x1={x(weighted[0][0])} y1={y(weighted[0][1])} x2={x(result.state[0])} y2={y(result.state[1])}
          colour={colour.second} dashed />
        <circle cx={x(result.state[0])} cy={y(result.state[1])} r={5} fill="#eee" />
      </>}
    </OdePlot>
    <p className="ode-diagram-key">Pink dashed is the initial x₀. The dashed amber/violet vectors are its weighted components; the white point is their current sum. Solid amber/violet arrows are the unweighted evolved columns.</p>
    <OdeTable label="The two actual independent columns combine linearly"
      columns={['Object', 'Coordinates or value', 'Meaning']}
      rows={[
        ['amber column', vectorText(columns[0]), 'initial e₁ evolved'],
        ['violet column', vectorText(columns[1]), 'initial e₂ evolved'],
        ['selected x₀', vectorText(initial), 'coefficients of the columns'],
        ['current state', vectorText(result.state), 'x₀₁Ue₁+x₀₂Ue₂'],
        ['det U(t)', f(determinant(result.transition)), 'nonzero for this flow'],
      ]} />
  </>;
}

export function EvolveIndependentColumns() {
  return <OdeFigure id="E30" caption="The initial unit square is dashed grey; its evolved columns retain amber/violet identities. Those columns need not be eigenvectors. Their weighted sum evolves the selected initial state.">
    <BasisDrawing positiveFrame />
  </OdeFigure>;
}

export function MatrixPowerPaths() {
  const layers = [[1, 0], [-1, 1], [3, -3]];
  const terms = [[1, 0], [-.25, .25], [.09375, -.09375]];
  const rows = ['I e₁', 'tA e₁', 't²A²e₁/2'];
  return <OdeFigure id="E31" caption="For A=[−1,2;1,−2], a second matrix product combines the intermediate coordinates again. These layers are matrix-power coefficients, not successive physical times. The table applies the separate t=.25 series weights.">
    <OdeScene label="Actual two-coordinate paths through two repeated matrix products" width={760} height={350}>
      {[0, 1].map(stage => <g key={stage}>
        {[0, 1].flatMap(source => [0, 1].map(target => {
          const coefficient = [[-1, 2], [1, -2]][target][source];
          const contribution = coefficient * layers[stage][source];
          return <g key={`${source}/${target}`}>
            <OdeArrow x1={105 + stage * 260} y1={85 + source * 160}
              x2={315 + stage * 260} y2={85 + target * 160}
              colour={source ? colour.second : colour.state} dashed={contribution === 0} />
          </g>;
        }))}
      </g>)}
      {layers.map((values, stage) => <g key={stage}>
        <OdeLabel x={80 + stage * 260} y={27} anchor="middle">{['e₁', 'Ae₁', 'A²e₁'][stage]}</OdeLabel>
        {values.map((value, coordinate) => <g key={coordinate}>
          <circle cx={80 + stage * 260} cy={85 + coordinate * 160} r={23}
            fill={coordinate ? colour.second : colour.state} fillOpacity={.1}
            stroke={coordinate ? colour.second : colour.state} />
          <OdeLabel x={80 + stage * 260} y={91 + coordinate * 160} anchor="middle">{value}</OdeLabel>
        </g>)}
      </g>)}
      <g style={{ paintOrder: 'stroke', stroke: '#070707', strokeWidth: 8, strokeLinejoin: 'round' }}>
        {[0, 1].flatMap(stage => [0, 1].flatMap(source => [0, 1].map(target => {
          const coefficient = [[-1, 2], [1, -2]][target][source];
          const contribution = coefficient * layers[stage][source];
          return <OdeLabel key={`${stage}/${source}/${target}`} x={165 + stage * 260}
            y={source === target ? 60 + source * 160 : 128 + source * 72}
            colour={source ? colour.second : colour.state}>{coefficient}×{layers[stage][source]}={contribution}</OdeLabel>;
        })))}
      </g>
      <OdeLabel x={35} y={328}>Each output adds the two incoming contributions.</OdeLabel>
    </OdeScene>
    <OdeTable label="The first three actual weighted series terms, t=.25"
      columns={['Term', 'Vector', 'Partial sum']}
      rows={terms.map((term, index) => [rows[index], vectorText(term), vectorText(terms.slice(0, index + 1)
        .reduce((sum, vector) => sum.map((value, coordinate) => value + vector[coordinate]), [0, 0]))])} />
  </OdeFigure>;
}

export function SingularGeneratorFlow() {
  return <OdeFigure id="E32" caption="The generator N is singular, but U=I+tN is an invertible shear. At t=.75 its second column is (1.5,1), and its parallelogram keeps determinant 1.">
    <BasisDrawing matrix={[[0, 2], [0, 0]]} initial={[0, 1]} time={.75} positiveFrame />
  </OdeFigure>;
}

export function BasisEvolutionLab() {
  const presets = {
    diagonal: [[-1, 0], [0, -2]],
    rotation: [[0, -2], [2, 0]],
    shear: [[0, 2], [0, 0]],
  };
  const [preset, setPreset] = useState('diagonal');
  const [time, setTime] = useState(.75);
  const [first, setFirst] = useState(1);
  const [second, setSecond] = useState(1);
  return <FlowLab id="ode-E33" label="Evolving basis columns combine into the selected complete state">
    <OdeFigure id="E33"><BasisDrawing matrix={presets[preset]} initial={[first, second]} time={time}
      positiveFrame={preset !== 'rotation' && first >= 0 && second >= 0} /></OdeFigure>
    <FlowControls>
      <FlowChoice label="Introduced generator" value={preset} onChange={setPreset}
        options={[[ 'diagonal', 'Diagonal decay' ], [ 'rotation', 'Rotation' ], [ 'shear', 'Nilpotent shear' ]]} />
      <FlowSlider name="Time" value={time} min={0} max={2} step={.05} onChange={setTime} />
      <FlowSlider name="Initial x₀₁" value={first} min={-2} max={2} step={.25} onChange={setFirst} />
      <FlowSlider name="Initial x₀₂" value={second} min={-2} max={2} step={.25} onChange={setSecond} />
      <button type="button" onClick={() => { setPreset('diagonal'); setTime(.75); setFirst(1); setSecond(1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>The unweighted columns preserve their identities; dashed coloured components use the chosen coefficients. Axes expand to include the displayed vectors, and every exact coordinate remains in the table.</FlowReadout>
  </FlowLab>;
}

export function RepeatedModeCoupling() {
  const matrix = [[-1, 3], [0, -1]];
  const path = odeSamples(0, 3, time => time).map(([time]) => linearSystemState(matrix, [0, 1], time));
  return <OdeFigure id="E34" caption="The second coordinate decays while feeding the first. Its accumulated contribution is 3te⁻ᵗ. A missing second eigenvector does not remove the second independent solution.">
    <OdePlot label="Actual coupled coordinates of a decaying Jordan block"
      xDomain={[0, 3]} yDomain={[0, 1.3]} xLabel="time" yLabel="state coordinates"
      series={[
        { points: path.map(row => [row.time, row.state[0]]) },
        { points: path.map(row => [row.time, row.state[1]]), colour: colour.second },
      ]}>
      {({ x, y }) => <>
        <OdeLabel x={x(1.25)} y={y(1.12)}>amber x₁=3te⁻ᵗ</OdeLabel>
        <OdeLabel x={x(1.05)} y={y(.5)} colour={colour.second}>violet x₂=e⁻ᵗ</OdeLabel>
      </>}
    </OdePlot>
    <OdePlot label="The decaying-frame input is constant, so its integral grows linearly"
      xDomain={[0, 1]} yDomain={[0, 4]} xLabel="input time s" yLabel="eˢ·3x₂(s)=3"
      series={[{ points: [[0, 3], [1, 3]], colour: colour.input }]}>
      {({ x, y }) => <>
        <rect x={x(0)} y={y(3)} width={x(1) - x(0)} height={y(0) - y(3)} fill={colour.input} fillOpacity={.12} />
        <OdeLabel x={x(.5)} y={y(1.5)} anchor="middle">area 3t; multiply back by e⁻ᵗ</OdeLabel>
      </>}
    </OdePlot>
    <OdeTable label="The repeated mode produces two nonzero coordinates"
      columns={['Time', 'x₁', 'x₂', 'U(t)']}
      rows={[[1, f(3 / Math.E), f(1 / Math.E), matrixText(exponential2(matrix, 1))]]} />
  </OdeFigure>;
}

export function ScalingAndSquaring() {
  const operators = [
    ['P=I+B/2', [[1, .5], [0, 1]], colour.input],
    ['Q=I−B/2', [[1, -.5], [0, 1]], colour.comparison],
    ['solve QR=P', [[1, 1], [0, 1]], colour.second],
    ['square R²', [[1, 2], [0, 1]], colour.state],
  ];
  return <OdeFigure id="E35" caption="This nilpotent example uses A=[0,2;0,0] and B=A/2. The toy [1/1] rational approximation is exact here because B²=0. A linear solve constructs R, then one square recovers exp(A). SciPy chooses approximation orders and scaling from the actual matrix; this special case is not its universal algorithm.">
    <OdePlot label="Actual operator images of the unit square through rational solve and squaring"
      xDomain={[-.7, 3.3]} yDomain={[-.2, 1.5]} xLabel="first coordinate" yLabel="second coordinate"
      series={operators.map(([name, matrix, identity]) => ({
        colour: identity,
        points: [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]].map(vector => matrix.map(row => row[0] * vector[0] + row[1] * vector[1])),
      }))} />
    <OdeTable label="Every actual operator and its image of the second basis vector"
      columns={['Stage', 'Matrix', 'Image e₂', 'Role colour']}
      rows={operators.map(([name, matrix], index) => [name, matrixText(matrix), vectorText([matrix[0][1], matrix[1][1]]), ['cyan', 'pink', 'violet', 'amber'][index]])} />
  </OdeFigure>;
}

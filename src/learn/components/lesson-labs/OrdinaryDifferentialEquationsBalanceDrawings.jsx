import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { coolingState, logisticState } from '../../data/ordinary-differential-equations-models.js';
import {
  OdeFigure, OdeScene, OdePlot, OdeLabel, OdeArrow, OdeTable,
  odeSamples, odeFormat as f, odeColours as colour,
} from './OrdinaryDifferentialEquationsReadingPrimitives.jsx';

export function ThermalObject({ state = 40, power = 0 }) {
  const exchange = 2 * state;
  return <OdeScene label="Object energy storage, heater input and signed exchange with the room" height={260}>
    <rect x={230} y={55} width={190} height={120} rx={10} fill={colour.state} fillOpacity={.08} stroke={colour.state} />
    <OdeLabel x={325} y={88} anchor="middle">object: x={f(state, 3)} K</OdeLabel>
    <OdeLabel x={325} y={119} anchor="middle">C=600 J/K</OdeLabel>
    <OdeLabel x={325} y={150} anchor="middle">Cx={f(600 * state, 3)} J</OdeLabel>
    <OdeLabel x={35} y={71} colour={colour.input}>heater</OdeLabel>
    {power > 0 && <OdeArrow x1={45} y1={110} x2={220} y2={110} colour={colour.input} />}
    <OdeLabel x={35} y={155} colour={colour.input}>P={f(power, 3)} W</OdeLabel>
    <OdeLabel x={545} y={71} anchor="middle">room</OdeLabel>
    {exchange !== 0 && <OdeArrow x1={exchange > 0 ? 430 : 595} y1={110}
      x2={exchange > 0 ? 595 : 430} y2={110} colour={colour.comparison} />}
    <OdeLabel x={440} y={155} colour={colour.comparison}>{exchange === 0 ? 'zero exchange' : `${f(Math.abs(exchange), 3)} W ${exchange > 0 ? 'out' : 'in'}`}</OdeLabel>
    <OdeLabel x={30} y={217}>relative stored energy; 1 W = 1 J/s</OdeLabel>
    <OdeLabel x={30} y={246}>60(P−Gx)/C = {f(.1 * power - .2 * state, 3)} K/min</OdeLabel>
  </OdeScene>;
}

export function BalanceObject() {
  return <OdeFigure id="E01" caption="The boundary separates stored energy from energy crossing it. With the heater off, 40 K of excess produces 80 J/s of outward exchange.">
    <ThermalObject />
  </OdeFigure>;
}

export function RateAndMinute() {
  const exact = coolingState(1).state;
  const rates = odeSamples(0, 1, time => coolingState(time).derivative);
  return <OdeFigure id="E02" caption="Amber is the exact cooling history; the dashed pink line keeps only the initial tangent. Signed rate area measures the actual one-minute change.">
    <OdePlot label="Instantaneous initial tangent compared with one full minute of cooling"
      xDomain={[0, 2]} yDomain={[25, 42]} xLabel="time t (min)" yLabel="excess x (K)"
      series={[
        { points: odeSamples(0, 2, time => coolingState(time).state) },
        { points: [[0, 40], [1, 32]], colour: colour.comparison, dashed: true },
        { points: [[0, 40], [1, exact], [1, 32]], dots: true, connect: false },
      ]}>
      {({ x, y }) => <>
        <OdeLabel x={x(.05)} y={y(40) - 12}>initial slope −8 K/min</OdeLabel>
        <line x1={x(1)} y1={y(exact)} x2={x(1.4)} y2={y(37)} stroke={colour.state} />
        <OdeLabel x={x(1.4)} y={y(37) - 10}>exact {f(exact)} K</OdeLabel>
        <OdeLabel x={x(.65)} y={y(29)}>tangent 32 K</OdeLabel>
      </>}
    </OdePlot>
    <OdePlot label="Negative signed area under the changing rate" xDomain={[0, 1]} yDomain={[-9, 0]}
      xLabel="time t (min)" yLabel="rate x′ (K/min)" series={[{ points: rates, colour: colour.input }]}>
      {({ x, y }) => <>
        <polygon points={[[0, 0], ...rates, [1, 0]].map(point => `${x(point[0])},${y(point[1])}`).join(' ')}
          fill={colour.input} fillOpacity={.13} />
        <OdeLabel x={x(.5)} y={y(-3.5)} anchor="middle">∫x′dt = {f(exact - 40)} K</OdeLabel>
      </>}
    </OdePlot>
  </OdeFigure>;
}

export function WholeHistory() {
  const history = time => 40 * Math.exp(-.2 * time);
  return <OdeFigure id="E03" caption="A state is one height. The unknown solution is the complete differentiable history on an interval containing its starting time.">
    <OdePlot label="One whole cooling function with local tangents and its initial condition"
      xDomain={[-1, 6]} yDomain={[0, 52]} xLabel="time t (min), interval[−1,6]" yLabel="state x(t) (K)"
      references={[{ axis: 'x', value: 0 }]} series={[
        { points: odeSamples(-1, 6, history) },
        ...[0, 2, 4].map(time => ({ points: [[time - .35, history(time) + .07 * history(time)],
          [time + .35, history(time) - .07 * history(time)]], colour: colour.input })),
      ]}>
      {({ x, y }) => <>
        <circle cx={x(0)} cy={y(40)} r={5} fill={colour.comparison} />
        <OdeLabel x={x(.2)} y={y(40) - 13} colour={colour.comparison}>t₀=0,x₀=40</OdeLabel>
        <OdeLabel x={x(3)} y={y(35)}>local tangent: x′=f(t,x)</OdeLabel>
      </>}
    </OdePlot>
  </OdeFigure>;
}

export function AccumulatedRate() {
  const bands = Array.from({ length: 4 }, (_, index) => {
    const left = index * .5, right = left + .5;
    return { left, right, area: coolingState(right).state - coolingState(left).state };
  });
  return <OdeFigure id="E04" caption="The same unknown path supplies the height f(s,x(s)) inside each time band. The analytical signed changes below add to x(2)−x(0); sampled curve edges illustrate their areas.">
    <OdePlot label="Time bands of rate evaluated on the same history" xDomain={[0, 2]} yDomain={[-9, 0]}
      xLabel="integration time s (min)" yLabel="f(s,x(s)) (K/min)"
      series={[{ points: odeSamples(0, 2, time => coolingState(time).derivative), colour: colour.input }]}>
      {({ x, y }) => bands.map((band, index) => <g key={band.left}>
        <polygon points={[[band.left, 0], ...odeSamples(band.left, band.right, time => coolingState(time).derivative, 20), [band.right, 0]]
          .map(point => `${x(point[0])},${y(point[1])}`).join(' ')} fill={index % 2 ? colour.second : colour.input} fillOpacity={.17} />
        <line x1={x(band.right)} x2={x(band.right)} y1={y(0)} y2={y(coolingState(band.right).derivative)} stroke="#777" />
        <OdeLabel x={x((band.left + band.right) / 2)} y={y(-2)} anchor="middle">{f(band.area, 3)} K</OdeLabel>
      </g>)}
    </OdePlot>
    <OdeTable label="Rate accumulation preserves the initial state" columns={['Time', 'Initial x₀', '∫f(s,x(s))ds', 'x(t)']}
      rows={[[2, 40, f(coolingState(2).state - 40), f(coolingState(2).state)]]} />
  </OdeFigure>;
}

function ThermalDrawing({ power, initial, time }) {
  const equilibrium = power / 2;
  const selected = coolingState(time, initial, .2, equilibrium);
  return <>
    <ThermalObject state={selected.state} power={power} />
    <OdePlot label="Exact heated trajectory and tangent at the selected time" xDomain={[0, 10]} yDomain={[-12, 65]}
      xLabel="time (min)" yLabel="excess temperature (K)" references={[{ value: equilibrium, colour: colour.input }]}
      series={[
        { points: odeSamples(0, 10, t => coolingState(t, initial, .2, equilibrium).state) },
        { points: [[time - .3, selected.state - .3 * selected.derivative], [time + .3, selected.state + .3 * selected.derivative]], colour: colour.comparison },
        { points: [[time, selected.state]], dots: true, connect: false },
      ]}>
      {({ x, y }) => <OdeLabel x={x(.2)} y={y(equilibrium) - 12} colour={colour.input}>equilibrium {f(equilibrium)} K</OdeLabel>}
    </OdePlot>
    <OdeTable label="One selected physical state and its accumulated change"
      columns={['Time(min)', 'Equilibrium(K)', 'x(K)', 'x′(K/min)', 'x−x₀(K)']}
      rows={[[time, equilibrium, f(selected.state), f(selected.derivative), f(selected.state - initial)]]} />
  </>;
}

export function ThermalBalanceLab() {
  const [power, setPower] = useState(0);
  const [initial, setInitial] = useState(40);
  const [time, setTime] = useState(1);
  return <FlowLab id="ode-E05" label="Heater equilibrium, starting excess and current rate">
    <OdeFigure id="E05"><ThermalDrawing power={power} initial={initial} time={time} /></OdeFigure>
    <FlowControls>
      <FlowSlider name="Heater P(W)" value={power} min={0} max={40} step={1} onChange={setPower} />
      <FlowSlider name="Initial excess x₀(K)" value={initial} min={-10} max={60} step={1} onChange={setInitial} />
      <FlowSlider name="Selected time(min)" value={time} min={0} max={10} step={.1} onChange={setTime} />
      <button type="button" onClick={() => { setPower(0); setInitial(40); setTime(1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>The heater sets <strong>x*={f(power / 2)} K</strong>. The starting excess sets the transient. Exchange reverses whenever the selected state is colder than the room.</FlowReadout>
  </FlowLab>;
}

function DirectionDrawing({ model = 'cooling', initial = 20, selectedTime = 1, horizon = 4 }) {
  const state = time => model === 'logistic' ? logisticState(time, initial, .5, 8) : coolingState(time, initial);
  const rate = value => model === 'logistic' ? .5 * value * (1 - value / 8) : -.2 * value;
  const ceiling = model === 'cooling' && initial > 12 ? 40 : 14;
  const selected = state(selectedTime);
  return <OdePlot label={`${model} local field, exact initial-value path and selected rate`}
    xDomain={[0, horizon]} yDomain={[0, ceiling]} xLabel="time t" yLabel={model === 'cooling' ? 'excess x(K)' : 'population x'}
    series={[
      { points: odeSamples(0, horizon, time => state(time).state) },
      { points: [[selectedTime, selected.state]], dots: true, connect: false, colour: colour.comparison },
    ]}>
    {({ x, y }) => <>
      {Array.from({ length: 9 }, (_, column) => column * horizon / 8).flatMap(time =>
        Array.from({ length: 7 }, (_, row) => row * ceiling / 6).map(value => {
          const dx = x(time + .05) - x(time - .05);
          const dy = y(value + .05 * rate(value)) - y(value - .05 * rate(value));
          const norm = Math.hypot(dx, dy);
          return <line key={`${time}/${value}`} x1={x(time) - 9 * dx / norm} y1={y(value) - 9 * dy / norm}
            x2={x(time) + 9 * dx / norm} y2={y(value) + 9 * dy / norm} stroke="#777" />;
        }))}
      <OdeLabel x={x(horizon * .45)} y={y(ceiling * .92)}>equal drawn length: direction</OdeLabel>
      <OdeLabel x={x(horizon * .45)} y={y(ceiling * .8)}>selected rate {f(selected.derivative)} /time</OdeLabel>
    </>}
  </OdePlot>;
}

export function LocalDirection() {
  return <OdeFigure id="E06" caption="At x=20 K the cooling rate is −4 K/min. Equal-length field marks indicate local directions, with time and state scaled separately; they do not represent a minute of change.">
    <DirectionDrawing selectedTime={0} />
    <OdeScene label="Separate time and state changes form a local tangent triangle" height={160}>
      <line x1={100} y1={40} x2={400} y2={40} stroke={colour.axis} />
      <line x1={400} y1={40} x2={400} y2={120} stroke={colour.axis} />
      <OdeArrow x1={100} y1={40} x2={400} y2={120} colour={colour.input} />
      <OdeLabel x={180} y={27}>dt=.1 min</OdeLabel>
      <OdeLabel x={420} y={86}>dx=−.4 K</OdeLabel>
      <OdeLabel x={100} y={151}>dx/dt=−4 K/min; independently scaled axes</OdeLabel>
    </OdeScene>
  </OdeFigure>;
}

export function LogisticPhaseLine() {
  return <OdeFigure id="E07" caption="For a nonnegative population, arrows point toward capacity 8 except at the equilibrium 0. The graph below uses the same rate law and state positions.">
    <OdeScene label="Logistic state line and rate signs" height={180}>
      <line x1={65} y1={90} x2={585} y2={90} stroke={colour.axis} />
      {[0, 4, 8, 12].map(value => <g key={value}>
        <circle cx={65 + value * 40} cy={90} r={5} fill={value === 0 || value === 8 ? colour.comparison : colour.state} />
        <OdeLabel x={65 + value * 40} y={130} anchor="middle">x={value}</OdeLabel>
      </g>)}
      <OdeArrow x1={125} y1={65} x2={265} y2={65} colour={colour.state} />
      <OdeArrow x1={510} y1={65} x2={420} y2={65} colour={colour.state} />
      <OdeLabel x={165} y={42}>rate&gt;0</OdeLabel><OdeLabel x={445} y={42}>rate&lt;0</OdeLabel>
      <OdeLabel x={65} y={165}>0 and 8: rate=0; arrows show state evolution</OdeLabel>
    </OdeScene>
    <OdePlot label="Logistic local rate across the same nonnegative state domain"
      xDomain={[0, 12]} yDomain={[-3, 2]} xLabel="state x" yLabel="rate .5x(1−x/8)"
      references={[{ value: 0 }]} series={[{ points: odeSamples(0, 12, value => .5 * value * (1 - value / 8)), colour: colour.input },
        { points: [0, 4, 8, 12].map(value => [value, .5 * value * (1 - value / 8)]), dots: true, connect: false }]} />
  </OdeFigure>;
}

export function InitialCurveLab() {
  const [model, setModel] = useState('logistic');
  const [initial, setInitial] = useState(4);
  const [time, setTime] = useState(2);
  const selected = model === 'logistic' ? logisticState(time, initial, .5, 8) : coolingState(time, initial);
  return <FlowLab id="ode-E08" label="One selected initial point chooses a complete curve">
    <OdeFigure id="E08"><DirectionDrawing model={model} initial={initial} selectedTime={time} horizon={6} />
      <OdeTable label="Same field and actual selected point" columns={['Model', 'x₀', 'Time', 'x', 'Rate']}
        rows={[[model, initial, time, f(selected.state), f(selected.derivative)]]} />
    </OdeFigure>
    <FlowControls>
      <FlowChoice label="Introduced model" value={model} onChange={setModel}
        options={[[ 'logistic', 'Logistic:r=.5,K=8' ], [ 'cooling', 'Cooling:k=.2' ]]} />
      <FlowSlider name="Initial state" value={initial} min={0} max={12} step={.25} onChange={setInitial} />
      <FlowSlider name="Selected time" value={time} min={0} max={6} step={.1} onChange={setTime} />
      {[0, 8, 12].map(value => <button type="button" key={value} onClick={() => setInitial(value)}>x₀={value}</button>)}
      <button type="button" onClick={() => { setModel('logistic'); setInitial(4); setTime(2); }}>Reset</button>
    </FlowControls>
    <FlowReadout>Changing the initial state changes the curve through this field. For logistic growth, <strong>0 and 8</strong> remain equilibria and 12 moves down toward 8.</FlowReadout>
  </FlowLab>;
}

export function UniqueTrajectories() {
  return <OdeFigure id="E09" caption="These exact logistic solutions stay ordered and do not meet the capacity equilibrium in finite time. The uniqueness argument supplies the reason; a finite sampled picture is not its proof.">
    <OdePlot label="Distinct complete scalar histories relative to one equilibrium"
      xDomain={[0, 6]} yDomain={[0, 13]} xLabel="time" yLabel="state x"
      references={[{ value: 8, colour: colour.comparison }]}
      series={[2, 4, 12].map((initial, index) => ({ points: odeSamples(0, 6, time => logisticState(time, initial, .5, 8).state),
        colour: [colour.state, colour.input, colour.second][index] }))}>
      {({ x, y }) => <>
        {[2, 4, 12].map(initial => <OdeLabel key={initial} x={x(.15)} y={y(initial) - 10}>x₀={initial}</OdeLabel>)}
        <OdeLabel x={x(3)} y={y(8) - 15} colour={colour.comparison}>constant equilibrium 8</OdeLabel>
      </>}
    </OdePlot>
  </OdeFigure>;
}

import { useState } from 'react';
import { FlowLab, FlowControls, FlowSlider, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { adaptivePair, stiffDifference } from '../../data/ordinary-differential-equations-reading-models.js';
import { odeSolverRecord } from '../../data/ordinary-differential-equations-solver-record.js';
import { OdeFigure, OdeScene, OdePlot, OdeLabel, OdeArrow, OdeTable,
  odeSamples, odeFormat as f, odeColours as colour } from './OrdinaryDifferentialEquationsReadingPrimitives.jsx';

export function ScaledErrorComponents() {
  return <OdeFigure id="E58" caption="Divide estimated component errors by their own scales before aggregation. Here scale=.001+.009×1=.01 for each component. Scaled errors (1.2,0) have RMS √((1.2²+0²)/2)=.848528, which passes the aggregate threshold although the first component exceeds 1.">
    <OdeScene label="Actual error-to-scale division and squared-error aggregation" width={760} height={360}>
      {[1.2, 0].map((value, index) => <g key={index}>
        <OdeLabel x={30} y={70 + index * 100}>component {index + 1}</OdeLabel>
        <line x1={185} y1={82 + index * 100} x2={515} y2={82 + index * 100} stroke="#777" />
        <rect x={185} y={58 + index * 100} width={value * 200} height={24} fill={index ? colour.second : colour.state} fillOpacity={.4} />
        <line x1={385} y1={48 + index * 100} x2={385} y2={95 + index * 100} stroke={colour.comparison} strokeDasharray="4 3" />
        <OdeLabel x={535} y={77 + index * 100}>{value}²={value ** 2}</OdeLabel>
      </g>)}
      <OdeLabel x={385} y={225} anchor="middle" colour={colour.comparison}>scaled component threshold 1</OdeLabel>
      <OdeLabel x={50} y={285}>Mean square=(1.44+0)/2=.72</OdeLabel>
      <OdeLabel x={50} y={325} colour={colour.input}>RMS=√.72={f(Math.sqrt(.72))} &lt; 1</OdeLabel>
    </OdeScene>
    <OdeTable label="Actual normalization before the norm" columns={['Component', 'Estimated error', 'Scale', 'Normalized error']}
      rows={[[1, .012, .01, 1.2], [2, 0, .01, 0]]} />
  </OdeFigure>;
}

export function AdaptiveTrialLab() {
  const [width, setWidth] = useState(.4), [rtol, setRtol] = useState(.01);
  const result = adaptivePair(width, rtol);
  return <FlowLab id="ode-E59" label="Inspect the trial before changing the accepted state">
    <OdeFigure id="E59">
      <OdePlot label="Euler predictor and Heun corrector are trial states, distinct from the retained state"
        xDomain={[0, .55]} yDomain={[0, 1.15]} xLabel="time" yLabel="state y"
        series={[{ points: odeSamples(0, .5, t => Math.exp(-2 * t)), colour: '#bbb' },
          { points: [[0, 1], [width, result.predictor]], colour: colour.input, dashed: true, dots: true },
          { points: [[0, 1], [width, result.corrector]], colour: colour.second, dashed: true, dots: true }]}>
        {({ x, y }) => <>
          <line x1={x(width)} y1={y(result.predictor)} x2={x(width)} y2={y(result.corrector)} stroke={colour.comparison} strokeWidth={4} />
          <circle cx={x(result.retainedTime)} cy={y(result.retainedState)} r={7} fill={colour.state} stroke="#eee" />
          <OdeLabel x={605} y={24} anchor="end" colour={colour.state}>{result.accepted ? 'ACCEPT: retain corrector' : 'REJECT: retain (0,1)'}</OdeLabel>
        </>}
      </OdePlot>
      <p className="ode-diagram-key">Cyan is Euler; violet is Heun; the pink vertical segment is their estimated difference. The amber point is the accepted time and state after this decision. Grey is the exact reference.</p>
      <OdeTable label="The two-stage trial and its scaled acceptance decision"
        columns={['Operation', 'Actual value']}
        rows={[
          ['first slope', result.first], ['Euler predictor', f(result.predictor)], ['endpoint slope at predictor', f(result.second)],
          ['Heun corrector', f(result.corrector)], ['estimated difference', f(result.error)], ['scale=.001+rtol×max(1,|corrector|)', f(result.scale)],
          ['error / scale', f(result.ratio)], ['ratio ≤ 1?', result.accepted ? 'yes: accept' : 'no: reject'],
          ['retained time and state', `(${f(result.retainedTime)}, ${f(result.retainedState)})`],
          ['recommended next width (bounded factor)', f(result.nextWidth)],
        ]} />
    </OdeFigure>
    <FlowControls>
      <FlowSlider name="Trial width h" value={width} min={.025} max={.5} step={.025} onChange={setWidth} />
      <FlowSlider name="Relative tolerance" value={rtol} min={.001} max={.1} step={.001} onChange={setRtol} />
      <button type="button" onClick={() => { setWidth(.4); setRtol(.01); }}>Reset</button>
    </FlowControls>
    <FlowReadout>Each trial starts again at (0,1). The proposed width uses factor min(5,max(.2,.9/√ratio)), capped at 1 on rejection. This educational Euler/Heun pair differs from SciPy RK45 and supplies no global-error certificate.</FlowReadout>
  </FlowLab>;
}

export function AcceptedMeshAndQueries() {
  const record = odeSolverRecord.cooling, selected = record.query_times[13];
  const right = record.accepted_mesh.findIndex(time => time >= selected), left = right - 1;
  const X = time => 70 + 530 * time / 2;
  return <OdeFigure id="E60" caption="These are saved actual SciPy RK45 outputs for y₀=12, rate .3, T=2, rtol=10⁻⁸, atol=10⁻¹⁰, t_eval=None and dense_output=True. Nine accepted mesh nodes and 25 dense-output queries have different roles. Querying the interpolation does not create new accepted steps.">
    <OdeScene label="Actual accepted mesh and separately requested uniform dense-query locations" height={360}>
      <OdeLabel x={70} y={35} colour={colour.state}>accepted integration mesh</OdeLabel>
      <line x1={70} y1={100} x2={600} y2={100} stroke="#888" />
      {record.accepted_mesh.map((time, index) => <g key={index}>
        <circle cx={X(time)} cy={100} r={5} fill={colour.state} />
        <OdeLabel x={X(time)} y={index % 2 ? 70 : 135} anchor="middle">{index}</OdeLabel>
      </g>)}
      <OdeLabel x={70} y={190} colour={colour.input}>25 uniform interpolation queries</OdeLabel>
      <line x1={70} y1={235} x2={600} y2={235} stroke="#888" />
      {record.query_times.map((time, index) => <circle key={index} cx={X(time)} cy={235} r={3} fill={colour.input} />)}
      {[left, right].map(index => <line key={index} x1={X(record.accepted_mesh[index])} y1={100} x2={X(selected)} y2={235} stroke={colour.second} strokeDasharray="4 3" />)}
      <OdeLabel x={X(selected)} y={275} anchor="middle">query {f(selected, 4)} lies in this accepted interval</OdeLabel>
      <OdeLabel x={70} y={330}>time 0</OdeLabel><OdeLabel x={600} y={330} anchor="end">time 2</OdeLabel>
    </OdeScene>
    <OdeTable label="Every actual accepted mesh node, not reconstructed from the queries" columns={['Mesh index', 'Time', 'Accepted state']}
      rows={record.accepted_mesh.map((time, index) => [index, f(time, 9), f(record.accepted_states[index], 9)])} />
    <OdeTable label="Every separately evaluated dense query and its analytical error" tall
      columns={['Query index', 'Time', 'Interpolated state', 'Signed error']}
      rows={record.query_times.map((time, index) => [index, f(time, 9), f(record.queried_states[index], 9), f(record.query_errors[index], 9)])} />
    <p>Recorded NumPy {odeSolverRecord.versions.numpy}, SciPy {odeSolverRecord.versions.scipy}; {record.nfev} derivative evaluations, status {record.status}, success {String(record.success)}.</p>
  </OdeFigure>;
}

export function StiffDifferenceLab() {
  const [rate, setRate] = useState(80), [width, setWidth] = useState(.05), [initial, setInitial] = useState('1');
  const result = stiffDifference(rate, width, Number(initial));
  const extent = Math.max(1, ...result.rows.flatMap(row => [Math.abs(Math.asinh(row.explicit)), Math.abs(Math.asinh(row.implicit))])) * 1.1;
  return <FlowLab id="ode-E61" label="A slow trajectory can contain a restrictive fast perturbation">
    <OdeFigure id="E61">
      <OdePlot label="The exact slow part remains cos(t), independently of the fast decay rate"
        xDomain={[0, 1]} yDomain={[.4, 1.1]} xLabel="physical time" yLabel="slow part cos(t)"
        series={[{ points: odeSamples(0, 1, Math.cos), colour: '#bbb' }]} />
      <OdePlot label="The actual fast difference preserves sign and magnitude through an explicitly transformed vertical coordinate"
        xDomain={[0, 1]} yDomain={[-extent, extent]} xLabel="physical time" yLabel="asinh(z): nonlinear signed scale"
        references={[{ value: 0 }]} series={[
          { points: result.rows.map(row => [row.time, Math.asinh(row.explicit)]), colour: colour.state, dots: true },
          { points: result.rows.map(row => [row.time, Math.asinh(row.implicit)]), colour: colour.second, dots: true },
          { points: odeSamples(0, 1, t => Math.asinh(Number(initial) * Math.exp(-rate * t))), colour: '#bbb' },
        ]} />
      <p className="ode-diagram-key">Amber is explicit Euler on z′=−λz; violet is backward Euler on that same difference; grey is exact. The full trajectory is y=cos(t)+z. The nonlinear asinh axis retains all signed magnitudes; its extent changes to contain the actual values.</p>
      <OdeTable label="Nominal-step amplification factors (the last step may be shortened)"
        columns={['Exact exp(−λh)', 'Euler 1−λh', 'Backward Euler 1/(1+λh)', 'Interpretation']}
        rows={[[f(result.exactFactor), f(result.explicitFactor), f(result.implicitFactor),
          rate === 0 ? 'λ=0: difference is constant' : Math.abs(result.explicitFactor) >= 1 ? 'Euler lacks strict decay' : result.explicitFactor < 0 ? 'Euler alternates while decaying' : 'Euler decays without a sign change']]} />
      <OdeTable label="Every accepted difference and the corresponding full state at T=1" tall
        columns={['Time', 'Exact z', 'Euler z', 'Backward Euler z', 'Euler y=cos(t)+z']}
        rows={result.rows.map(row => [f(row.time), f(row.exact), f(row.explicit), f(row.implicit), f(Math.cos(row.time) + row.explicit)])} />
    </OdeFigure>
    <FlowControls>
      <FlowSlider name="Fast rate λ" value={rate} min={0} max={100} step={5} onChange={setRate} />
      <FlowSlider name="Width h" value={width} min={.01} max={.2} step={.01} onChange={setWidth} />
      <FlowChoice label="Initial difference z₀" value={initial} onChange={setInitial} options={[[ '0', '0: no transient' ], [ '1', '1: transient present' ]]} />
      <button type="button" onClick={() => { setRate(80); setWidth(.05); setInitial('1'); }}>Reset</button>
    </FlowControls>
    <FlowReadout>All runs end at the same T=1. Stability, positivity and accuracy are separate questions. These exact scalar update formulas expose the fast mode; they do not rank full production solvers for every problem.</FlowReadout>
  </FlowLab>;
}

export function MissedEventBrackets() {
  const event = t => (t - .25) * (t - .75);
  return <OdeFigure id="E62" caption="The analytical event function has two roots between positive endpoints at 0 and 1. A whole-interval sign test therefore misses both. The brackets [.2,.3] and [.7,.8] expose this example’s crossings; a smaller max_step is not a general detection proof. A tangent root need not change sign at all.">
    <OdePlot label="Two actual crossing roots are concealed by a single same-sign bracket"
      xDomain={[0, 1]} yDomain={[-.08, .23]} xLabel="time t" yLabel="g(t)=(t−.25)(t−.75)"
      references={[{ value: 0 }]} series={[{ points: odeSamples(0, 1, event), colour: colour.input },
        { points: [[0, event(0)], [1, event(1)]], colour: colour.comparison, dashed: true, dots: true }]}>
      {({ x, y }) => <>{[[.2, .3], [.7, .8]].map(([left, right]) => <g key={left}>
        <rect x={x(left)} y={y(.02)} width={x(right) - x(left)} height={y(-.03) - y(.02)} fill={colour.state} fillOpacity={.18} />
        <circle cx={x((left + right) / 2)} cy={y(0)} r={5} fill={colour.state} />
      </g>)}</>}
    </OdePlot>
    <OdePlot label="A touching root has positive signs on both sides"
      xDomain={[0, 1]} yDomain={[-.02, .3]} xLabel="time t" yLabel="g(t)=(t−.5)²"
      references={[{ value: 0 }]} series={[{ points: odeSamples(0, 1, t => (t - .5) ** 2), colour: colour.second }]}>
      {({ x, y }) => <circle cx={x(.5)} cy={y(0)} r={5} fill={colour.second} />}
    </OdePlot>
  </OdeFigure>;
}

export function SolverStatusLocations() {
  const eventTime = Math.log(4) / .2, failure = odeSolverRecord.blowup;
  return <OdeFigure id="E63" caption="A terminal cooling event at 10 stops successfully before the requested 20-minute horizon. The separate recorded x′=x² attempt fails near its finite lifetime at 1. Its final floating-point time slightly beyond 1 is a solver failure observation, not a classical continuation of the initial solution.">
    <OdePlot label="A successful terminal event and an uncomputed requested continuation"
      xDomain={[0, 20]} yDomain={[0, 44]} xLabel="time (min)" yLabel="cooling excess (K)"
      references={[{ value: 10 }, { axis: 'x', value: eventTime }, { axis: 'x', value: 20 }]}
      series={[{ points: odeSamples(0, eventTime, t => 40 * Math.exp(-.2 * t)) }]}>
      {({ x, y }) => <>
        <circle cx={x(eventTime)} cy={y(10)} r={6} fill={colour.state} />
        <OdeLabel x={x(8)} y={y(20)}>event at {f(eventTime, 9)}</OdeLabel>
        <OdeLabel x={x(18)} y={y(36)} anchor="end">requested T=20</OdeLabel>
      </>}
    </OdePlot>
    <OdeTable label="Status, success and attained time answer different questions"
      columns={['Recorded case', 'Status', 'Success', 'Attained time', 'Interpretation']}
      rows={[
        ['cooling dense-output solve', odeSolverRecord.cooling.status, String(odeSolverRecord.cooling.success), 2, 'requested horizon reached'],
        ['terminal threshold cooling', 1, 'true', f(eventTime, 9), 'event reached; horizon20 not computed'],
        ['x′=x², requested T=2', failure.status, String(failure.success), f(failure.attained_time, 12), failure.message],
      ]} />
    <p>The failed attempt’s last finite numerical state was {f(failure.last_state)}, with {failure.nfev} derivative evaluations. These diagnostic outputs cannot repair the equation’s missing finite continuation.</p>
  </OdeFigure>;
}

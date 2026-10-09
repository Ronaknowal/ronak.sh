import { useId } from 'react';
import { flowNumber as number } from './LessonFlow.jsx';
import { linearOdeComparison, odeStep } from '../../data/neural-ode-models.js';
import { observedFlow, linearPatch } from '../../data/neural-ode-flow-models.js';
import './neural-ode-flow.css';

export const odeFlowRoles = {
  input: '#79c8e8', parameter: '#e6bb60', computed: '#c5a5e8',
  operation: '#e2e2e2', forward: '#858585', derivative: '#f09a68',
};

export function OdeArray({ values, names, role = 'computed', roles, digits = 4, label }) {
  return <div className="ode-flow-array" role="group" aria-label={label}>
    {values.map((value, index) => <div key={index} className="ode-flow-value"
      style={{ '--ode-role': odeFlowRoles[roles?.[index] ?? role] }}>
      <span>{names?.[index] ?? `coordinate ${index + 1}`}</span>
      <strong>{number(value, digits)}</strong>
    </div>)}
  </div>;
}

export function OdeWire({ children, backward = false }) {
  return <div className={`ode-flow-wire${backward ? ' ode-flow-wire--backward' : ''}`}>
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <path d="M20 2 V30 M12 23 L20 33 L28 23" />
    </svg>
    {children && <span>{children}</span>}
  </div>;
}

export function OdeOperation({ name, children }) {
  return <div className="ode-flow-operation">
    <span className="ode-flow-operation-symbol">{name}</span>
    {children && <span>{children}</span>}
  </div>;
}

export function OdeMatrix({ matrix, rowNames, columnNames, label, role = 'parameter' }) {
  const scrollHint = useId();
  const matrixLabel = useId();
  return <>
    <p id={matrixLabel}>{label}</p>
    <p id={scrollHint}>Read across the labelled columns. On a narrow screen, scroll this matrix sideways; when it has keyboard focus, use the left and right arrow keys.</p>
    <div className="ode-flow-matrix-scroll" tabIndex={0} aria-labelledby={matrixLabel} aria-describedby={scrollHint}>
    <table className="ode-flow-matrix" aria-labelledby={matrixLabel} style={{ '--ode-role': odeFlowRoles[role] }}>
      <thead><tr><th scope="col">output row</th>
        {columnNames.map(name => <th key={name} scope="col">{name}</th>)}
      </tr></thead>
      <tbody>{matrix.map((row, index) => <tr key={index}>
        <th scope="row">{rowNames[index]}</th>
        {row.map((value, column) => <td key={column}>{number(value, 4)}</td>)}
      </tr>)}</tbody>
    </table>
    </div>
  </>;
}

export function OdeDecayStepDrawing() {
  const x = time => 40 + 240 * time / .1;
  const y = state => 110 - 320 * (state - .75);
  const exact = Array.from({ length: 33 }, (_, index) => {
    const time = .1 * index / 32;
    return `${x(time)},${y(Math.exp(-2 * time))}`;
  }).join(' ');
  return <figure aria-label="State1, rate−2, interval0.1, change−0.2 and Euler state0.8, compared with exact0.81873.">
    <div className="ode-flow-split-route">
      <div><OdeArray values={[1]} names={['starting state z']} role="input" />
        <OdeWire>copy this state to the final add</OdeWire>
      </div>
      <div><OdeArray values={[-2]} names={['fixed coefficient']} role="parameter" />
        <OdeOperation name="×">−2 × the starting 1</OdeOperation>
        <OdeArray values={[-2]} names={['rate per unit time']} />
        <OdeWire />
        <OdeOperation name="×">interval h = 0.1</OdeOperation>
        <OdeArray values={[-.2]} names={['proposed change']} />
      </div>
    </div>
    <OdeWire>unchanged state + proposed change</OdeWire>
    <OdeOperation name="+">1 + (−0.2)</OdeOperation>
    <OdeArray values={[.8]} names={['accepted Euler state']} />
    <svg className="ode-flow-scene" viewBox="0 0 360 152" role="img"
      aria-label="At time0.1, Euler0.8 lies0.01873 below the exact state0.81873.">
      <path d="M40 110 H320 M40 110 V20" />
      <text x="40" y="135">time 0</text><text x="228" y="135">time 0.1</text>
      <polyline points={exact} stroke={odeFlowRoles.input} />
      <path d={`M40 ${y(1)} L280 ${y(.8)}`} stroke={odeFlowRoles.computed} strokeDasharray="6 4" />
      <path d={`M280 ${y(Math.exp(-.2))} V${y(.8)}`} stroke={odeFlowRoles.derivative} strokeWidth="3" />
      <text x="86" y="22" fill={odeFlowRoles.input}>exact decay</text>
      <text x="210" y="77">0.81873</text>
      <text x="126" y="109" fill={odeFlowRoles.computed}>Euler 0.8</text>
      <text x="13" y="34">1</text>
      <circle cx="40" cy={y(1)} r="4" fill={odeFlowRoles.input} />
      <circle cx="280" cy={y(Math.exp(-.2))} r="4" fill={odeFlowRoles.input} />
      <circle cx="280" cy={y(.8)} r="4" fill={odeFlowRoles.computed} />
    </svg>
  </figure>;
}

export function OdeTinyFieldDrawing() {
  const hidden = [Math.tanh(1.1), Math.tanh(.3)];
  const velocity = [.5 * hidden[0] - .25 * hidden[1] + .05,
    -.2 * hidden[0] + .4 * hidden[1] - .1];
  return <figure aria-label="The complete constructed two-state neural field, its input and output matrices, biases, tanh and an Euler state add.">
    <OdeArray values={[1, 0, 0]} names={['state z₁', 'state z₂', 'clock t']} role="input" />
    <OdeWire>each row uses all three supplied values</OdeWire>
    <OdeMatrix matrix={[[1, -1, .5], [.5, .25, -.5]]}
      rowNames={['hidden 1', 'hidden 2']} columnNames={['z₁', 'z₂', 't']}
      label="Input weights: two output rows × three inputs" />
    <OdeArray values={[.1, -.2]} names={['bias b₁,₁', 'bias b₁,₂']} role="parameter" />
    <OdeOperation name="Σ + b">
      <span>1×1 − 1×0 + 0.5×0 + 0.1 = 1.1</span>
      <span>0.5×1 + 0.25×0 − 0.5×0 − 0.2 = 0.3</span>
    </OdeOperation>
    <OdeArray values={[1.1, .3]} names={['hidden sum 1', 'hidden sum 2']} />
    <OdeWire /><OdeOperation name="tanh" />
    <OdeArray values={hidden} names={['hidden output q₁', 'hidden output q₂']} />
    <OdeWire>each derivative row reads both hidden outputs</OdeWire>
    <OdeMatrix matrix={[[.5, -.25], [-.2, .4]]} rowNames={['rate 1', 'rate 2']}
      columnNames={['q₁', 'q₂']} label="Output weights: two rates × two hidden outputs" />
    <OdeArray values={[.05, -.1]} names={['bias b₂,₁', 'bias b₂,₂']} role="parameter" />
    <OdeOperation name="Σ + b" />
    <OdeArray values={velocity} digits={6} names={['rate dz₁/dt', 'rate dz₂/dt']} />
    <OdeWire>the network ends here; the solver makes the move</OdeWire>
    <OdeOperation name="× h">h = 0.1</OdeOperation>
    <OdeArray values={velocity.map(value => .1 * value)} names={['change Δz₁', 'change Δz₂']} />
    <OdeWire /><OdeOperation name="+ z">preserved starting state (1, 0)</OdeOperation>
    <OdeArray values={[1 + .1 * velocity[0], .1 * velocity[1]]}
      names={['next state z₁', 'next state z₂']} digits={6} />
  </figure>;
}

export function OdeFieldSolverReadoutDrawing() {
  return <figure aria-label="A state enters repeated field rate evaluations, each numerical move updates the state, and the final state enters a class readout. The supplied class goes only to loss.">
    <div className="ode-flow-unrolled">
      <div><OdeArray values={[1, 0]} names={['initial z₁', 'initial z₂']} role="input" />
        <OdeWire /><OdeOperation name="fθ(t, z)">the same learned field</OdeOperation>
        <OdeWire>returns a rate vector, not the next state</OdeWire>
        <OdeOperation name="× h, + z">one numerical move</OdeOperation>
        <OdeWire /><OdeOperation name="repeat">update the clock and state; reuse θ</OdeOperation>
      </div>
      <div><OdeWire>the final full state reaches the readout</OdeWire>
        <OdeOperation name="Wz + b">class scores</OdeOperation>
        <OdeWire /><OdeOperation name="softmax">probabilities</OdeOperation>
        <OdeWire /><OdeOperation name="loss">compare with the supplied correct class</OdeOperation>
        <p className="ode-flow-label-route">Correct class → loss only. It is separate from the state/field/solver path.</p>
      </div>
    </div>
  </figure>;
}

export function OdePlane({ matrix = [[0, -1], [1, 0]], initial = [1, 0],
  endpoint = 1, steps = 4, method = 'euler', showField = true,
  stageIndex = null, probe = 0 }) {
  const id = useId().replaceAll(':', '');
  const result = linearOdeComparison(matrix, initial, endpoint, steps, method);
  const extent = Math.max(1.3, ...result.trace.flatMap(row => row.map(Math.abs)),
    ...result.exactTrace.flatMap(row => row.map(Math.abs)),
    ...result.stages.flatMap(stages => stages.flatMap(stage => stage.state.map(Math.abs)))) * 1.08;
  const px = value => 180 + 130 * value / extent;
  const py = value => 166 - 130 * value / extent;
  const velocityScale = .15;
  const selected = stageIndex === null ? null : Math.min(stageIndex, steps - 1);
  const selectedStages = selected === null ? [] : result.stages[selected];
  const activeProbe = selectedStages[Math.min(probe, selectedStages.length - 1)];
  const path = rows => rows.map(row => `${px(row[0])},${py(row[1])}`).join(' ');
  const exactLabel = [Math.min(190, Math.max(12, px(result.exact[0]) - 110)),
    Math.max(28, py(result.exact[1]) - 25)];
  const acceptedLabel = [Math.min(190, Math.max(12, px(result.endpoint[0]) - 110)),
    Math.min(320, py(result.endpoint[1]) + 31)];
  return <figure aria-label="A coordinate plane separates scaled field velocity arrows, the exact curve, the accepted numerical path and tentative solver probes.">
    <svg className="ode-flow-scene" viewBox="0 0 360 358" role="img"
      aria-label={`${method},${steps} accepted intervals, local arrows use0.15 coordinate-units per rate unit; equal axes span±${number(extent, 3)}.`}>
      <defs><marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5"
        markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" fill={odeFlowRoles.forward} stroke="none" />
      </marker></defs>
      <path d="M35 166 H326 M180 20 V314" />
      <text x="20" y="345">horizontal x</text><text x="12" y="16">vertical y</text>
      <text x="30" y="187">−{number(extent, 2)}</text>
      <text x="269" y="187">+{number(extent, 2)}</text>
      <text x="190" y="32">+{number(extent, 2)}</text>
      <text x="190" y="309">−{number(extent, 2)}</text>
      {showField && [-.35, 0, .35].flatMap(x => [-.35, 0, .35].map(y => {
        const state = [x * extent, y * extent];
        const velocity = matrix.map(row => row[0] * state[0] + row[1] * state[1]);
        return <line key={`${x}-${y}`} x1={px(state[0])} y1={py(state[1])}
          x2={px(state[0] + velocityScale * velocity[0])}
          y2={py(state[1] + velocityScale * velocity[1])}
          markerEnd={`url(#${id}-arrow)`} />;
      }))}
      <polyline points={path(result.exactTrace)} stroke={odeFlowRoles.input} />
      <polyline points={path(result.trace)} stroke={odeFlowRoles.computed} strokeDasharray="7 4" />
      {result.trace.map((state, index) => <circle key={index} cx={px(state[0])}
        cy={py(state[1])} r="3" fill={odeFlowRoles.computed} />)}
      {selectedStages.map((stage, index) => <circle key={index} cx={px(stage.state[0])}
        cy={py(stage.state[1])} r={index === probe ? 7 : 4} stroke={odeFlowRoles.derivative}
        fill="none" strokeWidth={index === probe ? 2.5 : 1.5} />)}
      <circle cx={px(initial[0])} cy={py(initial[1])} r="5" fill={odeFlowRoles.input} />
      <path d={`M${px(result.exact[0])} ${py(result.exact[1])} L${exactLabel[0] + 95} ${exactLabel[1] + 5}`}
        stroke={odeFlowRoles.input} />
      <text x={exactLabel[0]} y={exactLabel[1]} fill={odeFlowRoles.input}>exact endpoint</text>
      <path d={`M${px(result.endpoint[0])} ${py(result.endpoint[1])} L${acceptedLabel[0] + 95} ${acceptedLabel[1] - 15}`}
        stroke={odeFlowRoles.computed} strokeDasharray="4 3" />
      <text x={acceptedLabel[0]} y={acceptedLabel[1]} fill={odeFlowRoles.computed}>{method}: accepted</text>
    </svg>
    <p>Gray arrow length is 0.15 × the local rate in state units. Axis extent is printed above; it can change with the edited case.</p>
    {activeProbe && <p>The orange hollow probe is evaluation {Math.min(probe, selectedStages.length - 1) + 1}
      {' '}at clock {number(activeProbe.time)}, state ({activeProbe.state.map(value => number(value)).join(', ')}),
      {' '}rate ({activeProbe.derivative.map(value => number(value)).join(', ')}). It has not become another accepted step.</p>}
  </figure>;
}

export function OdeRotationFieldDrawing() {
  return <OdePlane steps={64} method="rk4" />;
}

export function OdeRotationEulerDrawing() {
  return <OdePlane steps={4} method="euler" showField={false} />;
}

export function OdeRkStagesDrawing() {
  const result = odeStep((_, [x, y]) => [-y, x], 0, [1, 0], .25, 'rk4');
  return <figure aria-label="The four actual classical RK4 probe clocks, coordinates and rates contribute to one weighted accepted endpoint.">
    {result.stages.map((stage, index) => <div key={index} className="ode-flow-stage">
      <p>Probe {index + 1} · clock {number(stage.time)}</p>
      <OdeArray values={stage.state} names={['tentative x', 'tentative y']} role="input" />
      <OdeWire /><OdeOperation name="f(x, y) = (−y, x)" />
      <OdeArray values={stage.derivative} names={[`rate k${index + 1},x`, `rate k${index + 1},y`]} />
      {index < 3 && <p>Next probe starts again from (1, 0), using the taught weighted rate.</p>}
    </div>)}
    <OdeWire>combine these four rates, not four successive states</OdeWire>
    <OdeOperation name="Σ">h × (k₁ + 2k₂ + 2k₃ + k₄) / 6</OdeOperation>
    <OdeWire /><OdeOperation name="+ z">original accepted state (1, 0)</OdeOperation>
    <OdeArray values={result.next} names={['accepted x', 'accepted y']} digits={6} />
  </figure>;
}

export function OdeCoordinates({ series, xLabel = 'clock t', yLabel = 'state',
  xDomain, yDomain, marks = [], children }) {
  const points = series.flatMap(row => row.values);
  const xs = xDomain ?? [Math.min(...points.map(point => point[0])), Math.max(...points.map(point => point[0]))];
  const ys = yDomain ?? [Math.min(0, ...points.map(point => point[1])), Math.max(0, ...points.map(point => point[1]))];
  const xSpan = xs[1] - xs[0] || 1;
  const ySpan = ys[1] - ys[0] || 1;
  const x = value => 44 + 258 * (value - xs[0]) / xSpan;
  const y = value => 245 - 205 * (value - ys[0]) / ySpan;
  let nextLabelY = 320;
  const labels = series.map(row => {
    const lines = [''];
    row.label.split(' ').forEach(word => {
      const last = lines.length - 1;
      if ((lines[last] + ' ' + word).trim().length > 33 && lines[last]) lines.push(word);
      else lines[last] = (lines[last] + ' ' + word).trim();
    });
    const top = nextLabelY;
    nextLabelY += lines.length * 22 + 10;
    return { top, lines };
  });
  return <svg className="ode-flow-scene" viewBox={`0 0 360 ${nextLabelY + 10}`}
    role="img" aria-label={`${xLabel} against ${yLabel}; numerical domains and each drawn series are labelled.`}>
    <path d="M44 30 V245 H309" />
    <text x="8" y="24">{yLabel}</text>
    <text x="44" y="271">{number(xs[0], 3)}</text>
    <text x="285" y="271">{number(xs[1], 3)}</text>
    <text x="100" y="298">{xLabel}</text>
    <text x="4" y="245">{number(ys[0], 2)}</text>
    <text x="4" y="48">{number(ys[1], 2)}</text>
    {series.map((row, index) => <g key={row.label}>
      <polyline points={row.values.map(point => `${x(point[0])},${y(point[1])}`).join(' ')}
        stroke={row.color ?? odeFlowRoles.computed} strokeDasharray={row.dashed ? '7 4' : undefined} />
      {row.dots && row.values.map((point, pointIndex) => <circle key={pointIndex}
        cx={x(point[0])} cy={y(point[1])} r="3" fill={row.color ?? odeFlowRoles.computed} />)}
      <path d={`M${x(row.values.at(-1)[0])} ${y(row.values.at(-1)[1])} H327 V${labels[index].top} H44`}
        stroke={row.color ?? odeFlowRoles.computed} strokeDasharray={row.dashed ? '7 4' : undefined} />
      <text x="44" y={labels[index].top + 17} fill={row.color ?? odeFlowRoles.computed}>
        {labels[index].lines.map((line, lineIndex) => <tspan key={lineIndex} x="44" dy={lineIndex ? 22 : 0}>{line}</tspan>)}
      </text>
    </g>)}
    {marks.map((mark, index) => <g key={index}>
      <circle cx={x(mark.x)} cy={y(mark.y)} r="5" fill="none" stroke={odeFlowRoles.parameter} />
      <text x={x(mark.x) + 5} y={y(mark.y) - 8}>{mark.label}</text>
    </g>)}
    {children?.({ x, y })}
  </svg>;
}

export function OdeAdaptiveEstimateDrawing() {
  const start = 1;
  const h = .1;
  const first = -start;
  const euler = start + h * first;
  const second = -euler;
  const heun = start + h * (first + second) / 2;
  return <figure aria-label="Euler and Heun share the first rate and produce two endpoint estimates; their difference enters the controller.">
    <OdeArray values={[start, h]} names={['old state', 'proposed interval']} role="input" />
    <OdeWire /><OdeOperation name="rate −z">first rate −1</OdeOperation>
    <OdeWire /><OdeOperation name="Euler">1 + 0.1 × (−1)</OdeOperation>
    <OdeArray values={[euler]} names={['tentative Euler endpoint']} />
    <OdeWire /><OdeOperation name="rate −z">second rate −0.9 at that tentative endpoint</OdeOperation>
    <OdeWire /><OdeOperation name="Heun">1 + 0.1 × (−1 − 0.9) / 2</OdeOperation>
    <OdeArray values={[heun, heun - euler]} names={['tentative Heun endpoint', 'difference Heun − Euler']} />
    <p>Neither endpoint has been accepted yet. The controller reads the difference 0.005.</p>
  </figure>;
}

export function OdeAdaptiveScaleDrawing() {
  return <figure aria-label="A difference is divided by an absolute-plus-relative coordinate scale before squaring, averaging and taking a square root.">
    <OdeArray values={[.005]} names={['Heun − Euler']} />
    <OdeWire /><OdeOperation name="÷ scale">0.001 + 0.02 × max(1, 0.905) = 0.021</OdeOperation>
    <OdeArray values={[.005 / .021]} names={['standardized difference']} />
    <OdeWire /><OdeOperation name="square → mean → √">one coordinate: √(0.238095²)</OdeOperation>
    <OdeArray values={[.005 / .021]} names={['ratio r; accept if r ≤ 1']} />
  </figure>;
}

export function OdeAdaptiveAttemptsDrawing() {
  return <figure aria-label="An accepted attempt advances state and time; a rejected attempt returns to the same old state with a smaller interval.">
    <OdeArray values={[1, .1]} names={['old state', 'proposed h']} role="input" />
    <OdeWire /><OdeOperation name="two rate evaluations">Euler 0.9; Heun 0.905; compare difference with scale</OdeOperation>
    <div className="ode-flow-split-route">
      <div><OdeWire>r ≤ 1</OdeWire><OdeArray values={[.905, .1]} names={['accepted state', 'advanced clock']} />
        <OdeWire>choose next interval from this new state</OdeWire></div>
      <div><OdeWire>r &gt; 1</OdeWire><OdeArray values={[1, 0]} names={['unchanged old state', 'unchanged clock']} role="input" />
        <OdeWire>reduce h and retry; do not keep the failed endpoint</OdeWire></div>
    </div>
  </figure>;
}

export function OdeStiffnessDrawing() {
  const times = Array.from({ length: 65 }, (_, index) => index * .4 / 64);
  return <figure aria-label="Slow and fast decaying perturbations share the same clock; explicit and implicit formulas have different amplification.">
    <OdeCoordinates series={[
      { label: 'slow: exp(−t)', color: odeFlowRoles.input, values: times.map(time => [time, Math.exp(-time)]) },
      { label: 'fast: exp(−100t)', color: odeFlowRoles.computed, dashed: true, values: times.map(time => [time, Math.exp(-100 * time)]) },
    ]} yDomain={[0, 1]} />
    <OdeOperation name="Euler">κ = 100, h = 0.1: multiply by 1 − κh = −9</OdeOperation>
    <OdeOperation name="backward Euler">solve (1 + κh) z_new = z_old; multiply by 1 / 11</OdeOperation>
  </figure>;
}

export function OdeDiscreteReverseDrawing() {
  const rate = -.7;
  const initial = 1.2;
  const h = .325;
  const final = initial * (1 + h * rate);
  const adjoint = final - .4;
  return <figure aria-label="The one-step loss credit splits into identity, state-rate and shared-parameter routes with each derivative product labelled.">
    <OdeArray values={[initial, rate, h]} names={['starting state', 'field weight θ', 'interval h']} roles={['input', 'parameter', 'input']} />
    <OdeWire /><OdeOperation name="z + hθz">accepted state 0.927</OdeOperation>
    <OdeWire /><OdeOperation name="½(z − target)²">target 0.4; terminal state credit 0.527</OdeOperation>
    <OdeWire backward>reverse credit splits at the state add</OdeWire>
    <div className="ode-flow-split-route">
      <div><OdeArray values={[adjoint]} names={['identity-route credit']} role="derivative" />
        <OdeWire backward /><OdeArray values={[adjoint * h * rate]} names={['rate-route state credit']} role="derivative" />
        <OdeOperation name="+">0.527 − 0.1198925 = 0.4071075</OdeOperation></div>
      <div><OdeArray values={[adjoint * h]} names={['credit arriving at θz']} role="derivative" />
        <OdeWire backward>multiply by the rate's θ derivative, z = 1.2</OdeWire>
        <OdeArray values={[adjoint * h * initial]} names={['weight credit dL/dθ']} role="derivative" /></div>
    </div>
  </figure>;
}

export function OdeContinuousReverseDrawing() {
  return <figure aria-label="The backward augmented solve starts at clock T, terminal state, terminal loss derivative and zero parameter accumulator.">
    <OdeArray values={[1.3, .4273416300468749, .0273416300468749, 0]}
      names={['start reverse clock T', 'finite forward endpoint z(T)', 'terminal adjoint a(T)', 'parameter accumulator g(T)']}
      role="input" />
    <OdeWire backward>actual clock decreases from 1.3 to 0</OdeWire>
    <OdeMatrix matrix={[[-.7, 0, 0], [0, .7, 0]]}
      rowNames={['z′ = θz', 'a′ = −θa']} columnNames={['state z', 'adjoint a', 'accumulator g']}
      label="State and adjoint rates are independent of g" />
    <OdeOperation name="g′ = −az">accumulate weight credit along this reconstructed state/adjoint path</OdeOperation>
    <OdeWire backward /><p>At clock zero, read a(0) and g(0). This is a backward differential solve, not the discrete reverse circuit above.</p>
  </figure>;
}

export function OdeObservationAdjointDrawing() {
  return <figure aria-label="State observation losses insert additional adjoint credit at their own times; a running cost adds another derivative source.">
    <OdeArray values={[.5, .8]} names={['reconstructed state at observation', 'observed target']} role="input" />
    <OdeWire backward /><OdeOperation name="add observation credit">a(t⁻) = a(t⁺) + (0.5 − 0.8)</OdeOperation>
    <OdeArray values={[-.3]} names={['new observation contribution']} role="derivative" />
    <OdeWire backward>continue toward the previous observation</OdeWire>
    <p>A running half-square cost r(z) = z²/2 contributes −z continuously to a′, rather than a jump only at a requested output time.</p>
  </figure>;
}

export function OdeReverseConditioningDrawing() {
  const exactEndpoint = Math.exp(-20);
  const shifted = exactEndpoint + 1e-8;
  return <figure aria-label="Forward decay multiplies by exp minus20, while backward reconstruction magnifies a small endpoint perturbation by exp20.">
    <OdeArray values={[1]} names={['initial state']} role="input" />
    <OdeWire>forward: multiply by exp(−20)</OdeWire>
    <OdeArray values={[exactEndpoint, shifted]} digits={12} names={['exact endpoint', 'endpoint plus 10⁻⁸']} />
    <OdeWire backward>backward: multiply by exp(20)</OdeWire>
    <OdeArray values={[1, shifted * Math.exp(20)]} names={['exact reconstruction', 'perturbed reconstruction']} role="derivative" />
    <p>Checkpoint anchors keep selected forward states. Replay reconstructs a shorter interval from each anchor instead of relying only on the rounded final state.</p>
  </figure>;
}

export function OdeOrderingDrawing() {
  const clocks = Array.from({ length: 33 }, (_, index) => index / 32);
  return <figure aria-label="Three exact one-dimensional decay paths preserve the outer-middle-outer order at every shared clock.">
    <OdeCoordinates series={[-1, 0, 1].map((start, index) => ({
      label: `${['left class 1', 'middle class 0', 'right class 1'][index]}: start ${start}`,
      values: clocks.map(time => [time, start * Math.exp(-time)]), dashed: index === 1,
      color: index === 1 ? odeFlowRoles.parameter : odeFlowRoles.input,
    }))} yDomain={[-1.2, 1.2]} yLabel="1D position z" />
  </figure>;
}

export function OdeLiftDrawing({ points = [-1, 0, 1], endpoint = 1, threshold = .5 }) {
  const xMin = Math.min(-1.5, ...points) - .2;
  const xMax = Math.max(1.5, ...points) + .2;
  const yMax = Math.max(1.3, threshold + .2, ...points.map(value => endpoint * value * value));
  const x = value => 44 + 260 * (value - xMin) / (xMax - xMin);
  const y = value => 265 - 205 * value / yMax;
  return <figure aria-label="Each input keeps its horizontal coordinate and gains height T times x squared. A horizontal readout threshold changes its class.">
    <svg className="ode-flow-scene" viewBox="0 0 360 410" role="img" aria-label="The actual augmented x,a plane, with final coordinates and readout threshold.">
      <path d="M44 32 V265 H310" />
      <text x="12" y="23">added height a</text><text x="96" y="303">unchanged input x</text>
      <text x="44" y="285">{number(xMin, 2)}</text><text x="275" y="285">{number(xMax, 2)}</text>
      <text x="4" y="265">0</text><text x="4" y="65">{number(yMax, 2)}</text>
      <path d={`M44 ${y(threshold)} H310`} stroke={odeFlowRoles.parameter} strokeDasharray="7 4" />
      <text x="44" y="334" fill={odeFlowRoles.parameter}>class 1 when height &gt; {number(threshold)}</text>
      {points.map((value, index) => <g key={index}>
        <line x1={x(value)} y1={y(0)} x2={x(value)} y2={y(endpoint * value * value)} stroke={odeFlowRoles.computed} />
        <circle cx={x(value)} cy={y(0)} r="5" fill={odeFlowRoles.input} />
        <circle cx={x(value)} cy={y(endpoint * value * value)} r="5" fill={odeFlowRoles.computed} />
        <text x="44" y={360 + index * 21}>point {index + 1}: ({number(value)}, {number(endpoint * value * value)}) → class {Number(endpoint * value * value > threshold)}</text>
      </g>)}
    </svg>
  </figure>;
}

export function OdeOrderNumericalDrawing() {
  return <figure aria-label="At one coarse step, Euler reverses three positions while exact positive decay preserves their order.">
    <OdeArray values={[-1, 0, 1]} names={['left starting point', 'middle', 'right starting point']} role="input" />
    <div className="ode-flow-split-route">
      <div><OdeWire>Euler h = 1, θ = −2: factor −1</OdeWire>
        <OdeArray values={[1, 0, -1]} names={['former left', 'middle', 'former right']} /></div>
      <div><OdeWire>exact: factor exp(−2) &gt; 0</OdeWire>
        <OdeArray values={[-Math.exp(-2), 0, Math.exp(-2)]} names={['left stays left', 'middle', 'right stays right']} /></div>
    </div>
  </figure>;
}

export function OdeParameterizationsDrawing() {
  return <figure aria-label="Clock input, piecewise field selection, weighted field basis and generated weights are four different parameter routes.">
    <div className="ode-flow-split-route">
      <div><OdeArray values={[1, .25]} names={['state z', 'clock t']} role="input" />
        <OdeWire /><OdeMatrix matrix={[[.5, .2]]} rowNames={['rate']}
          columnNames={['z', 't']} label="Concatenated clock input" />
        <OdeArray values={[.55]} names={['rate 0.5×1 + 0.2×0.25']} /></div>
      <div><OdeArray values={[.25]} names={['clock t']} role="input" />
        <OdeWire /><OdeOperation name="t &lt; 0.5 ?">select f₀(z) = −z; later select f₁(z) = z</OdeOperation>
        <OdeArray values={[-1]} names={['selected rate at z = 1']} /></div>
      <div><OdeArray values={[-1, 1]} names={['rate from f₀', 'rate from f₁']} />
        <OdeWire /><OdeOperation name="weighted add">(1−0.25)×(−1) + 0.25×1</OdeOperation>
        <OdeArray values={[-.5]} names={['basis-blended rate']} /></div>
      <div><OdeArray values={[.25]} names={['clock supplied to weight generator']} role="input" />
        <OdeWire /><OdeOperation name="w(t) = 2t">generated weight 0.5</OdeOperation>
        <OdeWire /><OdeOperation name="w(t) × z">0.5 × the state 1</OdeOperation>
        <OdeArray values={[.5]} names={['generated-weight rate']} /></div>
    </div>
  </figure>;
}

export function OdeObservationDrawing({ events = [{ time: .2, value: 1 },
  { time: .9, value: -.5 }, { time: 1.3, value: .8 }], query = 1.6, decay = .5,
  mixing = .3, omit = -1 }) {
  const result = observedFlow({ events, query, decay, mixing, omit });
  const domain = [0, Math.max(.1, query, ...events.map(event => event.time)) + .15];
  const allStates = result.segments.flatMap(segment => segment.map(point => point[1]));
  return <figure aria-label="Actual hidden-state decay segments and observation jumps, with a query boundary that excludes future measurements.">
    <OdeCoordinates series={result.segments.map((values, index) => ({
      label: index === result.segments.length - 1 ? 'propagate to query; no new observation' : `propagation segment ${index + 1}`,
      values, color: odeFlowRoles.computed,
    }))} xDomain={domain} yDomain={[Math.min(-.05, ...allStates) - .05, Math.max(.1, ...allStates) + .05]}>
      {({ x, y }) => <>
        <path d={`M${x(query)} 32 V245`} stroke={odeFlowRoles.parameter} strokeDasharray="7 4" />
        <text x="120" y="24" fill={odeFlowRoles.parameter}>query t={number(query)}</text>
        {result.updates.map(update => <g key={update.index}>
          <line x1={x(update.time)} y1={y(update.before)} x2={x(update.time)} y2={y(update.after)}
            stroke={odeFlowRoles.input} strokeWidth="3" />
          <circle cx={x(update.time)} cy={y(update.after)} r="4" fill={odeFlowRoles.input} />
        </g>)}
      </>}
    </OdeCoordinates>
    <ol className="ode-flow-event-list">{events.map((event, index) => <li key={index}>
      Measurement {index + 1}: time {number(event.time)}, value {number(event.value)};
      {' '}{index === omit ? 'omitted' : result.available[index] ? 'available and assimilated' : 'future: excluded from query'}.
    </li>)}</ol>
    <p>Cyan vertical jumps are the measurement updates. The final query state is {number(result.state, 9)}.</p>
  </figure>;
}

export function OdeLatentDrawing() {
  const mean = .4;
  const scale = .6;
  const noise = -.5;
  const kl = .5 * (mean * mean + scale * scale - 1 - Math.log(scale * scale));
  return <figure aria-label="Observed times, values and masks feed posterior inference; a Gaussian sample enters the ODE and decoder, with likelihood and KL as separate loss routes.">
    <OdeMatrix matrix={[[.2, 1, 1], [.9, -.5, 1], [1.3, .8, 1]]}
      rowNames={['measurement 1', 'measurement 2', 'measurement 3']}
      columnNames={['time', 'value', 'available mask']} label="Encoder information; a missing entry has mask 0" role="input" />
    <OdeWire /><OdeOperation name="encoder">infer posterior parameters; constructed μ = 0.4, σ = 0.6</OdeOperation>
    <OdeArray values={[mean, scale, noise]} names={['posterior mean μ', 'posterior scale σ', 'supplied noise ε']} role="input" />
    <OdeWire /><OdeOperation name="μ + σε">0.4 + 0.6 × (−0.5)</OdeOperation>
    <OdeArray values={[mean + scale * noise]} names={['sampled latent initial state']} />
    <OdeWire /><OdeOperation name="solve → decoder">state at each measured time → observation distribution</OdeOperation>
    <div className="ode-flow-split-route">
      <div><OdeWire>available measured values enter here</OdeWire>
        <OdeOperation name="log-likelihood">decoder mean 0.7, scale 0.2; observed value 0.8</OdeOperation>
        <OdeArray values={[-.5 * Math.log(2 * Math.PI * .04) - .1 ** 2 / .08]}
          names={['constructed observation log-density']} /></div>
      <div><OdeWire>posterior μ, σ versus prior N(0, 1)</OdeWire>
        <OdeOperation name="KL">(0.4² + 0.6² − 1 − log 0.6²) / 2</OdeOperation>
        <OdeArray values={[kl]} names={['prior-divergence penalty']} /></div>
    </div>
    <p>The decoder numbers are a separate constructed likelihood example, not fitted outputs from this sample.</p>
  </figure>;
}

export function OdeEventRateDrawing() {
  return <figure aria-label="Two measured event times contribute log rates, while the full observed window contributes the integrated rate.">
    <svg className="ode-flow-scene" viewBox="0 0 360 270" role="img" aria-label="Piecewise rate2 then1 over clock0 to1, events at0.2 and0.8, integrated area1.5.">
      <path d="M40 200 H315 M40 200 V36" />
      <path d="M40 200 V60 H170 V200 Z" fill={odeFlowRoles.computed} fillOpacity=".12" />
      <path d="M170 200 V130 H300 V200 Z" fill={odeFlowRoles.computed} fillOpacity=".12" />
      <path d="M40 60 H170 V130 H300" stroke={odeFlowRoles.computed} />
      <text x="65" y="49">rate 2</text><text x="205" y="118">rate 1</text>
      <path d="M92 180 V216 M248 180 V216" stroke={odeFlowRoles.input} strokeWidth="3" />
      <text x="72" y="240" fill={odeFlowRoles.input}>0.2</text><text x="231" y="240" fill={odeFlowRoles.input}>0.8</text>
      <text x="32" y="240">0</text><text x="162" y="240">0.5</text><text x="300" y="240">1</text>
      <text x="95" y="265">observed clock window</text>
    </svg>
    <OdeOperation name="sum log rates − integral">log 2 + log 1 − (2×0.5 + 1×0.5) = −0.806853</OdeOperation>
  </figure>;
}

export function OdeDensityPatchDrawing() {
  const matrix = [[.2, 2], [.4, -.1]];
  const result = linearPatch(matrix, 2);
  const maxX = Math.max(...result.moved.map(point => point[0]), 1) * 1.12;
  const maxY = Math.max(...result.moved.map(point => point[1]), 1) * 1.12;
  const x = value => 40 + 270 * value / maxX;
  const y = value => 265 - 220 * value / maxY;
  const polygon = rows => rows.map(point => `${x(point[0])},${y(point[1])}`).join(' ');
  return <figure aria-label="A unit square's actual transported corners form a parallelogram, with probability mass conserved and density inverse to area.">
    <svg className="ode-flow-scene" viewBox="0 0 360 350" role="img" aria-label={`Actual patch under exp(2A), area ratio ${number(result.area)}; horizontal extent ${number(maxX)}, vertical extent ${number(maxY)}.`}>
      <path d="M40 28 V265 H320" />
      <text x="4" y="26">state z₂</text><text x="185" y="294">state z₁</text>
      <text x="40" y="289">0</text><text x="265" y="289">{number(maxX, 2)}</text>
      <text x="4" y="58">{number(maxY, 2)}</text>
      <polygon points={polygon(result.original)} fill={odeFlowRoles.input} fillOpacity=".12" stroke={odeFlowRoles.input} />
      <polygon points={polygon(result.moved)} fill={odeFlowRoles.computed} fillOpacity=".12" stroke={odeFlowRoles.computed} />
      {result.moved.map((point, index) => <circle key={index} cx={x(point[0])} cy={y(point[1])} r="4" fill={odeFlowRoles.computed} />)}
      <text x="40" y="321" fill={odeFlowRoles.input}>cyan: starting area 1, mass m</text>
      <text x="40" y="345" fill={odeFlowRoles.computed}>violet: area {number(result.area)}, same mass m</text>
    </svg>
    <OdeMatrix matrix={result.moved} rowNames={['corner 1', 'corner 2', 'corner 3', 'corner 4']}
      columnNames={['final z₁', 'final z₂']} label="Exact transported coordinates at T = 2" role="computed" />
    <p>Density ratio is 1 / {number(result.area)} = {number(1 / result.area)}.</p>
    <OdePlane matrix={[[0, -1], [1, 0]]} steps={64} method="rk4" />
    <p>The separate rotation has determinant one: it moves points without changing local area.</p>
  </figure>;
}

export function OdeDensityAccumulatorDrawing() {
  const finalState = linearPatch([[.2, 2], [.4, -.1]], 2).moved[1];
  return <figure aria-label="State rates and a log-density rate are integrated together, while log-density does not feed back into the field.">
    <div className="ode-flow-split-route"><div>
      <OdeArray values={[1, 0]} names={['initial state z₁', 'initial state z₂']} role="input" />
      <OdeWire /><OdeMatrix matrix={[[.2, 2], [.4, -.1]]} rowNames={['rate z₁′', 'rate z₂′']}
        columnNames={['z₁', 'z₂']} label="A multiplies only the state coordinates" />
      <OdeArray values={[.2, .4]} names={['initial state rate 1', 'initial state rate 2']} />
    </div><div>
      <OdeArray values={[0]} names={['initial log-density change ℓ']} role="input" />
      <OdeWire /><OdeOperation name="−trace A">−(0.2 − 0.1)</OdeOperation>
      <OdeArray values={[-.1]} names={['log-density rate ℓ′']} />
      <p>This rate uses the field’s state Jacobian; ℓ does not enter the state field.</p>
    </div></div>
    <OdeWire>solve all three channels at shared clocks</OdeWire>
    <OdeArray values={[...finalState, -.2]}
      names={['solved state z₁ at T = 2', 'solved state z₂ at T = 2', 'solved log-density change ℓ = −0.2']} />
    <OdeWire>read the solved ℓ; the state coordinates remain unchanged</OdeWire>
    <div className="ode-flow-split-route"><div><OdeOperation name="exp(ℓ)">exp(−0.2)</OdeOperation>
      <OdeArray values={[Math.exp(-.2)]} names={['density ratio']} /></div>
      <div><OdeOperation name="exp(−ℓ) = 1 / exp(ℓ)">exp(+0.2)</OdeOperation>
        <OdeArray values={[Math.exp(.2)]} names={['volume ratio']} /></div></div>
  </figure>;
}

export function OdeTraceProbeDrawing() {
  const matrix = [[.2, 2], [.4, -.1]];
  const probes = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  return <figure aria-label="Each actual sign vector is multiplied by A, then dotted with the same sign vector; the four results average to trace0.1.">
    {probes.map(probe => {
      const product = matrix.map(row => row.reduce((sum, value, index) => sum + value * probe[index], 0));
      const estimate = probe.reduce((sum, value, index) => sum + value * product[index], 0);
      return <div key={probe.join(',')} className="ode-flow-stage">
        <OdeArray values={probe} names={['probe ε₁', 'probe ε₂']} role="input" />
        <OdeWire /><OdeOperation name="Aε">0.2ε₁ + 2ε₂; 0.4ε₁ − 0.1ε₂</OdeOperation>
        <OdeArray values={product} names={['product coordinate 1', 'product coordinate 2']} />
        <OdeWire /><OdeOperation name="εᵀ(Aε)">{probe[0]}×{number(product[0])} + {probe[1]}×{number(product[1])}</OdeOperation>
        <OdeArray values={[estimate]} names={['one trace estimate']} />
      </div>;
    })}
    <p>The four equally likely estimates average to 0.1; one probe is not an exact trace.</p>
  </figure>;
}

export function OdeRegularizerDrawing() {
  return <figure aria-label="Squared velocity and all squared Jacobian entries enter one-way integral accumulators and then a weighted loss add.">
    <OdeMatrix matrix={[[.2, 2], [.4, -.1]]} rowNames={['rate 1', 'rate 2']}
      columnNames={['state 1', 'state 2']} label="Jacobian of our linear field" />
    <OdeWire /><OdeOperation name="sum every squared entry">0.04 + 4 + 0.16 + 0.01 = 4.21</OdeOperation>
    <OdeArray values={[0, 4.21, 8.42]} names={['rJ starts at zero', 'rJ derivative', 'rJ at depth 2']} />
    <OdeWire /><OdeOperation name="task + λv rv + λJ rJ">state → rates → accumulators → loss; no accumulator → field wire</OdeOperation>
  </figure>;
}

export function OdeConditionalPathsDrawing({ mean = false }) {
  const times = Array.from({ length: 17 }, (_, index) => index / 16);
  return <figure aria-label="Two separate pair-conditioned straight paths present opposing velocities at the identical clock and location.">
    <OdeCoordinates series={[
      { label: 'conditional pair: 0 → 2, target +2', color: odeFlowRoles.input, values: times.map(time => [time, 2 * time]) },
      { label: 'conditional pair: 2 → 0, target −2', color: odeFlowRoles.computed, dashed: true, values: times.map(time => [time, 2 - 2 * time]) },
    ]} yLabel="position x" xDomain={[0, 1]} yDomain={[0, 2]} marks={[{ x: .5, y: 1, label: 'same (t, x)' }]} />
    {mean && <><OdeArray values={[2, -2]} names={['first target velocity', 'second target velocity']} role="input" />
      <OdeWire /><OdeOperation name="conditional average">(+2 − 2) / 2</OdeOperation>
      <OdeArray values={[0, 4, 8]} names={['single regressor output', 'mean loss at output 0', 'mean loss at output +2']} />
      <p>The violet single output is a marginal-field value at this input. It is not a third claim that both paired segments follow that field.</p></>}
  </figure>;
}

export function OdeKnownCorrectionDrawing() {
  return <figure aria-label="Known and learned derivatives from the same state are added before the solver multiplies by h and adds the preserved state.">
    <OdeArray values={[1]} names={['shared current state z']} role="input" />
    <div className="ode-flow-split-route">
      <div><OdeWire /><OdeOperation name="known −2z" /><OdeArray values={[-2]} names={['known rate']} /></div>
      <div><OdeWire /><OdeOperation name="learned forcing" /><OdeArray values={[.3]} names={['constructed correction rate']} /></div>
    </div>
    <OdeWire /><OdeOperation name="+ rates">−2 + 0.3 = −1.7</OdeOperation>
    <OdeWire /><OdeOperation name="h×rate + old z">0.1 × (−1.7) + 1</OdeOperation>
    <OdeArray values={[.83]} names={['Euler state after the combined rule']} />
  </figure>;
}

export function OdeHamiltonianDrawing() {
  const curve = Array.from({ length: 97 }, (_, index) => {
    const angle = 2 * Math.PI * index / 96;
    return `${180 + 100 * Math.cos(angle)},${160 - 100 * Math.sin(angle)}`;
  }).join(' ');
  return <figure aria-label="An energy contour, its outward gradient and tangent skew-gradient at position1,momentum0.">
    <svg className="ode-flow-scene" viewBox="0 0 360 348" role="img" aria-label="H=(q²+p²)/2=0.5 circle: gradient(1,0) points right, velocity(0,−1) points down.">
      <path d="M32 160 H328 M180 20 V280" />
      <text x="11" y="16">momentum p</text><text x="235" y="313">position q</text>
      <polyline points={curve} stroke={odeFlowRoles.computed} />
      <circle cx="280" cy="160" r="5" fill={odeFlowRoles.input} />
      <path d="M280 160 H318 M311 153 L318 160 L311 167" stroke={odeFlowRoles.derivative} />
      <path d="M280 160 V205 M273 198 L280 205 L287 198" stroke={odeFlowRoles.forward} />
      <text x="200" y="140" fill={odeFlowRoles.input}>q=1, p=0</text>
      <text x="50" y="45" fill={odeFlowRoles.computed}>energy H=0.5</text>
      <text x="36" y="335" fill={odeFlowRoles.derivative}>gradient → outward; velocity ↓ tangent</text>
    </svg>
    <OdeArray values={[1, 0]} names={['energy gradient in q', 'energy gradient in p']} role="derivative" />
    <OdeWire /><OdeMatrix matrix={[[0, 1], [-1, 0]]} rowNames={['q′', 'p′']}
      columnNames={['∂H/∂q', '∂H/∂p']} label="Fixed skew matrix converts the energy gradient to velocity" />
    <OdeArray values={[0, -1]} names={['position rate', 'momentum rate']} />
    <p>Energy change is gradient·velocity = 1×0 + 0×(−1) = 0.</p>
  </figure>;
}

export function OdeSolutionResidualDrawing() {
  return <figure aria-label="A learned solution differentiates its time output to form an equation residual; a learned field instead supplies a solver's state rate.">
    <div className="ode-flow-split-route">
      <div><OdeArray values={[.5]} names={['supplied clock t']} role="input" />
        <OdeWire /><OdeOperation name="proposed u(t)=c exp(−t)">c is a solution parameter</OdeOperation>
        <OdeWire /><OdeOperation name="differentiate t">u′ = −c exp(−t)</OdeOperation>
        <OdeWire /><OdeOperation name="u′ + u">residual zero for every c</OdeOperation>
        <OdeWire /><OdeOperation name="initial-condition loss">u(0)=1 selects c=1</OdeOperation></div>
      <div><OdeArray values={[1, 0]} names={['supplied state', 'supplied clock']} role="input" />
        <OdeWire /><OdeOperation name="field f(t,z)=−z">return rate −1</OdeOperation>
        <OdeWire /><OdeOperation name="solve from initial state">initial value and numerical method determine later states</OdeOperation>
        <OdeArray values={[Math.exp(-.5)]} names={['exact state at clock 0.5']} /></div>
    </div>
  </figure>;
}

export function OdeEventResetDrawing() {
  return <figure aria-label="A falling state reaches zero at a detected root, is explicitly reset to0.8, then follows a new continuous segment.">
    <OdeCoordinates series={[
      { label: 'before event: z=1−t', color: odeFlowRoles.input, values: [[0, 1], [1, 0]] },
      { label: 'after explicit reset: z=0.8−(t−1)', color: odeFlowRoles.computed, dashed: true, values: [[1, .8], [1.5, .3]] },
    ]} yDomain={[0, 1]} xDomain={[0, 1.5]}>
      {({ x, y }) => <>
        <line x1={x(1)} y1={y(0)} x2={x(1)} y2={y(.8)} stroke={odeFlowRoles.parameter} strokeWidth="3" />
        <text x="95" y="24" fill={odeFlowRoles.parameter}>t=1 reset: 0→0.8</text>
      </>}
    </OdeCoordinates>
  </figure>;
}

export function OdeControlledStochasticDrawing() {
  return <figure aria-label="A supplied controlled-path increment and a Brownian increment are distinct operands with different step scaling.">
    <div className="ode-flow-split-route">
      <div><OdeArray values={[1, .2]} names={['current controlled state', 'supplied input increment ΔX']} role="input" />
        <OdeWire /><OdeOperation name="z×ΔX + z">1×0.2 + 1</OdeOperation>
        <OdeArray values={[1.2, Math.exp(.2)]} names={['Euler controlled state', 'exact controlled state']} /></div>
      <div><OdeArray values={[.1, 1, .5]} names={['clock increment Δt', 'constructed noise ξ', 'noise coefficient b']} role="input" />
        <OdeWire /><OdeOperation name="b√Δt ξ">0.5 × √0.1 × 1</OdeOperation>
        <OdeArray values={[.5 * Math.sqrt(.1)]} names={['one random state increment']} /></div>
    </div>
  </figure>;
}

export function OdeReversibleStepDrawing() {
  const start = 1;
  const auxiliary = 1;
  const rate = -auxiliary;
  const step = .1;
  const nextAuxiliary = 2 * start - auxiliary + rate * step;
  const nextRate = -nextAuxiliary;
  const nextState = start + (rate + nextRate) * step / 2;
  const reconstructedAuxiliary = 2 * nextState - nextAuxiliary - nextRate * step;
  const reconstructedRate = -reconstructedAuxiliary;
  const reconstructedState = nextState - (reconstructedRate + nextRate) * step / 2;
  return <figure aria-label="One deterministic reversible Heun step keeps main state, auxiliary state and rate, then algebraically reconstructs all three old values.">
    <OdeArray values={[start, auxiliary, rate]} names={['main state z', 'auxiliary state ż', 'rate f(ż)']} role="input" />
    <OdeWire /><OdeOperation name="auxiliary update">2×1 − 1 + (−1)×0.1 = 0.9</OdeOperation>
    <OdeArray values={[nextAuxiliary, nextRate]} names={['next auxiliary', 'rate at next auxiliary']} />
    <OdeWire /><OdeOperation name="average rate, add">1 + 0.1×(−1−0.9)/2</OdeOperation>
    <OdeArray values={[nextState]} names={['next main state']} />
    <OdeWire backward /><OdeOperation name="reconstruct auxiliary">2×0.905 − 0.9 − (−0.9)×0.1 = 1</OdeOperation>
    <OdeWire backward /><OdeOperation name="reconstruct main state">0.905 − 0.1×(−1−0.9)/2 = 1</OdeOperation>
    <OdeArray values={[reconstructedState, reconstructedAuxiliary]} names={['recovered main state', 'recovered auxiliary']} role="derivative" />
    <p>This constructed deterministic step sets the diffusion term to zero. It reverses its numerical update; it does not claim that 0.905 is the exact exp(−0.1) solution.</p>
  </figure>;
}

export function OdeGradientComparisonDrawing() {
  return <figure aria-label="The same field parameter defines distinct finite Euler and continuous forward functions; each receives its own loss and derivative.">
    <OdeArray values={[-.7, 1.2, 1.3, .4]} names={['field weight θ', 'initial state', 'final clock T', 'loss target']}
      roles={['parameter', 'input', 'input', 'input']} />
    <div className="ode-flow-split-route">
      <div><OdeWire /><OdeOperation name="four Euler intervals">1.2 × (1 + 0.325θ)⁴</OdeOperation>
        <OdeArray values={[1.2 * (1 + .325 * -.7) ** 4]} names={['finite endpoint']} />
        <OdeWire backward /><OdeArray values={[(1.2 * (1 + .325 * -.7) ** 4 - .4) * 1.2 * 4 * .325 * (1 + .325 * -.7) ** 3]}
          names={['derivative of finite loss']} role="derivative" /></div>
      <div><OdeWire /><OdeOperation name="exact continuous solve">1.2 × exp(1.3θ)</OdeOperation>
        <OdeArray values={[1.2 * Math.exp(1.3 * -.7)]} names={['continuous endpoint']} />
        <OdeWire backward /><OdeArray values={[(1.2 * Math.exp(1.3 * -.7) - .4) * 1.3 * 1.2 * Math.exp(1.3 * -.7)]}
          names={['derivative of continuous loss']} role="derivative" /></div>
    </div>
  </figure>;
}

export function OdeClockSensitivityDrawing() {
  return <figure aria-label="A time-dependent rate receives the actual initial, internal and final clocks; backward clocks decrease from the actual endpoint.">
    <OdeArray values={[.2, 1.2, -.7]} names={['initial clock a', 'initial state z(a)', 'field weight θ']}
      roles={['input', 'input', 'parameter']} />
    <OdeWire /><OdeOperation name="rate θz + t">at clock 0.2: −0.7×1.2 + 0.2 = −0.64</OdeOperation>
    <OdeWire>every tentative RK probe carries its own actual clock</OdeWire>
    <OdeArray values={[1.3, 1.1845773937033843]} names={['final clock b', 'exact endpoint for this field']} />
    <OdeWire backward>reverse from 1.3 down to 0.2, not from zero down to −1.1</OdeWire>
    <OdeOperation name="at θ = 0">state change = (b² − a²) / 2</OdeOperation>
    <p>The supplied endpoints are fixed clocks. This program differentiates states and field parameters, not event times.</p>
  </figure>;
}

export function OdeSolverClocksDrawing() {
  return <figure aria-label="Requested output times, accepted solver states and intermediate rate evaluations occupy distinct roles on the same clock.">
    <svg className="ode-flow-scene" viewBox="0 0 360 264" role="img" aria-label="Requested outputs0 and1 are separate from eight Euler intervals and from an illustrative adaptive solver's internal clocks.">
      <text x="24" y="24" fill={odeFlowRoles.input}>requested outputs: 0 and 1</text>
      <path d="M40 54 H304" />
      {[0, 1].map(time => <g key={time}><circle cx={40 + 264 * time} cy="54" r="5" fill={odeFlowRoles.input} />
        <text x={34 + 264 * time} y="81">{time}</text></g>)}
      <text x="24" y="121" fill={odeFlowRoles.computed}>eight Euler accepted intervals</text>
      <path d="M40 151 H304" />
      {Array.from({ length: 9 }, (_, index) => <circle key={index} cx={40 + 33 * index} cy="151" r="3" fill={odeFlowRoles.computed} />)}
      <text x="24" y="197">each Euler rate is at the interval start</text>
      <text x="24" y="224">adaptive internal clocks are solver-chosen;</text>
      <text x="24" y="250">no measured adaptive grid is invented here</text>
    </svg>
  </figure>;
}

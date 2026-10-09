import { useId, useMemo, useState } from 'react';
import { advectionEvolution, burgersGodunovFlux, diffusionEvolution, finiteElement1D, formatPdeNumber, materialInterface, neumannBalance, poissonProblem, poissonRefinement, rectangleStencil, triangleElement, twoGridCorrection } from '../../data/numerical-pde-models.js';
import './numerical-pde-reading.css';
import { colors, correctionStages, timeMethods, Investigation, Ledger, Plot, ReadingRegion, Stencil, Triangle } from './NumericalPdeReadingPrimitives.jsx';
import { CellBalance, CellBars, MaterialRod, RectangleMesh, Riemann } from './NumericalPdeGeometry.jsx';
const gold = '#e8b44a';
const blue = '#78b9ee';
const green = '#c6b6f0';
const pink = '#ed9eba';
const number = value => formatPdeNumber(value, 4);
const axisTick = value => value !== 0 && (Math.abs(value) < .01 || Math.abs(value) >= 10000) ? value.toExponential(1).replace("e+", "e") : formatPdeNumber(value, 2);
function Range({
  label,
  value,
  change,
  min,
  max,
  step = 1
}) {
  const id = useId();
  return <label className="npde-control" htmlFor={id}><span>{label}: <output>{number(value)}</output></span><input id={id} type="range" value={value} min={min} max={max} step={step} onChange={event => change(Number(event.target.value))} /></label>;
}
function Choice({
  label,
  value,
  change,
  options
}) {
  const id = useId();
  return <label className="npde-control"><span id={id}>{label}</span><select aria-labelledby={id} value={value} onChange={event => change(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}
export function PoissonBudgetLab() {
  const [intervals, setIntervals] = useState(8);
  const [method, setMethod] = useState('direct');
  const [iterations, setIterations] = useState(0);
  const [profile, setProfile] = useState('quartic');
  const [boundary, setBoundary] = useState('zero');
  const [selected, setSelected] = useState(1);
  const result = useMemo(() => poissonProblem({
    intervals,
    method,
    iterations,
    profile,
    left: boundary === 'tilted' ? 2 : 0,
    right: boundary === 'tilted' ? -1 : 0
  }), [intervals, method, iterations, profile, boundary]);
  const row = Math.min(selected, intervals - 1);
  const certificate = result.certificate;
  return <Investigation title="From a stencil row to a field certificate" prompt="Can a small scaled residual conceal a visible field error? Try Jacobi before refining the grid." reset={() => {
    setIntervals(8);
    setMethod('direct');
    setIterations(0);
    setProfile('quartic');
    setBoundary('zero');
    setSelected(1);
  }}>
    <div className="npde-controls"><Choice label="Intervals N" value={intervals} change={value => {
        setIntervals(Number(value));
        setSelected(1);
      }} options={[4, 8, 16, 32, 64].map(value => [value, value])} /><Choice label="Manufactured target" value={profile} change={setProfile} options={[['quartic', 'Quartic: truncation visible'], ['quadratic', 'Quadratic: exact at nodes'], ['linear', 'Linear: no mesh error']]} /><Choice label="Solve" value={method} change={setMethod} options={[['direct', 'Positive-pivot direct solve'], ['jacobi', 'Bounded Jacobi iteration']]} /><Choice label="Endpoint values" value={boundary} change={setBoundary} options={[['zero', '0 and 0'], ['tilted', '2 and −1']]} /></div>
    {method === 'jacobi' && <Range label="Jacobi updates" value={iterations} change={setIterations} min={0} max={4000} step={25} />}
    <Range label="Interior row j" value={row} change={setSelected} min={1} max={intervals - 1} />
    <Stencil label={`Actual scaled operator row j=${row}`} positions={result.nodes.slice(row - 1, row + 2)} addresses={[row - 1, row, row + 1]} operands={result.values.slice(row - 1, row + 2)} coefficients={[-1, 2, -1]} />
    <p>Divide that row sum by h²={number(result.h ** 2)} to compare with f(xⱼ)={number(result.source[row - 1])}. Known endpoint terms move to the right-hand side when assembling interior unknowns.</p>
    <Plot label="Calculated nodal solution and its straight-line reconstruction" series={[{
      label: 'Manufactured continuous field',
      color: blue,
      points: result.curve.map(point => [point.x, point.exact])
    }, {
      label: 'Computed reconstruction',
      color: gold,
      points: result.nodes.map((x, index) => [x, result.values[index]])
    }]} markers={[[result.nodes[row], result.values[row]]]} />
    <div className="npde-budget"><p><strong>Algebraic contribution</strong><output>{number(certificate.algebraicBound)}</output></p><p><strong>Nodal discretization bound</strong><output>{number(certificate.nodalDiscretizationBound)}</output></p><p><strong>Between-node bound</strong><output>{number(certificate.interpolationBound)}</output></p><p className="npde-total"><strong>Total field bound</strong><output>{number(certificate.fieldBound)}</output></p></div>
    <p className="npde-result" aria-live="polite">{certificate.certified ? 'Certified within' : 'Not yet certified within'} the requested .001 field tolerance. A residual-based upper bound can be conservative; failure to certify does not prove the actual error exceeds the tolerance.</p>
    <p>Physical residual upper bound: {number(certificate.residualUpper)}. Scaled residual diagnostic: {number(Math.max(...result.residuals.map(Math.abs)) * result.h ** 2)}. Weighted nodal L2 error: {number(result.weightedNodalL2)}; sampled field discrepancy: {number(result.sampledFieldError)}.</p>
    <p className="lesson-note">The certificate uses exact rational arithmetic on the stored floating-point vector and these declared polynomial data, followed by upward rounding of bounds. Displayed decimals are rounded. The curve and sampled discrepancy use 257 positions and are diagnostics, not the certificate. This certifies the declared mathematical field, not the accuracy of a physical model.</p>
  </Investigation>;
}
export function RefinementLab() {
  const [profile, setProfile] = useState('quartic');
  const rows = useMemo(() => poissonRefinement(profile), [profile]);
  return <Investigation title="A refinement test can tell the wrong story" prompt="Will an exact-on-grid quadratic show order two in its nodal error?" reset={() => setProfile('quartic')}><Choice label="Refinement target" value={profile} change={setProfile} options={[['quartic', 'Quartic'], ['quadratic', 'Quadratic'], ['linear', 'Linear']]} />
    {profile === 'quartic' && <Plot label="Actual computed nodal errors on logarithmic coordinates" xLabel="log₂ N" yLabel="log₂ nodal error" zero={false} series={[{
      label: 'Direct-solve error',
      color: gold,
      points: rows.map(row => [Math.log2(row.intervals), Math.log2(row.error)])
    }]} />}
    <ReadingRegion label="Refinement values"><table><thead><tr><th>N</th><th>Computed nodal error</th><th>Observed order</th><th>Exact mesh error</th></tr></thead><tbody>{rows.map(row => <tr key={row.intervals}><th>{row.intervals}</th><td>{number(row.error)}</td><td>{row.observedOrder === null ? 'undefined' : number(row.observedOrder)}</td><td>{number(row.exactNodalDiscretizationError)}</td></tr>)}</tbody></table></ReadingRegion><p>For the quadratic and linear targets, exact nodal discretization error is zero. Small computed discrepancies are arithmetic effects, so this investigation does not assign them a convergence order or put zero on a logarithmic axis.</p></Investigation>;
}
export function DiffusionGridLab() {
  const [timeSteps, setTimeSteps] = useState(8);
  const [mode, setMode] = useState(1);
  const [frameIndex, setFrameIndex] = useState(0);
  const [intervals, setIntervals] = useState(8);
  const result = useMemo(() => diffusionEvolution({
    intervals,
    timeSteps,
    mode,
    finalTime: 0.1
  }), [intervals, timeSteps, mode]);
  const index = Math.min(frameIndex, result.frames.length - 1);
  const frame = result.frames[index];
  const series = ['continuous', 'semidiscrete', 'explicit', 'backward', 'crank'].map(key => ({
    ...timeMethods[key], key,
    points: result.nodes.map((x, j) => [x, frame[key][j]])
  }));
  const amplitudes = series.map(item => ({ ...item, maximum: Math.max(...item.points.map(([, value]) => Math.abs(value))) }));
  return <Investigation title="Watch a mode, not just a stability badge" prompt="Choose the near-grid-scale mode and two time steps. Which method alternates sign, and which strongly damps it?" reset={() => {
    setTimeSteps(8);
    setMode(1);
    setFrameIndex(0);
    setIntervals(8);
  }}>
    <div className="npde-controls"><Choice label="Diffusion intervals" value={intervals} change={value => {
        setIntervals(Number(value));
        setMode(1);
        setFrameIndex(0);
      }} options={[4, 8, 16].map(value => [value, value])} /><Choice label="Steps to time .1" value={timeSteps} change={value => {
        setTimeSteps(Number(value));
        setFrameIndex(0);
      }} options={[2, 4, 8, 16, 32, 64].map(value => [value, value])} /><Choice label="Initial sine mode" value={mode} change={value => {
        setMode(Number(value));
        setFrameIndex(0);
      }} options={[[1, 'k=1: smooth'], [intervals - 1, `k=${intervals - 1}: near grid scale`]]} /></div>
    <Range label="Displayed time step" value={index} change={setFrameIndex} min={0} max={result.frames.length - 1} />
    <Plot label={`All five fields at the same physical time t=${number(frame.time)}`} series={series} />
    <ModeShapeDetails amplitudes={amplitudes} />
    <ReadingRegion label="Mode multipliers"><table><thead><tr><th>Update</th><th>One-step factor</th></tr></thead><tbody>{Object.entries(result.factors).map(([name, value]) => <tr key={name}><th>{name}</th><td>{number(value)}</td></tr>)}</tbody></table></ReadingRegion>
    <p className="npde-result" aria-live="polite">r={number(result.ratio)}. Explicit monotonicity condition r≤.5: {result.explicitMonotone ? 'met' : 'not met'}. This finite grid's spectral threshold is {number(result.finiteGridThreshold)}. State: {result.status}.</p>
    <p className="lesson-note">Actual stencil updates and factored tridiagonal solves generate the three numerical fields. Continuous and spatial-ODE sine solutions are calculated references; lines join grid samples. Vertical axes rescale to include overshoots. Changing N while selecting k=N−1 changes the initial field, so it is not a fixed-data convergence experiment.</p>
  </Investigation>;
}
export function InterfaceFluxLab() {
  const [conductivity, setConductivity] = useState(10);
  const [position, setPosition] = useState(0.5);
  const result = materialInterface({
    rightConductivity: conductivity,
    interfacePosition: position
  });
  return <Investigation title="Two materials share one steady flux" prompt="Increase the right conductivity. Does a more conductive half develop a steeper or flatter temperature slope?" reset={() => {
    setConductivity(10);
    setPosition(0.5);
  }}><Range label="Right conductivity k₂" value={conductivity} change={setConductivity} min={0.5} max={20} step={0.5} /><Range label="Interface position" value={position} change={setPosition} min={0.1} max={0.9} step="any" /><div className="npde-controls"><button type="button" onClick={() => setPosition(1 / 3)}>Place interface exactly at 1/3</button></div>
    <MaterialRod position={position} conductivity={conductivity} flux={result.flux} temperature={result.interfaceTemperature} resistances={result.resistances} />
    <Plot label="Exact piecewise-affine temperature for the declared interface" yLabel="Temperature" series={[{
      label: 'Continuous temperature, common flux',
      color: gold,
      points: result.curve.map(point => [point.x, point.y])
    }]} markers={[[position, result.interfaceTemperature]]} />
    <p className="npde-result" aria-live="polite">Total resistance R₁+R₂={number(result.resistances[0] + result.resistances[1])}; q=1/(R₁+R₂)={number(result.flux)}; interface temperature {number(result.interfaceTemperature)}. A length-weighted arithmetic coefficient would predict {number(result.arithmeticFlux)}, generally a different flux.</p><p className="lesson-note">Normalized rod length 1, endpoint temperatures 1 and 0, no internal source. If length is metres and k is W/(m·K), R has units m²K/W and q is W/m². The diagram uses declared inputs, not measured materials.</p></Investigation>;
}
export function FluxCompatibilityLab() {
  const [right, setRight] = useState(1);
  const result = neumannBalance({
    rightOutward: right
  });
  return <Investigation title="A boundary gauge cannot repair missing heat" prompt="The unit rod produces 2 units of heat and loses 1 at its left end. What must leave at its right end?" reset={() => setRight(1)}><Range label="Right outward flux" value={right} change={setRight} min={0} max={2} step={0.25} /><CellBalance loads={result.loads} right={right} values={result.compatible ? result.values : null} fluxes={result.fluxes} />
    <p className="npde-result" aria-live="polite">{result.compatible ? `Compatible. The chosen mean-zero representative is [${result.values.map(number).join(', ')}].` : `Incompatible: source minus outward flux = ${number(result.mismatch)}. No steady solution is returned.`}</p>
    {result.compatible && <p>Right-oriented face fluxes: [{result.fluxes.map(number).join(', ')}]. Neighboring cells use the same face with opposite signs. Adding any constant to every temperature changes none of these fluxes.</p>}<p>We check the full balance before fixing a zero mean. Pinning a temperature first and dropping an incompatible row would silently solve a different boundary problem.</p></Investigation>;
}
export function TransportCellsLab() {
  const [courant, setCourant] = useState(0.75);
  const [velocity, setVelocity] = useState(1);
  const [scheme, setScheme] = useState('upwind');
  const [profile, setProfile] = useState('pulse');
  const [index, setIndex] = useState(0);
  const result = useMemo(() => advectionEvolution({
    courant,
    velocity,
    scheme,
    profile,
    steps: 16
  }), [courant, velocity, scheme, profile]);
  const frame = result.frames[index];
  const x = frame.values.map((_, j) => (j + 0.5) / 16);
  return <Investigation title="Move cell averages through shared faces" prompt="Reverse the velocity. Which neighbor is now upstream? Try c=1, then centered differences." reset={() => {
    setCourant(0.75);
    setVelocity(1);
    setScheme('upwind');
    setProfile('pulse');
    setIndex(0);
  }}>
    <div className="npde-controls"><Choice label="Transport scheme" value={scheme} change={value => {
        setScheme(value);
      }} options={[['upwind', 'Upwind flux'], ['centered', 'Centered flux + Euler']]} /><Choice label="Velocity" value={velocity} change={value => {
        setVelocity(Number(value));
      }} options={[[1, '+1: right'], [-1, '−1: left']]} /><Choice label="Initial cell averages" value={profile} change={value => {
        setProfile(value);
      }} options={[['pulse', 'Discontinuous pulse'], ['sine', 'Smooth sine']]} /></div>
    <Range label="Courant number c" value={courant} change={value => {
      setCourant(value);
    }} min={0} max={1.5} step={0.25} /><Range label="Transport step" value={index} change={setIndex} min={0} max={16} />
    <p className="npde-note">Edits keep the selected transport step. At step 0 both directions share the same initial cells; move the transport-step slider forward to compare their evolution.</p>
    <CellBars values={frame.values} exact={frame.exact} label="All sixteen signed periodic cell averages" />
    <Plot label={`Cell averages at t=${number(frame.time)}; periodic domain [0,1)`} series={[{
      label: 'Computed averages',
      color: gold,
      points: x.map((position, j) => [position, frame.values[j]])
    }, {
      label: 'Exactly translated averages',
      color: blue,
      points: x.map((position, j) => [position, frame.exact[j]])
    }]} />
    <p className="npde-result" aria-live="polite">Mass hΣU={number(frame.mass)}; minimum {number(frame.minimum)}, maximum {number(frame.maximum)}. Weighted cell-average L1 error hΣ|U−Uexact|={number(result.h * frame.values.reduce((sum, value, j) => sum + Math.abs(value - frame.exact[j]), 0))}. Upwind convex-weight condition: {result.monotone ? 'met' : 'not met'}.</p><p className="lesson-note">Bar colour shows sign (amber positive, pink negative); bar height and the common plot scale retain actual magnitudes and overshoots. The weighted L1 readout compares numerical and exact cell averages at the same time; it is not a pointwise or continuous-profile error. Lines join cell-center values and do not represent a continuous pulse profile. Time changes with c at fixed step; the reference always uses that same time. Mass preservation alone does not establish stability.</p></Investigation>;
}
export function GodunovFaceLab() {
  const [left, setLeft] = useState(-1);
  const [right, setRight] = useState(2);
  const result = burgersGodunovFlux(left, right);
  return <Investigation title="Choose a Burgers face flux from the wave" prompt="A rarefaction spreads from −1 to 2. Which value reaches the fixed face x/t=0?" reset={() => {
    setLeft(-1);
    setRight(2);
  }}><Range label="Left state" value={left} change={setLeft} min={-3} max={3} step={0.5} /><Range label="Right state" value={right} change={setRight} min={-3} max={3} step={0.5} /><Riemann left={left} right={right} result={result} /><p className="npde-result" aria-live="polite">{result.kind}; face flux u²/2 = {number(result.flux)}. {result.faceState === null ? 'Stationary shock: either trace gives the same flux; no unique face value is claimed.' : `Face state ${number(result.faceState)}.`} {result.speed !== undefined && `Shock speed ${number(result.speed)}.`}</p><p>This is an exact scalar Riemann-face calculation, not an animation or a complete nonlinear PDE time solver.</p></Investigation>;
}
const meshes = {
  uniform: [0, 0.25, 0.5, 0.75, 1],
  aligned: [0, 0.25, 1 / 3, 0.5, 0.75, 1],
  nonuniform: [0, 0.2, 0.6, 1]
};
export function HatAssemblyLab() {
  const [mesh, setMesh] = useState('uniform');
  const [sourceKind, setSourceKind] = useState('constant');
  const [selected, setSelected] = useState(1);
  const [hatIndex, setHatIndex] = useState(1);
  const result = useMemo(() => finiteElement1D({
    nodes: meshes[mesh],
    sourceKind,
    source: sourceKind === 'point' ? 1 : 2
  }), [mesh, sourceKind]);
  const elementIndex = Math.min(selected, result.elements.length - 1);
  const element = result.elements[elementIndex];
  const [a, b] = [result.nodes[elementIndex], result.nodes[elementIndex + 1]];
  return <Investigation title="Assemble overlapping hats; resolve a point source" prompt="Switch to the point load at 1/3. Will inserting a node there improve nodal values, the field between nodes, or both?" reset={() => {
    setMesh('uniform');
    setSourceKind('constant');
    setSelected(1);
    setHatIndex(1);
  }}>
    <div className="npde-controls"><Choice label="Finite-element mesh" value={mesh} change={value => {
        setMesh(value);
        setSelected(1);
        setHatIndex(1);
      }} options={[['uniform', 'Uniform quarters'], ['aligned', 'Add a node at 1/3'], ['nonuniform', 'Nonuniform: .2, .6']]} /><Choice label="Load" value={sourceKind} change={setSourceKind} options={[['constant', 'Constant f=2'], ['point', 'Unit point load at 1/3']]} /></div>
    <Range label="Selected interior hat" value={hatIndex} change={setHatIndex} min={1} max={result.nodes.length - 2} />
    <HatSupport result={result} selected={hatIndex} />
    <Range label="Selected element" value={elementIndex} change={setSelected} min={0} max={result.elements.length - 1} />
    <Plot label={`Local shape functions on [${number(a)}, ${number(b)}]`} yLabel="Shape-function value" series={[{
      label: `Left hat → global node ${elementIndex}`,
      color: blue,
      points: [[a, 1], [b, 0]]
    }, {
      label: `Right hat → global node ${elementIndex + 1}`,
      color: gold,
      points: [[a, 0], [b, 1]]
    }]} />
    <p>Element width {number(element.width)}. Its stiffness contribution is {number(1 / element.width)} × [[1,−1],[−1,1]], added to global rows and columns {elementIndex}, {elementIndex + 1}.</p>
    <ReadingRegion label="Assembled stiffness and load"><table><caption>Full matrix before Dirichlet elimination</caption><thead><tr><th>Node</th>{result.nodes.map((_, j) => <th key={j}>{j}</th>)}<th>Load</th></tr></thead><tbody>{result.stiffness.map((row, j) => <tr key={j} className={j === hatIndex ? 'npde-selected-row' : undefined}><th>{j === hatIndex ? `Selected hat ${j}` : j}</th>{row.map((value, k) => <td key={k} style={{ color: value > 0 ? colors.computed : value < 0 ? colors.defect : undefined }} className={[elementIndex, elementIndex + 1].includes(j) && [elementIndex, elementIndex + 1].includes(k) ? 'npde-highlight' : ''}>{number(value)}</td>)}<td>{number(result.load[j])}</td></tr>)}</tbody></table></ReadingRegion>
    <p>The outlined bold row and its load belong to the selected complete hat. Amber outlines mark the selected element’s four additions; they do not erase other contributors. Coefficient colour retains its sign: amber positive, pink negative.</p>
    <Plot label="Calculated finite-element function and its exact reference" series={[{
      label: 'Exact quadratic or Green field',
      color: blue,
      points: result.curve.map(point => [point.x, point.exact])
    }, {
      label: 'Finite-element field',
      color: gold,
      points: result.nodes.map((x, j) => [x, result.values[j]])
    }]} markers={result.nodes.map((x, j) => [x, result.values[j]])} />
    <p className="npde-result" aria-live="polite">Exact discretization errors: field max {number(result.fieldError)}; continuous L2 {number(result.l2Error)}; energy {number(result.energyError)}. Computed nodal discrepancy {number(result.nodalError)}.</p><p className="lesson-note">The three error formulas integrate these specific constant-load or point-load solutions; they exclude floating-point algebraic error. Plot samples are not used to claim these exact errors. The source is fixed at 1/3; “aligned” specifically means aligned to that source.</p></Investigation>;
}
export function RectangleIndexLab() {
  const [i, setI] = useState(2);
  const [j, setJ] = useState(2);
  const result = rectangleStencil({
    selectedX: i,
    selectedY: j,
    xLength: 2
  });
  return <Investigation title="A two-dimensional neighbor is not always a vector neighbor" prompt="Move to the rightmost interior node. Should its right neighbor wrap into the next row of unknowns?" reset={() => {
    setI(2);
    setJ(2);
  }}><div className="npde-controls"><Range label="Horizontal index i" value={i} change={setI} min={1} max={4} /><Range label="Vertical index j" value={j} change={setJ} min={1} max={3} /></div>
    <RectangleMesh result={result} />
    <p>Physical rectangle 2×1. hₓ=.4, hᵧ=.25. Selected unknown index {result.selectedIndex}. B denotes a prescribed boundary value, not an unknown.</p><ul>{result.neighbors.map(point => <li key={`${point.i},${point.j}`}>({point.i},{point.j}): coefficient {number(point.coefficient)}; {point.boundary ? 'known boundary → right-hand side' : `vector index ${point.index}`}.</li>)}</ul><p className="npde-result">The 12×12 interior matrix has {result.nonzeros} nonzeros. The map and coefficients are calculated, not a sampled illustration.</p></Investigation>;
}
export function TriangleElementLab() {
  const [preset, setPreset] = useState('reference');
  const vertices = preset === 'reference' ? [[0, 0], [1, 0], [0, 1]] : [[1, 2], [3, 2], [1, 5]];
  const result = triangleElement(vertices);
  return <Investigation title="Map a triangle, then map its gradients" prompt="Double one side and triple the other. Do gradients grow with those lengths or shrink?" reset={() => setPreset('reference')}><Choice label="Triangle geometry" value={preset} change={setPreset} options={[['reference', 'Width 1, height 1'], ['scaled', 'Width 2, height 3']]} /><Triangle vertices={vertices} gradients={result.gradients} label="Actual triangle vertices and inverse-transpose basis gradients" /><p>Area {number(result.area)}. Coordinates determine the actual shape. Horizontal and vertical scales are equal within each view; the view rescales between presets to keep the triangle readable.</p><ReadingRegion label="Triangle gradients and stiffness"><table><thead><tr><th>Basis</th><th>Gradient</th><th>Stiffness row</th></tr></thead><tbody>{result.gradients.map((gradient, index) => <tr key={index}><th>φ{index}</th><td>[{gradient.map(number).join(', ')}]</td><td>[{result.stiffness[index].map(number).join(', ')}]</td></tr>)}</tbody></table></ReadingRegion><p>The gradients sum to zero, so a constant coefficient vector has zero element energy. Global Dirichlet constraints remove the constant mode only when they constrain the connected problem appropriately.</p></Investigation>;
}
export function CoarseCorrectionLab() {
  const [mode, setMode] = useState(1);
  const result = twoGridCorrection(mode);
  return <Investigation title="Remove error on two resolutions" prompt="Weighted Jacobi weakly changes the smooth mode. Can a coarse piecewise-linear correction remove what remains?" reset={() => setMode(1)}><Choice label="Fine-grid error mode" value={mode} change={value => setMode(Number(value))} options={[[1, 'Smooth sine: k=1'], [7, 'Near-grid-scale sine: k=7']]} /><Plot label="One smoothing step and one exact coarse correction, N=8" yLabel="Error" series={[{
      label: 'Initial error',
      color: correctionStages.initial,
      points: result.initial.map((value, j) => [j / 8, value])
    }, {
      label: 'After weighted Jacobi',
      color: correctionStages.smooth, dash: '9 3',
      points: result.smooth.map((value, j) => [j / 8, value])
    }, {
      label: 'After coarse correction',
      color: correctionStages.final, dash: '2 3',
      points: result.final.map((value, j) => [j / 8, value])
    }]} /><ReadingRegion label="Two-grid error norms"><table><thead><tr><th>Stage</th><th>Weighted L2</th><th>Energy norm</th></tr></thead><tbody>{['initial', 'smooth', 'final'].map(stage => <tr key={stage}><th>{stage}</th><td>{number(result.norms[stage])}</td><td>{number(result.energyNorms[stage])}</td></tr>)}</tbody></table></ReadingRegion><p>Projection decreases the energy norm. It need not decrease every other norm at that same step: the high-mode example can gain a small smooth component and increase L2 after coarse correction. This is a declared two-grid calculation, not a claim about a full multigrid cycle's complexity.</p></Investigation>;
}

Range.npdeRole = 'control';
Choice.npdeRole = 'control';

function ModeShapeDetails({ amplitudes, ledgerOnly = false }) {
  if (ledgerOnly) return <Ledger label="Actual maximum absolute amplitude at this time" headers={['Field', 'max |U|']} rows={amplitudes.map(item => [item.label, item.maximum])} />;
  return <div className="npde-reading-object"><p>The overview above shares one physical amplitude axis. Below, each entire signed field is divided by its own displayed max |U|, so damping cannot hide its shape. All five shape panels share the dimensionless vertical range −1.1 to 1.1; these lengths are not physical amplitudes.</p>
    {amplitudes.map(item => <div key={item.key}><p>{item.label}: actual max |U| = {number(item.maximum)}{item.maximum === 0 ? '; identically zero, so no division is performed.' : '.'}</p><Plot label={`${item.label}: signed shape at this same time`} yLabel="U / max |U|" yDomain={[-1.1, 1.1]} series={[{ ...item, points: item.points.map(([x, value]) => [x, item.maximum === 0 ? 0 : value / item.maximum]) }]} /></div>)}
  </div>;
}
ModeShapeDetails.npdeRole = 'core';

function HatSupport({ result, selected, ledgerOnly = false }) {
  const { nodes, point, sourceKind, source } = result;
  const left = selected - 1, right = selected + 1;
  const sourceCell = nodes.findIndex(node => node >= point) - 1;
  const localLoads = elementIndex => {
    const element = result.elements[elementIndex];
    if (sourceKind === 'constant') return [source * element.width / 2, source * element.width / 2];
    if (elementIndex !== sourceCell) return [0, 0];
    const fraction = (point - element.left) / element.width;
    return [source * (1 - fraction), source * fraction];
  };
  const ledger = <><Ledger label={`Both adjacent contributions to global hat row ${selected}`} headers={['Element / global nodes', 'Hat gradient', 'Global stiffness additions', 'Load at selected hat']} rows={[left, selected].map((e, side) => {
    const element = result.elements[e];
    return [`${e}: ${e}, ${e + 1}`, (side === 0 ? 1 : -1) / element.width, `K(${selected},${e}) += ${number((side === 0 ? -1 : 1) * element.factor)}; K(${selected},${e + 1}) += ${number((side === 0 ? 1 : -1) * element.factor)}`, localLoads(e)[side === 0 ? 1 : 0]];
  })} /><Ledger label="Every element's two source weights and global destinations" headers={['Element', 'Left global node', 'Left load', 'Right global node', 'Right load']} rows={result.elements.map((_, e) => [e, e, localLoads(e)[0], e + 1, localLoads(e)[1]])} /></>;
  if (ledgerOnly) return ledger;
  return <div className="npde-reading-object"><Plot label={`Complete hat ${selected}: both physical support cells and zero outside`} yLabel={`φ${selected}(x)`} xDomain={[0, 1]} series={[{ label: `Hat ${selected}, centred at x=${number(nodes[selected])}`, color: colors.computed, points: nodes.map((x, j) => [x, j === selected ? 1 : 0]) }]} markers={[[nodes[left], 0], [nodes[selected], 1], [nodes[right], 0]]} />
    <p>Support: [{number(nodes[left])}, {number(nodes[right])}]. The left piece rises with gradient {number(1 / (nodes[selected] - nodes[left]))}; the right piece falls with gradient {number(-1 / (nodes[right] - nodes[selected]))}. Other cells have value and gradient zero.</p>
    <p>{sourceKind === 'constant' ? 'Distributed source 2 integrates each local shape over its cell.' : `The unit point source at 1/3 evaluates the two shapes of cell ${sourceCell}, giving loads ${number(localLoads(sourceCell)[0])} to global node ${sourceCell} and ${number(localLoads(sourceCell)[1])} to global node ${sourceCell + 1}. At an aligned node one weight is zero, so the source is counted once.`} The two selected-hat contributions add to global load {number(result.load[selected])}; the complete addressed additions follow below.</p>
  </div>;
}
HatSupport.npdeRole = 'core';

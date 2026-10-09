import { useState } from 'react';
import { FlowLab, FlowControls, FlowReadout, flowNumber } from "../LessonFlow.jsx";
import { GaussianDrawing, GaussianQuantity } from "./GaussianScalarFigures.jsx";
import { correlatedGaussian, ellipseCoordinates, normalInterval, residualOuterProduct } from "./gaussian-geometry-models.mjs";

const INK = '#deded8', AMBER = '#e9b94c', MUTED = '#85858b';
const FIRST = '#eebd88', SECOND = '#85baf1', QUERY_Q = '#e4a0c0';
const number = value => value !== 0 && Math.abs(value) < 1e-7 ? value.toExponential(6).replace(/-/g, '−') : flowNumber(value, 9);
const geometry = width => {
  const scale = Math.min(55, (width - 100) / 6), cx = width / 2, cy = 220;
  return { X: x => cx + x * scale, Y: y => cy - y * scale, cx, cy, scale };
};
const contourPath = (correlation, plane, radius = 1) => ellipseCoordinates(correlation)
  .map(([x, y], index) => `${index ? 'L' : 'M'}${plane.X(radius * x)},${plane.Y(radius * y)}`).join(' ') + ' Z';

function Arrow({ from, to, color = INK, dashed = false }) {
  const dx = to[0] - from[0], dy = to[1] - from[1], distance = Math.hypot(dx, dy);
  if (distance === 0) return <circle cx={to[0]} cy={to[1]} r="5" fill="none" stroke={color} />;
  const length = Math.min(9, distance), ux = dx / distance, uy = dy / distance;
  return <g stroke={color} fill="none"><line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} strokeDasharray={dashed ? '4 3' : undefined} />
    <path d={`M${to[0] - length * ux - 4 * uy},${to[1] - length * uy + 4 * ux} L${to[0]},${to[1]} L${to[0] - length * ux + 4 * uy},${to[1] - length * uy - 4 * ux}`} /></g>;
}

function Diamond({ plane, x, y, name, color = INK, radius = 6 }) {
  const cx = plane.X(x), cy = plane.Y(y), right = x > 1.8;
  return <g><path d={`M${cx},${cy - radius} l${radius},${radius} l${-radius},${radius} l${-radius},${-radius} Z`} fill="none" stroke={color} strokeWidth="2" />
    {name && <text x={cx + (right ? -11 : 11)} y={cy + (y < 0 ? 25 : -10)} textAnchor={right ? 'end' : 'start'} fill={color}>{name}</text>}</g>;
}

function Plane({ width, correlation = 0.75, radius = 1, fill = false, showContour = true, coordinates = ['x₁', 'x₂'], meanLabelY = 405, children }) {
  const p = geometry(width);
  return <g>
    <line x1={p.X(-3)} x2={p.X(3)} y1={p.cy} y2={p.cy} stroke={FIRST} />
    <line x1={p.cx} x2={p.cx} y1={p.Y(3)} y2={p.Y(-3)} stroke={SECOND} />
    {[-3, -2, -1, 1, 2, 3].map(value => <g key={value}>
      <line x1={p.X(value)} x2={p.X(value)} y1={p.cy - 3} y2={p.cy + 3} stroke={FIRST} />
      <text x={p.X(value)} y={p.cy + 25} textAnchor="middle" fill={FIRST}>{value}</text>
      <line x1={p.cx - 3} x2={p.cx + 3} y1={p.Y(value)} y2={p.Y(value)} stroke={SECOND} />
      <text x={p.cx - 13} y={p.Y(value) + 5} textAnchor="end" fill={SECOND}>{value}</text>
    </g>)}
    <text x={p.X(3) + 12} y={p.cy + 5} fill={FIRST}>{coordinates[0]}</text>
    <text x={p.cx + 12} y={p.Y(3) - 16} fill={SECOND}>{coordinates[1]}</text>
    {showContour && radius > 0 && <path d={contourPath(correlation, p, radius)} fill={fill ? AMBER : 'none'} fillOpacity={fill ? '0.16' : undefined} stroke={AMBER} strokeWidth="2" />}
    <path d={`M${p.cx - 6},${p.cy} h12 M${p.cx},${p.cy - 6} v12`} stroke={AMBER} strokeWidth="2" />
    <text x="20" y={meanLabelY} fill={AMBER}>Cross: mean (0, 0)</text>
    {children?.(p)}
  </g>;
}

function Matrix({ values, label = 'Covariance Σ', operands, rowLabels = ['x₁', 'x₂'], columnLabels = ['x₁', 'x₂'], y = 100 }) {
  const x = 80, cell = 80;
  return <g>
    <text x="20" y={y - 70}>{label}</text>
    {[FIRST, SECOND].map((color, i) => <g key={color}>
      <text x={x + i * cell + 32} y={y - 32} textAnchor="middle" fill={color}>{operands ? flowNumber(operands[i], 4) : columnLabels[i]}</text>
      <text x={x - 20} y={y + i * 64 + 15} textAnchor="end" fill={color}>{operands ? flowNumber(operands[i], 4) : rowLabels[i]}</text>
    </g>)}
    <path d={`M${x - 8},${y - 18} h-9 v125 h9 M${x + 167},${y - 18} h9 v125 h-9`} fill="none" stroke={INK} />
    {values.map((row, r) => row.map((v, c) => <g key={`${r}-${c}`}>
      <rect x={x + c * cell} y={y - 14 + r * 64} width="66" height="44" fill="none" stroke={r === c ? r === 0 ? FIRST : SECOND : MUTED} />
      <text x={x + c * cell + 33} y={y + 15 + r * 64} textAnchor="middle">{flowNumber(v, 4)}</text>
    </g>))}
  </g>;
}

export function GaussianCovarianceObject() {
  const state = correlatedGaussian(1, 1);
  return <div>
    <GaussianDrawing id="D07" title="One paired measurement under a tilted density contour" width={430} height={width => geometry(width).Y(-3) + 105} adaptive
      description="Constructed coordinate units on equal-aspect axes. Peach x1 and blue x2 retain their meanings in the covariance matrix below. Mean cross (0,0), query diamond (1,1), true displacement arrow and amber equal-density ellipse for covariance [[1,.75],[.75,1]].">
      {width => <><text x="20" y="28">One pair of coordinates</text><Plane width={width} meanLabelY={geometry(width).Y(-3) + 85}>{p => <>
        <Arrow from={[p.cx, p.cy]} to={[p.X(1), p.Y(1)]} /><Diamond plane={p} x={1} y={1} name="(1, 1)" />
        <path d={`M${p.X(-1)},${p.Y(-3) + 20} v9 H${p.X(1)} v-9`} fill="none" stroke={FIRST} />
        <text x={p.cx} y={p.Y(-3) + 55} textAnchor="middle" fill={FIRST}>x₁ SD = 1</text>
        <path d={`M35,${p.Y(1)} h-9 V${p.Y(-1)} h9`} fill="none" stroke={SECOND} />
        <text x="20" y="301" fill={SECOND}>x₂ SD = 1</text>
      </>}</Plane></>}
    </GaussianDrawing>
    <GaussianDrawing id="D07-matrix" title="The same coordinate order in covariance rows and columns" width={320} height={220} adaptive
      description="Row and column one are peach x1; row and column two are blue x2. Diagonal cells are variances1,1. Both cross cells are covariance.75 and jointly determine the tilted shape."><Matrix values={state.covariance} /></GaussianDrawing>
    <p className="gmm-figure-key"><span style={{ color: FIRST }}>Peach x₁</span> and <span style={{ color: SECOND }}>blue x₂</span> name the same coordinates on the plane and matrix. Diagonal variances are 1 and 1; both cross cells are 0.75. <span style={{ color: AMBER }}>Amber</span> traces equal density, rather than a class boundary.</p>
  </div>;
}

export function GaussianResidualOuterProduct() {
  const [residual, setResidual] = useState([2, -1]), [reset, setReset] = useState(0);
  const [x, y] = residual, matrix = residualOuterProduct(x, y);
  const update = index => value => setResidual(prior => prior.map((entry, slot) => slot === index ? value : entry));
  return <FlowLab id="gmm-d08" label="Build one covariance contribution from a residual">
    <GaussianDrawing id="D08" title="The actual residual arrow" width={430} height={420} adaptive description={`Residual d (${number(x)},${number(y)}) points from the mean to the named measurement. Zero gives a circle at the origin, with no invented direction.`}>
      {width => <><text x="20" y="28">Residual d = x − mean</text><Plane width={width} showContour={false}>{p => <>
        <Arrow from={[p.cx, p.cy]} to={[p.X(x), p.Y(y)]} /><Diamond plane={p} x={x} y={y} name="d" />
      </>}</Plane></>}
    </GaussianDrawing>
    <GaussianDrawing id="D08-products" title="A column times the matching row produces four signed cells" width={320} height={310} adaptive
      description={`Column d and row d transpose both have peach coordinate${number(x)} and blue coordinate${number(y)}. Four row-column products are${matrix.flat().map(number).join(', ')}.`}>
      <Matrix values={matrix} operands={residual} label="Column d × row dᵀ" />
      <text x="20" y="240">Each cell: row × column</text><text x="20" y="275">Cross: {number(x)} × {number(y)} = {number(matrix[0][1])}</text>
    </GaussianDrawing>
    <p>Matrix operands and products are shown to four decimal places; the live result retains more digits and calculations use unrounded values.</p>
    <FlowControls key={reset}>
      <GaussianQuantity name="Residual coordinate 1" value={x} onChange={update(0)} min={-3} max={3} />
      <GaussianQuantity name="Residual coordinate 2" value={y} onChange={update(1)} min={-3} max={3} />
      <button type="button" onClick={() => { setResidual([2, -1]); setReset(v => v + 1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>The residual is <strong>({residual.map(number).join(', ')})</strong>; its outer product is <strong>[{matrix[0].map(number).join(', ')}; {matrix[1].map(number).join(', ')}]</strong>. Peach and blue operands retain their coordinate identity in both orientations. {x === 0 && y === 0 ? 'The zero residual contributes a zero matrix.' : 'This single rank-one contribution cannot be a nonsingular Gaussian covariance.'}</FlowReadout>
  </FlowLab>;
}

export function GaussianEigenaxisGeometry() {
  const major = Math.sqrt(1.75), minor = 0.5;
  return <div>
    <GaussianDrawing id="D09" title="Wide and narrow directions supply two semiaxes" width={430} height={420} adaptive description="Orthogonal u plus and u minus directions. Amber wide radius sqrt1.75 and white narrow radius .5 run from mean to contour D squared1; dashed opposite halves complete their axes.">
      {width => <><text x="20" y="28">D² = 1; radii from the mean</text><Plane width={width}>{p => <>
        {[[major, major, AMBER, 'u₊'], [minor, -minor, INK, 'u₋']].map(([a, b, color, name]) => <g key={name}>
          <Arrow color={color} from={[p.cx, p.cy]} to={[p.X(a / Math.SQRT2), p.Y(b / Math.SQRT2)]} />
          <line x1={p.X(-a / Math.SQRT2)} y1={p.Y(-b / Math.SQRT2)} x2={p.cx} y2={p.cy} stroke={color} strokeDasharray="3 3" />
          <text x={p.X(a / Math.SQRT2) + (name === 'u₊' ? 10 : 16)} y={p.Y(b / Math.SQRT2) + (name === 'u₊' ? -10 : 47)} fill={color}>{name}</text>
        </g>)}
      </>}</Plane></>}
    </GaussianDrawing>
    <GaussianDrawing id="D09-products" title="Matrix rows multiply each direction into a scaled copy" width={320} height={540} adaptive
      description="The same covariance multiplies column u plus (1,1)/sqrt2 into (1.75,1.75)/sqrt2, hence1.75u plus. Column u minus (1,-1)/sqrt2 gives (.25,-.25)/sqrt2, hence.25u minus. Each output is the dot product of one matrix row with the input column.">
      {[['u₊', ['1/√2', '1/√2'], ['1.75/√2', '1.75/√2'], '1.75'], ['u₋', ['1/√2', '−1/√2'], ['0.25/√2', '−0.25/√2'], '0.25']].map(([axis, vector, result, variance], index) => {
        const y = 70 + index * 255;
        return <g key={axis}>
          <text x="20" y={y - 42}>Multiply Σ by {axis}</text>
          <text x="48" y={y}>1</text><text x="82" y={y}>.75</text><text x="40" y={y + 56}>.75</text><text x="88" y={y + 56}>1</text>
          <path d={`M32,${y - 19} h-6 v88 h6 M107,${y - 19} h6 v88 h-6`} fill="none" stroke={INK} />
          <text x="122" y={y + 28} textAnchor="middle">×</text>
          {vector.map((v, row) => <text key={row} x="167" y={y + row * 56} textAnchor="middle">{v}</text>)}
          <path d={`M135,${y - 19} h-5 v88 h5 M197,${y - 19} h5 v88 h-5`} fill="none" stroke={INK} />
          <text x="213" y={y + 28}>=</text>
          {result.map((v, row) => <text key={row} x="270" y={y + row * 56} textAnchor="middle">{v}</text>)}
          <text x="20" y={y + 113}>Each output: row · column</text><text x="20" y={y + 151}>The result is {variance} {axis}</text>
        </g>;
      })}
    </GaussianDrawing>
    <p>Along u₊, Σu₊ = 1.75u₊ and radius √1.75 = <strong>{number(major)}</strong>: standardized squared contributions are 1.75 ÷ 1.75 = 1 and 0. Along u₋, Σu₋ = 0.25u₋ and radius 0.5: contributions are 0 and 0.25 ÷ 0.25 = 1. Both endpoints lie on D² = 1.</p>
    <GaussianDrawing id="D09-identity" title="Identity covariance has equal radii and no preferred basis" width={320} height={260} adaptive description="Separate identity covariance: radius-one circle illustrated with the same diagonal orthogonal basis. Either axis can reverse sign or the basis rotate without changing the circle.">
      <text x="20" y="28">Separate case: Σ = I</text><circle cx="160" cy="135" r="70" fill="none" stroke={AMBER} />
      <path d="M110.5025,184.4975 L209.4975,85.5025 M110.5025,85.5025 L209.4975,184.4975" stroke={INK} strokeDasharray="4 3" fill="none" />
      <path d="M154,135 h12 M160,129 v12" stroke={AMBER} /><text x="213" y="81">u₊</text><text x="213" y="205">u₋</text><text x="20" y="245">Equal radii: 1 and 1</text>
    </GaussianDrawing>
    <p>A diameter is twice the radius. Reversing an eigenvector preserves its axis; the illustrated basis of the circle is one choice, not a uniquely identified direction.</p>
  </div>;
}

function ProjectionSum({ name, state, color }) {
  const squares = state.projections.map(value => value * value);
  return <div>
    <GaussianDrawing id={`D10-${name}`} title={`${name}'s two standardized contributions enter one sum`} width={400} height={300} adaptive
      description={`${name} projections (${state.projections.map(number).join(', ')}); their squares divide by (1.75,.25), giving (${state.contributions.map(number).join(', ')}); sum${number(state.squaredDistance)}.`}>
      {width => <>
        <text x="20" y="28" fill={color}>{name}: square, divide, add</text>
        {[['u₊', squares[0], 1.75], ['u₋', squares[1], 0.25]].map(([axis, square, variance], index) => {
          const x = index ? width - 72 : 72;
          return <g key={axis}><text x={x} y="69" textAnchor="middle">{axis}</text>
            <text x={x} y="105" textAnchor="middle">{flowNumber(square, 6)} ÷ {variance}</text>
            <text x={x} y="141" textAnchor="middle">{number(state.contributions[index])}</text><path d={`M${x},155 V185 H${width / 2}`} fill="none" stroke={color} /></g>;
        })}
        <circle cx={width / 2} cy="185" r="12" fill="#090909" stroke={color} /><text x={width / 2} y="191" textAnchor="middle">+</text>
        <Arrow from={[width / 2, 198]} to={[width / 2, 226]} color={color} /><text x={width / 2} y="257" textAnchor="middle">D² = {number(state.squaredDistance)}</text>
      </>}
    </GaussianDrawing>
    <p><span style={{ color }}>{name}</span> density: <strong>{number(state.density)}</strong> per square coordinate unit. The shared log determinant log(0.4375) supplies the same normalization term for both queries.</p>
  </div>;
}

export function GaussianDirectionalCosts() {
  const p = correlatedGaussian(1, 1), q = correlatedGaussian(1, -1);
  return <div>
    <GaussianDrawing id="D10" title="Equal-length queries have different directional projections" width={430} height={420} adaptive description="White P(1,1) and rose Q(1,-1) both have squared ordinary distance2. P projects onto itself along u plus and onto the mean along u minus; Q has the reverse feet. Nested rings retain the two zero feet.">
      {width => <><text x="20" y="28">Same length: P and Q</text><Plane width={width}>{g => <>
        <line x1={g.X(-2)} x2={g.X(2)} y1={g.Y(-2)} y2={g.Y(2)} stroke={MUTED} strokeDasharray="4 4" />
        <line x1={g.X(-2)} x2={g.X(2)} y1={g.Y(2)} y2={g.Y(-2)} stroke={MUTED} strokeDasharray="2 3" />
        <Arrow from={[g.cx, g.cy]} to={[g.X(1), g.Y(1)]} dashed /><Arrow from={[g.cx, g.cy]} to={[g.X(1), g.Y(-1)]} color={QUERY_Q} dashed />
        <circle cx={g.cx} cy={g.cy} r="9" fill="none" stroke={INK} /><circle cx={g.cx} cy={g.cy} r="5" fill="none" stroke={QUERY_Q} />
        <Diamond plane={g} x={1} y={1} name="P" /><Diamond plane={g} x={1} y={-1} name="Q" color={QUERY_Q} />
        <text x={g.X(2)} y={g.Y(2) - 8}>u₊</text><text x={g.X(2)} y={g.Y(-2) + 23}>u₋</text>
      </>}</Plane></>}
    </GaussianDrawing>
    <p>White P lies along u₊: its projection feet are P on u₊ and the mean on u₋. Rose Q has the reverse feet. The two rings at the mean preserve both zero-projection identities. Each displacement has ordinary squared length 2.</p>
    <div className="gmm-correlation-planes"><ProjectionSum name="P" state={p} color={INK} /><ProjectionSum name="Q" state={q} color={QUERY_Q} /></div>
    <p>The wide variance makes P's cost 8/7; the narrow variance makes Q's cost 8. These heights are under one Gaussian, not probabilities normalized across two classes.</p>
  </div>;
}

function CorrelationPanel({ correlation, point, reference }) {
  const p = correlatedGaussian(...point, correlation), q = correlatedGaussian(1, -1, correlation), coincident = point[0] === 1 && point[1] === -1;
  return <div>
    <GaussianDrawing id={reference ? 'D11-reference' : 'D11-current'} title={reference ? 'Fixed zero-correlation reference' : 'Changed correlation with the same query identities'} width={430} height={420} adaptive
      description={`Correlation${number(correlation)}, fixed marginal variances1,1. White P(${point.map(number).join(', ')}) and rose Q(1,-1) retain actual coordinates. Coincident queries have nested diamonds.`}>
      {width => <><text x="20" y="28">{reference ? 'Fixed reference: ρ = 0' : `Changed: ρ = ${number(correlation)}`}</text><Plane width={width} correlation={correlation}>{g => <>
        <Diamond plane={g} x={point[0]} y={point[1]} name={coincident ? '' : 'P'} /><Diamond plane={g} x={1} y={-1} name={coincident ? 'P = Q' : 'Q'} radius={coincident ? 3 : 6} color={QUERY_Q} />
      </>}</Plane></>}
    </GaussianDrawing>
    <p>Σ = [1, {number(correlation)}; {number(correlation)}, 1]. White P: D² <strong>{number(p.squaredDistance)}</strong>, density <strong>{number(p.density)}</strong>. Rose Q: D² <strong>{number(q.squaredDistance)}</strong>, density <strong>{number(q.density)}</strong>. Density units are reciprocal square coordinate units.</p>
  </div>;
}

export function GaussianCorrelationComparison() {
  const [state, setState] = useState({ correlation: 0.75, x: 1, y: 1 }), [reset, setReset] = useState(0);
  const p = correlatedGaussian(state.x, state.y, state.correlation), q = correlatedGaussian(1, -1, state.correlation);
  const update = key => value => setState(prior => ({ ...prior, [key]: value }));
  return <FlowLab id="gmm-d11" label="Change correlation beside the fixed independent reference">
    <div className="gmm-correlation-planes"><CorrelationPanel correlation={0} point={[state.x, state.y]} reference /><CorrelationPanel correlation={state.correlation} point={[state.x, state.y]} /></div>
    <FlowControls key={reset}>
      <GaussianQuantity name="Correlation ρ" value={state.correlation} onChange={update('correlation')} min={-0.9} max={0.9} step={0.05} />
      <GaussianQuantity name="P coordinate 1" value={state.x} onChange={update('x')} min={-3} max={3} />
      <GaussianQuantity name="P coordinate 2" value={state.y} onChange={update('y')} min={-3} max={3} />
      <button type="button" onClick={() => { setState({ correlation: 0.75, x: 1, y: 1 }); setReset(v => v + 1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>Cross covariance <strong>{number(state.correlation)}</strong>; both marginal variances stay one. P density <strong>{number(p.density)}</strong>; Q density <strong>{number(q.density)}</strong>. {state.x === 1 && state.y === -1 ? 'The queries coincide and have equal density.' : p.density === q.density ? 'Their heights are equal.' : `${p.density > q.density ? 'P' : 'Q'} has the higher density.`} The fixed reference shares these same query coordinates.</FlowReadout>
  </FlowLab>;
}

export function GaussianRegionMass() {
  const [radius, setRadius] = useState(1), [reset, setReset] = useState(0);
  const probability = radius === 0 ? 0 : -Math.expm1(-(radius ** 2) / 2), oneDimensional = normalInterval(-radius, radius);
  return <FlowLab id="gmm-d12" label="Change the radius of a two-dimensional Gaussian probability region">
    <div className="gmm-correlation-planes">{[[0.75, 'original', ['x₁', 'x₂']], [0, 'whitened', ['y₁', 'y₂']]].map(([correlation, name, axes]) =>
      <GaussianDrawing key={name} id={`D12-${name}`} title={name === 'original' ? 'Radius stretches the Gaussian ellipse' : 'The same radius in whitened coordinates'} width={430} height={420} adaptive
        description={`${name} coordinates, standardized radius${number(radius)}. Shaded probability${number(probability)}; zero has no enclosed region.`}>
        {width => <><text x="20" y="28">{name === 'original' ? 'Original coordinates: ellipse' : 'Whitened coordinates: circle'}</text><Plane width={width} correlation={correlation} radius={radius} fill coordinates={axes} /></>}
      </GaussianDrawing>)}
    </div>
    <p>Both regions represent two-dimensional probability <strong>{number(probability)}</strong>, although coordinate areas differ. The one-dimensional interval [−R, R] has probability <strong>{number(oneDimensional)}</strong>: a different event in a different dimension.</p>
    <FlowControls key={reset}><GaussianQuantity name="Standardized radius R" value={radius} onChange={setRadius} min={0} max={3} /><button type="button" onClick={() => { setRadius(1); setReset(v => v + 1); }}>Reset</button></FlowControls>
    <FlowReadout>Radius <strong>{number(radius)}</strong> encloses two-dimensional probability <strong>{number(probability)}</strong>. {radius === 0 ? 'The region has zero area and probability.' : `Ellipse semiaxes: ${number(radius * Math.sqrt(1.75))} and ${number(radius * 0.5)} coordinate units.`} A density region is not an uncertainty interval for an estimated mean.</FlowReadout>
  </FlowLab>;
}

export function GaussianTriangularSolve() {
  const [query, setQuery] = useState([1, 1]), [reset, setReset] = useState(0);
  const diagonal = Math.sqrt(7) / 4, y1 = query[0], y2 = (query[1] - 0.75 * y1) / diagonal;
  const squared = y1 * y1 + y2 * y2, logdet = 2 * Math.log(diagonal), state = correlatedGaussian(...query);
  const update = index => value => setQuery(prior => prior.map((entry, slot) => slot === index ? value : entry));
  return <FlowLab id="gmm-d13" label="Solve through a fixed Cholesky factor for a changed query">
    <GaussianDrawing id="D13-factor" title="The lower factor retains its zero upper cell" width={320} height={250} adaptive description="Fixed L[[1,0],[.75,sqrt7/4]], positive diagonals; product with its transpose is covariance[[1,.75],[.75,1]].">
      <Matrix values={[[1, 0], [0.75, diagonal]]} label="Lower factor L" rowLabels={['d₁', 'd₂']} columnLabels={['y₁', 'y₂']} /><text x="20" y="239">Σ = L Lᵀ; upper entry is 0</text>
    </GaussianDrawing>
    <p>The displayed lower diagonal is rounded to 0.6614; the solve uses its exact value √7/4.</p>
    <GaussianDrawing id="D13" title="The first solved coordinate feeds the second row" width={400} height={480} adaptive description={`y1=d1=${number(y1)}; y2=(d2-.75y1)/(sqrt7/4)=${number(y2)}. Squared norm${number(squared)}, log determinant${number(logdet)}, log density${number(state.logDensity)}.`}>
      {width => <>
        <text x="20" y="28">First row: y₁ = d₁</text><text x="20" y="62">y₁ = {number(y1)}</text><Arrow from={[55, 78]} to={[55, 111]} color={FIRST} />
        <text x="20" y="140">Second row: reuse y₁</text><text x="20" y="174">d₂ − 0.75 y₁ = {number(query[1] - 0.75 * y1)}</text><Arrow from={[55, 189]} to={[55, 222]} color={SECOND} />
        <text x="20" y="251">Divide by √7 / 4</text><text x="20" y="285">y₂ = {number(y2)}</text>
        <path d={`M55,78 H${width - 30} V308 M55,301 V308`} fill="none" stroke={FIRST} />
        <text x={width - 40} y="106" textAnchor="end" fill={FIRST}>keep y₁</text>
        {[[55, SECOND, 'y₂'], [width - 30, FIRST, 'y₁']].map(([x, color, name]) => <g key={name}>
          <circle cx={x} cy="322" r="14" fill="#090909" stroke={color} /><text x={x} y="327" textAnchor="middle">²</text>
          <text x={x + (name === 'y₁' ? -20 : 20)} y="327" textAnchor={name === 'y₁' ? 'end' : 'start'} fill={color}>{name}</text>
          <path d={`M${x},336 V360 H${width / 2}`} fill="none" stroke={color} />
        </g>)}
        <circle cx={width / 2} cy="360" r="13" fill="#090909" stroke={INK} /><text x={width / 2} y="366" textAnchor="middle">+</text>
        <text x="20" y="415">y₁² + y₂² = {number(squared)}</text><text x="20" y="457">D² is the squared solve norm</text>
      </>}
    </GaussianDrawing>
    <FlowControls key={reset}>
      <GaussianQuantity name="Solve query coordinate 1" value={query[0]} onChange={update(0)} min={-3} max={3} /><GaussianQuantity name="Solve query coordinate 2" value={query[1]} onChange={update(1)} min={-3} max={3} />
      <button type="button" onClick={() => { setQuery([1, 1]); setReset(v => v + 1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>Solve: <strong>({number(y1)}, {number(y2)})</strong>; squared norm <strong>{number(squared)}</strong>. Unchanged log determinant <strong>{number(logdet)}</strong>; log density <strong>{number(state.logDensity)}</strong>. The eigenaxis route gives the same D² <strong>{number(state.squaredDistance)}</strong>, without a covariance inverse.</FlowReadout>
  </FlowLab>;
}

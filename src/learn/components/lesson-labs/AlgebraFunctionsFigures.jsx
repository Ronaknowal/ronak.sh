import { useId } from 'react';
import { algebraNumber as fmt } from '../../data/algebra-functions-models.js';
import './algebra-functions-labs.css';

export function AlgebraFigure({ label, children, caption }) {
  return <figure className="algebra-figure" aria-label={label}>
    {children}
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}

export function AlgebraPanels({ children }) {
  return <div className="algebra-panels">{children}</div>;
}

export function AlgebraPlot({
  label, xRange, yRange, curves = [], points = [], guides = [],
  xLabel = 'input x', yLabel = 'output y',
}) {
  const clipId = useId().replaceAll(':', '');
  // The physical plotting area is square: equal coordinate spans give equal scales.
  const left = 74, right = 320, top = 24, bottom = 270;
  const x = value => left + (value - xRange[0]) / (xRange[1] - xRange[0]) * (right - left);
  const y = value => bottom - (value - yRange[0]) / (yRange[1] - yRange[0]) * (bottom - top);
  const inside = point => Number.isFinite(point.x) && Number.isFinite(point.y)
    && point.x >= xRange[0] && point.x <= xRange[1]
    && point.y >= yRange[0] && point.y <= yRange[1];
  const ticks = range => [...new Set([
    range[0], (range[0] + range[1]) / 2, range[1],
    ...(range[0] < 0 && range[1] > 0 ? [0] : []),
  ])].sort((a, b) => a - b);
  const xTicks = ticks(xRange);
  const staggerZero = xTicks.includes(0) && xTicks.some(value => value !== 0 && Math.abs(x(value) - x(0)) < 52);
  const axisNumber = value => String(Number(value.toPrecision(3)));
  return <div className="algebra-coordinate-view">
    <p className="algebra-axis-label">{yLabel}</p>
    <svg className="algebra-plot" viewBox={`0 0 350 ${staggerZero ? 338 : 310}`} role="img" aria-label={label}>
      <defs><clipPath id={clipId}><rect x={left} y={top} width={right - left} height={bottom - top} /></clipPath></defs>
      {ticks(yRange).map(value => <g key={value}>
        <line x1={left} x2={right} y1={y(value)} y2={y(value)} className="grid" />
        <text x={left - 8} y={y(value) + 7} textAnchor="end">{axisNumber(value)}</text>
      </g>)}
      {xTicks.map(value => <g key={value}>
        <line x1={x(value)} x2={x(value)} y1={top} y2={bottom} className="grid" />
        <text x={x(value)} y={bottom + (value === 0 && staggerZero ? 55 : 29)} textAnchor={value === xRange[0] ? 'start' : value === xRange[1] ? 'end' : 'middle'}>{axisNumber(value)}</text>
      </g>)}
      {xRange[0] <= 0 && xRange[1] >= 0 && <line x1={x(0)} x2={x(0)} y1={top} y2={bottom} className="axis" />}
      {yRange[0] <= 0 && yRange[1] >= 0 && <line x1={left} x2={right} y1={y(0)} y2={y(0)} className="axis" />}
      <g clipPath={`url(#${clipId})`}>
        {guides.map((guide, index) => <line key={index} x1={x(guide.from[0])} y1={y(guide.from[1])} x2={x(guide.to[0])} y2={y(guide.to[1])} className={`guide ${guide.comparison ? 'second' : ''}`} />)}
        {curves.map((curve, index) => <polyline key={index} className={`curve ${curve.comparison ? 'second' : ''}`} fill="none"
          points={curve.values.map(pair => `${x(pair[0])},${y(pair[1])}`).join(' ')} />)}
        {points.filter(inside).map((point, index) => <circle key={index} cx={x(point.x)} cy={y(point.y)} r={point.hollow ? 6 : 5}
          className={`point ${point.hollow ? 'hollow' : ''} ${point.comparison ? 'second' : ''}`} />)}
      </g>
      {points.filter(point => inside(point) && point.label).map((point, index) => <text key={index}
        x={x(point.x) + (point.dx ?? 10)} y={y(point.y) + (point.dy ?? -12)} textAnchor={point.anchor || 'start'}>{point.label}</text>)}
    </svg>
    <p className="algebra-axis-label algebra-axis-label--x">{xLabel}</p>
  </div>;
}

export function sampleAlgebra(fn, start, end, count = 121) {
  return Array.from({ length: count }, (_, index) => {
    const x = start + (end - start) * index / (count - 1);
    return [x, fn(x)];
  });
}

function NumberRail({ label, low, high, ticks, selected = [], interval, arrows = [], tickLevels = {}, annotations = [] }) {
  const arrowId = useId().replaceAll(':', '');
  const x = value => 24 + (value - low) / (high - low) * 252;
  return <div className="algebra-rail"><p>{label}</p>
    <svg viewBox={`0 0 300 ${Object.values(tickLevels).some(Boolean) ? 140 : 112}`} role="img" aria-label={label}>
      <defs><marker id={arrowId} markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" className="arrowhead" /></marker></defs>
      <line x1="24" x2="276" y1="61" y2="61" className="axis" />
      {interval && <line x1={x(interval[0])} x2={x(interval[1])} y1="61" y2="61" className="interval" />}
      {arrows.map(([from, to], index) => <path key={index} d={`M${x(from)} 39 Q${(x(from) + x(to)) / 2} 5 ${x(to)} 39`} fill="none" className="curve" markerEnd={`url(#${arrowId})`} />)}
      {ticks.map(value => <g key={value}>
        <line x1={x(value)} x2={x(value)} y1="56" y2="66" className="axis" />
        <text x={x(value)} y={94 + 28 * (tickLevels[value] || 0)} textAnchor="middle">{value}</text>
      </g>)}
      {selected.map((value, index) => <circle key={index} cx={x(value)} cy="61" r="5" className="point" />)}
      {annotations.map(({ value, label: text }, index) => <g key={index}>
        <line x1={x(value)} x2={x(value)} y1="32" y2="53" className="guide" />
        <text x={x(value)} y="25" textAnchor="middle">{text}</text>
      </g>)}
    </svg>
  </div>;
}

export function SignedQuantityFigure() {
  return <AlgebraFigure label="Signed positions, movement and distance">
    <NumberRail label="Start −3; move +2; finish −1" low={-4} high={4} ticks={[-3, -1, 0, 3]} selected={[-3, -1]} arrows={[[-3, -1]]} />
    <NumberRail label="Distance from −3 to zero is 3" low={-4} high={4} ticks={[-3, 0, 3]} interval={[-3, 0]} selected={[-3, 0]} />
  </AlgebraFigure>;
}

function QuarterStrip({ count, label }) {
  return <div className="algebra-piece-row"><span>{label}</span><div className="algebra-quarter-strip">
    {[0, 1, 2, 3].map(index => <span key={index} className={index < count ? 'filled' : ''} />)}
  </div><small>One litre: four equal quarters</small></div>;
}

export function FractionPiecesFigure() {
  return <AlgebraFigure label="Combine equal-size quarter-litre pieces">
    <AlgebraPanels><QuarterStrip count={3} label="¾ litre" /><QuarterStrip count={2} label="½ litre = ²⁄₄ litre" /></AlgebraPanels>
    <p className="algebra-result">Five quarter pieces together</p>
    <AlgebraPanels><QuarterStrip count={4} label="One full litre" /><QuarterStrip count={1} label="One more quarter litre" /></AlgebraPanels>
  </AlgebraFigure>;
}

export function FractionProductFigure() {
  return <AlgebraFigure label="Half of three quarters is three eighths">
    <div className="algebra-area-grid" role="img" aria-label="One unit rectangle split into two rows and four columns; three cells of the top row selected">
      {Array.from({ length: 8 }, (_, index) => <span key={index} className={index < 3 ? 'filled' : index % 4 < 3 ? 'operand' : ''} />)}
    </div>
    <div className="algebra-key"><span>Four columns: quarters</span><span>Two rows: take half</span><span>Amber: 3 of 8 equal cells</span></div>
  </AlgebraFigure>;
}

export function PercentageReferenceFigure() {
  return <AlgebraFigure label="Percentage changes use the current reference amount">
    {[[100, 'Start: 100'], [120, '+20% of 100: add 20'], [96, '−20% of 120: remove 24']].map(([value, label]) => <div className="algebra-bar-row" key={value}>
      <span>{label}; amount {value}</span><div className="algebra-bar-track"><i style={{ width: `${value / 120 * 100}%` }} /></div>
    </div>)}
    <NumberRail label="40% → 50%: +10 percentage points; relative increase 10/40 = 25%" low={0} high={100} ticks={[0, 40, 50, 100]} tickLevels={{ 40: 1 }} selected={[40, 50]} arrows={[[40, 50]]} />
    <figcaption>All three bars use one scale: full track = 120 units.</figcaption>
  </AlgebraFigure>;
}

export function ExpressionAnatomyFigure() {
  return <AlgebraFigure label="Distribute three groups of x plus two units">
    {[0, 1, 2].map(index => <div className="algebra-expression-group" key={index}>
      <span className="algebra-variable-piece">x</span><span className="algebra-unit-piece">1</span><span className="algebra-unit-piece">1</span>
    </div>)}
    <p className="algebra-result">Three x-pieces + six unit pieces = 3x + 6</p>
    <figcaption>The common drawn x-length is illustrative; distribution is an identity, not a measurement of this drawing.</figcaption>
  </AlgebraFigure>;
}

function OperationTree({ grouped }) {
  const root = grouped ? '×' : '+';
  const branch = grouped ? '+' : '×';
  return <div><p>{grouped ? '(2 + 3) × 4 = 20' : '2 + 3 × 4 = 14'}</p>
    <svg viewBox="0 0 300 218" role="img" aria-label={grouped ? 'Add 2 and 3, then multiply by 4' : 'Multiply 3 and 4, then add 2'}>
      <path d={grouped ? 'M150 35 L80 110 M150 35 L230 110 M80 110 L35 183 M80 110 L125 183' : 'M150 35 L70 110 M150 35 L220 110 M220 110 L175 183 M220 110 L265 183'} className="guide" fill="none" />
      {[[150, 35, root], [grouped ? 80 : 220, 110, branch], [grouped ? 230 : 70, 110, grouped ? 4 : 2], [grouped ? 35 : 175, 183, grouped ? 2 : 3], [grouped ? 125 : 265, 183, grouped ? 3 : 4]].map(([x, y, text], index) => <g key={index}>
        <circle cx={x} cy={y} r="22" className={index < 2 ? 'operator-node' : 'operand-node'} /><text x={x} y={y + 7} textAnchor="middle">{text}</text>
      </g>)}
    </svg>
  </div>;
}

export function OperationTreeFigure() {
  return <AlgebraFigure label="Grouping changes the operation tree"><AlgebraPanels><OperationTree /><OperationTree grouped /></AlgebraPanels></AlgebraFigure>;
}

export function EquationBalance({ left, right, operation, equalityHolds = true }) {
  return <div className="algebra-balance">
    <div className="algebra-balance-pans"><span>{left}</span><b>{equalityHolds ? '=' : '≠'}</b><span>{right}</span></div>
    {equalityHolds ? <svg viewBox="0 0 300 60" role="img" aria-label="Equal left and right quantities on a level balance">
      <path d="M25 12 H275 M150 12 V42 M124 51 H176 M150 39 L138 51 M150 39 L162 51" className="axis" fill="none" />
      <path d="M25 12 V27 H102 V12 M198 12 V27 H275 V12" className="curve" fill="none" />
    </svg> : <p className="algebra-result">These quantities cannot be equal. The requested equality has no solution.</p>}
    {operation && <p>{operation}</p>}
  </div>;
}

export function ReversibilityFigure() {
  return <AlgebraFigure label="The same reversible operation preserves an equation">
    <EquationBalance left="3x + 6" right="21" operation="Remove 6 from each side" />
    <EquationBalance left="3x" right="15" operation="Divide each side by 3" />
    <EquationBalance left="x" right="5" />
  </AlgebraFigure>;
}

export function InequalityRangeFigure() {
  return <AlgebraFigure label="Reflection reverses order and inequalities select intervals">
    <AlgebraPanels>
      <NumberRail label="Before reflection: 2 < 4" low={-5} high={5} ticks={[-4, -2, 0, 2, 4]} selected={[2, 4]} />
      <NumberRail label="Multiply by −1: −2 > −4" low={-5} high={5} ticks={[-4, -2, 0, 2, 4]} selected={[-2, -4]} />
    </AlgebraPanels>
    <NumberRail label="x ≥ −3: include −3 and every value to its right" low={-5} high={5} ticks={[-3, 0, 5]} interval={[-3, 5]} selected={[-3]} />
    <NumberRail label="|x − 4| ≤ 2: include every point from 2 through 6" low={0} high={8} ticks={[0, 2, 4, 6, 8]} interval={[2, 6]} selected={[2, 6]} />
    <figcaption>The first solution ray continues beyond the displayed right edge.</figcaption>
  </AlgebraFigure>;
}

export function EquationSystemsFigure() {
  const common = { xRange: [-1, 5], yRange: [-3, 9], xLabel: 'x', yLabel: 'y' };
  return <AlgebraFigure label="A system asks where both equations hold"><AlgebraPanels>
    <div><p>2x + y = 7; x − y = 2</p><AlgebraPlot {...common} label="Two lines intersect at x3 y1" curves={[{ values: [[-1, 9], [5, -3]] }, { comparison: true, values: [[-1, -3], [5, 3]] }]} points={[{ x: 3, y: 1, label: '(3,1)', dx: -12, dy: -16, anchor: 'end' }]} /></div>
    <div><p>x + y = 4; 2x + 2y = 8</p><AlgebraPlot {...common} label="Two equations give the same line" curves={[{ values: [[-1, 5], [5, -1]] }, { comparison: true, values: [[-1, 5], [5, -1]] }]} /><p>Every point on the line works.</p></div>
    <div><p>x + y = 4; 2x + 2y = 9</p><AlgebraPlot {...common} label="Parallel distinct lines have no intersection" curves={[{ values: [[-1, 5], [5, -1]] }, { comparison: true, values: [[-1, 5.5], [5, -.5]] }]} /><p>No point lies on both lines.</p></div>
  </AlgebraPanels></AlgebraFigure>;
}

export function FunctionAnatomyFigure() {
  return <AlgebraFigure label="Connect each input with one output and one graph point"><AlgebraPanels>
    <div className="algebra-correspondence"><p>Rule: multiply by 2, then add 1</p>
      {[[0, 1], [1, 3], [2, 5]].map(([input, output]) => <div className={input === 2 ? 'current' : ''} key={input}><span>{input}</span><b aria-label="maps to">→</b><span>{output}</span></div>)}
      <div className="algebra-key"><span>Input x</span><span>Output f(x)</span></div>
    </div>
    <AlgebraPlot label="Input2 output5 locates the point2,5" xRange={[-1, 3]} yRange={[-1, 7]}
      curves={[{ values: [[-1, -1], [3, 7]] }]} points={[{ x: 2, y: 5, label: '(2,5)', dx: -12, anchor: 'end' }]}
      guides={[{ from: [2, 0], to: [2, 5] }, { from: [0, 5], to: [2, 5] }]} />
  </AlgebraPanels></AlgebraFigure>;
}

export function PiecewiseFeeFigure() {
  return <AlgebraFigure label="A distance fee changes rule at two kilometres">
    <AlgebraPlot label="Cost5 up to distance2 then increasing two cost units per kilometre" xRange={[0, 5]} yRange={[0, 12]}
      xLabel="distance d (km)" yLabel="cost C (units)" curves={[{ values: [[0, 5], [2, 5]] }, { values: [[2, 5], [5, 11]] }]}
      points={[{ x: 2, y: 5, label: '(2,5)', dx: 10 }]} />
    <div className="algebra-key"><span>0 ≤ d ≤ 2: C = 5</span><span>d &gt; 2: C = 5 + 2(d − 2)</span></div>
  </AlgebraFigure>;
}

export function AlgebraPipeline({ label, values, operations, comparison = false }) {
  return <div className={`algebra-pipeline ${comparison ? 'second' : ''}`}>
    <p>{label}</p><ol>{values.map((value, index) => <li key={index}>
      <span className="algebra-value-node">{typeof value === 'number' ? fmt(value) : value}</span>
      {operations[index] && <span className="algebra-operation"><span>{operations[index]}</span><b aria-hidden="true">→</b></span>}
    </li>)}</ol>
  </div>;
}

export function InverseReflectionFigure() {
  return <AlgebraFigure label="Reverse an affine function and swap graph coordinates">
    <AlgebraPipeline label="Undo multiply by 2, then add 1" values={[5, 4, 2]} operations={['subtract 1', 'divide by 2']} />
    <AlgebraPlot label="The point2,5 reflects to5,2 about y=x on equal scales" xRange={[-1, 7]} yRange={[-1, 7]}
      curves={[{ values: [[-1, -1], [3, 7]] }, { comparison: true, values: [[-1, -1], [7, 3]] }]}
      guides={[{ from: [-1, -1], to: [7, 7], comparison: true }, { from: [2, 5], to: [5, 2] }]}
      points={[{ x: 2, y: 5, label: '(2,5)', dx: 10 }, { x: 5, y: 2, label: '(5,2)', dx: -10, dy: 30, anchor: 'end', comparison: true }]} />
    <div className="algebra-key"><span>Amber: y = 2x + 1</span><span>Dashed cyan: y = (x − 1)/2</span><span>Dotted diagonal: y = x</span></div>
  </AlgebraFigure>;
}

export function CompositeDomainFigure() {
  return <AlgebraFigure label="The order of subtracting and taking a square root changes allowed inputs"><AlgebraPanels>
    <div><AlgebraPipeline label="√(x − 2)" values={[3, 1, 1]} operations={['subtract 2', 'nonnegative root']} /><NumberRail label="Allowed input x ≥ 2" low={-1} high={5} ticks={[-1, 0, 2, 5]} interval={[2, 5]} selected={[2]} /></div>
    <div><AlgebraPipeline label="√x − 2" values={[1, 1, -1]} operations={['nonnegative root', 'subtract 2']} /><NumberRail label="Allowed input x ≥ 0" low={-1} high={5} ticks={[-1, 0, 2, 5]} interval={[0, 5]} selected={[0]} /></div>
  </AlgebraPanels></AlgebraFigure>;
}

export function CompleteSquareFigure() {
  return <AlgebraFigure label="Remove two strips from a square, restore their overlapping corner">
    <svg className="algebra-area-square" viewBox="0 0 300 300" role="img" aria-label="Illustrative x6 square: two width3 strips overlap in a3 by3 corner; remaining square has side x minus3">
      <rect x="38" y="38" width="228" height="228" className="area-operand" />
      <rect x="152" y="38" width="114" height="228" className="area-strip" />
      <rect x="38" y="152" width="228" height="114" className="area-strip" />
      <rect x="152" y="152" width="114" height="114" className="area-overlap" />
      <rect x="38" y="38" width="114" height="114" className="area-result" />
      <text x="94" y="104" textAnchor="middle">(x−3)²</text><text x="209" y="213" textAnchor="middle">+9</text>
      <text x="152" y="25" textAnchor="middle">x</text><text x="22" y="157" textAnchor="middle">x</text>
      <text x="94" y="291" textAnchor="middle">x − 3</text><text x="209" y="291" textAnchor="middle">3</text>
    </svg>
    <div className="algebra-key"><span>Start: x²</span><span>Remove: 3x twice</span><span>Restore overlap: 9</span></div>
    <figcaption>Nonnegative-length construction for x ≥ 3; the algebraic identity extends to every real x.</figcaption>
  </AlgebraFigure>;
}

export function QuadraticShapeFigure() {
  return <AlgebraFigure label="The vertex lies halfway between the roots">
    <AlgebraPlot label="Parabola with vertex3 minus4 and roots1 and5" xRange={[-1, 7]} yRange={[-6, 10]}
      curves={[{ values: sampleAlgebra(x => (x - 3) ** 2 - 4, -1, 7) }]}
      guides={[{ from: [3, -6], to: [3, 10] }]}
      points={[{ x: 1, y: 0, label: '1', dx: -10, anchor: 'end' }, { x: 5, y: 0, label: '5' }, { x: 3, y: -4, label: '(3,−4)', dx: 0, dy: 28, anchor: 'middle' }]} />
    <p className="algebra-result">1 ← distance 2 → 3 ← distance 2 → 5</p>
  </AlgebraFigure>;
}

export function RationalHoleFigure() {
  const common = { xRange: [-2, 4], yRange: [-1, 5] };
  return <AlgebraFigure label="Simplification preserves the original missing input"><AlgebraPanels>
    <div><p>Original (x² − 1)/(x − 1)</p><AlgebraPlot {...common} label="Original graph excludes1,2"
      curves={[{ values: [[-2, -1], [.97, 1.97]] }, { values: [[1.03, 2.03], [4, 5]] }]}
      points={[{ x: 1, y: 2, hollow: true, label: '(1,2)', dx: -12, anchor: 'end' }]} /><p>x = 1 remains excluded.</p></div>
    <div><p>Separately defined extension x + 1</p><AlgebraPlot {...common} label="The extension includes1,2"
      curves={[{ comparison: true, values: [[-2, -1], [4, 5]] }]}
      points={[{ x: 1, y: 2, label: '(1,2)', dx: -12, anchor: 'end', comparison: true }]} /><p>This new function includes x = 1.</p></div>
  </AlgebraPanels></AlgebraFigure>;
}

export function CandidateCheckFigure() {
  return <AlgebraFigure label="Squaring can add a candidate that fails the original equation">
    <AlgebraPlot label="Square root x plus2 meets line y=x only at2,2" xRange={[-2, 4]} yRange={[-2, 4]}
      curves={[{ values: sampleAlgebra(x => Math.sqrt(x + 2), -2, 4) }, { comparison: true, values: [[-2, -2], [4, 4]] }]}
      points={[{ x: 2, y: 2, label: '(2,2)', dx: -12, anchor: 'end' }]} />
    <div className="algebra-substitution"><span>Candidate −1: √1 = 1 ≠ −1</span><span>Candidate 2: √4 = 2 = 2</span></div>
    <div className="algebra-key"><span>Amber: √(x + 2)</span><span>Dashed cyan: x</span></div>
  </AlgebraFigure>;
}

function FactorTokens({ count, group = 0 }) {
  return <div className="algebra-factor-tokens">{Array.from({ length: count }, (_, index) => <span className={group && index % group === 0 ? 'group-start' : ''} key={index}>2</span>)}</div>;
}

export function PowerFactorsFigure() {
  return <AlgebraFigure label="Exponent laws count factors">
    <div className="algebra-factor-row"><span>2³</span><FactorTokens count={3} /><b>×</b><span>2²</span><FactorTokens count={2} /></div>
    <div className="algebra-factor-row"><span>2⁵ = 32</span><FactorTokens count={5} /></div>
    <div className="algebra-factor-row"><span>(2²)³ = 2⁶ = 64</span><FactorTokens count={6} group={2} /></div>
    <AlgebraPipeline label="16³⁄⁴: root first, then power" values={[16, 2, 8]} operations={['fourth root', 'cube']} />
  </AlgebraFigure>;
}

export function RootBranchFigure() {
  return <AlgebraFigure label="A root chooses a branch when a power merges inputs"><AlgebraPanels>
    <div className="algebra-correspondence"><p>Both signs square to 9</p><div><span>−3</span><b>→</b><span>9</span></div><div><span>+3</span><b>→</b><span>9</span></div><AlgebraPipeline label="Nonnegative square root" values={[9, 3]} operations={['√']} /></div>
    <div><AlgebraPipeline label="Odd cube keeps the sign" values={[-2, -8, -2]} operations={['cube', 'real cube root']} /><p>√((-3)²) = 3 = |−3|</p></div>
  </AlgebraPanels></AlgebraFigure>;
}

export function GrowthMechanismFigure() {
  return <AlgebraFigure label="Equal additions and equal multipliers give different second steps">
    <AlgebraPipeline label="Add 20 units each period" values={[100, 120, 140]} operations={['+20', '+20']} comparison />
    <AlgebraPipeline label="Multiply the current amount by 1.2" values={[100, 120, 144]} operations={['×1.2', '×1.2']} />
    <div className="algebra-key"><span>Period 0: initial amount</span><span>Period 1: one operation</span><span>Period 2: repeat the same operation</span></div>
  </AlgebraFigure>;
}

export function SubdivisionFigure() {
  return <AlgebraFigure label="Subdivision changes the amount receiving each increase">
    {[[1, 2, '×2'], [2, 2.25, '×1.5'], [4, 2.44140625, '×1.25']].map(([count, value, factor]) => <div className="algebra-subperiod-row" key={count}>
      <p>{count} equal subperiod{count === 1 ? '' : 's'} in one full period</p>
      <div className="algebra-period-strip" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>{Array.from({ length: count }, (_, index) => <span key={index}>{factor}</span>)}</div>
      <p>End factor: {value}</p>
    </div>)}
    <figcaption>Each strip represents the same one-period duration. No finite subdivision equals e.</figcaption>
  </AlgebraFigure>;
}

export function LogProductFigure() {
  return <AlgebraFigure label="Multiplication adds exponents; addition does not">
    <NumberRail label="2³ × 2² = 2⁵: start at exponent 3 and advance 2" low={0} high={6} ticks={[0, 2, 3, 5, 6]} selected={[3, 5]} arrows={[[3, 5]]} />
    <AlgebraPipeline label="Multiply original values" values={[8, 32]} operations={['×4']} />
    <AlgebraPipeline label="Add original values instead" values={[8, 16]} operations={['+8']} comparison />
    <p className="algebra-result">log₂16 = 4; log₂8 + log₂8 = 6</p>
  </AlgebraFigure>;
}

export function LogScaleFamiliesFigure() {
  const exponential = [1, 2, 3, 4].map(x => [x, 2 ** x]);
  const power = [1, 2, 3, 4].map(x => [x, x ** 2]);
  const views = [
    { name: 'Original coordinates', transform: ([x, y]) => [x, y], xRange: [1, 4], yRange: [0, 16], xLabel: 'original input x', yLabel: 'original output y' },
    { name: 'Logarithm of output only', transform: ([x, y]) => [x, Math.log2(y)], xRange: [1, 4], yRange: [0, 4], xLabel: 'original input x', yLabel: 'log₂(y / 1)' },
    { name: 'Logarithm of both coordinates', transform: ([x, y]) => [Math.log2(x), Math.log2(y)], xRange: [0, 2], yRange: [0, 4], xLabel: 'log₂(x / 1)', yLabel: 'log₂(y / 1)' },
  ];
  return <AlgebraFigure label="Compare the same two rules under three coordinate choices"><AlgebraPanels>
    {views.map(view => <div key={view.name}><p>{view.name}</p><AlgebraPlot {...view} label={view.name}
      curves={[{ values: sampleAlgebra(x => 2 ** x, 1, 4).map(view.transform) }, { comparison: true, values: sampleAlgebra(x => x ** 2, 1, 4).map(view.transform) }]}
      points={[...exponential.map(view.transform).map(([x, y]) => ({ x, y })), ...power.map(view.transform).map(([x, y]) => ({ x, y, comparison: true }))]} /></div>)}
  </AlgebraPanels><div className="algebra-key"><span>Amber: y = 2ˣ</span><span>Dashed cyan: y = x²</span><span>Dots: identical original inputs 1, 2, 3, 4</span></div></AlgebraFigure>;
}

export function ReferenceRulerFigure() {
  return <AlgebraFigure label="Changing coordinates preserves values but changes spacing"><AlgebraPanels>
    <NumberRail label="Difference spacing: 10, 100, 1000; arithmetic midpoint 505" low={10} high={1000} ticks={[10, 1000]} selected={[10, 100, 1000]} annotations={[{ value: 100, label: '100' }]} />
    <NumberRail label="Exponent spacing: log₁₀10=1, log₁₀100=2, log₁₀1000=3" low={1} high={3} ticks={[1, 2, 3]} selected={[1, 2, 3]} />
  </AlgebraPanels><div className="algebra-key"><span>Original values: 10, 100, 1000</span><span>Equal ×10 steps give equal log gaps.</span><span>Geometric midpoint: √(10×1000) = 100</span></div></AlgebraFigure>;
}

export function RetrySumFigure() {
  const waits = [1, 2, 4, 8, 16];
  return <AlgebraFigure label="The total retry delay contains every wait">
    <div className="algebra-wait-strip" role="img" aria-label="Five wait pieces proportional to durations1,2,4,8,16 seconds total31">
      {waits.map(wait => <span key={wait} style={{ flex: `${wait} 1 0` }} />)}
    </div><div className="algebra-key">{waits.map((wait, index) => <span key={wait}>Wait {index + 1}: {wait} s</span>)}<span>Total: 31 s</span></div>
    <div className="algebra-sum-grid"><span>S</span>{[1, 2, 4, 8, 16, ''].map((value, index) => <span className={index > 0 && index < 5 ? 'cancelled' : ''} key={index}>{value}</span>)}
      <span>2S</span>{['', 2, 4, 8, 16, 32].map((value, index) => <span className={index > 0 && index < 5 ? 'cancelled' : ''} key={index}>{value}</span>)}</div>
    <p className="algebra-result">2S − S = 32 − 1 = 31</p>
    <figcaption>Matching middle columns cancel; the final wait of 16 seconds is only one part of S.</figcaption>
  </AlgebraFigure>;
}

export function PrecisionLossFigure() {
  return <AlgebraFigure label="Rounded intermediate values can erase a tiny change">
    <AlgebraPipeline label="Form 1 + x first, with x = 10⁻¹⁶" values={['10⁻¹⁶', '1', '0']} operations={['round 1 + x', 'ln(1)']} comparison />
    <AlgebraPipeline label="Compute the log increment directly" values={['10⁻¹⁶', '≈10⁻¹⁶']} operations={['log1p']} />
    <AlgebraPipeline label="Form exp(x), then subtract 1" values={['10⁻¹⁶', '1', '0']} operations={['rounded exp', 'subtract 1']} comparison />
    <AlgebraPipeline label="Compute the exponential increment directly" values={['10⁻¹⁶', '≈10⁻¹⁶']} operations={['expm1']} />
  </AlgebraFigure>;
}

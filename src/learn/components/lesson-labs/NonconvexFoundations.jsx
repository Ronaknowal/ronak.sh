import { C, Figure, Panels, Plot, Facts, Table, Equation, number } from './NonconvexDrawingPrimitives.jsx';
import { Surface, Contours, GeometryFamily, Matrix, OperationGraph, Canvas } from './NonconvexGeometry.jsx';
import { wellValue, wellGradient, wellState, linspace } from '../../data/nonconvex-reading-models.js';
const roots = wellState().critical;
const W = ({
  tilt = .15,
  domain = [-1.5, 1.5],
  range = [-.3, .75],
  children
}) => <Plot domain={domain} range={range} xLabel="parameter x" yLabel="objective W(x)">{p => <>{p.curve(x => wellValue(x, tilt))}{children?.(p)}</>}</Plot>;
export function Candidate() {
  return <Figure id="N01" caption="Horizontal movement changes the adjustable parameter; the vertical guide evaluates that candidate. A model input and its parameters enter different ports."><W tilt={0} range={[0, .6]}>{p => <>{p.line([.8, 0], [.8, wellValue(.8, 0)], C.a, {
          strokeDasharray: '4 4'
        })}{p.mark([.8, 0], 'a', 'x=.8')}{p.mark([.8, wellValue(.8, 0)], 'a')}{p.arrow([.2, 0], [.6, 0], C.a)}</>}</W><OperationGraph label="Input and adjustable parameter enter model; prediction and target enter the objective" stages={[{
      symbol: 'u',
      value: 'input 3',
      colour: C.reference
    }, {
      symbol: '×',
      value: 'prediction 3',
      parameter: 'parameter a=1',
      colour: C.a
    }, {
      symbol: '−',
      value: 'residual 0',
      parameter: 'target 3',
      colour: C.b
    }, {
      symbol: '²',
      value: 'half-square 0',
      colour: C.b
    }]} /><Equation>Candidate .8 evaluates to W₀(.8)=.0324. Prediction evaluates an input; objective evaluates the parameter choice on the task.</Equation></Figure>;
}
export function EqualWells() {
  return <Figure id="N02" caption="Both wells are strict local minima and tied global minima. The midpoint exceeds the zero-height chord by .25; the square proves nonnegativity on the entire real line."><W tilt={0} range={[0, .6]}>{p => <>{p.line([-1, 0], [1, 0], C.b, {
          strokeWidth: 4
        })}{p.line([0, 0], [0, .25], C.b)}{p.mark([-1, 0], 'a', '−1')}{p.mark([1, 0], 'c', '+1')}{p.mark([0, .25], 'b', '.25')}{[-1, 1].map(v => <g key={v}>{p.line([v - .15, .015], [v + .15, .015], C.a, {
            strokeWidth: 5,
            strokeDasharray: '2 2'
          })}</g>)}{p.arrow([-1.3, .03], [-1.48, .03])}{p.arrow([1.3, .03], [1.48, .03])}</>}</W><Equation>Dotted neighborhoods have radius .15; arrows continue the allowed domain. Local comparison uses a neighborhood; global comparison uses every x.</Equation></Figure>;
}
export function TiltedWells() {
  return <Figure id="N03" caption="Derivative crossings correspond to objective extrema. Negative-to-positive slope gives the two minima; the left minimum has lower value."><W>{p => <>{roots.map((r, i) => <g key={i}>{p.line([r.x, 0], [r.x, r.value], C.neutral, {
            strokeDasharray: '3 3'
          })}{p.mark([r.x, r.value], ['a', 'b', 'c'][i])}</g>)}</>}</W><Plot domain={[-1.5, 1.5]} range={[-2.1, 2.1]} xLabel="same parameter x" yLabel="derivative W′(x)">{p => <>{p.curve(x => wellGradient(x, .15))}{roots.map((r, i) => <g key={i}>{p.mark([r.x, 0], ['a', 'b', 'c'][i])}</g>)}</>}</Plot><Table caption="The same three stationary candidates, in increasing x" headers={['identity', 'x', 'W(x)', 'slope around root']} rows={roots.map((r, i) => [['cyan circle', 'amber square', 'violet diamond'][i], number(r.x), number(r.value), i === 1 ? '+ to −; maximum' : '− to +; minimum'])} /><Equation>From left to right the slope signs are −, +, −, +. Lower minimum −.155256 &lt; .143874.</Equation></Figure>;
}
export function ThreeRoots() {
  const t = 1 / Math.sqrt(3),
    bounds = [-1.5, -t, t, 1.5];
  return <Figure id="N04" caption="Three monotone intervals each contain one sign-changing zero. A cubic has at most three roots, so this is an exhaustive list for the stated tilt range."><Plot domain={[-1.5, 1.5]} range={[-2.1, 2.1]} xLabel="parameter x" yLabel="W′(x), tilt .15">{p => <>{p.curve(x => wellGradient(x, .15))}{bounds.map((x, i) => <g key={i}>{p.line([x, -2.1], [x, 2.1], C.neutral, {
            strokeDasharray: '3 4'
          })}</g>)}{roots.map((r, i) => p.mark([r.x, 0], ['a', 'b', 'c'][i]))}{p.arrow([-1.4, -1.194], [-1.2, -.378], C.a)}{p.arrow([-.3, .423], [.2, -.042], C.b)}{p.arrow([.9, -.021], [1.2, .678], C.c)}</>}</Plot><Table caption="Brackets and uniqueness" headers={['interval', 'direction', 'left sign', 'right sign']} rows={[['[−1.5,−1/√3]', 'increasing', '−', '+'], ['[−1/√3,+1/√3]', 'decreasing', '+', '−'], ['[+1/√3,+1.5]', 'increasing', '−', '+']]} /><Equation>Outer derivative values are ±1.875+δ. At turning points they are ±2/(3√3)+δ. Their signs persist for |δ|≤.2, since 2/(3√3)≈.3849 &gt; .2.</Equation></Figure>;
}
export function ScalarStep() {
  const x = .8,
    g = wellGradient(x, .15),
    next = x - .12 * g;
  return <Figure id="N05" caption="The actual displacement is only .01656. The second view enlarges the explicitly marked parameter neighborhood; the new height comes from the curve, not the tangent."><W>{p => <>{p.line([.78, -.3], [.78, .75], C.a, {
          strokeDasharray: '3 4'
        })}{p.line([.84, -.3], [.84, .75], C.a, {
          strokeDasharray: '3 4'
        })}{p.mark([x, wellValue(x, .15)], 'a')}</>}</W><W domain={[.78, .84]} range={[.147, .157]}>{p => <>{p.curve(xx => wellValue(x, .15) + g * (xx - x), C.a, .78, .84, {
          strokeDasharray: '5 3'
        })}{p.mark([x, wellValue(x, .15)], 'a')}{p.mark([next, wellValue(next, .15)], 'a', 'new')}{p.arrow([x, .148], [next, .148], C.a)}</>}</W><Facts rows={[["slope W′(.8)", number(g), 'a'], ['multiply by −η', '−.12 × −.138 = +.01656', 'a'], ['add to old parameter', number(next), 'a'], ['evaluate new cost', number(wellValue(next, .15))]]} /></Figure>;
}
export function Existence() {
  return <Figure id="N07" caption="The quartic rises on both tails and attains a minimum. The exponential approaches its zero lower bound without attaining it at a finite parameter."><W domain={[-2, 2]} range={[-.3, 2.7]}>{p => <>{p.line([-2, .5], [2, .5], C.b, {
          strokeDasharray: '5 4'
        })}{p.arrow([-1.8, wellValue(-1.8, .15)], [-2, wellValue(-2, .15)])}{p.arrow([1.8, wellValue(1.8, .15)], [2, wellValue(2, .15)])}</>}</W><Plot domain={[0, 6]} range={[0, 1.1]} xLabel="finite parameter x" yLabel="exp(−x)">{p => <>{p.curve(x => Math.exp(-x))}{p.line([0, 0], [6, 0], C.reference, {
          strokeDasharray: '5 5'
        })}{[0, 2, 4, 6].map(x => p.mark([x, Math.exp(-x)], 'a'))}</>}</Plot><Equation>Quartic candidate threshold .5 reduces the search to a bounded interval. Exponential finite values: {[0, 2, 4, 6].map(x => `x=${x}: ${number(Math.exp(-x))}`).join('; ')}. Zero is an asymptote, not a returned point.</Equation></Figure>;
}
export function SolverSuccess() {
  return <Figure id="N08" caption="Saved SciPy 1.18.1 BFGS results: all three report success, including the stationary maximum. Geometry and objective comparison determine the classification."><W>{p => <>{roots.map((r, i) => p.mark([r.x, r.value], ['a', 'b', 'c'][i]))}</>}</W><Plot domain={[-1.5, 1.5]} range={[-2.1, 2.1]} xLabel="parameter x; fixed root brackets" yLabel="W′(x)">{p => <>{p.curve(x => wellGradient(x, .15))}{[[-1.5, -.6], [-.5, .5], [.6, 1.5]].map((pair, i) => p.line([pair[0], -1.7 + i * .2], [pair[1], -1.7 + i * .2], ['#97bfca', '#edc267', '#b8a6da'][i], {
          strokeWidth: 4
        }))}</>}</Plot><Table caption="Saved local solves; root brackets are separate from these starts" headers={['start', 'returned x', '|gradient|', 'curvature', 'success']} rows={[['−1.4', '−1.067923014', '2.338e−10', '2.421378689', 'True'], ['+1.4', '.914297316', '2.990e−11', '1.507818746', 'True'], ['.153625698', '.153625698', '5.551e−17', '−.929197435', 'True']]} /></Figure>;
}
export function ThreeGeometries() {
  return <Figure id="N09" caption="Each family shows one actual height surface, its equal-height contours and its x/y restrictions. F is objective height above a two-parameter domain, not a third parameter.">{['bowl', 'cap', 'saddle'].map(kind => <div key={kind}><GeometryFamily kind={kind} /></div>)}</Figure>;
}
export function HessianColumns() {
  return <Figure id="N10" caption="Parameter displacements and gradient differences occupy separate coordinate planes. Dividing each gradient change by .1 gives one Hessian column."><Plot domain={[-.1, .4]} range={[-.2, .2]} xLabel="parameter x" yLabel="parameter y" equal>{p => <>{p.mark([.2, -.1], 'reference')}{p.arrow([.2, -.1], [.3, -.1], C.x)}{p.arrow([.2, -.1], [.2, 0], C.y)}{p.mark([.3, -.1], 'x')}{p.mark([.2, 0], 'y')}</>}</Plot><Plot domain={[-.05, .6]} range={[-.3, .3]} xLabel="gradient x component" yLabel="gradient y component" equal>{p => <>{p.arrow([0, 0], [.3, -.2], C.reference)}{p.arrow([0, 0], [.5, -.1], C.x)}{p.arrow([0, 0], [.4, .2], C.y)}{p.arrow([.3, -.2], [.5, -.1], C.x)}{p.arrow([.3, -.2], [.4, .2], C.y)}</>}</Plot><Table caption="Actual changes before the matrix" headers={['move', 'old gradient', 'new gradient', 'change / .1']} rows={[["x + .1", '(.3,−.2)', '(.5,−.1)', '(2,1)'], ['y + .1', '(.3,−.2)', '(.4,.2)', '(1,4)']]} /><Matrix label="Hessian columns: x move cyan, y move amber" columns={[C.x, C.y]} rows={[[2, 1], [1, 4]]} /></Figure>;
}
export function TaylorChange() {
  return <Figure id="N11" caption="The actual height change .04 splits into gradient contribution .02 and quadratic contribution .02. This quadratic has exactly zero remainder."><Surface fn={(x, y) => x * x + x * y + 2 * y * y} extent={.4} range={[0, .65]} label="F=x²+xy+2y²" selected={[{
      point: [.2, -.1],
      label: '.04',
      role: 'a'
    }, {
      point: [.3, -.05],
      label: '.08',
      role: 'b'
    }]} /><Plot domain={[0, 1]} range={[0, .09]} xLabel="height-change ruler" yLabel="objective height">{p => <>{p.line([.5, .04], [.5, .06], C.a, {
          strokeWidth: 7
        })}{p.line([.5, .06], [.5, .08], C.b, {
          strokeWidth: 7,
          strokeDasharray: '3 2'
        })}{p.mark([.5, .04], 'reference')}{p.mark([.5, .08], 'reference')}</>}</Plot><Equation>g·h=(.3,−.2)·(.1,.05)=.02. Hh=(.25,.3); h·(Hh)/2=.02. Remainder 0. At the stationary saddle, h=(.2,.1) gives linear 0 + quadratic .03 + remainder 0.</Equation></Figure>;
}
export function EigenRestrictions() {
  return <Figure id="N12" caption="An eigenvector restriction turns Hessian multiplication into quadratic bending λt²/2. Coordinate identity remains cyan x and amber y regardless of sign."><Contours fn={(x, y) => x * x - y * y} extent={1} levels={[-.5, 0, .5]}>{p => <>{p.arrow([0, 0], [1, 0], C.x)}{p.arrow([0, 0], [0, 1], C.y)}{p.line([.4, 0], [.4, .3], C.neutral, {
          strokeDasharray: '3 3'
        })}{p.line([0, .3], [.4, .3], C.neutral, {
          strokeDasharray: '3 3'
        })}{p.mark([.4, .3], 'reference', 'h')}</>}</Contours><Plot domain={[-.5, .5]} range={[-.25, .25]} xLabel="unit-direction distance t" yLabel="objective change">{p => <>{p.curve(t => t * t, C.x)}{p.curve(t => -t * t, C.y, -.5, .5, {
          strokeDasharray: '5 4'
        })}{p.mark([.2, .04], 'x')}{p.mark([.2, -.04], 'y')}</>}</Plot><Facts rows={[["x: H eₓ = 2 eₓ", 't=.2 gives +.04', 'x'], ['y: H eᵧ = −2 eᵧ', 't=.2 gives −.04', 'y'], ['orthogonal decomposition', 'h=.4 eₓ + .3 eᵧ']]} /></Figure>;
}
export function UniformBound() {
  return <Figure id="N13" caption="A sufficiently small disk supplies every direction at once. The little-o remainder bound leaves a strictly positive radial floor for every nonzero displacement."><Plot domain={[-.35, .35]} range={[-.35, .35]} xLabel="displacement hₓ" yLabel="displacement hᵧ" equal>{p => <>{p.polygon(linspace(0, 2 * Math.PI).map(t => [.3 * Math.cos(t), .3 * Math.sin(t)]), C.reference)}{linspace(0, 2 * Math.PI, 17).map(t => p.line([0, 0], [.3 * Math.cos(t), .3 * Math.sin(t)], '#666'))}{p.arrow([0, 0], [.16, .12], C.a)}{p.mark([.16, .12], 'a', 'ρ')}</>}</Plot><Plot domain={[0, .3]} range={[0, .1]} xLabel="radius ρ=‖h‖" yLabel="height-change bounds">{p => <>{p.curve(t => t * t, C.reference)}{p.curve(t => .5 * t * t, C.b, 0, .3, {
          strokeDasharray: '6 3'
        })}{p.curve(t => .5 * t * t, C.a, 0, .3, {
          strokeDasharray: '2 5'
        })}{p.mark([.2, .04], 'reference')}{p.mark([.2, .02], 'a')}</>}</Plot><Equation>H=diag(2,4), m=2. Quadratic ≥ρ²; |remainder|&lt;.5ρ²; remaining floor &gt;.5ρ². The two .5ρ² envelopes coincide and retain both labels. The disk radius is a schematic sufficiently small δ, not a measured δ for an unspecified function.</Equation></Figure>;
}
export function DegenerateGeometry() {
  return <Figure id="N14" caption="A zero Hessian cannot distinguish positive fourth-order growth from a quartic saddle. A separate flat line contains tied minima rather than an isolated one."><GeometryFamily kind="flatMinimum" extent={.6} range={[-.26, .26]} /><GeometryFamily kind="flatSaddle" extent={.6} range={[-.26, .26]} /><Plot domain={[-.22, .22]} range={[-.0025, .0025]} xLabel="local distance t" yLabel="quartic height detail">{p => <>{p.curve(t => t ** 4, C.x)}{p.curve(t => -(t ** 4), C.y, -.22, .22, {
          strokeDasharray: '5 4'
        })}{p.mark([.2, .0016], 'x')}{p.mark([.2, -.0016], 'y')}{p.line([-.22, 0], [.22, 0], C.reference, {
          strokeDasharray: '2 4'
        })}</>}</Plot><Surface fn={x => x * x} extent={.6} range={[0, .36]} label="Flat line F=x²" /><Plot domain={[-.6, .6]} range={[-.6, .6]} xLabel="parameter x" yLabel="parameter y" equal>{p => <>{p.line([0, -.6], [0, .6], C.reference, {
          strokeWidth: 4
        })}{p.mark([0, 0], 'reference')}</>}</Plot><Equation>Quartic actual heights at t=.2 are ±.0016 while the quadratic prediction is zero. The entire x=0 line minimizes x².</Equation></Figure>;
}
export function Boundary() {
  return <Figure id="N16" caption="The origin is an allowed boundary point. Negative x would improve F=x but is forbidden; every feasible positive move increases the objective."><Plot domain={[-1, 1]} range={[-1, 1]} xLabel="candidate x; allowed x≥0" yLabel="objective F=x">{p => <>{p.polygon([[-1, -1], [0, -1], [0, 1], [-1, 1]], C.invalid, {
          fill: 'url(#none)',
          fillOpacity: 0
        })}{linspace(-1, 0, 11).map(x => p.line([x, -1], [Math.min(0, x + .2), 1], C.neutral, {
          strokeDasharray: '2 5',
          strokeWidth: 1
        }))}{p.curve(x => x)}{p.line([0, 0], [1, 0], C.reference, {
          strokeWidth: 4
        })}{p.mark([0, 0], 'a', '0')}{p.arrow([0, .15], [-.4, .15], C.invalid)}{p.line([0, -.2], [0, .35], C.b, {
          strokeWidth: 4
        })}</>}</Plot><Equation>Gradient = +1; unconstrained descent points left. The constraint x≥0 blocks that direction.</Equation></Figure>;
}

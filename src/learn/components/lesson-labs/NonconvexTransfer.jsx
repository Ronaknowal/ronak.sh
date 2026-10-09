import { C, Figure, Plot, Panels, Facts, Table, Equation, number } from './NonconvexDrawingPrimitives.jsx';
import { Canvas, Surface, Matrix, OperationGraph } from './NonconvexGeometry.jsx';
import { FactorPlane } from './NonconvexRepresentations.jsx';
import { linspace, modePaths, interpolationValue, factorGradient, factorHessian } from '../../data/nonconvex-reading-models.js';
export const predictorStyles = [{
  a: -1,
  c: C.c,
  dash: '6 4'
}, {
  a: 0,
  c: C.a
}, {
  a: 1,
  c: C.b,
  dash: '7 3 2 3'
}, {
  a: 2,
  c: C.invalid,
  dash: '2 4'
}];
export function PositiveConnection() {
  const rows = linspace(0, 1),
    mid = modePaths(.5);
  return <Figure id="N39" caption="A straight barrier can be avoided by a curved path connecting the same positive-branch endpoints. The selected t=.5 point stays linked across parameter and loss coordinates."><FactorPlane domain={[.8, 2.2]} range={[.3, 1.2]}>{p => <>{p.path(rows.map(t => modePaths(t).straight), C.invalid, {
          strokeDasharray: '6 4'
        })}{p.path(rows.map(t => modePaths(t).curved), C.a)}{p.mark(mid.straight, 'invalid', 'S', true, -1.2)}{p.mark(mid.curved, 'a', 'C', true, 1.5)}{p.mark([1, 1], 'reference')}{p.mark([2, .5], 'reference')}</>}</FactorPlane><Plot domain={[0, 1]} range={[0, .009]} xLabel="path parameter t" yLabel="actual loss along path">{p => <>{p.curve(t => modePaths(t).straightLoss, C.invalid, 0, 1, {
          strokeDasharray: '6 4'
        })}{p.curve(t => modePaths(t).curvedLoss, C.a)}{p.mark([.5, 1 / 128], 'invalid', '1/128', true)}{p.mark([.5, 0], 'a', '0', true)}</>}</Plot><Equation>S is the straight point; C is the curved point. Straight product 1+t(1−t)/2 gives loss t²(1−t)²/8, maximum1/128. Curved product(1+t)/(1+t)=1 gives zero. The parameter t is not a distance along either path.</Equation></Figure>;
}
export function OppositeConnection() {
  const rows = linspace(0, 1);
  return <Figure id="N40" caption="Every continuous path between the opposite branches crosses a=0, where loss is .5. The straight path attains this unavoidable lower bound on maximum loss."><FactorPlane domain={[-1.2, 1.2]} range={[-1.2, 1.2]}>{p => <>{p.line([0, -1.2], [0, 1.2], C.reference, {
          strokeWidth: 3
        })}{p.path(rows.map(t => modePaths(t).opposite), C.invalid, {
          strokeDasharray: '6 4'
        })}{p.path([[1, 1], [.7, .35], [.2, .15], [-.1, .3], [-.7, -.4], [-1, -1]], C.neutral, {
          strokeDasharray: '2 5'
        })}{p.mark([1, 1], 'reference')}{p.mark([-1, -1], 'reference')}{p.mark([0, 0], 'invalid', 'crossing', true)}</>}</FactorPlane><Plot domain={[0, 1]} range={[0, .55]} xLabel="straight path parameter t" yLabel="actual loss">{p => <>{p.curve(t => modePaths(t).oppositeLoss, C.invalid, 0, 1, {
          strokeDasharray: '6 4'
        })}{p.mark([.5, .5], 'invalid', '.5', true)}</>}</Plot><Equation>Dotted curved route is schematic and still crosses a=0. The reciprocal b=1/a has a singular break at a=0; it is not a continuous connection. For any finite b on that crossing, ab=0 and F=.5.</Equation></Figure>;
}
export function ParameterFrame() {
  return <Canvas label="Three parameter axes with the selected z0 plane and an omitted z direction; no objective height" height={19}>{({
      w,
      h,
      f,
      tip
    }) => {
      const origin = [w * .5, h * .6],
        project = (x, y, z) => [origin[0] + x * (w * .26) - y * (w * .16), origin[1] + x * f - y * 2 * f - z * 5 * f],
        poly = [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0]].map(p => project(...p).join(',')).join(' ');
      return <><polygon points={poly} fill={C.reference} fillOpacity=".1" stroke={C.neutral} />{[[1, 0, 0, 'x', C.x], [0, 1, 0, 'y', C.y], [0, 0, 1, 'z', C.z]].map(([x, y, z, label, c]) => {
          const end = project(x, y, z);
          return <g key={label}><line x1={origin[0]} y1={origin[1]} x2={end[0]} y2={end[1]} stroke={c} strokeWidth="3" markerEnd={tip} /><text x={end[0]} y={end[1] - f * .5} fill={c}>{label}</text></g>;
        })}<circle cx={origin[0]} cy={origin[1]} r={f * .2} fill="white" /><text x={f} y={h - f} fill={C.reference}>selected plane z=0</text></>;
    }}</Canvas>;
}
export function SliceDomain() {
  return <Figure id="N42" caption="This is a three-parameter domain, not a height surface. The selected x–y plane sets z=0 and omits movement along the pink z axis."><ParameterFrame /><Matrix label="Embedding columns retain x and y directions" columns={[C.x, C.y]} rows={[[1, 0], [0, 1], [0, 0]]} /><Equation>P(ξ₁,ξ₂)ᵀ=(ξ₁,ξ₂,0)ᵀ. Objective value is a fourth quantity, evaluated after choosing the parameter point.</Equation></Figure>;
}
export function HiddenDescent() {
  return <Figure id="N43" caption="The visible slice has a bowl, while the omitted z restriction decreases. The full origin is therefore a saddle, even though the chosen surface has a minimum."><Surface fn={(x, y) => x * x + y * y} extent={.5} range={[0, .5]} label="F(x,y,0)=x²+y²" selected={[{
      point: [.2, 0],
      label: 'x:.04',
      role: 'x'
    }, {
      point: [0, .2],
      label: 'y:.04',
      role: 'y'
    }]} /><Plot domain={[-.5, .5]} range={[-.025, 0]} xLabel="omitted parameter z" yLabel="F(0,0,z)=−.1z²">{p => <>{p.curve(z => -.1 * z * z, C.z)}{p.mark([.2, -.004], 'z', '−.004')}</>}</Plot><Plot domain={[0, 4]} range={[-.05, .05]} xLabel="directions x / y / z" yLabel="common objective-change scale">{p => <>{p.mark([1, .04], 'x', 'x')}{p.mark([2, .04], 'y', 'y')}{p.mark([3, -.004], 'z', 'z')}</>}</Plot><Equation>Each move has coordinate displacement .2. Separate surface/restriction scales are named; the last common scale compares their actual signed values directly.</Equation></Figure>;
}
export function ProjectedHessian() {
  return <Figure id="N44" caption="The embedding excludes z before the quadratic form is evaluated. Positive curvature in the selected plane does not erase the omitted negative eigenpair."><ParameterFrame /><Panels><Matrix label="P,3×2" columns={[C.x, C.y]} rows={[[1, 0], [0, 1], [0, 0]]} /><Matrix label="H,3×3" rows={[[2, 0, 0], [0, 2, 0], [0, 0, '−.2']]} /><Matrix label="PᵀHP,2×2" rows={[[2, 0], [0, 2]]} /></Panels><OperationGraph label="A slice coordinate embeds, receives H, and returns to the selected components" stages={[{
      symbol: 'P',
      value: 'ξ=(.2,0) → (.2,0,0)'
    }, {
      symbol: 'H',
      value: '(.2,0,0) → (.4,0,0)'
    }, {
      symbol: 'Pᵀ',
      value: '(.4,0,0) → (.4,0)'
    }]} /><Equation>Multiplication dimensions:2×3 ·3×3 ·3×2 →2×2. Half the input/output dot product is.04. The omitted vector e_z=(0,0,1) retains eigenvalue−.2 in the full Hessian.</Equation></Figure>;
}
export function TrainingFunctions() {
  return <Figure id="N45" caption="Every function passes through the same two training dots, but its other predictions can differ. Axes are model input and prediction, not parameter and loss."><Plot domain={[-1.3, 1.3]} range={[-3, 3]} xLabel="model input x" yLabel="prediction hₐ(x)">{p => <>{predictorStyles.map(s => <g key={s.a}>{p.curve(x => interpolationValue(s.a, x), s.c, -1.3, 1.3, {
            strokeDasharray: s.dash
          })}{p.mark([0, -s.a], s.a === -1 ? 'c' : s.a === 0 ? 'a' : s.a === 1 ? 'b' : 'invalid', `a=${s.a}`)}</g>)}{p.mark([-1, -1], 'reference')}{p.mark([1, 1], 'reference')}</>}</Plot><Equation>At either training input x=±1, x²−1=0. At x=0 the added term is−a: the four predictions are 1,0,−1,−2.</Equation></Figure>;
}
export function TrainingLosses() {
  return <Figure id="N46" caption="Squaring the residual removes its sign but not the predictor’s identity. Training loss is identically zero; the other curve evaluates one explicitly declared point(0,0)."><Plot domain={[-2, 2]} range={[-2.2, 2.2]} xLabel="coefficient a" yLabel="residual at declared x=0">{p => <>{p.curve(a => -a, C.reference)}{predictorStyles.map(s => <g key={s.a}>{p.line([s.a, 0], [s.a, -s.a], s.c, {
            strokeDasharray: s.dash
          })}{p.mark([s.a, -s.a], s.a === -1 ? 'c' : s.a === 0 ? 'a' : s.a === 1 ? 'b' : 'invalid')}</g>)}</>}</Plot><Plot domain={[-2, 2]} range={[0, 2]} xLabel="coefficient a" yLabel="half-squared error">{p => <>{p.curve(a => a * a / 2, C.reference)}{p.line([-2, 0], [2, 0], C.neutral, {
          strokeDasharray: '5 4'
        })}{predictorStyles.map(s => p.mark([s.a, s.a * s.a / 2], s.a === -1 ? 'c' : s.a === 0 ? 'a' : s.a === 1 ? 'b' : 'invalid'))}</>}</Plot><Table caption="Two zero training residuals versus one declared evaluation residual" headers={['a', 'training residuals', 'training half-MSE', 'at x0 residual', 'at x0 half-square']} rows={[-1, 0, 1, 2].map(a => [a, '0,0', 0, -a, a * a / 2])} /></Figure>;
}
export function InactiveSignal() {
  return <Figure id="N48" caption="A negative preactivation is a smooth inactive state. The nonzero residual reaches a zero local derivative, so no signal reaches either parameter."><OperationGraph label="Actual forward pass with inactive ReLU" stages={[{
      symbol: '+',
      value: 'x1,w0,b−1 → z−1',
      parameter: 'w·x=0',
      bias: 'b=−1',
      colour: C.a
    }, {
      symbol: 'R',
      value: 'prediction 0',
      colour: C.b
    }, {
      symbol: '−',
      value: 'residual−1',
      parameter: 'target 1',
      colour: C.b
    }, {
      symbol: '²',
      value: 'half-square .5',
      colour: C.b
    }]} /><OperationGraph label="Backward signal is blocked by a zero ReLU derivative" stages={[{
      symbol: '←',
      value: 'dL/dprediction=−1'
    }, {
      symbol: '×',
      value: 'dReLU/dz=0: signal 0'
    }, {
      symbol: '↙',
      value: 'dw:0×x=0; db:0×1=0'
    }]} /><Equation>The positive loss remains. This is not the kink at z=0; here z=−1 has a whole inactive neighborhood.</Equation></Figure>;
}
export function InactiveRegion() {
  return <Figure id="N49" caption="An open inactive neighborhood has constant loss. The boundary kink has unequal one-sided slopes, so a selected software derivative there is not a classical derivative."><Plot domain={[-1.5, 1.5]} range={[-1.5, 1.5]} xLabel="parameter w" yLabel="parameter b" equal>{p => <>{p.polygon([[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5]], C.neutral, {
          fillOpacity: .1
        })}{linspace(-1.4, 1.4, 15).map(w => p.line([w, -1.5], [w, -w], C.neutral, {
          strokeWidth: 1,
          strokeDasharray: '2 5'
        }))}{p.line([-1.5, 1.5], [1.5, -1.5], C.reference)}{p.path(linspace(0, 2 * Math.PI).map(t => [.2 * Math.cos(t), -1 + .2 * Math.sin(t)]), C.a, {
          strokeDasharray: '4 3'
        })}{p.mark([0, -1], 'a', 'inactive')}{p.mark([0, .5], 'b', 'active')}{p.mark([0, 0], 'reference', 'kink')}{p.mark([0, 1], 'neutral', 'loss 0')}</>}</Plot><Plot domain={[-1.2, 1.5]} range={[0, .7]} xLabel="bias b, fixed w=0" yLabel="loss L(b)">{p => <>{p.curve(b => .5 * (Math.max(0, b) - 1) ** 2)}{p.line([-.4, .5], [0, .5], C.a, {
          strokeWidth: 3
        })}{p.line([0, .5], [.4, .1], C.c, {
          strokeWidth: 3,
          strokeDasharray: '4 3'
        })}{p.mark([0, .5], 'reference', 'kink')}</>}</Plot><Equation>Inside w+b&lt;0: non-strict local minimum and maximum, globally suboptimal. At the boundary the left derivative is0 and right derivative−1; both cannot be one classical slope.</Equation></Figure>;
}
export function AutogradMeaning() {
  const points = [[0, 0], [1, 1], [4, .25], [1, .5]];
  return <Figure id="N51" caption="Saved float64 CPU autograd agrees with the analytic smooth arrays. Test stationarity before reading curvature; separate software backward conventions at the ReLU kink."><Table caption="Actual saved factor diagnostics, analytic formulas alongside" headers={['point', 'gradient', 'stationary?', 'Hessian', 'saved eigenvalues']} rows={points.map(([a, b], i) => [`${a},${b}`, factorGradient(a, b).map(v => number(v)).join(', '), factorGradient(a, b).every(v => v === 0) ? 'yes' : 'no', factorHessian(a, b).map(row => '[' + row.map(v => number(v)).join(',') + ']').join(' '), ['−1,1', '0,2', '0,16.0625', '.25,1'][i]])} /><Table caption="ReLU w0 under the selected backward rule" headers={['bias', 'loss', 'returned gradient', 'mathematical state']} rows={[[-1, .5, '0,0', 'smooth inactive'], [0, .5, '0,0', 'nondifferentiable kink'], [.5, .125, '−.5,−.5', 'smooth active']]} /><Plot domain={[-.01, .01]} range={[.49, .501]} xLabel="bias near0; local detail" yLabel="one-unit loss">{p => <>{p.curve(b => .5 * (Math.max(0, b) - 1) ** 2)}{p.line([-.01, .5], [0, .5], C.a, {
          strokeWidth: 3
        })}{p.line([0, .5], [.01, .49], C.c, {
          strokeDasharray: '5 4',
          strokeWidth: 3
        })}{p.mark([0, .5], 'reference')}</>}</Plot><Equation>Software-selected derivative 0 is separate from left slope 0 and right slope−1. At finite h=10⁻⁶ the right quotient is−.9999995, printed−1.000000 in the saved output.</Equation></Figure>;
}
export function AppliedUpdate() {
  return <Figure id="N52" caption="A constructed skipped-update record has a meaningful gradient but no applied displacement. The open proposal and filled stored point describe different events."><Plot domain={[.9, 1.05]} range={[0, 1]} xLabel="stored parameter θ" yLabel="one parameter record">{p => <>{p.line([.9, .5], [1.05, .5], C.neutral)}{p.arrow([1, .5], [.95, .5], C.reference)}{p.mark([.95, .5], 'reference', 'proposed .95')}{p.mark([1, .5], 'a', 'stored 1', true)}</>}</Plot><OperationGraph label="Gradient consumption, proposed update and actual skipped event" stages={[{
      symbol: 'θ',
      value: 'stored 1; gradient .5',
      colour: C.a
    }, {
      symbol: '×',
      value: '−ηg=−.1×.5=−.05'
    }, {
      symbol: '∅',
      value: 'update skipped: counter 0'
    }, {
      symbol: 'θ',
      value: 'stored 1; actual Δθ=0',
      colour: C.a
    }]} /><Equation>A separate applied case would store.95 with displacement−.05 and counter 1. That would not be a second step of this skipped record. This example makes no floating-point rounding claim.</Equation></Figure>;
}

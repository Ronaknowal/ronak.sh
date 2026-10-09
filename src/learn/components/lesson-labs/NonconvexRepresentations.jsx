import { C, Figure, Panels, Plot, Facts, Table, Equation, number } from './NonconvexDrawingPrimitives.jsx';
import { Canvas, Matrix, OperationGraph, UnitNetwork } from './NonconvexGeometry.jsx';
import { factorValue, factorStep, linspace, networkState, irisConstants } from '../../data/nonconvex-reading-models.js';
import iris from '../../data/nonconvex-iris-observations.json';
export { iris };
export function FactorPlane({
  domain = [-4.5, 4.5],
  range = [-4.5, 4.5],
  product = 1,
  children
}) {
  return <Plot domain={domain} range={range} xLabel="parameter a" yLabel="parameter b" equal>{p => <>{domain[0] < 0 && p.curve(a => product / a, C.reference, domain[0], Math.min(-.05, domain[1]))}{domain[1] > 0 && p.curve(a => product / a, C.reference, Math.max(.05, domain[0]), domain[1])}{children?.(p)}</>}</Plot>;
}
export function FactorWiring() {
  return <Figure id="N25" caption="Input u is transformed by two adjustable scalar multipliers. Their product determines each prediction; the training residuals then determine the objective."><OperationGraph label="Input3 through a2 to6, through b.5 to prediction3" stages={[{
      symbol: 'u',
      value: 'input 3'
    }, {
      symbol: '×',
      value: 'intermediate 6',
      parameter: 'a=2',
      colour: C.a
    }, {
      symbol: '×',
      value: 'prediction 3',
      parameter: 'b=.5',
      colour: C.c
    }]} /><Table caption="The two records defining this objective" headers={['input', 'a×input', 'b×intermediate', 'target', 'residual', 'half-square']} rows={[[-1, -2, -1, -1, 0, 0], [1, 2, 1, 1, 0, 0]]} /><Equation>Average half-square=(0+0)/2=0. In general each residual is ±(ab−1), hence F(a,b)=½(ab−1)².</Equation></Figure>;
}
export function Hyperbola() {
  const points = [[1, 1], [2, .5], [4, .25], [-1, -1]];
  return <Figure id="N26" caption="Both disconnected branches have product ab=1. Every marked parameter pair represents the same entire predictor, not only agreement at a selected input."><FactorPlane>{p => <>{points.map((v, i) => p.mark(v, i === 0 ? 'a' : i === 1 ? 'b' : i === 2 ? 'c' : 'neutral', String(i + 1)))}</>}</FactorPlane><Plot domain={[-2, 3]} range={[-2, 3]} xLabel="model input u" yLabel="prediction ŷ" equal>{p => <>{p.curve(u => u)}{p.mark([3, 3], 'reference', 'all4')}</>}</Plot><Table caption="Parameter points connect to one shared prediction line" headers={['point', '(a,b)', 'product', 'represented function']} rows={points.map((v, i) => [i + 1, `(${v.join(',')})`, 1, 'ŷ=u, every input'])} /></Figure>;
}
export function FactorHessian() {
  const rt = Math.SQRT1_2;
  return <Figure id="N27" caption="The nonzero product gradient is normal to ab=1. The loss gradient multiplies it by residual 0, so it vanishes at every marked zero-loss point."><FactorPlane domain={[.1, 2.1]} range={[.1, 2.1]}>{p => <>{p.mark([1, 1], 'reference')}{p.arrow([1, 1], [2, 2], C.b)}{p.arrow([1, 1], [1 + rt, 1 + rt], C.a)}{p.line([1, 1], [1 + rt, 1 - rt], C.c, {
          strokeDasharray: '5 4',
          strokeWidth: 3
        })}</>}</FactorPlane><Facts rows={[["product gradient", '(b,a)=(1,1)', 'b'], ['unit normal', '(1,1)/√2; Hn=2n', 'a'], ['unit tangent', '(1,−1)/√2; Hv=0', 'c'], ['loss gradient', '(ab−1)(b,a)=(0,0)']]} /><Panels><Matrix label="H at(1,1); spectrum0,2" rows={[[1, 1], [1, 1]]} /><Matrix label="H at(4,.25); spectrum0,16.0625" rows={[[.0625, 1], [1, 16]]} /><Matrix label="H at origin; spectrum−1,+1" rows={[[0, -1], [-1, 0]]} /></Panels><Equation>At a zero-loss point R²=a²+b² and H=(b,a)(b,a)ᵀ. At the origin the factor gradient is also zero, but H is indefinite.</Equation></Figure>;
}
export function FiniteTangent() {
  const scales = [1, 4];
  return <Figure id="N28" caption="Both straight arrows have Euclidean length .1. A tangent line departs from the curved zero-loss set at fourth order; its zero quadratic prediction does not mean zero finite loss.">{scales.map(s => {
      const n = factorStep(s, 'normal', .1),
        t = factorStep(s, 'tangent', .1);
      return <div key={s}><p>Scale s={s}; same .3×.3 local parameter window.</p><FactorPlane domain={[s - .15, s + .15]} range={[1 / s - .15, 1 / s + .15]}>{p => <>{p.mark(n.base, 'reference')}{p.arrow(n.base, n.end, C.a)}{p.line(t.base, t.end, C.c, {
              strokeWidth: 3,
              strokeDasharray: '5 4'
            })}{p.mark(n.end, 'a', 'normal')}{p.mark(t.end, 'c', 'tangent')}</>}</FactorPlane></div>;
    })}<Plot domain={[0, 5]} range={[0, .09]} xLabel="base scale s" yLabel="actual finite-step loss">{p => <>{scales.flatMap(s => {
          const n = factorStep(s, 'normal', .1),
            t = factorStep(s, 'tangent', .1);
          return [p.line([s, 0], [s, n.loss], C.a), p.mark([s, n.loss], 'a'), p.mark([s, t.loss], 'c')];
        })}</>}</Plot><Plot domain={[0, 5]} range={[0, .000013]} xLabel="base scale s; tangent detail" yLabel="actual tangent loss">{p => <>{scales.map(s => p.mark([s, factorStep(s, 'tangent', .1).loss], 'c'))}{p.line([0, 0], [5, 0], C.reference, {
          strokeDasharray: '4 3'
        })}</>}</Plot><Table caption="Exact formulas evaluated after each displacement" headers={['s', 'normal loss', 'tangent loss', 'tangent quadratic']} rows={scales.map(s => [s, number(factorStep(s, 'normal', .1).loss), number(factorStep(s, 'tangent', .1).loss), 0])} /></Figure>;
}
export function NetworkAnatomy() {
  return <Figure id="N30" caption="Each complete hidden unit includes incoming weight, bias, activation and outgoing weight. Bias enters the affine sum before ReLU; outgoing contributions meet at the sum."><Plot domain={[-1, 2]} range={[0, 2]} xLabel="preactivation z" yLabel="ReLU(z)">{p => <>{p.curve(z => Math.max(0, z))}{p.mark([0, 0], 'reference', 'kink')}</>}</Plot><UnitNetwork state={networkState(1.5)} name="Original two-unit network" /></Figure>;
}
export function NetworkPermutation() {
  return <Figure id="N31" caption="Whole unit identities move with all three parameters. The two contributions arrive at the sum in a new order, but their total remains .5."><UnitNetwork state={networkState(1.5)} name="Original order1,2" /><Canvas label="Correspondence swaps the positions of complete unit bundles" height={6}>{({
        w,
        f,
        tip
      }) => <><line x1={f} y1={f} x2={w - f} y2={5 * f} stroke={C.a} strokeWidth="2" markerEnd={tip} /><line x1={f} y1={5 * f} x2={w - f} y2={f} stroke={C.c} strokeWidth="2" markerEnd={tip} /><text x={f} y={2 * f} fill={C.a}>● unit 1</text><text x={f} y={4 * f} fill={C.c}>■ unit 2</text></>}</Canvas><UnitNetwork state={networkState(1.5, 'permuted')} name="Permuted order2,1" /></Figure>;
}
export function BiasScaling() {
  return <Figure id="N32" caption="Positive scaling multiplies both incoming weight and bias, then divides the outgoing weight. Leaving the bias unchanged changes the gate threshold and the represented function."><OperationGraph label="Original unit and the complete scale transformation" stages={[{
      symbol: '+',
      value: 'u−1 → 2u−2',
      parameter: 'w ×2',
      bias: 'b ×2',
      colour: C.a
    }, {
      symbol: 'R',
      value: 'ReLU(2u−2)',
      colour: C.a
    }, {
      symbol: '×',
      value: 'outgoing2 → 1',
      parameter: 'out ÷2',
      colour: C.a
    }]} /><Plot domain={[0, 2]} range={[0, 3]} xLabel="input u" yLabel="unit 1 contribution">{p => <>{p.curve(u => 2 * Math.max(0, u - 1), C.a)}{p.curve(u => Math.max(0, 2 * u - 1), C.a, 0, 2, {
          strokeDasharray: '5 4'
        })}{p.mark([.75, 0], 'a')}{p.mark([.75, .5], 'reference')}{p.mark([1.5, 1], 'a')}{p.mark([1.5, 2], 'reference')}</>}</Plot><Table caption="Solid original/correct; dashed bias unchanged" headers={['u', 'original', 'correct c2', 'bias unchanged']} rows={[[.75, 0, 0, .5], [1.5, 1, 1, 2]]} /><Equation>Negative scale counterexample at z=1: ReLU(−1)=0, but −ReLU(1)=−1. The positive-scale identity does not cover c&lt;0.</Equation></Figure>;
}
export function ParameterPenalty() {
  return <Figure id="N34" caption="This comparison is restricted to zero-data-loss representations ab=1. Balanced magnitudes minimize their penalty; the unrestricted regularized optimum is a different question."><Plot domain={[.5, 4]} range={[0, 17]} xLabel="positive-branch scale s" yLabel="a²+b²=s²+s⁻²">{p => <>{p.curve(s => s * s + 1 / (s * s))}{p.mark([1, 2], 'a', '2')}{p.mark([2, 4.25], 'c', '4.25')}</>}</Plot><FactorPlane domain={[-2.5, 2.5]} range={[-2.5, 2.5]}>{p => <>{p.mark([1, 1], 'a', 'balanced')}{p.mark([-1, -1], 'c', 'balanced')}{p.mark([2, .5], 'neutral')}</>}</FactorPlane><Table caption="λ=.1, restricted to ab=1" headers={['s', 'data loss', 'penalty', 'total']} rows={[[1, 0, .2, .2], [2, 0, .425, .425]]} /><Equation>a²+b²≥2|ab|=2, with equality at |a|=|b|. Reducing the full penalized objective may accept prediction error; this restricted curve does not solve that tradeoff.</Equation></Figure>;
}
export function CoordinateGrid() {
  const grid = (domain, range, mapped) => <Plot domain={domain} range={range} xLabel={mapped ? 'θ₁ = 4φ₁' : 'φ₁'} yLabel={mapped ? 'θ₂ = φ₂/4' : 'φ₂'} equal>{p => <>{linspace(.8, 1.2, 5).map(v => <g key={v}>{p.line([mapped ? 3.2 : .8, mapped ? v / 4 : v], [mapped ? 4.8 : 1.2, mapped ? v / 4 : v], C.neutral, {
          strokeWidth: 1
        })}{p.line([mapped ? 4 * v : v, mapped ? .2 : .8], [mapped ? 4 * v : v, mapped ? .3 : 1.2], C.neutral, {
          strokeWidth: 1
        })}</g>)}{p.mark(mapped ? [4, .25] : [1, 1], 'reference')}{p.arrow(mapped ? [4, .25] : [1, 1], mapped ? [4.4, .275] : [1.1, 1.1], C.a)}</>}</Plot>;
  return <Figure id="N35" caption="The same coordinate displacement maps to a different Euclidean move. At stationarity the Hessians are congruent, preserving sign counts but changing magnitudes.">{grid([.75, 1.25], [.75, 1.25], false)}{grid([3, 5], [-.75, 1.25], true)}<Panels><Matrix label="J=diag(4,.25)" rows={[[4, 0], [0, .25]]} /><Matrix label="Hθ, spectrum0,16.0625" rows={[[.0625, 1], [1, 16]]} /><Matrix label="JᵀHθJ, spectrum0,2" rows={[[1, 1], [1, 1]]} /></Panels><Equation>δφ=(.1,.1) maps to δθ=(.4,.025). Both corresponding quadratic changes are .02; exact finite losses include higher-order terms.</Equation><OperationGraph label="Away from stationarity two chain-rule contributions survive" stages={[{
      symbol: 'θ',
      value: 'F(θ)=θ²/2; θ=e^φ'
    }, {
      symbol: '1',
      value: 'JᵀHJ=1 at φ0'
    }, {
      symbol: '+',
      value: 'g ψ″ = 1; total2'
    }]} /><Equation>At φ=0, J=H=g=ψ″=1. The second derivative of e^(2φ)/2 is2, so dropping the extra term would be incorrect.</Equation></Figure>;
}
export function irisMark(p, point, species, selected = false) {
  const x = p.x(point[0]),
    y = p.y(point[1]),
    r = .18 * p.f,
    c = species === 'Iris-setosa' ? C.a : species === 'Iris-versicolor' ? C.c : C.b;
  return <g>{species === 'Iris-setosa' ? <circle cx={x} cy={y} r={r} fill={c} /> : species === 'Iris-versicolor' ? <rect x={x - r} y={y - r} width={2 * r} height={2 * r} fill={c} /> : <path d={`M${x} ${y - r * 1.5}L${x + r * 1.3} ${y + r}L${x - r * 1.3} ${y + r}Z`} fill={c} />} {selected && <circle cx={x} cy={y} r={r * 2.6} fill="none" stroke="white" strokeWidth="2" />}</g>;
}
export function IrisScatter({
  centred = false,
  residuals = false
}) {
  const {
      meanX,
      meanY,
      beta
    } = irisConstants,
    dx = centred ? meanX : 0,
    dy = centred ? meanY : 0;
  return <Plot domain={[4 - dx, 8.2 - dx]} range={[-dy, 7.2 - dy]} xLabel={centred ? 'centred sepal length X(cm)' : 'sepal length x(cm)'} yLabel={centred ? 'centred petal length Y(cm)' : 'petal length y(cm)'}>{p => <>{!centred && <>{p.line([meanX, 0], [meanX, 7.2], C.neutral, {
          strokeDasharray: '4 4'
        })}{p.line([4, meanY], [8.2, meanY], C.neutral, {
          strokeDasharray: '4 4'
        })}</>}{residuals && p.curve(x => meanY + beta * (x + dx - meanX) - dy, C.reference)}{iris.map(row => <g key={row.row}>{residuals && p.line([row.x - dx, row.y - dy], [row.x - dx, meanY + beta * (row.x - meanX) - dy], C.neutral, {
          strokeWidth: .7,
          strokeOpacity: .6
        })}{irisMark(p, [row.x - dx, row.y - dy], row.species, row.row === 1)}</g>)}</>}</Plot>;
}
export function ObservedMeasurements() {
  const {
    meanX,
    meanY
  } = irisConstants;
  return <Figure id="N36" caption="All 150 corrected Iris records are measured observations. Species controls marker identity only; every row participates in one pooled descriptive regression."><IrisScatter /><Table caption="Identity and the selected first record" headers={['species identity', 'first-record x', 'first-record y']} rows={[['setosa cyan circle', '5.1cm', '1.4cm'], ['versicolor violet square', '—', '—'], ['virginica amber triangle', '—', '—']]} /><Plot domain={[-1, 6]} range={[-3, 4]} xLabel="original / centred sepal coordinate" yLabel="original / centred petal coordinate">{p => <>{p.mark([5.1, 1.4], 'a', 'row 1')}{p.arrow([5.1, 1.4], [5.1 - meanX, 1.4], C.a)}{p.arrow([5.1 - meanX, 1.4], [5.1 - meanX, 1.4 - meanY], C.a)}{p.mark([5.1 - meanX, 1.4 - meanY], 'a', 'centred', true)}</>}</Plot><Equation>Subtract the means x̄={number(meanX)}cm and ȳ={number(meanY)}cm. The separate centering view changes coordinates, not which flower is observed.</Equation></Figure>;
}
export function RegressionMoments() {
  const {
      meanX,
      meanY,
      beta,
      moment
    } = irisConstants,
    X = 5.1 - meanX,
    Y = 1.4 - meanY,
    residual = Y - beta * X;
  return <Figure id="N37" caption="The fitted line is neutral; every residual segment uses an actual observation. The normal equation cancels the aggregate cross term, not each flower’s residual."><IrisScatter centred residuals /><Facts rows={[["row 1 centred coordinates", `X=−223/300; Y=−1179/500`, 'a'], ['row 1 X²', number(X * X), 'a'], ['row 1 XY', number(X * Y), 'a'], ['row 1 residual Y−βX', number(residual), 'a'], ['M, all 150 rows', '306505/450000 cm²'], ['slope β, all 150 rows', '569619/306505']]} /><OperationGraph label="Actual moment sums define the fitted slope and orthogonality" stages={[{
      symbol: 'Σ',
      value: 'ΣX² = nM'
    }, {
      symbol: '÷',
      value: 'β = ΣXY / ΣX²'
    }, {
      symbol: '−',
      value: 'ΣX(Y−βX) = 0'
    }]} /><Equation>Expand error=(ab−β)X−r before squaring. Its summed cross term is −(ab−β)ΣXr/n=0. M={number(moment)}, β={number(beta)}.</Equation></Figure>;
}
export function MeasuredFactors() {
  const {
      meanX,
      meanY,
      beta,
      moment
    } = irisConstants,
    floor = iris.reduce((s, r) => s + (r.y - meanY - beta * (r.x - meanX)) ** 2, 0) / (2 * iris.length),
    root = Math.sqrt(beta);
  return <Figure id="N38" caption="Changing factor scale keeps all 150 predictions and residuals fixed above a positive data-loss floor. Different Hessian magnitudes describe parameter coordinates, not new predictive accuracy."><FactorPlane domain={[-6, 6]} range={[-3, 3]} product={beta}>{p => <>{p.mark([root, root], 'a', 's1')}{p.mark([4 * root, root / 4], 'c', 's4')}</>}</FactorPlane><IrisScatter residuals /><Plot domain={[0, 5]} range={[0, 21]} xLabel="factor scale s" yLabel="positive Hessian eigenvalue">{p => <>{[1, 4].map(s => <g key={s}>{p.line([s, 0], [s, moment * beta * (s * s + 1 / (s * s))], s === 1 ? C.a : C.c, {
            strokeWidth: 4
          })}{p.mark([s, 0], 'reference')}{p.mark([s, moment * beta * (s * s + 1 / (s * s))], s === 1 ? 'a' : 'c')}</g>)}</>}</Plot><Plot domain={[-1.5, 1.5]} range={[0, 1]} xLabel="origin Hessian eigenvalue" yLabel="signed origin spectrum">{p => <>{p.mark([-moment * beta, .5], 'neutral')}{p.mark([moment * beta, .5], 'neutral')}</>}</Plot><Facts rows={[["minimum half-MSE F*", number(floor) + ' cm²'], ['positive curvature at s1', number(2 * moment * beta), 'a'], ['positive curvature at s4', number(moment * beta * (16 + 1 / 16)), 'c'], ['other eigenvalue', '0 at either factorization'], ['recorded prediction array difference', '0, same fitted line']]} /><Plot domain={[0, 4]} range={[0, 2]} xLabel="represented slope p=ab" yLabel="data loss(cm²)">{p => <>{p.curve(product => floor + .5 * moment * (product - beta) ** 2)}{p.line([0, floor], [4, floor], C.reference, {
          strokeDasharray: '4 4'
        })}{p.mark([beta, floor], 'reference', 'F*')}</>}</Plot></Figure>;
}

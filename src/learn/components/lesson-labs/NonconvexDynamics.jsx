import { C, Figure, Plot, Panels, Facts, Table, Equation, number } from './NonconvexDrawingPrimitives.jsx';
import { Contours, Matrix, Canvas } from './NonconvexGeometry.jsx';
import { linspace, saddleTrace, noiseTrace, noiseMoment, eightSignDistribution } from '../../data/nonconvex-reading-models.js';
export function SaddleStep() {
  return <Figure id="N17" caption="Subtracting the gradient contracts x and amplifies a nonzero y component. The labelled y-detail retains the tiny actual displacement .0002."><Contours fn={(x, y) => x * x - y * y} extent={.8} levels={[-.5, 0, .5]}>{p => <>{p.mark([.6, .001], 'a')}{p.arrow([.6, .001], [.48, .0012], C.a)}{p.mark([.48, .0012], 'a', 'new')}{p.mark([0, 0], 'reference', 'stationary')}</>}</Contours><Plot domain={[.4, .65]} range={[0, .0015]} xLabel="x parameter; local detail" yLabel="y parameter; magnified scale">{p => <>{p.mark([.6, .001], 'a', 'old')}{p.arrow([.6, .001], [.48, .0012], C.a)}{p.mark([.48, .0012], 'a', 'new')}</>}</Plot><Table caption="One actual update, η=.1" headers={['coordinate', 'old', 'gradient', '−η gradient', 'new']} rows={[['x square', '.6', '1.2', '−.12', '.48'], ['y triangle', '.001', '−.002', '.0002', '.0012']]} /><Equation>The gradient is(1.2,−.002), not a parameter position. At exact origin the gradient and update are both zero.</Equation></Figure>;
}
export function Multipliers() {
  const selected = saddleTrace(.001, 20),
    stable = saddleTrace(0, 20);
  return <Figure id="N18" caption="Multiplication by .8 contracts x; multiplication by1.2 amplifies y. The exact stable line y=0 remains distinct from the small nonzero start."><Plot domain={[0, .65]} range={[0, .04]} xLabel="parameter x" yLabel="parameter y">{p => <>{p.path(stable.map(r => [r.x, r.y]), C.reference, {
          strokeDasharray: '5 4'
        })}{p.path(selected.map(r => [r.x, r.y]), C.a)}{p.mark([selected[0].x, selected[0].y], 'a')}{p.mark([selected[20].x, selected[20].y], 'a', 'k20', true)}</>}</Plot><Plot domain={[0, 20]} range={[0, .6]} xLabel="completed update k" yLabel="x = .6(.8)ᵏ">{p => <>{p.path(selected.map(r => [r.k, r.x]), C.x)}{p.mark([20, selected[20].x], 'x')}</>}</Plot><Plot domain={[0, 20]} range={[0, .04]} xLabel="completed update k" yLabel="y = .001(1.2)ᵏ">{p => <>{p.path(selected.map(r => [r.k, r.y]), C.y)}{p.line([0, 0], [20, 0], C.reference, {
          strokeDasharray: '5 4'
        })}{p.mark([20, selected[20].y], 'y')}</>}</Plot><Facts rows={[["x multiplier", '.8; x₂₀=' + number(selected[20].x), 'x'], ['y multiplier', '1.2; y₂₀=' + number(selected[20].y), 'y'], ['stable reference', 'y₀=0 gives yₖ=0 exactly']]} /></Figure>;
}
export function SampleGradients() {
  return <Figure id="N20" caption="Opposite sample-gradient additions cancel in their mean, but either realized y-noise update leaves the stable line. With x-only noise every y update remains zero."><Plot domain={[0, 1.6]} range={[-.3, .3]} xLabel="gradient x component" yLabel="gradient y component">{p => <>{p.arrow([0, 0], [1.2, 0], C.reference)}{p.arrow([0, 0], [1.2, .2], C.a)}{p.arrow([0, 0], [1.2, -.2], C.c)}{p.line([1.2, -.2], [1.2, .2], C.neutral, {
          strokeDasharray: '3 3'
        })}{p.mark([1.2, 0], 'reference', 'mean')}{p.mark([1.2, .2], 'a', 'ℓ+')}{p.mark([1.2, -.2], 'c', 'ℓ−')}</>}</Plot><Plot domain={[.4, .65]} range={[-.03, .03]} xLabel="parameter x after update" yLabel="parameter y after update">{p => <>{p.mark([.6, 0], 'reference', 'old')}{p.arrow([.6, 0], [.48, -.02], C.a)}{p.arrow([.6, 0], [.48, .02], C.c)}{p.mark([.48, -.02], 'a', 'ℓ+')}{p.mark([.48, .02], 'c', 'ℓ−')}</>}</Plot><Table caption="Fixed initial(.6,0), rate.1 and amplitude.2" headers={['noise', 'sample gradient +', 'sample gradient −', 'visited parameters + / −']} rows={[['y only', '(1.2,.2)', '(1.2,−.2)', '(.48,−.02) / (.48,.02)'], ['x only', '(1.4,0)', '(1,0)', '(.46,0) / (.5,0)']]} /></Figure>;
}
export function NoiseWeights() {
  const weights = Array.from({
    length: 8
  }, (_, i) => -.02 * 1.2 ** (7 - i));
  return <Figure id="N22" caption="Eight-step reference: older signs have larger amplification. Off-diagonal terms vanish only after expectation over independent uniform signs, not within each realized path."><Plot domain={[-.5, 7.5]} range={[-.08, 0]} xLabel="sign index i" yLabel="coefficient of sᵢ in y₈">{p => <>{weights.map((v, i) => <g key={i}>{p.line([i, 0], [i, v], C.neutral, {
            strokeWidth: 5
          })}{p.mark([i, v], 'neutral', String(i), false, 1.3)}</g>)}</>}</Plot><Table caption="The actual eight signed coefficients" headers={['i', 'power7−i', 'coefficient −.02×1.2^(7−i)']} rows={weights.map((v, i) => [i, 7 - i, number(v)])} /><Matrix label="Expectation of sᵢsⱼ; row/column order0…7. Diagonal1, off-diagonal0." rows={weights.map((_, i) => weights.map((_, j) => i === j ? '1' : '0'))} /><Equation>Multiply cell(i,j) by coefficientᵢ×coefficientⱼ. The diagonal contributes the eight squared coefficients; the zero cross terms leave E[y₈²]={number(noiseMoment('y', .2, 8))}. E[y₈]=0.</Equation></Figure>;
}
export function NoiseDistribution() {
  const support = eightSignDistribution(),
    max = Math.max(...support.map(r => r.p)),
    extent = Math.max(...support.map(r => Math.abs(r.y))),
    contribution = Math.max(...support.map(r => r.contribution));
  return <Figure id="N23" caption="Fixed eight-step reference, η=.1 and a=.2: each of 256 sign sequences has probability 1/256. Exact integer keys preserve any repeated support multiplicity. These masses are not a smoothed density."><Plot domain={[-extent, extent]} range={[0, max * 1.25]} xLabel="terminal coordinate y₈" yLabel="probability mass">{p => <>{support.map((r, i) => p.line([r.y, 0], [r.y, r.p], C.a, {
          key: i,
          strokeWidth: 1.2
        }))}{p.line([0, 0], [0, max * 1.2], C.reference, {
          strokeDasharray: '4 3'
        })}</>}</Plot><Plot domain={[-extent, extent]} range={[0, contribution * 1.1]} xLabel="same terminal coordinate y₈" yLabel="mass × y₈² contribution">{p => <>{support.map((r, i) => p.line([r.y, 0], [r.y, r.contribution], C.a, {
          key: i,
          strokeWidth: 1.2
        }))}</>}</Plot><Plot domain={[-extent, extent]} range={[0, 1.1]} xLabel="terminal y₈ with x-only noise" yLabel="probability mass; separate scale">{p => <>{p.line([0, 0], [0, 1], C.reference, {
          strokeWidth: 3
        })}{p.mark([0, 1], 'reference', 'mass 1')}</>}</Plot><Facts rows={[["exact mean coordinate", "0 by paired symmetry"], ["floating-point sum residue", number(support.reduce((a, r) => a + r.p * r.y, 0))], ['second moment', number(support.reduce((a, r) => a + r.contribution, 0))], ['x-only reference', 'one atom at y=0 with mass 1 and second moment 0']]} /><Table caption="Complete exact support ledger; numerator/(50×5⁷) determines each y₈" headers={['numerator', 'y₈', 'multiplicity', 'probability', 'p(y)y²']} rows={support.map(r => [r.numerator, number(r.y), r.count, `${r.count}/256`, number(r.contribution)])} /><Equation>This distribution stays at eight steps even when the separate live path is moved to 24. That lab reports its own current-horizon analytic moment.</Equation></Figure>;
}
export function PerturbationBand() {
  return <Figure id="N24" caption="Schematic finite-horizon geometry: the exact stable set is a line; the hatched slow/stuck band has width and can contain points that escape later. No area or path count represents a probability estimate."><Plot domain={[-1, 1]} range={[-1, 1]} xLabel="local stable component" yLabel="local unstable component" equal>{p => <>{p.polygon(linspace(0, 2 * Math.PI).map(t => [.55 * Math.cos(t), .55 * Math.sin(t)]), C.reference, {
          fillOpacity: .06,
          stroke: C.reference
        })}{p.polygon([[-.7, -.09], [.7, -.09], [.7, .09], [-.7, .09]], C.neutral, {
          fillOpacity: .12,
          stroke: C.neutral,
          strokeDasharray: '3 3'
        })}{linspace(-.65, .65, 13).map(x => p.line([x, -.09], [x + .06, .09], C.neutral, {
          strokeWidth: 1
        }))}{p.line([-1, 0], [1, 0], C.reference, {
          strokeWidth: 2
        })}{p.path([[.35, .2], [.25, .35], [.15, .6], [.1, .92]], C.a)}{p.path([[-.3, -.15], [-.2, -.3], [-.1, -.55], [-.05, -.92]], C.c)}{p.path([[.45, .03], [.3, .045], [.15, .075]], C.b)}{p.path([[.15, .075], [.08, .15], [.04, .4]], C.b, {
          strokeDasharray: '5 4'
        })}{p.mark([.15, .075], 'b', 'T', true)}{p.mark([0, 0], 'reference')}</>}</Plot><Equation>Solid horizontal line: exact stable set. Hatched band: symbolic finite-horizon width. Amber path has not crossed the boundary by T; its dashed continuation may escape later.</Equation><Table caption="The theorem belongs to its prescribed protocol" headers={['assumptions', 'algorithm', 'qualified conclusion']} rows={[['Lipschitz gradient/Hessian; finite initial gap', 'prescribed iterate perturbation with theorem parameters', 'approximate second-order stationarity with stated high probability']]} /><Equation>Per-example sample-gradient noise above is a different protocol. The unbounded quadratic does not supply the finite-gap premise.</Equation></Figure>;
}

import React from 'react';
import { DistanceBracket } from '../../../../ManifoldObjects.jsx';
import { ConditionalMerge, OrderedDependency } from '../../../../ManifoldOperationObjects.jsx';
import { Drawing, Plot, Line, Bars, Matrix, Table, Curve, hues, number } from '../../../../ManifoldDrawing.jsx';
import { GaussianView, NormalizationView, ForceView, UnionView, PairView } from '../../../../ManifoldInvestigations.jsx';
import { conditional, fixedP, initialY, gaussianRow, tsneStep, studentState, sampledEvent } from '../../../../manifold-models.mjs';
export function GaussianSelection() {
  return <GaussianView distances={[1, 2, 3]} sigma={1} />;
}
export function EffectiveNeighborhood() {
  return <><Drawing caption="Entropy counts separate candidate events; the tied lower boundary keeps both nearest IDs.">
  <Bars values={[1 / 3, 1 / 3, 1 / 3]} labels={['uniform B', 'uniform C', 'uniform D']} caption="Three equal events, effective count 3" />
  <Bars values={[.5, .5, 0]} labels={['tied B at 1', 'tied C at 1', 'D at 3']} caption="Nearest-tie limit, effective count 2" />
</Drawing><Table caption="Complete width comparison and feasible targets" headers={['σ / row', 'B', 'C', 'D', 'perplexity / status']} rows={[.5, 1, 2].map(s => {
      const r = gaussianRow([1, 2, 3], s);
      return [s, ...r.probabilities.map(v => number(v, 9)), number(r.perplexity, 9)];
    }).concat([['(1,1,3), narrow limit', '.5', '.5', '0', '2: target 1.5 infeasible'], ['all three distances tied', '1/3', '1/3', '1/3', '3 at every positive width']])} /><p>Zero/infinite widths name limits; neither is a finite positive slider value. Each entropy contribution appears in the row investigation.</p></>;
}
export function ConditionalDirections() {
  return <Drawing caption="Constructed complete conditional rows. Their separate denominators precede symmetric division by 2n=8.">
  <ConditionalMerge />
  <Bars values={[.8, .15, .05]} labels={['A→B', 'A→C', 'A→D']} colors={[hues[1], hues[2], hues[3]]} caption="Separate complete row A mass1" />
  <Bars values={[.6, .3, .1]} labels={['B→A', 'B→C', 'B→D']} colors={[hues[0], hues[2], hues[3]]} caption="Separate complete row B mass1" />
</Drawing>;
}
export function JointProbabilities() {
  return <><Drawing caption="Actual saved four-point conditional rows, their transpose and complete ordered joint mass.">
  <Matrix values={conditional} labels={['A', 'B', 'C', 'D']} caption="Conditional p(j|i): every row sums 1" />
  <Matrix values={conditional[0].map((_, j) => conditional.map(row => row[j]))} labels={['A', 'B', 'C', 'D']} caption="Opposite rows: transpose" />
  <Matrix values={fixedP} labels={['A', 'B', 'C', 'D']} caption="P=(conditional+transpose)/8; ordered total 1" />
</Drawing><p>Actual AB: (.6558872697854092 + .6041177401751883)/8 = .1575006262450747. BA is a separate equal cell. Self cells stay zero.</p></>;
}
function CrowdingLength({
  x,
  y,
  from,
  to,
  label,
  color = hues[0],
  offset = 18,
  route
}) {
  const a = [x(from[0]), y(from[1])],
    b = [x(to[0]), y(to[1])];
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const normal = [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
  const p = [a[0] + offset * normal[0], a[1] + offset * normal[1]];
  const q = [b[0] + offset * normal[0], b[1] + offset * normal[1]];
  const midpoint = [(p[0]+q[0])/2,(p[1]+q[1])/2];
  const leader = route === "cube" ? `M${q[0]} ${q[1]} V37 H278` : `M${midpoint[0]} ${midpoint[1]} H315 V37 H278`;
  return <g data-crowding-length={route}>
    <path d={`M${p[0]} ${p[1]} L${q[0]} ${q[1]} M${p[0] - 4 * normal[0]} ${p[1] - 4 * normal[1]} L${p[0] + 4 * normal[0]} ${p[1] + 4 * normal[1]} M${q[0] - 4 * normal[0]} ${q[1] - 4 * normal[1]} L${q[0] + 4 * normal[0]} ${q[1] + 4 * normal[1]}`} stroke={color} fill="none" />
    <path d={leader} stroke={color} fill="none" />
    <text x="278" y="20" textAnchor="middle" fill={color}>{label}</text>
  </g>;
}
export function CrowdingGeometry() {
  const cube = Array.from({
    length: 8
  }, (_, i) => [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1]);
  const corners = cube.map(([x, y, z], i) => ({
    x: x + .35 * z,
    y: y + .3 * z,
    id: `N${i}`
  }));
  const cubeEdges = cube.flatMap((a, i) => cube.flatMap((b, j) => j > i && a.filter((v, k) => v !== b[k]).length === 1 ? [[i + 1, j + 1]] : []));
  return <Drawing caption="Constructed eight neighbors: cube corners all radius√3; the same-radius ring cannot keep the cube's minimum neighbor-neighbor separation2.">
  <Plot points={[{
      x: 0,
      y: 0,
      id: 'A'
    }, ...corners]} edges={cubeEdges} domain={[-2.3, 2.3, -2.3, 2.3]} caption="Orthographic cube; bracket labels are original3D lengths, not projected lengths">
    {({ x, y }) => <>
      <DistanceBracket x={x} y={y} from={[-1.35, -1.3]} to={[.65, -1.3]} label="edge2" color={hues[1]} />
      <CrowdingLength x={x} y={y} from={[0, 0]} to={[1.35, 1.3]} label="radius√3" color={hues[2]} offset={-18} route="cube" />
    </>}
  </Plot>
  <Plot points={[{
      x: 0,
      y: 0,
      id: 'A'
    }, ...cube.map((_, i) => ({
      x: Math.sqrt(3) * Math.cos(i * Math.PI / 4),
      y: Math.sqrt(3) * Math.sin(i * Math.PI / 4),
      id: `N${i}`
    }))]} edges={cube.map((_, i) => [i + 1, (i + 1) % 8 + 1])} circle={[0, 0, Math.sqrt(3)]} domain={[-2.3, 2.3, -2.3, 2.3]} caption="Planar ring radius√3; adjacent length2√3 sin(π/8)=1.325654…">
    {({ x, y }) => <>
      <DistanceBracket x={x} y={y} from={[0, 0]} to={[-Math.sqrt(3), 0]} label="radius√3" color={hues[2]} />
      <CrowdingLength x={x} y={y} from={[Math.sqrt(3), 0]} to={[Math.sqrt(1.5), Math.sqrt(1.5)]} label="1.325654…" color={hues[1]} route="ring" />
    </>}
  </Plot>
  <Plot points={[{
      x: 0,
      y: 0,
      id: 'A',
      color: hues[0]
    }, {
      x: 1,
      y: 0,
      id: 'A₂',
      color: hues[5]
    }, {
      x: .5,
      y: 1,
      id: 'N0',
      color: hues[1]
    }, {
      x: .5,
      y: -1,
      id: 'N1',
      color: hues[2]
    }, {
      x: -1,
      y: .6,
      id: 'N2',
      color: hues[3]
    }, {
      x: 2,
      y: .6,
      id: 'N3',
      color: hues[4]
    }]} edges={[[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 5]]} caption="Separate constructed adjacent neighborhoods: shared N0/N1 constrain both centers" />
  <Table caption="Requested versus available lengths and shared identity" headers={['relationship', 'cube', 'ring / adjacent case']} rows={cube.map((_, i) => [`A–N${i}`, '√3', '√3']).concat([['nearest neighbor pair', '2', '2√3 sin(π/8)<2'], ['shared adjacent neighbors', 'N0/N1 remain the same IDs', 'one placement must serve both centers; not independent rings']])} />
  <p>The corner/ring construction illustrates competing local separations. The adjacent graph exposes shared constraints; it is not an empirical shell-volume or density theorem.</p>
</Drawing>;
}
export function HeavyTailRuler() {
  return <Drawing caption="These scalar kernels are unnormalized similarities, not probability densities.">
  <Line values={[0, 1, 3]} labels={['A', 'B(r1)', 'C(r3)']} caption="Pair separation ruler" />
  <Curve curves={[{
      label: 'Gaussian exp(−r²/2)',
      fn: r => Math.exp(-r * r / 2)
    }, {
      label: 'Student 1/(1+r²)',
      fn: r => 1 / (1 + r * r)
    }]} caption="Same 0–1 vertical scale, distance r horizontally" marks={[[3, .1], [3, Math.exp(-4.5)]]} />
  <Table caption="r=3 exact comparison" headers={['kernel', 'value']} rows={[['Gaussian', '.011108997'], ['Student', '.1']]} />
</Drawing>;
}
export function GlobalNormalization() {
  return <><NormalizationView coordinate={3} /><NormalizationView coordinate={2} /></>;
}
export function ForceAnatomy() {
  const s = studentState(initialY),
    multiplier = 20;
  return <><Drawing caption="Negative-gradient arrows at A use multiplier 20 coordinate units per force unit; signs and all contributions share that scale.">
  <Plot points={initialY.map((x, i) => ({
        x,
        y: -1.1,
        id: ['A', 'B', 'C', 'D'][i]
      }))} arrows={s.contributions[0].slice(1).map((v, i) => [-1.5, 1 - .5 * i, -1.5 + multiplier * v, 1 - .5 * i, hues[i + 1]]).concat([[-1.5, -.5, -1.5 + multiplier * s.displacement[0], -.5, hues[0]]])} caption="Bottom row: actual x coordinates. Separate signed annotation lanes: AB blue, AC pink, AD violet, net amber; multiplier20" domain={[-2, 3, -1.5, 1.5]}>
    {({ x, y }) => <>{s.contributions[0].slice(1).map((v, i) => <text key={i} x={x(-1.5 + multiplier * v / 2)} y={y(1 - .5 * i) - 12} textAnchor="middle" fill={hues[i + 1]}>{['AB', 'AC', 'AD'][i]} {number(v, 9)}</text>)}<text x={x(-1.5 + multiplier * s.displacement[0] / 2)} y={y(-.5) - 12} textAnchor="middle" fill={hues[0]}>A net {number(s.displacement[0], 9)}</text></>}
  </Plot>
  <Line values={tsneStep(initialY, .5, 4).y} compared={initialY} labels={['A', 'B', 'C', 'D']} caption="All old-state displacements, rate .5, then recenter" bound={4} />
</Drawing><ForceView /></>;
}
export function OversizedStep() {
  const failed = tsneStep(initialY, 100, 4);
  return <><Drawing caption="Constructed one-step failure remains finite and visible. Ordered attractive coefficient mass is 12 under exaggeration; Q retains mass 1.">
  <Bars values={[12, 1]} max={12} labels={['αP, α12', 'unchanged Q']} caption="Attraction/repulsion mass, not renormalized probabilities" />
  <Line values={failed.y} compared={initialY} labels={['A', 'B', 'C', 'D']} bound={failed.bound} caption="Rate100 expands editor/ruler to ±13" />
</Drawing><Table caption="Finite failed step from the exact same initial P/Y" headers={['state', 'KL', 'bound']} rows={[['initial', number(studentState(initialY).cost, 9), 4], ['one step rate100', number(studentState(failed.y).cost, 9), 13]]} /></>;
}
const scalars = [0, .7, 1.9, 4.2, 8.6, 11.3];
export function NeighborArray() {
  const rows = scalars.map((x, i) => scalars.map((y, j) => [Math.abs(x - y), j]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, 4));
  return <Drawing caption="Graph k4 includes self. Audit k excludes self; absent −1/∞ is never a vertex.">
  <Line values={scalars} labels={scalars.map((_, i) => `ID${i}`)} caption="Six measured scalar observations" />
  <Table caption="Complete self-first four-column nearest array" headers={['source', 'neighbor IDs', 'distances']} rows={rows.map((r, i) => [i, r.map(a => a[1]).join(', '), r.map(a => number(a[0])).join(', ')])} />
  <Plot points={scalars.map((x, i) => ({
      x,
      y: 0,
      id: i
    }))} edges={[[0, 1], [0, 2], [0, 3]]} caption="Source0 nonself support; three edges" />
</Drawing>;
}
export function LocalCalibration() {
  return <Drawing caption="Separate constructed calibration row; not the retained six-point first row.">
  <Line values={[0, 1, 1 + Math.log(2), 1 + Math.log(2)]} labels={['self0', 'B', 'C', 'D']} caption="Distance ruler: rho1" />
  <Line values={[0, 0, Math.log(2), Math.log(2)]} labels={['self excluded', 'B', 'C', 'D']} caption="Excess d−rho, clipped at0" />
  <Bars values={[1, .5, .5]} labels={['B', 'C', 'D']} caption="Sigma1 memberships; total2=log₂4" />
  <Table caption="Distinct retained first-row example" headers={['rho', 'sigma', 'memberships']} rows={[['.7', '3.0883…', '1, .678…, .322… (saved stream)']]} />
</Drawing>;
}
export function CalibrationBoundaries() {
  return <Drawing caption="Distinct IDs can have distance zero. Clamping, absent support, search stop and sigma floor have separate roles.">
  <Bars values={[1, Math.exp(-1), Math.exp(-2)]} labels={['row[0,1,2,3]: d1', 'd2', 'd3']} caption="Illustrated sigma1/rho1 membership" />
  <Bars values={[1, 1, Math.exp(-1)]} labels={['duplicate nonself d0', 'd1', 'd2']} caption="[0,0,1,2]: pinned lower mass2, unattained finite limit" />
  <Bars values={[1, Math.exp(-1), 0]} labels={['d1', 'd2', 'ID−1 absent']} caption="[0,1,2,∞]: upper mass2 only as sigma→∞" />
  <Table caption="Exact retained search/floor policy" headers={['operation', 'rule']} rows={[['search', '64 bounded iterations; target log₂4=2'], ['rho>0 floor', '.001 × finite-row mean distance'], ['rho=0 floor', '.001 × global finite mean'], ['returned sigma', 'max(search result, floor)'], ['absent support', 'ID −1 and distance∞: no edge']]} />
</Drawing>;
}
export function ReciprocalUnion() {
  return <><UnionView /><Table caption="Same distance2, distinct row scales" headers={['row', 'rho', 'sigma', 'strength']} rows={[['i→j', 1, '1/ln2', '.5'], ['j→i', 1, '1/ln4', '.25'], ['remove i→j', 'unchanged geometry', 'support absent', 'union stays .25']]} /></>;
}
export function MembershipCurve() {
  return <Drawing caption="The ordinary target plateau guides a least-squares curve fit. It is not a hard minimum distance. No fitted a/b overlay is claimed.">
  <Line values={[0, 1]} labels={['i', 'j']} caption="One map pair r1" />
  <Curve curves={[{
      label: 'Teaching ν=1/(1+r²), a=b1',
      fn: r => 1 / (1 + r * r)
    }, {
      label: 'Target g: min_dist .1, spread1',
      fn: r => r <= .1 ? 1 : Math.exp(-(r - .1))
    }]} caption="Membership versus map separation r" />
</Drawing>;
}
export function IdealPairTerms() {
  return <><PairView radius={1} /><PairView radius={2} /></>;
}
export function SampledEvents() {
  const before = [[-1, .2], [-.4, -.3], [.2, .1], [.9, -.2], [1.5, .4], [2.1, -.1]];
  const event = sampledEvent(before, 0, 1, [4, 5], .01);
  const phases = [{
    operation: 'supplied initial state',
    y: before
  }, ...event.snapshots];
  return <Drawing caption="The actual six supplied coordinates follow a positive event and then negative IDs4/5 in order.">
  {phases.map((phase, index) => {
      const old = index ? phases[index - 1].y : phase.y;
      return <div key={phase.operation}>
    <Plot points={phase.y.map(([x, y], i) => ({
          x,
          y,
          id: i,
          selected: i === 0
        }))} edges={index === 0 ? [[0, 1], [0, 4, 0, 'new'], [0, 5, 0, 'new']] : []} arrows={phase.y.flatMap(([x, y], i) => x !== old[i][0] || y !== old[i][1] ? [[old[i][0], old[i][1], x, y, hues[i]]] : [])} domain={[-1.5, 2.5, -1, 1]} caption={phase.operation} />
    <Table caption={`${phase.operation}: complete current endpoints`} headers={['ID', 'x', 'y', 'moved in this operation']} rows={phase.y.map((row, i) => [i, number(row[0], 9), number(row[1], 9), row.some((v, j) => v !== old[i][j]) ? 'yes' : 'no'])} />
  </div>;
    })}
  <p>Positive attraction moves both0 and1. Negative4 then5 moves only head0. Arrows are actual unscaled displacements and can be small; the nine-decimal endpoint tables expose them. The retained rounded final head is(−.994246,.193755).</p>
  <Line values={[0, 1, 3]} labels={['A head', 'B positive', 'C noise']} caption="Separate exact three-point expected-event experiment" />
  <Bars values={[.25, .25, .5]} labels={['noise A:skip self', 'noise B', 'noise C']} caption="One independent noise event per elementary slot" />
  <Table caption="Complete declared finite expectation and implementation boundaries" headers={['quantity', 'value / convention']} rows={[['positive frequency', '.25; both endpoints'], ['positive expected head', '.025'], ['incorrect extra .25 factor', '.00625'], ['negative expected head', '−.02830798798'], ['complete expected vector', '[−.00330798798,−.025,0]'], ['negative rule', 'head only; stabilizer .001; clip per coordinate±4; skip self; coincident vector0'], ['rate0', 'exact no displacement'], ['ordinary schedule', 'conditional timing differs from this independent-noise experiment']]} />
</Drawing>;
}
export function DensityRadius() {
  return <Drawing caption="Membership-weighted local scale, not calibrated probability density. The densMAP call is source-only.">
  <Line values={[0, 1, 3]} labels={['query', 'B w1', 'C w.5']} colors={hues.slice(0, 3)} caption="Input neighborhood distances" />
  <Bars values={[1, 4.5]} labels={['B: 1·1²', 'C: .5·3²']} colors={[hues[1], hues[2]]} max={5.5} caption="Weighted squared-distance products; same B/C identities" />
  <Table caption="Local radius arithmetic and API branches" headers={['object', 'value / meaning']} rows={[['sum weight', '1.5'], ['radius²', '5.5/1.5=11/3'], ['log radius²', 'ln(1e−8+11/3)'], ['double distances', 'radius²44/3; log change1.386294359'], ['cached training', 'returns fitted training coordinates'], ['new-row densMAP transform', 'refused by inspected implementation'], ['density optimizer', 'complete source-only call; no fitted density plot']]} />
</Drawing>;
}
export function OrderedDerivative() {
  const state = studentState(initialY);
  return <Drawing caption="Both AB and BA differentiate with respect to endpoint A. Every off-diagonal pair feeds the common Z.">
  <OrderedDependency />
  <Matrix values={state.kernel} labels={['A', 'B', 'C', 'D']} caption={`Complete kernels feed Z=${number(state.z)}`} />
  <Table caption="Derivative ownership and fixed input" headers={['dependency', 'contribution']} rows={[['P fixed', 'constant ΣP logP; ordered P total1'], ['−ΣP log t', 'attraction 4ΣPtΔ'], ['log Z', 'repulsion −4ΣQtΔ'], ['factor4', 'factor2 from squared separation × two ordered orientations'], ['translation', `total negative-gradient ${number(state.displacement.reduce((a, b) => a + b, 0), 12)}`], ['finite difference', 'perturb one coordinate; use the same fixed P in both costs']]} />
</Drawing>;
}
export function RetainedTrajectory() {
  return <Drawing caption="Only the retained beginning and end are plotted: no invented intermediate trajectory.">
  <Line values={[-1.775811, -.759392, .422370, 2.112833]} compared={initialY} labels={['A', 'B', 'C', 'D']} caption="Retained200 updates, rate.5, recentered" bound={3} />
  <Table caption="Original tiny source/stream scope" headers={['state', 'KL']} rows={[['initial', '.053522'], ['after200 updates', '.018227'], ['solver', 'original bounded80-search-step source; not replaced by corrected Gaussian solver'], ['cost model', 'tiny n×n×q offset tensor; no large-scale fit claim']]} />
</Drawing>;
}
export function ContrastiveNormalization() {
  return <Drawing caption="Normalized candidate scoring and binary noise discrimination use separately declared denominators.">
  <Line values={[0, 1, 3]} labels={['A query', 'B positive', 'C candidate']} caption="Student scores B.5 and C.1" />
  <Bars values={[5 / 6, 1 / 6]} labels={['B normalized score', 'C normalized score']} caption="Two-candidate denominator .6" />
  <Bars values={[0, 5 / 6, 1 / 6]} labels={['positive law A', 'B', 'C']} caption="Declared positive distribution" />
  <Bars values={[.25, .25, .5]} labels={['noise A', 'B', 'C']} caption="Declared independent noise law" />
  <Table caption="Two exact experiments" headers={['experiment', 'posterior / loss']} rows={[['candidate normalized B', '5/6; ln(6/5)=.182322…'], ['binary positive vs noise, equal priors', '(5/6)/(5/6+.25)=10/13; ln(13/10)=.262364…'], ['edge event frequency', '.25 belongs to a separate schedule'], ['scope', 'neither number asserted to be ordinary UMAP trainer loss']]} />
</Drawing>;
}
export const affinityFigures = {
  D10: GaussianSelection,
  D11: EffectiveNeighborhood,
  D12: ConditionalDirections,
  D13: JointProbabilities,
  D14: CrowdingGeometry,
  D15: HeavyTailRuler,
  D16: GlobalNormalization,
  D17: ForceAnatomy,
  D18: OversizedStep,
  D19: NeighborArray,
  D20: LocalCalibration,
  D21: CalibrationBoundaries,
  D22: ReciprocalUnion,
  D23: MembershipCurve,
  D24: IdealPairTerms,
  D25: SampledEvents,
  D26: DensityRadius,
  D43: OrderedDerivative,
  D44: RetainedTrajectory,
  D45: ContrastiveNormalization
};

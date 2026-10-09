import { Figure, Geometry, Dot, Law, LawPair, Plan, Matrix, Ledger, Values, Plot, sourceColours, targetColours, fmt, sum } from './TransportDrawingPrimitives.jsx';
import { IntrinsicTriangles } from './TransportLiveInvestigations.jsx';
import { intrinsicCoupling } from '../../data/transport-extension-models.js';
const F = ({
  n,
  label,
  children
}) => <Figure id={'OT' + n} label={label}>{children}</Figure>;
const curve = (fn, a, b, N = 60) => Array.from({
  length: N + 1
}, (_, i) => {
  const x = a + (b - a) * i / N;
  return [x, fn(x)];
});
export function UnequalCounts() {
  const m = 4 * Math.exp(-.25);
  return <F n={51} label="Unequal counts cannot obey both exact marginal totals"><Geometry label="Count disk areas compare source 2, transported mass and target 8" height={145}>{[[2, 45, sourceColours[0], 'source'], [m, 150, sourceColours[1], 'moved'], [8, 255, targetColours[0], 'target']].map(([mass, x, colour, label]) => <g key={label}><Dot x={x} y={58} mass={mass} colour={colour} scale={12} target={label === 'target'} /><text x={x} y="110" textAnchor="middle">{label}</text><text x={x} y="133" textAnchor="middle">{fmt(mass, 4)}</text></g>)}</Geometry><div className="ot-count-bars"><p>Common count scale: 0 to 8. Filled portions carry their declared amount; outlines mark the unmatched portion.</p><p>Source 2 + growth {fmt(m - 2)} = transported {fmt(m)}</p><div className="ot-count-track"><i style={{
          width: 2 / 8 * 100 + '%',
          background: sourceColours[0]
        }} /><i style={{
          width: (m - 2) / 8 * 100 + '%',
          background: sourceColours[1]
        }} /></div><p>Transported {fmt(m)} + target shortfall {fmt(8 - m)} = target 8</p><div className="ot-count-track"><i style={{
          width: m / 8 * 100 + '%',
          background: sourceColours[1]
        }} /><i style={{
          width: (8 - m) / 8 * 100 + '%',
          border: '2px solid ' + targetColours[0]
        }} /></div></div><Values items={[[`Balanced requirement`, 'total 2 = total 8 is impossible'], ['Soft scalar optimum m', m], ['Source growth m − 2', m - 2], ['Target shortfall 8 − m', 8 - m], ['Declared no-entropy objective', m + 2 * (m * Math.log(m / 2) - m + 2) + 2 * (m * Math.log(m / 8) - m + 8)]]} /><p className="ot-note">These are counts, not probabilities. Normalizing both totals to 1 would answer a different question.</p></F>;
}
export function SoftScalarStationarity() {
  const oldM = 4 * Math.exp(-.25),
    newM = Math.exp((2 * Math.log(4) - 2) / 5);
  return <F n={52} label="A stationary point changes when transport entropy is added"><Plot domain={[.2, 5]} xTicks={[.2, 1, 2, 3, 4, 5]} yTicks={[-10, -5, 0, 5]} range={[-12, 8]} xLabel="transported mass m" yLabel="Objective derivative" curves={[{
      label: 'a=2,b=8,c=1,τ=2; no entropy',
      points: curve(m => 1 + 2 * Math.log(m / 2) + 2 * Math.log(m / 8), .2, 5),
      colour: sourceColours[0]
    }, {
      label: 'a=1,b=4,c=2,τ=2,ε=1',
      points: curve(m => 2 + Math.log(m) + 2 * Math.log(m) + 2 * Math.log(m / 4), .2, 5),
      colour: sourceColours[1]
    }]} points={[{
      x: oldM,
      y: 0
    }, {
      x: newM,
      y: 0
    }]} /><Values items={[[`First stationary mass`, oldM], ['Second stationary mass', newM], ['Second curvature', '(ε + 2τ) / m = 5/m > 0']]} /></F>;
}
export function SoftScaling() {
  const P = [[.350501447, .002431605], [.165039602, .461910897]];
  return <F n={53} label="Fractional-power scaling changes rather than exactly matches the marginals"><Plan plan={P} a={[.2, .8]} b={[.7, .3]} max={.8} /><div className="ot-operation"><span>θ = τ/(τ + ε) = 2/2.5 = .8</span><span>u = (a/(Kv))^.8</span><span>v = (b/(Kᵀu))^.8</span></div><Values items={[[`Transported total (rounded cells)`, sum(P.flat())], ['Source reference total', 1], ['Target reference total', 1]]} /><p className="ot-note">Displayed cells are the recorded rounded result. Exact reference weights and actual resulting margins remain distinct.</p></F>;
}
export function SoftObjective() {
  const terms = [['linear', .332510808], ['transport entropy', -1.008042429], ['row penalty', .135506309], ['column penalty', .130549333]];
  return <F n={54} label="All four terms of the soft-marginal objective"><Plot domain={[-1.1, .4]} xTicks={[-1, -.5, 0, .4]} yTicks={[0, 1, 2, 3]} range={[-.5, 3.5]} xLabel="objective contribution" yLabel="Terms (0 linear; 1 entropy; 2 rows; 3 columns)" curves={terms.map(([label, v], i) => ({
      label,
      points: [[0, i], [v, i]],
      colour: [sourceColours[0], sourceColours[1], targetColours[0], targetColours[1]][i]
    }))} /><Ledger label="Recorded full-precision calculation, displayed to nine decimals" headers={['term', 'value']} rows={terms} /><Values items={[[`Recorded total`, -.409475979], ['Recorded stationarity residual', 6.724e-13], ['Stationarity equation', 'Cij + ε log Pij + τ log(ri/ai) + τ log(sj/bj) = 0']]} /><p className="ot-note">The residual is from the full-precision executed plan, not a recomputation from the nine-decimal cells above.</p></F>;
}
export function BarycentreVersusMixture() {
  return <F n={55} label="The midpoint law moves ranks; the mixture retains component locations"><LawPair x={[0, 2]} y={[2, 4]} a={[.5, .5]} b={[.5, .5]} domain={[0, 4]} /><div className="ot-pair"><Law locations={[1, 3]} weights={[.5, .5]} domain={[0, 4]} label="W2 midpoint; objective 1" names={['G0', 'G1']} colours={[sourceColours[1], sourceColours[1]]} /><Law locations={[0, 2, 4]} weights={[.25, .5, .25]} domain={[0, 4]} label="Mixture; objective 2" names={['M0', 'M1', 'M2']} colours={[sourceColours[2], sourceColours[2], sourceColours[2]]} /></div></F>;
}
export function QuantileSquare() {
  return <F n={57} label="Completing the square gives the optimal location at each rank"><Plot domain={[-1, 3]} range={[0, 5]} xLabel="candidate location z" yLabel="One-rank squared objective" curves={[{
      label: '½(z−0)² + ½(z−2)²',
      points: curve(z => .5 * z * z + .5 * (z - 2) ** 2, -1, 3),
      colour: sourceColours[1]
    }, {
      label: '(z−1)² + 1 (same curve)',
      points: curve(z => (z - 1) ** 2 + 1, -1, 3),
      colour: sourceColours[0],
      dashed: true
    }]} points={[{
      x: 1,
      y: 1
    }]} /><Ledger label="A Gaussian midpoint preserves quantile ranks" headers={['law', 'mean', 'SD or variance']} rows={[[`N(0,1)`, 0, 'SD 1'], ['N(4,9)', 4, 'SD 3'], ['W2 midpoint', 2, 'SD 2 → variance 4'], ['equal mixture', 2, 'variance 9']]} /><p className="ot-note">A convex combination of nondecreasing quantiles stays nondecreasing. W1 uses weighted medians instead of this squared-error mean.</p></F>;
}
export function SharedBarycentreMarginal() {
  return <F n={58} label="Two couplings share one unknown source law on the grid"><Law locations={[0, 1, 2, 3, 4]} weights={[0, .5, 0, .5, 0]} domain={[0, 4]} label="Common midpoint q on the prescribed grid" names={[0, 1, 2, 3, 4].map(i => `Q${i}`)} colours={[sourceColours[1]]} /><div className="ot-pair"><Matrix values={[[0, 0], [.5, 0], [0, 0], [0, .5], [0, 0]]} label="P0: grid q to input at 0,2" rowLabels={[0, 1, 2, 3, 4].map(i => `Q${i}`)} rowColours={[sourceColours[1]]} colLabels={['● A0', '● A1']} colColours={sourceColours} max={.5} requiredRows={[0, .5, 0, .5, 0]} requiredCols={[.5, .5]} /><Matrix values={[[0, 0], [.5, 0], [0, 0], [0, .5], [0, 0]]} label="P1: grid q to input at 2,4" rowLabels={[0, 1, 2, 3, 4].map(i => `Q${i}`)} rowColours={[sourceColours[1]]} colLabels={['◇ B0', '◇ B1']} colColours={targetColours} max={.5} requiredRows={[0, .5, 0, .5, 0]} requiredCols={[.5, .5]} /></div><p className="ot-key">Both row projections are the same q. Their column labels refer to different declared input locations.</p></F>;
}
export function EntropicBarycentre() {
  const q = [.053239439, .393521127, .106478867, .393521127, .053239439];
  return <F n={59} label="A shared geometric-mean correction produces the entropic grid law"><p className="ot-object-label">One separate two-bin update, worked exactly</p><p>Use two identical positive kernels K₀ = K₁ = ((1, ½), (½, 1)), with v₀=(2, 1), v₁=(1, 2), and equal barycentre weights. This small teaching example is separate from the recorded five-bin solve below.</p><div className="ot-pair"><Matrix values={[[1,.5],[.5,1]]} kind="kernel" max={1} label="K₀ = K₁" rowLabels={['Q0','Q1']} colLabels={['bin 0','bin 1']} rowColours={[sourceColours[1]]} colColours={['#aaa']} showTotals={false}/><Geometry label="Two incoming marginals meet at a pointwise geometric mean" height={225}><path d="M55 60L150 128L245 60M150 128V195" stroke="#aaa" fill="none"/><circle cx="55" cy="60" r="7" fill={sourceColours[0]}/><rect x="239" y="54" width="12" height="12" transform="rotate(45 245 60)" fill={targetColours[0]}/><circle cx="150" cy="128" r="8" fill={sourceColours[1]}/><text x="55" y="28" textAnchor="middle">s₀=K₀v₀</text><text x="245" y="28" textAnchor="middle">s₁=K₁v₁</text><text x="55" y="90" textAnchor="middle">(2.5, 2)</text><text x="245" y="90" textAnchor="middle">(2, 2.5)</text><text x="150" y="163" textAnchor="middle">(√5, √5) ÷ 2√5</text><text x="150" y="220" textAnchor="middle">shared q=(½, ½)</text></Geometry></div><Ledger label="Pointwise geometric mean and shared row correction" headers={['bin','s₀','s₁','√(s₀s₁)','normalized q','u₀=q/s₀','u₁=q/s₁']} rows={[[0,2.5,2,Math.sqrt(5),.5,.2,.25],[1,2,2.5,Math.sqrt(5),.5,.25,.2]]}/><div className="ot-pair"><Matrix values={[[.4,.1],[.25,.25]]} max={.5} label="diag(u₀) K₀ diag(v₀)" colLabels={['bin 0','bin 1']} colColours={['#aaa']} rowLabels={['Q0','Q1']} rowColours={[sourceColours[1]]} requiredRows={[.5,.5]}/><Matrix values={[[.25,.25],[.1,.4]]} max={.5} label="diag(u₁) K₁ diag(v₁)" colLabels={['bin 0','bin 1']} colColours={['#aaa']} rowLabels={['Q0','Q1']} rowColours={[sourceColours[1]]} requiredRows={[.5,.5]}/></div><p className="ot-note">Both corrected row sums equal q. A complete barycentre algorithm also updates columns against its prescribed input laws; this displays one shared-row update, not convergence.</p><Law locations={[0, 1, 2, 3, 4]} weights={q} domain={[0, 4]} label="Recorded ε = .5 grid barycentre" names={[0, 1, 2, 3, 4].map(i => `Q${i}`)} colours={q.map(() => sourceColours[1])} /><div className="ot-operation"><span>s0 = K0v0; s1 = K1v1</span><b>→</b><span>log q = ½ log s0 + ½ log s1 + normalization</span><b>→</b><span>u0 = q/s0; u1 = q/s1</span></div><Ledger label="Every returned grid probability" headers={['location', 'q']} rows={q.map((v, i) => [i, v])} /><Values items={[[`Recorded total`, 1], ['Last internal error', 8.729e-13], ['Coupling residuals', '2.445 × 10⁻¹³; 2.444 × 10⁻¹³'], ['Internal zero-bin floor', '10⁻¹⁶, then renormalization']]} /><p className="ot-note">The complete code output below retains both 5×5 couplings. Printed zeros do not establish exact zero support.</p></F>;
}
function Plane({
  sets,
  label
}) {
  const X = v => 150 + 80 * v,
    Y = v => 135 - 80 * v;
  return <div><p className="ot-object-label">{label}</p><Geometry label={label + '; equal coordinate scales'} height={265}><path d="M40 135H260M150 25V245" stroke="#777" />{[-1, 0, 1].map(v => <g key={v}><text x={X(v)} y="157" textAnchor="middle">{v}</text><text x="130" y={Y(v) + 4} textAnchor="end">{v}</text></g>)}{sets.map((s, k) => s.points.map((p, i) => <g key={k + '-' + i}><Dot x={X(p[0])} y={Y(p[1])} mass={.5} colour={s.name === 'A' ? sourceColours[i] : s.name === 'B' ? targetColours[i] : s.colour} target={s.target} /><text x={X(p[0]) + 14} y={Y(p[1]) + (p[1] < 0 ? 28 : -20)}>{s.name}{i}</text></g>))}</Geometry></div>;
}
function MidpointPairing({swap=false}) {
  const A=[[-1,0],[1,0]],B=[[0,-1],[0,1]],X=v=>150+80*v,Y=v=>135-80*v;
  return <div><p className="ot-object-label">{swap?'Dashed alternative: A0→B1, A1→B0':'Solid alternative: A0→B0, A1→B1'}</p><Geometry label="Each midpoint bisects its source-to-target segment on equal coordinate scales" height={275}><path d="M40 135H260M150 25V245" stroke="#666"/>{A.map((a,i)=>{const j=swap?1-i:i,b=B[j],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];return <g key={i}><line x1={X(a[0])} y1={Y(a[1])} x2={X(b[0])} y2={Y(b[1])} stroke={sourceColours[i]} strokeWidth="2" strokeDasharray={swap?'5 4':undefined}/><Dot x={X(a[0])} y={Y(a[1])} mass={.5} colour={sourceColours[i]}/><Dot x={X(b[0])} y={Y(b[1])} mass={.5} target colour={targetColours[j]}/><Dot x={X(m[0])} y={Y(m[1])} mass={.5} colour={sourceColours[i]} scale={20}/><text x={X(a[0])+(i?20:-20)} y="165" textAnchor="middle">A{i}</text><text x={X(b[0])+27} y={Y(b[1])+5}>B{j}</text><text x={X(m[0])+(i?22:-22)} y={Y(m[1])+(m[1]>0?-20:28)} textAnchor="middle">M{i}</text></g>})}</Geometry><p className="ot-key">{swap?'M0=(−½, ½), M1=(½, −½)':'M0=(−½, −½), M1=(½, ½)'}. Each midpoint has mass ½ on the same area scale as its endpoints. Midpoint circles retain their source hue; target diamonds retain B identities. All four input atoms have coordinates ±1 or 0.</p></div>;
}
export function NonuniqueBarycentres() {
  return <F n={60} label="Two different midpoint laws attain the same optimal objective"><div className="ot-pair"><MidpointPairing/><MidpointPairing swap/></div><p>Every A→B squared distance is 2. Either pairing sends half the mass along each of two routes, so W₂²(A,B)=2. Bisecting either route makes its squared length ½; the two distinct midpoint laws therefore each have cost ½ to either input.</p><Values items={[[`Each candidate’s cost to either input`, .5], ['Optimal lower bound W2²(A,B)/4', .5], ['Uniqueness theorem condition', 'positive weight on an absolutely continuous input (Euclidean W2 assumptions)']]} /></F>;
}
export function IntrinsicObjects() {
  const s = intrinsicCoupling();
  return <F n={61} label="Separate coordinate frames have identical internal geometry"><IntrinsicTriangles /><div className="ot-pair"><Matrix values={s.D} kind="distance" label="Source distance matrix D" rowLabels={[0, 1, 2].map(i => `● A${i}`)} colLabels={[0, 1, 2].map(i => `● A${i}`)} rowColours={sourceColours} colColours={sourceColours} /><Matrix values={s.E} kind="distance" label="Target distance matrix E" rowLabels={[0, 1, 2].map(i => `◇ B${i}`)} colLabels={[0, 1, 2].map(i => `◇ B${i}`)} rowColours={[sourceColours[2], sourceColours[0], sourceColours[1]]} colColours={[sourceColours[2], sourceColours[0], sourceColours[1]]} /></div><Values items={[[`Correspondence`, 'A0 ↔ B1; A1 ↔ B2; A2 ↔ B0'], ['Internal edge lengths', '1, 2, √5']]} /></F>;
}
export function FourIndexLoss() {
  const s = intrinsicCoupling();
  return <F n={62} label="Two matched pairs determine one squared distance discrepancy"><Geometry label="Compare source edge A0–A1 with matched target edge B1–B2" height={180}><path d="M55 45H245M55 135H245M55 45V135M245 45V135" stroke="#888" fill="none" /><Dot x={55} y={45} mass={1 / 3} colour={sourceColours[0]} /><Dot x={245} y={45} mass={1 / 3} colour={sourceColours[1]} /><Dot x={55} y={135} mass={1 / 3} colour={sourceColours[0]} target /><Dot x={245} y={135} mass={1 / 3} colour={sourceColours[1]} target /><text x="30" y="24">A0</text><text x="240" y="24">A1</text><text x="30" y="173">B1</text><text x="240" y="173">B2</text><text x="150" y="35" textAnchor="middle">D01 = 1</text><text x="150" y="125" textAnchor="middle">E12 = 1</text></Geometry><div className="ot-operation"><span>Discrepancy (D01 − E12)² = 0</span><b>×</b><span>first pair P01 = ⅓</span><b>×</b><span>second pair P12 = ⅓</span></div><Values items={[[`This term`, 0], ['All 81 terms at the exact witness', s.loss], ['Convention', 'sum all ordered indices; no factor ½']]} /></F>;
}
export function IntrinsicOptimization() {
  const P = intrinsicCoupling().plan;
  return <F n={64} label="Local intrinsic optimization depends on a current coupling"><div className="ot-operation"><span>Current P → contract one P in G(P)</span><b>→</b><span>Cost-like gradient → local transport subproblem</span><b>→</b><span>Updated feasible P → next local step</span></div><div className="ot-pair"><Matrix values={P} colColours={[sourceColours[2], sourceColours[0], sourceColours[1]]} max={1 / 3} label="Recorded final plan: product initialization" /><Matrix values={P} colColours={[sourceColours[2], sourceColours[0], sourceColours[1]]} max={1 / 3} label="Recorded final plan: near-witness initialization" /></div><Ledger label="Actual final printed diagnostics, ε = .05" headers={['initialization', 'recomputed G', 'logged G', 'marginal residual', 'last update']} rows={[[`product`, 0, 0, 0, 0], ['.9 witness + .1 product', 0, 0, 0, 0]]} /><p className="ot-note">Both are displayed final results, not a fabricated optimization trajectory. The recorded run also includes an inner Sinkhorn non-convergence warning; these final diagnostics do not erase it.</p><Values items={[[`Ordinary squared-coordinate OT in the shared frame`, '391/3 ≈ 130.333333333'], ['General GW optimization', 'nonconvex; local convergence is not a global guarantee']]} /></F>;
}
function ProjectionTrace({direction}) {
  const X=v=>150+70*v,Y=v=>150-70*v,A=[[-1,-1],[1,1]],B=[[-1,1],[1,-1]],u=direction==='x'?[1,0]:direction==='y'?[0,1]:[Math.SQRT1_2,Math.SQRT1_2];
  return <div><p className="ot-object-label">{direction==='diagonal'?'Unit diagonal u=(1,1)/√2':`Unit ${direction} direction`}</p><Geometry label={`Project points perpendicularly onto the ${direction} axis`} height={300}><path d="M35 150H265M150 35V265" stroke="#555"/><line x1={X(-1.7*u[0])} y1={Y(-1.7*u[1])} x2={X(1.7*u[0])} y2={Y(1.7*u[1])} stroke="#ddd"/><path d={`M${X(1.7*u[0]-.12*u[0]+.08*u[1])} ${Y(1.7*u[1]-.12*u[1]-.08*u[0])}L${X(1.7*u[0])} ${Y(1.7*u[1])}L${X(1.7*u[0]-.12*u[0]-.08*u[1])} ${Y(1.7*u[1]-.12*u[1]+.08*u[0])}`} stroke="#ddd" fill="none"/>{[A,B].flatMap((set,k)=>set.map((p,i)=>{const z=p[0]*u[0]+p[1]*u[1],foot=[z*u[0],z*u[1]],colour=(k?targetColours:sourceColours)[i];return <g key={`${k}-${i}`}><line x1={X(p[0])} y1={Y(p[1])} x2={X(foot[0])} y2={Y(foot[1])} stroke={colour} strokeDasharray="3 3"/><Dot x={X(p[0])} y={Y(p[1])} mass={.5} colour={colour} target={!!k}/><text x={X(p[0])} y={Y(p[1])+(p[1]>0?-26:32)} textAnchor="middle">{k?'B':'A'}{i}</text><circle cx={X(foot[0])} cy={Y(foot[1])} r={5+i*2+k*2} fill="none" stroke={colour} strokeWidth="2"/></g>}))}<text x="150" y="293" textAnchor="middle">dashed segments: projection traces</text></Geometry></div>;
}
export function ProjectionBlindSpot() {
  return <F n={65} label="Coordinate projections can erase the dependence separating two clouds"><Plane label="Full two-dimensional clouds" sets={[{
      name: 'A',
      points: [[-1, -1], [1, 1]],
      colour: sourceColours[0]
    }, {
      name: 'B',
      points: [[-1, 1], [1, -1]],
      colour: targetColours[0],
      target: true
    }]} /><div className="ot-step-grid">{['x','y','diagonal'].map(direction=><ProjectionTrace key={direction} direction={direction}/>)}</div><p>On the unit diagonal, the coordinate is u·(x,y)=(x+y)/√2. Thus A0 maps to −√2 and A1 to √2, while B0 and B1 both map to 0. Dashed perpendicular segments show the discarded component; outlined projection feet preserve each point’s colour.</p><div className="ot-pair"><LawPair x={[-1, 1]} y={[-1, 1]} a={[.5, .5]} b={[.5, .5]} domain={[-1.5, 1.5]} sourceLabel="x projection of A" targetLabel="x projection of B (the y law is identical)" /><div className="ot-pair"><Law locations={[-Math.SQRT2, Math.SQRT2]} weights={[.5,.5]} domain={[-1.5,1.5]} label="Unit diagonal projection of A" /><Law locations={[0]} weights={[1]} domain={[-1.5,1.5]} label="Unit diagonal projection of B" target names={['B0+B1']} outlineColours={[targetColours[1]]} /></div></div><Values items={[[`Squared x projection cost`, 0], ['Squared y projection cost', 0], ['Squared diagonal cost', 2], ['Full W2²', 4], ['Mean of three chosen squared projections', 2 / 3]]} /></F>;
}
export function EmpiricalSampling() {
  const probs = [1, 4, 6, 4, 1].map(v => v / 16);
  return <F n={66} label="Every empirical Bernoulli law from four observations"><div className="ot-pair"><Plot domain={[0, 4]} range={[0, .5]} xTicks={[0, 1, 2, 3, 4]} xLabel="successes k" yLabel="Probability of k" curves={[{
        label: 'Binomial n=4,p=.5',
        points: probs.map((v, i) => [i, v]),
        colour: sourceColours[0],
        discrete: true,
        stems: true
      }]} /><Plot domain={[0, 4]} range={[0, .5]} xTicks={[0, 1, 2, 3, 4]} xLabel="successes k" yLabel="Empirical W1 error" curves={[{
        label: '|k/4 − .5|',
        points: probs.map((_, i) => [i, Math.abs(i / 4 - .5)]),
        colour: targetColours[0],
        discrete: true,
        stems: true
      }]} /></div><Ledger label="The exhaustive five-case expectation" headers={['k', 'probability', 'empirical mass at 1', 'W1 error', 'weighted error']} rows={probs.map((p, k) => [k, p, k / 4, Math.abs(k / 4 - .5), p * Math.abs(k / 4 - .5)])} /><Values items={[[`Expected empirical W1`, 3 / 16], ['Solver error', 'zero does not remove sample discrepancy']]} /></F>;
}
const sleep = [[1, .7, 1.9], [2, -1.6, .8], [3, -.2, 1.1], [4, -1.2, .1], [5, -.1, -.1], [6, 3.4, 4.4], [7, 3.7, 5.5], [8, .8, 1.6], [9, 0, 4.6], [10, 2, 3.4]];
function SleepMatching({ranked=false}) {
  const first=ranked?[...sleep].sort((a,b)=>a[1]-b[1]||a[0]-b[0]):sleep,
    second=ranked?[...sleep].sort((a,b)=>a[2]-b[2]||a[0]-b[0]):sleep,
    X=h=>50+(h+2)*27.5;
  return <div><p className="ot-object-label">{ranked?'Rank pairing: different IDs may meet':'Observed pairing: the same ID meets'}</p><Geometry label={`${ranked?'Rank':'Observed'} matching of all ten participants; horizontal axis is extra sleep hours`} height={680}><line x1="50" x2="270" y1="34" y2="34" stroke="#aaa"/>{[-2,0,2,4,6].map(h=><text key={h} x={X(h)} y="21" textAnchor="middle">{h}</text>)}{first.map((a,i)=>{const b=second[i],y=76+i*61,selected=a[0]===8;return <g key={a[0]}><text x="20" y={y-17}>● ID{a[0]} → ◇ ID{b[0]}</text><line x1={X(a[1])} x2={X(b[2])} y1={y} y2={y} stroke={sourceColours[0]} strokeWidth="2"/><Dot x={X(a[1])} y={y} mass={1} scale={5} selected={selected}/><Dot x={X(b[2])} y={y} mass={1} scale={5} target colour={targetColours[0]} selected={selected}/></g>})}<text x="150" y="674" textAnchor="middle">extra sleep hours (same scale)</text></Geometry></div>;
}
export function SoftwareAndData() {
  const sortedA=[...sleep].sort((a,b)=>a[1]-b[1]||a[0]-b[0]),sortedB=[...sleep].sort((a,b)=>a[2]-b[2]||a[0]-b[0]);
  return <F n={67} label="Array contracts, objective conventions and all ten observed sleep pairs"><div className="ot-operation"><span>a, b: positive probability arrays; C: n×m costs; ε &gt; 0</span><b>→</b><span>scratch log scaling or POT sinkhorn_log</span><b>→</b><span>P: complete plan; recompute cost, objective, both margins</span></div><div className="ot-pair"><SleepMatching/><SleepMatching ranked/></div><p className="ot-key">Circles are drug 1 observations; diamonds are drug 2. White outlines trace drug 1 ID8: its .8 hours pairs with ID8’s 1.6 observed hours, but with ID10’s 3.4 hours in rank matching. Rows are matching records, not a second measured coordinate.</p><Ledger label="All recorded paired observations (R sleep data)" headers={['ID', 'drug 1 hours', 'drug 2 hours']} rows={sleep} /><Ledger label="Sorted empirical laws used by rank matching" headers={['rank', 'drug 1 ID','sorted drug 1','drug 2 ID', 'sorted drug 2', 'rank displacement']} rows={sortedA.map((a, i) => [i + 1,a[0],a[1],sortedB[i][0],sortedB[i][2],sortedB[i][2]-a[1]])} /><Values items={[[`W1: scratch and SciPy`, 1.58], ['W2²: scratch and POT', 2.758], ['Actual same-ID squared displacement', 3.858]]} /><p className="ot-note">Participant order is categorical, not a spatial distance. Rank matching may pair different people. Equal values use participant ID as a deterministic tie-break; this does not assert a unique optimal coupling. Source, documentation, provenance and licence are included with the complete programme files.</p></F>;
}
export function ModelChoiceObjects() {
  return <F n={68} label="The preserved object determines which transport question is meaningful"><Law locations={[0, 100]} weights={[.99, .01]} domain={[0, 100]} label="Balanced timing: rare mass .01 travels 100 → W1 = 1" /><div className="ot-pair"><Geometry label="Unequal count totals 2 and 8" height={140}><Dot x={85} y={60} mass={2} scale={11} /><Dot x={220} y={60} mass={8} scale={11} target colour={targetColours[0]} /><text x="85" y="114" textAnchor="middle">count 2</text><text x="220" y="114" textAnchor="middle">count 8</text></Geometry><Geometry label="Intrinsic shape retains distances while absolute position changes" height={140}><path d="M35 100L65 100L35 40ZM180 40L240 40L240 70Z" fill="none" stroke={sourceColours[0]} strokeWidth="2" /><text x="75" y="128" textAnchor="middle">shape A</text><text x="220" y="128" textAnchor="middle">shape B</text></Geometry></div><Ledger label="Question and information retained" headers={['visible object', 'appropriate declared question', 'information not supplied']} rows={[[`normalized locations + probabilities`, 'balanced geometric displacement', 'deadline event and tail severity separately'], ['different meaningful counts', 'soft-mass or partial transport with penalties', 'normalization changes count information'], ['within-space distance matrices', 'intrinsic correspondence', 'absolute translation/rotation'], ['a few projections', 'chosen sliced approximation', 'unseen directions/dependence'], ['joint law selected by cost', 'optimal mathematical pairing', 'observed pairing or intervention effect']]} /></F>;
}

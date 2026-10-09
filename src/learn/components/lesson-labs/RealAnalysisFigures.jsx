import { Arrow, Bars, Canvas, Compare, DistanceChain, Dot, Figure, Label, Line, Panel, Plot, Table, WeightedJoin, fmt, samples } from './RealAnalysisDrawings.jsx';
import { bernsteinApproximation, bernsteinWeights, dyadicBracket } from '../../data/real-analysis-models.js';
import './real-analysis-figures.css';

const integers = (n, start = 1) => Array.from({ length: n }, (_, i) => start + i);
const linePoints = (values, start = 1) => values.map((y,i)=>({ x: i + start, y }));
const triangle = (n, h) => [{x:0,y:0},{x:1/n,y:h},{x:2/n,y:0},{x:1,y:0}];
const squareTarget = x => x*x;
const bernsteinValue = (x,n,c) => bernsteinApproximation(n,x,c).approximation;

export function SequenceAnatomyFigure() {
  return <Figure job="A01" title="An index selects a value; a tail selects every later index" caption="The first included error at N=10 is 1/11. The previous error 1/10 lies on the open tolerance boundary. The continuation arrow illustrates the rule; decreasing 1/(n+1) proves the whole-tail bound.">
    <Plot label="One-sided estimates with strict tolerance band and index-ten tail" domain={[1,22]} range={[2.9,3.55]} xLabel="Positive integer index n" yLabel="Value a_n" background={({x,y,top,bottom,right})=><><rect className="ra-band" x={x(10)} y={y(3.1)} width={right-x(10)} height={y(2.9)-y(3.1)} /><line className="ra-stroke rose dashed" x1={x(10)} x2={x(10)} y1={top} y2={bottom} /><line className="ra-stroke blue dashed" x1={x(1)} x2={right} y1={y(3)} y2={y(3)} /></>}>
      {({x,y})=><>{integers(20).map(n=><Dot key={n} x={x(n)} y={y(3+1/(n+1))} tone={n>=10?'blue':'gold'} />)}<Arrow x1={x(20)} y1={y(3+1/21)} x2={x(21.8)} y2={y(3+1/23)} tone="blue" /><Label x={x(10)-8} y={60} anchor="end">N=10</Label></>}
    </Plot>
  </Figure>;
}
export function NegatedTailFigure() {
  return <Figure job="A02" title="Every proposed tail has opposite-sign later witnesses" caption="Here epsilon is 1/2. Any two sufficiently late opposite-parity terms have distance 2; a band of radius less than 1 cannot contain both. Testing only L=−1 and L=1 would not eliminate every possible limit.">
    <Plot label="Alternating signs beyond several proposed tail starts" domain={[1,16]} range={[-1.5,1.5]} xLabel="Index n" yLabel="a_n = (−1)^n" background={({x,y})=><><rect className="ra-band" x={x(1)} y={y(.5)} width={x(16)-x(1)} height={y(-.5)-y(.5)} />{[4,8,12].map(n=><line key={n} className="ra-stroke rose dashed" x1={x(n)} x2={x(n)} y1={y(-1.4)} y2={y(1.4)} />)}</>}>
      {({x,y})=>integers(16).map(n=><Dot key={n} x={x(n)} y={y((-1)**n)} tone={n%2?'gold':'blue'} />)}
    </Plot>
    <Table title="Witnesses after an arbitrary proposed N" headers={['N','Later even index','Later odd index','Distance']} rows={[4,8,12].map(n=>[n,n,n+1,2])} />
  </Figure>;
}
export function RationalMeshFigure() {
  return <Figure job="A04" title="Refine a mesh, then choose an interior integer address" caption="The open interval (1.4,1.5) contains 141/100. The displayed mesh has spacing 1/100; density of all rationals follows by choosing a denominator fine enough for the requested interval.">
    <p>Open endpoints 1.4 and 1.5; every address p denotes p/100.</p>
    <Canvas label="One-hundredth mesh with highlighted rational 141/100" height={190}>
      {({width})=>{const x=i=>16+(width-32)*i/10;return <>
        <line className="ra-axis" x1={16} x2={width-16} y1={55} y2={55} />
        {integers(11,140).map((p,i)=><g key={p}><Dot x={x(i)} y={55} open={i===0||i===10} tone={p===141?'blue':'gold'} /><line className="ra-axis" x1={x(i)} x2={x(i)} y1={62} y2={82+(i%3)*30} /><Label x={x(i)} y={102+(i%3)*30} anchor={i===0?'start':i===10?'end':'middle'}>{p}</Label></g>)}
      </>;}}
    </Canvas>
    <Table title="A narrower interval needs a finer denominator" headers={['Open interval','q','p','Interior p/q']} rows={[[ '(1.4,1.5)',100,141,'141/100'],['(1.400,1.401)',10000,14001,'14001/10000']]} />
  </Figure>;
}
export function SupremumCutFigure() {
  return <Figure job="A05" title="A real boundary separates rational squares below and above 2" caption="The cut is sqrt(2), not a greatest rational whose square is below 2. Finer rational points approach either side. Their exact squared comparisons, rather than a floating square-root value, locate the two classes.">
    <Line label="Rational examples surrounding the square-root-of-two cut" cut={Math.SQRT2} cutLabel="real cut sqrt(2)" domain={[1.38,1.45]} rows={[{a:1.38,b:Math.SQRT2,openRight:true,label:'Rational q with q² < 2',tone:'blue'},{a:Math.SQRT2,b:1.45,openLeft:true,label:'Rational q with q² > 2',tone:'rose'}]} points={[{value:1.4,label:'7/5',row:0},{value:1.41,label:'141/100',row:0},{value:1.42,label:'71/50',row:1}]} />
    <Table title="Exact comparisons name each side of the boundary" headers={['q','q²','Compare with 2']} rows={[[ '7/5','49/25','< 2'],['141/100','19881/10000','< 2'],['71/50','5041/2500','> 2']]} />
  </Figure>;
}
export function NestedIntervalsFigure() {
  const states=integers(5,0).map(k=>dyadicBracket(2,k));
  return <Figure job="A07" title="Closed intervals nest while their widths shrink" caption="All rows use the same value scale [1,2]. Their widths are 1/2^k; the aligned cut illustrates the common point. Closedness plus completeness gives existence, and widths tending to zero give uniqueness. Open intervals (0,1/n) instead have empty common intersection.">
    <Line label="Five closed nested square-root brackets on a shared scale" cut={Math.SQRT2} cutLabel="common point sqrt(2)" domain={[1,2]} rows={states.map(s=>({a:s.left,b:s.right,label:`k=${s.steps}; width 1/2^${s.steps}`}))} />
    <Line label="Open intervals approaching an excluded zero" domain={[0,1]} rows={[1,2,4,8].map(n=>({a:0,b:1/n,openLeft:true,openRight:true,label:`(0, 1/${n})`,tone:'rose'}))} />
  </Figure>;
}
export function RationalGapFigure() {
  return <Figure job="A08" title="A reduced fraction cannot supply the missing rational limit" caption="In p²=2q², p must be even. Write p=2r and cancel one factor 2 to obtain q²=2r², so q is even too. The same factor 2 divides both numerator and denominator, contradicting a reduced fraction. This is an algebraic parity argument, not a decimal test.">
    <p>Read the actual numerator and denominator factors in order; the final rose connection marks their common divisor.</p>
    <Canvas label="Numerator and denominator parity force common factor 2" height={370}>
      {({width})=>{const x=width/2;return <>
        <Label x={x} y={30}>p² = 2q²</Label><Arrow x1={x} y1={45} x2={x} y2={80} />
        <Label x={x} y={105}>p = 2r</Label><Arrow x1={x} y1={120} x2={x} y2={155} tone="blue" />
        <Label x={x} y={180}>q² = 2r²</Label><Arrow x1={x} y1={195} x2={x} y2={230} />
        <Label x={x} y={255}>q = 2s</Label>
        <path className="ra-stroke rose" d={`M${x-58},100H20V290H${width-20}V255H${x+52}`} fill="none" />
        <Label x={x} y={330}>2 divides p,q</Label>
      </>;}}
    </Canvas>
  </Figure>;
}
export function MonotoneBoundaryFigure() {
  return <Figure job="A09" title="A monotone tail remains above its first good point" caption="For a_n=1−1/n, the boundary 1 is a supremum and is never attained. At tolerance 1/5, n=6 is above 1−epsilon and every later term stays above it. The contrasting sequences identify different missing hypotheses.">
    <Plot label="Increasing bounded values and unattained supremum 1" domain={[1,20]} range={[0,1.1]} xLabel="Index n" yLabel="1 − 1/n" lines={[{points:linePoints(integers(20).map(n=>1-1/n))}]} background={({x,y,right})=><><line className="ra-stroke blue dashed" x1={x(1)} x2={right} y1={y(1)} y2={y(1)} /><line className="ra-stroke rose dashed" x1={x(1)} x2={right} y1={y(.8)} y2={y(.8)} /></>}>{({x,y})=><><Dot x={x(6)} y={y(5/6)} tone="blue" /><Label x={x(6)} y={y(5/6)-22}>n=6</Label></>}</Plot>
    <Table title="Which hypothesis is absent?" headers={['Sequence','Monotone?','Bounded?','Conclusion']} rows={[[ '1−1/n','yes','yes','limit1'],['n','yes','no','no finite limit'],['(−1)^n','no','yes','no limit']]} />
  </Figure>;
}
export function PairwiseTailFigure() {
  return <Figure job="A10" title="Adjacent small steps do not control every late pair" caption="At n=16 the adjacent gap is sqrt(17)−4, whereas the later pair n and 4n differs by 4. Generally that latter gap is sqrt(n), even though adjacent increments tend to zero.">
    <Line label="Actual square-root values at indices16,17,64" domain={[3.5,8.5]} rows={[{a:4,b:8,label:'The same value scale for both gaps'}]} points={[{value:4,label:'sqrt(16)=4',anchor:'end'},{value:Math.sqrt(17),label:'sqrt(17)',anchor:'start'},{value:8,label:'sqrt(64)=8'}]} />
    <DistanceChain label="A Cauchy tail must control arbitrary pairs" points={[.91,.94,.97]} names={['a_n','a_m','a_l']} budgets={['|a_n−a_m| < epsilon','|a_m−a_l| < epsilon']} />
  </Figure>;
}
export function TelescopingTailFigure() {
  return <Figure job="A12" title="Matching reciprocal terms cancel; two endpoints survive" caption="For k=4,5,6, pair 1/k with −1/(k+1). The internal 1/5 and 1/6 contributions cancel exactly. The finite block is 1/4−1/7; taking the final endpoint to infinity leaves the whole tail 1/4 after N=3.">
    <p>Rows keep k=4,5,6. Blue connections cancel −1/(k+1) against the next row's +1/k; +1/4 and −1/7 survive.</p>
    <Canvas label="Addressed reciprocal terms with matched cancellations" height={350}>
      {({width})=>{const a=width*.30,b=width*.76;return <>
        {[4,5,6].map((k,i)=><g key={k}><Label x={16} y={65+i*85} anchor="start">{k}</Label><Label x={a} y={65+i*85}>{`+1/${k}`}</Label><Label x={b} y={65+i*85}>{`−1/${k+1}`}</Label>{i<2&&<path className="ra-stroke blue dashed" d={`M${b},${77+i*85}Q${b},${113+i*85} ${a},${135+i*85}`} fill="none" />}</g>)}
        <Label x={width/2} y={330}>+1/4 − 1/7</Label>
      </>;}}
    </Canvas>
    <Table title="Term decomposition and total" headers={['k','1/[k(k+1)]','1/k−1/(k+1)']} rows={[[4,'1/20','1/4−1/5'],[5,'1/30','1/5−1/6'],[6,'1/42','1/6−1/7']]} />
  </Figure>;
}
export function SubsequenceSelectionFigure() {
  return <Figure job="A13" title="Nested halves retain the proof's infinitely many indices" caption="The highlighted interval at each stage is chosen because it contains infinitely many sequence terms. The finite sketch does not test that property. Increasing chosen indices and widths tending to zero produce a subsequence squeezed to the common real point.">
    <Line label="Nested retained halves and increasing chosen subsequence indices" domain={[0,1]} rows={[{a:0,b:1,label:'initial bounded interval'},{a:.5,b:1,label:'chosen half: infinitely many indices'},{a:.5,b:.75,label:'chosen half: infinitely many indices'},{a:.625,b:.75,label:'chosen half: infinitely many indices'}]} points={[{value:.8,row:1,label:'n₁=4'},{value:.7,row:2,label:'n₂=9'},{value:.68,row:3,label:'n₃=17'}]} />
  </Figure>;
}
export function TailEnvelopeFigure() {
  const points=integers(24).map(n=>({x:n,y:(-1)**n*(1+1/n)}));
  const upper=integers(24).map(n=>({x:n,y:1+1/(n%2?n+1:n)}));
  const lower=integers(24).map(n=>({x:n,y:-1-1/(n%2?n:n+1)}));
  return <Figure job="A14" title="Every late value lies between its tail infimum and supremum" caption="The upper endpoint uses the first even e_N≥N and the lower the first odd o_N≥N. Their limits are 1 and −1, so the sequence cannot converge. A tail envelope need not be an attained term: the tail infimum of 1/n is 0.">
    <Plot label="Alternating values with exact parity-dependent tail envelopes" domain={[1,24]} range={[-2.2,2.2]} xLabel="Tail starts at N" yLabel="Value / tail bound" lines={[{label:'Upper tail envelope',points:upper,tone:'blue'},{label:'Lower tail envelope',points:lower,tone:'rose'}]}>{({x,y})=>points.map(p=><Dot key={p.x} x={x(p.x)} y={y(p.y)} />)}</Plot>
  </Figure>;
}
export function CauchyCompletenessFigure() {
  return <Figure job="A15" title="One late subsequence point connects every late term to the limit" caption="First obtain a convergent subsequence using boundedness and real completeness. Choose its point a_nk late enough for both conditions. The pairwise Cauchy distance and the subsequence-to-limit distance each consume less than epsilon/2; their sum controls an arbitrary late a_n.">
    <DistanceChain label="Two actual distances forming a full sequence-to-limit estimate" points={[.92,.98,1]} names={['a_n','a_nk','L']} budgets={['Cauchy < epsilon/2','subsequence < epsilon/2']} />
  </Figure>;
}

export function PointContinuityFigure() {
  const epsilon=.3, delta=.1;
  return <Figure job="A16" title="An input window controls an output window at one point" caption="At x₀=1, epsilon=.3 and delta=.1. Strict |x−1|<delta bounds |x+1|<3, hence |x²−1|<epsilon. The input and output axes are different quantities; equal-looking spans do not supply the proof.">
    <Plot label="Square function with separate local input and output bands" domain={[0,2]} range={[0,4]} lines={[{points:samples(squareTarget,0,2)}]} yLabel="Output x²" background={({x,y,left,right,top,bottom})=><><rect className="ra-band" x={left} y={y(1+epsilon)} width={right-left} height={y(1-epsilon)-y(1+epsilon)} /><rect className="ra-area rose" x={x(1-delta)} y={top} width={x(1+delta)-x(1-delta)} height={bottom-top} /></>}>{({x,y})=><Dot x={x(1)} y={y(1)} tone="blue" />}</Plot>
  </Figure>;
}
export function UniformContinuityWitnessFigure() {
  return <Figure job="A17" title="A tiny moving input gap keeps a large output gap" caption="Under x², the pair n and n+1/n has input gap 1/n and output gap 2+1/n². Both drawings retain real coordinates. The second is an explicitly labelled magnification near n=16; it is not a change to the function or its global domain.">
    <Compare><Panel title="Global position on the unbounded input domain"><Plot label="Square function up to 17 with moving pair near 16" domain={[0,17]} range={[0,290]} lines={[{points:samples(squareTarget,0,17)}]} yLabel="Output x²">{({x,y})=><><Dot x={x(16)} y={y(256)} tone="blue" /><Dot x={x(16+1/16)} y={y((16+1/16)**2)} tone="rose" /></>}</Plot></Panel>
      <Panel title="Local magnification: the same n=16 pair"><Plot label="Magnified true coordinates of the moving square-function witness" domain={[15.98,16.09]} range={[255,259]} lines={[{points:samples(squareTarget,15.98,16.09)}]} yLabel="Same output x²">{({x,y})=><><Dot x={x(16)} y={y(256)} tone="blue" /><Dot x={x(16.0625)} y={y(258.00390625)} tone="rose" /></>}</Plot></Panel></Compare>
    <Table title="Changing n makes the input easier without shrinking the output gap" headers={['n','Input gap','Output gap']} rows={[4,16,64].map(n=>[n,1/n,2+1/n**2])} />
  </Figure>;
}
export function CompactContinuityFigure() {
  const centers=[0,.2,.4,.6,.8,1], radius=.21;
  return <Figure job="A18" title="Half-neighborhood coverage leaves a margin inside full neighborhoods" caption="This is finite-cover anatomy, not a numerical continuity test: the full neighborhoods have already been chosen using local continuity. The half-neighborhoods cover [0,1]. If x lies in one half and |x−y| is smaller than its half-radius, both inputs lie in the corresponding full neighborhood. A finite minimum retains a positive margin.">
    <p>All six neighborhoods use the same input scale −.3 to 1.3. Blue radius .105 is half the full grey radius .21.</p>
    <Canvas label="Six overlapping half-neighborhoods within full neighborhoods" height={400}>
      {({width})=>{const x=v=>16+(v+.3)/1.6*(width-32);return <>
        {centers.map((c,i)=>{const y=45+i*52;return <g key={c}><line className="ra-axis" x1={x(-.3)} x2={x(1.3)} y1={y} y2={y} /><line className="ra-stroke muted" x1={x(c-radius)} x2={x(c+radius)} y1={y} y2={y} /><line className="ra-stroke blue" x1={x(c-radius/2)} x2={x(c+radius/2)} y1={y} y2={y} /><Dot x={x(c)} y={y} /><Label x={x(c)} y={y+24}>{fmt(c)}</Label></g>;})}
      </>;}}
    </Canvas>
  </Figure>;
}
export function IntervalTheoremsFigure() {
  return <Figure job="A19" title="Continuity crosses heights; compactness retains extrema" caption="The square curve crosses height 2 between endpoints 0 and 2. The sine arch on [0,1] attains its maximum 1 at 1/2 and minimum 0. A step skips height 1/2, and 1/x on [1,infinity) approaches an unattained infimum 0. These contrasts expose different missing hypotheses.">
    <Compare><Panel title="Intermediate value"><Plot label="Continuous square curve crossing an intermediate height" domain={[0,2]} range={[0,4]} lines={[{points:samples(squareTarget,0,2)}]} background={({y,left,right})=><line className="ra-stroke blue dashed" x1={left} x2={right} y1={y(2)} y2={y(2)} />}>{({x,y})=><Dot x={x(Math.SQRT2)} y={y(2)} tone="blue" />}</Plot></Panel>
      <Panel title="Attained extrema on a compact interval"><Plot label="Sine arch with true maximum and endpoint minima" domain={[0,1]} range={[0,1.1]} lines={[{points:samples(x=>Math.sin(Math.PI*x),0,1)}]}>{({x,y})=><><Dot x={x(.5)} y={y(1)} tone="blue" /><Dot x={x(0)} y={y(0)} /><Dot x={x(1)} y={y(0)} /></>}</Plot></Panel>
      <Panel title="A discontinuity skips a height"><Plot label="Step function never taking intermediate value one half" domain={[-1,1]} range={[0,1.1]} lines={[{label:'Left branch: value 0',points:[{x:-1,y:0},{x:0,y:0}]},{label:'Right branch: value 1',points:[{x:0,y:1},{x:1,y:1}],tone:'blue'}]}>{({x,y})=><><Dot x={x(0)} y={y(0)} open /><Dot x={x(0)} y={y(1)} /></>}</Plot></Panel>
      <Panel title="An unbounded interval loses the minimum"><Plot label="Reciprocal curve with unattained zero boundary" domain={[1,8]} range={[0,1.1]} lines={[{points:samples(x=>1/x,1,8)}]}>{({x,y})=><Arrow x1={x(7)} y1={y(1/7)} x2={x(8)} y2={y(1/8)} />}</Plot></Panel></Compare>
  </Figure>;
}
export function SeriesAnatomyFigure() {
  const values=integers(5).map(k=>2**-k);
  return <Figure job="A20" title="Terms are increments; partial sums accumulate their lengths" caption="The first five increments are 2^−k, starting at k=1. Their accumulated length is S₅=31/32 and the whole remaining tail is 1/32. Individual term values and their accumulated sum are different sequences.">
    <Bars label="Five actual geometric term magnitudes" values={values} labels={integers(5)} maximum={.5} yLabel="Term a_k = 2^−k" />
    <p>Five retained lengths total 31/32; the rose final piece is the remaining tail 1/32. One common length scale ends at 1.</p>
    <Canvas label="Five concatenated lengths and exact remaining tail" height={155}>
      {({width})=>{const x=v=>16+(width-32)*v;return <>
        <line className="ra-axis" x1={x(0)} x2={x(1)} y1={55} y2={55} />
        {values.map((v,i)=>{const start=values.slice(0,i).reduce((a,b)=>a+b,0);return <rect key={i} x={x(start)} y={37} width={(width-32)*v} height={36} className={`ra-area ${i%2?'blue':'gold'}`} />;})}
        <rect className="ra-area rose" x={x(31/32)} y={37} width={(width-32)/32} height={36} /><Label x={x(0)} y={105} anchor="start">0</Label><Label x={x(1)} y={105} anchor="end">1</Label>
      </>;}}
    </Canvas>
  </Figure>;
}
export function GeometricTailFigure() {
  const limit=4/3;
  return <Figure job="A21" title="The exact omitted tail must be strictly below the requested tolerance" caption="For k=0 through N, the limit is 4/3. N=4 leaves 1/768, exceeding 1/1000; N=5 leaves 1/3072, below it. The second ruler magnifies only the tail near the same numerical limit.">
    <Line label="Accumulated geometric sum and limit on the full scale" domain={[0,1.4]} rows={[{a:0,b:limit-1/768,label:'N=4: five retained terms'},{a:0,b:limit-1/3072,label:'N=5: six retained terms'}]} />
    <Line label="Same tail positions magnified near four thirds" domain={[limit-.0016,limit+.0002]} rows={[{a:limit-1/768,b:limit,label:'tail 1/768 > 1/1000',tone:'rose'},{a:limit-1/3072,b:limit,label:'tail 1/3072 < 1/1000',tone:'blue'}]} />
  </Figure>;
}
export function AlternatingEnclosureFigure() {
  const partial=n=>integers(n).reduce((s,k)=>s+(-1)**(k+1)/k,0);
  return <Figure job="A22" title="Even and odd partial sums enclose the same limit" caption="Each row uses an even lower partial sum and the immediately following odd upper sum. Their separation is the next term, 1/(N+1). It is a sufficient error bound rather than the exact error of either sum. Decreasing nonnegative magnitudes tending to zero justify every later bracket.">
    <Line label="Alternating harmonic enclosures around log2" domain={[.58,.84]} rows={[4,6,8,10,12].map(n=>({a:partial(n),b:partial(n+1),label:`N=${n}; bracket width 1/${n+1}`}))} points={[4,6,8,10,12].map((n,i)=>({value:Math.LN2,row:i,label:i===0?'log 2':'',tone:'blue'}))} />
  </Figure>;
}
export function SeriesIntegralBoundsFigure() {
  return <Figure job="A23" title="Decreasing rectangles bracket the omitted series tail" caption="For the tail after N=4, the rectangle for term k sits above the curve on [k,k+1] and below it on [k−1,k]. Thus integral from 5 bounds below and integral from 4 above: 1/5≤tail≤1/4. Finite rectangles illustrate the monotonic comparison, not a finite measurement of the infinite tail.">
    <Compare>{['lower','upper'].map((kind,i)=><Panel key={kind} title={kind==='lower'?'Integral from N+1 lies below the tail':'Integral from N lies above the tail'}><Plot label={`${kind} integral comparison for inverse-square series`} domain={[4,10]} range={[0,.07]} lines={[{points:samples(x=>1/x**2,4,10),tone:'blue'}]} xLabel="Term/rectangle address x" yLabel="1/x²" background={({x,y})=>integers(5,5).map(k=><rect key={k} className="ra-area" x={x(kind==='lower'?k:k-1)} y={y(1/k**2)} width={x(k+1)-x(k)} height={y(0)-y(1/k**2)} />)} /></Panel>)}</Compare>
  </Figure>;
}
export function AbsoluteTailReorderingFigure() {
  return <Figure job="A24" title="An included finite prefix leaves a common absolute budget" caption="For the alternating geometric series starting with +1/2, the first four signed terms sum to 5/16. Their unchosen absolute tail totals 1/16. Once a rearrangement contains that entire prefix, any additional finite selection stays within that common budget, regardless of its order.">
    <Bars label="Included signed terms with their original addresses" values={[.5,-.25,.125,-.0625]} labels={['k=1','k=2','k=3','k=4']} maximum={.5} yLabel="Signed increment" />
    <Line label="Remaining absolute tail budget surrounding the included-prefix sum" domain={[.2,.42]} rows={[{a:.25,b:.375,label:'5/16 ± absolute tail 1/16',tone:'blue'},{a:.25,b:.375,label:'The same allowed band contains the limit',tone:'blue'}]} points={[{value:5/16,label:'prefix 5/16'},{value:1/3,label:'limit 1/3',row:1,tone:'rose'}]} />
  </Figure>;
}
export function ConvergenceQuantifiersFigure() {
  const fractions=[[1,2],[3,4],[9,10],[99,100]], thresholds=fractions.map(([p,q])=>{let n=1;while(10n*BigInt(p)**BigInt(n)>=BigInt(q)**BigInt(n))n++;return n;});
  return <Figure job="A25" title="Input columns require different starting indices" caption="At epsilon=1/10, strict integer comparison gives N=4,9,22,230 for these four inputs. The coloured part of each column is its safe tail. A shared N for finitely many displayed inputs is not a uniform certificate on all [0,1); inputs may approach 1 arbitrarily closely. At x=1, the limiting value is separately 1.">
    <p>Columns keep the input order 1/2,3/4,9/10,99/100. Blue regions begin at each exact first valid N, on one shared index scale.</p>
    <Canvas label="Input by index threshold map for four powers" height={360}>
      {({width})=>{const left=42,step=(width-left-10)/4;return <>
        {[1,50,100,150,200,250].map(n=><g key={n}><line className="ra-grid" x1={left} x2={width-10} y1={50+n} y2={50+n} /><Label x={left-8} y={55+n} anchor="end">{n}</Label></g>)}
        {thresholds.map((n,i)=><g key={i}><rect className="ra-area blue" x={left+step*(i+.15)} y={50+n} width={step*.7} height={250-n} /><Dot x={left+step*(i+.5)} y={50+n} /><Label x={left+step*(i+.5)} y={30}>{i+1}</Label><Label x={left+step*(i+.5)} y={330+(i%2)*22}>{n}</Label></g>)}
      </>;}}
    </Canvas><ol>{fractions.map((f,i)=><li key={i}>Column {i+1}: x={f.join('/')}, N={thresholds[i]}.</li>)}</ol>
  </Figure>;
}
export function MovingPowerWitnessFigure() {
  return <Figure job="A27" title="A fixed input improves while a chosen input moves toward the endpoint" caption="For n=4,16,64, the points x_n=2^(−1/n) all have value 1/2. The fixed input 1/2 instead has values 1/16,1/65536,2^−64. A moving witness gives a lower bound on supremum error; it does not by itself establish the exact supremum 1.">
    <Compare><Panel title="Common global domain"><Plot label="Power curves with actual fixed and moving input markers" domain={[0,1]} range={[0,1]} lines={[4,16,64].map((n,i)=>({label:`Power n=${n}`,points:samples(x=>x**n,0,1),tone:['gold','rose','blue'][i]}))}>{({x,y})=><>{[4,16,64].map(n=><Dot key={n} x={x(2**(-1/n))} y={y(.5)} tone="rose" />)}<line className="ra-stroke blue dashed" x1={x(.5)} x2={x(.5)} y1={y(0)} y2={y(1)} /></>}</Plot></Panel><Panel title="Magnification near 1; same true coordinates"><Plot label="Moving witnesses magnified near the endpoint" domain={[.8,1]} range={[0,1]} lines={[4,16,64].map((n,i)=>({label:`Power n=${n}`,points:samples(x=>x**n,.8,1),tone:['gold','rose','blue'][i]}))}>{({x,y})=>[4,16,64].map(n=><Dot key={n} x={x(2**(-1/n))} y={y(.5)} tone="rose" />)}</Plot></Panel></Compare>
  </Figure>;
}
export function UniformCauchyFigure() {
  return <Figure job="A28" title="A common pairwise budget survives the pointwise limit" caption="The example f_n(x)=x+1/n shows an entire common difference band. In the proof, choose the Cauchy budget epsilon/2 uniformly in x, then send m to infinity at each fixed x using real completeness. The resulting nonstrict epsilon/2 bound remains strictly below epsilon.">
    <Plot label="Two function indices and the pointwise limit on one common domain" domain={[0,1]} range={[0,1.2]} lines={[{label:'f_10(x)=x+1/10',points:samples(x=>x+.1,0,1)},{label:'f_20(x)=x+1/20',points:samples(x=>x+.05,0,1),tone:'rose'},{label:'Limit f(x)=x',points:samples(x=>x,0,1),tone:'blue'}]} />
    <Table title="A shared bound controls every input in [0,1]" headers={['Functions','Actual common difference','Role']} rows={[[ 'f₁₀−f₂₀',.05,'pairwise difference'],['f₁₀−f',.1,'limit difference'],['epsilon/2 versus epsilon','.1 < .2','strict margin retained']]} />
  </Figure>;
}
export function ContinuousLimitObstructionFigure() {
  return <Figure job="A29" title="Continuous powers approach a limit with a jump at the included endpoint" caption="The limit is 0 for x<1 and 1 at x=1. Its open point at (1,0) is separate from its included value (1,1); no line joins the jump. Uniform limits of continuous functions on the same domain would remain continuous, so this convergence on [0,1] cannot be uniform.">
    <Plot label="Continuous powers and their discontinuous endpoint limit" domain={[0,1]} range={[0,1.1]} lines={[4,16,64].map((n,i)=>({label:`Power n=${n}`,points:samples(x=>x**n,0,1),tone:['gold','rose','blue'][i]})).concat([{label:'Pointwise limit: 0 for x<1; isolated value 1 at x=1',points:[{x:0,y:0},{x:1,y:0}],tone:'muted',dashed:true}])}>{({x,y})=><><Dot x={x(1)} y={y(0)} open tone="blue" /><Dot x={x(1)} y={y(1)} tone="blue" /></>}</Plot>
  </Figure>;
}
export function TriangleNormsFigure() {
  const n=16,h=4;
  return <Figure job="A31" title="Peak, absolute area and squared area measure different errors" caption="For n=16 and h=sqrt(n)=4, the height is 4 and the base is 1/8. L1=h/n=1/4, squared L2=2h²/(3n)=2/3, and L2 is its square root. This family can lose L1 error while retaining squared L2 and growing supremum error.">
    <Plot label="Actual height-four triangle with base-one-eighth support" domain={[0,.15]} range={[0,4.5]} lines={[{points:triangle(n,h)}]} background={({x,y})=><polygon className="ra-area blue" points={triangle(n,h).slice(0,3).map(p=>`${x(p.x)},${y(p.y)}`).join(' ')} />} />
    <Table title="Derived whole error quantities, not normalized peaks" headers={['Quantity','Formula','Value']} rows={[[ 'supremum','h',h],['L1','h/n',h/n],['squared L2','2h²/(3n)',2*h*h/(3*n)],['L2','h sqrt(2/(3n))',h*Math.sqrt(2/(3*n))]]} />
  </Figure>;
}
export function MissedGridPeakFigure() {
  return <Figure job="A32" title="The narrow support fits between consecutive grid points" caption="At n=64, support [0,1/32] lies before the next coarse point 1/20. Every j/20 sample is zero, while the true height is 1 at 1/64. The local view magnifies horizontal position only; its vertical scale is identical.">
    <Compare><Panel title="Global grid"><Plot label="Unit-height moving triangle on the full input interval" domain={[0,1]} range={[0,1.1]} lines={[{points:triangle(64,1)}]}>{({x,y})=>integers(21,0).map(j=><Dot key={j} x={x(j/20)} y={y(0)} tone="blue" />)}</Plot></Panel><Panel title="First grid cell magnified"><Plot label="Peak and entire support within the first coarse cell" domain={[0,.05]} range={[0,1.1]} lines={[{points:triangle(64,1)}]}>{({x,y})=><><Dot x={x(0)} y={y(0)} tone="blue" /><Dot x={x(.05)} y={y(0)} tone="blue" /><Dot x={x(1/64)} y={y(1)} tone="rose" /></>}</Plot></Panel></Compare>
  </Figure>;
}
export function JumpObstructionFigure() {
  return <Figure job="A33" title="One continuous value cannot match both sides of a jump" caption="The target has left limit −1 and right limit 1. The illustrated continuous curve has c=0 at the jump. More generally |c+1|+|c−1|≥2 forces at least one one-sided limiting error to be at least 1. This is a continuity obstruction, not a Fourier solver or a claimed Gibbs percentage.">
    <Plot label="A continuous approximation across a two-unit target jump" domain={[-1,1]} range={[-1.3,1.3]} lines={[{label:'Continuous approximant tanh(6x)',points:samples(x=>Math.tanh(6*x),-1,1)},{label:'Target left branch: −1',points:[{x:-1,y:-1},{x:0,y:-1}],tone:'blue'},{label:'Target right branch: +1',points:[{x:0,y:1},{x:1,y:1}],tone:'blue'}]}>{({x,y})=><><Dot x={x(0)} y={y(-1)} open tone="blue" /><Dot x={x(0)} y={y(1)} open tone="blue" /><Dot x={x(0)} y={y(0)} tone="rose" /></>}</Plot>
    <DistanceChain label="One-sided value distances force a large error" points={[-1,0,1]} names={['left −1','c=0','right 1']} budgets={['|c+1| = 1','|c−1| = 1']} />
  </Figure>;
}

export function ThreeErrorSegmentsFigure() {
  const points=[1.08,1.06,1.02,1];
  return <Figure job="A34" title="Three distances connect a limit at two nearby inputs" caption="Choose N so both uniform edges are smaller than epsilon/3. Then use continuity of this one f_N to choose delta for the middle edge. The illustrative distances .02, .04 and .02 fit epsilon=.15, and sum to .08. The proof controls every admissible nearby input, rather than only these four marks.">
    <p>Point order A=f(x), B=f_N(x), C=f_N(x₀), D=f(x₀). All positions share the true value scale .99 to 1.09.</p>
    <Canvas label="Four actual values with three separately routed error segments" height={280}>
      {({width})=>{const x=v=>16+(v-.99)/.1*(width-32);return <>
        <line className="ra-axis" x1={16} x2={width-16} y1={75} y2={75} />
        {points.map((v,i)=><g key={i}><Dot x={x(v)} y={75} tone={i===1||i===2?'gold':'blue'} /><Label x={x(v)} y={40+(i%2)*20}>{String.fromCharCode(65+i)}</Label></g>)}
        {points.slice(1).map((v,i)=><path key={i} className={`ra-stroke ${i===1?'gold':'blue'}`} d={`M${x(points[i])},${120+55*i}V${110+55*i}H${x(v)}V${120+55*i}`} fill="none" />)}
      </>;}}
    </Canvas><ul>{points.map((v,i)=><li key={i}>{String.fromCharCode(65+i)}: {v}.</li>)}<li>Blue A→B: uniform .02 &lt; epsilon/3.</li><li>Gold B→C: local .04 &lt; epsilon/3.</li><li>Blue C→D: uniform .02 &lt; epsilon/3.</li></ul>
  </Figure>;
}

export function DarbouxGapFigure() {
  const partition=[0,.5,1,1.5,2], delta=.05;
  const rectangles=(offset,tone)=>({x,y})=>partition.slice(0,-1).map((a,i)=><g key={i}><rect className={`ra-area ${tone}`} x={x(a)} y={y(partition[i+1]+offset)} width={x(partition[i+1])-x(a)} height={y(0)-y(partition[i+1]+offset)} /><rect className="ra-area blue" x={x(a)} y={y(a+offset)} width={x(partition[i+1])-x(a)} height={y(0)-y(a+offset)} /></g>);
  return <Figure job="A35" title="A common partition traps the nearby function between shifted rectangles" caption="Use f_N(x)=x on [0,2] and |f−f_N|≤.05. For each cell, its lower value shifts down .05 and upper value shifts up .05, widening the summed gap by at most 2·2·.05=.2. The displayed partition has approximant gap 1 and resulting bound 1.2; refining the partition makes the first gap small after N has been chosen.">
    <Compare><Panel title="Approximant rectangles"><Plot label="Upper and lower rectangles of x on four equal cells" domain={[0,2]} range={[-.1,2.2]} lines={[{points:samples(x=>x,0,2)}]} background={rectangles(0,'gold')} /></Panel><Panel title="Uniformly shifted bounds for the limit"><Plot label="Upper rectangles raised by .05 and lower rectangles lowered by .05" domain={[0,2]} range={[-.1,2.2]} lines={[{points:samples(x=>x,0,2),dashed:true}]} background={({x,y})=>partition.slice(0,-1).map((a,i)=><g key={i}><rect className="ra-area rose" x={x(a)} y={y(partition[i+1]+delta)} width={x(partition[i+1])-x(a)} height={y(0)-y(partition[i+1]+delta)} /><rect className="ra-area blue" x={x(a)} y={Math.min(y(a-delta),y(0))} width={x(partition[i+1])-x(a)} height={Math.abs(y(0)-y(a-delta))} /></g>)} /></Panel></Compare>
    <Table title="The proof's two independent choices" headers={['Contribution','This partition','How it becomes small']} rows={[[ 'Approximant upper minus lower',1,'refine partition after choosing N'],['Additional uniform bound',.2,'choose N first for delta'],['Resulting upper-gap bound',1.2,'sum both contributions']]} />
  </Figure>;
}

export function FiniteIntervalErrorFigure() {
  const reference=x=>.5+.2*x,error=x=>.05*Math.sin(Math.PI*x);
  return <Figure job="A36" title="Finite horizontal length turns a height bound into an area bound" caption="On [0,2], every absolute difference is at most .05, so its area and the absolute signed integral error are at most .1. The blue region is |f_n−f|, while the rose band is the analytic height allowance around the reference. Length 4 would double the same sufficient bound to .2. Both functions must be integrable.">
    <Plot label="Two integrable curves and a uniform error band" domain={[0,2]} range={[0,1.1]} lines={[{label:'Reference function',points:samples(reference,0,2),tone:'blue'},{label:'Perturbed function: reference + error',points:samples(x=>reference(x)+error(x),0,2)}]} background={({x,y})=><polygon className="ra-area rose" points={[...samples(t=>reference(t)+.05,0,2),...samples(t=>reference(t)-.05,0,2).reverse()].map(p=>`${x(p.x)},${y(p.y)}`).join(' ')} />} />
    <Plot label="Absolute difference area on the same finite input interval" domain={[0,2]} range={[0,.06]} lines={[{points:samples(x=>Math.abs(error(x)),0,2),tone:'blue'}]} background={({x,y})=><polygon className="ra-area blue" points={[{x:0,y:0},...samples(t=>Math.abs(error(t)),0,2),{x:2,y:0}].map(p=>`${x(p.x)},${y(p.y)}`).join(' ')} />} yLabel="Absolute difference" />
  </Figure>;
}

export function InfiniteEscapeFigure() {
  return <Figure job="A37" title="Support length grows as the rectangle height shrinks" caption="For n=2,4,8, f_n is 1/n on [0,n] and zero afterwards. All three use the same horizontal and vertical scales: height tends to zero uniformly, but width times height remains 1. The infinite domain supplies growing room; the finite-interval estimate has no fixed length factor here.">
    <Plot label="Three unit-area rectangles with expanding actual supports" domain={[0,9]} range={[0,.6]} background={({x,y})=>[2,4,8].map((n,i)=><rect key={n} className={`ra-area ${['gold','blue','rose'][i]}`} x={x(0)} y={y(1/n)} width={x(n)-x(0)} height={y(0)-y(1/n)} ><title>{`n=${n}: height 1/n, support [0,n]`}</title></rect>)}>{({x,y})=>[2,4,8].map((n,i)=><g key={n}><Label x={x(n)} y={y(1/n)-10} anchor="end">n={n}</Label><Dot x={x(n)} y={y(1/n)} /><Dot x={x(n)} y={y(0)} open /></g>)}</Plot>
    <Table title="Amplitude and area answer different questions" headers={['n','Uniform error','Support length','Integral']} rows={[2,4,8].map(n=>[n,1/n,n,1])} />
  </Figure>;
}

export function DerivativeOffsetFigure() {
  return <Figure job="A39" title="The same slope leaves every vertical offset undetermined" caption="All x+n curves have derivative 1, yet their values at x=0 diverge. The repair x+1/n keeps that derivative and lets the anchor tend to zero. Each comparison uses one common output scale for all its curves, with its scale explicitly named.">
    <Compare><Panel title="Lost anchors: common output scale 0 to 9"><Plot label="Parallel x+n curves for n=1,4,8" domain={[0,1]} range={[0,9]} lines={[1,4,8].map((n,i)=>({label:`Lost anchor n=${n}: x+n`,points:samples(x=>x+n,0,1),tone:['gold','blue','rose'][i]}))}>{({x,y})=>[1,4,8].map(n=><g key={n}><Dot x={x(0)} y={y(n)} /><Label x={x(.2)} y={y(n+.2)-10}>n={n}</Label></g>)}</Plot></Panel><Panel title="Repaired anchors: common output scale 0 to 2"><Plot label="Parallel x+1/n curves approaching x" domain={[0,1]} range={[0,2]} lines={[1,4,8].map((n,i)=>({label:`Repaired anchor n=${n}: x+1/n`,points:samples(x=>x+1/n,0,1),tone:['gold','blue','rose'][i]})).concat([{label:'Limit: x',points:samples(x=>x,0,1),tone:'muted',dashed:true}])}>{({x,y})=>[1,4,8].map(n=><Dot key={n} x={x(0)} y={y(1/n)} />)}</Plot></Panel></Compare>
  </Figure>;
}

export function DerivativeAnchorFigure() {
  return <Figure job="A40" title="An anchor and signed derivative area reconstruct the function" caption="For the illustrated derivative 2t and anchor f(0)=1, the shaded integral from 0 to .8 is .64, giving f(.8)=1.64. Comparing two functions splits their error into an anchor difference plus at most interval length times derivative sup error. The selected theorem assumes continuous derivatives converging uniformly on a bounded interval. On the whole line, x/n has derivative and anchor tending to zero but unbounded sup error.">
    <Plot label="Signed accumulated derivative area from the fixed anchor to x=.8" domain={[0,1]} range={[0,2.2]} yLabel="Derivative f′(t)" xLabel="Integration variable t" lines={[{points:samples(t=>2*t,0,1)}]} background={({x,y})=><polygon className="ra-area blue" points={[{x:0,y:0},...samples(t=>2*t,0,.8),{x:.8,y:0}].map(p=>`${x(p.x)},${y(p.y)}`).join(' ')} />} />
    <DistanceChain label="Anchor plus accumulated derivative area reaches the function value" points={[0,1,1.64]} names={['reference 0','anchor 1','f(.8)=1.64']} budgets={['anchor contribution 1','derivative area .64']} />
    <Table title="Bounded length is essential" headers={['Family','Anchor at 0','Derivative','Whole-line sup error']} rows={[[ 'x/n',0,'1/n','unbounded for each n']]} />
  </Figure>;
}

export function SmoothCornerFigure() {
  const ns=[2,4,16];
  return <Figure job="A41" title="Smooth values approach a corner while derivative control fails there" caption="The exact retained family is h_n(x)=sqrt(x²+1/n²). Its maximum value error is 1/n at zero. Its derivative is x/sqrt(x²+1/n²), equal to zero at zero for every n, and approaching the two signs away from zero. The limit |x| has no derivative at its corner; uniform derivative convergence is missing.">
    <Compare><Panel title="Value convergence on [−1,1]"><Plot label="Smooth corner approximants and absolute-value limit" domain={[-1,1]} range={[0,1.2]} lines={ns.map((n,i)=>({label:`h_${n}(x)=sqrt(x²+1/${n}²)`,points:samples(x=>Math.sqrt(x*x+1/n**2),-1,1),tone:['gold','blue','rose'][i]})).concat([{label:'Limit: |x|',points:[{x:-1,y:1},{x:0,y:0},{x:1,y:1}],tone:'muted',dashed:true}])}>{({x,y})=>ns.map(n=><Dot key={n} x={x(0)} y={y(1/n)} />)}</Plot></Panel><Panel title="Derivative transition near the corner"><Plot label="Derivatives approach signs away from zero but remain zero there" domain={[-1,1]} range={[-1.2,1.2]} lines={ns.map((n,i)=>({label:`Derivative h′_${n}(x)`,points:samples(x=>x/Math.sqrt(x*x+1/n**2),-1,1),tone:['gold','blue','rose'][i]}))}>{({x,y})=><Dot x={x(0)} y={y(0)} />}</Plot></Panel></Compare>
    <Table title="The original parameterization fixes the certificate" headers={['n','Maximum value error','Derivative at 0']} rows={ns.map(n=>[n,1/n,0])} />
  </Figure>;
}

export function FunctionSeriesMajorantFigure() {
  const ks=integers(8), values=ks.map(k=>.5**k/k**2), majorants=ks.map(k=>1/k**2);
  return <Figure job="A42" title="Every function term fits below the same summable numeric majorant" caption="For |x|≤1, |x^k/k²|≤1/k². The displayed x=.5 contributions illustrate this common bound, but the inequality holds for the whole domain. After N=8, the entire numeric tail is at most 1/8; its limit to zero proves uniform and absolute convergence. Showing finitely many terms does not establish that tail bound.">
    <Compare><Panel title="Actual function terms at x=.5"><Bars label="First eight function-term magnitudes" values={values} labels={ks} maximum={1} /></Panel><Panel title="Majorants on the same magnitude scale"><Bars label="First eight common numeric majorants" values={majorants} labels={ks} maximum={1} /></Panel></Compare>
    <Line label="Whole remaining tail bounded by the integral allowance1over8" domain={[0,.15]} rows={[{a:0,b:1/8,label:'sum over every k > 8 ≤ 1/8',tone:'blue'}]} />
  </Figure>;
}

export function InteriorRadiusFigure() {
  return <Figure job="A43" title="An interior radius leaves geometric room for derivative factors" caption="The anatomy uses r=.5, s=.75 and R=1. Values at s supply a bounded coefficient sequence; inside r, the ratio r/s=2/3 makes k(r/s)^k summable and absorbs the derivative's factor k. The two boundary points ±R are separate questions. Circles locate nested radii; this summable majorant, not the circles alone, justifies differentiation on a compact interior interval.">
    <p>Rose R=1, gold s=.75, blue r=.5; both open rose endpoints ±R are separate boundary questions.</p>
    <Canvas label="Concentric radii with distinct boundary points" height={300}>
      {({width})=>{const cx=width/2,cy=135,unit=Math.min(110,(width-48)/2);return <>
        <line className="ra-axis" x1={cx-unit-12} x2={cx+unit+12} y1={cy} y2={cy} />
        {[1,.75,.5].map((r,i)=><circle key={r} cx={cx} cy={cy} r={unit*r} className={`ra-stroke ${['rose','gold','blue'][i]}`} fill="none"><title>{['R=1','s=.75','r=.5'][i]}</title></circle>)}
        <Dot x={cx-unit} y={cy} tone="rose" open /><Dot x={cx+unit} y={cy} tone="rose" open /><Label x={cx-unit} y={265}>−R</Label><Label x={cx+unit} y={265}>+R</Label><Dot x={cx} y={cy} /><Label x={cx} y={cy+25}>0</Label>
      </>;}}
    </Canvas>
    <Bars label="The derivative factor is dominated by a geometric ratio" values={integers(10).map(k=>k*(2/3)**k)} labels={integers(10)} maximum={1.4} yLabel="k(2/3)^k" />
  </Figure>;
}

export function SmoothNonanalyticFigure() {
  const f=x=>x===0?0:Math.exp(-1/x**2);
  return <Figure job="A45" title="The function is positive away from zero while every Taylor coefficient is zero" caption="The first curve uses output units up to .4. The near-zero view explicitly magnifies output to .000002, exposing positive values at ±.25 (about 1.12535e−7). Every Taylor polynomial at zero is identically zero. Floating underflow at still smaller x is an implementation limit, not a mathematical zero or a proof of infinite smoothness.">
    <Compare><Panel title="Global input [−1,1]"><Plot label="Smooth nonanalytic function and zero Taylor polynomial" domain={[-1,1]} range={[0,.4]} lines={[{label:'Function exp(−1/x²), assigned 0 at x=0',points:samples(f,-1,1,256)},{label:'Taylor polynomial: 0',points:[{x:-1,y:0},{x:1,y:0}],tone:'blue',dashed:true}]} /></Panel><Panel title="Near-zero magnification, true output values"><Plot label="Positive tiny values near zero with output magnification" domain={[-.275,.275]} range={[0,.000002]} lines={[{label:'Same smooth function, magnified output',points:samples(f,-.275,.275,256)},{label:'Taylor polynomial: 0',points:[{x:-.275,y:0},{x:.275,y:0}],tone:'blue',dashed:true}]}>{({x,y})=><><Dot x={x(-.25)} y={y(f(-.25))} /><Dot x={x(.25)} y={y(f(.25))} /></>}</Plot></Panel></Compare>
  </Figure>;
}

export function BernsteinMultiplyAddFigure() {
  return <Figure job="A47" title="Five addressed weight–value products accumulate the polynomial" caption="At n=4, x=1/2 and c=3/10, the weights sum to 1 and every node contributes. The polynomial is 21/80=.2625, target 1/5=.2 and error 1/16=.0625. This weighted average need not interpolate the target at an interior input.">
    <WeightedJoin label="Every Bernstein node feeding its product into one accumulator" nodes={[0,.25,.5,.75,1]} weights={[1/16,4/16,6/16,4/16,1/16]} weightText={['1/16','4/16','6/16','4/16','1/16']} values={[.3,.05,.2,.45,.7]} valueText={['3/10','1/20','1/5','9/20','7/10']} result={21/80} />
  </Figure>;
}

export function BernsteinMomentsFigure() {
  const weights=bernsteinWeights(4,.5),nodes=integers(5,0).map(k=>k/4);
  return <Figure job="A48" title="Positive node mass is centered at the evaluation input" caption="For n=4 and x=.5, the weighted mean of k/n is .5 and variance is x(1−x)/n=1/16. At x=0 or 1, all mass concentrates at that endpoint and the variance is zero. The finite binomial algebra establishes these identities; the bars illustrate them without adding a probability prerequisite.">
    <Bars label="All five node weights on a fixed mass scale0to1" values={weights} labels={nodes} maximum={1} yLabel="Node weight" />
    <Line label="Nodes and distances from the weighted mean" domain={[0,1]} rows={[{a:0,b:1,label:'all nodes k/4; weighted centre x=.5'}]} points={nodes.map((v,k)=>({value:v,label:`k=${k}`}))} />
    <Table title="Weighted finite moments" headers={['x','Total mass','Mean node','Variance']} rows={[[0,1,0,0],[.5,1,.5,1/16],[1,1,1,0]]} />
  </Figure>;
}

export function LipschitzCertificateFigure() {
  const n=100,c=.3,bound=.05, error=x=>Math.abs(bernsteinValue(x,n,c)-Math.abs(x-c));
  return <Figure job="A49" title="Weighted displacement controls the whole polynomial error" caption="For the corner target, L=1 and n=100 give the sufficient uniform bound 1/(2 sqrt(100))=.05. The blue curve is a finite sampled error; the rose horizontal allowance is analytic and applies to every x. Its proof uses the weighted displacement and Cauchy–Schwarz, not a grid maximum. A degree that misses this bound is not thereby proved to fail.">
    <Plot label="Observed Bernstein error under a separately proved uniform budget" domain={[0,1]} range={[0,.06]} yLabel="Absolute value error" lines={[{points:samples(error,0,1,200),tone:'blue'}]} background={({x,y})=><rect className="ra-area rose" x={x(0)} y={y(bound)} width={x(1)-x(0)} height={y(0)-y(bound)} />} />
    <p>Blue distances join each true node .1,.3,.5,.8 to the same rose point x=.4. Weighted distance ≤ sqrt(variance) ≤ 1/(2 sqrt(n)).</p>
    <Canvas label="Weighted node distances to the same selected input" height={180}>
      {({width})=>{const x=v=>16+(width-32)*v;return <>
        <line className="ra-axis" x1={x(0)} x2={x(1)} y1={55} y2={55} />
        {[.1,.3,.5,.8].map((v,i)=><g key={v}><Dot x={x(v)} y={55} /><path className="ra-stroke blue" d={`M${x(v)},${85+i*18}H${x(.4)}`} fill="none" /></g>)}
        <Dot x={x(.4)} y={55} tone="rose" /><Label x={x(.4)} y={30}>x</Label>
      </>;}}
    </Canvas>
  </Figure>;
}

export function BernsteinNearFarFigure() {
  const n=16,x0=.5,delta=.2,weights=bernsteinWeights(n,x0), nodes=integers(n+1,0).map(k=>k/n),far=weights.reduce((s,w,k)=>s+(Math.abs(nodes[k]-x0)>=delta?w:0),0);
  return <Figure job="A50" title="A near neighborhood and a small far-mass budget divide the proof" caption="Here n=16, x=.5 and delta=.2. Blue nodes satisfy strict distance below delta; rose nodes include equality and lie in the far set. The variance bound gives far mass at most .390625. For a general continuous bounded target, choose delta for an epsilon/2 local difference, then n so 2M times the far-mass bound is below epsilon/2.">
    <Plot label="All Bernstein node weights split by actual distance from x=.5" domain={[0,1]} range={[0,.22]} yLabel="Node weight" background={({x,y,top,bottom})=><rect className="ra-band" x={x(x0-delta)} y={top} width={x(x0+delta)-x(x0-delta)} height={bottom-top} />}>
      {({x,y})=>weights.map((w,k)=><g key={k}><line className={`ra-stroke ${Math.abs(nodes[k]-x0)<delta?'blue':'rose'}`} x1={x(nodes[k])} x2={x(nodes[k])} y1={y(0)} y2={y(w)} /><Dot x={x(nodes[k])} y={y(w)} tone={Math.abs(nodes[k]-x0)<delta?'blue':'rose'} /></g>)}
    </Plot>
    <Table title="Separate local continuity from tail mass" headers={['Piece','Mass or bound','Difference control']} rows={[[ 'Near actual mass',1-far,'epsilon/2 after choosing delta'],['Far actual mass',far,'at most 2M per node'],['Far variance allowance',.25/(n*delta*delta),'at most 2M times this mass']]} />
  </Figure>;
}

export function PolynomialQuestionsFigure() {
  const f=x=>Math.abs(x-.3), b=x=>bernsteinValue(x,4,.3),interpolate=x=>[.3,.05,.2,.45,.7].reduce((sum,v,k)=>sum+v*[0,.25,.5,.75,1].reduce((product,t,j)=>j===k?product:product*(x-t)/(k/4-t),1),0);
  return <Figure job="A51" title="Averaging, interpolation, and Taylor expansion ask different questions" caption="The gold Bernstein polynomial averages five node values and generally misses interior nodes. The rose degree-at-most-four interpolating polynomial passes through the five nodes; it has a different construction and no automatic uniform guarantee. Taylor expansion at the corner .3 is unavailable because the derivative is undefined there; no Taylor curve is invented.">
    <Plot label="One target with weighted averaging and actual node interpolation" domain={[0,1]} range={[0,.8]} lines={[{label:'Target |x−.3|',points:samples(f,0,1),tone:'blue'},{label:'Bernstein average: degree ≤4',points:samples(b,0,1)},{label:'Node interpolant: degree ≤4',points:samples(interpolate,0,1),tone:'rose'}]}>{({x,y})=>integers(5,0).map(k=><Dot key={k} x={x(k/4)} y={y(f(k/4))} tone="blue" />)}</Plot>
    <Table title="The construction determines the question" headers={['Route','Inputs','Promise here']} rows={[[ 'Bernstein degree ≤4','five target values','positive weighted approximation'],['Polynomial interpolation shown','five node values','matches these nodes'],['Taylor at .3','local derivatives','first derivative absent']]} />
  </Figure>;
}

export function ProbabilityMapsFigure() {
  const omega=['ω₁','ω₂','ω₃','ω₄'],u=[0,0,1,1],v=[0,1,0,1];
  return <Figure job="A52" title="Random-variable maps share a sample space; laws summarize their outputs" caption="Four equally weighted sample points feed two actual maps. Both have a half-mass at 0 and 1 and expectation 1/2, but their values disagree on two common outcomes. Laws discard this coupling. Lp convergence implies probability convergence by Markov; almost-sure convergence implies probability convergence with the measurable-integration hypotheses taught in the optional prerequisite. Neither law equality nor probability convergence alone supplies almost-sure convergence.">
    <p>Each outcome keeps mass 1/4. Both X and Y branch from that same outcome; neither is a function of the other.</p>
    {omega.map((o,i)=><div className="ra-wiring-row" key={o}><p>Outcome {o}; mass 1/4. Blue X={u[i]}; rose Y={v[i]}.</p>
      <Canvas label={`Outcome ${o} independently maps to X=${u[i]} and Y=${v[i]}`} width={650} height={200}>
        {({width})=>{const cx=width/2;return <>
          <Dot x={cx} y={30} /><Label x={cx} y={20}>{o}</Label>
          <path className="ra-axis" d={`M${cx},38V70H${width-35}M${cx},70H35`} />
          <Arrow x1={35} y1={70} x2={35} y2={120} tone="blue" /><Arrow x1={width-35} y1={70} x2={width-35} y2={120} tone="rose" />
          <Label x={35} y={155} tone="blue">X={u[i]}</Label><Label x={width-35} y={155} tone="rose">Y={v[i]}</Label>
        </>;}}
      </Canvas></div>)}
    <Compare><Panel title="Law of X"><Bars label="Half mass at 0 and 1 under X" values={[.5,.5]} labels={['0','1']} maximum={1} yLabel="Probability mass" /></Panel><Panel title="Law of Y"><Bars label="Identical half mass under Y with different coupling" values={[.5,.5]} labels={['0','1']} maximum={1} yLabel="Probability mass" /></Panel></Compare>
  </Figure>;
}

export function SameLawCouplingFigure() {
  return <Figure job="A53" title="The same two-atom law conceals alternating coupled values" caption="Let Z be −1 or 1 with equal probability and X_n=(−1)^n Z. Every marginal law equals the law of Z. On odd indices, |X_n−Z|=2 for both outcomes; on even indices it is 0. Thus these variables do not converge in probability to this Z, even though their laws agree. Opposite-parity pairs also fail the Cauchy-in-probability condition.">
    <Plot label="Two fixed outcomes with alternating mapped signs" domain={[1,8]} range={[-1.3,1.3]} xLabel="Index n" yLabel="Value on fixed outcome" lines={[-1,1].map((z,i)=>({label:`Fixed outcome Z=${z}`,points:integers(8).map(n=>({x:n,y:(-1)**n*z})),tone:i?'blue':'gold'}))}>{({x,y})=>[-1,1].flatMap((z,i)=>integers(8).map(n=><Dot key={`${z}-${n}`} x={x(n)} y={y((-1)**n*z)} tone={i?'blue':'gold'} />))}</Plot>
    <Compare><Panel title="Law at any even index"><Bars label="Two identical marginal atoms for even index" values={[.5,.5]} labels={['−1','+1']} maximum={1} yLabel="Probability" /></Panel><Panel title="Law at any odd index"><Bars label="Same two atoms despite reversed outcome assignment" values={[.5,.5]} labels={['−1','+1']} maximum={1} yLabel="Probability" /></Panel></Compare>
  </Figure>;
}

export function SummableBadEventsFigure() {
  const ks=integers(6);
  return <Figure job="A55" title="Selected indices carry a summable bad-event budget" caption="Convergence in probability lets each chosen n_k make its bad-event probability at most 2^−k. After K=4, the whole future budget is at most sum over k>4 of 2^−k=1/16. The union bound and that tail tending to zero prove that infinitely many selected bad events have probability zero. Independence is unnecessary; the conclusion concerns the selected subsequence.">
    <Bars label="First six geometric bad-event probability budgets" values={ks.map(k=>2**-k)} labels={ks.map(k=>`n_${k}`)} maximum={.5} yLabel="Probability allowance 2^−k" />
    <Line label="Every later selected bad event lies under one whole-tail union budget" domain={[0,.1]} rows={[{a:0,b:1/16,label:'K=4: union of all k>4 has probability ≤1/16',tone:'blue'}]} />
  </Figure>;
}

export function EscapingExpectationFigure() {
  return <Figure job="A56" title="Shrinking probability hides an expectation that does not shrink" caption="On the common uniform sample space, X_n=n on (0,1/n) and zero elsewhere. Every rectangle has area 1. For n>K, the same full area is above cutoff K, so the family's tail expectation cannot become uniformly small. The two views retain one common height scale; the second explicitly magnifies the shrinking horizontal support.">
    <Compare><Panel title="Common full sample space"><Plot label="Spikes n=2,4,8 on a common height and sample-space scale" domain={[0,1]} range={[0,9]} xLabel="Uniform outcome u" yLabel="X_n(u)" background={({x,y})=>[2,4,8].map((n,i)=><rect key={n} className={`ra-area ${['gold','blue','rose'][i]}`} x={x(0)} y={y(n)} width={x(1/n)-x(0)} height={y(0)-y(n)} ><title>{`n=${n}: height n, support (0,1/n), mean 1`}</title></rect>)}>{({x,y})=><><line className="ra-stroke muted dashed" x1={x(0)} x2={x(1)} y1={y(3)} y2={y(3)} /><Label x={x(.9)} y={y(3)-10}>K=3</Label></>}</Plot></Panel><Panel title="Horizontal zoom: same height units"><Plot label="n=8 spike magnified horizontally with cutoff unchanged" domain={[0,.15]} range={[0,9]} xLabel="Same outcome u" yLabel="Same X_n value" background={({x,y})=><rect className="ra-area rose" x={x(0)} y={y(8)} width={x(1/8)-x(0)} height={y(0)-y(8)} />} >{({x,y})=><line className="ra-stroke muted dashed" x1={x(0)} x2={x(.15)} y1={y(3)} y2={y(3)} />}</Plot></Panel></Compare>
<p className="ra-family-key">Gold: n=2; blue: n=4; rose: n=8. Heights and support widths use the plotted common coordinates.</p>
    <Table title="The whole-family tail test" headers={['n','Height','Probability','Mean','Tail mean at K=3']} rows={[2,4,8].map(n=>[n,n,1/n,1,n>3?1:0])} />
  </Figure>;
}

export function ExtraMomentFigure() {
  return <Figure job="A57" title="A common extra moment gives a uniform tail allowance" caption="The repair is X_n=sqrt(n) on (0,1/n). Its first moment is 1/sqrt(n), and its second moment is exactly 1 for every n. Taking delta=1 gives tail expectation at most 1/K uniformly. The common first moment bound alone did not protect the previous family; the positive extra power supplies the decay in K.">
    <Plot label="Repaired spikes with common second moment 1" domain={[0,.3]} range={[0,9]} xLabel="Uniform outcome u" yLabel="sqrt(n) on support" background={({x,y})=>[4,16,64].map((n,i)=><rect key={n} className={`ra-area ${['gold','blue','rose'][i]}`} x={x(0)} y={y(Math.sqrt(n))} width={x(1/n)-x(0)} height={y(0)-y(Math.sqrt(n))} ><title>{`n=${n}: height sqrt(n), support (0,1/n), second moment 1`}</title></rect>)} />
<p className="ra-family-key">Gold: n=4; blue: n=16; rose: n=64. Heights and support widths use the plotted common coordinates.</p>
    <Table title="A concrete whole-family certificate" headers={['n','Mean','Second moment','Tail allowance at K=4']} rows={[4,16,64].map(n=>[n,1/Math.sqrt(n),1,.25])} />
    <Bars label="Uniform tail allowances decay as cutoff grows" values={[1/2,1/4,1/8,1/16]} labels={['K=2','K=4','K=8','K=16']} maximum={.5} yLabel="Tail mean bound 1/K" />
  </Figure>;
}

export function TruncatedErrorFigure() {
  return <Figure job="A58" title="Two tails and one bounded core divide the L1 error" caption="For clipping T_K at ±K, |X_n−X| is bounded by |X_n−T_K X_n|, |T_K X_n−T_K X| and |T_K X−X|. The two tails become small by uniform integrability and limit integrability; the bounded middle becomes small from probability convergence. Choose K for the tails first, then n for the core. These illustrative .02+.025+.02 contributions fit an epsilon=.09 budget.">
    <Line label="Clipping thresholds and three connected actual values" domain={[-3,3]} rows={[{a:-2,b:2,label:'bounded core: clipping to [−K,K], K=2',tone:'blue'}]} points={[{value:-2,label:'−K',tone:'rose'},{value:2,label:'+K',tone:'rose'}]} />
    <p>Rose X_n tail .02, blue bounded core .025, rose X tail .02. Each is strictly below epsilon/3=.03; the common allowed length is epsilon=.09.</p>
    <Canvas label="Absolute error split into two tails and bounded core" height={160}>
      {({width})=>{const x=v=>16+(width-32)*v/.09;return <>
        {[{a:0,b:.02,c:'rose'},{a:.02,b:.045,c:'blue'},{a:.045,b:.065,c:'rose'}].map((p,i)=><g key={i}><rect className={`ra-area ${p.c}`} x={x(p.a)} y={40} width={x(p.b)-x(p.a)} height={40} /><Label x={x((p.a+p.b)/2)} y={115+(i%2)*22}>{i+1}</Label></g>)}
        <line className="ra-axis" x1={x(0)} x2={x(.09)} y1={88} y2={88} />
      </>;}}
    </Canvas>
  </Figure>;
}

export function DominatingEnvelopeFigure() {
  const envelope=u=>1/Math.sqrt(u), fn=(u,n)=>envelope(u)/(n+1);
  return <Figure job="A59" title="One integrable envelope controls every function and its tails" caption="On (0,1), Y(u)=u^−1/2 has expectation 2 and dominates Y/(n+1). Its tail expectation above K≥1 is 2/K. This fixed integrable envelope gives uniform integrability. The curves begin at u=.01 for plotting; the omitted interval (0,.01) is real and its envelope area is .2. Domination is sufficient, but uniform integrability need not produce one common dominator.">
    <Plot label="Several functions under a common integrable envelope with omitted origin marked" domain={[0,1]} range={[0,11]} xLabel="Outcome u; zero excluded" yLabel="Dominating value" lines={[{label:'Envelope Y(u)=u^(−1/2)',points:samples(envelope,.01,1,256),tone:'rose'},...[1,3,7].map((n,i)=>({label:`n=${n}: Y(u)/(n+1)`,points:samples(u=>fn(u,n),.01,1,256),tone:['gold','blue','muted'][i]}))]}>{({x,y})=><Arrow x1={x(.02)} y1={y(envelope(.02))} x2={x(.01)} y2={y(10)} tone="rose" />}</Plot>
    <Table title="The common tail, not a bounded envelope height" headers={['Cutoff K','Envelope tail expectation','Whole-family upper bound']} rows={[2,4,8,16].map(k=>[k,2/k,2/k])} />
  </Figure>;
}

export function ApproximationReportFigure() {
  const n=100,c=.3, weights=bernsteinWeights(n,.4),exactArea=integers(n+1,0).reduce((s,k)=>s+Math.abs(k/n-c),0)/(n+1);
  const grid=integers(101,0).map(i=>i/100),gridError=Math.max(...grid.map(x=>Math.abs(bernsteinValue(x,n,c)-Math.abs(x-c))));
  return <Figure job="A60" title="Attach each reported quantity to the curve or area it measures" caption="The target |x−.3| has exact area .29. The polynomial's exact basis-integral identity is the average of all 101 target node values; a finite grid supplies a different observed error. The proved sufficient uniform allowance is .05. Weight mass at the inspection input .4 is 1. These quantities answer separate questions and retain their distinct evidence.">
    <Plot label="Target and degree 100 Bernstein polynomial with analytic uniform band" domain={[0,1]} range={[-.06,.8]} lines={[{label:'Target |x−c|',points:samples(x=>Math.abs(x-c),0,1),tone:'blue'},{label:`Bernstein polynomial n=${n}`,points:samples(x=>bernsteinValue(x,n,c),0,1)}]} background={({x,y})=><polygon className="ra-area rose" points={[...samples(t=>Math.abs(t-c)+.05,0,1),...samples(t=>Math.abs(t-c)-.05,0,1).reverse()].map(p=>`${x(p.x)},${y(p.y)}`).join(' ')} />} />
    <Table title="A report keeps certificate, exact integral and sampled observation apart" headers={['Quantity','Value','Reason']} rows={[[ 'Uniform certificate',.05,'L/(2 sqrt(n)), L=1'],['Target area',.29,'two triangular areas'],['Polynomial area',exactArea,'average of all coefficients'],['101-point grid error',gridError,'observation on this grid'],['Node mass at x=.4',weights.reduce((a,b)=>a+b,0),'all 101 terms included']]} />
  </Figure>;
}

export function BPolyConstructionFigure() {
  const values=[.3,.05,.2,.45,.7];
  return <Figure job="A61" title="The same addressed coefficients feed the ordinary Bernstein-basis tool" caption="For n=4 and c=.3, the five node values form a (5,1) coefficient array for the one interval [0,1]. BPoly uses this Bernstein basis directly. It is the same polynomial as the scratch weighted sum, not an interpolant or from_derivatives construction. Each basis integrates to 1/5, so the exact integral is .34. Floating values and tool integrals are compared with a stated tolerance; extrapolation is disabled.">
    <p>Each blue target value f(k/4) becomes the same-address coefficient c[k,0]. Gold connections install those coefficients; rose connections join the common BPoly output.</p>
    <Canvas label="Five node coefficients feed their Bernstein slots and common output" width={700} height={460}>
      {({width})=>{const a=25,b=width*.53,bus=width-25;return <>
        {values.map((v,k)=><g key={k}><Dot x={a} y={40+k*65} tone="blue" /><Label x={a} y={65+k*65}>{k}</Label><Arrow x1={a+8} y1={40+k*65} x2={b-8} y2={40+k*65} /><Dot x={b} y={40+k*65} /><Label x={b} y={65+k*65}>{k}</Label><Arrow x1={b+8} y1={40+k*65} x2={bus} y2={40+k*65} tone="rose" /></g>)}
        <line className="ra-stroke rose" x1={bus} x2={bus} y1={40} y2={370} /><Dot x={bus} y={380} tone="rose" r={7} /><Label x={bus} y={415} anchor="end">BPoly</Label>
      </>;}}
    </Canvas><p>Coefficient shape (5,1), interval [0,1], value at .5 = .2625, integral = .34. Every coefficient is retained.</p><ol>{values.map((v,k)=><li key={k}>Row {k}: node {k}/4, target {fmt(v)}, coefficient [{k},0]={fmt(v)}.</li>)}</ol>
  </Figure>;
}

export function EvidenceKindsFigure() {
  return <Figure job="A62" title="A proof budget, a grid observation, and a witness support different decisions" caption="The degree 100 corner has sufficient bound .05: that is a whole-domain certificate. A grid maximum measures only its sample points. The n=64 unit triangle has an explicit off-grid witness at 1/64 with error 1 while a j/20 grid sees zero: that witness proves the grid missed the peak. Failing to meet a sufficient bound is only 'not certified by this bound', not proof of failure.">
    <Compare><Panel title="Certified whole-domain allowance"><Plot label="Corner target with proved degree 100 error allowance" domain={[0,1]} range={[0,.8]} lines={[{label:'Target |x−.3|',points:samples(x=>Math.abs(x-.3),0,1),tone:'blue'},{label:'Bernstein polynomial n=100',points:samples(x=>bernsteinValue(x,100,.3),0,1)}]} background={({x,y})=><polygon className="ra-area rose" points={[...samples(t=>Math.abs(t-.3)+.05,0,1),...samples(t=>Math.abs(t-.3)-.05,0,1).reverse()].map(p=>`${x(p.x)},${y(p.y)}`).join(' ')} />} /></Panel><Panel title="Grid observation contradicted by a true witness"><Plot label="Explicit off-grid triangle peak and observed zero samples" domain={[0,.05]} range={[0,1.1]} lines={[{points:triangle(64,1)}]}>{({x,y})=><><Dot x={x(0)} y={y(0)} tone="blue" /><Dot x={x(.05)} y={y(0)} tone="blue" /><Dot x={x(1/64)} y={y(1)} tone="rose" /><Label x={x(.025)} y={30}>error 1</Label></>}</Plot></Panel></Compare>
  </Figure>;
}

import { useId, useMemo, useState } from 'react';
import { bernsteinApproximation, cauchyBlock, derivativeFamily, dyadicBracket, inverseSquareSeries, powerFamily, sequenceTail, triangleFamily, typewriterInterval } from '../../data/real-analysis-models.js';
import './real-analysis-labs.css';
import './real-analysis-figures.css';
import { Bars, Canvas, Dot, Label, Line, Plot as GeometryPlot, Table, samples } from './RealAnalysisDrawings.jsx';
function number(value, digits = 5) {
  if (value === 0) return '0';
  if (Math.abs(value) < 0.0001 || Math.abs(value) >= 10000) return value.toExponential(3);
  return Number(value.toFixed(digits)).toString();
}
function Select({
  label,
  value,
  onChange,
  options
}) {
  return <label className="analysis-field"><span>{label}</span>
    <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>
  </label>;
}
function Range({
  label,
  value,
  onChange,
  min,
  max,
  step = 1
}) {
  return <label className="analysis-field"><span>{label}: <strong>{number(value)}</strong></span>
    <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
  </label>;
}
function Investigation({
  title,
  guidance,
  children,
  ledger,
  resetLabel,
  onReset
}) {
  return <section data-live-exploration className="analysis-lab" aria-label={title}>
    <p className="ra-figure-title">{title}</p><p>{guidance}</p>{children}
    <button type="button" onClick={onReset}>{resetLabel}</button>
    {ledger}
  </section>;
}
function Plot({ label, xRange, yRange, xLabel, yLabel, series=[], background, markers, children }) {
  return <GeometryPlot label={label} domain={xRange} range={yRange} xLabel={xLabel} yLabel={yLabel} lines={series.map(line=>({...line,tone:line.className||'gold'}))} background={background}>
    {geometry=><>{children?.(geometry)}{markers?.(geometry)}</>}
  </GeometryPlot>;
}
function Readout({
  label,
  children
}) {
  return <div className="analysis-readout"><span>{label}</span><strong>{children}</strong></div>;
}
export function SequenceTailLab() {
  const [denominator, setDenominator] = useState(10);
  const [index, setIndex] = useState(9);
  const state = sequenceTail(1, denominator, index);
  return <Investigation title="Choose where the entire safe tail starts" guidance="The error must be strictly below the requested tolerance. Inspect whether index 9 works at epsilon=1/10, then move the tail boundary." resetLabel="Reset sequence tail" onReset={() => {
    setDenominator(10);
    setIndex(9);
  }}>

    <Plot label="Forty sequence values with the tolerance band and proposed tail boundary" xRange={[1, 40]} yRange={[2.4, 3.6]} xLabel="Index n" yLabel="Estimate a_n" background={({
      x,
      y,
      top,
      bottom,
      right
    }) => <><rect className="band" x={x(1)} y={y(3 + state.tolerance)} width={right - x(1)} height={y(3 - state.tolerance) - y(3 + state.tolerance)} /><line className="rose dashed" x1={x(index)} x2={x(index)} y1={top} y2={bottom} /></>} markers={({
      x,
      y
    }) => state.values.map(point => <circle key={point.n} className={point.n < index ? 'muted-point' : point.error < state.tolerance ? 'blue-fill' : 'gold-fill'} cx={x(point.n)} cy={y(point.value)} r="2.4" />)} />
    <div className="analysis-controls"><Select label="Requested tolerance" value={denominator} onChange={value => setDenominator(Number(value))} options={[2, 5, 10, 20].map(value => [value, `1/${value}`])} /><Range label="Proposed start N" value={index} onChange={setIndex} min={1} max={25} /></div>
    <div className="analysis-readouts"><Readout label="First tail error">1/{index + 1}</Readout><Readout label="Smallest valid N">{state.minimumIndex}</Readout></div>
    <p className="analysis-result" aria-live="polite">{state.certifiesTail ? `Every later error is at most 1/${index + 1}, which is strictly below 1/${denominator}. This N certifies the tail.` : state.boundaryEquality ? 'The first tail term is exactly on the tolerance boundary. Equality does not satisfy a strict bound.' : 'The first tail term already exceeds the tolerance. This proposed N fails.'}</p>
    <p>Forty terms are shown. The proof covers the rest because 1/(n+1) decreases with n; the finite picture by itself does not.</p>
  </Investigation>;
}
export function CompletenessBracketLab() {
  const [target, setTarget] = useState(2);
  const [steps, setSteps] = useState(3);
  const state = dyadicBracket(target, steps);
  return <Investigation title="Keep a shrinking bracket around an unknown real number" guidance="Choose the half whose endpoint squares still enclose the target. Observe what one more step does to the guaranteed error." resetLabel="Reset exact bracket" onReset={() => {
    setTarget(2);
    setSteps(3);
  }} ledger={<Table title="Endpoint-square invariants and the error certificate" headers={['Left²','Target','Right²','Width','Midpoint error at most']} rows={[[state.leftSquared,target,state.rightSquared,`1/2^${steps}`,`1/2^${steps+1}`]]} />}>


    <Line label="Current exact root bracket on its original unit interval" domain={[Math.floor(Math.sqrt(target)),Math.floor(Math.sqrt(target))+1]} rows={[{a:state.left,b:state.right,label:`Closed bracket after ${steps} steps`}]} cut={Math.sqrt(target)} cutLabel="retained root" />
    <Line label="Explicit local magnification of the current dyadic bracket" domain={[state.left,state.right]} rows={[{a:state.left,b:state.right,label:'Local ruler: numerical width shrinks, camera magnifies'}]} points={[{value:(state.left+state.right)/2,label:'midpoint'}]} ticks={[state.left,state.right]} />

    <div className="analysis-controls"><Select label="Squared target" value={target} onChange={value => setTarget(Number(value))} options={[2, 3, 5].map(value => [value, `Positive √${value}`])} /><Range label="Bisection steps" value={steps} onChange={setSteps} min={0} max={16} /></div>
    <div className="analysis-step-controls"><button type="button" disabled={steps === 0} onClick={() => setSteps(value => value - 1)}>Previous bracket</button><button type="button" disabled={steps === 16} onClick={() => setSteps(value => value + 1)}>Bisect once</button></div>
    <div className="analysis-readouts"><Readout label="Exact left endpoint">{state.left.toFixed(steps)}</Readout><Readout label="Exact right endpoint">{state.right.toFixed(steps)}</Readout><Readout label="Exact width">1/2^{steps}</Readout><Readout label="Midpoint error at most">1/2^{steps + 1}</Readout></div>
    <p className="analysis-result">Rounded endpoint squares: {number(state.leftSquared, 9)} ≤ {target} ≤ {number(state.rightSquared, 9)}. The exact internal endpoint-square inequalities retain the real root. The endpoint decimals above terminate exactly because their denominators divide 2^{steps}; the squared decimals here are rounded for readability.</p>
  </Investigation>;
}
export function CauchyBlockLab() {
  const [n, setN] = useState(8);
  const [family, setFamily] = useState('harmonic');
  const state = cauchyBlock(n, family);
  return <Investigation title="Look beyond the next small step" guidance="Compare the next increment with the total from N+1 through 2N. Inspect whether the whole block becomes arbitrarily small." resetLabel="Reset Cauchy block" onReset={() => {
    setN(8);
    setFamily('harmonic');
  }} ledger={<Table title="Every increment in the selected block" headers={['k','Actual increment','Common harmonic lower bound']} rows={state.terms.map(t=>[t.k,t.value,family==='harmonic'?1/(2*n):'not used'])} />}>

    <Bars label="Actual increment magnitudes on a common zero-to-one-half scale" values={state.terms.map(t=>t.value)} labels={state.terms.map(t=>t.k)} maximum={.5} yLabel="Increment value" baseline={family==='harmonic'?1/(2*n):0} />
    <p>The vertical scale remains 0 to 1/2 across every N and both families. For the harmonic block, the rose lower-bound line is 1/(2N), applying to each of its N bars; N times that lower bound is 1/2.</p>

    <div className="analysis-controls"><Select label="Series increments" value={family} onChange={setFamily} options={[['harmonic', 'Harmonic: 1/k'], ['telescoping', 'Telescoping: 1/[k(k+1)]']]} /><Select label="Block begins after N" value={n} onChange={value => setN(Number(value))} options={[2, 4, 8, 16, 32].map(value => [value, value])} /></div>
    <div className="analysis-readouts"><Readout label="Next increment">{number(state.singleIncrement)}</Readout><Readout label="Whole block gap">{number(state.blockTotal)}</Readout></div>
    <p className="analysis-result">{family === 'harmonic' ? `There are N=${n} terms and each is at least 1/(2N). Their total is at least 1/2 for every N, even while the next step shrinks.` : `Cancellation gives exactly 1/${n + 1} − 1/${2 * n + 1}. The entire remaining infinite tail is 1/${n + 1}, which does tend to zero.`}</p>
  </Investigation>;
}
export function PowerConvergenceLab() {
  const [n, setN] = useState(8);
  const [domain, setDomain] = useState('closed-unit');
  const [fixedPoint, setFixedPoint] = useState(0.5);
  const end = domain === 'compact-subinterval' ? 0.75 : 1;
  const state = powerFamily(n, domain, 0.75, Math.min(fixedPoint, end));
  return <Investigation title="Fix one point, then let the difficult point move" guidance="A fixed input below 1 becomes easy. Inspect whether one N can make every input easy on the selected domain." resetLabel="Reset power convergence" onReset={() => {
    setN(8);
    setDomain('closed-unit');
    setFixedPoint(0.5);
  }}>

    <Plot label="Power curve with fixed input and an analytical moving witness" xRange={[0, 1]} yRange={[-.05, 1.1]} xLabel="Input x" yLabel="Value x^n" series={[{
      label: 'Current power',
      points: state.points
    }, {label:'Pointwise limit: zero on x<1; value 1 at closed endpoint',className:'blue dashed', points:[{x:0,y:0},{x:end,y:0}]}]} markers={({
      x,
      y
    }) => <>
      <circle className="blue-fill" cx={x(state.fixedPoint)} cy={y(state.fixedValue)} r="4" />
      {state.witnessInDomain && <circle className="rose-fill" cx={x(state.witness)} cy={y(0.5)} r="4" />}
      <circle className={domain === 'open-unit' ? 'open-point' : 'gold-fill'} cx={x(end)} cy={y(end ** n)} r="3.4" />
      <Dot x={x(end)} y={y(0)} tone="blue" open={domain!=='compact-subinterval'} />
      {domain==='closed-unit'&&<Dot x={x(1)} y={y(1)} tone="blue" />}
    </>} />
    <div className="analysis-controls"><Select label="Function domain" value={domain} onChange={value => {
        setDomain(value);
        setFixedPoint(point => Math.min(point, value === 'compact-subinterval' ? 0.75 : value === 'open-unit' ? 0.99 : 1));
      }} options={[['closed-unit', '[0,1] (closed)'], ['open-unit', '[0,1) (open)'], ['compact-subinterval', '[0,3/4] (compact)']]} /><Range label="Power index n" value={n} onChange={setN} min={1} max={64} /><Range label="Fixed input x" value={Math.min(fixedPoint, end)} onChange={setFixedPoint} min={0} max={domain === 'open-unit' ? 0.99 : end} step={0.01} /></div>
    <div className="analysis-readouts"><Readout label="Blue: fixed-point error">{number(state.fixedError)}</Readout><Readout label="Analytical supremum error">{number(state.supremumError)}</Readout></div>
    <p className="analysis-result">{domain === 'compact-subinterval' ? `Every error is at most (3/4)^${n}=${number(state.supremumError)}. The common bound approaches zero. The rose witness ${state.witnessInDomain ? 'still lies' : 'now lies outside'} this smaller domain.` : `The rose point moves to x_n=2^(−1/n)≈${number(state.witness)} and its error stays exactly 1/2. The supremum error is 1, approached near the endpoint but not attained.`}</p>
    <p>{domain === 'closed-unit' ? 'At x=1 the limiting value is 1, so that point has zero error; immediately to its left the pointwise limit is zero.' : 'The pointwise limit is zero everywhere in this domain.'} Gold is the calculated current curve; blue and rose are different ways of choosing an input.</p>
  </Investigation>;
}
export function MovingTriangleLab() {
  const [n, setN] = useState(64);
  const [scaling, setScaling] = useState('unit-height');
  const [grid, setGrid] = useState(20);
  const state = triangleFamily(n, scaling, grid);
  const height = state.height;
  return <Investigation title="Find the error that a coarse grid misses" guidance="A narrow triangle can fall between the sampled points. Inspect its actual height and area instead of treating a sampled zero as a guarantee." resetLabel="Reset moving triangle" onReset={() => {
    setN(64);
    setScaling('unit-height');
    setGrid(20);
  }} ledger={<><Plot label="Explicit vertical magnification of the same selected triangle" xRange={[0,2]} yRange={[0,height*1.1]} xLabel="Local coordinate u = n x" yLabel={`Value; magnified scale 0 to ${number(height*1.1)}`} series={[{points:[{x:0,y:0},{x:1,y:height},{x:2,y:0}]}]} markers={({x,y})=><Dot x={x(1)} y={y(height)} tone="rose" />} />
    <Bars label="Three amplitude choices on the same physical scale" values={[1,n,1/n]} labels={['height 1','height n','height 1/n']} maximum={256} yLabel="Actual magnitude; fixed 0 to 256" /></>}>

    <div className="analysis-pair">
      <Plot label="Exact full-domain triangle and deliberately coarse sample positions" xRange={[0, 1]} yRange={[0, 256]} xLabel="Full-domain x" yLabel="Function value" series={[{
        points: state.corners
      }]} markers={({
        x,
        y
      }) => state.samples.map((point, index) => <circle key={index} className="blue-fill" cx={x(point.x)} cy={y(point.y)} r="2.2" />)} />
      <Plot label="The same triangle in a labelled local coordinate" xRange={[0, 2]} yRange={[0, 256]} xLabel="Local coordinate u = n x" yLabel="Same function value" series={[{
        points: [{
          x: 0,
          y: 0
        }, {
          x: 1,
          y: height
        }, {
          x: 2,
          y: 0
        }]
      }]} markers={({
        x,
        y
      }) => <circle className="rose-fill" cx={x(1)} cy={y(height)} r="3.5" />} />
    </div>

    <div className="analysis-controls"><Select label="Triangle index n" value={n} onChange={value => setN(Number(value))} options={[4, 16, 64, 256].map(value => [value, value])} /><Select label="Triangle amplitude" value={scaling} onChange={setScaling} options={[['unit-height', 'T_n: height stays 1'], ['unit-area', 'n T_n: area stays 1'], ['shrinking-height', 'T_n/n: shrinking']]} /><Select label="Coarse grid intervals" value={grid} onChange={value => setGrid(Number(value))} options={[10, 20, 80].map(value => [value, value])} /></div>
    <div className="analysis-readouts"><Readout label="Sampled maximum">{number(state.sampledMaximum)}</Readout><Readout label="True supremum error">{number(height)}</Readout><Readout label="Integral / L1 error">{number(state.integral)}</Readout><Readout label="Squared L2 error">{number(state.squaredL2Error)}</Readout></div>
    <p className="analysis-result">The peak is at x=1/{n}; the support ends at x=2/{n}. {state.sampledMaximum === 0 ? 'Every coarse sample is zero, but the exact triangle is still present.' : 'This grid catches some of the triangle; its maximum still cannot certify all real inputs.'}</p>
    <p>The first two views use the same fixed vertical scale 0 to 256; the second changes only the horizontal coordinate to u=nx. The third explicitly magnifies the vertical scale so small peaks remain readable. The final three-bar comparison keeps actual amplitude differences on the fixed scale; it does not normalize peaks. Every fixed x eventually sees zero; a peak chosen separately for each n can remain large.</p>
  </Investigation>;
}
export function DerivativeConvergenceLab() {
  const [n, setN] = useState(4);
  const [power, setPower] = useState(1);
  const [point, setPoint] = useState(0);
  const state = derivativeFamily(n, power, point);
  const curves = useMemo(() => Array.from({
    length: 385
  }, (_, index) => {
    const x = -Math.PI + 2 * Math.PI * index / 384;
    return {
      x,
      ...derivativeFamily(n, power, x)
    };
  }), [n, power]);
  return <Investigation title="A small curve can retain a large slope" guidance="At x=0 the sine is zero for every n. Follow the slope there, then change the amplitude from 1/n to 1/n²." resetLabel="Reset derivative comparison" onReset={() => {
    setN(4);
    setPower(1);
    setPoint(0);
  }}>

    <div className="analysis-pair">
      <Plot label="Function values on a fixed vertical scale" xRange={[-Math.PI, Math.PI]} yRange={[-1, 1]} xLabel="Input x (radians)" yLabel="Function value" series={[{
        points: curves.map(value => ({
          x: value.x,
          y: value.value
        }))
      }]} background={({
        x,
        y,
        right
      }) => <rect className="band" x={x(-Math.PI)} y={y(state.functionBound)} width={right - x(-Math.PI)} height={y(-state.functionBound) - y(state.functionBound)} />} markers={({
        x,
        y
      }) => <circle className="blue-fill" cx={x(point)} cy={y(state.value)} r="3.5" />} />
      <Plot label="Derivative values on the same fixed numerical scale" xRange={[-Math.PI, Math.PI]} yRange={[-1, 1]} xLabel="Input x (radians)" yLabel="Derivative" series={[{
        className: 'rose',
        points: curves.map(value => ({
          x: value.x,
          y: value.derivative
        }))
      }]} background={({
        x,
        y,
        right
      }) => <rect className="band" x={x(-Math.PI)} y={y(state.derivativeBound)} width={right - x(-Math.PI)} height={y(-state.derivativeBound) - y(state.derivativeBound)} />} markers={({
        x,
        y
      }) => <circle className="blue-fill" cx={x(point)} cy={y(state.derivative)} r="3.5" />} />
    </div>
    <div className="analysis-controls"><Select label="Oscillation index n" value={n} onChange={value => setN(Number(value))} options={[1, 4, 8, 16].map(value => [value, value])} /><Select label="Amplitude rule" value={power} onChange={value => setPower(Number(value))} options={[[1, 'sin(nx)/n'], [2, 'sin(nx)/n²']]} /><Range label="Inspect x" value={point} onChange={setPoint} min={-3} max={3} step={0.1} /></div>
    <div className="analysis-readouts"><Readout label="Function error bound">{number(state.functionBound)}</Readout><Readout label="Derivative error bound">{number(state.derivativeBound)}</Readout><Readout label="Selected derivative">{number(state.derivative)}</Readout></div>
    <p className="analysis-result">{power === 1 ? 'The function converges uniformly to zero, but its derivative at zero is always 1. Function convergence alone cannot justify this derivative interchange.' : 'Both bounds approach zero, and the base value at x=0 is fixed at zero. The stronger derivative theorem applies.'}</p>
  </Investigation>;
}
export function SeriesEndpointLab() {
  const [n, setN] = useState(32);
  const [x, setX] = useState(1);
  const state = inverseSquareSeries(n, x);
  return <Investigation title="A function-series bound does not control its derivative" guidance="The same finite terms become larger when differentiated at x=1. Observe what changes when x moves into the interior." resetLabel="Reset series endpoint" onReset={() => {
    setN(32);
    setX(1);
  }} ledger={<Table title="Every finite term and its differentiated contribution" headers={['k','x^k/k²','x^(k−1)/k']} rows={Array.from({length:n},(_,i)=>[i+1,x**(i+1)/(i+1)**2,x**i/(i+1)])} />}>

    <div className="analysis-pair">
      <Bars label="All current function term values" values={Array.from({length:n},(_,i)=>x**(i+1)/(i+1)**2)} labels={Array.from({length:n},(_,i)=>i+1)} maximum={1} yLabel="Function term x^k/k²" />
      <Bars label="All differentiated finite term values on the same scale" values={Array.from({length:n},(_,i)=>x**i/(i+1))} labels={Array.from({length:n},(_,i)=>i+1)} maximum={1} yLabel="Derivative term x^(k−1)/k" />
    </div>

    <div className="analysis-controls"><Select label="Number of series terms" value={n} onChange={value => setN(Number(value))} options={[8, 32, 128, 512].map(value => [value, value])} /><Select label="Series evaluation point" value={x} onChange={value => setX(Number(value))} options={[[-1, '−1 (left endpoint)'], [-0.5, '−0.5 (interior)'], [0, '0 (centre)'], [0.5, '+0.5 (interior)'], [1, '+1 (right endpoint)']]} /></div>
    <div className="analysis-readouts"><Readout label="Finite function sum">{number(state.sum, 8)}</Readout><Readout label="Finite derivative sum">{number(state.derivativeSum, 8)}</Readout><Readout label="Uniform function tail bound">1/{n}</Readout></div>
    <p className="analysis-result">{x === 1 ? 'The derivative sum is harmonic here. It diverges even though the original function series converges uniformly on [−1,1]. The interior theorem does not include this endpoint.' : Math.abs(x) < 1 ? 'This point is strictly inside the radius. A smaller compact interval around it permits the derivative-series theorem. The displayed 1/n bound still belongs to the function, not the derivative.' : 'At −1 the derivative terms alternate and converge conditionally. That endpoint needs a separate argument; the two endpoints need not behave alike.'}</p>
    <p>The finite sum is shown, with a proved tail bound. No infinite value was inferred by drawing a smooth curve through a few partial sums.</p>
  </Investigation>;
}
export function BernsteinApproximationLab() {
  const [n, setN] = useState(16);
  const [corner, setCorner] = useState(0.3);
  const [point, setPoint] = useState(0.4);
  const state = bernsteinApproximation(n, point, corner);
  const curve = useMemo(() => Array.from({
    length: 101
  }, (_, index) => {
    const value = bernsteinApproximation(n, index / 100, corner);
    return {
      x: index / 100,
      y: value.approximation
    };
  }), [n, corner]);
  return <Investigation title="Build an approximation from nearby weighted values" guidance="The target has a corner, so a Taylor expansion there is unavailable. Explore how positive weights can still build a smooth polynomial approximation." resetLabel="Reset polynomial approximation" onReset={() => {
    setN(16);
    setCorner(0.3);
    setPoint(0.4);
  }} ledger={<><Bars label="All n+1 Bernstein weights at the current input" values={state.nodes.map(node=>node.weight)} labels={state.nodes.map(node=>node.k)} maximum={1} yLabel="Actual weight" />
    <Table title="Every node, weight, value and multiply-add contribution" headers={['k','k/n','Weight','Target value','Product']} rows={state.nodes.map(node=>[node.k,node.location,node.weight,node.value,node.weight*node.value])} /></>}>

    <Plot label="Corner target, calculated Bernstein polynomial and its analytical error band" xRange={[0, 1]} yRange={[-0.3, 1.1]} xLabel="Input x" yLabel="Target and polynomial" series={[{
      label: 'Target |x−c|',
      className: 'blue',
      points: [{
        x: 0,
        y: corner
      }, {
        x: corner,
        y: 0
      }, {
        x: 1,
        y: 1 - corner
      }]
    }, {
      label: `Bernstein polynomial n=${n}`,
      points: curve
    }]} background={({
      x,
      y
    }) => <polygon className="band" points={[{
      x: 0,
      y: corner + state.uniformBound
    }, {
      x: corner,
      y: state.uniformBound
    }, {
      x: 1,
      y: 1 - corner + state.uniformBound
    }, {
      x: 1,
      y: 1 - corner - state.uniformBound
    }, {
      x: corner,
      y: -state.uniformBound
    }, {
      x: 0,
      y: corner - state.uniformBound
    }].map(value => `${x(value.x)},${y(value.y)}`).join(' ')} />} markers={({
      x,
      y
    }) => <circle className="rose-fill" cx={x(point)} cy={y(state.approximation)} r="4" />} />

    <div className="analysis-controls"><Select label="Polynomial degree n" value={n} onChange={value => setN(Number(value))} options={[4, 16, 64, 100].map(value => [value, value])} /><Select label="Corner location c" value={corner} onChange={value => setCorner(Number(value))} options={[0.3, 0.5, 0.7].map(value => [value, value])} /><Range label="Weighted evaluation x" value={point} onChange={setPoint} min={0} max={1} step={0.01} /></div>
    <div className="analysis-readouts"><Readout label="Blue target at x">{number(state.target)}</Readout><Readout label="Gold weighted value">{number(state.approximation)}</Readout><Readout label="Actual selected error">{number(state.error)}</Readout><Readout label="Whole-interval bound">{number(state.uniformBound)}</Readout><Readout label="Polynomial integral">{number(state.integral,8)}</Readout><Readout label="Target integral">{number(state.targetIntegral,8)}</Readout><Readout label="Integral error">{number(state.integralError,8)}</Readout></div>
    <p className="analysis-result">The weights sum to {number(state.weightSum)} and their weighted node mean is {number(state.weightedMean)}. Since this target has Lipschitz constant 1, every error is at most 1/(2√{n}). The shaded band comes from that proof, not a sampled maximum.</p>
    <p>This bounded investigation evaluates finite polynomials numerically. It reuses the computed curve when only the inspection point changes. The native example verifies the weight identities with exact fractions.</p>
  </Investigation>;
}
export function TypewriterConvergenceLab() {
  const [block, setBlock] = useState(2);
  const [position, setPosition] = useState(0);
  const [observer, setObserver] = useState(0.5);
  const state = typewriterInterval(block, position, observer);
  return <Investigation title="A shrinking chance can keep revisiting one observer" guidance="Each block sweeps across [0,1) once. Inspect whether your fixed observer can eventually avoid every highlighted interval." resetLabel="Reset interval sweep" onReset={() => {
    setBlock(2);
    setPosition(0);
    setObserver(0.5);
  }} ledger={<Canvas bounded label="The full current dyadic block visits the same observer once" height={130+state.intervals*36}>
    {({width})=>{const left=42,right=width-25,x=v=>left+(right-left)*v;return <>
      {Array.from({length:state.intervals},(_,j)=>{const y=50+j*36;return <g key={j}><line className="ra-axis" x1={left} x2={right} y1={y} y2={y} /><line className={`ra-stroke ${j===position?'gold':'blue'}`} x1={x(j/state.intervals)} x2={x((j+1)/state.intervals)} y1={y} y2={y} /><Dot x={x(j/state.intervals)} y={y} /><Dot x={x((j+1)/state.intervals)} y={y} open /><Dot x={x(observer)} y={y} tone="rose" /><Label x={left-8} y={y+5} anchor="end">{j}</Label><Label x={right+8} y={y+5} anchor="start">{j===state.observerVisitPosition?1:0}</Label></g>;})}
    </>;}}
  </Canvas>}>

    <Line label="The selected half-open interval and the fixed observer" domain={[0,1]} rows={[{a:state.left,b:state.right,openRight:true,label:`Selected j=${position}; left included, right excluded`}]} points={[{value:observer,label:'fixed U',tone:'rose'}]} />

    <div className="analysis-controls"><Select label="Dyadic block k" value={block} onChange={value => {
        setBlock(Number(value));
        setPosition(0);
      }} options={[1, 2, 3, 4, 5].map(value => [value, value])} /><Range label="Interval position j" value={position} onChange={setPosition} min={0} max={2 ** block - 1} /><Select label="Fixed observer U" value={observer} onChange={value => setObserver(Number(value))} options={[[0, '0'], [0.25, '1/4'], [0.5, '1/2'], [0.75, '3/4']]} /></div>
    <div className="analysis-readouts"><Readout label="Global index n=2ᵏ+j">{state.n}</Readout><Readout label="Probability of value 1">1/{state.intervals}</Readout><Readout label="Value at this observer">{state.observed}</Readout><Readout label="Observer is hit at j">{state.observerVisitPosition}</Readout></div>
    <p className="analysis-result">Current interval: [{number(state.left)}, {number(state.right)}). Every block has exactly one interval containing this observer and other intervals that miss it. The per-index probability tends to zero, yet the fixed observer has infinitely many hits and misses.</p>
    <p>This is an exact dyadic construction, not a random simulation. The optional proof explains why the finite sweep represents a pattern across every block.</p>
  </Investigation>;
}
export function ContinuityDomainFigure() {
  return <figure className="analysis-inline" data-analysis-figure="continuity-domain"><div className="analysis-operation"><div><span>On [0,2]</span><strong>|x²−y²| ≤ 4|x−y|</strong><p>One input radius works everywhere in this bounded domain.</p></div><div><span>On the whole real line</span><strong>x=n, y=n+1/n</strong><p>Input gap 1/n → 0; output gap 2+1/n² → 2.</p></div></div><figcaption>The function is continuous in both settings. The domain determines whether one common input radius suffices.</figcaption></figure>;
}
export function UniformErrorPathFigure() {
  return <figure className="analysis-inline" data-analysis-figure="uniform-error-path"><ol className="analysis-proof-path"><li><strong>f(x) → f_N(x)</strong><span>Uniform approximation: less than ε/3</span></li><li><strong>f_N(x) → f_N(a)</strong><span>Continuity of one fixed f_N: less than ε/3</span></li><li><strong>f_N(a) → f(a)</strong><span>Uniform approximation: less than ε/3</span></li></ol><figcaption>Choose N first, then choose δ for that fixed continuous function. The three errors together stay below ε.</figcaption></figure>;
}

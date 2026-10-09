import { useState } from 'react';
import { FlowLab, FlowControls, FlowReadout, flowNumber } from "../LessonFlow.jsx";
import { GaussianDrawing, GaussianQuantity } from "./GaussianScalarFigures.jsx";
import { gaussianDetails } from "./gaussian-geometry-models.mjs";
import { scalarMixture, scalarMixtureMoments } from "./gaussian-mixture-models.mjs";

const LEFT = '#8abcb8', RIGHT = '#8eaee0', SUM = '#e9b94c', INK = '#deded8', REFERENCE = '#85858b';
const number = value => value !== 0 && Math.abs(value) < 1e-5 ? value.toExponential(8).replace('-', '−') : flowNumber(value, 12);
const curve = (calculate, scaleX, scaleY) => Array.from({ length: 241 }, (_, index) => {
  const x = -6 + index / 20;
  return `${index ? 'L' : 'M'}${scaleX(x)},${scaleY(calculate(x))}`;
}).join(' ');
const Arrow = ({ points, color = INK }) => {
  const [lastX, lastY] = points.at(-1), [previousX, previousY] = points.at(-2);
  const angle = Math.atan2(lastY - previousY, lastX - previousX);
  const backX = lastX - 8 * Math.cos(angle), backY = lastY - 8 * Math.sin(angle);
  return <g fill="none" stroke={color}>
    <polyline points={points.map(point => point.join(',')).join(' ')} />
    <path d={`M${backX + 4 * Math.sin(angle)},${backY - 4 * Math.cos(angle)} L${lastX},${lastY} L${backX - 4 * Math.sin(angle)},${backY + 4 * Math.cos(angle)}`} />
  </g>;
};

export function GaussianMixtureGenerator() {
  return <GaussianDrawing id="D14" title="One hidden source choice generates one observed measurement" width={800} adaptive
    height={width => width < 650 ? 875 : 660}
    description="Constructed generating model: Left has mean minus two, Right mean two, both variance one and chance one half. Shared parameters remain outside the repeated-observation bracket. One outlined hidden selector chooses a branch, then that branch draws the filled observed x. Branch densities are real Gaussian curves on identical coordinate rulers; this diagram does not add two draws or show measured counts.">
    {width => {
      const stacked = width < 650;
      const branches = [{ id: 'Left', mean: -2, color: LEFT, x: stacked ? width / 2 : width / 4, base: 380 },
        { id: 'Right', mean: 2, color: RIGHT, x: stacked ? width / 2 : width * 3 / 4, base: stacked ? 630 : 380 }];
      const observedY = stacked ? 780 : 540;
      return <>
        <text x="25" y="25" fill={LEFT}>Left: μ −2, variance 1</text>
        <text x="25" y="52" fill={RIGHT}>Right: μ 2, variance 1</text>
        <text x="25" y="79">Source weights: 0.5 / 0.5</text>
        <path d={`M25,110 H10 V${observedY + 60} H25`} stroke={REFERENCE} fill="none" />
        <text x="30" y="128">One observation</text>
        <circle cx={width / 2} cy="170" r="23" fill="none" stroke={INK} />
        <text x={width / 2} y="175" textAnchor="middle">z</text>
        <text x={width / 2 + 32} y="175">hidden</text>
        {branches.map((branch, index) => {
          const scaleX = x => branch.x + x * (stacked ? Math.min(20, (width - 65) / 12) : 14);
          const scaleY = density => branch.base - density * 185;
          return <g key={branch.id} data-generating-branch={branch.id}>
            <Arrow color={branch.color} points={stacked ? [[width / 2 - 23, 170], [35 + index * 15, 170], [35 + index * 15, branch.base - 130], [branch.x, branch.base - 130]] : [[width / 2,193],[width / 2,210],[branch.x,210],[branch.x,branch.base - 130]]} />
            <text x={branch.x} y={branch.base - 107} textAnchor="middle" fill={branch.color}>{branch.id} · chance 0.5</text>
            <text x={branch.x} y={branch.base - 84} textAnchor="middle">draw from this Gaussian</text>
            <path d={curve(x => gaussianDetails(x, branch.mean, 1).density, scaleX, scaleY)} fill="none" stroke={branch.color} strokeWidth="2" strokeDasharray={index ? '7 4' : undefined} />
            <line x1={scaleX(-6)} x2={scaleX(6)} y1={branch.base} y2={branch.base} stroke={REFERENCE} />
            {[-6,-2,2,6].map(x => <g key={x}><line x1={scaleX(x)} x2={scaleX(x)} y1={branch.base} y2={branch.base + 5} stroke={REFERENCE} /><text x={scaleX(x)} y={branch.base + 25} textAnchor="middle">{x}</text></g>)}
            <text x={branch.x} y={branch.base + 50} textAnchor="middle">coordinate units</text>
            <Arrow color={branch.color} points={stacked ? [[branch.x,branch.base + 60],[width - 35 - index * 15,branch.base + 60],[width - 35 - index * 15,observedY],[width / 2 + 7,observedY]] : [[branch.x,branch.base + 60],[branch.x,observedY],[width / 2 + (index ? 7 : -7),observedY]]} />
          </g>;
        })}
        <circle cx={width / 2} cy={observedY} r="6" fill={INK} />
        <text x={width / 2} y={observedY + 32} textAnchor="middle">observed x</text>
        <text x="30" y={observedY + 87}>One chosen source supplies x.</text>
      </>;
    }}
  </GaussianDrawing>;
}

function MixtureCurves({ id, state, baseline = false }) {
  const maximum = baseline ? 0.43 : 0.23;
  return <GaussianDrawing id={id} title="Weighted density contributions add at the same coordinate" width={740} height={600} adaptive
    description={`Query ${state.query}; Left weight ${state.weights[0]}, Right weight ${state.weights[1]}. Left weighted height ${state.components[0].weightedDensity}, Right ${state.components[1].weightedDensity}, sum ${state.density} per unit. Left solid teal, Right dashed blue, sum amber. Common ruler minus six to six and common density scale. ${baseline ? 'Dotted grey is the fixed one-half/one-half mixture.' : 'Each weighted curve has full-line area one half; the finite window omits tails.'}`}>
    {width => {
      const scaleX = x => 55 + (x + 6) * (width - 85) / 12;
      const scaleY = density => 335 - density / maximum * 225;
      const queryX = scaleX(state.query);
      return <>
        <text x="20" y="24" fill={LEFT}>Left · solid · area {number(state.weights[0])}</text>
        <text x="20" y="49" fill={RIGHT}>Right · dashed · area {number(state.weights[1])}</text>
        <text x="20" y="74" fill={SUM}>Sum · amber · full-line area 1</text>
        <text x="55" y="100">Density per coordinate unit</text>
        {[0, baseline ? 0.2 : 0.1, baseline ? 0.4 : 0.2].map(value => <g key={value}>
          <line x1="50" x2="55" y1={scaleY(value)} y2={scaleY(value)} stroke={REFERENCE} />
          <text x="43" y={scaleY(value) + 5} textAnchor="end">{value}</text>
        </g>)}
        <line x1="55" x2="55" y1="110" y2="335" stroke={REFERENCE} />
        {state.components.map((component, index) => <g key={component.id} data-weighted-component={component.id}>
          <path d={curve(x => component.weight * gaussianDetails(x, component.mean, component.standardDeviation).density, scaleX, scaleY)} fill="none" stroke={index ? RIGHT : LEFT} strokeWidth="2" strokeDasharray={index ? '7 4' : undefined} />
          <line data-contribution-stem={component.id} x1={queryX} x2={queryX} y1="335" y2={scaleY(component.weightedDensity)} stroke={index ? RIGHT : LEFT} strokeDasharray={index ? '7 4' : undefined} />
        </g>)}
        {baseline && <path data-fixed-mixture="true" d={curve(x => scalarMixture(x).density, scaleX, scaleY)} fill="none" stroke={REFERENCE} strokeDasharray="2 4" />}
        <path data-mixture-curve="true" d={curve(x => scalarMixture(x, state.weights[0]).density, scaleX, scaleY)} fill="none" stroke={SUM} strokeWidth="2" />
        <path d={`M${queryX},${scaleY(state.density) - 6} l6,6 l-6,6 l-6,-6 Z`} fill={SUM} />
        <line x1="55" x2={width - 30} y1="335" y2="335" stroke={REFERENCE} />
        {(width < 500 ? [-6,-3,0,3,6] : [-6,-4,-2,0,2,4,6]).map(x => <g key={x}><line x1={scaleX(x)} x2={scaleX(x)} y1="335" y2="340" stroke={REFERENCE} /><text x={scaleX(x)} y="360" textAnchor="middle">{x}</text></g>)}
        <text x="55" y="389">◇ query x = {number(state.query)}</text>
        {state.components.map((component, index) => {
          const x = width / 4 + index * width / 2;
          return <g key={component.id} data-height-port={component.id}>
            <text x={x} y="423" textAnchor="middle" fill={index ? RIGHT : LEFT}>{component.id} at this x</text>
            <text data-weighted-height={component.id} x={x} y="452" textAnchor="middle" fill={index ? RIGHT : LEFT}>{number(component.weightedDensity)}</text>
            <Arrow color={index ? RIGHT : LEFT} points={[[x,465],[x,499],[width / 2 + (index ? 18 : -18),499]]} />
          </g>;
        })}
        <circle cx={width / 2} cy="499" r="18" fill="none" stroke={SUM} />
        <text x={width / 2} y="504" textAnchor="middle" fill={SUM}>+</text>
        <Arrow color={SUM} points={[[width / 2,517],[width / 2,540]]} />
        <text data-mixture-density={state.density} x={width / 2} y="568" textAnchor="middle" fill={SUM}>{number(state.density)} / unit</text>
        {baseline && <text x="20" y="595" fill={REFERENCE}>Dotted: fixed 0.5 / 0.5 mixture</text>}
      </>;
    }}
  </GaussianDrawing>;
}

export function GaussianWeightedCurveSum() {
  return <MixtureCurves id="D15" state={scalarMixture(2)} />;
}

export function GaussianChooseVersusAverage() {
  const moments = scalarMixtureMoments();
  return <GaussianDrawing id="D16" title="Selecting one draw and averaging two independent draws have different dependency graphs" width={800} height={890} adaptive
    description="Constructed source means minus two and plus two, each variance one. Mixture selects one source, gives mean zero, within-source variance one and between-source variance four, total five. Average takes independent draws from both, multiplies each by one half and adds; mean zero and variance one quarter plus one quarter, total one half.">
    {width => {
      const leftX = width / 4, rightX = width * 3 / 4, center = width / 2;
      return <>
        <text x="20" y="25">Choose one source</text>
        <circle cx={center} cy="70" r="22" fill="none" stroke={INK} />
        <text x={center} y="75" textAnchor="middle">z</text>
        {[[leftX, 'Left', LEFT], [rightX, 'Right', RIGHT]].map(([x, id, color]) => <g key={id}>
          <Arrow color={color} points={[[center,92],[center,110],[x,110],[x,145]]} />
          <text x={x} y="169" textAnchor="middle" fill={color}>{id} draw</text>
          <circle cx={x} cy="190" r="4" fill={color} />
          <Arrow color={color} points={[[x,195],[x,250],[center + (id === 'Left' ? -6 : 6),250]]} />
        </g>)}
        <circle cx={center} cy="250" r="5" fill={INK} />
        <text x={center} y="282" textAnchor="middle">One selected x</text>
        <text x="20" y="324">Mean {moments.mean}</text>
        <text x="20" y="351">Within variance {moments.within}</text>
        <text x="20" y="378">Between variance {moments.between}</text>
        <text x="20" y="405" fill={SUM}>Total variance {moments.variance}</text>
        <text x="20" y="453">Average two independent draws</text>
        {[[leftX, 'Left', LEFT], [rightX, 'Right', RIGHT]].map(([x, id, color]) => <g key={id}>
          <text x={x} y="494" textAnchor="middle" fill={color}>{id} draw</text>
          <circle cx={x} cy="517" r="4" fill={color} />
          <Arrow color={color} points={[[x,522],[x,554]]} />
          <circle cx={x} cy="577" r="23" fill="none" stroke={color} />
          <text x={x} y="582" textAnchor="middle">× ½</text>
          <Arrow color={color} points={[[x,600],[x,648],[center + (id === 'Left' ? -20 : 20),648]]} />
        </g>)}
        <circle cx={center} cy="648" r="20" fill="none" stroke={SUM} />
        <text x={center} y="653" textAnchor="middle" fill={SUM}>+</text>
        <Arrow color={SUM} points={[[center,668],[center,698]]} />
        <circle cx={center} cy="703" r="5" fill={INK} />
        <text x={center} y="734" textAnchor="middle">Averaged x</text>
        <text x="20" y="775">Mean ½(−2) + ½(2) = 0</text>
        <text x="20" y="804">Variance ¼(1) + ¼(1) = 0.5</text>
        <text x="20" y="849">Both draws supply the average.</text>
      </>;
    }}
  </GaussianDrawing>;
}

export function GaussianMixtureWeightLab() {
  const [state, setState] = useState({ leftWeight: 0.5, query: 2 });
  const [reset, setReset] = useState(0);
  const mixture = scalarMixture(state.query, state.leftWeight);
  return <FlowLab id="gmm-d17" label="Change a mixing weight and the coordinate where density is evaluated">
    <MixtureCurves id="D17" state={mixture} baseline />
    <FlowControls key={reset}>
      <GaussianQuantity name="Left source weight" value={state.leftWeight} min={0} max={1} step={0.05} onChange={leftWeight => setState(prior => ({ ...prior, leftWeight }))} />
      <GaussianQuantity name="Query x" value={state.query} min={-6} max={6} step={0.25} onChange={query => setState(prior => ({ ...prior, query }))} />
      <button type="button" onClick={() => { setState({ leftWeight: 0.5, query: 2 }); setReset(previous => previous + 1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>At x = <strong>{number(state.query)}</strong>, Left contributes <strong>{number(mixture.components[0].weightedDensity)}</strong> and Right contributes <strong>{number(mixture.components[1].weightedDensity)}</strong> per unit. Their sum is <strong>{number(mixture.density)}</strong> per unit. The full-line areas are <strong>{number(mixture.weights[0])}</strong> and <strong>{number(mixture.weights[1])}</strong>, still totaling one. {state.leftWeight === 0 || state.leftWeight === 1 ? 'The zero-weight source keeps its name and contributes zero.' : 'Changing the weights leaves both source centres and variances fixed.'}</FlowReadout>
  </FlowLab>;
}

export { Arrow as MixtureArrow };
export const gaussianMixtureColours = Object.freeze({ left: LEFT, right: RIGHT, sum: SUM, ink: INK, reference: REFERENCE });

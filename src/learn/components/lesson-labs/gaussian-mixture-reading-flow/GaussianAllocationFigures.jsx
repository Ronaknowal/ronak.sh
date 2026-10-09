import { useState } from 'react';
import { FlowLab, FlowControls, FlowReadout, flowNumber } from "../LessonFlow.jsx";
import { GaussianDrawing, GaussianQuantity } from "./GaussianScalarFigures.jsx";
import { MixtureArrow, gaussianMixtureColours } from "./GaussianMixtureFigures.jsx";
import { gaussianDetails } from "./gaussian-geometry-models.mjs";
import { scalarMixture, overlappingAllocationRows, identicalGaussianComparison } from "./gaussian-mixture-models.mjs";

const { left: LEFT, right: RIGHT, sum: SUM, ink: INK, reference: REFERENCE } = gaussianMixtureColours;
const number = value => value !== 0 && Math.abs(value) < 1e-5 ? value.toExponential(8).replace('-', '−') : flowNumber(value, 9);

function ShareStrip({ x, y, width, shares, role }) {
  return <g data-share-strip={role} data-left-share={shares[0]} data-right-share={shares[1]}>
    <rect x={x} y={y} width={width * shares[0]} height="13" fill={LEFT} />
    <rect x={x + width * shares[0]} y={y} width={width * shares[1]} height="13" fill={RIGHT} />
    <line x1={x} x2={x + width} y1={y + 19} y2={y + 19} stroke={REFERENCE} />
    {[0,0.25,0.5,0.75,1].map(value => <g key={value}>
      <line x1={x + width * value} x2={x + width * value} y1={y + 19} y2={y + 24} stroke={REFERENCE} />
      <text x={x + width * value} y={y + 45} textAnchor="middle">{value}</text>
    </g>)}
  </g>;
}

export function GaussianCommonDenominator() {
  const state = scalarMixture(2);
  return <GaussianDrawing id="D18" title="One total density feeds both allocation divisions" width={820} height={705} adaptive
    description={`Constructed query two, Left and Right means minus two and two, variances one, weights one half. Weighted heights ${state.components[0].weightedDensity} and ${state.components[1].weightedDensity} feed one sum ${state.density}. The same total branches into both division operations. Shares ${state.components[0].share} and ${state.components[1].share} add to one on a fixed zero-to-one strip. Density units cancel.`}>
    {width => {
      const center = width / 2, left = width / 4, right = width * 3 / 4;
      return <>
        <text x="20" y="24">One query: x = 2</text>
        {state.components.map((component, index) => {
          const x = index ? right : left, color = index ? RIGHT : LEFT;
          return <g key={component.id} data-numerator-source={component.id}>
            <text x={x} y="65" textAnchor="middle" fill={color}>{component.id} height / unit</text>
            <text data-allocation-numerator={component.weightedDensity} x={x} y="95" textAnchor="middle" fill={color}>{number(component.weightedDensity)}</text>
            <circle cx={x} cy="115" r="3" fill={color} />
            <MixtureArrow color={color} points={[[x,115],[x,160],[center + (index ? 20 : -20),160]]} />
            <MixtureArrow color={color} points={[[x,115],[x + (index ? 50 : -50),115],[x + (index ? 50 : -50),375],[x + (index ? 20 : -20),375]]} />
          </g>;
        })}
        <circle cx={center} cy="160" r="20" fill="none" stroke={SUM} />
        <text x={center} y="165" textAnchor="middle" fill={SUM}>+</text>
        <MixtureArrow color={SUM} points={[[center,180],[center,213]]} />
        <text x={center} y="243" textAnchor="middle" fill={SUM}>Same total / unit</text>
        <text data-common-denominator={state.density} x={center} y="271" textAnchor="middle" fill={SUM}>{number(state.density)}</text>
        <line x1={center} x2={center} y1="284" y2="315" stroke={SUM} />
        <circle cx={center} cy="315" r="3" fill={SUM} />
        {[left,right].map((x,index) => <g key={index} data-shared-denominator-branch={index ? 'Right' : 'Left'}>
          <MixtureArrow color={SUM} points={[[center,315],[x,315],[x,355]]} />
          <circle cx={x} cy="375" r="20" fill="none" stroke={INK} />
          <text x={x} y="380" textAnchor="middle">÷</text>
          <MixtureArrow color={index ? RIGHT : LEFT} points={[[x,395],[x,425]]} />
          <text x={x} y="452" textAnchor="middle" fill={index ? RIGHT : LEFT}>{index ? 'Right share' : 'Left share'}</text>
          <text data-allocation-result={state.components[index].share} x={x} y="480" textAnchor="middle" fill={index ? RIGHT : LEFT}>{number(state.components[index].share)}</text>
        </g>)}
        <text x="20" y="527">Together: one observation's mass</text>
        <ShareStrip x={55} y={553} width={width - 85} shares={state.components.map(component => component.share)} role="normalized" />
        <text x="20" y="625">Left solid colour; Right blue</text>
        <text x="20" y="653">Both ratios use the same total.</text>
        <text x="20" y="681">Shares have no density units.</text>
      </>;
    }}
  </GaussianDrawing>;
}

export function GaussianAllocationRows() {
  const rows = overlappingAllocationRows();
  const sums = [0,1].map(column => rows.reduce((total, row) => total + row.components[column].share, 0));
  return <GaussianDrawing id="D19" title="Four observed rows allocate separately between two component columns" width={760} height={670} adaptive
    description="Separately constructed overlapping model: means minus one and one, both variances one and weights one half. Observation IDs A B C D stay with measurements minus two, minus one, one, two. Each row's Left/Right shares sum to one. Each component's column sum is two across the four observations, which is not another per-row probability. All magnitude bars share zero-to-one scales.">
    {width => {
      const span = (width - 80) / 2, columns = [25, width / 2 + 15];
      return <>
        <text x="20" y="24">Closer centres: −1 and +1</text>
        {rows.map((row, index) => {
          const y = 67 + index * 133;
          return <g key={row.id} data-allocation-row={row.id} data-observation-query={row.query}>
            <text x="20" y={y}>Observation {row.id}: x = {row.query}</text>
            {row.components.map((component, column) => <g key={component.id} data-responsibility-cell={component.id} data-share={component.share}>
              <text x={columns[column]} y={y + 29} fill={column ? RIGHT : LEFT}>{component.id}: {number(component.share)}</text>
              <line x1={columns[column]} x2={columns[column] + span} y1={y + 48} y2={y + 48} stroke={REFERENCE} />
              <line x1={columns[column]} x2={columns[column] + span * component.share} y1={y + 48} y2={y + 48} stroke={column ? RIGHT : LEFT} strokeWidth="9" />
              {[0,0.25,0.5,0.75,1].map(value => <g key={value}><line x1={columns[column] + span * value} x2={columns[column] + span * value} y1={y + 55} y2={y + 60} stroke={REFERENCE} /><text x={columns[column] + span * value} y={y + 79} textAnchor="middle">{value}</text></g>)}
            </g>)}
            <text data-row-share-sum={row.components[0].share + row.components[1].share} x="20" y={y + 108}>Row sum: 1</text>
          </g>;
        })}
        <text x="20" y="622">Sum over the four observations</text>
        <text data-column-share-sum={sums[0]} x="25" y="652" fill={LEFT}>Left: {number(sums[0])}</text>
        <text data-column-share-sum={sums[1]} x={width / 2 + 15} y="652" fill={RIGHT}>Right: {number(sums[1])}</text>
      </>;
    }}
  </GaussianDrawing>;
}

export function GaussianRareMembershipLab() {
  const [query, setQuery] = useState(2), [reset, setReset] = useState(0);
  const selected = scalarMixture(query), reference = scalarMixture(8);
  return <FlowLab id="gmm-d20" label="Compare how common an observation is with which source dominates its density">
    <GaussianDrawing id="D20" title="A decisive conditional share can accompany very small density" width={780} height={910} adaptive
      description={`Same constructed model, means minus two and two, variances one, weights one half. Selected query ${query} has log density ${selected.logDensity} and Right share ${selected.components[1].share}. Fixed reference eight has log density ${reference.logDensity} and Right share ${reference.components[1].share}; its Left complement remains ${reference.components[0].share}. Positions share one coordinate ruler; log densities share a separate minus35-to-zero ruler, and normalized shares share zero-to-one bars.`}>
      {width => {
        const coordinate = x => 55 + (x + 10) / 20 * (width - 85), logScale = x => 55 + (x + 35) / 35 * (width - 85);
        return <>
          <text x="20" y="25">◇ selected x = {number(query)}</text>
          <path d={`M${coordinate(query)},49 l6,6 l-6,6 l-6,-6 Z`} fill={SUM} />
          <line x1={coordinate(query)} x2={coordinate(query)} y1="61" y2="85" stroke={SUM} />
          <line x1="55" x2={width - 30} y1="85" y2="85" stroke={REFERENCE} />
          {[-10,-5,0,5,10].map(x => <g key={x}><line x1={coordinate(x)} x2={coordinate(x)} y1="85" y2="90" stroke={REFERENCE} /><text x={coordinate(x)} y="110" textAnchor="middle">{x}</text></g>)}
          <circle cx={coordinate(8)} cy="139" r="6" fill="none" stroke={INK} />
          <line x1={coordinate(8)} x2={coordinate(8)} y1="116" y2="133" stroke={INK} />
          <text x="20" y="176">○ fixed reference x = 8</text>
          <text x="20" y="203">Coordinates in the same units</text>
          <text x="20" y="247">Log density in these units</text>
          {[{ state: selected, name: 'Selected', y: 285 }, { state: reference, name: 'Fixed reference', y: 385 }].map(({ state, name, y }, index) => <g key={name} data-log-density-role={index ? 'reference' : 'selected'} data-log-density={state.logDensity}>
            <line x1="55" x2={width - 30} y1={y} y2={y} stroke={REFERENCE} />
            {[-35,-25,-15,-5,0].map(x => <text key={x} x={logScale(x)} y={y + 25} textAnchor="middle">{x}</text>)}
            {index ? <circle cx={logScale(state.logDensity)} cy={y} r="5" fill="none" stroke={INK} /> : <path d={`M${logScale(state.logDensity)},${y - 6} l6,6 l-6,6 l-6,-6 Z`} fill={SUM} />}
            <text x="20" y={y + 59}>{name}: {number(state.logDensity)}</text>
          </g>)}
          {[{ state: selected, name: 'Selected', y: 485 }, { state: reference, name: 'Fixed reference', y: 685 }].map(({ state, name, y }) => <g key={name}>
            <text x="20" y={y}>{name}: conditional shares</text>
            <ShareStrip x={55} y={y + 25} width={width - 85} shares={state.components.map(component => component.share)} role={name === 'Selected' ? 'selected' : 'reference'} />
            <text x="20" y={y + 100} fill={LEFT}>Left: {number(state.components[0].share)}</text>
            <text x="20" y={y + 129} fill={RIGHT}>Right: {number(state.components[1].share)}</text>
          </g>)}
          <text x="20" y="869">Density and share answer</text>
          <text x="20" y="895">two different questions.</text>
        </>;
      }}
    </GaussianDrawing>
    <FlowControls key={reset}>
      <GaussianQuantity name="Query x" value={query} onChange={setQuery} min={-10} max={10} step={0.25} />
      <button type="button" onClick={() => { setQuery(2); setReset(previous => previous + 1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>The selected query's log density is <strong>{number(selected.logDensity)}</strong>, compared with <strong>{number(reference.logDensity)}</strong> at the fixed x = 8. Its Right share is <strong>{number(selected.components[1].share)}</strong>. A share compares sources for this observation; it does not measure how common the observation is.</FlowReadout>
  </FlowLab>;
}

function AllocationBells({ width, offset, state, baseline, title, role }) {
  const scaleX = x => 55 + (x + 6) * (width - 85) / 12, scaleY = height => offset + 335 - height / 0.43 * 200;
  const curve = calculate => Array.from({ length: 241 }, (_, index) => {
    const x = -6 + index / 20;
    return `${index ? 'L' : 'M'}${scaleX(x)},${scaleY(calculate(x))}`;
  }).join(' ');
  const contribution = (x, component) => component.weight * gaussianDetails(x, component.mean, component.standardDeviation).density;
  return <g data-allocation-bells={role} data-current-query={state.query} data-left-variance={state.variances[0]}>
    <text x="20" y={offset + 25}>{title}</text>
    <text x="20" y={offset + 52} fill={LEFT}>Left: μ {state.means[0]}, v {number(state.variances[0])}, weight {state.weights[0]}</text>
    <text x="20" y={offset + 79} fill={RIGHT}>Right: μ {state.means[1]}, v {state.variances[1]}, weight {state.weights[1]}</text>
    <text x="20" y={offset + 107}>◇ shared query x = {number(state.query)}</text>
    <text x="55" y={offset + 132}>Weighted density / unit</text>
    <text x={width - 30} y={offset + 132} textAnchor="end" fill={SUM}>sum</text>
    <line x1="55" x2="55" y1={offset + 140} y2={offset + 335} stroke={REFERENCE} />
    {[0,0.2,0.4].map(value => <text key={value} x="43" y={scaleY(value) + 5} textAnchor="end">{value}</text>)}
    {state.components.map((component, index) => <path key={component.id} d={curve(x => contribution(x, component))} fill="none" stroke={index ? RIGHT : LEFT} strokeDasharray={index ? '7 4' : undefined} strokeWidth="2" />)}
    <path d={curve(x => state.components.reduce((total, component) => total + contribution(x, component), 0))} fill="none" stroke={SUM} strokeWidth="2" />
    {baseline && <path data-variance-baseline="true" d={curve(x => scalarMixture(x).density)} fill="none" stroke={REFERENCE} strokeDasharray="2 4" />}
    <line x1={scaleX(state.query)} x2={scaleX(state.query)} y1={scaleY(state.density)} y2={offset + 335} stroke={SUM} />
    <path d={`M${scaleX(state.query)},${scaleY(state.density) - 6} l6,6 l-6,6 l-6,-6 Z`} fill={SUM} />
    <line x1="55" x2={width - 30} y1={offset + 335} y2={offset + 335} stroke={REFERENCE} />
    {[-6,-3,0,3,6].map(x => <text key={x} x={scaleX(x)} y={offset + 360} textAnchor="middle">{x}</text>)}
    {state.components.map((component, index) => <g key={component.id} data-spread-numerator={component.id} data-weighted-density={component.weightedDensity}>
      <text x={width / 4 + index * width / 2} y={offset + 399} textAnchor="middle" fill={index ? RIGHT : LEFT}>{component.id} height / unit</text>
      <text x={width / 4 + index * width / 2} y={offset + 426} textAnchor="middle" fill={index ? RIGHT : LEFT}>{number(component.weightedDensity)}</text>
    </g>)}
    <ShareStrip x={55} y={offset + 453} width={width - 85} shares={state.components.map(component => component.share)} role={role} />
    <text x="20" y={offset + 529} fill={LEFT}>Left share: {number(state.components[0].share)}</text>
    <text x="20" y={offset + 556} fill={RIGHT}>Right share: {number(state.components[1].share)}</text>
    {baseline && <>
      <text x="20" y={offset + 585} fill={REFERENCE}>Dotted: Left variance 1 reference</text>
      <text data-baseline-left-share={baseline.components[0].share} x="20" y={offset + 612} fill={REFERENCE}>Reference Left share: {number(baseline.components[0].share)}</text>
    </>}
  </g>;
}

export function GaussianSpreadShareLab() {
  const [state, setState] = useState({ query: 0, leftVariance: 4 }), [reset, setReset] = useState(0);
  const spread = scalarMixture(state.query, 0.5, state.leftVariance), baseline = scalarMixture(state.query), identical = identicalGaussianComparison(state.query);
  return <FlowLab id="gmm-d21" label="Compare a changed source spread with sources whose densities coincide">
    <GaussianDrawing id="D21" title="Spread changes a source's conditional share; identical sources retain their mixing shares" width={780} height={1290} adaptive
      description={`Upper spread example: means minus two and two, weights one half, Left variance ${state.leftVariance}, Right variance one. Shared query ${state.query}; Left share ${spread.components[0].share}, equal-variance reference ${baseline.components[0].share}. Lower distinct comparison: both means zero, variances one, weights .2 and .8. Same query, constant shares .2 and .8. The Left variance control changes only the upper example. Both full models and zero-to-one share scales remain visible.`}>
      {width => <>
        <AllocationBells width={width} offset={0} state={spread} baseline={baseline} title="Different source spreads" role="spread" />
        <AllocationBells width={width} offset={663} state={identical} title="Identical source densities" role="identical" />
        <text x="20" y="1265">Same density: shares follow weights.</text>
      </>}
    </GaussianDrawing>
    <FlowControls key={reset}>
      <GaussianQuantity name="Shared query x" value={state.query} min={-4} max={4} step={0.25} onChange={query => setState(previous => ({ ...previous, query }))} />
      <GaussianQuantity name="Left variance in upper example" value={state.leftVariance} min={0.25} max={4} step={0.25} onChange={leftVariance => setState(previous => ({ ...previous, leftVariance }))} />
      <button type="button" onClick={() => { setState({ query: 0, leftVariance: 4 }); setReset(previous => previous + 1); }}>Reset</button>
    </FlowControls>
    <FlowReadout>At the shared x = <strong>{number(state.query)}</strong>, upper Left share is <strong>{number(spread.components[0].share)}</strong>, compared with <strong>{number(baseline.components[0].share)}</strong> under equal variances. The lower identical-density comparison retains shares <strong>{number(identical.components[0].share)}</strong> and <strong>{number(identical.components[1].share)}</strong>; the upper variance control does not change its parameters.</FlowReadout>
  </FlowLab>;
}

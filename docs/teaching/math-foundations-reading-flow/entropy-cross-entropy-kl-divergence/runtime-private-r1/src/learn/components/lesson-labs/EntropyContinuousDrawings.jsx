import { useState } from 'react';
import { uniformCoordinates } from '../../data/entropy-reading-models.js';
import { Figure, Drawing, Arrow, Axis, Curve, Mark, Table, Controls, Range, Choice, Key, COLORS, number } from './EntropyDrawingElements.jsx';
function UniformPanel({
  state,
  factor = 1,
  bins = null
}) {
  const u = factor === 1 ? state.original : state.transformed,
    unit = factor === 1 ? 'm' : 'cm',
    height = 155 / (state.width * 8),
    span = Math.max(1, state.width),
    width = state.width / span * 390;
  return <div><p><strong>{unit === 'm' ? 'Metres' : 'Centimetres'}</strong>: support [0,{number(u.width)}], density {number(u.density)} per {unit}.</p><Drawing label={`Uniform density in ${unit}. Width ${u.width}, density ${u.density}; highlighted middle half has probability one half.`} height={270}><Axis xLabel={unit} yLabel={`density / ${unit}`} xDomain={[0, factor * span]} yDomain={[0, 8 / factor]} y={210} height={155} /><rect x="45" y={210 - height} width={width} height={height} fill={COLORS[0]} fillOpacity=".15" stroke={COLORS[0]} /><rect x={45 + width / 4} y={210 - height} width={width / 2} height={height} fill={COLORS[0]} fillOpacity=".6" />{bins && Array.from({
        length: bins + 1
      }, (_, i) => <line key={i} x1={45 + width * i / bins} x2={45 + width * i / bins} y1={210 - height} y2={210} stroke="#ddd" strokeWidth={i % 4 === 0 ? 1.4 : .6} />)}<text x="45" y="240">0</text><text x="435" y="240" textAnchor="end">{factor * span}</text><text x="17" y="64">{number(8 / factor)}</text></Drawing><p>Middle-half endpoints: {u.event.map(v => number(v)).join(' to ')} {unit}; width × density = .5. Differential entropy h = {number(u.entropy, 6)} bits.</p></div>;
}
export function UniformLab() {
  const [width, setWidth] = useState(.25),
    [scale, setScale] = useState(100),
    s = uniformCoordinates(width, scale, 4);
  return <Figure id="E38" title="Investigate a coordinate change of the same uniform law"><UniformPanel state={s} /><UniformPanel state={s} factor={scale} /><p>The horizontal ruler scales by {scale}; the vertical density ruler scales by its reciprocal. The shaded event has probability .5 in both coordinate systems.</p><Controls onReset={() => {
      setWidth(.25);
      setScale(100);
    }}><Range label="Physical support width in metres" value={width} onChange={setWidth} min={.125} max={4} step={.125} /><Choice label="Comparison coordinate unit" value={String(scale)} onChange={v => setScale(+v)} options={[["1", "Metres — identity change"], ["100", "Centimetres — 100 per metre"]]} /></Controls></Figure>;
}
export function QuantizationLab() {
  const [width, setWidth] = useState(.25),
    [scale, setScale] = useState(100),
    [bins, setBins] = useState(4),
    s = uniformCoordinates(width, scale, bins),
    u = s.transformed;
  return <Figure id="E39" title="Investigate finite bins of one physical interval"><p>The full-support detail below always shows the same physical interval; its x ruler follows the chosen unit.</p><Drawing label={`${bins} equal physical bins, each with probability ${1 / bins}; ticks are grouped when there are more than eight bins.`} height={220}><rect x="45" y="35" width="390" height="105" fill={COLORS[0]} fillOpacity=".18" stroke={COLORS[0]} />{Array.from({
        length: bins + 1
      }, (_, i) => <g key={i}><line x1={45 + i / bins * 390} x2={45 + i / bins * 390} y1="35" y2="140" stroke="#bbb" strokeWidth="1" />{(bins <= 8 || i % 4 === 0 || i === bins) && <text x={45 + i / bins * 390} y="175" textAnchor="middle">{i}</text>}</g>)}</Drawing><p>Boundary labels are bin indices, 0…{bins}. Physical width is {number(u.width)} {scale === 1 ? 'm' : 'cm'}; each Δ={number(u.binWidth)} has mass 1/{bins}.</p><div className="en-steps"><span>H(bins) = log₂{bins} = {number(s.binEntropy)}</span>=<span>h {number(u.entropy)}</span>−<span>log₂Δ {number(Math.log2(u.binWidth))}</span></div><p>This identity is exact for the uniform density. Changing units changes h and log₂Δ by the same amount.</p><details><summary>Inspect all bin boundaries and masses</summary><Table caption={`Every physical bin in ${scale === 1 ? 'metres' : 'centimetres'}`} headers={['Bin', 'Left boundary', 'Right boundary', 'Probability']} rows={Array.from({
        length: bins
      }, (_, i) => [i, number(i * u.binWidth), number((i + 1) * u.binWidth), number(s.binMass)])} /></details><Controls onReset={() => {
      setWidth(.25);
      setScale(100);
      setBins(4);
    }}><Range label="Bin count" value={bins} onChange={setBins} min={2} max={32} step={1} /><Range label="Physical width in metres" value={width} onChange={setWidth} min={.125} max={4} step={.125} /><Choice label="Bin boundary units" value={String(scale)} onChange={v => setScale(+v)} options={[["1", "Metres"], ["100", "Centimetres"]]} /></Controls></Figure>;
}
const normal = (x, mu, sd) => Math.exp(-.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
export function DensityKL() {
  return <Figure id="E40" title="Both densities and the integration width transform">{[1, 100].map(scale => <div key={scale}><p>{scale === 1 ? 'Original x coordinate' : 'New coordinate u=100x'}; density units divide by {scale}.</p><Drawing label={`Two Gaussian densities transformed by scale ${scale}, with a selected interval corresponding to original x from one half to one`} height={255}><Axis xLabel={scale === 1 ? 'x' : 'u'} yLabel="density" xDomain={[-5 * scale, 5 * scale]} yDomain={[0, .45 / scale]} /><Curve points={Array.from({
          length: 101
        }, (_, i) => [(-5 + i / 10) * scale, normal(-5 + i / 10, 0, 1) / scale])} xDomain={[-5 * scale, 5 * scale]} yDomain={[0, .45 / scale]} /><Curve points={Array.from({
          length: 101
        }, (_, i) => [(-5 + i / 10) * scale, normal(-5 + i / 10, 1, 2) / scale])} xDomain={[-5 * scale, 5 * scale]} yDomain={[0, .45 / scale]} color={COLORS[1]} dash /><rect x={45 + 5.5 / 10 * 390} y="40" width={.5 / 10 * 390} height="150" fill="#ddd" fillOpacity=".1" stroke="#ddd" /><text x="45" y="220">{-5 * scale}</text><text x="240" y="220" textAnchor="middle">0</text><text x="435" y="220" textAnchor="end">{5 * scale}</text><text x="12" y="39">{number(.45 / scale, 5)}</text></Drawing></div>)}<Key labels={['P: Normal(0,1²)', 'Q: Normal(1,2²)']} /><Table caption="At the matching point x=1 and u=100" headers={['Quantity', 'Original', 'Transformed']} rows={[["P density", number(normal(1, 0, 1)), number(normal(1, 0, 1) / 100)], ['Q density', number(normal(1, 1, 2)), number(normal(1, 1, 2) / 100)], ['Density ratio', number(normal(1, 0, 1) / normal(1, 1, 2)), number(normal(1, 0, 1) / normal(1, 1, 2))], ['Integration width', 'dx', 'du=100 dx']]} /><p>The ratio is unchanged; density and integration width cancel their scale factors. KL stays ln2−¼=.443147 nats.</p></Figure>;
}
export function EmpiricalContinuous() {
  return <Figure id="E41" title="Point mass and smooth density live on different measures"><Drawing label="Three empirical point masses sit on a smooth continuous density curve. Finite density at those points does not assign positive probability to that finite set." height={260}><Axis xLabel="observation coordinate" yLabel="density / point masses" /><Curve points={Array.from({
        length: 101
      }, (_, i) => [-3 + i * .06, normal(-3 + i * .06, 0, 1)])} xDomain={[-3, 3]} yDomain={[0, .5]} />{[-1, 0, 1].map((x, i) => <g key={x}><Arrow x1={45 + (x + 3) / 6 * 390} y1={190} x2={45 + (x + 3) / 6 * 390} y2={65} color={COLORS[i]} /><Mark x={45 + (x + 3) / 6 * 390} y={65} index={i} /><text x={45 + (x + 3) / 6 * 390} y="220" textAnchor="middle">{x}</text></g>)}</Drawing><p>Arrows denote atoms of probability ⅓ each; their drawn height is not a density value. The smooth curve is a continuous density.</p><Table caption="The same finite event S={−1,0,1}" headers={['Law', 'Probability of S']} rows={[["Empirical point-mass law", 1], ['Continuous Gaussian law', 0]]} /><p>KL from the empirical law to the continuous law is infinite. Evaluating finite −log density at each sample is a different calculation: it is a finite density score, not that discrete-to-continuous KL.</p></Figure>;
}

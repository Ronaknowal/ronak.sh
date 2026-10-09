import { useState } from 'react';
import { FlowLab, FlowControls, FlowChoice, FlowReadout } from './LessonFlow.jsx';
import { Drawing, Arrow, paperHues, channelHues } from './MessagePassingFlowElements.jsx';
import { ownNeighborTrace, transformedPoolTrace, directionTrace, orderedNeighborTrace, graphMemoryTrace, aggregationNumber as num } from '../../data/message-aggregation-flow-models.js';
import { AggregationQuantity, AggregationOccurrenceSelect, useSageNeighborhood, usePoolingNeighborhood } from './MessagePassingAggregationState.jsx';
import './message-aggregation-flow.css';
export { MessagePassingAggregationProvider } from './MessagePassingAggregationState.jsx';

const inputHue = '#82d3ed', resultHue = '#c1a4f5', parameterHue = '#e4b752';
const center = (y, text, hue = '#eee') => <text x="144" y={y} textAnchor="middle" fill={hue}>{text}</text>;
function Operation({ x = 144, y, text, width = 160, height = 46 }) {
  return <g><rect x={x - width / 2} y={y} width={width} height={height} rx="5" stroke="#ddd" fill="#101010" /><text x={x} y={y + height / 2 + 6} textAnchor="middle">{text}</text></g>;
}
function Value({ x, y, value, label, hue = resultHue, radius = 34 }) {
  return <g><text x={x} y={y - radius - 16} textAnchor="middle" fill={hue}>{label}</text><circle cx={x} cy={y} r={radius} fill="#101010" stroke={hue} strokeWidth="2" /><text x={x} y={y + 6} textAnchor="middle" fill={hue}>{num(value, 3)}</text></g>;
}
function Product({ first, second, firstLabel, secondLabel, title, output, label }) {
  return <Drawing width={288} height={238} label={label ?? `${title}: multiply ${first} by ${second} to get ${output}`}>
    <Value x={64} y={79} value={first} label={firstLabel} /><Value x={224} y={79} value={second} label={secondLabel} />
    <Arrow x1={64} y1={118} x2={121} y2={161} /><Arrow x1={224} y1={118} x2={167} y2={161} />
    <circle cx="144" cy="177" r="24" fill="#101010" stroke="#ddd" /><text x="144" y="183" textAnchor="middle">×</text>
    {center(229, `${title} = ${num(output, 4)}`, resultHue)}
  </Drawing>;
}
function ExactSageRows({ trace }) {
  return <table className="mp-aggregation-values"><caption>Current SAGE values</caption><thead><tr><th>Named input</th><th>Value</th></tr></thead><tbody>
    <tr><th>Own receiver</th><td>{num(trace.own, 12)}</td></tr>{trace.neighbors.map((value, i) => <tr key={i}><th style={{ color: paperHues[i] }}>Occurrence o{i}</th><td>{num(value, 12)}</td></tr>)}
    <tr><th>Neighbor mean</th><td>{num(trace.mean, 12)}</td></tr><tr><th>Own product</th><td>{num(trace.self, 12)}</td></tr><tr><th>Neighbor product</th><td>{num(trace.neighbor, 12)}</td></tr><tr><th>Combined state</th><td>{num(trace.output, 12)}</td></tr>
  </tbody></table>;
}
function OccurrenceMean({ trace, selected }) {
  const sumY = trace.count ? 65 + trace.count * 68 : 100;
  return <Drawing width={288} height={sumY + 204} label={`SAGE incoming occurrences ${trace.neighbors.join(', ')}, sum ${trace.sum}, count ${trace.count}, mean ${trace.mean}`}>
    {center(25, 'Incoming occurrences')}
    {trace.count === 0 && center(53, 'No incoming occurrences')}
    {trace.neighbors.map((value, i) => <g key={i}>
      <circle cx="30" cy={59 + i * 68} r="20" fill="#101010" stroke={selected === i ? '#fff' : paperHues[i]} strokeWidth={selected === i ? 3 : 2} />
      <text x="30" y={65 + i * 68} textAnchor="middle" fill={paperHues[i]}>o{i}</text>
      <text x="76" y={65 + i * 68} fill={paperHues[i]}>h = {num(value, 3)}</text>
      <Arrow x1={226} y1={59 + i * 68} x2={260} y2={59 + i * 68} hue={paperHues[i]} />
    </g>)}
    {trace.count > 0 && <><path d={`M260,59V${sumY}`} stroke="#aaa" fill="none" strokeWidth="2" /><Arrow x1={260} y1={sumY} x2={175} y2={sumY} /></>}
    <circle cx="144" cy={sumY} r="25" fill="#101010" stroke="#ddd" /><text x="144" y={sumY + 6} textAnchor="middle">Σ</text>
    {center(sumY + 49, `sum = ${num(trace.sum, 3)}`, resultHue)}
    <Arrow x1={144} y1={sumY + 58} x2={144} y2={sumY + 80} />
    <Operation y={sumY + 86} text={trace.count ? `÷ count ${trace.count}` : 'empty → zero'} width={190} />
    <Arrow x1={144} y1={sumY + 138} x2={144} y2={sumY + 160} />
    {center(sumY + 193, `neighbor mean = ${num(trace.mean, 4)}`, resultHue)}
  </Drawing>;
}
function SageMap({ own, trace }) {
  const value = own ? trace.own : trace.mean, weight = own ? trace.selfWeight : trace.neighborWeight, product = own ? trace.self : trace.neighbor;
  return <Drawing width={288} height={285} label={`${own ? 'Own' : 'Neighbor'} branch: ${value} times coefficient ${weight} gives ${product}`}>
    <Value x={144} y={75} value={value} label={own ? 'Own receiver hᵥ' : 'Neighbor mean h̄ᵥ'} hue={own ? inputHue : resultHue} />
    <Arrow x1={144} y1={114} x2={144} y2={166} />
    <text x="194" y="145" fill={parameterHue}>{own ? 'Wself' : 'Wnbr'}</text><text x="194" y="169" fill={parameterHue}>= {num(weight, 3)}</text>
    <circle cx="144" cy="197" r="24" stroke="#ddd" fill="#101010" /><text x="144" y="203" textAnchor="middle">×</text>
    {center(270, `${own ? 'own' : 'neighbor'} product = ${num(product, 4)}`, resultHue)}
  </Drawing>;
}
function SageMerge({ trace }) {
  return <Drawing width={288} height={240} label={`Add own product ${trace.self} and neighbor product ${trace.neighbor} to get ${trace.output}`}>
    <Value x={64} y={80} value={trace.self} label="Own product" /><Value x={224} y={80} value={trace.neighbor} label="Neighbor" />
    <Arrow x1={64} y1={119} x2={120} y2={158} /><Arrow x1={224} y1={119} x2={168} y2={158} />
    <circle cx="144" cy="176" r="25" stroke="#ddd" fill="#101010" /><text x="144" y="182" textAnchor="middle">+</text>
    {center(233, `new state = ${num(trace.output, 4)}`, resultHue)}
  </Drawing>;
}
function SageSentence({ trace }) {
  return <FlowReadout data-sage-output={trace.output}>Own {num(trace.own, 9)} contributes {num(trace.selfWeight, 9)} × {num(trace.own, 9)} = {num(trace.self, 9)}.
    The {trace.count} incoming occurrences sum to {num(trace.sum, 9)}, giving mean {num(trace.mean, 9)} and neighbor contribution {num(trace.neighbor, 9)}.
    The combined state is <strong>{num(trace.output, 9)}</strong>.{trace.count === 0 && ' The zero summary leaves the own branch intact.'}</FlowReadout>;
}
function useSageTrace() {
  const context = useSageNeighborhood();
  const raw = ownNeighborTrace(context.sage.own, context.sage.neighbors, context.sage.selfWeight, context.sage.neighborWeight);
  return { ...context, trace: { ...raw, mean: raw.pooled, self: raw.selfTerm, neighbor: raw.neighborTerm } };
}

export function MessagePassingSageIntro() {
  const { trace } = useSageTrace();
  return <figure data-mp-drawing="D13"><div className="mp-aggregation-grid"><OccurrenceMean trace={trace} /><SageMap own trace={trace} /><SageMap trace={trace} /><SageMerge trace={trace} />
    <Drawing width={288} height={248} label="Equivalent concatenation uses the same separate own and neighbor coefficients">
      {center(28, 'Equivalent concatenation')}{center(66, `[own, mean] = [${num(trace.own, 3)}, ${num(trace.mean, 3)}]`, inputHue)}
      <Arrow x1={144} y1={80} x2={144} y2={108} /><Operation y={114} text="dot with coefficient row" width={260} />
      {center(184, `coefficients [${num(trace.selfWeight, 3)}, ${num(trace.neighborWeight, 3)}]`, parameterHue)}{center(232, `result = ${num(trace.output, 3)}`, resultHue)}
    </Drawing></div><SageSentence trace={trace} /><figcaption>Occurrence hues follow o0–o5, including equal-valued copies; white marks selection. Parameters are amber and the combined state is violet. No self-loop is added. Both input blocks of the concatenated map give these same two products.</figcaption></figure>;
}
export function MessagePassingSageOwnLab() {
  const { sage, trace, revision, resize, edit, resetSage } = useSageTrace();
  return <FlowLab id="sage-own-and-count" label="Change the own value and incoming occurrence count"><figure data-mp-drawing="D13a"><div className="mp-aggregation-grid"><OccurrenceMean trace={trace} /><SageMerge trace={trace} /></div></figure>
    <FlowControls><AggregationQuantity label="SAGE own value" value={sage.own} onChange={v => edit('own', v)} min={-8} max={8} revision={revision.all} /><AggregationQuantity label="Incoming count" value={trace.count} onChange={resize} min={0} max={6} integer revision={revision.all} /><button onClick={resetSage} type="button">Reset SAGE neighborhood</button></FlowControls>
    <SageSentence trace={trace} /><p className="flow-note">Growing retains existing occurrences and adds zeros. Shrinking drops removed entries. This reset restores the whole SAGE neighborhood, including its coefficients.</p>
  </FlowLab>;
}
export function MessagePassingSageOccurrenceLab() {
  const { sage, trace, revision, edit, editOccurrence, resetValues } = useSageTrace();
  return <FlowLab id="sage-occurrence-value" label="Edit one incoming occurrence"><figure data-mp-drawing="D13b"><OccurrenceMean trace={trace} selected={sage.selected} /><ExactSageRows trace={trace} /></figure>
    <FlowControls>{trace.count > 0 && <><AggregationOccurrenceSelect count={trace.count} value={sage.selected} onChange={v => edit('selected', v)} /><AggregationQuantity label={`Occurrence o${sage.selected} value`} value={sage.neighbors[sage.selected]} onChange={editOccurrence} min={-8} max={8} revision={`${revision.values}:${revision.all}:${sage.selected}`} /></>}<button onClick={resetValues} type="button">Reset occurrence values</button></FlowControls>
    <SageSentence trace={trace} /><p className="flow-note">Each o-ID is a separate occurrence, even when values coincide. Reset restores introductory values for existing slots (then zeros), preserving the current count, own value and coefficients. Drawing labels are rounded; the table retains more precision.</p>
  </FlowLab>;
}
export function MessagePassingSageWeightsLab() {
  const { sage, trace, revision, edit, resetWeights } = useSageTrace();
  return <FlowLab id="sage-branch-coefficients" label="Change separate own and neighbor coefficients"><figure data-mp-drawing="D13c"><div className="mp-aggregation-grid"><SageMap own trace={trace} /><SageMap trace={trace} /><SageMerge trace={trace} /></div></figure>
    <FlowControls><AggregationQuantity label="Own coefficient" value={sage.selfWeight} onChange={v => edit('selfWeight', v)} min={-4} max={4} revision={`${revision.weights}:${revision.all}`} /><AggregationQuantity label="Neighbor coefficient" value={sage.neighborWeight} onChange={v => edit('neighborWeight', v)} min={-4} max={4} revision={`${revision.weights}:${revision.all}`} /><button onClick={resetWeights} type="button">Reset coefficients</button></FlowControls><SageSentence trace={trace} />
  </FlowLab>;
}

function ChannelCells({ values, y, winning = [] }) {
  return <g>{values.map((value, channel) => <g key={channel}><text x={76 + channel * 136} y={y - 12} textAnchor="middle" fill={channelHues[channel]}>channel {channel + 1}</text><rect x={30 + channel * 136} y={y} width="92" height="42" fill="#101010" stroke={winning.includes(channel) ? '#fff' : channelHues[channel]} strokeWidth={winning.includes(channel) ? 3 : 2} /><text x={76 + channel * 136} y={y + 28} textAnchor="middle" fill={channelHues[channel]}>{num(value, 3)}</text></g>)}</g>;
}
function PoolDonor({ trace, index, encoded = false }) {
  const input = trace.donors[index], affine = trace.affine[index], transformed = trace.transformed[index];
  return <Drawing width={288} height={502} label={`Occurrence o${index}: ${input} transforms to ${affine.join(', ')}, ReLU gives ${transformed.join(', ')}`}>
    <Value x={144} y={79} value={input} label={`Occurrence o${index}`} hue={paperHues[index]} />
    <Arrow x1={144} y1={118} x2={144} y2={154} /><Operation y={160} text={encoded ? '[x, 0] · pre-map' : 'φ(x) = [x, −x]'} width={240} />
    {encoded && center(231, `[${num(input, 3)}, 0] → [${num(affine[0], 3)}, ${num(affine[1], 3)}]`, resultHue)}
    {!encoded && center(231, 'fixed coefficients [+1, −1]', parameterHue)}
    <ChannelCells values={affine} y={284} /><Arrow x1={144} y1={332} x2={144} y2={349} /><Operation y={354} text="ReLU in each channel" width={232} />
    <ChannelCells values={transformed} y={444} winning={trace.winners.flatMap((rows, channel) => rows.includes(index) ? [channel] : [])} />
  </Drawing>;
}
function PoolReduction({ trace, channel }) {
  return <Drawing width={288} height={322} label={`Channel ${channel + 1} takes maximum ${trace.pooled[channel]} from ${trace.winners[channel].map(i => 'o'+i).join(', ')}`}>
    {center(27, `Channel ${channel + 1} · independent max`, channelHues[channel])}
    {trace.transformed.map((row, i) => <g key={i}><circle cx="32" cy={69 + i * 59} r="20" fill="#101010" stroke={trace.winners[channel].includes(i) ? '#fff' : paperHues[i]} strokeWidth={trace.winners[channel].includes(i) ? 3 : 2} /><text x="32" y={75 + i * 59} textAnchor="middle" fill={paperHues[i]}>o{i}</text><text x="82" y={75 + i * 59} fill={channelHues[channel]}>value {num(row[channel], 3)}</text><Arrow x1={220} y1={69 + i * 59} x2={264} y2={69 + i * 59} hue={paperHues[i]} /></g>)}
    <path d="M264,69V246" fill="none" stroke="#aaa" strokeWidth="2" /><Arrow x1={264} y1={246} x2={226} y2={246} /><Operation y={224} text="max" width={152} />
    {center(310, `pooled value = ${num(trace.pooled[channel], 4)}`, channelHues[channel])}
  </Drawing>;
}
function PoolReadout({ trace }) {
  return <FlowReadout data-pool-output={trace.pooled.join(',')}>Transforming each donor before max returns [{trace.pooled.map(v => num(v, 9)).join(', ')}].
    Channel 1 is attained by {trace.winners[0].map(i => `o${i}`).join(', ')}, channel 2 by {trace.winners[1].map(i => `o${i}`).join(', ')}.
    Raw max {num(trace.rawMaximum, 9)} followed by the transform returns [{trace.transformedRawMaximum.map(v => num(v, 9)).join(', ')}].{trace.winners.some(rows => rows.length > 1) && ' Tied donors share the maximum; a unique derivative is not implied.'}</FlowReadout>;
}
export function MessagePassingPoolLab() {
  const pool = usePoolingNeighborhood(), trace = transformedPoolTrace(pool.first);
  return <FlowLab id="sage-transform-before-max" label="Compare max before and after transforming donors"><figure data-mp-drawing="D14"><div className="mp-aggregation-grid">{trace.donors.map((_, i) => <PoolDonor key={i} trace={trace} index={i} />)}{[0, 1].map(channel => <PoolReduction key={channel} trace={trace} channel={channel} />)}
    <Drawing width={288} height={330} label="Raw max first loses the negative donor before the shared transform">
      {center(28, 'Raw max first')}{center(67, `[${trace.donors.map(v => num(v, 3)).join(', ')}]`, inputHue)}<Arrow x1={144} y1={80} x2={144} y2={101} /><Operation y={108} text={`max = ${num(trace.rawMaximum, 3)}`} /><Arrow x1={144} y1={160} x2={144} y2={176} /><Operation y={182} text="φ then ReLU" /><ChannelCells values={trace.transformedRawMaximum} y={267} />
    </Drawing></div><figcaption>Occurrences keep their hues through both channels. Channel hues stay attached to coordinates; a white outline marks every maximizing donor, including ties.</figcaption></figure>
    <FlowControls><AggregationQuantity label="First pooling donor" value={pool.first} onChange={pool.setFirst} min={-4} max={4} revision={pool.revision} /><button type="button" onClick={pool.reset}>Reset pooling donor</button></FlowControls><PoolReadout trace={trace} />
  </FlowLab>;
}
export function MessagePassingPoolLibraryLab() {
  const pool = usePoolingNeighborhood(), trace = transformedPoolTrace(pool.first);
  return <figure data-mp-drawing="D14-library"><div className="mp-aggregation-grid">
    <Drawing width={288} height={390} label="Encode x as x,0; a width-preserving two-by-two pre-map gives x and minus x before ReLU">
      {center(25, 'Library width: 2 → 2 before max')}{center(66, 'Encode scalar x as [x, 0]', inputHue)}
      <Arrow x1={144} y1={78} x2={144} y2={104} /><Operation y={110} text="Shared pre-pool map" width={236} />
      <text x="118" y="180" textAnchor="middle">input x</text><text x="220" y="180" textAnchor="middle">extra zero</text>
      {trace.weight.map((row, output) => <g key={output}><text x="32" y={218 + output * 60} textAnchor="middle" fill={channelHues[output]}>c{output + 1}</text>{row.map((value, input) => <g key={input}><rect x={82 + input * 102} y={190 + output * 60} width="72" height="42" fill="#101010" stroke={parameterHue} /><text x={118 + input * 102} y={218 + output * 60} textAnchor="middle" fill={parameterHue}>{value}</text></g>)}</g>)}
      {center(335, '1·x + 0·0 = x', parameterHue)}{center(372, '−1·x + 0·0 = −x', parameterHue)}
    </Drawing>{trace.donors.map((_, i) => <PoolDonor key={i} trace={trace} index={i} encoded />)}
    <Drawing width={288} height={398} label="Coordinate max is followed by fixed identity post-map, with no own branch or bias">
      {center(25, 'After ReLU · coordinate max')}<ChannelCells values={trace.pooled} y={64} />
      <Arrow x1={144} y1={112} x2={144} y2={147} /><Operation y={154} text="Fixed post-map I₂" width={230} />
      {center(236, `1·${num(trace.pooled[0], 3)} + 0·${num(trace.pooled[1], 3)} = ${num(trace.pooled[0], 3)}`, resultHue)}
      {center(274, `0·${num(trace.pooled[0], 3)} + 1·${num(trace.pooled[1], 3)} = ${num(trace.pooled[1], 3)}`, resultHue)}
      {center(323, 'No own branch · no bias')}{center(377, `[${trace.pooled.map(v => num(v, 4)).join(', ')}] stays unchanged`, resultHue)}
    </Drawing></div><PoolReadout trace={trace} /><figcaption>The same D14 donors are encoded with a declared zero second input. The pre-map is [[1, 0], [−1, 0]], followed by ReLU/max and a fixed identity post-map. Its two outputs arise before reduction. This matches this encoded dataset; arbitrary nonzero second channels are outside that comparison.</figcaption></figure>;
}

function VectorPlot({ vector, domain, label, hue, defined }) {
  const origin = [46, 246], scale = 190 / domain;
  return <Drawing width={288} height={343} label={`${label}, coordinate range 0 to ${domain}; vector ${vector.join(', ')}`}>
    {center(25, label, hue)}
    <Arrow x1={46} y1={246} x2={260} y2={246} /><Arrow x1={46} y1={246} x2={46} y2={47} />
    {[0, domain / 2, domain].map(tick => <g key={tick}><path d={`M${46 + tick * scale},242v8 M42,${246 - tick * scale}h8`} stroke="#aaa" /><text x={46 + tick * scale} y="272" textAnchor="middle">{num(tick, 2)}</text>{tick !== 0 && (num(tick, 2).length > 5 ? <text x="20" y={246 - tick * scale} textAnchor="middle" transform={`rotate(-90 20 ${246 - tick * scale})`}>{num(tick, 2)}</text> : <text x="35" y={252 - tick * scale} textAnchor="end">{num(tick, 2)}</text>)}</g>)}
    {defined ? <Arrow x1={46} y1={246} x2={46 + vector[0] * scale} y2={246 - vector[1] * scale} hue={hue} /> : <circle cx="46" cy="246" r="4" fill={hue} />}
    <text x="258" y="300" textAnchor="end" fill={channelHues[0]}>channel 1</text><text x="64" y="57" fill={channelHues[1]}>channel 2</text>
    {center(335, `[${vector.map(v => num(v, 3)).join(', ')}]`, hue)}
  </Drawing>;
}
export function MessagePassingDirectionLab() {
  const [magnitude, setMagnitude] = useState(1), [revision, setRevision] = useState(0), trace = directionTrace(magnitude);
  const domain = trace.directionDefined ? 5 * magnitude : 5;
  return <FlowLab id="sage-unit-direction" label="Change row magnitude before L2 normalization"><figure data-mp-drawing="D15a"><div className="mp-aggregation-grid"><VectorPlot vector={trace.original} domain={domain} label="Original row" hue={inputHue} defined={trace.directionDefined} /><VectorPlot vector={trace.unit} domain={1} label="Unit row" hue={resultHue} defined={trace.directionDefined} />
    <Drawing width={288} height={285} label="Square both row coordinates, add, take square root, then divide each coordinate by the length">
      {center(28, 'Actual normalization arithmetic')}{center(69, `${num(trace.original[0], 3)}² + ${num(trace.original[1], 3)}²`, inputHue)}<Arrow x1={144} y1={82} x2={144} y2={101} /><Operation y={108} text={`√ sum = ${num(trace.length, 4)}`} width={250} /><Arrow x1={144} y1={160} x2={144} y2={183} /><Operation y={190} text={trace.directionDefined ? `divide row by ${num(trace.length, 3)}` : 'zero → chosen zero row'} width={266} />{center(278, `output [${trace.unit.map(v => num(v, 3)).join(', ')}]`, resultHue)}
    </Drawing></div><figcaption>Each plot has equal channel scales. The original plot’s range follows the current magnitude; the unit plot’s range is 0–1. Read the numeric ticks to compare sizes. The arrows encode actual coordinates, including tiny nonzero rows. At zero only the origin mark remains, with no directional arrow.</figcaption></figure>
    <FlowControls><AggregationQuantity label="Row magnitude" value={magnitude} onChange={setMagnitude} min={0} max={5} revision={revision} /><button type="button" onClick={() => { setMagnitude(1); setRevision(r => r + 1); }}>Reset magnitude</button></FlowControls>
    <FlowReadout data-direction-defined={trace.directionDefined}>The row is [{trace.original.map(v => num(v, 9)).join(', ')}], with length {num(trace.length, 9)}. {trace.directionDefined ? <>Dividing by its length gives [{trace.unit.map(v => num(v, 9)).join(', ')}], length {num(trace.unitLength, 9)}: magnitude is removed and direction remains.</> : 'A zero row has no unit direction; this implementation returns [0, 0].'}</FlowReadout>
  </FlowLab>;
}

function LstmGates({ step }) {
  return <Drawing width={288} height={358} label={`Position ${step.position + 1}, occurrence o${step.occurrence.id}: input and previous hidden create the four LSTM gates`}>
    {center(24, `Position ${step.position + 1} · occurrence o${step.occurrence.id}`, paperHues[step.occurrence.id])}
    <Value x={64} y={99} value={step.occurrence.value} label="Input x" hue={paperHues[step.occurrence.id]} /><Value x={224} y={99} value={step.oldHidden} label="Old hidden h" />
    <Arrow x1={64} y1={138} x2={64} y2={166} /><Arrow x1={224} y1={138} x2={224} y2={166} />
    <rect x="12" y="173" width="264" height="181" rx="5" stroke="#ddd" fill="#101010" />
    {['i', 'f', 'g', 'o'].map((gate, i) => <text key={gate} x="144" y={207 + i * 43} textAnchor="middle" fill={resultHue}>{gate}: {i === 2 ? 'tanh' : 'σ'}({num(step.affine[i], 3)}) = {num(step.gates[i], 3)}</text>)}
  </Drawing>;
}
function LstmCell({ step }) {
  const carry = step.gates[1] * step.oldCell, write = step.gates[0] * step.gates[2];
  return <>
    <Product first={step.gates[1]} second={step.oldCell} firstLabel="Retain f" secondLabel="Old cell c" title="carried cell" output={carry} />
    <Product first={step.gates[0]} second={step.gates[2]} firstLabel="Write i" secondLabel="Candidate g" title="written cell" output={write} />
    <Drawing width={288} height={240} label={`Add carried ${carry} and written ${write} to make cell ${step.cell}`}><Value x={64} y={80} value={carry} label="Carried" /><Value x={224} y={80} value={write} label="Written" /><Arrow x1={64} y1={119} x2={120} y2={159} /><Arrow x1={224} y1={119} x2={168} y2={159} /><circle cx="144" cy="177" r="25" stroke="#ddd" fill="#101010" /><text x="144" y="183" textAnchor="middle">+</text>{center(233, `new cell c = ${num(step.cell, 4)}`, resultHue)}</Drawing>
    <Product first={step.gates[3]} second={Math.tanh(step.cell)} firstLabel="Expose o" secondLabel="tanh(new c)" title="new hidden h" output={step.hidden} />
  </>;
}
export function MessagePassingOrderedLab() {
  const [first, setFirst] = useState(1), [reversed, setReversed] = useState(false), [revision, setRevision] = useState(0);
  const trace = orderedNeighborTrace(first, reversed), comparison = orderedNeighborTrace(first, !reversed), names = ['Write i', 'Retain f', 'Candidate g', 'Expose o'];
  return <FlowLab id="sage-ordered-lstm" label="Read the same neighbor occurrences in two orders"><figure data-mp-drawing="D15b">
    <Drawing width={288} height={260} label={`Current order ${trace.occurrences.map(o => 'o'+o.id).join(', ')}; values ${trace.occurrences.map(o => o.value).join(', ')}`}>
      {center(24, 'Same occurrences · chosen order')}{trace.occurrences.map((o, i) => <g key={o.id}><circle cx={50 + i * 94} cy="92" r="27" stroke={paperHues[o.id]} fill="#101010" strokeWidth="2" /><text x={50 + i * 94} y="98" textAnchor="middle" fill={paperHues[o.id]}>o{o.id}</text><text x={50 + i * 94} y="149" textAnchor="middle" fill={paperHues[o.id]}>{num(o.value, 3)}</text>{i < 2 && <Arrow x1={80 + i * 94} y1={92} x2={113 + i * 94} y2={92} />}</g>)}{center(196, 'Start hidden h = 0, cell c = 0')}{center(232, 'Each position passes both h and c.')}
    </Drawing>
    <div className="mp-aggregation-grid">{trace.steps.map(step => <div key={step.occurrence.id} data-lstm-position={step.position} data-occurrence={step.occurrence.id}><LstmGates step={step} /><LstmCell step={step} /></div>)}</div>
    <div className="mp-aggregation-table-pan" tabIndex={0} role="region" aria-label="Fixed LSTM parameters; scroll horizontally if needed"><table className="mp-aggregation-parameters"><caption>Declared fixture parameters, in gate order i, f, g, o</caption><thead><tr><th>Gate</th><th>Input weight</th><th>Hidden weight</th><th>Input bias</th><th>Hidden bias</th></tr></thead><tbody>{names.map((name, i) => <tr key={name}><th>{name}</th><td>{trace.weights.inputWeights[i]}</td><td>{trace.weights.hiddenWeights[i]}</td><td>{trace.weights.inputBias[i]}</td><td>{trace.weights.hiddenBias[i]}</td></tr>)}</tbody></table></div>
    <figcaption>Each gate’s argument is input-weight × x + hidden-weight × old h + its two biases. σ means sigmoid. The two cell products are added before exposing the new hidden row; the next position reads these new h/c buffers. Graph occurrence IDs stay attached when the list is reversed.</figcaption></figure>
    <FlowControls><AggregationQuantity label="LSTM occurrence o0 value" value={first} onChange={setFirst} min={-8} max={8} revision={revision} /><FlowChoice label="Occurrence order" options={[[false, 'o0 → o1 → o2'], [true, 'o2 → o1 → o0']]} value={reversed} onChange={setReversed} /><button type="button" onClick={() => { setFirst(1); setReversed(false); setRevision(r => r + 1); }}>Reset ordered reader</button></FlowControls>
    <FlowReadout data-lstm-hidden={trace.hidden} data-lstm-cell={trace.cell}>Reading [{trace.occurrences.map(o => num(o.value, 9)).join(', ')}] returns hidden <strong>{num(trace.hidden, 10)}</strong> and cell {num(trace.cell, 10)}. Reversing this same occurrence list returns hidden {num(comparison.hidden, 10)} and cell {num(comparison.cell, 10)}. This reverses positions, not a value sort; gates and parameters stay fixed. The final hidden row is the neighbor summary, not the receiver’s own graph state.</FlowReadout>
  </FlowLab>;
}

function MemoryCandidate({ trace }) {
  return <Drawing width={288} height={550} label="Candidate: 0.1 times gathered message 5 plus reset 0.5 times recurrent 0.2 times old 2, then tanh">
    <Value x={64} y={79} value={trace.incoming[trace.receiver]} label="Gathered input" hue={inputHue} /><Value x={224} y={79} value={trace.old[trace.receiver]} label="Old receiver 1" hue={paperHues[1]} />
    <Arrow x1={64} y1={118} x2={64} y2={139} /><Arrow x1={224} y1={118} x2={224} y2={139} />
    <Operation x={64} y={145} text="× 0.1" width={98} /><Operation x={224} y={145} text="× 0.2" width={98} />
    <text x="64" y="224" textAnchor="middle" fill={resultHue}>{num(trace.candidateInput, 3)}</text><text x="224" y="224" textAnchor="middle" fill={resultHue}>{num(trace.candidateRecurrent, 3)}</text>
    <Arrow x1={224} y1={233} x2={224} y2={248} /><Operation x={224} y={255} text="× reset 0.5" width={112} /><text x="224" y="334" textAnchor="middle" fill={resultHue}>{num(trace.reset * trace.candidateRecurrent, 3)}</text>
    <path d="M64,234V358H112 M224,342V358H176" fill="none" stroke="#aaa" strokeWidth="2" /><Arrow x1={96} y1={358} x2={115} y2={358} /><Arrow x1={192} y1={358} x2={173} y2={358} />
    <circle cx="144" cy="358" r="26" stroke="#ddd" fill="#101010" /><text x="144" y="364" textAnchor="middle">+</text>{center(407, `argument = ${num(trace.candidateArgument, 4)}`, resultHue)}
    <Arrow x1={144} y1={415} x2={144} y2={432} /><Operation y={438} text="tanh" width={116} /><Arrow x1={144} y1={490} x2={144} y2={507} />{center(544, `candidate = ${num(trace.candidate, 6)}`, resultHue)}
  </Drawing>;
}
export function MessagePassingMemoryLab() {
  const [retain, setRetain] = useState(.5), [revision, setRevision] = useState(0), trace = graphMemoryTrace(retain);
  return <FlowLab id="graph-old-memory" label="Blend a fixed candidate with old receiver memory"><figure data-mp-drawing="D16"><div className="mp-aggregation-grid">
    <Drawing width={288} height={218} label="The old buffer contains node 0 value 1, node 1 value 2, node 2 value 4; the two old relationships permit gathers both ways">
      {center(24, 'Read-only old graph buffer')}{trace.old.map((v, i) => <g key={i}><circle cx={50 + i * 94} cy="93" r="27" stroke={i === trace.receiver ? '#fff' : paperHues[i]} strokeWidth={i === trace.receiver ? 3 : 2} fill="#101010" /><text x={50 + i * 94} y="99" textAnchor="middle" fill={paperHues[i]}>{i}</text><text x={50 + i * 94} y="150" textAnchor="middle" fill={paperHues[i]}>old {v}</text>{i < 2 && <Arrow x1={80 + i * 94} y1={93} x2={113 + i * 94} y2={93} both />}</g>)}{center(204, 'No freshly updated sender is read.')}
    </Drawing>
    <Drawing width={288} height={274} label="Gathered input rows are 2,5,2; receiver 1 sums old sender 0 and sender 2">
      {center(25, 'Gather old sender rows')}{['1 → 0: 2', '0, 2 → 1: 1 + 4 = 5', '1 → 2: 2'].map((line, i) => <text key={line} x="144" y={76 + i * 61} textAnchor="middle" fill={paperHues[i]}>{line}</text>)}{center(261, 'GRU shape: 3 nodes × 1 position')}
    </Drawing>
    <Drawing width={288} height={318} label="Gathered row enters the GRU input port and old receiver row enters its hidden port; one position writes a separate next row">
      <Value x={64} y={79} value={trace.incoming[1]} label="Message input" hue={inputHue} /><Value x={224} y={79} value={trace.old[1]} label="Old hidden" hue={paperHues[1]} />
      <Arrow x1={64} y1={118} x2={64} y2={141} /><Arrow x1={224} y1={118} x2={224} y2={141} />
      <rect x="28" y="147" width="232" height="89" rx="5" stroke="#ddd" fill="#101010" />{center(179, 'GRU · one recurrent position')}{center(215, 'candidate then retain blend')}
      <Arrow x1={144} y1={242} x2={144} y2={269} />{center(307, `next node 1: ${num(trace.next, 5)}`, resultHue)}
    </Drawing><MemoryCandidate trace={trace} />
    <Product first={trace.retain} second={trace.old[trace.receiver]} firstLabel="Retain z" secondLabel="Old state" title="old product" output={trace.oldProduct} />
    <Product first={1 - trace.retain} second={trace.candidate} firstLabel="1 − z" secondLabel="Candidate" title="candidate product" output={trace.candidateProduct} />
    <Drawing width={288} height={244} label={`Receiver 1 adds old product ${trace.oldProduct} and candidate product ${trace.candidateProduct} to write next ${trace.next}`}><Value x={64} y={80} value={trace.oldProduct} label="Old product" /><Value x={224} y={80} value={trace.candidateProduct} label="Candidate" /><Arrow x1={64} y1={119} x2={120} y2={159} /><Arrow x1={224} y1={119} x2={168} y2={159} /><circle cx="144" cy="177" r="25" stroke="#ddd" fill="#101010" /><text x="144" y="183" textAnchor="middle">+</text>{center(238, `next receiver 1 = ${num(trace.next, 5)}`, resultHue)}</Drawing>
    </div><figcaption>The selected receiver is node 1. Its input is gathered message 5; its hidden input is old state 2. Reset 0.5 and candidate parameters stay fixed, yielding tanh(0.7). Only the retain stage is intervened on; a full GRU would recompute its coupled gates. New receiver 1 writes to a separate next buffer.</figcaption></figure>
    <FlowControls><AggregationQuantity label="Retain gate z" value={retain} onChange={setRetain} min={0} max={1} step={.01} revision={revision} /><button type="button" onClick={() => { setRetain(.5); setRevision(r => r + 1); }}>Reset retain stage</button></FlowControls>
    <FlowReadout data-memory-next={trace.next}>The candidate remains {num(trace.candidate, 10)}. Retaining z={num(retain, 9)} gives old contribution {num(trace.oldProduct, 10)} and candidate contribution {num(trace.candidateProduct, 10)}, so receiver 1 writes <strong>{num(trace.next, 10)}</strong>. At z=0 it takes the candidate; at z=1 it keeps old 2. This gate-stage intervention does not retrain or freely change a complete GRU.</FlowReadout>
  </FlowLab>;
}

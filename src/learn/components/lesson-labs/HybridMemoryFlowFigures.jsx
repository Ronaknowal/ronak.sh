import { useEffect, useId, useRef, useState } from 'react';
import { flowNumber as number } from './LessonFlow.jsx';
import { hybridFlowMemory, hybridTinySelectiveStep, hybridFlowCompose, hybridFlowDeltaContrast } from '../../data/hybrid-memory-flow-models.js';
import './hybrid-memory-flow.css';

export const hybridFlowRoles = {
  input: '#79c8e8', parameter: '#e6bb60', computed: '#c5a5e8',
  operation: '#e2e2e2', forward: '#858585', derivative: '#f09a68',
};

export function HybridFlowScroll({ label, children }) {
  const region = useRef(null), hintId = useId();
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const update = () => setOverflow(region.current.scrollWidth > region.current.clientWidth + 1);
    const observer = new ResizeObserver(update);
    observer.observe(region.current);
    if (region.current.firstElementChild) observer.observe(region.current.firstElementChild);
    update();
    return () => observer.disconnect();
  }, []);
  return <>
    <p id={hintId} className="hybrid-flow-scroll-hint" hidden={!overflow}>Scroll this drawing sideways to follow all its labelled parts. With it focused, use the left and right arrow keys.</p>
    <div ref={region} className="hybrid-flow-scroll" tabIndex={0} role="region" aria-label={label} aria-describedby={overflow ? hintId : undefined}>{children}</div>
  </>;
}

export function HybridFlowDrawing({ id, label, width = 350, height, children, caption }) {
  return <figure data-figure={`hybrid-${id}`} className="hybrid-flow-drawing" aria-label={label}>
    <HybridFlowScroll label={label}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} style={{ width: `${width / 16}rem`, minWidth: `${width / 16}rem` }}>{children}</svg>
    </HybridFlowScroll>
    {caption && <figcaption>{caption}</figcaption>}
  </figure>;
}

export function HybridFlowWire({ points, backward = false, role = 'forward' }) {
  const id = useId();
  const color = hybridFlowRoles[backward ? 'derivative' : role];
  return <g>
    <defs><marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={color} /></marker></defs>
    <polyline points={points.map(point => point.join(',')).join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray={backward ? '5 4' : undefined} markerEnd={`url(#${id})`} />
  </g>;
}

export function HybridFlowLabel({ x, y, children, role = 'operation', anchor = 'start' }) {
  return <text x={x} y={y} fill={hybridFlowRoles[role]} textAnchor={anchor}>{children}</text>;
}

export function HybridFlowValue({ x, y, value, name, role = 'computed', radius = 29, digits = 4 }) {
  return <g>
    <circle cx={x} cy={y} r={radius} fill="#080808" stroke={hybridFlowRoles[role]} strokeWidth="1.5" />
    <HybridFlowLabel x={x} y={y + 6} role={role} anchor="middle">{typeof value === 'number' ? number(value, digits) : value}</HybridFlowLabel>
    {name && <HybridFlowLabel x={x} y={y - radius - 13} role={role} anchor="middle">{name}</HybridFlowLabel>}
  </g>;
}

export function HybridFlowOperation({ x, y, name, width = 72 }) {
  return <g><rect x={x - width / 2} y={y - 22} width={width} height={44} rx="8" fill="#080808" stroke={hybridFlowRoles.operation} />
    <HybridFlowLabel x={x} y={y + 6} anchor="middle">{name}</HybridFlowLabel></g>;
}

export function HybridFlowArray({ values, names, label, role = 'computed', roles, digits = 5 }) {
  return <div className="hybrid-flow-array" role="group" aria-label={label}>
    {values.map((value, index) => <div className="hybrid-flow-array-cell" key={index} style={{ '--hybrid-role': hybridFlowRoles[roles?.[index] ?? role] }}>
      <span>{names?.[index] ?? `coordinate ${index}`}</span>
      <strong>{number(value, digits)}</strong>
    </div>)}
  </div>;
}

export function HybridFlowMatrix({ matrix, label, rowNames, columnNames, selectedRow = null, role = 'computed', digits = 5 }) {
  const labelId = useId(), hintId = useId();
  return <>
    <p id={labelId}>{label}</p>
    <p id={hintId} className="hybrid-flow-scroll-hint">Read across the labelled columns. Scroll the matrix sideways when needed; left and right arrow keys work when it has focus.</p>
    <div className="hybrid-flow-matrix-scroll" role="region" tabIndex={0} aria-labelledby={labelId} aria-describedby={hintId}>
      <table className="hybrid-flow-matrix" aria-labelledby={labelId} style={{ '--hybrid-role': hybridFlowRoles[role] }}>
        <thead><tr><th scope="col">row ↓ / column →</th>{columnNames.map(name => <th key={name} scope="col">{name}</th>)}</tr></thead>
        <tbody>{matrix.map((row, index) => <tr key={index} data-selected={selectedRow === index || undefined}>
          <th scope="row">{rowNames[index]}{selectedRow === index ? ' ← traced' : ''}</th>
          {row.map((value, column) => <td key={column} data-sign={value > 0 ? 'positive' : value < 0 ? 'negative' : 'zero'}>{number(value, digits)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <p className="hybrid-flow-value-key">Number-cell fills: positive amber, negative blue, zero neutral. The white row mark identifies the traced row; it does not change the numbers.</p>
  </>;
}

export function HybridRecordsDrawing({ records, selected = null }) {
  return <figure data-figure="hybrid-records" aria-label="Individual supplied keyed values in arrival order">
    <div className="hybrid-flow-records">{records.map((row, index) => <div className="hybrid-flow-record" key={index} data-selected={selected === index || undefined}>
      <span>arrival {index + 1}{selected === index ? ' · selected' : ''}</span>
      <div className="hybrid-flow-record-fields"><span>key<strong>{row.key}</strong></span><span>value<strong>{number(row.value)}</strong></span></div>
    </div>)}</div>
    <figcaption>Cyan fields are supplied records. A key identifies an address; the value is the quantity stored at that address.</figcaption>
  </figure>;
}

export function HybridSummaryStepDrawing({ records = [{ key: 'A', value: 2 }, { key: 'B', value: 7 }, { key: 'C', value: 4 }], decay = .5, position = 1 }) {
  const result = hybridFlowMemory(records, 'A', decay, Math.log(9));
  const index = Math.min(position, records.length - 1);
  const before = index ? result.states[index - 1] : [0, 0];
  const after = result.states[index];
  return <HybridFlowDrawing id="summary-step" label="The old numerator and normalizer each decay, then receive the current value and one" width={520} height={540}>
    {[{ x: 135, old: before[0], added: records[index].value, next: after[0], name: 'numerator s' }, { x: 385, old: before[1], added: 1, next: after[1], name: 'normalizer n' }].map(({ x, old, added, next, name }) => <g key={name}>
      <HybridFlowValue x={x} y={70} value={old} name={`old ${name}`} />
      <HybridFlowWire points={[[x,99],[x,137]]} />
      <HybridFlowOperation x={x} y={160} name="× λ" />
      <HybridFlowValue x={x - 80} y={160} value={decay} role="input" radius={25} />
      <HybridFlowWire points={[[x-55,160],[x-37,160]]} />
      <HybridFlowWire points={[[x,182],[x,233]]} />
      <HybridFlowOperation x={x} y={256} name="+" />
      <HybridFlowValue x={x - 80} y={256} value={added} role="input" radius={25} />
      <HybridFlowWire points={[[x-55,256],[x-37,256]]} />
      <HybridFlowWire points={[[x,278],[x,325]]} />
      <HybridFlowValue x={x} y={355} value={next} name={`new ${name}`} />
    </g>)}
    <HybridFlowWire points={[[135,384],[135,425],[260,425],[260,452]]} />
    <HybridFlowWire points={[[385,384],[385,425],[295,425],[295,452]]} />
    <HybridFlowOperation x={278} y={475} name="s ÷ n" width={104} />
    <HybridFlowLabel x={278} y={527} role="computed" anchor="middle">current summary {number(after[2],6)}</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridAddressDrawing({ records, query, scoreGap = Math.log(9) }) {
  const result = hybridFlowMemory(records, query, .5, scoreGap);
  const height = 115 + records.length * 104;
  return <><HybridSoftmaxCircuit scores={result.scores} labels={records.map((row,index)=>`${row.key}, arrival ${index+1}`)}/>
  <HybridFlowDrawing id="addressed-read" label="Every query-key score produces a positive mass, a normalized weight and a signed value contribution" width={650} height={height}>
    <HybridFlowLabel x={15} y={24} role="input">query {query}; matched score gap {number(scoreGap)}</HybridFlowLabel>
    {['key / value','score','exp mass','weight','weight × value'].map((label,i) => <HybridFlowLabel key={label} x={[20,175,280,390,505][i]} y={62}>{label}</HybridFlowLabel>)}
    {records.map((row,index) => {
      const y = 107 + index*104;
      return <g key={index}>
        <HybridFlowLabel x={20} y={y} role="input">{row.key}:{number(row.value)}</HybridFlowLabel>
        <HybridFlowLabel x={175} y={y} role="computed">{number(result.scores[index],4)}</HybridFlowLabel>
        <HybridFlowLabel x={280} y={y} role="computed">{number(result.masses[index],4)}</HybridFlowLabel>
        <HybridFlowLabel x={390} y={y} role="computed">{number(result.weights[index],6)}</HybridFlowLabel>
        <rect x={390} y={y+13} width={95*result.weights[index]} height={17} fill={hybridFlowRoles.computed} />
        <HybridFlowLabel x={505} y={y} role="computed">{number(result.addressedTerms[index],6)}</HybridFlowLabel>
        <HybridFlowWire points={[[135,y-6],[160,y-6]]} />
        <HybridFlowWire points={[[244,y-6],[265,y-6]]} />
        <HybridFlowWire points={[[352,y-6],[378,y-6]]} />
        <HybridFlowWire points={[[482,y-6],[498,y-6]]} />
      </g>;
    })}
    <HybridFlowLabel x={20} y={height-20} role="computed">mass sum {number(sum(result.masses))}; contribution sum {number(result.attention,6)}</HybridFlowLabel>
  </HybridFlowDrawing></>;
}

const sum = values => values.reduce((total, value) => total + value,0);

export function HybridSoftmaxCircuit({ scores, labels, inputRole = 'computed' }) {
  const masses = scores.map(Math.exp), denominator = sum(masses);
  const centre = 100+(scores.length-1)*110;
  return <HybridFlowDrawing id="normalization-circuit" label="Every score produces an exponential mass; every mass contributes to one shared sum used by every division" width={300+(scores.length-1)*220} height={875}
    caption="All mass arrows meet at Σ. The same computed sum fans out to every division; each division also receives its own original mass. These repeated mass circles show the same values, not a second exponentiation. Displayed numbers are rounded; normalization uses their full precision.">
    {scores.map((score,index)=>{
      const x=100+index*220;
      return <g key={index}>
        <HybridFlowValue x={x} y={70} value={score} name={labels[index]} role={inputRole}/>
        <HybridFlowWire points={[[x,100],[x,148]]}/>
        <HybridFlowOperation x={x} y={170} name="exp"/>
        <HybridFlowWire points={[[x,193],[x,222]]}/>
        <HybridFlowValue x={x} y={265} value={masses[index]} radius={42} digits={2}/>
        <HybridFlowLabel x={x+50} y={271}>mass {index}</HybridFlowLabel>
        <HybridFlowWire points={[[x,308],[x,345],[centre,345],[centre,388]]}/>
        <HybridFlowValue x={x} y={650} value={masses[index]} radius={42} digits={2}/>
        <HybridFlowLabel x={x+50} y={656}>same mass</HybridFlowLabel>
        <HybridFlowWire points={[[x,693],[x,728]]}/>
        <HybridFlowWire points={[[centre,573],[centre,595],[x-65,595],[x-65,750],[x-37,750]]}/>
        <HybridFlowOperation x={x} y={750} name="÷"/>
        <HybridFlowWire points={[[x,773],[x,805]]}/>
        <HybridFlowValue x={x} y={835} value={masses[index]/denominator} digits={3}/>
        <HybridFlowLabel x={x+43} y={841}>weight {index}</HybridFlowLabel>
      </g>;
    })}
    <HybridFlowOperation x={centre} y={410} name="Σ"/>
    <HybridFlowWire points={[[centre,433],[centre,487]]}/>
    <HybridFlowValue x={centre} y={530} value={denominator} radius={42} digits={2}/>
    <HybridFlowLabel x={centre+55} y={536}>shared sum</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridCollisionDrawing() {
  const left = hybridFlowMemory([{key:'A',value:2},{key:'B',value:7},{key:'C',value:4}], 'A', .5, Math.log(9));
  const right = hybridFlowMemory([{key:'A',value:6},{key:'B',value:5},{key:'C',value:4}], 'A', .5, Math.log(9));
  return <HybridFlowDrawing id="collision" label="Two different streams end in the same two registers but preserve different individually addressed values" width={560} height={400}>
    {[[left,[2,7,4],140],[right,[6,5,4],420]].map(([result,values,x]) => <g key={x}>
      {values.map((value,index) => <HybridFlowValue key={index} x={x-80+index*80} y={50} value={value} role="input" radius={23} />)}
      <HybridFlowWire points={[[x,80],[x,123]]} />
      <rect x={x-75} y={128} width={150} height={70} fill="none" stroke={hybridFlowRoles.computed}/>
      <HybridFlowLabel x={x} y={153} role="computed" anchor="middle">s=8</HybridFlowLabel>
      <HybridFlowLabel x={x} y={181} role="computed" anchor="middle">n=1.75</HybridFlowLabel>
      <HybridFlowWire points={[[x,199],[x,238]]}/>
      <HybridFlowValue x={x} y={270} value={result.summary} name="same summary" radius={33}/>
      <HybridFlowLabel x={x} y={344} anchor="middle">query A read</HybridFlowLabel>
      <HybridFlowLabel x={x} y={375} role="computed" anchor="middle">{x===140?'29/11':'63/11'}={number(result.attention,5)}</HybridFlowLabel>
    </g>)}
  </HybridFlowDrawing>;
}

export function HybridDepthDrawing() {
  const patterns = ['M','A','M'];
  return <HybridFlowDrawing id="depth-position" label="Columns are input positions; rows are different layers, each with its own persistent state" width={660} height={447}>
    <HybridFlowLabel x={115} y={26}>input position →</HybridFlowLabel>
    {['A:2','B:7','C:4'].map((value,index)=><HybridFlowValue key={value} x={180+index*180} y={78} value={value} role="input" radius={32}/>)}
    {patterns.map((kind,layer)=><g key={layer}>
      <HybridFlowLabel x={14} y={174+layer*85}>layer {layer} ↓</HybridFlowLabel>
      {[0,1,2].map(position=><g key={position}>
        <HybridFlowOperation x={180+position*180} y={167+layer*85} name={kind==='M'?'state step':'read K/V'} width={126}/>
        <HybridFlowWire points={[[180+position*180,layer?189+(layer-1)*85:110],[180+position*180,145+layer*85]]}/>
        {position<2&&<HybridFlowWire points={[[245+position*180,167+layer*85],[295+position*180,167+layer*85]]}/>} 
      </g>)}
    </g>)}
    <HybridFlowLabel x={15} y={411}>Horizontal arrows: that layer’s memory.</HybridFlowLabel>
    <HybridFlowLabel x={15} y={440}>Vertical arrows: the current position's activations.</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridResidualDrawing({ input=2, mixer=3, feedForward=4 }) {
  const intermediate = input + mixer;
  return <HybridFlowDrawing id="two-residuals" label="Two direct residual paths enter two addition junctions; the second keeps the first intermediate" width={450} height={630}>
    <HybridFlowValue x={240} y={60} value={input} name="supplied x" role="input"/>
    <HybridFlowWire points={[[240,89],[240,113]]}/><HybridFlowOperation x={240} y={136} name="Norm"/>
    <HybridFlowWire points={[[240,158],[240,195]]}/><HybridFlowOperation x={240} y={218} name="Mixer" width={106}/>
    <HybridFlowWire points={[[240,240],[240,285]]}/>
    <HybridFlowLabel x={290} y={266} role="computed">mix={mixer}</HybridFlowLabel>
    <HybridFlowOperation x={240} y={307} name="+"/>
    <HybridFlowWire points={[[210,60],[75,60],[75,307],[204,307]]}/>
    <HybridFlowLabel x={15} y={183} role="input">carry x</HybridFlowLabel>
    <HybridFlowWire points={[[240,329],[240,365]]}/>
    <HybridFlowLabel x={290} y={350} role="computed">u={intermediate}</HybridFlowLabel>
    <HybridFlowOperation x={240} y={389} name="Norm"/>
    <HybridFlowWire points={[[240,411],[240,447]]}/><HybridFlowOperation x={240} y={470} name="FFN"/>
    <HybridFlowWire points={[[240,492],[240,529]]}/><HybridFlowOperation x={240} y={551} name="+"/>
    <HybridFlowWire points={[[240,350],[125,350],[125,551],[204,551]]}/>
    <HybridFlowLabel x={16} y={451} role="computed">carry u</HybridFlowLabel>
    <HybridFlowLabel x={285} y={518} role="computed">FFN={feedForward}</HybridFlowLabel>
    <HybridFlowLabel x={240} y={611} role="computed" anchor="middle">output=u+FFN={intermediate+feedForward}</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridOriginalCycleDrawing() {
  return <HybridFlowDrawing id="original-cycle" label="An original eight-layer depth cycle contains seven selective mixers, one attention mixer and independently alternating dense/expert FFNs" width={410} height={682}>
    {Array.from({length:8},(_,index)=><g key={index}>
      <HybridFlowLabel x={10} y={45+index*72}>depth {index}</HybridFlowLabel>
      <HybridFlowOperation x={165} y={38+index*72} name={index===4?'attention':'selective'} width={120}/>
      <HybridFlowWire points={[[226,38+index*72],[250,38+index*72]]}/>
      <HybridFlowOperation x={320} y={38+index*72} name={index%2?'16 experts':'dense FFN'} width={125}/>
      {index<7&&<HybridFlowWire points={[[320,60+index*72],[320,76+index*72],[165,76+index*72],[165,88+index*72]]}/>} 
    </g>)}
    <HybridFlowLabel x={12} y={640}>Repeat four cycles across depth.</HybridFlowLabel>
    <HybridFlowLabel x={12} y={675}>Attention depths:4,12,20,28.</HybridFlowLabel>
  </HybridFlowDrawing>;
}

function HybridDotCircuit({ id, label, inputs, weights, bias = 0, output, inputRole = 'input', weightRole = 'parameter', biasRole = 'parameter', biasName = 'additive bias', additionLabel = 'b' }) {
  const centre = 85 + (inputs.length - 1) * 75;
  const sumWidth = additionLabel === 'b' ? 100 : 125;
  return <HybridFlowDrawing id={id} label={label} width={970} height={inputs.length * 150 + 70}
    caption={`Follow each input and coefficient into its own multiplication. The sum receives every product and the ${additionLabel === 'b' ? 'additive bias' : 'separate current direct skip'}; the circles round to two decimal places. The adjacent tables retain more digits, and the calculation uses full precision.`}>
    {inputs.map((value, index) => {
      const y = 85 + index * 150;
      return <g key={index}>
        <HybridFlowValue x={90} y={y} value={value} name={`input ${index}`} role={inputRole} digits={2}/>
        <HybridFlowWire points={[[120,y],[352,y]]}/>
        <HybridFlowValue x={270} y={y+65} value={weights[index]} role={weightRole} digits={2}/>
        <HybridFlowLabel x={270} y={y+114} role={weightRole} anchor="middle">coefficient {index}</HybridFlowLabel>
        <HybridFlowWire role={weightRole} points={[[300,y+65],[390,y+65],[390,y+23]]}/>
        <HybridFlowOperation x={390} y={y} name="×"/>
        <HybridFlowWire points={[[427,y],[490,y]]}/>
        <HybridFlowValue x={520} y={y} value={value*weights[index]} name={`product ${index}`} digits={2}/>
        <HybridFlowWire points={[[550,y],[620,y],[620,centre],[690-sumWidth/2-1,centre]]}/>
      </g>;
    })}
    <HybridFlowOperation x={690} y={centre} name={`Σ + ${additionLabel}`} width={sumWidth}/>
    <HybridFlowValue x={690} y={centre+130} value={bias} role={biasRole} digits={2}/>
    <HybridFlowLabel x={730} y={centre+136} role={biasRole}>{biasName}</HybridFlowLabel>
    <HybridFlowWire role={biasRole} points={[[690,centre+100],[690,centre+23]]}/>
    <HybridFlowWire points={[[690+sumWidth/2+1,centre],[820,centre]]}/>
    <HybridFlowValue x={850} y={centre} value={output} name="row output" digits={2}/>
  </HybridFlowDrawing>;
}

function HybridRmsCircuit({ pre, norm, gains, name }) {
  const divisor = 1/norm.scale;
  return <HybridFlowDrawing id="write-rms-circuit" label={`Actual ${name} RMS divisor and coordinate scaling`} width={1100} height={570}
    caption="The two squared coordinates jointly determine one divisor. That same divisor acts on both original coordinates, before the learned coordinate gains. ε is a fixed numerical safeguard, not a learned gain.">
    {pre.map((value,index)=><g key={index}>
      <HybridFlowValue x={90} y={80+index*100} value={value} name={`precursor ${index}`} digits={2}/>
      <HybridFlowWire points={[[120,80+index*100],[253,80+index*100]]}/>
      <HybridFlowOperation x={290} y={80+index*100} name="square"/>
      <HybridFlowWire points={[[327,80+index*100],[390,80+index*100]]}/>
      <HybridFlowValue x={420} y={80+index*100} value={value*value} digits={2}/>
      <HybridFlowWire points={[[450,80+index*100],[490,80+index*100],[490,130],[533,130]]}/>
    </g>)}
    <HybridFlowOperation x={580} y={130} name="Σ / 2" width={92}/>
    <HybridFlowWire points={[[627,130],[693,130]]}/>
    <HybridFlowOperation x={730} y={130} name="+ ε"/>
    <HybridFlowLabel x={730} y={55} anchor="middle">ε = 0.000001</HybridFlowLabel>
    <HybridFlowWire points={[[730,63],[730,107]]}/>
    <HybridFlowWire points={[[767,130],[833,130]]}/>
    <HybridFlowOperation x={870} y={130} name="√"/>
    <HybridFlowWire points={[[870,153],[870,190]]}/>
    <HybridFlowValue x={870} y={220} value={divisor} digits={2}/>
    <HybridFlowLabel x={910} y={226}>RMS divisor</HybridFlowLabel>
    <HybridFlowWire points={[[870,250],[870,290],[400,290],[400,408]]}/>
    {pre.map((value,index)=><g key={`original-${index}`}>
      <HybridFlowValue x={90+index*160} y={430} value={value} digits={2}/>
      <HybridFlowLabel x={90+index*160} y={386} anchor="middle">precursor {index}</HybridFlowLabel>
      <HybridFlowWire points={[[90+index*160,460],[90+index*160,490],[290,490],[290,430],[316,430]]}/>
    </g>)}
    <HybridFlowOperation x={400} y={430} name="vector ÷ RMS" width={165}/>
    <HybridFlowWire points={[[483,430],[547,430]]}/>
    <HybridFlowOperation x={630} y={430} name="× gains" width={165}/>
    {gains.map((value,index)=><g key={index}>
      <HybridFlowValue x={570+index*120} y={330} value={value} role="parameter" digits={2}/>
      <HybridFlowLabel x={570+index*120} y={278} role="parameter" anchor="middle">gain {index}</HybridFlowLabel>
      <HybridFlowWire role="parameter" points={[[570+index*120,360],[570+index*120,385],[630,385],[630,408]]}/>
    </g>)}
    {norm.values.map((value,index)=><g key={`normalized-${index}`}>
      <HybridFlowWire points={[[713,430],[770,430],[770,500],[850+index*180,500],[850+index*180,460]]}/>
      <HybridFlowValue x={850+index*180} y={430} value={value} name={`${name} ${index}`} digits={2}/>
    </g>)}
  </HybridFlowDrawing>;
}

function HybridStateCellCircuit({ trace }) {
  const delta = trace.delta[0], u = trace.transformed[0], write = trace.writeNorm.values[0];
  return <HybridFlowDrawing id="state-cell-circuit" label="Actual channel zero state zero retains its old value and adds the separately computed current write" width={1000} height={890}>
    <HybridFlowValue x={90} y={90} value={1} name="old H[0,0]" digits={2}/>
    <HybridFlowValue x={280} y={90} value={delta} name="current Δ₀" digits={2}/>
    <HybridFlowValue x={480} y={90} value={-1} name="learned A[0,0]" role="parameter" digits={2}/>
    <HybridFlowWire points={[[280,120],[280,210],[363,210]]}/>
    <HybridFlowWire role="parameter" points={[[480,120],[480,210],[437,210]]}/>
    <HybridFlowOperation x={400} y={210} name="×"/>
    <HybridFlowWire points={[[400,233],[400,283]]}/>
    <HybridFlowOperation x={400} y={305} name="exp"/>
    <HybridFlowWire points={[[400,328],[400,370]]}/>
    <HybridFlowValue x={400} y={400} value={trace.decay[0][0]} digits={2}/>
    <HybridFlowLabel x={440} y={406}>retention</HybridFlowLabel>
    <HybridFlowWire points={[[90,120],[90,510],[163,510]]}/>
    <HybridFlowWire points={[[400,430],[400,510],[237,510]]}/>
    <HybridFlowOperation x={200} y={510} name="×"/>
    <HybridFlowWire points={[[200,533],[200,580]]}/>
    <HybridFlowValue x={200} y={610} value={trace.retained[0][0]} digits={2}/>
    <HybridFlowLabel x={240} y={616}>retained old cell</HybridFlowLabel>
    {[delta,u,write].map((value,index)=><g key={index}>
      <HybridFlowValue x={610+index*160} y={90} value={value} name={['same Δ₀','current u₀','current B₀'][index]} digits={2}/>
      <HybridFlowWire points={[[610+index*160,120],[610+index*160,175],[770,175],[770,217]]}/>
    </g>)}
    <HybridFlowOperation x={770} y={240} name="product" width={110}/>
    <HybridFlowWire points={[[770,263],[770,310]]}/>
    <HybridFlowValue x={770} y={340} value={trace.written[0][0]} digits={2}/>
    <HybridFlowLabel x={810} y={346}>current write</HybridFlowLabel>
    <HybridFlowWire points={[[200,640],[200,735],[443,735]]}/>
    <HybridFlowWire points={[[770,370],[770,735],[517,735]]}/>
    <HybridFlowOperation x={480} y={735} name="+"/>
    <HybridFlowWire points={[[480,758],[480,810]]}/>
    <HybridFlowValue x={480} y={840} value={trace.state[0][0]} digits={2}/>
    <HybridFlowLabel x={520} y={846}>new H[0,0]</HybridFlowLabel>
  </HybridFlowDrawing>;
}

function HybridUnaryCircuit({ id, label, input, output, operation }) {
  return <HybridFlowDrawing id={id} label={label} width={620} height={160}>
    <HybridFlowValue x={90} y={95} value={input} name="current input" digits={2}/>
    <HybridFlowWire points={[[120,95],[220,95]]}/>
    <HybridFlowOperation x={300} y={95} name={operation} width={158}/>
    <HybridFlowWire points={[[380,95],[480,95]]}/>
    <HybridFlowValue x={510} y={95} value={output} name="current result" digits={2}/>
  </HybridFlowDrawing>;
}

function HybridDirectSkipCircuit({ trace }) {
  return <HybridFlowDrawing id="direct-skip-circuit" label="The current transformed input and learned direct coefficient multiply independently of the stored-state read" width={650} height={265}>
    <HybridFlowValue x={100} y={70} value={trace.transformed[0]} name="current u₀" digits={2}/>
    <HybridFlowValue x={100} y={210} value={trace.parameters.skip[0]} name="learned D₀" role="parameter" digits={2}/>
    <HybridFlowWire points={[[130,70],[230,70],[230,140],[263,140]]}/>
    <HybridFlowWire role="parameter" points={[[130,210],[230,210],[230,185],[300,185],[300,163]]}/>
    <HybridFlowOperation x={300} y={140} name="×"/>
    <HybridFlowWire points={[[337,140],[480,140]]}/>
    <HybridFlowValue x={510} y={140} value={trace.parameters.skip[0]*trace.transformed[0]} name="direct skip D₀ × u₀" digits={2}/>
  </HybridFlowDrawing>;
}

function HybridMatrixGlyph({ x, y, matrix, name }) {
  return <g>
    <HybridFlowLabel x={x} y={y-20} role="parameter">{name}</HybridFlowLabel>
    {matrix.map((row,i)=>row.map((value,j)=><g key={`${i}-${j}`}>
      <rect x={x+j*72} y={y+i*44} width={66} height={38} fill={value>0?'#352a16':value<0?'#152a3a':'#151515'} stroke={hybridFlowRoles.parameter}/>
      <HybridFlowLabel x={x+33+j*72} y={y+25+i*44} anchor="middle">{number(value)}</HybridFlowLabel>
    </g>))}
  </g>;
}

function HybridGateOutputCircuit({ trace }) {
  return <HybridFlowDrawing id="read-gate-output-circuit" label="The complete read plus skip is multiplied by the separately activated gate before the learned output projection" width={1000} height={950}
    caption="Each × acts on matching channel coordinates. The two gated coordinates then enter the output matrix together. Its rows are output coordinates and columns are gated input coordinates; the constructed identity matrix leaves them unchanged.">
    {trace.value.map((value,index)=><g key={`read-${index}`}>
      <HybridFlowValue x={100+index*150} y={90} value={value} name={`read + skip ${index}`} digits={2}/>
    </g>)}
    {trace.gate.map((value,index)=><g key={`gate-${index}`}>
      <HybridFlowValue x={550+index*150} y={90} value={value} name={`gate precursor ${index}`} digits={2}/>
      <HybridFlowWire points={[[550+index*150,120],[550+index*150,188]]}/>
      <HybridFlowOperation x={550+index*150} y={210} name="SiLU"/>
      <HybridFlowWire points={[[550+index*150,233],[550+index*150,290]]}/>
      <HybridFlowValue x={550+index*150} y={320} value={trace.gateActivated[index]} digits={2}/>
      <HybridFlowLabel x={550+index*150+42} y={326}>gate {index}</HybridFlowLabel>
    </g>)}
    <HybridFlowWire points={[[100,120],[100,450],[263,450]]}/>
    <HybridFlowWire points={[[550,350],[550,450],[337,450]]}/>
    <HybridFlowWire points={[[250,120],[250,400],[650,400],[650,428]]}/>
    <HybridFlowWire points={[[700,350],[700,450],[687,450]]}/>
    {[300,650].map((x,index)=><g key={x}>
      <HybridFlowOperation x={x} y={450} name="×"/>
      <HybridFlowWire points={[[x,473],[x,530]]}/>
      <HybridFlowValue x={x} y={560} value={trace.gated[index]} digits={2}/>
      <HybridFlowLabel x={x+42} y={566}>gated {index}</HybridFlowLabel>
      <HybridFlowWire points={[[x,590],[x,750],[index===0?389:571,750]]}/>
    </g>)}
    <HybridMatrixGlyph x={40} y={665} matrix={trace.parameters.outputWeight} name="learned Wout"/>
    <HybridFlowWire role="parameter" points={[[184,700],[230,700],[230,790],[350,790],[350,730],[389,730],[389,750]]}/>
    <HybridFlowOperation x={480} y={750} name="Wout × vector" width={180}/>
    {trace.output.map((value,index)=><g key={`output-${index}`}>
      <HybridFlowWire points={[[480,773],[480,815],[370+index*230,815],[370+index*230,840]]}/>
      <HybridFlowValue x={370+index*230} y={870} value={value} digits={2}/>
      <HybridFlowLabel x={370+index*230} y={930} anchor="middle">output {index}; zero bias</HybridFlowLabel>
    </g>)}
  </HybridFlowDrawing>;
}

export function HybridSelectiveObjectsDrawing({ trace = hybridTinySelectiveStep() }) {
  return <figure data-figure="hybrid-selective-objects" aria-label="Two-channel mixer input, complete projected history window, old state, learned weights and projected gate">
    <HybridDotCircuit id="input-projection-circuit" label="One complete input projection row produces channel zero" inputs={trace.input} weights={trace.parameters.inputWeight[0]} output={trace.projected[0]}/>
    <HybridDotCircuit id="gate-projection-circuit" label="A separate row of the same input projection produces output gate zero" inputs={trace.input} weights={trace.parameters.inputWeight[2]} output={trace.gate[0]}/>
    <HybridDotCircuit id="convolution-circuit" label="The three actual projected-history operands form channel zero's causal convolution" inputs={trace.window[0]} weights={trace.parameters.convolutionWeight[0]} output={trace.convolution[0]} inputRole="computed"/>
    <HybridUnaryCircuit id="convolution-silu-circuit" label="Channel zero's actual convolution output passes through SiLU" input={trace.convolution[0]} output={trace.transformed[0]} operation="SiLU"/>
    <HybridFlowArray values={trace.input} names={['supplied mixer x₀','supplied mixer x₁']} label="Input vector" role="input"/>
    <HybridFlowMatrix matrix={trace.parameters.inputWeight} rowNames={['projected 0','projected 1','gate0','gate1']} columnNames={['input 0','input 1']} label="Learned input projection W: four outputs by two input coordinates; all four biases 0" role="parameter"/>
    <HybridFlowArray values={[...trace.projected,...trace.gate]} names={['projected 0','projected 1','gate precursor 0','gate precursor 1']} label="Projection split"/>
    <HybridFlowMatrix matrix={trace.window} rowNames={['channel 0','channel 1']} columnNames={['previous t−2','previous t−1','current projected']} label="Causal window: stored projected history and current projected input" role="input"/>
    <HybridFlowMatrix matrix={trace.parameters.convolutionWeight} rowNames={['channel 0','channel 1']} columnNames={['kernel 0','kernel 1','kernel 2']} label="Learned depthwise convolution: each channel uses its own three coefficients; both biases 0" role="parameter"/>
    <HybridFlowArray values={trace.convolution} names={['channel 0 weighted sum','channel 1 weighted sum']} label="Convolution outputs"/>
    <HybridFlowArray values={trace.transformed} names={trace.convolution.map((value,index)=>`u${index} = SiLU(${number(value)})`)} label="Transformed current input"/>
  </figure>;
}

export function HybridSelectiveCoefficientsDrawing({ trace = hybridTinySelectiveStep() }) {
  return <figure data-figure="hybrid-selective-coefficients" aria-label="Complete projections and RMS gains create the current positive timesteps and write/read coordinates">
    <HybridDotCircuit id="timestep-projection-circuit" label="Current transformed inputs form timestep precursor zero before softplus" inputs={trace.transformed} weights={trace.parameters.deltaWeight[0]} bias={trace.parameters.deltaBias[0]} output={trace.deltaPre[0]} inputRole="computed"/>
    <HybridUnaryCircuit id="positive-timestep-circuit" label="Softplus converts the actual current precursor into a positive timestep" input={trace.deltaPre[0]} output={trace.delta[0]} operation="softplus"/>
    <HybridDotCircuit id="write-projection-circuit" label="Current transformed inputs form write precursor zero before RMS normalization" inputs={trace.transformed} weights={trace.parameters.writeWeight[0]} output={trace.writePre[0]} inputRole="computed"/>
    <HybridRmsCircuit pre={trace.writePre} norm={trace.writeNorm} gains={trace.parameters.writeGain} name="normalized B"/>
    <HybridFlowMatrix matrix={trace.parameters.deltaWeight} rowNames={['Δ precursor 0','Δ precursor 1']} columnNames={['u0','u1']} label="Learned timestep projection: biases[−1,−0.5]" role="parameter"/>
    <HybridFlowArray values={trace.deltaPre} names={['Δ precursor 0','Δ precursor 1']} label="Timestep projection output"/>
    <HybridFlowArray values={trace.delta} names={['Δ0=softplus','Δ1=softplus']} label="Positive local timesteps"/>
    {[['write B',trace.parameters.writeWeight,trace.writePre,trace.writeNorm],['read C',trace.parameters.readWeight,trace.readPre,trace.readNorm]].map(([name,weight,pre,norm])=><div key={name}>
      <HybridFlowMatrix matrix={weight} rowNames={[`${name}0`,`${name}1`]} columnNames={['u0','u1']} label={`Learned ${name} projection: zero biases, RMS gains[1,1], ε=0.000001`} role="parameter"/>
      <HybridFlowArray values={pre} names={['projection coordinate 0','projection coordinate 1']} label={`${name} projection`}/>
      <HybridFlowArray values={norm.values} names={[`${name}0`,`${name}1`]} label={`${name} normalized coordinates`}/>
      <p>RMS multiplier {number(norm.scale,6)} applies to both coordinates before their learned gains.</p>
    </div>)}
  </figure>;
}

export function HybridSelectiveStateDrawing({ trace = hybridTinySelectiveStep() }) {
  const rows=['channel 0','channel 1'], columns=['state coordinate 0','state coordinate 1'];
  return <figure data-figure="hybrid-selective-state" aria-label="Elementwise retention plus current outer write produces the new state; read contraction, direct skip and output gate follow">
    <HybridStateCellCircuit trace={trace}/>
    <HybridDirectSkipCircuit trace={trace}/>
    <HybridDotCircuit id="state-read-circuit" label="All cells of the new channel zero state meet their read coefficients before the direct skip is added" inputs={trace.state[0]} weights={trace.readNorm.values} bias={trace.parameters.skip[0]*trace.transformed[0]} output={trace.value[0]} inputRole="computed" weightRole="computed" biasRole="computed" biasName="direct skip D₀ × u₀" additionLabel="skip"/>
    <HybridGateOutputCircuit trace={trace}/>
    <HybridFlowMatrix matrix={[[-1,-2],[-1,-2]]} rowNames={rows} columnNames={columns} label="Learned continuous rates A=−exp(log-rates)" role="parameter"/>
    <HybridFlowMatrix matrix={[[1,2],[-1,.5]]} rowNames={rows} columnNames={columns} label="Carried old H before this input"/>
    <HybridFlowMatrix matrix={trace.decay} rowNames={rows} columnNames={columns} label="Computed decay exp(ΔA), one value for every state cell"/>
    <HybridFlowMatrix matrix={trace.retained} rowNames={rows} columnNames={columns} label="Retained old state: cellwise decay × old H"/>
    <HybridFlowMatrix matrix={trace.written} rowNames={rows} columnNames={columns} label="New write: channel-specific Δu times shared B coordinates"/>
    <HybridFlowMatrix matrix={trace.state} rowNames={rows} columnNames={columns} label="New H: retained old cell + current write cell"/>
    <HybridFlowMatrix matrix={[trace.contraction,trace.parameters.skip,trace.transformed,trace.value]} rowNames={['sum over C×H','learned direct-skip D','current transformed u','read contraction + D×u']} columnNames={['channel 0','channel 1']} label="Exact read contraction and direct path meet before output gating"/>
    <HybridFlowMatrix matrix={[trace.gate,trace.gateActivated,trace.gated]} rowNames={['gate precursor','SiLU(gate precursor)','read value×activated gate']} columnNames={['channel 0','channel 1']} label="The independent projected gate modulates the read, not the stored H matrix"/>
    <HybridFlowMatrix matrix={trace.parameters.outputWeight} rowNames={['output 0','output 1']} columnNames={['gated channel 0','gated channel 1']} label="Complete learned output projection: identity for this constructed example; biases 0" role="parameter"/>
    <HybridFlowArray values={trace.contraction} names={['Σ state 0×C','Σ state 1×C']} label="Read contraction"/>
    <HybridFlowArray values={trace.value} names={['read0+D0u0','read1+D1u1']} label="Read plus direct skip; both learned D coefficients 1"/>
    <HybridFlowArray values={trace.gateActivated} names={['SiLU(gate0)','SiLU(gate1)']} label="Activated output gate"/>
    <HybridFlowArray values={trace.output} names={['output 0','output 1']} label="Gated output; identity output projection and zero biases"/>
  </figure>;
}

export function HybridAffineScanDrawing() {
  const first={a:.5,b:2},second={a:.25,b:-1},third={a:.8,b:.2};
  const pair=hybridFlowCompose(first,second),all=hybridFlowCompose(pair,third);
  return <HybridFlowDrawing id="affine-scan" label="A tree composes the same ordered affine maps before applying them to the supplied starting state" width={620} height={405}>
    {[first,second,third].map((map,index)=><g key={index}>
      <rect x={20+index*200} y={40} width={174} height={75} fill="none" stroke={hybridFlowRoles.computed}/>
      <HybridFlowLabel x={107+index*200} y={67} role="computed" anchor="middle">a={number(map.a)}</HybridFlowLabel>
      <HybridFlowLabel x={107+index*200} y={94} role="computed" anchor="middle">b={number(map.b)}</HybridFlowLabel>
    </g>)}
    <HybridFlowWire points={[[107,115],[107,151],[220,151],[220,183]]}/>
    <HybridFlowWire points={[[307,115],[307,151],[255,151],[255,183]]}/>
    <HybridFlowOperation x={237} y={207} name="right ∘ left" width={170}/>
    <HybridFlowLabel x={237} y={263} role="computed" anchor="middle">pair({number(pair.a)},{number(pair.b)})</HybridFlowLabel>
    <HybridFlowWire points={[[237,271],[237,307],[395,307],[395,322]]}/>
    <HybridFlowWire points={[[507,115],[507,307],[430,307],[430,322]]}/>
    <HybridFlowOperation x={412} y={345} name="right ∘ left" width={170}/>
    <HybridFlowLabel x={412} y={396} role="computed" anchor="middle">all({number(all.a)},{number(all.b)})</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridDiagonalOrderDrawing() {
  const result=hybridFlowDeltaContrast();
  return <figure data-figure="hybrid-diagonal-order" aria-label="Unequal forgetting coefficients and the key correction can produce different old-state transitions in different orders">
    <HybridFlowMatrix matrix={result.matrix} rowNames={['key feature 0','key feature 1']} columnNames={['value coordinate 0','value coordinate 1']} label="Carried associative state S, key-feature by value-coordinate"/>
    <HybridFlowArray values={result.key} names={['unit key0','unit key1']} label="Current key" role="input"/>
    <HybridFlowArray values={result.message} names={['message 0','message 1']} label="Current message" role="input"/>
    <HybridFlowArray values={result.gate} names={['forget feature 0','forget feature 1']} label="Diagonal gate coefficients; correction strength β=0.5"/>
    <HybridFlowMatrix matrix={result.forgetThenCorrect} rowNames={['feature 0','feature 1']} columnNames={['value0','value1']} label="Forget old state, then correct its new read: (I−βkkᵀ)diag(α)S+βkvᵀ"/>
    <HybridFlowMatrix matrix={result.correctThenForget} rowNames={['feature 0','feature 1']} columnNames={['value0','value1']} label="Swap only the old-state operator order, keeping the exact same new write: diag(α)(I−βkkᵀ)S+βkvᵀ"/>
    <figcaption>Maximum absolute cell change {number(result.difference)}. The new outer write is identical; the mismatch isolates the order of the two old-state transformations.</figcaption>
  </figure>;
}

export function HybridAttentionAnatomyDrawing() {
  const keys=[[1,0,0],[0,1,0],[0,0,1]],query=[Math.sqrt(3)*Math.log(9),0,0];
  const masses=[9,1,1],weights=masses.map(value=>value/11),values=[2,7,4];
  return <figure data-figure="hybrid-attention-anatomy" aria-label="Actual supplied query, three separately retained keys and values, scaled scores, probabilities and read contributions">
    <HybridFlowArray values={query} names={['query feature A','query feature B','query feature C']} label="Constructed current three-coordinate query" role="input"/>
    <HybridFlowMatrix matrix={keys} rowNames={['record A','record B','record C']} columnNames={['key feature A','key feature B','key feature C']} label="Three stored keys in the same coordinate basis" role="input"/>
    <HybridFlowMatrix matrix={values.map((value,index)=>[value,index===0?Math.log(9):0,masses[index],weights[index],weights[index]*value])} rowNames={['A','B','C']} columnNames={['stored value','dot(q,k)/√3','exponential mass','mass /11','weight×value']} label="One complete current attention row, including the current record C"/>
    <HybridFlowArray values={[29/11]} names={['sum of value contributions']} label="Actual attention read"/>
    <figcaption>The vector choices are constructed teaching inputs. Their scaled dot products reproduce the earlier scores exactly; they are not exported trained Jamba parameters. No future key is stored in this current row.</figcaption>
  </figure>;
}

export function HybridGroupedHeadsDrawing() {
  return <HybridFlowDrawing id="grouped-heads" label="Four separately computed query heads address the same stored key and value head through four distinct reads" width={1050} height={660}>
    {[0,1,2,3].map(head=><g key={head}>
      <HybridFlowValue x={520} y={80+head*150} value={`q${head}`} role="computed"/>
      <HybridFlowLabel x={475} y={86+head*150} anchor="end">query head {head}</HybridFlowLabel>
      <HybridFlowWire points={[[550,80+head*150],[644,80+head*150]]}/>
      <HybridFlowOperation x={700} y={80+head*150} name="read" width={110}/>
      <HybridFlowWire points={[[170,147],[240,147],[240,40+head*150],[700,40+head*150],[700,57+head*150]]}/>
      <HybridFlowWire points={[[170,327],[270,327],[270,120+head*150],[700,120+head*150],[700,103+head*150]]}/>
      <HybridFlowWire points={[[756,80+head*150],[870,80+head*150]]}/>
      <HybridFlowValue x={900} y={80+head*150} value={`o${head}`} name={`output head ${head}`}/>
    </g>)}
    {['K','V'].map((name,index)=><g key={name}>
      <rect x={40} y={90+index*180} width={130} height={115} fill="none" stroke={hybridFlowRoles.computed}/>
      {[0,1,2].map(row=><line key={row} x1={40} x2={170} y1={118+index*180+row*29} y2={118+index*180+row*29} stroke={hybridFlowRoles.computed}/>)}
      <HybridFlowLabel x={105} y={70+index*180} anchor="middle">shared {name} bank</HybridFlowLabel>
    </g>)}
    <HybridFlowLabel x={15} y={612}>K/V dependencies fan out; query arrows never merge.</HybridFlowLabel>
    <HybridFlowLabel x={15} y={645}>Each read computes its own scores, weights and output.</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridCausalPairsDrawing({ length=5 }) {
  return <HybridFlowDrawing id="causal-pairs" label="The exact permitted query-key pairs form a lower triangle and one appended decoding row" width={520} height={390}>
    <HybridFlowLabel x={115} y={26}>stored key position →</HybridFlowLabel>
    {Array.from({length:length+1},(_,key)=><HybridFlowLabel key={key} x={146+key*50} y={60} anchor="middle">{key}</HybridFlowLabel>)}
    {Array.from({length:length+1},(_,query)=><g key={query}>
      <HybridFlowLabel x={91} y={98+query*43} anchor="end">q{query}</HybridFlowLabel>
      {Array.from({length:length+1},(_,key)=><rect key={key} x={127+key*50} y={74+query*43} width={38} height={32} fill={key<=query?'#171020':'#151515'} stroke={key<=query?(query===length?'#fff':hybridFlowRoles.computed):'#444'} strokeWidth={query===length&&key<=query?2:1}/>)}
    </g>)}
    <HybridFlowLabel x={12} y={361}>Violet: {length*(length+1)/2} permitted prompt pairs.</HybridFlowLabel>
    <HybridFlowLabel x={12} y={386}>White outline: {length+1} pairs for one appended query.</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridCacheAnatomyDrawing() {
  return <HybridFlowDrawing id="storage-anatomy" label="Recurrent state has channel and state-coordinate axes; short history has recent-position slots; K and V append full position rows" width={650} height={475}>
    <HybridFlowLabel x={16} y={26}>Selective state H</HybridFlowLabel>
    <HybridFlowLabel x={16} y={57}>channels ↓; states →</HybridFlowLabel>
    {Array.from({length:4},(_,channel)=>Array.from({length:3},(_,state)=><rect key={`h${channel}-${state}`} x={22+state*46} y={83+channel*40} width={40} height={34} fill="#171020" stroke={hybridFlowRoles.computed}/>))}
    <HybridFlowLabel x={205} y={26}>Short projected history</HybridFlowLabel>
    <HybridFlowLabel x={205} y={57}>channels ↓; old slots →</HybridFlowLabel>
    {Array.from({length:4},(_,channel)=>Array.from({length:2},(_,slot)=><rect key={`c${channel}-${slot}`} x={225+slot*53} y={83+channel*40} width={47} height={34} fill="#171020" stroke={hybridFlowRoles.computed}/>))}
    {['K','V'].map((name,bank)=><g key={name}>
      <HybridFlowLabel x={405+bank*125} y={26}>{name} bank</HybridFlowLabel>
      {Array.from({length:4},(_,position)=><g key={position}><rect x={402+bank*125} y={84+position*40} width={100} height={33} fill="#171020" stroke={hybridFlowRoles.computed}/><HybridFlowLabel x={452+bank*125} y={107+position*40} anchor="middle">row{position}</HybridFlowLabel></g>)}
      <HybridFlowWire points={[[452+bank*125,247],[452+bank*125,281]]}/>
      <rect x={402+bank*125} y={288} width={100} height={33} fill="#152a3a" stroke={hybridFlowRoles.input}/>
      <HybridFlowLabel x={452+bank*125} y={312} role="input" anchor="middle">append</HybridFlowLabel>
    </g>)}
    <HybridFlowLabel x={15} y={372}>Representative cutaway axes show storage shapes.</HybridFlowLabel>
    <HybridFlowLabel x={15} y={404}>Each depth layer and request owns a separate bundle.</HybridFlowLabel>
    <HybridFlowLabel x={15} y={435}>Weights are shared; temporary work has a separate lifetime.</HybridFlowLabel>
    <HybridFlowLabel x={15} y={466}>These rectangles do not depict invented activation values.</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridSwiGluDrawing() {
  const input=[1,2],gateWeights=[[1,0],[0,-1]],upWeights=[[1,1],[-1,1]],downWeights=[[1,.5],[.25,-1]];
  const gate=[1,-2],up=[3,1],hidden=gate.map((value,index)=>value/(1+Math.exp(-value))*up[index]);
  const output=downWeights.map(row=>sum(row.map((value,index)=>value*hidden[index])));
  return <figure data-figure="hybrid-swiglu" aria-label="One complete constructed two-coordinate gated feed-forward operator">
    <HybridFlowDrawing id="swiglu-circuit" label="One supplied vector takes parallel learned gate and up projections; SiLU gates coordinatewise before the down projection" width={900} height={1230}
      caption="Both projection branches receive the same two input coordinates. Gate and up values meet only at their matching coordinate's ×. Matrix rows are outputs and columns are inputs; warm, blue and neutral numbered cells denote positive, negative and zero entries.">
      {input.map((value,index)=><g key={`input-${index}`}>
        <HybridFlowValue x={360+index*160} y={60} value={value} name={`input ${index}`} role="input" digits={2}/>
        <HybridFlowWire points={[[360+index*160,90],[360+index*160,100],[440,100],[440,120],[300,120],[300,248]]}/>
        <HybridFlowWire points={[[360+index*160,90],[360+index*160,100],[440,100],[440,120],[600,120],[600,248]]}/>
      </g>)}
      <HybridMatrixGlyph x={40} y={165} matrix={gateWeights} name="learned Wg"/>
      <HybridMatrixGlyph x={640} y={165} matrix={upWeights} name="learned Wu"/>
      <HybridFlowWire role="parameter" points={[[184,200],[220,200],[220,270],[239,270]]}/>
      <HybridFlowWire role="parameter" points={[[640,210],[620,210],[620,240],[630,240],[630,247]]}/>
      <HybridFlowOperation x={300} y={270} name="Wg × x" width={120}/>
      <HybridFlowOperation x={600} y={270} name="Wu × x" width={120}/>
      {[gate,up].map((vector,branch)=>vector.map((value,index)=><g key={`${branch}-${index}`}>
        <HybridFlowWire points={[[300+branch*300,293],[300+branch*300,350],[260+branch*300+index*80,350],[260+branch*300+index*80,370]]}/>
        <HybridFlowValue x={260+branch*300+index*80} y={400} value={value} digits={2}/>
        <HybridFlowLabel x={260+branch*300+index*80+(index===0?-45:45)} y={406} anchor={index===0?'end':'start'}>{branch===0?'gate':'up'} {index}</HybridFlowLabel>
      </g>))}
      {gate.map((_,index)=><HybridFlowWire key={index} points={[[260+index*80,430],[260+index*80,475],[300,475],[300,493]]}/>)}
      <HybridFlowOperation x={300} y={515} name="SiLU vector" width={130}/>
      {gate.map((value,index)=><g key={`activated-${index}`}>
        <HybridFlowWire points={[[300,538],[300,565],[260+index*80,565],[260+index*80,580]]}/>
        <HybridFlowValue x={260+index*80} y={610} value={value/(1+Math.exp(-value))} digits={2}/>
      </g>)}
      <HybridFlowWire points={[[260,640],[260,690],[220,690],[220,740],[263,740]]}/>
      <HybridFlowWire points={[[560,430],[560,740],[337,740]]}/>
      <HybridFlowWire points={[[340,640],[340,700],[600,700],[600,718]]}/>
      <HybridFlowWire points={[[640,430],[640,740],[637,740]]}/>
      {[300,600].map((x,index)=><g key={x}>
        <HybridFlowOperation x={x} y={740} name="×"/>
        <HybridFlowWire points={[[x,763],[x,820]]}/>
        <HybridFlowValue x={x} y={850} value={hidden[index]} digits={2}/>
        <HybridFlowLabel x={x+40} y={856}>hidden {index}</HybridFlowLabel>
        <HybridFlowWire points={[[x,880],[x,960],[450,960],[450,988]]}/>
      </g>)}
      <HybridMatrixGlyph x={40} y={925} matrix={downWeights} name="learned Wd"/>
      <HybridFlowWire role="parameter" points={[[184,960],[200,960],[200,1010],[359,1010]]}/>
      <HybridFlowOperation x={450} y={1010} name="Wd × hidden" width={180}/>
      {output.map((value,index)=><g key={`output-${index}`}>
        <HybridFlowWire points={[[450,1033],[450,1090],[360+index*180,1090],[360+index*180,1120]]}/>
        <HybridFlowValue x={360+index*180} y={1150} value={value} digits={2}/>
        <HybridFlowLabel x={360+index*180} y={1210} anchor="middle">output {index}</HybridFlowLabel>
      </g>)}
    </HybridFlowDrawing>
    <HybridFlowArray values={input} names={['normalized input 0','normalized input 1']} label="Constructed supplied normalized vector" role="input"/>
    <HybridFlowMatrix matrix={gateWeights} rowNames={['gate0','gate1']} columnNames={['input 0','input 1']} label="Learned gate matrix Wg; biases 0" role="parameter"/>
    <HybridFlowMatrix matrix={upWeights} rowNames={['up0','up1']} columnNames={['input 0','input 1']} label="Learned up matrix Wu; biases 0" role="parameter"/>
    <HybridFlowMatrix matrix={[gate,up,hidden]} rowNames={['gate precursors','up values','SiLU(gate)×up']} columnNames={['hidden0','hidden1']} label="Parallel gate and value routes meet in coordinatewise products"/>
    <HybridFlowMatrix matrix={downWeights} rowNames={['output 0','output 1']} columnNames={['hidden0','hidden1']} label="Learned down matrix Wd; biases 0" role="parameter"/>
    <HybridFlowArray values={output} names={['weighted hidden sum 0','weighted hidden sum 1']} label="Complete feed-forward output"/>
    <figcaption>All coefficients are constructed for this example. The earlier vector receives this output at its second residual addition. Gate, up and down matrices belong to the current position's FFN; they do not store an input history.</figcaption>
  </figure>;
}

export function HybridExpertBankDrawing({ selected=[0,1] }) {
  return <HybridFlowDrawing id="expert-bank" label="All four expert matrix triples are stored; only the selected triples execute for the current token" width={640} height={385}>
    {[0,1,2,3].map(expert=><g key={expert}>
      <HybridFlowLabel x={85+expert*155} y={28} anchor="middle">expert E{expert}</HybridFlowLabel>
      {['gate','up','down'].map((name,index)=><g key={name}><rect x={30+expert*155+index*9} y={65+index*45} width={80} height={70} fill="#362a13" stroke={hybridFlowRoles.parameter}/><HybridFlowLabel x={70+expert*155+index*9} y={92+index*45} anchor="middle" role="parameter">{name}</HybridFlowLabel></g>)}
      <HybridFlowLabel x={85+expert*155} y={272} anchor="middle">{selected.includes(expert)?'executed now':'stored only'}</HybridFlowLabel>
    </g>)}
    <HybridFlowLabel x={15} y={321}>Other tokens can select different stored experts.</HybridFlowLabel>
    <HybridFlowLabel x={15} y={365}>Active for one token and stored in memory are different counts.</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridPrecisionDrawing() {
  return <HybridFlowDrawing id="weight-precision" label="Selected int8 weight tiles are dequantized to the compute dtype before their matrix product; activation range is a separate issue" width={670} height={430}>
    <HybridFlowLabel x={15} y={26}>Weight-storage path (selected expert matrices)</HybridFlowLabel>
    {[[50,'INT8 tile'],[270,'scale × integer'],[510,'BF16 product']].map(([x,name],index)=><g key={name}><rect x={x} y={70} width={150} height={90} fill="none" stroke={index===0?hybridFlowRoles.parameter:hybridFlowRoles.computed}/><HybridFlowLabel x={x+75} y={118} anchor="middle">{name}</HybridFlowLabel>{index<2&&<HybridFlowWire points={[[x+151,115],[x+195,115]]}/>}</g>)}
    <HybridFlowLabel x={15} y={221}>Activation range is independent of stored weight bytes.</HybridFlowLabel>
    <line x1={55} x2={590} y1={300} y2={300} stroke={hybridFlowRoles.forward}/>
    {[[-1,85,'−65504'],[0,320,'0'],[1,555,'65504']].map(([_,x,label])=><g key={label}><line x1={x} x2={x} y1={290} y2={310} stroke={hybridFlowRoles.operation}/><HybridFlowLabel x={x} y={342} anchor="middle">{label}</HybridFlowLabel></g>)}
    <HybridFlowLabel x={320} y={387} anchor="middle">FP16 finite range; BF16 has a wider exponent range.</HybridFlowLabel>
    <HybridFlowLabel x={320} y={419} anchor="middle">Wider range does not mean finer precision.</HybridFlowLabel>
  </HybridFlowDrawing>;
}

export function HybridRequestForkDrawing() {
  return <HybridFlowDrawing id="request-fork" label="A request prefix produces an immutable snapshot and two independent continuation bundles; a separate request cannot share mutable state" width={670} height={422} caption="Request S has its own prefix bundle: compatible shapes do not establish the same input identity. Rewind appended K/V by truncating rows; rewind recurrent H by restoring a snapshot or recomputing the prefix. Clone before mutation and reject a wrong model, basis, batch or offset first.">
    <HybridFlowLabel x={15} y={29} role="input">Request R: model identity, input basis, processed offset 3</HybridFlowLabel>
    <rect x={180} y={72} width={310} height={120} fill="none" stroke={hybridFlowRoles.computed}/>
    <HybridFlowLabel x={335} y={105} anchor="middle">R prefix bundle</HybridFlowLabel>
    <HybridFlowLabel x={335} y={141} anchor="middle">H + projected history + K/V</HybridFlowLabel>
    <HybridFlowLabel x={335} y={175} anchor="middle">all layer-specific tensors</HybridFlowLabel>
    {[160,510].map((x,index)=><g key={x}>
      <HybridFlowWire points={[[335,193],[335,230],[x,230],[x,272]]}/>
      <rect x={x-133} y={280} width={266} height={115} fill="none" stroke={hybridFlowRoles.computed}/>
      <HybridFlowLabel x={x} y={313} anchor="middle">R branch {index+1}: deep clone</HybridFlowLabel>
      <HybridFlowLabel x={x} y={348} anchor="middle">independent tensor storage</HybridFlowLabel>
      <HybridFlowLabel x={x} y={382} anchor="middle">own appended suffix / offset</HybridFlowLabel>
    </g>)}
  </HybridFlowDrawing>;
}

export function HybridAlternativeRoutesDrawing() {
  const strip = (x, y, name, role = 'computed') => <g>
    <HybridFlowLabel x={x} y={y - 15} role={role}>{name}</HybridFlowLabel>
    {[0, 1, 2, 3].map(cell => <rect key={cell} x={x + cell * 29} y={y} width={25} height={26} fill="none" stroke={hybridFlowRoles[role]}/>) }
  </g>;
  return <><HybridFlowDrawing id="alternative-routes" width={650} height={1540}
    label="Actual serial, shared-weight, windowed and parallel information routes"
    caption="Cyan marks supplied input; amber marks learned weights or learned starting tokens; violet marks computed representations. Arrows carry the marked representation. Operation names belong inside their operator, rather than replacing the drawn route.">
    <HybridFlowLabel x={15} y={28}>Serial: the later operation receives the earlier output</HybridFlowLabel>
    {strip(45, 75, 'layer input', 'input')}
    <HybridFlowWire points={[[163,88],[205,88]]}/>
    <HybridFlowOperation x={268} y={88} name="state update" width={120}/>
    <HybridFlowWire points={[[329,88],[382,88]]}/>
    {strip(392, 75, 'transformed vector')}
    <HybridFlowWire points={[[509,88],[590,88],[590,175],[448,175]]}/>
    <HybridFlowOperation x={372} y={175} name="attention read" width={145}/>
    <HybridFlowWire points={[[298,175],[221,175]]}/>
    {strip(94, 162, 'later output')}

    <HybridFlowLabel x={15} y={279}>Shared weights: two invocations, two current inputs</HybridFlowLabel>
    <rect x={270} y={310} width={92} height={76} fill="none" stroke={hybridFlowRoles.parameter}/>
    {[1, 2].map(index => <line key={index} x1={270} x2={362} y1={310 + index * 25} y2={310 + index * 25} stroke={hybridFlowRoles.parameter}/>) }
    <HybridFlowLabel x={316} y={417} role="parameter" anchor="middle">shared W</HybridFlowLabel>
    {[{ y: 475, label: 'depth input x¹', name: 'invocation 1' }, { y: 630, label: 'depth input x²', name: 'invocation 2' }].map(({ y, label, name }) => <g key={name}>
      {strip(25, y, label)}
      {strip(25, y+64, 'original embedding', 'input')}
      <HybridFlowWire points={[[143,y+13],[189,y+13]]}/>
      <HybridFlowWire points={[[143,y+77],[230,y+77],[230,y+36]]}/>
      <HybridFlowOperation x={230} y={y+13} name="concat" width={80}/>
      <HybridFlowWire points={[[271,y+13],[291,y+13]]}/>
      <HybridFlowOperation x={365} y={y+13} name="same module" width={145}/>
      <HybridFlowWire role="parameter" points={[[316,386],[448,386],[448,y-49],[365,y-49],[365,y-9]]}/>
      <HybridFlowWire points={[[439,y+13],[478,y+13]]}/>
      {strip(490,y,`output ${name.slice(-1)}`)}
      <HybridFlowLabel x={490} y={y+64}>{name}</HybridFlowLabel>
      <HybridFlowLabel x={490} y={y+99}>New activations</HybridFlowLabel>
      <HybridFlowLabel x={490} y={y+119}>and keys</HybridFlowLabel>
    </g>)}
    <HybridFlowLabel x={15} y={776}>Weight arrows reuse coefficients, not an earlier key bank.</HybridFlowLabel>

    <HybridFlowLabel x={15} y={827}>Windowed read: query 5 can address only rows 3–5 here</HybridFlowLabel>
    {[0,1,2,3,4,5].map(position => <g key={position}>
      <rect x={38+position*94} y={869} width={78} height={39} fill={position>=3?'#171020':'#151515'} stroke={position>=3?hybridFlowRoles.computed:'#555'}/>
      <HybridFlowLabel x={77+position*94} y={895} anchor="middle">row {position}</HybridFlowLabel>
      {position>=3&&<HybridFlowWire points={[[77+position*94,909],[77+position*94,955],[466,955],[466,981]]}/>}
    </g>)}
    <HybridFlowOperation x={466} y={1004} name="query 5 read" width={150}/>
    <HybridFlowLabel x={15} y={1062}>Rows 0–2 have no direct read arrow in this window.</HybridFlowLabel>
    <HybridFlowLabel x={15} y={1092}>Earlier information can still arrive through carried state.</HybridFlowLabel>

    <HybridFlowLabel x={15} y={1193}>Parallel: the same input feeds both branches</HybridFlowLabel>
    {strip(263, 1235, 'same layer input', 'input')}
    <HybridFlowWire points={[[321,1262],[321,1281],[160,1281],[160,1303]]}/>
    <HybridFlowWire points={[[321,1262],[321,1281],[480,1281],[480,1303]]}/>
    <HybridFlowOperation x={160} y={1326} name="state update" width={140}/>
    <HybridFlowOperation x={480} y={1326} name="attention read" width={150}/>
    {[160,480].map(x => <g key={x}><HybridFlowWire points={[[x,1349],[x,1383]]}/><HybridFlowOperation x={x} y={1406} name="normalize × scale" width={195}/><HybridFlowWire points={[[x,1429],[x,1462],[320,1462],[320,1483]]}/></g>)}
    <HybridFlowOperation x={320} y={1506} name="add"/>
  </HybridFlowDrawing>
  <HybridFlowDrawing id="learned-prefix" label="Learned starting tokens precede the supplied sequence; their weights are not new external records" width={650} height={175}>
    <HybridFlowLabel x={15} y={27} role="parameter">Learned starting tokens</HybridFlowLabel>
    <HybridFlowLabel x={350} y={27} role="input">Supplied sequence</HybridFlowLabel>
    {[0,1,2,3,4,5].map(index => <g key={index}><rect x={20+index*102} y={65} width={87} height={39} fill="none" stroke={hybridFlowRoles[index<3?'parameter':'input']}/><HybridFlowLabel x={63+index*102} y={91} role={index<3?'parameter':'input'} anchor="middle">{index<3?`meta ${index}`:`input ${index-3}`}</HybridFlowLabel></g>)}
    <HybridFlowWire points={[[30,140],[620,140]]}/>
    <HybridFlowLabel x={15} y={171}>Process this prefixed sequence through the defined branches.</HybridFlowLabel>
  </HybridFlowDrawing></>;
}

export function HybridSharedWeightsDrawing() {
  return <figure data-figure="hybrid-shared-weight-counterexample" aria-label="The same learned identity projection gives different keys for two different depth inputs">
    <HybridFlowMatrix matrix={[[1,0],[0,1]]} rowNames={['key feature 0','key feature 1']} columnNames={['input feature 0','input feature 1']} label="One shared constructed projection W; zero bias" role="parameter"/>
    <HybridFlowMatrix matrix={[[1,0],[0,1]]} rowNames={['invocation1 input','invocation2 input']} columnNames={['input feature 0','input feature 1']} label="Two different current representations supplied to that same W" role="input"/>
    <HybridFlowDrawing id="shared-keys" label="Both inputs traverse the same projection but retain different computed keys" width={600} height={280}>
      {[[105,'[1,0]','key¹=[1,0]'],[435,'[0,1]','key²=[0,1]']].map(([x,input,key]) => <g key={key}>
        <HybridFlowLabel x={x} y={27} role="input" anchor="middle">input {input}</HybridFlowLabel>
        <HybridFlowWire points={[[x,43],[x,78]]}/>
        <HybridFlowOperation x={x} y={101} name="shared W" width={125}/>
        <HybridFlowWire points={[[x,124],[x,171]]}/>
        <HybridFlowLabel x={x} y={198} role="computed" anchor="middle">{key}</HybridFlowLabel>
      </g>)}
      <HybridFlowLabel x={15} y={253}>Identical parameters alone do not imply identical key values.</HybridFlowLabel>
    </HybridFlowDrawing>
  </figure>;
}

export function HybridApplicationInterventionsDrawing() {
  const record = (x,y,key,value) => <g>
    <HybridFlowLabel x={x} y={y-13}>record</HybridFlowLabel>
    <rect x={x} y={y} width={225} height={72} fill="none" stroke={hybridFlowRoles.input}/>
    <HybridFlowLabel x={x+12} y={y+26} role="input">key: {key}</HybridFlowLabel>
    <HybridFlowLabel x={x+12} y={y+57} role="input">value: {value}</HybridFlowLabel>
  </g>;
  return <HybridFlowDrawing id="application-interventions" label="Changing an address and reordering a correction test different information needs" width={650} height={805}>
    <HybridFlowLabel x={15} y={28}>Address-sensitive test: same report, one changed identifier</HybridFlowLabel>
    {record(25,90,'part P17','bearing fault')}
    {record(360,90,'part P71','bearing fault')}
    <HybridFlowWire points={[[251,125],[347,125]]}/>
    <HybridFlowLabel x={275} y={107} anchor="middle">edit key</HybridFlowLabel>
    <HybridFlowLabel x={15} y={220}>Question: which part does this report identify?</HybridFlowLabel>
    <HybridFlowLabel x={15} y={252}>Expected answer changes from P17 to P71; cite that record.</HybridFlowLabel>
    <HybridFlowLabel x={15} y={350}>Order-sensitive test: same two records, reversed arrival</HybridFlowLabel>
    {record(25,413,'setting','rate = 0.1')}
    {record(25,561,'correction','rate = 0.01')}
    {record(360,413,'correction','rate = 0.01')}
    {record(360,561,'setting','rate = 0.1')}
    <HybridFlowWire points={[[137,486],[137,543]]}/>
    <HybridFlowWire points={[[472,486],[472,543]]}/>
    <HybridFlowLabel x={15} y={701}>Question: under a stated latest-record rule, which rate applies?</HybridFlowLabel>
    <HybridFlowLabel x={15} y={735}>Left: 0.01. Right: 0.1. The rule and evidence must be explicit.</HybridFlowLabel>
    <HybridFlowLabel x={15} y={782}>Neither diagram is a measured language-model result.</HybridFlowLabel>
  </HybridFlowDrawing>;
}

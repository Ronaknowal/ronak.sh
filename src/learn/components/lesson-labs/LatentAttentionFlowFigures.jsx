import { useId } from 'react';
import { flowNumber as number } from './LessonFlow.jsx';
import { latentOpeningInputs, latentOpeningDownMap, latentManualCase, latentCaseRead } from '../../data/latent-attention-reading-fixtures.js';
import { matvec, multiply, transpose, rotationOrder, rankOne, latentBudget } from '../../data/latent-attention-models.js';
import { latentBasisStatus, latentBlockMerge } from '../../data/latent-attention-reading-fixtures.js';
import './latent-attention-flow.css';

export const mlaColors = { input: '#77cddb', parameter: '#e4b752', computed: '#be9cf5', operation: '#e8e6df', edge: '#99978f', backward: '#eda064' };
export const mlaVector = (row, digits = 5) => row == null ? 'undefined' : `[${row.map(value => number(value, digits)).join(', ')}]`;

export function MlaDrawing({ label, width = 340, height, children }) {
  const id = useId();
  return <figure className="mla-flow-drawing">
    <span className={`mla-flow-scroll-hint${width <= 400 ? ' mla-flow-scroll-hint--small' : ''}`}>This connected drawing can scroll sideways. Focus it and use the arrow keys to inspect every labelled part.</span>
    <div className="mla-flow-scroll" tabIndex={0} role="region" aria-label={label}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={id} style={{ minWidth: width, maxWidth: width }}>
        <title id={id}>{label}</title>{children}
      </svg>
    </div>
  </figure>;
}
export function MlaText({ x, y, children, role = 'operation', anchor = 'middle', size = 15 }) {
  return <text x={x} y={y} fill={mlaColors[role]} textAnchor={anchor} fontSize={size}>{children}</text>;
}
export function MlaCells({ x, y, values, label, role = 'computed', width = 84, height = 38, digits = 4, selectedRow = null, rowLabels }) {
  const rows = Array.isArray(values[0]) ? values : [values];
  return <g>{label && <MlaText x={x + rows[0].length * width / 2} y={y - 15} role={role}>{label}</MlaText>}
    {rowLabels?.map((label,index)=><MlaText key={index} x={x-8} y={y+index*height+25} anchor="end">{label}</MlaText>)}
    {rows.map((row, i) => row.map((value, j) => <g key={`${i}:${j}`}>
      <rect x={x + j * width} y={y + i * height} width={width} height={height}
        stroke={i === selectedRow ? '#ffffff' : mlaColors[role]} strokeWidth={i === selectedRow ? 2 : 1}
        fill={typeof value === 'number' && value !== 0 ? '#e8e6df0c' : 'none'}/>
      <MlaText x={x + (j + .5) * width} y={y + i * height + 25}>{typeof value === 'number' ? number(value, digits) : value}</MlaText>
    </g>))}
  </g>;
}
export function MlaArrow({ path, x1, y1, x2, y2, backward = false }) {
  const id = useId(), color = backward ? mlaColors.backward : mlaColors.edge;
  return <g><defs><marker id={id} markerWidth={7} markerHeight={7} refX={6} refY={3.5} orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L7 3.5 L0 7" fill={color}/></marker></defs>
    <path d={path ?? `M${x1} ${y1} L${x2} ${y2}`} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray={backward ? '5 4' : undefined} markerEnd={`url(#${id})`}/>
  </g>;
}
export function MlaJunction({ x, y, symbol = '+', radius = 18 }) {
  return <g><circle cx={x} cy={y} r={radius} fill="none" stroke={mlaColors.edge}/><MlaText x={x} y={y + 5}>{symbol}</MlaText></g>;
}

export function MlaOpeningDownDrawing() {
  const input = latentOpeningInputs[0], map = latentOpeningDownMap, output = matvec(map, input);
  return <MlaDrawing label="Three input coordinates multiply two actual learned map rows; each row's products sum to one latent coordinate" height={580}>
    <MlaCells x={44} y={62} values={input} width={84} role="input" label="Input A: three coordinates"/>
    <MlaCells x={44} y={185} values={map} width={84} role="parameter" label="Two map rows, three columns"/>
    <MlaArrow path="M44 81 H20 V352 H152"/><MlaArrow x1={170} y1={261} x2={170} y2={334}/>
    <MlaJunction x={170} y={352} symbol="×"/>
    <MlaText x={194} y={322} anchor="start">Multiply</MlaText>
    <MlaText x={194} y={344} anchor="start">each pair</MlaText>
    <MlaArrow x1={170} y1={370} x2={170} y2={420}/>
    <MlaCells x={44} y={420} values={map.map(row => row.map((value, coordinate) => value * input[coordinate]))} width={84} label="Actual products, before summing"/>
    <MlaArrow x1={44} y1={439} x2={20} y2={439}/><MlaArrow path="M20 439 V541 H86"/>
    <MlaArrow x1={296} y1={477} x2={320} y2={477}/><MlaArrow path="M320 477 V541 H254"/>
    <MlaCells x={86} y={522} values={output} label="Stored latent c_A: two sums"/>
  </MlaDrawing>;
}

export function MlaHeadProjectionDrawing({ head = 0, latent = [1, 0], keyMap, valueMap }) {
  const defaults = latentManualCase();
  const k = keyMap ?? defaults.keyUp[head], v = valueMap ?? defaults.valueUp[head];
  return <MlaDrawing label={`Head ${head}: one shared two-coordinate latent feeds different actual key and value maps`} height={520}>
    <MlaCells x={86} y={54} values={latent} label="The same stored c_A"/>
    <MlaArrow path="M170 92 V120 H77 V273"/><MlaArrow path="M170 120 H263 V273"/>
    <MlaCells x={9} y={168} values={k} width={68} role="parameter" label={`Head ${head} key map`}/>
    <MlaCells x={195} y={168} values={v} width={68} role="parameter" label={`Head ${head} value map`}/>
    <MlaArrow path="M145 206 H159 V292 H95"/><MlaArrow path="M331 206 H339 V292 H281"/>
    <MlaJunction x={77} y={292} symbol="×"/><MlaJunction x={263} y={292} symbol="×"/>
    <MlaArrow x1={77} y1={310} x2={77} y2={365}/><MlaArrow x1={263} y1={310} x2={263} y2={365}/>
    <MlaCells x={9} y={365} values={matvec(k,latent).map(value=>[value])} width={136} label="Computed key"/>
    <MlaCells x={195} y={365} values={matvec(v,latent).map(value=>[value])} width={136} label="Computed value"/>
    <MlaText x={170} y={474}>Head {head} changes the maps,</MlaText>
    <MlaText x={170} y={503}>not the identity of the stored c_A.</MlaText>
  </MlaDrawing>;
}

export function MlaOpeningProjectionsDrawing() {
  return <div className="mla-independent-scenes"><MlaHeadProjectionDrawing head={0}/><MlaHeadProjectionDrawing head={1}/></div>;
}

export function MlaContentReadDrawing({ state = latentManualCase(), head = 0, positioned = false, result: supplied }) {
  const result = supplied ?? latentCaseRead(state,{positioned});
  if (!result.defined) return <p>{result.reason}</p>;
  const row = result.heads[head], records=state.latent.length, junctionY=190+records*38,
    productY=junctionY-records*19, tableY=junctionY+records*19+70, height=tableY+records*38+110;
  const hasPosition=result.positioned, names=hasPosition?['Logical ID','Content dot','Rotary dot','Scaled logit','Shifted exp','Weight']:['Record','Content dot','Scaled logit','Shifted exp','Weight'];
  const steps=row.content.map((value,index)=>hasPosition?[state.positions[index],value,row.rotary[index],row.logits[index],row.exponentials[index],row.weights[index]]:[`#${index}`,value,row.logits[index],row.exponentials[index],row.weights[index]]);
  return <MlaDrawing label={`Head ${head}: actual query/key coordinate products and row sums, followed by the computed score and normalization table`} width={880} height={height}>
    <MlaCells x={45} y={62} values={row.query} label={`Head ${head} query`}/>
    <MlaCells x={320} y={62} values={row.keys} label="Reconstructed content keys" rowLabels={state.positions.map((_,i)=>`#${i}`)}/>
    <MlaArrow path={`M129 100 V${junctionY} H242`}/><MlaArrow path={`M404 ${62+records*38} V${junctionY-45} H260 V${junctionY-18}`}/>
    <MlaJunction x={260} y={junctionY} symbol="×"/>
    <MlaCells x={515} y={productY} values={row.contentProducts} label="Products for each source record" rowLabels={state.positions.map((_,i)=>`#${i}`)}/>
    <MlaArrow x1={278} y1={junctionY} x2={515} y2={junctionY}/>
    <MlaArrow x1={683} y1={junctionY} x2={689} y2={junctionY}/><MlaJunction x={707} y={junctionY} symbol="Σ"/>
    <MlaArrow x1={725} y1={junctionY} x2={751} y2={junctionY}/>
    <MlaCells x={751} y={productY} values={row.content.map(value=>[value])} width={120} label="Row sums"/>
    <MlaCells x={30} y={tableY} values={steps} width={120} digits={6}/>
    {names.map((name,index)=><MlaText key={name} x={90+120*index} y={tableY-19}>{name}</MlaText>)}
    <MlaText x={804} y={tableY+25}>Scale</MlaText><MlaText x={804} y={tableY+54}>{number(result.scale,6)}</MlaText>
    <MlaText x={440} y={tableY+records*38+42}>Exponential mass = {number(row.mass,6)}; every weight divides by this same mass.</MlaText>
    <MlaText x={440} y={tableY+records*38+77}>{hasPosition?'A forbidden record has exponential and weight zero. Legal weights sum to one.':'Each record has a positive amount; normalized weights sum to one.'}</MlaText>
  </MlaDrawing>;
}

export function MlaNormalizationDrawing({ read, head = 0 }) {
  if (!read.defined) return <p>{read.reason}</p>;
  const row = read.heads[head], n = row.logits.length, step = n * 38 + 85;
  const stages = [
    ['Scaled scores, source-record order', row.logits],
    [`Subtract largest legal score ${number(Math.max(...row.logits.filter((_,i)=>read.legal[i])),6)}`, row.shifted.map(value=>value===null?'forbidden':value)],
    ['Exponential of each legal shifted score', row.exponentials],
    [`Divide every amount by mass ${number(row.mass,6)}`, row.weights],
  ];
  return <MlaDrawing label={`Head ${head}: stable softmax subtracts one common maximum, exponentiates each legal score and divides each amount by the same mass`} width={400} height={stages.length*step+60}>
    {stages.map(([label,values],index)=><g key={label}>
      <MlaCells x={156} y={55+index*step} values={values.map(value=>[value])} width={150} label={label} digits={6} rowLabels={values.map((_,i)=>`record ${i}`)}/>
      {index<stages.length-1&&<MlaArrow x1={231} y1={55+index*step+n*38} x2={231} y2={55+(index+1)*step}/>}
    </g>)}
  </MlaDrawing>;
}

export function MlaKeyAbsorptionDrawing({ state = latentManualCase(), head = 0, read = latentCaseRead(state,{positioned:false}) }) {
  if (!read.defined) return <p>{read.reason}</p>;
  const row=read.heads[head], n=read.latent.length, y=350+n*38;
  return <MlaDrawing label={`Head ${head}: transpose the key up-map into the current query once, then compare it directly to every stored latent`} width={640} height={y+n*38+80}>
    <MlaCells x={32} y={62} values={row.query} label="Already computed query q"/>
    <MlaCells x={363} y={62} values={transpose(row.keyMap)} role="parameter" label="Transposed key map U_Kᵀ"/>
    <MlaArrow path="M116 100 V200 H275"/><MlaArrow path="M447 138 V200 H311"/>
    <MlaJunction x={293} y={200} symbol="×"/>
    <MlaArrow x1={293} y1={218} x2={293} y2={277}/>
    <MlaCells x={209} y={277} values={row.effective} label="Effective query: U_Kᵀq"/>
    <MlaCells x={32} y={350} values={read.latent} label="Original shared latents" rowLabels={read.latent.map((_,i)=>`#${i}`)}/>
    <MlaArrow path={`M293 315 V${y+38} H389`}/><MlaArrow path={`M116 ${y} V${y+38} H389`}/>
    <MlaJunction x={407} y={y+38} symbol="·"/>
    <MlaArrow x1={425} y1={y+38} x2={459} y2={y+38}/>
    <MlaCells x={459} y={y} values={row.absorbedContent.map(value=>[value])} width={150} label="Same content dots" digits={6}/>
  </MlaDrawing>;
}

export function MlaValueRouteDrawing({ read, head = 0, expanded = false }) {
  if (!read.defined) return <p>{read.reason}</p>;
  const row=read.heads[head], n=read.latent.length, records=expanded?row.values:read.latent,
    products=expanded?row.valueContributions:row.latentContributions,
    sum=expanded?row.expandedOutput:row.mixture, mapY=400+n*76;
  return <MlaDrawing label={`Head ${head}: ${expanded?'mix each reconstructed value':'mix the latents first, then apply the value up-map'}; each weight multiplies both coordinates`} width={400} height={expanded?mapY-30:mapY+315}>
    <MlaCells x={183} y={62} values={records} label={expanded?'Reconstructed values':'Shared stored latents'} rowLabels={records.map((_,i)=>`#${i}`)}/>
    <MlaCells x={12} y={62} values={row.weights.map(value=>[value])} width={142} label="Read weights" digits={6}/>
    <MlaArrow path={`M267 ${62+n*38} V${135+n*38} H215`}/><MlaArrow path={`M83 ${62+n*38} V${135+n*38} H179`}/>
    <MlaJunction x={197} y={135+n*38} symbol="×"/>
    <MlaArrow x1={197} y1={153+n*38} x2={197} y2={205+n*38}/>
    <MlaCells x={113} y={205+n*38} values={products} label="Weight × coordinate, for every record" digits={6}/>
    <MlaArrow x1={197} y1={205+n*76} x2={197} y2={249+n*76}/>
    <MlaJunction x={197} y={267+n*76} symbol="Σ"/>
    <MlaArrow x1={197} y1={285+n*76} x2={197} y2={329+n*76}/>
    <MlaCells x={113} y={329+n*76} values={sum} label={expanded?'Head output: sum value writes':'Latent mixture: sum latent writes'} digits={6}/>
    {!expanded&&<>
      <MlaCells x={24} y={mapY} values={row.valueMap} role="parameter" label="Head value up-map U_V"/>
      <MlaArrow path={`M197 ${367+n*76} H373 V${mapY+124} H280`}/>
      <MlaArrow path={`M108 ${mapY+76} V${mapY+124} H244`}/>
      <MlaJunction x={262} y={mapY+124} symbol="×"/>
      <MlaArrow x1={262} y1={mapY+142} x2={262} y2={mapY+199}/>
      <MlaCells x={178} y={mapY+199} values={row.absorbedOutput} label="Same head output" digits={6}/>
    </>}
  </MlaDrawing>;
}

export function MlaValueRoutesDrawing({ read, head = 0 }) {
  return <div className="mla-independent-scenes"><MlaValueRouteDrawing read={read} head={head} expanded/><MlaValueRouteDrawing read={read} head={head}/></div>;
}

export function MlaOutputWriteDrawing({ state = latentManualCase(), read = latentCaseRead(state,{positioned:false}) }) {
  if (!read.defined) return <p>{read.reason}</p>;
  const products=state.outputMap.map(row=>row.map((value,i)=>value*read.absorbedJoined[i]));
  return <MlaDrawing label="Two actual head output vectors concatenate, then a separate learned two-by-four output map writes two block coordinates" width={680} height={605}>
    {read.heads.map((head,index)=><g key={index}><MlaCells x={45+index*380} y={61} values={head.absorbedOutput} label={`Head ${index} written vector`} digits={6}/><MlaArrow path={`M${129+index*380} 99 V139 H340 V177`}/></g>)}
    <MlaCells x={172} y={177} values={read.absorbedJoined} label="Concatenate: head 0, then head 1" digits={6}/>
    <MlaCells x={30} y={290} values={state.outputMap} role="parameter" label="Separate learned output map W_O"/>
    <MlaArrow path="M340 215 H650 V411 H463"/><MlaArrow path="M198 366 V411 H427"/>
    <MlaJunction x={445} y={411} symbol="×"/>
    <MlaArrow x1={427} y1={411} x2={30} y2={411}/>
    <MlaCells x={30} y={435} values={products} label="Products for each output row" digits={6}/>
    <MlaArrow path="M366 473 H397 V528 H435"/>
    <MlaJunction x={453} y={528} symbol="Σ"/>
    <MlaArrow x1={471} y1={528} x2={497} y2={528}/>
    <MlaCells x={497} y={509} values={read.absorbedOutput.map(value=>[value])} width={160} label="Block write" digits={6}/>
  </MlaDrawing>;
}

function MlaPlane({ vectors, radius = 125, extent, label }) {
  const center=[150,210], unit=radius/extent;
  const project=vector=>[center[0]+unit*vector[0],center[1]-unit*vector[1]];
  return <MlaDrawing label={label} width={400} height={420}>
    <MlaText x={200} y={32}>{label}</MlaText>
    <line x1={25} y1={210} x2={275} y2={210} stroke={mlaColors.edge}/><line x1={150} y1={85} x2={150} y2={335} stroke={mlaColors.edge}/>
    <MlaText x={286} y={216}>x₀</MlaText><MlaText x={150} y={74}>x₁</MlaText>
    {[-extent,0,extent].map(tick=><g key={tick}><MlaText x={150+unit*tick} y={377}>{number(tick,2)}</MlaText><MlaText x={12} y={215-unit*tick} anchor="start">{number(tick,2)}</MlaText></g>)}
    {vectors.map(({value,name,role},index)=>{const [x,y]=project(value), labelY=90+index*38;return <g key={name}>
      <MlaArrow x1={150} y1={210} x2={x} y2={y}/><circle cx={x} cy={y} r={4+index*2} fill="none" stroke={mlaColors[role??'computed']}/>
      <path d={`M${x} ${y} L300 ${labelY-5}`} fill="none" stroke={mlaColors[role??'computed']}/>
      <MlaText x={305} y={labelY} anchor="start" size={13} role={role}>{name}</MlaText>
    </g>;})}
    <MlaText x={200} y={408}>Same unit length on both axes.</MlaText>
  </MlaDrawing>;
}

export function MlaRotationOrderDrawing({ matrix = [[2,0],[0,1]], vector = [1,0], angle = Math.PI/2 }) {
  const result=rotationOrder(matrix,vector,angle), extent=Math.max(2,...[vector,result.projected,result.rotated,result.projectThenRotate,result.rotateThenProject].flat().map(Math.abs))*1.1;
  return <>
    <div className="mla-independent-scenes">
      <MlaPlane label="Map U first; then turn R" extent={extent} vectors={[{name:'x',value:vector,role:'input'},{name:'Ux',value:result.projected},{name:'R(Ux)',value:result.projectThenRotate}]}/>
      <MlaPlane label="Turn R first; then map U" extent={extent} vectors={[{name:'x',value:vector,role:'input'},{name:'Rx',value:result.rotated},{name:'U(Rx)',value:result.rotateThenProject}]}/>
    </div>
    <MlaDrawing label="The actual map, rotation and matrix difference identify why the two routes differ" width={680} height={205}>
      <MlaCells x={20} y={72} values={matrix} role="parameter" label="U"/>
      <MlaCells x={253} y={72} values={[[Math.cos(angle),-Math.sin(angle)],[Math.sin(angle),Math.cos(angle)]]} label="R at current angle"/>
      <MlaCells x={486} y={72} values={result.commutator} label="RU − UR"/>
    </MlaDrawing>
  </>;
}

export function MlaRotaryReadDrawing({ state = latentManualCase(), head = 0, read = latentCaseRead(state) }) {
  if (!read.defined) return <p>{read.reason}</p>;
  const row=read.heads[head], n=state.latent.length, contentY=345+n*76;
  return <MlaDrawing label={`Head ${head}: separately rotate raw query and shared key pairs by their logical IDs, add the rotary dot to the content dot, then scale and mask`} width={900} height={contentY+n*38+130}>
    <MlaCells x={40} y={62} values={state.queryRotary[head]} role="input" label="Raw query positional pair"/>
    <MlaCells x={390} y={62} values={state.keyRotary} role="input" label="Raw shared key positional pairs" rowLabels={state.positions.map(id=>`ID ${id}`)}/>
    <MlaArrow x1={124} y1={100} x2={124} y2={182}/><MlaText x={124} y={139}>Turn by query ID × frequency</MlaText>
    <MlaCells x={40} y={182} values={row.queryRotary} label="Turned query pair"/>
    <MlaArrow x1={474} y1={62+n*38} x2={474} y2={160+n*38}/><MlaText x={650} y={125+n*38}>Each turn uses its own key ID.</MlaText>
    <MlaCells x={390} y={160+n*38} values={row.keyRotary} label="Already turned key pairs" rowLabels={state.positions.map(id=>`ID ${id}`)}/>
    <MlaArrow path={`M124 220 V${275+n*38} H268`}/><MlaArrow path={`M474 ${160+n*76} V${275+n*38} H304`}/>
    <MlaJunction x={286} y={275+n*38} symbol="·"/>
    <MlaArrow x1={304} y1={275+n*38} x2={615} y2={275+n*38}/>
    <MlaCells x={615} y={245+n*38} values={row.rotary.map(value=>[value])} width={150} label="Rotary dots" digits={6}/>
    <MlaCells x={40} y={contentY} values={row.content.map(value=>[value])} width={150} label="Content dots" digits={6}/>
    <MlaArrow path={`M190 ${contentY+19} H253`}/><MlaArrow path={`M690 ${245+n*76} V${contentY+19} H289`}/>
    <MlaJunction x={271} y={contentY+19} symbol="+"/>
    <MlaArrow x1={289} y1={contentY+19} x2={343} y2={contentY+19}/>
    <MlaCells x={343} y={contentY} values={row.logits.map(value=>[value])} width={150} label={`Scale by ${number(read.scale,6)}`} digits={6}/>
    <MlaCells x={590} y={contentY} values={state.positions.map((id,i)=>[id,read.legal[i]?'allowed':'forbidden'])} width={138} label={`Permission: key ID ≤ query ID ${state.queryPosition}`}/>
    <MlaText x={450} y={contentY+n*38+70}>Only allowed scores enter the same exponential-and-mass calculation.</MlaText>
  </MlaDrawing>;
}

export function MlaRmsDrawing({ raw = [3,4], gains = [1,2], epsilon = 1e-6 }) {
  const squares=raw.map(value=>value*value), mean=squares.reduce((a,b)=>a+b,0)/raw.length, divisor=Math.sqrt(mean+epsilon), unit=raw.map(value=>value/divisor), output=unit.map((value,i)=>value*gains[i]);
  return <MlaDrawing label="A separately constructed RMS normalization example squares raw coordinates, averages them, adds epsilon, divides by their root mean square and multiplies the learned gains" width={400} height={760}>
    <MlaCells x={113} y={62} values={raw} role="input" label="Raw latent z (separate example)"/>
    <MlaArrow x1={197} y1={100} x2={197} y2={164}/><MlaCells x={113} y={164} values={squares} label="Square each coordinate"/>
    <MlaArrow x1={197} y1={202} x2={197} y2={266}/><MlaCells x={123} y={266} values={[mean]} width={148} label="Average the squares" digits={6}/>
    <MlaArrow x1={197} y1={304} x2={197} y2={368}/><MlaCells x={123} y={368} values={[divisor]} width={148} label={`Root of mean + ε (${epsilon})`} digits={6}/>
    <MlaArrow path="M113 81 H18 V489 H179"/><MlaArrow x1={197} y1={406} x2={197} y2={471}/><MlaJunction x={197} y={489} symbol="÷"/>
    <MlaArrow x1={197} y1={507} x2={197} y2={561}/><MlaCells x={113} y={561} values={unit} label="Unit-RMS coordinates" digits={6}/>
    <MlaCells x={24} y={655} values={gains} role="parameter" label="Learned gain γ"/>
    <MlaArrow path="M197 599 H352 V674 H344"/><MlaArrow x1={192} y1={674} x2={308} y2={674}/><MlaJunction x={326} y={674} symbol="×"/>
    <MlaArrow path="M326 692 V741 H281"/><MlaCells x={113} y={722} values={output} label="Normalized latent c" digits={6}/>
  </MlaDrawing>;
}

export function MlaQueryProjectionDrawing() {
  const input=[1,0,2],down=[[1,0,0],[0,0,1]],raw=matvec(down,input),divisor=Math.sqrt(raw.reduce((sum,v)=>sum+v*v,0)/2+1e-6),latent=raw.map(v=>v/divisor),contentMap=[[1,0],[0,1]],rotaryMap=[[0,1],[1,0]],keyMap=[[1,0,0],[0,1,0]];
  return <MlaDrawing label="Separately constructed practical projection example: one input feeds query down-map, RMS and two query up-maps, while the shared positional key uses its own direct map and bypasses latent normalization" width={880} height={950}>
    <MlaCells x={300} y={62} values={input} role="input" label="Separate example input h = [1,0,2]"/>
    <MlaCells x={30} y={187} values={down} role="parameter" label="Query down-map W_DQ, 2×3"/>
    <MlaArrow path="M426 100 V135 H170 V290 H248"/><MlaArrow path="M156 263 V310 H248 L253 303"/><MlaJunction x={266} y={290} symbol="×"/>
    <MlaArrow x1={266} y1={308} x2={266} y2={375}/><MlaCells x={182} y={375} values={raw} label="Raw query latent z_Q"/>
    <MlaArrow x1={266} y1={413} x2={266} y2={516}/><MlaText x={266} y={463}>RMS divisor {number(divisor,6)}; gains [1,1]</MlaText>
    <MlaCells x={182} y={516} values={latent} label="Normalized c_Q, two coordinates" digits={6}/>
    <MlaArrow path="M266 554 V607 H118 V730"/><MlaArrow path="M266 607 H422 V730"/>
    <MlaCells x={30} y={651} values={contentMap} role="parameter" label="Content query up-map"/>
    <MlaCells x={338} y={651} values={rotaryMap} role="parameter" label="Raw positional query up-map"/>
    <MlaArrow path="M198 689 V748 H136"/><MlaArrow path="M506 689 V748 H440"/>
    <MlaJunction x={118} y={748} symbol="×"/><MlaJunction x={422} y={748} symbol="×"/>
    <MlaArrow x1={118} y1={766} x2={118} y2={830}/><MlaArrow x1={422} y1={766} x2={422} y2={830}/>
    <MlaCells x={34} y={830} values={matvec(contentMap,latent)} label="Current content q_C" digits={6}/><MlaCells x={338} y={830} values={matvec(rotaryMap,latent)} label="Current raw positional q_R" digits={6}/>
    <MlaCells x={592} y={187} values={keyMap} role="parameter" label="Direct shared-key map, 2×3"/>
    <MlaArrow path="M426 135 H865 V290 H736"/><MlaArrow x1={718} y1={263} x2={718} y2={272}/><MlaJunction x={718} y={290} symbol="×"/>
    <MlaArrow x1={718} y1={308} x2={718} y2={375}/><MlaCells x={634} y={375} values={matvec(keyMap,input)} label="Raw shared positional key"/>
    <MlaText x={718} y={475}>Its own source input map</MlaText><MlaText x={718} y={505}>bypasses query/KV RMS.</MlaText>
    <MlaText x={440} y={923}>Only the eventual normalized KV latent and turned positional key are persistent history.</MlaText>
  </MlaDrawing>;
}

export function MlaBasisDrawing({ state = latentManualCase(), basis = [[2,0],[0,.5]], head = 0, positioned = true }) {
  const status=latentBasisStatus(basis), original=latentCaseRead(state,{positioned}), changed=latentCaseRead(state,{positioned,basis});
  // Coordinate conversion exists even when the attention permission set is empty.
  // Keep its algebra visible without fabricating an undefined normalized read.
  const converted=status.inverse?{latent:state.latent.map(row=>matvec(basis,row)),keyMap:multiply(state.keyUp[head],status.inverse),valueMap:multiply(state.valueUp[head],status.inverse)}:null;
  const n=state.latent.length, jointY=200+n*38, mapsY=jointY+110+n*38,width=Math.max(720,62+n*95);
  return <MlaDrawing label="A post-normalization coordinate change transforms the stored latent and compensates both up-maps; a singular basis cannot be inverted" width={width} height={mapsY+425}>
    <MlaCells x={31} y={62} values={state.latent} label="Original stored c"/>
    <MlaCells x={316} y={62} values={basis} role="parameter" label="Coordinate map S"/>
    <MlaText x={360} y={jointY-52}>det(S) = {number(status.determinant,8)}; {status.status}</MlaText>
    {status.inverse?<>
      <MlaArrow path={`M115 ${62+n*38} V${jointY} H270`}/><MlaArrow path={`M400 138 V${jointY} H306`}/><MlaJunction x={288} y={jointY} symbol="×"/>
      <MlaArrow x1={306} y1={jointY} x2={506} y2={jointY}/><MlaCells x={506} y={jointY-19} values={converted.latent} label="Changed c′ = Sc"/>
      <MlaCells x={31} y={mapsY} values={status.inverse} label="Inverse S⁻¹"/>
      <MlaCells x={280} y={mapsY} values={converted.keyMap} role="parameter" label="U_K S⁻¹"/>
      <MlaCells x={529} y={mapsY} values={converted.valueMap} role="parameter" label="U_V S⁻¹"/>
      {original.defined?<MlaCells x={31} y={mapsY+170} values={original.heads[head].content} width={95} label={`Head ${head}: original content dots`} digits={6}/>:<MlaText x={360} y={mapsY+190}>Original read is undefined.</MlaText>}
      {changed.defined?<MlaCells x={31} y={mapsY+280} values={changed.heads[head].content} width={95} label="Compensated content dots" digits={6}/>:<MlaText x={360} y={mapsY+300}>Compensated read is undefined.</MlaText>}
      <MlaText x={width/2} y={mapsY+390}>Coordinates change; defined scores and writes remain the same.</MlaText>
    </>:<MlaText x={360} y={320}>No inverse: do not replace the earlier valid read with fabricated values.</MlaText>}
  </MlaDrawing>;
}

export function MlaNonlinearDrawing({ state, read, head = 0 }) {
  const actual=read??latentCaseRead(state??latentManualCase(),{nonlinear:true}), row=actual.defined?actual.heads[head]:null;
  if (!row) return <p>{actual.reason}</p>;
  return <div className="mla-independent-scenes">{[true,false].map(before=>{
    const n=row.values.length,values=before?row.values:row.linearValues,products=values.map((values,i)=>values.map(v=>v*row.weights[i])),sum=products[0].map((_,d)=>products.reduce((total,values)=>total+values[d],0)),valuesY=before?62+n*38+85:62,multiplyY=valuesY+n*38+90,productsY=multiplyY+80,sumY=productsY+n*38+105;
    return <MlaDrawing key={String(before)} label={before?'ReLU on each record, then weight every coordinate and sum':'Weight the unmodified linear values, sum all coordinates, then apply ReLU'} width={400} height={sumY+(before?100:230)}>
      <MlaCells x={172} y={62} values={row.linearValues} width={110} label="Original linear values U_V c" digits={6}/>
      {before&&<><MlaArrow x1={282} y1={62+n*38} x2={282} y2={valuesY}/><MlaText x={282} y={valuesY-39}>Apply ReLU per coordinate</MlaText><MlaCells x={172} y={valuesY} values={values} width={110} label="Clipped values" digits={6}/></>}
      <MlaCells x={15} y={valuesY} values={row.weights.map(v=>[v])} width={135} label="Same weights" digits={6}/>
      <MlaArrow path={`M82 ${valuesY+n*38} V${multiplyY} H184`}/><MlaArrow path={`M282 ${valuesY+n*38} V${multiplyY} H220`}/><MlaJunction x={202} y={multiplyY} symbol="×"/>
      <MlaArrow x1={202} y1={multiplyY+18} x2={202} y2={productsY}/><MlaCells x={92} y={productsY} values={products} width={110} label="Actual weight × each coordinate" digits={6}/>
      <MlaArrow x1={202} y1={productsY+n*38} x2={202} y2={sumY-58}/><MlaJunction x={202} y={sumY-40} symbol="Σ"/><MlaArrow x1={202} y1={sumY-22} x2={202} y2={sumY}/><MlaCells x={92} y={sumY} values={sum} width={110} label={before?'Mixed clipped output':'Mixed linear output'} digits={6}/>
      {!before&&<><MlaArrow x1={202} y1={sumY+38} x2={202} y2={sumY+139}/><MlaText x={202} y={sumY+100}>Now apply ReLU</MlaText><MlaCells x={92} y={sumY+139} values={sum.map(v=>Math.max(0,v))} width={110} label="Clip only the mixed output" digits={6}/></>}
    </MlaDrawing>;
  })}</div>;
}

export function MlaCompactRecordDrawing({ records = [[1,0],[0,1],[1,1]], rotary = [[1,0],[0,1],[-1,0]], ids = [0,1,2], capacity = 5 }) {
  const slots=Array.from({length:capacity},(_,index)=>index), y=62;
  return <MlaDrawing label="Preallocated cache slots store the latent once and the turned positional pair once; logical IDs and validity are separate metadata and empty capacity is not history" width={850} height={160+capacity*38}>
    <MlaCells x={20} y={y} values={slots.map(index=>[index])} width={90} label="Slot"/>
    <MlaCells x={145} y={y} values={slots.map(index=>records[index]??['empty','empty'])} label="Stored C: once"/>
    <MlaCells x={365} y={y} values={slots.map(index=>rotary[index]??['empty','empty'])} label="Already turned R: once"/>
    <MlaCells x={580} y={y} values={slots.map(index=>[ids[index]??'empty',index<records.length?'true':'false'])} width={125} label="ID / valid metadata" role="input"/>
    <path d={`M132 ${y} H120 V${y+records.length*38} H132`} stroke={mlaColors.computed} fill="none"/>
    <MlaText x={425} y={y+capacity*38+46}>Occupied history: {records.length}; allocated capacity: {capacity}.</MlaText>
    <MlaText x={425} y={y+capacity*38+79}>Model, normalization/basis, prefix and position convention must still match.</MlaText>
  </MlaDrawing>;
}

export function MlaSdpaDrawing({ state = latentManualCase(), read = latentCaseRead(state), head = 0 }) {
  if (!read.defined) return <p>{read.reason}</p>;
  const row=read.heads[head], n=read.latent.length;
  return <MlaDrawing label="Ordinary SDPA receives the absorbed content query plus turned query pair, shared latent plus turned key pair as K, and the same latent as V; a separate value map writes the resulting latent mixture" width={900} height={540+n*38}>
    <MlaCells x={25} y={62} values={[...row.effective,...row.queryRotary]} label="Q argument: effective query | turned pair"/>
    <MlaCells x={390} y={62} values={read.latent.map((c,i)=>[...c,...row.keyRotary[i]])} label="K argument: shared C | turned R"/>
    <MlaCells x={25} y={220} values={read.latent} label="V argument: same C"/>
    <MlaText x={200} y={175}>Same field; no duplicate cache allocation.</MlaText>
    <MlaArrow path={`M558 ${62+n*38} V${280+n*38} H497`}/><MlaArrow path={`M193 100 V${280+n*38} H461`}/><MlaArrow path={`M109 ${220+n*38} V${335+n*38} H479 V${298+n*38}`}/>
    <MlaJunction x={479} y={280+n*38} symbol="A" radius={24}/>
    <MlaText x={665} y={268+n*38}>SDPA: explicit original scale {number(read.scale,6)}</MlaText><MlaText x={665} y={294+n*38}>True = allowed; dropout = 0.</MlaText>
    <MlaArrow x1={479} y1={304+n*38} x2={479} y2={365+n*38}/><MlaCells x={395} y={365+n*38} values={row.mixture} label="Latent mixture returned by SDPA" digits={6}/>
    <MlaCells x={25} y={445+n*38} values={row.valueMap} role="parameter" label="Separate U_V"/>
    <MlaArrow path={`M479 ${403+n*38} V${484+n*38} H278`}/><MlaArrow x1={193} y1={484+n*38} x2={242} y2={484+n*38}/><MlaJunction x={260} y={484+n*38} symbol="×"/>
    <MlaArrow x1={278} y1={484+n*38} x2={395} y2={484+n*38}/><MlaCells x={395} y={465+n*38} values={row.absorbedOutput} label="Head write, then concatenate and W_O" digits={6}/>
  </MlaDrawing>;
}

export function MlaBudgetDrawing({ settings }) {
  const result=latentBudget(settings), widths=[['MHA',settings.heads*(settings.content+settings.value)],['MQA',settings.content+settings.value],['MLA',settings.latent+settings.rotary]], maximum=Math.max(...widths.map(([,w])=>w)), x=155, usable=480;
  return <MlaDrawing label="One record's exact coordinate widths are proportional; request, layer and history factors multiply its payload separately" width={720} height={390}>
    {widths.map(([name,width],index)=><g key={name}><MlaText x={140} y={88+index*74} anchor="end">{name}</MlaText><rect x={x} y={61+index*74} width={usable*width/maximum} height={38} fill={`${mlaColors.computed}25`} stroke={mlaColors.computed}/><MlaText x={650} y={87+index*74} anchor="start">{width}</MlaText></g>)}
    <MlaText x={360} y={305}>B {settings.batch} × layers {settings.layers} × L {settings.length} × bytes {settings.bytes}</MlaText>
    <MlaText x={360} y={348}>Exact compact payload: {result.exact.compact.toLocaleString('en-US')} bytes.</MlaText>
  </MlaDrawing>;
}

export function MlaPinnedRecordDrawing() {
  const sections=[['512 latent values',512,'computed'],['16 scales',16,'operation'],['64 bf16 positional values',128,'computed']];
  let offset=25;
  return <MlaDrawing label="A pinned older sparse-MLA FP8 cache record has 512 one-byte latent values, sixteen one-byte scale fields and sixty-four two-byte positional values, totaling 656 bytes" width={780} height={205}>
    {sections.map(([label,bytes,role],i)=>{const start=offset;offset+=bytes;return <g key={label}><rect x={start} y={72} width={bytes} height={45} fill={`${mlaColors[role]}25`} stroke={mlaColors[role]}/><MlaArrow x1={start+bytes/2} y1={117} x2={[260,535,665][i]} y2={155}/><MlaText x={[260,535,665][i]} y={178} size={13}>{label}</MlaText></g>;})}
    <MlaText x={370} y={35}>Pinned sparse FP8 format: 512 + 16 + 128 = 656 bytes.</MlaText>
  </MlaDrawing>;
}

export function MlaRankDrawing({ matrix = [[3,1],[0,1]], input = [1,2], retained = 1 }) {
  const result=rankOne(matrix,input), reduced=retained===2?matrix:result.reduced, output=matvec(reduced,input), extent=Math.max(2,...[input,result.full,output].flat().map(Math.abs))*1.15;
  return <>
    <div className="mla-independent-scenes"><MlaPlane label="Input and retained direction" extent={extent} vectors={[{name:'x',value:input,role:'input'},{name:'direction',value:result.direction}]}/><MlaPlane label="Original and reduced output" extent={extent} vectors={[{name:'Mx',value:result.full},{name:'M_r x',value:output}]}/></div>
    <MlaDrawing label="The original map, retained map and singular values distinguish parameter error from this particular input's output error" width={640} height={285}>
      <MlaCells x={30} y={62} values={matrix} role="parameter" label="Original M"/><MlaCells x={350} y={62} values={reduced} role="parameter" label={`Retained map: ${retained} directions`} digits={6}/>
      <MlaText x={320} y={180}>Singular values: {mlaVector(result.singular,6)}.</MlaText>
      <MlaText x={320} y={210}>{result.tied?'Tied: the leading direction is not unique.':'First direction chosen deterministically.'}</MlaText>
      <MlaText x={320} y={250}>Squared map error: {number(retained===2?0:result.matrixError,6)}; squared output error: {number(output.reduce((s,v,i)=>s+(v-result.full[i])**2,0),6)}.</MlaText>
    </MlaDrawing>
  </>;
}

export function MlaBlockMergeDrawing({ state = latentManualCase(), read = latentCaseRead(state), head = 0, split = 1 }) {
  if (!read.defined) return <p>{read.reason}</p>;
  const row=read.heads[head], merged=latentBlockMerge(row.logits,read.latent,read.legal,split);
  const extra=Math.max(0,...merged.blocks.map(block=>block.indices.length-3))*38;
  return <MlaDrawing label="Each history block contributes a shifted exponential mass and latent numerator; align both block maxima before combining and dividing" width={720} height={640+extra}>
    {merged.blocks.map((block,i)=><g key={i}>
      <MlaCells x={35+i*370} y={62} values={block.indices.map(index=>[index,row.logits[index]]) .concat(block.indices.length?[]:[['none','empty']])} width={140} label={`Block ${i}: records and scores`}/>
      <MlaText x={175+i*370} y={233+extra}>Local maximum {Number.isFinite(block.maximum)?number(block.maximum,6):'−∞'}</MlaText>
      <MlaCells x={35+i*370} y={280+extra} values={[[block.mass,...block.numerator]]} width={95} label="Mass | two numerator coordinates" digits={6}/>
      <MlaArrow x1={175+i*370} y1={318+extra} x2={175+i*370} y2={374+extra}/>
      <MlaText x={175+i*370} y={355+extra}>Scale all by {number(merged.factors[i],6)}</MlaText>
      <MlaCells x={35+i*370} y={374+extra} values={[[block.mass,...block.numerator].map(value=>value*merged.factors[i])]} width={95} digits={6}/>
      <MlaArrow path={`M${175+i*370} ${412+extra} V${462+extra} H${i===0?342:378}`}/>
    </g>)}
    <MlaJunction x={360} y={462+extra} symbol="+"/><MlaArrow x1={360} y1={480+extra} x2={360} y2={529+extra}/>
    <MlaCells x={217} y={529+extra} values={[[merged.mass,...merged.numerator]]} width={95} label="Combined mass | combined numerator" digits={6}/>
    <MlaArrow x1={360} y1={567+extra} x2={360} y2={614+extra}/><MlaText x={360} y={635+extra}>Divide numerator by mass → {mlaVector(merged.output,6)}.</MlaText>
  </MlaDrawing>;
}

export function MlaAffineStageDrawing({ input, map, bias = null, output, name, displayedRows = 4, displayedColumns = 6 }) {
  const rows=Math.min(displayedRows,map.length),columns=Math.min(displayedColumns,input.length),cellWidth=100, mapX=205, mapY=187, inputY=62, junctionY=mapY+rows*38+80, writtenY=junctionY+rows*38+100;
  const shown=map.slice(0,rows).map(row=>row.slice(0,columns)),products=shown.map(row=>row.map((v,j)=>v*input[j])), sums=map.slice(0,rows).map(row=>row.reduce((sum,v,j)=>sum+v*input[j],0));
  const width=Math.max(760,mapX+columns*cellWidth+55),height=writtenY+rows*38+165;
  return <MlaDrawing label={`${name}: actual current input and learned map cutaways, full-input row sums, bias addition and written output; omitted coordinates still enter every displayed sum`} width={width} height={height}>
    <MlaCells x={mapX} y={inputY} values={input.slice(0,columns)} width={cellWidth} label={`Actual input: ${columns} of ${input.length} coordinates shown`} digits={6}/>
    <MlaCells x={mapX} y={mapY} values={shown} width={cellWidth} role="parameter" label={`${name}: ${rows} of ${map.length} output rows; ${columns} of ${input.length} columns`} digits={6}/>
    <MlaArrow path={`M${mapX} 81 H70 V${junctionY} H112`}/><MlaArrow path={`M${mapX+columns*cellWidth/2} ${mapY+rows*38} V${junctionY} H148`}/><MlaJunction x={130} y={junctionY} symbol="×"/>
    <MlaArrow x1={148} y1={junctionY} x2={mapX} y2={junctionY}/>
    <MlaCells x={mapX} y={junctionY-19} values={products} width={cellWidth} label="Shown coordinate products (remaining columns omitted)" digits={6}/>
    <MlaArrow path={`M${mapX+columns*cellWidth} ${junctionY} H${width-20} V${writtenY+19} H595`}/>
    <MlaJunction x={577} y={writtenY+19} symbol="Σ"/>
    <MlaArrow x1={559} y1={writtenY+19} x2={530} y2={writtenY+19}/>
    <MlaCells x={395} y={writtenY} values={sums.map(value=>[value])} width={135} label="Sum all input columns" digits={6}/>
    {bias?<>
      <MlaCells x={20} y={writtenY} values={bias.slice(0,rows).map(value=>[value])} width={135} role="parameter" label="Actual learned bias" digits={6}/>
      <MlaArrow x1={155} y1={writtenY+19} x2={202} y2={writtenY+19}/><MlaArrow x1={395} y1={writtenY+19} x2={238} y2={writtenY+19}/><MlaJunction x={220} y={writtenY+19} symbol="+"/>
      <MlaArrow path={`M220 ${writtenY+37} V${writtenY+rows*38+84} H305`}/>
    </>:<MlaArrow path={`M462 ${writtenY+rows*38} V${writtenY+rows*38+84} H305`}/>}
    <MlaCells x={305} y={writtenY+rows*38+65} values={output.slice(0,rows)} width={100} label={`Actual written row: ${rows} of ${output.length} coordinates`} digits={6}/>
  </MlaDrawing>;
}

export function MlaResidualDrawing({ saved, branch, output, name }) {
  return <MlaDrawing label={`${name}: saved input bypass and separately computed update add coordinate by coordinate`} width={640} height={335}>
    <MlaCells x={25} y={62} values={saved.slice(0,4)} width={130} role="input" label={`Saved row: 4 of ${saved.length} coordinates`} digits={6}/>
    <MlaCells x={25} y={172} values={branch.slice(0,4)} width={130} label={`Written branch: 4 of ${branch.length} coordinates`} digits={6}/>
    <MlaArrow path="M25 81 H12 V280 H263"/><MlaArrow x1={285} y1={210} x2={285} y2={262}/><MlaJunction x={285} y={280} symbol="+"/>
    <MlaArrow x1={303} y1={280} x2={353} y2={280}/><MlaCells x={353} y={261} values={output.slice(0,2)} width={130} label="First two actual sums" digits={6}/>
  </MlaDrawing>;
}

export function MlaNetworkPathsDrawing({ trace, record = 23 }) {
  const t=Math.min(record,trace.points.length-1),latentWidth=trace.latent[t].length;
  return <MlaDrawing label="Actual retained model ownership: input scaling and biased stem, pre-attention LayerNorm, separate content/query RMS paths, input-dependent shared positional key and head-specific query pairs; only latent and turned key enter persistent storage" width={1020} height={1130}>
    <MlaCells x={440} y={62} values={trace.points[t]} role="input" label={`Observed frame ${t}: x,y`} digits={6}/>
    <MlaArrow x1={524} y1={100} x2={524} y2={175}/><MlaCells x={440} y={175} values={trace.scaledInput[t]} label="Fixed scaling: 2x−1, 2y−1" digits={6}/>
    <MlaArrow x1={524} y1={213} x2={524} y2={289}/><MlaCells x={320} y={289} values={trace.stem[t].slice(0,4)} width={100} label="Biased 2→24 stem: first 4 of 24 actual sums" digits={6}/>
    <MlaArrow x1={524} y1={327} x2={524} y2={402}/><MlaCells x={320} y={402} values={trace.attentionInput[t].slice(0,4)} width={100} label="Pre-attention LayerNorm: first 4 of 24" digits={6}/>
    <MlaArrow path="M524 440 V480 H190 V549"/><MlaArrow path="M524 480 H524 V549"/><MlaArrow path="M524 480 H875 V549"/>
    <MlaCells x={30} y={549} values={trace.latentNorm.raw[t].slice(0,4)} width={90} label="24→8 KV down-map: first 4 raw coordinates" digits={6}/>
    <MlaCells x={395} y={549} values={trace.queryNorm.raw[t].slice(0,4)} width={90} label="24→12 query down-map: first 4 raw coordinates" digits={6}/>
    <MlaCells x={795} y={549} values={trace.rawKeyRotary[t]} width={95} label="24→2 shared raw positional key" digits={6}/>
    <MlaArrow x1={210} y1={587} x2={210} y2={683}/><MlaArrow x1={575} y1={587} x2={575} y2={683}/><MlaArrow x1={890} y1={587} x2={890} y2={790}/>
    <MlaText x={210} y={623}>RMS divisor {number(trace.latentNorm.divisors[t],6)}</MlaText><MlaText x={575} y={623}>RMS divisor {number(trace.queryNorm.divisors[t],6)}</MlaText>
    <MlaCells x={30} y={683} values={trace.latentNorm.output[t].slice(0,4)} width={90} label="RMS + actual learned gain: first 4 of 8" digits={6}/>
    <MlaCells x={395} y={683} values={trace.queryNorm.output[t].slice(0,4)} width={90} label="RMS + actual learned gain: first 4 of 12" digits={6}/>
    <MlaArrow x1={210} y1={721} x2={210} y2={830}/><MlaText x={210} y={765}>{trace.basis?`Post-norm projection: 8→${latentWidth}`:'Keep original eight coordinates'}</MlaText>
    <MlaCells x={30} y={830} values={trace.latent[t].slice(0,4)} width={90} label={`Stored C: ${Math.min(4,latentWidth)} of ${latentWidth} coordinates shown`} digits={6}/>
    <MlaCells x={795} y={830} values={trace.keyRotary[t]} width={95} label={`Stored R: turn at ID ${t+trace.shift}`} digits={6}/>
    <path d="M18 794 H382 V890 H18 Z" stroke={mlaColors.computed} fill="none" strokeDasharray="4 4"/><path d="M780 794 H1000 V890 H780 Z" stroke={mlaColors.computed} fill="none" strokeDasharray="4 4"/>
    <MlaArrow path="M575 721 V790 H455 V970"/><MlaArrow path="M575 790 H680 V970"/>
    <MlaCells x={275} y={970} values={trace.queryContent[t].slice(0,4)} width={90} label="12→16 content queries: actual head 0" digits={6}/>
    <MlaCells x={680} y={970} values={trace.queryRotary[t][0]} width={95} label={`12→8 raw pairs; head 0 turned at ID ${t+trace.shift}`} digits={6}/>
    <MlaText x={510} y={1077}>Dashed brackets mark only persistent C/R payload; query paths are current readers.</MlaText>
    <MlaText x={510} y={1110}>Every map, norm and omitted coordinate belongs to the same current model and edited frame.</MlaText>
  </MlaDrawing>;
}

export function MlaLearnedHeadDrawing({ trace, record = 23, head = 0 }) {
  const last=trace.points.length-1,s=Math.min(record,last),row=trace.traces[last][head],query=trace.queryContent[last].slice(4*head,4*head+4),key=trace.keys[head][s],queryR=trace.queryRotary[last][head],keyR=trace.keyRotary[s],
    contentProducts=query.map((v,i)=>v*key[i]),rotaryProducts=queryR.map((v,i)=>v*keyR[i]),maximum=Math.max(...row.logits),mass=row.logits.reduce((sum,v)=>sum+Math.exp(v-maximum),0),r=trace.latent[s].length;
  const inspected=[...new Set([0,Math.min(1,last),s])],contributions=inspected.map(index=>trace.latent[index].map(v=>v*row.weights[index]));
  return <MlaDrawing label={`Actual final query head ${head} reads source record ${s}: full content and positional product routes, global softmax normalization, actual all-record mixing and learned value up-map`} width={1020} height={2040}>
    <MlaCells x={30} y={62} values={trace.latent[s]} width={100} label={`Actual stored c at source record ${s}, ${r} coordinates`} digits={6}/>
    <MlaCells x={30} y={185} values={trace.keyMaps[head].map(mapRow=>mapRow.slice(0,4))} width={100} role="parameter" label={`Head ${head} key up-map: 4 rows, first ${Math.min(4,r)} of ${r} columns`} digits={6}/>
    <MlaArrow path="M30 81 H15 V396 H312"/><MlaArrow path="M230 337 V396 H312"/><MlaJunction x={330} y={396} symbol="×"/>
    <MlaArrow x1={348} y1={396} x2={495} y2={396}/><MlaCells x={495} y={377} values={key} width={120} label="Actual reconstructed content key (all r columns used)" digits={6}/>
    <MlaCells x={495} y={185} values={query} width={120} label={`Actual final content query, head ${head}`} digits={6}/>
    <MlaArrow path="M735 223 V273 H970 V496 H867"/><MlaArrow path="M735 415 V496 H831"/><MlaJunction x={849} y={496} symbol="×"/>
    <MlaArrow path="M849 514 V630 H280 V596"/><MlaCells x={40} y={558} values={contentProducts} width={120} label="Actual query-coordinate × key-coordinate products" digits={6}/>
    <MlaArrow x1={520} y1={577} x2={569} y2={577}/><MlaJunction x={587} y={577} symbol="Σ"/><MlaArrow x1={605} y1={577} x2={650} y2={577}/><MlaCells x={650} y={558} values={[row.contentScores[s]]} width={150} label="Content dot" digits={6}/>
    <MlaCells x={40} y={697} values={queryR} width={120} label={`Turned query pair, ID ${last+trace.shift}`} digits={6}/><MlaCells x={440} y={697} values={keyR} width={120} label={`Turned shared key pair, ID ${s+trace.shift}`} digits={6}/>
    <MlaArrow path="M160 735 V796 H287"/><MlaArrow path="M560 735 V796 H323"/><MlaJunction x={305} y={796} symbol="×"/><MlaArrow x1={323} y1={796} x2={440} y2={796}/><MlaCells x={440} y={777} values={rotaryProducts} width={120} label="Positional coordinate products" digits={6}/>
    <MlaArrow x1={680} y1={796} x2={705} y2={796}/><MlaJunction x={723} y={796} symbol="Σ"/><MlaArrow x1={741} y1={796} x2={790} y2={796}/><MlaCells x={790} y={777} values={[row.rotaryScores[s]]} width={160} label="Positional dot" digits={6}/>
    <MlaArrow path="M725 596 H980 V846 H420 V886 H442"/><MlaArrow path="M870 815 V826 H530 V886 H478"/><MlaJunction x={460} y={886} symbol="+"/><MlaArrow x1={478} y1={886} x2={615} y2={886}/><MlaCells x={615} y={867} values={[row.logits[s]]} width={160} label={`Scaled score, divisor √${trace.wrongScale?r+2:6}`} digits={6}/>
    <MlaText x={510} y={961}>Normalize over all {trace.points.length} legal records: maximum {number(maximum,6)}, mass {number(mass,6)}.</MlaText>
    <MlaArrow x1={695} y1={905} x2={695} y2={1018}/><MlaCells x={615} y={1018} values={[row.weights[s]]} width={160} label={`This record's weight: exp(score−maximum)/mass`} digits={9}/>
    <MlaCells x={70} y={1130} values={inspected.map(index=>trace.latent[index])} width={95} rowLabels={inspected.map(index=>`#${index}`)} label={`Actual latent rows: ${inspected.length} of ${trace.points.length} shown`} digits={6}/>
    <MlaCells x={850} y={1130} values={inspected.map(index=>[row.weights[index]])} width={150} label="Corresponding weights" digits={9}/>
    <MlaArrow path={`M695 1056 V1090 H1010 V${1149+inspected.indexOf(s)*38} H1000`}/>
    <MlaArrow path={`M${70+r*95/2} ${1130+inspected.length*38} V1300 H492`}/><MlaArrow path={`M925 ${1130+inspected.length*38} V1300 H528`}/><MlaJunction x={510} y={1300} symbol="×"/>
    <MlaArrow x1={510} y1={1318} x2={510} y2={1380}/><MlaCells x={70} y={1380} values={contributions} width={95} rowLabels={inspected.map(index=>`#${index}`)} label="Actual weight × stored coordinate contributions" digits={6}/>
    <MlaArrow x1={510} y1={1380+inspected.length*38} x2={510} y2={1552}/><MlaJunction x={510} y={1570} symbol="Σ"/>
    <MlaText x={510} y={1525}>Sum all {trace.points.length} source records; {trace.points.length-inspected.length} additional rows omitted only from this cutaway.</MlaText>
    <MlaArrow x1={510} y1={1588} x2={510} y2={1640}/><MlaCells x={30} y={1640} values={row.mixture} width={100} label={`Actual ${r}-coordinate latent mixture`} digits={6}/>
    <MlaCells x={30} y={1750} values={trace.valueMaps[head].map(mapRow=>mapRow.slice(0,4))} width={100} role="parameter" label={`Actual value map: 4 rows, first ${Math.min(4,r)} of ${r} columns`} digits={6}/>
    <MlaArrow path="M30 1659 H15 V1960 H512"/><MlaArrow path="M230 1902 V1960 H512"/><MlaJunction x={530} y={1960} symbol="×"/><MlaArrow x1={548} y1={1960} x2={595} y2={1960}/><MlaCells x={595} y={1941} values={row.output} width={100} label="Actual four-coordinate head write" digits={6}/>
    <MlaText x={510} y={2020}>Map cutaways omit columns only in the picture; every actual calculation uses all r coordinates.</MlaText>
  </MlaDrawing>;
}

export function MlaSoftmaxRankDrawing() {
  const logits=[[0,0,0],[0,1,2],[0,2,4]],weights=logits.map(row=>{const exp=row.map(v=>Math.exp(v-Math.max(...row))),mass=exp.reduce((a,b)=>a+b,0);return exp.map(v=>v/mass);});
  return <MlaDrawing label="A rank-one three-by-three score matrix becomes a full-rank probability matrix after exponential normalization of each row" width={760} height={270}>
    <MlaCells x={25} y={62} values={logits} width={100} label="Scores = [0,1,2]ᵀ [0,1,2]"/>
    <MlaArrow x1={325} y1={119} x2={425} y2={119}/><MlaText x={375} y={102}>Row softmax</MlaText>
    <MlaCells x={425} y={62} values={weights} width={100} label="Actual normalized weights" digits={6}/>
    <MlaText x={380} y={241}>Rank 1 before normalization; determinant of weights ≈ 0.0244307 afterward.</MlaText>
  </MlaDrawing>;
}

export function MlaBackwardDrawing() {
  return <MlaDrawing label="Forward products and distinct reverse-mode derivatives through the effective query, normalized weights, mixed latent and value map" width={850} height={950}>
    <MlaCells x={25} y={62} values={['q₀','q₁']} role="input" label="Current query q"/><MlaCells x={365} y={62} values={[['u₀₀','u₁₀'],['u₀₁','u₁₁']]} role="parameter" label="Transposed key map U_Kᵀ"/>
    <MlaArrow path="M109 100 V201 H252"/><MlaArrow path="M449 138 V201 H288"/><MlaJunction x={270} y={201} symbol="×"/><MlaArrow x1={288} y1={201} x2={405} y2={201}/>
    <MlaCells x={405} y={182} values={['q̃₀','q̃₁']} label="q̃ = U_Kᵀq"/>
    <MlaCells x={25} y={310} values={['c₀','c₁']} label="One stored latent c"/>
    <MlaArrow path="M109 348 V417 H252"/><MlaArrow path="M489 220 V417 H288"/><MlaJunction x={270} y={417} symbol="·"/>
    <MlaArrow x1={288} y1={417} x2={380} y2={417}/><MlaCells x={380} y={398} values={['score']} width={150} label="Score → scale / mask / softmax"/>
    <MlaArrow x1={530} y1={417} x2={617} y2={417}/><MlaCells x={617} y={398} values={['weight a']} width={185} label="Mix with all legal records"/>
    <MlaArrow path="M709 436 V536 H433"/><MlaArrow path="M109 348 H20 V536 H389"/><MlaJunction x={411} y={536} symbol="Σac" radius={22}/>
    <MlaText x={411} y={581}>Multiply each record's a×c, then sum all records.</MlaText>
    <MlaArrow x1={429} y1={536} x2={617} y2={536}/><MlaCells x={617} y={517} values={['m₀','m₁']} label="Latent mixture m"/>
    <MlaArrow path="M617 536 H571 V605 H109 V348" backward/>
    <MlaArrow path="M380 417 H335 V329 H193" backward/>
    <MlaText x={435} y={632} role="backward">Reverse: ∂J/∂c_s includes score and mixture paths.</MlaText>
    <MlaArrow path="M405 201 H335 V81 H193" backward/>
    <MlaArrow path="M380 417 H365 V245 H489 V220" backward/>
    <MlaArrow path="M489 182 V165 H449 V138" backward/>
    <MlaText x={500} y={280} role="backward">∂J/∂q = U_K ∂J/∂q̃</MlaText>
    <MlaCells x={25} y={707} values={[['v₀₀','v₀₁'],['v₁₀','v₁₁']]} role="parameter" label="Value map U_V"/>
    <MlaArrow path="M701 555 V760 H449"/><MlaArrow path="M193 745 H413"/><MlaJunction x={431} y={760} symbol="×"/>
    <MlaArrow x1={449} y1={760} x2={617} y2={760}/><MlaCells x={617} y={741} values={['o₀','o₁']} label="Head write o = U_V m"/>
    <MlaArrow path="M617 760 H575 V620 H810 V536 H785" backward/>
    <MlaArrow path="M617 760 H575 V835 H220 V745 H193" backward/>
    <MlaText x={435} y={876} role="backward">∂J/∂m = U_Vᵀ ∂J/∂o; ∂J/∂U_V = (∂J/∂o)mᵀ</MlaText>
    <MlaText x={425} y={928}>Orange dashed arrows propagate loss derivatives; solid arrows compute the forward read.</MlaText>
  </MlaDrawing>;
}

export function MlaGvaDrawing() {
  const values=[[1,0],[0,1],[1,1]],maps=[[[1,0],[0,2]],[[1,1],[1,-1]]],queries=[[1,0],[1,1]],weights=queries.map((q,h)=>{const scores=values.map(v=>matvec(maps[h],v).reduce((sum,k,i)=>sum+q[i]*k,0)/Math.sqrt(2)),exps=scores.map(v=>Math.exp(v-Math.max(...scores))),mass=exps.reduce((a,b)=>a+b,0);return exps.map(v=>v/mass);});
  return <MlaDrawing label="A constructed grouped-value attention connection: one directly stored value stream generates head-specific keys; each head mixes that same value stream directly, with no MLA value up-map after mixing" width={880} height={1180}>
    <MlaCells x={40} y={62} values={values} role="input" label="Stored value stream V_g"/>
    {maps.map((map,head)=><g key={head}>
      <MlaCells x={365+head*270} y={62} values={map} role="parameter" label={`Head ${head} learned key map`}/>
      <MlaArrow path={`M208 119 H${head?860:280} V208 H${431+head*270}`}/><MlaArrow x1={449+head*270} y1={138} x2={449+head*270} y2={190}/><MlaJunction x={449+head*270} y={208} symbol="×"/>
      <MlaArrow x1={449+head*270} y1={226} x2={449+head*270} y2={277}/>
      <MlaCells x={365+head*270} y={277} values={values.map(value=>matvec(map,value))} label="Generated content keys"/>
      <MlaCells x={365+head*270} y={440} values={queries[head]} role="input" label="Current content query"/>
      <MlaArrow path={`M${449+head*270} 391 H${535+head*270} V510 H${467+head*270}`}/>
      <MlaArrow x1={449+head*270} y1={478} x2={449+head*270} y2={492}/><MlaJunction x={449+head*270} y={510} symbol="·"/>
      <MlaArrow x1={449+head*270} y1={528} x2={449+head*270} y2={620}/><MlaText x={449+head*270} y={565}>Scale; normalize</MlaText>
      <MlaCells x={365+head*270} y={620} values={weights[head].map(w=>[w])} width={145} label="Current read weights" digits={6}/>
      <MlaArrow path={`M${438+head*270} 734 V800 H${420+head*270}`}/>
      <MlaArrow path={`M40 119 H10 V800 H${384+head*270}`}/><MlaJunction x={402+head*270} y={800} symbol="×"/>
      <MlaArrow x1={402+head*270} y1={818} x2={402+head*270} y2={875}/>
      <MlaCells x={365+head*270} y={875} values={values.map((value,i)=>value.map(v=>v*weights[head][i]))} width={120} label="Weighted stored values" digits={6}/>
      <MlaArrow x1={485+head*270} y1={989} x2={485+head*270} y2={1068}/>
      <MlaCells x={365+head*270} y={1068} values={values[0].map((_,d)=>values.reduce((sum,row,i)=>sum+weights[head][i]*row[d],0))} width={120} label="Sum: direct head write" digits={6}/>
    </g>)}
    <MlaText x={440} y={1150}>Unlike MLA, no separate U_V is applied after this value mixture.</MlaText>
  </MlaDrawing>;
}

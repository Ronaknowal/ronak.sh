import { useEffect, useId, useRef, useState } from 'react';
import { flowNumber as number } from './LessonFlow.jsx';
import { frequencies, rotate, relativeBucket, alibiSlopes } from '../../data/positional-encoding-models.js';
import { dot, softmax } from '../../data/sequence-tensor-operations.js';

export const positionColors = { input: '#77cddb', parameter: '#e4b752', computed: '#be9cf5', operation: '#e8e6df', edge: '#99978f', backward: '#eda064' };
export const positionVector = (row, digits = 5) => `[${row.map(v => number(v, digits)).join(', ')}]`;
export function PositionArray({ label, values, rows, columns, role = 'computed', digits = 5 }) {
  const matrix = Array.isArray(values[0]) ? values : [values];
  return <div className="position-flow-array" style={{ '--position-role': positionColors[role] }}>
    <span>{label}</span><div className="position-array-scroll" role="region" tabIndex={0} aria-label={label}>
      <table><thead><tr><th aria-label="row" />{matrix[0].map((_,j)=><th key={j}>{columns?.[j] ?? `coordinate ${j}`}</th>)}</tr></thead>
        <tbody>{matrix.map((row,i)=><tr key={i}><th>{rows?.[i] ?? `row ${i}`}</th>{row.map((v,j)=><td key={j} data-sign={typeof v === 'number' ? Math.sign(v) : 0}>{typeof v === 'number' ? number(v,digits) : v}</td>)}</tr>)}</tbody></table>
    </div>
  </div>;
}
export function PositionDrawing({ label, children, width = 800, height = 400 }) {
  const id = useId(),ref=useRef(null),[wide,setWide]=useState(false);
  useEffect(()=>{const element=ref.current;if(!element)return undefined;const update=()=>setWide(element.clientWidth>0&&element.scrollWidth>element.clientWidth+1);update();const observer=new ResizeObserver(update);observer.observe(element);return()=>observer.disconnect();},[]);
  return <figure className="position-flow-drawing"><div ref={ref} className="position-drawing-scroll" role="region" tabIndex={0} aria-label={label}>
    <svg viewBox={`0 0 ${width} ${height}`} style={{minWidth:width}} role="img" aria-labelledby={id}><title id={id}>{label}</title>{children}</svg>
  </div>{wide&&<span className="position-scroll-hint">↔ Scroll this drawing sideways; focus it and use arrow keys with a keyboard.</span>}</figure>;
}
export function PositionText({ x, y, children, color = positionColors.operation, size = 15, anchor = 'middle' }) {
  return <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={size}>{children}</text>;
}
export function PositionArrow({ x1, y1, x2, y2, color = positionColors.edge, backward = false }) {
  const a=Math.atan2(y2-y1,x2-x1), r=7;
  return <g stroke={backward ? positionColors.backward : color} fill={backward ? positionColors.backward : color}><line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={backward ? '5 4' : undefined}/><polygon points={`${x2},${y2} ${x2-r*Math.cos(a-.45)},${y2-r*Math.sin(a-.45)} ${x2-r*Math.cos(a+.45)},${y2-r*Math.sin(a+.45)}`}/></g>;
}
export function PositionCells({ x, y, values, label, role = 'computed', width = 92, height = 40, digits = 4 }) {
  const matrix=Array.isArray(values[0]) ? values : [values];
  return <g>{label && <PositionText x={x+matrix[0].length*width/2} y={y-15} color={positionColors[role]}>{label}</PositionText>}{matrix.map((row,i)=>row.map((v,j)=><g key={`${i}-${j}`}><rect x={x+j*width} y={y+i*height} width={width} height={height} stroke={positionColors[role]} fill={typeof v==='number' && v>0 ? '#e4b75220' : typeof v==='number' && v<0 ? '#77cddb20' : 'none'}/><PositionText x={x+(j+.5)*width} y={y+i*height+26}>{typeof v==='number' ? number(v,digits) : v}</PositionText></g>))}</g>;
}
export function PositionOperation({ x, y, label, width = 132 }) {
  return <g><rect x={x-width/2} y={y-19} width={width} height={38} rx={14} fill="none" stroke={positionColors.operation}/><PositionText x={x} y={y+5}>{label}</PositionText></g>;
}
const pointNames=['A','B','C','D'];
export function PositionJourneyDrawing() {
  const points=[[45,145],[100,65],[190,45],[270,145]];
  const scene=stacked=><PositionDrawing label="The same four visited locations form two opposite arrowed journeys; point and attached position ID are separate fields" width={stacked?340:860} height={stacked?965:505}>
    {[0,1].map(reverse=><g key={reverse} transform={`translate(${stacked?0:reverse*430},${stacked?reverse*440:0})`}><PositionText x={stacked?170:200} y={28}>{reverse ? 'Journey D → C → B → A' : 'Journey A → B → C → D'}</PositionText>{[0,1,2].map(i=>{const first=points[reverse ? 3-i : i],last=points[reverse ? 2-i : i+1];return <PositionArrow key={i} x1={first[0]} y1={first[1]} x2={last[0]} y2={last[1]}/>;})}{points.map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={7} fill={positionColors.input}/><PositionText x={x} y={y+26} color={positionColors.input}>{pointNames[i]} · ID {reverse ? 3-i : i}</PositionText></g>)}<PositionCells x={26} y={225} values={Array.from({length:4},(_,i)=>[pointNames[reverse ? 3-i : i],i])} role="input" width={stacked?145:165} label="Stored records: point | attached ID"/><PositionText x={stacked?170:190} y={421}>Same set of visited points</PositionText></g>)}
    <PositionText x={stacked?170:430} y={stacked?917:476}>{stacked?'Same locations;':'The numerical coordinates agree; which point belongs to which ID differs.'}</PositionText>{stacked&&<PositionText x={170} y={946}>their attached IDs differ.</PositionText>}
  </PositionDrawing>;
  return <><div className="position-desktop-scene">{scene(false)}</div><div className="position-mobile-scene">{scene(true)}</div></>;
}
export function PositionPermutationDrawing() {
  const q=[[1,0],[0,1],[1,1]],scores=q.map(row=>q.map(other=>dot(row,other))), order=[2,0,1];
  const weights=scores.map(softmax),values=[[2],[6],[10]],out=weights.map(row=>dot(row,values.flat()));
  return <PositionDrawing label="A complete record permutation rearranges both query rows and key columns; the same three output values move together" height={520}>
    <PositionCells x={30} y={65} values={q} width={84} role="input" label="Q = K: A, B, C"/>
    <PositionArrow x1={205} y1={125} x2={258} y2={125}/><PositionCells x={273} y={65} values={scores} width={84} label="Dot products: columns A, B, C"/>
    <PositionArrow x1={536} y1={125} x2={580} y2={125}/><PositionCells x={596} y={65} values={out.map(v=>[v])} width={150} label="Mixed scalar outputs"/>
    <PositionText x={118} y={250}>Rows move to C, A, B</PositionText><PositionText x={408} y={250}>Columns also move to C, A, B</PositionText>
    <PositionCells x={30} y={302} values={order.map(i=>q[i])} width={84} role="input"/><PositionArrow x1={205} y1={362} x2={258} y2={362}/>
    <PositionCells x={273} y={302} values={order.map(i=>order.map(j=>scores[i][j]))} width={84}/><PositionArrow x1={536} y1={362} x2={580} y2={362}/><PositionCells x={596} y={302} values={order.map(i=>[out[i]])} width={150}/>
    <PositionText x={400} y={487}>Mean output: {number(out.reduce((a,b)=>a+b,0)/3,6)} in both cases; maps and contents are held fixed.</PositionText>
  </PositionDrawing>;
}
export function PositionCausalDrawing() {
  return <PositionDrawing label="A fixed causal permission triangle produces different prefix means when scalar values are reversed" height={365}>
    <PositionCells x={20} y={80} values={[[1,'×','×'],[.5,.5,'×'],[1/3,1/3,1/3]]} width={88} label="Legal normalized prefix weights"/>
    <PositionArrow x1={299} y1={140} x2={342} y2={140}/><PositionCells x={365} y={80} values={[[2,10],[6,6],[10,2]]} role="input" width={96} label="Forward | reversed values"/>
    <PositionArrow x1={570} y1={140} x2={609} y2={140}/><PositionCells x={622} y={80} values={[[2,10],[4,8],[6,6]]} width={76} label="Prefix means"/>
    <PositionCells x={95} y={275} values={[[1,0,0],[1,1,1]]} width={80} role="input" label="BOS indicator | third-row uniform numerator"/>
    <PositionArrow x1={356} y1={306} x2={424} y2={306}/><PositionCells x={443} y={284} values={[1/3]} width={110} label="BOS weight"/><PositionText x={651} y={309}>1 marked item / 3 legal items</PositionText>
  </PositionDrawing>;
}
export function PositionAdditiveDrawing({ content, table, order=[0,1,2], ids=[0,1,2] }) {
  const selected=ids.map(id=>table[id]),combined=order.map((record,i)=>content[record].map((v,j)=>v+selected[i][j]));
  return <PositionDrawing label="Each content record looks up its attached position row, adds matching coordinates and enters the first Transformer block" height={625}>
    <PositionCells x={35} y={65} values={order.map(i=>content[i])} role="input" width={106} label="Content: stored A/B/C records"/>
    <PositionCells x={420} y={65} values={table} role="parameter" width={106} label="Learned position table: IDs 0–2"/>
    <PositionCells x={270} y={80} values={ids.map(id=>[id])} role="input" width={94} label="IDs"/>
    <PositionArrow x1={365} y1={142} x2={390} y2={195}/><PositionText x={478} y={206}>ID chooses table row</PositionText><PositionArrow x1={630} y1={187} x2={630} y2={220}/><PositionCells x={420} y={237} values={selected} role="parameter" width={106} label="Selected table rows"/>
    <PositionArrow x1={247} y1={125} x2={313} y2={255}/><PositionArrow x1={409} y1={298} x2={348} y2={298}/><PositionOperation x={331} y={291} label="add" width={76}/>
    <PositionArrow x1={331} y1={314} x2={331} y2={344}/><PositionCells x={140} y={372} values={combined} width={106} label="Combined input"/>
    <PositionArrow x1={246} y1={497} x2={246} y2={543}/><PositionOperation x={246} y={568} label="First Transformer block" width={224}/>
  </PositionDrawing>;
}
export function PositionClocksDrawing({ position=3,width=8,base=10000,selected=0 }) {
  const freq=frequencies(width,base),pairs=freq.length;
  const scene=stacked=><PositionDrawing label="Clock hands project cosine horizontally and sine vertically into the stored sine/cosine feature cells" width={stacked?340:800} height={stacked?Math.ceil(Math.min(pairs,4)/2)*310+110:355}>
    {freq.slice(0,4).map((w,i)=>{const row=stacked?Math.floor(i/2)*310:0,cx=stacked?85+(i%2)*170:99+i*200,cy=(stacked?134:118)+row,r=65,a=position*w,x=cx+r*Math.cos(a),y=cy-r*Math.sin(a);return <g key={i}><PositionText x={cx} y={24+row} color={positionColors.input}>{stacked?`pair ${i}`:`pair ${i} · ω=${number(w,7)}`}</PositionText>{stacked&&<PositionText x={cx} y={47+row} color={positionColors.input}>ω={number(w,7)}</PositionText>}<circle cx={cx} cy={cy} r={r} fill="none" stroke={selected===i ? positionColors.operation : positionColors.edge} strokeWidth={selected===i ? 2:1}/><line x1={cx-r-8} y1={cy} x2={cx+r+8} y2={cy} stroke={positionColors.edge}/><line x1={cx} y1={cy-r-8} x2={cx} y2={cy+r+8} stroke={positionColors.edge}/><PositionArrow x1={cx} y1={cy} x2={x} y2={y} color={positionColors.computed}/><path d={`M${x} ${y} V${cy} M${x} ${y} H${cx}`} fill="none" stroke={positionColors.computed} strokeDasharray="3 3"/><PositionText x={cx+(stacked?65:75)} y={cy+20} size={12}>cos</PositionText><PositionText x={cx+13} y={cy-72} size={12}>sin</PositionText><PositionText x={cx} y={221+row}>phase {number(a,5)} rad</PositionText><PositionCells x={cx-(stacked?80:90)} y={261+row} values={[Math.sin(a),Math.cos(a)]} width={stacked?80:90} label="stored [sin, cos]" digits={5}/></g>;})}
    {stacked?<><PositionText x={170} y={Math.ceil(Math.min(pairs,4)/2)*310+28}>Position {position}; width {width}</PositionText><PositionText x={170} y={Math.ceil(Math.min(pairs,4)/2)*310+62}>Base {number(base)}</PositionText><PositionText x={170} y={Math.ceil(Math.min(pairs,4)/2)*310+96}>{pairs>4?`${pairs-4} further pairs in the full array.`:`All ${pairs} pairs shown.`}</PositionText></>:<PositionText x={400} y={344}>Position {position}; width {width}; base {number(base)}. {pairs>4 ? `${pairs-4} further pairs are shown in the full array below.` : `All ${pairs} pairs shown.`}</PositionText>}
  </PositionDrawing>;
  return <><div className="position-desktop-scene">{scene(false)}</div><div className="position-mobile-scene">{scene(true)}</div></>;
}
export function PositionShiftDrawing({ start=3,shift=2,frequency=.1 }) {
  const p=[Math.sin(start*frequency),Math.cos(start*frequency)],a=shift*frequency,m=[[Math.cos(a),Math.sin(a)],[-Math.sin(a),Math.cos(a)]];
  return <PositionDrawing label="A shared two-by-two shift map turns the stored sine/cosine column into the code at the shifted position" height={275}>
    <PositionCells x={20} y={80} values={p.map(v=>[v])} width={108} role="input" label={`[sin,cos] at t=${start}`}/><PositionArrow x1={143} y1={119} x2={220} y2={119}/>
    <PositionCells x={235} y={80} values={m} width={115} label={`Shift map δ=${shift}`}/><PositionArrow x1={484} y1={119} x2={577} y2={119}/>
    <PositionCells x={600} y={80} values={[Math.sin((start+shift)*frequency),Math.cos((start+shift)*frequency)].map(v=>[v])} width={138} label={`Code at t+δ=${start+shift}`}/>
    <PositionText x={400} y={225}>Read the stored pair as a column here; this map depends on δ, not on t.</PositionText>
  </PositionDrawing>;
}
export function PositionProjectionTermsDrawing() {
  const x=[1,2],y=[-.5,1],p=[.2,0],r=[0,.3],m=[[1,.5],[-.25,2]];
  const product=(a,b)=>dot(a,m.map(row=>dot(row,b))),terms=[product(x,y),product(x,r),product(p,y),product(p,r)];
  return <PositionDrawing label="Projected content-plus-position comparison expands into four actual products, not a position-only cosine" height={460}>
    <PositionCells x={23} y={64} values={[x,p]} role="input" width={93} label="Query content x | code p"/><PositionCells x={288} y={64} values={m} role="parameter" width={100} label="Hand map M"/><PositionCells x={565} y={64} values={[y,r]} role="input" width={93} label="Key content y | code r"/>
    {['content–content','content–position','position–content','position–position'].map((label,i)=><g key={label}><PositionArrow x1={380} y1={163} x2={97+i*200} y2={223}/><PositionCells x={19+i*200} y={264} values={[terms[i]]} width={156} label={label}/></g>)}
    <PositionText x={400} y={357}>{terms.map(v=>number(v)).join(' + ')} = {number(terms.reduce((a,b)=>a+b,0))}</PositionText><PositionText x={400} y={414}>M is a declared example; arbitrary learned projections need not retain the raw-code identity.</PositionText>
  </PositionDrawing>;
}
export function PositionAttentionRouteDrawing() {
  return <PositionDrawing label="Receiver content projects to Q; donor content projects to K and V. Position turns Q and K, while donor values stay unrotated" width={960} height={660}>
    <PositionCells x={25} y={65} values={[['x₀','x₁','x₂','x₃']]} role="input" width={67} label="Receiver content + attached query ID"/>
    <PositionCells x={550} y={65} values={[['y₀','y₁','y₂','y₃']]} role="input" width={67} label="Donor content + attached key ID"/>
    {[150,480,810].map((cx,i)=><g key={cx}><PositionArrow x1={i?684:159} y1={110} x2={cx} y2={151}/><PositionCells x={cx-80} y={185} values={[[`w₀₀`,`w₀₁`],[`w₁₀`,`w₁₁`]]} role="parameter" width={80} height={32} label={`W${['Q','K','V'][i]}: 2×2 of 4×4 shown`}/><PositionText x={cx} y={279}>Other coefficients omitted</PositionText><PositionArrow x1={cx} y1={292} x2={cx} y2={319}/><PositionCells x={cx-82} y={348} values={[['a','b']]} width={82} label={['q: receiver pair','k: donor pair','v: donor pair'][i]}/>{i<2 && <><PositionArrow x1={cx} y1={393} x2={cx} y2={432}/><PositionOperation x={cx} y={457} label="turn this pair" width={174}/><PositionText x={cx} y={510}>{i?'key':'query'} ID × pair frequency</PositionText><PositionArrow x1={cx} y1={476} x2={295} y2={556}/></>}</g>)}
    <PositionOperation x={295} y={580} label="dot → divide → softmax" width={220}/><PositionArrow x1={417} y1={580} x2={667} y2={580}/><PositionArrow x1={810} y1={393} x2={810} y2={556}/><PositionOperation x={792} y={580} label="weighted V sum" width={224}/><PositionText x={480} y={645}>This is one receiver–donor route; normalization and mixing use every permitted donor. V stays unrotated.</PositionText>
  </PositionDrawing>;
}
export function PositionQuarterTurnDrawing() {
  return <PositionDrawing label="A counterclockwise quarter turn sends the unit vector from the positive horizontal axis to the positive vertical axis" height={275} width={600}>
    <line x1={50} y1={205} x2={365} y2={205} stroke={positionColors.edge}/><line x1={140} y1={240} x2={140} y2={35} stroke={positionColors.edge}/><PositionArrow x1={140} y1={205} x2={300} y2={205} color={positionColors.input}/><PositionArrow x1={140} y1={205} x2={140} y2={45} color={positionColors.computed}/><path d="M220 205 A80 80 0 0 0 140 125" fill="none" stroke={positionColors.edge}/><PositionText x={355} y={228} color={positionColors.input}>raw [1,0]</PositionText><PositionText x={273} y={56} color={positionColors.computed}>turned [0,1]</PositionText><PositionText x={258} y={134}>π/2 radians</PositionText><PositionText x={459} y={186}>Same length 1</PositionText>
  </PositionDrawing>;
}
export function PositionPairDrawing({ query,keyVector,queryId,keyId,base=10000,pair=0,relative=false }) {
  const q=query.slice(2*pair,2*pair+2),k=keyVector.slice(2*pair,2*pair+2),w=frequencies(query.length,base)[pair];
  const turn=(row,angle)=>[row[0]*Math.cos(angle)-row[1]*Math.sin(angle),row[0]*Math.sin(angle)+row[1]*Math.cos(angle)];
  const rq=relative ? q : turn(q,queryId*w),rk=turn(k,(relative ? keyId-queryId:keyId)*w),extent=Math.max(1.1,...[q,k,rq,rk].map(v=>Math.hypot(...v)))*1.22;
  const cx=206,cy=182,scale=110/extent;
  return <PositionDrawing label={`Pair ${pair}: raw and rotated Q/K on equal coordinate scales, with each signed dot-product term`} height={430}>
    <PositionText x={206} y={30}>Pair {pair} · frequency {number(w,7)} rad/position</PositionText><circle cx={cx} cy={cy} r={110} fill="none" stroke={positionColors.edge}/><line x1={58} y1={cy} x2={352} y2={cy} stroke={positionColors.edge}/><line x1={cx} y1={35} x2={cx} y2={329} stroke={positionColors.edge}/>
    {[q,k,rq,rk].map((row,i)=>{const x=cx+row[0]*scale,y=cy-row[1]*scale,color=i<2?positionColors.input:positionColors.computed,ly=77+i*51;return <g key={i}><PositionArrow x1={cx} y1={cy} x2={x} y2={y} color={color}/><circle cx={x} cy={y} r={3+i} stroke={color} fill="none"/><path d={`M${x} ${y} L${365+i*12} ${ly-5} H425`} fill="none" stroke={color} strokeDasharray={i%2?'4 3':undefined}/><PositionText x={438} y={ly} anchor="start" color={color}>{['raw q','raw k',relative ? 'q: held fixed':'rotated q',relative ? 'k: relative turn':'rotated k'][i]} = {positionVector(row,5)}</PositionText></g>;})}
    <PositionText x={339} y={cy+24}>coordinate {2*pair}</PositionText><PositionText x={cx+18} y={52} anchor="start">coordinate {2*pair+1}</PositionText>
    <PositionCells x={40} y={367} values={[rq[0]*rk[0],rq[1]*rk[1],dot(rq,rk)]} width={228} label="First coordinate product | second product | their sum" digits={6}/>
  </PositionDrawing>;
}
export function PositionBasisDrawing({ query=[.8,-.5,.3,1.2],position=3 }) {
  const order=[0,2,1,3],out=rotate(query,position),split=order.map(i=>query[i]);
  return <PositionDrawing label="Four coordinate wires reorder adjacent pairs into a half-split basis; outputs must return through the inverse basis too" height={385}>
    <PositionCells x={38} y={70} values={query.map(v=>[v])} role="input" width={128} label="Adjacent: [0,1],[2,3]"/>
    {order.map((from,to)=><PositionArrow key={to} x1={177} y1={90+40*from} x2={325} y2={90+40*to}/>)}
    <PositionCells x={340} y={70} values={split.map(v=>[v])} role="input" width={132} label="Half-split: [0,2],[1,3]"/>
    <PositionArrow x1={489} y1={146} x2={569} y2={146}/><PositionCells x={588} y={70} values={order.map(i=>[out[i]])} width={134} label="Rotated in that same basis"/>
    <PositionText x={400} y={281}>Wire order [0,2,1,3]; inverse restores {positionVector(out,5)}</PositionText><PositionText x={400} y={332}>Changing only the rotation routine pairs different learned features and changes the operator.</PositionText>
  </PositionDrawing>;
}
export function PositionPartialDrawing({ query=[.8,-.5,.3,1.2],keyVector=[1,.25,-.5,.75],pairs=1,queryId=3,keyId=7 }) {
  const q=pairs ? [...rotate(query.slice(0,2*pairs),queryId),...query.slice(2*pairs)] : query;
  const k=pairs ? [...rotate(keyVector.slice(0,2*pairs),keyId),...keyVector.slice(2*pairs)] : keyVector;
  const rotary=dot(q.slice(0,2*pairs),k.slice(0,2*pairs)),content=dot(q.slice(2*pairs),k.slice(2*pairs));
  return <PositionDrawing label="A partially rotated head combines its rotated and untouched coordinate products before dividing by the complete head width" height={310}>
    <PositionCells x={24} y={65} values={[q,k]} width={126} label={`Q′ / K′: first ${2*pairs} coordinates rotate; remaining stay raw`}/>
    <PositionArrow x1={242} y1={154} x2={183} y2={192}/><PositionArrow x1={436} y1={154} x2={446} y2={192}/><PositionCells x={72} y={224} values={[rotary,content,(rotary+content)/2]} width={205} label="Rotary dot | untouched dot | total / √4" digits={6}/><PositionText x={665} y={116}>Head width stays 4</PositionText>
  </PositionDrawing>;
}
export function PositionAlibiDrawing({ scores,keys,query,slope,result }) {
  return <PositionDrawing label="Each key has a content score, a finite distance bias and an independent permission boundary; only legal summed logits normalize" height={Math.max(450,260+keys.length*34)}>
    <PositionText x={400} y={30} color={positionColors.input}>Receiver ID {query}; distance penalty slope {number(slope)}</PositionText>
    <line x1={55} y1={80} x2={735} y2={80} stroke={positionColors.edge}/>
    {keys.map((id,i)=><g key={i}><circle cx={70+i*660/Math.max(1,keys.length-1)} cy={80} r={6} fill={positionColors.input}/><PositionText x={70+i*660/Math.max(1,keys.length-1)} y={110} color={positionColors.input}>key {i}: ID {id}</PositionText></g>)}
    <PositionCells x={32} y={174} values={scores.map((score,i)=>[score,result.bias[i],result.legal[i] ? result.final[i]:'×',result.weights ? result.weights[i]: 'none'])} width={158} height={34} label="Content | distance bias | allowed sum | normalized share" digits={6}/>
    <PositionText x={400} y={192+keys.length*34+42}>A × is forbidden, not a tiny finite probability. Printed columns use one actual competition.</PositionText>
  </PositionDrawing>;
}
export function PositionSlopeDrawing({ heads=3 }) {
  const slopes=alibiSlopes(heads);
  return <PositionDrawing label="Each original head ID keeps its own slope and equal-content odds curve, including non-power-of-two schedules" height={370}>
    <line x1={65} y1={285} x2={515} y2={285} stroke={positionColors.edge}/><line x1={65} y1={45} x2={65} y2={285} stroke={positionColors.edge}/>
    {[0,.5,1].map(v=><PositionText key={v} x={48} y={290-240*v}>{v}</PositionText>)}
    {slopes.map((s,i)=>{const color=[positionColors.input,positionColors.computed,positionColors.parameter,'#ddd'][i%4],endpoint=285-240*Math.exp(-s*32),labelY=58+i*32;return <g key={i}><polyline points={Array.from({length:65},(_,j)=>`${65+j/64*450},${285-240*Math.exp(-s*j/2)}`).join(' ')} fill="none" stroke={color} strokeDasharray={i>3?'4 3':undefined}/><circle cx={515} cy={endpoint} r={3} fill={color}/><path d={`M515 ${endpoint} L${525+i*2} ${labelY-5} H544`} stroke={color} fill="none" strokeDasharray={i>3?'4 3':undefined}/><PositionText x={550} y={labelY} anchor="start" color={color}>head {i}: slope {number(s,7)}</PositionText></g>;})}
    <PositionText x={65} y={307}>0</PositionText><PositionText x={515} y={307}>32</PositionText><PositionText x={400} y={340}>Extra distance →; height = odds multiplier exp(−slope × distance)</PositionText>
  </PositionDrawing>;
}
export function PositionShawDrawing({ query=[2,0],offset=-1 }) {
  const index=Math.min(2,Math.max(-2,offset))+2,table=[[-.2,.1],[.5,1],[0,0],[.25,-.5],[.1,.2]],values=[[.1,0],[0,.2],[0,0],[-.1,.3],[.2,-.1]],relation=table[index];
  return <PositionDrawing label="A clipped key-minus-query offset chooses learned key and value relation vectors; the query dot affects matching, and the value relation affects the written message" height={475}>
    <PositionText x={400} y={30} color={positionColors.input}>Signed offset {offset} → clipped {index-2} → table row {index}</PositionText>
    <PositionCells x={25} y={90} values={table} role="parameter" width={93} label="Key relations −2…2"/>
    <PositionCells x={280} y={90} values={values} role="parameter" width={93} label="Value relations −2…2"/>
    <PositionCells x={552} y={90} values={[query]} role="input" width={104} label="Projected query q"/>
    <PositionCells x={552} y={193} values={[relation]} role="parameter" width={104} label="Selected key relation aᴷ"/>
    <PositionArrow x1={657} y1={236} x2={657} y2={281}/><PositionCells x={552} y={308} values={[dot(query,relation)]} width={208} label="Added raw matching dot"/>
    <PositionArrow x1={373} y1={294} x2={373} y2={331}/><PositionCells x={281} y={363} values={[values[index]]} role="parameter" width={93} label="Selected aⱽ adds to V before mixing"/>
    <PositionText x={400} y={451}>These finite table entries are hand parameters. Changing q changes its relation score.</PositionText>
  </PositionDrawing>;
}
export function PositionBucketDrawing({ offset=16 }) {
  const bucket=relativeBucket(offset),bounds=[0,1,2,3,4,5,6,7,8,12,16,23,32,46,64,91,128];
  return <PositionDrawing label="T5 splits offset direction, exact near distances and logarithmically wider far distances before selecting a learned scalar bias" height={355}>
    <PositionText x={400} y={30} color={positionColors.input}>Key ID − query ID = {offset}; magnitude {Math.abs(offset)}; direction {offset>0 ? 'positive':'nonpositive'}</PositionText>
    {bounds.slice(0,-1).map((bound,i)=><g key={i}><rect x={25+i*46} y={84} width={46} height={51} fill={i===bucket%16 ? '#be9cf52a':'none'} stroke={i===bucket%16 ? positionColors.operation:positionColors.edge}/><PositionText x={48+i*46} y={105} size={12}>{i<8 ? bound : `${bound}…`}</PositionText><PositionText x={48+i*46} y={124} size={12}>bin {i}</PositionText></g>)}
    <PositionText x={400} y={175}>Near bins have one integer each; later boundaries are rounded up; final bin saturates.</PositionText><PositionCells x={120} y={225} values={[bucket]} width={140} label="Category ID"/><PositionArrow x1={276} y1={245} x2={421} y2={245}/><PositionCells x={439} y={225} values={[`b[${bucket}]`]} role="parameter" width={176} label="Learned scalar: either sign"/><PositionText x={400} y={326}>The bucket selects a bias. It never decides whether a future key is permitted.</PositionText>
  </PositionDrawing>;
}

export function PositionCacheDrawing({ settings, actual, reference }) {
  const keys=settings.mode==='rope' ? settings.keys.map((row,i)=>rotate(row,settings.ids[i],settings.cacheBase)) : settings.keys;
  const q=settings.mode==='rope' ? rotate(settings.query,settings.rotaryId,settings.base) : settings.query;
  return <PositionDrawing label="Physical cache slots store logically identified key/value records; the query rotation and permitted IDs are independently shown" height={400+settings.ids.length*37} width={Math.max(1060,630+settings.ids.length*112)}>
    <PositionCells x={18} y={70} values={settings.ids.map((id,i)=>[i,id])} width={74} height={37} role="input" label="Slot | logical ID"/>
    <PositionCells x={203} y={70} values={keys} width={113} height={37} label={settings.mode==='rope' ? 'Stored rotated keys (four coordinates)' : 'Stored raw keys (four coordinates)'}/>
    <PositionCells x={700} y={70} values={settings.values} role="input" width={105} height={37} label="Unrotated values"/>
    <PositionCells x={942} y={70} values={actual.legal.map(v=>[v ? 'yes':'×'])} width={90} height={37} label="Allowed?"/>
    <PositionCells x={20} y={145+settings.ids.length*37} values={[q]} width={123} label={`Query: logical ${settings.queryId}, rotation ${settings.rotaryId}, mask cutoff ${settings.maskId}`}/>
    <PositionArrow x1={530} y1={167+settings.ids.length*37} x2={574} y2={167+settings.ids.length*37}/><PositionCells x={592} y={145+settings.ids.length*37} values={[actual.weights ?? settings.ids.map(()=> 'none')]} width={112} label="Legal normalized shares" digits={5}/>
    <PositionArrow x1={700} y1={201+settings.ids.length*37} x2={700} y2={248+settings.ids.length*37}/>
    <PositionCells x={300} y={288+settings.ids.length*37} values={[actual.output ?? ['none','none'],reference.output ?? ['none','none']]} width={163} label="Actual output | consistent full-reference output" digits={6}/>
  </PositionDrawing>;
}
export function PositionEmbeddingGradientDrawing() {
  return <PositionDrawing label="Repeated position IDs select the same learned row; two upstream derivatives sum into row seven while unused rows receive zero" height={340}>
    <PositionCells x={24} y={67} values={[[7],[7],[9]]} role="input" width={110} label="Input IDs"/><PositionArrow x1={147} y1={128} x2={238} y2={128}/>
    <PositionCells x={254} y={67} values={[['p₇,₀','p₇,₁'],['p₇,₀','p₇,₁'],['p₉,₀','p₉,₁']]} role="parameter" width={100} label="Selected trainable rows"/>
    <PositionCells x={563} y={67} values={[[1,2],[3,4],[5,6]]} role="backward" width={100} label="Chosen upstream derivative"/>
    <PositionArrow x1={660} y1={195} x2={660} y2={230} backward/><PositionCells x={270} y={269} values={[[4,6],[5,6]]} role="backward" width={132} label="Gradients at table rows 7 and 9"/>
    <PositionText x={148} y={291}>Unused rows: 0</PositionText>
  </PositionDrawing>;
}
export function PositionPackingDrawing() {
  return <PositionDrawing label="Left padding is excluded independently; packed documents restart local IDs and forbid cross-document attention" height={495}>
    <PositionCells x={24} y={72} values={[[0,0,1,1,1],['PAD','PAD','A','B','C'],['×','×',0,1,2]]} role="input" width={140} label="Validity | records | valid cumulative local IDs"/>
    <PositionCells x={24} y={267} values={[[1,'×','×','×'],[1,1,'×','×'],['×','×',1,'×'],['×','×',1,1]]} width={78} label="Packed causal permissions"/>
    <PositionCells x={403} y={267} values={[[0,1,0,1],['doc A','doc A','doc B','doc B']]} role="input" width={86} label="Local IDs | document identity"/>
    <PositionText x={400} y={466}>Restarting IDs alone does not stop cross-document reads.</PositionText>
  </PositionDrawing>;
}
export function PositionFrequencyDrawing({ width=64,base=10000,comparisonBase=500000 }) {
  const original=frequencies(width,base),other=frequencies(width,comparisonBase);
  return <PositionDrawing label="Faster and slower rotary pairs have different actual wavelengths; increasing the base preserves the fastest pair and stretches the slowest" height={385}>
    {[0,original.length-1].map((pair,i)=><g key={pair}><PositionText x={400} y={34+i*164}>Pair {pair}: one complete turn takes wavelength 2π / frequency</PositionText><PositionCells x={35} y={83+i*164} values={[[original[pair],2*Math.PI/original[pair]],[other[pair],2*Math.PI/other[pair]]]} width={203} label={`Base ${base} | base ${comparisonBase}; frequency then wavelength`} digits={6}/><line x1={495} y1={100+i*164} x2={495+240*other[pair]/original[pair]} y2={100+i*164} stroke={positionColors.input} strokeWidth={3}/><line x1={495} y1={140+i*164} x2={735} y2={140+i*164} stroke={positionColors.computed} strokeWidth={3}/><PositionText x={617} y={181+i*164}>Length ratio {number(original[pair]/other[pair],5)}</PositionText></g>)}
  </PositionDrawing>;
}
export function PositionInterpolationDrawing({ factor=4,position=255,context=64 }) {
  const target=context*factor,projected=position/factor;
  return <PositionDrawing label="Position interpolation squeezes the target coordinate rail into the original phase interval; neighbouring points become closer" height={280}>
    <PositionText x={400} y={25}>Target positions 0…{target-1}; factor {factor}</PositionText><line x1={65} y1={74} x2={735} y2={74} stroke={positionColors.edge}/>
    <circle cx={65+Math.min(1,position/(target-1))*670} cy={74} r={7} fill={positionColors.input}/><PositionText x={400} y={112} color={positionColors.input}>Selected position {position}</PositionText>
    <PositionArrow x1={400} y1={127} x2={400} y2={157}/><line x1={65} y1={195} x2={735} y2={195} stroke={positionColors.edge}/><circle cx={65+projected/context*670} cy={195} r={7} fill={positionColors.computed}/>
    <line x1={65+(context-1)/context*670} y1={183} x2={65+(context-1)/context*670} y2={207} stroke={positionColors.edge}/><circle cx={735} cy={195} r={8} fill="none" stroke={positionColors.edge}/><PositionText x={65} y={224}>0</PositionText><PositionText x={670} y={158}>last integer {context-1}</PositionText><PositionText x={735} y={224}>{context} excluded</PositionText>
    <PositionText x={400} y={264} color={positionColors.computed}>Mapped {number(projected,6)} lies on [0,{context}); phase spacing divides by {factor}.</PositionText>
  </PositionDrawing>;
}
export function PositionExtensionDrawing({ pairs,selected=0,offset=255,names=['original','pi','baseScaled','yarn'] }) {
  const labels={original:'Original',pi:'PI',baseScaled:'Base-scaled',yarn:'Paper YaRN'};
  return <PositionDrawing label="Four frequency rules produce actual phase changes in the same selected pair; no curve is a model-quality measurement" height={360}>
    {names.map((name,i)=>{const theta=pairs[name][selected],phase=offset*theta;return <g key={name}><PositionText x={106+i*200} y={34}>{labels[name]}</PositionText><PositionCells x={17+i*200} y={89} values={[[theta],[phase],[Math.cos(phase)]]} width={175} label="θ / phase / cosine" digits={7}/><circle cx={106+i*200} cy={280} r={43} fill="none" stroke={positionColors.edge}/><PositionArrow x1={106+i*200} y1={280} x2={106+i*200+43*Math.cos(phase)} y2={280-43*Math.sin(phase)} color={[positionColors.input,positionColors.computed,positionColors.parameter,'#ddd'][i]}/></g>;})}
    <PositionText x={400} y={350}>Each hand uses the same pair index and relative offset; text prints the unwrapped phase.</PositionText>
  </PositionDrawing>;
}
export function PositionXposDrawing({ queryId=0,keyId=512,width=4,pair=0 }) {
  const zeta=(2*pair/width+.4)/1.4,qa=zeta**(queryId/512),ka=zeta**(-keyId/512),relative=zeta**((queryId-keyId)/512);
  const max=Math.max(qa,ka),unit=180/max;
  return <PositionDrawing label="XPos multiplies the rotated query and key by reciprocal position-dependent amplitudes, producing a relative amplitude product" height={470}>
    <PositionCells x={26} y={75} values={[[queryId,qa],[keyId,ka]]} width={163} label="Logical query/key ID | respective amplitude" digits={7}/><PositionArrow x1={365} y1={115} x2={424} y2={115}/><PositionCells x={440} y={75} values={[relative]} width={292} label="Dot amplitude product q-scale × k-scale" digits={7}/>
    <PositionArrow x1={70} y1={226} x2={70+qa*unit} y2={226} color={positionColors.input}/><PositionText x={370} y={231} anchor="start" color={positionColors.input}>Query amplitude {number(qa,6)}</PositionText><PositionArrow x1={70} y1={285} x2={70+ka*unit} y2={285} color={positionColors.computed}/><PositionText x={370} y={290} anchor="start" color={positionColors.computed}>Key amplitude {number(ka,6)}</PositionText>
    <PositionText x={400} y={361}>Arrows isolate amplitude on one common scale; the normal rotation is still applied separately.</PositionText><PositionText x={400} y={417}>Common shifts cancel in this local product. Norms are not preserved.</PositionText>
  </PositionDrawing>;
}
export function PositionLongRopeResearchDrawing() {
  return <PositionDrawing label="All-token versus needle-target objectives select different token losses; short and long training branches use separate frequencies and document permissions" height={650}>
    <PositionCells x={26} y={60} values={[['fact','text','text','text','ask','answer'],[.2,.1,.1,.1,.3,2.4]]} width={120} role="input" label="Illustrative token roles | token cross-entropies (not measured model data)"/>
    <PositionArrow x1={270} y1={151} x2={170} y2={191}/><PositionArrow x1={665} y1={151} x2={626} y2={191}/><PositionCells x={49} y={222} values={[3.2/6]} width={245} label="All-token mean CE" digits={6}/><PositionCells x={469} y={222} values={[2.4]} width={250} label="Needle-answer-only mean CE"/>
    <PositionCells x={25} y={365} values={[[1,'×','×','×'],[1,1,'×','×'],['×','×',1,'×'],['×','×',1,1]]} width={82} label="Short documents: original frequencies"/>
    <PositionCells x={442} y={365} values={[[1,'×','×','×'],[1,1,'×','×'],[1,1,1,'×'],[1,1,1,1]]} width={82} label="Long segment: searched frequencies"/>
    <PositionText x={193} y={556}>Document boundaries prohibit cross reads.</PositionText><PositionText x={614} y={556}>Adapt the same model weights to long data.</PositionText><PositionText x={400} y={597}>Synthetic retrieval loss measures a targeted skill.</PositionText><PositionText x={400} y={634}>Evaluate wider reasoning and short-context tasks separately.</PositionText>
  </PositionDrawing>;
}
export function PositionTaskCoordinatesDrawing() {
  return <PositionDrawing label="Physical time and separate image axes encode different task coordinates from an ordinal array index" height={505}>
    <PositionCells x={25} y={66} values={[[0,1,20],[0,1,2],[0,.1,2]]} role="input" width={146} label="Seconds | ordinal IDs | phase at 0.1 rad/second"/>
    <PositionText x={635} y={89}>20 seconds = 20000 milliseconds</PositionText><PositionText x={635} y={121}>0.1 rad/s = 0.0001 rad/ms</PositionText>
    {[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]].map(([x,y],i)=><g key={i}><rect x={40+x*126} y={255+y*80} width={126} height={80} fill="none" stroke={positionColors.input}/><PositionText x={103+x*126} y={286+y*80} color={positionColors.input}>patch {i}</PositionText><PositionText x={103+x*126} y={314+y*80}>x={x}, y={y}</PositionText></g>)}
    <PositionArrow x1={485} y1={313} x2={558} y2={313}/><PositionCells x={574} y={277} values={[['x pair','y pair'],['t band','h / w bands']]} width={94} label="Separate axes, then video bands"/>
    <PositionText x={400} y={461}>Patch 2 → 3: ordinal +1, but spatial Δx=−2 and Δy=+1.</PositionText><PositionText x={400} y={492}>Flattening is storage layout; the task's coordinates need not be flattened ordinals.</PositionText>
  </PositionDrawing>;
}

export function PositionMovementArchitectureDrawing() {
  const raw=[[.6421700119972229,.32638999819755554],[.6421700119972229,.32638999819755554]],scaled=raw.map(row=>row.map(v=>2*v-1));
  const weights=[[-.49532774090766907,-.08670596778392792],[-.5700082182884216,.5903323292732239],[-.3345782458782196,-.7134029865264893]],bias=[.47006911039352417,-.11120715737342834,.07383579760789871];
  const stem=scaled.map(row=>weights.map((w,i)=>dot(row,w)+bias[i]));
  return <PositionDrawing label="The actual saved movement encoder preserves input rows through a biased stem, two-head attention and width-changing feedforward branch, with both residual bypasses drawn" width={960} height={1870}>
    <PositionCells x={30} y={65} values={raw} width={120} role="input" label="First 2 of 45 original points" digits={6}/><PositionArrow x1={287} y1={105} x2={337} y2={105}/><PositionOperation x={438} y={105} label="2x−1, 2y−1" width={173}/><PositionArrow x1={538} y1={105} x2={619} y2={105}/><PositionCells x={636} y={65} values={scaled} width={120} label="Scaled points" digits={6}/>
    <PositionCells x={30} y={240} values={weights} role="parameter" width={120} label="Stem W: 3 of 24 output rows" digits={6}/><PositionCells x={323} y={240} values={bias.map(v=>[v])} role="parameter" width={122} label="Matching stem biases" digits={6}/>
    <path d="M755 150 V210 H656 V250" fill="none" stroke={positionColors.edge}/><PositionArrow x1={278} y1={300} x2={546} y2={300}/><PositionOperation x={656} y={300} label="scaled rows × Wᵀ" width={193}/><PositionArrow x1={656} y1={324} x2={656} y2={382}/><PositionArrow x1={384} y1={365} x2={546} y2={403}/><PositionOperation x={656} y={403} label="add bias per row" width={193}/>
    <PositionArrow x1={656} y1={427} x2={403} y2={490}/><PositionCells x={30} y={480} values={stem} width={120} label="Computed stem: 2 rows, first 3 of 24 features" digits={6}/>
    <PositionArrow x1={210} y1={566} x2={210} y2={630}/><PositionCells x={30} y={663} values={[['h₀','h₁','h₂','…'],['h₀','h₁','h₂','…']]} width={98} label="State X: 2/45 rows, 3/24 features + …"/>
    <PositionText x={681} y={640}>Learned/sine table: add before state X.</PositionText><PositionText x={681} y={682}>None/RoPE/ALiBi: no input addition.</PositionText>
    <PositionArrow x1={226} y1={754} x2={226} y2={807}/><PositionOperation x={226} y={829} label="LayerNorm → biased Q/K/V" width={330}/><PositionArrow x1={405} y1={829} x2={481} y2={829}/><PositionCells x={499} y={789} values={[['q₀','q₁','…'],['k₀','k₁','…'],['v₀','v₁','…']]} width={121} label="Per head: 12 features; 2 heads"/>
    <PositionArrow x1={681} y1={916} x2={681} y2={965}/><PositionOperation x={681} y={989} label="match → shares → V mixture" width={325}/><PositionText x={234} y={941}>RoPE: turn 6 pairs of Q/K.</PositionText><PositionText x={234} y={985}>ALiBi: add −slope×|ID difference|.</PositionText>
    <PositionArrow x1={681} y1={1015} x2={681} y2={1054}/><PositionCells x={499} y={1090} values={[['u₀','u₁','…']]} width={121} label="Joined head messages → biased 24→24 output map"/>
    <PositionArrow x1={499} y1={1110} x2={337} y2={1135}/><PositionOperation x={226} y={1157} label="add to saved X" width={220}/><path d="M30 703 H15 V1157 H116" fill="none" stroke={positionColors.edge}/><PositionText x={81} y={1086}>saved X</PositionText>
    <PositionArrow x1={226} y1={1182} x2={226} y2={1225}/><PositionCells x={30} y={1260} values={[['z₀','z₁','z₂','…']]} width={98} label="Context Z: 1 of 45 rows, 3 of 24 features + omission"/>
    <PositionArrow x1={226} y1={1305} x2={226} y2={1354}/><PositionOperation x={226} y={1379} label="LN → biased 24→48 → GELU" width={365}/><PositionArrow x1={424} y1={1379} x2={471} y2={1379}/><PositionCells x={489} y={1359} values={[['a₀','a₁','a₂','…']]} width={105} label="Expanded activations: 3 of 48 + omission"/>
    <PositionArrow x1={697} y1={1403} x2={697} y2={1455}/><PositionOperation x={697} y={1480} label="learned 48→24 map + bias" width={311}/><PositionArrow x1={697} y1={1505} x2={697} y2={1537}/><PositionCells x={489} y={1570} values={[['δ₀','δ₁','δ₂','…']]} width={105} label="Written update: 3 of 24 + omission"/>
    <PositionArrow x1={489} y1={1590} x2={349} y2={1640}/><PositionOperation x={226} y={1665} label="add to saved Z → final LN" width={299}/><path d="M30 1280 H15 V1665 H76.5" fill="none" stroke={positionColors.edge}/><PositionText x={77} y={1600}>saved Z</PositionText>
    <PositionArrow x1={389} y1={1665} x2={465} y2={1665}/><PositionCells x={489} y={1645} values={[['mean₀','mean₁','…']]} width={138} label="Pooling mean: 2 of 24 features + omission"/>
    <PositionArrow x1={697} y1={1690} x2={697} y2={1726}/><PositionOperation x={697} y={1751} label="biased 24→15 classifier" width={302}/><PositionArrow x1={697} y1={1778} x2={697} y2={1800}/><PositionCells x={489} y={1824} values={[['logit₀','…','logit₁₄']]} width={138} label="15 logits; softmax gives 15 class shares"/>
  </PositionDrawing>;
}
export function PositionSymmetricBiasDrawing() {
  const original=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>-.5*Math.abs(i-j))),order=[3,2,1,0];
  return <PositionDrawing label="A symmetric absolute-distance matrix remains identical after reversing both record axes; a causal directed boundary is different" height={355}>
    <PositionCells x={27} y={85} values={original} width={85} label="−0.5 |query ID − key ID|"/><PositionCells x={431} y={85} values={order.map(i=>order.map(j=>original[i][j]))} width={85} label="Both axes reversed"/>
    <PositionText x={400} y={312}>Distances preserve proximity and do not identify which end of the journey is the start.</PositionText>
  </PositionDrawing>;
}
export function PositionYarnRampDrawing() {
  const width=64,base=10000,context=4096,f=frequencies(width,base),lo=Math.floor(width*Math.log(context/(32*2*Math.PI))/(2*Math.log(base))),hi=Math.ceil(width*Math.log(context/(2*Math.PI))/(2*Math.log(base)));
  const paper=f.map(w=>Math.min(1,Math.max(0,(context*w/(2*Math.PI)-1)/31))),library=f.map((_,i)=>1-Math.min(1,Math.max(0,(i-lo)/Math.max(.001,hi-lo))));
  return <PositionDrawing label="YaRN paper rotation-count ramp and pinned library pair-index ramp produce different middle weights with identical endpoint meaning" height={380}>
    <line x1={65} y1={265} x2={565} y2={265} stroke={positionColors.edge}/><line x1={65} y1={45} x2={65} y2={265} stroke={positionColors.edge}/>
    {[paper,library].map((values,i)=><g key={i}><polyline points={values.map((v,j)=>`${65+500*j/31},${265-220*v}`).join(' ')} fill="none" stroke={i?positionColors.computed:positionColors.input} strokeWidth={2}/><path d={`M${65+500*12/31} ${265-220*values[12]} L575 ${i?126:78} H585`} stroke={i?positionColors.computed:positionColors.input} fill="none"/></g>)}
    {[0,1].map(v=><PositionText key={v} x={49} y={270-220*v}>{v}</PositionText>)}
    <PositionText x={594} y={83} anchor="start" color={positionColors.input}>Paper: γ from turns</PositionText><PositionText x={594} y={131} anchor="start" color={positionColors.computed}>v5.17.0: index ramp</PositionText><PositionText x={594} y={179} anchor="start">Correction indices {lo}…{hi}</PositionText>
    <PositionText x={65} y={290}>0</PositionText><PositionText x={565} y={290}>31</PositionText><PositionText x={316} y={334}>Pair index →; height = weight on unchanged frequency (0…1)</PositionText><PositionText x={400} y={372}>Same width 64, base 10000, original context 4096; two explicitly different formula conventions.</PositionText>
  </PositionDrawing>;
}
export function PositionCurrentFrequencyDrawing() {
  const wavelength=[1024,4096,16384],theta=wavelength.map(w=>2*Math.PI/w),u=[1,1/3,0],adjusted=theta.map((v,i)=>v*(u[i]+(1-u[i])/8));
  return <PositionDrawing label="Three declared wavelengths pass through unchanged, blended and divided-by-eight frequency routes; searched per-pair factors are a separate rule" height={655}>
    <PositionCells x={26} y={65} values={[wavelength,theta]} role="input" width={240} label="Declared wavelengths λ | corresponding θ = 2π/λ" digits={7}/>
    {wavelength.map((w,i)=><g key={w}><PositionArrow x1={146+240*i} y1={152} x2={146+240*i} y2={188}/><PositionCells x={26+240*i} y={221} values={[[u[i]],[1-u[i]]]} width={240} label={['fast λ<2048','middle 2048…8192','slow λ>8192'][i]}/><PositionArrow x1={146+240*i} y1={310} x2={146+240*i} y2={343}/></g>)}
    <PositionCells x={26} y={375} values={[adjusted]} width={240} label="Computed θ′ = uθ + (1−u)θ/8; upper weight u, lower 1−u" digits={7}/>
    <PositionCells x={28} y={484} values={[['f₀','f₁','f₂','…']]} role="input" width={178} label="Separate LongRoPE rule: factors chosen by model-dependent search"/>
    <PositionArrow x1={384} y1={530} x2={384} y2={550}/><PositionCells x={28} y={580} values={[['θ₀/f₀','θ₁/f₁','θ₂/f₂','…']]} width={178} label="Computed per-pair frequencies; f is not wavelength λ"/>
    <PositionText x={400} y={650}>An unscaled initial prefix is a separate position rule, not part of dividing every frequency.</PositionText>
  </PositionDrawing>;
}
export function PositionLinearReadDrawing() {
  return <PositionDrawing label="Positive unrotated features normalize the signed rotated numerator; two donors produce an output outside their value interval" height={610}>
    <PositionCells x={30} y={65} values={[[1,1]]} role="input" width={105} label="Query feature φ(q), ID 0"/>
    <PositionCells x={400} y={65} values={[[1,1],[1,1]]} role="input" width={105} label="Key features ψ(k), IDs 0 and π"/>
    <PositionCells x={661} y={65} values={[[2],[6]]} role="input" width={106} label="Values"/>
    <PositionArrow x1={134} y1={117} x2={134} y2={193}/><PositionCells x={30} y={225} values={[[1,1]]} width={105} label="Rotated query"/>
    <PositionArrow x1={502} y1={154} x2={502} y2={193}/><PositionCells x={400} y={225} values={[[1,1],[-1,-1]]} width={105} label="Rotated key features"/>
    <PositionArrow x1={241} y1={245} x2={455} y2={322}/><PositionArrow x1={502} y1={313} x2={502} y2={328}/><PositionArrow x1={714} y1={153} x2={625} y2={388}/><PositionCells x={285} y={355} values={[[2,-2],[4,-12]]} width={170} label="Rotated matching dots | signed dot × value"/>
    <PositionText x={131} y={380}>Unrotated dot masses:</PositionText><PositionCells x={27} y={411} values={[[2,2]]} width={108} label="positive 2 + 2 = 4"/>
    <path d="M30 85 H15 V431 H27 M610 105 H645 V478 H253 V451" fill="none" stroke={positionColors.input}/><PositionArrow x1={253} y1={451} x2={243} y2={451} color={positionColors.input}/>
    <PositionArrow x1={134} y1={461} x2={282} y2={510}/><PositionArrow x1={455} y1={443} x2={455} y2={490}/><PositionCells x={305} y={535} values={[-8/4]} width={280} label="Numerator 4 − 12 = −8; divide by mass 4"/>
    <PositionText x={400} y={602}>Signed coefficients 0.5 and −0.5 sum to 0. These are not probabilities.</PositionText>
  </PositionDrawing>;
}
export function PositionMultiaxisDrawing() {
  const patches=[[0,0,2],[0,1,0],[1,0,2],[1,1,0]];
  return <PositionDrawing label="Two frames retain time, row and column coordinates; each of the three coordinate bands supplies its own rotary phases" width={960} height={775}>
    {[0,1].map(t=><g key={t}><PositionText x={155+t*350} y={28}>Frame t={t}</PositionText>{Array.from({length:6},(_,i)=>{const h=Math.floor(i/3),w=i%3;return <g key={i}><rect x={30+t*350+w*91} y={55+h*74} width={91} height={74} fill="none" stroke={positionColors.input}/><PositionText x={75+t*350+w*91} y={83+h*74}>h{h},w{w}</PositionText><PositionText x={75+t*350+w*91} y={111+h*74}>t{t}</PositionText></g>;})}</g>)}
    <PositionCells x={30} y={268} values={patches} width={87} role="input" label="Four pictured patch records: t | h | w"/>
    <rect x={30} y={388} width={261} height={40} fill="none" stroke={positionColors.operation} strokeWidth={3}/>
    <PositionArrow x1={303} y1={348} x2={384} y2={348}/><PositionCells x={410} y={268} values={patches.map(([t,h,w])=>[`${t}θ₀`,`${h}θ₁`,`${w}θ₂`])} width={170} label="Three pairs of six-feature teaching head: phases by band"/>
    <rect x={410} y={388} width={510} height={40} fill="none" stroke={positionColors.operation} strokeWidth={3}/>
    <PositionCells x={34} y={505} values={[['a₀,a₁','a₂,a₃','a₄,a₅']]} role="input" width={264} label="Selected patch (1,1,0): projected temporal | height | width pair"/>
    {[0,1,2].map(i=><g key={i}><path d={`M${495+i*170} 433 V${450+i*10} H${245+i*264} V581 H${166+i*264}`} fill="none" stroke={positionColors.computed}/><PositionText x={246+i*264} y={575}>phase input</PositionText></g>)}
    <PositionArrow x1={166} y1={551} x2={166} y2={585}/><PositionArrow x1={430} y1={551} x2={430} y2={585}/><PositionArrow x1={694} y1={551} x2={694} y2={585}/>
    <PositionCells x={34} y={619} values={[['R(θ₀)a₀:₂','R(θ₁)a₂:₄','R(0θ₂)a₄:₆']]} width={264} label="Selected Q/K pairs; matching dots add across the three bands"/>
    <PositionText x={480} y={713}>A real Qwen2-VL head uses 16/24/24 frequency bands and a half-split basis.</PositionText><PositionText x={480} y={751}>This six-feature head is a complete small fixture, not that checkpoint's head width.</PositionText>
  </PositionDrawing>;
}
export function PositionCacheMemoryDrawing() {
  return <PositionDrawing label="Rotating cached keys preserves the key/value tensor dimensions; each layer retains eight key/value heads and 4096 positions in this example" height={315}>
    <PositionCells x={25} y={75} values={[['key','head 0','128 features'],['key','…','…'],['key','head 7','128 features']]} width={122} label="K: N×32×8×4096×128" role="input"/>
    <PositionCells x={435} y={75} values={[['value','head 0','128 features'],['value','…','…'],['value','head 7','128 features']]} width={110} label="V: N×32×8×4096×128" role="input"/>
    <PositionText x={400} y={254}>N=1; 32 layers; each displayed head label stands for 4096 stored rows.</PositionText><PositionText x={400} y={302}>Both tensors × 2 bytes = 536870912 bytes = 512 MiB, before extra runtime metadata.</PositionText>
  </PositionDrawing>;
}

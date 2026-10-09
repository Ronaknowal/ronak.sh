import {useId} from 'react';
import {flowNumber as f} from './LessonFlow.jsx';
import './ring-attention-flow.css';

export const ringPaint={input:'#79c8e8',parameter:'#e6bb60',computed:'#c5a5e8',line:'#858585',gradient:'#f09a68',text:'#dedede'};
export const ringNumbers=a=>a.map(x=>f(x,5)).join(', ');

export function RingFlowFigure({label,width=350,height=300,children,wide=false}) {
  const id=useId().replaceAll(':','');
  return <figure className={`ring-flow-figure${wide?' ring-flow-wide':''}`} tabIndex={wide?0:undefined} aria-label={wide?`${label}; scroll horizontally if needed`:undefined}><svg style={wide?{width,minWidth:width}:undefined} viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={label}>
    <defs><marker id={`ring-forward-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10" fill={ringPaint.line}/></marker><marker id={`ring-gradient-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10" fill={ringPaint.gradient}/></marker></defs>
    {typeof children==='function'?children({arrow:`url(#ring-forward-${id})`,reverse:`url(#ring-gradient-${id})`}):children}
  </svg></figure>;
}
export function RingWire({path,arrow,reverse=false}) {return <path d={path} fill="none" stroke={reverse?ringPaint.gradient:ringPaint.line} strokeWidth="1.6" strokeDasharray={reverse?'5 4':undefined} markerEnd={arrow}/>;}
export function RingCells({values,x=20,y=40,label,paint=ringPaint.computed,cell=48,selected=-1}) {
  return <g><text x={x} y={y-12}>{label}</text>{values.map((v,i)=><g key={i}><rect x={x+i*cell} y={y} width={cell-5} height="29" fill={paint} fillOpacity=".10" stroke={i===selected?'#fff':paint} strokeWidth={i===selected?2:1}/><text x={x+i*cell+(cell-5)/2} y={y+20} textAnchor="middle" fill={paint}>{typeof v==='number'?f(v,3):v}</text></g>)}</g>;
}
export function RingMatrix({values,x=20,y=40,label,paint=ringPaint.parameter,cell=38,rowCell=cell}) {
  return <g><text x={x} y={y-12}>{label}</text>{values.map((row,r)=>row.map((v,c)=><g key={`${r}-${c}`}><rect x={x+c*cell} y={y+r*rowCell} width={cell-4} height={rowCell-4} fill={paint} fillOpacity=".08" stroke={paint}/><text x={x+c*cell+(cell-4)/2} y={y+r*rowCell+22} textAnchor="middle" fill={paint}>{typeof v==='number'?f(v,2):v}</text></g>))}</g>;
}

export function RingProjectionFigure({rows=[[1,0],[0,1]],selected=0}) {
  const maps=[['Q',[[1,0],[0,1]]],['K',[[1,1],[0,1]]],['V',[[2,-1],[0,3]]]];
  return <div className="ring-flow-scenes">{maps.map(([name,map])=>{
    const output=rows.map(row=>map[0].map((_,c)=>row.reduce((s,v,r)=>s+v*map[r][c],0)));
    return <RingFlowFigure key={name} label={`Same source rows multiplied by learned W${name} create ${name} rows`} height={305}>{({arrow})=><>
      <RingMatrix values={rows} x={18} y={35} label="X · source rows" paint={ringPaint.input}/>
      <text x={120} y={78}>×</text><RingMatrix values={map} x={159} y={35} label={`W${name} · learned map`}/>
      <RingWire path="M90 108 V137 H155 V184" arrow={arrow}/><RingWire path="M197 108 V137 H155"/>
      <RingMatrix values={output} x={117} y={188} paint={ringPaint.computed}/>
      <text x={210} y={209}>{name} = X W{name}</text>
      <text x={18} y={291}>Follow row {selected}: [{ringNumbers(output[selected])}]</text>
    </>}</RingFlowFigure>;
  })}</div>;
}

export function RingReadFigure({query=[1,0],keys=[[1,1],[0,1]],values=[[2,-1],[0,3]]}) {
  const scores=keys.map(k=>k.reduce((s,v,c)=>s+v*query[c],0)/Math.sqrt(query.length)),max=Math.max(...scores),mass=scores.map(s=>Math.exp(s-max)),total=mass.reduce((s,x)=>s+x,0),weights=mass.map(x=>x/total),out=values[0].map((_,c)=>weights.reduce((s,w,i)=>s+w*values[i][c],0));
  return <div className="ring-flow-scenes"><RingFlowFigure label="Query meets two keys; scores become positive mass and normalized weights" height={395}>{({arrow})=><>
    <RingCells values={query} x={100} y={35} label="q · current query" paint={ringPaint.computed}/>
    {keys.map((k,i)=><g key={i}><RingCells values={k} x={15+i*175} y={109} label={`k${i} · key row`}/><RingWire path={i===0?'M100 50 H3 V124 H11':'M192 50 H317 V124 H286'} arrow={arrow}/><text x={15+i*175} y={166}>dot / √{query.length} = {f(scores[i],4)}</text><RingWire path={`M${65+i*175} 174 V190`} arrow={arrow}/><text x={15+i*175} y={211}>mass{i} = {f(mass[i],4)}</text><RingWire path={`M${65+i*175} 218 V239 H170 V251`} arrow={arrow}/></g>)}
    <text x={175} y={276} textAnchor="middle">sum mass = {f(total,5)}</text>
    {weights.map((w,i)=><g key={i}><RingWire path={`M170 283 V305 H${65+i*175} V320`} arrow={arrow}/><text x={15+i*175} y={346}>a{i} = mass{i} / sum</text><text x={15+i*175} y={372} fill={ringPaint.computed}>{f(w,6)}</text></g>)}
  </>}</RingFlowFigure><RingFlowFigure label="Each normalized weight multiplies its own value; both channel sums produce the read" height={335}>{({arrow})=><>
    {values.map((v,i)=><g key={i}><RingCells values={v} x={25+i*175} y={35} label={`v${i} · value row`}/><RingWire path={`M${72+i*175} 66 V85`} arrow={arrow}/><text x={25+i*175} y={106}>× a{i}={f(weights[i],5)}</text><RingWire path={`M${72+i*175} 116 V158`} arrow={arrow}/><RingCells values={v.map(x=>x*weights[i])} x={25+i*175} y={163}/><text x={25+i*175} y={219}>weighted channels</text></g>)}
    <RingWire path="M72 195 V236 H172 V261" arrow={arrow}/><RingWire path="M247 195 V236 H172"/>
    <RingCells values={out} x={125} y={266}/><text x={18} y={313}>o · add both weighted rows</text>
  </>}</RingFlowFigure></div>;
}

export function RingOwnedRowsFigure({owners=[[0,1],[2,3],[4,5],[6,7]],round=0,direction=1}) {
  const ranks=owners.length;
  return <div className="ring-flow-scenes">{owners.map((ids,rank)=>{
    const owner=(rank-direction*round+ranks*8)%ranks,visits=Array.from({length:round+1},(_,s)=>(rank-direction*s+ranks*8)%ranks);
    const qEnd=18+ids.length*Math.min(48,300/ids.length)-5,kvEnd=18+owners[owner].length*Math.min(48,300/owners[owner].length)-5;
    return <RingFlowFigure key={rank} label={`Rank${rank} holds query positions${ids.join(',')}; round${round} reads keys and values from owner${owner}`} height={400}>{({arrow})=><>
      <text x={18} y={22}>rank {rank} · Q stays here</text>
      <RingCells values={ids.map(i=>`q${i}`)} x={18} y={52} label="Owned query rows · global IDs" cell={Math.min(48,300/ids.length)}/>
      <RingCells values={owners[owner].map(i=>`k${i}`)} x={18} y={125} label={`Visiting K · original owner${owner}`} cell={Math.min(48,300/owners[owner].length)}/>
      <RingCells values={owners[owner].map(i=>`v${i}`)} x={18} y={184} label={`Visiting V · same global IDs`} cell={Math.min(48,300/owners[owner].length)}/>
      <circle cx="175" cy="275" r="26" fill="none" stroke={ringPaint.line}/><text x="175" y="279" textAnchor="middle">read</text>
      <RingWire path={`M${qEnd} 68 H330 V275 H202`} arrow={arrow}/>
      <RingWire path={`M${kvEnd} 140 H319 V239 H175 V248`} arrow={arrow}/>
      <RingWire path={`M${kvEnd} 199 H307 V315 H175 V302`} arrow={arrow}/>
      <text x="18" y="240">Match Q/K; weight V</text>
      <RingWire path="M175 302 V320 H239 V329" arrow={arrow}/><RingCells values={['summary']} x={216} y={333} cell={110}/><text x="18" y="391">{ranks===1?'One local read; no transport.':`Visited owners: ${visits.join(' → ')}`}</text>
      <text x="18" y="375">Summary combines every visited block.</text>
    </>}</RingFlowFigure>;
  })}</div>;
}

export function RingTransportFigure({owners,round,direction}) {
  const P=owners.length,point=rank=>P===1?[175,180]:[175+115*Math.sin(2*Math.PI*rank/P),185-115*Math.cos(2*Math.PI*rank/P)];
  return <RingFlowFigure label="Actual process ring: queries stay at rank nodes, labelled KV packets advance to the neighbour" height={420}>{({arrow})=><>
    {P>1&&owners.map((_,rank)=>{const next=(rank+direction+P)%P,[x,y]=point(rank),[u,v]=point(next),dx=u-x,dy=v-y,n=Math.hypot(dx,dy),sx=x+30*dx/n,sy=y+30*dy/n,ex=u-30*dx/n,ey=v-30*dy/n;
      return <RingWire key={rank} path={P===2?`M${sx} ${sy} Q${(x+u)/2+25*dy/n} ${(y+v)/2-25*dx/n} ${ex} ${ey}`:`M${sx} ${sy} L${ex} ${ey}`} arrow={round<P-1?arrow:undefined}/>;
    })}
    {owners.map((_,rank)=>{const [x,y]=point(rank),owner=(rank-direction*round+P*8)%P;return <g key={rank}><circle cx={x} cy={y} r="28" fill="none" stroke={ringPaint.line}/><text x={x} y={y+5} textAnchor="middle">rank{rank}</text><text x={x} y={y+46} textAnchor="middle">KV owner{owner}</text></g>;})}
    <text x="18" y="381">Node: process · KV label: current packet owner</text>
    <text x="18" y="409">{P===1?'One local block; no network edge.':round===P-1?'All owners visited; no unused final send.':'Arrows: next transfer, not query movement.'}</text>
  </>}</RingFlowFigure>;
}

export function RingRotaryFlowFigure() {
  const cases=[['Global phase',5,1],['Wrong local reset',0,1]],radius=80;
  return <div className="ring-flow-scenes">{cases.map(([label,q,k])=><RingFlowFigure key={label} label={label} height={340}>{({arrow})=><>
    <line x1="68" x2="282" y1="164" y2="164" stroke={ringPaint.line}/><line x1="175" x2="175" y1="57" y2="271" stroke={ringPaint.line}/>
    <circle cx="175" cy="164" r={radius} fill="none" stroke={ringPaint.line} strokeDasharray="3 3"/>
    <path d={`M175 164 L${175+radius*Math.cos(q)} ${164-radius*Math.sin(q)}`} stroke={ringPaint.computed} markerEnd={arrow}/>
    <path d={`M175 164 L${175+radius*Math.cos(k)} ${164-radius*Math.sin(k)}`} stroke={ringPaint.computed} strokeDasharray="4 4" markerEnd={arrow}/>
    <text x="18" y="24">{label}: frequency1 rad/position</text><text x="18" y="299">Solid query θ={q}; dashed key θ={k}.</text><text x="18" y="330">Dot = cos({q}−{k}) = {f(Math.cos(q-k),6)}</text>
  </>}</RingFlowFigure>)}</div>;
}

export function RingKVHeadConstraintFigure() {
  return <div className="ring-flow-scenes">{[0,1,2,3].map(rank=><RingFlowFigure key={rank} label={`Rank${rank} owns two query heads; four ranks cannot each receive a distinct nonempty part of two KV heads`} height={210}>
    <RingCells values={[`qH${rank*2}`,`qH${rank*2+1}`]} x={18} y={55} label={`rank${rank} · query heads`} cell={100}/>
    {rank<2?<RingCells values={[`KV H${rank}`]} x={18} y={133} label="Distinct KV-head slice" cell={110}/>:<><text x="18" y="124">No distinct unused KV head remains.</text><path d="M18 142 L46 170 M46 142 L18 170" stroke={ringPaint.line}/></>}
    <text x="18" y="205">Hq=8, Hkv=2, P=4 · allocation problem</text>
  </RingFlowFigure>)}</div>;
}

export function RingHierarchyFigure() {
  return <RingFlowFigure label="Two head groups exchange internally by all-to-all, while corresponding groups circulate KV across nodes" width={650} height={310} wide>{({arrow})=><>
    {[0,1].map(node=><g key={node}><text x={22+node*335} y="29">node{node} · fast local links</text>{[0,1].map(local=><g key={local}><circle cx={65+node*335+local*120} cy="94" r="26" fill="none" stroke={ringPaint.line}/><text x={65+node*335+local*120} y="99" textAnchor="middle">r{node*2+local}</text></g>)}<RingWire path={`M${92+node*335} 85 H${157+node*335}`} arrow={arrow}/><RingWire path={`M${158+node*335} 109 H${92+node*335}`} arrow={arrow}/><text x={22+node*335} y="153">Within node: head reshard</text></g>)}
    <RingWire path="M65 121 V220 H400 V123" arrow={arrow}/><RingWire path="M520 121 V257 H185 V123" arrow={arrow}/>
    <text x="212" y="203">Across nodes: KV packets</text><text x="18" y="298">Different mesh axes own the two communication jobs.</text>
  </>}</RingFlowFigure>;
}

export function RingBufferFlowFigure() {
  return <div className="ring-flow-scenes"><RingFlowFigure label="Current and next padded KV buffers have separate transport lifetimes" height={370}>{({arrow})=><>
    <RingMatrix values={[[0,1],[2,'pad']]} x={18} y={57} label="current K/V IDs" paint={ringPaint.computed} cell={65}/>
    <RingMatrix values={[[3,4],[5,'pad']]} x={193} y={57} label="next K/V IDs" paint={ringPaint.input} cell={65}/>
    <RingWire path="M80 184 V227 H139" arrow={arrow}/><text x="155" y="232">compute current</text>
    <RingWire path="M259 184 V271 H139" arrow={arrow}/><text x="155" y="276">wait for incoming</text>
    <text x="18" y="325">Only then swap current/next buffer roles.</text><text x="18" y="354">Valid length masks padding; pad is not a key.</text>
  </>}</RingFlowFigure><RingFlowFigure label="Backward transports K,V,dK,dV together until all derivative contributions return home" height={370}>{({reverse})=><>
    {['K','V','dK','dV'].map((name,i)=><RingCells key={name} values={[`${name}0`,`${name}1`]} x={18} y={45+i*60} label={`Same owner IDs · ${name}`} paint={i<2?ringPaint.computed:ringPaint.gradient} cell={110}/>)}
    <path d="M240 45 H264 V257 H240" stroke={ringPaint.line} fill="none"/><RingWire path="M264 150 H323" arrow={reverse} reverse/>
    <text x="18" y="302">Four packed fields keep the same record IDs.</text><text x="18" y="331">Last backward transfer returns dK/dV home.</text><text x="18" y="359">Never overwrite a buffer still being sent.</text>
  </>}</RingFlowFigure></div>;
}

export function RingSignedBars({values,labels,unit='signed contribution'}) {
  const bound=Math.max(...values.map(Math.abs),1e-12),height=78+values.length*62;
  return <div><RingFlowFigure label={unit} width={350} height={height}>
    <text x="18" y="19">Bar extent: magnitude · line: zero</text><text x="18" y="39">Violet: computed · cyan edge: negative</text><line x1="184" x2="184" y1="70" y2={height-15} stroke={ringPaint.line}/>
    {values.map((value,i)=>{const width=Math.abs(value)/bound*110,y=84+i*62;return <g key={i}><text x="18" y={y-10}>{labels?.[i]??i}</text><rect x={value<0?184-width:184} y={y} width={width} height="18" fill={ringPaint.computed} stroke={value<0?ringPaint.input:'none'}/><text x="18" y={y+34} fill={ringPaint.computed}>{f(value,7)}</text></g>;})}
  </RingFlowFigure><p className="flow-note">{unit}</p></div>;
}

export function RingRecordFigure({records,query,keyId,allowed,order=records.map((_,i)=>i)}) {
  const cell=33,left=42,top=85;
  return <RingFlowFigure label="Logical record IDs keep their document, position and validity when storage moves" height={390}>
    <text x="18" y="22">qID{query} reads kID{keyId} · selected white cell</text>
    <text x="18" y="47">Filled: allowed · ×: future / other doc / pad</text>
    <text x="115" y="70">key global record ID →</text>
    {order.map((id,c)=><text key={id} x={left+c*cell+14} y={top-4} textAnchor="middle">{id}</text>)}
    {order.map((q,r)=><g key={q}><text x={left-13} y={top+r*cell+21} textAnchor="end">{q}</text>{order.map((k,c)=><g key={k}><rect x={left+c*cell} y={top+r*cell} width={cell-3} height={cell-3} fill={allowed[q][k]?ringPaint.computed:'transparent'} fillOpacity={allowed[q][k]?.2:1} stroke={q===query&&k===keyId?'#fff':ringPaint.line} strokeWidth={q===query&&k===keyId?2:1}/>{!allowed[q][k]&&<text x={left+c*cell+14} y={top+r*cell+21} textAnchor="middle">×</text>}</g>)}</g>)}
    <text x="18" y="337">q: doc{records[query].document}, pos{records[query].position}, valid{String(records[query].valid)}</text>
    <text x="18" y="366">k: doc{records[keyId].document}, pos{records[keyId].position}, valid{String(records[keyId].valid)}</text>
  </RingFlowFigure>;
}

export function RingRecordPayloadFigure({id,record,query,keyVector,value}) {
  return <RingFlowFigure label={`Record${id} carries actual vectors and attached global metadata`} height={350}>{({arrow})=><>
    <text x="18" y="22">record ID{id} · stays the same after transport</text>
    <text x="18" y="53">document{record.document} · position{record.position}</text>
    <text x="18" y="81">valid{String(record.valid)} · false means padding</text>
    <RingCells values={query} x={18} y={122} label="Q · permanent query row" cell={80}/>
    <RingCells values={keyVector} x={18} y={184} label="K · comparison row" cell={80}/>
    <RingCells values={value} x={18} y={246} label="V · matching information row" cell={80}/>
    <path d="M258 184 H273 V275 H258" fill="none" stroke={ringPaint.line}/>
    <RingWire path="M273 230 H318" arrow={arrow}/>
    <text x="18" y="311">Bracket: one K/V packet, not K producing V.</text>
    <text x="18" y="338">Transport keeps both vectors and their IDs.</text>
  </>}</RingFlowFigure>;
}

export function RingGradientReturnFigure({partials,owner,channel=0,target='dK'}) {
  const values=partials.map(p=>p[target][channel]),total=values.reduce((s,v)=>s+v,0);
  const n=partials.length,packetY=75+(n-1)*91,homeY=packetY+105,height=homeY+91;
  return <div className="ring-flow-scenes"><RingSignedBars values={values} labels={partials.map(p=>`query owner${p.owner}`)} unit={`${target}[${channel}] · signed partials`}/><RingFlowFigure label="Each query owner adds its own derivative into a travelling sum, then the complete packet returns home" height={height}>{({reverse})=><>
    <text x="18" y="23">Gradient packet starts at zero.</text>
    {partials.map((p,i)=>{const y=75+i*91,accumulated=values.slice(0,i+1).reduce((s,v)=>s+v,0);return <g key={i}>
      <text x="18" y={y-32}>query owner{p.owner} · IDs[{p.ids.join(',')}]</text>
      <RingCells values={[values[i]]} x={18} y={y} cell={100} paint={ringPaint.gradient}/>
      <text x="18" y={y-10}>partial</text><RingCells values={[accumulated]} x={193} y={y} cell={100} paint={ringPaint.gradient}/><text x="193" y={y-10}>packet sum</text>
      <circle cx="151" cy={y+15} r="12" fill="none" stroke={ringPaint.gradient}/><text x="151" y={y+20} textAnchor="middle">+</text>
      <RingWire path={`M113 ${y+15} H138`} arrow={reverse} reverse/><RingWire path={`M164 ${y+15} H189`} arrow={reverse} reverse/>
      {i>0?<RingWire path={`M241 ${y-62} H323 V${y+49} H151 V${y+29}`} arrow={reverse} reverse/>:<><RingCells values={[0]} x={231} y={y+41} cell={65} paint={ringPaint.gradient}/><RingWire path={`M230 ${y+56} H151 V${y+29}`} arrow={reverse} reverse/></>}
    </g>;})}
    <RingWire path={`M241 ${packetY+29} V${packetY+52} H323 V${homeY+15} H213`} arrow={reverse} reverse/>
    <RingCells values={[total]} x={100} y={homeY} cell={115} label={`Original K/V owner${owner}`} paint={ringPaint.gradient}/>
    <text x="18" y={homeY+61}>Final transfer returns the complete sum.</text>
    <text x="18" y={homeY+85}>dQ stays on its query owner.</text>
  </>}</RingFlowFigure></div>;
}

export function RingStableMergeFigure({first={maximum:Math.log(2),total:1.5,numerator:9},second={maximum:Math.log(4),total:1.25,numerator:.5}}) {
  const max=Math.max(first.maximum,second.maximum),scale=[first,second].map(s=>Math.exp(s.maximum-max)),total=scale[0]*first.total+scale[1]*second.total,numerator=scale[0]*first.numerator+scale[1]*second.numerator;
  return <div className="ring-flow-scenes">{[first,second].map((state,i)=><RingFlowFigure key={i} label={`Summary${i} rescales both mass and numerator to common reference`} height={320}>{({arrow})=><>
    <text x={18} y={20}>block {i} · reference m={f(state.maximum,5)}</text>
    <RingCells values={[state.total,state.numerator]} x={55} y={60} label="ℓ · mass       u · numerator" cell={110}/>
    <RingWire path="M107 91 V144" arrow={arrow}/><RingWire path="M215 91 V144" arrow={arrow}/>
    <text x={18} y={121}>Both × exp(m−m*)={f(scale[i],5)}</text>
    <RingCells values={[state.total*scale[i],state.numerator*scale[i]]} x={55} y={166} label={`At common m*=${f(max,5)}`} cell={110}/>
    <RingWire path="M107 200 V234 H215 V200"/>
    <text x={18} y={260}>Add rescaled blocks: ℓ={f(total,6)}, u={f(numerator,6)}</text>
    <text x={18} y={293}>Read u / ℓ = {f(numerator/total,6)}</text>
  </>}</RingFlowFigure>)}</div>;
}

export function RingScalarGradientFigure({probabilities,values,output}) {
  const dp=values,ds=probabilities?.map((p,i)=>p*(values[i]-output))??values.map(()=>0);
  return <div className="ring-flow-scenes"><RingSignedBars values={probabilities??values.map(()=>0)} labels={values.map((_,i)=>`record${i}`)} unit="dV = probability × upstream1"/><RingSignedBars values={ds} labels={values.map((_,i)=>`score${i}`)} unit="dS = probability × (value − complete read)"/>{values.map((v,i)=><RingFlowFigure key={i} label={`Record${i}'s value competes against the same full weighted mean, then its probability weights the derivative`} height={310}>{({reverse})=><>
    <RingCells values={[v,output]} x={18} y={50} label="Value · complete read" cell={145}/>
    <text x="18" y="112">Subtract: value − read = {f(v-output,6)}</text>
    <circle cx="175" cy="174" r="18" fill="none" stroke={ringPaint.gradient}/><text x="175" y="179" textAnchor="middle">×</text>
    <RingWire path="M155 120 H175 V153" arrow={reverse} reverse/>
    <RingCells values={[probabilities?.[i]??0]} x={18} y={161} cell={100}/><RingWire path="M113 176 H154" arrow={reverse} reverse/>
    <text x="18" y="150">probability</text><RingWire path="M175 194 V243" arrow={reverse} reverse/>
    <RingCells values={[ds[i]]} x={125} y={247} cell={110} paint={ringPaint.gradient}/><text x="18" y="305">Signed score credit; not a probability.</text>
  </>}</RingFlowFigure>)}</div>;
}

export function RingMapGradientFigure({source,projectedGradient,mapGradient,name}) {
  const transpose=source[0].map((_,c)=>source.map(row=>row[c]));
  return <RingFlowFigure label={`Actual current source transpose multiplies actual d${name} into shared-map gradient dW${name}`} height={355}>{({reverse})=><>
    <RingMatrix values={transpose} x={18} y={52} label="Xᵀ · source" paint={ringPaint.input}/>
    <RingMatrix values={projectedGradient} x={193} y={52} label={`d${name} · all rows`} paint={ringPaint.gradient}/>
    <circle cx="175" cy="183" r="18" fill="none" stroke={ringPaint.gradient}/><text x="175" y="188" textAnchor="middle">×</text>
    <RingWire path="M54 126 V183 H154" arrow={reverse} reverse/><RingWire path="M230 126 V183 H195" arrow={reverse} reverse/>
    <RingWire path="M175 203 V249" arrow={reverse} reverse/><RingMatrix values={mapGradient} x={138} y={255} paint={ringPaint.gradient}/>
    <text x="18" y="282">dW{name}</text><text x="18" y="349">Sum positions; then SUM owner contributions.</text>
  </>}</RingFlowFigure>;
}

export function RingTargetFigure() {
  return <RingFlowFigure label="Shift next-token targets in logical order before splitting owners" height={240}>{({arrow})=><>
    <RingCells values={[10,11,12,13,14,15]} y={43} label="Logical input · before sharding" cell={50}/>
    <RingCells values={[11,12,13,14,15,'—']} y={149} label="Logical target · final token ignored" cell={50}/>
    {[0,1,2,3,4].map(i=><RingWire key={i} path={`M${20+(i+1)*50+22} 75 V101 H${20+i*50+22} V133`} arrow={arrow}/>)}
    <line x1="167" x2="167" y1="20" y2="191" stroke={ringPaint.input} strokeDasharray="4 4"/>
    <text x="18" y="215">Owner boundary does not remove target13.</text>
  </>}</RingFlowFigure>;
}

export function RingLossMassFigure({counts=[3,1],means=[2,6]}) {
  const total=counts.reduce((s,v)=>s+v,0),sum=counts.reduce((s,v,i)=>s+v*means[i],0);
  return <RingFlowFigure label="Global loss is sum of all valid losses divided by their total count" height={250}>{({arrow})=><>
    {counts.map((count,r)=><g key={r}><text x="18" y={23+r*72}>rank{r}: {count} valid targets, local mean{means[r]}</text>{Array.from({length:count},(_,i)=><rect key={i} x={18+i*45} y={35+r*72} width="35" height={means[r]*5} fill={ringPaint.computed}/>)}<text x="238" y={54+r*72}>sum{count*means[r]}</text></g>)}
    <RingWire path="M279 60 V163 H173 V184" arrow={arrow}/><RingWire path="M279 133 V163"/>
    <text x="18" y="208">All losses {sum} / all valid targets {total} = {f(sum/total)}</text>
    <text x="18" y="237">A mean of local means gives {(means[0]+means[1])/2}.</text>
  </>}</RingFlowFigure>;
}

export function RingSharedGradientFigure() {
  return <div className="ring-flow-scenes">{['Q','K','V'].map(name=><RingFlowFigure key={name} label={`Every position owner contributes X transpose times d${name} to shared parameter gradient`} height={335}>{({arrow,reverse})=><>
    <RingMatrix values={[[1,0],[0,1]]} x={18} y={40} label="X · two source rows" paint={ringPaint.input}/>
    <RingMatrix values={[[`${name}0,0`,`${name}0,1`],[`${name}1,0`,`${name}1,1`]]} x={176} y={40} label={`d${name} · all owners`} paint={ringPaint.gradient} cell={65}/>
    <text x={18} y={156}>dW{name} = Xᵀ d{name} · sum positions</text>
    <RingWire path="M60 111 V192 H173 V216" arrow={reverse} reverse/>
    <RingWire path="M238 172 V192 H173" reverse/>
    <text x={18} y={246}>owner0 partial + owner1 partial</text>
    <text x={18} y={280}>Every replica needs this same global sum.</text>
    <text x={18} y={314}>dX branch = d{name} W{name}ᵀ</text>
  </>}</RingFlowFigure>)}</div>;
}

export function RingDecodeCollectivesFigure({states=[{maximum:Math.log(2),total:1.5,numerator:9},{maximum:Math.log(4),total:1.25,numerator:.5}]}) {
  const max=Math.max(...states.map(s=>s.maximum)),empty=!Number.isFinite(max),scaled=states.map(s=>({total:empty?0:s.total*Math.exp(s.maximum-max),numerator:empty?0:s.numerator*Math.exp(s.maximum-max)})),total=scaled.reduce((a,s)=>a+s.total,0),numerator=scaled.reduce((a,s)=>a+s.numerator,0);
  return <div className="ring-flow-scenes"><RingFlowFigure label="First MAX collective agrees on reference; stationary cache summaries are rescaled" height={330}>{({arrow})=><>
    <RingCells values={['q']} x={150} y={34} label="New query · broadcast" paint={ringPaint.input}/>
    {states.map((s,i)=><g key={i}><RingWire path={`M171 63 V85 H${57+i*175} V104`} arrow={arrow}/><RingCells values={[`K${i}`,`V${i}`]} x={15+i*175} y={123} label={`Stationary shard${i}`} cell={60}/><text x={15+i*175} y={177}>m{i}={Number.isFinite(s.maximum)?f(s.maximum,5):'−∞'}</text><RingWire path={`M${65+i*175} 185 V204 H174 V228`} arrow={arrow}/></g>)}
    <text x={18} y={252}>1 · MAX reduction → m*={empty?'−∞':f(max,5)}</text>
    <text x={18} y={283}>Return m* to every shard; keep K/V here.</text>
    <text x={18} y={314}>Local-empty shard contributes zero.</text>
  </>}</RingFlowFigure><RingFlowFigure label="Second SUM collective adds rescaled mass and signed numerators before division" height={330}>{({arrow})=><>
    {scaled.map((s,i)=><g key={i}><RingCells values={[s.total,s.numerator]} x={15+i*175} y={43} label={`shard${i}: scaled ℓ, u`} cell={70}/><RingWire path={`M${82+i*175} 77 V126 H174 V148`} arrow={arrow}/></g>)}
    <text x={18} y={180}>2 · SUM reduction → ℓ={f(total)}, u={f(numerator)}</text>
    <RingWire path="M174 198 V226" arrow={arrow}/>
    <text x={18} y={255}>{empty?'No valid key · distribution undefined':`Read output u / ℓ = ${f(numerator/total)}`}</text>
    <text x={18} y={290}>{empty?'Zero output is our explicit convention.':'The two collectives do different jobs.'}</text>
  </>}</RingFlowFigure></div>;
}

export function RingTokenBudgetFigure() {
  return <div className="ring-flow-scenes">{[4,8].map(length=><RingFlowFigure key={length} label={`The same sixteen dataset tokens form${16/length} sequences of${length}; each sequence has${length*length} attention pairs`} height={145+16/length*38}>
    <text x="18" y="22">Fixed dataset budget:16 tokens</text>
    {Array.from({length:16/length},(_,r)=><RingCells key={r} values={Array.from({length},(_,i)=>r*length+i)} x={18} y={42+r*38} cell={length===8?38:60}/>)}
    <text x="18" y={79+16/length*38}>{16/length} sequences × {length*length} pairs = {16*length}</text>
    <text x="18" y={110+16/length*38}>Same token count; dense pair work changes.</text>
  </RingFlowFigure>)}</div>;
}

export function RingContextAPIFlowFigure() {
  return <RingFlowFigure label="An ordinary context-parallel API shards the sequence axis of attention and position buffers consistently, then restores logical output rows" height={475}>{({arrow})=><>
    <RingCells values={['0','1','2','3','4','5','6','7']} x={18} y={47} label="Q,K,V: (N,H,L,d) · global positions" cell={38}/>
    <RingCells values={[0,1,2,3,4,5,6,7]} x={18} y={116} label="Position buffer: same sequence-axis split" cell={38}/>
    <RingWire path="M169 146 V179" arrow={arrow}/><text x="18" y="205">CP context: shard buffers along L</text>
    <RingCells values={[0,1,2,3]} x={18} y={252} label="rank0 · Q IDs" cell={38}/><RingCells values={[4,5,6,7]} x={184} y={252} label="rank1 · Q IDs" cell={38}/>
    <RingWire path="M90 282 V314 H171 V338" arrow={arrow}/><RingWire path="M258 282 V314 H171"/>
    <text x="18" y="361">Supported SDPA uses CP communication</text><RingWire path="M171 376 V405" arrow={arrow}/>
    <RingCells values={[0,1,2,3,4,5,6,7]} x={18} y={420} label="Unshard O · original logical rows" cell={38}/>
  </>}</RingFlowFigure>;
}

import {createContext,useContext,useMemo,useState} from 'react';
import {FlowControls,FlowLab,FlowReadout,FlowSlider,flowNumber as f} from './LessonFlow.jsx';
import {NeuralTable} from './NeuralLessonElements.jsx';
import {RingCells,RingFlowFigure,RingMatrix,RingSignedBars,RingWire,ringPaint} from './RingAttentionFlowFigures.jsx';
import {RingFlowNumber,RingFlowSelect} from './RingAttentionFlowLabs.jsx';
import * as m from '../../data/ring-attention-models.js';

const Context=createContext(null);
const freshWork=()=>({length:16,ranks:4,kind:'contiguous',owners:null,tile:1,round:0,first:0,second:15});
const freshCost=()=>({local:1024,ranks:4,B:1,Hq:8,Hkv:2,d:64,bytes:2,flops:100,bandwidth:50,latency:2,alias:false,global:4096,C:4,D:7});
const freshReshard=()=>({length:8,heads:4,ranks:2,token:0,head:0,swapFirst:0,swapSecond:4,swapped:null,rank:0,axis:3});
export function RingSystemsProvider({children}) {
  const [work,setWork]=useState(freshWork),[cost,setCost]=useState(freshCost),[reshard,setReshard]=useState(freshReshard);
  const [resetKey,setResetKey]=useState(0);
  const resetSystems=()=>{setWork(freshWork());setCost(freshCost());setReshard(freshReshard());setResetKey(x=>x+1);};
  const value=useMemo(()=>({work,setWork,cost,setCost,reshard,setReshard,resetSystems,resetKey}),[work,cost,reshard,resetKey]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
function useSystems(){const state=useContext(Context);if(!state)throw Error('Ring systems view requires its topic provider');return state;}

function RingSystemNumber(props) { const {resetKey}=useSystems(); return <RingFlowNumber {...props} resetToken={resetKey}/>; }

export function RingMemoryFlowFigure() {
  return <div className="ring-flow-scenes"><RingFlowFigure label="Eight query rows meet eight key rows, but only a two-by-two score tile is stored" height={340}>
    <text x="18" y="22">Rows: query ID · columns: key ID</text>
    {Array.from({length:8},(_,r)=><g key={r}><text x="21" y={63+r*25}>{r}</text>{Array.from({length:8},(_,c)=><rect key={c} x={50+c*25} y={45+r*25} width="22" height="22" fill={r<2&&c<2?ringPaint.computed:'transparent'} fillOpacity=".3" stroke={ringPaint.line}/>)}</g>)}
    {Array.from({length:8},(_,c)=><text key={c} x={56+c*25} y="37">{c}</text>)}
    <rect x="48" y="43" width="51" height="51" fill="none" stroke={ringPaint.computed} strokeWidth="3"/>
    <text x="18" y="282">Violet outline: the current 2×2 score tile.</text><text x="18" y="311">64 pairs still exist; only 4 scores live here.</text>
  </RingFlowFigure><RingFlowFigure label="Actual projected rows, output rows and two scalar row statistics remain stored" height={340}>
    {['Q','K','V','O'].map((name,i)=><g key={name}><text x={18+i*80} y="22">{name}: 8×2</text>{Array.from({length:8},(_,r)=>[0,1].map(c=><rect key={`${r}-${c}`} x={18+i*80+c*22} y={39+r*24} width="19" height="20" fill={ringPaint.computed} fillOpacity=".15" stroke={ringPaint.computed}/>))}</g>)}
    <RingCells values={['maximum','mass']} x={18} y={280} label="Two small row summaries · derived in §3" cell={145}/>
    <text x="18" y="335">The numerator has the value-row width.</text>
  </RingFlowFigure></div>;
}

function WorkGrid({owners,tile=1,round=null}) {
  const length=owners.flat().length,cell=22,left=48,top=51,width=Math.max(350,left+length*cell+24),height=top+length*cell+64;
  const order=owners.flat(),P=owners.length;
  return <RingFlowFigure wide label="Actual causal cells in owner storage order; outlined executed tiles retain global identities" width={width} height={height}>
    <text x="18" y="20">qID↓ · kID→; violet legal, × future</text>
    {order.map((id,c)=><text key={id} x={left+c*cell+7} y={top-7}>{id}</text>)}
    {order.map((q,r)=><g key={q}><text x={left-7} y={top+r*cell+16} textAnchor="end">{q}</text>{order.map((k,c)=><g key={k}><rect x={left+c*cell} y={top+r*cell} width={cell-2} height={cell-2} fill={k<=q?ringPaint.computed:'transparent'} fillOpacity=".25" stroke={ringPaint.line}/>{k>q&&<text x={left+c*cell+5} y={top+r*cell+15}>×</text>}</g>)}</g>)}
    {round!==null&&owners.flatMap((qs,rank)=>{
      const owner=(rank-round+P)%P,ks=owners[owner],rowOffset=owners.slice(0,rank).flat().length,colOffset=owners.slice(0,owner).flat().length;
      return Array.from({length:Math.ceil(qs.length/tile)},(_,r)=>Array.from({length:Math.ceil(ks.length/tile)},(_,c)=>{
        const q=qs.slice(r*tile,(r+1)*tile),k=ks.slice(c*tile,(c+1)*tile),runs=q.some(i=>k.some(j=>j<=i));
        return runs?<rect key={`${rank}-${r}-${c}`} x={left+(colOffset+c*tile)*cell-1} y={top+(rowOffset+r*tile)*cell-1} width={k.length*cell} height={q.length*cell} fill="none" stroke={ringPaint.parameter} strokeWidth="2"/>:null;
      }));
    })}
    <text x="18" y={height-31}>Same global IDs in current owner order.</text>
    <text x="18" y={height-7}>{round===null?'Same global causal pairs, different storage.':`Amber outline: entire executed tile, round${round}.`}</text>
  </RingFlowFigure>;
}
export function RingWorkFlowLab({view='pairs'}) {
  const {work:s,setWork}=useSystems(),valid=s.ranks<=s.length&&(s.kind!=='zigzag'||s.length%(2*s.ranks)===0),owners=valid?(s.owners??m.ownership(s.length,s.ranks,s.kind)):null,result=owners?m.workCounts(owners,s.tile):null;
  const up=(name,value)=>setWork(x=>({...x,[name]:value}));
  const dimension=(name,value)=>setWork(x=>({...x,[name]:value,owners:null,round:0,first:0,second:(name==='length'?value:x.length)-1}));
  let controls;
  if(view==='pairs')controls=<><RingSystemNumber label="Global positions L" min={4} max={32} integer value={s.length} onChange={value=>dimension('length',value)}/><RingSystemNumber label="Query/KV owners P" min={1} max={8} integer value={s.ranks} onChange={value=>dimension('ranks',value)}/></>;
  else if(view==='tiles')controls=<><RingSystemNumber label="Cells per tile side" min={1} max={8} integer value={s.tile} onChange={value=>up('tile',value)}/><FlowSlider name="Synchronized round" value={Math.min(s.round,s.ranks-1)} min={0} max={s.ranks-1} step={1} onChange={value=>up('round',value)}/></>;
  else if(view==='ownership')controls=<RingFlowSelect label="Logical position assignment" value={s.kind} onChange={value=>setWork(x=>({...x,kind:value,owners:null}))} options={['contiguous','striped','zigzag'].map(name=>[name,name])}/>;
  else if(view==='swap')controls=<><FlowSlider name="First record ID to swap" value={s.first} min={0} max={s.length-1} step={1} onChange={value=>up('first',value)}/><FlowSlider name="Second record ID to swap" value={s.second} min={0} max={s.length-1} step={1} onChange={value=>up('second',value)}/><button type="button" disabled={!owners||s.first===s.second} onClick={()=>up('owners',owners.map(ids=>ids.map(id=>id===s.first?s.second:id===s.second?s.first:id)))}>Swap selected records</button></>;
  else if(view==='rename')controls=<button type="button" disabled={!owners} onClick={()=>up('owners',[owners.at(-1),...owners.slice(0,-1)])}>Rotate rank names without changing records</button>;
  return <FlowLab label={`Causal work: ${view}`}>
    {owners?<WorkGrid owners={owners} tile={s.tile} round={view==='tiles'?Math.min(s.round,s.ranks-1):null}/>:<p role="alert">Every owner needs a position; equal zigzag pieces additionally need L divisible by2P. No stale result is shown.</p>}
    <FlowControls>{controls}</FlowControls>
    {result&&<><FlowReadout>Same {result.usefulTotal} legal pairs; owner useful totals[{result.totals.join(',')}]. Adding each round’s largest whole-tile work gives <strong>{result.critical}</strong> executed cells. This is the defined scheduler, not GPU time.</FlowReadout>{view==='tiles'&&<NeuralTable caption="Every synchronized round uses its busiest rank" headers={['Round',...owners.map((_,i)=>`r${i}: owner/useful/executed`),'Maximum']} rows={result.rounds.map((row,r)=>[r,...row.map(x=>`${x.owner}/${x.useful}/${x.executed}`),Math.max(...row.map(x=>x.executed))])}/>}</>}
  </FlowLab>;
}

function TimelineFigure({P,C,D}) {
  const r=m.timeline(P,C,D),end=Math.max(r.overlap,r.serial,1e-9),scale=280/end;
  return <RingFlowFigure label="Compute and transfer lanes share time; next compute waits for both dependencies" height={180+P*58}>
    <text x="18" y="22">Hypothetical time, µs · same scale</text>
    {r.compute.map((c,i)=><g key={i}><text x="18" y={51+i*58}>round{i}: compute {f(c.start)}→{f(c.end)}</text><rect x={58+c.start*scale} y={58+i*58} width={C*scale} height="13" fill={ringPaint.computed}/>{r.transfer[i]&&<><rect x={58+r.transfer[i].start*scale} y={80+i*58} width={D*scale} height="7" fill={ringPaint.input}/><line x1={58+r.transfer[i].end*scale} x2={58+r.compute[i+1].start*scale} y1={87+i*58} y2={116+i*58} stroke={ringPaint.line} strokeDasharray="3 3"/><line x1={58+c.end*scale} x2={58+r.compute[i+1].start*scale} y1={71+i*58} y2={116+i*58} stroke={ringPaint.line}/></>}</g>)}
    <text x="18" y={84+P*58}>Violet compute · cyan KV send/receive</text>
    <text x="18" y={112+P*58}>Dashed dependency: incoming data ready.</text>
    <text x="18" y={140+P*58}>Last round has no next-block transfer.</text>
  </RingFlowFigure>;
}
export function RingTimelineFlowLab() {
  const {cost:s,setCost}=useSystems(),r=m.timeline(s.ranks,s.C,s.D),up=(name,value)=>setCost(x=>({...x,[name]:value}));
  return <FlowLab label="Change compute/transfer durations and see their dependencies"><TimelineFigure P={s.ranks} C={s.C} D={s.D}/><FlowControls><FlowSlider name="Compute C, µs" value={s.C} min={0} max={20} step={.25} onChange={value=>up('C',value)}/><FlowSlider name="Transfer D, µs" value={s.D} min={0} max={20} step={.25} onChange={value=>up('D',value)}/><FlowSlider name="Owners P" value={s.ranks} min={1} max={8} step={1} onChange={value=>up('ranks',value)}/></FlowControls><FlowReadout>Serial {f(r.serial)}µs; ideal overlap <strong>{f(r.overlap)}µs</strong>; compute-only {f(r.computeOnly)}µs. {s.ranks===1?'One owner needs no transfer.':s.C>=s.D?'Under this ideal premise compute covers transfer.':'The next block waits for the slower transfer.'}</FlowReadout></FlowLab>;
}

function InventoryFigure({cost}) {
  const rows=Object.entries(cost.inventory),bound=Number(cost.totalBytes)||1;
  return <RingFlowFigure label="Each named allocation occupies its exact fraction of the listed byte total" height={65+rows.length*62}>
    {rows.map(([name,bytes],i)=><g key={name}><text x="18" y={23+i*62}>{name}</text><rect x="18" y={32+i*62} width={300*Number(bytes)/bound} height="14" fill={name==='Q'?ringPaint.computed:ringPaint.input}/><text x="18" y={63+i*62}>{bytes.toLocaleString()} bytes</text></g>)}
    <text x="18" y={57+rows.length*62}>Zero bytes draws zero width, not a base bar.</text>
  </RingFlowFigure>;
}
export function RingCostFlowLab({view='dimensions'}) {
  const {cost:s,setCost}=useSystems(),valid=s.Hq%s.Hkv===0,cost=valid?m.resourceCost(s):null,up=(name,value)=>setCost(x=>({...x,[name]:value}));
  const number=(name,label,min,max)=> <RingSystemNumber key={name} label={label} value={s[name]} integer min={min} max={max} onChange={value=>up(name,value)}/>;
  const controls=view==='dimensions'?<>{number('local','Positions per owner c',1,16777216)}{number('ranks','Owners P',1,16)}</>:view==='heads'?<>{number('Hq','Query heads Hq',1,256)}{number('Hkv','Stored KV heads Hkv',1,256)}{number('d','Channels per head d',1,1024)}</>:view==='batch'?<>{number('B','Batch N = B in the program',1,64)}<RingFlowSelect label="Stored bytes per element" value={s.bytes} onChange={value=>up('bytes',Number(value))} options={[[2,'2 bytes'],[4,'4 bytes']]}/><RingFlowSelect label="Separate output allocation" value={String(s.alias)} onChange={value=>up('alias',value==='true')} options={[[false,'Include distinct output'],[true,'Assume valid output storage reuse']]}/></>:<><RingSystemNumber label="Hypothetical effective TFLOP/s" min={.1} max={10000} value={s.flops} onChange={value=>up('flops',value)}/><RingSystemNumber label="Hypothetical one-direction GB/s" min={.1} max={10000} value={s.bandwidth} onChange={value=>up('bandwidth',value)}/><RingSystemNumber label="Hypothetical message latency µs" min={0} max={1000} value={s.latency} onChange={value=>up('latency',value)}/></>;
  return <FlowLab label={`Shared exact resource inventory: ${view}`}>
    {cost?view==='network'?<TimelineFigure P={s.ranks} C={cost.C} D={cost.D}/>:<InventoryFigure cost={cost}/>:<p role="alert">Hq must be divisible by Hkv for this declared grouping. Repair the current dimensions; an earlier inventory is not shown.</p>}
    <FlowControls>{controls}</FlowControls>
    {cost&&<FlowReadout>Global L={cost.global.toLocaleString()}; current listed total <strong>{cost.totalBytes.toLocaleString()} bytes</strong>. Each KV message {cost.payload.toLocaleString()} bytes; all forward sends {cost.forwardBytes.toLocaleString()} bytes. Matrix products {cost.flops.toLocaleString()} FLOPs/block; C={f(cost.C,6)}, D={f(cost.D,6)}, ideal total {f(cost.overlap,6)}µs. Counts are exact integers; times are hypothetical.</FlowReadout>}
  </FlowLab>;
}
export function RingScalingFlowLab({view='global'}) {
  const {cost:s,setCost}=useSystems(),fixed=view==='global'?s.global:s.local,owners=[1,2,4,8,16].filter(p=>view!=='global'||fixed%p===0),rows=owners.map(P=>m.resourceCost({...s,ranks:P,local:view==='global'?fixed/P:fixed})),max=Math.max(...rows.map(r=>r.overlap),1e-9);
  if(s.Hq%s.Hkv!==0)return <p role="alert">Scaling uses the same head dimensions: Hq must be divisible by Hkv. Repair the current shared head counts above; no curve is shown for an invalid grouping.</p>;
  return <FlowLab label={view==='global'?'Hold global length fixed while adding devices':'Hold each owner’s local rows fixed while adding devices'}><RingFlowFigure label="Directly labelled calculated overlap time versus owner count on log2-spaced horizontal positions" height={300}>
    <text x="18" y="22">Hypothetical ideal overlap time, µs</text>
    <line x1="40" x2="319" y1="242" y2="242" stroke={ringPaint.line}/><line x1="40" x2="40" y1="55" y2="242" stroke={ringPaint.line}/>
    <polyline points={rows.map((r,i)=>`${45+i*66},${242-r.overlap/max*165}`).join(' ')} fill="none" stroke={ringPaint.computed}/>
    {rows.map((r,i)=><g key={i}><circle cx={45+i*66} cy={242-r.overlap/max*165} r="3" fill={ringPaint.computed}/><text x={45+i*66} y={226-r.overlap/max*165} textAnchor="middle">{f(r.overlap,2)}</text><text x={45+i*66} y="266" textAnchor="middle">{owners[i]}</text></g>)}
    <text x="18" y="295">Owner count P · log₂ spacing, values labelled</text>
  </RingFlowFigure><FlowControls><RingSystemNumber label={view==='global'?'Fixed global length L':'Fixed local length c'} value={fixed} min={16} max={16777216} integer onChange={value=>setCost(x=>({...x,[view==='global'?'global':'local']:value}))}/></FlowControls><FlowReadout>{view==='global'?'Same total sequence, smaller local shards.':'Same local shards, a longer total sequence.'} These calculated points use the current heads, batch and network assumptions above; no device benchmark is implied.</FlowReadout><NeuralTable caption={`Calculated ${view==='global'?'strong':'weak'} scaling`} headers={['P','L','c','C µs','D µs','ideal µs']} rows={rows.map((r,i)=>[owners[i],r.global,r.global/owners[i],f(r.C,6),f(r.D,6),f(r.overlap,6)])}/></FlowLab>;
}

function CellBoard({rows,label,selected,heads}) {
  return <RingFlowFigure wide label={label} width={Math.max(350,rows[0].length*61+36)} height={75+rows.length*38}>
    <text x="18" y="22">{label}</text>{rows.map((row,r)=>row.map((id,c)=><g key={`${r}-${c}`}><rect x={18+c*61} y={38+r*38} width="56" height="32" fill={ringPaint.computed} fillOpacity=".12" stroke={id===selected?'#fff':ringPaint.computed} strokeWidth={id===selected?2:1}/><text x={46+c*61} y={59+r*38} textAnchor="middle">t{Math.floor(id/heads)}h{id%heads}</text></g>))}
    <text x="18" y={68+rows.length*38}>{rows.length} rows × {rows[0].length} heads</text>
  </RingFlowFigure>;
}
export function RingReshardFlowLab({view='route'}) {
  const {reshard:s,setReshard}=useSystems(),up=(name,value)=>setReshard(x=>({...x,[name]:value})),valid=s.length%s.ranks===0&&s.heads%s.ranks===0;
  const dimensions=<FlowControls>{[['length','Global token rows L',1,16],['heads','Head columns H',1,8],['ranks','Owners P',1,4]].map(([name,label,min,max])=><RingSystemNumber key={name} label={label} value={s[name]} min={min} max={max} integer onChange={value=>setReshard(x=>({...x,[name]:value,token:0,head:0,swapped:null,swapFirst:0,swapSecond:0}))}/>)}</FlowControls>;
  if(!valid)return <FlowLab label="Reshard dimensions need exact nonempty even groups"><p role="alert">For this equal-board transformation, both L and H must be divisible by P. No previous board is shown as current.</p>{dimensions}</FlowLab>;
  const r=m.reshard(s.length,s.heads,s.ranks),selected=s.token*s.heads+s.head;
  const boards=structuredClone(r.boards);
  if(s.swapped){const [a,b]=s.swapped;const locate=id=>[Math.floor((id%s.heads)/(s.heads/s.ranks)),Math.floor(id/s.heads),(id%s.heads)%(s.heads/s.ranks)];const [ar,at,ah]=locate(a),[br,bt,bh]=locate(b);[boards[ar][at][ah],boards[br][bt][bh]]=[boards[br][bt][bh],boards[ar][at][ah]];}
  const restored=r.tensor.map((_,i)=>boards.flatMap(b=>b[i])),mismatch=restored.flatMap((row,i)=>row.filter((id,h)=>id!==i*s.heads+h)).length,seqOwner=Math.floor(s.token/(s.length/s.ranks)),headOwner=Math.floor(s.head/(s.heads/s.ranks));
  return <FlowLab label="Track the same token/head cell through both exact reshard stages"><div className="ring-flow-scenes"><CellBoard rows={r.sequence[seqOwner]} label={`Before: token owner${seqOwner}`} selected={selected} heads={s.heads}/><CellBoard rows={boards[headOwner]} label={`Attention: head owner${headOwner}`} selected={selected} heads={s.heads}/><CellBoard rows={m.ownership(s.length,s.ranks)[seqOwner].map(i=>restored[i])} label={`After: token owner${seqOwner}`} selected={selected} heads={s.heads}/></div>{view==='dimensions'?dimensions:<FlowControls>{view==='route'?<><FlowSlider name="Persistent token ID" value={s.token} min={0} max={s.length-1} step={1} onChange={value=>up('token',value)}/><FlowSlider name="Persistent head ID" value={s.head} min={0} max={s.heads-1} step={1} onChange={value=>up('head',value)}/></>:<><FlowSlider name="First transmitted cell ID" value={s.swapFirst} min={0} max={s.length*s.heads-1} step={1} onChange={value=>up('swapFirst',value)}/><FlowSlider name="Second transmitted cell ID" value={s.swapSecond} min={0} max={s.length*s.heads-1} step={1} onChange={value=>up('swapSecond',value)}/><button type="button" onClick={()=>up('swapped',[s.swapFirst,s.swapSecond])}>Swap those transmitted cells</button></>}</FlowControls>}<FlowReadout>Cell t{s.token}h{s.head} goes token-owner{seqOwner}→head-owner{headOwner}→token-owner{seqOwner}. Each rank holds {r.perRank} cells/channel and sends {r.nonlocal} nonlocal cells per reshard. Restored mismatches <strong>{mismatch}</strong>; keeping every shape does not prove the correct inverse.</FlowReadout>{view==='fault'&&<FlowControls><button type="button" onClick={()=>setReshard(freshReshard())}>Reset exact reshard</button></FlowControls>}</FlowLab>;
}

export function RingMeshFlowLab() {
  const {reshard:s,setReshard}=useSystems(),coords=[(s.rank>>3)&1,(s.rank>>2)&1,(s.rank>>1)&1,s.rank&1],names=['DP','TP','PP','CP'];
  return <FlowLab label="Find one communication group inside a sixteen-rank mesh"><RingFlowFigure label="Sixteen actual rank coordinates; outlined pairs differ only on the chosen mesh axis" height={435}>
    <text x="18" y="22">Rank tuples are (DP,TP,PP,CP)</text>
    {Array.from({length:16},(_,rank)=>{const c=[(rank>>3)&1,(rank>>2)&1,(rank>>1)&1,rank&1],chosen=c.every((v,i)=>i===s.axis||v===coords[i]),x=18+(rank%2)*163,y=43+Math.floor(rank/2)*43;return <g key={rank}><rect x={x} y={y} width="154" height="36" fill={ringPaint.computed} fillOpacity={chosen?.2:.04} stroke={chosen?'#fff':ringPaint.line}/><text x={x+8} y={y+24}>r{rank}: ({c.join(',')})</text></g>;})}
    <text x="18" y="419">White pair varies only {names[s.axis]}.</text>
  </RingFlowFigure><FlowControls><FlowSlider name="Selected rank" value={s.rank} min={0} max={15} step={1} onChange={rank=>setReshard(x=>({...x,rank}))}/><RingFlowSelect label="Group dimension" value={s.axis} onChange={value=>setReshard(x=>({...x,axis:Number(value)}))} options={names.map((name,i)=>[i,name])}/></FlowControls><FlowReadout>Rank {s.rank} has tuple ({coords.join(',')}); the selected {names[s.axis]} group fixes the other three coordinates. A CP pair reads positions of the same example; sixteen ranks do not mean sixteen independent examples.</FlowReadout></FlowLab>;
}

export function RingSystemsActions() {const {resetSystems}=useSystems();return <FlowControls><button type="button" onClick={resetSystems}>Reset work, resource and reshard cases</button></FlowControls>;}

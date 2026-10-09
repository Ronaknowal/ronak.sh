import React, { useState } from 'react';
import { Local, Plot, Axis, Tree, Table, Numeric, Select, ArrayRow, Arrow, Scalar, Members, Bars, number, vector, palette,ThreeCoordinates,useDrawingBox } from './Drawing.jsx';
import { clusteringPoints, hierarchyFixtures, hierarchyTrace, cutHierarchy, activeGroups, groupDistance, length, mean, squared, scatter, sum,
  faithfulPoints, faithfulTwoGroups, faithfulStandardization, faithfulSubsample, faithfulWardLinkage, linkageTree, fitSmall, primTrace, components, chainTrace, centroidWitness } from './models.js';

export function SavedFits() {
  const [row,setRow]=useState(0),raw=[[2.094,54.75],[4.298,80.285]];
  return <Local id="D23" question="Which geometry produced these recorded representatives?" controls={<Numeric label="Observed row ID" value={row} onChange={setRow} min={0} max={271}/>} reset={()=>setRow(0)}
    readout={<>Row {row} is {vector(faithfulPoints[row])} minutes. Its retained standardized-fit label is C{faithfulTwoGroups.labels[row]}; its raw-fit row label was not retained. The aggregate four changed memberships do not supply four row IDs.</>}>
    <div className="km-lanes"><div><Plot independentAxes points={faithfulPoints} centers={raw} selected={row} showRows={false} title="Recorded raw-unit fit; row memberships unavailable" box={[1,6,40,100]} units={['duration (min)','wait (min)']}/><Table caption="Recorded raw aggregate; rounded centers" headers={['group','center (min)','count']} rows={raw.map((center,i)=>[`C${i}`,vector(center),[100,172][i]])}/></div>
      <div><Plot independentAxes points={faithfulPoints} centers={faithfulTwoGroups.centers} labels={faithfulTwoGroups.labels} selected={row} showRows={false} title="Recorded standardized fit, shown back in minutes" box={[1,6,40,100]} units={['duration (min)','wait (min)']}/><Table caption="Retained standardized aggregate; centers rounded to four decimals" headers={['group','center (min)','count']} rows={faithfulTwoGroups.centers.map((center,i)=>[`C${i}`,vector(center),faithfulTwoGroups.sizes[i]])}/></div></div>
  </Local>;
}
export function RoundedQuery() {
  const [duration,setDuration]=useState(3.6),[wait,setWait]=useState(79),state=faithfulStandardization;
  const transform=row=>row.map((value,i)=>(value-state.mean[i])/state.scale[i]);
  const q=[duration,wait],z=transform(q),centers=faithfulTwoGroups.centers.map(transform),distances=centers.map(center=>squared(z,center)),label=distances[1]<distances[0]?1:0;
  return <Local id="D24" question="Which learned cells stay fixed for a separate query?" controls={<><Numeric label="Query duration (min)" value={duration} onChange={setDuration} min={1} max={6} step={.1}/><Numeric label="Query wait (min)" value={wait} onChange={setWait} min={30} max={120} step={1}/></>} reset={()=>{setDuration(3.6);setWait(79);}}
    readout={<>The rounded-center projection assigns query {vector(q)} to C{label} with squared standardized distance {number(distances[label])}. It is new arithmetic over retained rounded centers, not an exact call to the unavailable unrounded historical model.</>}>
    <ArrayRow label="query in original minutes" values={q}/><ArrayRow label="fixed training mean" values={state.mean}/><ArrayRow label="fixed population scale" values={state.scale}/><Arrow label="(query − training mean) / training scale"/><ArrayRow label="standardized query" values={z}/>
    <Plot points={[]} centers={centers} query={z} title="Rounded centers transformed through saved scaler" edges={centers.map((center,i)=>({a:z,b:center,color:palette[i],strong:i===label}))} units={['standardized duration','standardized wait']}/>
    <ArrayRow label="candidate squared distances" values={distances} selected={label}/><Arrow label="nearest center; lower-ID tie"/><Scalar label="projection label" value={`C${label}`}/>
  </Local>;
}
export function PairMatrix() {
  const [left,setLeft]=useState(2),[right,setRight]=useState(3),distance=length(clusteringPoints[left],clusteringPoints[right]);
  return <Local id="D25" question="Which rows correspond to a symmetric distance cell?" controls={<><Numeric label="Left row ID" value={left} onChange={setLeft} min={0} max={5}/><Numeric label="Right row ID" value={right} onChange={setRight} min={0} max={5}/></>} reset={()=>{setLeft(2);setRight(3);}}
    readout={<>Cells (P{left},P{right}) and (P{right},P{left}) both contain ordinary length {number(distance)}. {left===right?'A diagonal zero is not an eligible self-merge.':'Each endpoint initially names one singleton leaf.'}</>}>
    <Plot points={clusteringPoints} selected={[left,right]} edges={[{a:clusteringPoints[left],b:clusteringPoints[right],strong:true}]} title="The two selected pair operands before the first join"/>
    <Table caption="Ordinary Euclidean dissimilarity matrix: both symmetric selected cells are outlined" headers={['row / column',...clusteringPoints.map((_,i)=>`P${i}`)]} rows={clusteringPoints.map((point,i)=>[`P${i}`,...clusteringPoints.map(other=>length(point,other))])} highlightCells={[[left,right+1],[right,left+1]]}/>
    <ArrayRow label="two singleton leaf ports" values={[`P${left}, count 1`,`P${right}, count 1`]}/>
  </Local>;
}
export function CrossMembers({method,id}) {
  const [fixture,setFixture]=useState('six'),[prefix,setPrefix]=useState(3),[pair,setPair]=useState('');
  const points=hierarchyFixtures[fixture],tree=hierarchyTrace(points,method),active=activeGroups(tree,Math.min(prefix,points.length-2));
  const pairs=active.flatMap((a,i)=>active.slice(i+1).map(b=>({a,b,key:`${a.id}:${b.id}`,...groupDistance(points,a,b,method)})));
  const selected=pairs.find(row=>row.key===pair)||pairs[0],minimum=pairs.reduce((best,row)=>row.value<best.value?row:best,pairs[0]);
  const edges=selected.a.members.flatMap(a=>selected.b.members.map(b=>({a:points[a],b:points[b],distance:length(points[a],points[b])})));
  const highlighted=method==='single'?Math.min(...edges.map(row=>row.distance)):method==='complete'?Math.max(...edges.map(row=>row.distance)):null;
  return <Local id={id} question={`Which cross-member operation defines ${method} linkage?`} controls={<>
    <Select label="Hierarchy fixture" value={fixture} onChange={value=>{setFixture(value);setPrefix(3);setPair('');}} options={['six','chain']}/>
    <Numeric label="Completed merge prefix" value={Math.min(prefix,points.length-2)} onChange={value=>{setPrefix(value);setPair('');}} min={0} max={points.length-2}/>
    <Select label="Active candidate pair" value={selected.key} onChange={setPair} options={pairs.map(row=>[row.key,`${row.a.id} / ${row.b.id}`])}/></>} reset={()=>{setFixture('six');setPrefix(3);setPair('');}}
    readout={<>Candidate {selected.a.id}/{selected.b.id} uses {edges.length} real cross-member lengths and has {method} score {number(selected.value)}. The globally selected active pair is {minimum.a.id}/{minimum.b.id}, score {number(minimum.value)}. Fixture/prefix edits invalidate stale pair IDs.</>}>
    <Plot points={points} centers={[selected.a.mean,selected.b.mean]} groupNames={[`A: node ${selected.a.id}`,`B: node ${selected.b.id}`]} labels={points.map((_,i)=>selected.a.members.includes(i)?0:selected.b.members.includes(i)?1:null)} edges={[...edges.map(edge=>({...edge,strong:edge.distance===highlighted})),...(method==='average'?[{a:selected.a.mean,b:selected.b.mean,residual:true,color:'#777'}]:[])]} title={`${method}: A blue / B rose operands; other active members neutral; mean-to-mean dashed comparison is a different distance`}/>
    <Members groups={[selected.a.members,selected.b.members]}/><Table caption="Every cross edge in the selected candidate" headers={['member pair','ordinary length']} rows={selected.a.members.flatMap(a=>selected.b.members.map(b=>[`P${a}–P${b}`,length(points[a],points[b])]))}/>
    <Arrow label={method==='average'?`sum lengths ÷ ${edges.length} cross pairs`:method==='single'?'minimum cross edge':'maximum cross edge'}/><Scalar label={`${method} score`} value={selected.value}/>
    {method==='average'&&<Scalar label="Distinct centroid-to-centroid length" value={length(selected.a.mean,selected.b.mean)}/>}<Tree tree={tree} prefix={prefix}/>
  </Local>;
}
export function WardBill() {
  const [a,setA]=useState(1),[b,setB]=useState(1),points=clusteringPoints.slice(0,4),groups=[[0,1],[2,3]],centers=groups.map(group=>mean(group.map(i=>points[i]))),merged=mean(points),increment=squared(centers[0],centers[1]);
  const weightedMean=2*b/(a+b),weightedDelta=4*a*b/(a+b);
  return <Local id="D29" question="Which scatter bill appears when two means become one?" controls={<><Numeric label="Mass at location 0" value={a} onChange={setA} min={1} max={100}/><Numeric label="Mass at location 2" value={b} onChange={setB} min={1} max={100}/></>} reset={()=>{setA(1);setB(1);}}
    readout={<>In the deeper two-location comparison, masses {a}/{b} keep mean separation 2 but give merged mean {number(weightedMean)} and added scatter {number(weightedDelta)}. Equal masses 100/100 charge 200 rather than 2.</>}>
    <Plot points={points} centers={[...centers,merged]} labels={[0,0,1,1]} title="Fixed four-row Ward mean movement" edges={[...points.map((point,i)=>({a:point,b:centers[i<2?0:1],residual:true,color:palette[i<2?0:1]})),...centers.map(center=>({a:center,b:merged,strong:true,color:'#e2b55a'}))]}/>
    <Table caption="Separate old scatter and movement contributions" headers={['operand','value']} rows={[
      ['A internal SSE',.25],['B internal SSE',.125],['mean separation²',increment],['A count × shift²',2*squared(centers[0],merged)],['B count × shift²',2*squared(centers[1],merged)],['new total scatter',scatter(points)],
    ]}/><Axis values={[0,2]} centers={[weightedMean]} domain={[0,2]} title="Separate weighted summary-mass comparison"/><ArrayRow label="positive summary masses" values={[a,b]}/><Scalar label="Δ=mass factor × squared mean separation" value={weightedDelta}/>
  </Local>;
}
export function WardHeights() {
  const [prefix,setPrefix]=useState(0),tree=hierarchyTrace(clusteringPoints),total=sum(tree.merges.slice(0,prefix).map(row=>row.delta));
  return <Local id="D30" question="Does reported Ward height equal the increase in SSE?" controls={<Numeric label="Committed Ward merges" value={prefix} onChange={setPrefix} min={0} max={5}/>} reset={()=>setPrefix(0)}
    readout={<>After {prefix} joins, accumulated Δ is {number(total)}. Under this convention every branch has h²=2Δ; node IDs begin at 6 and retain their descendants.</>}>
    <Tree tree={tree} prefix={prefix}/><Table caption="All five derived six-row joins; shown decimals are rounded" headers={['new node','children','Δ','h=√(2Δ)','cumulative SSE']} rows={tree.merges.map((row,i)=>[row.id,`${row.left}/${row.right}`,row.delta,row.height,sum(tree.merges.slice(0,i+1).map(item=>item.delta))])}/>
  </Local>;
}
export function WardAndLloyd() {
  const [count,setCount]=useState(2),tree=hierarchyTrace(clusteringPoints),cut=cutHierarchy(tree,'count',count),initial=cut.groups.map(group=>mean(group.map(id=>clusteringPoints[id]))),fit=fitSmall(clusteringPoints,initial);
  return <Local id="D31" question="Does an equal final partition imply equal optimization history?" controls={<Numeric label="Ward count initializing Lloyd" value={count} onChange={setCount} min={2} max={5}/>} reset={()=>setCount(2)}
    readout={<>Ward’s {count}-group prefix costs {number(cut.sse)}; a fresh bounded Lloyd continuation from those means costs {number(fit.sse)}, fixed={String(fit.fixed)}. Equal results on the default fixture preserve different irreversible-join and movable-center histories.</>}>
    <div className="km-lanes"><div><Members groups={cut.groups}/><Plot points={clusteringPoints} centers={initial} labels={cut.labels} title="Ward prefix means"/></div><div><Members groups={Array.from({length:count},(_,i)=>fit.labels.flatMap((label,j)=>label===i?[j]:[]))}/><Plot points={clusteringPoints} centers={fit.centers} labels={fit.labels} title="Derived Lloyd continuation; not an old scientific run"/></div></div>
  </Local>;
}
function LinkageAnatomy({tree,node,rotation}) {
  const {ref,width,font}=useDrawingBox(),w=Math.max(width,32*font),h=27*font,fields=[['left child',node.left],['right child',node.right],['height',number(node.height)],['leaf count',node.size]],order=rotation?[node.right,node.left]:[node.left,node.right];
  const childX=new Map(order.map((id,i)=>[id,w*(i?.72:.28)])),rootX=w/2,rootY=11*font,baseline=20*font,scale=(baseline-rootY)/Math.max(node.height,1e-12),childY=id=>baseline-tree.nodes[id].height*scale;
  const fieldX=i=>w*(i+.5)/4,fieldBottom=4.5*font,colors=[palette[0],palette[1],'#e2b55a',palette[2]],bracketY=24*font;
  return <div ref={ref}><p>Four stored cells connect to this actual node’s child ports, measured height and descendant count. Rotating the picture moves child ports while their stored IDs stay fixed.</p><div className="km-scroll" tabIndex={0} role="region" aria-label="Linkage cells connected to branch anatomy"><svg width={w} height={h} role="img" aria-label={`Stored row fields connected to persistent node ${node.id}, its two children, vertical height and all ${node.size} descendants`}>
    {fields.map(([label,value],i)=><g key={label}><rect x={fieldX(i)-3.4*font} y={font} width={6.8*font} height={3.5*font} fill="#202025" stroke={colors[i]}/><text x={fieldX(i)} y={2.4*font} fontSize={font} textAnchor="middle" fill={colors[i]}>{label}</text><text x={fieldX(i)} y={3.7*font} fontSize={font} textAnchor="middle" fill="#eee">{value}</text></g>)}
    {[node.left,node.right].map((id,i)=><path key={id} data-field-wire={i===0?'left':'right'} d={`M${fieldX(i)} ${fieldBottom}V${(6+i)*font}H${childX.get(id)}V${childY(id)}`} fill="none" stroke={colors[i]} strokeDasharray="5 4"/>)}
    <path data-field-wire="height" d={`M${fieldX(2)} ${fieldBottom}V${8*font}H${font*2}V${rootY}`} fill="none" stroke={colors[2]} strokeDasharray="5 4"/>
    <path data-field-wire="count" d={`M${fieldX(3)} ${fieldBottom}H${w-font}V${bracketY}H${rootX}`} fill="none" stroke={colors[3]} strokeDasharray="5 4"/>
    <path d={`M${2*font} ${rootY}V${baseline}M${1.6*font} ${rootY}H${2.4*font}M${1.6*font} ${baseline}H${2.4*font}`} fill="none" stroke={colors[2]} strokeWidth="2"/><text x={3*font} y={(rootY+baseline)/2} fill={colors[2]} fontSize={font}>{number(node.height)}</text><text x={2*font} y={baseline+1.5*font} fill={colors[2]} fontSize={font}>0</text>
    <path d={`M${childX.get(order[0])} ${childY(order[0])}V${rootY}H${childX.get(order[1])}V${childY(order[1])}`} fill="none" stroke="#ddd" strokeWidth="2"/>
    <circle cx={rootX} cy={rootY} r={font*.3} fill="#e2b55a"/><text x={rootX} y={rootY-font*.6} fontSize={font} fill="#ddd" textAnchor="middle">node {node.id}</text>
    {order.map(id=><g key={id}><circle cx={childX.get(id)} cy={childY(id)} r={font*.3} fill={id===node.left?colors[0]:colors[1]}/><text x={childX.get(id)} y={childY(id)+1.4*font} textAnchor="middle" fontSize={font} fill="#ddd">child {id}</text><text x={childX.get(id)} y={baseline+2.8*font} textAnchor="middle" fontSize={font} fill="#ddd">{tree.nodes[id].members.map(i=>`P${i}`).join('/')}</text></g>)}
    <path d={`M${w*.18} ${bracketY-font*.5}V${bracketY}H${w*.82}V${bracketY-font*.5}`} fill="none" stroke={colors[3]} strokeWidth="2"/><text x={rootX} y={bracketY+1.5*font} fontSize={font} fill={colors[3]} textAnchor="middle">{node.size} descendant leaves</text>
  </svg></div><p>A child port can already stand for a subtree: its displayed vertical position uses that child’s actual stored height. The complete branch drawing below preserves those internal branches. Horizontal spacing and leader paths are layout.</p></div>;
}
export function LinkageRow() {
  const [row,setRow]=useState(0),[rotate,setRotate]=useState('normal'),tree=hierarchyTrace(clusteringPoints),node=tree.merges[row];
  return <Local id="D32" question="Where do a linkage row’s four fields appear?" controls={<><Numeric label="Stored merge row" value={row} onChange={setRow} min={0} max={4}/><Select label="Child drawing order" value={rotate} onChange={setRotate} options={['normal','rotated']}/></>} reset={()=>{setRow(0);setRotate('normal');}}
    readout={<>Row {row} makes persistent node {node.id} from child IDs {node.left}/{node.right}, height {number(node.height)}, leaf count {node.size}. Rotation changes left/right drawing order while all stored operands stay fixed.</>}>
    <LinkageAnatomy tree={tree} node={node} rotation={rotate==='rotated'}/><Tree tree={tree} prefix={row+1} selected={node.members[0]} rotation={rotate==='rotated'}/>
  </Local>;
}
export function TiedCuts() {
  const [method,setMethod]=useState('ward'),[policy,setPolicy]=useState('height'),[height,setHeight]=useState(0),[count,setCount]=useState(6),tree=hierarchyTrace(clusteringPoints,method),maximum=tree.root.height*1.05,cut=cutHierarchy(tree,policy,policy==='height'?height:count);
  return <Local id="D33" question="Why can a tied height cut skip an exact group count?" controls={<><Select label="Stored linkage rule" value={method} onChange={value=>{setMethod(value);setHeight(0);setCount(6);}} options={['single','complete','average','ward']}/><Select label="Cut operation" value={policy} onChange={setPolicy} options={[['height','inclusive height'],['count','exact merge-count prefix']]}/>
    {policy==='height'?<Numeric label="Inclusive threshold" value={height} onChange={setHeight} min={0} max={maximum} step="any"/>:<Numeric label="Requested exact count" value={count} onChange={setCount} min={1} max={6}/>}</>} reset={()=>{setMethod('ward');setPolicy('height');setHeight(0);setCount(6);}}
    readout={<>This {policy==='height'?'inclusive-height':'count-prefix'} operation includes {cut.mergesUsed} joins and returns {cut.count} groups. At the stored tied Ward height √.5, both joins enter together: five groups become three; exact four groups selects a stored tie order.</>}>
    <Tree tree={tree} prefix={5} threshold={policy==='height'?height:undefined}/><Members groups={cut.groups}/>
    <Table caption="Endpoint contracts are separate API operations" headers={['API','height endpoint','count meaning']} rows={[
      ['fcluster(distance)','≤','threshold components'],['cut_tree(height)','<','strict threshold'],['Agglomerative distance_threshold','<','strict threshold'],['stored merge prefix','not a height','exact requested count'],['fcluster(maxclust=4)','not exact count','at most four; recorded tied result three'],
    ]}/>
    <ArrayRow label="Exact stored boundary values for numeric entry" values={tree.merges.map(row=>String(row.height))}/>
  </Local>;
}
export function CondensedInterface() {
  const [form,setForm]=useState('coordinates'),square=[[0,1,4],[1,0,3],[4,3,0]];
  return <Local id="D34" question="Which shape does the library interpret as observations?" controls={<Select label="API input representation" value={form} onChange={setForm} options={['coordinates','condensed','square-as-observations']}/>} reset={()=>setForm('coordinates')}
    readout={<>The {form} input has shape {form==='coordinates'?'3×1':form==='condensed'?'3 distances':'3×3 observations'}. {form==='square-as-observations'?'Its rows become new three-coordinate points; a warning does not mean the hierarchy was rejected.':'Coordinates or correctly ordered condensed distances represent the intended three objects.'}</>}>
    <Axis values={[0,1,4]} title="Original one-coordinate observations"/><Table caption="Symmetric original distances" headers={['ID','P0','P1','P2']} rows={square.map((row,i)=>[`P${i}`,...row])}/>
    <Arrow label="upper-triangle pair cells 01 → 02 → 12"/><ArrayRow label="condensed vector" values={[1,4,3]}/>
    <Table caption="Accidental square rows as distinct 3D observations" headers={['new point','coordinate 0','coordinate 1','coordinate 2']} rows={square.map((row,i)=>[`row ${i}`,...row])}/>
    <ThreeCoordinates rows={square}/>
    <Scalar label="New row-0 to row-1 length" value={Math.sqrt(3)}/><Scalar label="Original P0 to P1 length" value={1}/>
  </Local>;
}
export function SavedTree() {
  const [leaf,setLeaf]=useState(0),[prefix,setPrefix]=useState(39),points=faithfulSubsample.map(id=>faithfulPoints[id]),tree=linkageTree(points,faithfulWardLinkage),original=faithfulSubsample[leaf];
  return <Local id="D35" question="Which original observation does this local tree leaf name?" controls={<><Numeric label="Local leaf index" value={leaf} onChange={setLeaf} min={0} max={39}/><Numeric label="Saved merge prefix" value={prefix} onChange={setPrefix} min={0} max={39}/></>} reset={()=>{setLeaf(0);setPrefix(39);}}
    readout={<>Local leaf {leaf} names original row {original}, {vector(faithfulPoints[original])} minutes. This exact saved 40-leaf standardized Ward tree uses rounded six-decimal heights, not the full 272-row hierarchy or its unavailable unrounded thresholds.</>}>
    <Plot independentAxes points={faithfulPoints} selected={original} showRows={false} title="Selected original record in the 272-row collection" units={['duration (min)','wait (min)']}/>
    <Arrow label={`original row ${original} → local leaf ${leaf}`}/><Tree tree={tree} prefix={prefix} selected={leaf} leafNames={faithfulSubsample.map(id=>`R${id}`)}/>
  </Local>;
}
export function MinimumSpanning() {
  const [threshold,setThreshold]=useState(1),[step,setStep]=useState(0),points=[[0],[1],[2],[6]],model=primTrace(points),state=model.trace[step],labels=components(points,model.edges,threshold);
  return <Local id="D36" question="Which paths preserve a single-linkage threshold component?" controls={<><Numeric label="Inclusive edge threshold" value={threshold} onChange={setThreshold} min={0} max={6} step={.1}/><Numeric label="Prim operation index" value={step} onChange={setStep} min={0} max={model.trace.length-1}/></>} reset={()=>{setThreshold(1);setStep(0);}}
    readout={<>Threshold {number(threshold)} returns labels {labels.join(',')}. Prim operation {step} is {state.phase}; candidate parent/value arrays require linear extra state. At threshold 1 the first three points connect although endpoint length is 2.</>}>
    <Plot points={points.map(([x])=>[x,0])} labels={labels} title="MST connections and threshold groups" edges={model.edges.map(([a,b,value])=>({a:[points[a][0],0],b:[points[b][0],0],strong:value<=threshold,color:value<=threshold?'#e2b55a':'#888'}))}/>
    <Table caption="Actual dense Prim candidate arrays" headers={['vertex','visited','best ordinary length','parent']} rows={points.map((_,i)=>[i,state.visited.includes(i)?'yes':'no',state.best[i],state.parent[i]??'none'])}/><ArrayRow label="Committed edge IDs" values={state.edges.map(([a,b,value])=>`${a}–${b}: ${number(value)}`)}/>
  </Local>;
}
export function ReciprocalChain() {
  const [method,setMethod]=useState('ward'),[step,setStep]=useState(0),points=[[0],[1],[4],[5]],model=chainTrace(points,method),state=model.trace[Math.min(step,model.trace.length-1)];
  return <Local id="D37" question="Which reciprocal pointers allow the next reducible join?" controls={<><Select label="Reducible linkage" value={method} onChange={value=>{setMethod(value);setStep(0);}} options={['complete','average','ward']}/><Numeric label="Chain operation index" value={Math.min(step,model.trace.length-1)} onChange={setStep} min={0} max={model.trace.length-1}/></>} reset={()=>{setMethod('ward');setStep(0);}}
    readout={<>Operation {step}: {state.phase}, pointer {state.from}→{state.to}. {method==='ward'?'Stored update operands are q=h², not Δ or ordinary height.':method==='average'?'The update weights each child distance by its member count.':'The update keeps the maximum cross distance.'} Discovery order and valid height-sorted output are separate schedules.</>}>
    <Axis values={[0,1,4,5]} title="Four input members for the pointer chain"/><ArrayRow label="nearest-neighbor pointer stack" values={state.chain.map(id=>`node ${id}`)}/><Arrow label={`${state.from} → nearest node ${state.to}`}/>
    <Table caption={method==='ward'?'Active squared-height q matrix':'Active ordinary group-distance matrix'} headers={['active ID',...state.active.map(String)]} rows={state.active.map((id,i)=>[id,...(state.matrix[i]||[]).map(value=>method==='ward'?value*value:value)])}/>
    {state.merged&&<><ArrayRow label="real child operands before commit" values={[`A=${state.from}`,`B=${state.to}`,`nA=${state.nodes[state.from].members.length}`,`nB=${state.nodes[state.to].members.length}`]}/><Arrow label={method==='ward'?'((nA+nC)qAC+(nB+nC)qBC−nCqAB)/(nA+nB+nC)':method==='average'?'(nA dAC + nB dBC)/(nA+nB)':'max(dAC,dBC)'}/><ArrayRow label="new node and its real members" values={[state.merged.id,...state.merged.members]}/></>}
      {state.updates&&<Table caption="Actual child-to-C update operands and committed values" headers={['Other C','nA/nB/nC',method==='ward'?'qAC/qBC/qAB':'dAC/dBC/dAB','new stored value']} rows={state.updates.map(row=>[row.c,[row.nA,row.nB,row.nC],[row.ac,row.bc,row.ab],row.value])}/>}
      <p>This executable schedule follows the complete program: after closing0→1→0, an empty chain restarts at the smallest active ID2 and closes2→3→2. Starting a valid chain from newID4 could instead walk4→2→3→2; that is a different discovery schedule, with the same reducible merge invariants.</p>
      <Table caption="Actual discovered joins; source program sorts and reconstructs IDs" headers={['node','children','height','count']} rows={model.discovered.map(row=>[row.id,`${row.left}/${row.right}`,row.height,row.size])}/>
  </Local>;
}
export function CentroidInversion() {
  const [apex,setApex]=useState(1.8),model=centroidWitness(apex),rows=[[model.first.a,model.first.b,model.first.distance,2],[model.third,3,model.second,3]],tree=linkageTree(model.points,rows);
  return <Local id="D38" question="Can a newly joined parent lie below its child?" controls={<Numeric label="Apex coordinate y" value={apex} onChange={setApex} min={1.5} max={2.25} step="any"/>} reset={()=>setApex(1.8)}
    readout={<>First pair {model.first.a}/{model.first.b} joins at {number(model.first.distance)}; its mean {vector(model.merged)} joins the third point at {number(model.second)}. {model.second<model.first.distance?'The parent height is lower: a genuine centroid inversion.':'The current geometry has no decreasing parent height.'} The symbolic √3 tie is separate from entered floating comparisons.</>}>
    <div className="km-lanes"><Plot points={model.points} centers={[model.merged]} title="Actual first pair and its mean" edges={[{a:model.points[model.first.a],b:model.points[model.first.b],strong:true},{a:model.merged,b:model.points[model.third],residual:true}]}/><Tree tree={tree}/></div>
    <Table caption="All original candidate lengths; topology recomputed" headers={['pair','length']} rows={model.pairs.map(row=>[`${row.a}/${row.b}`,row.distance])}/>
  </Local>;
}
export function PairStorage() {
  const [count,setCount]=useState(100000),[budget,setBudget]=useState(16),pairs=count*(count-1)/2,condensed=8*pairs/2**30,square=8*count*count/2**30;
  return <Local id="D39" question="Which distance buffer must fit before starting?" controls={<><Numeric label="Row count n" value={count} onChange={setCount} min={2} max={100000}/><Numeric label="Accounted memory budget (GiB)" value={budget} onChange={setBudget} min={1} max={64} step={1}/></>} reset={()=>{setCount(100000);setBudget(16);}}
    readout={<>There are {pairs.toLocaleString('en-US')} unordered pairs. Their float64 buffer alone is {number(condensed,3)} GiB {condensed<=budget?'within':'beyond'} the declared {budget} GiB budget. Coordinates, output and other workspace remain additional allocations; no buffer is allocated here.</>}>
    <ArrayRow label="pair-buffer triangular row lengths" values={count<=5?Array.from({length:count-1},(_,i)=>count-1-i):[count-1,count-2,'…',2,1]}/><PairBuffer count={count}/><Arrow label="n(n−1)/2 entries × eight bytes"/>
    <Bars maximum={80} title="Common capacity scale, GiB" rows={[{label:'condensed float64',value:condensed},{label:'full square float64',value:square},{label:'chosen budget',value:budget,color:'#e2b55a'}]}/><Scalar label="Condensed bytes" value={8*pairs}/>
  </Local>;
}
function PairBuffer({count}) {
 const visible=Math.min(count,5);
 return <div className="km-scroll" tabIndex={0} role="region" aria-label="Upper-triangular pair slots; the browser counts rather than allocating the full buffer"><p>Each shown indexed socket represents one float64 pair entry (8 bytes). Only the first {visible} row IDs are drawn; {count>visible?'the omitted continuation is counted by the formula, not allocated.':'these are all pairs in the current small input.'}</p><table className="km-table"><thead><tr><th>i / j</th>{Array.from({length:visible},(_,i)=><th key={i}>{i}</th>)}</tr></thead><tbody>{Array.from({length:visible},(_,i)=><tr key={i}><th>{i}</th>{Array.from({length:visible},(_,j)=><td key={j}>{j>i?<span className="km-pair-slot">({i},{j})</span>:'—'}</td>)}</tr>)}</tbody></table></div>;
}

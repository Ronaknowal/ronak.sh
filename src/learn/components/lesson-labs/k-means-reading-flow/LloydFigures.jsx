import React, { createContext, useContext, useState } from 'react';
import { Local, Plot, Axis, Table, Numeric, Select, ArrayRow, Arrow, Scalar, Bars, Members, palette, number, vector } from './Drawing.jsx';
import { clusteringPoints, rectanglePoints, closest, fitSmall, scatterAssigned, mean, squared, sum, seedingDistribution, seedingFrequencies } from './models.js';

const StateContext=createContext(null);
export function KMeansStateProvider({children}) {
  const [fixture,setFixture]=useState('six'),[seed0,setSeed0]=useState(0),[seed1,setSeed1]=useState(4),[phase,setPhase]=useState(0);
  const [seedFixture,setSeedFixture]=useState('six'),[first,setFirst]=useState(0),[draw,setDraw]=useState(.5),[accepted,setAccepted]=useState([]);
  const points=fixture==='six'?clusteringPoints:rectanglePoints;
  const fit=fitSmall(points,[points[seed0],points[seed1]]);
  function changeFixture(value) { setFixture(value); setSeed0(0); setSeed1(value==='six'?4:2); setPhase(0); }
  function resetFit() { changeFixture('six'); }
  function resetSeeds() { setSeedFixture('six');setFirst(0);setDraw(.5);setAccepted([]); }
  return <StateContext.Provider value={{fixture,changeFixture,seed0,setSeed0,seed1,setSeed1,phase,setPhase,points,fit,resetFit,
    seedFixture,setSeedFixture,first,setFirst,draw,setDraw,accepted,setAccepted,resetSeeds}}>{children}</StateContext.Provider>;
}
const useFit=()=>useContext(StateContext);
function groupsFor(labels,count) { return Array.from({length:count},(_,group)=>labels.flatMap((label,i)=>label===group?[i]:[])); }

export function Assignment() {
  const [first,setFirst]=useState(0),[second,setSecond]=useState(4),[row,setRow]=useState(2), centers=[clusteringPoints[first],clusteringPoints[second]], result=closest(clusteringPoints[row],centers);
  const labels=clusteringPoints.map(point=>closest(point,centers).label);
  return <Local id="D07" question="Which representative does one point choose?" controls={<><Numeric label="First center row" value={first} onChange={setFirst} min={0} max={5}/><Numeric label="Second center row" value={second} onChange={setSecond} min={0} max={5}/><Numeric label="Inspected row" value={row} onChange={setRow} min={0} max={5}/></>} reset={()=>{setFirst(0);setSecond(4);setRow(2);}}
    readout={<>P{row} compares squares {vector(result.distances)} and chooses C{result.label}. A literal tie keeps the lower center ID; duplicate supplied centers may leave another center unused.</>}>
    <Plot points={clusteringPoints} centers={centers} labels={labels} selected={row} bisector edges={centers.map((center,i)=>({a:clusteringPoints[row],b:center,color:palette[i],strong:result.label===i,directed:result.label===i,residual:result.label!==i}))} title="Candidate lengths, selected directed assignment and equal-distance boundary"/>
    <Table caption="Every row's candidate squares, winner and contribution" headers={['Row','C0 square','C1 square','winner','contribution']} rows={clusteringPoints.map((point,id)=>{const r=closest(point,centers);return[`P${id}`,...r.distances,`C${r.label}`,r.distances[r.label]];})}/><Scalar label="Total nearest-center SSE" value={scatterAssigned(clusteringPoints,centers,labels)}/>
    <ArrayRow label={`P${row} candidate squared distances`} values={result.distances} selected={result.label}/><Arrow label="argmin; strict improvement replaces the current winner"/>
    <Scalar label="Assigned center ID" value={`C${result.label}`}/>
  </Local>;
}
export function FitSetup() {
  const state=useFit(),points=state.points,centers=[points[state.seed0],points[state.seed1]],labels=points.map(point=>closest(point,centers).label);
  return <Local id="D08" question="Which initial rows will the complete trace use?" controls={<><Select label="Row fixture" value={state.fixture} onChange={state.changeFixture} options={['six','rectangle']}/>
    <Numeric label="C0 seed row" value={state.seed0} onChange={value=>{state.setSeed0(value);state.setPhase(0);}} min={0} max={points.length-1}/>
    <Numeric label="C1 seed row" value={state.seed1} onChange={value=>{state.setSeed1(value);state.setPhase(0);}} min={0} max={points.length-1}/></>} reset={state.resetFit}
    readout={<>These {points.length} fixed rows and seed IDs {state.seed0}/{state.seed1} also supply the next operation trace. Their initial nearest-center SSE is {number(scatterAssigned(points,centers,labels))}.</>}>
    <Plot points={points} centers={centers} labels={labels} title="Supplied initial center state"/>
    <ArrayRow label="seed source row IDs" values={[state.seed0,state.seed1]}/><ArrayRow label="initial assignment" values={labels}/>
  </Local>;
}
export function FitPhase() {
  const state=useFit(), index=Math.min(state.phase,state.fit.states.length-1), frame=state.fit.states[index];
  return <Local id="D08-phase" question="What changes during an assignment and during a mean movement?" controls={<>
    <button type="button" disabled={index===0} onClick={()=>state.setPhase(index-1)}>Previous operation</button>
    <Numeric label="Operation index" value={index} onChange={state.setPhase} min={0} max={state.fit.states.length-1}/>
    <button type="button" disabled={index===state.fit.states.length-1} onClick={()=>state.setPhase(index+1)}>Next operation</button></>} reset={state.resetFit}
    readout={<>Operation {index}: {frame.phase}. {frame.sse===null?'No assignment objective yet.':`SSE ${number(frame.sse)}.`} {frame.phase==='mean movement'?'Colors retain the memberships used to calculate these means; the next operation reassigns.':frame.fixed?'Fresh labels agree with the memberships used for the last means: a fixed point.':'Assignment and movement remain separate operations.'}</>}>
    <div className="km-lanes">{frame.previousCenters&&<Plot points={state.points} centers={frame.previousCenters} labels={frame.labels} title="Before mean movement: these labels define each sum"/>}
    <Plot points={state.points} centers={frame.centers} labels={frame.labels||undefined} title={frame.phase} edges={[...(frame.labels?state.points.map((point,i)=>({a:point,b:frame.centers[frame.labels[i]],residual:frame.phase==='mean movement',directed:frame.phase!=='mean movement',color:palette[frame.labels[i]]})):[]),...(frame.previousCenters?frame.previousCenters.map((row,i)=>({a:row,b:frame.centers[i],directed:true,strong:true,color:'#e2b55a'})):[])]}/></div>
    {frame.labels&&<Table caption="Membership held fixed: literal coordinate sums and counts" headers={['Center ID','member IDs','count','coordinate sum','mean']} rows={[0,1].map(id=>{const members=state.points.flatMap((point,i)=>frame.labels[i]===id?[i]:[]),rows=members.map(i=>state.points[i]);return[`C${id}`,members,members.length,state.points[0].map((_,j)=>sum(rows.map(row=>row[j]))),members.length?mean(rows):'empty: keep preceding center'];})}/>}
    {frame.labels&&<Members groups={groupsFor(frame.labels,2)}/>}
    <ArrayRow label="center coordinate rows" values={frame.centers}/><ArrayRow label="membership used in this operation" values={frame.labels||state.points.map(()=> 'not assigned')}/>
  </Local>;
}
export function LocalSolutions() {
  const [phase,setPhase]=useState(3),[x,setX]=useState(1.5),[y,setY]=useState(.5);
  const vertical=fitSmall(rectanglePoints,[rectanglePoints[0],rectanglePoints[2]]),horizontal=fitSmall(rectanglePoints,[rectanglePoints[0],rectanglePoints[1]]);
  const q=[x,y], systems=[horizontal,vertical];
  return <Local id="D09" question="Can two complete fits settle at different objectives?" controls={<><Numeric label="Operation index" value={phase} onChange={setPhase} min={0} max={3}/><Numeric label="Query x" value={x} onChange={setX} min={0} max={3} step={.1}/><Numeric label="Query y" value={y} onChange={setY} min={0} max={1} step={.1}/></>} reset={()=>{setPhase(3);setX(1.5);setY(.5);}}
    readout={<>The completed top/bottom route has SSE 9; the left/right route has SSE 1. At query {vector(q)} their current assignments are C{closest(q,systems[0].states[phase].centers).label}/C{closest(q,systems[1].states[phase].centers).label}. A conditional fixed point is not a global-optimum proof.</>}>
    <div className="km-lanes">{systems.map((fit,i)=>{const frame=fit.states[phase];return <div key={i}><Plot points={rectanglePoints} centers={frame.centers} labels={frame.labels||undefined} query={q} box={[0,3,0,1]} title={`${i===0?'Top/bottom':'Left/right'} route · ${frame.phase}`}/><Scalar label="Current SSE" value={frame.sse}/></div>;})}</div>
  </Local>;
}
export function ObjectiveTerms() {
  const [row,setRow]=useState(0),[moved,setMoved]=useState('moved'),state=useFit();
  const initial=[state.points[state.seed0],state.points[state.seed1]],labels=state.points.map(point=>closest(point,initial).label);
  const centers=moved==='initial'?initial:initial.map((previous,id)=>{const members=state.points.filter((_,i)=>labels[i]===id);return members.length?mean(members):previous;});
  const contributions=state.points.map((point,i)=>squared(point,centers[labels[i]])),selected=Math.min(row,state.points.length-1);
  return <Local id="D10" question="Which residual contributes one term to the objective?" controls={<><Numeric label="Inspected row" value={selected} onChange={setRow} min={0} max={state.points.length-1}/><Select label="Center state at fixed labels" value={moved} onChange={setMoved} options={['initial','moved']}/></>} reset={()=>{setRow(0);setMoved('moved');}}
    readout={<>Fixed labels from the shared seed state contribute {number(contributions[selected])} for row {selected}; all {state.points.length} terms sum to {number(sum(contributions))}. This mean comparison keeps membership fixed.</>}>
    <Plot points={state.points} centers={centers} labels={labels} selected={selected} edges={state.points.map((point,i)=>({a:point,b:centers[labels[i]],residual:true,strong:i===selected,color:palette[labels[i]]}))} title="Fixed-label residual decomposition"/>
    <ArrayRow label="squared residual terms" values={contributions} selected={selected}/><Arrow label="sum every observation contribution"/><Scalar label="J(labels, centers)" value={sum(contributions)}/>
    <ArrayRow label="Separate C0/C1 subtotals" values={[0,1].map(id=>sum(contributions.filter((_,i)=>labels[i]===id)))}/>
  </Local>;
}
function DistributionDrawing({points,seeds,u}) {
  const distribution=seedingDistribution(points,seeds,u);
  const rowColor = index => palette[index % palette.length];
  const identityCell = (index, value) => <span className="km-candidate-cell" data-candidate-id={`P${index}`} style={{borderColor:rowColor(index)}}>{value}</span>;
  return <><Plot points={points} pointColors={points.map((_,index)=>rowColor(index))} selected={distribution.selected??undefined} centers={seeds.map(i=>points[i])} title="Nearest accepted seed for every row; white outline selects the next candidate" edges={points.map((point,i)=>({a:point,b:points[seeds[closest(point,seeds.map(i=>points[i])).label]],residual:true,color:rowColor(i)}))}/>
    {!distribution.stopped&&<div className="km-probability-strip" role="img" aria-label="Cumulative probability intervals; P-ID key below labels every segment, and the uniform draw is marked in white">{distribution.rows.map(row=><i key={row.index} data-candidate-id={`P${row.index}`} aria-label={`P${row.index}: probability ${row.probability}`} title={`P${row.index}: [${number(row.start)}, ${number(row.end)})`} style={{width:`${100*row.probability}%`,background:rowColor(row.index)}}>{row.probability>=.1&&<span>{`P${row.index}`}</span>}</i>)}<b style={{left:`${100*u}%`}}/></div>}
    <div className="km-candidate-key" aria-label="Persistent row identity key">{distribution.rows.map(row=><span key={row.index} data-candidate-id={`P${row.index}`}><i style={{background:rowColor(row.index)}} aria-hidden="true"/>{`P${row.index}`}{row.probability===0?' · zero width':''}</span>)}</div>
    <Table caption="Literal row intervals; each hue identifies the same P-ID in the dot, D² cell and strip; repeated colors do not rename IDs" headers={['Row','nearest D²','probability','interval start','interval end']} rows={distribution.rows.map(row=>[identityCell(row.index,`P${row.index}`),identityCell(row.index,number(row.distance)),row.probability,row.start,row.end])} highlight={distribution.selected}/>
    <Scalar label="Total potential" value={distribution.total}/><Scalar label="Selected candidate" value={distribution.selected===null?'none: already represented':`P${distribution.selected}`}/></>;
}
export function SeedDraw() {
  const [first,setFirst]=useState(0),[draw,setDraw]=useState(.5),d=seedingDistribution(clusteringPoints,[first],draw);
  return <Local id="D14" question="Which interval contains this uniform draw?" controls={<><Numeric label="First seed row" value={first} onChange={setFirst} min={0} max={5}/><Numeric label="Uniform draw u" value={draw} onChange={setDraw} min={0} max={.999} step={.001}/></>} reset={()=>{setFirst(0);setDraw(.5);}}
    readout={<>Draw {number(draw)} selects P{d.selected} from mass proportional to nearest squared distance. Half-open intervals give a boundary to the interval on its right; a farthest row is not certain.</>}><DistributionDrawing points={clusteringPoints} seeds={[first]} u={draw}/></Local>;
}
export function AcceptedSeeds() {
  const state=useFit(),points=state.seedFixture==='six'?clusteringPoints:clusteringPoints.map(()=>[0,0]),seeds=[state.first,...state.accepted],d=seedingDistribution(points,seeds,state.draw);
  return <Local id="D15" question="Which probabilities change when another seed is accepted?" controls={<><Select label="Seeding rows" value={state.seedFixture} onChange={value=>{state.setSeedFixture(value);state.setAccepted([]);}} options={['six','identical']}/>
    <Numeric label="First seed row" value={state.first} onChange={value=>{state.setFirst(value);state.setAccepted([]);}} min={0} max={5}/><Numeric label="Uniform draw u" value={state.draw} onChange={state.setDraw} min={0} max={.999} step={.001}/>
    <button type="button" disabled={d.stopped||seeds.length===6} onClick={()=>state.setAccepted([...state.accepted,d.selected])}>Accept candidate seed</button>
    <button type="button" disabled={!state.accepted.length} onClick={()=>state.setAccepted(state.accepted.slice(0,-1))}>Undo last seed</button></>} reset={state.resetSeeds}
    readout={<>Accepted row sequence {seeds.join(' → ')} has potential {number(d.total)}. {d.stopped?'Every row is represented; there is no positive D² draw.':'Accepting a candidate recomputes each row’s nearest seed before another draw.'} No Lloyd mean has moved.</>}>
    <ArrayRow label="accepted source IDs" values={seeds.map(i=>`P${i}`)}/><DistributionDrawing points={points} seeds={seeds} u={state.draw}/>
  </Local>;
}
export function GreedyTrials() {
  const [a,setA]=useState(2),[b,setB]=useState(4),base=seedingDistribution(clusteringPoints,[0]);
  const trials=[a,b].map(id=>({id,...seedingDistribution(clusteringPoints,id===0?[0]:[0,id])})),winner=trials[1].total<trials[0].total?1:0;
  const supplied=[.2,.5,.05,.8,.9,.1],inclusion=base.rows.map(row=>Math.min(1,2*row.distance/base.total)),selected=[0,...base.rows.filter((row,i)=>row.index!==0&&supplied[i]<inclusion[i]).map(row=>row.index)];
  return <Local id="D16" question="Which extra calculation selects a greedy trial?" controls={<><Numeric label="First trial row" value={a} onChange={setA} min={0} max={5}/><Numeric label="Second trial row" value={b} onChange={setB} min={0} max={5}/></>} reset={()=>{setA(2);setB(4);}}
    readout={<>Trial potentials are {number(trials[0].total)} and {number(trials[1].total)}; trial {winner} wins. Equal potentials retain first trial order. This prospective calculation differs from a single vanilla probability draw.</>}>
    <div className="km-lanes">{trials.map((trial,i)=><div key={i}><Plot points={clusteringPoints} centers={[clusteringPoints[0],clusteringPoints[trial.id]]} title={`Trial ${i}: candidate P${trial.id}`}/><ArrayRow label="new per-row nearest D²" values={trial.rows.map(row=>row.distance)}/><Scalar label="Prospective potential" value={trial.total}/></div>)}</div>
    <p>Deeper: one supplied k-means|| oversampling operation, ℓ=2. These independent threshold witnesses are deterministic inputs, not measured draws.</p>
    <Table caption="Independent inclusion sockets" headers={['ID','p=min(1,ℓD²/φ)','supplied threshold','included']} rows={base.rows.map((row,i)=>[`P${i}`,inclusion[i],supplied[i],selected.includes(i)?i===0?'yes (P0 retained)':'yes':'no'])}/>
    <Arrow label="accept P0/P2/P5; assign original rows to candidates"/><Members groups={[[0,1],[2,3],[4,5]]}/><ArrayRow label="candidate masses before final reclustering" values={[2,2,2]}/>
  </Local>;
}
export function DrawFrequency() {
  const [row,setRow]=useState(0),state=useFit(),points=state.seedFixture==='six'?clusteringPoints:clusteringPoints.map(()=>[0,0]),seeds=[state.first,...state.accepted];
  const distribution=seedingDistribution(points,seeds),frequency=seedingFrequencies(points,seeds,200,1);
  return <Local id="D17" question="Why can a finite frequency differ from its probability?" controls={<Numeric label="Inspected source row" value={row} onChange={setRow} min={0} max={5}/>} reset={()=>setRow(0)}
    readout={frequency.stopped?<>Zero potential supplies no positive distribution or repeated-draw estimate.</>:<>For P{row}, exact conditional probability is {number(distribution.rows[row].probability)}, while {frequency.counts[row]}/200 gives frequency {number(frequency.frequencies[row])}. The current bounded mulberry32 draws use seed 1 and the accepted sequence above.</>}>
    <ArrayRow label="current accepted IDs" values={seeds.map(id=>`P${id}`)}/>
    {!frequency.stopped&&<Bars title={`P${row} probability versus current 200-draw frequency`} rows={[{label:'exact D² probability',value:distribution.rows[row].probability},{label:'finite frequency',value:frequency.frequencies[row]},{label:'uniform over unused rows',value:seeds.includes(row)?0:frequency.uniformProbability}]}/>}
    <Table caption="Conditional current teaching draws; not fit evidence" headers={['Row','exact p','count / 200','frequency']} rows={distribution.rows.map((entry,i)=>[`P${i}`,entry.probability,frequency.counts[i],frequency.frequencies[i]])} highlight={row}/>
  </Local>;
}
export function Completion() {
  const state=useFit(),[phase,setPhase]=useState(null),index=Math.min(phase??state.fit.states.length-1,state.fit.states.length-1),frame=state.fit.states[index];
  return <Local id="D18" question="Which returned state is actually a fixed point?" controls={<Numeric label="Trace operation" value={index} onChange={setPhase} min={0} max={state.fit.states.length-1}/>} reset={()=>setPhase(state.fit.states.length-1)}
    readout={<>This is {frame.phase}; fixed-point flag {String(frame.fixed)}. A finite deterministic mean/assignment state argument justifies exact stopping; a decreasing error alone does not.</>}>
    <Plot points={state.points} centers={frame.centers} labels={frame.labels||undefined} title="Returned centers and current labels"/>
    <ArrayRow label="current labels" values={frame.labels||['not assigned']}/><Arrow label="means → fresh nearest assignments → compare labels"/><Scalar label="Fixed point" value={String(frame.fixed)}/>
    <ArrayRow label="decreasing but never finite-zero sequence" values={[1,.5,.25,.125,'…']}/>
  </Local>;
}
export function BudgetAndEmpty() {
  const [fixture,setFixture]=useState('budget'),[budget,setBudget]=useState(1),points=fixture==='budget'?[[0],[2],[3],[9]]:[[0],[0],[0],[0]],initial=fixture==='budget'?[[0],[3]]:[[0],[0],[0]],fit=fitSmall(points,initial,budget),occupied=new Set(fit.labels).size;
  return <Local id="D19" question="Can a valid return be unfinished or have fewer occupied groups?" controls={<><Select label="Completion case" value={fixture} onChange={setFixture} options={[['budget','0,2,3,9'],['duplicates','four identical zeros']]}/><Numeric label="Mean-update budget" value={budget} onChange={setBudget} min={1} max={10}/></>} reset={()=>{setFixture('budget');setBudget(1);}}
    readout={<>Returned nearest labels {fit.labels.join('')} occupy {occupied} of {initial.length} centers. Fixed point: {String(fit.fixed)}. {fit.fixed?'Labels agree after the mean update.':'The budget ended before current labels defined the returned means.'} Empty centers retain their previous supplied location.</>}>
    <Plot points={points.map(([x])=>[x,0])} centers={fit.centers.map(([x])=>[x,0])} labels={fit.labels} title="Final assignment to returned centers"/>
    <Table caption="Every complete operation in the bounded current fit" headers={['operation','phase','labels','centers','SSE','fixed']} rows={fit.states.map((frame,i)=>[i,frame.phase,frame.labels?.join('')||'none',frame.centers.map(vector).join(' / '),frame.sse,String(frame.fixed)])}/>
  </Local>;
}
export function AssignmentChunks() {
  const [size,setSize]=useState(2),centers=[clusteringPoints[0],clusteringPoints[4]],result=clusteringPoints.map(row=>closest(row,centers));
  return <Local id="D20" question="Which temporary array does streaming one center avoid?" controls={<Numeric label="Rows per block B" value={size} onChange={setSize} min={1} max={6}/>} reset={()=>setSize(2)}
    readout={<>B={size} visits {Math.ceil(6/size)} blocks, including the last {6%size||size} rows. One B×2 difference workspace and B best distances/IDs preserve labels {result.map(row=>row.label).join('')}, SSE {number(sum(result.map(row=>row.distances[row.label])))}.</>}>
    <Table caption="Actual block schedule in the six-row assignment" headers={['block','source IDs','row matrix shape']} rows={Array.from({length:Math.ceil(6/size)},(_,i)=>[i,clusteringPoints.slice(i*size,(i+1)*size).map((_,j)=>`P${i*size+j}`).join(', '),`${Math.min(size,6-i*size)} × 2`])}/>
    <ArrayRow label="first B×2 row block" values={clusteringPoints.slice(0,size)}/><Arrow label="subtract one center row from the active block"/><ArrayRow label="C0 difference rows" values={clusteringPoints.slice(0,size).map(row=>row.map((value,j)=>value-centers[0][j]))}/>
    <ArrayRow label="current best distances after C0" values={result.slice(0,size).map(row=>row.distances[0])}/><Arrow label="C1 competes on strict improvement"/><ArrayRow label="final B best IDs" values={result.slice(0,size).map(row=>row.label)}/><ArrayRow label="final B minima" values={result.slice(0,size).map(row=>row.distances[row.label])}/>
  </Local>;
}
export function LengthBound() {
  const [x,setX]=useState(2),upper=Math.abs(x),lower=Math.abs(x-6),half=3,skip=upper<lower||upper<half;
  return <Local id="D21" question="When can an ordinary-length bound skip this candidate?" controls={<Numeric label="Row coordinate x" value={x} onChange={setX} min={0} max={6} step={.1}/>} reset={()=>setX(2)}
    readout={<>Upper {number(upper)} {skip?'passes':'fails'} the strict bound test against lower {number(lower)} or half separation 3. {skip?'The candidate calculation can be skipped from these valid bound operands.':'Measure the candidate, including the exact midpoint tie at x=3.'}</>}>
    <Axis values={[x]} centers={[0,6]} domain={[0,6]} title="Row, assigned C0 and candidate C1" edges={[{a:[x,0],b:[0,0],strong:true,color:'#8ab6ee'},{a:[0,0],b:[6,0]},{a:[x,0],b:[6,0],residual:true,color:'#efa0b4'}]}/>
    <ArrayRow label="bound operands (ordinary length)" values={[`u=${number(upper)}`,`l=${number(lower)}`,'half separation=3']}/><Arrow label="strict u<l OR u<half"/><Scalar label="Candidate operation" value={skip?'skip':'measure'}/>
    <Table caption="Separate truth comparison, not a hidden pruning computation" headers={['C0 exact length','C1 exact length','nearest under lower-ID ties']} rows={[[upper,lower,upper<=lower?'C0':'C1']]}/>
  </Local>;
}
export function RefreshBound() {
  const [candidate,setCandidate]=useState(3),[phase,setPhase]=useState('refreshed'),movement=Math.abs(candidate-6),lower=Math.max(0,4-movement),half=Math.abs(candidate)/2,exact=Math.abs(2-candidate),skip=2<lower||2<half;
  return <Local id="D22" question="Why does center motion require bound repair?" controls={<><Numeric label="Moved candidate C1" value={candidate} onChange={setCandidate} min={0} max={8} step={.1}/><Select label="Inspected operation" value={phase} onChange={setPhase} options={['refreshed','exact comparison']}/></>} reset={()=>{setCandidate(6);setPhase('refreshed');}}
    readout={<>C1 moved {number(movement)} from 6; lower bound 4 becomes {number(lower)}, half separation becomes {number(half)}. {skip?'A strict valid guard can skip.':`No skip: exact length ${number(exact)} ${exact<2?'beats':'does not beat'} C0 length 2; an exact tie keeps C0.`}</>}>
    <Axis values={[2]} centers={[0,candidate]} domain={[0,8]} title="Fixed row with a moved candidate" edges={[{a:[6,0],b:[candidate,0],strong:true,color:'#e2b55a'},{a:[2,0],b:[candidate,0],residual:true}]}/>
    <ArrayRow label="old lower and movement" values={[4,movement]}/><Arrow label="max(0, old lower − candidate movement)"/><ArrayRow label="repaired lower / assigned upper / new half" values={[lower,2,half]}/>
    {phase==='exact comparison'&&<ArrayRow label="tight exact candidate length / winning ID" values={[exact,exact<2?'C1':'C0']}/>}<Scalar label="Old lower=4" value="stale after motion; cannot justify a new skip"/>
  </Local>;
}

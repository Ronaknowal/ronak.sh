import { useId, useState } from 'react';
import { foundationEdges, graphAveragingTrace, graphEnergy, graphHarmonicInterpolation, graphMatrices, graphMatrixProduct, graphMatrixVector, graphNormalizations } from '../../data/graph-fundamentals-models.js';
import recorded from '../../data/graph-recorded-network.json';
import { FlowControls, FlowLab, FlowReadout } from './LessonFlow.jsx';
import { AnchorEnergyDrawing, EdgeSquares, GraphFigure, GraphMatrix, graphNumber as f, StationNetwork, stationLabels, WalkLayers } from './GraphFundamentalsDrawings.jsx';

const edges=foundationEdges(), values=[3,1,0,2,2], base=graphEnergy(5,edges,values);
const path=[[0,1,2],[1,2,1]], path3=['A','B','C'];
const normal=graphNormalizations(4,path);
const gcnA=[[1,0,0],[0,1,0],[0,0,1]].map((row,i)=>row.map((v,j)=>v+Number(Math.abs(i-j)===1)));
const gcnDegree=gcnA.map(row=>row.reduce((sum,x)=>sum+x,0));
const T=gcnA.map((row,i)=>row.map((v,j)=>v/Math.sqrt(gcnDegree[i]*gcnDegree[j])));
const X=[[1,0],[0,2],[1,1]], W=[[1,-1],[.5,1]], TX=graphMatrixProduct(T,X), TXW=graphMatrixProduct(TX,W);
const gcnOutput=TXW.map(row=>row.map(v=>Math.max(0,v)));

export function GraphLookupFigure() {
  return <GraphFigure label="One B adjacency row reads two neighboring values" caption="Solid arrows are lookups from B, rather than a claim that the undirected relationship became one-way.">
    <div className="gf-two"><StationNetwork edges={[[1,0,2],[1,2,1]]} labels={path3} values={[3,1,0]} selected={[0,1,2]} directed title="B looks toward A=3 with multiplier2 and C=0 with multiplier1."/>
      <GraphMatrix label="B source row × destination readings" rows={['A[B,j]','x[j]','products']} columns={path3} values={[[2,0,1],[3,1,0],[6,0,0]]} mark={(i,j)=>i===2 && j!==1}/></div>
    <p className="gf-exact">B output: 6+0=6. B's own reading contributes 0 because its diagonal adjacency cell is 0.</p>
  </GraphFigure>;
}
export function DirectedAggregationFigure() {
  const a=graphMatrices(3,path,true).adjacency, x=[3,1,0], transpose=a[0].map((_,j)=>a.map(row=>row[j]));
  return <GraphFigure label="Fixed arrows distinguish outgoing lookups from incoming sums" caption="The same weighted arrows and input values are held fixed for both operations; result vectors name their node coordinates.">
    <StationNetwork edges={path} labels={path3} values={x} directed title="Directed relation A→B weight 2 and B→C weight 1, input readings3,1,0."/>
    <div className="gf-two"><GraphMatrix values={graphMatrixVector(a,x).map(v=>[v])} label="Ax · outgoing lookup" rows={path3} columns={['result']}/><GraphMatrix values={graphMatrixVector(transpose,x).map(v=>[v])} label="Aᵀx · incoming sum" rows={path3} columns={['result']}/></div>
  </GraphFigure>;
}
export function WalkLayersFigure() {
  return <GraphFigure label="Two-step route and return on weighted A—B—C" caption="Vertices repeat across step lanes. A return is a walk that revisits its start; highlighted links are separate successive moves.">
    <div className="gf-two"><WalkLayers/><WalkLayers target={0}/></div>
  </GraphFigure>;
}
export function ComponentBlocksFigure() {
  const graph=graphMatrices(5,edges);
  return <GraphFigure label="Two disconnected components occupy separate adjacency and Laplacian blocks" caption="Both matrices use order A,B,C,D,E. Amber block outlines correspond to the drawn positive-edge components; cross-block cells remain 0.">
    <StationNetwork edges={edges} title="A-B-C and D-E are separate regions." groups={[{x:158,y:60,rx:145,ry:36},{x:158,y:164,rx:100,ry:35}]}/>
    <div className="gf-two"><GraphMatrix values={graph.adjacency} label="Adjacency A" block={(i,j)=>(i<3)===(j<3)}/><GraphMatrix values={graph.laplacian} label="Laplacian L" block={(i,j)=>(i<3)===(j<3)}/></div>
  </GraphFigure>;
}
export function LocalDisagreementDrawing({ signal = values }) {
  const local=graphEnergy(5,edges,signal);
  return <div className="gf-two"><StationNetwork edges={edges} values={signal} selected={[1]} title="Selected B reading is compared with A and C; D/E form a separate equal-valued region."/>
    <GraphMatrix label="Signed contributions at B" rows={['A edge','C edge','net B']} columns={['weighted difference']} values={[[2*(signal[1]-signal[0])],[signal[1]-signal[2]],[local.action[1]]]} mark={i=>i===2}/></div>;
}
export function LocalDisagreementFigure() {
  return <GraphFigure label="Signed B contributions −4 and 1 add to −3" caption="A signed local sum may cancel. It is different from the nonnegative energy drawn next."><LocalDisagreementDrawing/></GraphFigure>;
}
export function EdgeEnergyFigure() {
  return <GraphFigure label="Squared endpoint differences weighted by repeated equal-area squares" caption="Each square side uses the same scale. Coupling 2 is two copies, coupling 1 one copy; a zero difference has zero area. These are constructed readings and coupling units."><EdgeSquares/></GraphFigure>;
}
export function SignedIncidenceFigure() {
  return <GraphFigure label="Oriented endpoint connections populate signed incidence rows" caption="Each edge row connects its chosen tail +1 and head −1. This bookkeeping orientation does not turn the coupling into a directed relation.">
    <div className="gf-two"><StationNetwork edges={base.activeEdges} directed values={values} title="Arbitrary orientation A→B, B→C, D→E for the undirected couplings."/>
      <GraphMatrix values={base.incidence} label="C · edge rows × node columns" rows={['A→B','B→C','D→E']} columns={stationLabels.slice(0,5)} mark={(i,j)=>base.incidence[i][j]!==0}/></div>
  </GraphFigure>;
}
export function EdgeOuterProductFigure() {
  const forward=[1,-1], reverse=[-1,1];
  const outer=c=>c.map(a=>c.map(b=>2*a*b));
  return <GraphFigure label="An edge and its reversed incidence signs produce the same four Laplacian cells" caption="This is the A/B endpoint subgrid; all other entries contributed by this edge are 0. Both minus signs reverse together.">
    <div className="gf-two">{[forward,reverse].map((c,i)=><div key={i}><StationNetwork labels={['A','B']} positions={[[72,60],[248,60]]} edges={i ? [[1,0,2]] : [[0,1,2]]} directed title={`${i ? 'B→A' : 'A→B'} selected orientation; coupling 2.`}/>
      <GraphMatrix values={[c]} label={i ? 'Reversed incidence row' : 'Incidence row'} rows={['cₑ']} columns={['A','B']}/><GraphMatrix values={outer(c)} label="2cₑᵀcₑ" rows={['A','B']} columns={['A','B']} mark={()=>true}/></div>)}</div>
  </GraphFigure>;
}
export function ComponentKernelFigure() {
  const indicators=[[1,1,1,0,0,0],[0,0,0,1,1,0],[0,0,0,0,0,1]];
  return <GraphFigure label="Three component indicators have disjoint supports and zero Laplacian output" caption="F is an explicitly added isolate. Each graph uses the same vertices/edges; amber support marks one independent component-level direction.">
    <div className="gf-three">{indicators.map((v,i)=><div key={i}><StationNetwork edges={edges} labels={stationLabels} values={v} selected={v.flatMap((value,j)=>value ? [j] : [])} title={`Indicator ${i+1} is1 on its own component and0 elsewhere.`}/><p className="gf-exact">Lv = [0,0,0,0,0,0]</p></div>)}</div>
  </GraphFigure>;
}
export function CirculationFigure() {
  const triangle=[[0,1,1],[1,2,1],[2,0,1]], trianglePositions=[[50,66],[270,66],[160,208]];
  return <GraphFigure label="A closed flow cancels at every node; closing a tree adds one independent cycle" caption="Arrows encode an arbitrary unit edge flow. This circulation is not asserted to arise from potential differences.">
    <StationNetwork edges={triangle} labels={path3} positions={trianglePositions} directed edgeLabels={['flow1','flow1','flow1']} title="Unit flow A→B→C→A enters and leaves every node once."/>
    <GraphMatrix values={[[1,-1,0],[0,1,-1],[-1,0,1]]} label="C · triangle edge signs" rows={['A→B','B→C','C→A']} columns={path3}/>
    <p className="gf-exact">Each net outflow: 1−1=0. A tree on three vertices has2 edges and no circulation; adding its third edge closes this cycle and supplies one independent direction.</p>
  </GraphFigure>;
}
export function NormalizationScalesFigure() {
  return <GraphFigure label="Both endpoint degree factors scale a Laplacian cell, while an isolate has zero factor" caption="This smaller fixture is A—B—C plus isolated D. Endpoint multipliers have distinct row and column jobs.">
    <div className="gf-two"><StationNetwork edges={path} labels={stationLabels.slice(0,4)} values={normal.degrees} title="Weighted degrees2,3,1,0."/>
      <GraphMatrix values={normal.laplacian} label="L before scaling" rows={stationLabels.slice(0,4)} columns={stationLabels.slice(0,4)} mark={(i,j)=>i===1 && j===0}/></div>
    <GraphMatrix values={[normal.inverseRoot]} label="H diagonal · endpoint multipliers" rows={['1/√d']} columns={stationLabels.slice(0,4)}/>
    <p className="gf-exact">Cell B,A: (1/√3)×(−2)×(1/√2) = {f(normal.symmetric[1][0])}. D's factor 0 keeps its row and column 0.</p>
  </GraphFigure>;
}
export function ProbabilityTransportFigure() {
  const mass=[1,0,0,0], transpose=normal.transition[0].map((_,j)=>normal.transition.map(row=>row[j]));
  return <GraphFigure label="A transition row queries readings; its transpose transports column probability masses" caption="The left quantities are readings, the right quantities are probability masses. The isolate's separate unit stay entry conserves any mass initially placed there.">
    <div className="gf-two"><div><StationNetwork edges={[[1,0,2/3],[1,2,1/3]]} labels={path3} values={[3,1,0]} selected={[1]} directed title="B queries A/C readings with probabilities2/3 and 1/3."/><p className="gf-exact">(Px)B = (2/3)·3+(1/3)·0=2.</p></div>
      <div><StationNetwork edges={[[0,1,1],[3,3,1]]} labels={stationLabels.slice(0,4)} values={mass} directed title="Mass initially1 at A moves to B. An isolated D holds any mass there."/><GraphMatrix values={graphMatrixVector(transpose,mass).map(v=>[v])} label="Pᵀπ · arriving mass" rows={stationLabels.slice(0,4)} columns={['mass']}/></div></div>
  </GraphFigure>;
}
export function GraphLoopLab() {
  const [loop,setLoop]=useState(false), result=graphNormalizations(4,[...path,...(loop ? [[1,1,1]] : [])]);
  return <FlowLab id="graph-loop-normalization" label="Does a loop change the row normalization?">
    <div className="gf-two"><StationNetwork edges={result.activeEdges} labels={stationLabels.slice(0,4)} values={result.degrees} title="The optional B loop enters its row-sum degree once."/>
      <GraphMatrix values={[result.laplacian[1],result.transition[1]]} label="B rows of L and P" rows={['L[B,j]','P[B,j]']} columns={stationLabels.slice(0,4)} mark={(i,j)=>i===1 && j===1}/></div>
    <FlowControls><label><input type="checkbox" checked={loop} onChange={event=>setLoop(event.target.checked)}/> Unit loop at B</label><button type="button" onClick={()=>setLoop(false)}>Reset loop</button></FlowControls>
    <FlowReadout>B degree <strong>{result.degrees[1]}</strong>; its stay chance is <strong>{f(result.transition[1][1])}</strong>. The ordinary L row remains [−2,3,−1,0].</FlowReadout>
  </FlowLab>;
}
export function ConservativeExchangeFigure() {
  return <GraphFigure label="One pairwise transfer preserves total 6" caption="This constructed fixture switches to unit couplings A—B—C and isolated D=4. A transfers 1.5 to B at τ=.25; edge B—C initially transfers 0.">
    <div className="gf-two"><StationNetwork edges={[[0,1,1],[1,2,1]]} labels={stationLabels.slice(0,4)} values={[6,0,0,4]} title="Initial values6,0,0,4."/>
      <StationNetwork edges={[[0,1,1.5]]} edgeLabels={['transfer 1.5']} labels={stationLabels.slice(0,4)} values={[4.5,1.5,0,4]} selected={[0,1]} directed title="Completed exchange produces 4.5,1.5,0,4; A-B-C total stays 6."/></div>
  </GraphFigure>;
}
export function NeighborLazyFigure() {
  return <GraphFigure label="Neighbor averaging alternates while lazy averaging damps the pattern" caption="All snapshots use the same unit-edge path. Degrees beneath the calculation give the conserved weighted mean 1.5; the isolate stays 4.">
    {['neighbor','lazy'].map(method=><div className="gf-three" key={method}>{graphAveragingTrace(method,2).states.map((v,i)=><div key={i}><p>{method==='neighbor' ? 'Neighbor' : 'Half stay + half neighbor'} · step {i}</p><StationNetwork edges={[[0,1,1],[1,2,1]]} labels={stationLabels.slice(0,4)} values={v} title={`${method} step${i}: ${v.join(',')}.`}/></div>)}</div>)}
    <p className="gf-exact">Degree weights on A/B/C are 1,2,1. Initial weighted mean=(1×6+2×0+1×0)/4=1.5.</p>
  </GraphFigure>;
}
export function DiffusionModeFigure() {
  const v=[1,-2,1], L=graphMatrices(3,[[0,1,1],[1,2,1]]).laplacian;
  return <GraphFigure label="An eigenmode has Laplacian output 3 times its input and unstable step multiplier −1.25" caption="One mode is drawn on the actual three vertices; its scalar amplitudes are computed updates, not measured time.">
    <div className="gf-two"><StationNetwork labels={path3} edges={[[0,1,1],[1,2,1]]} values={v} title="Mode input1,-2,1."/><StationNetwork labels={path3} edges={[[0,1,1],[1,2,1]]} values={graphMatrixVector(L,v)} title="Laplacian output 3,-6,3 equals3v."/></div>
    <GraphMatrix label="τ=.75 · amplitude by update" rows={['amplitude']} columns={['0','1','2','3','4']} values={[[1,-1.25,1.5625,-1.953125,2.44140625]]}/>
  </GraphFigure>;
}
export function AnchorEnergyFigure() {
  return <GraphFigure label="Fixed A=6/C=0 leave a unique energy-minimizing B=4 and free D/E component" caption="Square outlines mark fixed boundary values, amber B is the estimate, and question marks are undetermined. The parabola has fixed axes; its minimum energy need not be 0.">
    <div className="gf-two"><StationNetwork edges={edges} values={[6,4,0,null,null]} anchors={[0,2]} selected={[1]} title="A=6 and C=0 anchor B=4; unanchored D/E have free level."/><AnchorEnergyDrawing/></div>
    <GraphMatrix label="Unknown B reduced equation" rows={['LBB','right side','B solution']} columns={['value']} values={[[3],[12],[4]]}/>
  </GraphFigure>;
}
export function GraphAnchorUniquenessLab() {
  const [bridge,setBridge]=useState(false),[anchor,setAnchor]=useState(false);
  const result=graphHarmonicInterpolation(5,foundationEdges(Number(bridge)),{0:6,2:0,...(anchor ? {3:2}:{})});
  return <FlowLab id="graph-component-anchors" label="Which change fixes a disconnected free level?">
    <StationNetwork edges={result.activeEdges} values={result.values} anchors={[0,2,...(anchor ? [3]:[])]} title="Unknown levels remain question marks until an anchor or positive bridge constrains them."/>
    <FlowControls><label><input type="checkbox" checked={bridge} onChange={e=>setBridge(e.target.checked)}/> C—D bridge</label><label><input type="checkbox" checked={anchor} onChange={e=>setAnchor(e.target.checked)}/> Fix D=2</label><button type="button" onClick={()=>{setBridge(false);setAnchor(false);}}>Reset component</button></FlowControls>
    <FlowReadout>{result.unique ? 'Every component is anchored; the solution is unique.' : 'D/E remain a free component-level constant.'} Values [{result.values.map(v=>f(v)).join(', ')}].</FlowReadout>
    <GraphMatrix values={result.residuals.map(v=>[v])} label="Lx · supported unknowns have zero outflow" rows={stationLabels.slice(0,5)} columns={['outflow']}/>
  </FlowLab>;
}
function BoundaryBranch({ changed=false }) {
  const id=`gf-hit-${useId().replaceAll(':','')}`;
  return <svg className="gf-scene" viewBox="0 0 320 264" role="img" aria-label={changed ? 'First-step routes from unknown V/W toward the absorbing boundaries U0 and Z1.' : 'Starting at B, first step reaches absorbing A with probability2/3 or absorbing C with probability1/3.'}>
    <defs><marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6z" fill="context-stroke"/></marker></defs>
    {changed ? <><path className="gf-selected-line" d="M75 60Q160 26 244 60" fill="none" markerEnd={`url(#${id})`}/><path className="gf-selected-line" d="M245 80Q160 118 77 80" fill="none" markerEnd={`url(#${id})`}/><path className="gf-edge-line" d="M54 90V172" markerEnd={`url(#${id})`}/><path className="gf-edge-line" d="M266 90V172" markerEnd={`url(#${id})`}/><text className="gf-label" x="160" y="25" textAnchor="middle">2/3 each way</text><text className="gf-label" x="72" y="137">1/3</text><text className="gf-label" x="225" y="137">1/3</text>
      {[[54,70,'V','2/5'],[266,70,'W','3/5'],[54,196,'U','0'],[266,196,'Z','1']].map(([x,y,label,value],i)=><g key={label}>{i>1 && <rect className="gf-fixed-outline" x={x-25} y={y-25} width="50" height="50"/>}<circle className="gf-vertex" cx={x} cy={y} r="20"/><text className="gf-label" x={x} y={y+6} textAnchor="middle">{label}</text><text className="gf-label gf-result-label" x={x} y={i>1 ? y+43 : 20} textAnchor="middle">h={value}</text></g>)}</>
      : <><circle className="gf-vertex is-selected" cx="160" cy="45" r="20"/><text className="gf-label" x="160" y="51" textAnchor="middle">B</text>
        <path className="gf-selected-line" d="M146 61L69 151" markerEnd={`url(#${id})`}/><path className="gf-edge-line" d="M174 61L251 151" markerEnd={`url(#${id})`}/>
        <text className="gf-label gf-halo" x="90" y="100" textAnchor="middle">2/3</text><text className="gf-label gf-halo" x="230" y="100" textAnchor="middle">1/3</text>
        {[[54,'A',1],[266,'C',0]].map(([x,label,h])=><g key={label}><rect className="gf-fixed-outline" x={x-25} y="151" width="50" height="50"/><circle className="gf-vertex" cx={x} cy="176" r="20"/><text className="gf-label" x={x} y="182" textAnchor="middle">{label}</text><text className="gf-label" x={x} y="226" textAnchor="middle">stop · h={h}</text></g>)}</>}
  </svg>;
}
export function BoundaryHitFigure() { return <GraphFigure label="First-hit probability conditions on the first step" caption="Square endpoints stop the walk; only B takes a next step here. Its hit-A probability is 2/3."><BoundaryBranch/></GraphFigure>; }
export function BoundaryPathFigure() { return <GraphFigure label="Two unknowns share first-step boundary equations" caption="This changed path has conductances 1,2,1. Fixed U=0/Z=1 define hitting probabilities, which scale to sensor boundary values 0/12."><BoundaryBranch changed/></GraphFigure>; }

export function TriangleNeighborhoodFigure() {
  return <GraphFigure label="A three-neighbor set has one present pair out of three possible pairs" caption="In the separate neighbor drawing, the solid B—C is present. Dotted B—D/C—D connectors are absent possibilities, not additional edges. E remains an isolate in the full graph.">
    <div className="gf-two"><StationNetwork edges={[[0,1,1],[1,2,1],[2,0,1],[0,3,1]]} selected={[0]} positions={[[44,110],[190,60],[246,180],[44,248],[278,280]]} title="Triangle A/B/C, leaf D joined only to A, and isolated E."/>
      <svg className="gf-scene" viewBox="0 0 320 270" role="img" aria-label="A neighbors B,C,D. B-C exists; B-D and C-D are absent possible pairs.">
        <line className="gf-selected-line" x1="81" y1="60" x2="239" y2="60"/><line className="gf-potential-line" x1="71" y1="77" x2="151" y2="213"/><line className="gf-potential-line" x1="249" y1="77" x2="169" y2="213"/>
        {[[60,60,'B'],[260,60,'C'],[160,232,'D']].map(([x,y,label])=><g key={label}><circle className="gf-vertex" cx={x} cy={y} r="20"/><text className="gf-label" x={x} y={y+6} textAnchor="middle">{label}</text></g>)}
        <text className="gf-label" x="160" y="43" textAnchor="middle">present</text><text className="gf-label" x="58" y="151">absent</text><text className="gf-label" x="214" y="151">absent</text>
      </svg></div><p className="gf-exact">One connected neighbor pair / three possible pairs = 1/3.</p>
  </GraphFigure>;
}
export function TriangleWalkFigure() {
  const triangle=[[0,1,1],[1,2,1],[2,0,1]];
  return <GraphFigure label="Three possible starts and two directions give six closed triangle walks" caption="The clockwise and anticlockwise arrows traverse the same undirected triangle. Every listed route returns to its starting vertex in three steps.">
    <div className="gf-two">{[triangle,triangle.map(([u,v,w])=>[v,u,w])].map((route,i)=><StationNetwork key={i} edges={route} labels={path3} positions={[[160,45],[45,196],[275,196]]} directed edgeLabels={['','','']} selected={path3.map((_,j)=>j)} title={`${i ? 'Reverse' : 'Forward'} triangle cycle.`}/>)}</div>
    <p className="gf-exact">A→B→C→A; B→C→A→B; C→A→B→C.<br/>A→C→B→A; C→B→A→C; B→A→C→B.</p>
  </GraphFigure>;
}
export function GcnNodeMixFigure() {
  return <GraphFigure label="Graph mixing acts on node rows, preserving each input-feature column" caption="Each bracket beside a node is its two input features. A unit loop lets that row use itself. T and TX entries are rounded to six decimals.">
    <div className="gf-two"><StationNetwork edges={[[0,1,1],[1,2,1],[0,0,1],[1,1,1],[2,2,1]]} labels={path3} values={X.map(row=>`[${row.join(',')}]`)} selected={[1]} title="Three nodes each carry two input feature coordinates; loops enter degrees2,3,2."/>
      <GraphMatrix values={T} label="T · node source row × node feature row" rows={path3} columns={path3} mark={i=>i===1} digits={6}/></div>
    <div className="gf-two"><GraphMatrix values={X} label="X · node rows × input features" rows={path3} columns={['f0','f1']}/><GraphMatrix values={TX} label="TX · node-mixed features" rows={path3} columns={['f0','f1']} mark={i=>i===1} digits={6}/></div>
  </GraphFigure>;
}
export function GcnChannelMixFigure() {
  const id=`gf-channels-${useId().replaceAll(':','')}`;
  return <GraphFigure label="Two input-feature contributions add into each output channel at the same B node" caption="W is a fixed supplied coefficient table. It mixes channels at each node; it does not add graph connections. All entries are rounded to six decimals.">
    <svg className="gf-scene" viewBox="0 0 320 238" role="img" aria-label="At B, both node-mixed input coordinates feed each output channel: f0 weights1 and−1, f1 weights.5 and 1."><defs><marker id={id} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6z" fill="context-stroke"/></marker></defs>
      <path className="gf-selected-line" d="M82 60H237" markerEnd={`url(#${id})`}/><path className="gf-selected-line" d="M80 153L240 73" markerEnd={`url(#${id})`}/><path className="gf-edge-line" d="M82 166H237" markerEnd={`url(#${id})`}/><path className="gf-edge-line" d="M80 73L240 153" markerEnd={`url(#${id})`}/>
      {[[62,60,'f0'],[62,166,'f1'],[260,60,'g0'],[260,166,'g1']].map(([x,y,label])=><g key={label}><circle className="gf-vertex" cx={x} cy={y} r="20"/><text className="gf-label" x={x} y={y+6} textAnchor="middle">{label}</text></g>)}
      {[[160,47,'×1'],[160,97,'×−1'],[160,143,'×0.5'],[160,191,'×1']].map(([x,y,text])=><text key={text+y} className="gf-label gf-halo" x={x} y={y} textAnchor="middle">{text}</text>)}
      <text className="gf-label" x="10" y="226" textAnchor="start">B input features</text><text className="gf-label" x="310" y="226" textAnchor="end">B output channels</text>
    </svg>
    <GraphMatrix values={W} label="W · input-feature rows × output-channel columns" rows={['f0','f1']} columns={['g0','g1']}/>
    <div className="gf-two">{[0,1].map(j=><GraphMatrix key={j} label={`B output channel g${j}`} rows={['from f0','from f1','sum']} columns={['contribution']} values={[[TX[1][0]*W[0][j]],[TX[1][1]*W[1][j]],[TXW[1][j]]]} mark={i=>i===2} digits={6}/>)}</div>
  </GraphFigure>;
}
export function GcnOutputFigure() {
  return <GraphFigure label="ReLU acts on each resulting feature; the three output rows stay attached to their nodes" caption="Both channels in this fixture are positive and survive ReLU. The small scalar example −1→0 illustrates the clipping rule separately; it is not an invented negative entry in this layer.">
    <div className="gf-two"><StationNetwork labels={path3} edges={[[0,1,1],[1,2,1]]} values={gcnOutput.map(row=>row.map(v=>f(v,4)))} title="The original graph now carries the two computed output channels per node; stacked values are g0 then g1."/>
      <GraphMatrix values={gcnOutput} label="ReLU(TXW) · node × output channel" rows={path3} columns={['g0','g1']} digits={6}/></div>
    <p className="gf-exact">Componentwise max(0,z): −1→0; B output channel g1: 0.258418→0.258418.</p>
  </GraphFigure>;
}
export function SparseRowFigure() {
  const adjacency=graphMatrices(4,[[0,1,1],[0,1,1],[1,2,1]]).adjacency;
  return <GraphFigure label="Duplicate edge records combine into cells and compressed row segments" caption="CSR data/indices contain four nonzeros, while indptr has five row boundaries. Row 3 is retained and empty; zero cells are never stored in data.">
    <div className="gf-two"><GraphMatrix label="Undirected edge records" rows={['record 0','record 1','record 2']} columns={['u','v','weight']} values={[[0,1,1],[0,1,1],[1,2,1]]}/><GraphMatrix label="Summed adjacency cells" rows={['0','1','2','3']} columns={['0','1','2','3']} values={adjacency} mark={(i,j)=>(i===0 && j===1)||(i===1 && j===0)}/></div>
    <svg className="gf-scene gf-csr" viewBox="0 0 360 290" role="img" aria-label="CSR row0 owns offset0; row1 offsets1 and2; row2 offset3; row3 empty. indptr0,1,3,4,4; indices1,0,2,1; data2,2,1,1.">
      {[0,1,2,3,4].map((offset,i)=><g key={i}><line className="gf-edge-line" x1={142+44*i} x2={142+44*i} y1="181" y2="230"/><text className="gf-label" x={142+44*i} y="253" textAnchor="middle">{offset}</text></g>)}
      {[0,1,2,3].map(i=><g key={i}><rect className="gf-array-cell" x={142+44*i} y="181" width="44" height="49"/><text className="gf-label" x={164+44*i} y="205" textAnchor="middle">j={[1,0,2,1][i]}</text><text className="gf-label" x={164+44*i} y="224" textAnchor="middle">a={[2,2,1,1][i]}</text></g>)}
      {[[0,0,1],[1,1,3],[2,3,4],[3,4,4]].map(([row,start,end],i)=><g key={row}><text className="gf-tick" x="8" y={28+36*i}>row {row} [{start},{end}){row===3 ? ' empty':''}</text><path className="gf-construction" fill="none" d={`M132 ${22+36*i}H${142+44*start}V176`}/></g>)}
    </svg>
    <GraphMatrix label="indptr · row boundaries" rows={['offset']} columns={['row0','row1','row2','row3','end']} values={[[0,1,3,4,4]]}/>
    <p className="gf-exact">For x=[3,1,0,4], row 0 of Lx reads its one stored neighbor: 2(3−1)=4.</p>
  </GraphFigure>;
}

const measuredDegrees=recorded.nodeOrder.map(node=>recorded.weightedEdges.reduce((sum,[u,v])=>sum+Number(u===node || v===node),0));
const measuredStrengths=recorded.nodeOrder.map(node=>recorded.weightedEdges.reduce((sum,[u,v,w])=>sum+((u===node || v===node) ? w:0),0));
const neighbors0=recorded.weightedEdges.flatMap(([u,v])=>u===0 ? [v] : v===0 ? [u] : []).sort((a,b)=>a-b);
export function RecordedNetworkFigure() {
  return <GraphFigure label="All thirty-four observed equal-tie degrees and the selected node 0 CSR row" caption="Each bar comes from the frozen NetworkX 3.6.1 edge carrier. Both bar plots use the same 0–18 scale. Node 0 is selected amber; the exact complete table and neighbor list remain visible.">
    <div className="gf-two">{[0,17].map(start=><svg className="gf-degree-scene" key={start} viewBox="0 0 360 278" role="img" aria-label={`Recorded unweighted degrees for nodes${start}–${start+16}; exact values in the visible table.`}>
      <path className="gf-axis" d="M37 30V215H341"/>
      {[0,9,18].map(d=><g key={d}><line className="gf-grid" x1="37" x2="341" y1={215-d*10} y2={215-d*10}/><text className="gf-tick" x="30" y={220-d*10} textAnchor="end">{d}</text></g>)}
      {measuredDegrees.slice(start,start+17).map((d,i)=><rect className={start+i===0 ? 'gf-degree-mark is-selected' : 'gf-degree-mark'} key={i} x={42+17.6*i} y={215-d*10} width="10" height={d*10}/>)}
      {[0,8,16].map(i=><text className="gf-tick" key={i} x={47+17.6*i} y="239" textAnchor="middle">{start+i}</text>)}
      <text className="gf-label" x="38" y="20">equal-tie degree</text><text className="gf-label" x="185" y="269" textAnchor="middle">member node index</text>
    </svg>)}</div>
    <GraphMatrix label="Node 0 CSR excerpt · first 4 of 16 stored cells" rows={['column index','unit value']} columns={['offset 0','offset 1','offset 2','offset 3']} values={[neighbors0.slice(0,4),[1,1,1,1]]}/>
    <p className="gf-exact">Row 0 spans CSR offsets [0,16). Full neighbors: [{neighbors0.join(', ')}].</p>
    <div className="gf-two">{[0,17].map(start=><GraphMatrix key={start} label={`Observed node degrees ${start}–${start+16}`} rows={recorded.nodeOrder.slice(start,start+17).map(String)} columns={['ties','context strength']} values={measuredDegrees.slice(start,start+17).map((d,i)=>[d,measuredStrengths[start+i]])} mark={i=>start+i===0}/>)}</div>
  </GraphFigure>;
}

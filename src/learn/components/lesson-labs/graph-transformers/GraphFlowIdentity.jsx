import React,{createContext,useContext,useState} from 'react';
import {Scene,Value,Operation,Wire,Matrix,Graph,Controls,Numeric,Select,number,useDrawingSpace} from './GraphFlowFigures.jsx';
import {PointPlot} from './GraphFlowGeometry.jsx';
import * as m from '../../../data/geometric-graph-models.js';

const IdentityContext=createContext(null);
const initial=()=>({bias:1,node:0,channel:0,features:[[1,2],[0,1],[2,-1]],layout:0,reversed:false,rewired:false,physical:1,revision:0});
export function IdentityProvider({children}){
  const [state,set]=useState(initial);
  const update=(key,value)=>set(old=>({...old,[key]:typeof value==='function'?value(old[key]):value}));
  const reset=()=>set(old=>({...initial(),revision:old.revision+1}));
  return <IdentityContext.Provider value={{state,update,reset}}>{children}</IdentityContext.Provider>;
}
function useIdentity(){return useContext(IdentityContext);}
export function NeuronView(){
  const {state,update,reset}=useIdentity(),z=.5-2+state.bias,compact=useDrawingSpace()<300;
  return <><Scene id="D01" title="Two products and a bias produce one gated scalar" width={compact?220:320} height={compact?690:535}>
    {marker=>compact?<>
      <Value x={45} y={35} value={1} tone="input"/><text x={15} y={82}>h₁</text><Value x={165} y={35} value={2} tone="input"/><text x={140} y={82}>h₂</text>
      <text x={10} y={111} fill="#e4b752">w₁=.5</text><text x={100} y={111} fill="#e4b752">w₂=−1</text>
      {["M45 62H85V154H71","M165 62H210V154H191"].map(d=><path key={d} d={d} fill="none" stroke="#b8b9bf" markerEnd={`url(#${marker})`}/>)}
      <Operation x={20} y={131} width={50} label="×"/><Operation x={140} y={131} width={50} label="×"/>
      <text x={25} y={216}>.5</text><text x={145} y={216}>−2</text>
      {["M45 178H85V241H95V266","M165 178H210V241H125V266"].map(d=><path key={d} d={d} fill="none" stroke="#b8b9bf" markerEnd={`url(#${marker})`}/>)}
      <Operation x={70} y={269} width={80} label="sum"/><Value x={30} y={348} value={state.bias} label="bias" tone="parameter"/><Wire from={[50,330]} to={[80,313]} marker={marker}/>
      <Wire from={[110,316]} to={[110,388]} marker={marker}/><Value x={110} y={415} value={z}/><text x={15} y={463}>z</text>
      <Wire from={[110,442]} to={[110,496]} marker={marker}/><Operation x={65} y={499} width={90} label="ReLU"/>
      <Wire from={[110,546]} to={[110,596]} marker={marker}/><Value x={110} y={622} value={Math.max(0,z)} label="output"/>
    </>:<>
      <Value x={65} y={36} value={1} tone="input"/><text x={25} y={83}>h₁</text><Value x={250} y={36} value={2} tone="input"/><text x={212} y={83}>h₂</text>
      <Wire from={[65,62]} to={[65,123]} marker={marker}/><Wire from={[250,62]} to={[250,123]} marker={marker}/>
      <text x={10} y={108} fill="#e4b752">w₁=.5</text><text x={175} y={108} fill="#e4b752">w₂=−1</text>
      <Operation x={40} y={125} width={50} label="×"/><Operation x={225} y={125} width={50} label="×"/>
      <Wire from={[65,171]} to={[108,225]} marker={marker}/><Wire from={[250,171]} to={[205,225]} marker={marker}/>
      <text x={30} y={204}>.5</text><text x={248} y={204}>−2</text>
      <Operation x={112} y={228} width={86} label="sum"/><Value x={45} y={248} value={state.bias} label="bias" tone="parameter"/>
      <Wire from={[69,248]} to={[110,248]} marker={marker}/>
      <Wire from={[155,274]} to={[155,320]} marker={marker}/><Value x={155} y={346} value={z} label="z"/>
      <Wire from={[179,346]} to={[215,346]} marker={marker}/><Operation x={218} y={324} width={92} label="ReLU"/>
      <Wire from={[265,370]} to={[265,425]} marker={marker}/><Value x={265} y={451} value={Math.max(0,z)} label="output"/>
    </>}
  </Scene><Controls><Select label="Learned bias to inspect" value={state.bias} onChange={v=>update('bias',+v)} options={[[1,'bias 1'],[2,'bias 2']]}/></Controls><button onClick={reset}>Reset identity examples</button></>;
}
export function SharedLayerView(){
 const {state,update}=useIdentity(),w=[[.5,-1],[1,.5]],b=[1,-1],output=state.features.map(row=>w.map((weights,i)=>Math.max(0,m.dot(weights,row)+b[i])));
 return <><Scene id="D02" title="One W₂×₂ and b₂ branch to every node row" width={220} height={930}>{marker=><>
 <text x={10} y={25} fill="#e4b752">W₂×₂, b₂: 6 parameters</text>
 {state.features.map((row,i)=><g key={i} transform={`translate(0 ${300*i})`}>
 <text x={10} y={65}>node {i}: two inputs</text><Value x={55} y={105} value={row[0]} tone="input"/><Value x={165} y={105} value={row[1]} tone="input"/>
 <Wire from={[55,129]} to={[90,157]} marker={marker}/><Wire from={[165,129]} to={[130,157]} marker={marker}/>
 <Operation x={65} y={160} width={90} label="W,b,ReLU"/><Wire from={[90,207]} to={[55,244]} marker={marker}/><Wire from={[130,207]} to={[165,244]} marker={marker}/>
 <Value x={55} y={269} value={output[i][0]}/><Value x={165} y={269} value={output[i][1]}/>
 </g>)}</>}</Scene><Controls><Select label="Node row" value={state.node} onChange={v=>update('node',+v)} options={[0,1,2].map(v=>[v,`node ${v}`])}/><Select label="Scalar feature channel" value={state.channel} onChange={v=>update('channel',+v)} options={[[0,'channel 0'],[1,'channel 1']]}/><Numeric label={`Node ${state.node} channel ${state.channel}`} value={state.features[state.node][state.channel]} min={-4} max={4} revision={state.revision} onChange={v=>update('features',old=>old.map((row,i)=>row.map((x,j)=>i===state.node&&j===state.channel?v:x)))}/></Controls>
 <Matrix title="Input H: independently editable scalar rows" values={state.features} columns={['input 0','input 1']}/><Matrix title="Shared learned W (output rows, input columns)" values={w}/><Matrix title="Shared bias" values={[b]}/><Matrix title="Actual rowwise H′ = ReLU(HWᵀ + b)" values={output} columns={['output 0','output 1']}/></>;
}

export function LayoutView(){
  const {state,update}=useIdentity(),a=m.adjacency(3,[[0,1],[1,2]]),positions=[[80,100],[210+70*state.layout,175],[335,100]];
  return <><Graph id="D03" title="Display coordinates move; the path and H stay fixed" a={a} positions={positions}/><Controls><Numeric label="Display layout offset" value={state.layout} min={-.5} max={.5} revision={state.revision} onChange={v=>update('layout',v)}/></Controls><p>H and A are unchanged by the layout edit. Offset {number(state.layout)} affects only the drawing positions.</p></>;
}
export function RelabelView(){
  const {state,update,reset}=useIdentity(),a=m.adjacency(3,state.rewired?[[0,2],[1,2]]:[[0,1],[1,2]]),order=state.reversed?[2,1,0]:[0,1,2],stored=order.map(i=>order.map(j=>a[i][j]));
  return <><Graph id="D04" title="Semantic edge IDs survive a storage permutation" a={a}/><button onClick={()=>update('reversed',v=>!v)}>Reverse both storage axes</button><button onClick={()=>update('rewired',v=>!v)}>Replace 0–1 with 0–2</button><button onClick={reset}>Reset identity examples</button><Matrix title="Stored A: receiver rows / donor columns follow the same IDs" values={stored} rows={order} columns={order}/><Matrix title="Stored H follows semantic nodes too" values={order.map(i=>state.features[i])} rows={order} columns={['scalar 0','scalar 1']}/></>;
}
export function PhysicalInputView(){const{state,update}=useIdentity(),points=[[0,0,0],[state.physical,0,0],[0,1,0]];return <><PointPlot id="D05" title="Moving measured point 1 changes a geometric quantity" points={points} connectPairs={false}/><p>Current squared distance d₀₁²={number(state.physical**2)}. The measured points are independent of the unchanged path edges and display-layout control.</p><Controls><Numeric label="Point 1 physical x" value={state.physical} min={-4} max={4} revision={state.revision} onChange={v=>update('physical',v)}/></Controls><Matrix title="Measured X (independent of topology/layout)" values={points} columns={['x','y','z']}/></>;}

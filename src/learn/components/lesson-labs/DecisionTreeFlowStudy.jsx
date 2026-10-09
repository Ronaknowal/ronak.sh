import { useEffect, useRef, useState } from 'react';
import { FlowLab, FlowControls, FlowReadout, flowNumber } from './LessonFlow.jsx';
import { LessonTable } from './LessonElements.jsx';
import { TreeSelect, TreeReset } from './DecisionTreeFlowLabs.jsx';
import { TreeDrawing, TreeLabel, TreeValue, TreeWire, treeColors } from './DecisionTreeFlowDrawings.jsx';

function route(tree, row) {
  const path=[]; let node=0;
  while(tree.children_left[node]!==-1) {
    const feature=tree.feature[node], value=Math.fround(row[feature]), threshold=tree.threshold[node];
    const left=value<=threshold;
    path.push({node,feature,value,threshold,left});
    node=left?tree.children_left[node]:tree.children_right[node];
  }
  const distribution=tree.value[node][0]; const total=distribution[0]+distribution[1];
  return {path,node,probability:distribution[1]/total,count:tree.n_node_samples[node]};
}

export function WdbcStudy() {
  const anchor=useRef(null), [near,setNear]=useState(false), [data,setData]=useState(null), [error,setError]=useState(false), [attempt,setAttempt]=useState(0);
  const [caseIndex,setCaseIndex]=useState(0), [modelIndex,setModelIndex]=useState(null), [memberIndex,setMemberIndex]=useState(0);
  useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setNear(true);observer.disconnect();}},{rootMargin:'600px'});observer.observe(anchor.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    if(!near)return;
    const controller=new AbortController();setError(false);
    fetch('/learn-assets/decision-trees/decision-tree-wdbc-models.json',{signal:controller.signal}).then(response=>{if(!response.ok)throw Error('data');return response.json();}).then(value=>{if(!value.models?.length||value.features?.length!==30)throw Error('schema');setData(value);}).catch(()=>{if(!controller.signal.aborted)setError(true);});
    return()=>controller.abort();
  },[near,attempt]);
  if(!data)return <div ref={anchor} className="decision-tree-study">{error?<p role="alert">The saved experiment could not load. <button type="button" onClick={()=>setAttempt(value=>value+1)}>Retry saved experiment</button></p>:<p role="status">{near?'Loading the saved WDBC experiment…':'The saved experiment loads as you reach it.'}</p>}</div>;
  const model=data.models[modelIndex??data.selected], member=Math.min(memberIndex,model.trees.length-1);
  const id=data.splits.test[caseIndex], row=data.X[id];
  const routes=model.trees.map(tree=>route(tree,row)), current=routes[member];
  const mean=routes.reduce((a,b)=>a+b.probability,0)/routes.length;
  return <FlowLab id="tree-wdbc-study" label="Inspect an actual saved thirty-feature test case and member route">
    <LessonTable caption="Measured validation log loss; selection used only these values" headers={['Candidate','Validation log loss','Selected']} rows={data.reports.map((report,i)=>[report.name,flowNumber(report.validationLogLoss,6),i===data.selected?'Yes':''])}/>
    <TreeDrawing name="tree-wdbc-actual-member-route" width={420} height={145+current.path.length*147} description="One actual member's saved path in the thirty-feature space; all coordinates are listed below">
      {current.path.map((step,i)=><g key={step.node}>
        <TreeWire points={[[210,102+i*147],[210,113+i*147]]}/><TreeWire points={[[210,150+i*147],[210,173+i*147]]}/>
        <rect x={23} y={26+i*147} width={374} height={76} fill="#050505" stroke={treeColors.parameter}/>
        <TreeLabel x={210} y={54+i*147} role="parameter">{data.features[step.feature]}</TreeLabel>
        <TreeLabel x={210} y={84+i*147} role="parameter">≤ {flowNumber(step.threshold,6)}?</TreeLabel>
        <TreeLabel x={210} y={140+i*147} role="input">value {flowNumber(step.value,6)} → {step.left?'yes':'no'}</TreeLabel>
      </g>)}
      <TreeValue x={210} y={49+current.path.length*147} width={290}>leaf {current.node}: p(1) {flowNumber(current.probability,6)}</TreeValue>
      <TreeLabel x={210} y={110+current.path.length*147}>leaf unique training rows: {current.count}</TreeLabel>
    </TreeDrawing>
    <FlowControls>
      <TreeSelect name="Saved test row ID" value={caseIndex} onChange={value=>setCaseIndex(Number(value))} options={data.splits.test.map((id,i)=>[i,id])}/>
      <TreeSelect name="Saved model" value={modelIndex??data.selected} onChange={value=>{setModelIndex(Number(value));setMemberIndex(old=>Math.min(old,data.models[Number(value)].trees.length-1));}} options={data.models.map((model,i)=>[i,model.name])}/>
      <TreeSelect name="Saved member index" value={member} onChange={value=>setMemberIndex(Number(value))} options={model.trees.map((_,i)=>[i,i+1])}/>
    </FlowControls>
    <TreeReset onReset={()=>{setCaseIndex(0);setModelIndex(null);setMemberIndex(0);}} />
    <FlowReadout>Row {id}: observed {data.y[id]?'malignant (1)':'benign (0)'}. Member {member+1} gives {flowNumber(current.probability,6)}; all {routes.length} member probabilities average to <strong>{flowNumber(mean,6)}</strong>, deciding class {Number(mean>.5)}. The displayed path is one member cutaway of the full thirty-feature model.</FlowReadout>
    <LessonTable caption="Every measurement in the saved query, before the library float32 cast" headers={['Feature','Value']} rows={data.features.map((name,i)=>[name,String(row[i])])}/>
    <LessonTable caption="Saved selected-model final test report; class order [benign 0, malignant 1]" headers={['Quantity','Value']} rows={Object.entries(data.testReport).map(([name,value])=>[name,Array.isArray(value)?JSON.stringify(value):flowNumber(value,6)])}/>
  </FlowLab>;
}

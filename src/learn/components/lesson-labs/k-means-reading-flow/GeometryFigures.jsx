import React, { useState } from 'react';
import { Local, Plot, Table, Numeric, Select, ArrayRow, Arrow, Scalar, Members, Axis, Bars, vector, number } from './Drawing.jsx';
import { clusteringPoints, faithfulPoints, hierarchyTrace, cutHierarchy, featureGeometry, squared, sum, mean, scatter } from './models.js';

export function Observation() {
  const [row,setRow]=useState(0), point=faithfulPoints[row];
  return <Local id="D01" question="Which cells belong to one observation?" controls={<Numeric label="Observed row ID" value={row} onChange={setRow} min={0} max={271}/>} reset={()=>setRow(0)}
    readout={<>Row {row} supplies duration {number(point[0])} and later wait {point[1]} minutes. Its ID is outside the feature vector; a future wait is not available at query time.</>}>
    <ArrayRow label={`Observation ID ${row}`} values={[`duration ${point[0]} min`,`wait ${point[1]} min`]}/>
    <Arrow label="two measurement cells → one plotted point"/>
    <Plot points={faithfulPoints} selected={row} projectionLines showRows={false} independentAxes title="272 observed geyser records" units={['duration (min)','later wait (min)']}/>
  </Local>;
}
export function PartitionAndTree() {
  const [count,setCount]=useState(2), tree=hierarchyTrace(clusteringPoints), cut=cutHierarchy(tree,'count',count),flat=cutHierarchy(tree,'count',2);
  return <Local id="D02" question="What does a flat partition keep that a tree also organizes?" controls={<Numeric label="Leaf-group count" value={count} onChange={setCount} min={1} max={6}/>} reset={()=>setCount(2)}
    readout={<>The tree's same six IDs form {count} current groups after {6-count} joins. The flat comparison keeps its two groups and their representatives fixed; the tree also records nested join history.</>}>
    <div className="km-lanes"><div><Plot points={clusteringPoints} centers={flat.groups.map(group=>mean(group.map(i=>clusteringPoints[i])))} labels={flat.labels} title="Fixed two-group representatives"/><Members groups={flat.groups}/></div>
      <div><TreePreview tree={tree} prefix={6-count}/><Members groups={cut.groups}/></div></div>
    <Table caption="The same literal identities in both grouping objects" headers={['Source row','flat membership','tree leaf','current tree group']} rows={clusteringPoints.map((_,id)=>[`P${id}`,`C${flat.labels[id]}`,`leaf P${id}`,cut.labels[id]])}/>
  </Local>;
}
import { Tree as TreePreview } from './Drawing.jsx';
export function CoordinateLength() {
  const [x,setX]=useState(3),[y,setY]=useState(4), distance=Math.hypot(x,y), origin=[0,0], q=[x,y], corner=[x,0];
  return <Local id="D03" question="How do two coordinate differences become one length?" controls={<><Numeric label="Query x" value={x} onChange={setX} min={-5} max={5} step={.25}/><Numeric label="Query y" value={y} onChange={setY} min={-5} max={5} step={.25}/></>} reset={()=>{setX(3);setY(4);}}
    readout={<>The coordinate legs contribute {number(x*x)}+{number(y*y)}={number(x*x+y*y)} squared units; their ordinary length is {number(distance)}. Zero differences remain zero.</>}>
    <Plot points={[origin]} query={q} edges={[{a:origin,b:corner,color:'#8ab6ee',strong:true},{a:corner,b:q,color:'#efa0b4',strong:true},{a:origin,b:q,color:'#e2b55a',strong:true}]} polygons={[[[0,0],[x,0],[x,-Math.abs(x)],[0,-Math.abs(x)]],[[x,0],[x,y],[x+Math.abs(y),y],[x+Math.abs(y),0]]]} polygonLabels={[{at:[x/2,-Math.abs(x)/2],area:x*x,color:'#8ab6ee'},{at:[x+Math.abs(y)/2,y/2],area:y*y,color:'#efa0b4'}]} title="Coordinate legs, attached square areas and the direct segment"/>
    <p>Blue and rose numerals label the corresponding square areas. A zero leg has zero area and its square collapses; the numerical contribution remains visible below.</p>
    <Bars maximum={50} title="Component square areas, common squared-unit scale" rows={[{label:'x square',value:x*x,color:'#8ab6ee'},{label:'y square',value:y*y,color:'#efa0b4'}]}/>
    <Arrow label="add squares → square root"/><Scalar label="Squared length" value={x*x+y*y}/><Scalar label="Ordinary length" value={distance}/>
  </Local>;
}
export function SquaredTriangle() {
  const [middle,setMiddle]=useState(1), left=middle,right=2-middle;
  return <Local id="D04" question="Does squaring preserve the triangle inequality?" controls={<Numeric label="Middle coordinate" value={middle} onChange={setMiddle} min={0} max={2} step={.1}/>} reset={()=>setMiddle(1)}
    readout={<>Ordinary lengths satisfy 2≤{number(left)}+{number(right)}=2. Squared direct length 4 {4>left*left+right*right?'>':'='} {number(left*left+right*right)}; squared length is not the triangle-bound operand.</>}>
    <Axis values={[0,middle,2]} ids={['left 0','middle','right 2']} domain={[0,2]} title="Collinear path and direct edge" edges={[{a:[0,0],b:[2,0],strong:true},{a:[0,0],b:[middle,0],color:'#8ab6ee'},{a:[middle,0],b:[2,0],color:'#efa0b4'}]}/>
    <ArrayRow label="path lengths" values={[left,right]}/><ArrayRow label="path squares" values={[left*left,right*right]}/>
  </Local>;
}
export function FeatureUnits() {
  const [unit,setUnit]=useState(1),[weight,setWeight]=useState(1), model=featureGeometry(unit,weight);
  return <Local id="D05" question="Which geometry changes when a coordinate unit changes?" controls={<><Select label="Vertical unit multiplier" value={unit} onChange={value=>setUnit(Number(value))} options={[[1,'1'],[10,'10']]}/><Numeric label="Squared vertical weight" value={weight} onChange={setWeight} min={.01} max={4} step={.01}/></>} reset={()=>{setUnit(1);setWeight(1);}}
    readout={<>Vertical ruler multiplier is {number(model.effective)}=u√w. The best of all seven two-group partitions has error {number(model.sse)}; at u=10,w=.01 the original contribution is restored.</>}>
    <ArrayRow label="Metric transformation" values={['x',`y × ${unit} × √${number(weight)}`]}/><Arrow label="apply the same ruler to every row"/>
    <div className="km-lanes"><Plot points={featureGeometry(1,1).points} centers={featureGeometry(1,1).centers} labels={featureGeometry(1,1).labels} ids={['R0','R1','R2','R3']} title="Original rectangle and its exact minimum"/><Plot points={model.points} centers={model.centers} labels={model.labels} ids={['R0','R1','R2','R3']} title="Transformed rectangle and its exact minimum"/></div>
    <Table caption="All seven nonempty partitions; exact enumeration" headers={['Groups by row ID','SSE']} rows={model.partitions.map(partition=>[partition.groups.map(group=>group.map(i=>`R${i}`).join(',')).join(' / '),partition.sse])}/>
  </Local>;
}
export function TrainingScale() {
  const [x,setX]=useState(5),[y,setY]=useState(20);
  const rows=[[2,10],[4,20],[9,31]], average=[5,61/3], variance=[26/3,662/9], scale=variance.map(Math.sqrt), query=[x,y], z=query.map((value,i)=>(value-average[i])/scale[i]);
  return <Local id="D06" question="Which values may a held-out row change?" controls={<><Numeric label="Held-out x" value={x} onChange={setX} min={-10} max={50} step={.5}/><Numeric label="Held-out y" value={y} onChange={setY} min={-50} max={100} step={.5}/></>} reset={()=>{setX(5);setY(20);}}
    readout={<>The held-out row becomes {vector(z)}. Mean {vector(average)} and population scale {vector(scale)} stay fixed because only the three training rows fit them.</>}>
    <Table caption="Training-owned feature cells" headers={['ID','x','y']} rows={rows.map((row,i)=>[`T${i}`,...row])}/>
    <Arrow label="training columns → population mean and scale"/><ArrayRow label="mean" values={average}/><ArrayRow label="variance" values={variance}/><ArrayRow label="scale" values={scale}/>
    <ArrayRow label="Held-out Q" values={query}/><Arrow label="subtract fixed mean; divide by fixed scale"/><ArrayRow label="z(Q)" values={z}/>
    <Plot points={rows.map(row=>row.map((value,j)=>(value-average[j])/scale[j]))} query={z} ids={['T0','T1','T2']} title="Training-owned standardized rows and transformed held-out Q" units={['standardized x','standardized y']}/>
    <Table caption="Constant measurement versus unavailable measurement" headers={['Column state','training mean','stored scale','query meaning']} rows={[
      ['all observed values 7',7,1,'q−7; no division by zero'],['missing measurement','unavailable','unavailable','requires a declared missing-data policy'],
    ]}/>
  </Local>;
}
export function MeanMinimum() {
  const [center,setCenter]=useState(3),rows=[0,2,4], cost=sum(rows.map(value=>(value-center)**2));
  return <Local id="D11" question="Why does the member mean minimize a fixed-group error?" controls={<Numeric label="Proposed center" value={center} onChange={setCenter} min={-2} max={6} step={.1}/>} reset={()=>setCenter(3)}
    readout={<>Mean 2 has scatter 8. Moving the center to {number(center)} adds 3({number(center)}−2)²={number(3*(center-2)**2)}, giving {number(cost)}. Deviations −2/0/2 sum to zero.</>}>
    <Axis values={rows} centers={[2,center]} domain={[-2,6]} title="Fixed member rows and movable proposed center" edges={rows.map(value=>({a:[value,0],b:[center,0],residual:true}))}/>
    <ArrayRow label="deviations from mean" values={[-2,0,2]}/><Arrow label="cross term contains their zero sum"/>
    <Bars maximum={200} title="Same fixed-group objective decomposition" rows={[{label:'within-group scatter',value:8},{label:'mean displacement',value:3*(center-2)**2}]}/>
  </Local>;
}
export function RowMass() {
  const [mass,setMass]=useState(2),weights=[3,mass], rows=[[0],[6]], center=mean(rows,weights)[0],cost=scatter(rows,[center],weights);
  return <Local id="D12" question="How is repeated evidence different from a feature ruler?" controls={<Numeric label="Mass at coordinate 6" value={mass} onChange={setMass} min={0} max={5}/>} reset={()=>setMass(2)}
    readout={<>Total row mass {3+mass} gives center {number(center)} and error {number(cost)}. A zero-mass row contributes no force; the positive mass at 0 keeps the mean defined.</>}>
    <Axis values={[0,6]} centers={[center]} title="Two coordinate locations with observation masses" domain={[0,6]}/>
    <ArrayRow label="row masses at 0 / 6" values={weights}/><ArrayRow label="weighted coordinate sums" values={[0,6*mass]}/><Arrow label={`sum contributions; divide by mass ${3+mass}`}/><Scalar label="mean" value={center}/>
    <ArrayRow label="literal repeated-row equivalent" values={[...Array(3).fill(0),...Array(mass).fill(6)]}/>
    <ArrayRow label="Separate invalid update: all row masses zero" values={[0,0]}/><Arrow label="Total mass zero: the dividing update specifies no mean"/><Scalar label="Mean for that all-zero state" value={null}/>
    <Plot points={[[0,0],[0,0]]} ids={['original row (0,0)','original row (0,1)']} title="Separate feature-weight-zero map: both rows collapse to the same coordinate"/>
    <Scalar label="Feature weight zero" value="removes one coordinate difference, not one observation"/>
  </Local>;
}
export function PairScatter() {
  const [count,setCount]=useState(3),rows=count===3?[0,2,4]:[0,2],pairs=rows.flatMap((a,i)=>rows.slice(i+1).map((b,j)=>[`P${i}–P${i+j+1}`,(a-b)**2]));
  const total=sum(pairs.map(row=>row[1])),cost=scatter(rows.map(value=>[value]));
  return <Local id="D13" question="What normalization makes pair scatter equal mean scatter?" controls={<Select label="Member count" value={count} onChange={value=>setCount(Number(value))} options={[[2,'2'],[3,'3']]}/>} reset={()=>setCount(3)}
    readout={<>Unordered pair squares sum to {number(total)}; divide by {count} to obtain SSE {number(cost)}. Ordered pairs repeat every term twice, so their divisor is {2*count}.</>}>
    <Axis values={rows} centers={[mean(rows.map(value=>[value]))[0]]} title="Members, pair edges and their mean" edges={rows.flatMap((a,i)=>rows.slice(i+1).map(b=>({a:[a,0],b:[b,0]})))}/>
    <Table caption="One contribution per unordered pair" headers={['Pair','Squared length']} rows={pairs}/><Arrow label={`sum ${number(total)} ÷ member count ${count}`}/><Scalar label="Mean scatter" value={cost}/>
    <Table caption="Ordered pair matrix: mirrored cells contribute twice" headers={['scalar row',...rows.map((_,i)=>`P${i}`)]} rows={rows.map((a,i)=>[`P${i}`,...rows.map(b=>(a-b)**2)])}/><ArrayRow label="Ordered sum / ordered divisor / same SSE" values={[2*total,2*count,2*total/(2*count)]}/>
  </Local>;
}

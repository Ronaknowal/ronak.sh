import React, { useState } from 'react';
import { Local, Plot, Axis, Table, Numeric, Select, ArrayRow, Arrow, Scalar, Bars, Members, number, vector, palette, useDrawingBox } from './Drawing.jsx';
import { faithfulDiagnostics, silhouetteRows, pairComparison, gapWitness, gapObserved, gapSimulationSpread, mean, sum } from './models.js';

function RecordedChart({log,selected}) {
  const {ref,width,font}=useDrawingBox(),height=Math.max(260,font*15),left=font*2,right=font*2,top=font*2,bottom=font*3;
  const transform=value=>log?Math.log(value):value,low=transform(20),high=transform(550);
  const x=(k,seed)=>left+(k-1)*(width-left-right)/7+(seed-2)*3;
  const y=value=>height-bottom-(transform(value)-low)/(high-low)*(height-top-bottom);
  return <div ref={ref} className="km-recorded-chart"><p>Inertia axis: {log?'natural-log position of positive SSE':'linear SSE'}, same forty measured markers. Horizontal columns name integer k; small offsets distinguish start IDs.</p>
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Forty retained inertia points; exact values are in the adjacent table">
      <path d={`M${left} ${top}V${height-bottom}H${width-right}`} fill="none" stroke="#888"/>
      {faithfulDiagnostics.flatMap(record=>record.inertias.map((value,seed)=><circle key={`${record.k}:${seed}`} cx={x(record.k,seed)} cy={y(value)} r={record.k===selected?5:3} fill={record.k===selected?'#e2b55a':'#8ab6ee'}/>))}
    </svg><ArrayRow label="integer k columns" values={[1,2,3,4,5,6,7,8]}/><ArrayRow label="SSE axis limits" values={[20,550]}/>
  </div>;
}
export function RecordedDiagnostics() {
  const [axis,setAxis]=useState('log'),[k,setK]=useState(2),record=faithfulDiagnostics[k-1];
  return <Local id="D40" question="What changes when the axis changes but the recorded errors do not?" controls={<><Select label="Inertia axis" value={axis} onChange={setAxis} options={['linear','log']}/><Numeric label="Inspected k" value={k} onChange={setK} min={1} max={8}/></>} reset={()=>{setAxis('log');setK(2);}}
    readout={<>k={k} keeps its five recorded errors {vector(record.inertias)}. {record.medianSilhouette===null?'One group makes silhouette undefined; null is not zero.':`The recorded median of five run-mean silhouettes is ${number(record.medianSilhouette)}; individual run scores were not retained.`} An axis edit performs no new fit.</>}>
    <RecordedChart log={axis==='log'} selected={k}/><Table caption="All forty retained starts and seven summary scores" headers={['k','seed 0','seed 1','seed 2','seed 3','seed 4','median run-mean silhouette']} rows={faithfulDiagnostics.map(row=>[row.k,...row.inertias,row.medianSilhouette??'undefined for k=1'])} highlight={k-1}/>
    <Bars title="Separate silhouette score axis" signed rows={faithfulDiagnostics.filter(row=>row.medianSilhouette!==null).map(row=>({label:`k ${row.k} median of run means`,value:row.medianSilhouette}))}/>
  </Local>;
}
export function SilhouetteMembers() {
  const [fixture,setFixture]=useState('separated'),[selected,setSelected]=useState(1);
  const points=(fixture==='coincident'?[0,0,0,0]:[0,1,4,6]).map(value=>[value,0]);
  const labels=fixture==='misassigned'?[0,1,0,1]:fixture==='singleton'?[0,0,0,1]:[0,0,1,1];
  const scores=silhouetteRows(points,labels),row=scores[selected];
  return <Local id="D41" question="Which member edges enter one silhouette score?" controls={<><Select label="Membership case" value={fixture} onChange={setFixture} options={['separated','misassigned','singleton','coincident']}/><Numeric label="Selected point ID" value={selected} onChange={setSelected} min={0} max={3}/></>} reset={()=>{setFixture('separated');setSelected(1);}}
    readout={<>P{selected} has own average a={number(row.a)}, nearest other-group average b={number(row.b)} and silhouette {number(row.score)}. {row.own.length?'The own denominator excludes the selected row.':'A singleton uses score zero by convention.'} Coincident a=b=0 also uses zero; invalid whole-label counts remain undefined.</>}>
    <Plot points={points} labels={labels} selected={selected} title="All edges actually used by the selected point" edges={[...row.own.map(id=>({a:points[selected],b:points[id],color:'#8ab6ee',strong:true})),...row.other.map(id=>({a:points[selected],b:points[id],color:'#efa0b4',strong:true}))]}/>
    <ArrayRow label="own member IDs (self excluded)" values={row.own.map(id=>`P${id}`)}/><ArrayRow label="nearest other-group member IDs" values={row.other.map(id=>`P${id}`)}/><Arrow label="average each member set before comparing"/>
    <Bars title="Every point score on its signed scale" signed rows={scores.map((score,i)=>({label:`P${i}`,value:score.score,color:palette[labels[i]]}))}/>
    <Table caption="Whole-score domain versus point conventions" headers={['case','whole score']} rows={[
      ['one group','undefined'],['one group for each row','undefined'],['singleton inside a valid partition','point score 0'],['zero denominator inside a valid partition','point score 0'],
    ]}/>
  </Local>;
}
export function PairRelations() {
  const [fixture,setFixture]=useState('renamed'),a=[0,0,1,1],choices={renamed:[7,7,3,3],split:[0,1,2,3],'swapped-one':[0,1,1,1],'all-one':[0,0,0,0]},b=choices[fixture],result=pairComparison(a,b);
  return <Local id="D42" question="Which relation survives a renaming of numeric group IDs?" controls={<Select label="Second partition" value={fixture} onChange={setFixture} options={Object.keys(choices)}/>} reset={()=>setFixture('renamed')}
    readout={<>The same four row IDs yield {result.pairs.filter(pair=>pair.left===pair.right).length}/6 agreeing pair relations and adjusted Rand index {number(result.ari)}. Numeric label closeness or raw equality is not object-partition agreement.</>}>
    <Table caption="Same objects, two nominal label columns" headers={['ID','A label','B label']} rows={a.map((label,i)=>[`P${i}`,label,b[i]])}/><Arrow label="each unordered object pair → two same/different cells"/>
    <Table caption="All six pair relations" headers={['pair','A relation','B relation','agreement']} rows={result.pairs.map(pair=>[`P${pair.a}–P${pair.b}`,pair.left?'same':'different',pair.right?'same':'different',pair.left===pair.right?'yes':'no'])}/>
    <Table caption="Contingency counts; row IDs are the counted objects" headers={['A / B',...result.rightIds.map(String)]} rows={result.cells.map((cells,i)=>[result.leftIds[i],...cells])}/>
    <ArrayRow label="ARI pair operands" values={[`TP=${result.tp}`,`A same=${result.a}`,`B same=${result.b}`,`expected=${number(result.expected)}`]}/><Scalar label="Adjusted Rand" value={result.ari}/>
  </Local>;
}
export function SharedProbes() {
  const [fixture,setFixture]=useState('renamed'),[probe,setProbe]=useState(0),a=[0,0,1],b=fixture==='renamed'?[7,7,3]:[7,3,3],result=pairComparison(a,b);
  return <Local id="D43" question="Where may two resampled systems make comparable decisions?" controls={<><Select label="Supplied second probe partition" value={fixture} onChange={setFixture} options={['renamed','changed']}/><Numeric label="Common probe ID" value={probe} onChange={setProbe} min={0} max={2}/></>} reset={()=>{setFixture('renamed');setProbe(0);}}
    readout={<>Common Q{probe} has supplied labels {a[probe]}/{b[probe]}; ARI on the three same probes is {number(result.ari)}. Bootstrap position 1 would instead compare T0 with T1, different objects. These tiny labels are supplied, not fitted.</>}>
    <div className="km-lanes"><div><ArrayRow label="Bootstrap A source IDs" values={['T0','T0','T2']} selected={1}/><Arrow label="own training scaler and centers"/><ArrayRow label="common probe IDs" values={['Q0','Q1','Q2']} selected={probe}/><ArrayRow label="supplied A decisions" values={a} selected={probe}/></div>
      <div><ArrayRow label="Bootstrap B source IDs" values={['T0','T1','T2']} selected={1}/><Arrow label="separately fitted training scaler and centers"/><ArrayRow label="same common probe IDs" values={['Q0','Q1','Q2']} selected={probe}/><ArrayRow label="supplied B decisions" values={b} selected={probe}/></div></div>
    <Table caption="Common-probe pair witness" headers={['pair','A same?','B same?']} rows={result.pairs.map(pair=>[`Q${pair.a}–Q${pair.b}`,String(pair.left),String(pair.right)])}/>
    <p>Separate recorded capstone lane, with unavailable arrays drawn by their actual dimensions:</p>
    <ArrayRow label="resample seeds" values={[30,31,32,33,34,35,36,37]}/><Arrow label="240 training positions per resample → separate scaler/fit"/><ArrayRow label="historical fitted parameter sockets" values={['means: 2 (not retained numerically)','scales: 2 (not retained numerically)','centers: k×2 (not retained numerically)']}/><Arrow label="predict the same sixty validation probes"/><ArrayRow label="retained median ARI at k2/k3/k4" values={[1,1,.935727]}/>
  </Local>;
}
export function ReferenceGeometry() {
  const [basis,setBasis]=useState('original'),[realization,setRealization]=useState(0),model=gapWitness(basis,realization),ref=model.points,groups=[0,0,1,1];
  const centers=[mean(ref.slice(0,2)),mean(ref.slice(2))],polygon=basis==='original'?[[-2,0],[2,0],[2,4],[-2,4]]:[[-2,0],[2,4],[2,4],[-2,0]];
  return <Local id="D44" question="What geometry does this declared reference generator fill?" controls={<><Select label="Reference box basis" value={basis} onChange={setBasis} options={['original','principal-axis']}/><Numeric label="Supplied reference table" value={realization} onChange={setRealization} min={0} max={4}/></>} reset={()=>{setBasis('original');setRealization(0);}}
    readout={<>Reference {realization} has prescribed two-group W={number(model.dispersions[realization])}; observed W=2. Mean log reference minus log observed is {number(model.gap)}. These five deterministic tables are supplied witnesses, not independent Monte Carlo draws or fitted Faithful outcomes.</>}>
    <div className="km-lanes"><Plot points={gapObserved} labels={groups} polygons={[polygon]} title="Observed rows and chosen reference-box geometry" ids={['O0','O1','O2','O3']}/>
      <Plot points={ref} centers={centers} labels={groups} polygons={[polygon]} title={`Supplied reference ${realization}; groups first two / last two`} ids={['R0','R1','R2','R3']} edges={ref.map((point,i)=>({a:point,b:centers[groups[i]],residual:true}))}/></div>
    <ArrayRow label="principal-axis row rulers" values={[[1/Math.SQRT2,1/Math.SQRT2],[-1/Math.SQRT2,1/Math.SQRT2]]}/><ArrayRow label="rotated box coordinate extents" values={[[-2*Math.SQRT2,2*Math.SQRT2],[0,0]]}/><Arrow label="draw uniform unit cells → bounds → inverse + mean (0,2)"/>
    <Table caption="Each W enters its own logarithm before averaging" headers={['realization','W','log W']} rows={model.dispersions.map((value,i)=>[i,value,model.logs[i]])} highlight={realization}/><Scalar label="mean(log reference W)" value={sum(model.logs)/5}/><Scalar label="log observed W" value={Math.log(model.observed)}/>
  </Local>;
}
export function GapNeighbor() {
  const [next,setNext]=useState(.43),[error,setError]=useState(.08),tests=[.1>=.4-.05,.4>=next-error],chosen=tests[0]?1:tests[1]?2:null,logs=gapWitness('original',0).logs,spread=gapSimulationSpread(logs);
  return <Local id="D45" question="Which next-k comparison first satisfies the uncertainty rule?" controls={<><Numeric label="Next gap G3" value={next} onChange={setNext} min={.3} max={.7} step={.01}/><Numeric label="Next uncertainty s3" value={error} onChange={setError} min={0} max={.2} step={.01}/></>} reset={()=>{setNext(.43);setError(.08);}}
    readout={chosen===null?<>Neither candidate qualifies: .1≥.35 fails and .4≥{number(next-error)} fails. k3 has no next cell; this range has no qualifying k.</>:<>The smallest qualifier is k{chosen}: .4≥{number(next)}−{number(error)}={number(next-error)}. Simulation uncertainty is not a confidence interval for a learned center.</>}>
    <ArrayRow label="constructed gap cells" values={[.1,.4,next]}/><ArrayRow label="next-cell uncertainties" values={[.05,error,'no fourth cell']}/><Arrow label="compare each Gk with G(k+1) − s(k+1)"/>
    <Table caption="Every tested inequality in the paper rule" headers={['candidate','left','next gap − next error','passes']} rows={[[1,.1,.35,String(tests[0])],[2,.4,next-error,String(tests[1])],[3,next,'missing G4/s4','not tested']]}/>
    <p>Separate formula arithmetic uses D44's five supplied original-box logW cells below. Their computed spread is not the editable constructed s3 above, and these deterministic cells are not claimed to be independent Monte Carlo draws.</p>
    <ArrayRow label="Five supplied logW cells (B=5)" values={logs}/><Arrow label="Subtract their common mean, then square each deviation"/><ArrayRow label="Common mean / individual deviations" values={[spread.average,...spread.deviations]}/><ArrayRow label="Five squared deviations" values={spread.squares}/><Arrow label="Sum squares ÷ B → population sd × √(1+1/B)"/><ArrayRow label="Population variance / sd / correction factor / computed spread" values={[spread.variance,spread.sd,spread.factor,spread.error]}/>
  </Local>;
}
const originalCandidates=[[2,.571111,.670333,1,74],[3,.661785,.238760,1,73],[4,.560489,.211009,.935727,43]];
export function SelectionProtocol() {
  const [candidate,setCandidate]=useState(3),[record,setRecord]=useState('17/23');
  const isOriginal=record==='17/23';
  return <Local id="D46" question="Which evidence locks the candidate before test scoring?" controls={<><Select label="Saved candidate highlight" value={candidate} onChange={value=>setCandidate(Number(value))} options={[2,3,4]}/><Select label="Recorded task identity" value={record} onChange={setRecord} options={['17/23','29/31']}/></>} reset={()=>{setCandidate(3);setRecord('17/23');}}
    readout={<>Recorded task {record} locked k3 before test, with test distortion {isOriginal?'.342295':'.253428'} and baseline {isOriginal?'2.167591':'2.043875'}. Highlighting k{candidate} changes no saved selection and creates no losing-candidate test value.</>}>
    <ArrayRow label="constructed source responsibilities" values={['360 synthetic device rows','data seed '+record.split('/')[0],'split seed '+record.split('/')[1],'coordinates × [3,.5] + [40,5]']}/>
    <div className="km-lanes"><div><ArrayRow label="training ID lane" values={['240 positions in the fixed permutation']}/><Arrow label="fit training-owned StandardScaler and k2/3/4 centers"/><ArrayRow label="fitted state ports" values={['mean: 2','scale: 2','centers: k×2','not retained numerically']}/></div>
      <div><ArrayRow label="validation ID lane" values={['same sixty positions for every candidate']}/><Arrow label="fixed prediction + eight common-probe stability comparisons"/><Scalar label="selection rule" value="eligible maximum silhouette; smaller k ties"/></div></div>
    {isOriginal?<Table caption="Complete saved original candidate outcomes" headers={['k','silhouette','mean squared distance','median ARI','min train size','eligible']} rows={originalCandidates.map(row=>[...row,'yes'])} highlight={candidate-2}/>:<Scalar label="Changed-seed record" value="separate recorded comparison; full original stdout belongs to 17/23"/>}
    <Arrow label="lock k3 and its original training state → one test scoring port"/><ArrayRow label="test outcome cells" values={[`60 test rows`,`counts ${isOriginal?'20/15/25':'18/17/25'}`,`distance ${isOriginal?'.342295':'.253428'}`,`baseline ${isOriginal?'2.167591':'2.043875'}`]}/>
  </Local>;
}
export function AvailableForecast() {
  const [duration,setDuration]=useState(3.6);
  return <Local id="D47" question="What can be supplied before the next wait exists?" controls={<Numeric label="Available query duration (min)" value={duration} onChange={setDuration} min={1} max={6} step={.1}/>} reset={()=>setDuration(3.6)}
    readout={<>Available duration is {number(duration)} minutes. One-dimensional centers, group waiting means, forecast and RMSE remain not evaluated; the query cannot supply the future wait it asks to predict.</>}>
    <Axis values={[]} query={duration} domain={[1,6]} title="Duration-only query position; no learned center supplied"/>
    <ArrayRow label="query feature port" values={[`duration ${number(duration)} min`]}/><Arrow label="duration-only nearest trained center (proposed)"/><ArrayRow label="training-state sockets" values={['1D centers: not evaluated','group train-wait means: not evaluated']}/><Arrow label="freeze proposed development choice → later prediction"/><Scalar label="Forecast" value="not evaluated"/>
    <Table caption="Information ports in a proposed chronological protocol" headers={['role','available input','operation']} rows={[
      ['earlier training','duration + then-observed wait','fit centers and group wait means'],['development holdout','duration at query; wait later','select declared k by forecast error'],['later final evaluation','duration at query; wait later','locked RMSE versus training-mean baseline'],['two-coordinate query requiring future wait','unavailable future outcome','cannot answer this forecast question'],
    ]}/>
  </Local>;
}

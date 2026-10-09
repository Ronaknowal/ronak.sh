import React, { useEffect, useRef, useState } from 'react';
import { Figure, Controls, Numeric, Select, Readout, Panels, Matrix, Plane, Trace, C, number, vector } from './IcaDrawingElements.jsx';
import { RankPlane } from './IcaFoundations.jsx';
import { add, leakage } from './ica-models.mjs';

export const assetBase = '/learn-code/independent-component-analysis-ica/';
let recordRequest;
function getRecord() {
  if (!recordRequest) recordRequest = Promise.all(['ica_retained_record.json','r01-first20s.csv'].map(name=>fetch(assetBase+name).then(response=>{if(!response.ok)throw Error('Retained data unavailable');return name.endsWith('.json')?response.json():response.text();}))).then(([record,csv])=>({record,rows:csv.trim().split(/\r?\n/).slice(1).map(row=>row.split(',').map(Number))})).catch(error=>{recordRequest=null;throw error;});
  return recordRequest;
}
function MeasuredChannels({data}) {
  const {record,rows}=data;
  const start=16000,length=40,window=rows.slice(start,start+length);
  const domain=[Math.min(...window.flat()),Math.max(...window.flat())];
  return <Figure id="D29" equivalent="Actual simultaneous r01 ADC samples 16000–16039 are drawn in five aligned lanes. Direct reference is diagnostic-only; the four abdomen channels alone enter fitting. First row is (−257,77,−272,41,−55) ADC counts.">
    <div className="ica-aligned-traces">{record.channels.map((name,j)=><Trace key={name} label={`${name}: ADC counts${j===0?' — reference only':''}`} values={window.map(row=>row[j])} color={j===0?C.query:C.neutral} domain={domain} selected={0} xLabel={`sample ${start} to ${start+length-1}; at 1000 Hz`}/>)}</div>
    <Matrix name="all five synchronized channel headers; exact ADC counts" headers={record.channels} rows={[rows[0],rows[16000]]} rowLabels={['sample 0','sample 16000']}/>
    <p>r01: 20,000 rows at 1,000 Hz. <a href={assetBase+'r01-first20s.csv'}>Complete CSV</a> and <a href={assetBase+'data-provenance.md'}>ODC-By attribution/calibration</a>. Jezewski and colleagues, 2012; extract retrieved 12 September 2026.</p>
  </Figure>;
}
function RecordedSplit() {
  return <Figure id="D30" equivalent="ADC endpoints convert counts to microvolts. Training [0,12), development [12,16), later evaluation [16,20) stay distinct. The reference connects only to selection/evaluation. Numeric fitted arrays were not saved.">
    <div className="ica-diagram-scroll" role="region" tabIndex={0} aria-label="Recording split timeline; scroll horizontally when needed"><svg className="ica-wide-drawing" viewBox="0 0 620 250" role="img" aria-label="0–20 second ruler: 0–12 train,12–16 development,16–20 later. Reference excluded from fitting.">
      <line x1="28" x2="588" y1="120" y2="120" stroke={C.dim}/>
      {[[0,12,C.neutral],[12,16,C.source1],[16,20,C.source2]].map(([a,b,color])=><rect key={a} x={28+a*28} width={(b-a)*28} y="100" height="20" fill={color}/>)}
      {[0,12,16,20].map(value=><g key={value}><line x1={28+value*28} x2={28+value*28} y1="94" y2="130" stroke={C.focus}/><text x={28+value*28} y="151" textAnchor="middle">{value}s</text></g>)}
      <text x="50" y="86">four abdomen channels → train-only fit</text><text x="360" y="86">selection</text><text x="486" y="86">evaluate</text>
      <text x="28" y="210" fill={C.query}>direct reference</text><path d="M180,205 L410,174 L420,127 M180,205 L530,174 L532,127" fill="none" stroke={C.query} strokeDasharray="5 4"/>
      <text x="28" y="30">sample 12000 → development; sample 16000 → later</text>
    </svg></div>
    <Panels><Matrix name="header endpoint calibration" headers={['ADC counts','microvolts']} rows={[[-32768,-3276.8],[32767,3276.8],[-257,-25.650391]]} rowLabels={['minimum','maximum','sample 16000 reference']}/>
    <Matrix name="historical fit shapes; numeric arrays unavailable" headers={['shape','numeric saved values']} rows={[["4","unavailable"],["4×4","unavailable"],["4×4","unavailable"],["4×4","unavailable"],["4×4","unavailable"]]} rowLabels={['channel mean / scaler','whitener K','white rows W','raw B','decoder']}/></Panels>
    <p>Microvolts = (count+32768)×6553.6/65535−3276.8. A new fit would produce new evidence; it cannot restore the unsaved original arrays.</p>
  </Figure>;
}
function CandidateEvidence({data}) {
  const {results}=data.record;
  const [selected,setSelected]=useState([3,4,2]);
  return <Figure id="D31" equivalent="All twelve development signed correlations remain visible. Historical choices raw3/PCA4/ICA2 have later absolute correlations .119806/.450178/.343966. Inspected alternative candidates have no retained later score.">
    <Panels>{results.map((result,i)=><div key={result.method}><Trace label={`${result.method}: signed development correlation`} values={result.development} ids={['1','2','3','4']} domain={[-.25,.25]} yLabel="signed correlation" xLabel="development coordinate" stems selected={selected[i]-1}/><p>Inspected {result.method} coordinate {selected[i]}: development {number(result.development[selected[i]-1],6)}; later <strong>{selected[i]===result.chosen?number(result.testSigned,6):'unavailable — not retained'}</strong>.</p></div>)}</Panels>
    <Controls id="L10" reset={()=>setSelected([3,4,2])}>{results.map((result,i)=><Select key={result.method} label={`${result.method} candidate`} value={selected[i]} options={[1,2,3,4].map(v=>[v,`coordinate ${v}`])} onChange={v=>setSelected(previous=>previous.map((old,j)=>j===i?Number(v):old))}/>)}</Controls>
    <Readout>Fixed historical later comparison: raw <strong>.119806</strong>, PCA <strong>.450178</strong>, ICA <strong>.343966</strong>. PCA−ICA=.106212; ICA−raw=.224160. ICA used 14 iterations. Changing inspection never fills missing scores.</Readout>
    <Matrix name="historical fixed selections; one-record waveform diagnostic" headers={['selected coordinate','development signed','later signed / absolute']} rows={results.map(result=>[result.chosen,result.development[result.chosen-1],`${number(result.testSigned,6)} / ${number(result.testAbs,6)}`])} rowLabels={results.map(result=>result.method)}/>
  </Figure>;
}
function SavedEnvelopes({data}) {
  const {record}=data,{trace}=record;
  const all=Object.values(trace.series).flat(2), lo=Math.min(...all),hi=Math.max(...all);
  const names=['reference','channel','PCA','ICA'];
  return <Figure id="D32" equivalent="Four actual retained 500-bin min/max envelopes span 16–18 seconds, four samples per bin, using interval display z-scores and development-aligned polarity. The separate full twenty-row window has reference/channel microvolts and PCA/ICA arbitrary units.">
    <div className="ica-aligned-traces">{names.map(name=><div key={name} className="ica-diagram-scroll" role="region" tabIndex={0} aria-label={`${name} envelope; scroll horizontally when needed`}><p>{name}: retained min/max, interval display z-score</p><svg viewBox="0 0 620 200" className="ica-envelope" role="img" aria-label={`${name}, 500 min/max segments from 16 to 18 seconds, common z-score domain ${lo} to ${hi}`}>
      <line x1="48" x2="588" y1={160-(0-lo)/(hi-lo)*120} y2={160-(0-lo)/(hi-lo)*120} stroke={C.dim}/>
      {trace.series[name].map(([minimum,maximum],i)=><line key={i} x1={48+(i+.5)*540/500} x2={48+(i+.5)*540/500} y1={160-(minimum-lo)/(hi-lo)*120} y2={160-(maximum-lo)/(hi-lo)*120} stroke={name==='reference'?C.query:C.neutral} strokeWidth="1"/>)}
      {[lo,0,hi].map(value=><text key={value} x="40" y={165-(value-lo)/(hi-lo)*120} textAnchor="end">{number(value,1)}</text>)}
      {[16,17,18].map(value=><text key={value} x={48+(value-16)*270} y="188" textAnchor="middle">{value}s</text>)}
    </svg></div>)}</div>
    <Matrix name="separate exact retained window; local scroll preserves every row" headers={['seconds','reference µV','raw channel µV','PCA arbitrary','ICA arbitrary']} rows={record.window.map(row=>[row.second,row.reference,row.channel,row.PCA,row.ICA])} rowLabels={record.window.map(row=>`sample ${row.sample}`)}/>
    <p>Envelope normalization is local to the shown interval, separate from fitted model normalization. All twenty exact rows 16000–16019 remain in their own units. The original operator arrays and other candidates' later scores remain unavailable.</p>
  </Figure>;
}
function ScoreColumn() {
  return <Figure id="D33" equivalent="Unmixing row reads one source score from channels; decoder column spreads that score across all channels. Scores 3 and −4 times column (3,1) give whole contributions (9,3) and (−12,−4). This outer product is query rows × channels.">
    <Panels><Plane label="unmixing row b₁=(.5,−.5) reads x=(5,−1)" domain={[-2,6]} points={[{id:'Q',value:[5,-1],color:C.query}]} vectors={[{end:[.5,-.5],label:'unmixing row; reading 3'}]}/>
    <Plane label="decoder column a₁=(3,1) spreads source score" domain={[-13,13]} vectors={[{end:[3,1],label:'decoder column a₁'},{end:[9,3],color:C.source1,label:'score 3 → whole contribution'},{end:[-12,-4],color:C.source2,label:'score −4 → whole contribution'}]}/>
    <Matrix name="outer product score[:,j] × decoder[:,j]ᵀ" headers={['source score','channel 1 contribution','channel 2 contribution']} rows={[[3,9,3],[-4,-12,-4]]} rowLabels={['query 1','query 2']}/></Panels>
  </Figure>;
}
function Cancellation() {
  return <Figure id="D34" equivalent="Whole channel contributions (9,3)+(−4,−4)=(5,−1). Removing the first leaves (−4,−4). Squared norms 90+32 include cross term −96, so observation squared norm is 26, not an additive percentage split.">
    <Panels><Plane label="head-to-tail addition; equal constructed channel units" domain={[-5,11]} vectors={[{end:[9,3],color:C.source1,label:'c₁ = 3(3,1)'},{end:[-4,-4],color:C.source2,label:'c₂ = −4(1,1)'},{start:[9,3],end:[5,-1],color:C.source2,label:'translated c₂'},{end:[5,-1],label:'observed x'}]}/>
      <Plane label="remove c₁: whole vector subtraction" domain={[-5,11]} vectors={[{end:[5,-1],label:'original x'},{start:[5,-1],end:[-4,-4],color:C.residual,label:'subtract c₁'},{end:[-4,-4],color:C.source2,label:'remaining c₂'}]}/></Panels>
    <Matrix name="cancellation and compensated removal" headers={['value']} rows={[[90],[32],[-96],[26],["(−6) × (−1.5,−.5) = (9,3)"]]} rowLabels={['||c₁||²','||c₂||²','2 c₁ᵀc₂','||x||²','source 1 ×−2 / column ÷−2']}/>
  </Figure>;
}
function LeakageRemoval() {
  const [epsilon,setEpsilon]=useState(.2),model=leakage(epsilon);
  return <Figure id="D35" equivalent={`Constructed nuisance b=−3 and desired q=2 form b′=${number(model.mixed)} at leakage ε=${number(epsilon)}. Extra removed contribution ${vector(model.extra)}; cleaned error ${vector(model.error)}. Nuisance-only subtraction remains at ε=0.`}>
    <Panels><Trace label="score pieces before spreading through decoder (2,−1)" values={[-3,2*epsilon,model.mixed]} ids={['b','εq','b′']} domain={[-3.5,1.5]} stems/>
      <Plane label="whole removed channel contributions" domain={[-7,7]} vectors={[{end:model.nuisance,color:C.neutral,label:'nuisance b (2,−1)'},{end:model.extra,color:C.source1,label:'undesired εq (2,−1)'},{start:model.nuisance,end:add(model.nuisance,model.extra),color:C.source1,label:'extra appended to nuisance'}]}/>
      <Plane label="remaining error relative to nuisance-only removal" domain={[-3,3]} vectors={[{end:model.error,color:C.residual,label:'cleaned − ideal-cleaned'}]}/></Panels>
    <Controls id="L11" reset={()=>setEpsilon(.2)}><Numeric label="Constructed leakage ε" value={epsilon} onChange={setEpsilon} min={0} max={.5}/></Controls>
    <Readout>Extra removed <strong>{vector(model.extra)}</strong>; remaining error <strong>{vector(model.error)}</strong>. {epsilon===0?'Desired-signal loss is exactly zero, while nuisance subtraction still occurs.':'Removing a mixed coordinate also removes desired signal.'} This is constructed leakage, with no known r01 source truth.</Readout>
  </Figure>;
}
function ResidualPolicy() { return <RankPlane id="D36" query={[1,2,3]} restoration/>; }
const drawings={D29:MeasuredChannels,D30:RecordedSplit,D31:CandidateEvidence,D32:SavedEnvelopes,D33:ScoreColumn,D34:Cancellation,D35:LeakageRemoval,D36:ResidualPolicy};
export default function IcaRecordingAndRemoval({id}) {
  const ref=useRef(null),[data,setData]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const needsData=['D29','D31','D32'].includes(id);
  useEffect(()=>{
    if(!needsData)return;
    let active=true;
    const load=()=>getRecord().then(value=>{if(active){setData(value);setError('');}}).catch(()=>{if(active)setError('The retained recording could not load.');});
    if(!('IntersectionObserver' in window)){load();return()=>{active=false;};}
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){load();observer.disconnect();}},{rootMargin:'600px'});
    observer.observe(ref.current);
    return()=>{active=false;observer.disconnect();};
  },[needsData,attempt]);
  const Drawing=drawings[id];
  return <div ref={ref} className="ica-record-slot">{needsData&&!data?<div data-ica-pending={id}><p role={error?'alert':'status'}>{error||'The retained recording drawing loads automatically here as you read.'}</p>{error&&<button type="button" onClick={()=>setAttempt(v=>v+1)}>Retry retained data</button>}</div>:<Drawing data={data}/>}</div>;
}

import { EFigure, EScene, EResponsive, ELabel, EArrow, ETable, EBars, ec, ef } from './ExponentialReadingPrimitives.jsx';
import { enumerateBits, conditionalAveraging, summaryComparison, SUFFICIENCY_REFERENCE } from '../../data/exponential-reading-models.js';

export function EBits({ bits, name, colour=ec[0] }) {
  return <div className="ef-bit-record"><p>{name}</p><EResponsive maximum={420}>{width=>{
    const cell=Math.min(38,(width-20)/bits.length),start=(width-cell*bits.length)/2;
    return <EScene label={name+'; ordered record '+bits.join('')} width={width} height={70}>{bits.map((bit,i)=><g key={i}><circle cx={start+(i+.5)*cell} cy={24} r={Math.min(14,cell*.36)} fill={bit?colour:'#171717'} stroke={colour}/><ELabel x={start+(i+.5)*cell} y={29} anchor="middle" colour={bit?'#171717':colour}>{bit}</ELabel><ELabel x={start+(i+.5)*cell} y={60} anchor="middle">{i+1}</ELabel></g>)}</EScene>;
  }}</EResponsive></div>;
}
export function Fibres({countOnly=false}) {
  const bits=enumerateBits();
  return <div className="ef-fibres">{Array.from({length:5},(_,s)=><div key={s}><p className="ef-fibre-label">S={s}: {bits.filter(x=>x.reduce((a,b)=>a+b,0)===s).length} records</p>{!countOnly&&bits.filter(x=>x.reduce((a,b)=>a+b,0)===s).map(x=><EBits key={x.join('')} name={x.join('')} bits={x}/>)}</div>)}</div>;
}
export function EstimatorDistributions({p=.2,controls=null}) {
  const s=conditionalAveraging(p),values=[0,.25,.5,.75,1];
  return <EBars label="First bit and conditional average: exact estimator distributions" columns={['Estimator value','X₁ probability','S/4 probability']} rows={values.map(v=>[v,s.first.find(r=>r.value===v)?.mass||0,s.averaged.find(r=>r.value===v)?.mass||0])} max={1} controls={controls}/>;
}
export function ModelRecords({bits=SUFFICIENCY_REFERENCE,grouped=false,pA=.8,pB=.3,controls=null}) {
  const s=summaryComparison(bits,pA,pB,grouped);
  return <><EBits name="Reference: positions 1–4 group A, positions 5–8 group B" bits={SUFFICIENCY_REFERENCE}/><EBits name="Current: positions 1–4 group A, positions 5–8 group B" bits={bits} colour={ec[1]}/><p>Model: {grouped?'independent groups':'one common probability'}. Current/reference likelihood ratio: {ef(s.ratio)}. Counts A/B: {s.groupCounts.join('/')}; total {s.total}.</p>{controls}<ETable label="Complete ordered likelihood comparison" columns={['Record','A count','B count','Total','Log likelihood']} rows={[[SUFFICIENCY_REFERENCE.join(''),...s.referenceCounts,6,ef(s.referenceLogLikelihood)],[bits.join(''),...s.groupCounts,s.total,ef(s.logLikelihood)]]}/></>;
}
export function FoundationDrawing({id}) {
  let child;
  if(id==='E01')child=enumerateBits().map(bits=><EBits key={bits.join('')} name={'X='+bits.join('')} bits={bits}/>);
  else if(id==='E02')child=<Fibres/>;
  else if(id==='E03'){
    const fibre=enumerateBits().filter(x=>x.reduce((a,b)=>a+b,0)===2);
    child=<><p>Each raw record contributes to the same conditioning denominator. Both columns use the complete S=2 fibre.</p>{fibre.map(bits=><EBits key={bits.join('')} name={bits.join('')+' → S=2'} bits={bits}/>)}<EBars label="Two conditional laws on the six-record fibre" columns={['Record','p=1/5 conditional mass','p=4/5 conditional mass']} rows={fibre.map(b=>[b.join(''),1/6,1/6])} max={1/6}/><ETable label="Raw mass and complete conditioning denominator" columns={['p','Each raw mass','Fibre mass','Conditional quotient']} rows={[['1/5','16/625','96/625','1/6'],['4/5','16/625','96/625','1/6']]}/></>;
  }else if(id==='E04')child=<><EBits name="Recorded observation" bits={[1,0,0,1]}/><EResponsive>{w=><EScene label="One retained count opens six possible historical records" width={w} height={90}><circle cx={w/2} cy={26} r={20} stroke={ec[0]} fill="none"/><ELabel x={w/2} y={31} anchor="middle">2</ELabel><EArrow x1={w/2} y1={48} x2={w/2} y2={77}/></EScene>}</EResponsive><p>Retained S=2. Any of six records can be regenerated with probability 1/6; the historical identity is lost.</p>{enumerateBits().filter(x=>x.reduce((a,b)=>a+b,0)===2).map(x=><EBits key={x.join('')} name={'Possible '+x.join('')} bits={x}/>)}</>;
  else if(id==='E05')child=<><EBits name="Two successes in four trials" bits={[1,1,0,0]}/><EBits name="Two successes in eight trials" bits={[1,1,0,0,0,0,0,0]}/><p>The count is 2 in each. Known n is 4 versus 8; the likelihood powers differ.</p></>;
  else if(id==='E06')child=<>{Array.from({length:5},(_,s)=>{const records=enumerateBits().filter(x=>x.reduce((a,b)=>a+b,0)===s);return <div key={s}><p>S={s}; {records.filter(x=>x[0]).length} first-bit ones among {records.length} records; conditional mean {s}/4.</p>{records.map(x=><EBits key={x.join('')} name={'X₁='+x[0]} bits={x}/>)}</div>;})}</>;
  else if(id==='E08'){const s=conditionalAveraging();child=<><EBars label="Total variance decomposed into conditional mean and residual" columns={['Term','Variance contribution']} rows={[["Var(S/4)",s.averagedVariance],['E[(X₁−S/4)²]',s.residual],['Var(X₁)',s.firstVariance]]} max={s.firstVariance}/><ETable label="Every residual at p=.2" columns={['Record','S/4','X₁−S/4','Mass × residual²']} rows={s.rows.map(r=>[r.bits.join(''),r.count/4,r.first-r.count/4,ef(r.mass*(r.first-r.count/4)**2)])}/></>;}
  else if(id==='E09')child=<EBars label="Distinct likelihood ratios identify five minimal fibres" columns={['Count S','L(p=2/3)/L(p=1/3)']} rows={Array.from({length:5},(_,s)=>[s,2**(2*s-4)])}/>;
  else if(id==='E10')child=<><Fibres countOnly/><EResponsive>{w=><EScene label="Five polynomial coefficients, each tied to one fibre" width={w} height={5*85}>{[1,4,6,4,1].map((c,s)=><g key={s}><circle cx={30} cy={30+s*85} r={21} fill="none" stroke={ec[0]}/><ELabel x={30} y={35+s*85} anchor="middle">{s}</ELabel><EArrow x1={55} y1={30+s*85} x2={w-35} y2={30+s*85}/><ELabel x={12} y={65+s*85}>{c} × g({s}) × t^{s}</ELabel></g>)}</EScene>}</EResponsive><p>A polynomial zero for every t&gt;0 has every coefficient zero. Every binomial coefficient is positive.</p></>;
  else if(id==='E11')child=<><EBits name="Six successes, two failures" bits={[1,1,1,1,0,0,1,1]}/><EBars label="The two counted likelihood exponents" columns={['Outcome','Number of factors']} rows={[["p: success",6],['1−p: failure',2]]} max={8}/></>;
  else if(id==='E12')child=<><EResponsive>{w=><EScene label="Two distinct raw Poisson datasets collect the same count" width={w} height={180}>{[[0,3,1],[2,1,1]].map((xs,r)=><g key={r}>{xs.map((x,i)=><g key={i}><circle cx={30+i*(w-60)/2} cy={25+r*90} r={20} fill="none" stroke={ec[r]}/><ELabel x={30+i*(w-60)/2} y={30+r*90} anchor="middle">{x}</ELabel></g>)}<ELabel x={12} y={70+r*90}>S=4</ELabel></g>)}</EScene>}</EResponsive><p>First factorial product 6; second product 2. Likelihood ratio first/second is 1/3 at every positive rate. Both share λ⁴ exp(−3λ).</p></>;
  else if(id==='E13')child=<><EBits name="Observation whose factors are collected" bits={[1,1,0,1]}/><EResponsive>{w=><EScene label="Observed record separates into base mass and parameter interaction" width={w} height={200}><EArrow x1={w/2} y1={12} x2={w/2} y2={45}/><circle cx={w/2} cy={78} r={26} fill="none" stroke={ec[0]}/><ELabel x={w/2} y={83} anchor="middle">S=3</ELabel><EArrow x1={w/2} y1={107} x2={w/2} y2={142}/><ELabel x={12} y={180}>h(x) × gθ(S(x))</ELabel></EScene>}</EResponsive><p>h supplies parameter-free relative raw weight. g carries the parameter interaction with the statistic; the declared reference measure remains part of the model.</p></>;
  else if(id==='E15')child=<><EBits name="11110011: long initial run" bits={[1,1,1,1,0,0,1,1]}/><EBits name="10101111: different runs" bits={[1,0,1,0,1,1,1,1]} colour={ec[1]}/><p>Both counts are 6. Order differs, so a serial-pattern question needs distinctions the iid count discarded.</p></>;
  else throw new Error('Unknown static foundational object '+id);
  return <EFigure id={id}>{child}</EFigure>;
}

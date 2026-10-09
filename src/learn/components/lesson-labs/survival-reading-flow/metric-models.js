export const METRIC_ROWS=Object.freeze([{id:'M1',time:1,event:true,score:3},{id:'M2',time:2,event:false,score:2},{id:'M3',time:2,event:true,score:2},{id:'M4',time:4,event:true,score:0}]);
export function concordanceFixture(secondScore=2) {
  const rows=METRIC_ROWS.map(row=>row.id==='M2'?{...row,score:secondScore}:row),pairs=[];
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
    const a=rows[i],b=rows[j];let event=null,other=null;
    if(a.time<b.time&&a.event){event=a;other=b;}
    else if(b.time<a.time&&b.event){event=b;other=a;}
    else if(a.time===b.time&&a.event!==b.event){event=a.event?a:b;other=a.event?b:a;}
    const credit=event ? event.score>other.score?1:event.score===other.score?.5:0 : null;
    pairs.push({a,b,event,other,credit});
  }
  const comparable=pairs.filter(row=>row.credit!==null),credit=comparable.reduce((sum,row)=>sum+row.credit,0);
  return {rows,pairs,credit,count:comparable.length,concordance:credit/comparable.length};
}
export function horizonRows(horizon) { return METRIC_ROWS.map(row=>({...row,role:row.event&&row.time<=horizon?'case':row.time>horizon?'control':row.time===horizon?'censor boundary':'unknown',target:row.event&&row.time<=horizon?0:row.time>horizon?1:null})); }
export function weightedLosses(forecast=.6,recording=.5) {
  const eventPart=.4*forecast**2,survivorPart=.6*(1-forecast)**2,full=eventPart+survivorPart;
  return {full,ipcw:recording>0?full:null,completeCase:(eventPart+.6*recording*(1-forecast)**2)/(.4+.6*recording),censorAsFailure:(1-.6*recording)*forecast**2+.6*recording*(1-forecast)**2,
    survivingRecordedMass:.6*recording,survivingContribution:recording>0?(1-forecast)**2/recording:null,variance:recording>0?.4*forecast**4+.6*(1-forecast)**4/recording-full**2:null};
}

// Enumerate the four atoms of this stipulated independent law, not sampled patients.
export function knownObservationBranches(forecast=.6) {
  if (!Number.isFinite(forecast) || forecast<0 || forecast>1)
    throw new RangeError('The day-5 survival forecast must be a probability.');
  return [{time:2,mass:.4},{time:8,mass:.6}].flatMap(lifetime=>
    [3,10].map(follow=>{
      const event=lifetime.time<=follow,observedTime=Math.min(lifetime.time,follow);
      const target=event&&observedTime<=5?0:observedTime>5?1:null;
      const chance=target===0?1:target===1?.5:null;
      const loss=target===null?null:(target-forecast)**2;
      const mass=lifetime.mass*.5;
      return {life:lifetime.time,lifeMass:lifetime.mass,follow,followChance:.5,mass,
        observedTime,event,target,chance,loss,contribution:target===null?null:mass*loss/chance};
    }));
}
export function integratedLoss(index=2) {
  const times=[2,4,8],losses=[.2,.4,.1];if(index===0)return{area:0,value:null,pieces:[]};
  const pieces=times.slice(1,index+1).map((end,i)=>({start:times[i],end,left:losses[i],right:losses[i+1],area:(end-times[i])*(losses[i]+losses[i+1])/2}));
  const area=pieces.reduce((sum,row)=>sum+row.area,0);return{area,value:area/(times[index]-times[0]),pieces};
}

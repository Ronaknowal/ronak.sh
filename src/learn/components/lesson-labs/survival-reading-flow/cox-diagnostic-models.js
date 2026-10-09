import { UNTIED_ROWS, riskCompetition } from './cox-models.js';
export const FIXED_UNTIED_BETA=-.43257419544250714;
export function residualDiagnostics() {
  const failures=UNTIED_ROWS.filter(row=>row.event),meanTime=failures.reduce((sum,row)=>sum+row.time,0)/failures.length;
  const rows=failures.map(row=>{const pool=riskCompetition(FIXED_UNTIED_BETA,row.time,UNTIED_ROWS);return{...row,mean:pool.mean,residual:row.x-pool.mean,information:pool.variance,g:row.time-meanTime};});
  const information=rows.reduce((sum,row)=>sum+row.information,0);
  const cross=rows.reduce((sum,row)=>sum+row.g*row.information,0);
  const timeInformation=rows.reduce((sum,row)=>sum+row.g*row.g*row.information,0);
  const timeScore=rows.reduce((sum,row)=>sum+row.g*row.residual,0),efficient=timeInformation-cross*cross/information;
  return {rows:rows.map(row=>({...row,scaled:failures.length/information*row.residual})),information,cross,timeInformation,timeScore,efficient,statistic:timeScore*timeScore/efficient,meanTime};
}
export function changingEffect(time,change) {
  const referenceH=.1*time,comparisonH=.05*Math.min(time,change)+.2*Math.max(0,time-change);
  return {referenceH,comparisonH,referenceSurvival:Math.exp(-referenceH),comparisonSurvival:Math.exp(-comparisonH)};
}
export function mixtureAt(time,share=.5,multiplier=.5) {
  const pool=(m)=>{const a=share*Math.exp(-m*.1*time),b=(1-share)*Math.exp(-m*.4*time),s=a+b;return{survival:s,robustShare:a/s,hazard:(a*.1+b*.4)*m/s};};
  const reference=pool(1),comparison=pool(multiplier);return {reference,comparison,ratio:comparison.hazard/reference.hazard};
}

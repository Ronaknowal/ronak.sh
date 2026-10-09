// Bounded normalized power-iteration model; exact named-angle fixtures are intentional.
export function powerIterationTrace(minorValue=1,startAngle=0) {
  if(!Number.isFinite(minorValue)||minorValue<0||minorValue>2.95)throw new RangeError('minor value must be finite in [0, 2.95]');
  if(!Number.isFinite(startAngle)||startAngle<0||startAngle>180)throw new RangeError('start angle must be finite in [0, 180]');
  const r=1/Math.sqrt(2),named={0:[1,0],45:[r,r],90:[0,1],135:[-r,r],180:[-1,0]};
  let q=named[startAngle]?.slice()??[Math.cos(startAngle*Math.PI/180),Math.sin(startAngle*Math.PI/180)];
  const a=(3+minorValue)/2,b=(3-minorValue)/2,matrix=[[a,b],[b,a]];
  const multiply=q=>[a*q[0]+b*q[1],b*q[0]+a*q[1]];
  const rows=[];
  for(let step=0;step<=12;step++){
    const product=multiply(q),length=Math.hypot(...product),estimate=q[0]*product[0]+q[1]*product[1];
    const residual=[product[0]-estimate*q[0],product[1]-estimate*q[1]];
    rows.push({step,q:q.slice(),product,length,estimate,residual:Math.hypot(...residual),dominantCoefficient:r*(q[0]+q[1]),minorCoefficient:r*(q[0]-q[1]),zeroProduct:length===0});
    if(length===0)break;
    q=product.map(value=>value/length);
  }
  return {minorValue,startAngle,matrix,rows,stoppedOnZero:rows.at(-1).zeroProduct,trueDominantValue:3};
}

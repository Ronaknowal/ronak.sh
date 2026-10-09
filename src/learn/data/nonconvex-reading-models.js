import {wellValue, wellGradient, wellState, stationaryPresets, stationaryValue, stationaryState, saddleSigns, factorValue, modePaths, interpolationValue} from './nonconvex-landscape-models.js';
export {wellValue, wellGradient, wellState, stationaryPresets, stationaryValue, stationaryState, saddleSigns, factorValue, modePaths, interpolationValue};
export const linspace=(a,b,n=81)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export const saddleTrace=(initialY=0.001,steps=30)=>Array.from({length:steps+1},(_,k)=>({k,x:0.6*0.8**k,y:initialY*1.2**k}));
export function noiseTrace(direction='y',amplitude=.2,steps=8){
 const frames=[];let x=.6,y=0;
 for(let k=0;k<=steps;k++){
  const sign=saddleSigns[k]??null,gradient=[2*x,-2*y],noise=[direction==='x'?amplitude*(sign??0):0,direction==='y'?amplitude*(sign??0):0];
  frames.push({k,x,y,sign,gradient,noise,sample:gradient.map((v,i)=>v+noise[i])});
  if(k<steps){x-=.1*(gradient[0]+noise[0]);y-=.1*(gradient[1]+noise[1]);}
 }
 return frames;
}
export const noiseMoment=(direction,amplitude,k)=>direction==='x'?0:(.1*amplitude)**2*Array.from({length:k},(_,j)=>1.2**(2*j)).reduce((a,b)=>a+b,0);
// Integer-scaled support preserves exact multiplicity; denominator 50*5^7.
export function eightSignDistribution(){
 const masses=new Map(),denominator=50*5**7;
 for(let bits=0;bits<256;bits++){
  let numerator=0;
  for(let i=0;i<8;i++)numerator-=((bits>>i)&1?1:-1)*6**(7-i)*5**i;
  masses.set(numerator,(masses.get(numerator)||0)+1);
 }
 return [...masses].sort((a,b)=>a[0]-b[0]).map(([numerator,count])=>({numerator,denominator,y:numerator/denominator,count,p:count/256,contribution:(count/256)*(numerator/denominator)**2}));
}
export function factorStep(scale=1,mode='normal',amount=.1){
 const base=[scale,1/scale],R=Math.hypot(...base),direction=mode==='normal'?[base[1]/R,base[0]/R]:[base[0]/R,-base[1]/R];
 const end=mode==='curved'?[scale*Math.exp(amount),Math.exp(-amount)/scale]:base.map((v,i)=>v+amount*direction[i]);
 return {base,end,direction,distance:Math.hypot(...end.map((v,i)=>v-base[i])),product:end[0]*end[1],loss:factorValue(...end),quadratic:mode==='normal'?.5*R*R*amount*amount:0,positiveEigenvalue:R*R};
}
export const factorGradient=(a,b)=>[(a*b-1)*b,(a*b-1)*a];
export const factorHessian=(a,b)=>[[b*b,2*a*b-1],[2*a*b-1,a*a]];
export function networkState(input=1.5,transform='original',scale=2){
 let units=[{id:1,w:1,b:-1,v:2},{id:2,w:-1,b:2,v:-1}];
 if(transform==='permuted')units.reverse();
 if(transform==='scaled'||transform==='missing-bias')units=units.map((u,i)=>{const c=i===0?scale:1/scale;return {...u,w:u.w*c,b:transform==='scaled'?u.b*c:u.b,v:u.v/c};});
 units=units.map(u=>{const z=u.w*input+u.b,h=Math.max(0,z);return {...u,z,h,contribution:u.v*h,state:z===0?'kink':z>0?'active':'inactive'};});
 return {input,units,output:units.reduce((s,u)=>s+u.contribution,0)};
}
export function deadTrace(active=false,rate=.1,steps=20){
 let w=0,b=active?.5:-1;const rows=[];
 for(let k=0;k<=steps;k++){
  const z=w+b,prediction=Math.max(0,z),residual=prediction-1,g=z>0?residual:0,displacement=-rate*g;
  rows.push({k,w,b,z,prediction,residual,gradient:[g,g],norm:Math.SQRT2*Math.abs(g),displacement:[displacement,displacement],loss:.5*residual*residual,active:z>0});
  if(k<steps){w+=displacement;b+=displacement;}
 }
 return rows;
}
export const irisConstants={meanX:1753/300,meanY:1879/500,moment:306505/450000,beta:569619/306505};

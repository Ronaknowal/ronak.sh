import { optimizerGradientProfiles } from './gradient-variants-models.js';

// Additional bounded arithmetic mechanisms. Existing scientific owners stay intact.
export const total = xs => xs.reduce((a,b)=>a+b,0);
export const norm = xs => Math.hypot(...xs);
export const loss = x => (x*x+5)/2;
function count(x,lo,hi,name){if(!Number.isInteger(x)||x<lo||x>hi)throw Error(`${name} must be an integer from ${lo} through ${hi}.`);}
function range(x,lo,hi,name){if(!Number.isFinite(x)||x<lo||x>hi)throw Error(`${name} must be finite from ${lo} through ${hi}.`);}
function pick(x,xs,name){if(!xs.includes(x))throw Error(`Choose a supported ${name}.`);}
export function noisyQuadratic(rate=.2,batch=2,steps=10){
 range(rate,.02,1.98,'Rate');count(batch,1,16,'IID batch size');count(steps,0,40,'Step');
 let mean=1,variance=0;const rows=[{step:0,mean,variance,second:1,sd:0}];
 for(let t=1;t<=steps;t++){mean*=1-rate;variance=(1-rate)**2*variance+rate**2*5/batch;rows.push({step:t,mean,variance,second:mean**2+variance,sd:Math.sqrt(variance)});}
 return {rate,batch,steps,rows,final:rows.at(-1),limit:rate*5/(batch*(2-rate)),noiseVariance:5/batch};
}
export function characteristicRoots(method='momentum',beta=.8,a=1.2){
 pick(method,['momentum','nesterov'],'mode');range(beta,0,.95,'Memory');range(a,.02,4,'Scaled rate');
 const coefficient=method==='momentum'?1+beta-a:(1-a)*(1+beta),constant=method==='momentum'?beta:beta*(1-a),disc=coefficient**2-4*constant;
 const roots=disc>=0?[[.5*(coefficient+Math.sqrt(disc)),0],[.5*(coefficient-Math.sqrt(disc)),0]]:[[coefficient/2,Math.sqrt(-disc)/2],[coefficient/2,-Math.sqrt(-disc)/2]];
 return {method,beta,a,coefficient,constant,roots,radius:Math.max(...roots.map(norm)),upper:method==='momentum'?2*(1+beta):2*(1+beta)/(1+2*beta)};
}
export function quadraticMode(method='momentum',beta=.8,a=1.2,steps=12){
 const root=characteristicRoots(method,beta,a);count(steps,0,30,'Step');
 let x=1,v=0;const rows=[{step:0,x,v,loss:.5,q:1,gradient:1}];let truncated=false;
 for(let t=1;t<=steps;t++){const before=x,q=method==='nesterov'?x+beta*v:x,old=v;v=beta*v-a*q;const next=x+v;if(!Number.isFinite(next)||Math.abs(next)>100000){truncated=true;break;}x=next;rows.push({step:t,x,v,loss:x*x/2,q,gradient:q,before,old});}
 return {...root,steps,rows,final:rows.at(-1),truncated,bound:100000};
}
export const maxEvents = [[2,.2],[2,.2],[6,.2],[.2,.2],[.2,.2],null,[0,0],[1e-10,-1e-10]];
export function maxHistory(method='correctedMax',event=5){
 pick(method,['ordinary','correctedMax','rawMax'],'maximum convention');count(event,0,8,'Event');
 let theta=[1,-2],first=[0,0],second=[0,0],maximum=[0,0],active=0;
 const rows=[{event:0,active,theta:[...theta],first:[...first],second:[...second],maximum:[...maximum],gradient:null,numerator:[0,0],denominator:[0,0],displacement:[0,0],meaning:'Initial state'}];
 for(let e=1;e<=event;e++){
  const gradient=maxEvents[e-1];let displacement=[0,0],numerator=[0,0],denominator=[0,0];
  if(gradient!==null){active++;first=first.map((m,i)=>.9*m+.1*gradient[i]);second=second.map((v,i)=>.9*v+.1*gradient[i]**2);if(method!=='ordinary')maximum=maximum.map((v,i)=>Math.max(v,second[i]));numerator=first.map(m=>m/(method==='rawMax'?1:1-.9**active));const raw=method==='ordinary'?second:maximum;denominator=raw.map(v=>Math.sqrt(v/(method==='rawMax'?1:1-.9**active))+1e-8);displacement=numerator.map((m,i)=>-.05*m/denominator[i]);theta=theta.map((x,i)=>x+displacement[i]);}
  rows.push({event:e,active,gradient,theta:[...theta],first:[...first],second:[...second],maximum:[...maximum],numerator,denominator,displacement,meaning:gradient===null?'Absent: all parameter state retained':gradient.every(g=>g===0)?'Literal zero: active update':'Supplied nonzero gradient'});
 }
 return {method,event,rows,final:rows.at(-1)};
}
export function onlineCycle(useMaximum=false,steps=3){
 count(steps,1,120,'Cycle events');if(typeof useMaximum!=='boolean')throw Error('Maximum policy must be boolean.');
 let x=0,v=0,maximum=0,cumulative=0;const rows=[];
 for(let t=1;t<=steps;t++){const g=[3,-1,-1][(t-1)%3],before=x,rate=.1/Math.sqrt(t);v=.1*v+.9*g*g;maximum=Math.max(maximum,v);x=Math.max(-1,Math.min(1,x-rate*g/Math.sqrt(useMaximum?maximum:v)));cumulative+=g*before;rows.push({step:t,g,before,x,v,maximum,rate,loss:g*before,regret:cumulative+total(Array.from({length:t},(_,i)=>[3,-1,-1][i%3]))});}
 return {rows,final:rows.at(-1)};
}
export function accumulation(group='unequalA',theta=1,rate=.1){
 pick(group,['unequalA','unequalB','equal'],'grouping');range(theta,-4,4,'Parameter');range(rate,0,.8,'Rate');
 const groups=group==='unequalA'?[[-3,-1],[3]]:group==='unequalB'?[[-3],[-1,3]]:[[-3,-1],[1,3]],sizes=groups.map(x=>x.length),gradients=groups.map(xs=>xs.map(a=>theta-a)),means=gradients.map(xs=>total(xs)/xs.length),full=total(means.map((m,i)=>m*sizes[i]))/total(sizes),wrong=total(means)/2;
 let sequential=theta;const sequence=groups.map(xs=>{const before=sequential,g=total(xs.map(a=>before-a))/xs.length;sequential-=rate*g;return{before,g,next:sequential};});
 return {group,theta,rate,groups,sizes,gradients,means,full,wrong,next:theta-rate*full,wrongNext:theta-rate*wrong,sequential,sequence};
}
export const bridgeEvents = [[2,0],[2,4],null,[0,0],[-1,.5],[1e-12,-1e-12]];
export function missingEvent(method='adamw',event=4,absent=true,decay=.1){
 pick(method,['sgd','adagrad','rmsprop','adam','adamw'],'bridge method');count(event,0,6,'Event');if(typeof absent!=='boolean')throw Error('Absent policy must be boolean.');pick(decay,[0,.1],'decay');
 let theta=[1,-2],first=[0,0],second=[0,0],active=0;const rows=[{event:0,active,theta:[...theta],first:[...first],second:[...second],gradient:null,meaning:'Initial'}];
 for(let e=1;e<=event;e++){
  const gradient=e===3?(absent?null:[0,0]):bridgeEvents[e-1];
  if(gradient!==null){active++;const effective=gradient.map((g,i)=>method==='adamw'?g:g+decay*theta[i]);let direction;
   if(method==='sgd'){first=first.map((m,i)=>.9*m+effective[i]);direction=first;}
   else if(method==='adagrad'){second=second.map((v,i)=>v+effective[i]**2);direction=effective.map((g,i)=>g/(Math.sqrt(second[i])+1e-8));}
   else if(method==='rmsprop'){second=second.map((v,i)=>.95*v+.05*effective[i]**2);direction=effective.map((g,i)=>g/(Math.sqrt(second[i])+1e-8));}
   else {first=first.map((m,i)=>.9*m+.1*effective[i]);second=second.map((v,i)=>.95*v+.05*effective[i]**2);direction=first.map((m,i)=>(m/(1-.9**active))/(Math.sqrt(second[i]/(1-.95**active))+1e-8));}
   theta=theta.map((x,i)=>(method==='adamw'?x*(1-.05*decay):x)-.05*direction[i]);
  }
  rows.push({event:e,active,gradient,theta:[...theta],first:[...first],second:[...second],meaning:gradient===null?'Absent / no parameter event':gradient.every(g=>g===0)?'Active zero vector':'Active nonzero vector'});
 }
 return{method,event,absent,decay,rows,final:rows.at(-1),stateKeys:method==='sgd'?['momentum_buffer']:method==='adagrad'?['sum','step']:method==='rmsprop'?['square_avg','step']:['exp_avg','exp_avg_sq','step']};
}
export function profileGradients(profile='sparse'){pick(profile,Object.keys(optimizerGradientProfiles),'profile');return optimizerGradientProfiles[profile].gradients;}
export function signedMemory(gs,beta=.9){let buffer=0;return gs.map((g,i)=>{buffer=beta*buffer+g;return{step:i+1,g,buffer,contributions:gs.slice(0,i+1).map((x,j)=>x*beta**(i-j))};});}
export function syntheticData(){return Array.from({length:32},(_,i)=>{const x=-2+4*i/31;return{id:i,x,y:1+2*x+.1*Math.sin(3*x),membership:i%4===0?'validation':'training'};});}

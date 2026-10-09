// Complementary first checks of still-unchecked prose: no instructional module
// imports, fits, historical mains, or replay of the 41 earlier witnesses.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const h=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(h,'outputs/gaussian_rows.txt'),'utf8');
const P=JSON.parse(raw.split('\n').find(x=>x.startsWith('P ')).slice(2));
const y=[-1.5,-.5,.5,1.5],n=4,kernel=y.map((a,i)=>y.map((b,j)=>i===j?0:1/(1+(a-b)**2)));
const Z=kernel.flat().reduce((a,b)=>a+b,0),Q=kernel.map(row=>row.map(v=>v/Z));
const rows=y.map((a,i)=>y.map((b,j)=>({from:i,to:j,P:P[i][j],Q:Q[i][j],kernel:kernel[i][j],delta:a-b,negativeGradient:-4*(P[i][j]-Q[i][j])*kernel[i][j]*(a-b)})).filter(r=>r.from!==r.to));
const force=rows.map(row=>row.reduce((s,r)=>s+r.negativeGradient,0));
function cost(coords){const t=coords.map((a,i)=>coords.map((b,j)=>i===j?0:1/(1+(a-b)**2))),z=t.flat().reduce((a,b)=>a+b,0);let c=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(P[i][j]>0)c+=P[i][j]*Math.log(P[i][j]/(t[i][j]/z));return c;}
const step=rate=>{let next=y.map((v,i)=>v+rate*force[i]);let mean=next.reduce((a,b)=>a+b,0)/n;return next.map(v=>v-mean);};
const CE=r=>{const nu=1/(1+r*r),w=.625;return{r,nu,attractive:-w*Math.log(nu),repulsive:-(1-w)*Math.log1p(-nu),total:-w*Math.log(nu)-(1-w)*Math.log1p(-nu)};};
const entropy=p=>-p.reduce((s,v)=>s+v*Math.log2(v),0);
const checks=[];const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(name);};
check('D17 A negative gradient rounded value',Math.abs(force[0]-.0777846)<5e-8,force[0]);
check('D17 A half-rate displacement rounded value',Math.abs(.5*force[0]-.0388923)<5e-8,.5*force[0]);
check('D18 explicit oversized rate100 increases fixed-P cost',cost(step(100))>cost(y),{initial:cost(y),rate100:cost(step(100))});
check('D24 r2 CE matches prose',Math.abs(CE(2).total-1.0895775)<5e-8,CE(2));
check('practice2 unmerged entropy',entropy([.5,.25,.125,.125])===1.75,{entropy:1.75,perplexity:2**1.75});
check('practice2 merged entropy',entropy([.5,.25,.25])===1.5,{entropy:1.5,perplexity:2**1.5});
check('practice5 changed map affine calculation',-2*4/7+12*3/7===4,4);
check('practice14 changed extrapolated map',-2*(-1/3)+7*(4/3)===10,10);
check('D32 decimal dense memory',10000**2*8===800e6&&100000**2*8===80e9&&500000**2*8===2e12,[800e6,80e9,2e12]);
const record={status:'PASS_NEW_COMPLEMENTARY_PROSE_INTERMEDIATES',at:new Date().toISOString(),runtime:process.version,scriptSha256:sha(fs.readFileSync(__filename)),PSource:{path:'outputs/gaussian_rows.txt',sha256:sha(Buffer.from(raw)),role:'already executed new row stream read only; solver not rerun'},checks,D17:{Z,rows,force,halfStep:step(.5),initialKL:cost(y)},D18:{rate:100,coordinates:step(100),KL:cost(step(100))},D24:[CE(1),CE(2)],D34:{squaredDistances:[[0,4,25],[4,0,9],[25,9,0]],rowMeans:[29/3,13/3,34/3],grandMean:76/9,BAB:-.5*(4-29/3-13/3+76/9)},scope:'Direct finite arithmetic only. No original/programme main or prior 41-check replay, no estimator calls or new scientific data.',scientificReplay:false};
fs.writeFileSync(path.join(h,'prose-intermediates.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({status:record.status,checks:checks.length,D17:force,D18:record.D18,D24:record.D24}));

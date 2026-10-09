// Constructed exact calculus fixtures. Existing scientific programs remain unchanged.
export const fmt = n => n === null || n === undefined ? 'undefined' : typeof n === 'string' ? n : Math.abs(n) < 1e-12 ? '0' : Math.abs(n) < 1e-5 || Math.abs(n) > 1e6 ? n.toExponential(4) : String(Number(n.toFixed(6)));
export const dot = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
export const bowl = (x,y) => x*x+2*y*y;
export const mixed = (x,y) => x*x+2*x*y+2*y*y;
export const sample = (fn,lo,hi,n=80) => Array.from({length:n+1},(_,i)=>{const t=lo+(hi-lo)*i/n;return [t,fn(t)];});
export const gradient = (x,y) => [2*x,4*y];
export const analytic = (x,y) => [2*x*y+Math.cos(x),x*x];
export function pointState(x=1,y=1){return {x,y,z:bowl(x,y)};}
export function residualState(scale=1){const h=.1*scale,k=-.05*scale,actual=bowl(1+h,1+k),linear=2*h+4*k,error=h*h+2*k*k,length=Math.hypot(h,k);return {scale,h,k,actual,affine:3+linear,linear,error,length,normalized:length?error/length:null};}
export function pathPoint(kind,t){return kind==='x-axis'?[t,0]:kind==='y-axis'?[0,t]:kind==='parabola'?[t,t*t]:[t,t];}
export function approachState(kind='line',t=.1){const [x,y]=pathPoint(kind,t),den=x**4+y*y;return {kind,t,x,y,value:den?x*x*y/den:0};}
export function directionState(angle=0,speed=1){const a=angle*Math.PI/180,u=[Math.cos(a),Math.sin(a)],g=[6,-8],v=u.map(x=>speed*x),slope=dot(g,u);return {angle,speed,u,g,v,slope,rate:speed*slope};}
export function chainState(t=.5){return {t,x:t,y:t*t,z:3*t*t,velocity:[1,2*t],gradient:[2*t,2],contributions:[2*t,4*t],rate:6*t};}
export const maximumAngle = Math.atan2(1,2)*180/Math.PI;
export function circleState(angle=0){const theta=angle*Math.PI/180,p=[Math.cos(theta),Math.sin(theta)],tangent=[-p[1],p[0]],value=2*p[0]+p[1],rate=dot([2,1],tangent);return {angle,theta,p,tangent,value,rate};}
export function descentState(eta=.1,iteration=1){const factors=[1-2*eta,1-4*eta],trajectory=Array.from({length:iteration+1},(_,n)=>{const x=3*factors[0]**n,y=-2*factors[1]**n;return {n,x,y,loss:bowl(x,y)};});return {eta,iteration,factors,trajectory,current:trajectory.at(-1)};}
export function adState(vx=2,vy=-1){const x=1.2,y=-.7,sq=x*x,product=sq*y,sine=Math.sin(x),squareTangent=2*x*vx,productTangent=y*squareTangent+sq*vy,sineTangent=Math.cos(x)*vx;return {vx,vy,gradient:analytic(x,y),rows:[['x',x,vx],['y',y,vy],['x × x',sq,squareTangent],['x² × y',product,productTangent],['sin(x)',sine,sineTangent],['product + sine',product+sine,productTangent+sineTangent]],rate:productTangent+sineTangent};}
export function centralGradient(x=1.2,y=-.7,h=1e-4){if(!(Number.isFinite(h)&&h>0))throw new Error('h must be positive and finite');const f=(a,b)=>a*a*b+Math.sin(a);return [(f(x+h,y)-f(x-h,y))/(2*h),(f(x,y+h)-f(x,y-h))/(2*h)];}

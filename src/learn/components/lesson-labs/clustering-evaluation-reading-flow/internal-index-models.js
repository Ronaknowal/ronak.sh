import {six,ids6,mean} from './evaluation-models.js';
/** Direct operations on the already declared six-point ruler, without fitting. */
export function internalOperands(){
 const labels=[0,0,0,1,1,1],centers=[mean(six.slice(0,3)),mean(six.slice(3))],grand=mean(six);
 const residuals=six.map((v,i)=>(v-centers[labels[i]])**2),within=residuals.reduce((a,b)=>a+b,0),between=centers.reduce((s,c)=>s+3*(c-grand)**2,0),total=six.reduce((s,v)=>s+(v-grand)**2,0);
 const radii=centers.map((c,g)=>six.slice(3*g,3*g+3).reduce((s,v)=>s+Math.abs(v-c),0)/3),separation=Math.abs(centers[1]-centers[0]);
 const cross=six.slice(0,3).flatMap((v,i)=>six.slice(3).map((w,j)=>({from:v,to:w,ids:`${ids6[i]}–${ids6[j+3]}`,length:Math.abs(v-w)}))),closest=cross.reduce((a,b)=>b.length<a.length?b:a),diameters=[six[2]-six[0],six[5]-six[3]];
 return {labels,centers,grand,residuals,within,between,total,radii,separation,cross,closest,diameters,ch:(between/1)/(within/4),db:(radii[0]+radii[1])/separation,dunn:closest.length/Math.max(...diameters)};
}

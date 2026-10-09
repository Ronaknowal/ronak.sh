import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {TOKENS,corruptionTrace,expectedCounts,attentionPermissions,selectedLoss,probabilityRow,dynamicView,ILLUSTRATIVE_EMBEDDINGS,embeddingSum} from '../src/learn/data/masked-language-models.js';
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};const close=(a,b)=>{assert.ok(Math.abs(a-b)<1e-12);checks++;};
for(const branch of ['mask','random','keep'])for(const position of [-1,1,2,3,4]){
 const t=corruptionTrace(position,branch,'bank');eq(t.original,TOKENS);eq(t.labels.filter(x=>x!=='−100'),position===-1?[]:[TOKENS[position]]);
 if(position!==-1)eq(t.input[position],branch==='mask'?'[MASK]':branch==='random'?'bank':TOKENS[position]);
}
for(const e of [0,4,100,200])for(const r of [0,.15,.4,1]){const n=expectedCounts(e,r);close(n.unselected+n.mask+n.random+n.keep,e);close(n.mask+n.random+n.keep,n.selected);close(n.emptyProbability,(1-r)**e);}
const bi=attentionPermissions(),ca=attentionPermissions(true);for(let i=0;i<7;i++)for(let j=0;j<7;j++){eq(bi[i][j],j!==6);eq(ca[i][j],j!==6&&j<=i);}eq(bi[5],ca[5]);
for(const p of [.01,.25,.5,.99])for(const q of [.01,.25,.5,.99])for(const active of [[true,true],[false,true],[true,false],[false,false]]){const r=selectedLoss([p,q],active);const rows=[p,q].filter((_,i)=>active[i]);eq(r.count,rows.length);if(rows.length)close(r.mean,rows.reduce((s,v)=>s-Math.log(v),0)/rows.length);else eq(r.mean,null);}
for(let target=0;target<4;target++){const row=probabilityRow(.7,target);close(row.reduce((a,b)=>a+b),1);eq(row[target],.7);}
for(const seed of [1,17,50])for(const visit of [0,3,100]){eq(dynamicView(seed,visit,.15),dynamicView(seed,visit,.15));eq(dynamicView(seed,visit,0).selected,[]);eq(dynamicView(seed,visit,1).selected,[1,2,3,4]);}
embeddingSum.forEach((row,i)=>row.forEach((v,j)=>close(v,ILLUSTRATIVE_EMBEDDINGS.token[i][j]+ILLUSTRATIVE_EMBEDDINGS.position[i][j]+ILLUSTRATIVE_EMBEDDINGS.segment[i][j])));
const source='src/learn/data/masked-language-models.js';const report={checks,source,sha256:createHash('sha256').update(fs.readFileSync(source)).digest('hex'),scope:'Exact browser arithmetic, branch/empty boundaries, binary attention, deterministic local example generator and embedding sums; independent native training verification lives separately.'};
console.log(JSON.stringify(report,null,2));
const out=process.argv[2];if(out){if(fs.existsSync(out))throw Error('Refusing to overwrite evidence');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}

import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { transformSync } from 'esbuild';
import { parse } from '@babel/parser';
const base='docs/teaching/llm-architecture-training/multimodal-pre-training-vision-encoders-cross-modal-alignment/runtime-formatting';
const receipt=JSON.parse(fs.readFileSync(`${base}/equivalence.json`,'utf8'));
const omit=new Set(['loc','start','end','extra','comments','leadingComments','innerComments','trailingComments']);
let merges=0;
function clean(node,jsxNames) {
  if(Array.isArray(node))return node.map(n=>clean(n,jsxNames));
  if(!node||typeof node!=='object')return node;
  const next=Object.fromEntries(Object.entries(node).filter(([k])=>!omit.has(k)).map(([k,v])=>[k,clean(v,jsxNames)]));
  // Restrict coalescing to the children property of an actual imported JSX factory call.
  if(next.type==='CallExpression'&&next.callee.type==='Identifier'&&jsxNames.has(next.callee.name)) {
    const properties=next.arguments[1]?.properties;
    for(const p of properties||[])if(p.type==='ObjectProperty'&&p.key.name==='children'&&p.value.type==='ArrayExpression') {
      const children=[];
      for(const child of p.value.elements) {
        if(child?.type==='StringLiteral'&&children.at(-1)?.type==='StringLiteral') {children.at(-1).value+=child.value;merges++;}
        else children.push(child);
      }
      p.value.elements=children;
    }
  }
  return next;
}
function ast(source) {
  const transformed=transformSync(source,{loader:'jsx',jsx:'automatic',target:'esnext'}).code;
  const tree=parse(transformed,{sourceType:'module'});
  const names=new Set(tree.program.body.filter(n=>n.type==='ImportDeclaration'&&n.source.value==='react/jsx-runtime').flatMap(n=>n.specifiers.map(s=>s.local.name)));
  return clean(tree,names);
}
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const results=[];
for(const row of receipt.changes) {
  const old=fs.readFileSync(row.predecessor),current=fs.readFileSync(row.file);
  assert.equal(sha(old),row.before);assert.equal(sha(current),row.after);
  assert.deepEqual(ast(old.toString()),ast(current.toString()),row.file);
  results.push({file:row.file,before:row.before,after:row.after,qualifiedFactoryAstEqual:true});
}
fs.writeFileSync(`${base}/independent-equivalence.json`,JSON.stringify({status:'passed',scope:'Read-only comparison; only adjacent strings in imported React JSX factory children coalesced, not ordinary children-named arrays.',merges,results,scriptSha256:sha(fs.readFileSync('scripts/review-multimodal-formatting.mjs'))},null,2)+'\n');
console.log(JSON.stringify({status:'passed',merges,results}));

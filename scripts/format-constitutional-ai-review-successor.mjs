import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { transformSync } from 'esbuild';
import { parse } from '@babel/parser';
import { format } from '../scratch/lesson-format/standalone.mjs';
import babel from '../scratch/lesson-format/plugins/babel.mjs';
import estree from '../scratch/lesson-format/plugins/estree.mjs';
const base='docs/teaching/llm-architecture-training/constitutional-ai-cai/review-successor';
const sources=['src/learn/components/lesson-labs/ConstitutionalAIFlow.jsx','src/learn/data/constitutional-ai-models.js','docs/teaching/llm-architecture-training/constitutional-ai-cai/manuscript.jsx'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const omit=new Set(['loc','start','end','extra','comments','leadingComments','innerComments','trailingComments']);
let merges=0;
function clean(node,names) {
  if(Array.isArray(node))return node.map(x=>clean(x,names));
  if(!node||typeof node!=='object')return node;
  const n=Object.fromEntries(Object.entries(node).filter(([k])=>!omit.has(k)).map(([k,v])=>[k,clean(v,names)]));
  if(n.type==='CallExpression'&&n.callee.type==='Identifier'&&names.has(n.callee.name))for(const p of n.arguments[1]?.properties||[]) {
    if(p.type!=='ObjectProperty'||p.key.name!=='children'||p.value.type!=='ArrayExpression')continue;
    const children=[];
    for(const child of p.value.elements) {
      if(child?.type==='StringLiteral'&&children.at(-1)?.type==='StringLiteral'){children.at(-1).value+=child.value;merges++;}
      else children.push(child);
    }
    p.value.elements=children;
  }
  return n;
}
function ast(source) {
  const code=transformSync(source,{loader:'jsx',jsx:'automatic',target:'esnext'}).code;
  const tree=parse(code,{sourceType:'module'});
  const names=new Set(tree.program.body.filter(n=>n.type==='ImportDeclaration'&&n.source.value==='react/jsx-runtime').flatMap(n=>n.specifiers.map(s=>s.local.name)));
  return clean(tree,names);
}
const rows=[];
for(const file of sources) {
  const raw=fs.readFileSync(file,'utf8');
  // Preserve this intentional leading text space as one JSX child. Otherwise
  // Prettier emits separate space/text children and changes jsx to jsxs.
  const prepared=raw.replace('> Few-shot example answer: unrelated sample response.</ins>',">{' Few-shot example answer: unrelated sample response.'}</ins>");
  const pretty=await format(prepared,{parser:'babel',plugins:[babel,estree],singleQuote:true,printWidth:100});
  assert.deepEqual(ast(raw),ast(pretty),file);
  const beforePath=`${base}/preformat-${file.split('/').at(-1)}`;
  fs.writeFileSync(beforePath,raw,{flag:'wx'});fs.writeFileSync(file,pretty);
  rows.push({file,beforePath,before:sha(raw),after:sha(pretty),previousLines:raw.split('\n').length,currentLines:pretty.split('\n').length,qualifiedFactoryAstEqual:true});
}
fs.writeFileSync(`${base}/format-equivalence.json`,JSON.stringify({status:'passed',formatter:'pinned Prettier3.6.2',scope:'Formatting after teaching corrections; only literal strings within imported React JSX factory children coalesced. Scientific algorithms unchanged.',merges,rows,scriptSha256:sha(fs.readFileSync('scripts/format-constitutional-ai-review-successor.mjs'))},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(rows,null,2));

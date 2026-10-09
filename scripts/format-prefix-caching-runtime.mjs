import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
import generateModule from '@babel/generator';
const generate=generateModule.default||generateModule;
const topic='docs/teaching/llm-architecture-training/prefix-caching-prompt-caching';
const files=[`${topic}/lesson.jsx`,'src/learn/data/prefix-caching-models.js',...['Shared','Foundations','Storage','Native','Policy'].map(n=>`src/learn/components/lesson-labs/PrefixCaching${n}.jsx`)];
const clean=node=>{
  if(Array.isArray(node))return node.map(clean).filter(x=>x!==null);
  if(!node||typeof node!=='object')return node;
  if(node.type==='JSXText'&&!node.value.trim())return null;
  return Object.fromEntries(Object.entries(node).filter(([k])=>!['start','end','loc','extra','tokens','comments','leadingComments','trailingComments','innerComments'].includes(k)).map(([k,v])=>[k,clean(v)]));
};
const hash=x=>createHash('sha256').update(x).digest('hex');const rows=[];
for(const file of files){
  const before=fs.readFileSync(file,'utf8'),ast=parse(before,{sourceType:'module',plugins:['jsx']});
  let code=generate(ast,{comments:true,compact:false,jsescOption:{minimal:true}}).code;
  const formatted=parse(code,{sourceType:'module',plugins:['jsx']}),inserts=new Map();
  const add=(position,depth)=>inserts.set(position,'\n'+'  '.repeat(depth));
  function walk(node,depth=0){
    if(!node||typeof node!=='object')return;
    if(node.type==='JSXElement'){
      const opening=node.openingElement;
      if(opening.attributes.length>1){opening.attributes.forEach(a=>add(a.start,depth+1));add(opening.end-(opening.selfClosing?2:1),depth);}
      if(node.children.length&&!node.children.some(n=>n.type==='JSXText'&&n.value.trim())){
        node.children.filter(n=>n.type!=='JSXText').forEach(n=>add(n.start,depth+1));
        if(node.closingElement)add(node.closingElement.start,depth);
      }
      node.children.forEach(n=>walk(n,depth+1));return;
    }
    for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(n=>walk(n,depth));else if(value&&typeof value==='object')walk(value,depth);}
  }
  walk(formatted);
  for(const [position,text] of [...inserts.entries()].sort((a,b)=>b[0]-a[0]))code=code.slice(0,position)+text+code.slice(position);
  code+='\n';assert.deepEqual(clean(parse(code,{sourceType:'module',plugins:['jsx']})),clean(ast),file+' semantic AST');
  fs.writeFileSync(file,code);rows.push({file,before:hash(before),after:hash(code),semanticAST:'equal excluding inert JSX whitespace and parser metadata'});
}
const output=`${topic}/runtime-formatting-${Date.now()}.json`;fs.writeFileSync(output,JSON.stringify({rows},null,2)+'\n');console.log(JSON.stringify({output,files:rows.length}));

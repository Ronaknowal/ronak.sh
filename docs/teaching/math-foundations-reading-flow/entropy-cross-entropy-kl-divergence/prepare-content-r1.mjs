// Extract existing complete examples/practice; no scientific execution or runtime mutation.
import fs from 'node:fs';import path from 'node:path';import {parse} from '@babel/parser';import {createHash} from 'node:crypto';
import {entropyInformationExamples as examples} from '../../../../src/learn/data/entropy-information-examples.js';
const folder='docs/teaching/math-foundations-reading-flow/entropy-cross-entropy-kl-divergence/content-prepared';
const hash=b=>createHash('sha256').update(b).digest('hex');
const write=(p,s)=>{if(fs.existsSync(p))throw Error('Exists '+p);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);};
const programmes={};
for(const [key,p]of Object.entries(examples)){const filename=`entropy_${key}.py`,source=`${folder}/programmes/${filename}`,outputPath=`${folder}/outputs/${filename}.display.txt`;write(source,p.code);write(outputPath,p.expected);programmes[key]={filename,title:p.title,question:p.question,source,sourceSha256:hash(p.code),outputPath,outputSha256:hash(p.expected),outputRole:'Retained exact expected output with historical execution attribution; no new run',originalModule:'src/learn/data/entropy-information-examples.js',newExecution:false};}
write(`${folder}/preserved-programmes.json`,JSON.stringify(programmes,null,2)+'\n');
const original='src/learn/data/topics/entropy-cross-entropy-kl-divergence.jsx',source=fs.readFileSync(original,'utf8');
const ast=parse(source,{sourceType:'module',plugins:['jsx']});
function text(n){if(!n)return '';if(n.type==='JSXText')return n.value.replace(/\s+/g,' ');if(n.type==='StringLiteral')return n.value;if(n.type==='JSXExpressionContainer')return text(n.expression);if(n.type==='JSXElement'||n.type==='JSXFragment')return(n.children||[]).map(text).join('');throw Error('Unhandled '+n.type);}
const props=n=>Object.fromEntries(n.openingElement.attributes.filter(a=>a.type==='JSXAttribute').map(a=>[a.name.name,a.value]));
const practices=[],checkpoints=[];
function walk(n){if(!n||typeof n!=='object')return;if(n.type==='JSXElement'){const name=n.openingElement.name.name,p=props(n);if(name==='Practice')practices.push({title:text(p.title),prompt:text(n).trim(),hint:text(p.hint),solution:text(p.solution).trim(),originalJsx:source.slice(n.start,n.end)});if(name==='Checkpoint')checkpoints.push({prompt:text(p.prompt),solution:text(n).trim()});}for(const[k,v]of Object.entries(n))if(!['loc','start','end'].includes(k))Array.isArray(v)?v.forEach(walk):walk(v);}
walk(ast);if(practices.length!==9||checkpoints.length!==2)throw Error('Practice conservation');
write(`${folder}/original-practice-checkpoints.json`,JSON.stringify({source:original,sha256:hash(source),practices,checkpoints},null,2)+'\n');
console.log(JSON.stringify({programmes:Object.keys(programmes).length,practices:practices.length,checkpoints:checkpoints.length,scientificExecutions:0}));

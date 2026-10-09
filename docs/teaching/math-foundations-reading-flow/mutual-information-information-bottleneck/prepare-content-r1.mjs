import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parse} from '@babel/parser';
import {mutualInformationExamples as examples} from '../../../../src/learn/data/mutual-information-examples.js';
import {mechanismProgram} from '../../../../src/learn/data/mutual-information-mechanism-program.js';
const folder='docs/teaching/math-foundations-reading-flow/mutual-information-information-bottleneck/content-prepared';
const hash=s=>createHash('sha256').update(s).digest('hex');
function write(p,s){if(fs.existsSync(p)&&!p.endsWith('/original-readable-baseline.md')&&!p.endsWith('/original-practice-checkpoints.json')){const expected=typeof s==='string'?s:JSON.stringify(s,null,2)+'\n';if(fs.readFileSync(p,'utf8')===expected)return;throw Error('Existing different '+p);}fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof s==='string'?s:JSON.stringify(s,null,2)+'\n');}
const programmes={};
for(const[key,p]of Object.entries(examples)){const filename=`mi_${key}.py`,source=`${folder}/programmes/${filename}`,outputPath=`${folder}/outputs/${filename}.display.txt`;write(source,p.code);write(outputPath,p.expected);programmes[key]={filename,title:p.title,question:p.question,source,sourceSha256:hash(p.code),outputPath,outputSha256:hash(p.expected),role:'Preserved exact historical code/output; no new main execution'};}
const bp='public'+mechanismProgram.source,bc=fs.readFileSync(bp,'utf8'),bn='mutual-information-library-bridge.py';write(`${folder}/programmes/${bn}`,bc);write(`${folder}/outputs/${bn}.display.txt`,mechanismProgram.output);programmes.bridge={filename:bn,source:`${folder}/programmes/${bn}`,sourceSha256:hash(bc),outputPath:`${folder}/outputs/${bn}.display.txt`,outputSha256:hash(mechanismProgram.output),original:bp,role:'Preserved exact historical code/output; no new main execution'};
write(`${folder}/preserved-programmes.json`,programmes);
const filename='src/learn/data/topics/mutual-information-information-bottleneck.jsx',source=fs.readFileSync(filename,'utf8'),ast=parse(source,{sourceType:'module',plugins:['jsx']});
function value(n){if(!n)return '';if(n.type==='JSXExpressionContainer')return value(n.expression);if(n.type==='StringLiteral')return n.value;if(n.type==='NumericLiteral')return String(n.value);if(n.type==='TaggedTemplateExpression')return n.quasi.quasis.map(q=>q.value.raw).join('');if(n.type==='ArrayExpression')return n.elements.map(value);if(n.type==='JSXText')return n.value.replace(/\s+/g,' ');if(n.type==='JSXElement'||n.type==='JSXFragment')return render(n);throw Error('Unhandled value '+n.type);}
const props=n=>Object.fromEntries(n.openingElement.attributes.filter(a=>a.type==='JSXAttribute').map(a=>[a.name.name,a.value]));
const practices=[],checkpoints=[];
function render(n){if(n.type!=='JSXElement'&&n.type!=='JSXFragment')return value(n);if(n.type==='JSXFragment')return n.children.map(render).join('');const name=n.openingElement.name.name,p=props(n),children=()=>n.children.map(render).join('').trim();
if(name==='PromptedExample'){const key=p.example.expression.property.name,ex=examples[key];return `\n\nQuestion: ${ex.question}\n\n\`\`\`python\n${ex.code}\`\`\`\n\nRetained output:\n\n\`\`\`text\n${ex.expected}\n\`\`\`\n\n`;}
if(name==='MechanismProgram')return `\n\n\`\`\`python\n${bc}\`\`\`\n\n\`\`\`text\n${mechanismProgram.output}\n\`\`\`\n\n`;
if(name==='LessonTable')return '\n\n'+[value(p.headers),...value(p.rows)].map((r,i)=>'| '+r.join(' | ')+' |'+(i===0?'\n| '+r.map(()=>'---').join(' | ')+' |':'')).join('\n')+'\n\n';
if(name==='Practice'){const item={prompt:value(p.prompt),hint:value(p.hint),solution:children(),originalJsx:source.slice(n.start,n.end)};practices.push(item);return `\n\nPractice: ${item.prompt}\n\nHint: ${item.hint}\n\nSolution: ${item.solution}\n\n`;}
if(name==='Checkpoint'){const item={prompt:value(p.prompt),solution:children()};checkpoints.push(item);return `\n\nCheck: ${item.prompt}\n\n${item.solution}\n\n`;}
if(name==='Sources')return '\n\n[[ORIGINAL_SOURCES_COMPONENT]]\n\n';
if(name==='a')return `[${children()}](${value(p.href)})`;
if(name==='Code')return '`'+children()+'`';if(name==='strong')return '**'+children()+'**';if(name==='em')return '*'+children()+'*';
if(name==='MathBlock')return '\n\n$$\n'+children()+'\n$$\n\n';if(name==='H2'||name==='H3')return '\n\n'+(name==='H2'?'## ':'### ')+children()+'\n\n';
if(['Prose','p','LessonIntro'].includes(name))return '\n\n'+children()+'\n\n';
if(name==='li')return '\n- '+children();if(['div','section','details','summary','ul','ol'].includes(name))return '\n\n'+children()+'\n\n';if(['span','Fragment'].includes(name))return children();
return '\n\n[['+name+']]\n\n';}
let main;function walk(n){if(!n||typeof n!=='object')return;if(n.type==='JSXElement'&&n.openingElement.name.name==='div'&&props(n).className?.value==='lesson-pilot mutual-information-lesson')main=n;for(const[k,v]of Object.entries(n))if(!['loc','start','end'].includes(k))Array.isArray(v)?v.forEach(walk):walk(v);}
walk(ast);if(!main)throw Error('Main missing');const baseline=render(main).replace(/\n{3,}/g,'\n\n').trim()+'\n';
write(`${folder}/original-readable-baseline.md`,baseline);write(`${folder}/original-practice-checkpoints.json`,{source:filename,sha256:hash(source),practices,checkpoints});
console.log(JSON.stringify({preservedProgrammes:Object.keys(programmes).length,practice:practices.length,checkpoints:checkpoints.length,baselineBytes:Buffer.byteLength(baseline),mainExecutions:0}));

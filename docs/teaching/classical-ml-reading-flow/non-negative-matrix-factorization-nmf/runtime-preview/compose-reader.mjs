// Authoring-only composition from the frozen manuscript and its exact delivery manifest.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {renderPreparedLesson} from '../../../../../scripts/lib/prepared-lesson-renderer.mjs';
const owner=path.dirname(fileURLToPath(import.meta.url)),app=path.resolve(owner,'../../../../..'),topic=path.dirname(owner),content=path.join(topic,'content-preparation');
const digest=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const binding=file=>{const raw=fs.readFileSync(file);return {path:path.relative(app,file).replaceAll('\\','/'),bytes:raw.length,sha256:digest(raw)};};
const acceptance=JSON.parse(fs.readFileSync(path.join(topic,'content-accepted-root.json'),'utf8'));
for(const [file,expected] of Object.entries(acceptance.files))if(binding(path.resolve(app,file)).sha256!==expected)throw Error(`Accepted source drift: ${file}`);
const manifest=JSON.parse(fs.readFileSync(path.join(content,'practice-resources-authoring/section-nineteen-handoff.json'),'utf8'));
let manuscript=fs.readFileSync(path.join(content,'lesson.md'),'utf8').replaceAll('\r\n','\n');
if(digest(fs.readFileSync(path.join(content,'lesson.md')))!=='3907412af22650e27be5a9f1f275864e4ee3f24d35a396b2e0028dfa10b0af83')throw Error('Full accepted manuscript required');
const fenced=[...manuscript.matchAll(/```([^\n]*)\n([\s\S]*?)\n```/g)];
const prefix='/learn-assets/nmf-private/',payloads=[],sourceMatches=[],replacements=[];
fs.mkdirSync(path.join(owner,'decoded-originals'),{recursive:true});
for(const entry of manifest.fileManifest){
 let source;
 if(entry.identity){source=entry.identity.path;if(binding(source).sha256!==entry.identity.sha256)throw Error(`File drift ${entry.file}`);}
 else{source=path.join(owner,'decoded-originals',entry.file);const raw=Buffer.from(entry.completeBody);if(digest(raw)!==entry.decodedCodeSha256)throw Error('Decoded original code identity');fs.writeFileSync(source,raw);}
 const row={filename:entry.file,role:entry.role,url:prefix+entry.file,source:binding(source)};payloads.push(row);
 if(entry.file.endsWith('.py')&&entry.file!=='centered_pca.py')sourceMatches.push({...row,text:fs.readFileSync(source,'utf8').replaceAll('\r\n','\n').trim()});
 if(entry.decodedOutputSha256){
  const block=fenced.find(m=>[m[2],m[2].trim(),m[2]+'\n'].some(v=>digest(Buffer.from(v))===entry.decodedOutputSha256));if(!block)throw Error(`Original output absent ${entry.file}`);
  const exact=[block[2],block[2].trim(),block[2]+'\n'].find(v=>digest(Buffer.from(v))===entry.decodedOutputSha256),filename=entry.file.replace('.py','.retained.stdout.txt'),file=path.join(owner,'decoded-originals',filename);
  fs.writeFileSync(file,exact);const output={filename,role:'preserved decoded original output',url:prefix+filename,source:binding(file),text:exact.trim(),output:true};payloads.push(output);sourceMatches.push(output);
 }
}
for(const stream of manifest.streams){
 const filename=path.basename(stream.path),source=stream.path;if(binding(source).sha256!==stream.sha256)throw Error(`Recorded stream drift ${filename}`);
 const row={filename,role:'complete recorded stream; source/version qualifications retained beside it',url:prefix+filename,source:binding(source),text:fs.readFileSync(source,'utf8').replaceAll('\r\n','\n').trim(),output:true};payloads.push(row);sourceMatches.push(row);
}
const used=new Set();let wholeCodes=0,wholeOutputs=0,snippets=0;
manuscript=manuscript.replace(/```([^\n]*)\n([\s\S]*?)\n```/g,(block,language,body)=>{
 const row=sourceMatches.find(r=>r.text===body.trim());
 if(!row){snippets++;return block;}
 if(used.has(row.url))throw Error(`Repeated whole source ${row.filename}`);used.add(row.url);
 row.output?wholeOutputs++:wholeCodes++;
 const key=`WHOLE_SOURCE_${String(used.size).padStart(3,'0')}_END`;replacements.push([key,`<RemoteCodeBlock source={${JSON.stringify(row.url)}} filename={${JSON.stringify(row.filename)}} language="${row.output?'output':'python'}" />`]);return key;
});
if(wholeCodes!==18||wholeOutputs!==19)throw Error(`Whole delivery mismatch ${wholeCodes}/${wholeOutputs}`);
for(let n=1;n<=66;n++){const id=`D${String(n).padStart(2,'0')}`,key=`FIGURE_${id}`,marker=`<!-- figure:${id} -->`;if(manuscript.split(marker).length!==2)throw Error(`Expected one ${id}`);manuscript=manuscript.replace(marker,key);replacements.push([key,`<NmfFigure id="${id}" />`]);}
const practice=[];
manuscript=manuscript.replace(/### Practice ([A-X]): ([^\n]+)\n([\s\S]*?)(?=\n### |$)/g,(_all,id,title,body)=>{
 const fields=['Task','Hint','Reasoned solution','Tempting wrong route','Success check'].map(name=>{const escaped=name.replaceAll('.','\\.');const match=body.match(new RegExp(`\\*\\*${escaped}\\.\\*\\* ([\\s\\S]*?)(?=\\n\\n\\*\\*|$)`));if(!match)throw Error(`Practice ${id} ${name}`);return match[1].trim();});
 const render=text=>renderPreparedLesson(text).jsx;
 const key=`PRACTICE_${id}`;replacements.push([key,`<section className="nmf-practice" data-lesson-exercise="${id}"><H3>{${JSON.stringify('Practice '+id+': '+title)}}</H3>${render('**Task.** '+fields[0])}<details><summary>Hint</summary>${render(fields[1])}</details><details><summary>Reasoned solution</summary>${render(fields[2])}${render('**Tempting wrong route.** '+fields[3])}</details>${render('**Success check.** '+fields[4])}</section>`]);practice.push(id);return key+'\n';
});
if(practice.length!==24)throw Error('All24 independent practices required');
const rendered=renderPreparedLesson(manuscript,{replacements,opening:[['A bright pixel,','summary'],['You need addition,','prerequisites']]});
if(rendered.sections.length!==19)throw Error('All19 sections required');
let jsx=rendered.jsx.replaceAll('<div className="neural-equation">','<div className="neural-equation" tabIndex={0} role="region" aria-label="Complete mathematical derivation; scroll horizontally when needed">');
// The maintained subset renderer handles bold/code/math. Resolve authored italic
// prose here, while explicitly conserving code and mathematical string children.
jsx=jsx.replace(/<Prose(?: [^>]*)?>[\s\S]*?<\/Prose>/g,prose=>prose.split(/(<code>[\s\S]*?<\/code>|<InlineMath>[\s\S]*?<\/InlineMath>)/g).map(part=>part.startsWith('<code>')||part.startsWith('<InlineMath>')?part:part.replace(/\{("(?:[^"\\]|\\.)*")\}/g,(node,literal)=>{
 const value=JSON.parse(literal);if(!/\*[^*]+\*/.test(value))return node;
 return value.split(/\*([^*]+)\*/g).map((text,i)=>i%2?`<em>{${JSON.stringify(text)}}</em>`:`{${JSON.stringify(text)}}`).join('');
})).join(''));
const aliases=['1-a-component-is-a-pattern-and-an-activation-is-an-amount','2-what-gets-optimized','3-learn-one-factor-while-holding-the-other-still','4-the-same-observations-can-have-different-explanations','5-fit-real-digits-and-inspect-the-result','6-practical-choices-that-change-the-model','7-deeper-geometry-optimization-and-the-limits-of-factorization','8-deeper-applications-words-spectra-and-streams','9-practice-explain-change-diagnose','10-readiness-and-the-next-step'];
const destinations=[1,3,5,2,12,10,14,16,19,19];
for(let i=0;i<aliases.length;i++){const heading=rendered.sections[destinations[i]-1][1],needle=`<H2>{${JSON.stringify(heading)}}</H2>`;jsx=jsx.replace(needle,`<span id="${aliases[i]}" className="nmf-historical-anchor" />\n${needle}`);}
const firstH2=jsx.indexOf('<H2>');
jsx=jsx.slice(0,firstH2)+`<nav className="nmf-compass" aria-label="Complete lesson sections"><ol>${rendered.sections.map(([id,title])=>`<li><a href="#${id}">{${JSON.stringify(title.replace(/^\d+\. /,''))}}</a></li>`).join('')}</ol></nav>\n`+jsx.slice(firstH2);
const fileHeading='<H3>{"Files for the worked implementations"}</H3>',resourceHeading='<H3>{"Another way to learn these ideas"}</H3>',referenceHeading='<H3>{"Technical references and provenance"}</H3>',readinessHeading='<H3>{"Readiness and the next question"}</H3>';
const practiceStart=jsx.indexOf('<section className="nmf-practice"'),fileStart=jsx.indexOf(fileHeading);
jsx=jsx.slice(0,practiceStart)+'<section className="lesson-ending lesson-ending--practice" data-lesson-ending="practice">'+jsx.slice(practiceStart,fileStart)+'</section>'+jsx.slice(fileStart);
jsx=jsx.replace(fileHeading,fileHeading+'\n<FileIndex />');
for(const [heading,next,kind] of [[fileHeading,resourceHeading,'files'],[resourceHeading,referenceHeading,'further-learning'],[referenceHeading,readinessHeading,'references'],[readinessHeading,null,'next']]){
 const begin=jsx.indexOf(heading),end=next?jsx.indexOf(next):jsx.length;if(begin<0||end<0)throw Error(`Missing ending ${kind}`);jsx=jsx.slice(0,begin)+`<section className="lesson-ending" data-lesson-ending="${kind}">`+jsx.slice(begin,end)+'</section>'+jsx.slice(end);
}
const source=`import React from 'react';\nimport {H2,H3} from '../../../../../src/learn/components/content/Headings.jsx';\nimport {Prose} from '../../../../../src/learn/components/content/Prose.jsx';\nimport {CodeBlock} from '../../../../../src/learn/components/content/Code.jsx';\nimport RemoteCodeBlock from '../../../../../src/learn/components/content/RemoteCodeBlock.jsx';\nimport {Math as InlineMath,MathBlock} from '../../../../../src/learn/components/content/Math.jsx';\nimport {Table as NeuralTable} from './Drawing.jsx';\nimport {NmfFigure} from './NmfFigures.jsx';\nimport {FileIndex} from './FileIndex.jsx';\nimport './lesson.css';\nfunction NmfLesson(){return <div className="lesson-flow nmf-reader">\n${jsx}\n</div>;}\nexport default {title:'Non-Negative Matrix Factorization (NMF)',readTime:'~120 min core reading · code and practice in separate sittings',hasIntegratedGuide:true,content:NmfLesson};\n`;
fs.writeFileSync(path.join(owner,'nmf-lesson.jsx'),source);
fs.writeFileSync(path.join(owner,'file-payloads.json'),JSON.stringify({schema:'nmf-exact-private-delivery/v1',prefix,files:payloads.map(({text,output,...row})=>row)},null,2)+'\n');
fs.writeFileSync(path.join(owner,'file-index-data.js'),'export const files='+JSON.stringify(payloads.filter(row=>manifest.fileManifest.some(entry=>entry.file===row.filename)).map(({text,output,...row})=>row))+';\n');
const receipt={schema:'nmf-static-reader-composition/v1',manuscript:binding(path.join(content,'lesson.md')),acceptedInputs:Object.keys(acceptance.files).length,output:binding(path.join(owner,'nmf-lesson.jsx')),sections:rendered.sections,figures:66,wholeCodes,wholeOutputs,snippets,practice,aliases:aliases.map((id,i)=>({id,destination:rendered.sections[destinations[i]-1][0]})),payloads:payloads.map(({text,output,...row})=>row),parserShipsToBrowser:false,scientificExecutions:0};
fs.writeFileSync(path.join(owner,'composition.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({sections:19,figures:66,wholeCodes,wholeOutputs,snippets,practice:24,payloads:payloads.length,output:receipt.output}));

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const owner=path.dirname(fileURLToPath(import.meta.url));
const base=path.resolve(owner,'../..');
const root=path.resolve(base,'../../../../../..');
const binding=p=>{const b=fs.readFileSync(p);return{path:path.relative(root,p).replaceAll('\\','/'),bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')};};
const source=path.join(base,'IdentifiabilityFigures.jsx');
const original=fs.readFileSync(source,'utf8');
const edits=[
  ["from './Drawing.jsx'","from '../../Drawing.jsx'"],
  ["from './nmf-model.js'","from '../../nmf-model.js'"],
  ['label="New query first amount t" value={t} onChange={setT} max={1} step={.02}', 'label="New query first amount t" value={t} onChange={setT} max={1} step={.01}'],
];
let result=original;
for(const [before,after] of edits){if(result.split(before).length!==2)throw new Error('Non-unique correction');result=result.replace(before,after);}
let inverse=result;
for(const [before,after] of [...edits].reverse())inverse=inverse.replace(after,before);
if(inverse!==original)throw new Error('Physical inverse failed');
const destination=path.join(owner,'IdentifiabilityFigures.jsx');
if(fs.existsSync(destination))throw new Error('Preserve existing successor');
fs.writeFileSync(destination,result);
const receipt={schema:'nmf-native-control-caption-source/v1',source:binding(source),successor:binding(destination),edits,inverseExact:true,unchangedModel:binding(path.join(base,'nmf-model.js')),readabilitySource:binding(path.join(owner,'../readability-correction/SavedDataFigures.jsx')),findings:[{id:'anchor-step',actual:'At initial/reset t=.25, browser input is .26 because step .02 excludes .25; ArrowRight jumps to .28.',correction:'Use .01, preserving .25, endpoints and all model calculations.'},{id:'caption-overflow',actual:'768/root32: root client753, scroll763; unbroken operand caption scroll676 in580-wide caption.',correction:'Allow natural wrapping of long figcaption tokens; keep mathematical display regions and the D46 local scroller intact.'}],limits:['No numerical programme, fit, SSR or old campaign rerun.','Source preparation is not actual corrected browser acceptance.']};
fs.writeFileSync(path.join(owner,'source-preparation.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const folder=path.join(path.dirname(fileURLToPath(import.meta.url)),'content-prepared');
let text=fs.readFileSync(path.join(folder,'manuscript-complete-r1.md'),'utf8');
const changes=[];
function change(old,next){if(text.split(old).length!==2)throw Error('Not unique '+old);changes.push({before:old,after:next});text=text.replace(old,next);}
change('KL(P∥Q) averages P\'s prices; KL(Q∥P) averages Q\'s.','KL(P∥Q) weights the log ratio by P; KL(Q∥P) weights the reversed log ratio by Q.');
change('The conditional portion of `information_library.py` in section4 performs','The complete `information_library.py` below performs');
change('/learn/path/full-curriculum/greedy-algorithms-exchange-arguments?module=dsa#6-merge-the-smallest-frequencies-to-build-a-prefix-code','/learn/path/full-curriculum/greedy-algorithms-exchange-arguments#6-merge-small-parts-into-a-code');
// The original nine prompt/hint/solution strings remain literal, not rephrased by typography repair.
const old=JSON.parse(fs.readFileSync(path.join(folder,'original-practice-checkpoints.json'),'utf8'));
const originals=new Set(old.practices.flatMap(x=>[x.prompt,x.hint,x.solution]));
const protectedParts=/(```[\s\S]*?```|\$\$[\s\S]*?\$\$|`[^`]*`|\[[^\]]*\]\([^)]*\)|<[^>]*>)/g;
function tidy(s){return s.replace(/\b([A-Za-z]{2,})(?=\.?\d)/g,(all,w)=>['float','log','logsumexp','int'].includes(w)?all:w+' ').replace(/(\d)(?=(?:bits?\b|nats?\b|rows?\b|symbols?\b|records?\b|tokens?\b|returns\b|gives\b|and\b|or\b|to\b|for\b|after\b|before\b|under\b|over\b|even\b|requires\b|is\b|not\b|Adelie\b|Gentoo\b))/g,'$1 ').replace(/([)\]])(?=(?:and|or|as|with|gives|shows|bits?|nats?|is|for)\b)/g,'$1 ').replace(/(?<=\d)to(?=\d)/g,' to ').replace(/\b(and|or|as|by|at|in|from|to)(?=\.?\d)/g,'$1 ');}
text=text.split(/\n\n/).map(p=>originals.has(p)?p:p.split(protectedParts).map((x,i)=>i%2?x:tidy(x)).join('')).join('\n\n');
// Validate source blocks and original task text are conserved despite prose spacing.
const before=fs.readFileSync(path.join(folder,'manuscript-complete-r1.md'),'utf8');
const blocks=s=>[...s.matchAll(/```python\n([\s\S]*?)```/g)].map(x=>x[1]);
if(JSON.stringify(blocks(text))!==JSON.stringify(blocks(before)))throw Error('Code changed');
for(const p of originals)if(!text.includes(p))throw Error('Original practice changed '+p.slice(0,60));
const out=path.join(folder,'manuscript-complete-r2.md');if(fs.existsSync(out))throw Error('Exists');fs.writeFileSync(out,text);
const specs=JSON.parse(fs.readFileSync(path.join(folder,'visual-contracts-r1.json'),'utf8'));
specs.find(x=>x.id==='E03').geometry='Draw a rooted two-stage probability tree. First choose one of two equally likely branches; each then has four equally likely children, so each complete leaf has mass1/8. Highlight a path with factors1/2×1/4 and costs1+2. Beside it draw a distinct copied-bit channel: after first0 only second0 is possible, conditional mass1. The text explicitly names the change from two/four-way choices to the copied-bit example.';
specs.find(x=>x.id==='E03').checks='Independent selected two/four-way path has probability1/8 and surprise3; copied fair-bit pair00 has joint probability1/2 and surprise1.';
specs.find(x=>x.id==='E07').geometry='Left draw g(p)=−p ln p with its continuous limit g(0)=0; right H2(p) and the chord joining the two certain laws p0 andp1, with their mixture atp.5. The chord is the zero-entropy baseline; the midpoint entropy1 sits above it.';
specs.find(x=>x.id==='E07').checks='g tends0 at0; H(0)=H(1)=0 while H(.5)=1. The average component entropy is0; entropy of the equal mixture is1.';
for(const c of specs){const marker=`[[${c.id}]]`,i=text.indexOf(marker);c.introduction=text.slice(0,i).trimEnd().split('\n\n').at(-1);c.interpretation=text.slice(i+marker.length).trimStart().split('\n\n')[0];}
let specText=fs.readFileSync(path.join(folder,'visual-specifications-r1.md'),'utf8');
const tail=specText.slice(specText.indexOf('## Focused investigations'));
specText=specText.slice(0,specText.indexOf('## Per-placement drawing contracts')).replace('manuscript-complete-r1.md','manuscript-complete-r2.md')+'## Per-placement drawing contracts\n';
for(const c of specs)specText+=`\n### ${c.id} — ${c.purpose}\n\nPlacement lead: ${c.introduction}\n\nDraw: ${c.geometry}\n\nEncoding: ${c.encoding}\n\nRequired mathematical checks: ${c.checks}\n\nNarrow/enlarged arrangement: ${c.responsive} Apply the common accessible text/controls contract to the named operation.\n\nFollowing interpretation: ${c.interpretation}\n`;
specText+='\n'+tail;
fs.writeFileSync(path.join(folder,'visual-specifications-r2.md'),specText);
fs.writeFileSync(path.join(folder,'visual-contracts-r2.json'),JSON.stringify(specs,null,2)+'\n');
fs.writeFileSync(path.join(folder,'author-content-correction-r2.json'),JSON.stringify({status:'AUTHOR_SELF_READING_CORRECTIONS_NOT_INDEPENDENT',changes,additional:'E03 visual corrected to actual two/four-way probability tree; E07 visual corrected to manuscript certain-law mixture. New prose number/unit spacing improved, protected full Python and all27 original task strings byte-identical.',codeBlocks:blocks(text).length,originalPracticeStrings:originals.size,scientificMainReplay:0},null,2)+'\n');
console.log(JSON.stringify({bytes:Buffer.byteLength(text),codeBlocks:blocks(text).length,originalPracticeStrings:originals.size,visuals:specs.length}));

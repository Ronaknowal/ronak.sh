const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {parse}=require('@babel/parser');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const capture=require('./lib/kv-cache-browser-capture.cjs');
const b='docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar',out=b+'/runtime-training-correction/browser';
fs.mkdirSync(out,{recursive:true});
const source='src/learn/components/lesson-labs/ConstrainedDecodingFoundations.jsx',hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const excluded=new Set(['Bars','MaskedMass','VocabularyTrie','Utf8Bytes']);
function remainder(file){const ast=parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']});return JSON.stringify(ast.program.body.filter(n=>!excluded.has((n.declaration??n).id?.name)),(key,v)=>['start','end','loc','extra'].includes(key)?undefined:v);}
assert.equal(remainder(source),remainder(b+'/runtime-training-correction/ConstrainedDecodingFoundations.jsx.before'));
const before=hash(source),report={source,before,checks:[],captures:[],errors:[],outsideFunctionsAstEqual:true};
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});
try{const context=await browser.newContext({viewport:{width:1366,height:1000}});await require('./lib/lesson-browser-fonts.cjs')(context);const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
await page.request.get('http://127.0.0.1:4264/__llm_refresh');await page.goto('http://127.0.0.1:4264/learn/path/full-curriculum/structured-output-constrained-decoding-outlines-xgrammar?module=large-language-models');
await page.locator('[data-cd-figure="D22"] select').first().waitFor();
await page.addStyleTag({content:'*{scroll-behavior:auto!important;overflow-anchor:none!important}'});
const fig=id=>page.locator(`[data-cd-figure="${id}"]`),reset=id=>fig(id).getByRole('button',{name:'Reset',exact:true}).click();
async function shot(profile,id,state){const target=fig(id);check(`${profile}/${id}/${state} contained`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));const file=`${out}/${profile}-${id}-${state}.png`;const result=await capture(page,target,file);report.captures.push({profile,id,state,...result});}
for(const profile of[{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){
 await page.setViewportSize({width:profile.width,height:1000});await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',profile.font);
 for(const id of['D06','D09','D11'])await reset(id);
 await shot(profile.name,'D06','default');
 await fig('D06').getByRole('combobox',{name:'Selected legal token',exact:true}).selectOption('2');
 check(`${profile.name} both probability rows select ID2`,await fig('D06').locator('[data-selected-token="true"]').count()===2&&await fig('D06').locator('[data-selected-token="true"]').first().innerText().then(t=>t.startsWith('2:')));
 await shot(profile.name,'D06','select2');
 await fig('D06').getByRole('textbox').fill('x');check(`${profile.name} dead clears selection`,await fig('D06').locator('[data-selected-token="true"]').count()===0&&await fig('D06').getByRole('combobox').count()===0);await shot(profile.name,'D06','dead');
 await reset('D06');check(`${profile.name} D06 reset`,await fig('D06').getByRole('combobox').inputValue()==='1');
 for(const [prefix,label,expected]of[['','default',['passed','passed','passed','passed','passed']],['b','prefix-b',['passed','rejected','rejected','rejected','pruned']],['x','dead',['rejected','rejected','pruned','pruned','pruned']]]){
 await fig('D09').getByRole('textbox').fill(prefix);const actual=await fig('D09').locator('[data-trie-edge]').evaluateAll(nodes=>nodes.map(n=>n.dataset.edgeState));assert.deepEqual(actual,expected);check(`${profile.name}/D09/${label} count`,(await fig('D09').innerText()).includes(`Trie tests ${expected.filter(x=>x!=='pruned').length} byte edges`));await shot(profile.name,'D09',label);
 }
 await reset('D09');check(`${profile.name} D09 reset`,await fig('D09').getByRole('textbox').inputValue()==='');
 await shot(profile.name,'D11','default');
 for(const [bytes,label,wrong]of[['E2 82 AC','complete',null],['82','invalid-first',0],['E2 41','invalid-second',1]]){
 await fig('D11').getByRole('combobox').selectOption(bytes);if(bytes==='E2 82 AC')await fig('D11').getByRole('slider').fill('3');
 assert.deepEqual(await fig('D11').locator('[data-input-byte]').evaluateAll(nodes=>nodes.map(n=>n.dataset.inputByte)),bytes.split(' '));
 const result=await fig('D11').locator('[data-input-result]').textContent();check(`${profile.name}/D11/${label} result`,wrong===null?result==='Complete character: €':result===`Rejected at byte ${wrong+1}; no character`);
 check(`${profile.name}/D11/${label} mismatch`,await fig('D11').locator('[data-byte-mismatch="true"]').count()===(wrong===null?0:1));await shot(profile.name,'D11',label);
 }
 await fig('D11').getByRole('slider').fill('0');check(`${profile.name} zero consumption`,await fig('D11').locator('[data-consumed="true"]').count()===0);if(profile.name==='desktop')await shot(profile.name,'D11','zero');
 await reset('D11');check(`${profile.name} D11 reset`,await fig('D11').getByRole('slider').inputValue()==='1');
 if(profile.name!=='desktop')for(const id of['D09','D11']){const scrolls=fig(id).locator('.cd-scroll');for(let i=0;i<await scrolls.count();i++){const sc=scrolls.nth(i),wide=await sc.evaluate(n=>n.scrollWidth>n.clientWidth+1);if(wide){for(const x of[.5,1]){await sc.evaluate((n,x)=>n.scrollLeft=x*(n.scrollWidth-n.clientWidth),x);await shot(profile.name,id,`scroll${i}-${x}`);}await sc.evaluate(n=>n.scrollLeft=0);}}}
}
assert.deepEqual(report.errors,[]);assert.equal(hash(source),before);report.passed=true;
}catch(e){report.passed=false;report.failure=e.stack;process.exitCode=1;}finally{await browser.close();fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,captures:report.captures.length,failure:report.failure}));}})();

// Author self-review, scoped candidate and actual browser; never an independent review.
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const record='docs/teaching/deep-learning-beginner/mini-batches-training-loops-gradient-accumulation';
const hash=file=>({path:file.replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),bytes:fs.statSync(file).size});
const sources=[`${record}/reading-flow-candidate.jsx`,`${record}/reading-flow-publication.jsx`,'docs/teaching/drafts/mini-batches-training-loops-gradient-accumulation/reading-flow-lesson.md',
 'src/learn/components/lesson-labs/MinibatchLoopFlowFigures.jsx','src/learn/components/lesson-labs/MinibatchLoopBoundaryFigures.jsx','src/learn/components/lesson-labs/MinibatchLoopFlowLabs.jsx','src/learn/components/lesson-labs/MinibatchLoopFlowStudy.jsx','src/learn/components/lesson-labs/minibatch-loop-flow.css','src/learn/data/minibatch-loop-flow-models.js','scripts/generate-minibatch-loop-flow-lesson.mjs',`${record}/preview/main.jsx`,`${record}/preview/index.html`,'scripts/lib/minibatch-loop-flow-preview.mjs'];
async function main(){
 const stamp=new Date().toISOString().replaceAll(':','-'),output=`${record}/paint-author/${stamp}`;fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],paintings=[],errors=[],candidates=[];
 const check=(name,value)=>{if(!value)throw Error(name);checks.push({name,passed:true});};
 for(const [name,width,root] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
  const p=await browser.newPage({viewport:{width,height:1000}});p.on('pageerror',e=>errors.push({name,message:e.message}));
  await p.goto('http://127.0.0.1:4863/',{waitUntil:'networkidle'});await p.evaluate(v=>document.documentElement.style.fontSize=`${v}px`,root);
  check(`${name}: current ten-section candidate`,await p.locator('h2').count()===10);
  await p.getByRole('status').filter({hasText:'Loading matching saved parameters'}).scrollIntoViewIfNeeded();
  await p.getByRole('status').filter({hasText:'Loaded initial parameters'}).waitFor();
  // Every drawing is checked after the actual matching lazy state has loaded.
  const stats=await p.locator('.mb-drawing').evaluateAll(figures=>figures.map(figure=>{
   const svg=figure.querySelector('svg'),scale=svg.getBoundingClientRect().width/svg.viewBox.baseVal.width,scroll=figure.querySelector('.mb-drawing-scroll');
   return {label:figure.dataset.mbDrawing,minGlyph:Math.min(...[...svg.querySelectorAll('text')].map(t=>parseFloat(getComputedStyle(t).fontSize)*scale)),pans:scroll.scrollWidth>scroll.clientWidth+1,hint:!!figure.querySelector('.mb-pan-hint'),bounds:[...svg.querySelectorAll('text')].map(t=>{const b=t.getBBox();return{text:t.textContent,x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height,width:svg.viewBox.baseVal.width,height:svg.viewBox.baseVal.height};}).filter(t=>t.x<-.5||t.y<-.5||t.right>t.width+.5||t.bottom>t.height+.5)};
  }));
  check(`${name}: actual rem glyphs`,stats.every(s=>s.minGlyph>=root-.01));check(`${name}: conditional pan guidance`,stats.every(s=>!s.pans||s.hint));
  const outside=stats.filter(s=>s.bounds.length);candidates.push({name,outside});if(name==='desktop')console.log(JSON.stringify({outside}));
  check(`${name}: no page overflow`,await p.evaluate(()=>document.documentElement.scrollWidth)<=width+1);
  const heights=await p.locator('.flow-controls :is(input,select,button),button').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().width).map(n=>({name:n.getAttribute('aria-label')||n.textContent,height:n.getBoundingClientRect().height})));
  if(heights.some(h=>h.height<43.9))console.log(JSON.stringify({smallControls:heights.filter(h=>h.height<43.9)}));check(`${name}: control hit height`,heights.every(h=>h.height>=44-.1));
  if(name!=='desktop'){
   const labels=[...new Set(stats.map(s=>s.label))];let index=0;
   for(const label of labels){
    if(!/scalar prediction|Reverse seed|Mean loss|mean credit|persistent gradient|Gradient, optimizer|weighted row|Actual hidden|Reverse outer|All twenty-one|normalization operation|stipulated|realized|All actual distinct|curvature|rank averaging|One scale|Fresh row values|target mass|prediction positions|running mean transition|Every input|transpose|Binary keep|history alone|clipping|regularizer|ten-row|plain SGD/i.test(label))continue;
    const figure=p.locator('.mb-drawing').filter({has:p.locator(`svg[aria-label="${label.replaceAll('"','\\"')}"]`)}).first();await figure.scrollIntoViewIfNeeded();
    const file=`${output}/${name}-${index}-initial.png`;await figure.screenshot({path:file});paintings.push({...hash(file),label});
    const pane=figure.locator('.mb-drawing-scroll');if(await pane.evaluate(el=>el.scrollWidth>el.clientWidth+1)){await pane.evaluate(el=>el.scrollLeft=el.scrollWidth-el.clientWidth);const file=`${output}/${name}-${index}-right.png`;await figure.screenshot({path:file});paintings.push({...hash(file),label});await pane.evaluate(el=>el.scrollLeft=0);}index++;
   }
  }
  await p.close();
 }
 const p=await browser.newPage({viewport:{width:1366,height:1000}});p.on('pageerror',e=>errors.push({name:'interactions',message:e.message}));await p.goto('http://127.0.0.1:4863/',{waitUntil:'networkidle'});
 const select=(name,value,n=0)=>p.getByRole('combobox',{name,exact:true}).nth(n).selectOption(String(value));
 const edit=(name,value)=>p.getByRole('textbox',{name,exact:true}).fill(String(value));
 for(const [id,x,y]of[[1,1.1,.2],[2,-.3,.7],[3,.125,-.4]]){await select('Scalar row',id);await edit('Scalar input x',x);await edit('Scalar target y',y);}
 check('Off-quarter scalar derivative 1/75', (await p.getByLabel('Move one physical chunk boundary').textContent()).includes('0.013333333333'));
 await edit('Scalar learning rate',.12345);check('Off-quarter rate exact',await p.getByRole('slider',{name:'Scalar learning rate: slider',exact:true}).inputValue()==='0.12345');
 await edit('Scalar input x','');check('Invalid scalar retains .125',await p.getByRole('textbox',{name:'Scalar input x',exact:true}).getAttribute('aria-invalid')==='true');
 await p.getByRole('button',{name:'Reset scalar case',exact:true}).click();check('Reset scalar clears invalid draft',await p.getByRole('textbox',{name:'Scalar input x',exact:true}).inputValue()==='1');
 await p.getByRole('button',{name:'Pin complete scalar case',exact:true}).click();await p.getByRole('button',{name:'Next operation',exact:true}).click();check('Trace cursor advances',(await p.getByLabel('Inspect an operation without changing the current case').textContent()).includes('Operation 2 of'));
 await p.getByRole('button',{name:'Restart current trace',exact:true}).click();check('Restart current trace retains rows',await p.getByRole('textbox',{name:'Scalar input x',exact:true}).inputValue()==='1');
 await select('Weighted row',4,3);await p.getByRole('button',{name:'Remove selected weighted row',exact:true}).click();
 for(const[id,x,y,q]of[[1,1.1,.2,.3],[2,-.3,.7,.1],[3,.125,-.4,.7]]){await select('Weighted row',id);await edit('Weighted input x',x);await edit('Weighted target y',y);await select('Weighted row',id,1);await edit('Row importance weight',q);}
 check('Off-quarter weighted derivative −1/110',(await p.getByLabel('Weighted numerator and mass: row').textContent()).includes('−0.009090909091'));
 await p.getByRole('button',{name:'Ignore every row',exact:true}).click();check('Whole zero mass undefined',(await p.getByLabel('Weighted numerator and mass: nulls').textContent()).includes('undefined'));
 await p.getByRole('button',{name:'Restore weighted case',exact:true}).click();check('Weighted recovery gives −4.2',(await p.getByLabel('Weighted numerator and mass: row').textContent()).includes('−4.2'));
 for(const rule of ['mass','chunks','eligible','slots'])await select('Compared objective denominator',rule);check('All objective rules reachable',await p.getByRole('combobox',{name:'Compared objective denominator',exact:true}).inputValue()==='slots');
 await edit('Normalization activation x',7.125);await edit('Normalization target y',-.625);await edit('Downstream scale θ',.12345);check('Off-quarter normalization fields retained',await p.getByRole('textbox',{name:'Normalization activation x',exact:true}).inputValue()==='7.125'&&await p.getByRole('textbox',{name:'Downstream scale θ',exact:true}).inputValue()==='0.12345');
 await p.getByRole('button',{name:'Copy current full statistics',exact:true}).click();await select('Normalization forward rule','frozen');const frozen=await p.getByLabel('Physical normalization comparison: frozen').textContent();await edit('Normalization activation x',7.375);check('Copied stats survive later edit',(await p.getByLabel('Physical normalization comparison: frozen').textContent()).includes(frozen.slice(frozen.indexOf('Copied statistics remain'))));
 await select('Normalization forward rule','local');await select('Normalization physical group',2);check('One-row local group explicitly invalid',(await p.getByLabel('Physical normalization comparison: group').textContent()).includes('has one row'));
 await p.getByRole('button',{name:'Reset normalization case',exact:true}).click();check('Grouping recovery',(await p.getByLabel('Physical normalization comparison: group').textContent()).includes('full derivative'));
 await select('Normalization forward rule','none');check('No-normalization uses original x',(await p.getByLabel('Physical normalization comparison: row').textContent()).includes('Bypass'));
 await edit('Downstream scale θ','NaN');await p.getByRole('button',{name:'Reset normalization case',exact:true}).click();check('Same-value normalization reset clears draft',await p.getByRole('textbox',{name:'Downstream scale θ',exact:true}).inputValue()==='1');
 await p.getByRole('status').filter({hasText:'Loading matching saved parameters'}).scrollIntoViewIfNeeded();await p.getByRole('status').filter({hasText:'Loaded initial parameters'}).waitFor();
 await edit('Selected flower measurement (cm)',5.125);check('Off-quarter Iris input retained',(await p.getByLabel('Hypothetical flower update: measurement').textContent()).includes('5.125'));
 await select('Effective group prefix',8);await select('Physical flower capacity',7);await select('Output class coordinate',2);await select('Hidden coordinate',7);check('Iris arbitrary edit survives prefix/coordinate changes',(await p.getByLabel('Hypothetical flower update: group').textContent()).includes('5.125'));
 await p.route('**/iris-trained20.json',route=>route.abort());await select('Saved classifier state','trained20');await p.getByRole('button',{name:'Retry saved classifier',exact:true}).waitFor();check('Saved-model failure retains edit',(await p.getByLabel('Hypothetical flower update: measurement').textContent()).includes('5.125'));
 await p.unroute('**/iris-trained20.json');await p.getByRole('button',{name:'Retry saved classifier',exact:true}).click();await p.getByRole('status').filter({hasText:'Loaded epoch-20'}).waitFor();check('Retry loads matching epoch20 state',(await p.getByLabel('Hypothetical flower update: group').textContent()).includes('5.125'));
 await select('Saved classifier state','initial');await select('Saved classifier state','trained20');await select('Saved classifier state','initial');await p.getByRole('status').filter({hasText:'Loaded initial'}).waitFor();check('Quick switches bind final matching state',await p.getByRole('combobox',{name:'Saved classifier state',exact:true}).inputValue()==='initial');
 await edit('Selected flower measurement (cm)','Infinity');await p.getByRole('button',{name:'Reset flower case',exact:true}).click();check('Iris reset clears invalid draft',await p.getByRole('textbox',{name:'Selected flower measurement (cm)',exact:true}).inputValue()==='5.4');
 await p.getByRole('slider',{name:'Selected flower measurement (cm): slider',exact:true}).focus();await p.keyboard.press('ArrowRight');const slider=await p.getByRole('slider',{name:'Selected flower measurement (cm): slider',exact:true}).inputValue();check('Native keyboard slider synchronizes exact editor',await p.getByRole('textbox',{name:'Selected flower measurement (cm)',exact:true}).inputValue()===slider);
 await p.close();await browser.close();check('No browser exceptions',errors.length===0);
 fs.writeFileSync(`${output}/checks.json`,JSON.stringify({status:'PASS',scope:'author full candidate browser and paint candidates; independent review pending',created_utc:new Date().toISOString(),sources:sources.map(hash),checks,paintings,candidates,errors},null,2));
 console.log(JSON.stringify({file:`${output}/checks.json`,checks:checks.length,paintings:paintings.length,outside:candidates.map(c=>({view:c.name,count:c.outside.length}))}));
}
main().catch(error=>{console.error(error);process.exitCode=1});

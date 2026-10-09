const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const owner='docs/teaching/llm-architecture-training/dynamic-tokenization-adat-boundlessbpe-litetoken';
const output=process.env.DYNAMIC_STATE_OUTPUT||`${owner}/state-closure`;
if(fs.existsSync(`${output}/report.json`))throw Error('Use fresh output; predecessor evidence is retained.');
fs.mkdirSync(`${output}/screenshots`,{recursive:true});
const files=['src/learn/components/lesson-labs/DynamicTokenizationFlow.jsx','src/learn/components/lesson-labs/dynamic-tokenization-flow.css','src/learn/data/dynamic-tokenization-models.js',`${owner}/manuscript.jsx`,'scripts/verify-dynamic-tokenization-state-closure.cjs'];
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourceHashes=Object.fromEntries(files.map(file=>[file,hash(file)]));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1366,height:1700}});
 const base=process.env.LEARNING_BASE_URL||'http://127.0.0.1:4243';let checks=0;const states=[];
 try{
  await page.request.get(`${base}/__llm_refresh`);await page.goto(`${base}/learn/path/full-curriculum/dynamic-tokenization-adat-boundlessbpe-litetoken?module=large-language-models`,{waitUntil:'domcontentloaded',timeout:90000});await page.locator('#dt-priority .dt-measured-rounds').waitFor({timeout:90000});
  async function capture(id,file){const element=page.locator(id);await element.scrollIntoViewIfNeeded();await element.evaluate(e=>new Promise(resolve=>{let previous=e.getBoundingClientRect().top,stable=0;function frame(){const y=e.getBoundingClientRect().top;stable=Math.abs(y-previous)<.05?stable+1:0;previous=y;if(stable>=8)resolve();else requestAnimationFrame(frame);}requestAnimationFrame(frame);}));await page.evaluate(()=>document.activeElement?.blur());const rect=await element.boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=1700,`${id}: complete target in native viewport`);checks++;const path=`${output}/screenshots/${file}.png`;await element.screenshot({path,style:'.site-header--learn{visibility:hidden!important}'});states.push({id,file,rect,screenshot:path,sha256:hash(path)});}
  const competition=page.locator('#dt-competition');for(const name of ['Regular pair count','Superpair count']){const slider=competition.getByRole('slider',{name:new RegExp('^'+name)});await slider.focus();await slider.press('Home');assert.equal(await slider.inputValue(),'0');checks++;}
  assert.ok((await competition.locator('.dt-label').allTextContents()).some(text=>text.includes('inactive: no candidate selected')));checks++;
  assert.ok((await competition.locator('.flow-readout').innerText()).includes('no merge or deletion'));checks++;await capture('#dt-competition','competition-unobserved');
  const lattice=page.locator('#dt-lattice');await lattice.getByRole('button',{name:'Sample paths',exact:true}).click();const seed=lattice.getByRole('slider',{name:/^Sample seed/});await seed.focus();await seed.press('Home');await seed.press('ArrowRight');await seed.press('ArrowRight');assert.equal(await seed.inputValue(),'3');checks++;
  assert.equal(await lattice.locator('.dt-path-list>div').count(),7);checks++;assert.ok((await lattice.locator('.dt-exact').innerText()).includes('Z=0.2171'));checks++;await capture('#dt-lattice','lattice-sample');
  for(const[file,digest]of Object.entries(sourceHashes)){assert.equal(hash(file),digest);checks++;}
  fs.writeFileSync(`${output}/report.json`,JSON.stringify({passed:true,checks,checkedAt:new Date().toISOString(),sourceHashes,states,scope:'Bounded successor: inactive zero-candidate subtitle plus native seeded sample recapture after scroll settles. Same 1366px reader width with taller viewport to keep the complete element visible; prior full browser/model/native checks conserved.'},null,2));console.log(JSON.stringify({passed:true,checks,output}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

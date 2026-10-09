const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const folder='docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering';
const out=`${folder}/browser-author-delivery`;
fs.mkdirSync(out,{recursive:true});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const normalize=s=>s.replaceAll('\r\n','\n').trimEnd();
async function main(){
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:1000},permissions:['clipboard-read','clipboard-write']});
 const checks=[],captures=[];let fail=true;
 await page.route('**/learn-code/data-curation-pipelines/curation_signals.py',route=>fail?route.abort():route.continue());
 await page.request.get('http://127.0.0.1:4250/__llm_refresh');
 await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/data-curation-pipelines-curator-models-quality-filtering?module=large-language-models');
 const programs=page.locator('.lesson-code-source');await programs.first().waitFor({timeout:120000});
 await programs.first().scrollIntoViewIfNeeded();await programs.first().getByRole('alert').waitFor();
 fail=false;await programs.first().getByRole('button',{name:'Retry',exact:true}).click();await programs.first().locator('pre').waitFor();
 checks.push({name:'Actual failed program fetch and Retry recovery',passed:true});
 assert.equal(await programs.count(),8);
 for(let i=0;i<8;i++){
  const program=programs.nth(i);await program.scrollIntoViewIfNeeded();await program.locator('pre').waitFor();
  const link=program.locator('a[download]').first();const href=await link.getAttribute('href');
  const file=`public${href}`;const expected=fs.readFileSync(file,'utf8');
  await program.getByRole('button',{name:/Copy/}).first().click();assert.equal(normalize(await page.evaluate(()=>navigator.clipboard.readText())),normalize(expected));
  const downloadPromise=page.waitForEvent('download');await link.click();const download=await downloadPromise;
  assert.equal(sha(await download.path()),sha(file));
  checks.push({name:`Exact Copy and actual Download: ${file}`,passed:true});
 }
 for(const path of ['curation-pipelines.zip','README.md','bundle-manifest.json']){
  const response=await page.request.get(`http://127.0.0.1:4250/learn-code/data-curation-pipelines/${path}`);assert.ok(response.ok());
  assert.equal(crypto.createHash('sha256').update(await response.body()).digest('hex'),sha(`public/learn-code/data-curation-pipelines/${path}`));
 }
 const help=page.locator('.lesson-compass details').filter({has:page.getByText('Using the examples and labs',{exact:true})});
 // The shared opening may already be expanded. Expand via its actual summary.
 const summary=page.locator('.lesson-compass summary').filter({hasText:'Using the examples and labs'});
 if(await summary.count())await summary.first().evaluate(el=>el.parentElement.open=true);
 const bundle=page.getByRole('link',{name:'complete program/data bundle',exact:true});await bundle.waitFor();
 assert.equal(await bundle.getAttribute('href'),'/learn-code/data-curation-pipelines/curation-pipelines.zip');
 for(const [name,width,size] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
  await page.setViewportSize({width,height:1000});await page.evaluate(size=>document.documentElement.style.fontSize=`${size}px`,size);
  await bundle.scrollIntoViewIfNeeded();const p=`${out}/${name}-bundle-guide.png`;await page.screenshot({path:p});captures.push(p);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 }
 assert.equal(await page.locator('.neural-practice').count(),12);assert.equal(await page.locator('.katex-error').count(),0);
 checks.push({name:'Exact bundle/README/manifest bytes; three opening layouts; twelve practices; math rendered',passed:true});
 const files=[`${folder}/lesson.jsx`,'src/learn/components/lesson-labs/CurationPipelineFlow.jsx','src/learn/components/lesson-labs/curation-pipeline-flow.css','public/learn-code/data-curation-pipelines/curation-pipelines.zip','public/learn-code/data-curation-pipelines/bundle-manifest.json'];
 fs.writeFileSync(`${out}/report.json`,JSON.stringify({checks,files:Object.fromEntries(files.map(p=>[p,sha(p)])),captures:Object.fromEntries(captures.map(p=>[p,sha(p)])),scope:'Actual browser file recovery, Copy and Download plus additive bundle opening. No scientific fits.'},null,2)+'\n',{flag:'wx'});
 await browser.close();console.log(`${checks.length} delivery groups passed`);
}
main().catch(e=>{console.error(e);process.exit(1);});

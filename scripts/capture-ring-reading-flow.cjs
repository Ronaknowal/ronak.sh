// Supplemental legibility captures; the interaction/layout verifier checks the real chrome.
const fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const id='ring-attention-sequence-parallelism',folder=`docs/teaching/deep-learning-beginner/${id}`;
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:900}});
 const sources=['Figures','Labs','Systems','Study'].map(name=>`src/learn/components/lesson-labs/RingAttentionFlow${name}.jsx`),stamp=new Date().toISOString().replaceAll(':','-');
 const report={scope:'Supplemental actual390px painting; fixed site chrome hidden only while capturing a tall region. Main verifier separately includes real chrome.',sourceHashes:Object.fromEntries(sources.map(file=>[file,hash(file)])),screenshots:[]};
 await page.goto(`http://127.0.0.1:4833/learn/path/full-curriculum/${id}?module=deep-learning-fundamentals`);
 const names=['Change a source row and rebuild its three projections','Inspect permanent query rows and visiting key/value rows','Sum all remote derivative contributions and return them to the original key owner','Same fixed learned model: input','Same fixed learned model: task','Same fixed learned model: join'];
 for(let i=0;i<names.length;i++){
  const region=page.locator(`.flow-lab[aria-label=${JSON.stringify(names[i])}]`).first();await region.scrollIntoViewIfNeeded();
  if(i>=3)await region.locator('svg').first().waitFor();
  await page.evaluate(()=>document.activeElement?.blur());
  const file=`${folder}/reading-flow-painted-clean-${stamp}-${i}.png`;
  await region.screenshot({path:file,style:'header, nav, [class*="skip"] { visibility: hidden !important; }'});
  report.screenshots.push({path:file,region:names[i],sha256:hash(file)});
 }
 await browser.close();const file=`${folder}/reading-flow-painted-clean-${stamp}.json`;fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(file);
})().catch(error=>{console.error(error);process.exitCode=1;});

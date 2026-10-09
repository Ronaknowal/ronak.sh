const fs=require('node:fs');
const crypto=require('node:crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fonts=require('./lib/lesson-browser-fonts.cjs');
const topic='docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training';
const folder=`${topic}/runtime-different-endings`;
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
  fs.mkdirSync(folder,{recursive:true});
  const source=`${topic}/lesson.jsx`, before=sha(source), captures=[];
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1366,height:1000}});await fonts(page);
    await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/synthetic-data-generation-for-pre-training?module=large-language-models');
    await page.locator('[data-lesson-ending="next"]').waitFor();
    for(const [profile,width,size] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]) {
      await page.setViewportSize({width,height:1000});
      await page.evaluate(s=>document.documentElement.style.fontSize=s+'px',size);
      for(const ending of ['further-learning','references','next']) {
        const path=`${folder}/${profile}-${ending}.png`;
        await page.locator(`[data-lesson-ending="${ending}"]`).screenshot({path});captures.push(path);
      }
      const heading=page.getByRole('heading',{name:'Key takeaways',exact:true});
      await heading.scrollIntoViewIfNeeded();
      await heading.evaluate(n=>window.scrollTo(0,n.getBoundingClientRect().top+scrollY-90));
      const path=`${folder}/${profile}-takeaways.png`;
      await page.screenshot({path});captures.push(path);
    }
    if(sha(source)!==before)throw Error('Manuscript renderer changed during read');
    fs.writeFileSync(`${folder}/report.json`,JSON.stringify({source,sha256:before,captures},null,2)+'\n');
    console.log(JSON.stringify({captures:captures.length,sourceSha:before}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

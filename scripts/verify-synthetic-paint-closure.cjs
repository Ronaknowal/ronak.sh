const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto');
const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const root='docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training';
const output=`${root}/browser-paint-closure`;fs.mkdirSync(output,{recursive:true});
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
  const previous=JSON.parse(fs.readFileSync(`${root}/browser-author-correction/report.json`));
  const predecessors={'src/learn/components/lesson-labs/SyntheticDataFlow.jsx':`${root}/runtime-paint-predecessor/SyntheticDataFlow.jsx`,'src/learn/components/lesson-labs/synthetic-data-flow.css':`${root}/runtime-paint-predecessor/synthetic-data-flow.css`};
  for(const [file,digest] of Object.entries(previous.files))assert.equal(hash(predecessors[file]||file),digest,file);
  const b=await chromium.launch({channel:'msedge',headless:true});
  try{
    const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
    await p.request.get('http://127.0.0.1:4250/__llm_refresh');
    await p.goto('http://127.0.0.1:4250/learn/path/full-curriculum/synthetic-data-generation-for-pre-training?module=large-language-models');
    await p.locator('[data-synthetic-figure="S18"] button').first().waitFor({timeout:60000});
    const fig=id=>p.locator(`[data-synthetic-figure="${id}"]`),captures=[];
    for(const [name,width,size] of [['desktop',1366,16],['phone',390,16],['enlarged',768,32]]){
      await p.setViewportSize({width,height:1000});await p.evaluate(s=>document.documentElement.style.fontSize=s+'px',size);
      for(const id of ['S05','S06','S07','S08','S09','S10','S12','S13','S14','S15','S16','S17','S18','S21','S22']){
        await fig(id).scrollIntoViewIfNeeded();const file=`${output}/${name}-${id}.png`;await fig(id).screenshot({path:file,style:'.site-header,.site-skip,.reader-sidebar{visibility:hidden!important}'});captures.push(file);
        const regions=fig(id).locator('.synthetic-scroll');
        if(name==='enlarged')for(let j=0;j<await regions.count();j++){
          const region=regions.nth(j);if(await region.evaluate(n=>n.scrollWidth>n.clientWidth+1))for(const [side,ratio] of [['middle',.5],['right',1]]){
            await region.evaluate((n,r)=>n.scrollLeft=r*(n.scrollWidth-n.clientWidth),ratio);
            const file=`${output}/${name}-${id}-${side}-${j}.png`;await fig(id).screenshot({path:file,style:'.site-header,.site-skip,.reader-sidebar{visibility:hidden!important}'});captures.push(file);
          }await region.evaluate(n=>n.scrollLeft=0);
        }
        assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${name}/${id} overflow`);
      }
      assert.equal(await fig('S08').locator('.synthetic-population .accepted').count(),62);
      const outputRows=fig('S17').locator('.synthetic-bar-row output');
      for(let i=0;i<3;i++)assert.equal(await outputRows.nth(i).evaluate(n=>getComputedStyle(n).whiteSpace),'nowrap');
      assert.equal(await fig('S18').getByRole('button',{name:/Byte \d+,/}).count(),256);
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:'Presentation closure composed with120 previous captures and27 browser groups; no science rerun',previousReportSha256:hash(`${root}/browser-author-correction/report.json`),files:Object.fromEntries(Object.keys(previous.files).map(f=>[f,hash(f)])),captures,errors},null,2)+'\n');
    console.log(`${captures.length} affected paint captures; rounding, number layout and full head checks passed`);
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});

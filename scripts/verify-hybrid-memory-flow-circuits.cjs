// Bounded author checks for the current connected circuits, independent of model fits.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const record = 'docs/teaching/deep-learning-beginner/hybrid-ssm-transformer-architectures-jamba';
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const folder = `${record}/screenshots/reading-flow-circuits-${stamp}`;
fs.mkdirSync(folder,{recursive:true});
const files = ['src/learn/components/lesson-labs/HybridMemoryFlowFigures.jsx','src/learn/components/lesson-labs/HybridMemoryFlowLabs.jsx','src/learn/components/lesson-labs/HybridMemoryFlowStudy.jsx',
  'src/learn/components/lesson-labs/hybrid-memory-flow.css','src/learn/data/hybrid-memory-flow-models.js',
  'docs/teaching/drafts/hybrid-ssm-transformer-architectures-jamba/lesson.md','scratch/reading-flow/hybrid-authored-preview.jsx','scripts/verify-hybrid-memory-flow-circuits.cjs'];
const hashes=()=>Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const sourceHashes=hashes(),groups=[],layouts=[],paints=[],errors=[];
const circuits=['input-projection-circuit','gate-projection-circuit','convolution-circuit','convolution-silu-circuit','timestep-projection-circuit','positive-timestep-circuit','write-projection-circuit',
  'write-rms-circuit','state-cell-circuit','direct-skip-circuit','state-read-circuit','read-gate-output-circuit','grouped-heads','swiglu-circuit','normalization-circuit','pen-stroke'];
let browser;
async function slider(page,id,name,value){await page.locator(id).getByRole('slider',{name,exact:true}).evaluate((node,value)=>{
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(node,String(value));node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));
},value);}
async function geometry(page){return page.evaluate(ids=>{
  const problems=[];let count=0,minimum=Infinity;
  for(const id of ids){for(const figure of document.querySelectorAll(`[data-figure="hybrid-${id}"]`)){
    const svg=figure.querySelector('svg');if(!svg)continue;count++;
    const texts=[...svg.querySelectorAll('text')].map(node=>{const b=node.getBBox(),m=node.getScreenCTM();minimum=Math.min(minimum,parseFloat(getComputedStyle(node).fontSize)*Math.hypot(m.a,m.b));return {text:node.textContent,x:b.x,y:b.y,w:b.width,h:b.height};});
    const box=svg.viewBox.baseVal;
    for(const text of texts)if(text.x<-.5||text.x+text.w>box.width+.5||text.y<-.5||text.y+text.h>box.height+.5)problems.push({id,type:'bounds',text});
    for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i],b=texts[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)problems.push({id,type:'label overlap',labels:[a.text,b.text]});}
    if(id==='pen-stroke')continue; // Arbitrary edited trajectory is not a rectilinear computation wire.
    for(const polyline of svg.querySelectorAll('polyline')){const points=[...polyline.points];for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i];for(const text of texts){
        if(a.x===b.x&&a.x>text.x-1&&a.x<text.x+text.w+1&&Math.max(a.y,b.y)>text.y-1&&Math.min(a.y,b.y)<text.y+text.h+1 ||
           a.y===b.y&&a.y>text.y-1&&a.y<text.y+text.h+1&&Math.max(a.x,b.x)>text.x-1&&Math.min(a.x,b.x)<text.x+text.w+1)
          problems.push({id,type:'caption crossed by wire',text:text.text,segment:[[a.x,a.y],[b.x,b.y]]});
      }
    }}
  }}
  return {count,minimumDiagramPixels:minimum,problems,pageOverflow:document.documentElement.scrollWidth>innerWidth+2};
},circuits);}
(async()=>{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:390,height:1000}});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4850/?manuscript');await page.locator('#hybrid-tiny-output').waitFor();
  for(const [x,y] of [[2,-1],[4,-4],[-4,4],[-4,-4],[0,0]]){
    await slider(page,'#hybrid-tiny-objects','Mixer input coordinate 0',x);await slider(page,'#hybrid-tiny-objects','Mixer input coordinate 1',y);
    const check=await geometry(page);assert.deepEqual(check.problems,[],JSON.stringify({x,y,...check}));
    const label=await page.locator('#hybrid-tiny-objects .hybrid-flow-array-cell span').allTextContents();
    const live=label.filter(text=>text.includes('SiLU('));assert.equal(live.length,2);
    const expected=[.25+x,-.5+y].map(value=>Number(value.toFixed(4)));
    for(let i=0;i<2;i++)assert.equal(Number(live[i].match(/SiLU\(([^)]+)\)/)[1].replace('−','-')),expected[i]);
    groups.push({kind:'actual linked selective inputs and current SiLU operands',x,y,figures:check.count});
  }
  await slider(page,'#hybrid-tiny-objects','Mixer input coordinate 0',2);await slider(page,'#hybrid-tiny-objects','Mixer input coordinate 1',-1);
  await slider(page,'#hybrid-memory-case','Number of stored records',8);
  await slider(page,'#hybrid-address-read','Matched score minus other scores',6);
  for(const query of ['A','Absent']){
    await page.locator('#hybrid-address-read').getByRole('combobox',{name:'Query key',exact:true}).selectOption(query);
    const check=await geometry(page);assert.deepEqual(check.problems,[],JSON.stringify({query,...check}));
    groups.push({kind:'eight-record normalizer, including missing query',query,figures:check.count});
  }
  for(const [width,scale] of [[390,1],[320,1],[1366,1],[768,2]]){
    await page.setViewportSize({width,height:1000});await page.evaluate(scale=>document.documentElement.style.fontSize=`${16*scale}px`,scale);
    const check=await geometry(page);assert.deepEqual(check.problems,[],JSON.stringify(check));assert.equal(check.pageOverflow,false);assert.ok(check.minimumDiagramPixels>=15.9*scale);layouts.push({width,scale,...check});
    if(width===390||scale===2)for(const id of ['normalization-circuit','write-rms-circuit','state-cell-circuit','read-gate-output-circuit','grouped-heads','swiglu-circuit','pen-stroke']){
      const figure=page.locator(`[data-figure="hybrid-${id}"]`).first();await figure.scrollIntoViewIfNeeded();
      for(const side of ['initial','right']){await figure.locator('.hybrid-flow-scroll').first().evaluate((node,side)=>node.scrollLeft=side==='initial'?0:node.scrollWidth,side);
        const file=`${folder}/${id}-${width}-${scale}-${side}.png`;await figure.screenshot({path:file});paints.push(file);}
    }
  }
  // Full native-size drawings supplement the true narrow/enlarged local-pan paints above.
  await page.setViewportSize({width:2200,height:1500});await page.evaluate(()=>document.documentElement.style.fontSize='16px');
  await page.addStyleTag({content:'.reader-article{max-width:none!important;width:2100px!important}.hybrid-flow-scroll{max-width:none!important;width:max-content!important;overflow:visible!important}'});
  for(const id of ['normalization-circuit','input-projection-circuit','convolution-circuit','write-rms-circuit','state-cell-circuit','direct-skip-circuit','state-read-circuit','read-gate-output-circuit','grouped-heads','swiglu-circuit','pen-stroke']){
    const figure=page.locator(`[data-figure="hybrid-${id}"]`).first();await figure.scrollIntoViewIfNeeded();await figure.locator('.hybrid-flow-scroll').first().evaluate(node=>node.scrollLeft=0);
    const file=`${folder}/${id}-native.png`;await figure.screenshot({path:file});paints.push(file);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(hashes(),sourceHashes);
  const receipt={purpose:'Author current connected-circuit geometry, live operands and retained actual paints; literal paint inspection and independent acceptance are separate',passed:true,sourceHashes,groups,layouts,errors,paints,fitsRerun:0};
  const file=`${record}/reading-flow-circuits-${stamp}.json`;fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({passed:true,groups:groups.length,layouts:layouts.length,paints:paints.length,receipt:file}));await browser.close();
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exitCode=1;});

const {chromium}=require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const result={scope:'Resolve reviewer assertion expectations; no source change',checks:[]};
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-gpu']});
const page=await browser.newPage({viewport:{width:768,height:900}});await page.goto('http://127.0.0.1:5774/');await page.waitForSelector('[data-entropy-drawing="E46"]');
await page.addStyleTag({content:'.reader-content{width:386px!important;max-width:386px!important;min-width:0!important}'});
const values=[];for(const size of [16,32,16]){await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',size);await page.waitForTimeout(150);values.push(await page.locator('[data-entropy-drawing="E08"] svg text').first().evaluate(e=>({effective:parseFloat(getComputedStyle(e).fontSize)*e.getScreenCTM().a,root:parseFloat(getComputedStyle(document.documentElement).fontSize)})));}
result.checks.push({name:'SVG labels retain established .82rem and double/restore correctly',pass:Math.abs(values[1].effective/values[0].effective-2)<.01&&Math.abs(values[0].effective-values[2].effective)<.02,values});
const zero=page.locator('[data-entropy-drawing="E22"] .en-cost-gap').last();const detail=await zero.evaluate(e=>({text:e.innerText,bars:[...e.querySelectorAll('.en-gap-ruler>span')].map(p=>({declared:p.style.width,box:p.getBoundingClientRect().width,borderLeft:getComputedStyle(p).borderLeftWidth,borderRight:getComputedStyle(p).borderRightWidth}))}));
result.checks.push({name:'Matched zero gap has declared zero lengths; only border strokes remain',pass:detail.bars.every(x=>x.declared==='0%')&&detail.text.includes('Zero excess'),...detail});
await zero.scrollIntoViewIfNeeded();const file=path.join(__dirname,'E22-zero-native.jpg');await zero.screenshot({path:file,type:'jpeg',quality:78});result.screenshot={file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
await browser.close();fs.writeFileSync(path.join(__dirname,'continuation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exit(1)});

const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const topic='docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods';
const directory=topic+'/runtime-copy-closure';
fs.mkdirSync(directory+'/screenshots',{recursive:true});
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const oldText='Complete constructed prefix: the visitor note, then the response tokens below. Prompt tokens\n        are available as causal context while their response-loss masks stay zero.';
const newText='This variable-length toy prefix illustrates token addresses; the complete visitor note\n        appears above. Prompt tokens remain causal context while their response-loss masks stay zero.';
const before=fs.readFileSync(directory+'/predecessor-RLAIFMethodsFlow.jsx','utf8');
const after=fs.readFileSync('src/learn/components/lesson-labs/RLAIFMethodsFlow.jsx','utf8');
const checks=[],images=[];
function check(name,passed,actual){checks.push({name,passed:!!passed,actual});if(!passed)throw Error(name+': '+JSON.stringify(actual));}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:1000}});
 let failure=null;
 try{
  check('Exactly one D16 descriptive paragraph differs; every operation/other figure byte conserved',before.includes(oldText)&&before.replace(oldText,newText)===after);
  const content=JSON.parse(fs.readFileSync(topic+'/content-successor/inputs.json'));
  for(const [file,expected]of Object.entries(content.inputs))check('Accepted content conserved '+file,hash(fs.readFileSync(file))===expected.sha256);
  await page.request.get('http://127.0.0.1:4250/__llm_refresh');
  await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/rlaif-ipo-orpo-emerging-alignment-methods?module=large-language-models',{timeout:90000});
  const figure=page.locator('[data-rlaif-figure="D16"]');
  await figure.waitFor({timeout:90000});
  for(const profile of [{name:'desktop',width:1366,font:16},{name:'phone',width:390,font:16},{name:'enlarged',width:768,font:32}]){
   await page.setViewportSize({width:profile.width,height:1000});
   await page.evaluate(font=>document.documentElement.style.fontSize=font+'px',profile.font);
   await figure.scrollIntoViewIfNeeded();
   await page.evaluate(()=>document.activeElement?.blur());
   check(profile.name+' current toy-prefix explanation visible',(await figure.innerText()).includes('This variable-length toy prefix illustrates token addresses'));
   const file=path.join(directory,'screenshots',profile.name+'-D16.png');
   await figure.screenshot({path:file,animations:'disabled',style:'.site-header--learn{visibility:hidden!important}.site-skip{visibility:hidden!important}'});
   images.push({path:'screenshots/'+profile.name+'-D16.png',sha256:hash(fs.readFileSync(file))});
   check(profile.name+' paragraph and tokens stay inside reader',await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1));
  }
 }catch(error){failure=error.stack;}
 await browser.close();
 const report={passed:!failure,failure,at:new Date().toISOString(),before:hash(before),after:hash(after),checks,images,scope:'One D16 descriptive paragraph correction only; all other runtime bytes and144 accepted content bindings conserved. No science repeated.'};
 fs.writeFileSync(directory+'/report.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,checks:checks.length,failure}));
 if(failure)process.exitCode=1;
})();

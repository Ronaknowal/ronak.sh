const fs=require('node:fs'),{chromium}=require(process.env.PLAYWRIGHT_PACKAGE),{createHash}=require('node:crypto');
(async()=>{
 const folder='docs/teaching/llm-architecture-training/rl-for-reasoning-deepseek-r1-style';
 const browser=await chromium.launch({channel:'msedge',headless:true});const rows=[];
 try{for(const [name,width,text]of [['desktop',1440,16],['phone',390,16],['enlarged',768,32]]){
 const page=await browser.newPage({viewport:{width,height:1000}});
 await page.goto('http://127.0.0.1:4250/learn/path/full-curriculum/rl-for-reasoning-deepseek-r1-style?module=large-language-models');
 const figure=page.locator('[data-reasoning-figure="D06"]');await figure.waitFor({timeout:90000});
 await page.addStyleTag({content:`html{font-size:${text}px!important}`});
 const sizes=await figure.locator('.reasoning-probability-cell').evaluateAll(nodes=>nodes.map(n=>({width:n.getBoundingClientRect().width,bar:n.firstElementChild.getBoundingClientRect().width,text:n.textContent})));
 rows.push({name,sizes});await page.close();
 }}finally{await browser.close();}
 const inputs=Object.fromEntries(['src/learn/components/lesson-labs/ReasoningFlow.jsx','src/learn/components/lesson-labs/reasoning-flow.css'].map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
 fs.writeFileSync(`${folder}/root-probability-scale.json`,JSON.stringify({rows,inputs},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(rows));
})();

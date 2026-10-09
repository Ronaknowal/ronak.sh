const { chromium } = require('C:/Users/ronak/projects/career-ops/node_modules/playwright');
const fs = require('node:fs');
const out='docs/teaching/deep-learning-beginner/sequence-to-sequence-encoder-decoder/screenshots/reading-flow-prototype';
fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,zoom] of [[390,1],[768,2]]) {await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:4823/scratch/seq2seq-reading-flow/prototype.html');await page.locator('svg').first().waitFor();await page.evaluate(z=>document.documentElement.style.zoom=z,zoom);
 for(const name of ['seq2seq-encoder-anatomy','seq2seq-decoder-anatomy','seq2seq-lookup','seq2seq-decoder-step','seq2seq-scalar-encoder','seq2seq-scalar-decoder','seq2seq-probability-tree']) {await page.locator(`[data-figure="${name}"]`).screenshot({path:`${out}/${name}-${width}-${zoom}.png`});}
 }console.log(JSON.stringify({errors}));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});

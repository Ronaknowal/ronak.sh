const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/ronak/projects/career-ops/node_modules/playwright');
const owner='docs/teaching/llm-architecture-training/dynamic-tokenization-adat-boundlessbpe-litetoken';
const receipt=process.env.DYNAMIC_GEOMETRY_RECEIPT||`${owner}/tree-geometry.json`;
if(fs.existsSync(receipt))throw Error('Use a fresh receipt; evidence is retained.');
const files=['src/learn/components/lesson-labs/DynamicTokenizationFlow.jsx','src/learn/components/lesson-labs/dynamic-tokenization-flow.css',`${owner}/manuscript.jsx`,'scripts/verify-dynamic-tokenization-tree-geometry.cjs'];
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sourceHashes=Object.fromEntries(files.map(file=>[file,hash(file)]));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1366,height:1000}});
 const base=process.env.LEARNING_BASE_URL||'http://127.0.0.1:4243';
 let checks=0;const views=[];
 try{
  await page.goto(`${base}/learn/path/full-curriculum/dynamic-tokenization-adat-boundlessbpe-litetoken?module=large-language-models`,{waitUntil:'domcontentloaded',timeout:90000});
  await page.locator('#dt-residue-tree').waitFor({timeout:90000});
  for(const [view,width,font]of [['desktop',1366,''],['phone',390,''],['enlarged',768,'32px']]){
   await page.setViewportSize({width,height:1000});await page.evaluate(size=>document.documentElement.style.fontSize=size,font);
   for(const word of ['includes','including','include']){
    await page.locator('#dt-residue-tree').getByRole('group',{name:'Actual occurrence tree',exact:true}).getByRole('button',{name:word,exact:true}).click();
    const branches=await page.locator('#dt-residue-tree .dt-tree-children').evaluateAll(groups=>groups.map(group=>{
     const box=e=>e.getBoundingClientRect();const centre=e=>{const r=box(e);return r.x+r.width/2;};
     const ownPiece=group.parentElement.querySelector(':scope>.dt-piece'),stem=getComputedStyle(group,'::before'),g=box(group);
     const children=[...group.children].map(node=>{
      const r=box(node),piece=node.querySelector(':scope>.dt-piece'),before=getComputedStyle(node,'::before'),after=getComputedStyle(node,'::after');
      return{piece:node.dataset.treePiece,nodeCentre:r.x+r.width/2,pieceCentre:centre(piece),stemX:r.x+parseFloat(before.left),horizontalStart:r.x+parseFloat(after.left),horizontalEnd:r.x+parseFloat(after.left)+parseFloat(after.width),horizontalY:r.y+parseFloat(after.top),childStemEnd:r.y+parseFloat(before.top)+parseFloat(before.height),pieceTop:box(piece).top};
     });
     return{parent:group.parentElement.dataset.treePiece,parentCentre:centre(ownPiece),parentStemX:g.x+parseFloat(stem.left),parentStemEnd:g.y+parseFloat(stem.top)+parseFloat(stem.height),children};
    }));
    for(const branch of branches){const [left,right]=branch.children;const pairs=[[branch.parentCentre,branch.parentStemX,'parent centre'],[left.pieceCentre,left.stemX,'left child centre'],[right.pieceCentre,right.stemX,'right child centre'],[left.horizontalStart,left.pieceCentre,'left branch endpoint'],[right.horizontalEnd,right.pieceCentre,'right branch endpoint'],[left.horizontalEnd,right.horizontalStart,'middle branch join'],[branch.parentStemEnd,left.horizontalY,'parent-to-branch join'],[left.horizontalY,right.horizontalY,'level fork'],[left.childStemEnd,left.pieceTop,'left child border'],[right.childStemEnd,right.pieceTop,'right child border']];for(const[a,b,label]of pairs){assert.ok(Math.abs(a-b)<1,`${view}/${word}/${branch.parent}: ${label} ${a} vs ${b}`);checks++;}}
    views.push({view,width,font,word,branches});
   }
  }
  for(const[file,digest]of Object.entries(sourceHashes)){assert.equal(hash(file),digest);checks++;}
  fs.writeFileSync(receipt,JSON.stringify({passed:true,checkedAt:new Date().toISOString(),checks,base,sourceHashes,views,scope:'Actual CSS connector endpoints compared to literal parent/child button centres and borders, with unequal subtrees; staged reader, not production acceptance'},null,2));
  console.log(JSON.stringify({passed:true,checks,receipt}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

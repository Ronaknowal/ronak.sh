import fs from 'node:fs';
const root='docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/content-preparation';
const replacements=[
 ['row309','row 309'],['section5','section 5'],['section9','section 9'],
 ['all344','all 344'],['all86','all 86'],['all41','all 41'],['all16','all 16'],
 ['the345','the 345'],['of344','of 344'],['of86','of 86'],['with258','with 258'],
 ['seed20','seed 20'],['seed21','seed 21'],['Python3.12','Python 3.12'],
 ['NumPy2.3.5','NumPy 2.3.5'],['SciPy1.18.1','SciPy 1.18.1'],['pandas3.0.1','pandas 3.0.1'],
 ['scikit-learn1.9.1','scikit-learn 1.9.1'],['official1.9.1','official 1.9.1'],
 ['SciPy1.18.0','SciPy 1.18.0'],['introduced1.15','introduced 1.15'],
 ['all344','all 344'],['the2026','the 2026'],['and86','and 86'],
 ['CSV:15586bytes','CSV: 15586 bytes'],['input:15241bytes','input: 15241 bytes'],
 ['are2.','are 2.'],['are1+','are 1+'],['and1+','and 1+'],['grows3→9','grows 3→9'],
 ['only a4','only a×4'],['a4,b1,@missing1','a×4,b×1,@missing×1'],
 ['donor0','donor 0'],['donor1','donor 1'],['donor2','donor 2'],
 ['giving0.','giving 0.'],['giving100.','giving 100.'],['gives200.','gives 200.'],
 ['target1','target 1'],['returns1,','returns 1,'],['with α0','with α=0'],['at λ0','at λ=0'],
 ['at λ2','at λ=2'],['the λ1','the λ=1'],['at λ1','at λ=1'],
 ['is2,','is 2,'],['is1²','is 1²'],['and T=','and T='],
 ['from section9','from section 9'],['α1,','α=1,'],['rows0,1,2,4','rows 0,1,2,4'],
 ['rows0,1,3,4','rows 0,1,3,4'],['row3 a','row 3 a'],['becomes3.','becomes 3.'],
 ['Row2 b','Row 2 b'],['becomes6.','becomes 6.'],['observed3','observed 3'],['give6.','give 6.'],
 ['Observed8,10,12','Observed 8,10,12'],['by2δ/5','by 2δ/5'],['about8.','about 8.'],
 ['gives7.','gives 7.'],['gives9.','gives 9.'],['completed mean20','completed mean 20'],
 ['Median amount20','Median amount 20'],['maps medium1','maps medium 1'],['unknown−1','unknown −1'],
 ['Direction wraps','Direction wraps']
];
const changes=[];
for(const name of ['sections/core.md','sections/deeper.md','sections/practice.md','sections/ending.md','programs/README.md']){
 let text=fs.readFileSync(root+'/'+name,'utf8');
 for(const [before,after] of replacements){if(before===after)continue;const count=text.split(before).length-1;if(count){text=text.replaceAll(before,after);changes.push({path:name,before,after,count});}}
 fs.writeFileSync(root+'/'+name,text);
}
fs.writeFileSync(root+'/author-readback/prose-spacing.json',JSON.stringify({role:'Bounded authored-prose spacing only; retained source/task literals are injected separately and remain exact',changes},null,2)+'\n');
console.log(JSON.stringify({changes:changes.length}));

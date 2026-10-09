import fs from 'node:fs';
const root='docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/content-preparation';
const file=root+'/sections/practice.md';
let text=fs.readFileSync(file,'utf8');
const changes=[];
text=text.replace(/\b(mask|width|median|IQR|divisor|observed|filled|shared|got|standard|robust|majority|calling|later|Later|and|recover|tie|last|to|at|At|giving|of|endpoint|index|containing|original|sum|give|sine|is|rows|donors|then|Coefficients|medians|amounts|angles|grades|IDs|period|the|for|For)(?=[0-9\[(])/g,(m)=>{changes.push(m+' → '+m+' ');return m+' ';});
const pairs=[['threshold2','threshold 2'],['min–max85','min–max 85'],['85vs84','85 versus 84'],['λ2','λ=2'],['λ0','λ=0'],['λ1','λ=1'],['α0','α=0'],['α2','α=2'],['TargetEncoder1.9','TargetEncoder 1.9'],['m5','m=5'],['m3','m=3'],['δ−2','δ=−2'],['δ2','δ=2'],['δ0','δ=0'],['P16\'s[','P16\'s ['],['is√','is √'],['mean is(','mean is ('],['pairs(','pairs (']];
for(const [before,after] of pairs){const count=text.split(before).length-1;if(count){text=text.replaceAll(before,after);changes.push({before,after,count});}}
fs.writeFileSync(file,text);
fs.writeFileSync(root+'/author-readback/practice-spacing-followup.json',JSON.stringify({role:'Final authored practice spacing; original retained task/source blocks remain separately injected exact',changes},null,2)+'\n');
console.log(JSON.stringify({changes:changes.length}));

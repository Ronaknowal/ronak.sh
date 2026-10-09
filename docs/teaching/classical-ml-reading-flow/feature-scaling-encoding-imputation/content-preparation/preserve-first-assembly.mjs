import fs from 'node:fs';
import crypto from 'node:crypto';
const root = 'docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/content-preparation';
const dir = root + '/author-readback/first-assembly';
fs.mkdirSync(dir, {recursive:true});
const bindings = [];
for (const name of ['lesson.md','visual-specifications.md','composition.json']) {
  const b = fs.readFileSync(root+'/'+name);
  const target = dir+'/'+name;
  if (fs.existsSync(target)) {
    if (!fs.readFileSync(target).equals(b)) throw Error('Prior assembly already preserved: '+name);
  } else fs.writeFileSync(target,b);
  bindings.push({path:target,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});
}
fs.writeFileSync(dir+'/receipt.json',JSON.stringify({role:'Exact first full assembly before author-read corrections',bindings,assemblyCheckFailure:'Initial includes("[[") guard falsely rejected actual Python nested arrays. No manuscript was written by that failed composition; targeted directive-pattern guard then passed. This is an assembly check repair, not scientific execution.'},null,2)+'\n');
console.log(JSON.stringify(bindings));

import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation/content-preparation';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const receipt=JSON.parse(fs.readFileSync(dir+'/new-program-execution.json'));
fs.mkdirSync(dir+'/execution-sources',{recursive:true});
function predecessor(name, hash){
 let s=fs.readFileSync(dir+'/programs/'+name+'.py','utf8');
 if(sha(Buffer.from(s))===hash)return Buffer.from(s);
 if(name==='masked_simple_imputation'){
  const start=s.indexOf('def mixed_labels('),end=s.indexOf('def fit_mixed(',start);
  s=s.slice(0,start)+s.slice(end);
  s=s.replace("    # Reserved marker is checked, not silently merged with a real label.\n    numeric", "    # Reserved marker is checked, not silently merged with a real label.\n    from category_policies import labels\n    numeric");
  s=s.replaceAll('category = mixed_labels(categories)','category = np.array(labels(categories))');
  s=s.replace('def mixed_transform(state, numeric, categories):\n    imputer', 'def mixed_transform(state, numeric, categories):\n    from category_policies import labels\n    imputer');
  s=s.replace("['b', 'a', 'not_recorded', 'a']", "['b', 'a', '@missing', 'a']");
 } else if(name==='local_spline_basis'){
  s=s.replace("    # At the right base boundary use the interior (left) derivative; degree1\n    # has a derivative jump at that knot and a right interval is another piece.\n    inside = np.nextafter(x, -np.inf) if x == state.base[-1] else x\n    lower = recurrence([inside], t, p-1)[0]", "    lower = recurrence([x], t, p-1)[0]");
  if(sha(Buffer.from(s))!==hash){
   s=s.replace("            interior = (query >= 0) & (query <= 2)\n            # sklearn 1.9.1 degree-zero constant extrapolation raises a shape\n            # error outside its base interval. Preserve that observed failure in\n            # the author receipt; compare its supported interior only here.\n            compared = interior if degree == 0 else np.ones(len(query), bool)\n            np.testing.assert_allclose(got[compared], ordinary.transform(query[compared, None]), atol=1e-12)","            np.testing.assert_allclose(got, ordinary.transform(query[:, None]), atol=1e-12)\n            interior = (query >= 0) & (query <= 2)");
  }
 }
 if(sha(Buffer.from(s))!==hash)throw Error('Cannot reconstruct exact executed predecessor '+name+' '+hash);
 return Buffer.from(s);
}
for(const [i,run] of receipt.runs.entries()){
 const bytes=predecessor(run.name,run.source.sha256);
 const snap='execution-sources/'+run.name+'.'+run.source.sha256+'.py';
 fs.writeFileSync(dir+'/'+snap,bytes);
 run.source.currentPathAtRun=run.source.file;run.source.file=snap;
 for(const key of ['stdout','stderr']){
  const prior=run[key], dest='execution-sources/'+run.name+'.run-'+(i+1)+'.'+key+'.txt';
  let b=fs.readFileSync(dir+'/'+prior.file);
  if(sha(b)!==prior.sha256 && run.name==='masked_simple_imputation' && key==='stdout'){
   b=Buffer.from(b.toString('utf8').replace('0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]]','0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0]]').replace('0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]]','0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0]]'));
  }
  if(sha(b)!==prior.sha256)throw Error('Cannot recover exact prior stream '+run.name+' '+key);
  fs.writeFileSync(dir+'/'+dest,b);prior.currentPathAtRun=prior.file;prior.file=dest;
 }
}
receipt.historyConservation='Executed predecessor source bytes reconstructed only by inverses of the recorded local edits, and every resulting source/stream SHA-256 checked against the pre-existing actual run receipt. No programme execution in this recovery.';
fs.writeFileSync(dir+'/new-program-execution.json',JSON.stringify(receipt,null,2)+'\n');
console.log('Exact source/stream history preserved:',receipt.runs.length);

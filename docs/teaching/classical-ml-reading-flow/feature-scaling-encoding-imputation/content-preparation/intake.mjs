import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const topic='docs/teaching/classical-ml-reading-flow/feature-scaling-encoding-imputation';
const owner=topic+'/content-preparation';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const bind=(p,role)=>{const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:sha(b),role};};
const intake=JSON.parse(fs.readFileSync(topic+'/design-research/intake-and-source-checks.json'));
for(const p of intake.protectedPairs){if(sha(fs.readFileSync(p.path))!==p.sha256||sha(fs.readFileSync(p.copy))!==p.copySha256)throw Error(p.path);}
const source=fs.readFileSync('src/learn/data/scaling-examples.js','utf8');
const examples=JSON.parse(source.slice(source.indexOf('export const scalingExamples = ')+31).trim().replace(/;$/,''));
fs.mkdirSync(owner+'/programs',{recursive:true});
const retained=[];
for(const [id,x] of Object.entries(examples)){
  const expected=intake.historicalPrograms.find(p=>p.id===id);
  if(sha(Buffer.from(x.code))!==expected.codeSha256||sha(Buffer.from(x.expected))!==expected.stdoutSha256)throw Error(id);
  for(const [name,value] of [[x.file,x.code],[x.file.replace('.py','.stdout.txt'),x.expected]]){
    const p=owner+'/programs/'+name;if(fs.existsSync(p)&&!fs.readFileSync(p).equals(Buffer.from(value)))throw Error('Refuse overwrite '+p);
    fs.writeFileSync(p,value);
    retained.push(bind(p,name.endsWith('.py')?'exact retained entire programme literal; not replayed':'exact retained entire stdout literal; historical execution'));
  }
}
const inputs=['public/learn-assets/feature-scaling/penguins.csv','docs/teaching/drafts/feature-scaling-encoding-imputation/calculated-inputs.json','docs/teaching/evidence/scaling-native.json'];
for(const p of inputs){const dest=owner+'/programs/'+path.basename(p);fs.copyFileSync(p,dest);}
const report={topicId:'feature-scaling-encoding-imputation',status:'authoring-in-progress-not-author-ready',rootRelease:bind(topic+'/design-research/root-content-release.json','accepted revision5 release'),designIntake:bind(topic+'/design-research/intake-and-source-checks.json','retained full source-role manifest; all30 protected pairs checked'),retained,inputs:inputs.map(p=>bind(p,'unchanged retained input/history; no numerical replay')),reading:{acceptedDesign:'Entire corrected reading-flow design, programme/practice contracts, visual/lab contracts, research/coverage, author design review, source binder and selected intake semantics read. Original relative context retained.',baseline:'Entire original draft manuscript, current lesson prose (composed reads), three whole programme/stream literals. KNN actual section2 and complete units-cosine/scratch estimator, NMF actual opening/nonnegative shapes, CV actual opening/sequence read.',guidance:'Versioned skill and relevant teaching, examples/code, review, practice/resources, visuals/labs, topic-design, Classical domain and repository adapter read.',notClaimed:'No fresh whole neighboring lesson, native/reference pixel or video review; no new manuscript read yet.'},newEnvironment:{python:'3.12.14',numpy:'2.3.5',scipy:'1.18.1',pandas:'3.0.1',sklearn:'1.9.1'},limits:['No runtime/public/canonical/central changes','No old fits/mains/science campaigns replayed','Predecessor inventory CLI unrelated EPERM remains disclosed; direct selected source checks used','Full author read and different whole content review pending']};
fs.writeFileSync(owner+'/intake.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({retained:retained.length,protectedPairs:intake.protectedPairs.length,intake:bind(owner+'/intake.json','partial checkpoint')}));

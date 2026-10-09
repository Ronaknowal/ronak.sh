import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const bind=file=>{
  const bytes=fs.readFileSync(file);
  return {path:file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
};
const read=file=>fs.readFileSync(file,'utf8');
const filename=name=>path.resolve(directory,name);
const receiptPath=filename('lifecycle-checks.json');
const receipt=JSON.parse(read(receiptPath));
const conditions=[];
function check(name,condition){
  conditions.push({name,passed:Boolean(condition)});
  if(!condition)throw new Error(name);
}
check('new38 outer conditions passed',receipt.checks.length===38 && receipt.checks.every(item=>item.passed));
check('once-only new lifecycle26 exited0',receipt.main.returncode===0 && receipt.main.inMainConditions===26 && receipt.main.fits===2);
check('foundation89 retained not replayed',receipt.reusedFoundation.conditions===89 && !receipt.reusedFoundation.replayed);
for(const expected of receipt.inputs)check(`executed input conserved ${path.basename(expected.path)}`,bind(expected.path).sha256===expected.sha256);
for(const role of ['stdout','stderr'])check(`new main ${role} conserved`,bind(receipt.main[role].path).sha256===receipt.main[role].sha256);
const sourcePath=filename('ordinary_nmf_lifecycle.py');
const source=read(sourcePath);
const coordinatePath=filename('../content-programs/nmf_coordinate.py');
const coordinate=read(coordinatePath);
const transform=coordinate.slice(coordinate.indexOf('    def transform('),coordinate.indexOf('    def inverse_transform(')).trimEnd();
const publication=coordinate.slice(coordinate.indexOf('        candidate = CoordinateState('),coordinate.indexOf('    def transform(')).trimEnd();
check('exact transform complete method fragment',transform.startsWith('    def transform(') && transform.includes('return (w, diagnostic) if return_diagnostics else w'));
check('exact final scratch publication fragment',publication.startsWith('        candidate = CoordinateState(') && publication.endsWith('return w.copy()'));
const templatePath=filename('section-ten-template.md');
const template=read(templatePath);
check('one accepted section10',template.startsWith('## 10.') && (template.match(/^## /gm)??[]).length===1);
check('three accepted mechanism jobs',(template.match(/<!-- figure:D(?:35|36|37) -->/g)??[]).length===3);
for(const[job,text]of[['D35','Read the feature labels'],['D36','This is R1'],['D37','The left lane contains']])check(`${job} above walkthrough`,template.indexOf(`<!-- figure:${job} -->`)<template.indexOf(text));
const slots=[['<!-- fragment:CoordinateNMF.transform -->',transform,'python'],['<!-- fragment:CoordinateNMF.publication -->',publication,'python'],['<!-- source:ordinary_nmf_lifecycle.py -->',source.trimEnd(),'python'],['<!-- output:lifecycle-main.stdout.txt -->',read(receipt.main.stdout.path).trimEnd(),'text']];
let assembled=template;
for(const[marker,body,language]of slots){
  check(`one exact slot ${marker}`,assembled.split(marker).length===2);
  assembled=assembled.replace(marker,`\n\`\`\`${language}\n${body}\n\`\`\`\n`);
  check(`complete literal slot ${marker}`,assembled.includes(`\n\`\`\`${language}\n${body}\n\`\`\`\n`));
}
check('no unresolved code/output slots',!assembled.includes('<!-- source:') && !assembled.includes('<!-- fragment:') && !assembled.includes('<!-- output:'));
check('actual source ownership section6',template.includes('section 6 supplies its complete') && template.includes('derived in section 6'));
const stdout=read(receipt.main.stdout.path);
check('actual new numerical values agree',stdout.includes('9.521514375206836e-14') && stdout.includes('7.5908004109663e-15') && template.includes('9.521514×10⁻¹⁴') && template.includes('7.590800×10⁻¹⁵'));
check('all current output copied including final conditioncount',assembled.includes('new_lifecycle_checks 26') && assembled.includes('ordinary rejected_candidates_preserved True'));
check('no actual stderr',fs.readFileSync(receipt.main.stderr.path).length===0);
const oldOutput=read(filename('../nmf_coordinate.stdout.txt'));
check('old scratch/ordinary comparison exact retained output',oldOutput.includes('2.0802680502249785e-13') && oldOutput.includes('1.4220050528421603e-14') && oldOutput.includes('1.6864193149049023e-07'));
check('old Frobenius norm is square root of twice half-loss',Math.abs(Math.sqrt(2*1.4220050528421603e-14)-1.6864193149049023e-7)<1e-20);
check('supplied query contribution identity',1.5+.5===2 && template.includes('[1.5,0,1.5]') && template.includes('[0,0.5,0.5]'));
check('changed exercise identity',1+1===2 && template.includes('row `[1,1,2]` has amounts `[1,1]`'));
check('D36 controlled comparison directions',4/9<3/4 && 21/400<3/4 && 21/16>3/4);
check('current code exact public operations',source.includes('candidate.fit_transform(x, W=w0, H=h0)') && source.includes('state.model.transform(x)') && source.includes('state.model.inverse_transform(w)'));
const manuscriptPath=filename('section-ten.md');
fs.writeFileSync(manuscriptPath,assembled);
const packet={status:'PASS_SECTION10_CURRENT_SOURCE_FRAGMENTS_OUTPUT_AND_PROSE',created:new Date().toISOString(),conditions,
  bindings:[sourcePath,coordinatePath,templatePath,manuscriptPath,receiptPath,filename('visual-specifications.md'),filename('README.md'),fileURLToPath(import.meta.url)].map(bind),
  sourceFragments:{transform:{source:coordinatePath,body:transform},publication:{source:coordinatePath,body:publication}},
  numericalMainReplay:false,limits:'Current composition and targeted prose/arithmetic only, no independent/native/whole-topic acceptance.'};
fs.writeFileSync(filename('section-ten-author-checks.json'),JSON.stringify(packet,null,2)+'\n');
console.log(JSON.stringify({conditions:conditions.length,manuscript:bind(manuscriptPath)}));

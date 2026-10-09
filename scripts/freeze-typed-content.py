from pathlib import Path
import json,hashlib,shutil,zipfile,re
root=Path(__file__).resolve().parents[1]
f=root/'docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems'
p=root/'public/learn/examples/typed-decision-systems'
sha=lambda x:hashlib.sha256(x.read_bytes()).hexdigest()
read=lambda x:json.loads(x.read_text(encoding='utf-8'))
for name,dest in [('banking-sources.json','data-source.json'),('banking-LICENSE','BANKING77-LICENSE'),('laya-LICENSE','LAYA-LICENSE')]:shutil.copyfile(f/'research'/name,p/dest)
guards=read(f/'program-inputs.json')['inputs']
for path,digest in guards.items():assert sha(root/path)==digest,path
cal=read(p/'results/calibration.json')['methods'];rep=read(p/'results/replay.json')
summary={'status':'terminal outputs retained; every required execution exited zero','prospective_program_review':sha(f/'program-review-acceptance.json'),'program_inputs':sha(f/'program-inputs.json'),'scratch':{},'native':read(p/'results/laya/completed.json'),'calibrations':{},'replay':{},'no_scientific_reruns':True,'scope':'Commands run sequentially after different prospective review. Loader/counterexample corrections predate every scientific execution. Scalar values below are extracted without fitting or inference.'}
for seed in [17,29,43]:
 key=f'seed-{seed}';summary['scratch'][key]=read(p/'results/scratch'/key/'completed.json');summary['replay'][key]={'batch_max_error':rep[key]['replayed_batch_max_error'],'predicted_shifts':sum(x['status']=='predicted' for x in rep[key]['shifts']),'rejected_shifts':sum(x['status']=='rejected' for x in rep[key]['shifts'])}
for name,row in cal.items():summary['calibrations'][name]={'temperature':row['temperature'],'boundary':row['boundary'],'raw':{k:row['test_raw'][k] for k in ['n','accuracy','nll','brier_sum']},'scaled':{k:row['test_calibrated'][k] for k in ['n','accuracy','nll','brier_sum']}}
summary['replay']['native_cached_bitwise']=rep['laya_external']['bitwise_cached_vector_replay']
summary['results']={x.relative_to(root).as_posix():sha(x) for x in (p/'results').rglob('*') if x.is_file()}
(f/'execution-summary.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
shutil.copyfile(f/'execution-summary.json',p/'execution-summary.json')
with zipfile.ZipFile(p/'typed-decision-systems.zip','x',compression=zipfile.ZIP_DEFLATED) as z:
 for x in sorted(p.rglob('*')):
  if x.is_file() and x.suffix!='.zip':
   assert '__pycache__' not in str(x) and x.suffix!='.pyc';z.write(x,x.relative_to(p).as_posix())
with zipfile.ZipFile(p/'typed-decision-systems.zip') as z:
 for name in z.namelist():assert z.read(name)==(p/name).read_bytes(),name
text=(f/'lesson.md').read_text(encoding='utf-8')
assert len(re.findall(r'<!-- D\d\d:',text))==36
assert len(re.findall(r'<!-- PROGRAM ',text))==10
assert len(re.findall(r'^### P\d+\.',text,re.M))==18
files={x.relative_to(root).as_posix():sha(x) for base in [f,p] for x in base.rglob('*') if x.is_file() and x.name!='content-inputs.json'}
for x in [root/'scripts/finish-typed-content.py',root/'scripts/freeze-typed-content.py']:files[x.relative_to(root).as_posix()]=sha(x)
packet={'status':'complete authored content awaiting different whole review; no runtime started','author':'root','manuscript':sha(f/'lesson.md'),'visuals':36,'programs':10,'practices':18,'files':files}
(f/'content-inputs.json').write_text(json.dumps(packet,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'manuscript':packet['manuscript'],'packet':sha(f/'content-inputs.json'),'bindings':len(files),'zip_entries':len(z.namelist())}))

import hashlib,json,pathlib,subprocess,sys
from datetime import datetime,timezone
folder=pathlib.Path(__file__).resolve().parent
receipt=folder/'content-new-practice-execution-r1.json'
if receipt.exists():raise RuntimeError('Do not replay frozen practice execution')
p=folder/'content-prepared/programmes/rd_practice.py'
run=subprocess.run([sys.executable,'-B',str(p)],capture_output=True,text=True,encoding='utf-8')
out=p.with_suffix('.stdout');err=p.with_suffix('.stderr')
out.write_text(run.stdout,encoding='utf-8',newline='\n');err.write_text(run.stderr,encoding='utf-8',newline='\n')
def identity(p):return {'path':str(p.relative_to(folder.parents[3])).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
receipt.write_text(json.dumps({'completedAt':datetime.now(timezone.utc).isoformat(),'scope':'One first execution of new bounded practice functions and changed fixtures only; no old seven or new three programme main replay, no old2047-case campaign. Imports are guarded helpers.','programme':identity(p),'stdout':identity(out),'stderr':identity(err),'exitCode':run.returncode,'python':sys.version},indent=2)+'\n',encoding='utf-8',newline='\n')
print(run.stdout);print(run.stderr);raise SystemExit(run.returncode)

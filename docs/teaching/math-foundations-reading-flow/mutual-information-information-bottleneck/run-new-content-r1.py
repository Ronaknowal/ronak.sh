import hashlib
import json
import pathlib
import subprocess
import sys
from datetime import datetime, timezone

folder = pathlib.Path(__file__).resolve().parent
root = folder.parents[3]
programmes = folder / 'content-prepared/programmes'
receipt = folder / 'content-new-programme-execution-r1.json'
if receipt.exists():
    raise RuntimeError('Do not replay frozen programme executions')
old = (programmes/'mi_iteration.py').read_text(encoding='utf-8')
reference = old[:old.index("for name, encoder in [")]
(programmes/'finite_ib_reference.py').write_text(reference,encoding='utf-8',newline='\n')
dataset = root/'docs/teaching/math-foundations-reading-flow/entropy-cross-entropy-kl-divergence/content-prepared/programmes/penguins.csv'
(programmes/'penguins.csv').write_bytes(dataset.read_bytes())
rows=[]
for name in ['finite_ib_numpy.py','gaussian_vib_step.py','finite_fano.py','penguins_information.py']:
    file=programmes/name
    run=subprocess.run([sys.executable,'-B',str(file)],capture_output=True,text=True,encoding='utf-8')
    out=folder/'content-prepared/outputs'/f'{name}.display.txt'
    out.write_text(run.stdout,encoding='utf-8',newline='\n')
    rows.append({'file':name,'sourceSha256':hashlib.sha256(file.read_bytes()).hexdigest(),
                 'exitCode':run.returncode,'stdout':run.stdout,'stderr':run.stderr,
                 'stdoutSha256':hashlib.sha256(out.read_bytes()).hexdigest()})
    print(name,run.returncode)
import numpy, scipy, torch, sklearn
receipt.write_text(json.dumps({'completedAt':datetime.now(timezone.utc).isoformat(),
    'scope':'Exactly four new programmes; original full mains not executed. The array programme compares extracted exact scratch functions on the new declared matched run.',
    'python':sys.version,'numpy':numpy.__version__,'scipy':scipy.__version__,'torch':torch.__version__,'sklearn':sklearn.__version__,
    'reference':{'source':'mi_iteration.py','selection':'Exact complete prefix before module demonstration loop, LF-normalized','sha256':hashlib.sha256(reference.encode()).hexdigest()},
    'programmes':rows},indent=2)+'\n',encoding='utf-8',newline='\n')
if any(r['exitCode'] for r in rows):
    raise SystemExit(1)

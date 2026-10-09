"""Execute NEW constructed programmes only, retain exact streams and failures.

Never imports or executes fitted_preparation.py, penguins_prepare.py/cross_fit.py.
Each process receives the local program directory, UTF-8 output and no bytecode.
"""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

OWNER = Path(__file__).resolve().parent
PROGRAMS = OWNER / 'programs'
NAMES = ['fitted_rulers', 'category_policies', 'masked_simple_imputation',
         'nan_aware_donors', 'fitted_power_maps', 'fitted_quantile_maps',
         'fitted_target_encoding', 'bins_polynomials_cycles', 'local_spline_basis',
         'signed_feature_hashing', 'conditional_iterative_completion',
         'pool_scalar_analyses', 'normal_completion_and_sensitivity']
selected = sys.argv[1:] or NAMES
if any(name not in NAMES+['practice_solutions'] for name in selected):
    raise ValueError('only named NEW programmes may be executed')
receipt_path = OWNER / 'new-program-execution.json'
receipt = json.loads(receipt_path.read_text('utf-8')) if receipt_path.exists() else {
    'role': 'focused new constructed calculations; no unchanged historical fit replay',
    'runs': [], 'limits': ['not runtime/browser/independent review', 'R example unexecuted']}
def binding(path):
    b = path.read_bytes()
    return {'file': str(path.relative_to(OWNER)).replace('\\', '/'),
            'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()}
for name in selected:
    source = PROGRAMS/(name+'.py')
    source_bytes = source.read_bytes()
    source_hash = hashlib.sha256(source_bytes).hexdigest()
    snapshot = OWNER/'execution-sources'/(name+'.'+source_hash+'.py')
    snapshot.parent.mkdir(exist_ok=True)
    snapshot.write_bytes(source_bytes)
    command = [sys.executable, '-B', '-X', 'utf8', str(PROGRAMS / (name+'.py'))]
    run = subprocess.run(command, cwd=PROGRAMS, capture_output=True,
                         env={**os.environ, 'PYTHONUTF8': '1', 'PYTHONDONTWRITEBYTECODE': '1'})
    # Failed attempts retain their own streams, even if later repaired.
    attempt = 1+sum(r['name'] == name for r in receipt['runs'])
    stem = name+f'.attempt-{attempt}'
    out, err = PROGRAMS/(stem+'.stdout.txt'), PROGRAMS/(stem+'.stderr.txt')
    out.write_bytes(run.stdout)
    err.write_bytes(run.stderr)
    receipt['runs'].append({'name': name, 'at': datetime.now(timezone.utc).isoformat(),
                            'command': command, 'exit': run.returncode,
                            'source': binding(snapshot),
                            'stdout': binding(out), 'stderr': binding(err)})
    receipt_path.write_text(json.dumps(receipt, indent=2)+'\n', encoding='utf-8')
    if run.returncode == 0:
        (PROGRAMS/(name+'.stdout.txt')).write_bytes(run.stdout)
        (PROGRAMS/(name+'.stderr.txt')).write_bytes(run.stderr)
    print(name, 'exit', run.returncode, 'stdout', len(run.stdout), 'stderr', len(run.stderr))
    if run.returncode:
        print(run.stderr.decode('utf-8', errors='replace'))

"""Execute plotting programs; independently check bins; bind results to source.
Use --write-summary only when intentionally regenerating the lesson-owned view.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import xml.etree.ElementTree as ET
import numpy as np

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--write-summary', action='store_true')
args = parser.parse_args()
code = root / 'public/learn-code/visualization'
output = root / 'scratch/visualization-verification'
data = root / 'public/learn-assets/neural-training-diagnostics-reproducible-experiments/wine.csv'
results = {}
for name in ['visualization_pipeline.py', 'visualization_library_views.py']:
    command = [sys.executable, '-B', str(code/name), '--data', str(data), '--output', str(output)]
    completed = subprocess.run(command, check=True, capture_output=True, text=True)
    results[name] = json.loads(completed.stdout.strip().splitlines()[-1])
spec = importlib.util.spec_from_file_location('plotting', code/'visualization_pipeline.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
rng = np.random.default_rng(39)
cases = 0
for _ in range(40):
    edges = np.unique(np.r_[0, rng.uniform(0, 10, 6), 10])
    values = np.r_[edges, rng.uniform(-1, 11, 100)]
    counts, density, outside = module.histogram(values, edges)
    reference, _ = np.histogram(values, edges)
    normalized, _ = np.histogram(values, edges, density=True)
    np.testing.assert_array_equal(counts, reference)
    np.testing.assert_allclose(density, normalized)
    assert outside == int(((values < 0) | (values > 10)).sum())
    cases += 1
assert module.histogram([], [0,1]) == ([0], [0.0], 0)
for edges in [[0,0], [2,1], [0,float('inf')]]:
    try:
        module.histogram([1], edges)
    except ValueError:
        pass
    else:
        raise AssertionError('Invalid edges accepted')
for value in [float('nan'), float('inf')]:
    try:
        module.histogram([value], [0,1])
    except ValueError:
        pass
    else:
        raise AssertionError('Nonfinite observation accepted')
for file in output.glob('*.svg'):
    ET.parse(file)
summary = results['visualization_pipeline.py']
target = root / 'src/learn/data/visualization-wine-summary.json'
if args.write_summary:
    target.write_text(json.dumps(summary, indent=2)+'\n', encoding='utf-8')
else:
    assert json.loads(target.read_text()) == summary
record = {'kind':'author-native-verification', 'python':sys.version, 'checks':results,
          'independent_histogram_cases':cases, 'source_files':{
              str(path.relative_to(root)).replace('\\','/'):hashlib.sha256(path.read_bytes()).hexdigest()
              for path in [*code.glob('*.py'), data, target]},
          'limits':['CPU plotting and exact fixture checks; no inferential population claim.',
                    'Author program execution does not certify browser readability.']}
folder = root / 'docs/teaching/core-frameworks/visualization'
(folder/'native-evidence.json').write_text(json.dumps(record,indent=2)+'\n', encoding='utf-8')
print(json.dumps({'programs':'pass','histogram_cases':cases,'rows':summary['rows'],'source_bound_evidence':True}))

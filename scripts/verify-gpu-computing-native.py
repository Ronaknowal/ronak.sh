"""CPU-executable correctness evidence; CUDA execution is explicitly unavailable."""
import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import numpy as np

sys.dont_write_bytecode = True
root = Path(__file__).resolve().parents[1]
folder = root / 'public/learn-code/gpu-accelerated-computing'
reports = {}
for path in sorted(folder.glob('*.py')):
    ast.parse(path.read_text())
    result = subprocess.run([sys.executable, '-B', str(path)], check=True, capture_output=True, text=True)
    reports[path.name] = json.loads(result.stdout)
spec = importlib.util.spec_from_file_location('gpu_affine_relu', folder / 'gpu_affine_relu.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
generator = np.random.default_rng(91)
cases = 0
for size in (0, 1, 2, 19, 31, 32, 33, 257):
    x = generator.normal(size=size).astype(np.float32)
    for a, b in ((-2., 1.), (0., -.5), (.75, .1), (4., -3.)):
        reference = np.maximum(np.float32(0), np.float32(a) * x + np.float32(b))
        for blocks, threads in ((1, 1), (2, 4), (4, 8)):
            actual = module.cpu_grid_stride(x, a, b, blocks, threads)
            np.testing.assert_array_equal(actual, reference)
            cases += 1
for invalid in (np.array([np.nan], dtype=np.float32), np.ones(2, dtype=np.float64), np.ones((2, 2), dtype=np.float32), np.arange(6, dtype=np.float32)[::2]):
    try:
        module.cpu_grid_stride(invalid, 1, 0, 1, 4)
    except ValueError:
        pass
    else:
        raise AssertionError('Invalid raw-kernel input contract accepted')
for a, b in ((1e300, 0), (1, -1e300), (float('nan'), 0)):
    try:
        module.cpu_grid_stride(np.ones(2, dtype=np.float32), a, b, 1, 4)
    except ValueError:
        pass
    else:
        raise AssertionError('Unrepresentable scalar accepted')
account_spec = importlib.util.spec_from_file_location('gpu_account', folder / 'gpu_workload_accounting.py')
account_module = importlib.util.module_from_spec(account_spec)
account_spec.loader.exec_module(account_module)
for settings in ({'stages': 1.5}, {'elements': float('nan')}, {'launch_us': float('nan')}, {'host_gb_s': float('inf')}):
    try:
        account_module.account(**settings)
    except ValueError:
        pass
    else:
        raise AssertionError('Invalid accounting input accepted')
record = {
    'kind': 'author-native-cpu-verification', 'python': sys.version, 'numpy': np.__version__,
    'program_outputs': reports, 'additional_numpy_parity_cases': cases,
    'sources': {str(path.relative_to(root)).replace('\\', '/'): hashlib.sha256(path.read_bytes()).hexdigest() for path in folder.glob('*.py')},
    'cuda': {'executed': False, 'reason': 'Available PyTorch runtime is CPU-only; no CUDA hardware. CUDA source reviewed, but compilation, native parity, timing and sanitizer execution are unverified.'},
    'limits': ['Index simulation does not execute GPU threads.', 'Cost model is algebraic accounting, never measured performance.', 'Rendered checks are owned by integration.'],
}
target = root / 'docs/teaching/core-frameworks/gpu-accelerated-computing/native-evidence.json'
target.write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps({'programs': 'passed', 'additional_numpy_cases': cases, 'cuda_executed': False}))

"""Execute canonical programs and independently check their local derivatives."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import numpy as np
import torch

sys.dont_write_bytecode = True
root = Path(__file__).resolve().parents[1]
folder = root / 'public/learn-code/tensor-shapes-autograd-graphs-device-boundaries'
outputs = {}
for path in sorted(folder.glob('*.py')):
    result = subprocess.run([sys.executable, '-B', str(path)], check=True, capture_output=True, text=True)
    outputs[path.name] = json.loads(result.stdout)
spec = importlib.util.spec_from_file_location('shape_gradients', folder / 'tensor_shape_gradients.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
random = np.random.default_rng(27)
derivatives = 0
maximum_error = 0.
for batch in (1, 2, 4):
    for features in (1, 3):
        for output in (1, 2, 3):
            x = random.normal(size=(batch, 2 * features))[:, ::2]
            weight = random.normal(size=(features, output))
            bias = random.normal(size=output)
            target = random.normal(size=(batch, output))
            _, gradients = module.affine_gradients(x, weight, bias, target)
            tensors = [torch.tensor(value, requires_grad=True) for value in (x, weight, bias)]
            loss = .5 * (tensors[0] @ tensors[1] + tensors[2] - torch.from_numpy(target)).square().mean()
            library = torch.autograd.grad(loss, tensors)
            for index, (name, values) in enumerate(zip(('x', 'weight', 'bias'), (x, weight, bias))):
                np.testing.assert_allclose(gradients[name], library[index].numpy(), atol=1e-12)
                for coordinate in np.ndindex(values.shape):
                    positive = [array.copy() for array in (x, weight, bias)]
                    negative = [array.copy() for array in (x, weight, bias)]
                    positive[index][coordinate] += 1e-5
                    negative[index][coordinate] -= 1e-5
                    difference = (module.affine_gradients(*positive, target)[0] -
                                  module.affine_gradients(*negative, target)[0]) / 2e-5
                    error = abs(difference - gradients[name][coordinate])
                    assert error < 2e-8
                    maximum_error = max(maximum_error, error)
                    derivatives += 1
for target in (np.ones(2), np.ones((2, 2)), np.ones((1, 1))):
    try:
        module.affine_gradients(np.eye(2), np.ones((2, 1)), np.zeros(1), target)
    except ValueError:
        pass
    else:
        raise AssertionError('Mismatched target accepted')
record = {
    'kind': 'author-native-verification', 'python': sys.version,
    'numpy': np.__version__, 'torch': torch.__version__, 'cuda_available': torch.cuda.is_available(),
    'program_outputs': outputs, 'finite_difference_derivatives': derivatives,
    'maximum_finite_difference_error': maximum_error,
    'shape_configurations': 18, 'invalid_target_shapes_rejected': 3,
    'source_files': {str(path.relative_to(root)).replace('\\', '/'): hashlib.sha256(path.read_bytes()).hexdigest() for path in folder.glob('*.py')},
    'limits': ['CPU numerical, layout, alias and dtype contracts tested.', 'CUDA copy branch unavailable on this CPU-only runtime.', 'Rendered checks and independent review are separate.'],
}
target = root / 'docs/teaching/core-frameworks/tensor-shapes-autograd-graphs-device-boundaries/native-evidence.json'
target.write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps({'programs': 'pass', 'derivatives': derivatives, 'max_error': maximum_error, 'cuda': torch.cuda.is_available()}))

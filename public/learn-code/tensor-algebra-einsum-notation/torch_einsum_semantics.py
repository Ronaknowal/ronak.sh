"""NumPy 2.3.5 and PyTorch 2.14.0 CPU; no training or speed comparison.
The documented ellipsis reduction difference is intentional.
"""
import numpy as np
import torch

x = np.arange(6, dtype=float).reshape(2, 1, 3)
y = np.arange(12, dtype=float).reshape(4, 3)
numpy_result = np.einsum('...i,...i->...', x, y)
torch_result = torch.einsum('...i,...i->...', torch.tensor(x), torch.tensor(y))
print('retained ellipsis shape', tuple(torch_result.shape))
print('retained ellipsis agreement', np.allclose(numpy_result, torch_result.numpy()))
print('torch reduced ellipsis', float(torch.einsum('...i,...i->', torch.tensor(x), torch.tensor(y))))
print('explicit numpy reduction', float(numpy_result.sum()))
try:
    np.einsum('...i,...i->', x, y)
except ValueError:
    print('numpy omitted ellipsis accepted', False)
try:
    torch.einsum('ii->i', torch.zeros(1, 3))
except RuntimeError:
    print('unequal repeated axes accepted', False)
print('cross-operand singleton', torch.einsum('bi,bi->b',
      torch.tensor([[2., 3.]]), torch.tensor([[1., 0.], [0., 1.]])).tolist())

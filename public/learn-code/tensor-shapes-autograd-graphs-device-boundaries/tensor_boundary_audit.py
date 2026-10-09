"""Observe storage, gradient connectivity, leaf status and dtype/device copies."""
import json

import torch


def gradient_path(mode, weight=2., x=3., bias=1., target=0.):
    w = torch.tensor(weight, dtype=torch.float64, requires_grad=True)
    b = torch.tensor(bias, dtype=torch.float64, requires_grad=True)
    product = w * x
    transformations = {'connected': lambda value: value,
                       'clone': lambda value: value.clone(),
                       'detach': lambda value: value.detach(),
                       'detached-copy': lambda value: value.detach().clone()}
    if mode not in transformations:
        raise ValueError('Unknown boundary mode')
    routed = transformations[mode](product)
    residual = routed + b - target
    loss = .5 * residual.square()
    dw, db = torch.autograd.grad(loss, (w, b), allow_unused=True)
    return {'mode': mode, 'product': product.item(), 'output': (routed + b).item(),
            'loss': loss.item(), 'weight_gradient': None if dw is None else dw.item(),
            'bias_gradient': db.item(),
            'shares_product_storage': routed.data_ptr() == product.data_ptr(),
            'routed_requires_grad': routed.requires_grad, 'routed_is_leaf': routed.is_leaf}


def storage_probe(mode):
    # No active backward graph: this isolated mutation only demonstrates aliasing.
    source = torch.tensor([2., 4.])
    routed = source.detach() if mode == 'detach' else source.clone()
    routed[0] = 9.
    return {'source_after_mutation': source.tolist(), 'routed': routed.tolist()}


def run():
    torch.set_num_threads(1)
    paths = [gradient_path(mode) for mode in ('connected', 'clone', 'detach', 'detached-copy')]
    assert paths[0]['weight_gradient'] == paths[1]['weight_gradient'] == 21.
    assert paths[2]['weight_gradient'] is None and paths[3]['weight_gradient'] is None
    assert all(row['bias_gradient'] == 7. for row in paths)
    source = torch.tensor([2., -3.], dtype=torch.float32, requires_grad=True)
    same = source.to(dtype=torch.float32)
    converted = source.to(dtype=torch.float64)
    derivative, = torch.autograd.grad(converted.square().sum(), source)
    torch.testing.assert_close(derivative, torch.tensor([4., -6.]))
    integer = source.to(dtype=torch.int64)
    assert same is source and not converted.is_leaf and not integer.requires_grad

    disconnected = source.detach().clone().requires_grad_()
    new_gradient, old_gradient = torch.autograd.grad(
        disconnected.square().sum(), (disconnected, source), allow_unused=True)
    assert old_gradient is None

    # A detached alias still touches a value saved for backward.
    stale = torch.tensor([2.], requires_grad=True)
    saved_loss = stale.square().sum()
    stale.detach().add_(1.)
    try:
        saved_loss.backward()
    except RuntimeError as error:
        if 'modified by an inplace operation' not in str(error):
            raise
        mutation_rejected = True
    else:
        raise AssertionError('Expected saved-value mutation to be rejected')

    cuda = {'available': torch.cuda.is_available(), 'executed': False}
    if torch.cuda.is_available():
        cpu_leaf = torch.tensor([2., -3.], requires_grad=True)
        device_value = cpu_leaf.to('cuda')
        device_gradient, = torch.autograd.grad(device_value.square().sum(), cpu_leaf)
        torch.testing.assert_close(device_gradient, torch.tensor([4., -6.]))
        cuda = {'available': True, 'executed': True,
                'device': str(device_value.device), 'gradient_device': str(device_gradient.device)}
    return {'torch': torch.__version__, 'paths': paths,
            'detach_mutation': storage_probe('detach'), 'clone_mutation': storage_probe('clone'),
            'same_dtype_returns_same_object': same is source,
            'float_conversion_gradient': derivative.tolist(),
            'float_conversion_is_leaf': converted.is_leaf,
            'integer_requires_grad': integer.requires_grad,
            'new_leaf_gradient': new_gradient.tolist(), 'old_leaf_gradient': old_gradient,
            'saved_value_mutation_rejected': mutation_rejected, 'cuda': cuda}


if __name__ == '__main__':
    print(json.dumps(run(), indent=2))

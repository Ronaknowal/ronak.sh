"""Ordinary Torch APIs on fixed constructed cases. No fitting or file writes.

Requires diagnostic-measurements.py in the same directory, NumPy and PyTorch.
"""
import importlib.util
from pathlib import Path
import sys
import torch

path = Path(__file__).with_name('diagnostic-measurements.py')
spec = importlib.util.spec_from_file_location('diagnostic_measurements', path)
measurements = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = measurements
spec.loader.exec_module(measurements)


def scalar_probe(rows, weight, rate, perform_step=True):
    x, y = torch.tensor(rows, dtype=torch.float64).T
    parameter = torch.nn.Parameter(torch.tensor(weight, dtype=torch.float64))
    optimizer = torch.optim.SGD([parameter], lr=rate)
    before = parameter.detach().clone()
    observed = []
    handle = parameter.register_hook(lambda gradient: observed.append(gradient.detach().clone()))
    try:
        loss = ((parameter * x - y).square() / 2).mean()
        loss.backward()
    finally:
        handle.remove()  # The observer never changes the gradient it receives.
    if perform_step:
        optimizer.step()
    stats = measurements.parameter_measurements(before.numpy(), parameter.detach().numpy(),
                                                parameter.grad.detach().numpy())
    return dict(loss=loss.item(), gradient=parameter.grad.item(),
                before=before.item(), after=parameter.item(),
                optimizer_owns_parameter=any(parameter is p for group in optimizer.param_groups for p in group['params']),
                hook_gradient=observed[0].item(), hook_calls=len(observed),
                **stats)


def mode_probe(values, mean, variance, training, graph_enabled, module='batchnorm'):
    x = torch.tensor(values, dtype=torch.float64).reshape(-1, 1)
    layer = torch.nn.BatchNorm1d(1, dtype=torch.float64) if module == 'batchnorm' else torch.nn.Linear(1, 1, dtype=torch.float64)
    with torch.no_grad():
        if module == 'batchnorm':
            layer.running_mean.fill_(mean)
            layer.running_var.fill_(variance)
            layer.weight.fill_(1.)
            layer.bias.zero_()
        else:
            layer.weight.fill_(2.)
            layer.bias.fill_(1.)
    layer.train(training)
    with torch.set_grad_enabled(graph_enabled):
        output = layer(x)
    return dict(output=output.detach().flatten().tolist(), graph_recorded=output.requires_grad,
                next_mean=layer.running_mean.item() if module == 'batchnorm' else None,
                next_variance=layer.running_var.item() if module == 'batchnorm' else None)


def unfinished_group_probe(rows, weight, rate, consumed):
    x, y = torch.tensor(rows, dtype=torch.float64).T
    parameter = torch.nn.Parameter(torch.tensor(weight, dtype=torch.float64))
    optimizer = torch.optim.SGD([parameter], lr=rate)
    # Divide each chunk by the SAME full-group denominator before backward.
    (((parameter * x[:consumed] - y[:consumed]).square() / 2).sum() / len(x)).backward()
    saved_weight = parameter.detach().clone()
    saved_gradient = parameter.grad.detach().clone()
    resumed = torch.nn.Parameter(saved_weight.clone())
    resumed.grad = saved_gradient.clone()
    resumed_optimizer = torch.optim.SGD([resumed], lr=rate)
    (((resumed * x[consumed:] - y[consumed:]).square() / 2).sum() / len(x)).backward()
    gradient = resumed.grad.item()
    resumed_optimizer.step()
    return dict(saved_gradient=saved_gradient.item(), gradient=gradient, after=resumed.item(),
                denominator=len(x), cursor=consumed,
                independent_storage=saved_gradient.data_ptr() != resumed.grad.data_ptr())


def gradient_check_probe():
    point = torch.tensor([1., 2.], dtype=torch.float64, requires_grad=True)
    def function(value):
        a, b = value.unbind()
        return torch.stack([a.square() + 3 * b, a * b])
    # Fixed state, float64, smooth point, independently allocated input storage.
    checked = torch.autograd.gradcheck(function, (point,), eps=1e-6, atol=1e-5, rtol=1e-3)
    jacobian = torch.autograd.functional.jacobian(function, point)
    with torch.autograd.detect_anomaly(check_nan=True):
        function(point).sum().backward()
    return dict(gradcheck=checked, jacobian=jacobian.tolist(), gradient=point.grad.tolist())


def first_nonfinite(named_tensors):
    """The first supplied operand with a nonfinite value; no universal alarm."""
    for name, value in named_tensors:
        if not torch.isfinite(value).all():
            return name
    return None


def autodiff_network_probe(autodiff_path):
    """Reuse the exact earlier engine; map its input/output weights to F.linear.

    Supply the downloaded teaching-autodiff.py path. This compares one forward,
    backward and SGD update on identical arrays, without importing an eager fit.
    """
    engine_spec = importlib.util.spec_from_file_location('teaching_autodiff', autodiff_path)
    engine = importlib.util.module_from_spec(engine_spec)
    engine_spec.loader.exec_module(engine)
    np = measurements.np
    x = np.array([[1., 2.], [-1., .5]])
    targets = np.array([0, 2])
    arrays = [np.array([[.5, -1.], [1., .25]]), np.array([.1, -.2]),
              np.array([[.3, -.5, .2], [-.7, .1, .4]]), np.array([0., .1, -.1])]
    native = [engine.Tensor(a, requires_grad=True) for a in arrays]
    w, b, v, c = native
    native_logits = ((engine.Tensor(x) @ w + b).tanh() @ v) + c
    native_loss = native_logits.cross_entropy(targets)
    native_loss.backward()
    # Ordinary linear consumes weights in output-by-input orientation.
    library = [torch.tensor(a.T if i in (0, 2) else a, dtype=torch.float64,
                            requires_grad=True) for i, a in enumerate(arrays)]
    tw, tb, tv, tc = library
    library_logits = torch.nn.functional.linear(
        torch.nn.functional.linear(torch.tensor(x), tw, tb).tanh(), tv, tc)
    library_loss = torch.nn.functional.cross_entropy(library_logits, torch.tensor(targets))
    library_loss.backward()
    mapped_gradients = [p.grad.numpy().T if i in (0, 2) else p.grad.numpy()
                        for i, p in enumerate(library)]
    return dict(native_loss=float(native_loss.data), library_loss=library_loss.item(),
                logits_max_error=float(np.max(np.abs(native_logits.data - library_logits.detach().numpy()))),
                gradient_max_errors=[float(np.max(np.abs(p.grad - g))) for p, g in zip(native, mapped_gradients)],
                update_max_errors=[float(np.max(np.abs((a - .1 * p.grad) - (a - .1 * g))))
                                   for a, p, g in zip(arrays, native, mapped_gradients)])


def main():
    print('step', scalar_probe([(1, 2), (2, 0), (3, 1)], 0., .1))
    print('omitted', scalar_probe([(1, 2), (2, 0), (3, 1)], 0., .1, False))
    print('mode', mode_probe([1., 3.], 0., 1., True, False))
    print('group', unfinished_group_probe([(1, 2), (2, 0), (3, 1)], 0., .1, 2))
    print('derivatives', gradient_check_probe())


if __name__ == '__main__':
    main()

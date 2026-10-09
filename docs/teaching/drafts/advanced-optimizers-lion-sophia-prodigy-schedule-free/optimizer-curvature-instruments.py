"""Matrix-free Hessian-vector products and the nonlinear GGN distinction.

CPU float64 teaching instruments, not a Sophia-H training benchmark. Run with
NumPy and PyTorch installed. No files, model fits or stored results are written.
Autograd supplies differentiated primitives; we explicitly construct the probe,
gradient-of-gradient operation, independent matrices and finite differences.
"""
import numpy as np
import torch


def hessian_vector(loss_function, parameters, probe):
    """Return gradient and H @ fixed probe at a fresh, unchanged parameter state.

    One reverse pass creates the gradient graph; a second differentiates its
    inner product with the detached probe. Never mutate parameters between them.
    This stores derivative graph intermediates, not a dense parameter Hessian.
    """
    if parameters.shape != probe.shape or not parameters.is_floating_point():
        raise ValueError("Parameters and probe need the same floating shape")
    if parameters.device != probe.device or parameters.dtype != probe.dtype:
        raise ValueError("Parameters and probe must share dtype/device")
    if not bool(torch.isfinite(parameters).all() and torch.isfinite(probe).all()):
        raise ValueError("Parameters and probe must be finite")
    point = parameters.detach().clone().requires_grad_(True)
    fixed_probe = probe.detach()
    loss = loss_function(point)
    if loss.ndim != 0 or not bool(torch.isfinite(loss)):
        raise ValueError("Loss must be one finite differentiable scalar")
    gradient, = torch.autograd.grad(loss, point, create_graph=True)
    # A linear objective has a constant gradient and a zero Hessian.
    product = torch.autograd.grad((gradient * fixed_probe).sum(), point)[0] \
        if gradient.requires_grad else torch.zeros_like(point)
    return gradient.detach(), product.detach()


def finite_difference_product(loss_function, parameters, probe, epsilon=1e-6):
    """Independent directional difference of freshly evaluated gradients."""
    derivatives = []
    for sign in (1., -1.):
        point = (parameters + sign * epsilon * probe).detach().requires_grad_(True)
        derivatives.append(torch.autograd.grad(loss_function(point), point)[0])
    return ((derivatives[0] - derivatives[1]) / (2 * epsilon)).detach()


def nonlinear_classifier_parts(parameters, target):
    """Explicit chain-rule GGN and logit-curvature residual for three classes.

    Logits: [a²+b, a*b, -b²+.2*a]. J has shape [classes, parameters].
    C=diag(p)-p*p.T is logit-space loss curvature. Full H=J.T*C*J plus
    sum_class (p-one_hot)_class * Hessian(logit_class).
    """
    a, b = np.asarray(parameters, dtype=np.float64)
    scores = np.array([a*a+b, a*b, -b*b+.2*a])
    mass = np.exp(scores - scores.max())
    probabilities = mass / mass.sum()
    jacobian = np.array([[2*a, 1.], [b, a], [.2, -2*b]])
    covariance = np.diag(probabilities) - np.outer(probabilities, probabilities)
    ggn = jacobian.T @ covariance @ jacobian
    logit_hessians = np.array([[[2., 0.], [0., 0.]],
                               [[0., 1.], [1., 0.]],
                               [[0., 0.], [0., -2.]]])
    residual = probabilities - np.eye(3)[target]
    remainder = np.einsum('c,cij->ij', residual, logit_hessians)
    return probabilities, ggn, remainder


def main():
    torch.set_num_threads(1)
    dtype = torch.float64
    errors = []
    probe_count = 0
    # PSD matrix: one individual u_i*(H*u)_i is still negative.
    matrices = [np.array([[4., -2.], [-2., 1.]]),
                np.array([[2., 3.], [3., 1.]]), np.zeros((2, 2))]
    point = torch.tensor([.7, -1.2], dtype=dtype)
    probes = [np.array([u, v]) for u in (-1., 1.) for v in (-1., 1.)]
    for matrix in matrices:
        native_matrix = torch.tensor(matrix, dtype=dtype)
        objective = lambda x: .5 * x @ native_matrix @ x
        estimates = []
        for values in probes + [np.array([.3, -1.7]), np.zeros(2)]:
            probe = torch.tensor(values, dtype=dtype)
            gradient, product = hessian_vector(objective, point, probe)
            np.testing.assert_allclose(gradient.numpy(), matrix @ point.numpy(), atol=1e-12)
            np.testing.assert_allclose(product.numpy(), matrix @ values, atol=1e-12)
            difference = finite_difference_product(objective, point, probe)
            error = float(torch.max(torch.abs(product - difference)))
            assert error < 1e-8
            errors.append(error)
            if probe_count % 6 < 4:
                estimates.append(values * product.numpy())
            probe_count += 1
        np.testing.assert_allclose(np.mean(estimates, axis=0), np.diag(matrix), atol=1e-12)
    print("PSD probe [1,1]:", probes[3] * (matrices[0] @ probes[3]),
          "; eigenvalues:", np.linalg.eigvalsh(matrices[0]))

    largest_chain_error = 0.
    for values in ([1., -.7], [.2, 1.3], [0., 0.]):
        parameters = torch.tensor(values, dtype=dtype)
        for target in range(3):
            def objective(x):
                a, b = x.unbind()
                scores = torch.stack((a*a+b, a*b, -b*b+.2*a))
                return torch.logsumexp(scores, dim=0) - scores[target]
            probability, ggn, remainder = nonlinear_classifier_parts(values, target)
            for probe_values in ([1., 0.], [0., 1.], [.3, -1.7]):
                probe = torch.tensor(probe_values, dtype=dtype)
                _, product = hessian_vector(objective, parameters, probe)
                chain_product = (ggn + remainder) @ np.array(probe_values)
                largest_chain_error = max(largest_chain_error,
                    float(np.max(np.abs(product.numpy()-chain_product))))
                np.testing.assert_allclose(product.numpy(), chain_product, atol=1e-12)
                difference = finite_difference_product(objective, parameters, probe)
                error = float(torch.max(torch.abs(product-difference)))
                assert error < 1e-8
                errors.append(error)
            assert np.linalg.eigvalsh(ggn).min() >= -1e-12

    # The manuscript's single-weight counterexample: logits [theta², 0], label0.
    theta = torch.tensor([1.], dtype=dtype)
    def scalar_loss(x):
        scores = torch.stack((x[0]**2, x[0]*0))
        return torch.logsumexp(scores, dim=0)-scores[0]
    _, full_product = hessian_vector(scalar_loss, theta, torch.ones_like(theta))
    p = 1 / (1 + np.exp(-1.))
    ggn = 4*p*(1-p)
    remainder = 2*(p-1)
    np.testing.assert_allclose(full_product.item(), ggn+remainder, atol=1e-12)
    print("theta1 GGN:", ggn, "; logit-curvature residual:", remainder,
          "; full Hessian:", full_product.item())
    _, linear_product = hessian_vector(lambda x: (x*2).sum(), point, point)
    torch.testing.assert_close(linear_product, torch.zeros_like(point))
    for bad_probe in (torch.ones(3, dtype=dtype),
                      torch.tensor([float('nan'), 1.], dtype=dtype)):
        try:
            hessian_vector(lambda x: (x*x).sum(), point, bad_probe)
        except ValueError:
            pass
        else:
            raise AssertionError("Invalid probe was accepted")
    print("18 quadratic and27 nonlinear HVP/finite-difference comparisons passed.")
    print("Maximum finite-difference error:", max(errors))
    print("Maximum explicit chain-rule error:", largest_chain_error)
    print("Versions:", np.__version__, torch.__version__, "; CPU float64; no fits/files.")


if __name__ == '__main__':
    main()

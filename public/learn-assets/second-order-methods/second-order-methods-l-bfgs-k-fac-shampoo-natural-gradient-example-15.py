import torch

torch.set_default_dtype(torch.float64)
point = torch.linspace(-0.8, 1.2, 6, requires_grad=True)

def objective(value):
    curvature = torch.arange(1, value.numel()+1, dtype=value.dtype)
    return (0.5*curvature*value**2 + 0.05*value**4).sum() + 0.1*((value[1:]-value[:-1])**2).sum()

gradient = torch.autograd.grad(objective(point), point)[0].detach()

def hessian_times(vector):
    _, product = torch.autograd.functional.hvp(objective, point, vector)
    return product.detach()

def conjugate_gradient(apply, right_hand_side, tolerance=1e-10, budget=30):
    solution = torch.zeros_like(right_hand_side)
    residual = right_hand_side.clone()
    search = residual.clone()
    for iteration in range(budget):
        if torch.linalg.vector_norm(residual) <= tolerance:
            return solution, iteration
        product = apply(search)
        curvature = torch.dot(search, product)
        if curvature <= 0:
            raise ValueError("This solver requires positive definite curvature.")
        old_norm_squared = torch.dot(residual, residual)
        alpha = old_norm_squared / curvature
        solution += alpha*search
        residual -= alpha*product
        beta = torch.dot(residual, residual) / old_norm_squared
        search = residual + beta*search
    raise RuntimeError("Residual tolerance was not reached within the budget.")

direction, iterations = conjugate_gradient(hessian_times, -gradient)
print("CG iterations:", iterations)
print("direction:", [round(value, 6) for value in direction.tolist()])
print("relative solve residual below 1e-10:",
      (torch.linalg.vector_norm(hessian_times(direction)+gradient) / torch.linalg.vector_norm(gradient)).item() < 1e-10)
print("descent:", torch.dot(gradient, direction).item() < 0)
# A tiny independent check only: never build this matrix in the matrix-free solve above.
dense_hessian = torch.autograd.functional.hessian(objective, point)
print("six-variable dense oracle agrees:", torch.allclose(direction, torch.linalg.solve(dense_hessian, -gradient), atol=1e-10))

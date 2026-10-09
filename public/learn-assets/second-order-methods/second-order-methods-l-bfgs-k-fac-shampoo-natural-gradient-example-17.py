import torch

torch.set_default_dtype(torch.float64)
times = torch.linspace(0, 6, 21)
observations = 1.5*torch.exp(-0.4*times) + 0.2 + 0.01*torch.sin(3*times)
tolerance = 1e-6
maximum_gradient_evaluations = 1000

def loss_value(parameters):
    amplitude, rate = parameters[:2].exp()
    predictions = amplitude*torch.exp(-rate*times) + parameters[2]
    return ((predictions-observations)**2).mean()

for method in ["L-BFGS", "gradient descent"]:
    parameters = torch.zeros(3, requires_grad=True)
    gradient_evaluations = 0
    if method == "L-BFGS":
        optimizer = torch.optim.LBFGS(
            [parameters], lr=1, max_iter=300,
            max_eval=maximum_gradient_evaluations-1,
            history_size=10, line_search_fn="strong_wolfe",
            tolerance_grad=tolerance, tolerance_change=1e-14)

        def closure():
            global gradient_evaluations
            optimizer.zero_grad()
            loss = loss_value(parameters)
            loss.backward()
            gradient_evaluations += 1
            return loss

        optimizer.step(closure)
    else:
        # One declared rate, without searching a grid against this fixture.
        for _ in range(maximum_gradient_evaluations-1):
            loss = loss_value(parameters)
            gradient = torch.autograd.grad(loss, parameters)[0]
            gradient_evaluations += 1
            if gradient.abs().max().item() <= tolerance:
                break
            with torch.no_grad():
                parameters -= 0.2*gradient
    # Include the independent final objective/gradient evaluation in the count.
    final_loss = loss_value(parameters)
    final_gradient = torch.autograd.grad(final_loss, parameters)[0]
    gradient_evaluations += 1
    with torch.no_grad():
        fit = torch.cat((parameters[:2].exp(), parameters[2:]))
    print(method)
    print("fit:", [round(value, 6) for value in fit.tolist()])
    print("final MSE:", round(final_loss.item(), 8))
    print("objective/gradient evaluations:", gradient_evaluations)
    print("gradient infinity norm:", round(final_gradient.abs().max().item(), 8))
    print("gradient tolerance reached:", final_gradient.abs().max().item() <= tolerance)
    assert gradient_evaluations <= maximum_gradient_evaluations
    assert torch.isfinite(fit).all() and final_loss.item() < 0.0001

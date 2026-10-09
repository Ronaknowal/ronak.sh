import torch

torch.set_default_dtype(torch.float64)
times = torch.linspace(0, 4, 21)
# Deterministic small measurement perturbations, fixed for every closure call.
noise = 0.01 * torch.sin(3 * times)
observations = 2 * torch.exp(-0.7 * times) + 0.3 + noise
# Positive amplitude/rate are represented by their logarithms.
parameters = torch.tensor([0.0, 0.0, 0.0], requires_grad=True)
optimizer = torch.optim.LBFGS([parameters], lr=1, max_iter=80,
                            history_size=10, line_search_fn="strong_wolfe",
                            tolerance_grad=1e-10, tolerance_change=1e-14)
evaluations = 0

def loss_value():
    amplitude, rate = parameters[:2].exp()
    prediction = amplitude * torch.exp(-rate * times) + parameters[2]
    return ((prediction - observations)**2).mean()

def closure():
    global evaluations
    optimizer.zero_grad()
    loss = loss_value()
    loss.backward()
    evaluations += 1
    return loss

returned_loss = optimizer.step(closure)
with torch.no_grad():
    fitted = torch.cat((parameters[:2].exp(), parameters[2:]))
    final_loss = loss_value()
print("amplitude, rate, offset:", [round(value, 6) for value in fitted.tolist()])
print("returned initial loss:", round(returned_loss.item(), 6))
print("reevaluated final loss:", round(final_loss.item(), 8))
print("closure evaluated more than once:", evaluations > 1)
print("final mean squared error below 0.0001:", final_loss.item() < 0.0001)

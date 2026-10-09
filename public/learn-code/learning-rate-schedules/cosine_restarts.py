import torch

for horizon in (4, 3):
    weight = torch.nn.Parameter(torch.tensor(0.0, dtype=torch.float64))
    optimizer = torch.optim.SGD([weight], lr=.2)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=horizon, eta_min=.01)
    rates = []
    for _ in range(4):
        rates.append(optimizer.param_groups[0]["lr"])
        weight.grad = torch.ones_like(weight)
        optimizer.step()
        scheduler.step()
    print("T_max", horizon, "four used rates", [round(value, 6) for value in rates])

weight = torch.nn.Parameter(torch.tensor(0.0, dtype=torch.float64))
optimizer = torch.optim.SGD([weight], lr=.2)
scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=4, T_mult=1, eta_min=.01)
rates = []
for _ in range(8):
    rates.append(optimizer.param_groups[0]["lr"])
    weight.grad = torch.ones_like(weight)
    optimizer.step()
    scheduler.step()
print("restart used rates", [round(value, 6) for value in rates])
print("weight retained through restarts", round(weight.item(), 6))
assert torch.isclose(weight.detach(), torch.tensor(-sum(rates), dtype=torch.float64))
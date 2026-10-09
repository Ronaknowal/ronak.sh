import torch

parameter = torch.nn.Parameter(torch.tensor(3.0, dtype=torch.float64))
optimizer = torch.optim.SGD([parameter], lr=.02, momentum=.9)
scheduler = torch.optim.lr_scheduler.OneCycleLR(
    optimizer, max_lr=.2, total_steps=12, pct_start=.25,
    div_factor=10, final_div_factor=100,
    base_momentum=.85, max_momentum=.95, three_phase=False)
used = []
for update in range(12):
    optimizer.zero_grad()
    loss = .5 * (parameter - 2)**2
    loss.backward()
    rate = optimizer.param_groups[0]["lr"]
    momentum = optimizer.param_groups[0]["momentum"]
    used.append((rate, momentum))
    optimizer.step()
    scheduler.step()  # prepares a later value; it is not used by the finished update
    print(update, f"used={rate:.6f}", f"momentum={momentum:.6f}")
assert abs(used[0][0] - .02) < 1e-12
assert abs(used[2][0] - .2) < 1e-12
assert abs(used[-1][0] - .0002) < 1e-12
print("prepared after budget", f'{optimizer.param_groups[0]["lr"]:.6f}')

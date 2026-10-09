import math
import torch

targets = [1, 3, 2, 4, 0, 2, 3, 1, 4, 2, 1, 3]
accumulation, total_updates = 2, 5  # six attempts; deliberately reject attempt two
rates = [.01 + .19 * (1 + math.cos(math.pi * u / 4)) / 2 for u in range(5)]
weight = torch.nn.Parameter(torch.tensor(0.0, dtype=torch.float64))
optimizer = torch.optim.SGD([weight], lr=rates[0])
scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lambda u: rates[min(u, 4)] / rates[0])
scaler = torch.amp.GradScaler("cpu", init_scale=8.0)
clock = {"committed": 0}
def record_step(optimizer, args, kwargs):
    clock["committed"] += 1
hook = optimizer.register_step_post_hook(record_step)
optimizer.zero_grad()
for microbatch, target in enumerate(targets):
    # Equal-sized microbatches: average their means over this effective batch.
    loss = .5 * (weight - target)**2 / accumulation
    scaler.scale(loss).backward()
    if (microbatch + 1) % accumulation:
        continue
    attempt = (microbatch + 1) // accumulation
    if attempt == 2:
        weight.grad.fill_(float("inf"))  # explicit controlled skipped-update fixture
    before = clock["committed"]
    rate = optimizer.param_groups[0]["lr"]
    scaler.step(optimizer)
    scaler.update()
    committed = clock["committed"] > before
    if committed and clock["committed"] < total_updates:
        scheduler.step()
    optimizer.zero_grad()
    print("attempt", attempt, "committed", committed,
          "used", f"{rate:.6f}" if committed else "none",
          "updates", clock["committed"], "weight", round(weight.item(), 6))
hook.remove()
assert clock["committed"] == total_updates

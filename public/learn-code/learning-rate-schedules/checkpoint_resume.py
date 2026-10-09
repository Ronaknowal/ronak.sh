import copy
import io
import torch

torch.set_num_threads(1)
features = torch.tensor([[1., 0.], [1., 1.], [1., 2.], [1., 3.]], dtype=torch.float64)
targets = torch.tensor([1., 2., 2., 4.], dtype=torch.float64)
def create():
    weight = torch.nn.Parameter(torch.zeros(2, dtype=torch.float64))
    optimizer = torch.optim.SGD([weight], lr=.08, momentum=.8)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=11, eta_min=.002)
    generator = torch.Generator().manual_seed(17)
    return weight, optimizer, scheduler, generator

def advance(state, count):
    weight, optimizer, scheduler, generator = state
    rows = []
    for _ in range(count):
        sample = int(torch.randint(4, (1,), generator=generator))
        optimizer.zero_grad()
        loss = .5 * (features[sample] @ weight - targets[sample])**2
        loss.backward()
        rate = optimizer.param_groups[0]["lr"]
        optimizer.step()
        scheduler.step()
        rows.append((sample, rate, weight.detach().clone()))
    return rows

original = create()
advance(original, 5)
weight, optimizer, scheduler, generator = original
buffer = io.BytesIO()
torch.save({"weight": weight.detach(), "optimizer": optimizer.state_dict(),
            "scheduler": scheduler.state_dict(), "generator": generator.get_state(),
            "completed": 5, "budget": 12}, buffer)
buffer.seek(0)
saved = torch.load(buffer, weights_only=True)
expected = advance(original, 7)

restored = create()  # initialize scheduler before loading optimizer rates
new_weight, new_optimizer, new_scheduler, new_generator = restored
with torch.no_grad():
    new_weight.copy_(saved["weight"])
new_scheduler.load_state_dict(saved["scheduler"])
new_optimizer.load_state_dict(saved["optimizer"])
new_generator.set_state(saved["generator"])
actual = advance(restored, saved["budget"] - saved["completed"])
assert all(a[:2] == b[:2] and torch.equal(a[2], b[2]) for a, b in zip(expected, actual))
print("identical remaining updates", len(actual))
print("final coefficients", [round(value, 6) for value in new_weight.tolist()])

incomplete = create()
with torch.no_grad():
    incomplete[0].copy_(saved["weight"])
incomplete[3].set_state(saved["generator"])
wrong = advance(incomplete, 7)
print("weights-only resume matches", torch.equal(wrong[-1][2], expected[-1][2]))

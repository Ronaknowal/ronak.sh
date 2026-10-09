import torch
import torch.nn.functional as F

scores = torch.tensor([[2.0, 0.0, -2.0], [1000.0, 0.0, -1000.0]], dtype=torch.float64)
labels = torch.tensor([0, 2], dtype=torch.long)
losses = F.cross_entropy(scores, labels, reduction="none")
assert torch.allclose(losses, F.cross_entropy(scores + 1000, labels, reduction="none"))
soft_targets = torch.tensor([[0.7, 0.2, 0.1], [0.0, 0.0, 1.0]], dtype=torch.float64)
assert bool(torch.all(soft_targets >= 0))
assert torch.allclose(soft_targets.sum(dim=1), torch.ones(2, dtype=torch.float64))
soft_losses = F.cross_entropy(scores, soft_targets, reduction="none")
print("Class-index losses:", [round(x, 6) for x in losses.tolist()])
print("Soft-target losses:", [round(x, 6) for x in soft_losses.tolist()])
print("Mean class-index loss:", round(losses.mean().item(), 6))
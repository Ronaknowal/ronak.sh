import torch

weight = torch.nn.Parameter(torch.tensor(0.0))
optimizer = torch.optim.SGD([weight], lr=.2)
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode="min", factor=.5, patience=1,
    threshold=.02, threshold_mode="abs", cooldown=1,
    min_lr=.025, eps=1e-8)
losses = [1.0, .9, .9, .89, .88, .88, .9, .87, .87, .87, .87, .87]
for observation, loss in enumerate(losses):
    # These are invented validation observations, not results of training this weight.
    scheduler.step(loss)
    print(observation, f"metric={loss:.2f}", f"best={scheduler.best:.2f}",
          f"bad={scheduler.num_bad_epochs}", f"cooldown={scheduler.cooldown_counter}",
          f'next_lr={optimizer.param_groups[0]["lr"]:.3f}')
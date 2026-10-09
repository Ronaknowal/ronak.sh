"""Compare a readable phase interpolation with actual PyTorch 2.14 OneCycleLR.

Inputs: a built-in integer budget T in 2..10000, finite pct_start in (0, 1),
positive peak/divisors, and a boolean three_phase choice. Require nonempty
phase denominators: pct_start*T > 1 and, for three phases, 2*pct_start*T < T+1.
The demonstration checks T in {12,24,48}, pct_start in {.25,.30,.50}.
CPU float64 SGD uses the constant gradient 1 and foreach/fused=False.
Output: used rate/momentum/weight rows, unused prepared final state, and exact
paired interpolation checks. This is a scheduler/clock fixture, not training.
Cost: O(T) work and O(T) retained trace; one scalar optimizer state.
"""
from math import cos, isfinite, pi
import torch


def phase_schedule(total_steps, pct_start=.25, peak=.2, three_phase=False,
                   div_factor=10., final_div_factor=100., momentum_low=.85,
                   momentum_high=.95):
    """Return T used states; reject zero or reversed phase widths explicitly."""
    if type(total_steps) is not int or not 2 <= total_steps <= 10000:
        raise ValueError('total_steps must be a built-in integer in 2..10000')
    if type(three_phase) is not bool:
        raise ValueError('three_phase must be boolean')
    values = (pct_start, peak, div_factor, final_div_factor, momentum_low, momentum_high)
    if any(isinstance(v, bool) or not isinstance(v, (int, float)) or not isfinite(v) for v in values):
        raise ValueError('phase parameters must be finite real numbers')
    if not 0 < pct_start < 1 or min(peak, div_factor, final_div_factor) <= 0:
        raise ValueError('pct_start must be in (0,1); peak and divisors must be positive')
    if not 0 <= momentum_low <= momentum_high < 1:
        raise ValueError('momentum bounds must satisfy 0 <= low <= high < 1')
    first_end = pct_start * total_steps - 1
    if first_end <= 0 or (three_phase and 2*pct_start*total_steps >= total_steps + 1):
        raise ValueError('phase widths must be strictly positive')
    initial = peak/div_factor
    minimum = initial/final_div_factor
    if not isfinite(initial) or not isfinite(minimum) or minimum <= 0:
        raise ValueError('derived initial/minimum rates must remain finite and positive')
    if three_phase:
        phases = [(first_end, initial, peak, momentum_high, momentum_low),
                  (2*pct_start*total_steps-2, peak, initial, momentum_low, momentum_high),
                  (total_steps-1, initial, minimum, momentum_high, momentum_high)]
    else:
        phases = [(first_end, initial, peak, momentum_high, momentum_low),
                  (total_steps-1, peak, minimum, momentum_low, momentum_high)]
    states = []
    for update in range(total_steps):
        start = 0.
        for end, rate_start, rate_end, beta_start, beta_end in phases:
            if update <= end:
                progress = (update-start)/(end-start)
                blend = .5*(1+cos(pi*progress))
                states.append((rate_end+(rate_start-rate_end)*blend,
                               beta_end+(beta_start-beta_end)*blend))
                break
            start = end
        else:
            raise AssertionError('the finite used-state budget was not covered')
    return states


def native_trace(total_steps, pct_start, three_phase):
    """Run actual updates; record lr and beta BEFORE optimizer.step()."""
    phase_schedule(total_steps, pct_start, three_phase=three_phase)
    parameter = torch.nn.Parameter(torch.tensor([0.], dtype=torch.float64))
    optimizer = torch.optim.SGD([parameter], lr=.2, momentum=.9,
                                foreach=False, fused=False)
    scheduler = torch.optim.lr_scheduler.OneCycleLR(
        optimizer, max_lr=.2, total_steps=total_steps, pct_start=float(pct_start),
        div_factor=10., final_div_factor=100., base_momentum=.85,
        max_momentum=.95, cycle_momentum=True, three_phase=three_phase)
    rows = []
    for update in range(total_steps):
        rate = optimizer.param_groups[0]['lr']
        beta = optimizer.param_groups[0]['momentum']
        before = parameter.item()
        parameter.grad = torch.ones_like(parameter)
        optimizer.step()
        rows.append((update, rate, beta, before, parameter.item()))
        scheduler.step()
    prepared = (optimizer.param_groups[0]['lr'], optimizer.param_groups[0]['momentum'])
    return rows, prepared


def main():
    print('torch', torch.__version__)
    for three_phase in (False, True):
        rows, prepared = native_trace(12, .25, three_phase)
        print('phases', 3 if three_phase else 2)
        print('used rates', [round(row[1], 6) for row in rows])
        print('used momentum', [round(row[2], 6) for row in rows])
        print('last used weight', round(rows[-1][4], 6))
        print('unused prepared rate', round(prepared[0], 6))
    maximum_error = 0.
    for total in (12, 24, 48):
        for fraction in (.25, .30, .50):
            for three_phase in (False, True):
                expected = phase_schedule(total, fraction, three_phase=three_phase)
                actual, _ = native_trace(total, fraction, three_phase)
                for (rate, beta), row in zip(expected, actual, strict=True):
                    maximum_error = max(maximum_error, abs(rate-row[1]), abs(beta-row[2]))
    assert maximum_error < 1e-14
    print('18 paired configurations max error', f'{maximum_error:.3e}')
    nonaligned = phase_schedule(12, .30)
    print('nonaligned theoretical peak index', round(.30*12-1, 6))
    print('nonaligned largest sampled rate', round(max(rate for rate, _ in nonaligned), 6))


if __name__ == '__main__':
    main()

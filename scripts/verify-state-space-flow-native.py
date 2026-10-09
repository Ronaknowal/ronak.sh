"""New revision checks; no historical receipt, public data or training writes."""
from pathlib import Path
import copy
import hashlib
import json
import runpy
import time
import numpy as np
import torch
from scipy.linalg import expm

torch.set_num_threads(2)
torch.manual_seed(18)
root = Path(__file__).resolve().parents[1]
asset = root / 'public/learn-code/state-space-models-s4-mamba-mamba-2'
operators = runpy.run_path(str(asset / 'state-space-operators.py'))
structured = runpy.run_path(str(asset / 'state-space-structured.py'))
blocks = runpy.run_path(str(asset / 'state-space-blocks.py'))
dtype = torch.float64
checks = []
started = time.perf_counter()


def close(name, actual, expected, atol=2e-10, rtol=2e-9):
    torch.testing.assert_close(actual, expected, atol=atol, rtol=rtol)
    error = float((actual - expected).abs().max().detach()) if actual.numel() else 0.
    checks.append({'name': name, 'max_error': error})


def gradients(name, first, second, variables):
    probe = torch.linspace(.1, 1., first.numel(), dtype=first.real.dtype).reshape(first.shape)
    # A read coefficient has no path into final memory, and a W=1 cache is empty.
    # Materialize those mathematical zero derivatives rather than omitting them.
    left = torch.autograd.grad((first.real * probe).sum(), variables, retain_graph=True, allow_unused=True)
    right = torch.autograd.grad((second.real * probe).sum(), variables, retain_graph=True, allow_unused=True)
    for index, (a, b, variable) in enumerate(zip(left, right, variables)):
        a = torch.zeros_like(variable) if a is None else a
        b = torch.zeros_like(variable) if b is None else b
        close(f'{name}: derivative {index}', a, b)


def linear_cases():
    for A_values in ([[0., 0.], [0., 0.]], [[-.2, -2.], [2., -.2]], [[-1., .3], [0., -2.]]):
        A = torch.tensor(A_values, dtype=dtype, requires_grad=True)
        B = torch.tensor([[1.], [-.5]], dtype=dtype, requires_grad=True)
        C = torch.tensor([[.7, -.2]], dtype=dtype, requires_grad=True)
        D = torch.tensor([[.25]], dtype=dtype, requires_grad=True)
        dt = torch.tensor(.3, dtype=dtype, requires_grad=True)
        lifted = np.zeros((3, 3)); lifted[:2, :2] = A.detach(); lifted[:2, 2:] = B.detach()
        reference = torch.from_numpy(expm(.3 * lifted))
        Ad, Bd = operators['held_discretize'](A, B, dt)
        close('Exact held transition vs SciPy', Ad, reference[:2, :2])
        close('Exact held write vs SciPy', Bd, reference[:2, 2:])
        for length in (1, 7):
            u = torch.randn(2, length, 1, dtype=dtype, requires_grad=True)
            h0 = torch.randn(2, 2, dtype=dtype, requires_grad=True)
            recurrent, _, _ = operators['linear_recurrent'](Ad, Bd, C, D, u, h0)
            frequency = operators['fft_linear'](Ad, Bd, C, D, u, h0)
            close('Initial/direct complete recurrent vs FFT', frequency, recurrent)
            gradients('Exact complete convolution', frequency, recurrent, (A, B, C, D, dt, u, h0))
        Ab, Bb = operators['bilinear_discretize'](A, B, dt)
        identity = torch.eye(2, dtype=dtype)
        close('Bilinear transition solve', (identity - .5 * dt * A) @ Ab, identity + .5 * dt * A)
        close('Bilinear write solve', (identity - .5 * dt * A) @ Bb, dt * B)


def ssd_cases():
    for length in (1, 4, 7):
        decay = (.1 + .8 * torch.rand(2, length, 2, dtype=dtype)).requires_grad_()
        write = torch.randn(2, length, 2, 3, dtype=dtype, requires_grad=True)
        read = torch.randn_like(write, requires_grad=True)
        values = torch.randn(2, length, 2, 2, dtype=dtype, requires_grad=True)
        initial = torch.randn(2, 2, 3, 2, dtype=dtype, requires_grad=True)
        variables = (decay, write, read, values, initial)
        recurrent, state = operators['ssd_recurrent'](*variables)
        dense, dense_state = operators['ssd_dense'](*variables)
        close('SSD dense full output', dense, recurrent)
        close('SSD dense final state', dense_state, state)
        gradients('SSD dense output', dense, recurrent, variables)
        gradients('SSD dense final state', dense_state, state, variables)
        for chunk in (1, 2, 3, 8):
            output, final = operators['ssd_chunked'](decay, write, read, values, chunk, initial)
            close(f'SSD q{chunk} including final short tail', output, recurrent)
            close(f'SSD q{chunk} continuation state', final, state)
            gradients(f'SSD q{chunk} output', output, recurrent, variables)
            gradients(f'SSD q{chunk} continuation', final, state, variables)
        zero = decay.detach().clone(); zero[:, length // 2] = 0.; zero.requires_grad_()
        reference, final = operators['ssd_recurrent'](zero, write, read, values, initial)
        output, state = operators['ssd_chunked'](zero, write, read, values, 3, initial)
        close('Zero decay exact erasure/tail', output, reference)
        gradients('Zero decay derivatives', output, reference, (zero, write, read, values, initial))


def selective_cases():
    a = torch.rand(2, 4, 2, 3, dtype=dtype, requires_grad=True)
    b = torch.randn_like(a, requires_grad=True); c = torch.randn_like(a, requires_grad=True)
    u = torch.randn(2, 4, 2, dtype=dtype, requires_grad=True)
    h0 = torch.randn(2, 2, 3, dtype=dtype, requires_grad=True)
    valid = torch.tensor([[True, True, False, False], [True, True, True, True]])
    reset = torch.tensor([[False, True, True, False], [False, False, True, False]])
    output, state = operators['selective_recurrent'](a, b, c, u, h0, valid, reset)
    close('Invalid outputs are zero', output[0, 2:], torch.zeros_like(output[0, 2:]))
    expected_reset = b[0, 1] * u[0, 1, :, None]
    close('Valid reset writes after zeroing old state', state[0], expected_reset)
    credit = torch.autograd.grad(state[0].sum(), (h0, u), retain_graph=True)
    close('Reset severs incoming-state credit', credit[0][0], torch.zeros_like(h0[0]))
    close('Invalid values receive no credit', credit[1][0, 2:], torch.zeros_like(u[0, 2:]))


def structured_cases():
    A, p_real = structured['hippo_legs'](4)
    lam, U, p = structured['normal_basis'](A, p_real)
    B = torch.tensor([[1.], [.2], [-.3], [.8]], dtype=dtype).to(U.dtype)
    C = torch.tensor([[.7, -.2, .5, .1]], dtype=dtype).to(U.dtype)
    dt = torch.tensor(.17, dtype=dtype, requires_grad=True)
    lam = lam.detach().requires_grad_(); p = p.detach().requires_grad_(); q = p.detach().clone().requires_grad_()
    b = (U.mH @ B).detach().requires_grad_(); c = (C @ U).detach().requires_grad_()
    dense_A = torch.diag(lam) - p[:, None] * q.conj()[None, :]
    Ad, Bd = operators['bilinear_discretize'](dense_A, b, dt)
    h0 = torch.randn(2, 4, dtype=torch.complex128, requires_grad=True)
    inputs = torch.randn(2, 1, dtype=torch.complex128, requires_grad=True)
    step = structured['bilinear_step'](lam, p, q, b, dt, h0, inputs)
    dense_step = h0 @ Ad.mT + inputs @ Bd.mT
    close('DPLR structured advance/write versus dense solve', step, dense_step)
    gradients('DPLR structured advance/write', step, dense_step, (lam, p, q, b, dt, h0, inputs))
    close('Normal-basis retains rank correction', U @ dense_A @ U.mH, A.to(U.dtype))
    for length in (1, 3, 8):
        taps = structured['structured_kernel'](lam, p, q, b, c, dt, length, frequency_batch=3)
        reference = operators['finite_kernel'](Ad, Bd, c, length)
        close('DPLR finite C-tilde/odd-even Nyquist taps', taps, reference)
        gradients('DPLR finite frequency taps', taps, reference, (lam, p, q, b, c, dt))


def block_cases():
    for constructor in (blocks['ReferenceMamba1'], blocks['ReferenceMamba2']):
        for width in (1, 3):
            block = constructor(4, state_size=4, convolution_width=width).double()
            inputs = torch.randn(2, 7, 4, dtype=dtype, requires_grad=True)
            cache = tuple(torch.randn_like(part, requires_grad=True) for part in block.initial_cache(2, inputs))
            whole, full_cache = block(inputs, cache)
            outputs, streamed_cache = [], cache
            for token in inputs.unbind(1):
                output, streamed_cache = block.step(token, streamed_cache)
                outputs.append(output)
            streamed = torch.stack(outputs, dim=1)
            variables = (inputs, *cache, *block.parameters())
            close(f'{constructor.__name__} width{width} whole versus token', streamed, whole)
            gradients(f'{constructor.__name__} width{width} all input/cache/parameter gradients', streamed, whole, variables)
            for left, right in zip(full_cache, streamed_cache):
                if left.numel():
                    close('Full convolution/state continuation', left, right)
            first, chunk_cache = block(inputs[:, :3], cache)
            second, chunk_cache = block(inputs[:, 3:], chunk_cache)
            close('Full block 3+4 chunk continuation', torch.cat((first, second), dim=1), whole)
            gradients('Full block chunk all parameter gradients', torch.cat((first, second), dim=1), whole, variables)


def endpoint_cases():
    N, T, H, R, K, P = 2, 5, 2, 2, 4, 3
    a = torch.rand(N, T, H, dtype=dtype, requires_grad=True)
    dt = torch.full_like(a, .2, requires_grad=True)
    mix = torch.full_like(a, .5, requires_grad=True)
    b = torch.randn(N, T, H, R, K, dtype=dtype, requires_grad=True)
    c = torch.randn_like(b, requires_grad=True)
    v = torch.randn(N, T, H, R, P, dtype=dtype, requires_grad=True)
    angle = torch.randn(N, T, H, K // 2, dtype=dtype, requires_grad=True)
    state = torch.randn(N, H, K, P, dtype=dtype, requires_grad=True)
    previous = torch.randn_like(state, requires_grad=True)
    angles0 = torch.zeros(N, H, K // 2, dtype=dtype)
    variables = (a, dt, mix, b, c, v, angle, state, previous)
    whole, final = operators['endpoint_recurrent'](*variables[:7], state, previous, angles0)
    first, cache = operators['endpoint_recurrent'](*(item[:, :2] for item in variables[:7]), state, previous, angles0)
    second, cache = operators['endpoint_recurrent'](*(item[:, 2:] for item in variables[:7]), *cache)
    chunked = torch.cat((first, second), dim=1)
    close('Endpoint rank2 full/chunk previous-write continuation', chunked, whole)
    gradients('Endpoint rank2 all coefficient/state/angle gradients', chunked, whole, variables)
    # Independent direct complex-pair rotation, not a call to rotate_pairs.
    raw = b.reshape(N, T, H, R, K // 2, 2)
    complex_b = torch.complex(raw[..., 0], raw[..., 1]) * torch.exp(1j * angle[:, :, :, None])
    expected = torch.stack((complex_b.real, complex_b.imag), dim=-1).flatten(-2)
    actual = operators['rotate_pairs'](b, angle[:, :, :, None])
    close('Real paired rotations versus complex multiplication', actual, expected)
    increments = torch.randn_like(angle, requires_grad=True)
    start_angle = torch.randn_like(angles0, requires_grad=True)
    accumulated = operators['accumulate_angles'](increments, start_angle)
    accumulated_first = operators['accumulate_angles'](increments[:, :2], start_angle)
    accumulated_second = operators['accumulate_angles'](increments[:, 2:], accumulated_first[:, -1])
    accumulated_chunks = torch.cat((accumulated_first, accumulated_second), dim=1)
    close('Running angles retain their prior chunk offset', accumulated_chunks, accumulated)
    gradients('Cumulative angle input/initial gradients', accumulated_chunks, accumulated, (increments, start_angle))
    # Independently evolve physical state with negative angle increments. G_t
    # is a positive accumulated rotation; G_t maps physical into running frame.
    rotate = operators['rotate_pairs']
    running_initial = rotate(state.transpose(-1, -2), start_angle[:, :, None]).transpose(-1, -2)
    running_previous = rotate(previous.transpose(-1, -2), start_angle[:, :, None]).transpose(-1, -2)
    running, running_cache = operators['endpoint_recurrent'](a, dt, mix, b, c, v, accumulated, running_initial, running_previous, start_angle)
    physical_state, physical_previous, physical_outputs = state, previous, []
    for t in range(T):
        turn = -increments[:, t, :, None]
        rotated_state = rotate(physical_state.transpose(-1, -2), turn).transpose(-1, -2)
        rotated_previous = rotate(physical_previous.transpose(-1, -2), turn).transpose(-1, -2)
        current_write = torch.einsum('nhrk,nhrp->nhkp', b[:, t], v[:, t])
        alpha, delta, mixture = a[:, t, :, None, None], dt[:, t, :, None, None], mix[:, t, :, None, None]
        physical_state = alpha * rotated_state + (1 - mixture) * delta * alpha * rotated_previous + mixture * delta * current_write
        physical_outputs.append(torch.einsum('nhrk,nhkp->nhrp', c[:, t], physical_state))
        physical_previous = current_write
    physical = torch.stack(physical_outputs, dim=1)
    close('Physical rotated recurrence versus running-frame coefficients', running, physical)
    gradients('Physical/running frame coefficient and angle gradients', running, physical, (a, dt, mix, b, c, v, increments, start_angle, state, previous))
    transformed_final = rotate(physical_state.transpose(-1, -2), accumulated[:, -1, :, None]).transpose(-1, -2)
    close('Physical final state maps into retained running frame', running_cache[0], transformed_final)


def padding_cases():
    """Independently apply the lesson's valid/reset SSD composition."""
    for all_padded in (False, True):
        N, T, H, K, P = 2, 7, 2, 3, 2
        a = torch.rand(N, T, H, dtype=dtype, requires_grad=True)
        b = torch.randn(N, T, H, K, dtype=dtype, requires_grad=True)
        c = torch.randn_like(b, requires_grad=True)
        v = torch.randn(N, T, H, P, dtype=dtype, requires_grad=True)
        initial = torch.randn(N, H, K, P, dtype=dtype, requires_grad=True)
        valid = torch.tensor([[1, 1, 1, 1, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1]], dtype=torch.bool)
        if all_padded:
            valid[0] = False
        reset = torch.zeros_like(valid); reset[0, 2] = True; reset[0, 5] = True; reset[1, 4] = True
        active = valid & reset
        effective_a = torch.where(valid[..., None], torch.where(active[..., None], 0., a), 1.)
        effective_b = torch.where(valid[..., None, None], b, 0.)
        effective_c = torch.where(valid[..., None, None], c, 0.)
        output, state = operators['ssd_chunked'](effective_a, effective_b, effective_c, v, 3, initial)
        independent_state, rows = initial, []
        for t in range(T):
            incoming = torch.where(active[:, t, None, None, None], 0., independent_state)
            next_state = a[:, t, :, None, None] * incoming + torch.einsum('nhk,nhp->nhkp', b[:, t], v[:, t])
            independent_state = torch.where(valid[:, t, None, None, None], next_state, independent_state)
            read = torch.einsum('nhk,nhkp->nhp', c[:, t], independent_state)
            rows.append(torch.where(valid[:, t, None, None], read, 0.))
        reference = torch.stack(rows, dim=1)
        variables = (a, b, c, v, initial)
        close(f'Independent valid/reset SSD outputs; all padded={all_padded}', output, reference)
        close(f'Independent valid/reset SSD cache; all padded={all_padded}', state, independent_state)
        gradients(f'Valid/reset SSD output gradients; all padded={all_padded}', output, reference, variables)
        gradients(f'Valid/reset SSD cache gradients; all padded={all_padded}', state, independent_state, variables)


failure = None
try:
    linear_cases(); ssd_cases(); selective_cases(); structured_cases(); block_cases(); endpoint_cases(); padding_cases()
except Exception as error:
    import traceback
    failure = traceback.format_exc()
finally:
    sources = [asset / name for name in ('state-space-operators.py', 'state-space-structured.py', 'state-space-blocks.py', 'state-space-library-extensions.py')]
    sources.append(Path(__file__).resolve())
    receipt = {'checkedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'passed': failure is None,
               'runtime': {'torch': torch.__version__, 'numpy': np.__version__, 'device': 'CPU', 'dtype': 'float64/complex128'},
               'scope': 'New explicit reference operators/blocks, no retraining or GPU/kernel execution',
               'elapsedSeconds': time.perf_counter() - started, 'checks': checks, 'failure': failure,
               'sourceHashes': {str(path.relative_to(root)).replace('\\', '/'): hashlib.sha256(path.read_bytes()).hexdigest() for path in sources}}
    target = root / 'docs/teaching/deep-learning-beginner/state-space-models-s4-mamba-mamba-2/reading-flow-native.json'
    target.write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'passed': failure is None, 'checks': len(checks), 'seconds': receipt['elapsedSeconds'], 'failure': failure}))
if failure:
    raise SystemExit(1)

"""Differentiable state-space operators with explicit continuation state.

Requires PyTorch. All calculations use ordinary tensor primitives: no SSM package,
hidden selective scan, quadratic global matrix in the chunked path, or training I/O.
Column-state, update-before-read convention. N=batch, T=time, H=heads, K=state
coordinates and P=value coordinates. Run this file for a small worked SSD trace.
"""
import torch


def held_discretize(A, B, interval):
    """Exact held-input coefficients; works when A is singular.

    A [...,K,K], B [...,K,C], interval scalar or common broadcast batch shape.
    The matrix exponential is a numerical primitive, not an SSM implementation.
    """
    if A.shape[-1] != A.shape[-2] or B.shape[-2] != A.shape[-1]:
        raise ValueError("A must be square and B must have the same state rows")
    batch = torch.broadcast_shapes(A.shape[:-2], B.shape[:-2])
    K, C = B.shape[-2:]
    A, B = A.expand(*batch, K, K), B.expand(*batch, K, C)
    bottom = A.new_zeros(*batch, C, K + C)
    block = torch.cat((torch.cat((A, B), dim=-1), bottom), dim=-2)
    dt = torch.as_tensor(interval, dtype=A.dtype, device=A.device)
    lifted = torch.linalg.matrix_exp(block * dt[..., None, None])
    return lifted[..., :K, :K], lifted[..., :K, K:]


def bilinear_discretize(A, B, interval):
    """Trapezoidal discretization using solves rather than an explicit inverse."""
    dt = torch.as_tensor(interval, dtype=A.dtype, device=A.device)
    identity = torch.eye(A.shape[-1], dtype=A.dtype, device=A.device)
    half = .5 * dt[..., None, None] * A
    return torch.linalg.solve(identity - half, identity + half), torch.linalg.solve(
        identity - half, dt[..., None, None] * B)


def linear_recurrent(transition, injection, read, direct, inputs, initial=None):
    """Shared or batched coefficients; inputs [N,T,C], output [N,T,J].

    Return output, final state and all intermediate states. Nonzero initial memory
    and direct input are separate contributions; direct input is counted once.
    """
    if inputs.ndim != 3 or inputs.shape[1] < 1:
        raise ValueError("inputs must have shape [N,T,C] with T >= 1")
    N, T, _ = inputs.shape
    state = inputs.new_zeros(N, transition.shape[-1]) if initial is None else initial
    outputs, states = [], []
    for t in range(T):
        state = (transition @ state.unsqueeze(-1)).squeeze(-1) + (
            injection @ inputs[:, t].unsqueeze(-1)).squeeze(-1)
        outputs.append((read @ state.unsqueeze(-1)).squeeze(-1) + (
            direct @ inputs[:, t].unsqueeze(-1)).squeeze(-1))
        states.append(state)
    return torch.stack(outputs, dim=1), state, torch.stack(states, dim=1)


def finite_kernel(transition, injection, read, length):
    """K[lag] = C A-bar**lag B-bar; length is an integer, never a transpose."""
    if not isinstance(length, int) or length < 1:
        raise ValueError("length must be a positive integer")
    state, taps = injection, []
    for _ in range(length):
        taps.append(read @ state)
        state = transition @ state
    return torch.stack(taps, dim=0)


def fft_linear(transition, injection, read, direct, inputs, initial=None):
    """Real MIMO linear convolution, plus initial response and direct input.

    Shared coefficients only. FFT size >= 2T-1 prevents circular wraparound.
    Initial propagation costs O(T K²); it is not part of the zero-state kernel.
    """
    if transition.ndim != 2 or inputs.is_complex():
        raise ValueError("This real-FFT route takes shared real coefficients")
    N, T, _ = inputs.shape
    taps = finite_kernel(transition, injection, read, T)
    size = 1 << (2 * T - 2).bit_length()
    spectrum = torch.fft.rfft(inputs, n=size, dim=1)
    kernel_spectrum = torch.fft.rfft(taps, n=size, dim=0)
    output_spectrum = torch.einsum('nfh,fjh->nfj', spectrum, kernel_spectrum)
    output = torch.fft.irfft(output_spectrum, n=size, dim=1)[:, :T]
    state = inputs.new_zeros(N, transition.shape[-1]) if initial is None else initial
    initial_outputs = []
    for _ in range(T):
        state = (transition @ state.unsqueeze(-1)).squeeze(-1)
        initial_outputs.append((read @ state.unsqueeze(-1)).squeeze(-1))
    return output + torch.stack(initial_outputs, dim=1) + inputs @ direct.mT


def selective_recurrent(decay, write, read, inputs, initial=None, valid=None, reset=None):
    """Diagonal content-dependent recurrence with explicit coefficient tensors.

    decay/write/read [N,T,H,K], inputs [N,T,H], initial [N,H,K]. The caller
    constructs exp(Delta*A), Delta*B (or the exact integral) deliberately.
    At a valid reset, incoming state is zeroed BEFORE the current write.
    Invalid positions hold state and return zero, even if reset is requested.
    This function does not add a direct path or an output gate.
    """
    if decay.shape != write.shape or decay.shape != read.shape or decay.ndim != 4:
        raise ValueError("decay, write and read must share [N,T,H,K]")
    N, T, H, K = decay.shape
    if T < 1 or inputs.shape != (N, T, H):
        raise ValueError("inputs must match [N,T,H], with nonempty time")
    for name, mask in [('valid', valid), ('reset', reset)]:
        if mask is not None and (mask.shape != (N, T) or mask.dtype != torch.bool):
            raise ValueError(f"{name} must be a boolean [N,T] mask")
    state = inputs.new_zeros(N, H, K) if initial is None else initial
    if state.shape != (N, H, K):
        raise ValueError("initial state must match [N,H,K]")
    outputs = []
    for t in range(T):
        incoming = state if reset is None else torch.where(
            reset[:, t, None, None], torch.zeros_like(state), state)
        candidate = decay[:, t] * incoming + write[:, t] * inputs[:, t, :, None]
        state = candidate if valid is None else torch.where(valid[:, t, None, None], candidate, state)
        output = (read[:, t] * state).sum(-1)
        outputs.append(output if valid is None else torch.where(valid[:, t, None], output, torch.zeros_like(output)))
    return torch.stack(outputs, dim=1), state


def _ssd_contract(decay, write, read, values, initial):
    if decay.ndim != 3 or write.ndim != 4 or read.shape != write.shape or values.ndim != 4:
        raise ValueError("Expected decay [N,T,H], write/read [N,T,H,K], values [N,T,H,P]")
    N, T, H = decay.shape
    if T < 1 or write.shape[:3] != (N, T, H) or values.shape[:3] != (N, T, H):
        raise ValueError("Batch, time and heads must agree; time cannot be empty")
    if not torch.isfinite(decay).all() or (decay < 0).any() or (decay > 1).any():
        raise ValueError("This stable teaching contract requires finite decay in [0,1]")
    state = values.new_zeros(N, H, write.shape[-1], values.shape[-1]) if initial is None else initial
    if state.shape != (N, H, write.shape[-1], values.shape[-1]):
        raise ValueError("initial must have shape [N,H,K,P]")
    return state


def ssd_recurrent(decay, write, read, values, initial=None):
    """O(T K P) state work per head; no time-by-time influence allocation."""
    state = _ssd_contract(decay, write, read, values, initial)
    outputs = []
    for t in range(decay.shape[1]):
        state = decay[:, t, :, None, None] * state + write[:, t, :, :, None] * values[:, t, :, None, :]
        outputs.append(torch.einsum('nhk,nhkp->nhp', read[:, t], state))
    return torch.stack(outputs, dim=1), state


def _decay_triangle(decay):
    """[N,T,H] -> [N,H,T,T], L[i,j]=prod(a[j+1:i+1]) for j<=i.

    Reverse cumulative products avoid division by a cumulative product. Zero
    decay is legal and its derivatives stay defined. Used ONLY within chunks
    in the recommended route; the dense reference deliberately uses full T.
    """
    length = decay.shape[1]
    rows = []
    for i in range(length):
        preceding = decay[:, 1:i + 1].flip(1).cumprod(1).flip(1)
        row = torch.cat((preceding, torch.ones_like(decay[:, :1]), torch.zeros_like(decay[:, :length - i - 1])), dim=1)
        rows.append(row.transpose(1, 2))
    return torch.stack(rows, dim=-2)


def ssd_dense(decay, write, read, values, initial=None):
    """Independent signed influence contraction; O(T²) reference memory."""
    state = _ssd_contract(decay, write, read, values, initial)
    influence = torch.einsum('nihk,njhk->nhij', read, write) * _decay_triangle(decay)
    output = torch.einsum('nhij,njhp->nihp', influence, values)
    prefix = decay.cumprod(dim=1)
    output = output + prefix[..., None] * torch.einsum('nthk,nhkp->nthp', read, state)
    tail_weights = torch.cat((decay[:, 1:].flip(1).cumprod(1).flip(1), torch.ones_like(decay[:, :1])), dim=1)
    final = prefix[:, -1, :, None, None] * state + torch.einsum('nthk,nthp,nth->nhkp', write, values, tail_weights)
    return output, final


def ssd_chunked(decay, write, read, values, chunk_size, initial=None):
    """Four stages, bounded local triangles, serial chunk-boundary recurrence.

    Arbitrary final tail length; zero decays; nonzero initial/final state.
    Local memory O(q²+qK+qP), state O(KP) per head, excluding returned outputs.
    This reference is not the fused GPU algorithm or a fastest-kernel claim.
    """
    carry = _ssd_contract(decay, write, read, values, initial)
    if not isinstance(chunk_size, int) or chunk_size < 1:
        raise ValueError("chunk_size must be a positive integer")
    outputs = []
    for start in range(0, decay.shape[1], chunk_size):
        stop = min(start + chunk_size, decay.shape[1])
        a, b, c, v = (tensor[:, start:stop] for tensor in (decay, write, read, values))
        # 1. Writes born inside this chunk contribute to its local outputs.
        influence = torch.einsum('nihk,njhk->nhij', c, b) * _decay_triangle(a)
        local = torch.einsum('nhij,njhp->nihp', influence, v)
        # 2. Each local write is retained to the final position of this chunk.
        end_weights = torch.cat((a[:, 1:].flip(1).cumprod(1).flip(1), torch.ones_like(a[:, :1])), dim=1)
        own_final = torch.einsum('nthk,nthp,nth->nhkp', b, v, end_weights)
        # 3 and 4. Read incoming carry at each position, then pass final carry.
        prefix = a.cumprod(1)
        incoming = prefix[..., None] * torch.einsum('nthk,nhkp->nthp', c, carry)
        outputs.append(local + incoming)
        carry = prefix[:, -1, :, None, None] * carry + own_final
    return torch.cat(outputs, dim=1), carry


def rotate_pairs(vector, angles):
    """Real rotations of adjacent coordinates; angles [...,K/2]."""
    if vector.shape[-1] % 2 or angles.shape[-1] != vector.shape[-1] // 2:
        raise ValueError("Even coordinate count and one angle per pair required")
    pairs = vector.reshape(*vector.shape[:-1], -1, 2)
    cosine, sine = angles.cos(), angles.sin()
    return torch.stack((cosine * pairs[..., 0] - sine * pairs[..., 1],
                        sine * pairs[..., 0] + cosine * pairs[..., 1]), dim=-1).flatten(-2)


def accumulate_angles(increments, previous=None):
    """Increment angles [N,T,H,K/2] in the retained running frame.

    A continuation supplies the previous chunk's last angles [N,H,K/2].
    These are accumulated before endpoint_recurrent, whose angles are absolute.
    """
    if increments.ndim != 4 or increments.shape[1] < 1 or not torch.isfinite(increments).all():
        raise ValueError("Finite, nonempty [N,T,H,K/2] angle increments required")
    expected = (increments.shape[0], increments.shape[2], increments.shape[3])
    previous = increments.new_zeros(expected) if previous is None else previous
    if previous.shape != expected or not torch.isfinite(previous).all():
        raise ValueError("Previous cumulative angles must match [N,H,K/2]")
    return previous[:, None] + increments.cumsum(dim=1)


def endpoint_recurrent(decay, interval, mix, write, read, values, angles, initial=None,
                       previous_write=None, previous_angles=None):
    """Constructed Mamba-3 coefficient core, not its full architecture.

    decay/interval/mix [N,T,H]; write/read [N,T,H,R,K]; values [N,T,H,R,P];
    angles [N,T,H,K/2] are cumulative angles. State [N,H,K,P] is retained
    in the common running frame. Rotate B and C alike, use two endpoint writes.
    Return state, previous unscaled outer-product write and cumulative angles.
    Use the last angles in accumulate_angles when preparing the next chunk;
    already-absolute angles passed here need no second accumulation. This is
    a coefficient core, not a reproduction of the full maintained block cache.
    """
    N, T, H = decay.shape
    if write.shape != read.shape or write.ndim != 5 or values.shape[:4] != write.shape[:4]:
        raise ValueError("write/read [N,T,H,R,K] and values [N,T,H,R,P] must agree")
    K, P = write.shape[-1], values.shape[-1]
    if angles.shape != (N, T, H, K // 2) or K % 2 or T < 1:
        raise ValueError("A nonempty sequence and even K with matching cumulative angles are required")
    if interval.shape != decay.shape or mix.shape != decay.shape:
        raise ValueError("interval/mix must match decay")
    if not all(torch.isfinite(item).all() for item in (decay, interval, mix, write, read, values, angles)):
        raise ValueError("Every supplied coefficient and value must be finite")
    if (decay < 0).any() or (decay > 1).any() or (interval < 0).any() or (mix < 0).any() or (mix > 1).any():
        raise ValueError("Decay and mixture lie in [0,1]; intervals are nonnegative")
    state = values.new_zeros(N, H, K, P) if initial is None else initial
    previous = torch.zeros_like(state) if previous_write is None else previous_write
    last_angles = values.new_zeros(N, H, K // 2) if previous_angles is None else previous_angles
    if state.shape != (N, H, K, P) or previous.shape != state.shape or last_angles.shape != (N, H, K // 2):
        raise ValueError("Continuation cache shapes do not match the head/state/value dimensions")
    outputs = []
    for t in range(T):
        current_angles = angles[:, t]
        b = rotate_pairs(write[:, t], current_angles[:, :, None])
        c = rotate_pairs(read[:, t], current_angles[:, :, None])
        current = torch.einsum('nhrk,nhrp->nhkp', b, values[:, t])
        a, dt, lam = decay[:, t, :, None, None], interval[:, t, :, None, None], mix[:, t, :, None, None]
        state = a * state + (1 - lam) * dt * a * previous + lam * dt * current
        outputs.append(torch.einsum('nhrk,nhkp->nhrp', c, state))
        previous, last_angles = current, current_angles
    return torch.stack(outputs, dim=1), (state, previous, last_angles)


def main():
    dtype = torch.float64
    a = torch.tensor([.5, .5, .25, .8], dtype=dtype)[None, :, None]
    b = torch.tensor([[1, 0], [0, 1], [1, 1], [1, -1]], dtype=dtype)[None, :, None]
    c = torch.tensor([[1, 0], [1, 1], [0, 1], [1, 2]], dtype=dtype)[None, :, None]
    v = torch.tensor([[2, 1], [3, -1], [1, 2], [-2, 1]], dtype=dtype)[None, :, None]
    recurrent, state = ssd_recurrent(a, b, c, v)
    for size in (1, 2, 3, 8):
        chunked, final = ssd_chunked(a, b, c, v, size)
        torch.testing.assert_close(chunked, recurrent)
        torch.testing.assert_close(final, state)
    dense, final = ssd_dense(a, b, c, v)
    torch.testing.assert_close(dense, recurrent)
    torch.testing.assert_close(final, state)
    print({'outputs': recurrent[0, :, 0].tolist(), 'final_state': state[0, 0].tolist()})


if __name__ == '__main__':
    main()

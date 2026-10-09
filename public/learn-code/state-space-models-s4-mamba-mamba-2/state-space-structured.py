"""Structured S4 reference: normal HiPPO basis, rank-one solves, finite kernels.

PyTorch, complex128 recommended for the derivation checks. This file implements
the mechanism explicitly, without a state-space library. The Cauchy evaluation
is O(L K) per input/output channel, not the research fast multipole algorithm.
L is kernel length; .mT/.mH are transpose/Hermitian transpose.
"""
import math
import torch


def hippo_legs(state_size, dtype=torch.float64, device=None):
    """Time-invariant HiPPO-inspired matrix used for S4 initialization.

    This is not itself the growing-window LegS equation with its explicit 1/t.
    Its normal correction has symmetric part -I/2.
    """
    if not isinstance(state_size, int) or state_size < 1:
        raise ValueError("state_size must be a positive integer")
    index = torch.arange(state_size, dtype=dtype, device=device)
    amplitudes = torch.sqrt(2 * index + 1)
    lower = -torch.tril(amplitudes[:, None] * amplitudes[None, :], diagonal=-1)
    matrix = lower - torch.diag(index + 1)
    correction = torch.sqrt(index + .5)
    return matrix, correction


def normal_basis(matrix, correction):
    """Diagonalize the corrected NORMAL matrix, retain its rank-one correction.

    Return Lambda, U and U* p. Original dynamics in this frame are
    diag(Lambda) - transformed_p transformed_p*. B becomes U* B; C becomes C U.
    Initial state becomes U* h. Do not diagonalize the nonnormal original A.
    """
    complex_dtype = torch.complex128 if matrix.dtype == torch.float64 else torch.complex64
    normal = matrix.to(complex_dtype) + torch.outer(correction, correction).to(complex_dtype)
    identity = torch.eye(len(matrix), dtype=complex_dtype, device=matrix.device)
    hermitian = -1j * (normal + .5 * identity)
    torch.testing.assert_close(hermitian, hermitian.mH)
    frequency, basis = torch.linalg.eigh(hermitian)
    eigenvalues = -.5 + 1j * frequency
    return eigenvalues, basis, basis.mH @ correction.to(complex_dtype)


def rank_one_solve(diagonal, p, q, rhs, strength=1.):
    """Solve (diag(diagonal) + strength*p*q*) x = rhs in O(K).

    Shared coefficients [K], rhs [...,K]. Batched right-hand sides are row
    storage of column vectors. The denominator must be nonsingular; a solve
    cannot manufacture a solution when the mathematical operator is singular.
    No explicit inverse is formed. The conjugate on q is essential.
    """
    reciprocal = diagonal.reciprocal()
    scaled_p = reciprocal * p
    denominator = 1 + strength * (q.conj() * scaled_p).sum()
    base = rhs * reciprocal
    projection = (base * q.conj()).sum(dim=-1, keepdim=True)
    return base - strength * scaled_p * projection / denominator


def bilinear_step(eigenvalues, p, q, write, interval, state, inputs):
    """A = diag(Lambda)-p*q*, write [K,C], state [...,K], inputs [...,C].

    E=I-(Delta/2)A. A-bar=2E^-1-I and B-bar=Delta E^-1 B.
    Exact for this bilinear discretization; not an exact held-input integral.
    """
    half = interval / 2
    diagonal = 1 - half * eigenvalues
    old = rank_one_solve(diagonal, p, q, state, half)
    incoming = rank_one_solve(diagonal, p, q, inputs @ write.mT, half)
    return 2 * old - state + interval * incoming


def _advance_read(row, eigenvalues, p, q, interval):
    """Left action row*A-bar, in O(K) per row, without allocating A-bar."""
    half = interval / 2
    reciprocal = (1 - half * eigenvalues).reciprocal()
    denominator = 1 + half * (q.conj() * reciprocal * p).sum()
    left = row * reciprocal
    projection = (left * p).sum(dim=-1, keepdim=True)
    solved = left - half * projection * q.conj() * reciprocal / denominator
    return 2 * solved - row


def adjusted_read(read, eigenvalues, p, q, interval, length):
    """C-tilde=C(I-A-bar**L); **L is a power, not a transpose.

    Starting with a physical C requires O(L K) reference work per output row.
    Some S4 implementations instead learn C-tilde directly. Recovering C then
    requires solving the length-dependent system and can be ill-conditioned.
    """
    if not isinstance(length, int) or length < 1:
        raise ValueError("length must be a positive integer")
    advanced = read
    for _ in range(length):
        advanced = _advance_read(advanced, eigenvalues, p, q, interval)
    return read - advanced


def structured_kernel(eigenvalues, p, q, write, read, interval, length, frequency_batch=64):
    """Finite taps [L,J,C] from unit-circle samples, with exact Nyquist handling.

    z=exp(-2pi*i*k/L). For z!=-1, use the rank-one resolvent at
    g(z)=2(1-z)/(Delta(1+z)); G=2/(1+z) C-tilde(gI-A)^-1 B.
    At z=-1 the limit is Delta/2 C-tilde B. The initial response and D are
    deliberately absent from these strictly proper taps; add them separately.
    """
    if not isinstance(frequency_batch, int) or frequency_batch < 1:
        raise ValueError("frequency_batch must be a positive integer")
    if float(torch.as_tensor(interval).detach()) <= 0:
        raise ValueError("The resolvent route requires positive interval")
    modified = adjusted_read(read, eigenvalues, p, q, interval, length)
    real_dtype = eigenvalues.real.dtype
    frequencies = torch.arange(length, dtype=real_dtype, device=eigenvalues.device)
    roots = torch.exp(-2j * math.pi * frequencies / length)
    spectra = []
    for start in range(0, length, frequency_batch):
        batch = []
        for index in range(start, min(length, start + frequency_batch)):
            if length % 2 == 0 and index == length // 2:
                value = (interval / 2) * (modified @ write)
            else:
                z = roots[index]
                location = 2 * (1 - z) / (interval * (1 + z))
                solved = rank_one_solve(location - eigenvalues, p, q, write.mT).mT
                value = (2 / (1 + z)) * (modified @ solved)
            batch.append(value)
        spectra.append(torch.stack(batch))
    # Complex FFT keeps both members of each conjugate pair. The caller may
    # take .real only when the system has an actual real/conjugate construction.
    return torch.fft.ifft(torch.cat(spectra), dim=0)


def recurrent_kernel(eigenvalues, p, q, write, read, interval, length):
    """Independent structured recurrence of each input impulse."""
    K, channels = write.shape
    state = torch.zeros(channels, K, dtype=write.dtype, device=write.device)
    impulse = torch.eye(channels, dtype=write.dtype, device=write.device)
    zero = torch.zeros_like(impulse)
    taps = []
    for t in range(length):
        state = bilinear_step(eigenvalues, p, q, write, interval, state, impulse if t == 0 else zero)
        taps.append(read @ state.mT)
    return torch.stack(taps)


def main():
    A, p_real = hippo_legs(4)
    eigenvalues, basis, p = normal_basis(A, p_real)
    write = basis.mH @ torch.ones(4, 1, dtype=basis.dtype)
    read = torch.tensor([[1., .5, -.2, .1]], dtype=A.dtype).to(basis.dtype) @ basis
    for length in (1, 7, 8):
        spectrum = structured_kernel(eigenvalues, p, p, write, read, .1, length)
        recurrence = recurrent_kernel(eigenvalues, p, p, write, read, .1, length)
        torch.testing.assert_close(spectrum, recurrence, atol=1e-11, rtol=1e-10)
    print({'length_8_taps': spectrum[:, 0, 0].real.tolist(),
           'max_imaginary_residue': float(spectrum.imag.abs().max())})


if __name__ == '__main__':
    main()

"""Small frequency operators and version-pinned Transformers comparisons.

Requires numpy, torch, transformers==5.17.0. No model download or training.
Run: python rotary-frequency-rules.py
Frequency is radians per position; a rotary pair has two real coordinates.
"""
import math
import numpy as np
import torch
import transformers
from transformers import LlamaConfig
from transformers.modeling_rope_utils import ROPE_INIT_FUNCTIONS


def original_frequencies(width, base):
    if not isinstance(width, int) or width < 2 or width % 2 or not math.isfinite(base) or base <= 1:
        raise ValueError('A finite base >1 and positive even rotary width are required.')
    return base ** (-np.arange(width // 2, dtype=np.float64) * 2 / width)


def extension_rules(width=64, base=10000., original_length=4096, factor=8.):
    if width <= 2 or original_length < 2 or not math.isfinite(factor) or factor < 1:
        raise ValueError('Base scaling needs width>2, length>=2 and a finite factor>=1.')
    theta = original_frequencies(width, base)
    turns = original_length * theta / (2 * math.pi)
    paper_weight = np.clip((turns - 1) / 31, 0, 1)
    # The pinned library finds pair-index boundaries using the chosen turn counts.
    correction = lambda rotations: width * math.log(original_length / (rotations * 2 * math.pi)) / (2 * math.log(base))
    low = max(math.floor(correction(32)), 0)
    high = min(math.ceil(correction(1)), width - 1)
    library_weight = 1 - np.clip((np.arange(width // 2) - low) / max(high - low, .001), 0, 1)
    return {
        'original': theta,
        'linear': theta / factor,
        'base-scaled': original_frequencies(width, base * factor ** (width / (width - 2))),
        'paper-yarn': theta * (paper_weight + (1 - paper_weight) / factor),
        'yarn': theta * (library_weight + (1 - library_weight) / factor),
    }, 1 + .1 * math.log(factor)


def llama31_frequencies(width=64, base=500000., original_length=8192, factor=8., low=1., high=4.):
    if not (0 < low < high) or factor < 1 or original_length < 2:
        raise ValueError('Positive ordered band thresholds, factor>=1 and length>=2 required.')
    theta = original_frequencies(width, base)
    wavelength = 2 * math.pi / theta
    smooth = (original_length / wavelength - low) / (high - low)
    blended = (1 - smooth) * theta / factor + smooth * theta
    return np.where(wavelength < original_length / high, theta,
                    np.where(wavelength > original_length / low, theta / factor, blended))


def longrope_frequencies(width, base, factors):
    theta = original_frequencies(width, base)
    factors = np.asarray(factors, dtype=np.float64)
    if factors.shape != theta.shape or not np.isfinite(factors).all() or (factors <= 0).any():
        raise ValueError('One finite positive factor per rotary pair is required.')
    return theta / factors


def rotate_adjacent(values, positions, theta):
    values = np.asarray(values, dtype=np.float64)
    positions = np.asarray(positions, dtype=np.float64)
    theta = np.asarray(theta, dtype=np.float64)
    if values.ndim < 1 or values.shape[-1] != 2 * len(theta):
        raise ValueError('The final vector axis must contain exactly two coordinates per frequency.')
    if not all(np.isfinite(a).all() for a in (values, positions, theta)):
        raise ValueError('Finite vectors, coordinates and frequencies required.')
    angle = positions[..., None] * theta
    even, odd = values[..., 0::2], values[..., 1::2]
    return np.stack((even * np.cos(angle) - odd * np.sin(angle),
                     even * np.sin(angle) + odd * np.cos(angle)), -1).reshape(values.shape)


def ordinary_rotation(values, positions, theta):
    # Complex multiplication represents the very same two-coordinate rotation.
    # float64 storage is viewed as complex128; contiguous is needed by view_as_complex.
    paired = values.reshape(*values.shape[:-1], -1, 2).contiguous()
    complex_values = torch.view_as_complex(paired)
    angle = positions[..., None] * theta
    phase = torch.polar(torch.ones_like(angle), angle)
    return torch.view_as_real(complex_values * phase).reshape_as(values)


def native_frequencies(kind, width, base, original_length, factor, **extra):
    # This program pins an actual API contract, not a mutable main-branch example.
    parameters = dict(rope_type=kind, rope_theta=base, factor=factor, **extra)
    if kind != 'linear':
        parameters['original_max_position_embeddings'] = original_length
    # Llama's band validation requires an original context smaller than the target.
    target_length = int(original_length * factor)
    if kind == 'llama3' and target_length == original_length:
        target_length += 1
    config = LlamaConfig(hidden_size=width * 2, num_attention_heads=2,
                         max_position_embeddings=target_length,
                         rope_parameters=parameters)
    return ROPE_INIT_FUNCTIONS[kind](config, device=torch.device('cpu'),
                                    seq_len=int(original_length * factor))


def main():
    if transformers.__version__ != '5.17.0':
        raise RuntimeError('Use transformers==5.17.0 for these pinned utility comparisons.')
    torch.set_num_threads(1)
    reports = []
    for width, base, length, factor in [(8, 10000., 64, 4.),
                                        (64, 10000., 4096, 8.),
                                        (64, 500000., 8192, 1.),
                                        (128, 500000., 8192, 8.)]:
        rules, multiplier = extension_rules(width, base, length, factor)
        for kind in ('linear', 'yarn'):
            native, scale = native_frequencies(kind, width, base, length, factor)
            error = float(np.max(np.abs(native.double().numpy() - rules[kind])))
            # The official utility uses float32 powers; our reference uses float64.
            np.testing.assert_allclose(native.double().numpy(), rules[kind], rtol=2e-6, atol=1e-8)
            assert math.isclose(scale, multiplier if kind == 'yarn' else 1., rel_tol=1e-12)
            reports.append((width, kind, error))
        local = llama31_frequencies(width, base, length, factor)
        native, _ = native_frequencies('llama3', width, base, length, factor,
                                      low_freq_factor=1., high_freq_factor=4.)
        np.testing.assert_allclose(native.double().numpy(), local, rtol=2e-6, atol=1e-8)
        reports.append((width, 'llama3', float(np.max(np.abs(native.double().numpy() - local)))))
        long = np.linspace(1., factor, width // 2)
        native, _ = native_frequencies('longrope', width, base, length, factor,
                                      short_factor=np.ones(width // 2).tolist(), long_factor=long.tolist())
        expected = longrope_frequencies(width, base, long if factor > 1 else np.ones(width // 2))
        np.testing.assert_allclose(native.double().numpy(), expected, rtol=2e-6, atol=1e-8)
        reports.append((width, 'longrope', float(np.max(np.abs(native.double().numpy() - expected)))))
        positions = np.array([0., 3., 255.])
        vectors = np.arange(3 * width, dtype=np.float64).reshape(3, width) / 19 - 1
        tensor = torch.tensor(vectors, dtype=torch.float64, requires_grad=True)
        result = ordinary_rotation(tensor, torch.from_numpy(positions), torch.from_numpy(local))
        transparent = rotate_adjacent(vectors, positions, local)
        np.testing.assert_allclose(result.detach().numpy(), transparent, atol=1e-12, rtol=1e-12)
        # For a fixed angle, inverse rotation maps an output derivative to the input.
        probe = torch.linspace(-.5, .5, 3 * width, dtype=torch.float64).reshape(3, width)
        (result * probe).sum().backward()
        reference_grad = rotate_adjacent(probe.numpy(), -positions, local)
        np.testing.assert_allclose(tensor.grad.numpy(), reference_grad, atol=1e-12, rtol=1e-12)
    print('Transformers version:', transformers.__version__)
    print('16 frequency comparisons; max absolute float32/float64 difference:', max(r[2] for r in reports))
    print('Four complete rotation/output/input-gradient comparisons passed.')
    print('These checks exercise frequency operators; no model quality or full LongRoPE search is measured.')


if __name__ == '__main__':
    main()

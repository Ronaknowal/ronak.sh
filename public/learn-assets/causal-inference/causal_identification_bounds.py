"""Sharp binary-outcome bounds from observed masses and consistency alone.

Standard library; exact fractions. These are population identification bounds,
not sampling-confidence limits. Treating sample proportions as masses gives
plug-in endpoints and does not, by itself, quantify their sampling uncertainty.
"""
from fractions import Fraction as F


def bounds(joint):
    if set(joint) != {(0, 0), (0, 1), (1, 0), (1, 1)}:
        raise ValueError('Supply all four (treatment, observed outcome) cells.')
    masses = {cell: F(value) for cell, value in joint.items()}
    if any(p < 0 for p in masses.values()) or sum(masses.values()) != 1:
        raise ValueError('Cell masses must be nonnegative and sum to one.')
    treated = masses[1, 0] + masses[1, 1]
    untreated = 1 - treated
    known_y1 = masses[1, 1]
    known_y0 = masses[0, 1]
    return (known_y1 - known_y0 - treated,
            known_y1 + untreated - known_y0)


def witness(joint, endpoint):
    """Complete each observed unit's missing outcome at a chosen endpoint."""
    if endpoint not in ('lower', 'upper'):
        raise ValueError('Choose lower or upper.')
    bounds(joint)  # Validate before constructing a consistent joint model.
    total = F(0)
    for (x, observed), mass in joint.items():
        # Lower bound: missing Y(1)=0 and missing Y(0)=1. Reverse for upper.
        y1 = observed if x == 1 else int(endpoint == 'upper')
        y0 = observed if x == 0 else int(endpoint == 'lower')
        total += F(mass) * (y1 - y0)
    return total


def main():
    examples = {
        'positive observed law': {(0, 0): F(2, 5), (0, 1): F(1, 10),
                                 (1, 0): F(1, 10), (1, 1): F(2, 5)},
        '200-user empirical masses': {(0, 0): F(86, 200), (0, 1): F(14, 200),
                                     (1, 0): F(64, 200), (1, 1): F(36, 200)},
    }
    for label, joint in examples.items():
        lo, hi = bounds(joint)
        print(label, 'bounds', str(lo), str(hi), 'width', str(hi - lo))
        print('attained', str(witness(joint, 'lower')),
              str(witness(joint, 'upper')))


if __name__ == '__main__':
    main()

"""Explicit named-axis contraction with Python 3, standard library only.

einsum(expression, *operands) accepts rectangular nonempty nested lists and
finite int/float/complex scalars, at moderate magnitudes. Labels are a-z;
the -> output is required, may be empty, and cannot repeat a label.
Shared axes across operands may have equal lengths or length one. Repeated
axes within one operand must have equal lengths. No implicit output or
ellipsis is parsed. Results are fresh nested lists, or one scalar.

The core enumerates each output address and each omitted-label address.
For unique-label lengths d_l, it visits product(d_l) product terms. Each
term reads all operand addresses: O(product(d_l) * total operand order).
Input validation costs the number of stored input entries; output storage
is product(output lengths), plus O(number of labels + sum of omitted-label
lengths) indexing/iterator state: itertools.product stores its input pools.
This reference exposes the sum; it does not optimize multi-operand order.
The separate contraction_chain_scratch.py teaches pairwise elimination.
"""
from itertools import product
from math import isfinite


def finite(value):
    return (isinstance(value, (int, float, complex)) and not isinstance(value, bool)
            and isfinite(value.real) and isfinite(value.imag))


def shape(value):
    if not isinstance(value, list):
        if not finite(value):
            raise ValueError('use finite numeric entries')
        return ()
    if not value:
        raise ValueError('axes must be nonempty')
    child = shape(value[0])
    if any(shape(item) != child for item in value[1:]):
        raise ValueError('use rectangular nested lists')
    return (len(value),) + child


def read(value, coordinates):
    for coordinate in coordinates:
        value = value[coordinate]
    return value


def einsum(expression, *operands):
    """Compute an explicit contraction; see the module's bounded contract."""
    compact = ''.join(expression.split())
    if compact.count('->') != 1 or not operands:
        raise ValueError('supply operands and one explicit -> output')
    inputs, output = compact.split('->')
    inputs = inputs.split(',')
    if len(inputs) != len(operands) or any(c not in 'abcdefghijklmnopqrstuvwxyz'
                                         for term in inputs + [output] for c in term):
        raise ValueError('use one a-z label per axis, one term per operand')
    if len(set(output)) != len(output):
        raise ValueError('output labels cannot repeat')
    shapes = [shape(operand) for operand in operands]
    sizes = {}
    for labels, dimensions in zip(inputs, shapes):
        if len(labels) != len(dimensions):
            raise ValueError('each input label must name one axis')
        local = {}
        for label, length in zip(labels, dimensions):
            if label in local and local[label] != length:
                raise ValueError('repeated axes within an operand must match')
            local[label] = length
            old = sizes.get(label, 1)
            if old != length and old != 1 and length != 1:
                raise ValueError('shared axes must match or have length one')
            sizes[label] = max(old, length)
    if any(label not in sizes for label in output):
        raise ValueError('output labels must occur in an input')
    reduced = [label for label in sizes if label not in output]

    def cell(free_coordinates):
        address = dict(zip(output, free_coordinates))
        total = 0
        for dummy_coordinates in product(*(range(sizes[label]) for label in reduced)):
            address.update(zip(reduced, dummy_coordinates))
            term = 1
            for labels, dimensions, operand in zip(inputs, shapes, operands):
                coordinates = [0 if length == 1 else address[label]
                               for label, length in zip(labels, dimensions)]
                term *= read(operand, coordinates)
            total += term
        if not finite(total):
            raise ValueError('accumulation became nonfinite; inspect input scale')
        return total

    def build(prefix=()):
        if len(prefix) == len(output):
            return cell(prefix)
        label = output[len(prefix)]
        return [build(prefix + (i,)) for i in range(sizes[label])]

    return build()


if __name__ == '__main__':
    a = [[1, 2, 3], [-1, 0, 2]]
    b = [[2, 1], [0, 4], [1, -1]]
    print('non-square product', einsum('ik,kj->ij', a, b))
    print('diagonal', einsum('ii->i', [[1, 2], [3, 4]]))
    print('trace', einsum('ii->', [[1, 2], [3, 4]]))
    print('retained products', einsum('ik,kj->ikj', a, b)[1])
    print('column totals', einsum('ij->j', a))
    print('axis permutation', einsum('ij->ji', a))
    print('singleton pairing', einsum('bi,bi->b', [[2, 3]], [[1, 0], [0, 1]]))
    z = [1 + 2j, 3 - 1j]
    print('bilinear', einsum('i,i->', z, z))
    print('Hermitian', einsum('i,i->', [value.conjugate() for value in z], z))

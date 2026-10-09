"""Fixed graph propagation, local filters and explicitly scoped depth examples.

Rows are receivers; columns are sources. Node tables have shape (nodes, channels).
The main is a constructed arithmetic example, not training or a benchmark.
"""
from dataclasses import dataclass
from math import isfinite
import torch


@dataclass(frozen=True)
class SymmetricPropagation:
    """Coalesced undirected nonnegative adjacency and its closed-degree scaling."""
    indices: torch.Tensor
    weights: torch.Tensor
    degree: torch.Tensor
    size: int

    @classmethod
    def from_edges(cls, nodes, pairs, weights=None, *, loops=True,
                   dtype=torch.float64, device=None):
        """Each unordered non-loop pair is supplied once; loop weights are one.

        Zero-weight pairs are allowed. The spectral arguments additionally need
        connectedness and positive degree; construction does not assume them.
        """
        if nodes < 1:
            raise ValueError("At least one node is required.")
        seen = set()
        directed, values = [], []
        raw = [1.] * len(pairs) if weights is None else list(weights)
        if len(raw) != len(pairs):
            raise ValueError("One weight is required per unordered pair.")
        for (left, right), weight in zip(pairs, raw):
            key = tuple(sorted((left, right)))
            if not (0 <= left < nodes and 0 <= right < nodes) or left == right:
                raise ValueError("Supply valid distinct endpoints; loops are separate.")
            if key in seen or not isfinite(weight) or weight < 0:
                raise ValueError("Pairs must be unique and weights finite/nonnegative.")
            seen.add(key)
            directed.extend(((left, right), (right, left)))
            values.extend((weight, weight))
        if loops:
            directed.extend((node, node) for node in range(nodes))
            values.extend([1.] * nodes)
        indices = torch.tensor(directed, dtype=torch.long, device=device).reshape(-1, 2).T
        values = torch.tensor(values, dtype=dtype, device=device)
        adjacency = torch.sparse_coo_tensor(indices, values, (nodes, nodes),
                                            check_invariants=True).coalesce()
        degree = values.new_zeros(nodes).index_add(0, adjacency.indices()[0], adjacency.values())
        return cls(adjacency.indices(), adjacency.values(), degree, nodes)

    def coefficients(self):
        # Isolates get no messages, rather than an infinite inverse degree.
        inverse = torch.where(self.degree > 0, self.degree.clamp_min(
            torch.finfo(self.degree.dtype).tiny).rsqrt(), 0.)
        receiver, source = self.indices
        return self.weights * inverse[receiver] * inverse[source]

    def apply(self, features):
        """From-scratch gather, scale and receiving-node accumulation: O(E d)."""
        receiver, source = self.indices
        messages = features[source] * self.coefficients()[:, None]
        return features.new_zeros((self.size, features.shape[1])).index_add(0, receiver, messages)

    def library_apply(self, features):
        """The same operator through ordinary differentiable sparse PyTorch."""
        matrix = torch.sparse_coo_tensor(self.indices, self.coefficients(),
                                        (self.size, self.size), check_invariants=False).coalesce()
        return torch.sparse.mm(matrix, features)

    def mean_apply(self, features):
        receiver, source = self.indices
        total = features.new_zeros((self.size, features.shape[1])).index_add(
            0, receiver, features[source] * self.weights[:, None])
        safe_degree = torch.where(self.degree > 0, self.degree, 1.)
        return total / safe_degree[:, None]

    def dense(self):
        """Only for inspecting small examples; local filters use apply()."""
        return torch.sparse_coo_tensor(self.indices, self.coefficients(),
                                      (self.size, self.size), check_invariants=False).to_dense()


def propagation_states(operator, features, rounds):
    """Original state plus each synchronized new state, without in-place mutation."""
    states = [features]
    for _ in range(rounds):
        states.append(operator.apply(states[-1]))
    return states


def polynomial_filter(operator, features, coefficients):
    """c[0] I X + c[1] S X + ... using one sparse product per next power."""
    power = features
    result = torch.zeros_like(features)
    for index, coefficient in enumerate(coefficients):
        if index:
            power = operator.apply(power)
        result = result + coefficient * power
    return result


def chebyshev_filter(operator, features, coefficients, *, lambda_bound=2.):
    """Sum c[k] T_k(2 L / bound - I) X; L here is exactly I-S.

    For this symmetric nonnegative normalization, two is a valid upper bound.
    No graph eigenvectors are constructed on the execution path.
    """
    if lambda_bound <= 0:
        raise ValueError("A positive spectral bound is required.")
    if not len(coefficients):
        return torch.zeros_like(features)

    def scaled_laplacian(value):
        return (2. / lambda_bound) * (value - operator.apply(value)) - value

    previous = features
    result = coefficients[0] * previous
    if len(coefficients) == 1:
        return result
    current = scaled_laplacian(features)
    result = result + coefficients[1] * current
    for coefficient in coefficients[2:]:
        following = 2. * scaled_laplacian(current) - previous
        result = result + coefficient * following
        previous, current = current, following
    return result


def initial_residual_states(operator, features, rounds, alpha):
    """h[next]=(1-alpha) S h + alpha original; preserve the original reference."""
    if not 0 <= alpha <= 1:
        raise ValueError("alpha must lie in [0,1].")
    states = [features]
    for _ in range(rounds):
        states.append((1. - alpha) * operator.apply(states[-1]) + alpha * features)
    return states


def fixed_mode_table(operator):
    """Small diagnostic eigensystem: ordered gains with reproducible signs.

    Repeated eigenvalues have no unique individual eigenvectors. Interpret their
    subspace, not a claimed intrinsic ordering of its basis vectors.
    """
    gains, vectors = torch.linalg.eigh(operator.dense())
    order = torch.argsort(gains, descending=True)
    gains, vectors = gains[order], vectors[:, order]
    pivot = vectors.abs().argmax(dim=0)
    sign = torch.sign(vectors[pivot, torch.arange(operator.size, device=pivot.device)])
    return gains, vectors * sign[None, :]


def size_and_variation(operator, features, *, absolute_rank_tolerance=1e-12):
    """Raw energy, energy/total size and absolute-tolerance rank are different."""
    size = features.square().sum()
    variation = (features * (features - operator.apply(features))).sum()
    singular = torch.linalg.svdvals(features)
    return {
        "size_squared": size,
        "raw_variation": variation,
        "relative_variation": variation / size if float(size) > 0 else None,
        "singular_values": singular,
        "rank": int((singular > absolute_rank_tolerance).sum()),
        "absolute_rank_tolerance": absolute_rank_tolerance,
    }


def gram_whiten(features, *, ridge=0., tolerance=1e-12):
    """Equalize retained channel directions using the uncentered Gram matrix.

    Exact whitening needs full column rank. A positive ridge is a different
    regularized map; no right channel map can restore an erased node direction.
    For deficient rank, return a subspace projector through a pseudoinverse map.
    The returned map acts in the reduced-SVD span. At more channels than rows,
    ridge output matches the full regularizer on THESE features, but omitted
    null directions stay zero in the returned map; it is not that full
    regularizer for arbitrary new rows.
    """
    if ridge < 0:
        raise ValueError("ridge must be nonnegative.")
    # SVD avoids squaring the condition number in a computed Y.T @ Y.
    # Gram eigenvalues are the squared singular values; basis is their eigenbasis.
    _, singular, right = torch.linalg.svd(features, full_matrices=False)
    basis = right.T
    if ridge:
        inverse = torch.hypot(singular, singular.new_tensor(ridge**.5)).reciprocal()
    else:
        inverse = torch.zeros_like(singular)
        retained = singular > tolerance
        inverse[retained] = singular[retained].reciprocal()
    channel_map = (basis * inverse[None, :]) @ basis.T
    return features @ channel_map, channel_map


def sender_gated_sum(features, edge_index, gates):
    """A gate belongs to a sender's current state, before receiving-node sum."""
    source, receiver = edge_index
    return torch.zeros_like(features).index_add(
        0, receiver, features[source] * gates[source, None])


def routed_two_rounds(epsilon):
    """Constructed 0->1->2, 3->1: useful value two, distracting value seven."""
    initial = torch.tensor([[2.], [0.], [0.], [7.]], dtype=torch.float64)
    edges = torch.tensor([[0, 1, 3], [1, 2, 1]])
    first = sender_gated_sum(initial, edges, initial.new_tensor(
        [1. - epsilon, epsilon, epsilon, epsilon]))
    second = sender_gated_sum(first, edges, initial.new_tensor(
        [epsilon, 1. - epsilon, epsilon, epsilon]))
    return initial, first, second


def main():
    path = SymmetricPropagation.from_edges(3, [(0, 1), (1, 2)])
    features = torch.tensor([[1.], [2.], [4.]], dtype=torch.float64)
    states = propagation_states(path, features, 2)
    for round_index, state in enumerate(states):
        print(f"round {round_index}: {state[:, 0].tolist()}")
    print("local polynomial:", polynomial_filter(path, features, [1., .5, .25])[:, 0].tolist())
    gains, modes = fixed_mode_table(path)
    print("fixed gains:", gains.tolist())
    print("projected limit:", (modes[:, :1] @ (modes[:, :1].T @ features))[:, 0].tolist())
    print("routed target:", float(routed_two_rounds(.001)[2][2, 0]))


if __name__ == "__main__":
    main()

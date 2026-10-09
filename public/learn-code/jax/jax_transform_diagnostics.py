"""Inspect tracing, derivatives, and timing boundaries; CPU only is enough."""
from time import perf_counter
import json
import jax
import jax.numpy as jnp
import numpy as np


def run():
    traces = []  # Instrument tracing only; not a computation's mutable state.

    @jax.jit
    def energy(x):
        traces.append((tuple(x.shape), str(x.dtype)))
        return jnp.sum(x * x)

    x = jnp.arange(4, dtype=jnp.float32)
    energy(x).block_until_ready()
    first_count = len(traces)
    energy(x + 10).block_until_ready()
    same_shape_count = len(traces)
    energy(jnp.arange(5, dtype=jnp.float32)).block_until_ready()
    assert first_count == same_shape_count == 1 and len(traces) == 2

    # A scalar JVP gives directional change; no full Jacobian is materialized.
    value, tangent = jax.jvp(lambda z: z ** 3, (jnp.array(2.),), (jnp.array(0.5),))
    np.testing.assert_allclose([value, tangent], [8, 6])
    _, pullback = jax.vjp(lambda z: z ** 3, jnp.array(2.))
    np.testing.assert_allclose(pullback(jnp.array(0.5))[0], 6.)
    selected_sum = jax.jit(lambda z: jnp.sum(jnp.where(z > 1, z, 0)))(x)
    np.testing.assert_allclose(selected_sum, 5.)

    # Warm the exact signature, synchronize, then time device completion.
    energy(x).block_until_ready()
    samples = []
    for _ in range(10):
        start = perf_counter()
        energy(x).block_until_ready()
        samples.append(perf_counter() - start)
    report = {"jax": jax.__version__, "trace_signatures": traces,
              "value_change_retraced": False, "shape_change_retraced": True,
              "jvp_value": float(value), "jvp_tangent": float(tangent),
              "masked_sum": float(selected_sum), "warm_seconds": samples}
    print(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    run()

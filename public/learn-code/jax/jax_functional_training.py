"""Run: python jax_functional_training.py. CPU sufficient; no downloaded data."""
import json
import jax
import jax.numpy as jnp
import numpy as np
import optax


def predict(params, x):
    return params["w"] * x + params["b"]


def loss(params, x, y):
    return jnp.mean(jnp.square(predict(params, x) - y)) / 2


def manual_gradient(params, x, y):
    residual = predict(params, x) - y
    return {"w": jnp.mean(residual * x), "b": jnp.mean(residual)}


def momentum_step(params, velocity, gradient, rate, momentum):
    velocity = jax.tree.map(lambda v, g: momentum * v + g, velocity, gradient)
    params = jax.tree.map(lambda p, v: p - rate * v, params, velocity)
    return params, velocity


def run():
    x = jnp.array([-2., -1., 1., 2.], dtype=jnp.float32)
    y = jnp.array([-3., -1., 3., 5.], dtype=jnp.float32)
    params = {"w": jnp.array(0.), "b": jnp.array(0.)}
    initial_loss, gradient = jax.value_and_grad(loss)(params, x, y)
    for name, expected in manual_gradient(params, x, y).items():
        np.testing.assert_allclose(gradient[name], expected, atol=1e-6)
    per_item = jax.vmap(jax.grad(lambda p, a, b: (predict(p, a) - b) ** 2 / 2),
                        in_axes=(None, 0, 0))(params, x, y)
    for name in params:
        np.testing.assert_allclose(jnp.mean(per_item[name]), gradient[name], atol=1e-6)

    rate, momentum = 0.1, 0.8
    optimizer = optax.sgd(rate, momentum=momentum, nesterov=False)
    optimizer_state = optimizer.init(params)
    velocity = jax.tree.map(jnp.zeros_like, params)
    scratch = params

    @jax.jit
    def step(carry, _):
        current, state = carry
        value, grads = jax.value_and_grad(loss)(current, x, y)
        updates, state = optimizer.update(grads, state, current)
        return (optax.apply_updates(current, updates), state), value

    for _ in range(40):
        scratch, velocity = momentum_step(scratch, velocity,
                                         manual_gradient(scratch, x, y), rate, momentum)
    (trained, optimizer_state), losses = jax.lax.scan(step, (params, optimizer_state), None, length=40)
    for name in params:
        np.testing.assert_allclose(trained[name], scratch[name], atol=2e-6)

    key = jax.random.key(7)
    next_key, draw_key = jax.random.split(key)
    first = jax.random.normal(draw_key, (4,))
    repeated = jax.random.normal(draw_key, (4,))
    distinct = jax.random.normal(next_key, (4,))
    np.testing.assert_array_equal(first, repeated)
    assert not np.array_equal(first, distinct)
    updated = x.at[0].set(9.)
    assert float(x[0]) == -2. and float(updated[0]) == 9.
    report = {"jax": jax.__version__, "optax": optax.__version__,
              "devices": [str(device) for device in jax.devices()],
              "initial_loss": float(initial_loss),
              "gradient": {name: float(value) for name, value in gradient.items()},
              "after_40_updates": {name: float(value) for name, value in trained.items()},
              "final_loss": float(loss(trained, x, y)),
              "same_key_same_draw": True, "first_draw": np.asarray(first).tolist(),
              "scratch_optax_parity": True}
    print(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    run()

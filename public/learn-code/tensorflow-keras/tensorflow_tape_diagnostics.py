"""Small independent probes of tape, state, reduction, and graph boundaries."""
import json
import numpy as np
import tensorflow as tf
import keras


def run():
    w = tf.Variable(2.)
    with tf.GradientTape() as tape:
        connected = w * w
        detached = tf.constant(w.numpy() ** 2)
        objective = connected + detached
    np.testing.assert_allclose(tape.gradient(objective, w), 4.)
    x = tf.constant(3.)
    with tf.GradientTape() as tape:
        tape.watch(x)
        square = x * x
    np.testing.assert_allclose(tape.gradient(square, x), 6.)
    metric = keras.metrics.Mean()
    metric.update_state(2., sample_weight=2.)
    metric.update_state(8., sample_weight=1.)
    np.testing.assert_allclose(metric.result(), 4.)
    metric.reset_state()
    np.testing.assert_allclose(metric.result(), 0.)
    report = {"tensorflow": tf.__version__, "detached_branch_gradient": 4.,
              "watched_tensor_gradient": 6., "example_weighted_mean": 4.,
              "incorrect_batch_mean": 5., "metric_reset": 0.}
    print(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    run()

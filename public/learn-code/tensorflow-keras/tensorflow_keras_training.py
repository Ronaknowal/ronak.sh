"""Run locally: python tensorflow_keras_training.py. No data download."""
import os
os.environ.setdefault("KERAS_BACKEND", "tensorflow")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import json
import tempfile
from pathlib import Path
import numpy as np
import tensorflow as tf
import keras


@keras.saving.register_keras_serializable(package="Lesson")
class Affine(keras.layers.Layer):
    def build(self, input_shape):
        self.kernel = self.add_weight(name="kernel", shape=(input_shape[-1], 1),
                                      initializer="zeros")
        self.bias = self.add_weight(name="bias", shape=(1,), initializer="zeros")

    def call(self, inputs):
        return keras.ops.matmul(inputs, self.kernel) + self.bias


@keras.saving.register_keras_serializable(package="Lesson")
def half_mse(y_true, y_pred):
    return keras.ops.mean(keras.ops.square(y_pred - y_true), axis=-1) / 2


def build_model():
    inputs = keras.Input(shape=(1,))
    return keras.Model(inputs, Affine()(inputs))


def manual_step(w, b, x, y, rate):
    residual = x @ w + b - y
    return w - rate * (x.T @ residual / len(x)), b - rate * residual.mean(axis=0)


def run():
    keras.utils.set_random_seed(7)
    x = np.array([[-2.], [-1.], [1.], [2.]], dtype="float32")
    y = np.array([[-3.], [-1.], [3.], [5.]], dtype="float32")
    manual = (np.zeros((1, 1), "float32"), np.zeros(1, "float32"))
    custom = build_model()
    optimizer = keras.optimizers.SGD(learning_rate=0.1)
    optimizer.build(custom.trainable_variables)

    @tf.function(input_signature=[tf.TensorSpec([None, 1], tf.float32),
                                 tf.TensorSpec([None, 1], tf.float32)])
    def step(batch_x, batch_y):
        with tf.GradientTape() as tape:
            predictions = custom(batch_x, training=True)
            value = tf.reduce_mean(half_mse(batch_y, predictions))
            if custom.losses:
                value += tf.add_n(custom.losses)
        grads = tape.gradient(value, custom.trainable_variables)
        optimizer.apply_gradients(zip(grads, custom.trainable_variables))
        return value

    first_loss = float(step(x, y))
    manual = manual_step(*manual, x, y, 0.1)
    first_weights = [value.tolist() for value in custom.get_weights()]
    for expected, actual in zip(manual, custom.get_weights()):
        np.testing.assert_allclose(actual, expected, atol=1e-6)
    for _ in range(39):
        step(x, y)
        manual = manual_step(*manual, x, y, 0.1)
    for expected, actual in zip(manual, custom.get_weights()):
        np.testing.assert_allclose(actual, expected, atol=2e-6)

    built_in = build_model()
    built_in.compile(optimizer=keras.optimizers.SGD(learning_rate=0.1), loss=half_mse,
                     jit_compile=False)
    dataset = tf.data.Dataset.from_tensor_slices((x, y)).batch(4).prefetch(tf.data.AUTOTUNE)
    built_in.fit(dataset, epochs=40, shuffle=False, verbose=0)
    for expected, actual in zip(custom.get_weights(), built_in.get_weights()):
        np.testing.assert_allclose(actual, expected, atol=2e-6)
    with tempfile.TemporaryDirectory() as folder:
        destination = Path(folder) / "affine.keras"
        built_in.save(destination)
        restored = keras.models.load_model(destination)
        np.testing.assert_allclose(restored(x), built_in(x), atol=1e-6)
        np.testing.assert_equal(restored.optimizer.iterations, built_in.optimizer.iterations)
        # Continue both once: proves optimizer state was restored for this SGD case.
        restored.train_on_batch(x, y)
        built_in.train_on_batch(x, y)
        for expected, actual in zip(built_in.get_weights(), restored.get_weights()):
            np.testing.assert_allclose(actual, expected, atol=2e-6)
    report = {"tensorflow": tf.__version__, "keras": keras.__version__,
              "initial_loss": first_loss, "after_first_update": first_weights,
              "after_40_updates": [a.tolist() for a in custom.get_weights()],
              "final_loss": float(tf.reduce_mean(half_mse(y, custom(x)))),
              "manual_tape_fit_parity": True, "saved_reload_next_update_parity": True,
              "function_trace_count": step.experimental_get_tracing_count()}
    print(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    run()

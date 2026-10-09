"""Use fit's orchestration with a custom step; compare against the normal step."""
import os
os.environ.setdefault("KERAS_BACKEND", "tensorflow")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import json
import numpy as np
import tensorflow as tf
import keras


class CustomFit(keras.Model):
    def train_step(self, data):
        x, y, sample_weight = keras.utils.unpack_x_y_sample_weight(data)
        with tf.GradientTape() as tape:
            y_pred = self(x, training=True)
            loss = self.compute_loss(x=x, y=y, y_pred=y_pred,
                                     sample_weight=sample_weight, training=True)
        gradients = tape.gradient(loss, self.trainable_variables)
        self.optimizer.apply_gradients(zip(gradients, self.trainable_variables))
        for metric in self.metrics:
            if metric.name == "loss":
                metric.update_state(loss, sample_weight=tf.shape(x)[0])
            else:
                metric.update_state(y, y_pred, sample_weight=sample_weight)
        return {metric.name: metric.result() for metric in self.metrics}


def create(model_type):
    inputs = keras.Input(shape=(1,))
    outputs = keras.layers.Dense(1, kernel_initializer="zeros", bias_initializer="zeros")(inputs)
    model = model_type(inputs=inputs, outputs=outputs)
    model.compile(optimizer=keras.optimizers.SGD(.05), loss="mse", metrics=["mae"],
                  jit_compile=False)
    return model


def run():
    x = np.array([[-2.], [-1.], [1.], [2.]], dtype="float32")
    y = 2 * x + 1
    plain, controlled = create(keras.Model), create(CustomFit)
    for model in [plain, controlled]:
        model.fit(x, y, epochs=20, batch_size=4, shuffle=False, verbose=0)
    for expected, actual in zip(plain.get_weights(), controlled.get_weights()):
        np.testing.assert_allclose(actual, expected, atol=2e-6)
    report = {"tensorflow": tf.__version__, "keras": keras.__version__,
              "normal_custom_fit_weights_match": True,
              "weights": [weight.tolist() for weight in controlled.get_weights()],
              "fixture_evaluation": controlled.evaluate(x, y, verbose=0, return_dict=True)}
    print(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    run()

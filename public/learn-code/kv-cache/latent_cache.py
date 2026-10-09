"""Content projection absorption, with a separate positional-key branch.

Run: python latent_cache.py
NumPy algebra only; this is neither an MLA-trained model nor a quality study.
"""
import json
import math
import numpy as np


def rotation(angle):
    return np.array([[math.cos(angle), -math.sin(angle)],
                     [math.sin(angle), math.cos(angle)]])


def compare():
    latent = np.array([[1, 2], [-1, 1]], dtype=np.float64)
    up_keys = np.array([[1, 0, 2], [0, 1, -1]], dtype=np.float64)
    up_values = np.array([[1, 2], [3, -1]], dtype=np.float64)
    query = np.array([[2, -1, 0.5]], dtype=np.float64)
    keys, values = latent @ up_keys, latent @ up_values
    direct_scores = query @ keys.T
    absorbed_query = query @ up_keys.T
    latent_scores = absorbed_query @ latent.T
    np.testing.assert_allclose(direct_scores, latent_scores)
    weights = np.exp(direct_scores-direct_scores.max())
    weights /= weights.sum()
    direct_output = weights @ values
    absorbed_output = (weights @ latent) @ up_values
    np.testing.assert_allclose(direct_output, absorbed_output)

    # Row-vector convention: applying a column rotation R means row @ R.T.
    projection = np.array([[2, 1], [0, 1]], dtype=np.float64)
    r = rotation(math.pi/3)
    row = np.array([[1, 2]], dtype=np.float64)
    rotate_after = (row @ projection) @ r.T
    wrong_commute = (row @ r.T) @ projection
    assert not np.allclose(rotate_after, wrong_commute)
    np.testing.assert_allclose((row @ projection) @ rotation(0).T,
                               (row @ rotation(0).T) @ projection)

    # A separated position branch adds its own dot products to content scores.
    position_keys = np.array([[1, 0], [0.5, math.sqrt(3)/2]])
    position_query = np.array([[0, 1]])
    combined = direct_scores + position_query @ position_keys.T
    return {"latent": latent.tolist(), "up_keys": up_keys.tolist(), "up_values": up_values.tolist(),
            "query": query.tolist(), "expanded_keys": keys.tolist(), "expanded_values": values.tolist(),
            "content_scores": direct_scores.tolist(), "absorbed_query": absorbed_query.tolist(),
            "attention_weights": weights.tolist(), "direct_output": direct_output.tolist(),
            "absorbed_output": absorbed_output.tolist(), "rotation_after_projection": rotate_after.tolist(),
            "incorrect_commuted_rotation": wrong_commute.tolist(), "content_plus_position_scores": combined.tolist(),
            "paper_example_elements_per_token_per_layer": 512+64,
            "paper_example_80_layer_fp16_bytes_per_token": 80*(512+64)*2}


if __name__ == "__main__":
    print(json.dumps(compare(), indent=2))

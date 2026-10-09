"""Keep spacetime geometry and vocabulary namespaces explicit.

Run: python sequence_geometry.py (NumPy and PyTorch).
Tubelets are temporal, spatial-row, spatial-column, channel ordered.
A matched Conv3d projects the same non-overlapping blocks. No crop/padding
is implicit here: reject incomplete blocks. The namespace table below is
a constructed teaching model, not a pretrained model's token layout.
"""
import json
import numpy as np
import torch


def tubeletify(video, temporal_size, patch_size):
    """[T,H,W,C] -> [time-block * row-block * column-block, tau*P*P*C]."""
    time, height, width, channels = video.shape
    if temporal_size < 1 or patch_size < 1:
        raise ValueError("Block sizes must be positive")
    if time % temporal_size or height % patch_size or width % patch_size:
        raise ValueError("Video dimensions must be divisible by block sizes")
    return (video.reshape(time // temporal_size, temporal_size,
                          height // patch_size, patch_size,
                          width // patch_size, patch_size, channels)
            .transpose(0, 2, 4, 1, 3, 5, 6)
            .reshape(-1, temporal_size * patch_size * patch_size * channels))


# (offset, size) identifies each distinct dictionary.
NAMESPACES = {"text": (0, 8), "image": (8, 4),
              "audio_level0": (12, 4), "audio_level1": (16, 4)}
MARKERS = {"image_open": 20, "image_close": 21,
           "audio_open": 22, "audio_close": 23}


def global_id(namespace, local_id):
    offset, size = NAMESPACES[namespace]
    if type(local_id) is not int or not 0 <= local_id < size:
        raise ValueError("Local index outside its dictionary")
    return offset + local_id


def pack_image_then_text(image_ids, text_ids):
    """Return one discrete input and aligned text-only training labels.

    Input-only image/marker targets are ignored. A standard causal-LM loss
    shifts these aligned labels internally; do not pre-shift them for it.
    """
    prefix = [MARKERS["image_open"],
              *[global_id("image", k) for k in image_ids],
              MARKERS["image_close"]]
    text = [global_id("text", k) for k in text_ids]
    return prefix + text, [-100] * len(prefix) + text


def sample_times(duration, frames_per_second):
    """Sample instants on [0,duration); zero duration returns an empty list."""
    if duration < 0 or frames_per_second <= 0:
        raise ValueError("Nonnegative duration and positive rate required")
    return np.arange(int(np.ceil(duration * frames_per_second))) / frames_per_second


def main():
    video = np.arange(4 * 4 * 4, dtype=np.float64).reshape(4, 4, 4, 1) / 64
    tubelets = tubeletify(video, 2, 2)
    weights = np.arange(8 * 3, dtype=np.float64).reshape(8, 3) / 20
    numpy_projection = tubelets @ weights
    convolution = torch.nn.Conv3d(1, 3, (2, 2, 2), stride=(2, 2, 2),
                                  bias=False).double()
    with torch.no_grad():
        # [tau,P,P,C,D] -> [D,C,tau,P,P]
        kernels = weights.reshape(2, 2, 2, 1, 3).transpose(4, 3, 0, 1, 2)
        convolution.weight.copy_(torch.tensor(kernels.copy()))
        chw_time = torch.tensor(video.transpose(3, 0, 1, 2)[None].copy())
        torch_projection = convolution(chw_time).permute(0, 2, 3, 4, 1)
        torch_projection = torch_projection.reshape(-1, 3).numpy()
    difference = float(np.max(np.abs(numpy_projection - torch_projection)))
    if difference > 1e-12:
        raise AssertionError("Projection orientation mismatch")
    inputs, aligned = pack_image_then_text([3, 0], [3, 4])
    print(json.dumps({
        "tubelet_shape": list(tubelets.shape), "frame_patch_count": 16,
        "first_tubelet": tubelets[0].tolist(),
        "conv3d_max_absolute_difference": difference,
        "namespace_local3": {name: global_id(name, 3) for name in NAMESPACES},
        "input_ids": inputs, "aligned_labels": aligned,
        "next_targets": aligned[1:] + [-100],
        "sample_times_1fps": sample_times(2, 1).tolist(),
        "sample_times_4fps": sample_times(2, 4).tolist(),
    }, indent=2))


if __name__ == "__main__":
    main()

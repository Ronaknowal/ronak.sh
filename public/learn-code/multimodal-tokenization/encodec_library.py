"""Encode and decode a local PCM WAV through the matched EnCodec API.

Setup: pip install numpy scipy torch transformers
Run pretrained: python encodec_library.py input.wav
Save decoded audio: python encodec_library.py input.wav --output decoded.wav
First pretrained run downloads facebook/encodec_24khz to the normal HF cache.
Run offline API/shape experiment: python encodec_library.py input.wav --offline-shape
The offline mode constructs a SMALL RANDOM model; it tests tensor contracts,
not trained compression quality. The two routes deliberately report their
different parameter origin. Both explicitly request6.0kbps bandwidth.

The24kHz checkpoint is mono: stereo WAV channels are averaged before
resampling. Resampling changes the sample clock using scipy.resample_poly;
it is not merely relabelling the sampling_rate argument. Processor padding
mask, encoder scales and final-frame padding are carried into decode. The
decoded waveform is trimmed to the resampled input's valid sample length.
Optional output clips to[-1,1], rounds times32767 and writes symmetric
16-bit PCM at the model's actual sample rate. The printed MSE is computed
on floating decode values before this file conversion.
API reference: https://huggingface.co/docs/transformers/model_doc/encodec
Codec mechanism: https://arxiv.org/abs/2210.13438 section3.2.
"""

import argparse
import inspect
import json
import math
from pathlib import Path
import wave
import numpy as np
from scipy.signal import resample_poly
import torch
from transformers import (AutoProcessor, EncodecConfig, EncodecFeatureExtractor,
                          EncodecModel)


def read_pcm_wav(path):
    """Return samples [time,channel] in[-1,1] and the actual sample rate."""
    with wave.open(str(path), "rb") as handle:
        if handle.getcomptype() != "NONE":
            raise ValueError("Use an uncompressed PCM WAV")
        channels, rate = handle.getnchannels(), handle.getframerate()
        width, frames = handle.getsampwidth(), handle.getnframes()
        raw = handle.readframes(frames)
    if width == 1:
        samples = (np.frombuffer(raw, dtype=np.uint8).astype(np.float32) - 128) / 128
    elif width in (2, 4):
        samples = np.frombuffer(raw, dtype=f"<i{width}").astype(np.float64)
        samples = samples / (2 ** (8 * width - 1))
    elif width == 3:
        bytes_ = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 3).astype(np.int32)
        samples = bytes_[:, 0] | (bytes_[:, 1] << 8) | (bytes_[:, 2] << 16)
        samples = ((samples ^ 0x800000) - 0x800000) / float(0x800000)
    else:
        raise ValueError("PCM sample width must be1,2,3or4 bytes")
    return samples.reshape(-1, channels).astype(np.float32), rate


def load_model(offline_shape):
    if offline_shape:
        torch.manual_seed(0)
        config = EncodecConfig(
            sampling_rate=24000, audio_channels=1, hidden_size=8,
            num_filters=2, num_lstm_layers=1, codebook_size=1024,
            upsampling_ratios=[8, 5, 4, 2], target_bandwidths=[6.0])
        model = EncodecModel(config)
        processor = EncodecFeatureExtractor(sampling_rate=24000, feature_size=1)
        origin = "random-offline-shape"
    else:
        checkpoint = "facebook/encodec_24khz"
        model = EncodecModel.from_pretrained(checkpoint)
        processor = AutoProcessor.from_pretrained(checkpoint)
        origin = checkpoint
    return model.eval(), processor, origin


def round_trip(path, offline_shape=False, output=None):
    torch.set_num_threads(1)
    samples, source_rate = read_pcm_wav(path)
    source_channels = samples.shape[1]
    model, processor, origin = load_model(offline_shape)
    target_rate = model.config.sampling_rate
    mono = samples.mean(axis=1)
    if source_rate != target_rate:
        common = math.gcd(source_rate, target_rate)
        mono = resample_poly(mono, target_rate // common, source_rate // common)
    mono = np.asarray(mono, dtype=np.float32)
    inputs = processor(raw_audio=mono, sampling_rate=target_rate,
                       return_tensors="pt", padding=True)
    with torch.no_grad():
        encoded = model.encode(inputs["input_values"],
                               padding_mask=inputs["padding_mask"], bandwidth=6.0)
        decode_arguments = {"padding_mask": inputs["padding_mask"]}
        last_pad = getattr(encoded, "last_frame_pad_length", None)
        # Current versions expose this field; older versions rely on mask/trim.
        if "last_frame_pad_length" in inspect.signature(model.decode).parameters:
            decode_arguments["last_frame_pad_length"] = 0 if last_pad is None else last_pad
        decoded = model.decode(encoded.audio_codes, encoded.audio_scales,
                               **decode_arguments).audio_values
    if decoded.shape[-1] < len(mono):
        raise RuntimeError("Decoded waveform is shorter than the valid input")
    restored = decoded[0, 0, :len(mono)].cpu().numpy()
    output_info = None
    if output is not None:
        pcm = np.round(np.clip(restored, -1, 1) * 32767).astype("<i2")
        with wave.open(str(output), "wb") as handle:
            handle.setnchannels(1)
            handle.setsampwidth(2)
            handle.setframerate(target_rate)
            handle.writeframes(pcm.tobytes())
        output_info = {"path": str(output), "sample_rate": target_rate,
                       "channels": 1, "samples": len(restored), "sample_width_bytes": 2,
                       "clipped_samples": int(np.count_nonzero(np.abs(restored) > 1))}
    return {
        "parameter_origin": origin, "bandwidth_kbps": 6.0,
        "checkpoint_revision": getattr(model.config, "_commit_hash", None),
        "source_sample_rate": source_rate, "model_sample_rate": target_rate,
        "source_channels": source_channels, "model_channels": model.config.audio_channels,
        "valid_resampled_samples": len(mono),
        "processor_input_shape": list(inputs["input_values"].shape),
        "padding_mask_shape": list(inputs["padding_mask"].shape),
        "audio_codes_shape": list(encoded.audio_codes.shape),
        "audio_scales_shapes": [None if scale is None else list(scale.shape)
                                for scale in encoded.audio_scales],
        "last_frame_pad_length": last_pad,
        "decoder_output_shape": list(decoded.shape),
        "trimmed_output_samples": len(restored),
        "round_trip_mse_mean": float(np.mean((restored - mono) ** 2)),
        "output_wav": output_info,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("wav", type=Path)
    parser.add_argument("--offline-shape", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    print(json.dumps(round_trip(args.wav, args.offline_shape, args.output), indent=2))


if __name__ == "__main__":
    main()

# Multimodal tokenization programs

Save these files in one directory. The programs print JSON with actual
intermediate values and measurements; the lesson interprets those values.

```sh
python -m venv .venv
# Activate the environment using your platform's normal command.
python -m pip install numpy scipy torch transformers
python patch_projection.py
python residual_codec.py
python vector_quantization.py --epochs 30
python vector_quantization.py --epochs 30 --save-reconstructions digits_reconstructions.json
python sequence_geometry.py
python encodec_library.py path/to/input.wav --output decoded.wav
```

`patch_projection.py` and `vector_quantization.py` need `digits_subset.csv` beside them; retain
`digits_subset_provenance.md` for dataset attribution. No network is used by
the patch, residual, or digits programs. The EnCodec pretrained route
downloads `facebook/encodec_24khz` to Hugging Face's usual model cache on its
first run. It consumes a local uncompressed PCM WAV, converts channels to
mono, and resamples to the checkpoint's 24 kHz sample clock.
The optional output saves the trimmed decoded waveform as mono PCM16,
clipping to[-1,1] and rounding times32767. Float reconstruction MSE is
measured before this file conversion. Choose an explicit output path.

`digits_reconstructions.json` retains two actual heldout reconstructions,
their original8×8 grids and4×4 code IDs, aggregate MSE, and program/data
hashes. Regenerate it with the command above. `sequence_geometry.py`
demonstrates reversible frame patches/tubelets, matched Conv3d projection,
namespace offsets and causal target alignment; its separate verifier owns
those checks.

`python encodec_library.py path/to/input.wav --offline-shape` constructs a
small random model and exercises the same processor/encode/decode shape
contract without downloading weights. Its reconstruction measures are for
random parameters, not a trained codec result.

The native verification snapshot uses Python 3.12.14, NumPy 2.3.5,
PyTorch 2.14.0+cpu, SciPy 1.18.1 and Transformers 5.17.0. The provenance
check also uses scikit-learn 1.9.1; the downloadable training program does
not require scikit-learn. These are executed versions, not a statement
that all are the newest releases. PyTorch build and processor APIs may
vary across installations. Encoder scale tensors and padding fields must
remain paired with their codes when using another Transformers version.

Teaching boundaries:

- Patchify preserves pixels. The linear projection can discard information;
  the matched Conv2d checks orientation and values before any training.
- The efficient distance implementation uses matrix multiplication and a
  bounded chunk temporary; it does not allocate every pair's coordinate
  difference. Exact ties select the first codebook row. Very large common
  coordinate offsets can cause cancellation in the norm expansion.
- The small VQ-VAE trains its encoder, codebook and decoder on only the
  explicit train rows. Its MSE and usage counts describe this subset and
  run. Code usage is not semantic correctness or perceptual quality.
- The RVQ example quantizes two dimensional latent vectors. Its errors are
  squared coordinate **sums**. Waveform quality also depends on the learned
  encoder and decoder. Stage IDs require a stage namespace, frame count,
  stage count and serialization order to decode the payload correctly.
- The bitrate function counts fixed width IDs. Container headers, scales,
  padding and entropy coding can change an actual file's rate. EnCodec
  reconstruction on a constructed tone verifies the API route; it does not
  benchmark speech or music quality.

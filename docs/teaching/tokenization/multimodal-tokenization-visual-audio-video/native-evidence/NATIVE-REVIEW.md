# Multimodal native programs: final author evidence

Author scope: `patch_projection.py`, `vector_quantization.py`,
`residual_codec.py`, `encodec_library.py`, offline CSV/provenance, generated
reconstruction JSON, README and `scripts/verify-multimodal-tokenization.py`.
Root owns `sequence_geometry.py`, lesson content, models/figures and shared
integration. Its source hash is included here; its execution is certified
by root's separate receipt, not by these four-program checks.

Current execution receipt: [report.json](report.json), SHA256
`3108b6e6ccd534719a77eaa3a96dca8a0f8e6e9ddfd781f2a22205b024ac37bf`.
[source-and-output-bindings.json](source-and-output-bindings.json) independently
rechecks all 10 source bindings and all 10 stdout/stderr bindings against
the current files. Five successful executions cover the four programs plus
both random and pretrained EnCodec routes. Earlier reports/outputs are
retained under `previous-<UTC>/`; those describe earlier program versions.

Executed runtime: Python 3.12.14; NumPy 2.3.5; PyTorch 2.14.0+cpu;
SciPy 1.18.1; Transformers 5.17.0; scikit-learn 1.9.1. The existing
`scratch/lesson-tools` CPU runtime was reused, with the existing positional
encoding environment's Transformers dependencies on PYTHONPATH. No package
installation was needed. Named public checkpoint retrieval needed network
escalation after the restricted socket attempt; retrieval succeeded. Final
verification consumed the cached checkpoint offline:

```powershell
$env:PYTHONPATH=(Resolve-Path 'scratch/positional-encoding-reading-flow/native-environment/Lib/site-packages').Path
$env:PYTHONDONTWRITEBYTECODE='1'
$env:PYTHONUTF8='1'
$env:HF_HOME=(Join-Path (Get-Location) 'scratch/multimodal-tokenization-model-cache')
$env:HF_HUB_OFFLINE='1'
scratch/lesson-tools/Scripts/python.exe scripts/verify-multimodal-tokenization.py --pretrained
```

This command regenerates the intended public reconstruction JSON and
topic-owned native evidence. Existing evidence is archived before replacement.
Weights/cache remain in scratch, outside public. The public code directory
contains only five canonical programs, README, CSV/provenance and the result
JSON; no weights or caches.

## What the independent arithmetic checks establish

- Three slicing references check patch order/inversion across sizes/channels;
  nondivisible input is rejected. The synthetic HWC-to-Conv2d match differs
  by at most 4.440892098500626e-16. Real source row 0/digit 0 produces 16
  patch rows: inspected patch 1 is `[5,13,13,15]/16`, projection
  `[18,28]/16`; inverse is exact and Conv2d difference is zero.
- A 57×13×5 direct squared-distance reference agrees with the efficient
  matrix formula for chunk sizes 1, 7, 1024. Exact midpoint/duplicate ties
  select first rows. Six independent gradient checks isolate reconstruction,
  codebook and commitment routes. Five scalar checks verify losses
  `1,.04,.01`, encoder/code gradients `1.9,.4`, and learning-rate .1 update
  `z=.61,e=.96`.
- All 400 CSV rows match retained sklearn source indices/labels/pixels;
 320 fit rows and 80 heldout rows are disjoint. Original integer pixels
  are divided by 16. Only train rows update parameters. This small local
  split within sklearn's UCI test-set copy is not a published benchmark.
- RVQ's declared±1, ±.5, ±.25 books yield squared-coordinate sums
  `.2,.1,.025`; decode is `(.75,.75)`. Thirty additional vectors check
  decode/residual identity. Both serialization orders round-trip. Exact
  first-tie selection and non-power-of-two fixed-width bits are checked.
  The requested rate is 75 frames/s, 600 IDs/s, 6000 payload bits/s, excluding
  headers/scales/entropy coding.

## Actual retained reconstruction results

The seed 0 CPU VQ-VAE uses 30 epochs, Adam learning-rate .002, batch 64,
beta .25, a 16×4 codebook and 4×4 latent grid. Heldout mean MSE changes
from `.17092622816562653` to `.03439391031861305`; final train mean MSE
is `.030427897348999977`. Heldout assignments sum to 1280 and use 16 codes
with entropy `3.1380091672786383` bits. Usage and MSE are diagnostics for
this experiment, not semantic correctness or perceptual-quality claims.

Public `digits_reconstructions.json`, SHA256
`29547eac7fe7124fd00e0b5073840c83ff98c9c658d2fbdbd8db59a0d35e1ad4`,
contains original 8×8 pixels, actual decoded 8×8 floats, latent 4×4 IDs,
per-sample MSE, aggregates and program/CSV hashes. Examples are heldout
source row 305/digit 0 (MSE `.028418738394975662`) and row 302/digit 5
(`.033031996339559555`). Native verification checks shapes, source pixels,
labels, artifact equality with program output, and independent sample MSE.

## Actual EnCodec result and limits

Both routes read the constructed stereo PCM fixture at 16 kHz, downmix and
resample 4001 input samples to 6002 valid mono 24 kHz samples. Processor shape
is `[1,1,6002]`; mask `[1,6002]`; codes `[1,1,8,19]` (chunk,batch,level,time).
The checkpoint's scales are `[null]`, last-frame-padding field 0, decoder
shape `[1,1,6002]`. Those fields are carried into decode; valid duration
is trimmed before output.

The pretrained route actually executes `facebook/encodec_24khz` revision
`c1dbe2ae3f1de713481a3b3e7c47f357092ee040`, bandwidth 6.0 kbps.
Constructed-tone float mean MSE is `.00013271713396534324`.
`decoded-pretrained-24000hz.wav` contains 6002 mono PCM16 samples at 24 kHz;
peak absolute PCM value 5603, zero clipped samples. Its SHA256 is
`2cf72bc3790c8d8e403369313f5dd9f56f3a692796f0828d0a6f1003c7f30e75`.
The random offline route also saves a correctly shaped WAV, but its weights
have no trained-codec meaning. WAVs were checked natively for format,
length/rate and peak; no listening or speech/music quality assessment is
claimed. Complete stderr is retained separately from factual stdout.

Next action: root's independent source/teaching review and lesson/browser
integration. The native author evidence does not certify reader rendering.

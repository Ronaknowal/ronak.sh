# Multimodal pre-training: complete offline programs

Save the five Python programs in one directory. Install NumPy, PyTorch,
scikit-learn, Transformers and tokenizers in a Python environment. The data is
bundled with scikit-learn; these programs do not download pretrained models.

```sh
python alignment_mechanisms.py
python alignment_study.py --output scratch-study.json
python clip_library.py --output library-study.json
python visual_prefix.py
python multimodal_interfaces.py
```

`clip_library.py` also saves the complete CLIP checkpoint, tokenizer and image
processor beside its output report. `CLIPModel.from_pretrained` reloads that
local directory and checks the same fixture's logits. It does not download a
checkpoint with that name.

## What each program owns

- `alignment_mechanisms.py`: explicit NumPy cosine normalization, symmetric
  paired cross-entropy, full linear-tower derivatives, update, positive-set
  objective and pairwise sigmoid objective; same-array Torch comparison.
- `alignment_study.py`: data grouping/splitting, complete MLP and word-vector
  model, paired sampler, training, classification/retrieval, controls and all
  saved scratch parameters. PyTorch autograd and AdamW are declared primitives.
- `clip_library.py`: ordinary Transformers CLIP configuration, local tokenizer,
  image processor, fitting, explicit returned-loss comparison and save/reload.
  This architecture differs from the MLP, so its quality is not a same-model
  scratch/library parity claim.
- `visual_prefix.py`: explicit single-head causal decoder, projected visual
  prefix, answer labels, gradient update through frozen decoder weights and
  autoregressive generation. Its receiver is random, not a pretrained language
  model. Generated IDs establish interface behavior, not answer quality.
- `multimodal_interfaces.py`: actual miniature LLaVA forward/backward/generate,
  matched answer-loss comparison, exact query attention versus ordinary MHA,
  Q-Former objective permissions, image-availability mask, gate and mixed-ID CE.
  A small query read is not a complete BLIP-2 training implementation.

## Data and attribution

The real images are the 1,797 optical handwritten digits distributed by
`sklearn.datasets.load_digits`: 8×8 integer measurements from 0 to 16.
Source: E. Alpaydin and C. Kaynak, *Optical Recognition of Handwritten Digits*
(1998), UCI Machine Learning Repository,
https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits,
licensed CC BY 4.0. DOI: https://doi.org/10.24432/C50P49.
The English captions `digit zero` through `digit nine` are this lesson's
authored transformations of the supplied class labels. Pixel scaling by 1/16,
subset selection and image controls are also lesson transformations.

All 1,797 source rows have distinct exact pixel hashes; no conflicting-label
groups were found. Take the first 100 unique source rows per class, shuffle
within class with `np.random.default_rng(17)`, and assign 60 fit, 20 development,
20 assessment. Preserve original source indices. Thus 1,000 rows are used and
797 are unused. Writer independence is not established. Earlier lessons use
this public dataset; this local assessment is not a fresh benchmark.

Every batch samples one fit image per class using a separate RNG seeded 23.
Caption identity is the class name, so text-to-image gallery relevance uses
class labels rather than requiring one arbitrary original pair ID. Changing
to arbitrary repeated-class batches requires reconsidering the target relation.

## Fixed experiment and actual results

Both runs use model seed 17, 400 optimizer updates and recorded checkpoints
0/50/100/200/300/400. This duration was fixed before fitting; assessment results
did not select a checkpoint. Both use AdamW with weight decay 0.01 and bound the
log scale to `[0, ln 100]` after each update. Initial scale is 2.

Scratch: image 64→64 tanh→32, text mean of two 32-wide word vectors, learning
rate 0.003. Tiny CLIP: two layers in each tower, width 32, four heads, intermediate
width 64, projection 32; vision 8×8 with patch 2 and one channel, text BOS + two
words + EOS with maximum 8 positions; learning rate 0.001.

| Measurement | Scratch MLP | Tiny library CLIP |
| --- | ---: | ---: |
| Final fixed-example fit loss | 0.198203802 | 0.413932204 |
| Assessment correct /200 |188|180|
| Development correct /200 |188|183|
| Blank-image correct /200 |20|20|
| Shuffled-image correct /200 |14|14|
| Mean gallery precision@5 over ten captions |1.00|0.98|
| Mean first-relevant rank |1|1|

The fit-only nearest-centroid baseline gets 185/200 assessment images correct.
The shuffle retains the target class for 12/200 rows. Its classification
accuracy need not equal that count because predictions can be wrong on the
moved image. Blank images get one constant predicted class, yielding 20/200
on this balanced set. Neither control establishes a general visual-reasoning
claim. The original and edited pixel scores are also retained.

The library returned-loss comparison and save/reload fixture-logit comparison
both have maximum absolute difference 0 in the recorded run. The programs
retain all predictions, source IDs and recorded checkpoints, not just means.
The scratch JSON includes every fitted weight, caption vector and assessment
pixel array used by browser inference. The library JSON reports a recorded
native experiment; the browser does not execute the CLIP Transformer.

## Tested environment and boundaries

The scratch study used PyTorch 2.14.0+cpu, NumPy 2.3.5 and scikit-learn 1.9.1.
The isolated Transformers 5.17.0 environment used PyTorch 2.14.0+cpu,
NumPy 2.5.3 and scikit-learn 1.9.1. Its `CLIPImageProcessor` used the library's
PIL fallback because torchvision was absent; the program verifies the resulting
pixels exactly equal the intended measurement/16 tensors. These are actual
recorded environments, not a claim that every earlier version has the same API.

Norms at or below 1e−12 are outside the explicit cosine mechanism contract.
Torch's normalization epsilon fallback is not a semantic direction at zero.
All-ignored answer labels have an undefined mean; skip the optimizer update.
All-blocked attention rows are invalid; the pre-first-image memory demonstration
instead explicitly skips its visual residual. These programs are CPU teaching
experiments, not production multimodal systems or web-scale quality benchmarks.

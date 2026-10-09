# Curriculum learning and data mixing programs

These seven complete programs accompany Curriculum Learning & Data Mixing Strategies.
Keep them together with `literary-domains.json`. No training program uses the network.

Use Python3.12 or compatible. The measured study used Python3.12.14,
NumPy2.3.5 and SciPy1.18.1. The same-state gradient comparison used
PyTorch2.14.0+cpu. The separate loader example used Datasets5.1.0,
PyArrow25.0.1, NumPy2.5.3 and PyTorch2.14.0+cpu in an isolated environment.
Different package versions can change random streams or numerical results.

```bash
python -m pip install numpy scipy torch datasets
python mixing_math.py
python mixture_sampler.py
python byte_mixture.py
python mixing_libraries.py
python fit_mixture_response.py
python run_mixture_study.py --output my-study.json
```

- `mixing_math.py`: units, power shares, integer quotas, pacing and weighting arithmetic.
- `mixture_sampler.py`: transparent single-worker shuffle/cursor/RNG checkpoint and three stop policies.
- `mixing_libraries.py`: ordinary iterable interleave and per-record weighted sampling; count targets separately.
- `byte_mixture.py`: full NumPy byte-bigram training, DoReMi proxy loop, DoGE-style gradient step and matched Torch update.
- `fit_mixture_response.py`: simplex response, fixed parameter gauge, scratch coordinate search and SciPy fit.
- `run_mixture_study.py`: fixed-protocol real-text study, tuning selection, separate final test and search cost.
- `prepare_corpus.py`: optional public source download/rebuild; required corpus is already supplied.

The dataset contains real literary text from Lewis Carroll, H. G. Wells and Charles
Dickens, as preserved by Project Gutenberg. Original works are public domain in
the USA. Exact catalogue/text URLs, source hashes, paragraph IDs, transformation
and split are inside the JSON. Project Gutenberg's terms are linked there.
The books define the experimental domains. Captions or plots must not relabel
them as web, code or mathematics. A fixed256-byte alphabet is used; losses are
nats per eligible next-byte target, with no transition across paragraph boundaries.

The recorded small study does not show an advantage for the learned mixtures.
All methods' main runs use the same120steps of768targets; search/reference/proxy
work is additional. A one-byte context and three short book excerpts are not a
production LLM evaluation or an experiment on transfer between model scales.

An exact target budget differs from a fixed record count. The loader examples
teach that distinction and are not distributed production checkpoint implementations.
The optional corpus builder refuses to overwrite output; model studies also
require a fresh output path. Keep earlier results when trying a changed setting.

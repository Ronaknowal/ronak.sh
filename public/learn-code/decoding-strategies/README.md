# Decoding programs

These programs separate a model's conditional probabilities, the decoder's decisions and the evaluation of the resulting text. The small count model is built completely from public-domain text. The native path uses unchanged Pythia-14M weights through ordinary Transformers generation. No neural training is performed.

Use Python 3.12 in an isolated environment. From this directory:

```sh
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python sampling.py
python filters.py
python history_and_stops.py
python beam_search.py
python practice_answers.py
python native_generation.py --stage operators --output finite-native
```

`sampling.py` allocates probability intervals and implements the feedback loop. `filters.py` keeps score rows in token-ID order while changing their support. `history_and_stops.py` shows history-dependent operations and stop-string overhang. `beam_search.py` exposes alive/finished/capped paths and an exhaustive finite oracle. Their default numbers are constructed examples.

The real data are in `data/` with their original provenance and hashes. `corpus_model.py` shows the count fit explicitly; the study driver fits once and reloads its saved counts without a second fit. Run the bounded count study:

```sh
python scratch_study.py --output study-count
```

Download the model checkpoint once, using the exact revision:

```sh
hf download EleutherAI/pythia-14m --revision cf967c0a9a04383db6f7b1108d86b2962634b4ac --local-dir pythia-14m
python native_generation.py --model pythia-14m --output study-native --stage probes
python native_generation.py --model pythia-14m --output study-native --stage study
python analyze_outputs.py --count study-count --native study-native --output observations.json
```

The native code loads local files only after that download. The small pretrained model may generate poor text. Inspect its exact outputs and the source-bound records; do not treat low likelihood, high diversity or fewer repeats as proof of usefulness. The fixed Alice prefixes may have appeared in pretraining.

Each model has 84 predetermined outputs: four prompts, three deterministic configurations, and six sampling configurations at three seeds. The maximum continuation is 32 tokens; EOS can finish earlier. Sampled NumPy and Torch streams need not choose the same token. The finite native probes compare actual probability contracts and source-specific beam ancestry, and separately check same-stack seed repeatability and model reload. Greedy has a deterministic local decision distribution; beam is sequence search and has no local categorical q.

The two beam implementations have explicitly different EOS admission conventions. The scratch program admits every EOS child into a finished pool. Native beam admits leading-ranked completed candidates and exposes its own ancestry. Both show generated-length and stopping rules. Do not interpret their different outputs as automatic bugs or as a benchmark ranking.

Runs guard source/data/configuration identities and immediately seal completed rows with SHA256 sidecars. A `.started` marker without a completed record prevents silently repeating a failed operation. Changing source under an existing output directory is an error. For a genuinely new experiment, choose a new output directory and state the changed protocol. An interrupted or failed study must preserve its partial results before any continuation. The teaching observations should be reanalyzed from retained records, never regenerated for presentation changes.

The source programs are the complete instructional route. `analyze_outputs.py` performs no generation, and `practice_answers.py` uses direct arithmetic for changed-input exercises. Empty and one-token continuations have no defined bigram diversity; the report keeps these as null rather than assigning a convenient score.

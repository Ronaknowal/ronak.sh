# Data curation pipeline programs

Use Python3.12 or later. Keep these eight Python files together. The complete
lesson explains every representation and calculation; these are full programs,
not notebook fragments. Run with `-B` to keep bytecode out of a public folder.

- Signals/audit: Python standard library, `python -B curation_signals.py`.
- Reference ratios: SciPy1.18.1, `python -B reference_selection.py`.
- Scratch curator: NumPy2.3.5, `python -B linear_curator.py`.
- Ordinary fit: scikit-learn1.9.1, `python -B curation_libraries.py`.
- Collection: standard library plus the exact `curation_records.py` and
  `lexical_dedup.py` from the preceding deduplication lesson. Either place those
  helpers beside these files or pass `--dedup-directory`.
- Released neural curator: Torch2.14.0, Transformers5.17.0 and
  huggingface_hub1.33.0. The pinned model's initial download is about0.4GB.
- Ordinary pipeline: DataTrove0.10.1, orjson3.12.0 and NumPy when using a saved
  fitted curator. Set `PYTHONDONTWRITEBYTECODE=1` for spawned workers.

The exact executed study versions are in `study-protocol.json`. A typical
isolated environment can install the numerical packages with:

```text
python -m pip install numpy==2.3.5 scipy==1.18.1 scikit-learn==1.9.1
python -B -X utf8 prepare_annotations.py --output ./annotations
python -B -X utf8 run_curator_study.py --data ./annotations --output ./curator-run
```

Use a new fit output directory. The collection caches responses and refuses a
changed source revision; it does not promise future API availability. The study
freezes its protocol before fitting. Raw web-prefix text stays in the local
collection directory; `study.json` contains derived predictions only.

For actual released-model behavior:

```text
python -B -X utf8 neural_curator.py --output ./neural-result.json --cache ./model-cache
```

For the ordinary local pipeline:

```text
python -B -X utf8 datatrove_quality_pipeline.py --output ./quality-run
python -B -X utf8 datatrove_quality_pipeline.py --output ./fitted-quality-run --model ./curator-run/model.json --threshold .1
```

The first pipeline uses explicitly supplied teaching scores. The second uses
the learned model; neither command is a new large language-model experiment.
The separate canonical `datatrove_pipeline.py` owns four-stage MinHash.

`article.html` is an authored pendulum fixture for the preceding helper's
`ArticleText` class. `neural-result.json` contains actual scores on three authored
paragraphs. `collection.json`, `collection-protocol.json`, `study-protocol.json`,
`study.json`, `model.json` and `pipeline-result.json` retain the declared
provenance and outcomes. The teacher labels measure their rubric; they are not
independent factual-quality judgements or downstream training results.

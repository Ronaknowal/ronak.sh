# Supervised fine-tuning: complete executable packet

This packet accompanies the SFT lesson. Six complete teaching programs cover
the manual objective/backward pass, data serialization, packed batching,
pretrained study, native trainer and evaluation. `acquire_model.py` is a small
standard-library input downloader. `tiny_causal_lm.py` is an unchanged copy of
the causal-language-modeling prerequisite; importing it does not run its main.

## Inputs and attribution

`data/train.tsv`, `data/dev.tsv`, and `data/test.tsv` are exact files from
[Poem Sentiment](https://github.com/google-research-datasets/poem-sentiment),
revision `612e9a1f86799126c68f0c5d9c3f1fc28f88068f`.
Credit Emily Sheng and David Uthus, *Investigating Societal Biases in a Poetry
Composition System* (2020), [paper](https://arxiv.org/abs/2011.02686).
The dataset is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The source bytes are unchanged; the programs explicitly exclude mixed training
labels and convert the retained raw labels. The release's verse annotations
are not relabeled here. Its TSVs do not supply poem IDs.

The pretrained checkpoint is [EleutherAI/pythia-14m](https://huggingface.co/EleutherAI/pythia-14m/tree/cf967c0a9a04383db6f7b1108d86b2962634b4ac),
revision `cf967c0a9a04383db6f7b1108d86b2962634b4ac`, Apache-2.0.
`model-source-report.json` identifies all six model/card/tokenizer files by
byte count and SHA256. The downloader verifies those identities and retains the
upstream card. It needs network access and downloads about 30 MB. We do not
redistribute adapted checkpoints or substitute another revision.

## Run the explicit route

Use Python 3.12 and a separate virtual environment. Commands below assume your
current directory is this extracted packet and `python` refers to that
environment. On Windows activate with `.venv\Scripts\Activate.ps1`; on POSIX
use `source .venv/bin/activate`. CPU Torch installation may depend on your
platform; the original execution used Torch 2.14.0+cpu.

```sh
python -m venv .venv
```

Activate `.venv` as described above, then run:

```sh
python -m pip install numpy==2.3.5 torch==2.14.0 transformers==5.17.0
python acquire_model.py --output model
python sft_objective.py --output objective.json
python sft_data.py --data data --model model --output data-report.json
python sft_batching.py --output batching.json
python sft_evaluate.py --verify --output evaluation-contract.json
```

Activate the virtual environment before the `pip` command. The objective and
batching checks need NumPy/Torch; data checks also use Transformers and its
tokenizers dependency. `sft_data.py --download` can fetch missing source TSVs
from the pinned revision and checks the expected SHA256 before using them.

The next commands run a new controlled experiment. They can take several
minutes on CPU and create local model/optimizer checkpoints substantially
larger than this packet. Use a new `my-study` directory. Freezing records the
actual software versions and local input identities; it refuses to overwrite
an existing protocol. A newly executed experiment is not the recorded run.

```sh
python sft_study.py freeze --data data --model model --work my-study
python sft_study.py train --data data --model model --work my-study --policy response --seed 17
python sft_study.py train --data data --model model --work my-study --policy response --seed 29
python sft_study.py train --data data --model model --work my-study --policy response --seed 43
python sft_study.py train --data data --model model --work my-study --policy full --seed 17
python sft_study.py train --data data --model model --work my-study --policy full --seed 29
python sft_study.py train --data data --model model --work my-study --policy full --seed 43
python sft_study.py evaluate --data data --model model --work my-study
```

The driver checks the frozen source/data/model/environment contract before each
operation. It reuses completed fits, resumes incomplete work from its saved
50-step checkpoint, and records errors. Do not run two drivers against the same
work directory. Test evaluation requires all six fits to be complete. Selected
checkpoints use development response NLL only, including the initial checkpoint.
The test evaluator saves and reuses each completed model evaluation.

## Run the ordinary trainer route

Use another virtual environment because this route was actually executed with
Transformers 5.19.0, not the study's 5.17.0. Activate it before installing:

```sh
python -m venv .venv-trl
```

Activate `.venv-trl` with the corresponding platform command, then run:

```sh
python -m pip install torch==2.14.0 transformers==5.19.0 trl==1.14.2 datasets==5.1.0 accelerate==1.15.0 pyarrow==23.0.1
python sft_trl.py --output-dir native-output
```

This program constructs its small tokenizer and GPT-2 locally, inspects actual
prepared labels, checks explicit/native loss and gradients, executes one real
SGD step and verifies saved/reloaded logits. Its full-text and chat-template
branches inspect actual native preprocessing. It does not train the Pythia
study or download model weights. Use a normal virtual environment installation:
placing packages in an arbitrary directory with `pip --target` can change dill
module pickling behavior during dataset preparation.

## Inspect the recorded observations

`study-protocol.json` is the prospective original protocol. `study-evaluation.json`
contains every run's development histories, all 1,200 updates, all 104 test
predictions under each rule and the pretrained and training-majority baselines.
`study-summary.json` derives the displayed aggregates and predeclared examples.
`mechanism-reports.json` collects the executed objective, data, packing, evaluator
and native trainer checks. These are saved observations, not new executions when
the page loads. Raw local paths/version strings in receipts describe the
original execution and are not required directory names for a reproduction.

The exact package file inventory and hashes are in `FILES.json`. Scientific
source hashes are also bound by the original protocol. Downloaded models are
kept outside the public packet. The lesson's local result concerns a single
short-label task and cannot establish broad instruction following, retention
or safety.

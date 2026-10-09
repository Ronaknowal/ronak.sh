# Complete RLHF teaching programs

Use Python 3.12 in a virtual environment. Install requirements.txt there:

    python -m venv .venv

Activate that environment using your shell's usual command (.venv\Scripts\Activate.ps1 on PowerShell or source .venv/bin/activate on a POSIX shell), then:

    python -m pip install -r requirements.txt
    python -B preference_records.py
    python -B rlhf_study.py --output my-results --workdir trainer-output

The canonical native run used CPU Torch 2.14.0+cpu, Python 3.12.14 and the listed library versions. A CPU wheel can be installed from PyTorch's official CPU index when appropriate for your platform. The miniature uses two Torch threads. No pretrained weights or network dataset download is needed after installation. Use a standard virtual environment/site-packages layout: datasets fingerprinting through dill can misclassify modules in arbitrary pip --target folders.

Keep all nine Python files together. Eight are complete instructional programs; causal_backbone.py is the unmodified model-class helper from the earlier Causal Language Modeling lesson. backbone-provenance.json identifies its original source. records.json contains exact released comparison text, source row IDs, split groups and source hashes; HH-LICENSE.txt retains the dataset license.

The driver runs each selected stage once and writes an output plus its receipt. The --stage argument accepts pairwise, categorical, credit, token_ppo, transformers or reward_trainer. Before reusing a result, it checks the successful stage identity, output hash, main program, every transitive local dependency and preference-record hash. A changed dependency or dataset requires a reviewed new experiment; use a new output directory for that intentional run. A run failure is retained, never silently turned into a successful measurement.

- preference_records.py: reproduce or audit source extraction and prompt-family splits.
- pairwise_reward.py: analytic/Torch reward-head checks and a real-data linear/length baseline.
- policy_gradient.py: exact and sampled categorical gradients, baselines and PPO clipping witness.
- token_credit.py: shifted targets, role-based masks, terminal rewards, GAE and normalization.
- token_ppo.py: actual autoregressive SFT, reward fitting and twenty token-PPO rounds.
- transformers_bridge.py: native GPT2 objective/interface parity and one actor/value update.
- reward_trainer.py: current TRL reward training on the fixed real comparison subset.
- rlhf_study.py: source-bound execution driver.

The constructed token experiment and real human-comparison study answer different questions. Its complete generated strings, including malformed or incorrect outputs, are meaningful results. Changing seeds or budgets makes a new experiment; do not mix its numbers into the original lesson's canonical trace.

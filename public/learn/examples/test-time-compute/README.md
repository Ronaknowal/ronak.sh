# Test-time compute programs

Python3.12+ is sufficient for the standard-library mechanisms. The retained native experiment used Python3.12 with the pinned requirements, CPU float32 and two Torch threads. No model weights are included. No hosted API call was made.

Create an environment and run finite mechanisms:

```sh
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python selection.py
python probability.py
python decision_risk.py
python budgeting.py
python allocation.py
python budget_controller.py
python revision.py
python search_budget.py --prm-dir prerequisite
python verify_finite.py --output my-finite-checks.json
python provider_contracts.py
```

The two files under `prerequisite/` are unchanged copies of the PRM lesson's complete finite search implementation and dependencies. `search_budget.py` executes their finite beam/UCT routines without fitting or neural generation. Its independently rooted scoring policies are not a DVTS model replication. Other default examples are explicitly constructed; their arithmetic is not a model benchmark.

`selection.py` keeps gold out of its input, parses exact finite numeric answers and implements stable ties/abstention. `probability.py` derives opportunity and exact small categorical plurality, and supplies the pass@k estimator. `decision_risk.py` operates on an explicit action/reference loss matrix. `allocation.py` solves a constructed validation-budget table using exact fractions and also supplies an independent exhaustive reference. `budgeting.py` separates total work, ideal waiting time and amortization. `revision.py` and `budget_controller.py` show supplied trace/controller states, not a trained neural reasoner.

The supplied `data/selected.json` contains the first12 GSM8K test records from the pinned upstream revision in `data/source.json`. The original MIT licence is included. `prepare_data.py` can acquire and verify that same data in a new directory; it refuses to overwrite one. The original study has300 outputs:12 greedy and288 sampled, with no training or outcome-guided tuning. The retained journal, completion hash and `summary.json` can be analyzed without a model:

```sh
python evaluate.py --data data --observations observations-r2 --output my-reanalysis.json
```

The published completion record includes only the journal identity and output count needed for analysis; local model configuration/protocol records remain in the research evidence. The journal and numerical summary are exact copies. To perform a separate reproduction, acquire the exact checkpoint and choose a new output directory:

```sh
hf download google/flan-t5-small --revision 0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab --cache-dir flan-t5-cache
python sample_hf.py --cache flan-t5-cache --data data --output my-observations
python evaluate.py --data data --observations my-observations --output my-summary.json
```

The source cap is checked before any truncation. Generated work excludes the supplied decoder-start position and post-EOS padding, and includes EOS plus any PAD actually emitted before termination. All outputs—including wrong and malformed strings—are retained. Sampling uses temperature0.8/top-p0.95/top-k0; N1/N4/N8 select from prefixes of the same eight candidates per question/seed. The sampled accuracy did not improve with more candidates in this small study. CPU timings are local observations; this is not a full benchmark, chain-of-thought self-consistency reproduction, or parallel serving test.

`provider_budget.py` constructs provider-specific request JSON using ordinary HTTPS. By default it prints an unsent payload. A user-selected supported model and explicit `--send` issue a billable call using the named environment key. `provider_contracts.py` intercepts HTTP and uses supplied fixtures, so running that check requires no key and sends no requests. No secret or model weights belong in this bundle.

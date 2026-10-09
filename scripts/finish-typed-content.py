"""Assemble the completed study into its manuscript; never execute a model."""
from pathlib import Path
import json, hashlib, shutil, zipfile, sys

root=Path(__file__).resolve().parents[1]
folder=root/'docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems'
public=root/'public/learn/examples/typed-decision-systems'
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
text=(folder/'lesson.md').read_text(encoding='utf-8')
assert 'Observed study outcomes' not in text
def before(marker,addition):
 global text
 assert text.count(marker)==1,marker
 text=text.replace(marker,addition+'\n\n'+marker)

before('<!-- PROGRAM train_decision.py -->','''**Observed study outcomes.** All three seeds completed their declared 400
updates and selected step 400 by development NLL. Their development minima were
1.75518, 1.79180 and 1.63632 for seeds 17, 29 and 43. On the 120 test requests,
their accuracies were 27/120, 20/120 and 33/120. The word-overlap baseline reached
43/120. These weak results show that a valid dynamic output interface and a
correct training loop do not supply pretrained language understanding. We keep
all three outcomes; extending training after seeing these test results would
be a new experiment, not a repair to this one.''')
cal=read(public/'results/calibration.json')['methods']
table='''**Observed calibration results.** Each scalar used only the 120 calibration
rows. None reached the declared search boundary. Accuracy is unchanged by the
positive temperature; the table's NLL and Brier values use the separate 120 test
rows. Brier is the sum across all six events, averaged across requests.

| Predictor | Fitted T | Test accuracy | NLL: raw → scaled | Brier sum: raw → scaled |
| --- | --- | --- | --- | --- |
'''
for name,row in cal.items():
 a,b=row['test_raw'],row['test_calibrated']
 assert a['accuracy']==b['accuracy']
 table+=f"| {name} | {row['temperature']:.5f} | {round(a['accuracy']*120)}/120 | {a['nll']:.5f} → {b['nll']:.5f} | {a['brier_sum']:.5f} → {b['brier_sum']:.5f} |\n"
table+='''
The native model's NLL drops by about 0.20567 nats, with the predeclared paired
bootstrap interval for scaled-minus-raw NLL approximately [−0.40128, −0.02037].
The lexical baseline's held-out NLL becomes slightly worse. Calibration-set
optimization therefore does not promise a test improvement for every predictor,
and lower NLL does not establish calibration in every subgroup.'''
before('<!-- PROGRAM calibrate_decisions.py -->',table)
before('<!-- PROGRAM evaluate_routing.py -->','''**Observed routing.** The fallback made 41 errors on the 120 calibration
requests. Its estimated expected cost is therefore
`0.5 + 10 × 41/120 = 3.91667`, producing a cheap-action threshold
`pmax > 0.60833`. The designated seed17's raw probabilities route every test
request to the fallback: 33 final errors and mean cost 3.25. Its calibrated
reports handle five requests cheaply, all five correctly, and route 115 to the
fallback. There are 32 final errors and mean cost 3.14583. Always using the cheap
model instead costs 7.75.

Five covered requests are too few to establish a dependable low-risk operating
region. The calibrated-policy cost interval is approximately [2.39156, 3.98344]
under the recorded paired row resamples; it is an interval for that policy's
mean cost, not an interval for its difference from the fallback. The saved
diagnostics for seeds29/43 and the lexical model remain available, but do not
replace the predeclared primary seed or select a threshold from test outcomes.''')
before('<!-- PROGRAM run_laya.py -->','''**Observed native execution.** The pinned model has 421,293,827 parameters.
On this Windows CPU with four Torch threads, cold loading took 53.99 seconds
and the first batch of four took 5.68 seconds. Warm single-request calls had
median 2.77 seconds and p95 5.71 seconds over 20 calls; five warm batches of four
had median 4.66 seconds and p95 8.17 seconds. Aggregate throughput was 0.348 and
0.692 examples/second respectively. Process RSS afterward was 1,511,243,776
bytes. Other local work may contend for this shared machine, so these recorded
timings describe this run and are not a controlled serving comparison.

The loader actually warned about the shipped `choice:11+` temperature
0.10058 and clamped it to 0.5. Our six-option cohort uses the distinct 6–10
bucket. Its external calibration temperature of 2.37079 is applied to saved
raw logits, not installed into the native serving configuration.''')
before('<!-- PROGRAM shift_decisions.py -->','''**Observed changed inputs.** Each scratch seed rejected the two Hindi
states for containing no ASCII state word, and both long states for exceeding
the 4,000-character input limit. Those are input rejections, not incorrect
classification outputs. The native model retained 512 total tokens for each
long request, dropping 620 or 619 state tokens. With the linking clue first,
it selected card-linking; with the clue at the end, it selected card-arrival.
This pair demonstrates the consequence of what actually survived truncation,
not a general long-context accuracy rate. The two Hindi outputs and every
schema intervention remain in the saved ledger, including erroneous choices.''')
old='''python replay_artifact.py saved --scratch results/scratch --native results/laya \\
  --calibration results/calibration.json --shifts data/shifts.json \\
  --output results/replay.json'''
new='''python replay_artifact.py package --scratch results/scratch --native results/laya \\
  --calibration results/calibration.json --routing results/routing.json \\
  --checkpoint /path/to/local/laya --checkpoint-manifest model-source.json \\
  --artifact-dir results/local-artifacts
python replay_artifact.py saved --scratch results/scratch --native results/laya \\
  --calibration results/calibration.json --routing results/routing.json \\
  --artifact-dir results/local-artifacts --shifts data/shifts.json \\
  --output results/local-replay.json'''
assert old in text;text=text.replace(old,new)
before('Changing a candidate description invalidates a schema fingerprint','''Create a fresh artifact directory for your local checkpoint location. The
bundled `results/artifacts` and `results/replay.json` retain the original Windows
checkout's relative paths as historical evidence; those paths do not automatically
resolve after extracting the download elsewhere. Packaging checks all dependencies
and creates local path bindings without training or inference. Keep the original
results. The README distinguishes reproduction from simply inspecting them.

The recorded saved replay passed for all three selected models. Maximum
first-batch logit differences were 1.19e−7, 0 and 2.38e−7, within the declared
FP32 tolerance. SDPA and extra-padding equivalence also passed. Restoring the
external native temperature reproduced its cached float64 probability vectors
bitwise. These checks preserve a particular pipeline; they do not guarantee
correctness on a new request.''')
before('The first complete program below contains', '') if 'The first complete program below contains' in text else None
text=text.replace("The bundle's README\ncontains the exact tested environment and command order.","The [complete study bundle](/learn/examples/typed-decision-systems/typed-decision-systems.zip)\ncontains all ten programs, prepared data and retained results. Its\n[README](/learn/examples/typed-decision-systems/README.md) gives the exact tested\nenvironment and command order.")
(folder/'lesson.md').write_text(text,encoding='utf-8')
shutil.copyfile(folder/'research/laya-checkpoint-source.json',public/'model-source.json')
requirements='''numpy==2.3.5
torch==2.14.0
transformers==5.19.0
laya==0.4.0
safetensors==0.8.0
huggingface-hub==1.33.0
psutil==7.2.2
tokenizers==0.23.2
'''
(public/'requirements.txt').write_text(requirements,encoding='utf-8')
environment={'python':sys.version,'platform':'Windows-11-10.0.26200-SP0','torch':'2.14.0+cpu','threads':4,'numpy':'2.3.5','transformers':'5.19.0','laya':'0.4.0','safetensors':'0.8.0','huggingface-hub':'1.33.0','psutil':'7.2.2','tokenizers':'0.23.2','dependency_isolation':'Task-local site-packages prepended by scratch/typed-decision-research/run_program.py; no global installation changed','fresh_environment':'requirements.txt pins public package versions; CPU wheel was used for the recorded run; a clean pip reinstall has not been executed'}
(public/'environment.json').write_text(json.dumps(environment,indent=2)+'\n',encoding='utf-8')
print('Manuscript updated',sha(folder/'lesson.md'))

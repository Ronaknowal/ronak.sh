# Queueing models for LLM serving

These complete examples use seconds, request counts and explicitly supplied work.
They run on CPU. Their execution durations and fictional scheduler costs are not
GPU performance measurements. The real Azure subset supplies arrival times and
token counts, not service times or measured latency.

Use Python 3.12. Create a virtual environment and install the pinned requirements:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python queue_trace.py --left 0 --right 7
.\.venv\Scripts\python queue_formulas.py --arrival-rate .9 --service-rate 1
.\.venv\Scripts\python event_queues.py --servers 2 --capacity 3
.\.venv\Scripts\python processor_sharing.py --capacity 1
.\.venv\Scripts\python iteration_scheduler.py --budget 4 --sequences 3 --blocks 8
.\.venv\Scripts\python overload_controls.py --retry-policy jitter --startup-delay 5
.\.venv\Scripts\python trace_replay.py --stretch 1 --alpha .0002 --beta .003
.\.venv\Scripts\python simpy_reference.py --servers 1
.\.venv\Scripts\python slo_metrics.py
```

On Linux/macOS use `.venv/bin/python` instead of `.\.venv\Scripts\python`.
Run from this directory so the complete sibling modules are available. Most files
use `queue_trace.py`; the SimPy reference also uses `event_queues.py`, and the
metrics example uses the sample-quantile function from `trace_replay.py`.
See [FILES.md](FILES.md) for individual files and purposes.

The four-request timeline has waits 0,2,2,0 seconds and residences 3,3,4,1.
The area under the population is 11 request-seconds over [0,7]. Try the different
window `--left 2 --right 5`: partial residences matter, so a completion-cohort
mean need not reproduce the window's time-average population.

`queue_formulas.py` labels stationary assumptions and refuses unstable infinite
queues. Its finite K counts **total** residents. Its Kingman value is a mean
approximation for one general server, not a multiserver theorem or a p99 estimate.

`event_queues.py --count 30000 --load .8 --seed 17 --distribution mixture` creates
a Poisson arrival stream and independent two-point service work. This standalone
command reports a drained finite cohort; it does not automatically discard a
warmup or establish stationarity. `--stop-time` keeps planned future departure
distinct from an observed completion. SimPy uses real library event/resource
operations and includes a timed-out pending request cancellation example.

`iteration_scheduler.py` distinguishes processed prompt, emitted output, later
decode input and cache residency. It reserves known peak blocks up front, an
intentionally conservative model with known output lengths. Real inference does
not generally know sampled output lengths in advance. `--full-prefill` rejects a
prompt larger than the whole iteration token budget rather than waiting forever.
For a full-prefill comparison use `--budget 16 --full-prefill`. Its cost law is
fictional and printed alongside the exact work operands.

`overload_controls.py` separates logical requests from attempts. The startup delay
and hysteresis hold are supplied durations. Delayed-capacity simulation and the
sampled controller are distinct examples; the sampled queue observations are not
predictions from a platform autoscaler.

`trace_replay.py` preserves all 512 source positions and raw timestamps. Python
datetime truncates fractional seconds after microseconds, so raw timestamps
remain available for higher-precision analysis. Alpha/beta coefficients are
fictional service proxies. Changing them performs a sensitivity calculation;
the output does not measure Azure latency. Attribution, subset rule and hashes:
[trace-provenance.json](trace-provenance.json). Data is licensed under
[Creative Commons Attribution 4.0](AZURE-DATA-LICENSE.txt): Microsoft Azure Public
Dataset, Patel et al., *Splitwise: Efficient Generative LLM Inference Using Phase
Splitting*, ISCA 2024. Prompt text is not part of this dataset.

`slo_metrics.py` constructs a small request cohort and classic cumulative
histogram. Its exact raw type7 quantile and bucket interpolation are deliberately
different estimators. Optional `--prometheus metrics.txt` reads classic numeric
bucket samples with matching boundaries. Counts must describe the same interval
or appropriate counter differences; an arbitrary cumulative snapshot is not a
request-rate measurement. Empty/unbounded estimates stay undefined.

Production vLLM instructions in the lesson target v0.27.0. Running an engine
requires a compatible GPU/runtime and a fitting model configuration. The CPU
examples here do not download a model, call a paid API or claim engine throughput.

## Retained CPU observations

[observations-summary.json](observations-summary.json) contains all 24 completed
finite simulation summaries, three seeds per specified comparison group, and the
three real-input/fictional-cost trace replays. The first 5,000 arrivals were
excluded from each 30,000-arrival drained response cohort. The warmup is a declared
heuristic, not proof of stationarity; seed ranges are not confidence intervals.
The response cohorts and clipped time-average populations use separate boundaries.
The program archive contains all source/dependencies/data; the separate observation
archive retains lossless arrivals/services/outcomes and the original failure.

The original campaign completed nine small mains and fifteen FCFS cases before
its first PS case stalled on floating-point absolute-clock rounding and exhausted
memory. That failure remains recorded. The current processor-sharing program
advances relative elapsed work, dispatches the selected completion even below an
absolute timestamp's resolution, and records roundoff and attained work. It has a
2N+1 event bound and unchanged work-conservation tolerances. Only the nine unfinished
PS cases, two unreached trace stretches and 33 boundary checks were then executed
with independent prospective acceptance. Completed stages were not repeated.

## Optional GPU commands — not executed for this lesson

This separate Linux/NVIDIA environment needs a compatible driver and enough free
GPU memory for weights, KV states and runtime buffers. Check the pinned vLLM
[installation guide](https://docs.vllm.ai/en/v0.27.0/getting_started/installation/gpu/).
The commands download a model snapshot; the CPU examples do not need that download.

```bash
python3.12 -m venv .engine-venv
source .engine-venv/bin/activate
python -m pip install 'vllm==0.27.0'
python -c "from huggingface_hub import snapshot_download; snapshot_download('Qwen/Qwen2.5-0.5B-Instruct', revision='7ae557604adf67be50417f59c2c2f167def9a775', local_dir='queue-example-model')"
vllm serve ./queue-example-model --served-model-name queue-example \
  --host 127.0.0.1 --port 8000 --max-model-len 2048 \
  --max-num-seqs 16 --max-num-batched-tokens 512
```

In a second terminal after readiness:

```bash
source .engine-venv/bin/activate
vllm bench serve --backend openai --host 127.0.0.1 --port 8000 \
  --model queue-example --tokenizer ./queue-example-model \
  --dataset-name random --random-input-len 128 --random-output-len 32 \
  --num-prompts 100 --request-rate 1 --seed 17 \
  --percentile-metrics ttft,tpot,itl,e2el --metric-percentiles 50,90,99 \
  --save-result --save-detailed --result-dir queue-results \
  --result-filename fixed-rate.json
curl http://127.0.0.1:8000/metrics > queue-results/metrics.txt
```

These are synthetic random-token inputs, not Azure requests. The versioned benchmark
CLI's default finite-rate offers are Poisson; a client concurrency cap can reduce
actual offer rate, while infinite rate offers a burst. Preserve detailed failures,
clock definitions, startup/warmup choices and hardware/configuration. No engine
installation, model download or GPU result from this route was executed here.

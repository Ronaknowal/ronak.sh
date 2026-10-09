# Retained decoding evidence

count/ and native/ preserve the fixed runs, configurations and immediate hash seals. counts.json is the once-fitted count model; probes.json contains the separately declared native checks. No pretrained weights are included. observations.json is the complete 168-row analysis. score-precision.json qualifies native FP32 log-score versus float64 display rounding using saved values only.

From the archive root, run `python analyze_outputs.py --count evidence/count --native evidence/native --output observations.json`. This performs no fitting or generation. Use the main README for a new explicitly separate experiment.

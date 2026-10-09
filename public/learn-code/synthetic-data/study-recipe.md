# Fixed generation and student recipe

The recipe was fixed before generation and fitting. Generation, rejected text,
weak outputs and all final seed results are retained. No output was regenerated
because it was unattractive.

Use the supplied Alice files. Exclude only whitespace/asterisk-only source rows,
retaining their IDs in the exclusion ledger: 17 training prose records and four
held-out prose records remain. Held-out records never supply teacher prompts.
Each training record receives one plain rewrite prompt and one question/answer
prompt. FLAN-T5-small uses temperature .8, top-p .9, top-k 0, one sampled beam,
at most 96 new decoder tokens and seed 73 plus stable record index. Encoder
inputs are clipped to 512 IDs with full IDs and a truncation flag retained.
The actual 34 inputs required no clipping; two outputs reached the length cap.

Normalize candidate text with NFKC and whitespace collapse. Require at least
33 UTF-8 bytes; exclude exact normalized parent copies and exact candidate
duplicates, keeping the first occurrence. Keep the full decision ledger. This
is mechanical eligibility, not semantic verification. The actual pool keeps
32 candidates, excluding two short QA outputs. All 17 QA outputs omit the
requested answer; several prose outputs invent details. The later descriptive
audit does not change the selected corpus.

Train byte-vocabulary TinyLM students (256 IDs, context 32, width 32, two heads,
two blocks, dropout zero, 42,624 parameters) from scratch for seeds 17, 29, 43.
For each seed create raw, exact-copy and generated-mixture arms. Use identical
initialization and common precomputed branch/window uniforms. The raw and copy
arms map both branches to the same original pool; the mixture selects generated
windows when the branch draw is below .5. Choose uniformly over all eligible
within-record 33-byte windows. Each yields 32 shifted input/target pairs.

Run 300 AdamW updates, batch 16, learning rate .003, weight decay .01, clipping
gradient norm at 1. There are 153,600 selected targets per fit. Use two CPU
threads and deterministic algorithms. Report diagnostics at 0, 100, 200 and
the prospectively selected final step 300; do not select a checkpoint by test
score. Score each held-out paragraph separately, every byte after the first
once, with at most 32 context bytes, then pool sums and 1,862 target counts.
Save all histories and the three seed-17 states. Record full 256-way probability
vectors for each of four held-out paragraphs at positions 1, 8, 32 and 64.

All three raw/copy histories and final parameter hashes are exactly equal.
The generated-minus-raw final byte NLL differences are +.009832, −.008918 and
−.014321; the mean is −.004469. One seed worsens and two improve. These small
outcomes on one book do not establish a general improvement or optimal mixture.
The teacher may already know the book. Generation time excludes model loading;
student times include diagnostic evaluation and are not hardware benchmarks.

# Author review — Vocabulary Design & Multilingual Tokenization

28 September 2026. This is the author's review, not independent review or user acceptance.

## Correctness and computational evidence

- `native-evidence.json` binds the three complete public programs, real dataset/provenance, exact BPE dependency and native verifier. It records five complementary check groups and four real SentencePiece fits. Held-out inputs are unchanged across the grid; actual repeated-corpus counts, alphabet/fallback policy, token totals, ratios, versions and round trips are retained.
- `model-evidence.json` binds the browser model, shared BPE model and Python owner. It checks 100 combinations of masses, exponents and merge budgets by comparing JS full recount and Python indexed updates, including full token sequences. Separate checks establish null/support states, the default tradeoff, matrix memory/operation arithmetic, and every plotted count against native execution.
- The exact NumPy/Transformers row-extension bridge preserves old IDs/rows, appends one row, confirms actual input/output storage tying and exposes the softmax-denominator change. Tiny randomly initialized GPT-2 supplies an API/state comparison; no pretrained quality is inferred.
- The old product/language rankings, fabricated-looking timing/size curves and untraceable tokenizer outputs were replaced. Current prose separates word segmentation, parallel content, per-token billing, latency and quality. A 2023 paper is no longer used to claim 2024 tokenizer measurements.

## Learning-experience pass

1. **Route:** the shared opening gives prerequisites and a first-pass path through metrics, live mixture/budget and the real-data experiment; model migration is explicitly a return branch. Actual H2s supply the shared section index.
2. **Cautions:** comparability has one home in section 2, shape-versus-timing in section 4, dataset scope in section 6 and migration effects in section 8. Repeated universal-quality disclaimers from the legacy version were removed. Programs print structured results only.
3. **Question:** the opening asks why translated documents consume different position budgets. The real-data experiment returns to that question, with held-out sentence IDs and traceable data rather than artificial translations presented as measurements.
4. **Live investigations:** collection masses act on exposure; α and merge budget alter actual learned pieces. Defaults show Hindi shortening while `cats` fragments more than baseline; Chinese stays unchanged. All-zero exposure is explicitly undefined; zero merges and equal exposure are tested null cases. The second lab independently teaches table rows versus scored positions. No prediction UI, result reveal or grading remains.
5. **Representations:** byte/codepoint/piece strips preserve exact units; linked token strips explain the mixture mechanism; table storage is drawn as rows on a stated fixed scale; recorded language counts use a common zero baseline. ID-to-row mapping is explicit rather than a decorative architecture box. The author also inspected root's captures listed below.
6. **Connections:** the prior subword program is reused by exact path and API; byte/Unicode details point to their actual prior owner. Parallel token ratios and normalized input metrics are distinguished. Softmax expansion returns to the ID contract instead of treating resizing as a one-line repair. Canonical continued-word proportion is illustrated by 1/3 versus 2/2 splits.
7. **Code:** local code owns the sampling and metric mechanisms. SentencePiece owns its maintained trainer; this is not mislabeled as scratch BPE. Input guards remain short. Actual programs and code fragments use shared visible code controls and file discovery.
8. **Practice:** changed numeric mixtures, false Chinese cost inference, matrix versus operation accounting, reordered IDs and a new experimental setting have separate hints/solutions or evaluation criteria. Exercises teach reasoning rather than promise universal competence.
9. **Screenshots:** desktop and 320px captures show the two labs and all three distinct independent figures without overlap or clipped labels. Changed states retain their explanatory context. Initial 200% text enlargement exposed narrow columns; own grids now use intrinsic em-based minimums and root is recapturing this state. Interactive behavior and copy/download checks belong to root's execution, not static screenshot inference.
10. **Buildup:** every map row has a local reason, example, mechanism and consequence. Deeper migration introduces row addresses before resize calls, then separately exposes softmax and optimizer obligations. Per-language/domain evaluation is grounded in the user's text rather than unsupported language stereotypes.

## Remaining handoff

Independent review is complete after the two corrections recorded below. Root's final production browser/build/loading/integration closure remains separate. No learner observation or deployment has been performed. Complete integration only after those checks and any resulting corrections; preserve the source-specific computational receipts for unchanged code.

## Viewed rendering evidence and resolved review findings

The author opened the following root-generated image files on 28 September 2026. Under `scratch/tokenization/browser-current/`, the common prefix is `vocabulary-design-multilingual-tokenization-`:

- `0-desktop.png`, `1-desktop.png`: complete mixture and budget labs. The budget bar visibly occupies half its track at 128,000/256,000; earlier concern about an empty bar is not present in this capture.
- `figure-0-desktop.png`, `figure-3-desktop.png`, `figure-4-desktop.png`: byte/codepoint/piece comparison, real held-out counts and preserved/broken row identity.
- `0-320.png`, `1-320.png`, `figure-0-320.png`, `figure-3-320.png`, `figure-4-320.png`: corresponding narrow layouts. Labels and token strips wrap; the real-data columns and ID comparison stack.

Under `scratch/tokenization/interactions/`, the author opened `mixture-zero-mass.png`, `mixture-excluded-alphabets.png`, `budget-equal-head-quarter-pairs.png` and `vocabulary-design-multilingual-tokenization-text-zoom.png`. They show an honest undefined zero-exposure state, missing-alphabet state, tied/untied matrix accounting and the text-enlargement issue described above. Root's local equation containment fix was verified at 320px after separating the two metric equations; no shared math style was changed.

Independent review found a zero-share Python composition defect: the word-weight counter retained zero-valued words although the reused BPE trainer requires positive weights. It now excludes zero-share collections before counting; a new executed fixture verifies the entire composition and excluded alphabet. An empty positive-share collection raises instead of silently losing mass. The independent reviewer also found that the provenance originally hashed an LF payload before Windows newline translation; it now records exact distributed JSON bytes, and the verifier checks that declaration against the file. These corrections change neither the actual native corpus content nor the reported tokenizer results.

# Independent review — subword tokenization

Reviewed 28 September 2026 by the multilingual-vocabulary agent, independently of the subword lesson's author. `independent-review.json` binds the exact manuscript, design, public programs and data, browser model/components/styles, blueprint and inspected author outputs. The reviewer read all of those teaching and runtime sources. This is a source/pedagogy and computation review; root owns browser interaction, screenshot and build evidence.

## Result and complementary checks

No blocking content, algorithm or learning-flow issue remains in the reviewed source. The removed legacy throughput claims are not reinstated: the lesson separates shape accounting from time, matched inference from independent training, and preserved spelling from task understanding.

A final CSS-only review covered the mobile lattice-label increase from 14 to 20 SVG units below 480px. Its source binding is updated with a separate follow-up timestamp in the JSON; the prior numerical execution timestamp is preserved. Root verifies actual rendering. No changed-model execution is implied by this layout review.

A packaging follow-up independently verified the Alice files' CRLF-to-LF conversion: reconstructing their former CRLF bytes reproduces both previously reviewed checksums, and parsed paragraph lists remain exactly equal (18 training, six held-out). Scoped Git attributes enforce LF. The receipt binds the updated data/provenance and records this separate proof; it preserves the actual earlier native execution rather than claiming retraining.

The final prose clarification was checked against `apply_bpe`: O(M) rank-map construction occurs within each nontrivial standalone call, separately from O(n log n) heap work. The manuscript now describes caching as a throughput improvement rather than implying it exists already. Only the text and author evidence changed; the review records a separate content follow-up and preserves the prior numerical execution.

The independent script `scripts/review-subword-tokenization.py` adds cases different from the author's numerical campaign:

- A ranked-neighbor cascade on `abca` yields `a | bca`, not a greedy initial `ab` commitment.
- Three copies of `aaaaa` contain twelve overlapping `a+a` occurrences but permit six replacements; the resulting pieces retain the separate boundary marker.
- Actual native WordPiece agrees on `café`, its differently normalized combining-accent spelling, and an `abc` counterexample with a valid non-greedy alternative. Whole-word fallback and absent normalization are kept distinct.
- A new three-path Unigram example gives total weight 9/64, expected-count numerators 6, 5, 4, 4 over denominator 9, then EM probabilities over denominator 19. Excluding `aa` at fixed remaining weights leaves mass 5/64. This independently checks marginalization, fractional credit, the M-step and the stated pruning objective.

The author separately provides broad recount/list/lattice oracles, native inference, seeded posterior sampling and JS/Python comparison. Those records were inspected rather than represented as independent executions by this reviewer. The review does not infer speed, pretrained quality or multilingual generality from local CPU fits.

## Learning-experience review

1. **Entry and route:** unfamiliar `lowest` motivates the problem before vocabulary/IDs. The opening identifies a useful first pass and a return branch for exact probabilistic training; prerequisites are explicit.
2. **Caution placement:** the local toy-dictionary scope, WordPiece trainer reconstruction, pruning approximation and corpus comparison limits each appear at the relevant decision. They do not overwhelm the opening or become the main story.
3. **Purpose across transitions:** count-based construction leads to ranked inference; WordPiece then changes the decision rule; Unigram asks why one must compare complete paths. SentencePiece is introduced as a pipeline/toolkit after the three mechanisms are distinguishable.
4. **Labs:** corpus and merge edits operate immediately, the query does not retrain, missing WordPiece continuation produces the actual failure, and a probability change moves posterior mass and expected counts. Empty corpus/query and removal of the whole Unigram piece have meaningful states. No prediction entry or answer-unlock gate exists.
5. **Visual semantics:** token positions are labeled as positions rather than IDs; pipeline losses are explicit. The lattice locates letters between boundaries and separates edge geometry from numeric mass. Root verifies actual paint, dimensions and controls.
6. **Local intuition:** overlapping counts, tied merges, prefix commitment, sum-versus-max recurrence, fractional EM credit, log-space arithmetic and fixed-weight pruning all have local explanation and concrete consequences. The same `ab` example connects conditional path weights to training updates.
7. **Implementation depth:** BPE's owner-index/heap mechanism, rank-heap encoding, two WordPiece tries and log-space lattice are real scratch algorithms with explanations. Controlled native comparisons hold the relevant artifact fixed. The ordinary trainer workflow saves/reloads its artifact and reports actual unknown spans and preserved-whitespace behavior.
8. **Practice and feedback:** changed counts, a greedy-path trap, changed probabilities, a slower independent oracle and a changed library setting have separate hints and solutions or acceptance criteria. Practice extends the lesson rather than only copying its defaults.
9. **Resources and ownership:** full code is visible through shared code components; files have stable topic ownership. The literary input has attribution, split and hashes. References explain when to read them; the video link does not claim a viewing that was not performed. Byte coverage and multilingual vocabulary decisions connect to their actual next lessons.
10. **Limits:** no learner study, deployment, full video viewing or independent rendered-browser observation is claimed by this review. Root integration supplies rendered checks and preserves any specific remaining limitation in the final ledger.

## Targeted primary-source verification

The reviewer consulted the [original BERT tokenization source](https://github.com/google-research/bert/blob/master/tokenization.py) for greedy continuation and whole-word failure, [Hugging Face's WordPiece chapter](https://huggingface.co/learn/llm-course/en/chapter6/6) for the explicitly reconstructed training rule, and [Kudo's Unigram paper](https://aclanthology.org/P18-1007.pdf) for marginal training and segmentation sampling. These checks support the stated distinction between a teaching implementation and an exact reproduction of a maintained trainer.

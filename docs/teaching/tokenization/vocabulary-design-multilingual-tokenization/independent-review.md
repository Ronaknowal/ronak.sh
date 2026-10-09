# Independent review: Vocabulary Design & Multilingual Tokenization

Reviewer: byte_tokenization (not this topic's author). Date: 28 September 2026. Disposition: substantive source review passed after two findings were corrected. Production-browser acceptance remains root's separate integration gate.

## Reviewed surface and method

Read the complete learner-facing JSX, blueprint, design map, both live labs and all three figures, pure JavaScript model, all three public Python programs, redistributed FLORES data/provenance, and native/model receipts. Inspected the preceding BPE owner's actual positive-weight and ranked-encoding contract. `independent-review.json` binds the exact reviewed learner/program/model sources and evidence; later visual formatting should be checked against that binding.

This was a teaching and implementation review, not a heading or checklist count. Traced the first-pass path from coverage through denominators, mixture weighting, physical costs, preprocessing and held-out experiments. Traced the deeper migration branch into actual row ownership, tied storage and changed softmax normalization. The explained scratch code owns the new weighting/measurement/migration mechanisms and directly reuses the earlier tokenizer engine. The ordinary SentencePiece experiment has explicit options and actual data; no trained language-model outcome is implied.

Complementary primary-source checks read XLM-R sections 3 and 5 (https://aclanthology.org/2020.acl-main.747.pdf), SentencePiece options/normalization controls (https://github.com/google/sentencepiece/blob/master/doc/options.md), and FLORES source/license pages (https://github.com/facebookresearch/flores and its flores200 directory). XLM-R's .3 exponent is correctly a reported setup choice, not a universal optimum. The current options page also documents newer flags, which this executed 0.2.2 lesson does not require.

## Findings closed

1. **Zero-share corpus composition.** The Python weighting helper originally retained zero-valued words, which the actual reused BPE trainer rejects. Reproduced `cat=1, dog=0` failing in `train_bpe`. Author now skips zero-share collections before counting and explicitly rejects an empty active collection rather than silently dropping its mass. Independently re-ran the exact composition: only cat remains, encoding round-trips and excluded d is absent from the alphabet. Native verifier includes both cases.
2. **Distributed sample checksum.** Public provenance originally named the pre-write payload hash rather than the actual distributed JSON file. Independent SHA check caught Windows newline translation. A follow-up found `core.autocrlf=true` would also change the downloaded file across platforms. Root added a narrowly scoped `.gitattributes` LF rule; the author normalized this JSON to explicit LF bytes and asserted all 360 parsed records remain identical. Provenance and the verifier now agree on exact SHA `3d5295ea2bebf100a0f95463f20fd0386665c84b8604fd6f65c7e9a58790a0d7`. The native receipt preserves the actual scientific execution time and separately records the byte-only follow-up. Text content and results were unaffected. This reviewer re-executed the checksum/data checks after normalization.

The root's narrow/text-zoom CSS correction was reviewed in source: intrinsic em-based grids now let comparison, matrix and result panels stack when text needs more width. It changes layout, not computed outcomes. Root will inspect the final production rendering.

## Complementary executed checks

Executed the complementary checker with bytecode generation disabled, then preserved it as `scripts/review-multilingual-vocabulary.py` and re-ran it from the repository root. In addition to reproducing and closing both findings, checked order-invariant sampling at three exponents, exact sum normalization, deterministic largest-remainder ties, a ratio-of-totals counterexample, UTF-8 byte denominators, all 360 record identities and exact parallel split IDs, attribution URLs and sample hash. Independently compared every recorded run's token totals, code-point/byte counts, zero unknowns and round-trip flags to the supplied data and reviewed receipt. All native receipt source hashes currently match disk.

Author receipts separately record four real SentencePiece fits, actual HF/NumPy embedding extension, and 100 weighted BPE Python/JavaScript comparisons. These were read and source-bound; this reviewer did not rerun all four fits or claim GPU/deployment performance.

## Learning-experience judgement

- Coverage, compression and downstream usefulness have concrete separate examples; a six-byte/two-scalar/one-piece strip makes the first distinction inspectable.
- Sampling receives a numerical square-root derivation, an explicit unit, fixed-data baseline and a live mechanism. Zero mass and zero merges are explanatory null states.
- Budget calculations keep V, d, N, table tying, units and baseline visible. Pair counts and MACs are not sold as timings.
- Normalization and boundary policy precede the experiment; an unseen training character cannot be invented by repeating the same text.
- The real-data experiment preserves matching translated IDs and reports actual repeat allocations. Holdout and sample-size limits are concrete and local, with no population language ranking.
- Migration starts with the ID-to-row mistake, then implements exact extension and ordinary-library behavior. Expanded probability normalization is taught separately from preserved rows.
- Five practice tasks change data, dimensions or ID order; full solutions and experiment success criteria support transfer. References distinguish primary support from alternative learning material.

Actually viewed screenshots: `scratch/tokenization/browser-current/vocabulary-design-multilingual-tokenization-figure-0-desktop.png` (coverage strip) and `...-figure-3-desktop.png` (held-out counts). Both communicate their intended quantities clearly with labeled common scales and neutral/amber presentation. This limited screenshot inspection does not replace root's full controls, keyboard, mobile and production-browser campaign. No learner testing was performed.

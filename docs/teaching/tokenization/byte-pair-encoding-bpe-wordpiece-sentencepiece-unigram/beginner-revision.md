# Subword tokenization: teach the first operation before its machinery

Revision 2, 28 September 2026. The user found revision 1 difficult to read despite
its verified algorithms. [Independent comparison](beginner-review.md) records the
original/current gaps. The original source backup and revision-1 receipts remain
unchanged. This is a substantive teaching revision, not scientific recertification
through a stylesheet or ledger hash refresh.

## Complete reading-path changes

| Transition | Previously missing bridge | Revised explanation and representation |
| --- | --- | --- |
| Text to numerical input | Pieces, vocabulary and IDs assumed familiar | `TextToIdsFigure`: lowest → low/est → 7/12; every term names an object already visible. IDs are labels, not scores. Encoding/decoding follow the actual operation. |
| Why subwords | Dictionary failure arrived without a dictionary model | Compare the same spelling under a missing whole word, individual letters and reusable pieces. Coloured tokens have literal labels; meaning learning remains the downstream model's job. |
| BPE learns pieces | Weighted counts, markers and symbols compressed together | Corpus defined as training text; end marker introduced as one tile; 6+3=9 contribution; `FirstMergeFigure` compares before/after all four words. Explain why unaffected words remain unchanged. |
| Applying learned rules | Ranks appeared before a new-word trace | Train/use distinction before the lab. `BpeEncodingFigure` derives all six frames from the existing engine, ending low/est-marker. Formula reads back to the same pair count. |
| Efficient scratch implementation | Optimized full source before its operations | Plain counting snippet; concrete pair-to-words index, ranked work list, stale-entry and neighbor-link explanations; full existing program after WordPiece, with a function reading map. |
| WordPiece | Failure trap before an ordinary success | `WordPieceWalkthroughFigure`: lower vs lowest with a constructed vocabulary. Define prefix/greedy/continuation, then study abc's failure. Explain the trie with root→a→b and a small association-score comparison. |
| Unigram | Path/posterior terminology before an interpreted calculation | Define split, multiply two complete path scores, add and divide by their total. Define lattice via positions; live probabilities change the winning path. Lab's training preview explains its fractional counts rather than relying on later jargon. |
| Dynamic programming | Recurrence without stored intermediate answers | Positions 0/1/2 table, each contribution, then extend to abab to show reuse of the same prefix total; F/V notation and log multiplication-to-addition follow. |
| EM and pruning | Fractions and formulas without a reason | Expected piece uses 15/16, 1/16, 1/16 → total 17/16 → next probabilities; explain why total exceeds one; forward/piece/backward product; removing ab reduces fixed-weight support .64→.04. |
| Stable arithmetic and sampling | Implementation keywords unexplained | Concrete underflow example, log-sum-exp purpose, and multiple cuts of the same spelling as the reason for regularization. |
| SentencePiece and libraries | Toolkit/pipeline taxonomy before a visible operation | `SentencePieceSpaceFigure` exposes one space; name the stages only after the pieces are understood. A small native train/encode/decode/save/reload example precedes the complete experiment. `RecordedTokenizerFigure` displays actual recorded Alice-corpus outputs from both libraries. Explain the numeric row selected by an ID and why tokenizer/model compatibility matters. |
| Cost | Parameters and complexity mixed together | Four entries × three values before Vd; six vs two positions before T²; retain corrected accounting and actual corpus experiment. |

No scope/title change is needed. All old advanced outcomes, full public programs,
real Alice corpus experiment, verified library comparisons, practice and resource
groups remain. No unrelated topic, model/program or source mapping is changed.

## Visual and interaction specifications

All new instructional figures appear inline. Text, ordered steps and captions
reflow in HTML; token strips wrap and before/after lanes stack at narrow widths.
Five muted semantic hues identify repeated token strings by a deterministic hash;
hues can repeat and are not IDs. Text and boundaries remain primary. A separate
amber outline marks a selected merge. Backgrounds stay neutral.

- Text/pieces/ID journey: an explicitly invented dictionary, ordered correspondence,
  no implicit embedding knowledge; IDs 7/12 agree everywhere in this example.
- First merge: existing exact engine supplies 95→86 total pieces and all word states;
  six newest plus three widest occurrences explain the nine joins. Word-end marker
  remains one tile. Inspect before and after at desktop and mobile.
- New-word encoding: six frames from zero through five learned merges, same spelling
  throughout. No new training counts. This distinguishes encoding from fitting.
- WordPiece success: fixed low/lowest/##er/##est vocabulary; outputs checked against
  the unchanged native scratch encoder before presenting the harder abc lab.
- Space representation: constructed low/▁low split, no dummy prefix; settings and
  possible alternative learned pieces stated adjacent to the diagram.
- Recorded library outputs: show the exact piece arrays from the retained native
  Alice experiment, with library/settings provenance and the same visible input.
  Do not replace observed arrays with hand-constructed segmentations. This brings
  the lesson to eight independent instructional figures, alongside three labs.
- BPE lab now starts and resets at zero merges. Existing editable corpus, query,
  stepper, unknown/empty inputs, ranks and counts remain. Plain labels explain
  outputs and the selected-pair outline; no answer gate is added.
- Unigram probabilities, outputs and EM table are unchanged; adjacent explanations
  establish every quantity before the reader must interpret it. Path edge colours
  aid tracing without replacing the character labels or positions.

## Research used

The [Hugging Face BPE lesson](https://huggingface.co/learn/llm-course/en/chapter6/5)
motivates retaining a visible corpus through count/join/recount before code.
[WordPiece](https://huggingface.co/learn/llm-course/en/chapter6/6) and
[Unigram](https://huggingface.co/learn/llm-course/en/chapter6/7) supply alternate
worked explanations and important training distinctions. The
[minbpe source/exercises](https://github.com/karpathy/minbpe) organize progress around
first implementing an understandable operation, then adding one new complication.
These structures informed original explanations with the existing lesson's
examples. Pages/source were read; full video viewing is not claimed. Scientific
claims retain the primary references and exact verified source of revision 1.

## Evidence and continuation

`scripts/verify-tokenization-teaching-examples.py` executes the actual displayed
Counter and ordinary Tokenizers train/encode/decode/save/reload snippets and
validates first merges, new-word output, familiar WordPiece cases, posterior/EM
arithmetic, shared-prefix abab totals, changed probabilities and cost arithmetic
against the retained scratch implementation. The final source-bound run passed.
The native library snippet prints `['lo', 'w', 'est</w>']` and round-trips `lowest`;
the adjacent explanation distinguishes this learned dictionary from the earlier
scratch dictionary. All three canonical
Python programs, datasets and the numerical browser model are unchanged; reuse
their earlier scientific campaigns by exact hash, not by inference from page text.

Independent full-page beginner review and production visual/browser observations
close this revision separately. The central beginner integration receipt supplies
final states and source identities; this design does not claim learner-study proof.

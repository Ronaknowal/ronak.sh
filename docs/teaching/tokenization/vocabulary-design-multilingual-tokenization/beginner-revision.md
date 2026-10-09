# Beginner-first revision: vocabulary design and multilingual text

28 September 2026. This is the authorized follow-up after the user found the rewritten tokenization lessons too compressed and difficult to understand. It records the new prose/visual revision; earlier design, numerical receipts, reviews and archived original lessons are preserved.

## What the comparison revealed

The original lesson made multilingual token costs tangible through visible pieces and a practical motivation. However, its invented comparisons, language-wide cost claims and overconfident vocabulary recommendations could not safely be restored. The first corrected implementation kept rigorous measurements and useful programs, but introduced ratios and caveats before establishing what a dictionary entry, token sequence, training collection or embedding row actually was. It asked a beginner to interpret alpha, occurrence mass and matrix costs without enough worked intermediate states.

The revision restores the original's visible connection between input and pieces with newly constructed, explicitly labelled examples. It keeps the verified numerical engines, real FLORES subset, scratch algorithms, normal library programs and solved practice.

## Complete reading path

| Hurdle | New explanation and visible operation |
|---|---|
| Vocabulary versus message length | A four-letter dictionary spells cat/cats in seven pieces. Choosing cat as the fifth entry yields three message pieces; choosing cats instead yields four. Show dictionary entries and grouped word pieces side by side. State the hand-chosen, per-word longest-match convention. |
| Coverage versus compactness | The same 猫猫 is six UTF-8 byte pieces, two character pieces or one hypothetical whole-string piece. Explain coverage, unknown collapse and byte fallback before using them as diagnostics. |
| What fertility measures | Show one piece for cat and two for cats, then (1+2)/2=1.5. Count split words separately. Only afterward compare constructed 12/18 translated messages and their distinct word denominators. |
| What corpus weighting changes | Define corpus, weights and shares. Transform 9:1 through square roots to 3:1, then 75%/25%. Explain each operation before the alpha formula. |
| Why pieces change abruptly | Live lab exposes all six fixed training words, labels the end marker and shows baseline/current pieces before the actual winning joins. Controls use plain terms; strings and tested algorithm are unchanged. |
| Sampling unit and integer plan | Distinguish document shares from word shares. Work through 12 draws with .9/.1, floors and a remaining draw. Clarify that the real run allocates 30 total whole-collection passes. |
| Why an entry occupies memory | Trace cat → ID4 → an actual five-row, three-column illustrative table. Count 5×3 before realistic V×d. Define embeddings, output head, weight tying and multiply-accumulates. |
| Vocabulary work versus sequence work | Equal-sized cells expose 4×5 and 2×10 output scores; separate 4×4 and 2×2 unrestricted attention grids expose the different change. Explicitly distinguish the preceding byte lesson's causal triangle. |
| Where preprocessing loses information | Résumé and resume converge under accent stripping. Show the many-to-one operation; explain why the intended task can choose or reject it. |
| What scratch code contributes | A helper table traces weights → shares → weighted counts → audit. Work through solar's .75×2/3 + .25×1/3 contribution. Reuse the canonical BPE owner rather than duplicate it. |
| What the real experiment compares | Draw 300 training sentences → four settings → the same 60 held-out sentences. Explain holdout and repeated exposure before interpreting actual library counts. |
| Why changing IDs can break a model | Trace three address routes: original solar row, wrongly swapped cost row, newly appended photovoltaic row. Define raw score/logit and show unchanged scores sharing probability among four versus five candidates. |
| Applying the result | Retain diagnosis/intervention table, scientific identifiers and retrieval-chunk examples. Keep five solved transfer exercises and the separate research/reference/next-topic sections. |

There are eleven static figures and two immediately playable labs. Eight figures are new; three prior figures are substantially clarified. Topic-specific colored pieces, numerical rows, operation grids, exposure bars and address routes have different roles. Amber/cyan/violet/rose follow explicit piece identity or labelled quantities. Neutral surfaces and themed controls remain consistent. No prediction gate or optional prediction prompt was introduced.

## Research and reuse decisions

Reviewed on 28 September 2026:

- Hugging Face LLM Course, Tokenizers: https://huggingface.co/learn/llm-course/en/chapter2/4 . Read text/word/character/subword and pieces-to-ID sections. Useful approach: expose the concrete text-to-piece-to-number pipeline before API terminology. New cat/cats example and prose are original, not copied.
- Hugging Face LLM Course, Training a new tokenizer: https://huggingface.co/learn/llm-course/en/chapter6/2 . Read corpus preparation, iterators, initial segmentation and changed dictionary sections. Useful approach: inspect the same input before/after and distinguish tokenizer fitting from model training. Existing real-data experiment remains independently reproducible; no tutorial timing claims were imported.
- Jay Alammar, The Illustrated Word2vec: https://jalammar.github.io/illustrated-word2vec/ . Read vector displays, embedding lookup and language-model training explanation. Useful approach: make vectors visible as rows of numbers before discussing parameter dimensions. Our table uses explicit illustrative numbers and does not claim the pictured components have trained meanings.
- The existing primary evidence for sampling, UTF-8, SentencePiece, FLORES and vocabulary resizing remains applicable. Its actual source/configuration and limitations are preserved. No speculative model ranking or translation fairness result was added.

The HF course's embedded video remains labelled as an optional route; it was not independently watched. The word2vec link is annotated as a different training objective, useful for the embedding intuition.

## Checks and review boundaries

The changed JSX files parse with esbuild. Independent arithmetic checks verify the manual dictionary alternatives, fertility, weights, word contributions, byte spelling, table size, output-score/full-attention cell counts and four/five-way probability shares. The new record verifies that the source hashes in the retained native/model receipts still match; those unchanged actual executions are reused, not claimed to have been rerun.

Complementary review by the byte-lesson author found three clarity gaps that are corrected: total 30 passes versus per-collection wording, unrestricted N² versus causal pairs, and defining logits before softmax. Its visual review also motivated a shared grid-cell size so equal operation counts do not appear to occupy unequal colored areas. The grid scale is constrained by the widest ten-cell case and remains responsive.

Root owns build, browser interactions, screenshots, narrow/zoom checks and final ledger acceptance. Source parsing and numerical identity alone do not certify the new rendering. No learner study has been performed; pedagogy assessment is an expert heuristic review.


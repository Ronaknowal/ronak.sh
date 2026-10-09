# Vocabulary Design & Multilingual Tokenization — revision 1

Mode: full. Owner: multilingual_vocabulary; integration owner: root. Date: 28 September 2026.
Stable ID and legacy source `src/learn/data/topics/vocabulary-multilingual.jsx` remain unchanged. No title change is justified: existing title fits the expanded complete workflow.

## Baseline and intended outcome

The old lesson covered useful subjects—fertility, sampling, vocabulary/matrix cost, multilingual failure cases—but lacked complete runnable fixtures and live investigations. Its purported measured tables lacked reproducible inputs, Gemma 2 measurements were attributed to an earlier paper, and several conclusions incorrectly equated token ratios with latency or language quality. The improved lesson preserves those useful subjects while replacing unsupported product rankings and numerical curves with a transparent experiment and exact calculations. No destination note existed. The routing inbox had no relevant unresolved item.

Learners should design and reproduce a tokenizer comparison: specify text transformations and supported units; derive/reweight a training mixture; measure declared denominators on held-out parallel text; explain memory and sequence tradeoffs; preserve model/tokenizer ID compatibility when adding rows; and defend a design using per-language diagnostics plus task evaluation. A small tokenizer does not implement an LLM; downstream pretraining and multilingual task evaluation are explicit later work, not fabricated results.

## Concept-by-concept learning map

| Hurdle | Bridge and representation | Meaningful assessment |
|---|---|---|
| Coverage versus useful compression | Same text `猫猫` as bytes, codepoints and one learned repeated piece; byte universality does not imply short sequences | Explain lossless output with high fallback |
| Choosing a denominator | Worked translated-document counts versus whitespace units; measured table retains raw counts and units | Diagnose an invalid Chinese fertility claim |
| Frequency becomes a finite allocation | Weighted tiny BPE lexicons; edit source masses and α, see shares and resulting merges/segmentations | Find a redistribution that helps one held-fixed string |
| Fractional-power sampling | 80:15:5 → square roots → normalized shares; raw and reweighted proportional bars | Derive 9:1 at α=.5 |
| Sampling unit and exhaustion | Largest-remainder repeated-corpus counts; realized ratios and repeat exposure | Distinguish sentence, word and byte shares |
| Bigger vocabulary has physical cost | Live matrix-row budget, tied/untied arrays and matched input token counts | Calculate bytes/MACs under changed dimensions |
| Preprocessing defines what can be represented | Visible text → normalization → boundary → ID row pipeline; direct `ﬁ`/`fi` example | Identify irreversible distinctions and blocked merges |
| Intrinsic metrics versus model outcome | Fixed-input, same-algorithm real-data 2×2 experiment with interpretable null effect | Explain why lower token count is not an accuracy measurement |
| Artifact compatibility | ID/table row correspondence, append preserves old rows while replacement remaps them | Find reordered-ID corruption |
| Expansion changes probability | Four equal logits yield .25; fifth equal logit yields .2 despite unchanged old rows | Explain why preserving vectors is insufficient |
| Research/engineering decision | Small controlled grid, reference implementation, ordinary library, failure diagnosis | Held-out design report with explicit success criteria |

The opening supplies a first-pass route; advanced migration and scaling branches remain visible, not behind disclosures. The continuing question is serving the same content under a bounded vocabulary; the real FLORES experiment comes after metric and mixture mechanisms are established.

## Implementation ownership

| Mechanism | Scratch owner | Library route and bridge |
|---|---|---|
| BPE merges/rank encoding | Exact prerequisite `public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/subword_tokenizers.py`; weighted positive finite word-count API inspected | SentencePiece BPE is separately configured; do not assert identical learned merges across different preprocessing/ties |
| Sampling and integer apportionment | `public/learn-code/vocabulary-design-multilingual-tokenization/vocabulary_audit.py` | Same shares passed to the SentencePiece corpus iterator; report actual repeat counts |
| Audit denominators, parallel token premium | Same public program, one streaming pass over documents; O(total text+token count), O(number documents) retained lengths | SentencePiece encode/unknown/byte APIs feed the same metric contract; independently sum token lengths |
| Vocabulary extension | `vocabulary_migration.py::extend_rows`, O((V+k)d) output with preserved existing rows | Actual HF tokenizer `add_tokens` and model `resize_token_embeddings`, explicit identical mean initialization, tied output table |
| Corpus training and serialization | BPE owner; no duplicated tokenizer algorithm | `multilingual_sentencepiece.py`; real CPU fitting and encoding, no model download needed |
| Unicode representation | Byte-level/Character-level lesson's UTF-8 and normalization explanation | Local policy discussion only; no duplicate decoder implementation |
| Downstream LM quality | Later language-model training/evaluation owners | Local decision criterion, not claimed to be executed |

## Visual and live investigation contracts

1. **Coverage strip** beside section 1. Constructed `猫猫` has six UTF-8 bytes, two codepoints, one hypothetical learned whole-string token. Display three distinct labeled symbol rows, exact quantities, no interactive-looking tracks. It illustrates units, not an actual pretrained tokenizer. Mobile chips wrap while logical order remains intact.
2. **Mixture lab** beside section 3. Three fixed artificial lexicons (`cat/cats`, `घर/घरों`, `猫/猫咪`), manually adjustable nonnegative language masses, α in [0,1], bounded merge budget. Recompute normalized shares, weighted pair selection, final token strips and per-lexicon token counts immediately. Reference α=1 comparison uses identical masses/budget. Empty mass retains prior valid values through shared controls; zero-total state is explicit. Zero-mass languages receive no inferred corpus; show unsupported characters honestly if inspecting an excluded lexicon. At α=1 the two outputs match; α=0 equalizes positive language mass; fixture alternatives and tie rules are checked. At least one editable mass changes the corpus entities beyond presets. Explain finite-capacity tradeoffs with actual changed states, not promised universal gains.
3. **Budget lab** beside section 4. Live V (32–256 thousand), d (256–8192), tied toggle, and exact N_old/N_new sequence lengths. Show one or two proportional matrix-storage bars, parameters, MiB at two bytes, logits MACs N×V×d, and per-layer attention-pair ratio (N_new/N_old)^2. Hypothetical shape accounting, not measured timing or a learned compression curve. Default V=128000,d=4096 =>524288000 tied parameters and1000MiB. Double V then halve N: head MACs remain equal while attention-pair count quarters. Scalar/matrix labels reflow in HTML and retain same scales; no arbitrary minimum bar size.
4. **Compatibility figure** beside section 8. Token→ID→row correspondence for old `[UNK],solar,panel,cost` and appended `photovoltaic`; unchanged IDs1,2 still reach original rows. Show replacement permutation as separate table; positions encode correspondence, not similarity. Phone stacks tables.
5. **FLORES results figure** beside actual experiment. Exact checked results from four runs; paired proportional count bars on common zero baseline within each language; all token counts labeled. A selected sentence's source text can remain in downloaded sample; no synthetic translated snippets mislabeled as actual experiment. Wider corpus differences are not encoded as semantic-quality scores.

Quantitative classifications: mixture arithmetic and matrix budget are exact calculations; BPE miniature is a deterministic controlled simulation; FLORES table is a recorded CPU experiment. No invented empirical curves remain.

## Research and canonical coverage

Read 28 September 2026:

| Source / locator | Used for | Reading and boundary |
|---|---|---|
| https://aclanthology.org/2021.acl-long.243/ and linked PDF, Rust et al., *How Good is Your Tokenizer?* | Canonical metrics/controlled monolingual-versus-multilingual evaluation and adaptation | Abstract and relevant PDF metric/method sections; fertility depends on word segmentation and data; no wholesale product ranking |
| https://arxiv.org/abs/2305.15425 (Petrov et al., NeurIPS2023) | Parallel-text token length disparity | Abstract/definition in paper; no copied table or universal fifteenfold statement |
| https://aclanthology.org/2020.acl-main.747.pdf sections3,5;figures5,6 | Sampling law, capacity/vocabulary distinctions | α=.3 is this model's reported choice, not a universal optimum or incorrect tokenizer=.3/LM=.5 split |
| https://github.com/google/sentencepiece and doc/options.md,doc/normalization.md | Training API, coverage, normalization, fallback, actual vocabulary | Current source documentation read; executed wheel0.2.2 snapshot; avoid assuming new0.2.3 flags exist |
| https://huggingface.co/docs/transformers/main/en/main_classes/model#transformers.PreTrainedModel.resize_token_embeddings | Row append/retie/initialization semantics | Actual library demo uses explicit initialization instead of inferring guarantees from defaults |
| https://huggingface.co/learn/llm-course/en/chapter6/2 | Alternate teaching: corpus first, trained artifact second | Text and code read; embedded video not watched; reference labels this clearly |
| https://github.com/facebookresearch/flores/tree/main/flores200 and root license section | Real multilingual text provenance | Archive original release, per-row article attribution and CC-BY-SA4.0 preserved |

Canonical coverage decisions: fertility and continued-word fragmentation are explained; parallel premiums and lossless coverage are distinct; include shared-vocabulary capacity tradeoff, pretrained-ID compatibility and normalization constraints. Vocabulary replacement/adaptation is possible with training, not forbidden. Byte/character neural architectures belong to the exact preceding lesson. Task-specific multilingual fairness and translation evaluation are linked to future evaluation topics rather than falsely solved by equal token counts. No separate new topic is required.

## Practice, caution and evidence plan

Changed exercises: 9:1 sampling; a denominator mistake with Chinese; 64000×2048 tied/untied memory; altered head-MAC and attention counts; reordered old IDs; held-out report with repeat-count and fallback diagnostics. Hints and full worked solutions remain distinct native disclosures. No lab requires prediction entry.

Cautions have one home each: section2 metric comparability; section4 shape accounting; section6 tiny-corpus scope; section8 migration semantics. Do not repeat a disclaimer after each result. Real data accompanies the scratch fixture. Displayed programs separate small plausible-input checks from mechanisms and print only structured results.

Content checkpoint: complete learner-facing manuscript in the stable JSX source; complete three public programs and supplied real data under `public/learn-code/vocabulary-design-multilingual-tokenization/`; scoped blueprint and these visual specifications. The prerequisite scratch implementation at `public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram/subword_tokenizers.py` was inspected and the composition uses its actual API. Native evidence records five complementary check groups, four actual SentencePiece fits and exact row-extension comparison; model evidence compares 100 browser/Python configurations. `author-review.md` records the complete learning pass, viewed desktop/narrow/changed screenshots and corrections from independent review. Zero-share word counts and the distributed-file provenance hash were corrected and checked. Root owns final production rendering, loading/build and ledger closure. No learner testing claimed.

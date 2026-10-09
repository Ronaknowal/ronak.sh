# NLP Libraries — full delivery

**Delivery complete — 28 September 2026.** Content and implementation are complete for this revision. Native checks, independent review and the final desktop/narrow/control/code-access verification are recorded below and in [the integration receipt](../integration-checks.json). Current status lives in the central ledger. No next action remains for this authorized increment; user acceptance is separate. Earlier checkpoint wording below describes the author/review sequence, not a pending queue.

Stable title retained: operational representation/pipeline depth, not a competing full NLP architecture course. Preflight planned, both phases not started, no destination notes. Annotation workflow immediately precedes this lesson. Prior HF and DL owners retain checkpoint loading and architecture mechanisms.

## Content checkpoint — 28 September 2026

Complete manuscript: `src/learn/data/topics/nlp-libraries.jsx`; complete explained programs: `public/learn-code/nlp-libraries/text_pipeline.py` and `subword_alignment.py`. Full-mode source serves as manuscript; no duplicate draft. Runtime specs below preceded implementation. Central ledger and publication remain parent-owned.

| New conceptual transition | Support and assessment | Ownership |
| --- | --- | --- |
| Source coordinates → tokens | Asha sentence, original slices, Unicode conventions and live span inspector (§1) | Local linear tokenizer, no claim of universal word segmentation |
| Tokens → non-overlapping annotations | BIO worked sequence, strict boundary rejection (§3) | Local sorted linear alignment, spaCy char_span comparison |
| Rules → a reusable pipeline | Known-name baseline, changed unknown phrase, component order and serialization (§4) | spaCy EntityRuler/sentencizer/pipe/save/load actual route |
| Output → meaningful score | Exact span mismatch, global counts vs per-doc average (§5) | Local set-based P/R/F1; fitted-model evaluation methods reused |
| Words → subword loss positions | Ownership strip, first-piece labels and separate attention/loss masks (§6) | Local tokenizers fixture; preceding HF owns model training machinery |
| Workflow → an engineering decision | Tool role table, redaction coordinate problem, changed independent extraction task (§7–8) | Local interfaces; no giant model downloads |

## Visual specifications

**Text/offset investigation (§1).** Start with `Asha moved to New York.` and selected code-point span [14,22). Show the original characters with indices, selected substring, tokenizer chips with start/end, strict BIO alignment. Edits: textarea limited to200codepoints, start/end sliders+numeric counterparts, transparent alphanumeric/punctuation vs whitespace-only policy. Invalid span is visible as invalid, not silently expanded; no entity label is invented. Coordinates use Unicode code points in both JS and Python; combining sequences remain separate and the policy is explicitly non-linguistic. Edit start15 to show partial boundary; whitespace mode makes York. one token; empty input has no tokens/alignment; reset restores full fixture. Every valid edit updates all views immediately; start/end are selected annotation coordinates, not answer guesses. Responsive character/token wrapping; never horizontal crop of source text. Max200characters bounds DOM.

**Subword ownership figure (§6).** One input word playing → two pieces play/##ing, wrapped by CLS/SEP. Show source word owners None/0/0/None, attention 1/1/1/1, loss labels -100/0/-100/-100 in aligned columns with a readable legend. Plain HTML wraps into per-piece cards on phones. Explain special tokens can attend without having a supervised token loss. Actual tokenizers program supplies expected values; static figure must not resemble a draggable control.

## Research/claims

Checked 28 September 2026: spaCy linguistic-features (non-destructive offsets), Doc API (strict char_span; view semantics), EntityRuler API (overlap precedence, non-overlap Doc.ents, overwrite behavior), processing-pipelines (components, pipe and dependencies). NLTK book chapter3 was read for raw text/normalization/tokenization teaching; spaCy course chapter1 structure plus substantive matching/API docs informed progression from Doc/Span → annotations → rules. No entire-video viewing claim. HF token-classification tutorial supports first-piece -100 policy; it is one objective convention, not universal.

The unversioned Tokenizers Encoding page currently describes incomplete rc0 bindings; therefore the lesson references the stable v0.20.3 API page and separately records execution with tokenizers0.23.2. This is a substantive source discrepancy, not a reason to claim all latest APIs work. Actual installed APIs were executed.

Sources: `https://spacy.io/usage/linguistic-features`, `https://spacy.io/api/doc`, `https://spacy.io/api/entityruler`, `https://spacy.io/usage/processing-pipelines`, `https://www.nltk.org/book/ch03.html`, `https://course.spacy.io/en/chapter1/`, `https://huggingface.co/docs/transformers/main/en/tasks/token_classification`, `https://huggingface.co/docs/tokenizers/v0.20.3/en/api/encoding`.

Native programs ran on Python3.12.14, spaCy3.8.16 and tokenizers0.23.2. Exact displayed offsets, BIO, two rules, changed York failure, strict char_span failure and saved/reloaded outputs passed. `scripts/verify-framework-data-contracts.py` also checked Unicode source slices, partial-token rejection and an exact-boundary scoring counterexample. `node scripts/verify-framework-data-contracts.mjs` passed initial/partial/whitespace/emoji/empty cases. Exact versions and public-source hashes are in [the shared native evidence](../computer-vision-libraries/native-evidence.json); `author-evidence.json` binds this topic's manuscript/runtime/blueprint. No trained recognizer quality study is claimed.

Author heuristic learning review: the character-coordinate view introduces source ownership before token IDs; strict alignment visibly rejects a tempting incorrect boundary; BIO follows its worked sequence; the rules pipeline returns to the same span contract before testing a changed phrase; the score counts exact entities and the subword figure separates word ownership, attention and loss. Both programs expose the mechanism and ordinary API route. A neutral/amber visual style, visible practice prompts and source annotations are present. This is not an independent or observed learner review.

Rendered author refinement: inspection of the parent's desktop capture showed the code-point strip was too small. Cells now use a 36px basis with wrapping, 16px characters and 12px indices; source-textarea background and focus are explicitly neutral/amber. The browser model and native code are unchanged. Parent reported successful baseline desktop/narrow interactions and shared copy/download checks; targeted typography recapture and final integration remain parent-owned.

[Independent review](independent-review.md) by frameworks_functional_tracking is complete with no open source blocker; `independent-review.json` binds the reviewed source and 576 complementary strict-boundary cases. The author inspected the final desktop, 320px and edited Unicode/invalid-span captures: enlarged character/index cells are legible, wrapping preserves order, selected text and token labels agree, and textarea focus is visible. This is a painted-output author pass, separate from the parent's interactive browser checks.

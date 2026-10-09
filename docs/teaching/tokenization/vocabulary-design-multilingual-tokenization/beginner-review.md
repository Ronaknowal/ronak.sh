# Independent beginner reading review

28 September 2026. Reviewer: byte-tokenization agent, independently of the vocabulary author. This review covers the current beginner revision of `vocabulary-multilingual.jsx`, all eleven figures, both live labs and their scoped CSS. It does not replace the earlier native experiment receipts or claim that a real novice was observed.

## Reading-path findings and closure

The previous revision established the correct design and evaluation contracts but asked readers to interpret compactness, sampling, matrix cost and migration before seeing their operations. The new reading path starts with the literal choice between adding `cat` and `cats`, preserves the visible pieces, and repeatedly reconnects the larger mechanisms to that example. Technical terms now follow their concrete jobs rather than acting as substitutes for explanation.

Four bounded findings were sent to the author and closed in source:

1. **Finite repetition budget:** “30 whole passes over each collection” could suggest 90 passes. The text now says 30 passes total across three collections and traces 24 + 5 + 1. This agrees with the unchanged runner.
2. **Attention-count continuity:** the preceding byte lesson counts a causal triangle, whereas this lesson displays full squares. Section 4 now distinguishes unrestricted N² from N(N+1)/2 causally allowed pairs, so a learner need not infer why the formulas changed.
3. **Migration terminology:** section 8 now defines logits as raw candidate scores and describes softmax before showing the five-way denominator. The old-row/new-probability distinction is locally understandable.
4. **Comparable visual units:** output-work grids originally filled the same width with five or ten columns, so identical twenty-score cases occupied different coloured areas. They now use the same constrained cell size in every grid. Equal counts have equal cell area, while the attention example visibly drops from sixteen to four cells. Root's browser pass owns final narrow/zoom acceptance.

## Concept-by-concept heuristic assessment

| Transition | Actual supporting explanation and assessment |
| --- | --- |
| Vocabulary versus message | Four available letters spell `cat cats`; adding one reusable entry changes seven emitted pieces to three. The hand-chosen longest-match fixture is labelled separately from a BPE merge. Dictionary size and message length are explicitly different quantities. |
| Coverage versus compactness | The repeated Chinese character has six byte pieces, two character pieces or one hypothetical whole-string piece. Labels retain the reconstruction contract; `[UNK]` explains the distinct information-loss failure. |
| Fertility and comparable content | The visible one-piece/two-piece words give three divided by two. A separate 12/18-token translated pair and 8/6-word denominators show why a cost ratio is not a fertility ratio. Aggregate counts, empty denominators and whitespace units are explained before the equations are used. |
| Sampling weights and exposure | The 9:1 → 3:1 → 75:25 sequence exposes square roots and normalization. Alpha endpoints and zero-mass exclusion are stated before the controls. Word-occurrence normalization and repeated text versus new diversity are separate explanations. |
| Live pair competition | The lab names the six actual training strings, keeps end markers visible and shows the unrebalanced baseline beside current pieces. A targeted readout confirmed the new narrative: at four merges, `cats` grows from two to three pieces, while Hindi `घर` falls from three to two under the default reweighting. This checks the new description, not a rerun of the old scientific campaign. |
| Storage and computation | An explicit five-row/three-column table defines IDs, embeddings, V and d before large memory numbers. Reading a row and scoring every row are separate operations. Common-size grids distinguish output-score work from attention pairs; the live budget retains independently editable token counts rather than assuming larger V always shortens text. |
| Preprocessing and text identity | `résumé`/`resume` visibly collide after accent stripping before normalization and boundary options are catalogued. Byte fallback and character coverage reconnect to the previous representation lesson. |
| Scratch measurement and ordinary trainer | A three-helper input/output table precedes the unchanged complete audit. The contribution of `solar` is calculated from each corpus before their weights are added. The experiment figure separates 300 fitting sentences from 60 held-out translations and four settings; exact repeat counts and returned vocabulary size are then interpreted. |
| Results and null effects | Recorded SentencePiece counts retain their original source and scope. The unchanged Chinese fallback count motivates inspecting unseen characters instead of assigning universal language costs. Tokenizer fitting is not presented as language-model training. |
| Pretrained migration | The new energy-domain example explicitly announces the changed dictionary. Following `solar` → ID 3 → the old `cost` row demonstrates the failure before resizing code. The expanded softmax bar explains why preserved old scores do not preserve old probabilities. |
| Transfer and practice | The application section returns to fixed-budget truncation, domain identifiers and retrieval chunks. Exercises change the mixture, unit comparison, matrix size, row mapping and actual experiment setting; worked results or concrete success criteria are retained. |

The complete source was read in page order, including the deeper migration branch and endings. The shared opening supplies a usable first route; instructional code remains inline, while practice answers use disclosures. The source has no learner-prediction gate. Scope qualifications are concentrated around the constructed dictionary, measurement meaning and small real experiment, rather than replacing the mechanism. Links identify the exact reused BPE program and preceding byte lesson.

## Evidence scope

All arithmetic in the added figures was traced directly: 7/3/4 emitted pieces; 3/2 fertility and 1/2 split-word proportion; sqrt(9):sqrt(1) = 3:1; 5×3 = 15 stored values; 4×5 = 2×10 output scores; 4² versus 2² attention pairs; and four/five equal logits yielding 25%/20%. The new claims agree with the existing pure model and public programs. The previous source-bound native/model evidence was checked for unchanged numerical sources and data; no retraining was performed for a prose/visual revision.

This is an independent source-level pedagogical review, with a targeted default-lab readout. It does not certify browser layout, keyboard use, font loading or every modified visual state. Root owns the current build and browser campaign, especially the narrow/zoom softmax strip, matrix row table and ten-column work grid. No actual learner test was available. The adjacent JSON binds the source reviewed and preserves those limits. The earlier design and execution receipts remain untouched.

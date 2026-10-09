# Final production visual review: subword tokenization

28 September 2026. Follow-up to `beginner-review.md`; that earlier source and
pedagogy review remains unchanged. This pass inspected the integration owner's
final production screenshots. It did not operate the browser, rerun numerical
checks or observe an actual beginner.

## Images actually inspected

The retained image root is `../beginner-screenshots/`. Within `browser/`, the
common filename prefix is
`byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram-`.

- All eight distinct static figures at 320px:
  `figure-{0,1,2,4,5,8,9,10}-320.png`.
- All three default labs at desktop and 320px:
  `{0,1,2}-{desktop,320}.png`.
- The changed-corpus and missing-starting-vocabulary states:
  `{0,1}-changed.png`.
- Three deliberately chosen mechanism states from `interactions/`:
  `bpe-overlap.png`, `wordpiece-greedy-failure.png`, and
  `unigram-whole-piece-removed.png`.

That is 19 inspected final images. The integration owner separately inspected
the desktop static figures; this report does not claim a second viewing of those.
`beginner-visual-review.json` binds the inspected pixels and current relevant
sources. Captures were read from the equivalent `scratch/tokenization-intuition/`
paths before their unchanged-byte retention in the documented destination.

## Observations

| Surface | Final observation |
| --- | --- |
| Text, pieces and IDs | The three stages stack in reading order on the narrow page. Both piece-to-number mappings remain legible, and invented IDs cannot be mistaken for a score. |
| Whole-word, character and subword comparison | The same spelling retains distinct visible alternatives. Colour, text and tile boundaries work together; the unknown result has a plain explanation. |
| First merge and saved-rule trace | The two contributing words clearly highlight e+s before joining. Unchanged words remain visible. Five successive frames expose the boundaries disappearing without losing the spelling. |
| WordPiece and SentencePiece figures | Familiar successful word cases precede failure. The continuation marker and visible space remain readable. The Alice rows expose different space handling despite equal token counts. |
| BPE default and edited states | Input, step control, selected pair, corpus pieces, query and merge history remain identifiable. The repaired instruction explicitly applies to the original corpus/query and names Reset, including after the changed corpus lacks query letters. |
| BPE overlapping-pair state | The final capture shows selected count six but four actual replacements for two occurrences of aaaa. The weighted total falls from ten to six. The next highlighted pair and row agree with the displayed state. |
| WordPiece failure states | The repaired sentence says the greedy scan could not complete the word. It is accurate both for failure at position zero and for failure after choosing ab. The deliberate greedy-failure capture shows the valid a\|##bc alternative separately from the actual [UNK] output. |
| Unigram default and removed-piece states | The default lattice shows direct and two-edge paths, positions 0/1/2 and the unequal posterior bars. Removing ab visibly removes that edge; the remaining path has 100% share, expected counts one each and updated character probabilities one half. |
| Narrow layout | Static figures and control labels remain within their columns. The narrow Unigram lattice retains legible labels and distinguishable paths. Wide diagnostic tables remain in their horizontal containers; a still image does not establish their scrolling interaction, which belongs to the integration owner's browser check. |

No new blocking visual or copy issue was found in these final captures. The two
previously identified changed-state copy defects are visibly corrected in the
production screenshots. No manuscript, component, model, design, original
rollback source or earlier frozen receipt was changed during this pass.

This is a scoped rendered-image assessment, not a claim of universal usability
or user acceptance. Direct interaction, keyboard behavior and final integration
results remain separately recorded by the integration owner.

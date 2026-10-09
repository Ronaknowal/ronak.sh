# Beginner-first revision: byte-level text and token-free models

28 September 2026. Authorized follow-up to the user's review: the previous implementation was numerically strong but too compressed for a first-time reader. This record belongs to the new revision. Earlier design, reviews, native receipts and original source snapshots remain untouched.

## Specific comparison with the original

The original lesson introduced the pressure behind a finite alphabet, used a colourful mixed-script byte grid, and narrated what each merge did to visible word parts. Those were effective teaching choices even though several surrounding empirical and technical claims needed correction. The first improved version repaired those claims and added tested programs/labs, but began with scalar counts before explaining storage, jumped from bytes to shifted targets/masks, and catalogued architectures before establishing the computation problem. A technically correct phrase such as "logsumexp of all logits" was doing work that a beginner-facing explanation should have done.

This revision restores the useful visible correspondences while retaining the corrected mechanics, exact native fixtures, library bridges and advanced material. It does not restore unsupported rankings or the original incorrect claim that crossing a character boundary makes whole-stream reconstruction fail.

## Changes along the complete reading path

| Conceptual hurdle | Local explanation and concrete mechanism |
|---|---|
| What bytes are and why 256 suffice | Bits → eight-bit byte → 256 values; Unicode supplies character numbers, UTF-8 stores those numbers. Four coloured café columns align text, code-point numbers and bytes before counts are introduced. |
| Reading hex and understanding é's two bytes | Explain base 16 with C3 and A9; show payload 00011/101001 inside two differently labelled byte prefixes; inverse arithmetic returns 233. |
| A visible character need not be one number | Decomposed accent and scientist examples precede the live inspector. Explain grapheme outlines, scalar values and UTF-16 units before asking the learner to interpret outputs. |
| Reconstruction versus rewriting | Paper-strip grouping intuition; éé bytes retain cyan/rose identity through a mixed-boundary token. NFC gets a concrete before/after byte example. |
| Why and how bytes become subwords | Five-step coloured café trace follows the actual supplied four merge rules; outer brackets are tokens while inner colours retain letter identity. Printable mapping is explained as one-to-one labels. |
| Why streaming needs state | Define a delivery chunk, then an incomplete-character waiting area. Derive the decoder's four actions and trace C3/A9 before the full scratch program. |
| What training asks the network to do | Define prefixes, ID addresses, embedding vectors and start/end/padding symbols. Three decision panels connect allowed prefix, current input and next target for é. |
| Why masks and loss exist | Explain parallel training's opportunity to peek and rectangular batching's fake cells. Derive loss from correct-target probability (.9 versus .1), then derive logsumexp from softmax before its code. |
| What each architecture changes | Establish attention relationships, local/global work and sequence reduction first. Explain encoder/decoder, hashing, weighted candidates, recurrent state and contextual patch vectors at their respective variants. |
| Why an entropy threshold might define a boundary | Explain two probability distributions visually, calculate average surprise, separate uncertainty before an outcome from surprise after it, then trace the actual [3,3,2] patch fixture. |
| What pooling computes | Show the first patch's actual constructed vectors [0,1], [1,4], [2,9] → [3,14] → [1,14/3]. Explain IDs as accumulation destinations and preserve the order-loss limitation. |
| What resources and likelihood units mean | Derive the triangle by 1+2+3, define embedding V/d, KV cache and output head, then compare total surprise per common byte count. |

The six new static figures are TextStorageFigure, Utf8PackingFigure, ByteMergeFigure, ByteTargetsFigure, ByteUncertaintyFigure and BytePoolingFigure. They supplement the three existing immediately playable labs and two earlier figures. No prediction gates or new runtime algorithms were added. Colour tracks byte/letter identity or explicitly labelled probability candidates; all controls and surfaces keep the neutral/amber theme. Colours are amber, cyan, violet and rose, with text, outlines and order supplying redundant meaning.

## Research and original teaching decisions

Re-read the complete current lesson and retained original. Consulted on 28 September 2026:

- Python Unicode HOWTO, definitions/encodings and conversion sections: https://docs.python.org/3/howto/unicode.html . Useful sequence: first distinguish character numbers from their storage encoding, then examine bytes. This informed the new original café correspondence and hex primer, not copied prose.
- Hugging Face BPE tutorial, base vocabulary and merge walkthrough: https://huggingface.co/learn/llm-course/en/chapter6/5 . Useful sequence: show the alphabet's limitation before the byte-based repair and expose intermediate merges. The new trace uses our already tested café fixture.
- Hugging Face ByT5 guide: https://huggingface.co/docs/transformers/model_doc/byt5 . Rechecked byte-to-ID offset and the ordinary library pathway; explained why IDs and control symbols must be separated before code.
- BLT paper, architecture/patching and entropy sections: https://arxiv.org/html/2412.09871v1 . Rechecked prefix-only uncertainty and local/global interpretation. The new diagrams teach the existing simplified calculation, without presenting it as a trained BLT implementation.
- Python HOWTO lists the Computerphile Unicode video. The video endpoint could not be fetched and was not watched; it is labelled as an optional source-listed introductory route, not reviewed evidence.

Primary UTF-8, normalization and model mechanism evidence from the preceding revision remains applicable where the claims and computations are unchanged. New arithmetic examples were checked directly rather than borrowing benchmark data.

## Verification and handoff

Babel parsed both changed JSX files successfully. Independent arithmetic checks confirmed C3/A9 encodes é, payload reconstruction 3×64+41=233, losses −ln(.9)=.1053605 and −ln(.1)=2.3025851, binary entropy 1 and .0807931 bits, pooling [1,4.6666667], and 10/(10 ln2)=1.4426950 bits per byte. These are exact illustrations/rounded calculations, not measurements of trained quality.

The numerical model and all four public Python programs are unchanged. Their previously recorded strict UTF-8, stream, BPE/library, target/mask/loss-gradient, ByT5 ID and pooling checks remain invariant evidence. That reuse does not certify the new prose or colour/layout. Root owns the new build, whole-reading-path review, actual browser rendering and narrow/zoom checks. Do not promote this revision from source parsing alone.

An attempted in-process Vite SSR probe produced navigation generation output but no retained completion result, so it is not counted as a passed rendering check. No public assets or shared manifests were changed by this author. New source hashes and retained invariant bindings belong in beginner-revision.json after the source is ready for review.

## Rendered author follow-up

Viewed all eight distinct figures at desktop and 320px in root's `scratch/tokenization-intuition/early-browser/` campaign: figure indices 0, 2, 3, 4, 7, 8, 9 and 14, each with `-desktop.png` and `-320.png`. Also viewed all three labs (indices 0–2) in desktop, 320px and changed-input captures: 25 images in total. The JSON lists the exact paths.

The coloured letter→scalar→byte columns, cross-boundary regrouping, five-step merge trace, three target decisions, uncertainty bars and numerical pooling remain readable when stacked. Byte identity has redundant labels and outlines; the narrow merge trace wraps distinct tokens without changing their order or grouping. The changed Unicode explorer retains the grouping and readable controls. The changed streaming capture exposes the missing final byte as pending state followed by failed finalization; it does not falsely show recovered text. The changed patch capture visibly makes every byte a patch at the low threshold.

Two focused visual findings were repaired after those captures:

- In the narrow UTF-8 packing figure, C3 fit beside its long label while A9 wrapped alone below. Each two-byte pair now has its own flex group, so the pair moves together before inner wrapping becomes necessary.
- The patch lab's 3×3 and 8×8 grids previously shared the same outer square size, making cells differ in area. They now use a common 16px cell and 3px gap: outer widths are 54px and 149px. The allowed-cell count and visible allowed area now support the same comparison. This also closes the independent reviewer's geometry suggestion.

Root must recapture the packing figure and patch grid after these source changes. Earlier screenshots establish the inspected pre-fix condition and the unchanged figures, not proof of final repaired geometry. The numerical models, programs, data and all earlier native evidence remain unchanged. Source is frozen for root's final production build/browser pass.

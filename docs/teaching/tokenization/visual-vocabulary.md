# LLM tokenization: visual vocabulary

Applies to the first three topics of Large Language Models — Architecture,
Training & Inference and their reading-flow revision of 6 October 2026.

## Reading and geometry

Introduce the question and concrete objects, show the drawing, walk through its
labels, then formalize it and connect it to code. Figures and live investigations
sit on the reading background without panel frames, separate headings or banners.
Use the existing `lesson-flow` style and `LessonFlow.jsx` controls. Keep practice,
shared openings/endings and code controls in their established presentation.

Text pieces and byte sequences are ordered strips with explicit boundaries;
dictionary IDs are indices into a labelled table, never numerical meanings of
words. Draw embedding tables as row/column grids, segmentation alternatives as
position lattices, UTF-8 as grouped bits, and model architectures as real connected
stages with visible sequence lengths. Do not substitute paragraph boxes for these
objects. One drawing introduces one mechanism; composition reuses its parts.

Use wrapping HTML labels for long explanations. At narrow widths, stack complete
stages with explicit correspondence rather than shrinking all labels. Direction
words in prose must remain true when the drawing stacks. SVG styling is scoped to
owned drawings and excludes KaTeX SVGs.

## Marks and colour

| Meaning | Mark |
| --- | --- |
| A labelled piece, glyph group or corpus followed across a transformation | Stable amber, blue, violet or rose identity hue; retain the literal labels |
| Supplied values in a diagram about roles rather than identity | Cyan with a literal label |
| Learned parameter values in a diagram about model roles | Amber with row/column labels |
| Computed scores, probabilities and aggregates | Violet with values and units |
| An operation | Neutral outline, named where it acts |
| Forward correspondence or computation | Neutral solid arrow with named endpoints |
| Currently traced occurrence or path | White outline/underline and explicit selected/traced label |
| Missing, invalid or excluded material | Dashed outline and explicit missing/invalid label |

Piece identity is the primary colour task in segmentation and correspondence
figures. A repeated piece keeps its hue through input, merge traces, dictionary
lookup and corresponding ID/row. A newly joined piece receives its own hue, while
a white outline independently identifies the active pair. Glyph-to-byte figures
can instead carry a glyph group's hue into its byte cells; local captions state
which identity is being followed. Use role colours only when the role itself is
the question, such as UTF-8 prefix/payload, probability mass or parameter values.
Do not paint all distinct pieces amber merely because they are learned.

The finite palette is a tracking aid, not an ID assignment or a semantic-similarity
scale: different labels may share a hue. Explain this near first use. Stable
corpus colours identify directly labelled languages across sampling and counts;
a neutral baseline and explicit configuration labels identify reference results.
Keep surfaces black/charcoal and controls amber; no green/olive decoration.

## Notation and continuity

Use `V` for vocabulary size, `d` for embedding width, `T` for sequence positions,
`n_i` for observed language corpus mass and `q_i` for normalized sampling share.
State local conventions when an existing verified program uses another name.
Label bytes in hexadecimal, scalar values with `U+`, and IDs as decimal dictionary
indices. Separate grapheme clusters, Unicode scalar values, UTF-8 bytes and model
positions explicitly. Show whether probabilities refer to pieces, complete paths,
sampling shares or next-symbol distributions.

The subword topic owns learned segmentation and deterministic encoding; the byte
topic owns storage, streaming and internal model grouping; the vocabulary topic
owns allocation, held-out metrics and ID/table compatibility. Refer to exact
earlier lessons when reusing these mechanisms. Preserve canonical programs and
their verified assumptions; new pictures do not silently change the algorithms.

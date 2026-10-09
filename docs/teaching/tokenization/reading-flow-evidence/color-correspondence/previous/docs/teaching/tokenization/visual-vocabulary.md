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
| Supplied text, scalar values, byte inputs, corpus observations | Cyan with a literal label |
| Learned vocabulary pieces, dictionary/model parameters | Amber with piece/row labels |
| Computed IDs, scores, probabilities, aggregates and outputs | Violet with values and units |
| An operation | Neutral outline, named where it acts |
| Forward correspondence or computation | Neutral solid arrow with named endpoints |
| Currently traced occurrence or path | White outline/underline and explicit selected/traced label |
| Missing, invalid or excluded material | Dashed outline and explicit missing/invalid label |

A token-strip comparison may use several restrained hues to track piece identity,
provided each literal piece retains its hue throughout that comparison. Those hues
do not encode numerical magnitude, semantic similarity or additional IDs. State
this once near their first use. Selection has a separate mark. Plotted languages
or architecture branches can use directly labelled series colours; language is
never inferred from colour alone. Keep surfaces black/charcoal and controls amber;
do not introduce green/olive decoration.

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

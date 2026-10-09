# Beginner-readability review: subword tokenization

28 September 2026. Initial findings after the user rejected the revised lesson's
pedagogy. This is a fresh reading assessment of the complete current
`src/learn/data/topics/tokenization.jsx`, the complete preserved
`docs/teaching/tokenization/original/tokenization.jsx`, and the current design.
It does not certify the subsequent rewrite or revise earlier frozen receipts.
No original or runtime file was edited during this review.

## Main finding

The criticism is justified. The current page often reads like an implementation
handoff: it names a mechanism, states its contract, presents code and immediately
qualifies the claim. A first-time reader needs to see why the mechanism exists,
follow its small operations, and learn its vocabulary before carrying those
terms into the next paragraph. The earlier review checked that the concepts,
figures and tested implementations were present. It did not adequately test
whether a reader could follow their transitions without supplying missing
explanations from prior knowledge.

The original has substantial factual problems that must stay corrected. It also
has teaching strengths that the revision lost: a reason to care, ordinary verbs
such as counting and joining, several code stages with interpreted output, a
visual record of how pieces grow, and an explicit transition from the mechanism
to the library. Those strengths can be retained with accurate examples.

## Specific gaps and repairs

| Location in the rejected revision | What a newcomer has to infer | Recommended repair |
| --- | --- | --- |
| Opening: unseen `lowest`, then IDs and learned vectors | What software is doing the splitting; what a vocabulary contains; why the same piece needs the same number | Begin with a familiar sentence, draw its pieces, then an explicitly invented piece→ID dictionary. Define token, tokenizer and vocabulary through that picture. Explain that numbers identify pieces, not their meaning. The neural embedding connection follows after this operation is clear. |
| Opening pipeline | Corpus, artifact, embedding table, Unicode composition, pre-tokenization and post-processing arrive within a few paragraphs | Keep the first picture to text→pieces→IDs→model. Later introduce lowercasing or spaces by showing one actual changed input. Define a corpus simply as the text used to learn the pieces. Replace “artifact” with “saved vocabulary and rules” until saving is the subject. |
| BPE beginning | Why a common pair is useful; why a new multi-letter piece still counts as one symbol | Show `n e w e s t` before/after joining e+s and the reduced number of pieces. Repeat on `widest`; show the six and three occurrences contributing 6+3=9. Then show es+t creating est. Each intermediate picture should be visible without operating a control. |
| End marker | Why the algorithm needs `</w>` rather than merely what it is called | Show the same letters at a word end and inside a longer word; make the marker visible as a boundary annotation. Explain how the saved marker helps reconstruct word boundaries. Keep the whole-whitespace-loss issue beside decoding, rather than interrupting every merge example. |
| First lab | Simultaneously interpreting weighted counts, next-pair highlighting, merge history, vocabulary size, total symbols and query encoding | Give a short fixed worked trace before the lab, then one clear instruction identifying the control and the change to inspect. Group secondary diagnostics after the current before/after token rows. Colours should follow the pieces; outlines and text preserve meaning without colour. |
| Formula and ranks | Nested sums, indicator brackets, argmax, rank, code-point ties | First say “count all neighbouring occurrences; choose the largest total.” Translate each symbol beside the already-computed 6+3 example. For encoding, show `lowest` using two or three saved rules one at a time. Define rank as position in that saved list. Move exact tie details after the learner can complete one normal encoding. |
| Optimized BPE code | Pair-to-words index, priority queue, heap, stale entry, linked neighbors, node versions | A two-paragraph list of these structures does not explain the code. Trace one merge through an affected-word list and one neighbor update. Show why an old queue entry becomes invalid. Map those operations to named functions/arrays before displaying the complete optimized file. Retain the optimized canonical implementation and its tests. |
| Full BPE/WordPiece file appears before WordPiece teaching | A large file includes a second algorithm the reader has not encountered | Explain each mechanism and show its relevant function or a small call/result beside that explanation. Place the complete downloadable module after the relevant conceptual buildup, with a reading map identifying which functions belong to BPE and which to WordPiece. The full file remains visible and available. |
| WordPiece: `abc` and longest-prefix commitment | What a prefix is; why `##` appears; why the strategy differs from merging | Start with a familiar word cut into a starting piece and continuation. Define “prefix” as the beginning of the remaining text, then perform longest-match lookup. Use `abc` afterward as a deliberately tiny failure case. Draw the chosen dead end and the unchosen complete route together. |
| WordPiece training proxy | How dividing counts changes the chosen pair; why PMI is suddenly mentioned | Work two numerical score rows, with pair counts and individual counts, so the ranking visibly reverses. State the reconstructed trainer's provenance once in its own note. Remove the unsolicited PMI correction from the first learning route; a reader never taught PMI cannot benefit from being told what this ratio is not. |
| Unigram opening | Segmentation, independent piece probabilities, path weight, conditioning, posterior | Ask how to choose between two legal cuts of the same spelling. Draw both, multiply their numbers, add the two scores, then divide each by the total. Explain that these final shares compare only ways of spelling this input. Name “posterior” after that calculation. The rejected page jumps from .6+.04 to .9375 without teaching that division. |
| Dynamic programming | Why reuse helps; prefix positions; difference between sum and maximum; why logarithms appear | After the two-path case, show a slightly longer string such as `abab` with a table of answers at positions 0–4. Compute one cell from its two incoming routes. Use ordinary products first; explain logs as a numerically stable way to replace multiplication with addition before switching V to log units. |
| Exact EM | Fractional token usage; backward weight; edge expectation; normalization denominator | First show a count table: ab gets 15/16, a gets 1/16, b gets 1/16. Total expected token count is 17/16, so the updated probabilities are 15/17,1/17,1/17. Only then derive prefix×edge×suffix divided by total. Define the E-step and M-step from those two actions. |
| Pruning and sampling | Why remove a piece, what remains, why sampled segmentations still spell the same text | Draw one candidate edge removed while another complete route survives. Explain protected character pieces through the need to keep inputs representable. Show several valid sampled cuts, their unchanged joined spelling and differing frequency. Then explain exact scoring and numerical implementation. |
| SentencePiece/library section | “Toolkit and serialized pipeline”, dummy prefix, identity normalizer, raw input, character coverage | Show a short phrase with visible space markers before naming the settings. Walk a minimal practical train→encode→decode→save/reload call sequence with interpreted outputs. Keep the full comparison program afterward. Distinguish algorithm and surrounding settings with a concrete changed-space example. |
| Cost and real-data results | Vd, output matrix, activations, T², representation contracts | Draw a small vocabulary table and a sequence of pieces. Adding rows grows one; merging pieces shortens the other. Expand a 4×4 versus 3×3 position-pair grid before T². In the Alice experiment show the same short text's actual coloured pieces beside aggregate counts, and explain one unknown span in ordinary language. |

## What to recover from the original

The original gives training a concrete rhythm: count, choose, join, repeat. It
breaks coding into pre-tokenization, training, encoding, decoding and composition,
then explains the output of each stage. Its `lowest` discussion returns to why
reusable pieces help with an unseen word. Its coloured strips let the reader see
boundaries at a glance, and its step trace makes a changed piece stand out.

Recover those teaching moves while keeping the corrected algorithms. Do not
recover fabricated tokenizer outputs, universal language rankings, unsupported
timing plots, false whitespace guarantees, or the original WordPiece/EM claims.
Removing a wrong explanation creates a teaching gap that needs a correct
replacement, not just a caveat.

The current exact programs are valuable, but the reader should not have to reverse
engineer them to learn the topic. Explain a straightforward operation first, show
how the optimized data structure performs that same operation, then keep the
complete efficient implementation. A short transparent trace or extracted
function is compatible with high-quality final code.

## Pedagogical resources examined

- [Hugging Face BPE course](https://huggingface.co/learn/llm-course/en/chapter6/5):
  repeatedly shows a small corpus, its piece inventory, a count, the selected
  merge and the resulting corpus. Only after that trace does it build the code
  in small functions. The useful lesson is to keep the visible state beside
  each operation; our examples need not copy its words or prose.
- [Hugging Face WordPiece course](https://huggingface.co/learn/llm-course/en/chapter6/6):
  reuses the preceding corpus and visibly adds continuation markers. It then
  separates saved vocabulary from encoding decisions and traces complete words.
  Our revision should preserve its explicit distinction between a reconstructed
  training recipe and the known encoder without surrounding each paragraph with
  provenance language.
- [Hugging Face Unigram course](https://huggingface.co/learn/llm-course/en/chapter6/7):
  explains vocabulary reduction as removing less-needed pieces, then admits the
  missing ingredient—the score—and builds the segmentation calculation. This
  gives the mathematics a reason to exist. Our exact EM implementation still
  requires the fuller fractional-count walkthrough described above.
- [Karpathy minbpe exercises](https://github.com/karpathy/minbpe/blob/master/exercise.md)
  and [README](https://github.com/karpathy/minbpe): the progression is basic
  train/encode/decode, inspect pieces, add regex boundaries, then compare a real
  tokenizer. Each extension changes one understandable part of a working model.
  The written material was inspected; no full-video viewing is claimed.

These are teaching-structure observations, not a claim that every detail of an
external tutorial should be copied or treated as the final scientific authority.

## Acceptance questions for the rewrite

Read in order, stopping at each newly introduced term or operation. Can a reader
answer these using only preceding text and the adjacent picture?

1. What object am I looking at, what do its colours/labels mean, and what question
   are we trying to answer?
2. Can I perform the next operation on the given small input and explain why it
   changes the displayed state?
3. When notation or an optimized structure arrives, which already-understood
   step does it represent, and why is it useful?
4. After the result, what did it teach us that the input alone did not? What
   changes in the next example, and why are we moving to it?

Do not accept the rewrite merely because it has an opening intuition section,
three working labs, source-bound tests, or an accurate terminology list. The
Unigram, optimization, library and cost sections need the same beginner reading
pass as the opening. This initial report remains open until that pass is applied
to the actual revised source and its important rendered diagrams.

## Second reading: the revised source

28 September 2026. Read the complete revised `tokenization.jsx`, the complete
`SubwordTokenizationLabs.jsx` and its topic CSS. This is an independent heuristic
reading review, not a study observing a beginner. Runtime/model checks from the
first implementation are separate evidence. This reviewer did not operate the
browser during this pass; the integration owner captured the rendered states
later inspected and described below.

The revision addresses the original objection with changes to the actual reading
sequence, rather than adding a generic introduction:

- **Objects before names:** a visible `lowest → low | est → [7, 12]` picture
  introduces tokens, the vocabulary and IDs. The IDs are explicitly invented
  labels, not numbers encoding a token's meaning. The same pieces return later.
- **A reason for smaller pieces:** the whole-word/letter/subword comparison uses
  the same spelling. Its unknown output now has an explained consequence before
  the lesson asks how to discover pieces automatically.
- **BPE operations before notation:** the fixed before/after picture shows the
  six `newest` and three `widest` contributions, unchanged rows and joined pieces.
  The counting formula subsequently explains its indicator, frequency and maximum
  through that same count of nine. A separate saved-rule trace changes only the
  cuts of a new word; the text distinguishes training from encoding.
- **A successful WordPiece example before failure:** `lower` and `lowest` explain
  the longest-prefix and continuation rules before the artificial `abc` trap.
  The trie discussion now traces `root → a → b`; the two-score table makes the
  separate vocabulary-training heuristic intelligible.
- **Code linked to operations:** the small `Counter` example calculates the
  already-understood count. A reading table maps the complete efficient program's
  functions to the questions they solve. The priority-queue discussion explains
  stale entries and local updates in ordinary terms. The complete scratch code
  remains visible, with an explicit implementation-depth branch.
- **Unigram shares explained:** two complete cuts are scored, their weights are
  added, and each is divided by the total before the word “posterior” is used.
  Positions and paths are defined before the lattice. The slider discussion
  calculates both sides of a real change in the winning segmentation.
- **EM through fractional counts:** the table assigns credit to `ab`, `a` and `b`,
  explains why expected token count exceeds one, and normalizes to the next
  probabilities before introducing the forward/backward formula. Numerical
  stability has a concrete `0.01^200` example. Pruning now starts with removing
  `ab` and losing its path; the fixed-weight scoring detail follows that example.
- **Pipeline and cost bridges:** visible spaces precede SentencePiece settings.
  Lowercasing and whitespace splitting expose exactly what information is lost.
  The embedding table is explained as numbered rows before model compatibility
  and `Vd` arithmetic. Six versus two tokens gives a concrete full-attention
  position-pair comparison before larger accounting examples.

Two substantive findings remained in this second reading and were returned to
the author: the ordinary library route still needed one focused workflow before
the multi-route comparison program; the `ab` dynamic-programming table needed a
longer continuation to demonstrate reusing earlier totals. Their final closure
and final source identities will be recorded below after the author changes.

The reviewer directly made three small, disclosed manuscript repairs: align the
first `low | est</w>` success with five merges; replace the unrelated PMI aside
with a short, accurate training-provenance explanation; and put the concrete
pruning example before the implementation detail. The opening now limits its
spelling-preservation statement to its actual example. No algorithm, distributed
program, original rollback source or frozen prior evidence was changed.

## Findings closed against the final reading source

The ordinary library workflow now appears before the full comparison program.
It starts with the familiar corpus, trains BPE, prints the readable pieces,
decodes the IDs, saves and reloads the tokenizer, and checks the reloaded IDs.
The prose explains each representation and interprets the recorded
`lo | w | est</w>` result rather than implying it must match the separately
trained scratch dictionary. The author executed the displayed snippet; this
review inspected that execution receipt and verifier, rather than claiming a
second native run. A new coloured figure uses the exact recorded Alice outputs
to make the retained versus discarded spaces visible. Both figures' eight-piece
counts agree with the saved native output.

The dynamic-programming table extends `ab` to `abab`. It identifies reuse of
F(2)=0.64, then calculates F(3)=0.128 and F(4)=0.4096. As a complementary check,
this reviewer enumerated all four complete segmentations in a separate Node
calculation. Their weights are 0.36, 0.024, 0.024 and 0.0016, summing to 0.4096.
The caption was aligned with the extended spelling. The earlier five-merge
wording now agrees between the text, saved-rule figure and lab guidance; an
executed JavaScript check confirmed that merges six through ten do not change
the already-complete `low | est</w>` result.

### Learning-experience checklist disposition

1. **Route:** the existing shared opening describes the first reading route and
   names the deeper implementation/mathematical branch. Main headings remain
   sequential and legacy fragments remain present.
2. **Cautions:** the provenance note has one clear WordPiece home. Counterexamples
   now follow the successful mechanism they qualify. The unrelated PMI aside is
   removed; information-loss and native-comparison details remain where a learner
   needs them. The displayed examples print observations, not disclaimers.
3. **Real question:** the unseen spelling problem returns as `lowest` encoding;
   the Alice experiment brings actual text, observed unknown spans and saved data.
4. **Live investigation:** source shows immediate current results, editable text
   and vocabulary, meaningful probability control, reset and explicit invalid
   states. There is no learner prediction gate. This source inspection does not
   replace the integration owner's browser interaction check.
5. **Figures:** the inline source has a successful example, intermediates and
   explicit labels for each new representation. Coloured pieces have text and
   boundaries as well as colour; the merge selection adds an outline. The later
   narrow-image inspection below checks the visible result separately from source.
6. **Connections:** counting connects directly to the formula and code; learned
   rules connect to unseen-word encoding; WordPiece commitment motivates complete
   Unigram paths; fractional credit motivates EM; real spaces motivate the full
   pipeline; the same mechanism appears through a native library.
7. **Code:** the existing efficient scratch programs are retained. Small visible
   operations and function-purpose guidance precede the complete files. The
   focused ordinary-library route now precedes the multi-route experiment.
8. **Practice:** the exercises change overlap length, vocabulary, probability,
   corpus budget and whitespace treatment. Exact answers, changed-case criteria
   and distinct hints/solutions remain available.
9. **Screenshots:** this reviewer subsequently inspected all eight distinct new
   figures at 320px, all three narrow default labs and three changed desktop lab
   states captured by the integration owner. Observations and two resulting copy
   findings are recorded below. Interactive browser operation and the final
   production check remain the integration owner's scope.
10. **Buildup throughout:** the middle and deeper sections were read, not only the
    opening. Posterior shares, prefix reuse, fractional counts, numerical
    stability, pruning, the library route and cost accounting each now connect
    the new operation to a concrete earlier example. The retained advanced code
    remains demanding, but it is explicitly a deeper branch rather than the
    explanation a beginner must reverse engineer.

## Rendered-image inspection and final copy closure

Inspected the integration owner's captures under
`scratch/tokenization-intuition/early-browser/`, using the common filename prefix
`byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram-`:

- `figure-{0,1,2,4,5,8,9,10}-320.png`: all eight distinct static figures. The
  text→pieces→IDs stages stack in order; the two-number dictionary remains
  legible; the unknown/character/subword comparison has visible separate tiles.
  In the merge figure the selected e+s pair has an amber outline and both words'
  joined es remain visible. The five saved-rule frames preserve the spelling and
  visibly shrink its piece count. WordPiece's successful examples, the visible
  space marker, the pipeline stages and the two real Alice token strips retain
  their intended distinction without overlapping labels or lost pieces.
- `{0,1,2}-320.png`: the default BPE, WordPiece and Unigram labs. Controls and
  results fit the narrow column. The Unigram lattice retains all three position
  labels and the direct versus two-edge paths; its unequal bars show the 93.75%
  versus 6.25% shares. Wide diagnostic tables show a partial rightmost column
  within their horizontal table container; these screenshots alone do not
  establish scrolling behavior, which is checked by the integration owner.
- `{0,1,2}-changed.png`: edited corpus, missing starting vocabulary and removed
  whole-piece states at desktop size. The BPE result shows its changed pieces and
  unseen-query letters; WordPiece reports the unsuccessful word and a failed
  starting position; the removed Unigram edge disappears, leaving one 100% path
  and the two expected character counts.

These changed states revealed two copy defects that source reading had missed.
The BPE's five-merge instruction sounded unconditional even after changing its
corpus; it now explicitly applies to the original corpus/query and names Reset.
WordPiece called every failure a continuation failure even when it failed at the
word start; it now states that the greedy scan could not complete the word. The
reviewer read both final component-copy changes. They do not change geometry or
the model, so the earlier captures remain evidence for their unchanged layout,
not for the old incorrect wording. Final production checking remains separate.

**Review outcome:** no remaining blocking manuscript, inline-visual-source or
inspected-image finding in this scoped heuristic review. The revised source is
ready for final production integration review. This is not a claim that an actual beginner was observed or
that the user has accepted the result. Final source identities and the scope of
the checks are recorded in `beginner-review.json`. Any later content or component
change needs a focused review of the changed portion before reusing this receipt.

# Independent review: Byte-Level Tokenization & Token-Free Models

28 September 2026. Reviewer: subword-tokenization agent, not the byte-topic author.
The complete manuscript, four public programs, browser model, all labs and figures,
styles, blueprint, design, author review and execution records were read.
No unresolved blocking content or mechanism finding was found within the declared
scope. Final production-browser acceptance belongs to the increment owner.

## Accuracy and executable contracts

[independent-review.json](independent-review.json) binds the reviewed files and
the already-passed author receipts. The complementary executable check is
`scripts/review-byte-tokenization.py`, run with Python 3.12 and the shared CPU
PyTorch/Tokenizers runtime. It did not repeat the author's exhaustive byte-string
campaign or train the same neural fixture again.

- A different native BPE vocabulary deliberately merges the middle A9 C3 bytes
  of éé. Scratch and Hugging Face produce C3 / A9 C3 / A9; concatenation and
  native decoding both restore éé. Thus the lesson's cross-scalar grouping
  explanation is tested with a real model, not just a drawn partition.
- Multiple successive incomplete chunks, including an empty chunk, preserve a
  leading U+FEFF and finish a euro sign. The scratch and standard decoders agree
  on each emitted result. Ending after E2 or E2 82 rejects truncation. Existing
  author evidence already covers all one/two-byte strings and longer malformed
  cases; the review verified its recorded source identities before reuse.
- The changed A/é batch matches the independently written input/target rows and
  has five supervised targets. Appending arbitrary padding logits leaves the
  loss unchanged; padded-target gradients are zero. Appending padded input
  columns leaves existing causal logits unchanged in deterministic mode.
- New feature rows under patch IDs [0,1,1,2,2] give the hand-derived means
  [[2,4],[3,5],[4,6]] in both implementations. Increasing the threshold through
  [0,.5,.7,1] reduces patch counts [5,3,2,1]. An independent content permutation
  confirms the stated limitation of averaging additive position/content vectors.
- Practice bits-per-byte values recompute to about 2.88539 and 2.59685. The
  causal-grid totals are operation counts with a declared unit, not timings.

The reviewer consulted [RFC 3629](https://www.rfc-editor.org/rfc/rfc3629), especially
sections 3–4 and 6, the [ByT5 guide](https://huggingface.co/docs/transformers/model_doc/byt5),
and [BLT sections 2–4](https://arxiv.org/html/2412.09871v1). The local pooling
bridge is correctly distinguished from BLT's cross-attention network; entropy is
computed from a causal predictive distribution, with the threshold before the
byte being generated. The text does not substitute observed-byte surprise for
that distribution. Ordinary ByT5 byte IDs are compared separately from special-ID
roles. No independent pretrained-quality, GPU-speed or full-BLT reproduction
claim is made.

## Independent learning-experience assessment

This is a heuristic review by an independent author, not a study with beginners.

1. **Route.** The shared opening is first and gives a manageable representation /
   streaming route, followed by the explicitly named training and architecture
   branch. All main sections remain visible and numbered once.
2. **Cautions.** Reconstruction and normalization have a clear home in section 3;
   final-flush policy is explained beside streaming. Later uses refer to the
   concrete contract. Code primarily implements mechanisms and prints results.
3. **Real question.** A broken streamed globe motivates the exact distinctions
   needed for a practical repair. Constructed Unicode strings are appropriate
   protocol inputs; neural quality is not inferred from the tiny training fixture.
4. **Investigations.** Arbitrary text edits change scalar/byte nesting and stream
   state. The patch lab changes individual probability entries, so its outputs
   are not restricted to named presets. Current results appear without a quiz
   gate. ASCII boundaries, empty text, removed tails, deterministic distributions
   and one-patch limits have explicit behavior.
5. **Figures.** The cross-scalar grouping figure makes the unchanged byte sequence
   visible before and after the operation. Architecture strips locate where
   resolution changes. Entropy bars share a fixed 0–1 bit scale; causal grids
   compare the exact allowed pairs while naming excluded local work.
6. **Connections.** The exact prior BPE program is linked and imported, rather
   than rewritten. The byte-model contribution is batching/targets/masks/loss;
   attention, optimizer and state-space owners are linked. The next multilingual
   lesson follows naturally from coverage to representation cost and quality.
7. **Code.** The scratch state machine exposes payload and continuation logic.
   The standard-library and configured Tokenizers routes test those contracts.
   The tensor loss uses primitives while the network uses prior machinery.
   Indexed pooling avoids a dense assignment matrix and explains why it does so.
8. **Practice.** Å, euro chunks, cross-scalar grouping, A/é targets and changed
   entropy values require transfer to new inputs. Exact rows, counts, outputs
   and metric values are supplied in solutions; the adapter task has explicit
   success criteria rather than an unsupported promise.
9. **Screenshots.** The reviewer actually viewed root's desktop byte-unit,
   architecture and regrouping figures; the current streaming default; changed
   patch splitting and truncated-stream states; and 320px byte-unit and patch
   labs. Units nest clearly, pending state remains separate from emitted text,
   threshold bars agree with the groups, and the narrow layouts stack. The older
   byte-unit capture's long select label was already shortened in the reviewed
   source. Root's production pass owns confirmation of that final wording and
   the author's final intrinsic-grid text-zoom correction.
10. **Buildup throughout.** Every mapped transition was followed in reading order:
    a visible symbol becomes scalars and bytes; é's integer bits explain UTF-8;
    grouping preserves byte identity; incomplete prefixes motivate decoder state;
    shifted é targets define the learning problem; differing sequence units
    motivate architecture lanes; binary uncertainty introduces entropy before
    the boundary rule; explicit groups precede pooling and pair accounting.
    The six exercises close those same loops. No new essential mechanism is
    hidden behind a disclosure or introduced only in a later lab state.

## Findings and limits

There are no open correctness or pedagogical findings from this review. The
known select-label and zoom-layout improvements were already in the frozen source;
their final rendering is covered by root's focused production check. Numerical
agreement does not certify human learning outcomes. Full BLT training, broad
held-out language evaluation and hardware benchmarking remain outside this
lesson's executable claims and are labeled accordingly.

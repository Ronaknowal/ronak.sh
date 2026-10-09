# LLM Fine-Tuning Platforms — authoring and review

**Delivery complete — 28 September 2026.** Content and implementation are complete for this revision. Native checks, independent review and the final desktop/narrow/control/code-access verification are recorded below and in [the integration receipt](../integration-checks.json). Current status lives in the central ledger. No next action remains for this authorized increment; user acceptance is separate. Earlier checkpoint wording below describes the author/review sequence, not a pending queue.

Full mode, revision 1, 28 September 2026. Initial catalogue entry was planned without a body, brief or destination note. Retain title and teach platform-independent contracts before product choices. Author: frameworks_training_data; independent review and shared integration owned by parent.

## Complete content checkpoint

Manuscript: `src/learn/data/topics/llm-fine-tuning-platforms.jsx`. Programs: `public/learn-code/llm-fine-tuning-platforms/adapter_bridge.py` and `tiny_causal_finetune.py`. All instructional source is written and explained; no TODO program or promised unexplained implementation remains. Rendering/native verification initially pending at this checkpoint.

| Hurdle | Location and representation | Owned mechanism / reuse |
| --- | --- | --- |
| Fine-tuning versus prompting/retrieval | §1 repair-ticket behavior and evaluation contract | Conceptual decision, not a retrieval implementation promise |
| Records → tokens → supervision | §2 token alignment and mask lab | Locally implemented shifted stable cross-entropy; attention distinct from loss mask |
| Small parameter update | §3 compress/expand live low-rank path | Reuses Transfer Learning §4 derivation; actual new primitive→PEFT matched forward/gradient/update/reload/merge bridge |
| Complete execution | §4 random tiny Llama, five active targets, training/eval | Reuses transformer/autodiff; local mask and adapter orchestration |
| Tool settings change meaning | §5 contract mapping | Current PEFT/TRL docs; other platforms scoped overviews, not claimed native executions |
| Checkpoint artifact has dependencies | §6 base/adapter/tokenizer/version flow | Reload and merged comparison in runnable program |
| Transfer and diagnosis | §7 three changed exercises | Exact indices, zero-factor gradient diagnosis and task protocol |

## Visual specification

- **Artifact flow (§1):** reflowing dependency strip records → rendered tokens → selected targets/trainable weights → adapter + base reference + tokenizer. Arrows are dependencies, not a measured timing graph.
- **Mask investigation (§2):** initial invented seven tokens [BOS,user,report,assistant,repair,EOS,PAD]. Control answer token count 0–5, context/answer supervision choice, maximum length 4–11. Position rows show input token, logit's next-token target, attention flag and loss label. Adjacent filled/outlined token cells distinguish contextual versus supervised (with text). Immediate active-target count; zero-target state explicit undefined objective, never NaN output. Reset all. Same token alignment under truncation; EOS and padding distinct in fixture. Mobile rows reflow and exact table scrolls locally.
- **Low-rank investigation (§3):** fixed x=[1,2,−1], A=[1,−1,.5], base output=[.5,−.5]; controls B₁/B₂ in −1..1 and α in 0..4. Show x → A coordinate (−1.5) → B correction → base-plus-correction as actual numeric channels; bars use a fixed signed scale, not a fake slider. Zero B or α gives exact baseline. Immediate outputs and reset. This rank-one section does not claim that rank controls alone are an accuracy metric.

## Research and scope

Read official PEFT LoRA, TRL SFTTrainer, Transformers chat-template material, Hugging Face causal-LM course, Axolotl quickstart, original LoRA/QLoRA papers on 28 September 2026. Instructional inspiration: inspect actual token batches before abstract trainer options; matched factorized/dense representations. No useful language capability or measured hardware claim is based on the constructed fixtures. This is a framework/workflow lesson, not a real-data accuracy study: fictitious equipment records prevent implied licensing or leaked private examples; explicit real-task protocol supplied. Large-model downloads, quantized kernels, multi-GPU and preference objectives are scoped follow-on mechanisms, not silently omitted core outcomes.

## Continuation

Content, runtime investigations, native programs and independent source review are complete. Parent owns final browser/build binding and ledger closure. Preserve the earlier content checkpoint and executed numerical evidence.

### Author verification — 28 September 2026

- `node scripts/verify-fine-tuning-platforms.mjs`: 320 assertions passed across every offered integer token length/count, supervision mode, zero-target/padding conditions and a separate dense low-rank calculation.
- Native `adapter_bridge.py` on torch2.14.0+cpu/PEFT0.21.0/Transformers5.17.0: 5 adapter parameters, zero forward/update parity error, maximum output change .09848780922955924; gradients, frozen-base identity, adapter reload and merged output assertions passed.
- Native `tiny_causal_finetune.py`: 5 active shifted targets, 128 trainable parameters, manual/library loss difference 2.384185791015625e−7; fixture loss 2.503828763961792 → 2.366088390350342 after30 updates. Random tiny architecture and invented tokens are explicitly not language-quality evidence. Source hashes and environment recorded in `author-evidence.json`.
- Author learning review: conceptual transitions explain the need before introducing masks, factors, packing and artifacts; both immediate investigations expose actual token/channel entities; code is visible with shared copy/download; exercises change target length and initialization; target0 null explained; dense equivalence derived and numerically checked. No unobserved video-viewing, GPU execution or learner-study claim. Rendered/browser checks and independent review pending with parent.
- Native import setup initially exposed missing HTTP dependencies; resolved in isolated target only, with huggingface_hub1.33.0. No shared environment was modified. No public caches retained.

Independent source review is complete in `independent-review.md`; its empty-supervision finding is closed below. Next action: parent final browser/build binding and ledger closure. Reuse passed native outputs while their sources remain unchanged.

### Independent-review correction and scoped rerun

Reviewer `frameworks_annotation_modalities` identified that the original scratch loss returned NaN for an all-ignored label batch even though the text taught rejecting that condition. The implementation now rejects no active shifted targets and invalid active vocabulary IDs; it selects active rows before gathering. A changed-mask scalar and gradient comparison against `torch.nn.functional.cross_entropy` and three rejected invalid cases are part of the supplied program. Rerun on the same CPU versions passed: changed-mask loss error 2.384185791015625e−7, maximum gradient error 1.4901161193847656e−8; all three invalid cases rejected. The original five-target parity and 30-update final loss are unchanged. This is the author's correction evidence; the independent reviewer owns closure.

### Rendered reading pass

Author inspected both labs' desktop, 320px and changed-state screenshots. Supervised/context/padding entities, shifted target positions and active counts agree; edited B/alpha values match both output-channel corrections. Narrow layouts reflow the mechanism and retain exact tables in their local scroll region. All surfaces are neutral/amber. The default desktop token cards split the word “assistant” inside a narrow card, so the token flex basis is increased from90 to120px. No model computation changed. Author inspected all three mask-lab recaptures in `scratch/core-frameworks/final-corrections/`: “assistant” is whole at desktop and320px, state labels/counts remain correct, and the changed full-supervision case preserves exact target alignment. The visual finding is closed; interaction/reset/keyboard/code-control execution remains the parent's separate receipt.

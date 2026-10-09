# Independent original-lesson audit

Reviewer: `/root/multimodal_reviewer`, 6 October 2026. Read the complete 895-line original lesson, current canonical skill, review/topic-design guidance, repository AGENTS and current handoff. Root owns rewriting and phases; this reviewer owns review records only. Original source: `original/multimodal-tokenization.jsx`, SHA256 `7f0721a1cca5d7f59badd651a45c25b7dd078779f68d0f7dab4a295a5322ce8f`. All line references below identify that original source, not a successor.

## Correctness findings and preservation decisions

| Location | Finding / learner consequence | Rewrite disposition |
| --- | --- | --- |
| 17–29, 58 | Integer IDs are not a transformer requirement: input computation uses vectors. Continuous representations also support generation with appropriate objectives/decoders. Text grouping mechanisms and arbitrary-byte coverage vary across tokenizers. | Begin with IDs retrieving vectors versus vectors supplied directly. Treat discretization as an interface choice, not an architectural necessity. |
| 25, 74, 684 | Inline visual embeddings and cross-attention are conflated; all serving/architecture improvements supposedly work unchanged. Chameleon actually introduces architecture and inference adaptations. | Draw inline conditioning and distinct visual-memory cross-attention; qualify reuse and metadata/masks. |
| 29, 507, 885 | Chameleon's 65,536 vocabulary includes 8,192 image codes; the old additive layout is not its real tokenizer. | Preserve namespace arithmetic as an explicitly constructed model; state Chameleon's actual total separately. |
| 52, 97 | Raw patch dimension, projected width and optional CLS positions are insufficiently distinguished. ViT's class head/masking/positions are not simply a text LM. | Preserve patching/projection equations, name distinct shapes and task-specific additions. |
| 111 | Stop-gradient is identity in the forward pass; gradients do not flow through it in the backward pass. The old sentence mistakenly speaks of gradients flowing in the forward pass. | Draw forward values and backward routes separately. |
| 119, 133, 325–329, 873 | Correct gradient ownership is surrounded by universal collapse/divergence and every-tokenizer assertions. EMA is a legitimate codebook-side alternative, not a remedy for all gradient issues. | Keep the three losses and straight-through approximation; calculate individual gradients and distinguish assumptions from guarantees. |
| 258–259 | Scalar VQ losses are wrong by factor two; assignments and counts are correct. | Replace with executed numerical values or a new explicitly matched fixture. See native audit below. |
| 230, 265, 738, 765 | Nearest lookup first allocates N×K×d; unsupported universal dead-code percentages and sweet spots. Small validation samples cannot diagnose permanently dead entries. EMA does not automatically revive never-assigned entries. | Use norm/dot-product lookup with bounded batch workspace, and actual labelled usage counts. Preserve reseeding/EMA reasoning without invented rates. |
| 335–429, 661 | Gaussian residual simulation is valid at its reported numbers, but not a speech codec. Its error cannot establish intelligibility, transparency or a universal halving law. | Preserve RVQ mechanism; use an analytic 2D trace in successor. Keep old executed outputs as historical toy evidence only. |
| 461, 507, 789 | All image-ignoring errors are attributed to serialization. Ordinary string markers do not necessarily destroy boundary information; dedicated tokens depend on the trained interface. | Teach collision, marker/processor/version and mask debugging as separate causes, without claiming exhaustive diagnosis. |
| 538, 555, 581–594 | Library examples have asserted unverified probability/shape outputs, incomplete setup (e.g. EnCodec torch import), ambiguous bandwidth and checkpoint preparation. | Supply complete runnable local/native programs, actual environment and executed result scope. |
| 598, 717 | AudioLM/MusicLM are falsely assigned the exact EnCodec configuration. MusicLM uses SoundStream: 24kHz, stride480, 50 latent steps/s, twelve1024-entry quantizers, 600 acoustic IDs/s. Semantic tokens are separate w2v-BERT representations. | Separate codec-specific settings, semantic versus acoustic objectives, and sequence ordering. |
| 610–684 | The claimed same-input walkthrough switches photos and mixes unrelated code-usage and RVQ plots without tracing that image. | Carry a known local image/feature through connected views; distinct modalities get explicit example bridges. |
| 705 | FSQ is falsely equated with VQ-GAN+RVQ; VQ-VAE is dismissed as obsolete and perceptual/GAN losses treated as universally superior. | Explain FSQ's fixed scalar product grid; loss choice changes evaluation, not universal ranking. |
| 711, 728 | Four times positions is sixteen times the dense attention-pair term, at fixed width—not four times attention or guaranteed per-step time. | Separate sequence count, quadratic pair count, other computation and measured latency. |
| 744, 750, 754 | Model-specific token counts are compared as a universal quality frontier. KV formula assumes full MHA; actual GQA uses KV-head count. More fidelity/positions are not universally guaranteed. | Explicit serialization and geometry; KV bytes =2×layers×KVheads×head_dim×bytes×positions. No invented performance rankings. |
| 771–801 | Diagnostic causes and remedies are overconfident; rotation trick is not a finite-difference estimator, and codec generalization cannot be universally asserted catastrophic. | Teach observable symptoms, multiple candidate causes and controlled checks; route specialist estimator training as optional sourced depth. |
| 807 | 95% duplicate-video claim and useless-without-temporal-compression assertion are unsupported. Sampling and temporal embedding/compression are different operations. | Draw actual spacetime volume, tubelets and sampling-loss example; preserve timestamps/partial-block conventions. |
| 819 | Adding an offset to integer IDs cannot itself corrupt UTF-8 bytes. Not all text tokenizers are byte-level BPE. | Keep namespace integrity and integer round-trip tests; distinguish byte/string corruption from ID collisions. |
| 827–860 | Search-verified metadata is presented as whole-claim verification. Proprietary Gemini details and general model/serving conclusions lack disclosed evidence. | Annotate precise primary sources and locators; omit unsupported proprietary tokenizer claims. |
| 869–885 | Useful changed-case practice exists, but answers are immediate and several inherit false universal claims. | Preserve arithmetic/gradient/diagnosis transfer outcomes with distinct prompts, hints and explained solutions. |

Useful depth to retain: patchify/unpatchify round-trip and shape equations; efficient projection/Conv2d correspondence; nearest-code reconstruction; codebook/commitment ownership and straight-through estimator; RVQ recurrence and rate arithmetic; code utilization with diagnostic limits; namespace and preprocessing integrity; image/audio/video context decisions; changed-input practice. These are teaching jobs to retain, not a requirement to copy incorrect sentences or pseudo-code.

## Independently executed original native outputs

Executed the original NumPy code blocks extracted from the JSX using `scratch/lesson-tools/Scripts/python.exe -X utf8 -B -`. Environment extraction read source as UTF-8, selected original VQ and RVQ blocks, then printed actual variables (the source comments themselves print no outputs).

```text
OLD_VQ_ACTUAL
indices [0, 0, 1, 0, 3, 0, 3, 0, 0, 1, 1, 0, 3, 0, 0, 0]
usage [10, 3, 0, 3]
codebook_loss 1.212445616722107
weighted_commitment_loss 0.30311140418052673

OLD_RVQ_ACTUAL
initial mean squared feature value 1.0214567184448242
level1 0.5728906393051147
level2 0.3161289691925049
level3 0.17254963517189026
level4 0.0924607589840889
level5 0.049620624631643295
level6 0.026052288711071014
level7 0.014086244627833366
level8 0.007040594704449177
```

This execution establishes the displayed Gaussian toy MSEs at rounding and the VQ scalar correction. It does not establish audio reconstruction quality or validate any new successor program. No browser review or real learner study was performed in this original-source audit.

## Primary sources inspected independently

- [Chameleon v1, §§2.1–2.4](https://arxiv.org/html/2405.09818v1): read tokenizer size, image code count, architecture stabilization and inference masking/fixed image blocks. These directly contradict the original additive vocabulary and unchanged-serving claims.
- [MusicLM v1, §§2.1 and 3.1–3.2](https://arxiv.org/html/2301.11325v1): read actual SoundStream geometry, semantic/acoustic roles and hierarchical coarse/fine stage allocation. Does not use the original lesson's asserted EnCodec setup.
- [AudioLM paper](https://arxiv.org/pdf/2209.03143): consulted original paper for semantic/acoustic distinction; MusicLM provides the explicit codec-number cross-check above.
- [FSQ v2, §3.1 and related work](https://arxiv.org/html/2309.15505v2): read bounded per-channel rounding, product-grid cardinality, STE and relationship to RVQ/PQ. This is a distinct quantizer, not a perceptual-loss or RVQ synonym.

The original source is not ready under the current skill. Root's accepted successor design, full text/programs and implementation require separate review; this audit does not promote either phase.

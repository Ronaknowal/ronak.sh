# llm-fine-tuning-platforms — independent source review

Reviewer: frameworks_annotation_modalities; author: frameworks_training_data. Date:28 September2026. Read complete manuscript, both runtime investigations and pure models, both learner programs, blueprint and author evidence/design. Review is complementary source correctness and heuristic teaching assessment, not an observed learner study. Author executions are reused; targeted correction execution is attributed to author.

## Findings and closure

Found and closed a real empty-supervision mismatch: the original masked_causal_loss returned NaN when every shifted target was ignored, contrary to the lesson’s rejection contract. Author added a clear ValueError for no active targets and invalid active vocabulary IDs, gathering only active rows. Reviewer inspected the exact guard and focused regression. Author reran the affected CPU program: changed-mask loss error2.384185791015625e−7, gradient error1.4901161193847656e−8; empty,−1 andvocab_size cases all rejected. Original training result unchanged. No full unrelated native rerun was requested.

## Complementary correctness review

Followed causal shift, prompt context versus supervised label, padding/EOS distinction and truncation through each token-trace alternative. LoRA orientation/scaling, parameter counts, rank-one coordinate−1.5, zero-factor initialization derivatives and factorized complexity agree. The matched primitive/PEFT program preserves base weights, compares adapter gradients and a step, reloads the correct base and tests merged inference. Tiny Llama training explicitly reports its random/invented-data scope; active-target count5 and parameter count128 are consistent. Packing is accurately distinguished from independent attention and resume state from an inference adapter.

## Learning-experience and inline-visual reading pass

The equipment-ticket behavior introduces the experiment before platform options. Rendered targets and logits indices make masking concrete; the low-rank compress/expand path ties both outputs to one coordinate instead of treating rank as a quality slider. The next program owns shifted loss/orchestration and reuses transformer/autodiff deliberately. Configuration options return to those mechanisms. Export and failure diagnosis refer to the same source/base/template contracts. Exercises change target length, factor initialization and task context; prompts remain visible. No learner prediction gate is present.

Opening route and prerequisites use the shared reading structure; code is visible, exercise prompts are outside disclosures, and practice/next/references/alternative-learning sections remain distinct. No repeated unsupported performance cautions dominate the prose. These conclusions concern source and intended representation. Rendered desktop/mobile geometry, interactive keyboard/reset behavior, code controls and screenshots remain the parent's separate browser/integration check. No open blocking source-review finding.

## Reviewed identities

- `src/learn/data/topics/llm-fine-tuning-platforms.jsx`: `a6a388be982534c3791fcbc3d4993ebe97419308075828572a911ba576f14cee`
- `src/learn/data/fine-tuning-platform-models.js`: `2830cf8759003658bf8d588450dfb55d19ad15551b035c8362ae02dbd6e37764`
- `src/learn/components/lesson-labs/FineTuningPlatformLabs.jsx`: `c724ce1b902ac338a29961027698196d294152a41e65cfd2efdb3e47931142e5`
- `public/learn-code/llm-fine-tuning-platforms/adapter_bridge.py`: `047ebfbc8f13c484d1a7621158b41742d811186d85202fe458edf730ef2d681f`
- `public/learn-code/llm-fine-tuning-platforms/tiny_causal_finetune.py`: `d1a69b3cca9a888c7f5d93ce015f22ca05d8aadba85bfeca0145730cf18749b5`
- `src/learn/data/curriculum/blueprints/llm-fine-tuning-platforms.js`: `ab6c962044a5f552db5e362f42df03032837c43576b19b34cd4bd580af888386`

## Final presentation delta review

Reviewed final presentation delta: token tiles now have120px flex basis to keep the assistant marker readable. All token ownership/attention/target expressions, control state and model calls are unchanged. Source delta accepted; root owns the targeted rendered recapture. Existing numerical/source findings and closure above remain valid.

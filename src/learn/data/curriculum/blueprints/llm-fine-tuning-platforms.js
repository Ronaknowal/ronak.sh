export default {
  summary: 'Control the path from message records to supervised targets, low-rank updates, platform configuration and reconstructible artifacts.',
  outcomes: ['Distinguish fine-tuning, prompting and retrieval decisions', 'Trace next-token shift, attention and loss masks', 'Implement low-rank projection and match PEFT gradients/update/merge', 'Run an offline tiny causal-LM adapter experiment', 'Audit SFT configuration, packing and trainable state', 'Design held-out evaluation and complete export/resume records'],
  prerequisites: ['Transfer Learning & Fine-Tuning Strategies', 'Training Acceleration'],
  sequence: ['Define the behavior and evaluation split', 'Inspect token targets and truncation', 'Trace low-rank update channels', 'Match primitive and PEFT computation', 'Run masked causal training', 'Translate platform settings', 'Evaluate and export exact dependencies'],
  visual: { type: 'Token target alignment, low-rank bottleneck and artifact dependency chain', question: 'Which targets and parameters are changing, and what must be saved?', interaction: 'Edit answer lengths, truncation, supervision, adapter output factors and scale; see masks and outputs live.' },
  practice: { task: 'Repair shifted masks and zero-factor initialization, then design an auditable extraction fine-tune.', success: 'Reproduce active-target counts, matched adapter update/reload and a split-safe evaluation contract.' },
  misconceptions: ['Ignoring prompt loss removes prompt context', 'EOS automatically isolates packed examples', 'An adapter export contains the full base and resume state', 'Low-rank parameter savings prove quality or universal speedup'],
  sources: ['https://huggingface.co/docs/peft/package_reference/lora', 'https://huggingface.co/docs/trl/sft_trainer', 'https://huggingface.co/docs/transformers/chat_templating', 'https://arxiv.org/abs/2106.09685', 'https://arxiv.org/abs/2305.14314'],
  depth: 'core',
  designRecord: 'docs/teaching/core-frameworks/llm-fine-tuning-platforms/README.md',
  reviewFocus: 'Causal shift and active count, LoRA factor orientation/scaling/initialization, primitive/library update and saved artifact equivalence, no capability inference from random tiny model.',
};

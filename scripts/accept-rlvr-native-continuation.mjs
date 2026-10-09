import fs from 'node:fs';
import crypto from 'node:crypto';
const folder = 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards/program-continuation';
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const packetPath = `${folder}/proposal-inputs.json`;
const expected = 'e20fe0d5d0caea3f2581867ab6a750e7040700e8546dbbee1db6cd2a333cbb42';
if (sha(packetPath) !== expected) throw Error('Proposal changed');
const packet = JSON.parse(fs.readFileSync(packetPath));
for (const [path, hash] of Object.entries(packet.files)) if (sha(path) !== hash) throw Error(`Changed input: ${path}`);
const review = {
  accepted: true,
  reviewer: '/root, different from author /root/multimodal_reviewer',
  continuation_packet_sha256: expected,
  source_guards: Object.keys(packet.files).length,
  assessment: [
    'Personally read the entire protocol amendment, analytical audit, standalone continuation and full successor diff against the already whole-reviewed predecessor, including unchanged extracted fixture and final CLI.',
    'First-step AdamW formula uses retained actual moments, proper bias correction, zero weight decay and saved named-parameter order. Float64 equation rounded to FP32 and a prospective ULP/displacement allowance test each own step; this does not assert native/twin equality.',
    'Absent native post-zero_grad gradients are explicitly inferred from first moments; this cannot independently establish backward-gradient correctness. Retained actual loss/gradient comparisons remain separate.',
    'Original 5e-5 equality failure, exact historical 9.838119149208069e-5 parameter discrepancy and inferred historical row matching are explicitly retained. New exact token/mask matching is confined to future full program runs.',
    'Standalone guards original failed state and all prior sources/results, performs read-only analytical audit before model construction, reconstructs original GPT2/GRPO configuration and actual completed native/reference weights, and invokes only the unchanged unreached fixture.',
    'Only three original fixture forwards and two autograd reads; no training, generation, optimizer construction/step, warm-up or evaluation. Reward function rejects calls; parameters/reference gradients checked afterward.',
    'All 29 author synthetic/AST conditions read and composed with this complementary source/math/scope review. They are not claims of actual retained-state audit execution.',
    'Complete successor may be published after actual results are integrated; this acceptance does not execute/replay its full main function or certify lesson content/runtime.'
  ],
  authorized_next_operation: 'Execute proposed/continue_native_fixture.py once with this exact acceptance; retain original failed status and every prior artifact. Any failure remains a failure and requires assessment, not automatic retry.',
  files: { ...packet.files, [packetPath]: expected },
};
const out = `${folder}/root-prospective-acceptance.json`;
fs.writeFileSync(out, JSON.stringify(review, null, 2) + '\n', {flag:'wx'});
console.log(JSON.stringify({accepted:true, sourceGuards:review.source_guards, path:out, sha256:sha(out)}));

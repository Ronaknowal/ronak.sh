"""Ordinary maintained Mamba-3 training and explicit-cache inference route.

Source checked against state-spaces/mamba on 5 October 2026. Requires a compatible
GPU installation and its SISO/step kernels. The lesson's CPU reference checks do
not certify execution of this GPU programme or claim pretrained-model quality.
Run after installing the source version and its documented accelerator extras.
"""
import torch
from torch import nn
from torch.nn import functional as F


class SequenceClassifier(nn.Module):
    """An ordinary full-block task scaffold, not a reproduction of a paper model."""
    def __init__(self, block, width, classes):
        super().__init__()
        self.block = block
        self.norm = nn.LayerNorm(width)
        self.classifier = nn.Linear(width, classes)

    def forward(self, inputs):
        features = inputs + self.block(self.norm(inputs))
        return self.classifier(features.mean(dim=1))


def train_and_continue():
    if not torch.cuda.is_available():
        raise RuntimeError('This maintained-kernel example needs a compatible CUDA environment; use the companion reference blocks on CPU.')
    from mamba_ssm import Mamba3
    from mamba_ssm.utils.generation import InferenceParams

    torch.manual_seed(18)
    # inner=128 -> two 64-coordinate value heads; d_state is the state width.
    # SISO needs no TileLang MIMO kernel. Output norm is deliberately off;
    # the block still normalizes B and C internally before their biases/rotation.
    block = Mamba3(d_model=64, d_state=64, expand=2, headdim=64,
                   is_mimo=False, is_outproj_norm=False, rope_fraction=.5,
                   chunk_size=64, layer_idx=0, dtype=torch.bfloat16).cuda()
    model = SequenceClassifier(block, 64, 3).cuda().to(torch.bfloat16)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)
    inputs = torch.randn(2, 128, 64, device='cuda', dtype=torch.bfloat16)
    labels = torch.tensor([0, 2], device='cuda')
    model.train()
    optimizer.zero_grad(set_to_none=True)
    logits = model(inputs)
    loss = F.cross_entropy(logits.float(), labels)
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.)
    optimizer.step()
    print({'one_constructed_update_loss': float(loss.detach()), 'logit_shape': list(logits.shape)})

    # Inspect the block separately: classifier pooling is not a per-token cache.
    block.eval()
    with torch.inference_mode():
        complete = block(inputs)
        inference = InferenceParams(max_seqlen=128, max_batch_size=2)
        prefix = block(inputs[:, :64], inference_params=inference)
        inference.seqlen_offset = 64
        cache = inference.key_value_memory_dict[0]
        continuation = []
        for position in range(64, 128):
            # This source revision's step accepts [N,D], while its forward
            # token dispatch passes a 3D tensor. Use the explicit step boundary.
            out, *cache = block.step(inputs[:, position], *cache)
            inference.key_value_memory_dict[0] = tuple(cache)
            continuation.append(out.unsqueeze(1))
            inference.seqlen_offset += 1
        streamed = torch.cat((prefix, *continuation), dim=1)
        # BF16/tiled reductions need a workload-appropriate tolerance; report
        # the actual error rather than making a universal precision promise.
        print({'full_vs_prefill_step_error': float((complete.float() - streamed.float()).abs().max()),
               'cache_shapes': [list(value.shape) for value in inference.key_value_memory_dict[0]]})
        # cache tuple is (angles, SSM, previous K, previous V), not just SSM.
        fresh = InferenceParams(max_seqlen=128, max_batch_size=2)
        restarted = block(inputs, inference_params=fresh)
        torch.testing.assert_close(restarted, complete, atol=1e-2, rtol=1e-2)

    # MIMO is a separate kernel/configuration: requires its documented TileLang
    # dependencies. Construct it deliberately after the rank-R branch is taught:
    # Mamba3(d_model=64,d_state=64,headdim=64,is_mimo=True,mimo_rank=4,
    #        chunk_size=16,is_outproj_norm=False,dtype=torch.bfloat16).cuda()


if __name__ == '__main__':
    train_and_continue()

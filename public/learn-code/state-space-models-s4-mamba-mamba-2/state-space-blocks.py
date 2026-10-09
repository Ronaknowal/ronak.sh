"""Complete differentiable reference Mamba-1/Mamba-2 block compositions.

Run beside state-space-operators.py, PyTorch required. Ordinary Linear, Conv1d,
SiLU and RMS normalization are primitives; every temporal state operation is
implemented in the companion program. CPU references, not fused GPU kernels.
The supported Mamba-2 configuration is one B/C group, all inner channels using
SSD, one scalar D per head and gate BEFORE full-width RMSNorm (Mamba2Simple's
norm_before_gate=False). No unsupported flag-parity promise.
"""
from pathlib import Path
import runpy
import torch
from torch import nn
from torch.nn import functional as F

operators = runpy.run_path(str(Path(__file__).with_name('state-space-operators.py')))
selective_recurrent = operators['selective_recurrent']
ssd_chunked = operators['ssd_chunked']


def causal_convolution(convolution, values, cache):
    """values [N,T,C], cache [N,C,W-1]; return full output and new cache.

    The cache stores the projected values BEFORE convolution and SiLU. Kernel
    coefficient zero addresses the oldest retained input, not the current one.
    W=1 has an empty cache; never slice with -0 (which would retain everything).
    """
    width = convolution.kernel_size[0]
    expected = (values.shape[0], values.shape[-1], width - 1)
    if cache.shape != expected or values.shape[1] < 1:
        raise ValueError("Convolution cache must match [N,C,W-1]; time is nonempty")
    joined = torch.cat((cache, values.transpose(1, 2)), dim=-1)
    output = F.conv1d(joined, convolution.weight, convolution.bias, groups=convolution.groups).transpose(1, 2)
    next_cache = joined[..., -(width - 1):] if width > 1 else joined[..., :0]
    return output, next_cache


class ReferenceMamba1(nn.Module):
    """Full Mamba-1-style block without an implicit residual or layer norm.

    Default low-rank Delta path, input/output bias and depthwise-convolution
    bias are explicit. A is diagonal and negative, B/C shared across channels,
    injection is maintained Delta*B, D is one learned value per inner channel.
    """
    def __init__(self, model_width, state_size=8, expand=2, convolution_width=4, delta_rank=2, bias=True):
        super().__init__()
        self.inner = model_width * expand
        self.state_size = state_size
        self.delta_rank = delta_rank
        self.input_projection = nn.Linear(model_width, 2 * self.inner, bias=bias)
        self.convolution = nn.Conv1d(self.inner, self.inner, convolution_width, groups=self.inner, bias=True)
        self.coefficients = nn.Linear(self.inner, delta_rank + 2 * state_size, bias=False)
        self.delta_projection = nn.Linear(delta_rank, self.inner, bias=True)
        self.log_rate = nn.Parameter(torch.arange(1, state_size + 1).float().log().repeat(self.inner, 1))
        self.direct = nn.Parameter(torch.ones(self.inner))
        self.output_projection = nn.Linear(self.inner, model_width, bias=bias)
        with torch.no_grad():
            self.delta_projection.bias.fill_(-2.)

    def initial_cache(self, batch, like):
        return (like.new_zeros(batch, self.inner, self.convolution.kernel_size[0] - 1),
                like.new_zeros(batch, self.inner, self.state_size))

    def forward(self, inputs, cache=None):
        """Return outputs and (conv_cache,state), preserving gradient ownership."""
        if inputs.ndim != 3 or inputs.shape[1] < 1:
            raise ValueError("inputs must be [N,T,model_width], T >= 1")
        cache = self.initial_cache(inputs.shape[0], inputs) if cache is None else cache
        x, gate = self.input_projection(inputs).chunk(2, dim=-1)
        filtered, convolution_cache = causal_convolution(self.convolution, x, cache[0])
        x = F.silu(filtered)
        raw_delta, write, read = self.coefficients(x).split([self.delta_rank, self.state_size, self.state_size], dim=-1)
        interval = F.softplus(self.delta_projection(raw_delta))
        rate = -self.log_rate.exp()
        decay = torch.exp(interval[..., None] * rate)
        injection = interval[..., None] * write[:, :, None, :]
        shared_read = read[:, :, None, :].expand_as(decay)
        output, state = selective_recurrent(decay, injection, shared_read, x, cache[1])
        output = (output + self.direct * x) * F.silu(gate)
        return self.output_projection(output), (convolution_cache, state)

    def step(self, token, cache):
        """One [N,D] token; ordinary functional tensors avoid stale/in-place state."""
        output, cache = self.forward(token[:, None, :], cache)
        return output[:, 0], cache


class ReferenceMamba2(nn.Module):
    """Full one-group Mamba2Simple configuration, with bounded SSD chunks.

    One scalar decay/D per head, K state rows by P value columns. B/C group
    sharing is visible through expand, not hidden in a library scan. The state
    layout here [N,H,K,P] is the transpose of released [N,H,P,K] caches.
    """
    def __init__(self, model_width, state_size=8, expand=2, head_width=4, convolution_width=4,
                 chunk_size=16, bias=True, epsilon=1e-5):
        super().__init__()
        self.inner = model_width * expand
        if self.inner % head_width:
            raise ValueError("inner width must be divisible by head_width")
        self.head_width, self.heads = head_width, self.inner // head_width
        self.state_size, self.chunk_size, self.epsilon = state_size, chunk_size, epsilon
        projection_width = 2 * self.inner + 2 * state_size + self.heads
        self.input_projection = nn.Linear(model_width, projection_width, bias=bias)
        convolution_channels = self.inner + 2 * state_size
        self.convolution = nn.Conv1d(convolution_channels, convolution_channels, convolution_width,
                                     groups=convolution_channels, bias=True)
        self.log_rate = nn.Parameter(torch.arange(1, self.heads + 1).float().log())
        self.delta_bias = nn.Parameter(torch.full((self.heads,), -2.))
        self.direct = nn.Parameter(torch.ones(self.heads))
        self.norm_weight = nn.Parameter(torch.ones(self.inner))
        self.output_projection = nn.Linear(self.inner, model_width, bias=bias)

    def initial_cache(self, batch, like):
        return (like.new_zeros(batch, self.inner + 2 * self.state_size, self.convolution.kernel_size[0] - 1),
                like.new_zeros(batch, self.heads, self.state_size, self.head_width))

    def forward(self, inputs, cache=None):
        if inputs.ndim != 3 or inputs.shape[1] < 1:
            raise ValueError("inputs must be [N,T,model_width], T >= 1")
        N, T, _ = inputs.shape
        cache = self.initial_cache(N, inputs) if cache is None else cache
        gate, raw_xbc, raw_interval = self.input_projection(inputs).split(
            [self.inner, self.inner + 2 * self.state_size, self.heads], dim=-1)
        filtered, convolution_cache = causal_convolution(self.convolution, raw_xbc, cache[0])
        x, write, read = F.silu(filtered).split([self.inner, self.state_size, self.state_size], dim=-1)
        values = x.reshape(N, T, self.heads, self.head_width)
        interval = F.softplus(raw_interval + self.delta_bias)
        decay = torch.exp(-interval * self.log_rate.exp())
        shared_write = write[:, :, None, :].expand(N, T, self.heads, self.state_size)
        shared_read = read[:, :, None, :].expand_as(shared_write)
        output, state = ssd_chunked(decay, interval[..., None] * shared_write,
                                    shared_read, values, self.chunk_size, cache[1])
        output = output + self.direct[None, None, :, None] * values
        output = output.flatten(-2) * F.silu(gate)
        # gate-before-norm is this named configuration, not a universal order.
        output = output * torch.rsqrt(output.square().mean(-1, keepdim=True) + self.epsilon) * self.norm_weight
        return self.output_projection(output), (convolution_cache, state)

    def step(self, token, cache):
        output, cache = self.forward(token[:, None, :], cache)
        return output[:, 0], cache


class ResidualStateLayer(nn.Module):
    """Separate pre-LayerNorm + state block + full-input residual wrapper."""
    def __init__(self, model_width, block):
        super().__init__()
        self.norm = nn.LayerNorm(model_width)
        self.block = block

    def forward(self, inputs, cache=None):
        correction, cache = self.block(self.norm(inputs), cache)
        return inputs + correction, cache


def main():
    torch.manual_seed(19)
    inputs = torch.randn(2, 7, 4, dtype=torch.float64)
    for constructor in (ReferenceMamba1, ReferenceMamba2):
        block = constructor(4, state_size=4, convolution_width=3).double()
        cache = tuple(.1 * torch.randn_like(part) for part in block.initial_cache(2, inputs))
        whole, final = block(inputs, cache)
        outputs, streamed_cache = [], cache
        for token in inputs.unbind(1):
            output, streamed_cache = block.step(token, streamed_cache)
            outputs.append(output)
        streamed = torch.stack(outputs, dim=1)
        torch.testing.assert_close(whole, streamed, atol=1e-12, rtol=1e-10)
        for full, streamed_part in zip(final, streamed_cache):
            torch.testing.assert_close(full, streamed_part, atol=1e-12, rtol=1e-10)
        print(constructor.__name__, {'shape': list(whole.shape),
                                    'full_vs_step_max_error': float((whole - streamed).abs().max().detach())})


if __name__ == '__main__':
    main()

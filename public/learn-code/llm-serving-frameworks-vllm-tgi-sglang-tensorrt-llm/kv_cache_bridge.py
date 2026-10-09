"""Inference-only cached attention and Transformers parity; no model download."""
import json
import math
import torch
from transformers import LlamaConfig, LlamaForCausalLM


class AttentionCache:
    def __init__(self, capacity, width):
        self.keys = torch.empty(capacity, width, dtype=torch.float64)
        self.values = torch.empty_like(self.keys)
        self.length = 0

    def append_and_read(self, query, key, value):
        if self.length == self.keys.shape[0]:
            raise ValueError('Cache capacity exhausted')
        self.keys[self.length], self.values[self.length] = key, value
        self.length += 1
        scores = self.keys[:self.length] @ query / math.sqrt(query.numel())
        mass = (scores - scores.max()).exp()
        probabilities = mass / mass.sum()
        return probabilities @ self.values[:self.length]


def main():
    torch.set_num_threads(1)
    torch.manual_seed(19)
    q, k, v = (torch.randn(7, 4, dtype=torch.float64) for _ in range(3))
    cache = AttentionCache(7, 4)
    with torch.inference_mode():
        incremental = torch.stack([cache.append_and_read(q[i], k[i], v[i]) for i in range(7)])
        reference = torch.nn.functional.scaled_dot_product_attention(
            q[None, None], k[None, None], v[None, None], is_causal=True)[0, 0]
        torch.testing.assert_close(incremental, reference, rtol=1e-12, atol=1e-12)
        # Reuse the previous lesson's random small architecture; now inspect inference cache state.
        model = LlamaForCausalLM(LlamaConfig(vocab_size=12, hidden_size=16,
            intermediate_size=32, num_hidden_layers=1, num_attention_heads=2,
            num_key_value_heads=2, max_position_embeddings=32, attention_dropout=0)).eval()
        tokens = torch.tensor([[1, 3, 5, 4, 6, 9, 2]])
        full = model(input_ids=tokens, use_cache=False).logits
        prefix = model(input_ids=tokens[:, :4], use_cache=True)
        pieces = [prefix.logits]
        state = prefix.past_key_values
        for index in range(4, tokens.shape[1]):
            result = model(input_ids=tokens[:, index:index + 1], past_key_values=state, use_cache=True)
            pieces.append(result.logits)
            state = result.past_key_values
        cached = torch.cat(pieces, dim=1)
        torch.testing.assert_close(cached, full, rtol=1e-5, atol=1e-6)
    print(json.dumps({'attention_error': (incremental-reference).abs().max().item(),
                      'model_logits_error': (cached-full).abs().max().item(),
                      'cache_length': state.get_seq_length(),
                      'preallocated_values': cache.keys.numel()+cache.values.numel()}, indent=2))


if __name__ == '__main__':
    main()

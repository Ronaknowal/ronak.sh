"""Exact row preservation and a normal Transformers vocabulary extension, on CPU.

Install numpy torch transformers tokenizers. No remote model or corpus is fetched.
"""

import json
import numpy as np
import torch
from tokenizers import Tokenizer, models, pre_tokenizers
from transformers import GPT2Config, GPT2LMHeadModel, PreTrainedTokenizerFast


def extend_rows(old_rows, count):
    """Append exact mean rows; preserve the existing ID-to-row contract."""
    if old_rows.ndim != 2 or len(old_rows) == 0 or not isinstance(count, int) or count < 0:
        raise ValueError('Use a nonempty matrix and a nonnegative new-row count')
    result = np.empty((len(old_rows) + count, old_rows.shape[1]), dtype=old_rows.dtype)
    result[:len(old_rows)] = old_rows
    result[len(old_rows):] = old_rows.mean(axis=0)
    return result


def extend_library_model():
    torch.manual_seed(7)
    vocabulary = {'[UNK]': 0, 'solar': 1, 'panel': 2, 'cost': 3}
    backend = Tokenizer(models.WordLevel(vocabulary, unk_token='[UNK]'))
    backend.pre_tokenizer = pre_tokenizers.WhitespaceSplit()
    tokenizer = PreTrainedTokenizerFast(tokenizer_object=backend, unk_token='[UNK]')
    model = GPT2LMHeadModel(GPT2Config(vocab_size=len(tokenizer), n_embd=8,
                                      n_head=2, n_layer=1, n_positions=16,
                                      tie_word_embeddings=True,
                                      bos_token_id=None, eos_token_id=None)).eval()
    original = model.get_input_embeddings().weight.detach().clone()
    ids_before = tokenizer('solar panel')['input_ids']
    added = tokenizer.add_tokens(['photovoltaic'])
    model.resize_token_embeddings(len(tokenizer), mean_resizing=False)
    # Explicit initialization makes the scratch/library bridge exact.
    with torch.no_grad():
        model.get_input_embeddings().weight[len(original):] = original.mean(dim=0)
    expected = extend_rows(original.numpy(), added)
    actual = model.get_input_embeddings().weight.detach().numpy()
    assert np.allclose(actual, expected, atol=1e-8)
    assert torch.equal(model.get_input_embeddings().weight[:len(original)], original)
    assert model.get_input_embeddings().weight.data_ptr() == model.get_output_embeddings().weight.data_ptr()
    old_logits = torch.zeros(len(original))
    new_logits = torch.zeros(len(tokenizer))
    return {'added': added, 'old_ids': ids_before,
            'preserved_ids': tokenizer('solar panel')['input_ids'],
            'new_ids': tokenizer('photovoltaic')['input_ids'],
            'shape': list(actual.shape), 'max_error': float(np.max(np.abs(actual - expected))),
            'tied': True, 'old_uniform_probability': float(old_logits.softmax(0)[1]),
            'expanded_uniform_probability': float(new_logits.softmax(0)[1])}


if __name__ == '__main__':
    print(json.dumps(extend_library_model(), indent=2))

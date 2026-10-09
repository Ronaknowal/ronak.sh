"""Local audited Transformers-format RWKV7 continuation, source checked only.

This is specifically the bundled model API of
RWKV/RWKV7-G1j-7.2B-20260831 inspected 2026-10-05, not FLA's Cache API.
Before running: obtain an immutable snapshot of model/config/tokenizer files,
inspect the bundled Python, record its repository revision and SHA256. No
network download is requested here. Loading this local model executes its code.
Requires a compatible Transformers >=5.15 environment and enough model memory.
Use eager explicitly; the bundled default chunked backend has other dependencies.
"""
from pathlib import Path
import argparse
import copy
import hashlib
import json
import torch
from transformers import AutoConfig, AutoModelForCausalLM, AutoTokenizer


def inventory(state):
    rows = []
    for layer_index, layer in enumerate(state.layers):
        for slot, tensor in enumerate(layer.recurrent_states):
            if tensor is not None:
                rows.append({'layer': layer_index, 'slot': ['WKV', 'ATT_SHIFT', 'FFN_SHIFT'][slot],
                             'shape': list(tensor.shape), 'dtype': str(tensor.dtype),
                             'bytes': tensor.numel() * tensor.element_size()})
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--snapshot', type=Path, required=True)
    parser.add_argument('--revision', required=True, help='Immutable repository revision recorded when obtaining this local snapshot')
    parser.add_argument('--model-source-sha256', required=True, help='Independently audited hash of modeling_rwkv7.py')
    parser.add_argument('--prompt', default='A sensor reads 2, then reads 5. Its latest reading is')
    parser.add_argument('--device', default='cpu')
    parser.add_argument('--split', type=int, default=4)
    parser.add_argument('--tolerance', type=float, default=3e-3)
    args = parser.parse_args()
    folder = args.snapshot.resolve(strict=True)
    source = folder / 'modeling_rwkv7.py'
    actual_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    if actual_hash != args.model_source_sha256.lower():
        raise ValueError('The local model code differs from the independently audited hash.')
    config = AutoConfig.from_pretrained(folder, trust_remote_code=True, local_files_only=True)
    config.wkv_implementation = 'eager'
    tokenizer = AutoTokenizer.from_pretrained(folder, trust_remote_code=True, local_files_only=True)
    model = AutoModelForCausalLM.from_pretrained(folder, config=config, trust_remote_code=True,
                                               local_files_only=True, dtype=torch.float32).to(args.device).eval()
    tokens = tokenizer(args.prompt, return_tensors='pt', add_special_tokens=False).input_ids.to(args.device)
    if not 0 < args.split < tokens.shape[1]:
        raise ValueError('Split must lie strictly inside the encoded prompt.')
    mask = torch.ones_like(tokens)
    with torch.no_grad():
        whole = model(input_ids=tokens, attention_mask=mask, use_cache=True)
        prefix = model(input_ids=tokens[:, :args.split], attention_mask=mask[:, :args.split], use_cache=True)
        # The cache is mutable. Branch BEFORE advancing either continuation.
        suffix_state = copy.deepcopy(prefix.state)
        token_state = copy.deepcopy(prefix.state)
        suffix = model(input_ids=tokens[:, args.split:], attention_mask=mask[:, args.split:],
                       state=suffix_state, use_cache=True)
        token_logits = []
        for i in range(args.split, tokens.shape[1]):
            step = model(input_ids=tokens[:, i:i + 1], attention_mask=mask[:, i:i + 1], state=token_state, use_cache=True)
            token_state = step.state
            token_logits.append(step.logits)
        reference = whole.logits[:, args.split:]
        tokenwise = torch.cat(token_logits, dim=1)
        torch.testing.assert_close(suffix.logits, reference, atol=args.tolerance, rtol=args.tolerance)
        torch.testing.assert_close(tokenwise, reference, atol=args.tolerance, rtol=args.tolerance)
        # A zero mask must hold ALL slots. A suffix receives its own matching mask,
        # never the last columns of an unrelated full prompt mask.
        neutral_state = copy.deepcopy(prefix.state)
        saved = [tensor.clone() for layer in neutral_state.layers for tensor in layer.recurrent_states]
        neutral = model(input_ids=tokens[:, args.split:args.split + 1],
                        attention_mask=torch.zeros_like(mask[:, args.split:args.split + 1]), state=neutral_state, use_cache=True)
        for old, current in zip(saved, [tensor for layer in neutral.state.layers for tensor in layer.recurrent_states]):
            torch.testing.assert_close(current, old, atol=0, rtol=0)
    slots = inventory(suffix.state)
    print(json.dumps({'revision': args.revision, 'model_source_sha256': actual_hash, 'backend': 'eager',
                      'torch': torch.__version__, 'device': args.device, 'dtype': 'float32',
                      'max_chunk_difference': float((suffix.logits - reference).abs().max()),
                      'max_token_difference': float((tokenwise - reference).abs().max()),
                      'state_payload_bytes': sum(row['bytes'] for row in slots), 'slots': slots}, indent=2))


if __name__ == '__main__':
    main()

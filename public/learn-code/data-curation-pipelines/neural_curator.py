"""Run a pinned released FineWeb-Edu regressor and inspect its actual readout.

Install torch transformers==5.17.0 huggingface_hub safetensors.
python -B -X utf8 neural_curator.py --output ./neural-result.json --cache ./model-cache
First use downloads the released model (~0.4 GB). CPU inference is supported.
Optional --input-jsonl reads {"id":...,"text":...}; never treats scores as truth.
"""
import argparse
from hashlib import sha256
import importlib.metadata
import json
from pathlib import Path
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from huggingface_hub import snapshot_download

MODEL = 'HuggingFaceFW/fineweb-edu-classifier'
REVISION = '284663cbb2dabf9bda30d8f8cc49601251ee1631'
EXAMPLES = [
    {'id': 'pendulum', 'text': 'A pendulum exchanges gravitational potential energy and kinetic energy. At the highest point its speed is zero. Near the lowest point its speed is greatest. For small angles the period is approximately two pi times the square root of length divided by gravitational acceleration.'},
    {'id': 'navigation', 'text': 'Home home home. Subscribe now. Click here. Sale sale sale. Contact us. Home home home.'},
    {'id': 'technical', 'text': 'For a symmetric positive definite matrix A, the conjugate gradient method minimizes the quadratic one half x transpose A x minus b transpose x over successive Krylov subspaces. Residuals are orthogonal in exact arithmetic.'},
]


def policy(raw):
    clamped = min(5., max(0., float(raw)))
    integer = round(clamped)
    return {'raw_score': float(raw), 'clamped': clamped, 'integer_score': integer, 'kept': integer >= 3}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--cache', type=Path, required=True)
    parser.add_argument('--input-jsonl', type=Path)
    parser.add_argument('--offline', action='store_true')
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('Use a new result path')
    torch.set_num_threads(2)
    directory = Path(snapshot_download(MODEL, revision=REVISION, cache_dir=str(args.cache),
                                      local_files_only=args.offline,
                                      allow_patterns=['config.json', 'model.safetensors', 'tokenizer.json', 'tokenizer_config.json', 'special_tokens_map.json', 'vocab.txt']))
    tokenizer = AutoTokenizer.from_pretrained(directory, local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(directory, local_files_only=True).cpu().eval()
    rows = EXAMPLES if args.input_jsonl is None else [json.loads(line) for line in args.input_jsonl.read_text(encoding='utf-8').splitlines() if line.strip()]
    outputs = []
    readouts = {}
    def retain(name):
        def hook(module, inputs, output):
            readouts[name] = output.detach()
        return hook
    # Verify the real BERT CLS -> dense -> tanh pooling path and scalar head,
    # rather than infer a pooling rule from the generic AutoModel name.
    hooks = [model.bert.pooler.register_forward_hook(retain('pooler')),
             model.classifier.register_forward_hook(retain('head'))]
    try:
        for start in range(0, len(rows), 4):
            batch = rows[start:start + 4]
            encoded = tokenizer([r['text'] for r in batch], padding=True, truncation=True,
                                max_length=512, return_tensors='pt')
            with torch.no_grad():
                result = model(**encoded, output_hidden_states=True)
                manual_pool = torch.tanh(model.bert.pooler.dense(result.hidden_states[-1][:, 0]))
                manual_score = model.classifier(manual_pool)
            torch.testing.assert_close(manual_pool, readouts['pooler'])
            torch.testing.assert_close(manual_score, result.logits)
            for i, row in enumerate(batch):
                count = int(encoded['attention_mask'][i].sum())
                outputs.append({'id': row['id'], 'text': row['text'], 'characters': len(row['text']),
                                'model_tokens': count, 'ids': encoded['input_ids'][i, :count].tolist(),
                                **policy(result.logits[i, 0].item())})
    finally:
        for hook in hooks:
            hook.remove()
    report = {'model': MODEL, 'revision': REVISION,
              'versions': {p: importlib.metadata.version(p) for p in ['torch', 'transformers', 'huggingface_hub']},
              'architecture': {'class': type(model).__name__, 'layers': model.config.num_hidden_layers,
                               'width': model.config.hidden_size, 'heads': model.config.num_attention_heads,
                               'readout': 'CLS final hidden -> learned dense -> tanh -> scalar classifier; verified equal',
                               'parameters': sum(p.numel() for p in model.parameters())},
              'files': {p.name: sha256(p.read_bytes()).hexdigest() for p in directory.iterdir() if p.is_file()},
              'examples': outputs, 'rounding_boundaries': [policy(v) for v in [2.49, 2.5, 2.52, 3.]],
              'interpretation': 'Actual released-model scores on authored examples; no independent performance estimate.'}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'revision': REVISION, 'architecture': report['architecture'],
                      'examples': [{k: r[k] for k in ['id', 'model_tokens', 'raw_score', 'integer_score', 'kept']} for r in outputs]}, indent=2))


if __name__ == '__main__':
    main()

"""Keep conditional NLL, free generation and constrained classification separate.

Run: python sft_evaluate.py --verify --output evaluation-contract.json
For a saved model: add --model PATH --data PATH --split test (requires Transformers).
Evaluation is read-only; the scientific driver calls test only after all fits.
"""
import argparse
import json
from pathlib import Path

import torch
import torch.nn.functional as F

from sft_data import LABELS, collate, encode_record, load_source


def chunks(rows, size):
    if size < 1:
        raise ValueError('Positive batch size required')
    for start in range(0, len(rows), size):
        yield rows[start:start + size]


@torch.no_grad()
def response_nll(model, encoded, batch_size=8, include_rows=False):
    """Pool answer/EOS sums and target counts, never average batch means."""
    model.eval()
    total, targets, results = 0., 0, []
    for rows in chunks(encoded, batch_size):
        batch = collate(rows, policy='response', pad_id=rows[0]['eos_id'])
        logits = model(input_ids=batch['input_ids'], attention_mask=batch['attention_mask'], use_cache=False).logits
        labels = batch['labels'][:, 1:]
        terms = F.cross_entropy(logits[:, :-1].reshape(-1, logits.shape[-1]), labels.reshape(-1),
                                ignore_index=-100, reduction='none').reshape_as(labels)
        counts = (labels != -100).sum(-1)
        sums = terms.double().sum(-1)
        for row, value, count in zip(rows, sums.tolist(), counts.tolist()):
            total += value; targets += count
            results.append({'id': row['id'], 'nll_sum': value, 'targets': count, 'nll': value/count})
    if not targets:
        raise ValueError('No response targets to evaluate')
    result = {'nll_sum': total, 'targets': targets, 'nll': total/targets, 'records': len(encoded)}
    if include_rows: result['rows'] = results
    return result


@torch.no_grad()
def greedy_completions(model, tokenizer, encoded, batch_size=8, max_new_tokens=8):
    """Full output-vocabulary argmax, right-padding addressed by actual lengths.

    The most recent valid prompt/generated position supplies each row's logits.
    EOS stops that row. Padding shares EOS's stored ID but is never an action.
    Unmapped padded-vocabulary IDs are retained and make an invalid completion;
    silently dropping such an emitted ID could turn invalid text into a label.
    """
    if max_new_tokens < 1:
        raise ValueError('Positive generation cap required')
    model.eval(); results = []
    for rows in chunks(encoded, batch_size):
        lengths = torch.tensor([len(row['prompt_ids']) for row in rows])
        capacity = int(lengths.max()) + max_new_tokens
        ids = torch.full((len(rows), capacity), tokenizer.eos_token_id, dtype=torch.long)
        for i, row in enumerate(rows): ids[i, :lengths[i]] = torch.tensor(row['prompt_ids'])
        active = torch.ones(len(rows), dtype=torch.bool)
        generated = [[] for _ in rows]
        stopped = [False] * len(rows)
        for _ in range(max_new_tokens):
            width = int(lengths.max())
            valid = torch.arange(width)[None] < lengths[:, None]
            logits = model(input_ids=ids[:, :width], attention_mask=valid.long(), use_cache=False).logits
            next_ids = logits[torch.arange(len(rows)), lengths - 1].argmax(-1)
            for i in range(len(rows)):
                if not active[i]: continue
                token = int(next_ids[i]); generated[i].append(token)
                ids[i, lengths[i]] = token; lengths[i] += 1
                if token == tokenizer.eos_token_id:
                    active[i] = False; stopped[i] = True
            if not bool(active.any()): break
        for row, emitted, eos in zip(rows, generated, stopped):
            unmapped = [token for token in emitted if token >= len(tokenizer)]
            text = tokenizer.decode(emitted, skip_special_tokens=True) if not unmapped else None
            normalized = text.strip() if text is not None else None
            prediction = normalized if normalized in LABELS else 'invalid'
            results.append({'id': row['id'], 'gold': row['label'], 'ids': emitted, 'text': text,
                            'unmapped_ids': unmapped, 'prediction': prediction, 'eos_stopped': eos})
    return results


@torch.no_grad()
def constrained_classification(model, tokenizer, rows, batch_size=8):
    """Sum each complete candidate's conditional log probability, including EOS.

    This is a three-candidate decision rule. It is not free-generation accuracy.
    There is no length normalization; fixed LABELS order breaks an exact tie.
    """
    encoded = []
    for row in rows:
        for candidate in LABELS:
            encoded.append(encode_record(row, tokenizer, candidate=candidate))
    scores = response_nll(model, encoded, batch_size, include_rows=True)['rows']
    results = []
    for index, row in enumerate(rows):
        logp = [-score['nll_sum'] for score in scores[3*index:3*index+3]]
        choice = max(range(3), key=lambda j: logp[j])
        results.append({'id': row['id'], 'gold': row['label'], 'candidate_logp': logp,
                        'prediction': LABELS[choice]})
    return results


def classification_metrics(rows):
    """Three gold classes and an explicit fourth invalid prediction column."""
    if not rows:
        raise ValueError('Nonempty evaluation rows required')
    predictions = list(LABELS) + ['invalid']
    matrix = [[0] * 4 for _ in LABELS]
    for row in rows:
        if row['gold'] not in LABELS or row['prediction'] not in predictions:
            raise ValueError('Unknown gold/prediction category')
        matrix[LABELS.index(row['gold'])][predictions.index(row['prediction'])] += 1
    f1 = []
    for i in range(3):
        tp = matrix[i][i]
        fp = sum(matrix[j][i] for j in range(3)) - tp
        fn = sum(matrix[i]) - tp  # Includes invalid predictions.
        denominator = 2*tp + fp + fn
        f1.append(2*tp/denominator if denominator else 0.)
    return {'gold_order': list(LABELS), 'prediction_order': predictions, 'confusion': matrix,
            'accuracy': sum(matrix[i][i] for i in range(3))/len(rows), 'class_f1': f1,
            'macro_f1': sum(f1)/3, 'valid_label_rate': 1-sum(row[3] for row in matrix)/len(rows)}


def evaluate(model, tokenizer, rows, batch_size=8):
    encoded = [encode_record(row, tokenizer) for row in rows]
    nll = response_nll(model, encoded, batch_size, include_rows=True)
    free = greedy_completions(model, tokenizer, encoded, batch_size)
    constrained = constrained_classification(model, tokenizer, rows, batch_size)
    return {'response': nll, 'generation': {'rows': free, **classification_metrics(free),
             'eos_stop_rate': sum(row['eos_stopped'] for row in free)/len(free)},
            'constrained': {'rows': constrained, **classification_metrics(constrained)}}


def verify():
    # Hand matrix: negative→negative/invalid, neutral→negative, positive→positive.
    rows = [{'gold': LABELS[0], 'prediction': LABELS[0]},
            {'gold': LABELS[0], 'prediction': 'invalid'},
            {'gold': LABELS[1], 'prediction': LABELS[0]},
            {'gold': LABELS[2], 'prediction': LABELS[2]}]
    metrics = classification_metrics(rows)
    assert metrics['confusion'] == [[1, 0, 0, 1], [1, 0, 0, 0], [0, 0, 1, 0]]
    assert metrics['accuracy'] == .5 and metrics['macro_f1'] == .5
    assert metrics['valid_label_rate'] == .75
    empty_class = classification_metrics([{'gold': LABELS[0], 'prediction': LABELS[0]}])
    assert empty_class['class_f1'] == [1., 0., 0.]

    class Uniform:
        def eval(self): return self
        def __call__(self, input_ids, attention_mask, use_cache=False):
            from types import SimpleNamespace
            return SimpleNamespace(logits=torch.zeros(*input_ids.shape, 11, dtype=torch.float64))
    encoded = [{'id': 'a', 'ids': [1, 2, 3, 0], 'boundary': 2, 'eos_id': 0},
               {'id': 'b', 'ids': [1, 2, 3, 4, 5, 0], 'boundary': 2, 'eos_id': 0}]
    one = response_nll(Uniform(), encoded, 1, True)
    together = response_nll(Uniform(), encoded, 2, True)
    assert one == together and one['targets'] == 6
    assert abs(one['nll'] - torch.tensor(11.).double().log().item()) < 1e-14
    class Tokens:
        eos_token_id = 0
        def __len__(self): return 13
        def decode(self, ids, skip_special_tokens=True):
            words = {5: 'negative', 6: 'no', 7: 'impact'}
            return ' '.join(words[token] for token in ids if token != 0)
    class Continuation:
        def eval(self): return self
        def __call__(self, input_ids, attention_mask, use_cache=False):
            from types import SimpleNamespace
            # A declared lookup fixture; each next-token row is deterministic.
            logits = torch.full((*input_ids.shape, 15), -20.)
            mapping = {2: 5, 4: 6, 6: 7, 8: 14}
            for i in range(len(input_ids)):
                for j, token in enumerate(input_ids[i].tolist()):
                    logits[i, j, mapping.get(token, 0)] = 20.
            return SimpleNamespace(logits=logits)
    prompts = [{'id': 'short', 'prompt_ids': [1, 2], 'label': 'negative'},
               {'id': 'long', 'prompt_ids': [1, 1, 1, 4], 'label': 'no impact'},
               {'id': 'unmapped', 'prompt_ids': [1, 8], 'label': 'positive'}]
    generated = greedy_completions(Continuation(), Tokens(), prompts, batch_size=3)
    assert [row['ids'] for row in generated] == [[5, 0], [6, 7, 0], [14, 0]]
    assert [row['prediction'] for row in generated] == ['negative', 'no impact', 'invalid']
    assert all(row['eos_stopped'] for row in generated)
    capped = greedy_completions(Continuation(), Tokens(), prompts[:2], batch_size=2, max_new_tokens=1)
    assert not any(row['eos_stopped'] for row in capped)
    assert capped[0]['prediction'] == 'negative' and capped[1]['prediction'] == 'invalid'
    return {'checks': ['Invalid-output confusion and macro-F1', 'Zero-denominator F1 convention',
                       'Pooled NLL invariant to unequal batch target counts and genuine EOS=PAD',
                       'Full-vocabulary greedy uses last valid positions for unequal prompts, independent EOS stops and unmapped IDs',
                       'EOS stop and valid label are distinct under the generation cap'],
            'metrics': metrics, 'uniform': one, 'generated_fixture': generated, 'capped_fixture': capped}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--verify', action='store_true'); parser.add_argument('--model', type=Path)
    parser.add_argument('--data', type=Path); parser.add_argument('--split', choices=['dev', 'test'], default='test')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.verify:
        result = verify()
    else:
        if args.model is None or args.data is None: parser.error('--model and --data are required')
        from transformers import AutoModelForCausalLM, AutoTokenizer
        torch.set_num_threads(2)
        model = AutoModelForCausalLM.from_pretrained(args.model, local_files_only=True).float()
        tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
        result = evaluate(model, tokenizer, load_source(args.data)[args.split])
    args.output.write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'output': str(args.output), 'keys': list(result)}))

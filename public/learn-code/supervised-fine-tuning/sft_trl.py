"""An executed ordinary TRL route with exact loss, gradient and update parity.

Run: python sft_trl.py --output-dir ./native-sft
Requires TRL 1.14.2, Transformers 5.19, datasets 5.1, accelerate 1.15 and Torch.
Creates a tiny random GPT-2 fixture locally; downloads no model or dataset.
This mechanism fixture is separate from the six pretrained Pythia fits.
"""
import argparse
import copy
import json
from pathlib import Path

import torch
import torch.nn.functional as F
import transformers
import trl
from datasets import Dataset
from tokenizers import Tokenizer, models, pre_tokenizers
from transformers import GPT2Config, GPT2LMHeadModel, PreTrainedTokenizerFast
from trl import SFTConfig, SFTTrainer


def tokenizer_fixture():
    words = ['<eos>', '<unk>', 'sentiment', ':', 'blue', 'negative', 'red', 'positive',
             'no', 'impact', '<user>', '<assistant>', '<tool>']
    backend = Tokenizer(models.WordLevel({word: i for i, word in enumerate(words)}, unk_token='<unk>'))
    backend.pre_tokenizer = pre_tokenizers.WhitespaceSplit()
    tokenizer = PreTrainedTokenizerFast(tokenizer_object=backend, eos_token='<eos>', pad_token='<eos>',
                                       unk_token='<unk>', additional_special_tokens=words[-3:])
    tokenizer.chat_template = (
        "{% for m in messages %}{% if m['role'] == 'assistant' %}"
        "{{ '<assistant> ' }}{% generation %}{{ m['content'] + ' <eos>' }}{% endgeneration %}{{ ' ' }}"
        "{% else %}{{ '<' + m['role'] + '> ' + m['content'] + ' <eos> ' }}{% endif %}{% endfor %}"
    )
    return tokenizer


def configuration(output, **overrides):
    values = dict(output_dir=str(output), use_cpu=True, bf16=False, fp16=False,
                  per_device_train_batch_size=2, max_steps=1, learning_rate=.01,
                  lr_scheduler_type='constant', weight_decay=0., max_grad_norm=0.,
                  report_to='none', save_strategy='no', logging_strategy='no', disable_tqdm=True,
                  max_length=64, packing=False, padding_free=False, loss_type='nll', seed=17, data_seed=17,
                  dataloader_num_workers=0, gradient_checkpointing=False)
    values.update(overrides)
    return SFTConfig(**values)


def explicit_loss(model, batch):
    logits = model(input_ids=batch['input_ids'], attention_mask=batch['attention_mask'], use_cache=False).logits
    labels = batch['labels'][:, 1:]
    return F.cross_entropy(logits[:, :-1].reshape(-1, logits.shape[-1]), labels.reshape(-1), ignore_index=-100)


def maximum_difference(left, right):
    return max(float((left[name]-right[name]).detach().abs().max()) for name in left)


def run(output):
    output.mkdir(parents=True, exist_ok=True)
    if (output/'report.json').exists(): raise FileExistsError('Preserve an existing native receipt; use another output directory')
    torch.set_num_threads(2); torch.manual_seed(73)
    tokenizer = tokenizer_fixture()
    model = GPT2LMHeadModel(GPT2Config(vocab_size=len(tokenizer), n_positions=64, n_embd=8,
                           n_layer=1, n_head=2, resid_pdrop=0., embd_pdrop=0., attn_pdrop=0.,
                           bos_token_id=0, eos_token_id=0, pad_token_id=0, use_cache=False))
    demonstrations = [{'prompt': 'sentiment : blue', 'completion': ' negative'},
                      {'prompt': 'sentiment : red', 'completion': ' no impact'}]
    dataset = Dataset.from_list(demonstrations)
    trainer = SFTTrainer(model=model, args=configuration(output/'trainer', completion_only_loss=True),
                         train_dataset=dataset, processing_class=tokenizer,
                         optimizers=(torch.optim.SGD(model.parameters(), lr=.01), None))
    prepared = [trainer.train_dataset[i] for i in range(2)]
    batch = trainer.data_collator(prepared)
    assert batch['input_ids'].tolist() == [[2, 3, 4, 5, 0, 0], [2, 3, 6, 8, 9, 0]]
    assert batch['labels'].tolist() == [[-100, -100, -100, 5, 0, -100], [-100, -100, -100, 8, 9, 0]]
    assert batch['attention_mask'].tolist() == [[1, 1, 1, 1, 1, 0], [1, 1, 1, 1, 1, 1]]
    # Construct an independent model so tied-weight registrations also belong to
    # that model; copying a framework object need not rebuild those registrations.
    reference = GPT2LMHeadModel(copy.deepcopy(model.config))
    reference.load_state_dict(model.state_dict())
    # Eval mode preserves the identical zero-dropout graph and keeps this probe
    # out of the trainer's cumulative count of actual training tokens.
    reference.eval(); model.eval()
    scratch = explicit_loss(reference, batch); scratch.backward()
    native = trainer.compute_loss(model, {k: v.clone() for k, v in batch.items()}); native.backward()
    grad_error = maximum_difference({n: p.grad for n, p in reference.named_parameters()},
                                    {n: p.grad for n, p in model.named_parameters()})
    torch.testing.assert_close(scratch, native, rtol=1e-6, atol=1e-7)
    assert grad_error < 1e-6
    # Clear metrics accumulated by the manual parity probe before actual training.
    trainer.log({'parity_probe_only': 1.})
    model.zero_grad(set_to_none=True)
    torch.optim.SGD(reference.parameters(), lr=.01).step()
    result = trainer.train()
    assert trainer.state.global_step == 1
    update_error = maximum_difference(dict(model.named_parameters()), dict(reference.named_parameters()))
    assert update_error < 1e-6
    trainer.save_model(str(output/'saved'))
    tokenizer.save_pretrained(output/'saved')
    reloaded = GPT2LMHeadModel.from_pretrained(output/'saved', local_files_only=True).eval()
    model.eval()
    with torch.no_grad():
        original = model(input_ids=batch['input_ids'], attention_mask=batch['attention_mask']).logits
        restored = reloaded(input_ids=batch['input_ids'], attention_mask=batch['attention_mask']).logits
    torch.testing.assert_close(original, restored, rtol=0, atol=0)

    # The same plain text schema carries no prompt/completion boundary.
    text_dataset = Dataset.from_list([{'text': row['prompt']+row['completion']} for row in demonstrations])
    text_trainer = SFTTrainer(model=copy.deepcopy(reloaded), args=configuration(output/'text-only'),
                              train_dataset=text_dataset, processing_class=tokenizer)
    text_batch = text_trainer.data_collator([text_trainer.train_dataset[i] for i in range(2)])
    response_count = int((batch['labels'][:, 1:] != -100).sum())
    full_count = int((text_batch['labels'][:, 1:] != -100).sum())
    assert response_count == 5 and full_count == 9

    messages = [{'role': 'user', 'content': 'blue'}, {'role': 'assistant', 'content': 'negative'},
                {'role': 'tool', 'content': 'red'}, {'role': 'assistant', 'content': 'positive'}]
    chat_trainer = SFTTrainer(model=copy.deepcopy(reloaded),
                              args=configuration(output/'assistant', assistant_only_loss=True),
                              train_dataset=Dataset.from_list([{'messages': messages}]), processing_class=tokenizer)
    chat = chat_trainer.train_dataset[0]
    selected = [value for value in chat['labels'] if value != -100]
    assert selected == [5, 0, 7, 0]  # Content and EOS, never user/tool or role prefix.
    mask = tokenizer.apply_chat_template(messages, tokenize=True, return_dict=True, return_assistant_tokens_mask=True)
    assert [value for value, keep in zip(mask['input_ids'], mask['assistant_masks']) if keep] == selected

    report = {'versions': {'torch': torch.__version__, 'transformers': transformers.__version__, 'trl': trl.__version__},
              'checks': ['Actual raw prompt/completion preparation preserves genuine EOS and ignores padding',
                         'Native/scratch shifted loss and every parameter gradient agree',
                         'Actual one-step SFTTrainer SGD equals explicit update; saved/reloaded logits exact',
                         'Text-only schema changes target count from5 to9',
                         'Actual generation-aware chat template selects all assistant content/EOS only'],
              'batch': {k: v.tolist() for k, v in batch.items()}, 'scratch_loss': float(scratch.detach()),
              'native_loss': float(native.detach()), 'gradient_error': grad_error, 'update_error': update_error,
              'native_train': result.metrics, 'response_targets': response_count, 'text_targets': full_count,
              'assistant_record': chat, 'assistant_selected_ids': selected}
    (output/'report.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'checks': report['checks'], 'gradient_error': grad_error, 'update_error': update_error}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--output-dir', type=Path, required=True)
    run(parser.parse_args().output_dir)

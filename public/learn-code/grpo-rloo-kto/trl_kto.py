"""Ordinary KTO on explicit correct/incorrect poem-label responses.

Run: python trl_kto.py --model ./response-17/selected --data ./data --output ./native-kto
Desirability means agreement with this dataset's retained gold label. It is
not inferred from a relative preference comparison or an uncontrolled click.
"""
import argparse
import copy
import json
from pathlib import Path

import torch
from datasets import Dataset
from trl import KTOConfig, KTOTrainer

from group_losses import response_logps
from kto_loss import kto_loss, practical_reference
from online_preferences import load_policy, parameter_change, sha256
from sft_data import LABELS, encode_record, load_source, prompt
from sft_evaluate import evaluate
from trl_group_training import compare_gradients, serializable


def sequence_scores(model, inputs, prefix=''):
    logps,mask = response_logps(model,inputs[prefix+'input_ids'],
                                inputs[prefix+'attention_mask'],inputs[prefix+'completion_mask'])
    return (logps*mask).sum(-1)


class InspectedKTO(KTOTrainer):
    def __init__(self,*args,**kwargs):
        self.parity_records = []
        self.batch_records = []
        self.check_shadow_step = False
        super().__init__(*args,**kwargs)

    def _compute_loss(self,model,inputs,return_outputs):
        result = super()._compute_loss(model,inputs,return_outputs)
        if not torch.is_grad_enabled():
            return result
        native = result[0] if return_outputs else result
        scores = sequence_scores(model,inputs)
        with torch.no_grad():
            mismatch = sequence_scores(model,inputs,'KL_')
            if self.precompute_ref_logps:
                reference = inputs['ref_logps']
                mismatch_reference = inputs['ref_KL_logps']
            else:
                reference = sequence_scores(self.ref_model,inputs)
                mismatch_reference = sequence_scores(self.ref_model,inputs,'KL_')
        point = practical_reference(mismatch,mismatch_reference)
        manual,details = kto_loss(scores,reference,inputs['label'].bool(),point,
                                   beta=self.beta,desirable_weight=self.desirable_weight,
                                   undesirable_weight=self.undesirable_weight)
        parameters = [p for p in model.parameters() if p.requires_grad]
        comparison = compare_gradients(native,manual,parameters,self.check_shadow_step)
        self.check_shadow_step = False
        comparison.update(reference_point=float(point),labels=inputs['label'].tolist(),
                          model_mode='train' if model.training else 'eval',
                          details=serializable(details))
        self.parity_records.append(comparison)
        self.batch_records.append(serializable(inputs))
        if model.training:
            receipt = Path(self.args.output_dir).parent/f'training-batch-{len(self.batch_records)}.json'
            receipt.write_text(json.dumps({'inputs':self.batch_records[-1],'parity':comparison},indent=2)+'\n',encoding='utf-8')
        return result


def constructed_parity(trainer):
    """Use one actual prepared batch, then explicit reference/label fixtures."""
    inputs = next(iter(trainer.get_train_dataloader()))
    trainer.model.eval()
    with torch.no_grad():
        current = sequence_scores(trainer.model,inputs)
        mismatch = sequence_scores(trainer.model,inputs,'KL_')
    cases = []
    original_flag = trainer.precompute_ref_logps
    trainer.precompute_ref_logps = True
    try:
        fixtures = [('matched',inputs['label'],0.,0.),
                    ('positive-reference-point',inputs['label'],.2,.4),
                    ('all-desirable',torch.ones_like(inputs['label']),-.3,-.2),
                    ('all-undesirable',torch.zeros_like(inputs['label']),.4,.1)]
        for name,labels,score_shift,mismatch_shift in fixtures:
            changed = {**inputs,'label':labels,
                       'ref_logps':current-score_shift,
                       'ref_KL_logps':mismatch-mismatch_shift}
            trainer.check_shadow_step = not cases
            trainer._compute_loss(trainer.model,changed,False)
            cases.append({'name':name,**trainer.parity_records[-1]})
    finally:
        trainer.precompute_ref_logps = original_flag
    return {'boundary':'Actual tokenized batch with declared artificial reference scores/label cases; shadow SGD is not a scientific model fit.',
            'cases':cases}


def configuration(output):
    return KTOConfig(output_dir=str(output),use_cpu=True,bf16=False,fp16=False,
                       report_to='none',per_device_train_batch_size=4,gradient_accumulation_steps=1,
                       max_steps=2,learning_rate=1e-5,optim='sgd',weight_decay=0.,
                       lr_scheduler_type='constant',max_grad_norm=0.,seed=71,data_seed=71,
                       save_strategy='no',logging_steps=1,disable_tqdm=True,
                       gradient_checkpointing=False,disable_dropout=True,max_length=64,
                       beta=.1,desirable_weight=2.,undesirable_weight=1.,
                       train_sampling_strategy='sequential',precompute_ref_log_probs=False)


def run(model_path,data_path,output,preflight_only=False):
    output = Path(output)
    output.mkdir(parents=True,exist_ok=False)
    torch.set_num_threads(2)
    torch.manual_seed(71)
    model,tokenizer = load_policy(model_path)
    initial = copy.deepcopy(model).requires_grad_(False)
    source = load_source(data_path)
    train = sorted(source['train'],key=lambda row:row['id'])[:16]
    test = sorted(source['test'],key=lambda row:row['id'])[:32]
    raw = []
    for row in train:
        for candidate in LABELS:
            # This also checks the exact shared serialization before native prep.
            encode_record(row,tokenizer,candidate=candidate)
            raw.append({'prompt':prompt(row['verse']),'completion':' '+candidate,
                        'label':candidate==row['label'],'source_id':row['id'],
                        'candidate':candidate,'gold':row['label']})
    config = configuration(output/'trainer')
    trainer = InspectedKTO(model=model,args=config,train_dataset=Dataset.from_list(raw),
                           processing_class=tokenizer)
    prepared = [dict(row) for row in trainer.train_dataset]
    if len(prepared) != 48:
        raise AssertionError('Native preparation changed the prospective record count; inspect before any fit.')
    for start in range(0,len(prepared),4):
        group = prepared[start:start+4]
        expected = [group[-1]['completion_ids']]+[r['completion_ids'] for r in group[:-1]]
        if [r['KL_completion_ids'] for r in group] != expected:
            raise AssertionError('Native KL pairing differs from the inspected cyclic preparation.')
    (output/'prepared.json').write_text(json.dumps(prepared,indent=2)+'\n',encoding='utf-8')
    parity = constructed_parity(trainer)
    (output/'constructed-parity.json').write_text(json.dumps(parity,indent=2)+'\n',encoding='utf-8')
    if preflight_only:
        return {'status':'preflight-pass','optimizer_training_steps':0,'parity':parity,'prepared_count':len(prepared)}
    before = evaluate(model,tokenizer,test)
    trainer.parity_records.clear()
    trainer.batch_records.clear()
    resolved_configuration = config.to_dict()
    (output/'configuration.json').write_text(json.dumps(resolved_configuration,indent=2)+'\n',encoding='utf-8')
    metrics = trainer.train().metrics
    after = evaluate(model,tokenizer,test)
    saved = output/'selected'
    trainer.save_model(str(saved))
    tokenizer.save_pretrained(saved)
    reloaded,_ = load_policy(saved)
    for observed,wanted in zip(reloaded.parameters(),model.parameters(),strict=True):
        torch.testing.assert_close(observed,wanted,atol=0,rtol=0)
    report = {'method':'kto','configuration':resolved_configuration,
              'initial_weights_sha256':sha256(Path(model_path)/'model.safetensors'),
              'train_ids':[row['id'] for row in train],'test_ids':[row['id'] for row in test],
              'prepared_count':len(prepared),'prepared':prepared,'metrics':metrics,
              'native_batches':trainer.batch_records,'actual_batch_parity':trainer.parity_records,
              'constructed_parity':parity,'before':before,'after':after,
              'parameter_change':parameter_change(model,initial),'reload_exact':True}
    (output/'report.json').write_text(json.dumps(serializable(report),indent=2)+'\n',encoding='utf-8')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model',type=Path,required=True)
    parser.add_argument('--data',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--preflight-only',action='store_true')
    args = parser.parse_args()
    report = run(args.model,args.data,args.output,args.preflight_only)
    print(json.dumps({'output':str(args.output),'preflight_only':args.preflight_only,
                      'prepared_count':report.get('prepared_count'),
                      'parameter_change':report.get('parameter_change')}))


if __name__ == '__main__':
    main()

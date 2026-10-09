"""Ordinary pinned GRPO/RLOO trainers with independent loss/gradient inspection.

Run: python trl_group_training.py --model ./response-17/selected --data ./data \
  --method grpo --output ./native-grpo
Tested API target: TRL1.14.2, Transformers5.19.0, PyTorch2.14 CPU.
"""
import argparse
import copy
import json
from pathlib import Path

import torch
from datasets import Dataset
from trl import GRPOConfig, GRPOTrainer, RLOOConfig, RLOOTrainer

from group_losses import grpo_loss, response_logps, rloo_loss
from online_preferences import classify_ids, load_policy, parameter_change, sha256
from sft_data import load_source, prompt
from sft_evaluate import evaluate


def serializable(value):
    if torch.is_tensor(value):
        return value.detach().cpu().tolist()
    if isinstance(value, dict):
        return {key:serializable(item) for key,item in value.items()}
    if isinstance(value, (list,tuple)):
        return [serializable(item) for item in value]
    return value


def compare_gradients(native, manual, parameters, check_step=False):
    """All trainable parameters, including absent-gradient agreement.

    retain_graph preserves the native training loss for the real backward pass.
    Optional SGD uses shadow parameters and never changes the learner's model.
    """
    parameters = tuple(parameters)
    actual = torch.autograd.grad(native,parameters,retain_graph=True,allow_unused=True)
    expected = torch.autograd.grad(manual,parameters,allow_unused=True)
    precise = native.dtype == torch.float64
    torch.testing.assert_close(native,manual,atol=1e-11 if precise else 3e-6,
                               rtol=1e-10 if precise else 2e-5)
    maximum = 0.
    compared = 0
    for observed,wanted in zip(actual,expected,strict=True):
        if observed is None or wanted is None:
            if observed is not None or wanted is not None:
                raise AssertionError('Native and scratch disagree about an unused parameter.')
            continue
        torch.testing.assert_close(observed,wanted,atol=1e-10 if precise else 2e-5,
                                   rtol=1e-9 if precise else 5e-4)
        maximum = max(maximum,float((observed-wanted).abs().max()))
        compared += observed.numel()
    step_error = None
    if check_step:
        left = [torch.nn.Parameter(p.detach().clone()) for p in parameters]
        right = [torch.nn.Parameter(p.detach().clone()) for p in parameters]
        for p,g in zip(left,actual):
            p.grad = None if g is None else g.detach().clone()
        for p,g in zip(right,expected):
            p.grad = None if g is None else g.detach().clone()
        torch.optim.SGD(left,lr=1e-5).step()
        torch.optim.SGD(right,lr=1e-5).step()
        step_error = 0.
        for a,b in zip(left,right):
            torch.testing.assert_close(a,b,atol=2e-12 if precise else 2e-6,
                                       rtol=2e-11 if precise else 2e-5)
            step_error = max(step_error,float((a-b).abs().max().detach()))
    return {'native_loss':float(native.detach()),'scratch_loss':float(manual.detach()),
            'comparison_dtype':str(native.dtype),
            'maximum_gradient_difference':maximum,'compared_gradient_elements':compared,
            'shadow_sgd_maximum_difference':step_error}


class InspectedLoss:
    """Observe the native trainer; sampling and its optimization remain native."""
    def __init__(self,*args,**kwargs):
        self.batch_records = []
        self.parity_records = []
        self.check_shadow_step = False
        super().__init__(*args,**kwargs)

    def _get_per_token_logps_and_entropies(self,*args,**kwargs):
        result = super()._get_per_token_logps_and_entropies(*args,**kwargs)
        self.last_logps = result[0]
        return result

    def _generate_and_score_completions(self,inputs):
        result = super()._generate_and_score_completions(inputs)
        self.batch_records.append(serializable(result))
        receipt = Path(self.args.output_dir).parent/f'generated-batch-{len(self.batch_records)}.json'
        receipt.write_text(json.dumps(self.batch_records[-1],indent=2)+'\n',encoding='utf-8')
        return result

    def _compute_loss(self,model,inputs):
        native = super()._compute_loss(model,inputs)
        if not torch.is_grad_enabled():
            return native
        native_logps = self.last_logps
        mask = inputs['completion_mask']
        ids = torch.cat([inputs['prompt_ids'],inputs['completion_ids']],dim=1)
        attention = torch.cat([inputs['prompt_mask'],mask],dim=1)
        targets = torch.cat([torch.zeros_like(inputs['prompt_mask']),mask],dim=1)
        full_logps,_ = response_logps(model,ids,attention,targets)
        direct = full_logps[:,-mask.shape[1]:]
        # Native selective scoring writes zeros in ignored cells; the raw
        # backbone retains finite scores there. Compare the selected actions.
        selected = mask.bool()
        torch.testing.assert_close(native_logps[selected],direct[selected],atol=2e-5,rtol=2e-5)
        if isinstance(self,GRPOTrainer):
            old = inputs.get('old_per_token_logps')
            old = native_logps.detach() if old is None else old
            manual,_ = grpo_loss(direct,old,inputs['ref_per_token_logps'],mask,inputs['advantages'],
                                 beta=self.beta,epsilon=self.epsilon_low,
                                 bias_correction_kl=self.args.use_bias_correction_kl)
        else:
            # Distribute the fixed sequence old score across selected positions;
            # only its masked sum enters the RLOO objective.
            old_sum = inputs['old_logps']
            current_sum = (direct.detach()*mask).sum(-1)
            old = direct.detach()+(old_sum-current_sum)[:,None]/mask.sum(-1).clamp_min(1)[:,None]
            manual,_ = rloo_loss(direct,old,mask,inputs['advantages'],epsilon=self.epsilon_low)
        parameters = [p for p in model.parameters() if p.requires_grad]
        result = compare_gradients(native,manual,parameters,self.check_shadow_step)
        self.check_shadow_step = False
        result['model_mode'] = 'train' if model.training else 'eval'
        self.parity_records.append(result)
        return native


class InspectedGRPO(InspectedLoss,GRPOTrainer):
    pass


class InspectedRLOO(InspectedLoss,RLOOTrainer):
    pass


def _constructed_parity_cases(trainer,method):
    """Nonzero unequal-length cases, separate from sampled task performance."""
    trainer.model.eval()
    prompts = torch.tensor([[2,3]]*4)
    completion = torch.tensor([[4,0,0],[5,6,0],[7,0,0],[8,9,0]])
    mask = torch.tensor([[1,1,0],[1,1,1],[1,1,0],[1,1,1]])
    ids = torch.cat([prompts,completion],dim=1)
    attention = torch.cat([torch.ones_like(prompts),mask],dim=1)
    with torch.no_grad():
        current,_,_ = trainer._get_per_token_logps_and_entropies(trainer.model,ids,attention,3)
    advantages = torch.tensor([-1.,1.,-.5,.5])
    cases = []
    for correction in ((False,True) if method=='grpo' else (False,)):
        if method=='grpo':
            trainer.args.use_bias_correction_kl = correction
        for shift in (0.,.4,-.4):
            old = current-shift
            inputs = {'prompt_ids':prompts,'prompt_mask':torch.ones_like(prompts),
                      'completion_ids':completion,'completion_mask':mask,'advantages':advantages,
                      'num_items_in_batch':mask.sum()}
            if method=='grpo':
                inputs.update(old_per_token_logps=old,ref_per_token_logps=current+.15)
            else:
                inputs['old_logps'] = (old*mask).sum(-1)
            trainer.check_shadow_step = not cases
            trainer._compute_loss(trainer.model,inputs)
            cases.append({'log_ratio_shift':shift,'bias_correction_kl':correction,
                          **trainer.parity_records[-1]})
    if method=='grpo':
        trainer.args.use_bias_correction_kl = False
    return {'boundary':'Constructed scores/advantages and shadow SGD, not sampled rewards or a neural training campaign.',
            'cases':cases}


def constructed_parity(trainer,method):
    """Use FP64 for ill-conditioned synthetic coordinates, then restore FP32.

    Scientific task updates and their actual-batch comparisons keep the original
    FP32 settings. Converting back must preserve every original parameter value.
    """
    original_dtype = next(trainer.model.parameters()).dtype
    before = [parameter.detach().clone() for parameter in trainer.model.parameters()]
    try:
        trainer.model.to(dtype=torch.float64)
        result = _constructed_parity_cases(trainer,method)
    finally:
        trainer.model.to(dtype=original_dtype)
        for current,expected in zip(trainer.model.parameters(),before,strict=True):
            torch.testing.assert_close(current,expected,atol=0,rtol=0)
    result['constructed_dtype'] = 'torch.float64'
    result['training_dtype_restored'] = str(original_dtype)
    result['initial_weights_restored_exactly'] = True
    return result


def configuration(method,output):
    common = dict(output_dir=str(output),use_cpu=True,bf16=False,fp16=False,
                  report_to='none',per_device_train_batch_size=4,gradient_accumulation_steps=1,
                  max_steps=2,learning_rate=1e-5,optim='sgd',weight_decay=0.,
                  lr_scheduler_type='constant',max_grad_norm=0.,seed=71,data_seed=71,
                  save_strategy='no',logging_steps=1,disable_tqdm=True,gradient_checkpointing=False,
                  num_generations=4,max_completion_length=8,temperature=1.,top_p=1.,top_k=0,
                  beta=.01,epsilon=.2,num_iterations=1,mask_truncated_completions=False,
                  use_vllm=False,disable_dropout=True)
    return (GRPOConfig(**common,loss_type='grpo',scale_rewards='group',
                        importance_sampling_level='token',use_bias_correction_kl=False)
              if method=='grpo' else RLOOConfig(**common,normalize_advantages=False))


def run(model_path,data_path,method,output,preflight_only=False):
    output = Path(output)
    output.mkdir(parents=True,exist_ok=False)
    torch.set_num_threads(2)
    torch.manual_seed(71)
    model,tokenizer = load_policy(model_path)
    tokenizer.padding_side = 'left'
    initial = copy.deepcopy(model).requires_grad_(False)
    source = load_source(data_path)
    train = sorted(source['train'],key=lambda row:row['id'])[:16]
    test = sorted(source['test'],key=lambda row:row['id'])[:32]
    reward_records = []
    def reward_function(prompts,completions,completion_ids,gold,source_id,**kwargs):
        values = []
        for text,ids,label,identity in zip(completions,completion_ids,gold,source_id,strict=True):
            result = classify_ids(tokenizer,ids)
            value = float(result['prediction']==label)
            values.append(value)
            reward_records.append({'id':identity,'gold':label,'ids':ids,'native_text':text,
                                   **result,'reward':value})
            with (output/'reward-history.jsonl').open('a',encoding='utf-8') as handle:
                handle.write(json.dumps(reward_records[-1])+'\n')
        return values
    config = configuration(method,output/'trainer')
    data = Dataset.from_list([{'prompt':prompt(row['verse']),'gold':row['label'],'source_id':row['id']}
                              for row in train])
    cls = InspectedGRPO if method=='grpo' else InspectedRLOO
    trainer = cls(model=model,args=config,train_dataset=data,reward_funcs=reward_function,
                  processing_class=tokenizer)
    parity = constructed_parity(trainer,method)
    (output/'constructed-parity.json').write_text(json.dumps(parity,indent=2)+'\n',encoding='utf-8')
    if preflight_only:
        return {'status':'preflight-pass','optimizer_training_steps':0,'generated_completions':0,'parity':parity}
    before = evaluate(model,tokenizer,test)
    resolved_configuration = config.to_dict()
    (output/'configuration.json').write_text(json.dumps(resolved_configuration,indent=2)+'\n',encoding='utf-8')
    trainer.parity_records.clear()
    metrics = trainer.train().metrics
    after = evaluate(model,tokenizer,test)
    saved = output/'selected'
    trainer.save_model(str(saved))
    tokenizer.save_pretrained(saved)
    reloaded,_ = load_policy(saved)
    for observed,wanted in zip(reloaded.parameters(),model.parameters(),strict=True):
        torch.testing.assert_close(observed,wanted,atol=0,rtol=0)
    report = {'method':method,'configuration':resolved_configuration,'initial_weights_sha256':sha256(Path(model_path)/'model.safetensors'),
              'train_ids':[row['id'] for row in train],'test_ids':[row['id'] for row in test],
              'metrics':metrics,'reward_records':reward_records,'native_batches':trainer.batch_records,
              'actual_batch_parity':trainer.parity_records,'constructed_parity':parity,
              'before':before,'after':after,'parameter_change':parameter_change(model,initial),
              'reload_exact':True}
    (output/'report.json').write_text(json.dumps(serializable(report),indent=2)+'\n',encoding='utf-8')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model',type=Path,required=True)
    parser.add_argument('--data',type=Path,required=True)
    parser.add_argument('--method',choices=['grpo','rloo'],required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--preflight-only',action='store_true')
    args = parser.parse_args()
    result = run(args.model,args.data,args.method,args.output,args.preflight_only)
    print(json.dumps({'output':str(args.output),'method':args.method,'preflight_only':args.preflight_only,
                      'parameter_change':result.get('parameter_change')}))


if __name__ == '__main__':
    main()

"""Bounded supplied-state failure tests; no language model, sample or optimizer step."""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import random
import sys
import tempfile

import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization'
PUBLIC = ROOT / 'public/learn-code/dapo'
sys.path.insert(0, str(PUBLIC))
import train_dapo
import trl_dapo
from scientific_journal import ScientificJournal, rng_states

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def tree(path):
    return ast.parse(Path(path).read_text(encoding='utf-8'))

def named(path, name):
    return next(node for node in ast.walk(tree(path))
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == name)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    paths = [*sorted(PUBLIC.glob('*.py')), Path(__file__)]
    initial = {p.relative_to(ROOT).as_posix(): sha(p) for p in paths}
    checks = []
    def check(value, label):
        assert value, label
        checks.append(label)

    old = FOLDER / 'program-r1-predecessor'
    original = json.loads((old / 'program-inputs.json').read_text())
    for relative, expected in original['files'].items():
        check(sha(old / relative) == expected, 'exact predecessor ' + relative)
    for name in ['dapo_math.py', 'dapo_collect.py', 'dapo_checks.py', 'practice_answers.py', 'report_dapo.py']:
        check(ast.dump(tree(PUBLIC/name)) == ast.dump(tree(old/'public/learn-code/dapo'/name)),
              'format-only complete AST ' + name)
    for name in ['online_preferences.py', 'group_losses.py', 'sft_data.py', 'sft_evaluate.py']:
        check(sha(PUBLIC/name) == sha(old/'public/learn-code/dapo'/name), 'byte-exact helper ' + name)
    check(ast.dump(named(PUBLIC/'train_dapo.py', 'prompt_plan')) ==
          ast.dump(named(old/'public/learn-code/dapo/train_dapo.py', 'prompt_plan')), 'prompt plan unchanged')
    for filename, constructor in [('train_dapo.py', 'SGD'), ('trl_dapo.py', 'GRPOConfig')]:
        def calls(path):
            return [ast.dump(node) for node in ast.walk(tree(path))
                    if isinstance(node, ast.Call) and
                    ((isinstance(node.func, ast.Name) and node.func.id == constructor) or
                     (isinstance(node.func, ast.Attribute) and node.func.attr == constructor))]
        check(calls(PUBLIC/filename) == calls(old/'public/learn-code/dapo'/filename),
              'scientific constructor unchanged ' + constructor)
    check(sha(PUBLIC/'scientific_journal.py') == sha(ROOT/'public/learn/examples/rlvr/scientific_journal.py'),
          'journal exact previously reviewed reuse')
    check(sha(FOLDER/'program-protocol.md') == original['files'][(FOLDER/'program-protocol.md').relative_to(ROOT).as_posix()],
          'protocol unchanged')

    class Supplied:
        training = False
        def __init__(self):
            self.weight = torch.tensor([.25, -.5], requires_grad=True)
        def state_dict(self):
            return {'weight': self.weight.detach()}
        def named_parameters(self):
            return [('weight', self.weight)]

    with tempfile.TemporaryDirectory(prefix='dapo-retention-') as temp:
        base = Path(temp)
        journal = ScientificJournal(base/'state')
        supplied = Supplied()
        supplied.weight.grad = torch.tensor([.2, -.1])
        optimizer = torch.optim.SGD([supplied.weight], lr=1e-4)
        before_rng = rng_states()
        old_scores = torch.tensor([[-.3, -.7]])
        context = {'batch': {'ids': torch.tensor([[2,3]])},
                   'record': {'old_logps': old_scores, 'advantages': torch.tensor([.5])},
                   'scheduler': {'last_epoch': 1}, 'trainer_state': {'global_step': 1}}
        journal.append('supplied-context', context)
        train_dapo.checkpoint(base/'state/latest-state.pt', supplied, optimizer,
                             {'boundary':'completed-update', 'iteration':1}, journal, **context)
        saved = torch.load(base/'state/latest-state.pt', weights_only=False)
        check(saved['boundary'] == 'completed-update', 'coherent boundary recorded')
        check(torch.equal(saved['state']['model']['weight'], supplied.weight), 'model exact')
        check(torch.equal(saved['state']['gradients']['weight'], supplied.weight.grad), 'gradients exact')
        check(saved['state']['optimizer']['param_groups'][0]['lr'] == 1e-4, 'optimizer exact')
        check(torch.equal(saved['state']['context']['record']['old_logps'], old_scores), 'frozen old scores exact')
        check(torch.equal(saved['state']['context']['batch']['ids'], context['batch']['ids']), 'batch exact')
        check(saved['state']['context']['scheduler'] == context['scheduler'], 'scheduler exact')
        check(saved['state']['context']['trainer_state'] == context['trainer_state'], 'trainer progress exact')
        after_rng = rng_states()
        check(before_rng['python'] == after_rng['python'], 'Python RNG unchanged')
        check(np.array_equal(before_rng['numpy'][1], after_rng['numpy'][1]), 'NumPy RNG unchanged')
        check(torch.equal(before_rng['torch'], after_rng['torch']), 'Torch RNG unchanged')
        check(not (base/'state/latest-state.tmp').exists(), 'atomic replacement leaves no temporary')

        # Actual parity routine, supplied scalar leaves only. No model forward.
        for case, value in [('loss', 1.), ('gradient', 0.)]:
            leaf = torch.tensor(value, dtype=torch.float64, requires_grad=True)
            try:
                trl_dapo.compare(leaf, 2*leaf, [leaf], journal=journal, case=case)
            except AssertionError:
                journal.failure(journal.location, sys.exception())
            else:
                raise AssertionError('Constructed mismatch did not fail')
        events = [json.loads(line) for line in journal.log.read_text().splitlines()]
        losses = [e['observation'] for e in events if e['kind'] == 'native-loss-comparison']
        check(losses[0]['native'] == 1 and losses[0]['manual'] == 2, 'loss operands before assertion')
        gradient = next(e['observation'] for e in events if e['kind'] == 'native-gradient-comparison')
        check(gradient['maximum_error'] == 1, 'gradient error before assertion')
        operands = torch.load(base/'state/failed-gradient-gradient-0.pt', weights_only=True)
        check(operands['native'].item() == 1 and operands['manual'].item() == 2, 'failed gradient operands retained')
        check(events[-1]['kind'] == 'stage-failed', 'explicit failure durable')
        check(events[-1]['observation']['latest_checkpoint_sha256'] == sha(base/'state/latest-state.pt'),
              'failure binds actual latest state')

        for module, arguments in [(train_dapo, ('model','data','dapo-components',73)),
                                  (trl_dapo, ('model','data'))]:
            original_run = module._run
            called = []
            def synthetic(*args):
                called.append(True)
                target = args[-1]
                target.append('supplied-terminal-evaluation', {'value': .123})
                raise RuntimeError('deliberate post-evaluation failure')
            module._run = synthetic
            destination = base/module.__name__
            try:
                try:
                    module.run(*arguments, destination)
                except RuntimeError as error:
                    check(str(error) == 'deliberate post-evaluation failure', module.__name__+' propagates failure')
                logs = [json.loads(line) for line in (destination/'events.jsonl').read_text().splitlines()]
                check(logs[-2]['kind'] == 'supplied-terminal-evaluation', module.__name__+' prior observation survives')
                check(logs[-1]['kind'] == 'stage-failed', module.__name__+' catches and journals')
                try:
                    module.run(*arguments, destination)
                except FileExistsError:
                    check(len(called) == 1, module.__name__+' rejects old destination before scientific entry')
                else:
                    raise AssertionError('Old destination accepted')
            finally:
                module._run = original_run

    for path, expected in initial.items():
        check(sha(ROOT/path) == expected, 'source held frozen ' + path)
    result = {'passed':True, 'conditions':len(checks), 'checks':checks, 'inputs':initial,
              'language_models':0, 'model_forwards':0, 'generation':0, 'optimizer_steps':0,
              'scope':'Supplied tensors, actual parity failure paths and patched forbidden scientific entrypoints only'}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('x', encoding='utf-8') as stream:
        json.dump(result, stream, indent=2)
        stream.write('\n')
    print({'passed':True, 'conditions':len(checks), 'language_models':0, 'optimizer_steps':0})

if __name__ == '__main__':
    main()

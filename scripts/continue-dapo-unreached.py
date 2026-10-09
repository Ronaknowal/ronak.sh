"""Run only the three originally prescribed, unreached DAPO stages once.

The failed seed 73 remains failed. No retry, tolerance edit, extra evaluation,
sampling or optimization is performed for it or the three completed baselines.
Each new stage keeps its existing scientific guard and durable failure record.
"""
import argparse
import contextlib
import hashlib
import json
from pathlib import Path
import sys
import traceback

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization'
WORK = ROOT / 'scratch/dapo-research/study'

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def save(path, value):
    with Path(path).open('x', encoding='utf-8') as handle:
        json.dump(value, handle, indent=2)
        handle.write('\n')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--acceptance', type=Path, required=True)
    parser.add_argument('--acceptance-sha256', required=True)
    args = parser.parse_args()
    if sha(args.acceptance) != args.acceptance_sha256:
        raise RuntimeError('Acceptance changed')
    acceptance = json.loads(args.acceptance.read_text(encoding='utf-8'))
    if acceptance.get('accepted') is not True:
        raise RuntimeError('Independent continuation review required')
    packet_path = TOPIC / 'unreached-continuation-inputs.json'
    if acceptance['proposal_sha256'] != sha(packet_path):
        raise RuntimeError('Proposal changed')
    packet = json.loads(packet_path.read_text(encoding='utf-8'))
    for path, expected in packet['files'].items():
        if sha(ROOT / path) != expected:
            raise RuntimeError('Changed input: ' + path)
    for name in ['response-baseline-73', 'response-baseline-89', 'response-baseline-101']:
        if json.loads((WORK / (name + '.status.json')).read_text())['status'] != 'passed':
            raise RuntimeError('Completed baseline changed')
    if json.loads((WORK / 'dapo-components-73.status.json').read_text())['status'] != 'failed':
        raise RuntimeError('Original failed status must remain explicit')
    names = ['dapo-components-89', 'dapo-components-101', 'native']
    for name in names:
        if any((WORK / (name + suffix)).exists() for suffix in ['', '.status.json', '.stdout.txt', '.stderr.txt']):
            raise RuntimeError('Stage already attempted: ' + name)
    save(WORK / 'unreached-continuation-start.json', {
        'proposal_sha256': sha(packet_path), 'acceptance_sha256': sha(args.acceptance),
        'stages': names, 'previous_failure_preserved': True,
    })
    sys.path.insert(0, str(ROOT / 'public/learn-code/dapo'))
    import train_dapo
    import trl_dapo
    model = ROOT / 'scratch/sft-research/study/response-17/selected'
    data = ROOT / 'public/learn-code/dapo/data'
    initial = WORK / 'response-baseline-73/initial.json'
    outcomes = {}
    for name in names:
        with (WORK / (name + '.stdout.txt')).open('x', encoding='utf-8') as out, \
             (WORK / (name + '.stderr.txt')).open('x', encoding='utf-8') as err:
            try:
                with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
                    if name == 'native':
                        trl_dapo.run(model, data, WORK / name)
                    else:
                        train_dapo.run(model, data, 'dapo-components', int(name.rsplit('-', 1)[1]), WORK / name, initial)
                outcomes[name] = {'status': 'passed'}
            except Exception as error:
                traceback.print_exception(error, file=err)
                err.flush()
                outcomes[name] = {'status': 'failed', 'exception': type(error).__name__, 'message': str(error)}
        save(WORK / (name + '.status.json'), outcomes[name])
        print({'stage': name, **outcomes[name]}, flush=True)
    for path, expected in packet['files'].items():
        if sha(ROOT / path) != expected:
            raise RuntimeError('Changed input during continuation: ' + path)
    save(WORK / 'unreached-continuation-terminal.json', {
        'stages': outcomes, 'all_original_attempts_now_accounted_for': True,
        'original_dapo_components_73_status': 'failed', 'sources_and_predecessors_unchanged': True,
        'scope': 'No retries, changed thresholds, added fits, or post-failure seed-73 evaluation.',
    })

if __name__ == '__main__':
    main()

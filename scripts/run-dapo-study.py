"""Orchestrate the already reviewed fixed functions once; no retries or tuning."""
import argparse
import contextlib
import hashlib
import json
from pathlib import Path
import sys
import traceback

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT/'docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization'
PUBLIC = ROOT/'public/learn-code/dapo'

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def save(path, value):
    Path(path).write_text(json.dumps(value, indent=2)+'\n', encoding='utf-8')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--acceptance', type=Path, required=True)
    parser.add_argument('--acceptance-sha256', required=True)
    args = parser.parse_args()
    if sha(args.acceptance) != args.acceptance_sha256:
        raise RuntimeError('Acceptance changed')
    accepted = json.loads(args.acceptance.read_text())
    # Caller supplies the independently accepted packet; this script never
    # promotes an author proposal or modifies acceptance/source files.
    if not (accepted.get('accepted') is True or str(accepted.get('status','')).lower().startswith('accepted')):
        raise RuntimeError('Execution is not accepted')
    packet_path = FOLDER/'program-r1-inputs.json'
    if sha(packet_path) != '6305a6982f87e7d8bd169bc81ee771e7efd70dbeda34582934f1696468864b06':
        raise RuntimeError('Prospective packet changed')
    packet = json.loads(packet_path.read_text())
    inputs = {**packet['files'], **packet['installed_sources']}
    for relative, expected in inputs.items():
        if sha(ROOT/relative) != expected:
            raise RuntimeError('Changed input: '+relative)
    work = ROOT/'scratch/dapo-research/study'
    work.mkdir(parents=True, exist_ok=False)
    save(work/'execution-inputs.json', {'files':inputs, 'acceptance':str(args.acceptance),
        'acceptance_sha256':args.acceptance_sha256, 'orchestrator_sha256':sha(__file__),
        'scope':'Prescribed functions once in one process; no retries, tuning or changed settings'})
    sys.path.insert(0, str(PUBLIC))
    import dapo_checks
    import practice_answers
    import train_dapo
    import trl_dapo
    import report_dapo

    def stage(name, operation):
        status = work/(name+'.status.json')
        save(status, {'status':'running'})
        with (work/(name+'.stdout.txt')).open('x',encoding='utf-8') as out, \
             (work/(name+'.stderr.txt')).open('x',encoding='utf-8') as err:
            try:
                with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
                    value = operation()
                save(status, {'status':'passed'})
                print({'stage':name,'status':'passed'}, flush=True)
                return value
            except BaseException as error:
                traceback.print_exception(error, file=err)
                err.flush()
                save(status, {'status':'failed','exception':type(error).__name__,'message':str(error)})
                print({'stage':name,'status':'failed'}, flush=True)
                raise

    finite = stage('finite', dapo_checks.run)
    train_dapo.save(work/'finite.json', finite)
    save(work/'practice.json', stage('practice', practice_answers.run))
    model = ROOT/'scratch/sft-research/study/response-17/selected'
    data = PUBLIC/'data'
    initial = None
    for arm in ['response-baseline','dapo-components']:
        for seed in [73,89,101]:
            name = f'{arm}-{seed}'
            stage(name, lambda: train_dapo.run(model,data,arm,seed,work/name,initial))
            if initial is None:
                initial = work/name/'initial.json'
    stage('native', lambda: trl_dapo.run(model,data,work/'native'))
    save(work/'observations.json', stage('report', lambda: report_dapo.run(work)))
    for relative, expected in inputs.items():
        if sha(ROOT/relative) != expected:
            raise RuntimeError('Source changed during execution: '+relative)
    save(work/'terminal.json', {'passed':True,'runs':6,'native_updates':2,
        'observations_sha256':sha(work/'observations.json'),'sources_held_frozen':True})
    print({'passed':True,'runs':6,'native_updates':2}, flush=True)

if __name__ == '__main__':
    main()

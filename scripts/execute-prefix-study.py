"""Guard Root's explicit release and execute one ordered, once-only stage."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/prefix-caching-prompt-caching'
PUBLIC = ROOT / 'public/learn-code/prefix-caching'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--stage', required=True, choices=['finite', 'tiny', 'native', 'allocator'])
    args = parser.parse_args()
    packet_path = TOPIC / 'program-inputs.json'
    release = json.loads((TOPIC / 'program-execution-accepted-root.json').read_text(encoding='utf8'))
    if release.get('decision') != 'accepted' or release.get('program_inputs_sha256') != sha(packet_path):
        raise ValueError('A current Root execution release is required.')
    for item in json.loads(packet_path.read_text(encoding='utf8'))['files']:
        path = ROOT / item['path']
        if path.stat().st_size != item['bytes'] or sha(path) != item['sha256']:
            raise ValueError(f"Frozen input changed: {item['path']}")
    output = ROOT / 'scratch/prefix-caching-research/study'
    output.mkdir(parents=True, exist_ok=True)
    command = [sys.executable, '-B', '-X', 'utf8', str(PUBLIC / 'prefix_study.py'),
               '--stage', args.stage, '--output', str(output)]
    if args.stage == 'native':
        command += ['--model', str(ROOT / 'scratch/sft-research/pythia-14m')]
    environment = dict(os.environ)
    environment['PYTHONPATH'] = str(ROOT / 'scratch/inference-serving-tools')
    environment['HF_HUB_OFFLINE'] = '1'
    environment['TRANSFORMERS_OFFLINE'] = '1'
    environment['PYTHONDONTWRITEBYTECODE'] = '1'
    with (output / f'{args.stage}.launch.json').open('x', encoding='utf8') as handle:
        json.dump({'stage': args.stage, 'command': command,
                   'packet_sha256': sha(packet_path)}, handle, indent=2)
    with (output / f'{args.stage}.stdout.txt').open('x', encoding='utf8') as out:
        with (output / f'{args.stage}.stderr.txt').open('x', encoding='utf8') as error:
            result = subprocess.run(command, cwd=ROOT, env=environment, stdout=out, stderr=error)
    (output / f'{args.stage}.exit.json').write_text(
        json.dumps({'exit_code': result.returncode}) + '\n', encoding='utf8')
    print(json.dumps({'stage': args.stage, 'exit_code': result.returncode, 'output': str(output)}))
    raise SystemExit(result.returncode)


if __name__ == '__main__':
    main()

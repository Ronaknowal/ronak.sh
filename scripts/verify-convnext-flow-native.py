"""Replay existing meaningful native checks into this revision's own receipts.

The historical scripts and their receipts remain intact. This wrapper redirects
only their evidence writes; it also suppresses the historical public metadata write.
It runs no training fits or pretrained downloads.
"""
from pathlib import Path
import hashlib
import json
import sys

sys.dont_write_bytecode = True
root = Path(__file__).resolve().parents[1]
folder = root / 'docs/teaching/deep-learning-beginner/convnext-modern-cnn-designs'
folder.mkdir(parents=True, exist_ok=True)
jobs = [
    ('verify-convnext-native.py', 'convnext-native.json', 'reading-flow-native.json'),
    ('verify-convnext-independent.py', 'convnext-independent-native.json', 'reading-flow-independent-native.json'),
]
for script, previous, output in jobs:
    path = root / 'scripts' / script
    source = path.read_text(encoding='utf-8')
    old = f'docs/teaching/evidence/{previous}'
    new = f'docs/teaching/deep-learning-beginner/convnext-modern-cnn-designs/{output}'
    if old not in source:
        raise RuntimeError(f'Missing expected receipt path in {script}')
    source = source.replace(old, new)
    if script == 'verify-convnext-native.py':
        line = "(assets/'native-verification.json').write_text(json.dumps(public_report,indent=2)+'\\n',encoding='utf-8')"
        if line not in source:
            raise RuntimeError('Missing historical public metadata write')
        source = source.replace(line, '# Public metadata remains conserved; revision evidence is author-only.')
    exec(compile(source, str(path), 'exec'), {'__file__': str(path), '__name__': '__main__'})
    receipt = folder / output
    report = json.loads(receipt.read_text(encoding='utf-8'))
    report['executionWrapper'] = {
        'path': str(Path(__file__).resolve().relative_to(root)).replace('\\', '/'),
        'sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'originalVerifier': str(path.relative_to(root)).replace('\\', '/'),
        'originalVerifierSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'changes': 'Receipt path redirection and suppression of public metadata write only',
    }
    receipt.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')

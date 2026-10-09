"""Fetch only the six pinned public Pythia files, checking every byte hash.

Run from any directory: python acquire_model.py --output model
This standard-library utility never fits or evaluates a model. Existing valid
files are reused; a mismatching existing file is reported rather than replaced.
"""
import argparse
import hashlib
import json
from pathlib import Path
import urllib.request


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def acquire(output):
    source = Path(__file__).with_name('model-source-report.json')
    report = json.loads(source.read_text(encoding='utf-8'))
    output.mkdir(parents=True, exist_ok=True)
    for item in report['files']:
        path = output / item['name']
        if path.exists():
            if digest(path) != item['sha256']:
                raise ValueError(f'Existing file differs from the pinned source: {path}')
        else:
            url = f"https://huggingface.co/{report['model']}/resolve/{report['revision']}/{item['name']}"
            temporary = output / (item['name'] + '.partial')
            if temporary.exists():
                raise FileExistsError(f'Inspect the prior incomplete download first: {temporary}')
            with urllib.request.urlopen(url, timeout=120) as response:
                with temporary.open('xb') as handle:
                    while chunk := response.read(1024 * 1024):
                        handle.write(chunk)
            if digest(temporary) != item['sha256']:
                raise ValueError(f'Download hash mismatch; retained for inspection: {temporary}')
            temporary.rename(path)
        if path.stat().st_size != item['bytes']:
            raise ValueError(f'Unexpected byte count: {path}')
        print(f"Verified {item['name']}: {item['sha256']}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    acquire(parser.parse_args().output)

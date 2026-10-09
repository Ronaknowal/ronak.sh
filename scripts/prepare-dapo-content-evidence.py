"""Package existing terminal observations; no model, forward or optimizer."""
import hashlib
import json
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public/learn-code/dapo'
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization'
STUDY = ROOT / 'scratch/dapo-research/study'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    destination = PUBLIC / 'evidence'
    destination.mkdir(exist_ok=False)
    inputs = {}
    for run in ['response-baseline-73', 'response-baseline-89', 'response-baseline-101',
                'dapo-components-73', 'dapo-components-89', 'dapo-components-101', 'native']:
        target = destination / run
        target.mkdir()
        # Top-level JSON/event records contain observations; private checkpoints
        # and trained/tokenizer directories are deliberately not exported.
        for source in sorted((STUDY / run).iterdir()):
            if source.is_file() and source.suffix in ['.json', '.jsonl']:
                shutil.copyfile(source, target / source.name)
                inputs[str(source.relative_to(ROOT)).replace('\\', '/')] = sha(source)
        status = STUDY / (run + '.status.json')
        shutil.copyfile(status, destination / status.name)
        inputs[str(status.relative_to(ROOT)).replace('\\', '/')] = sha(status)
    for name in ['finite.json', 'practice.json', 'observations-final.json']:
        source = STUDY / name
        target = destination / ('observations.json' if name == 'observations-final.json' else name)
        shutil.copyfile(source, target)
        inputs[str(source.relative_to(ROOT)).replace('\\', '/')] = sha(source)
    evidence = json.loads((destination / 'observations.json').read_text(encoding='utf-8'))
    assertions = []
    def check(value, label):
        assert value, label
        assertions.append(label)
    check(len(evidence['runs']) == 6, 'all six prescribed runs, including failed73')
    check([r['status'] for r in evidence['runs']] == ['passed'] * 3 + ['failed', 'passed', 'passed'], 'five terminal and one interrupted')
    check([r['optimizer_updates'] for r in evidence['runs']] == [4, 4, 4, 2, 4, 2], 'all actual completed updates')
    check([r['generated_tokens'] for r in evidence['runs']] == [40, 40, 44, 126, 77, 107], 'all generated costs')
    check([r['selected_tokens'] for r in evidence['runs']] == [40, 40, 44, 42, 39, 31], 'selected includes unupdated partial or stopped work')
    check([r['optimizer_token_positions'] for r in evidence['runs']] == [80, 80, 88, 44, 78, 40], 'actual optimizer position accounting')
    check(evidence['runs'][3]['after'] is None, 'no invented failed terminal evaluation')
    for run, expected in zip(evidence['runs'], [20, 20, 19, None, 20, 18]):
        if expected is None:
            continue
        check(run['after']['generation']['accuracy'] * 32 == expected, f"{run['arm']}/{run['seed']} free correct count")
        check(run['after']['constrained']['accuracy'] * 32 == expected, f"{run['arm']}/{run['seed']} constrained count")
    check(evidence['native']['optimizer_updates'] == 2, 'two native updates')
    check(evidence['native']['after']['generation']['accuracy'] * 32 == 19, 'native free correct count')
    check(evidence['native']['after']['constrained']['accuracy'] * 32 == 19, 'native constrained correct count')
    check(evidence['native']['reload_exact'], 'native exact reload')
    check(len(evidence['native']['constructed_parity']['cases']) == 6, 'six constructed native cases')
    check(all(p['maximum_gradient_error'] == 0 for p in evidence['native']['actual_parity']), 'actual gradient equality recorded')
    lesson = (TOPIC / 'lesson.md').read_text(encoding='utf-8')
    for number in ['0.340288', '0.343689', '0.339069', '0.352159', '0.340385', '0.337745',
                   '0.0000392199', '14,067,712', '3.2792×10⁻¹²', '2.1337×10⁻¹⁶']:
        check(number in lesson, 'literal observed manuscript value ' + number)
    check('SAVED-RESULTS' not in lesson, 'actual results replace pending marker')
    check(lesson.count('<!-- D') == 36, '36 designed placements conserved')
    check(lesson.count('<!-- PROGRAM ') == 12, '12 complete program placements')
    manifest = {str(p.relative_to(PUBLIC)).replace('\\', '/'): sha(p)
                for p in sorted(PUBLIC.rglob('*')) if p.is_file() and '__pycache__' not in p.parts}
    (TOPIC / 'content-observation-checks.json').write_text(json.dumps({
        'passed': True, 'conditions': len(assertions), 'checks': assertions,
        'source_observations': inputs, 'public_files': manifest,
        'scope': 'Pure saved-result accounting and literal manuscript checks, not new scientific execution.'
    }, indent=2) + '\n', encoding='utf-8')
    archive = ROOT / 'public/learn-code/dapo-examples.zip'
    with zipfile.ZipFile(archive, 'x', compression=zipfile.ZIP_DEFLATED) as bundle:
        for relative in manifest:
            bundle.write(PUBLIC / relative, 'dapo/' + relative)
    with zipfile.ZipFile(archive) as bundle:
        for relative, expected in manifest.items():
            check(hashlib.sha256(bundle.read('dapo/' + relative)).hexdigest() == expected, 'archive exact ' + relative)
    print(json.dumps({'public_files': len(manifest), 'checks': len(assertions), 'archive_sha256': sha(archive)}))

if __name__ == '__main__':
    main()

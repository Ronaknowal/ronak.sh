from pathlib import Path
import hashlib, json, shutil
root = Path(__file__).resolve().parents[1]
folder = root / 'docs/teaching/llm-architecture-training/typed-decision-models-calibrated-neural-decision-systems'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
packet = json.loads((folder / 'content-inputs.json').read_text(encoding='utf-8'))
for path, digest in packet['files'].items():
    assert sha(root / path) == digest, path
predecessor = folder / 'content-r1-predecessor'
predecessor.mkdir(exist_ok=True)
for name in ['lesson.md', 'content-inputs.json']:
    if (predecessor / name).exists():
        assert (predecessor / name).read_bytes() == (folder / name).read_bytes()
    else:
        shutil.copyfile(folder / name, predecessor / name)
lesson = folder / 'lesson.md'
raw = lesson.read_bytes()
old = b'and two random seeds before calculation. For each group size it retains 4,096\nreplicate gradient estimates and their summary uncertainty, with 131,072\nindependent vectors for the pathwise reference.'
new = b'and two random seeds before calculation. For each group size it computes 4,096\nreplicate gradient estimates and retains their aggregate summaries and first\ntwelve estimates, with 131,072 independent vectors for the pathwise reference.'
if b'\r\n' in raw:
    old, new = old.replace(b'\n', b'\r\n'), new.replace(b'\n', b'\r\n')
assert raw.count(old) == 1
lesson.write_bytes(raw.replace(old, new))
packet['status'] = 'complete content with bounded R1 wording correction; awaiting same different reviewer closure'
packet['manuscript'] = sha(lesson)
packet['files'][lesson.relative_to(root).as_posix()] = sha(lesson)
for p in [*predecessor.iterdir(), Path(__file__), folder / 'content-review.md', folder / 'content-review-inputs.json']:
    packet['files'][p.relative_to(root).as_posix()] = sha(p)
successor = folder / 'content-r1-inputs.json'
successor.write_text(json.dumps(packet, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'manuscript':sha(lesson),'packet':sha(successor),'bindings':len(packet['files'])}))

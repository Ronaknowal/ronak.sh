"""Freeze complete authored content and conserved execution identities."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT/'docs/teaching/llm-architecture-training/speculative-decoding'
paths = set()
for folder in [TOPIC, ROOT/'public/learn-code/speculative-decoding',
               ROOT/'public/learn-assets/speculative-decoding',
               ROOT/'scratch/speculative-research/sources',
               ROOT/'scratch/speculative-research/study',
               ROOT/'scratch/speculative-research/study-continuation',
               ROOT/'scratch/speculative-research/study-native-continuation']:
    for path in folder.rglob('*'):
        if path.is_file() and path.name not in ['author-status.md','content-inputs.json']:
            paths.add(path)
paths.update((ROOT/'scratch/speculative-research').glob('*.py'))
paths.update((ROOT/'scripts').glob('*speculative*.py'))
paths.update((ROOT/'scripts').glob('*speculative*.mjs'))
files = []
for path in sorted(paths):
    payload = path.read_bytes()
    files.append({'path':path.relative_to(ROOT).as_posix(), 'bytes':len(payload),
                  'sha256':hashlib.sha256(payload).hexdigest()})
packet = {'topic_id':'speculative-decoding', 'scope':'Complete content ready for different entire review; no runtime release.',
          'manuscript':'docs/teaching/llm-architecture-training/speculative-decoding/lesson.md',
          'contracts':'docs/teaching/llm-architecture-training/speculative-decoding/visual-contracts.md',
          'scientific_boundary':'Original failed finite and greedy diagnostic preserved; successful mechanics and final sampled/fixed study retained without replay. Practice14/16 successor has separate source/evidence; original protocol is not rebound.',
          'files':files}
destination = TOPIC/'content-inputs.json'
with destination.open('x',encoding='utf8') as stream:
    json.dump(packet,stream,indent=2)
    stream.write('\n')
print(json.dumps({'bindings':len(files), 'sha256':hashlib.sha256(destination.read_bytes()).hexdigest()}))

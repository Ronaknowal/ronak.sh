"""Different review's bounded closure; no fits or model inference."""
from pathlib import Path
import hashlib, json, math, sys, zipfile

root = Path.cwd()
base = root / 'docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
manifest = base / 'content-successor/inputs.json'
assert sha(manifest) == 'cd157ebff7c84e74e1d30d1d3923c98c5777d8680864db3c6dcdb19b289ed716'
inputs = json.loads(manifest.read_text())['files']
for name, digest in inputs.items():
    assert sha(root / name) == digest, name
sys.path.insert(0, str(root / 'public/learn-code/process-reward-models'))
from prm_search import rank_pool, vote_masses
cases = []
for n in (0, 1, 2, 4, 6, 9):
    product, logged = rank_pool(n), rank_pool(n, 'log_product')
    assert product['weighted_vote'] == logged['weighted_vote']
    assert [r['id'] for r in product['ordered']] == [r['id'] for r in logged['ordered']]
    if n:
        scale = max(r['score'] for r in product['ordered'])
        for answer, mass in product['answer_weights'].items():
            assert math.isclose(logged['answer_weights'][answer], mass / scale)
    cases.append({'n': n, 'vote': logged['weighted_vote']})
assert vote_masses([-1000, -1001, -math.inf], 'log_product') == [1, math.exp(-1), 0]
assert vote_masses([-math.inf], 'log_product') == [0]
assert vote_masses([], 'log_product') == []
assert math.isclose(rank_pool(6)['answer_weights']['3'], 2.49514)
assert math.isclose(rank_pool(6)['answer_weights']['4'], 1.7202)
programs = root / 'public/learn-code/process-reward-models'
with zipfile.ZipFile(programs / 'prm-programs-data.zip') as archive:
    names = archive.namelist()
    for name in names:
        assert archive.read(name) == (programs / name).read_bytes(), name
    assert 'sources/phase2_train.jsonl.prefix' in names
    assert 'sources/phase2_test.jsonl.prefix' in names
text = (base / 'lesson.md').read_text(encoding='utf-8')
assert '--train sources/phase2_train.jsonl.prefix --test sources/phase2_test.jsonl.prefix --out extracted-data' in text
assert 'may ultimately turn out to be suboptimal' in text
for name, digest in inputs.items():
    assert sha(root / name) == digest, name
receipt = {'reviewer': 'root', 'accepted': True, 'reviewed_successor': sha(manifest),
           'input_guards': len(inputs), 'archive_entries': len(names), 'vote_cases': cases,
           'original_whole_review': sha(base / 'content-review.md'),
           'scope': 'R1-R3 source/prose/archive closure composed with full original different review; no scientific replay or browser acceptance.'}
(base / 'content-review-closure.json').write_text(json.dumps(receipt, indent=2)+'\n', encoding='utf-8')
print(json.dumps(receipt))

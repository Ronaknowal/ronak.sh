"""Compose the bounded design successor; filesystem/hash/text operations only."""
import base64
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[6]
OWNER = Path(__file__).resolve().parent
BASE = OWNER.parent

def identity(path):
    data = path.read_bytes()
    return dict(path=path.relative_to(ROOT).as_posix(), bytes=len(data), sha256=hashlib.sha256(data).hexdigest())

def save(name, value):
    (OWNER / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

previous = json.loads((BASE / 'author-ready-design.json').read_text(encoding='utf-8'))
review = json.loads((BASE / 'independent-review/design-identities.json').read_text(encoding='utf-8'))
guards = []
for expected in review['inputs']:
    actual = identity(ROOT / expected['path'])
    assert actual == expected, (actual, expected)
    guards.append(actual)

replacements = {
 'reading-flow-design.md': [
  ('D19 parallel numeric/categorical branches join into a 1×7 row',
   'D19 parallel numeric/categorical branches join P1’s 3+3=6 coordinates, then explicitly switch to the real penguin’s 4+3=7 coordinates'),
 ],
 'programmes-practice-and-resources.md': [
  ('Ordinary kmeans route is labelled separately, with supplied centres and n_init=1 for a controlled comparison; generic defaults do not imply equal fitted edges.',
   "Controlled supplied-centres comparison uses `sklearn.cluster.KMeans(n_clusters=len(centres),init=centres,n_init=1,algorithm='lloyd',max_iter=explicit,tol=explicit)` on one-column data, with centres shaped (k,1). Sort final centres and form midpoint edges; document stopping/tie/empty-cluster differences. Separate `KBinsDiscretizer(strategy='kmeans',...)` owns its initialization semantics and accepts neither init nor n_init; generic defaults do not imply equal edges."),
  ('Keep this supported toy algorithm distinct from ordinary library initialization/default convergence details.',
   "The controlled ordinary comparator is `sklearn.cluster.KMeans` with explicit supplied centres, n_init=1 and algorithm='lloyd'; derive sorted-centre midpoint edges separately. Record max_iter/tol, final diagnostics and stopping/tie/empty-cluster differences before claiming a supported match. `KBinsDiscretizer(strategy='kmeans',...)` remains a separate binning route with its own initialization semantics, not a supplied-centres comparator."),
  ('Preserve their original identities by mapping old practice numbers to T2–T10 below rather than silently deleting them; final learner numbering can remain old1–9 plus appended tasks.',
   'Preserve original practice identities explicitly: 1→T2, 2→T3, 3→T4, 4→T5, 5→T6, 6→T8, 7→T10, 8→T9, 9→T24; the original indicator implementation extension maps to T7. Final learner numbering can remain old1–9 plus appended tasks.'),
  ('|T9 retained nonlinear|YJ x=−3,λ2 andλ0.|−ln4 versus−(4²−1)/2=−7.5; identify branch before evaluating.|',
   '|T9 retained nonlinear|Retain original practice8: evaluate Yeo–Johnson at λ=1 on +3 and −3, and explain why negative inputs do not generically use a square root. Additional changed cases: x=−3 at λ2 andλ0.|Positive branch ((3+1)^1−1)/1=3; negative branch −((1+3)^(2−1)−1)/(2−1)=−3. Both branches give the identity; the negative exponent depends on 2−λ, with a logarithmic limit at λ2 rather than a fixed square root. Additional cases give −ln4 and −(4²−1)/2=−7.5 respectively; identify each branch first.|'),
 ],
 'research-and-coverage.md': [
  ('ActualRulerLab clips circle radius toframe; newfullgeometrymustnotcap computedradii.',
   'Current RulerLab has a radius-cap guard, but its finite 2D offsets and reach=1.35×maximum coordinate imply radius≤sqrt(2)/1.35×104≈108.95px, below the124px cap. No reachable current clipping failure was established. D04 explicitly guarantees uncapped complete-radius geometry/full-domain coverage in the successor.'),
  ('|[KBinsDiscretizer1.9.1]',
   "|[KMeans1.9.1](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html): correction-time selected signature/init/n_init/max_iter/tol/algorithm/state notes, returned lines635–724 and753; [KBinsDiscretizer1.9.1](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.KBinsDiscretizer.html): signature/strategy/quantile parameters635–677 reread.|R3 comparator belongs to KMeans; KBins has no supplied-centres init or n_init parameter. P10 records the two distinct routes and configured comparison limits. Narrow official API reading only; no old campaign or new fit.|\r\n|[KBinsDiscretizer1.9.1]"),
 ],
}

deltas = []
for filename, changes in replacements.items():
    source = BASE / filename
    before = source.read_bytes()
    after = before
    windows = []
    for old, new in changes:
        old_b, new_b = old.encode('utf-8'), new.encode('utf-8')
        assert after.count(old_b) == 1, (filename, old)
        offset = after.index(old_b)
        after = after[:offset] + new_b + after[offset + len(old_b):]
        windows.append(dict(offsetAtStep=offset, oldBase64=base64.b64encode(old_b).decode(), newBase64=base64.b64encode(new_b).decode()))
    restored = after
    for step in reversed(windows):
        pos = step['offsetAtStep']
        old_b, new_b = base64.b64decode(step['oldBase64']), base64.b64decode(step['newBase64'])
        assert restored[pos:pos+len(new_b)] == new_b
        restored = restored[:pos] + old_b + restored[pos+len(new_b):]
    assert restored == before
    destination = OWNER / filename
    if destination.exists():
        assert destination.read_bytes() == after, 'refuse to overwrite different successor'
    else:
        destination.write_bytes(after)
    deltas.append(dict(predecessor=identity(source), successor=identity(destination), windows=windows, forwardAndInverseExact=True))

effective = []
for item in previous['files']:
    name = Path(item['path']).name
    path = OWNER / name if name in replacements else ROOT / item['path']
    effective.append(dict(**identity(path), role=item['role'], unchanged=name not in replacements))

reading = (OWNER / 'reading-flow-design.md').read_text(encoding='utf8')
programmes = (OWNER / 'programmes-practice-and-resources.md').read_text(encoding='utf8')
research = (OWNER / 'research-and-coverage.md').read_text(encoding='utf8')
checks = {
 'P1-six-then-real-seven': '3+3=6 coordinates, then explicitly switch' in reading and '4+3=7' in reading,
 'original-practice-map': all(x in programmes for x in ['1→T2','2→T3','3→T4','4→T5','5→T6','6→T8','7→T10','8→T9','9→T24','extension maps to T7']),
 'identity-positive-and-negative-retained': all(x in programmes for x in ['((3+1)^1−1)/1=3','−((1+3)^(2−1)−1)/(2−1)=−3','Additional cases give −ln4']),
 'distinct-ordinary-owners': all(x in programmes for x in ['sklearn.cluster.KMeans(n_clusters=len(centres),init=centres,n_init=1',"algorithm='lloyd'",'accepts neither init nor n_init','Sort final centres and form midpoint edges','stopping/tie/empty-cluster differences']),
 'no-observed-cap-failure-claim': 'No reachable current clipping failure was established' in research and 'ActualRulerLab clips' not in research,
 'all-programme-and-practice-rows-preserved': all('|P'+str(i)+' ' in programmes for i in range(1,17)) and all('|T'+str(i)+' ' in programmes for i in range(1,27)),
 'exact-reversible-deltas': all(x['forwardAndInverseExact'] for x in deltas),
}
assert all(checks.values()), checks
save('exact-design-deltas.json', dict(scope='Only these sequential byte replacements; unchanged bytes exact. Apply windows in order forward or reverse order inverse.', files=deltas))
save('source-checks.json', dict(status='pass', sourceOnly=True, protectedInputBindings=guards, checks=checks, effectiveWholeDesign=effective, predecessorPacket=identity(BASE/'author-ready-design.json'), independentReview=identity(BASE/'independent-review/design-review.md'), independentIdentityReceipt=identity(BASE/'independent-review/design-identities.json')))
print(json.dumps(dict(status='pass', protectedInputs=len(guards), focusedContractConditions=len(checks), correctedWholeDocuments=len(deltas), effectiveWholeArtifacts=len(effective)), ensure_ascii=False))

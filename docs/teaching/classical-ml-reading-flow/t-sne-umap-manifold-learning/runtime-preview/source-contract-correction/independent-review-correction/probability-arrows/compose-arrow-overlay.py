"""One visual overlay; preserve every predecessor source and receipt."""
import hashlib
import json
from pathlib import Path

HERE=Path(__file__).resolve().parent
PREVIEW=HERE.parents[2]
APP=PREVIEW.parents[4]
def binding(path):
    raw=path.read_bytes()
    return dict(path=path.relative_to(APP).as_posix(),bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())
prior=json.loads((HERE.parent/'author-ready-built-source.json').read_text(encoding='utf8'))
for expected in prior['currentSourceBindings']:
    assert binding(APP/expected['path'])==expected
source=PREVIEW/'ManifoldOperationObjects.jsx'
before=source.read_bytes()
after=before.replace(b"from './ManifoldDrawing.jsx'",b"from '../../../ManifoldDrawing.jsx'").replace(b"from './manifold-models.mjs'",b"from '../../../manifold-models.mjs'")
old="  return <>{['B', 'C', 'D'].map((id, i) => <div className=\"manifold-scene\" key={id}>".encode()
new="""  return <><div className="manifold-scene">
    <svg viewBox="0 0 360 310" role="img" aria-label="Focus A selects B, C or D; arrow stroke width equals 8 times normalized selection probability; self excluded">
      <defs><marker id={`${marker}selection`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="3" markerHeight="3" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="context-stroke" /></marker></defs>
      <circle cx="35" cy="155" r="7" fill={hues[0]} />
      <text x="35" y="130" textAnchor="middle" fill={hues[0]}>Focus A</text>
      {['B', 'C', 'D'].map((id, i) => <g key={id}>
        {row.probabilities[i] > 0 && <line data-probability-candidate={id} x1="43" y1="155" x2="302" y2={65 + 90 * i} stroke={hues[i + 1]} strokeWidth={8 * row.probabilities[i]} markerEnd={`url(#${marker}selection)`} />}
        <circle cx="312" cy={65 + 90 * i} r="6" fill={hues[i + 1]} />
        <text x="180" y={29 + 90 * i} textAnchor="middle" fill={hues[i + 1]}>{id} · distance {number(distances[i])}</text>
        <text x="180" y={49 + 90 * i} textAnchor="middle" fill={hues[i + 1]}>p({id}|A) = {adaptiveNumber(row.probabilities[i], 9)}</text>
      </g>)}
      <text x="180" y="290" textAnchor="middle">Self A→A excluded · p(A|A) = 0</text>
    </svg>
    <p>Selection arrows run from A to candidate B, C or D. Their stroke width is exactly 8 times normalized probability, with no minimum; zero-probability arrows are absent. Tiny arrows may be imperceptible, so fixed candidate circles and printed probabilities preserve their identities. The following uniform-width connectors show operations; their widths do not encode probabilities.</p>
  </div>{['B', 'C', 'D'].map((id, i) => <div className="manifold-scene" key={id}>""".encode()
assert after.count(old)==1
after=after.replace(old,new,1)
out=HERE/'ManifoldOperationObjects.jsx'
assert not out.exists()
out.write_bytes(after)
print(json.dumps(dict(predecessor=binding(source),successor=binding(out),protectedSources=len(prior['currentSourceBindings']))))

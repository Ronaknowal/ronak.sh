"""Fetch public primary references and the small licensed data source once."""
import hashlib
import json
import pathlib
import sys
import urllib.request
sys.path.insert(0, str(pathlib.Path('scratch/constrained-decoding-tools').resolve()))
import fitz
base = pathlib.Path('docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar/research')
scratch = pathlib.Path('scratch/constrained-decoding-research')
base.mkdir(parents=True, exist_ok=True)
scratch.mkdir(parents=True, exist_ok=True)
sources = {
    'stanford-dfa.pdf': 'https://web.stanford.edu/class/archive/cs/cs103/cs103.1254/lectures/14/Condensed%20Lecture%20Slides.pdf',
    'xgrammar-v2.pdf': 'https://arxiv.org/pdf/2411.15100v2',
    'iris.zip': 'https://archive.ics.uci.edu/static/public/53/iris.zip',
}
receipt = []
for name, url in sources.items():
    target = scratch / name
    if target.exists():
        raise FileExistsError(target)
    with urllib.request.urlopen(url, timeout=60) as response:
        data = response.read()
    target.write_bytes(data)
    receipt.append({'url': url, 'path': str(target), 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
for name, pages in [('stanford-dfa.pdf', [17, 20, 43]), ('xgrammar-v2.pdf', [1, 2, 3, 4])]:
    doc = fitz.open(scratch / name)
    for page in pages:
        target = base / f'{name[:-4]}-p{page+1}.png'
        doc[page].get_pixmap(matrix=fitz.Matrix(1.4, 1.4)).save(target)
    (scratch / f'{name}.txt').write_text('\n'.join(p.get_text() for p in doc), encoding='utf-8')
(base / 'acquisition.json').write_text(json.dumps(receipt, indent=2)+'\n', encoding='utf-8')
print(json.dumps(receipt, indent=2))

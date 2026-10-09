"""Package unchanged complete programs, two dependencies and saved observations."""
from pathlib import Path
from hashlib import sha256
import json
import zipfile

root = Path(__file__).resolve().parents[1]
source = root / 'public/learn-code/data-curation-pipelines'
paths = sorted(p for p in source.iterdir() if p.is_file() and p.suffix in {'.py', '.json', '.md', '.html'} and p.name != 'bundle-manifest.json')
paths += [root / 'public/learn-code/data-curation-deduplication' / name for name in ['curation_records.py', 'lexical_dedup.py']]
entries = {p.name: {'source': p.relative_to(root).as_posix(), 'sha256': sha256(p.read_bytes()).hexdigest()} for p in paths}
manifest = json.dumps({'scope': 'Unchanged lesson programs, exact prerequisite helpers and saved derived observations. Raw web text and model weights are downloaded by the documented programs, not included.', 'files': entries}, indent=2) + '\n'
output = source / 'curation-pipelines.zip'
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
    for p in paths:
        entry = zipfile.ZipInfo(p.name, date_time=(2026, 10, 7, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        bundle.writestr(entry, p.read_bytes())
    entry = zipfile.ZipInfo('bundle-manifest.json', date_time=(2026, 10, 7, 0, 0, 0))
    entry.compress_type = zipfile.ZIP_DEFLATED
    bundle.writestr(entry, manifest)
with zipfile.ZipFile(output) as bundle:
    for name, item in entries.items():
        assert sha256(bundle.read(name)).hexdigest() == item['sha256']
    assert len(bundle.namelist()) == len(entries) + 1
(source / 'bundle-manifest.json').write_text(manifest, encoding='utf-8')
print(f'{len(entries)} exact source/data entries packaged and verified; zero fits')

"""Freeze complete current author content for a different review."""
import hashlib,json,re
from pathlib import Path
base=Path('docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
text=(base/'lesson.md').read_text(encoding='utf8')
figures=re.findall(r'<!-- (D\d+) (\w+) -->',text)
assert len(figures)==27 and {i for i,n in figures}=={f'D{i:02d}' for i in range(1,28)}
programs=re.findall(r'<!-- CODE (\w+\.py) -->',text)
assert len(programs)==12 and len(set(programs))==12
assert all((base/'programs'/p).exists() for p in programs)
assert len(re.findall(r'^### \d+\.',text,re.M))==14
assert text.count('**Hint:**')==14 and text.count('**Solution:**')==14
assert len(re.findall(r'^## \d+\.',text,re.M))==13
assert sha(base/'programs/sampling.py')==sha(Path('public/learn-code/decoding-strategies/sampling.py'))=='5813c034d6f42fc12154698f391200eb798a16d376ab4416d71ee090c85528c2'
assert sha(base/'programs/generate_native.py')==sha(base/'research/iris-study/generate_native.py')
checks={'passed':True,'figures':figures,'programs':programs,'solvedTasks':14,'conceptSections':13,'exactPrerequisiteSampler':True,'frozenExecutingGeneratorConserved':True,'finiteConditions':len(json.loads((base/'research/finite-checks.json').read_text())['checks']),'stagedArchiveMembers':json.loads((base/'research/bundle-checks.json').read_text())['members']}
(base/'content-author-checks.json').write_text(json.dumps(checks,indent=2)+'\n',encoding='utf8')
files=[p for p in base.rglob('*') if p.is_file() and p.name!='content-inputs.json' and '__pycache__' not in p.parts]
extras=[Path('scripts/verify-constrained-content.py'),Path('scripts/package-constrained-content.py'),Path(__file__).relative_to(Path.cwd()),Path('public/learn-code/decoding-strategies/sampling.py'),Path('docs/teaching/llm-architecture-training/decoding-strategies-greedy-beam-top-k-top-p-temperature/runtime-acceptance.json'),Path('docs/teaching/llm-architecture-training/decoding-strategies-greedy-beam-top-k-top-p-temperature/delivery.md'),Path('src/learn/data/topics/constrained-decoding.jsx')]
packet={'topicId':'structured-output-constrained-decoding-outlines-xgrammar','author':'/root','status':'complete-author-content-ready-for-different-review','manuscript':str(base/'lesson.md').replace('\\','/'),'files':{str(p).replace('\\','/'):sha(p) for p in sorted(set(files+extras))},'scope':'Whole actual content, executable examples, fixed native study and explicit visual contracts. Runtime not started. Historical pending/failure records retain their qualifications.'}
with (base/'content-inputs.json').open('x',encoding='utf8') as stream: json.dump(packet,stream,indent=2);stream.write('\n')
print(json.dumps({'files':len(packet['files']),'packet_sha256':sha(base/'content-inputs.json'),'manuscript_sha256':sha(base/'lesson.md')}))

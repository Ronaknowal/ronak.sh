"""Compose exact final author inputs with independent review and paint evidence."""
import json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
topic=root/'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards'
base=topic/'runtime-independent-preparation'
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
author=topic/'runtime-inputs.json'
assert digest(author)=='b3ddacfecc0ab537393bdd5fab16111b696f865b1593a00236e7cf1fdf09c4bb'
packet=json.loads(author.read_text())
for item in packet['bindings']:assert digest(root/item['path'])==item['sha256'],item['path']
# The source-pixel paths were personally read. This audits identity/coverage, not quality.
def paths(value):
 if isinstance(value,dict):
  for key in ['path','source']:
   if isinstance(value.get(key),str):yield value[key].replace('\\','/')
  for child in value.values():yield from paths(child)
 elif isinstance(value,list):
  for child in value:yield from paths(child)
seen=set()
for file in base.rglob('*inputs.json'):
 if 'paint-' in file.as_posix():seen.update(paths(json.loads(file.read_text())))
for directory,id in [('browser-epoch-accepted','D30'),('browser-interactions-settled','D29')]:
 sidecar=topic/directory/f'screenshots/changed-{id}.png.tiles.json'
 for tile in json.loads(sidecar.read_text())['tiles']:
  assert digest(root/tile['path'])==tile['sha256']
  seen.add(tile['path'].replace('\\','/'))
index=json.loads((topic/'runtime-paint-index.json').read_text())
coverage={}
for kind in ['defaults','additional']:
 objects=index[kind];missing=[]
 for obj in objects:
  for tile in obj['tiles']:
   if tile['path'].replace('\\','/')not in seen:missing.append(tile['path'])
   assert digest(root/tile['path'])==tile['sha256']
 assert not missing
 coverage[kind]={'objects':len(objects),'tiles':sum(len(o['tiles'])for o in objects),'missing_read_tiles':missing}
out=base/'final-reading-coverage.json';assert not out.exists();out.write_text(json.dumps(coverage,indent=2)+'\n')
files={str((root/x['path']).resolve()):x['sha256'] for x in packet['bindings']}
extra=[author,topic/'runtime-author-ready.json',topic/'runtime-review.md',Path(__file__).resolve()]+list(base.rglob('*'))
for file in extra:
 if file.is_file():files[str(file.resolve())]=digest(file)
bindings=[{'path':Path(p).relative_to(root).as_posix(),'sha256':h}for p,h in sorted(files.items())]
review={'decision':'accept current complete runtime for root guarded integration','whole_runtime_different_review':True,'author_manifest_sha256':digest(author),'accepted_manuscript_sha256':digest(topic/'lesson.md'),'current_source_hashes':json.loads((topic/'runtime-author-ready.json').read_text())['sourceHashes'],'open_material_findings':[],'coverage':coverage,'no_scientific_replay':True,'qualifications':['Historical d8ba author receipt unavailable; current eb3d and independent evidence conserved.','Actual fallback font inspected; denied external stylesheet is retained diagnostic.','Native ZIP success not claimed; exact HTTP archives and native individual downloads verified.','Historical source-bound paints compose with exact bounded final presentation successors.','Native pans cover observed positions, not every intermediate pixel.'],'files':bindings}
out=topic/'runtime-review-inputs.json';assert not out.exists();out.write_text(json.dumps(review,indent=2)+'\n');print(json.dumps({'sha256':digest(out),'bindings':len(bindings),'coverage':coverage}))

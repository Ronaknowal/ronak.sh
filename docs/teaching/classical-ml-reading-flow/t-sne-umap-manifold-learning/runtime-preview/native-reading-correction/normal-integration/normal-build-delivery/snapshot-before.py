import pathlib,hashlib,json,datetime,shutil
APP=pathlib.Path(__file__).resolve().parents[8]
HERE=pathlib.Path(__file__).resolve().parent
NI=HERE.parent
def bind(p):
 raw=p.read_bytes();return dict(path=p.relative_to(APP).as_posix(),bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())
apply=json.loads((NI/'apply-handoff.json').read_text(encoding='utf-8'))
metadata=json.loads((NI/'root-metadata-composition.json').read_text(encoding='utf-8'))
assert bind(NI/'root-metadata-composition.json')['sha256']=='fef7ccf0a127e41b5badef1b1e5222f14c73c9adcf177023f55d51a170c2c49a'
for row in apply['written']:assert bind(APP/row['written']['path'])==row['written']
for row in apply['legacyFilesPreserved']:assert bind(APP/row['path'])==row
loading=[]
for row in apply['loadingGuards']:
 expected=metadata['after'] if row['afterApply']['path']=='src/learn/data/generated/navigation.js' else row['afterApply']
 assert bind(APP/expected['path'])==expected
 loading.append(expected)
assert not (NI/'build-normal').exists()
generated=[bind(p) for folder in ['src/learn/data/generated','src/articles/generated'] for p in sorted((APP/folder).rglob('*')) if p.is_file()]
dist=[bind(p) for p in sorted((APP/'dist').rglob('*')) if p.is_file()] if (APP/'dist').exists() else []
record=dict(schema='manifold-normal-build-inputs/v1',at=datetime.datetime.now(datetime.timezone.utc).isoformat(),appliedHandoff=bind(NI/'apply-handoff.json'),metadataComposition=bind(NI/'root-metadata-composition.json'),written=[r['written'] for r in apply['written']],legacy=apply['legacyFilesPreserved'],loading=loading,generated=generated,existingDist=dist,rootConfig=bind(APP/'vite.config.js'),wrapperConfig=bind(HERE/'vite.normal.config.mjs'),normalOutputExisted=False,freeBytes=shutil.disk_usage(APP).free)
(HERE/'before-build.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(status='normal build inputs exact',written=54,legacy=16,loading=16,generated=len(generated),distArtifacts=len(dist),freeBytes=record['freeBytes'],newOutputAbsent=True)))

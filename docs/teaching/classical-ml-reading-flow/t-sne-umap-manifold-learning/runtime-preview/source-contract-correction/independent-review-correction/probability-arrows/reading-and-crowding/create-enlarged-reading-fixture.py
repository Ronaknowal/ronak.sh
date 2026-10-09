"""Render-only root32 document; preserve every original source/build artifact."""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,re
here=Path(__file__).resolve().parent
app=here.parents[8]
def bind(p):
    b=p.read_bytes()
    return dict(path=p.relative_to(app).as_posix(),bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
def read(p):return json.loads(p.read_text(encoding='utf8'))
def guard(r):assert bind(app/r['path'])==r,r['path']
built=here/'author-ready-built-source.json'
assert bind(built)['sha256']=='abef1eca722fe99e1991cb8107f59db97a12264fc8af1f383faabdbf88213a0f'
closure=read(here/'build-closure.json')
for r in closure['files']+closure['sourceBindings']:guard(r)
for r in read(built)['currentSourceBindings']:guard(r)
index=here/'build-private/index.html'
original=index.read_bytes()
style=b'  <style data-render-only-fixture="enlarged-root32">html{font-size:32px}</style>\n'
assert original.count(b'</head>')==1
fixture=here/'build-private/enlarged-reading-root32.html'
assert not fixture.exists()
fixture.write_bytes(original.replace(b'</head>',style+b'</head>',1))
assert fixture.read_bytes().replace(style,b'',1)==original
references=re.findall(r'(?:src|href)="(/assets/[^"]+)"',original.decode('utf8'))
assert references
assets=[bind(here/'build-private'/url.lstrip('/')) for url in references]
for r in closure['files']+closure['sourceBindings']:guard(r)
receipt=dict(schema='manifold-render-only-enlarged-root-fixture/v1',status='EXACT_BUILT_ASSETS_ROOT32_FIXTURE_CREATED_NATIVE_PENDING',at=datetime.now(timezone.utc).isoformat(),
    sourceBuiltFreeze=bind(built),originalClosure=bind(here/'build-closure.json'),originalBuildArtifactsGuarded=len(closure['files']),
    originalIndex=bind(index),fixture=bind(fixture),composer=bind(Path(__file__).resolve()),exactExistingAssetReferences=assets,
    onlyAddedMarkup=style.decode('utf8'),inverseRecoversOriginalIndex=True,url='http://127.0.0.1:5198/enlarged-reading-root32.html',
    routeQualification='Separately named render-only enlarged-root fixture. It references the exact original compiled assets; it is not the standard lesson route, a rebuild or whole-content acceptance.',
    rootFontSizePx=32,newBuilds=0,sourceOrContentChanges=0,nativeAcceptance=False)
out=here/'enlarged-reading-fixture.json';assert not out.exists();out.write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
print(json.dumps(dict(status=receipt['status'],receipt=bind(out),fixture=bind(fixture),url=receipt['url'],originalArtifactsGuarded=len(closure['files'])),indent=2))

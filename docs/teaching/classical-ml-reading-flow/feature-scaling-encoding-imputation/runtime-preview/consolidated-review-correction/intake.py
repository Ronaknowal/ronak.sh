import pathlib, json, hashlib, datetime
app = pathlib.Path(__file__).resolve().parents[6]
owner = pathlib.Path(__file__).resolve().parent
prior = owner.parent
def bind(p):
    p = p.resolve(); raw = p.read_bytes()
    return dict(path=p.relative_to(app).as_posix(), bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
packet = json.loads((prior/'author-review/author-ready-built-source.json').read_text())
checks=[]
def verify(row, role):
    actual=bind(app/row['path'])
    assert actual['bytes']==row['bytes'] and actual['sha256']==row['sha256'], (role,row['path'])
    checks.append(dict(role=role, **actual))
for row in packet['sourceBindings']: verify(row,'original-source')
for row in packet['currentBuildArtifacts']: verify(row,'original-build-artifact')
module=json.loads((app/packet['moduleMap']['path']).read_text())
for row in module['sourceBindings']: verify(row,'original-built-source')
for row in json.loads((prior/'file-payloads.json').read_text())['files']: verify(row['source'],'original-payload')
for key in ['acceptedContent','manuscript','fullAcceptedBindingManifest','runtimeComposition','authorSemanticReview','modelAndStaticRender','componentStateScenarios','sourceAndHttp','intake']:
    verify(packet[key],key)
for name in ['CoreFigures.jsx','DeeperFigures.jsx','Drawing.jsx','PreparationFigures.jsx','PreparationInvestigations.jsx','preparation-models.mjs','saved-data.js','lesson.css','preview-entry.jsx','preview-loader.js','preview.css','index.html','vite.config.mjs','compose-reader.mjs','file-payloads.json']:
    dest=owner/name
    if not dest.exists():
        raw=(prior/name).read_bytes()
        # One deeper topic-owned directory; only filesystem import/config resolution changes.
        if name in ['preview-entry.jsx','vite.config.mjs','compose-reader.mjs']:
            raw=raw.replace(b'../../../../..',b'../../../../../..')
        if name=='compose-reader.mjs':
            raw=raw.replace(b'const topic = path.dirname(owner)',b'const topic = path.dirname(path.dirname(owner))')
        dest.write_bytes(raw)
receipt=dict(schema='feature20-consolidated-correction-intake/v1',at=datetime.datetime.now(datetime.timezone.utc).isoformat(),author='/root/tsne_probability_arrow_recovery',attribution='Successor correction author; original Feature runtime authored by /root/nmf_content_recovery; not independent review',predecessor=bind(prior/'author-review/author-ready-built-source.json'),review=bind(prior/'independent-whole-review/whole-source-review.md'),handoff=bind(prior/'independent-whole-review/whole-review-handoff.json'),release=bind(owner/'root-correction-release.json'),verified=checks,scope='F1-F5 only; exact private matched composition/spec amendments. No build, native, science replay, shared/canonical/public/central edits.',read='Entire review/handoff/release; full current DeeperFigures/Drawing/models/Investigations; relevant CoreFigure helpers, accepted D16/D34/D39/D41/L5/L13/L14 contracts, accepted adjacent prose and P9/setup. Further full changed-source readback follows authoring.')
(owner/'intake.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf8')
print(json.dumps(dict(checks=len(checks),source=len(packet['sourceBindings']),artifacts=len(packet['currentBuildArtifacts']),builtSources=len(module['sourceBindings']),payloads=42,intake=bind(owner/'intake.json'))))

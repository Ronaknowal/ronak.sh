import datetime, hashlib, json, pathlib, re

APP = pathlib.Path(__file__).resolve().parents[7]
HERE = pathlib.Path(__file__).resolve().parent
PLAN = HERE / 'plan.json'
def binding(path):
    path = pathlib.Path(path)
    raw = path.read_bytes()
    return dict(path=path.relative_to(APP).as_posix(), bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
def observed(path):
    path = pathlib.Path(path)
    return dict(exists=True,**binding(path)) if path.exists() else dict(path=path.relative_to(APP).as_posix(),exists=False)
def save(name, value):
    (HERE/name).write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
def require_guard(row):
    assert observed(APP/row['path']) == row, ('Selected destination changed; refuse overwrite',row,observed(APP/row['path']))
assert binding(PLAN)['sha256']=='e53ba3ce80a5eb204480f5119180d273e19ffaeca49769befc10e3409869f52c'
assert binding(HERE/'handoff.json')['sha256']=='2e921874c0fe980a3ef4986aecb3c073cc7c44d11f471760dad349ff4131e914'
assert not (HERE/'applied-source.json').exists(), 'Apply already frozen; do not repeat'
plan=json.loads(PLAN.read_text(encoding='utf-8'))
for row in plan['authority']+plan['sourceProductsConserved']+plan['legacyFilesPreserved']:
    assert binding(APP/row['path'])==row, row['path']
for row in plan['newOwners']:
    require_guard(row)
for row in plan['canonicalOperations']+plan['publicPayloads']:
    assert binding(APP/row['source']['path'])==row['source']
    require_guard(row['destinationGuard'])
    if 'rollback' in row:
        assert binding(APP/row['rollback']['path'])==row['rollback']
        assert (APP/row['rollback']['path']).read_bytes()==(APP/row['destination']).read_bytes()
loading_before=[]
for row in plan['readOnlyNormalLoadingGuards']:
    current=binding(APP/row['path'])
    loading_before.append(dict(planned=row,current=current,exact=current==row))

pattern=re.compile(r'((?:from\s*|import\s*)[\'\"])([^\'\"]+)([\'\"])')
prepared=[]
for row in plan['canonicalOperations']:
    source=(APP/row['source']['path']).read_bytes()
    changes=row['transform']
    current=source
    if changes:
        text=source.decode('utf-8')
        imports={c['before']:c['after'] for c in changes if c['kind']=='import relocation'}
        counts={key:0 for key in imports}
        def relocate(match):
            value=match.group(2)
            if value in imports:
                counts[value]+=1
            return match.group(1)+imports.get(value,value)+match.group(3)
        text=pattern.sub(relocate,text)
        for old in imports:
            assert counts[old]==sum(c['occurrences'] for c in changes if c['kind']=='import relocation' and c['before']==old)
        for change in changes:
            if change['kind']=='import relocation':
                continue
            if change['kind']=='required D30 wiring stylesheet':
                newline='\r\n' if '\r\n' in text else '\n'
                anchor="import '../../components/lesson-labs/manifold-reading-flow/manifold-reader.css';"+newline
                assert text.count(anchor)==1
                text=text.replace(anchor,anchor+change['after'])
            else:
                assert text.count(change['before'])==change['occurrences']
                text=text.replace(change['before'],change['after'])
        current=text.encode('utf-8')
    assert len(current)==row['proposedBytes'] and hashlib.sha256(current).hexdigest()==row['proposedSha256'], row['destination']
    prepared.append((row,current))
for row in plan['publicPayloads']:
    current=(APP/row['source']['path']).read_bytes()
    assert len(current)==row['expectedBytes'] and hashlib.sha256(current).hexdigest()==row['expectedSha256']
    prepared.append((row,current))
assert len(prepared)==54
save('apply-authority.json',dict(schema='manifold-root-accepted-apply-scope/v1',at=datetime.datetime.now(datetime.timezone.utc).isoformat(),issuer='/root',mode='Trusted direct parent task release',acceptedPlan=binding(PLAN),scope='Root accepts19 canonical products/35 structured payloads, reversible import/URL transformations,2 label spaces and canonical wiring CSS import. Release guarded canonical/public apply only; no shared/generator/central write or build.',metadataDisposition='Root accepts preserved export readTime~100min+120minpractice and generated hasIntegratedGuidefalse. Actual generated metadata remains Root-owned.',selectedGuardsFresh=True,loadingGuardComparison=loading_before))
written=[]
for row,raw in prepared:
    require_guard(row['destinationGuard'])
    destination=APP/row['destination']
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_bytes(raw)
    actual=binding(destination)
    assert actual['bytes']==len(raw) and actual['sha256']==hashlib.sha256(raw).hexdigest()
    written.append(dict(source=row['source'],written=actual,before=row['destinationGuard'],rollback=row.get('rollback'),kind='canonical product' if 'transform' in row else 'complete public payload'))
    save('apply-journal.json',dict(schema='manifold-guarded-apply-journal/v1',written=written))

inverses=[]
for row in plan['canonicalOperations']:
    current=(APP/row['destination']).read_bytes()
    if row['transform']:
        text=current.decode('utf-8')
        for change in reversed(row['transform']):
            if change['kind']!='import relocation':
                text=text.replace(change['after'],change['before'],change['occurrences'])
        imports={c['after']:c['before'] for c in row['transform'] if c['kind']=='import relocation'}
        text=pattern.sub(lambda m:m.group(1)+imports.get(m.group(2),m.group(2))+m.group(3),text)
        current=text.encode('utf-8')
    expected=(APP/row['source']['path']).read_bytes()
    assert current==expected
    inverses.append(dict(destination=row['destination'],source=row['source'],inverseBytes=len(current),inverseSha256=hashlib.sha256(current).hexdigest(),physicalSourceExact=True,transform=row['transform']))
for row in plan['authority']+plan['sourceProductsConserved']+plan['legacyFilesPreserved']:
    assert binding(APP/row['path'])==row
loading_after=[]
for row in loading_before:
    current=binding(APP/row['current']['path'])
    loading_after.append(dict(planned=row['planned'],beforeApply=row['current'],afterApply=current,unchangedDuringApply=current==row['current'],exactToPlan=current==row['planned']))
    assert current==row['current'], ('Foreign loading dependency changed during apply; report Root',row['current'],current)
for row in written:
    assert binding(APP/row['written']['path'])==row['written']
save('applied-source.json',dict(schema='manifold-normal-guarded-apply/v1',at=datetime.datetime.now(datetime.timezone.utc).isoformat(),author='/root/tsne_probability_arrow_recovery',status='CANONICAL_PUBLIC_APPLIED_ROOT_SHARED_METADATA_BUILD_NATIVE_NORMAL_PENDING',plan=binding(PLAN),planningHandoff=binding(HERE/'handoff.json'),rootAuthority=binding(HERE/'apply-authority.json'),authority=plan['authority'],written=written,inverses=inverses,legacyFilesPreserved=plan['legacyFilesPreserved'],loadingGuards=loading_after,changedForeignLoadingGuards=[r for r in loading_after if not r['exactToPlan']],scope=plan['scope'],rootMetadataDisposition='Preserve frozen export. Root accepts selected generated readTime~100min+120minpractice and hasIntegratedGuidefalse; generator/navigation not written here.',rollbackPolicy=plan['rollbackPolicy'],scientificMainModelSSRReplays=0,builds=0,browserOperations=0,sharedGeneratorCentralWrites=0,phaseChanges=0,limits=plan['limits']+['Actual integrated files and exact inverses are author conservation evidence, not normal build or native acceptance.','Root unconditional guide/loading/index/native verification remains pending.']))
print(json.dumps(dict(status='guarded apply complete',written=len(written),exactInverses=len(inverses),legacyConserved=len(plan['legacyFilesPreserved']),changedForeignLoadingGuards=[r['planned']['path'] for r in loading_after if not r['exactToPlan']],receipt=binding(HERE/'applied-source.json'))))

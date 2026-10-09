import datetime, hashlib, json, pathlib, shutil

APP = pathlib.Path(__file__).resolve().parents[7]
OWNER = pathlib.Path(__file__).resolve().parent.parent
HERE = OWNER / 'built-delivery-preparation'

def binding(path):
    path = pathlib.Path(path)
    data = path.read_bytes()
    return dict(path=path.relative_to(APP).as_posix(), bytes=len(data), sha256=hashlib.sha256(data).hexdigest())

def save(name, value):
    (HERE / name).write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')

source = OWNER / 'combined-author-review/author-ready-source.json'
review = OWNER / 'independent-combined-source-review/source-closure.md'
handoff = OWNER / 'independent-combined-source-review/source-closure-handoff.json'
assert binding(source)['sha256'] == '03620c4d159f87479c884711931ccea69309a2b9cf4fc541fae8b6e424674c56'
assert binding(review)['sha256'] == 'c0b20a01a7726063e90d88c9a40e3b4e43d995cae0a03133e0e6cbabe9380ef5'
assert binding(handoff)['sha256'] == 'ae54cf3a42ce5f70840d03bafc1af453067252b32dd0bdb1787ef25497bb95ef'
freeze = json.loads(source.read_text(encoding='utf-8'))
rows = []
for category in ['productBindings', 'evidenceBindings', 'contextBindings', 'acceptedBindings', 'configurationBindings']:
    for expected in freeze[category]:
        actual = binding(APP / expected['path'])
        assert actual == expected, (category, expected, actual)
        rows.append(dict(category=category, expected=expected, actual=actual, exact=True))
for row in freeze['payloadBindings']:
    expected = row['source']
    actual = binding(APP / expected['path'])
    assert actual == expected
    rows.append(dict(category='payload', expected=expected, actual=actual, exact=True))
for row in freeze['currentSharedComparison']:
    expected = row['current']
    actual = binding(APP / expected['path'])
    assert actual == expected, (expected, actual)
    rows.append(dict(category='current-shared-observation', expected=expected, actual=actual, exact=True))
assert len(freeze['payloadBindings']) == 41
assert len(freeze['currentSharedComparison']) == 27
assert not (OWNER / 'build-private').exists(), 'Never overwrite an existing build output'
assert 'publicDir:false' in (OWNER / 'vite.config.mjs').read_text(encoding='utf-8')
save('prebuild-input-identities.json', dict(
    schema='nmf-private-build-preparation/v1', at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    sourceFreeze=binding(source), sameIndependentReport=binding(review), sameIndependentHandoff=binding(handoff),
    inputIdentities=rows, count=len(rows), buildOutputExisted=False,
    freeBytes=shutil.disk_usage(APP).free,
    navigationObservation=freeze['navigationObservation'],
    qualification='Current navigation is only observed for compilation; its selected NMF source-role acceptance remains pending Root. Seven-role 1a8e35e6 does not accept NMF.',
    scope='Identity verification only. No author checker, SSR, scientific, browser, or phase operation.'))
print(json.dumps(dict(status='exact inputs ready', identities=len(rows), freeBytes=shutil.disk_usage(APP).free)))

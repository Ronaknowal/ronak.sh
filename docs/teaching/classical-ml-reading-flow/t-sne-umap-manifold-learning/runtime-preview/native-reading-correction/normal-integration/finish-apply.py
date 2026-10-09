import datetime, hashlib, json, pathlib, re
APP=pathlib.Path(__file__).resolve().parents[7]
HERE=pathlib.Path(__file__).resolve().parent
def binding(path):
    path=pathlib.Path(path);raw=path.read_bytes()
    return dict(path=path.relative_to(APP).as_posix(),bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())
applied=json.loads((HERE/'applied-source.json').read_text(encoding='utf-8'))
assert binding(HERE/'applied-source.json')['sha256']=='491ceeb091df8fdd468fc32f2d511a1698ee557846343727478aeec44448c1d4'
inverses=list(applied['inverses'])
for row in applied['written']:
    assert binding(APP/row['written']['path'])==row['written']
    assert binding(APP/row['source']['path'])==row['source']
    if row['kind']=='complete public payload':
        raw=(APP/row['written']['path']).read_bytes()
        assert raw==(APP/row['source']['path']).read_bytes()
        inverses.append(dict(destination=row['written']['path'],source=row['source'],inverseBytes=len(raw),inverseSha256=hashlib.sha256(raw).hexdigest(),physicalSourceExact=True,transform='Identity byte copy'))
for row in applied['legacyFilesPreserved']:
    assert binding(APP/row['path'])==row
for row in applied['loadingGuards']:
    assert binding(APP/row['afterApply']['path'])==row['afterApply']
assert len(inverses)==54 and len(applied['written'])==54
import_checks=[]
for row in applied['written']:
    path=APP/row['written']['path']
    if row['kind']!='canonical product' or path.suffix not in ['.jsx','.js','.mjs']:
        continue
    for line in path.read_text(encoding='utf-8').splitlines():
        if not line.startswith('import '):
            continue
        match=re.search(r"(?:from\s*)?['\"]([^'\"]+)['\"]",line)
        assert match, line
        value=match.group(1)
        if value.startswith('.'):
            target=(path.parent/value.split('?',1)[0]).resolve()
            assert target.exists(), (path,value)
            assert target.is_relative_to(APP/'src'), (path,value)
            import_checks.append(dict(importer=path.relative_to(APP).as_posix(),specifier=value,resolved=target.relative_to(APP).as_posix(),exists=True,applicationOwned=True))
native=APP/'src/learn/components/lesson-labs/manifold-reading-flow/NativeReadingObjects.jsx'
text=native.read_text(encoding='utf-8')
assert text.count('Fit one 5-NN classifier')==1 and 'Fit one5-NN classifier' not in text
assert text.count('compare with 75 held-out labels')==1 and 'compare with75 held-out labels' not in text
topic=APP/'src/learn/data/topics/t-sne-umap-manifold-learning.jsx'
assert "import '../../components/lesson-labs/manifold-reading-flow/wiring.css';" in topic.read_text(encoding='utf-8')
report='''The Root-released t-SNE canonical/public apply is complete. All54 actual written hashes match the accepted19-product/35-payload map. The19 transformed canonical products reverse exactly to their frozen physical sources; the35 public payloads are exact identity byte copies. Both accepted label spaces occur exactly once, and the canonical topic imports the accepted D30 wiring CSS. Every relocated static relative import resolves within src; no runtime import points into docs. This is source conservation evidence, not a build, rendered observation or scientific replay.

All authority/frozen source hashes were freshly checked before apply. The18 new canonical products,35 structured public paths and two semantic owners were absent; the sole replacement was the existing77151B canonical topic3820fd93, whose exact rollback remains in rollback/src/learn/data/topics/t-sne-umap-manifold-learning.jsx. All16 legacy files and16 read-only loading/route/generator guards are unchanged from the plan. No changed foreign loading guard was found. Existing dirty shared manifest/import-map files were preserved; no shared generator or central file was written.

Root's accepted export metadata remains exact: readTime~100minread+120minpractice and absent hasIntegratedGuide. The generated navigation still carries its prior metadata because this release excluded generators/shared writes. Root separately composes the accepted selected readTime and false flag, verifies unconditional guide behavior, and releases any normal build/loading/native work. No build was run here and no old/private server was stopped.

The complete13sections/45mechanisms/12investigations/15wholeprogrammes/19tasks and original operation bodies/values/control handlers survive through exact inverses. Existing corrected-source-versus-predecessor-output, source-only estimator calls, retained programmes and metrics, source-ID/tie conventions, partial native windows, clipboard-payload uncertainty, delayed exact native download and other original review/scientific qualifications remain unchanged. Normal routing, actual file actions, loading/recovery and final phase acceptance remain Root-owned.
'''
(HERE/'applied-readback.md').write_text(report,encoding='utf-8')
packet=dict(schema='manifold-normal-apply-handoff/v1',at=datetime.datetime.now(datetime.timezone.utc).isoformat(),author='/root/tsne_probability_arrow_recovery',status=applied['status'],plan=applied['plan'],appliedSourceReceipt=binding(HERE/'applied-source.json'),authority=applied['authority'],rootRelease=binding(HERE/'apply-authority.json'),report=binding(HERE/'applied-readback.md'),applyHelper=binding(HERE/'apply-plan.py'),finishingHelper=binding(pathlib.Path(__file__)),written=applied['written'],all54Inverses=inverses,staticImportResolution=import_checks,legacyFilesPreserved=applied['legacyFilesPreserved'],loadingGuards=applied['loadingGuards'],changedForeignLoadingGuards=[],rollback=[r['rollback'] for r in applied['written'] if r['rollback']],scope=applied['scope'],counts=dict(written=54,canonicalTransforms=19,exactPublicCopies=35,inverses=54,legacyFilesPreserved=16,loadingGuardsConserved=16,staticLocalImports=len(import_checks)),execution=dict(apply='4e9b97 exit0',scope='Guarded source/public copying and exact conservation only; no learner logic edits beyond accepted map'),sharedGeneratorCentralWrites=0,builds=0,mainModelSSRReplays=0,browserOperations=0,phaseChanges=0,next='Root selected generated metadata composition, unconditional guide verification, then separately released normal build/loading/HTTP/native and phase acceptance.')
(HERE/'apply-handoff.json').write_text(json.dumps(packet,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(status='all54 writes and inverses conserved',staticLocalImports=len(import_checks),foreignLoadingChanges=0,handoff=binding(HERE/'apply-handoff.json'),report=binding(HERE/'applied-readback.md'))))

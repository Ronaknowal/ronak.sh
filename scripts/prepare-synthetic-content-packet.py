"""Assemble the taught outputs and downloadable files without rerunning science."""
from pathlib import Path
import copy, hashlib, json, math, re, shutil, sys, zipfile
import numpy as np

root = Path.cwd()
base = root / 'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training'
public = root / 'public/learn-code/synthetic-data'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
dump = lambda p, x: p.write_text(json.dumps(x, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
protocol = json.loads((base / 'prospective-protocol.json').read_text())
continuation = json.loads((base / 'storage-label-continuation.json').read_text())
for name, digest in protocol['bindings'].items():
    if name.endswith('synthetic_recursive.py'):
        assert sha(root/name) == continuation['after']
        assert sha(base/'recursive-before-storage-label.py') == digest == continuation['before']
    else:
        assert sha(root/name) == digest, name
outputs = copy.deepcopy(json.loads((base/'programs-preflight.json').read_text())['outputs'])
print('Retained output groups:', list(outputs))
# The only changed result field is a proved metadata correction. Preserve every
# actual sampled count and old numerical result; explicitly label the projection.
recursive = outputs['recursive']
for row in recursive['paths']['anchor'][1:]:
    row['stored_population'] = 20
dump(public/'program-outputs.json', {
    'outputs': outputs,
    'provenance': 'Actual program executions retained from the preflight. Only anchored stored_population labels are projected from the verified N-to-2N metadata continuation; no samples, fits or model generations repeated.',
    'recursive_current_sha256': continuation['after'],
    'recursive_original_sha256': continuation['before']})
for arm in ['raw', 'copy', 'generated']:
    shutil.copyfile(base/f'student-study/{arm}-seed17.pt', public/f'{arm}-seed17.pt')

sys.path.insert(0, str(public))
from synthetic_sampling import distribution, inverse_cdf, trace_sequence
from synthetic_verification import check_candidate, selection
from synthetic_corpus import read_sources, select_candidates, WindowPool
from synthetic_recursive import expected_h, heterozygosity
checks=[]
assert np.allclose(distribution(np.log([.55,.25,.15,.05]), top_p=.8)['nucleus'], [.6875,.3125,0,0])
assert [inverse_cdf([.6875,.3125,0,0], u) for u in [.5,.8]] == [0,1]
assert [r['token'] for r in trace_sequence([.8,.8])['steps']] == [1,3]
assert np.allclose(distribution(np.log([.4,.35,.2,.05]), top_p=.6)['nucleus'], [8/15,7/15,0,0])
assert [inverse_cdf([0,.2,.8,0],u) for u in [.1999,.2,.9999]] == [1,2,2]
checks.append('Section3 and practice A/B probabilities, crossing token and exact CDF intervals')
assert check_candidate('(3+4)*2','14',['3+4=8','8*2=14'])['steps_valid'] == [False,False]
assert check_candidate('(2+3)*4','20',['2+3=6','6*4=20'])['final_correct']
assert math.isclose(selection()['precision'],54/62)
assert math.isclose(selection()['cost_per_keep'],.05/.62)
changed=selection(.2,.9,.1,.06,0)
assert math.isclose(changed['precision'],9/13) and math.isclose(changed['cost_per_keep'],3/13)
assert np.allclose(np.array([.6,.3,.1])*[1,.5,0]/.75,[.8,.2,0])
assert np.allclose(np.array([.5,.3,.2])*[.8,0,.5]/.5,[.8,0,.2])
checks.append('Section4/5 and practice C/D/E exact answer versus trace, confusion masses, costs and support')
assert math.isclose(1/(.75**2+.25**2),1.6)
assert math.isclose(1/(.5**2+2*.25**2),8/3)
assert 300*16*32 == 153600 and 200*8*24 == 38400
assert (80+30)/(40+10) == 2.2
assert math.isclose(expected_h('replace',10,1)[1],.486)
assert math.isclose(expected_h('accumulate',10,1)[1],.5265)
assert math.isclose(heterozygosity([.5,.3,.2])*19/20,.589)
assert math.isclose(heterozygosity([.5,.3,.2])*(1-1/80),.61225)
checks.append('Family concentration, target counts, pooled NLL and conditional diversity calculations')
source=read_sources(); records=source['records']
candidates=json.loads((public/'candidates.json').read_text())
selected=select_candidates(candidates['records'],records)
assert len(candidates['records'])==34 and len(selected['kept'])==32
assert sum(r['termination']=='length cap' for r in candidates['records']) == 2
assert sum(len(r['output_ids'])-1 for r in candidates['records']) == 1062
assert sum(r['input_truncated'] for r in candidates['records']) == 0
study=json.loads((public/'study.json').read_text())
assert len(study['fits'])==9
differences=[]
for seed,expected in zip([17,29,43],[.009832,-.008918,-.014321]):
    rows={r['arm']:r for r in study['fits'] if r['seed']==seed}
    assert rows['raw']['history']==rows['copy']['history']
    assert rows['raw']['final_weight_sha256']==rows['copy']['final_weight_sha256']
    delta=rows['generated']['history'][-1]['byte_nll']-rows['raw']['history'][-1]['byte_nll']
    assert abs(delta-expected)<.0000005
    differences.append(delta)
assert abs(np.mean(differences)+.004469)<.0000005
checks.append('Actual34/32generation,2caps,1062newtokens and all9fit outcomes/copy-null/source conservation')

manuscript=(base/'lesson.md').read_text(encoding='utf-8')
assert len(re.findall(r'^## \d+\.',manuscript,re.M))==12
assert len(re.findall(r'^### [A-L]\. ',manuscript,re.M))==12
assert len(re.findall(r'<!-- S\d\d:',manuscript))==22
for name in ['sampling','verification','corpus','generate','student','recursive','library']:
    filename=f'synthetic_{name}.py'
    marker=f'<!-- PROGRAM {filename}: complete visible source with shared Copy/Download, next to its explanation. -->'
    link=f'Download [{filename}](/learn-code/synthetic-data/{filename}).'
    assert link in manuscript
    if marker not in manuscript: manuscript=manuscript.replace(link,link+'\n\n'+marker)
(base/'lesson.md').write_text(manuscript,encoding='utf-8')

members=[p for p in public.iterdir() if p.is_file() and p.name not in ['synthetic-programs-data.zip','download-manifest.json']]
with zipfile.ZipFile(public/'synthetic-programs-data.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(members): archive.write(file,file.name)
with zipfile.ZipFile(public/'synthetic-programs-data.zip') as archive:
    for file in members: assert archive.read(file.name)==file.read_bytes()
dump(public/'download-manifest.json',{'files':{file.name:sha(file) for file in sorted(members)},
     'archive':{'name':'synthetic-programs-data.zip','sha256':sha(public/'synthetic-programs-data.zip')}})
dump(base/'content-author-checks.json',{'checks':checks,'members':len(members),
    'manuscript_sha256':sha(base/'lesson.md'),'programs':7,'figures':22,'solutions':12,
    'protocol_sha256':sha(base/'prospective-protocol.json'),
    'scope':'New bounded manuscript arithmetic/packet checks only; prior complete source, scientific execution and outcome inspection conserved.'})
print(json.dumps({'checks':checks,'archive_members':len(members),'manuscript':sha(base/'lesson.md')}))

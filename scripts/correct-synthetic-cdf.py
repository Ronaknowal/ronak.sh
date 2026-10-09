"""Close the support-boundary finding without replaying model experiments."""
from pathlib import Path
import hashlib, json, shutil, sys, zipfile
import numpy as np

root = Path.cwd()
base = root/'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training'
public = root/'public/learn-code/synthetic-data'
out = base/'cdf-correction'
out.mkdir(exist_ok=False)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
dump = lambda p,x: p.write_text(json.dumps(x,indent=2)+'\n',encoding='utf-8')
original = json.loads((base/'content-inputs.json').read_text())
for row in original['files']:
    assert sha(root/row['path']) == row['sha256'], row['path']
changed = [base/'lesson.md', public/'synthetic_sampling.py',public/'synthetic-programs-data.zip',public/'download-manifest.json']
before = {}
for file in changed:
    shutil.copyfile(file,out/file.name)
    before[file.relative_to(root).as_posix()] = sha(file)
program = public/'synthetic_sampling.py'
text = program.read_text()
text = text.replace('if (probabilities < 0).any() or not np.isfinite(probabilities).all() or not np.isclose(probabilities.sum(), 1):', 'if probabilities.ndim != 1 or not probabilities.size or (probabilities < 0).any() or not np.isfinite(probabilities).all() or not np.isclose(probabilities.sum(), 1):')
old = '''    cumulative = probabilities.cumsum()
    cumulative[-1] = 1.0
    return int(np.searchsorted(cumulative, uniform, side="right"))'''
new = '''    # Build intervals only for positive mass, preserving original token IDs.
    # Renormalize accepted rounding error before forcing the positive endpoint.
    support = np.flatnonzero(probabilities > 0)
    cumulative = probabilities[support].cumsum()
    cumulative /= cumulative[-1]
    cumulative[-1] = 1.0
    return int(support[np.searchsorted(cumulative, uniform, side="right")])'''
assert old in text
program.write_text(text.replace(old,new),encoding='utf-8')
lesson = base/'lesson.md'
text = lesson.read_text(encoding='utf-8')
old = '''Use `side="right"`, after validating a normalized vector and u in [0, 1). Set
the last cumulative value to 1 to absorb floating-point summation error at its
upper end. Test u=.1999, .2 and .9999: outputs should be 1, 2, 2. Return an
integer ID, not the cumulative mass.'''
new = '''Validate a normalized vector and u in [0, 1), then retain only positive-mass
entries and their original token IDs. Accumulate those masses, divide by their
final sum to absorb accepted rounding error, and set their final cumulative
value to 1. Use `side="right"` and map the resulting support position back to
the original token ID. Merely forcing the full vector's final cumulative value
to 1 can give a trailing zero-mass token a tiny interval: test ten masses of .1
followed by zero at `np.nextafter(1., 0.)`. The corrected sampler returns ID 9,
never ID 10. For the original vector, u=.1999, .2 and .9999 give IDs 1, 2, 2.
Return the integer token ID, not its position in the shortened support array.'''
assert old in text
lesson.write_text(text.replace(old,new),encoding='utf-8')
sys.path.insert(0,str(public))
from synthetic_sampling import inverse_cdf
checks=[]
assert inverse_cdf([.1]*10+[0.],np.nextafter(1.,0.)) == 9
assert [inverse_cdf([0,.2,.8,0],u) for u in [0,.1999,.2,.9999]] == [1,1,2,2]
checks.append('Review counterexample and all exact half-open practice boundaries')
for p in [[0,1,0],[0,.1,.2,0,.7,0],[.1]*10+[0.], [0,.3333333,.6666667,0]]:
    for u in np.r_[np.linspace(0,1,1001,endpoint=False),np.nextafter(1.,0.)]:
        assert p[inverse_cdf(p,u)]>0
checks.append('4008 supplied uniforms always map to original positive support')
for p in [[], [[.5,.5]], [0,0], [-.1,1.1],[np.nan,1]]:
    try: inverse_cdf(p,.5)
    except ValueError: pass
    else: raise AssertionError(p)
checks.append('Vector shape, empty, unnormalized, negative and nonfinite rejection')
members=sorted(p for p in public.iterdir() if p.is_file() and p.name not in ['synthetic-programs-data.zip','download-manifest.json'])
with zipfile.ZipFile(public/'synthetic-programs-data.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for p in members: archive.write(p,p.name)
with zipfile.ZipFile(public/'synthetic-programs-data.zip') as archive:
    for p in members: assert archive.read(p.name)==p.read_bytes()
dump(public/'download-manifest.json',{'files':{p.name:sha(p) for p in members},'archive':{'name':'synthetic-programs-data.zip','sha256':sha(public/'synthetic-programs-data.zip')}})
conserved=[]
for row in original['files']:
    if row['path'] not in before:
        assert sha(root/row['path'])==row['sha256'],row['path']
        conserved.append(row['path'])
dump(out/'checks.json',{'checks':checks,'archive_members':len(members),'before':before,'after':{p.relative_to(root).as_posix():sha(p) for p in changed},'conserved':conserved,'fits':0,'model_generations':0,'original_packet_sha256':sha(base/'content-inputs.json')})
(out/'author-correction.md').write_text('''# Positive-support CDF correction

The different whole-content review found a genuine trailing-zero rounding
counterexample. The complete program now validates a one-dimensional vector,
forms its CDF only on positive entries, normalizes accepted floating error,
and maps interval positions back to original token IDs. Practice B explains
the actual failure and robust repair. The author reread the complete changed
function and exercise and checked the earlier section 3 explanation, whose
interval convention remains correct. The bundle and download hashes match.

`checks.json` records new boundary probes and exact conservation. Beforecopies
retain every replaced source and archive. The original content packet and
prospective protocol are immutable provenance; their sampling-program hash
names the pre-correction execution. This helper did not participate in neural
generation or student fitting. All scientific source, outputs, checkpoints,
and the separate recursive metadata continuation remain byte-identical.
No fit, model generation, or original main program was rerun. Earlier author
checks remain historical execution receipts; only this bounded successor
and the different review closure can accept the corrected content.
''',encoding='utf-8')
files={row['path']:sha(root/row['path']) for row in original['files']}
for p in [base/'content-inputs.json',out/'checks.json',out/'author-correction.md',root/'scripts/correct-synthetic-cdf.py']:
    files[p.relative_to(root).as_posix()]=sha(p)
for p in out.iterdir():
    if p.name not in ['inputs.json']: files[p.relative_to(root).as_posix()]=sha(p)
dump(out/'inputs.json',{'author':'root','stage':'bounded correction awaiting same reviewer closure','manuscript':sha(lesson),'files':files})
print(json.dumps({'checks':checks,'files':len(files),'packet':sha(out/'inputs.json')}))

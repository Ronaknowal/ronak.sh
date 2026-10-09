"""Final content self-reading corrections and structural conservation checks."""
from pathlib import Path
import ast,hashlib,json,re,datetime
BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[3]
PREP=BASE/'content-prepared'
def h(b):return hashlib.sha256(b).hexdigest()
def ref(p):
    b=p.read_bytes();return {'path':p.relative_to(ROOT).as_posix(),'sha256':h(b),'bytes':len(b)}
def read(p):return p.read_bytes().decode('utf8')
m=read(PREP/'manuscript-complete-draft-r1.md');old=m;changes=[]
def change(before,after,reason):
    global m
    assert m.count(before)==1,(reason,m.count(before))
    changes.append({'before':before,'after':after,'reason':reason})
    m=m.replace(before,after)
move='You can change the allowed codebook and inspect the resulting assignments immediately. Emptying the codebook is invalid: a decoder needs an allowed reconstruction. The last valid experiment remains visible with an explanation. Reset restores `000`/`111`, fair bits and selected word `011`.\n\n'
change(move,'','Delay arbitrary codebook control until fixed binary width is taught.')
anchor='Our two-entry, three-bit code has rate 1/3 bit per source bit. This count assumes that the codebook and block boundaries are shared. Section 8 adds an explicit file header and shows how it changes the count.'
change(anchor,anchor+'\n\nNow change the allowed codebook and inspect both the assignments and required index width. Emptying the codebook is invalid: a decoder needs an allowed reconstruction. The last valid experiment remains visible with an explanation. Reset restores `000`/`111`, fair bits and selected word `011`.','Put codebook membership after D04, preserving all invalid/reset behaviour.')
change('The finite requirement counts every positive-mass source string, including rare ones. An expected length can be lower because rare strings may receive longer descriptions; that is a different rate convention. A limiting vanishing-error statement also does not remove the finite exact requirement.\n\n','','Remove repeated T4 explanation already fully supplied in the preceding solution.')
change('The scores g_j include every column, even one with r_j=0. An inactive g_j>1 exposes a profitable direction. The all-column lower bound can be loose, so upper minus lower is a certificate gap for the combined objective, not the exact improvement from one candidate. A larger iteration count cannot revive an exactly excluded column.','The scores g_j include every column, even one with r_j=0. An inactive g_j>1 exposes a profitable direction. Upper minus lower is a certificate gap for the combined objective; it is not an uncertainty bound for I and D separately. A larger iteration count cannot revive an exactly excluded column.','Keep T6 certificate distinction without repeating the already stated loose-bound comparison.')
change('The complete `allocate` helper is already supplied above and can be reused safely without executing a demonstration. The unchanged numerical result is retained; no new optimizer run is needed to restate it. Zero variance requires no bits, whereas zero error on a positive-variance Gaussian requires infinite ideal rate.','Reuse the complete `allocate` helper supplied above; importing it does not execute a demonstration. Zero variance requires no bits, whereas zero error on a positive-variance Gaussian requires infinite ideal rate.','Remove author-process language from T7; preserve implementation guidance and endpoints.')
change('For 001011101111 the complete bytes are `0000000c57`, the reconstruction is 001001001111 and two of 12 positions differ. The new focused tests cover this changed protocol and several partial/error cases. The former 2,047-case campaign belongs to the original one-bit protocol; it is not claimed as fresh exhaustive evidence for these changed functions.','The exercise file includes focused empty, partial-block and malformed-message checks for this changed two-bit protocol. The exhaustive lengths 0 through 10 campaign requested above remains a further learner task; the recorded focused run does not establish its completion.','Avoid repeating T9 output and retain accurate execution scope without unrelated historical campaign narration.')
change('Report paired MSE inmm², maximum error inmm, complete bytes','Report paired MSE in mm², maximum error in mm, complete bytes','Restore normal word spacing in T14.')
change('The new bounded run retains 342 values and omits original data rows 4 and 272.','The recorded changed-step experiment retains 342 values and omits original data rows 4 and 272.','Describe the observed experiment in learner terms.')
change('The complete new exercise file follows.','The complete exercise file follows.','Remove unnecessary author chronology.')
inverse=m
# Empty replacements need a position-bound inverse; verify with forward reconstruction instead.
rebuilt=old
for c in changes:
    assert rebuilt.count(c['before'])==1
    rebuilt=rebuilt.replace(c['before'],c['after'])
assert rebuilt==m
assert re.findall(r'```[^\n]*\n.*?```',m,re.S)==re.findall(r'```[^\n]*\n.*?```',old,re.S)
p=PREP/'manuscript-complete-r1.md'
assert not p.exists();p.write_bytes(m.encode('utf8'))
s=read(PREP/'visual-specifications-r1.md')
# Preserve the first draft and select the bound final specification explicitly.
s=s.replace('Source: manuscript-complete-draft-r1.md.','Source: manuscript-complete-r1.md.')
sp=PREP/'visual-specifications-final-r1.md'
assert not sp.exists();sp.write_bytes(s.encode('utf8'))
checks=[]
def check(name,condition):
    assert condition,name;checks.append(name)
check('46 unique ordered manuscript placements',re.findall(r'\[\[(D\d+)\]\]',m)==[f'D{i:02d}' for i in range(1,47)])
contracts=json.loads(read(PREP/'visual-contracts-r1.json'))
check('46 drawing contracts',len(contracts)==46)
for c in contracts:
    before,after=m.split('[['+c['id']+']]')
    check(c['id']+' exact lead',before.rstrip().split('\n\n')[-1]==c['introduction'])
    check(c['id']+' exact following explanation',after.strip().split('\n\n')[0]==c['interpretation'])
    check(c['id']+' visible contract',('### '+c['id']+' —') in s)
check('nine investigation contracts',len(re.findall(r'^### L\d',s,re.M))==9)
check('15 practice groups',len(re.findall(r'^### \d+\.',m,re.M))==15)
check('nine main sections',len(re.findall(r'^## \d+\.',m,re.M))==9)
check('all code placeholders resolved','{{CODE:' not in m)
check('distinct endings',all(x in m for x in ['## Further learning','## Technical references','## Files and setup']))
check('code/output fences conserved',re.findall(r'```[^\n]*\n.*?```',m,re.S)==re.findall(r'```[^\n]*\n.*?```',old,re.S))
for source in sorted((PREP/'programmes').glob('*.py')):
    ast.parse(read(source));check('valid syntax '+source.name,True)
    if source.name.startswith('rd_') or source.name in ['finite_rd_library.py','gaussian_rd_library.py','penguins_quantization.py']:
        check('whole source inclusion '+source.name,read(source).strip() in m)
check('fixed500 implementation contract distinguishes early-stop solver','Passing iterations=500 to the early-stopping path is insufficient.' in s)
check('first-use L1 membership follows width',m.index('Now change the allowed codebook')>m.index('[[D04]]'))
check('dataset hash conserved',h((PREP/'programmes/penguins.csv').read_bytes())=='f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93')
receipt={'status':'AUTHOR_SELF_READING_COMPLETE_FOR_INDEPENDENT_REVIEW','completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'draft':ref(PREP/'manuscript-complete-draft-r1.md'),'manuscript':ref(p),'visualSpecifications':ref(sp),'changes':changes,'conservation':'Exact forward replacement reconstruction reproduces the complete successor; all other bytes and every inline code/output fence are conserved. No numerical programme executed.','checks':checks,'checkCount':len(checks),'scope':'Beginner and specialist reading of full manuscript, actual whole programmes/output, all15tasks and46visual/9livecontracts; structural checks are not independent or rendered acceptance.','mainsExecuted':0}
rp=BASE/'content-author-self-reading-r1.json'
assert not rp.exists();rp.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'checks':len(checks),'receipt':ref(rp),'manuscript':ref(p),'spec':ref(sp)},indent=2))

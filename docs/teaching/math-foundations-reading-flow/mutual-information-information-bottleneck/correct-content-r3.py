"""Bounded prose/contract successor. Does not import or execute lesson science."""
from pathlib import Path
import hashlib, json, re, datetime

ROOT = Path(__file__).resolve().parents[4]
BASE = Path(__file__).resolve().parent
PREP = BASE / 'content-prepared'
changes = []
def digest(b): return hashlib.sha256(b).hexdigest()
def ref(p):
    b = p.read_bytes()
    return {'path':p.relative_to(ROOT).as_posix(),'sha256':digest(b),'bytes':len(b)}
def read(p): return p.read_bytes().decode('utf8')
def replace(s, before, after, finding, owner):
    if s.count(before) != 1: raise ValueError((finding, owner, s.count(before), before[:80]))
    changes.append({'finding':finding,'owner':owner,'before':before,'after':after})
    return s.replace(before, after)

m = read(PREP/'manuscript-complete-r2.md')
s = read(PREP/'visual-specifications-r2.md')
contracts = json.loads(read(PREP/'visual-contracts-r1.json'))
m = replace(m, "The programme first sums rows and columns, then calculates each occupied cell's log contribution. Its second route normalizes each positive row, computes its entropy and multiplies by the row mass. The assertion checks the entropy-difference identity against the joint calculation. Both routes take time proportional to the number of cells; storing the two marginals needs space proportional to the number of rows plus columns. The input table itself remains the dominant stored object.", "The programme first sums rows and columns, then calculates each occupied cell's log contribution. It separately calculates H(Y), and prints MI, H(Y) and the difference H(Y)−MI. That last number uses the identity just derived; this compact file does not independently calculate the conditional row entropies or assert their agreement. The validated practice helper later performs that additional calculation. The finite-table operations take time proportional to the number of cells; storing the two marginals needs space proportional to the number of rows plus columns. The input table itself remains the dominant stored object.", 'MI1', 'manuscript')
m = replace(m, "Its count-like joint tables then compare the full observation, magnitude and sign grouping through exactly the same MI function.", "Its joint tables then compare the full observation and the sign-threshold grouping through the same MI function. The magnitude grouping is established by the preceding label-pure groups and revisited in practice; this file does not compute a separate magnitude table.", 'MI1', 'manuscript')
m = replace(m, "For the conditional calculation it gathers a context's probability, normalizes that context's table, computes its MI, and multiplies by the context probability.", "For the conditional calculation it directly constructs the known normalized XOR table for each fixed B: each A value has mass .5 and its label is A XOR B. It computes that table's MI and weights it by the declared context probability, .75 or .25. It does not gather arbitrary context slices or perform a general normalization step; the practice helper later implements those operations for joint-mass layers.", 'MI1', 'manuscript')
oldmix = 'For z=0, the source fragments are (.2,.15,.075,.05). Dividing by .475 gives their conditional input weights. Multiplying them by the corresponding label laws and summing gives p(Y=0,z=0)=.3275 and p(Y=1,z=0)=.1475. Normalizing yields p(Y|z=0)=(.689473684,.310526316). For z=1 the joint label masses are (.1725,.3525), so its decoder is (.328571429,.671428571). The general operations are'
newmix = 'For z=0, the assigned source fragments are (.2,.15,.075,.05), with total .475. Multiply these unnormalized fragments by their corresponding conditional label laws, (.9,.1), (.9,.1), (.1,.9), (.1,.9), and add by label. This gives joint masses p(Y=0,z=0)=.3275 and p(Y=1,z=0)=.1475. Divide these two masses by .475 exactly once to obtain p(Y|z=0)=(.689473684,.310526316). Equivalently, divide the source fragments by .475 first and mix the label laws with those conditional input weights; that sum is already the conditional decoder and needs no further normalization. For z=1 the joint label masses are (.1725,.3525), so dividing by .525 gives (.328571429,.671428571). The general operations are'
m = replace(m, oldmix, newmix, 'MI2', 'manuscript')
s = replace(s, oldmix, newmix, 'MI2', 'visualSpecifications')
c = next(c for c in contracts if c['id']=='M28')
oldgeometry = c['geometry']
newgeometry = 'For z=0, draw the four unnormalized assigned fragments .2, .15, .075, .05 with their source identities. Split each by its labelled conditional law (.9,.1), (.9,.1), (.1,.9), (.1,.9), then collect by Y into joint masses .3275 and .1475. Show their common total .475 and one division by .475, producing decoder probabilities .689473684 and .310526316. Beside this, z=1 has joint label masses .1725/.3525 and total .525, yielding .328571429/.671428571. An optional equivalent route may divide the source fragments first, but its weighted label sum is already conditional and must never be divided again. Keep target colours through splitting, collecting and normalization.'
s = replace(s, oldgeometry, newgeometry, 'MI2', 'visualSpecifications')
changes.extend([{'finding':'MI2','owner':'structured:M28.geometry','before':oldgeometry,'after':newgeometry},{'finding':'MI2','owner':'structured:M28.interpretation','before':c['interpretation'],'after':newmix}])
c['geometry'],c['interpretation'] = newgeometry,newmix

# One task per learning outcome. Keep distinct cases; remove repeated questions/results.
def task(n, prompt, hint, solution):
    global m
    pattern = rf'(### {n}\. [^\n]+\n\n)(.*?)(?=\n### \d+\. |\nBefore moving on,)'
    match = re.search(pattern,m,re.S)
    if not match: raise ValueError(n)
    before = match[0]
    after = match[1]+prompt+'\n\n<details>\n<summary>Hint</summary>\n\n'+hint+'\n\n</details>\n\n<details>\n<summary>Explained solution</summary>\n\n'+solution+'\n\n</details>\n'
    m = replace(m,before,after,'MI4',f'manuscript:T{n}')

original = json.loads(read(PREP/'original-practice-checkpoints.json'))['practices']
task(1,
 'Start with joint rows (.45,.15) and (.10,.30). Compute both marginals, I(X;Y), H(Y|X), and one negative pointwise information value. Explain why this table cannot expose a helper that uniformly averages row entropies. Repair that helper using joint rows (.675,.075), (.125,.125); then change only the context masses to (.5,.5) and finally (1,0), preserving both conditional rows.',
 'Normalize each positive row, but weight its entropy by the original row mass. For the first table, the row totals are (.6,.4) and column totals (.55,.45). Compare the two row entropies before deciding whether a uniform mean is a useful test.',
 original[0]['solution']+'\n\nBecause the first table has equal row entropies, uniform averaging accidentally agrees. The repair fixture has conditional rows (.9,.1) and (.5,.5), with entropies .468995594 and 1. Their actual weights (.75,.25) give .601746695, while the incorrect uniform mean gives .734497797. Equal context masses produce joint rows (.45,.05), (.25,.25) and make the latter value correct. With masses (1,0), the joint rows are (.9,.1), (0,0), so the total is .468995594 and the empty conditional is skipped. `checked_information` returns the weighted total as its second result.')
task(4,
 'For X uniform on {−1,0,1} and Y=X², draw every source-to-group edge for Z₁=|X| and Z₂=1[X>0]. Compute each group’s label mixture and MI, identify the sufficient representation, and calculate the conditional information lost by Z₂.',
 'Write each source member beside its output group. Z₂=0 contains equally likely X=−1 and X=0; Z₂=1 determines Y.',
 'The magnitude groups {−1,1} and {0} are label-pure. Thus Z₁ determines Y and I(Y;Z₁)=H(Y)≈.918296 bits. The threshold groups are {−1,0} and {1}; the first has mass 2/3 and a fair label, while the second has mass 1/3 and a fixed label. Consequently H(Y|Z₂)=2/3 bit, I(Y;Z₂)≈.251629 bits and I(Y;X|Z₂)=2/3 bit. Z₁ is sufficient for this task; Z₂ discards magnitude information. The cancellation of positive and negative covariance contributions does not erase this dependence.')
task(5,
 'Implement conditional MI from joint context layers. Use context 0 table (.375,0;0,.375), context 1 table (.0625,.0625;.0625,.0625), and an optional zero layer. Compare with an unweighted mean and the copied common-bit example X=Y=C. Then apply the chain rule to a different law: A is fair, B is independent with P(B=1)=.1, and Y=A XOR B. Find I(A;Y), I(B;Y), I((A,B);Y) and I(A;Y|B); explain why adding the first two misses information.',
 'Normalize each positive-mass layer, calculate its MI, then weight by the layer’s original mass. In the XOR law, Y is fair, B is the uncertainty remaining after A, and A determines Y once B is known.',
 'The first context masses are .75 and .25; their conditional MIs are 1 and 0, giving .75 bit. A uniform mean incorrectly gives .5. A zero layer contributes nothing. `conditional_information` implements these operations. For X=Y=C, unconditional MI is 1 but every conditional slice is constant, so conditional MI is 0.\n\n'+original[1]['solution'])
task(8,
 'For the signal/nuisance law, compare constant, signal and both at β=.5 and β=4. Add a signal encoder corrupted by an independent fair coin: write its rows and compare output entropy with input information. Finally change the target to the noiseless label Y=N and compare retaining S, N and both at β=4.',
 'Use the original (rate,relevance) pairs (0,0), (1,.531004) and (2,.531004). Rate is H(Z)−H(Z|X), so encoder randomness matters. Recompute relevance under the changed label law.',
 'At β=.5 the original objectives are 0, .734498 and 1.734498; at β=4 they are 0, −1.124018 and −.124018. Signal is best among those three, without proving optimality among every stochastic encoder. Each fair-coin-corrupted row is (.5,.5), so H(Z)=H(Z|X)=1 and both rate and relevance are 0. With target Y=N, retaining N gives (R,T)=(1,1), hence J=−3; retaining S gives J=1, and retaining both gives J=−2. Nuisance status belongs to the task, so the label change requires recomputing the joint law.')
task(9,
 'Implement a two-codeword Gibbs update for r=(.25,.75), β=2 and predictive distortions (0,ln 2) nats. Calculate the row, compare common log-weight offsets 0 and −1000, and diagnose substituting the displayed bit value 1 inside exp. Explain why zero reference support requires an explicit policy.',
 'Form r(z)exp(−βd), then subtract the maximum log weight before exponentiating. A common additive log offset changes no normalized ratio; a change of logarithm base needs a corresponding exponential base.',
 'The weights are (.25,.75/4)=(.25,.1875), giving (4/7,3/7). `gibbs_row([.25,.75],[0,log(2)],2)` produces that row, and offset −1000 preserves it within roundoff. Unshifted exponentials can both underflow and produce 0/0. Substituting exp(−2·1) wrongly treats a bit as a nat; the equivalent base-2 weight is .75·2⁻². Zero reference probability excludes a codeword from this positive-support formula. The helper rejects it explicitly; adding epsilon would change the optimization problem.')
# T10's executable solution and retained stdout stay byte-identical.
match = re.search(r'### 10\. .*?(?=\n### 11\.)',m,re.S)
code_tail = match[0].split('File: `mi_changed_task.py`',1)[1].rsplit('\n</details>',1)[0]
task(10,
 'For a fixed nonuniform source and encoder, verify the free-energy identity with mismatched r and w and identify each block-minimizing update. Then build the changed-task experiment with fair independent X=(S,N), label flip .2 and β=4: compare constant, signal and both, and run 40 updates from informative and symmetric starts. Explain why an unchanged constant encoder need not be optimal.',
 'Calculate every term from the same joint law and log base. Use two LABEL rows (.8,.2) followed by two (.2,.8), validate encoder row sums and check finite objective descent. Compare explicit candidates before interpreting the optimizer.',
 'Form p(z), p(y|z), R, T and I(X;Y) from p(x,y)q(z|x). Directly evaluate F and compare it with J+βI(X;Y)+KL(pz||r)+βΣz pz KL(py|z||w). Matching r and w removes their respective KL terms; holding them fixed gives the row Gibbs update. These are block minimizations, not a proof of joint convexity. Identical codeword predictors can keep symmetric rows unchanged.\n\n'+original[9]['solution']+'\n\nThe complete solution below includes both initializations. Its output belongs to the original finite 40-step run.\n\nFile: `mi_changed_task.py`'+code_tail)
task(11,
 'Suppose true rate is .6 bits, relevance .4 bits, reference mismatch .2 bits and decoder mismatch .1 bits. Find the variational bounds and objective gap at β=3. Hold the encoder and decoder fixed while moving only the reference toward its true marginal: identify what can change and whether a lower bound-objective proves lower true MI. Rewrite U+βC in prediction-plus-penalty form and handle β=0.',
 'Reference mismatch adds to rate; decoder mismatch subtracts from relevance. The true joint law stays fixed under an auxiliary-only edit. Dividing by β is valid only for positive β.',
 'The upper rate is .8 and lower relevance .3. True J=.6−3·.4=−.6, while its upper bound is .8−3·.3=−.1; the gap is .5=.2+3·.1. Moving only the reference changes its rate gap and U, but leaves R, T and the unchanged decoder gap fixed. A tighter objective therefore need not indicate any change in true MI. For β>0, dividing U+βC by β gives C+(1/β)U; comparison with J also accounts for the fixed H(Y) term. At β=0 division is invalid and the original objective is rate-only.')
task(13,
 'Let X and E be independent standard normals and Z=X+.5E. Compare Z with Z′=10Z, tracing the event Z∈[0,1] into the new units. Then remove the noise and compare exact X with sign(X). Finally use fair independent A,B and Z=A XOR B to compare marginal and conditional information about A.',
 'The same physical event becomes Z′∈[0,10]. Separate invertible unit conversion, exact real observation, quantization and fresh noise. In XOR, knowing B changes what Z reveals.',
 'Both noisy observations have ½log₂5≈1.160964 bits. Density rescales by 1/10, preserving the event probability, while both finite differential entropies shift by log₂10. Exact X has infinite MI with itself; sign(X) is a fair binary variable up to a zero-probability event and has one bit. Dimension alone does not determine information. In XOR, I(Z;A)=0 but I(Z;A|B)=1: marginal independence does not establish conditional privacy, and an estimated near-zero value is weaker than exact independence.')
task(14,
 'Write a paired-row count helper, shuffle Y with an explicit permutation, and verify both marginals. For categorical integer features, choose the estimator flag and convert units; repeat relabelling, duplicate-count and zero-category checks, and explain the independent replacement [[2,4],[3,6]]. Next compare the declared independent eight-category experiment at 20 and 2000 observations, recording the experiment rather than assuming monotonic estimates. Finally design feature selection for a neural sensor model with repeated recordings per participant, identifying leakage and the validation split required for new-participant deployment.',
 'A permutation uses every donor exactly once; integer storage does not determine whether a variable is categorical. Record the population, seed, table, estimator and sample size. Repeated participant rows are not independent evidence about a new participant, and feature selection uses labels.',
 '`paired_counts` constructs the count table. A donor permutation preserves row and column sums, but can change the joint and MI. Use discrete_features=True for categorical inputs and divide the nat result by ln2 for bits. Relabelling, duplicating every count and appending an empty category preserve empirical MI; the replacement table factors into its marginals and has zero MI up to roundoff.\n\nRecord both sample sizes, their empirical tables and MI values, seed, population, estimator and any shuffle diagnostics. The known independent population has MI zero at both sizes. Sparse pairings can give positive estimates, and a particular larger sample can fluctuate either way. One positive estimate does not prove population dependence, causality or a calibrated rejection of independence.\n\nParticipant or session identity may correlate with training labels, and global channel selection can leak held-out labels. Split by participant first. Within each fold, fit preprocessing, binning and MI selection on training participants only, then evaluate on held-out participants. Report task performance and uncertainty and inspect changed acquisition conditions. Neither a small representation nor low estimated identity MI replaces this validation.')

api = '- [Scikit-learn mutual_info_score]'
idx = m.index(api)
m = replace(m,api,'## Technical references\n\n'+api,'MI3','manuscript')

# Make each summary row authoritative; remove obsolete override paragraphs.
rows = {
'L1': '| L1 joint and conditional law M03; product M06; PMI M07 | M02 is static row normalization. The first live mounting is M03, after conditional entropy and source weighting are introduced. It shows joint cells and marginals, selected row, normalized conditional probabilities, row entropies and the weighted total. M06 extends the same state with the product grid after product-law teaching; M07 adds selected-cell PMI and weighted contributions after PMI teaching. | All mounts share law preset, source/error state, row/cell selection and reset. Default is fair 80% agreement, row 0/cell 00. Binary error 0/.5/1 gives perfect/independent/invertibly wrong. Fixed equal-entropy rows (.45,.15),(.10,.30) have masses (.6,.4) and equal entropy .8112781244591328, so uniform averaging accidentally agrees. Unequal-entropy rows (.675,.075),(.125,.125) have masses (.75,.25), row entropies .4689955935892812/1, contributions .3517466951919609/.25, true total .6017466951919609 and wrong uniform total .7344977967946407. Fixed presets expose row/cell selection but no law-changing controls. Zero rows are unavailable. Reset from any mount restores all defaults; scrolling never resets. No later quantity is exposed before its teaching and no taught quantity is hidden behind a reveal. |',
'L6': '| L6 variational gaps M35; objective M36 | Fixed noisy encoder .2 and label error .1 give R=.278072 and T=.173254. M35 first shows exact information and auxiliary bounds with reference/decoder controls. M36 extends the same state with the objective ruler and beta control after the combined objective is introduced. | Auxiliary edits keep exact information dots fixed. Matching reference/decoder makes its gap zero; a poor decoder can make the relevance lower bound negative. The objective upper gap stays nonnegative. Domains, defaults and reset are specified below; no endpoint smoothing. Reset from either mount restores both auxiliaries and beta. Earlier views reflect current shared values without exposing an untaught objective control. |',
'L7': '| L7 Gaussian noise M41; unit conversion M42 | M40 is static continuous-law geometry. M41 first mounts with X normal (0,1), sigma .5, scale 1, current noise geometry and MI 1.160964, plus noise control. M42 adds the shared scale selector after unit conversion is taught. | Sigma 1 gives .5 bits; sigma 0 is the singular diagonal/infinite-MI branch. Sign quantization is a separately labelled static finite mechanism. Small positive sigma uses a stable log expression and never silently snaps to zero. Unit scaling preserves information. Both mounts share state and reset; no scale control appears before M42. |'
}
for k,new in rows.items():
    old = next(line for line in s.splitlines() if line.startswith('| '+k+' '))
    s = replace(s,old,new,'MI5','visualSpecifications')
old = next(p for p in s.split('\n\n') if p.startswith('L1 keeps the accepted shared state'))
s = replace(s,old,'L1’s summary row specifies its single shared investigation and three teaching stages. M02 remains the static introduction; M03, M06 and M07 add only quantities already introduced in the manuscript.','MI5','visualSpecifications')
old = next(p for p in s.split('\n\n') if p.startswith('Final first-use staging:'))
s = replace(s,old,'L6 and L7 follow the staged summary rows above. Reset in either linked mount restores the investigation’s complete defaults, and scrolling never resets. These are immediately visible views of shared state, with no reveal gate.','MI5','visualSpecifications')
s = replace(s,'Source: manuscript-complete-r2.md.','Source: manuscript-complete-r3.md.','binding','visualSpecifications')

mapping = [
 (1,1,'Both marginals, MI, conditional entropy and negative PMI retained; null fixture connects directly to unequal-row-entropy repair.'),
 (2,5,'Biased XOR individual/pair/conditional information and chain rule retained; distinct weighted-context exercise precedes it.'),
 (3,4,'Both source partitions, sufficiency and exact 2/3-bit conditional loss merged into one prompt and solution.'),
 (4,8,'Beta .5/4 candidate objectives and changed target N retained once, alongside separate encoder-randomness case.'),
 (5,9,'Exact natural-log Gibbs row, bit/nat error and 4/7,3/7 solution retained once with numerical-stability repair.'),
 (6,11,'Upper/lower bounds and .5-bit objective gap retained with fixed-encoder interpretation and beta convention.'),
 (7,13,'Noisy Gaussian, invertible scaling, exact noiseless infinity and sign one bit retained; event and XOR privacy cases stay distinct.'),
 (8,14,'Independent eight-category N20/2000 experiment, required records and nonmonotonic finite-sample limits retained.'),
 (9,14,'Participant/session leakage, training-fold feature selection and held-out participant evaluation retained.'),
 (10,10,'Changed label .2/beta4, three candidates, both initializations, finite40-step results and full original code/stdout retained.')]
semantic = [{'oldTask':a,'successorTask':b,'preservedOutcome':c,'originalPrompt':original[a-1]['prompt']} for a,b,c in mapping]

outputs = {'manuscript':(PREP/'manuscript-complete-r3.md',m),'visualSpecifications':(PREP/'visual-specifications-r3.md',s),'structured':(PREP/'visual-contracts-r3.json',json.dumps(contracts,ensure_ascii=False,indent=2)+'\n')}
for _,(p,value) in outputs.items():
    if p.exists(): raise ValueError('Refuse overwrite '+str(p))
    p.write_bytes(value.encode('utf8'))
# Exact inverse, including each complete old task block, proves all other text unchanged.
for owner,oldname in [('manuscript','manuscript-complete-r2.md'),('visualSpecifications','visual-specifications-r2.md')]:
    inverse = outputs[owner][1]
    for c in reversed(changes):
        if c['owner'].split(':')[0] == owner:
            if inverse.count(c['after']) != 1: raise ValueError('Inverse match '+c['owner'])
            inverse = inverse.replace(c['after'],c['before'])
    assert inverse == read(PREP/oldname)
prior_contracts=json.loads(read(PREP/'visual-contracts-r1.json'))
inverse_contracts=json.loads(json.dumps(contracts))
for c in changes:
    if c['owner'].startswith('structured:M28.'):
        next(x for x in inverse_contracts if x['id']=='M28')[c['owner'].split('.')[-1]]=c['before']
assert inverse_contracts==prior_contracts
# No programme, output, or even inline fence changes, including changed-task practice.
assert re.findall(r'```[^\n]*\n.*?```',m,re.S)==re.findall(r'```[^\n]*\n.*?```',read(PREP/'manuscript-complete-r2.md'),re.S)
assert len(re.findall(r'^### \d+\.',m,re.M))==16
receipt={'status':'AUTHOR_CORRECTION_READY_FOR_SAME_REVIEW','completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'review':ref(BASE/'content-independent-review-root-r2.json'),'predecessor':ref(BASE/'content-source-r2.json'),'changes':changes,'oldPracticeSemanticMapping':semantic,'checks':{'exactManuscriptInverse':True,'exactSpecificationInverse':True,'exactStructuredInverse':True,'allInlineCodeAndOutputFencesUnchanged':True,'practiceGroups':16,'drawings':52,'mainsExecuted':0},'successors':{k:ref(v[0]) for k,v in outputs.items()},'limits':['Content correction only; no runtime or paint acceptance','Original numerical evidence retained without replay']}
p=BASE/'content-correction-r3.json'
if p.exists():raise ValueError('Refuse frozen overwrite')
p.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'receipt':ref(p),'changes':len(changes),'successors':receipt['successors']},indent=2))

"""Bounded R1–R4 teaching successor. No model execution."""
import hashlib
import json
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization'
PUBLIC = ROOT / 'public/learn-code/dapo'
OUT = TOPIC / 'content-correction'
def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()
def replace_once(s, a, b):
    assert s.count(a) == 1, a[:100]
    return s.replace(a, b, 1)

OUT.mkdir(exist_ok=False)
old = json.loads((TOPIC / 'content-inputs.json').read_text())
changed = [TOPIC / 'lesson.md', PUBLIC / 'practice_answers.py', PUBLIC / 'evidence/practice.json', ROOT / 'public/learn-code/dapo-examples.zip']
retained = {}
for p in changed + [TOPIC / 'content-inputs.json']:
    rel = p.relative_to(ROOT)
    dest = OUT / 'predecessor' / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(p, dest)
    retained[dest.relative_to(ROOT).as_posix()] = sha(dest)
    if p in changed:
        assert sha(p) == old['files'][rel.as_posix()]
s = (TOPIC / 'lesson.md').read_text(encoding='utf-8')

# R1: move the existing concrete walk ahead of its formal generalization.
a = 'Here $\\ell$ is a log probability. The same token and the same prefix appear in\nboth numerator and denominator. If the old probability was .08 and the current\none is .10, the ratio is 1.25: that action has become 25% more likely at this\nprefix. A ratio is relative change, not the current probability itself.'
s = replace_once(s, a, 'Here $\\ell$ is a log probability. The same token and the same prefix appear in\nboth numerator and denominator.')
s = replace_once(s, 'For one stored token, compare the current and old conditional probabilities:', 'For the stored token in the drawing, suppose its old probability was .08 and\nits current probability is .10. Dividing .10 by .08 gives 1.25: that action has\nbecome 25% more likely at this prefix. This **ratio** measures relative change,\nnot the current probability itself. For any stored token, the same comparison is')
a = 'For rewards $(-1,-1,+1,+1)$, the mean is 0 and the sample variance is $4/3$.\nIgnoring the tiny epsilon for intuition, the advantages are approximately\n$(-.866,-.866,+.866,+.866)$. The same $A_i$ applies to every selected token of\nresponse $i$. It says how this whole response compares with the group; it is\nnot a token-by-token assessment.'
s = replace_once(s, a+'\n\n', '')
s = replace_once(s, 'For a group of $G\\ge2$ responses, define', 'For the four rewards $(-1,-1,+1,+1)$, adding and dividing by four gives mean 0.\nSubtracting that mean leaves two negative and two positive displacements. Their\nsquared values sum to 4; dividing by three gives sample variance $4/3$. Its\nsquare root is about 1.155. Dividing each displacement by this scale gives\napproximately $(-.866,-.866,+.866,+.866)$, before the tiny denominator safeguard.\nThese signed, scaled comparisons are the **advantages**. Each response passes\nits one advantage to every selected token; it is not a token-by-token assessment.\n\nFor a group of $G\\ge2$ responses, define')
a = 'Take $A=1$ and $r=1.25$. Symmetric $.2$ clipping gives $S=1.2$. Raising the upper\nepsilon to $.28$ gives $S=1.25$. For $A=-1$ at the same ratio, both give\n$S=-1.25$: the action became too likely despite its negative advantage,\nso the objective continues to penalize it.'
s = replace_once(s,a+'\n\n','')
s = replace_once(s,'Write the lower ratio bound as', 'Start with advantage +1 and ratio 1.25 in the drawing. The objective compares\nthe raw contribution 1.25 with a clipped contribution. Symmetric .2 clipping\ncaps that second value at 1.2, so the smaller value is 1.2. Raising the upper\nepsilon to .28 permits 1.25. With advantage −1, the raw value is −1.25, smaller\nthan the symmetrically clipped −1.2; both recipes therefore keep −1.25. Making\nthis unfavourable action more likely still worsens the objective. We call the\nquantity being maximized the **surrogate**; the minimized loss is its negative.\n\nWrite the lower ratio bound as')
start = s.index('Let $M_{i,t}$ be 1')
end = s.index('<!-- D12:', start)
s = s[:start] + r'''With the two responses in the drawing, equal response weight gives each row
one half of the total influence. The first row's two tokens therefore receive
1/4 each; the second row's six tokens receive 1/12 each. Equal token weight
instead gives all eight tokens 1/8: the short response has total weight 1/4
and the long one 3/4. If the rows' mean contributions are 1 and 3, equal
response weight gives $(1+3)/2=2$, while equal token weight gives
$(2\cdot1+6\cdot3)/8=2.5$.

Let $M_{i,t}$ be 1 for an included response token and 0 otherwise, and let
$L_i=\sum_tM_{i,t}$. For $N$ nonempty responses, those two choices generalize to

$$
\mathcal L_{\mathrm{response}}=
\frac1N\sum_i\frac{\sum_tM_{i,t}L(r_{i,t},A_i)}{L_i},
\qquad
\mathcal L_{\mathrm{token}}=
\frac{\sum_{i,t}M_{i,t}L(r_{i,t},A_i)}{\sum_{i,t}M_{i,t}}.
$$

''' + s[end:]
start=s.index('Assume a fixed prompt has independent responses')
end=s.index('When $p=0$ or $p=1$',start)
s=s[:start]+r'''Take two independent responses, each correct with probability .5. The tree
has four equally likely outcomes: pass/pass, pass/fail, fail/pass and fail/fail.
Only the middle two are mixed, so acceptance probability is .5. With unlimited
independent candidate trials of this kind, three accepted groups require
$3/.5=6$ candidates on average. An average is not a guarantee that a budget of
six will succeed.

For a fixed prompt with independent responses and correctness probability $p$,
all $G$ responses pass with probability $p^G$; all fail with probability
$(1-p)^G$. Subtracting these disjoint homogeneous events gives mixed probability

$$
a(p)=1-p^G-(1-p)^G.
$$

With the same positive acceptance probability on each independent trial, the
unlimited expected candidate count for $K$ accepted groups is $K/a(p)$.

'''+s[end:]
start=s.index('Let candidate prompt type $j$')
end=s.index('For efficiency, count candidate groups',start)
s=s[:start]+r'''Suppose half the candidate prompts are always answered correctly and half
produce a mixed group with probability .5. The first type contributes
$.5\cdot0=0$ accepted mass; the second contributes $.5\cdot.5=.25$. After
dividing by total accepted mass .25, every retained prompt belongs to the
second type. Selection has changed the prompt distribution.

Let candidate prompt type $j$ have mass $w_j$ and mixed probability $a_j$.
Multiplying each mass by its acceptance probability and renormalizing gives

$$
w'_j=\frac{w_ja_j}{\sum_k w_ka_k},
$$

when the denominator is positive. This can usefully focus updates, but a lower
loss on the retained data is not automatically an improvement on the original
task mixture.

'''+s[end:]
a='The paper\'s example uses $M=20{,}480$ and $B=4{,}096$. The penalty is zero through\n16,384 tokens, decreases linearly across the buffer, and reaches −1 at 20,480.\nAt 18,432 tokens it is −.5. A generator enforcing the cap never produces a\nlonger response, but the final branch makes the mathematical function explicit.\nThe pinned reward helper implements it directly.'
s=replace_once(s,a,'A generator enforcing the cap never produces a longer response, but the final\nbranch makes the mathematical function explicit. The pinned reward helper\nimplements it directly.')
s=replace_once(s,"DAPO's soft length penalty starts before the hard generation limit. Let $M$", "With the paper's maximum length 20,480 and buffer 4,096, subtracting the buffer\nlocates the penalty's start at 16,384 tokens. A response of length 18,432 lies\nhalfway across that buffer: $(16{,}384-18{,}432)/4{,}096=-.5$. The penalty is\nzero before the buffer and reaches −1 at the maximum.\n\nDAPO's soft length penalty therefore starts before the hard generation limit. Let $M$")
# R2: the first runnable encounter has its own setup.
s=replace_once(s,'<!-- PROGRAM dapo_collect.py -->','''Download and extract the [complete program archive](/learn-code/dapo-examples.zip).
The [README](/learn-code/dapo/README.md) describes its files and environment.
In the extracted `dapo` directory, create a Python 3.12 virtual environment with
`python -m venv .venv`, activate it for your shell (`.venv\\Scripts\\Activate.ps1`
in PowerShell or `source .venv/bin/activate` in bash), then install
`python -m pip install -r requirements.txt`. Run
`python dapo_checks.py --output finite.json` from that same directory.
`dapo_collect.py` and `dapo_math.py` are imported helpers; the finite check command
uses constructed tensors and the library reward helper without loading or
training a language model. The model-acquisition commands follow in section 12.

<!-- PROGRAM dapo_collect.py -->''')
# R4: state only the recorded shadow coverage.
s=replace_once(s,'parameter gradient and a shadow SGD update, then restores all original FP32\nparameters exactly. The first case also checks a shadow SGD update. That\nshadow calculation is a parity fixture, not another training observation.', 'parameter gradient. Only the first case also compares a shadow SGD update.\nThe preflight then restores all original FP32 parameters exactly. The shadow\ncalculation is a parity fixture, not another training observation.')

# R3: modify only the nine named practice sections and their finite answer source.
def practice(number, replacements):
    global s
    marker=f'### P{number:02d}.'
    start=s.index(marker)
    end=s.find('\n### P',start+1)
    if end<0: end=s.index('<!-- PROGRAM practice_answers.py -->',start)
    part=s[start:end]
    for a,b in replacements: part=replace_once(part,a,b)
    s=s[:start]+part+s[end:]
practice(2,[('old probability .08 and current probability .10','old probability .12 and current probability .09'),('$.10/.08=1.25$','$.09/.12=.75$: the selected action is 25% less likely')])
practice(4,[('$r=1.25$','$r=1.24$'),('$A=+1$\nand $A=-1$','$A=+2$\nand $A=-2$'),('give 1.2 versus 1.25','give 2.4 versus 2.48'),('give −1.25','give −2.48')])
practice(5,[('### P05. Construct an entropy counterexample','### P05. Change which outcome becomes more likely'),('$(.8,.2)$ with $(.9,.1)$','$(.2,.8)$ with $(.3,.7)$'),('$A=-2,r=12,c=10$','$A=-.5,r=8,c=6$. Explain why this entropy change differs from section 5'),('Entropy decreases from approximately .5004 to .3251 nats. The\nordinary negative-advantage loss is 24; the additional cap gives 20. Neither\nfact implies an entropy guarantee from Clip-Higher.', 'Entropy increases from approximately .5004 to .6109 nats because\nthe initially rarer outcome becomes more likely, moving toward a balanced\ndistribution. The ordinary negative-advantage loss is 4; the additional cap\ngives 3. The opposite entropy directions here and in section 5 show why a\nratio incentive alone supplies no entropy guarantee.')])
practice(8,[('$G=2,p=.5$','$G=3,p=.25$'),('for three accepted groups','for four accepted groups'),('Mixed probability is .5 and the expected count is $3/.5=6$.','Mixed probability is $1-.25^3-.75^3=.5625$, so expected\ncandidate count is $4/.5625=64/9$, approximately 7.111.')])
practice(9,[('at 18,432 with maximum 20,480 and buffer 4,096','at length 90 with maximum 120 and buffer 40'),('$(0,1,1,1)$','$(0,2,2,2)$'),('at 16,384','at 80'),('$(16{,}384-18{,}432)/4{,}096=-.5$. The zero reward has centered value −.75,','$(80-90)/40=-.25$. The zero reward has centered value −1.5,')])
practice(10,[('counts 2 and 6 and loss sums 2 and 18','counts 3 and 5 and loss sums 6 and 20'),('Global mean is 2.5; averaging the local means gives 2.','Global mean is $(6+20)/(3+5)=3.25$; averaging the local\nmeans 2 and 4 gives 3.')])
practice(11,[('[A,B,C]','[A,B,C,D]'),('indices are [2,0]','indices are [3,0]'),('[C,A]','[D,A]'),('such as [2,0]','such as [3,0]')])
practice(15,[('(11,6,2) and (11,2,6)','(7,3,2) and (7,2,3)'),('reward for 19','reward for 12'),('Both triples map to 19, but $11-6\\sqrt2\\ne11-2\\sqrt6$.','Both triples map to 12, but $7-3\\sqrt2\\ne7-2\\sqrt3$.')])
practice(18,[('Use the two-response fixture above. Compute its loss and selected-log-probability\ngradient.', 'Use rewards −1 and +1, lengths 3 and 2, and ratio rows $[.7,1,1.1]$ and\n$[1.1,1.4]$. Keep sample-SD epsilon $10^{-6}$, ratio bounds .8/1.28,\nno shaping and all five positions selected. Compute the loss and its\nselected-log-probability derivatives.'),('**Hint.** Keep the finite calculation separate from claims about the model run.','**Hint.** Let $a=1/(\\sqrt2+10^{-6})$. Check each sign before deciding which\nclipping branch is flat. Keep this calculation separate from the model run.'),('The loss is $-1.38/[5(\\sqrt2+10^{-6})]$. Its two derivative rows\nare $[.9a/5,1.1a/5]$ and $[-a/5,0,-1.1a/5]$. The positive ratio 1.3 contributes\nno derivative through its clipped term.', 'Negative token losses are $.8a,a,1.1a$; positive token losses are\n$-1.1a,-1.28a$. Their pooled loss is $.52/[5(\\sqrt2+10^{-6})]$. The derivative\nrows are $[0,a/5,1.1a/5]$ and $[-1.1a/5,0]$. Both the negative ratio .7\nand the positive ratio 1.4 lie on their respective flat branches.')])

p=(PUBLIC/'practice_answers.py').read_text(encoding='utf-8')
replacements=[('p = 0.8','p = 0.2'),('"old": 0.08','"old": 0.12'),('"current": 0.1','"current": 0.09'),('"ratio": 0.1 / 0.08','"ratio": 0.09 / 0.12'),('The ratio is1.25.','The ratio is.75.'),('"ratio": 1.25','"ratio": 1.24'),('"positive_symmetric_surrogate": 1.2','"positive_symmetric_surrogate": 2.4'),('"positive_asymmetric_surrogate": 1.25','"positive_asymmetric_surrogate": 2.48'),('"negative_symmetric_surrogate": -1.25','"negative_symmetric_surrogate": -2.48'),('"negative_asymmetric_surrogate": -1.25','"negative_asymmetric_surrogate": -2.48'),('"probability_after": 0.9','"probability_after": 0.3'),('[0.9, 0.1]','[0.3, 0.7]'),('"dual_clip_A_minus2_ratio12_loss": 20.0','"dual_clip_A_minus_half_ratio8_loss": 3.0'),('Increasing the dominant outcome reduces entropy. For A=-2,c=10, the extra loss cap is20;', 'Increasing the initially rarer outcome from.2 to.3 increases entropy. For A=-.5,c=6, the extra loss cap is3;'),('"G": 2','"G": 3'),('"p": 0.5','"p": 0.25'),('"mixed_probability": 0.5','"mixed_probability": 0.5625'),('"ideal_candidates_for3": 6.0','"ideal_candidates_for4": 64 / 9'),('Two successes and two failures account for probability.5; the mixed outcomes account for.5.','All-pass and all-fail probabilities are.25**3 and.75**3; mixed probability is.5625.'),('"cap": 20480','"cap": 120'),('"buffer": 4096','"buffer": 40'),('"length": 18432','"length": 90'),('"penalty": -0.5','"penalty": -0.25'),('"zero_reward_group": [0, 1, 1, 1]','"zero_reward_group": [0, 2, 2, 2]'),('"zero_reward_centered": -0.75','"zero_reward_centered": -1.5'),('The buffer begins at16384, so(16384-18432)/4096=-.5.','The buffer begins at80, so(80-90)/40=-.25.'),('"microbatch_tokens": [2, 6]','"microbatch_tokens": [3, 5]'),('"microbatch_loss_sums": [2.0, 18.0]','"microbatch_loss_sums": [6.0, 20.0]'),('"global_token_mean": 2.5','"global_token_mean": 3.25'),('"mean_of_microbatch_means": 2.0','"mean_of_microbatch_means": 3.0'),('numerator2+18 and denominator2+6','numerator6+20 and denominator3+5'),('Averaging1 and3','Averaging2 and4'),('"prompt_ids": ["A", "B", "C"]','"prompt_ids": ["A", "B", "C", "D"]'),('"selected_indices": [2, 0]','"selected_indices": [3, 0]'),('"correct_join": ["C", "A"]','"correct_join": ["D", "A"]'),('[11, 6, 2]','[7, 3, 2]'),('[11, 2, 6]','[7, 2, 3]'),('11 - 6 * math.sqrt(2)','7 - 3 * math.sqrt(2)'),('11 - 2 * math.sqrt(6)','7 - 2 * math.sqrt(3)'),('"mapped_integer": 19','"mapped_integer": 12'),('same integer19','same integer12'),('"lengths": [2, 3]','"lengths": [3, 2]'),('[[0.9, 1.1], [1.0, 1.3, 1.1]]','[[0.7, 1.0, 1.1], [1.1, 1.4]]'),('negative terms are .9a and1.1a; positive surrogates are1a,1.28a,1.1a','negative terms are .8a,1a,1.1a; positive surrogates are1.1a,1.28a'),('[[0.9 * a, 1.1 * a], [-a, -1.28 * a, -1.1 * a]]','[[0.8 * a, a, 1.1 * a], [-1.1 * a, -1.28 * a]]'),('[[0.9 * a / 5, 1.1 * a / 5], [-a / 5, 0.0, -1.1 * a / 5]]','[[0.0, a / 5, 1.1 * a / 5], [-1.1 * a / 5, 0.0]]'),('rows[4]["entropy_after"] < rows[4]["entropy_before"]','rows[4]["entropy_after"] > rows[4]["entropy_before"]'),('rows[17]["loss"] + 1.38 * a / 5','rows[17]["loss"] - 0.52 * a / 5')]
for a,b in replacements: p=replace_once(p,a,b)
assert s.count('<!-- D')==36 and s.count('<!-- PROGRAM ')==12
(TOPIC/'lesson.md').write_text(s,encoding='utf-8')
(PUBLIC/'practice_answers.py').write_text(p,encoding='utf-8')
# Execute only the revised standard-library finite answers into a fresh receipt.
subprocess.run([sys.executable,str(PUBLIC/'practice_answers.py'),'--output',str(OUT/'practice.json')],check=True)
shutil.copyfile(OUT/'practice.json',PUBLIC/'evidence/practice.json')
archive=ROOT/'public/learn-code/dapo-examples.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
    for f in sorted(PUBLIC.rglob('*')):
        if f.is_file():
            assert '__pycache__' not in f.parts
            info=zipfile.ZipInfo('dapo/'+f.relative_to(PUBLIC).as_posix(),(2026,10,8,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,f.read_bytes())
guards={}
for f,h in old['files'].items():
    if ROOT/f not in changed:
        assert sha(ROOT/f)==h,f
        guards[f]=h
effective={**guards,**{p.relative_to(ROOT).as_posix():sha(p) for p in changed},**retained}
for p in [TOPIC/'content-inputs.json',TOPIC/'content-review.md',TOPIC/'content-review-inputs.json',OUT/'practice.json',Path(__file__).resolve()]: effective[p.relative_to(ROOT).as_posix()]=sha(p)
with zipfile.ZipFile(archive) as z:
    for f in PUBLIC.rglob('*'):
        if f.is_file(): assert z.read('dapo/'+f.relative_to(PUBLIC).as_posix())==f.read_bytes()
report={'passed':True,'scope':'R1 concrete walks; R2 first-program setup; R3 nine changed transfer tasks; R4 exact shadow coverage. No model execution.','conserved':len(guards),'changed':{p.relative_to(ROOT).as_posix():{'before':old['files'][p.relative_to(ROOT).as_posix()],'after':sha(p)} for p in changed},'files':effective}
(OUT/'inputs.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'packet':str(OUT/'inputs.json'),'sha256':sha(OUT/'inputs.json'),'files':len(effective)}))

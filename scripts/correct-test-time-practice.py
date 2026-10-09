"""Bounded complete-practice correction; conserve the original content/science."""
from pathlib import Path
from fractions import Fraction as F
from math import comb
import hashlib
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/test-time-compute-scaling'
DEST = TOPIC / 'content-correction'
DEST.mkdir(exist_ok=False)
(DEST / 'predecessor').mkdir()
for name in ['lesson.md', 'content-inputs.json', 'content-author-review.md']:
    shutil.copy2(TOPIC / name, DEST / 'predecessor' / name)
source = (TOPIC / 'lesson.md').read_text(encoding='utf8')
replacements = {
1: '''### 1. Opportunity under dependence

A single attempt succeeds with probability 0.2. Compute the opportunity with three iid attempts, then with three identical copies of one attempt. Can either number be called selected accuracy?

**Hint:** count the event that every independent attempt fails.

**Solution:** iid opportunity is 1−0.8³=0.488. Identical copies share one success event, so opportunity remains 0.2. Neither determines selected accuracy without a rule for finding the correct answer when it exists. Copying answers increases candidate count without adding independent opportunities.

''',
2: '''### 2. Majority and plurality

For five iid binary votes with correctness probability 0.6, calculate majority correctness. Then compare many-way distributions (0.38 correct,0.34 wrong,0.28 wrong) and (0.38 correct,0.42 wrong,0.20 wrong).

**Hint:** enumerate exactly three, four and five correct votes, then compare individual answer masses.

**Solution:** the three terms are C(5,3)×0.6³×0.4²=0.3456, C(5,4)×0.6⁴×0.4=0.2592, and 0.6⁵=0.07776. Their sum is 0.68256. In the first many-way distribution, the correct answer is the unique largest class despite being below 0.5; iid empirical plurality converges to it. In the second, a wrong answer has the largest mass 0.42, so plurality converges toward that error. Equal largest masses need an explicit tie treatment. Binary majority and multiclass plurality have different assumptions.

''',
6: '''### 6. A loss-dependent answer

Answers −2,1,7 have masses 0.45,0.15,0.40. Find the minimum-risk choice under exact-match and absolute-error loss. How many comparisons arise from five actions and seven sampled references?

**Hint:** put proposed actions in rows and reference answers in columns.

**Solution:** exact-match risks are 0.55,0.85,0.60, selecting −2. The absolute-loss rows are [0,3,9], [3,0,6], [9,6,0]; their weighted sums are 4.05,3.75,4.95, selecting 1. Five times seven is 35 utility/loss evaluations. References estimate a model distribution; they are not evaluation truth. Temperature or truncation changes the distribution sampled.

''',
7: '''### 7. Pruning and charged lookahead

Use the retained PRM tree with width 2, but allow only one expansion depth. How many nodes are scored, and is a completed answer available? Then allow depth 2. Separately, charge three proposed steps with four additional lookahead steps per proposal.

**Hint:** distinguish a surviving prefix from a completed leaf, and charge every rollout edge.

**Solution:** depth 1 scores only A and B: two nodes. Both prefixes survive but neither is a completed answer, so the search must report no completed answer. Depth 2 additionally scores their four leaves: six nodes total; A1 with product 0.6×0.95=0.57 beats B1 with 0.9×0.5=0.45. The changed lookahead plan consumes 3×(1+4)=15 step-generations, before other scoring costs. Independently rooted searches preserve separate frontiers; global pruning can allocate all survivors to one root. The adapter's scoring-policy examples are finite demonstrations, not independently generated neural DVTS samples.

''',
8: '''### 8. Revision dependencies

For a task whose answer is 3, retained revisions answer 4,3,5 with scores 0.4,0.8,0.6. Compare taking the last response with keeping the highest-scored response. Then raise the final score to 0.9. Separately, compare four sequential 1.5-second stages with four independent 1.5-second calls on two ideal workers.

**Hint:** trace the highest eligible score, then place jobs on worker timelines without breaking dependencies.

**Solution:** taking the last response returns wrong answer 5. Retained best-score selection initially returns correct answer 3 at score 0.8. Raising the final score to 0.9 makes that selector return wrong answer 5 too, even though the correct candidate is retained. The serial critical path is 4×1.5=6 seconds. Two workers finish four independent calls in two waves, or 3 seconds. Both consume 6 worker-seconds under the supplied ideal assumptions. A real shared device may not sustain those independent durations.

''',
9: '''### 9. Reserve the final response

Thinking cap 7, final reserve 3 and remaining context 8: what is the maximum available thinking space? What happens if a continuation cue consumes one position?

**Hint:** reserve context before consuming it.

**Solution:** at most min(7,8−3)=5 positions are available for thinking and its injected cues. If a `Wait` cue consumes one, at most four can be model-emitted thinking tokens within that context allowance. The three final positions remain reserved. Raising the cap cannot increase physical context capacity or guarantee improved reasoning.

''',
10: '''### 10. Three success quantities

A retained pool of ten has three correct attempts. Its first three are wrong, and the selected answer is wrong. Compute pass@3, realized first-prefix opportunity and selected correctness.

**Hint:** the estimator samples a subset; the prefix and selector are specific events.

**Solution:** pass@3 is 1−C(7,3)/C(10,3)=1−35/120=17/24, approximately 0.70833. Realized prefix opportunity is 0, and selected correctness is 0. The pool size is 10 and subset size 3; neither is a question count. Across a dataset, average these per-question quantities with a declared treatment of repeated seeds.

''',
14: '''### 14. Amortize training

With X = 80,Y = 20,M = 3, compute the small-model inference multiplier at equal total work. Repeat with Y = 160.

**Hint:** first subtract the small model's training work from the larger model's total.

**Solution:** 3(80+20)−80=220 inference units, so a = 220/20=11. At Y = 160, 3(80+160)−80=640, so a = 640/160=4. Adding verifier work or changing hardware utilization alters the cost model. Equal work alone does not establish equal answer quality.

''',
}
prefix, practice = source.split('## 15. Practice',1)
changes = []
for number,new in replacements.items():
    pattern = rf'(?m)^### {number}\. [\s\S]*?(?=^### \d+\.|^## Summary)'
    found = list(re.finditer(pattern,practice))
    assert len(found)==1,number
    old=found[0].group()
    practice=practice[:found[0].start()]+new+practice[found[0].end():]
    changes.append({'practice':number,'before':old,'after':new})
updated=prefix+'## 15. Practice'+practice
(TOPIC/'lesson.md').write_text(updated,encoding='utf8',newline='\n')
numeric={
 '1':str(1-F(4,5)**3),
 '2':str(sum(F(comb(5,k))*F(3,5)**k*F(2,5)**(5-k) for k in range(3,6))),
 '6':{'absolute':[str(sum(p*abs(a-y) for p,y in zip([F(45,100),F(15,100),F(4,10)],[-2,1,7]))) for a in [-2,1,7]],'comparisons':5*7},
 '7':{'depth1_scored':2,'depth1_completed':0,'depth2_scored':6,'products':[str(F(6,10)*F(95,100)),str(F(9,10)*F(5,10))],'lookahead_work':3*(1+4)},
 '8':{'best_before':[4,3,5][max(range(3),key=lambda i:[.4,.8,.6][i])],'best_after':[4,3,5][max(range(3),key=lambda i:[.4,.8,.9][i])],'serial':4*F(3,2),'parallel':2*F(3,2),'total_work':4*F(3,2)},
 '9':{'allowance':min(7,8-3),'thinking_after_cue':min(7,8-3)-1},
 '10':str(1-F(comb(7,3),comb(10,3))),
 '14':[(3*(80+y)-80)//y for y in [20,160]],
}
assert numeric['1']=='61/125' and numeric['2']=='2133/3125'
assert numeric['6']['absolute']==['81/20','15/4','99/20']
assert numeric['7']['products']==['57/100','9/20']
assert numeric['8']['best_before']==3 and numeric['8']['best_after']==5
assert numeric['9']=={'allowance':5,'thinking_after_cue':4}
assert numeric['10']=='17/24' and numeric['14']==[11,4]
packet=json.loads((TOPIC/'content-inputs.json').read_text())
conserved=[]
for row in packet['files']:
    path=ROOT/row['path']
    effective=DEST/'predecessor/lesson.md' if path==TOPIC/'lesson.md' else path
    assert hashlib.sha256(effective.read_bytes()).hexdigest()==row['sha256'],row['path']
    conserved.append({'original':row['path'],'current':effective.relative_to(ROOT).as_posix(),'sha256':row['sha256']})
report={'status':'corrected pending same-reviewer closure','before_sha256':hashlib.sha256(source.encode()).hexdigest(),'after_sha256':hashlib.sha256(updated.encode()).hexdigest(),'changes':changes,'numeric':numeric,'conserved':conserved,'scope':'eight practice blocks only; no program/data/visual/science change, no native call or replay'}
(DEST/'checks.json').write_text(json.dumps(report,indent=2,default=str)+'\n',encoding='utf8',newline='\n')
files=[]
for path in sorted(set([ROOT/row['path'] for row in packet['files']]+[p for p in DEST.rglob('*') if p.is_file()]+[Path(__file__).resolve(),TOPIC/'content-review-training.md',TOPIC/'content-review-training-checks.json'])):
 files.append({'path':path.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':path.stat().st_size})
(DEST/'inputs.json').write_text(json.dumps({'status':'bounded R1 correction ready for same-reviewer closure','files':files},indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps({'files':len(files),'packet_sha256':hashlib.sha256((DEST/'inputs.json').read_bytes()).hexdigest(),'manuscript_sha256':hashlib.sha256(updated.encode()).hexdigest()}))

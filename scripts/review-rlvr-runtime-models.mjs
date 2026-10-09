// Preliminary numerical review only; imports the exact read pure source via data URL.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const topic = 'docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards';
const directory = path.join(root, topic, 'runtime-independent-preparation');
const sourcePath = 'src/learn/data/rlvr-models.js';
const bytes = fs.readFileSync(path.join(root, sourcePath));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sha = hash(bytes);
const M = await import(`data:text/javascript;base64,${bytes.toString('base64')}`);
const fixtures = JSON.parse(fs.readFileSync(path.join(directory, 'fixtures.json')));
const checks = [], findings = [];
function check(name, actual, expected, tolerance = 1e-10) {
  const same = typeof expected === 'number'
    ? actual === expected || Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected))
    : JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) findings.push({ name, actual, expected });
  checks.push({ name, passed: same });
}
function list(name, actual, expected) {
  check(`${name} length`, actual.length, expected.length);
  expected.forEach((value, i) => check(`${name} ${i}`, actual[i], value));
}
for (const fixture of fixtures.estimator_moments) {
  if (fixture.epsilon === 0) {
    const actual = M.enumerateBaselines(fixture.p, fixture.G);
    for (const [field, reference] of Object.entries(fixture.moments)) {
      const map = { raw: 'raw', same_group: 'same', leave_one_out: 'loo', population_scaled: 'standardized' };
      if (!map[field]) continue;
      check(`estimator ${fixture.p}/${fixture.G}/${field} expectation`, actual.moments[map[field]].mean, reference.mean);
      check(`estimator ${fixture.p}/${fixture.G}/${field} variance`, actual.moments[map[field]].variance, reference.variance);
    }
  }
  for (const row of fixture.rows) {
    for (const sample of [false, true]) {
      const stats = M.groupStatistics(row.outcomes, { sample, epsilon: fixture.epsilon });
      const score = stats.advantages.reduce((sum, a, i) => sum + a * (row.outcomes[i] - fixture.p), 0) / fixture.G;
      check(`scaled score ${fixture.p}/${fixture.G}/${fixture.epsilon}/${row.outcomes}/${sample}`, score, row[sample ? 'sample_scaled' : 'population_scaled']);
    }
  }
}
for (const fixture of fixtures.KL_routes) {
  const [p] = fixture.current, [q] = fixture.reference, result = M.klRoutes(p, q);
  list(`KL action values ${p}/${q}`, result.k3, fixture.k3_per_action);
  check(`KL exact expectation ${p}/${q}`, result.value, fixture.exact_current_KL);
  check(`KL sampled expectation ${p}/${q}`, result.sampledValue, fixture.exact_current_KL);
  check(`KL full derivative ${p}/${q}`, result.exactDerivative, fixture.exact_gradient);
  // The export is explicitly matched old=current; it offers no stale-old argument.
  const expectedPartial = fixture.current.reduce((sum, mass, i) => sum + mass * (1-fixture.reference[i]/mass) * (i === 0 ? 1-p : -p), 0);
  check(`KL matched detached derivative ${p}/${q}`, result.partialDerivative, expectedPartial);
}
check('missing reference support is infinite', M.klRoutes(1, 0).value, Infinity);
check('identical point masses zero KL', M.klRoutes(1, 1).value, 0);
check('missing current support disables value identity', M.klRoutes(1, .5).supported, false);
for (const fixture of fixtures.epsilon_scaling) {
  const actual = M.correctedRewards(fixture.raw, .2, .15, fixture.epsilon);
  list(`affine corrected values ${fixture.epsilon}`, actual.corrected, fixture.corrected);
  list(`affine raw coefficients ${fixture.epsilon}`, actual.raw.advantages, fixture.raw_statistics.coefficients);
  list(`affine fixed epsilon ${fixture.epsilon}`, actual.transformed.advantages, fixture.fixed_epsilon_statistics.coefficients);
}
for (const mode of ['none', 'cell', 'row', 'column', 'all']) {
  const result = M.corruptionGrid(mode);
  const expected = result.clean.map((row, i) => row.map((value, j) => {
    const flipped = mode === 'all' || mode === 'cell' && i === 0 && j === 1 || mode === 'row' && i === 0 || mode === 'column' && j === 1;
    return flipped ? 1-value : value;
  }));
  check(`correlation cells ${mode}`, result.edited, expected);
  list(`correlation rewards ${mode}`, result.rewards, expected.map(row => row.reduce((a,b) => a+b, 0)/3));
  if (mode === 'all') list('whole complement coefficient sign', result.advantages, M.corruptionGrid('none').advantages.map(a => -a));
}
for (const row of fixtures.subset_events) check(`pass@k ${row.n}/${row.c}/${row.k}`, M.passAtK(row.n, row.c, row.k), row.value);
for (const row of fixtures.unknown_contract.invalid_passk) check(`unavailable pass@k ${row.n}/${row.c}/${row.k}`, M.passAtK(row.n,row.c,row.k), null);
check('binomial symmetry', M.binomial(12, 3), M.binomial(12, 9));
check('binomial Pascal', M.binomial(10, 4), M.binomial(9, 4)+M.binomial(9, 3));
for (const row of fixtures.parser_contract) {
  const result = M.verdict(row.prediction, row.gold);
  check(`parser object ${JSON.stringify(row)}`, result.parsed, row.parsed);
  check(`parser verdict ${JSON.stringify(row)}`, result.accepted, row.accepted);
}
for (const [source, expected] of [['-12/-18','2/3'],['+000.500','1/2'],['9007199254740993','9007199254740993'],['.001','1/1000']]) check('exact numeric '+source, M.numericObject(source), expected);
for (const [raw,expected] of [['\\boxed{\\frac{2}{4}}','1/2'],['\\boxed{\\frac{1+1}{4}}',null],['\\boxed{\\frac{1}{2}',null]]) check('boxed '+raw,M.extractNumber(raw,true).parsed,expected);
for (const [expression, x, y, expected] of [['x-y*2',3,4,-5],['-(x+y)*3',2,-4,6],['12-(3-1)',0,0,10],['x*y+y',-2,3,-3]]) check('tree '+expression,M.evaluateTree(M.arithmeticTree(expression),x,y),expected);
check('weak tests accept x',M.checkExpression('x').accepted,true);
check('new counterexample rejects x',M.checkExpression('x',true).accepted,false);
check('full declared sum accepted',M.checkExpression('x+y',true).accepted,true);
check('unsupported call rejected',M.checkExpression('call()').accepted,false);
const group = M.groupStatistics([1,null,0], { sample:true });
check('available group count',group.count,2);check('sample mean',group.mean,.5);check('sample SD',group.std,Math.sqrt(.5));check('missing coefficient',group.advantages[1],0);
check('all unavailable scale',M.groupStatistics([null,null]).std,null);
check('one available sample scale',M.groupStatistics([1,null],{sample:true}).std,null);
list('one available sample coefficient',M.groupStatistics([1,null],{sample:true}).advantages,[0,0]);
const objective = M.objective([2,3,5],[1,-1,2]);
check('unnormalized objective',objective.value,.9);list('logit gradient',objective.gradient,[.02,-.57,.55]);
check('no probability mass',M.objective([0,0,0]).value,null);
for (const [ratio,a,expected,derivative] of [[.7,2,1.4,2],[1.3,-2,-2.6,-2],[1.3,2,2.4,0],[.7,-2,-1.6,0],[1.2,2,2.4,null],[.8,-2,-1.6,null],[1,0,0,0]]) {
  const result=M.clippedTerm(ratio,a);check(`clip value ${ratio}/${a}`,result.value,expected);check(`clip derivative ${ratio}/${a}`,result.derivative,derivative);
}
const reduced=M.tokenReduction([1,5],[2,-1],5);check('response equal',reduced.response,.5);check('pooled',reduced.pooled,-.5);check('fixed',reduced.fixed,-.3);
check('empty pooled',M.tokenReduction([0,0],[1,3]).pooled,null);check('empty fixed denominator',M.tokenReduction([0,0],[1,3]).fixed,0);
for(const p of [0,.2,.8,1])for(const size of [1,3,5]){
  const result=M.samplingEvents(p,size);check(`event partition ${p}/${size}`,result.failure+result.mixed+result.success,1);check(`any event ${p}/${size}`,result.any,result.mixed+result.success);
}
for(const temperature of [.1,1,3])for(const topK of [0,1,2,3]){
  const result=M.samplingDistribution(temperature,topK);check(`distribution normalized ${temperature}/${topK}`,result.probabilities.reduce((a,b)=>a+b,0),1);
  check(`support count ${temperature}/${topK}`,result.probabilities.filter(p=>p>0).length,topK||3);
  check(`expected reward ${temperature}/${topK}`,result.expectedReward,result.probabilities[0]);
}
check('top1 entropy zero',M.samplingDistribution(1,1).entropy,0);
check('top1 removes successful action',M.samplingDistribution(1,1).expectedReward,0);
check('temperature rises entropy',M.samplingDistribution(3).entropy>M.samplingDistribution(.1).entropy,true);
const confusion=M.confusion(.3,.2,.1);check('confusion mass',confusion.cells.flat().reduce((a,b)=>a+b,0),1);check('acceptance',confusion.accepted,.41);check('precision',confusion.precision,27/41);
check('no accepted precision',M.confusion(0,0,0).precision,null);check('nonpositive correction unavailable',M.correctedRewards([0,1],.6,.5).corrected,null);
const reasoning=M.reasoningMass(.4,.7,.1);check('reasoning joint mass',reasoning.cells.flat().reduce((a,b)=>a+b,0),1);check('reasoning mean',reasoning.mean,.34);check('conditional coefficient averages zero',.4*reasoning.correct+.6*reasoning.incorrect,0);check('constant answer conditional coefficient unavailable',M.reasoningMass(.4,1,1).correct,null);
check('vote tied',M.answerVote(['2','1','2','1',null]).plurality,null);check('vote invalid counted',M.answerVote(['2','1','2','1',null]).invalid,1);check('plurality without majority',M.answerVote(['2','1','2',null]).plurality,'2');check('no strict majority',M.answerVote(['2','1','2',null]).majority,null);check('strict majority',M.answerVote(['2','2','1']).majority,'2');
const ids=M.byteIds('é');list('UTF8 prompt prefix',ids.slice(0,3),[258,195,169]);check('byte SEP',ids.at(-1),259);list('response mask with EOS',M.responseMask(3,2,6),[false,false,true,true,false]);list('zero response mask',M.responseMask(3,0,6),[false,false,false,false,false]);
// Editable D03 draws Array.from(text) character positions, not UTF-16 code units.
for (const raw of ['🙂 #### 72','####   ']) {
  const result=M.extractNumber(raw), chars=Array.from(raw);
  check('D03 code-point span valid '+JSON.stringify(raw),result.span[0]>=0&&result.span[0]<=result.span[1]&&result.span[1]<=chars.length,true);
  if(result.parsed!==null)check('D03 highlighted object '+JSON.stringify(raw),chars.slice(...result.span).join(''), '72');
}
const unchanged = hash(fs.readFileSync(path.join(root,sourcePath)))===sha;
check('model source unchanged during review',unchanged,true);
const snapshot=path.join(directory,'reviewed-model-source.js');
if(fs.existsSync(snapshot))throw new Error('Preserve existing preliminary source snapshot');
fs.writeFileSync(snapshot,bytes);
const report={status:findings.length?'preliminary findings; no runtime acceptance':'preliminary arithmetic pass; no runtime acceptance',source:sourcePath,source_sha256:sha,fixture_sha256:hash(fs.readFileSync(path.join(directory,'fixtures.json'))),scope:'All numerical exports read; supported finite calculations and editable character-span witnesses only. No browser paint/model/scientific replay. Stale-old KL is not exposed by this matched-sampling module API.',checks:checks.length,passed:checks.filter(c=>c.passed).length,findings,details:checks};
const target=path.join(directory,'model-review.json');if(fs.existsSync(target))throw new Error('Existing review must remain unchanged');fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checks:checks.length,passed:report.passed,source_sha256:sha,findings,report_sha256:hash(fs.readFileSync(target))}));

import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as m from '../src/learn/data/rlhf-models.js';
import { observations as o, observationSources } from '../src/learn/data/rlhf-observations.js';

const owner = 'docs/teaching/llm-architecture-training/rlhf-reinforcement-learning-from-human-feedback';
const checks = [];
const check = (condition, label) => { assert.ok(condition, label); checks.push(label); };
const near = (actual, expected, label, tolerance = 1e-9) => check(Math.abs(actual - expected) <= tolerance, label);
const equal = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks.push(label); };
const read = (name) => JSON.parse(fs.readFileSync(`public/learn/examples/rlhf/${name}`, 'utf8'));
const hash = (name) => crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex');

// Independently enumerate every browser-observation projection.
for (const [name, sha] of Object.entries(observationSources)) check(hash(`public/learn/examples/rlhf/${name}`) === sha, `Source ${name}`);
const records = read('records.json').records;
const byId = new Map(records.map(row => [row.row_id, row]));
const reward = read('observations/pairwise.json');
const predictions = reward.predictions.filter(row => row.split === 'heldout');
equal(o.pair, byId.get(predictions[0].row_id), 'Literal opening released pair');
equal(o.heldoutPredictions, predictions.map(row => ({...row, probability: row.chosen_probability})), 'Every held-out prediction');
equal(o.heldoutExamples, predictions.slice(0, 12).map(row => byId.get(row.row_id)), 'Every selectable held-out record');
equal(o.pairMetrics, Object.fromEntries(['heldout', 'length_baseline', 'sklearn_heldout'].map(key => [key, reward[key]])), 'All measured pair metrics');
equal(o.probabilityBins, reward.probability_bins, 'All measured bins');
const policy = read('observations/token_ppo.json');
for (const [browser, native] of [['firstRollout','first_rollout'],['tokens','tokens'],['evaluations','evaluations']]) equal(o[browser], policy[native], `Entire ${browser} projection`);
equal(o.firstUpdate, policy.history[0].updates[0], 'Actual first update projection');
equal(o.rounds, policy.history.map(row => ({round: row.round, valueMse: row.updates.reduce((s, item) => s + item.value_mse, 0) / row.updates.length})), 'All 20 value MSE projections');
equal(o.framework, read('observations/transformers.json'), 'Entire actual framework parity projection');
equal(o.sharedWitness, read('observations/categorical.json').shared_parameter_witness, 'Actual native shared-parameter witness');

// Compare the analytic optimum with independently enumerated simplex policies.
for (const beta of [.05, .17, .7, 2]) {
  for (const rewards of [[-2,.3,1.4], [0,0,0], [1,-1,.2]]) {
    const ref = [.2,.5,.3];
    const result = m.tilted(ref,rewards,beta);
    const optimum = m.referenceTerms(result.policy,ref,rewards,beta).objective;
    let gridMaximum = -Infinity;
    for (let a=0;a<=20;a++) for (let b=0;b<=20-a;b++) {
      const pi=[a/20,b/20,(20-a-b)/20];
      const value=pi.reduce((s,p,i)=>s+p*rewards[i]-(p===0?0:beta*p*Math.log(p/ref[i])),0);
      gridMaximum=Math.max(gridMaximum,value);
    }
    check(optimum+1e-12>=gridMaximum,'Tilt dominates independent simplex grid');
    near(optimum,beta*Math.log(ref.reduce((s,p,i)=>s+p*Math.exp(rewards[i]/beta),0)),'Variational optimum equals log partition',1e-8);
  }
}
equal(m.tilted([.4,.6,0],[-100,-100,1e6],.05).policy,[.4,.6,0],'Unsupported huge reward cannot inject mass');
for (const pi of [[0,1,0],[1,0,0],[.3,.7,0]]) check(m.referenceTerms(pi,[.4,.6,0]).valid,'Zero/zero support excluded from KL');

// Credit propagation: different horizons, discount factors and terminal perturbations.
for (let length=1;length<=7;length++) for (const gamma of [.6,.95,1]) for (const lambda of [0,.3,1]) {
  const r=Array.from({length},(_,i)=>Math.sin(i+.3));
  const v=Array.from({length},(_,i)=>Math.cos(i+.2));
  const bootstrap=.37;
  const state=m.gae(r,v,lambda,gamma,bootstrap);
  for (let t=0;t<length;t++) {
    let expected=0;
    for (let j=t;j<length;j++) expected+=(gamma*lambda)**(j-t)*(r[j]+gamma*(j+1<length?v[j+1]:bootstrap)-v[j]);
    near(state.advantages[t],expected,'GAE independent finite expansion');
    near(state.targets[t],expected+v[t],'GAE target retains pre-action value');
  }
  const altered=r.slice(); altered[length-1]+=1;
  const change=m.gae(altered,v,lambda,gamma,bootstrap);
  state.advantages.forEach((a,t)=>near(change.advantages[t]-a,(gamma*lambda)**(length-1-t),'Terminal delta has distance-dependent effect'));
}

// Full shared surrogate, rather than checking a duplicated one-coordinate expression.
function sharedObjective(theta) {
  const p1=1/(1+Math.exp(-theta));
  const p2=1/(1+Math.exp(.1*theta+Math.log(4)));
  return Math.min(p1/.5,1.2)+Math.min(-p2/.2,-Math.min(1.2,Math.max(.8,p2/.2)));
}
near((sharedObjective(.700001)-sharedObjective(.699999))/.000002,m.sharedParameter().gradient,'Finite difference of complete shared surrogate',1e-8);
check(m.sharedParameter(.5).afterRatios[0]>m.sharedParameter(.5).ratios[0],'Other observation moves locally clipped observation');

// Boundary bins include exact probability one in the final bucket.
const bins=m.calibration([{probability:0},{probability:.2},{probability:.5},{probability:1}]);
equal(bins.map(row=>row.count),[2,1,2,0,3],'Explicit oriented boundary-bin ownership');
check(bins[3].confidence===null && bins[3].frequency===null,'Empty boundary bin stays unknown');

const manuscript=fs.readFileSync(`${owner}/manuscript.jsx`,'utf8');
const lesson=fs.readFileSync(`${owner}/lesson.jsx`,'utf8');
equal(lesson,manuscript.replace('[−1.099667995,1.099667995]','[−1.099667995, 1.099667995]').replace('[.2099667995,.0900332005]','[.2099667995, .0900332005]'),'Entire rendering manuscript differs only by two declared spaces');
const files=['scripts/review-rlhf-runtime-independent.mjs','src/learn/data/rlhf-models.js','src/learn/data/rlhf-observations.js','src/learn/components/lesson-labs/RLHFFlow.jsx','src/learn/components/lesson-labs/rlhf-flow.css',`${owner}/lesson.jsx`,`${owner}/runtime-inputs.json`];
fs.writeFileSync(`${owner}/independent-runtime/model-probes.json`,JSON.stringify({status:'passed',checks:checks.length,details:checks,sourceHashes:Object.fromEntries(files.map(file=>[file,hash(file)])),fitsReplayed:0},null,2)+'\n');
console.log(`Passed ${checks.length} independent projection and arithmetic conditions; zero fits.`);

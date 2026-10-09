import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const folder = 'docs/teaching/llm-architecture-training/dpo-direct-preference-optimization';
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const bindings = Object.fromEntries(['design.md','research.md','original-assessment.md'].map(p => [`${folder}/${p}`,sha(`${folder}/${p}`)]));
const observations = [];
const near = (name,a,b,tol=1e-12) => { assert.ok(Math.abs(a-b)<tol, name); observations.push({name,actual:a,expected:b,passed:true}); };
const sigmoid = x => 1/(1+Math.exp(-x));
const loss = (a,b,fa,fb,beta) => Math.log1p(Math.exp(-beta*((a-fa)-(b-fb))));
const m=(-2+3)-(-4+3.5), beta=.4;
near('Four-score relative margin',m,1.5);
near('Initial comparison probability',sigmoid(beta*m),.6456563062257954);
near('Initial stable loss',loss(-2,-4,-3,-3.5,beta),.4374879504858856);
const eps=1e-6;
near('Chosen score derivative', (loss(-2+eps,-4,-3,-3.5,beta)-loss(-2-eps,-4,-3,-3.5,beta))/(2*eps),-beta*sigmoid(-beta*m),1e-9);
near('Reference equality independent of raw gap',loss(-8,-1,-8,-1,.7),Math.log(2));
const tilt=(ref,r,b)=>{const raw=ref.map((p,i)=>p*Math.exp(r[i]/b)),z=raw.reduce((a,v)=>a+v,0);return {p:raw.map(v=>v/z),z};};
const ref=[.5,.3,.2], rewards=[1,0,-1], out=tilt(ref,rewards,1);
near('Tilt normalized',out.p.reduce((a,v)=>a+v,0),1);
const shifted=tilt(ref,rewards.map(x=>x+3),1);
out.p.forEach((p,i)=>near(`Prompt-constant invariance ${i}`,p,shifted.p[i]));
const candidate=[.2,.3,.5];
const kl=(p,q)=>p.reduce((s,v,i)=>s+v*Math.log(v/q[i]),0);
near('Exact regularized objective identity',candidate.reduce((s,v,i)=>s+v*rewards[i],0)-kl(candidate,ref),Math.log(out.z)-kl(candidate,out.p));
const softmax=x=>{const v=x.map(Math.exp),s=v.reduce((a,b)=>a+b,0);return v.map(x=>x/s);};
const step=.1;
const displaced=softmax([step,-step,10*step]);
assert.ok(displaced[0]<1/3 && displaced[1]<1/3 && displaced[2]>1/3);
observations.push({name:'Shared-parameter witness: both compared probabilities fall',probabilities:displaced,passed:true});
near('Shared witness log-gap grows',Math.log(displaced[0])-Math.log(displaced[1]),.2);
near('Repeated-label optimum',sigmoid(Math.log(4)),.8);
near('Sum objective margin',.9-1.2,-.3);
near('Mean objective margin changes sign',.9/3-1.2/6,.1);
assert.deepEqual([-100,-100,2,3,-100].slice(1).flatMap((v,i)=>v===-100?[]:[i]),[1,2]);
observations.push({name:'One causal shift selects first response and genuine EOS',predictionRows:[1,2],passed:true});
fs.writeFileSync(`${folder}/design-review-checks.json`,JSON.stringify({reviewer:'root',boundary:'Design calculations only; no new fit or native trainer acceptance',bindings,observations},null,2)+'\n',{flag:'wx'});
fs.writeFileSync(`${folder}/design-review.md`, `# Different complete-design review

Reviewer root, 7 October 2026. **Accepted for complete content preparation** at design \`${bindings[`${folder}/design.md`]}\`. Neither content nor runtime is complete.

Read the entire fifteen-section design, all D01–D26 contracts, seven complete-program contracts, prospective scientific plan and sixteen changed practice contracts, together with the complete research ledger and protected-original assessment. This does not claim another full read of the historical JSX.

The proposed route introduces literal comparative records and model identities before the four scores, relative margin, causal shift and response masks. It then derives the normalizer cancellation and separates coordinate derivatives from actual shared-parameter changes. The three-outcome witness is a useful foundation for likelihood displacement. The reference cache has concrete model, token, mask and row identities rather than an unexplained cache icon. Saved results and free generation remain distinct operations.

Foundational drawings cover real record fields, shared parameter branches, token/logit matrices, stop gradients, probability mass, a complete update and native batch decomposition. Colour follows response identity across policy/reference views; winner selection remains a separate cue. Changed, null, invalid-support and missing-target states are specified. Drawings must still earn acceptance through actual implementation and personal paint review. The manuscript must turn the compressed design shorthand into normally spaced readable prose.

Complementary primary inspection read [DPO sections 3–5 and Appendix A/B passages](https://arxiv.org/html/2305.18290v3), including the chosen-oriented loss and executable loss code. It confirms the need to derive the gradient rather than inherit the inconsistent auxiliary sign in Appendix A.4. Read [current trainer schema and loss discussion](https://huggingface.co/docs/trl/dpo_trainer) and the [likelihood-displacement introduction](https://arxiv.org/html/2410.08847v4). These support the scoped design; no full independent appendix review or benchmark reproduction is claimed.

The attached ${observations.length} complementary conditions check the four-score arithmetic, finite-difference sign, causal shift, reference null, normalized tilt, common reward shift, exact KL identity, shared-mass witness, repeated-label optimum and summed-versus-mean comparison. They are design calculations, not proof of future program correctness.

No material design finding remains. Before fitting, save the concrete protocol with exact filtered memberships, all model/data/program identities, budget, seeds, checkpoint and assessment rules. The planned small from-scratch human-preference run is a mechanism/API study and must retain its stated limitations. Reconcile exact SFT/RLHF prerequisite anchors after their current content is accepted. Native DPOTrainer loss, mask, gradient and cache behavior must be executed before its parity is claimed; no library label-smoothing claim may be inferred from a parameter name. Preserve all outcomes and do not replay fits for later presentation changes.
`,{flag:'wx'});
console.log(`DPO design accepted: ${observations.length} conditions; ${bindings[`${folder}/design.md`]}`);

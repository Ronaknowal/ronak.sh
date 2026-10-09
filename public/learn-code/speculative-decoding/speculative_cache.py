"""Real FP64 decoder speculation using the exact prerequisite cache adapter.

python speculative_cache.py
No training or downloaded checkpoint. The target has three TinyLM blocks and
the draft retains its first block. These random weights test mechanics only.
"""

import copy
import json
import numpy as np
import torch
from torch import nn
from tiny_causal_lm import TinyLM
from cached_decoder import CachedDecoder
from speculative_math import categorical, residual, verify_proposal


class TruncatableDecoder(CachedDecoder):
    def truncate(self, length):
        if not isinstance(length,int) or not 0 <= length <= self.length:
            raise ValueError("Truncation can retain only already computed positions.")
        self.length = length

    def poison_unused(self):
        for keys,values in self.layers:
            keys[:,:,self.length:] = 123.0
            values[:,:,self.length:] = -77.0


def processed(logits, greedy):
    if greedy:
        row = np.zeros(logits.numel(),dtype=np.float64)
        row[int(logits.argmax())] = 1
        return row
    return logits.double().softmax(-1).cpu().numpy()


@torch.inference_mode()
def generate(target, draft, prompt, cap=6, lookahead=3, seed=29,
             greedy=True, eos_id=None, poison=False, observer=None):
    observe = observer or (lambda event: None)
    observe({'event':'cache-call','prompt':prompt,'cap':cap,'lookahead':lookahead,
             'seed':seed,'greedy':greedy,'poison':poison})
    if not prompt or cap < 1 or lookahead < 0:
        raise ValueError("Use a nonempty prompt, positive cap and nonnegative lookahead.")
    if len(prompt)+cap-1 > min(target.context,draft.context):
        raise ValueError("Maximum processed prefix exceeds learned context.")
    if target.token.num_embeddings != draft.token.num_embeddings:
        raise ValueError("Both networks need the same vocabulary.")
    caches = [TruncatableDecoder(model) for model in [target,draft]]
    prefix = list(prompt)
    if poison:
        for cache in caches:
            cache.poison_unused()
    scores = [cache(torch.tensor([prefix]))[0,-1] for cache in caches]
    observe({'event':'prefill-scores','prefix':prefix.copy(),
             'scores':[score.tolist() for score in scores]})
    rng = np.random.default_rng(seed)
    outputs,rounds = [],[]
    while len(outputs)<cap:
        old = len(prefix)
        count = min(lookahead,cap-len(outputs)-1)
        candidates,proposal_rows = [],[]
        draft_last = scores[1]
        for _ in range(count):
            q = processed(draft_last,greedy)
            token = categorical(q,rng.random())
            candidates.append(token)
            proposal_rows.append(q)
            observe({'event':'draft-forward-start','prefix':prefix.copy(),
                     'candidates':candidates.copy(),'q':q.tolist()})
            draft_last = caches[1](torch.tensor([[token]]))[0,-1]
            if token == eos_id:
                break
        target_rows = [scores[0]]
        if candidates:
            observe({'event':'target-chunk-start','prefix':prefix.copy(),'candidates':candidates.copy()})
            target_rows.extend(caches[0](torch.tensor([candidates]))[0].unbind(0))
        observe({'event':'candidate-scores','prefix':prefix.copy(),'candidates':candidates.copy(),
                 'proposal_rows':[row.tolist() for row in proposal_rows],
                 'target_logits':[row.tolist() for row in target_rows]})
        accepted = []
        discarded = []
        selected = None
        source = "bonus"
        for index,(token,q) in enumerate(zip(candidates,proposal_rows)):
            p = processed(target_rows[index],greedy)
            if verify_proposal(p,q,token,rng.random()):
                accepted.append(token)
                if token == eos_id:
                    source = "accepted-eos"
                    break
            else:
                repair = residual(p,q)
                if repair is None:
                    raise ArithmeticError("Rejected an empty correction distribution.")
                selected = categorical(repair,rng.random())
                discarded = candidates[index:]
                source = "repair"
                break
        if source == "bonus":
            selected = categorical(processed(target_rows[len(candidates)],greedy),rng.random())
        emitted = accepted + ([] if selected is None else [selected])
        prefix.extend(emitted)
        outputs.extend(emitted)
        terminal = (emitted[-1] == eos_id) or len(outputs)==cap
        # Keep computed accepted positions. Repair/bonus is pending; for a final
        # accepted EOS, crop its unnecessary record too under our convention.
        keep = len(prefix)-1 if terminal else old+len(accepted)
        for cache in caches:
            cache.truncate(keep)
            if poison:
                cache.poison_unused()
        record = {"old_length":old,"candidates":candidates,"accepted":accepted,
                  "discarded":discarded,"emitted":emitted,"source":source,
                  "retained_computed":keep,"pending":prefix[-1],
                  "score_rows":len(target_rows),"terminal":terminal}
        observe({'event':'committed-round','round':record.copy()})
        if not terminal:
            # Both models now process precisely the committed repair/bonus.
            scores = [cache(torch.tensor([[prefix[-1]]]))[0,-1] for cache in caches]
            for model,actual in zip([target,draft],scores):
                observe({'event':'reference-forward-start','prefix':prefix.copy(),
                         'actual':actual.tolist()})
                expected = model(torch.tensor([prefix]))[0,-1]
                observe({'event':'next-logit-comparison','prefix':prefix.copy(),
                         'actual':actual.tolist(),'reference':expected.tolist()})
                torch.testing.assert_close(actual,expected,atol=1e-12,rtol=1e-12)
            record["next_computed"] = len(prefix)
        rounds.append(record)
        if terminal:
            break
    return {"ids":outputs,"rounds":rounds,"cache_lengths":[c.length for c in caches],
            "stop":"eos" if outputs[-1]==eos_id else "cap"}


@torch.inference_mode()
def verify(observer=None):
    observe = observer or (lambda event: None)
    torch.set_num_threads(2)
    torch.manual_seed(173)
    target = TinyLM(17,context=24,width=16,heads=4,layers=3).double().eval()
    draft = copy.deepcopy(target)
    draft.blocks = nn.Sequential(*list(draft.blocks)[:1])
    prompt = [1,4,7]
    expected = prompt.copy()
    for _ in range(6):
        observe({'event':'baseline-forward-start','prefix':expected.copy()})
        expected.append(int(target(torch.tensor([expected]))[0,-1].argmax()))
        observe({'event':'baseline-selection','ids':expected.copy()})
    records = []
    for lookahead in [0,1,3]:
        for poison in [False,True]:
            result = generate(target,draft,prompt,lookahead=lookahead,poison=poison,observer=observer)
            observe({'event':'greedy-comparison','lookahead':lookahead,'poison':poison,
                     'result':result,'reference':expected[len(prompt):]})
            assert result["ids"]==expected[len(prompt):]
            assert result["cache_lengths"]==[len(prompt)+5]*2
            records.append({"lookahead":lookahead,"poison":poison,"result":result})
    sampled = generate(target,draft,prompt,greedy=False,poison=True,seed=31,observer=observer)
    observe({'event':'sampled-complete','result':sampled})
    # Explicit early/late rollback fixtures: write a candidate chunk, retain
    # zero or two of its rows, append a replacement, then compare all logits.
    rollback = []
    for keep_candidates in [0,2]:
        observe({'event':'rollback-start','accepted':keep_candidates})
        cache = TruncatableDecoder(target)
        cache(torch.tensor([prompt]))
        cache(torch.tensor([[2,5,8]]))
        cache.truncate(len(prompt)+keep_candidates)
        cache.poison_unused()
        actual = cache(torch.tensor([[11]]))[0,-1]
        retained = prompt+[2,5][:keep_candidates]+[11]
        reference = target(torch.tensor([retained]))[0,-1]
        observe({'event':'rollback-comparison','accepted':keep_candidates,'prefix':retained,
                 'actual':actual.tolist(),'reference':reference.tolist(),
                 'cache_length':cache.length,
                 'retained_kv':[[k[:,:,:cache.length].tolist(),v[:,:,:cache.length].tolist()]
                                for k,v in cache.layers]})
        torch.testing.assert_close(actual,reference,atol=1e-12,rtol=1e-12)
        rollback.append({"accepted":keep_candidates,"max_error":float((actual-reference).abs().max())})
    small = TruncatableDecoder(target,capacity=4)
    small.poison_unused()
    small(torch.tensor([prompt]))
    snapshot = [(k.clone(),v.clone()) for k,v in small.layers]
    observe({'event':'capacity-before','length':small.length,
             'kv':[[k.tolist(),v.tolist()] for k,v in snapshot]})
    try:
        small(torch.tensor([[8,9]]))
        observe({'event':'capacity-unexpected-return','length':small.length,
                 'kv':[[k.tolist(),v.tolist()] for k,v in small.layers]})
        raise AssertionError("Expected capacity refusal.")
    except ValueError:
        observe({'event':'capacity-after-refusal','length':small.length,
                 'kv':[[k.tolist(),v.tolist()] for k,v in small.layers]})
        assert small.length==3
        for pair,old in zip(small.layers,snapshot):
            for current,before in zip(pair,old):
                assert torch.equal(current,before)
    return {"passed":True,"scope":"Random FP64 architecture mechanics; no fit.",
            "greedy":records,"sampled":sampled,"rollback":rollback,
            "capacity_atomic":True,"tolerance":{"atol":1e-12,"rtol":1e-12}}


if __name__ == "__main__":
    print(json.dumps(verify(),indent=2))

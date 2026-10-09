"""Inspect every fixed candidate and independently replay saved inference only."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib
import json
import math
import shutil
import sys
import numpy as np
import torch

ROOT=Path(__file__).resolve().parents[1]
CODE=ROOT/'public/learn-code/synthetic-data'
FOLDER=ROOT/'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training'
sys.path.insert(0,str(CODE))
from synthetic_corpus import read_sources,select_candidates,WindowPool
from synthetic_student import grouped_score,inspector,state_hash
from tiny_causal_lm import TinyLM
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
protocol=json.loads((FOLDER/'prospective-protocol.json').read_text(encoding='utf-8'))
for p,h in protocol['bindings'].items():assert sha(ROOT/p)==h,p
freeze=json.loads((FOLDER/'pre-fit-corpus-freeze.json').read_text())
assert sha(CODE/'candidates.json')==freeze['candidates_sha256']
assert sha(CODE/'selection.json')==freeze['selection_sha256']
candidate=json.loads((CODE/'candidates.json').read_text(encoding='utf-8'))
selection=json.loads((CODE/'selection.json').read_text(encoding='utf-8'))
study_path=FOLDER/'student-study/study.json'
study=json.loads(study_path.read_text())
sources=read_sources()['records'];source_by_id={r['id']:r for r in sources}
assert select_candidates(candidate['records'],sources)==selection
# These qualitative annotations were made after reading all34 outputs and their
# actual17 parent records. They do not modify any candidate or selection rule.
plain_notes=[
 'Invents Alice as a schoolteacher and writer; attributes the book description awkwardly to her.',
 'Invents pig/dog claims; omits the daisy-chain and hot-day source context.',
 'Invents an award and departure; changes who observed the pocket/watch.',
 'Invents a zoo; loses the source concern about getting out of the rabbit-hole.',
 'Retains rabbit-hole/deep-well setting, but makes Alice perform the dipping rather than the tunnel.',
 'Confuses cupboards/books/jar contents; loses the empty jar and concern for a person below.',
 'Repetitive generic woman/stairs statements replace Alice anticipating bravery.',
 'Retains a knowledge motif but loses her numerical distance and latitude/longitude thoughts.',
 'Invents threat language and a generic woman; loses the falling-through-Earth question.',
 'Retains Dinah/cat/milk/bat material but repeats and stops mid-sentence at the token cap.',
 'Invents stairs/roof and changes Rabbit actions; reaches length cap.',
 'Contradicts locked doors by saying Alice went through the door.',
 'Adds concrete and a window; loses the successful little-key fit.',
 'Very short summary loses the garden, size obstruction and telescope wish.',
 'Invents a son and confuses the hoped-for rulebook with an existing book.',
 'Conflates the hot poker warning with being a poker player; loses poison-check reasoning.',
 'Extremely broad impression omits the unmarked bottle, tasting and mixed flavors.',
]
audit=[]
for row in candidate['records']:
    index=int(row['source_id'].split('-')[1])
    note=plain_notes[index] if row['style']=='plain' else 'Only a question is supplied; the requested answer is absent. Several questions also introduce unsupported premises; inspect against the retained source.'
    audit.append({'id':row['id'],'source_id':row['source_id'],'text':row['text'],
                  'note':note,'selection':next(r for r in selection['ledger'] if r['id']==row['id'])})
torch.set_num_threads(2)
heldout=[r for r in sources if r['split']=='heldout']
checks=[]
for arm in ['raw','copy','generated']:
    model=TinyLM(256,context=32)
    model.load_state_dict(torch.load(FOLDER/f'student-study/{arm}-seed17.pt',weights_only=True))
    model.eval()
    run=next(r for r in study['fits'] if r['seed']==17 and r['arm']==arm)
    assert state_hash(model)==run['final_weight_sha256']
    actual=grouped_score(model,heldout)
    assert abs(actual['byte_nll']-run['history'][-1]['byte_nll'])<1e-12
    expected=next(r for r in study['inspector'] if r['arm']==arm)['rows']
    assert inspector(model,heldout)==expected
checks.append('All3 seed17 saved models reproduce full heldout scores and48 fixed full256-probability inspector rows; zero updates')
pairs=[]
for seed in [17,29,43]:
    runs={r['arm']:r for r in study['fits'] if r['seed']==seed}
    assert runs['raw']['history']==runs['copy']['history']
    assert runs['raw']['final_weight_sha256']==runs['copy']['final_weight_sha256']
    assert len({r['initial_weight_sha256'] for r in runs.values()})==1
    rng=np.random.default_rng(seed+1000);branches=rng.random((300,16));draws=rng.random((300,16))
    assert int((branches<.5).sum())*32==runs['generated']['generated_targets']
    for arm,run in runs.items():
        assert run['training_targets']==153600
        for checkpoint in run['history']:
            assert checkpoint['targets']==1862
            assert abs(sum(r['nll_sum'] for r in checkpoint['paragraphs'])/1862-checkpoint['byte_nll'])<1e-14
    raw=runs['raw']['history'][-1]['byte_nll'];generated=runs['generated']['history'][-1]['byte_nll']
    pairs.append({'seed':seed,'raw_byte_nll':raw,'generated_byte_nll':generated,
                  'generated_minus_raw':generated-raw,'generated_target_fraction':runs['generated']['generated_targets']/153600})
checks.append('All9 histories, copied null weights, paired initialization,36 evaluation denominators and predeclared sampling exposure reconstructed')
summary={'at':datetime.now(timezone.utc).isoformat(),'records':len(candidate['records']),
 'kept':len(selection['kept']),'rejected':[r for r in selection['ledger'] if not r['accepted']],
 'source_records':17,'heldout_records':4,'heldout_targets':1862,
 'input_truncations':sum(r['input_truncated'] for r in candidate['records']),
 'length_caps':[r['id'] for r in candidate['records'] if r['termination']=='length cap'],
 'generation_seconds_sum':sum(r['elapsed_seconds'] for r in candidate['records']),
 'generator_new_tokens':sum(len(r['output_ids'])-1 for r in candidate['records']),
 'raw_windows':WindowPool([r for r in sources if r['split']=='train']).total,
 'generated_windows':WindowPool(selection['kept']).total,'pairs':pairs,
 'mean_paired_difference':sum(r['generated_minus_raw'] for r in pairs)/3,
 'checks':checks,'manual_audit':audit,
 'limitations':'Descriptive audit of this entire finite set after selection; not a calibrated semantic rate. No candidate or fit changed.'}
with (FOLDER/'outcome-inspection.json').open('x',encoding='utf-8') as stream:json.dump(summary,stream,indent=2,ensure_ascii=False);stream.write('\n')
for name,value in [('study.json',study),('source-records.json',read_sources()),('audit.json',summary)]:
    with (CODE/name).open('x',encoding='utf-8') as stream:json.dump(value,stream,indent=2,ensure_ascii=False);stream.write('\n')
for p,h in protocol['bindings'].items():assert sha(ROOT/p)==h,p
print(json.dumps({k:v for k,v in summary.items() if k!='manual_audit'},indent=2))

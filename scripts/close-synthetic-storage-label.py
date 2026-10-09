"""Bounded descriptive corpus-storage correction; no model generation or fit."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys
ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'docs/teaching/llm-architecture-training/synthetic-data-generation-for-pre-training'
CODE=ROOT/'public/learn-code/synthetic-data'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
protocol=json.loads((FOLDER/'prospective-protocol.json').read_text(encoding='utf-8'))
changed='public/learn-code/synthetic-data/synthetic_recursive.py'
old=FOLDER/'recursive-before-storage-label.py'
assert sha(old)==protocol['bindings'][changed]
for p,h in protocol['bindings'].items():
    if p!=changed:assert sha(ROOT/p)==h,p
spec=importlib.util.spec_from_file_location('recursive_original',old)
original=importlib.util.module_from_spec(spec);spec.loader.exec_module(original)
sys.path.insert(0,str(CODE));import synthetic_recursive as current
comparisons=0
for rule in ['replace','anchor','accumulate','fresh']:
    for n in [10,20,50]:
        for seed in [17,29,43]:
            before=original.trajectory(rule,population=n,seed=seed)
            after=current.trajectory(rule,population=n,seed=seed)
            for a,b in zip(before,after):
                if rule=='anchor' and b['generation']>0:
                    assert a['stored_population']==n and b['stored_population']==2*n
                    a={**a,'stored_population':2*n}
                assert a==b
                comparisons+=1
receipt={'reason':'Fixed-original mixture retains original N records plus latest N generated records, so stored_population is2N; distribution/sample/H dynamics identical.',
         'before':sha(old),'after':sha(CODE/'synthetic_recursive.py'),'compared_states':comparisons,
         'unchanged_prospective_bindings':len(protocol['bindings'])-1,'fits':0,'generations_of_neural_model':0,
         'source':'scripts/close-synthetic-storage-label.py'}
with (FOLDER/'storage-label-continuation.json').open('x',encoding='utf-8') as stream:json.dump(receipt,stream,indent=2)
print(json.dumps(receipt))

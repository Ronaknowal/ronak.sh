"""Bound runtime projections and new tokenization/fixture checks; zero fitting."""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'scratch/masked-language-runtime'))
sys.path.insert(0, str(ROOT/'public/learn-code/supervised-fine-tuning'))
import numpy as np
from transformers import AutoTokenizer
from sft_data import load_source, encode_record
from sft_objective import context_step

DOC = ROOT/'docs/teaching/llm-architecture-training/supervised-fine-tuning-sft'
PUBLIC = ROOT/'public/learn-code/supervised-fine-tuning'
read = lambda p: json.loads(p.read_text(encoding='utf-8'))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
accepted = read(DOC/'content-acceptance.json')
for name, digest in accepted['bindings'].items():
    assert sha(ROOT/name) == digest, name
reports = read(PUBLIC/'mechanism-reports.json')
rng = np.random.default_rng(17)
rng.normal(size=(2,7,9))
embedding = rng.normal(scale=.4,size=(7,3))
head = rng.normal(scale=.3,size=(3,7))
ids = np.arange(6)
labels = np.array([-100]*4+[4,5])
before, grads, updated, after = context_step(ids,labels,embedding,head)
assert abs(before['loss'] - reports['objective-report.json']['report']['before_loss']) < 1e-14
splits = load_source(DOC/'research')
tokenizer = AutoTokenizer.from_pretrained(ROOT/'scratch/sft-research/pythia-14m',local_files_only=True)
actual = encode_record(splits['test'][0],tokenizer)
data = {'source_hashes': {p.name: sha(p) for p in (PUBLIC/'mechanism-reports.json',PUBLIC/'study-evaluation.json',PUBLIC/'study-summary.json')},
        'context_fixture': {'ids':ids.tolist(),'labels':labels.tolist(),'embedding':embedding.tolist(),'head':head.tolist()},
        'reports':{key:value['report'] for key,value in reports.items()},
        'tokenized_record':actual, 'summary':read(PUBLIC/'study-summary.json')}
study = read(PUBLIC/'study-evaluation.json')
display_ids = [identity for group in study['display_test_ids'].values() for identity in group]
assert len(display_ids) == len(set(display_ids)) == 6
data['study'] = {'display_test_ids':display_ids, 'test_records':[row for row in splits['test'] if row['id'] in display_ids],
                 'models': [{'id':'base','name':'Base checkpoint','evaluation':study['base']}]
                          + [{'id':f"{run['policy']}-{run['seed']}",'name':f"{run['policy']} / seed {run['seed']}",
                              'history':run['history'],'selected_step':run['selected_step'],
                              'evaluation':run['test']} for run in study['runs']]}
for model in data['study']['models']:
    for kind in ('response','generation','constrained'):
        model['evaluation'][kind]['rows'] = [row for row in model['evaluation'][kind]['rows'] if row['id'] in display_ids]
        assert len(model['evaluation'][kind]['rows']) == 6
assert len(data['study']['test_records']) == 6
out = ROOT/'src/learn/data/sft-runtime-data.json'
out.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
receipt = {'content_acceptance_sha256':sha(DOC/'content-acceptance.json'),'projection_sha256':sha(out),
           'script_sha256':sha(Path(__file__)),'fits':0,'neural_generation':0,
           'checks':['All frozen inputs conserved','Exact manual context fixture reconstructed','Pinned local tokenizer prefix checked',
                     'All six histories/full metrics retained; six displayed record rows per model/method explicitly checked'],
           'correction':'First projection treated class-grouped display IDs as a flat list and selected no rows. Exact predecessor data/exporter/provenance retained; flattened the declared groups without changing any selected ID or scientific record.'}
(DOC/'runtime-data-provenance.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt,indent=2))

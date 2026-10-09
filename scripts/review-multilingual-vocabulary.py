import hashlib, json, math, sys
from collections import Counter
from pathlib import Path
root=Path.cwd()
assets=root/'public/learn-code/vocabulary-design-multilingual-tokenization'
sys.path[:0]=[str(assets),str(root/'public/learn-code/byte-pair-encoding-bpe-wordpiece-sentencepiece-unigram')]
from vocabulary_audit import sampling_distribution,weighted_word_counts,apportion,audit_documents,parallel_premium
from subword_tokenizers import train_bpe
shares=sampling_distribution({'a':1,'b':0},.5)
counts=weighted_word_counts({'a':['cat'],'b':['dog']},shares)
assert dict(counts)=={'cat':1}
model=train_bpe(counts,2)
assert model.decode(model.encode_word('cat'))=='cat' and 'd' not in model.alphabet
for alpha in [0,.37,1]:
    forward=sampling_distribution({'en':80,'hi':15,'zh':5},alpha)
    reverse=sampling_distribution({'zh':5,'hi':15,'en':80},alpha)
    assert all(math.isclose(forward[k],reverse[k]) for k in forward)
    assert math.isclose(sum(forward.values()),1)
assert apportion({'b':.5,'a':.5},1)=={'b':0,'a':1}
assert parallel_premium([1,9],[1,3])==2.5
assert audit_documents(['','\u732b\u732b'],lambda t:list(t.encode('utf8')))['bytes_per_token']==1
records=json.loads((assets/'flores_tokenizer_sample.json').read_text(encoding='utf8'))
assert len(records)==360
assert Counter((r['split'],r['language']) for r in records)==Counter({(role,lang):n for role,n in [('train',100),('heldout',20)] for lang in ['eng_Latn','hin_Deva','zho_Hans']})
for role,n in [('train',100),('heldout',20)]:
    for lang in ['eng_Latn','hin_Deva','zho_Hans']:
        assert [r['sentence_id'] for r in records if r['split']==role and r['language']==lang]==list(range(1,n+1))
assert {r['source_split'] for r in records if r['split']=='train'}=={'dev'}
assert {r['source_split'] for r in records if r['split']=='heldout'}=={'devtest'}
assert all(r['source_url'].startswith('https://') for r in records)
sha=hashlib.sha256((assets/'flores_tokenizer_sample.json').read_bytes()).hexdigest()
assert sha in (assets/'flores_sample_provenance.md').read_text(encoding='utf8')
receipt=json.loads((root/'docs/teaching/tokenization/vocabulary-design-multilingual-tokenization/native-evidence.json').read_text())
assert len(receipt['sentencepiece']['experiments'])==4
for report in receipt['sentencepiece']['experiments']:
    assert sum(report['corpus_repeats'].values())==30
    assert report['actual_vocabulary']==report['requested_vocabulary']
    for lang,audit in report['audit'].items():
        texts=[r['text'] for r in records if r['split']=='heldout' and r['language']==lang]
        assert audit['tokens']==sum(audit['lengths'])
        assert audit['utf8_bytes']==sum(len(t.encode('utf8')) for t in texts)
        assert audit['codepoints']==sum(len(t) for t in texts)
        assert audit['round_trip'] and audit['unknown_tokens']==0
for path,expected in receipt['sources'].items():
    assert hashlib.sha256((root/path).read_bytes()).hexdigest()==expected,path
print(json.dumps({'independent_complementary_checks':'passed','zero_share_BPE_composition':'passed','apportion_tie':'language-key stable','parallel_ids':360,'source_binding':'all native sources current','data_sha256':sha}))

"""Train controlled SentencePiece BPE designs and audit held-out FLORES text.

Keep vocabulary_audit.py and flores_tokenizer_sample.json beside this file.
Install sentencepiece; run: python multilingual_sentencepiece.py
"""

import io
import json
from pathlib import Path
import sentencepiece as spm
from vocabulary_audit import apportion, audit_documents, parallel_premium, sampling_distribution


def train_design(training, masses, alpha, vocabulary_size):
    shares = sampling_distribution(masses, alpha)
    repeats = apportion(shares, 30)
    lines = (text for language in sorted(training) for _ in range(repeats[language])
             for text in training[language])
    model = io.BytesIO()
    spm.SentencePieceTrainer.train(
        sentence_iterator=lines, model_writer=model, model_type='bpe',
        vocab_size=vocabulary_size, character_coverage=1.0, byte_fallback=True,
        normalization_rule_name='identity', remove_extra_whitespaces=False,
        add_dummy_prefix=False, split_by_whitespace=True, split_by_unicode_script=True,
        split_by_number=True, num_threads=1, shuffle_input_sentence=False,
        input_sentence_size=0, hard_vocab_limit=False, bos_id=-1, eos_id=-1,
        minloglevel=2,
    )
    return spm.SentencePieceProcessor(model_proto=model.getvalue()), shares, repeats


def experiment():
    records = json.loads(Path(__file__).with_name('flores_tokenizer_sample.json').read_text(encoding='utf8'))
    languages = sorted({row['language'] for row in records})
    training = {language: [row['text'] for row in records if row['language'] == language
                           and row['split'] == 'train'] for language in languages}
    heldout = {language: [row['text'] for row in records if row['language'] == language
                          and row['split'] == 'heldout'] for language in languages}
    masses = dict(zip(languages, [80, 15, 5]))
    reports = []
    for alpha in [1.0, 0.5]:
        for size in [1600, 2400]:
            tokenizer, shares, repeats = train_design(training, masses, alpha, size)
            audits = {language: audit_documents(texts, tokenizer.encode, tokenizer.unk_id(),
                                               tokenizer.is_byte) for language, texts in heldout.items()}
            for language, audit in audits.items():
                audit['parallel_token_premium'] = parallel_premium(
                    audit['lengths'], audits['eng_Latn']['lengths'])
                audit['round_trip'] = all(tokenizer.decode(tokenizer.encode(text)) == text
                                          for text in heldout[language])
            reports.append({'alpha': alpha, 'requested_vocabulary': size,
                            'actual_vocabulary': tokenizer.vocab_size(),
                            'target_shares': shares, 'corpus_repeats': repeats, 'audit': audits})
    return {'sentencepiece_version': spm.__version__, 'experiments': reports}


if __name__ == '__main__':
    print(json.dumps(experiment(), ensure_ascii=False, indent=2))

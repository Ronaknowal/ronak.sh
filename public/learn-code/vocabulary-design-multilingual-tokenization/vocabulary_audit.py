"""Corpus weighting and tokenizer diagnostics. Python 3.12, standard library only."""

from collections import Counter
from math import exp, fsum, isfinite, log


def sampling_distribution(counts, alpha):
    """Flatten positive corpus masses in log space; zero-mass languages stay absent."""
    if not 0 <= alpha <= 1 or not counts or any(
        not isfinite(n) or n < 0 for n in counts.values()
    ) or not any(counts.values()):
        raise ValueError("Use nonnegative finite counts with positive total and 0 <= alpha <= 1")
    active = {language: alpha * log(n) for language, n in counts.items() if n > 0}
    peak = max(active.values())
    weights = {language: exp(value - peak) for language, value in active.items()}
    total = fsum(weights.values())
    return {language: weights.get(language, 0.0) / total for language in counts}


def apportion(probabilities, total):
    """Largest remainders: exact integer total, ties resolved by language code."""
    if not isinstance(total, int) or total < 0:
        raise ValueError("total must be a nonnegative integer")
    quotas = {key: total * value for key, value in probabilities.items()}
    result = {key: int(quota) for key, quota in quotas.items()}
    order = sorted(quotas, key=lambda key: (-(quotas[key] - result[key]), key))
    for key in order[:total - sum(result.values())]:
        result[key] += 1
    return result


def audit_documents(texts, encode, unknown_id=None, is_byte=None):
    """Aggregate counts first; encode must exclude automatically added special tokens."""
    tokens = codepoints = utf8_bytes = whitespace_units = unknown = byte_tokens = 0
    lengths = []
    for text in texts:
        ids = encode(text)
        lengths.append(len(ids))
        tokens += len(ids)
        codepoints += len(text)
        utf8_bytes += len(text.encode('utf8'))
        whitespace_units += len(text.split())
        unknown += sum(i == unknown_id for i in ids) if unknown_id is not None else 0
        byte_tokens += sum(is_byte(i) for i in ids) if is_byte is not None else 0
    return {
        'documents': len(lengths), 'tokens': tokens, 'codepoints': codepoints,
        'utf8_bytes': utf8_bytes, 'whitespace_units': whitespace_units,
        'tokens_per_whitespace_unit': tokens / whitespace_units if whitespace_units else None,
        'bytes_per_token': utf8_bytes / tokens if tokens else None,
        'unknown_tokens': unknown, 'byte_tokens': byte_tokens,
        'lengths': lengths,
    }


def parallel_premium(language_lengths, reference_lengths):
    """Ratio of total token counts for matching, nonempty sets of translated units."""
    if len(language_lengths) != len(reference_lengths) or not reference_lengths:
        raise ValueError('Match the same nonempty set of sentence IDs')
    denominator = sum(reference_lengths)
    return sum(language_lengths) / denominator if denominator else None


def weighted_word_counts(corpora, shares):
    """Give each language its declared share of *word occurrences*, not raw size."""
    result = Counter()
    for language, texts in corpora.items():
        share = shares[language]
        if share == 0:
            continue
        counts = Counter(word for text in texts for word in text.split())
        total = sum(counts.values())
        if not total:
            raise ValueError('A positive-share collection must contain word occurrences')
        for word, count in counts.items():
            result[word] += share * count / total
    return result


if __name__ == '__main__':
    import json
    masses = {'en': 80, 'hi': 15, 'zh': 5}
    for alpha in [1.0, 0.5, 0.0]:
        shares = sampling_distribution(masses, alpha)
        print(json.dumps({'alpha': alpha, 'shares': shares, 'draws': apportion(shares, 100)}))

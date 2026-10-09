"""Finite-support unigram references and stable weighted selection.

Install numpy scipy. Run: python -B reference_selection.py
This explicit word model illustrates cross-entropy and density ratios; it is
not DSIR's hashed feature model or a neural language model.
"""
from collections import Counter
import heapq
import json
import math
import random
import re
import unicodedata
from scipy.special import logsumexp

UNK = '<UNK>'


def words(text):
    return re.findall(r"[^\W_]+(?:['’][^\W_]+)*", unicodedata.normalize('NFC', text).casefold())


def fit_reference(texts, vocabulary, alpha=1.):
    if alpha <= 0 or not math.isfinite(alpha) or UNK in vocabulary or len(set(vocabulary)) != len(vocabulary):
        raise ValueError('Positive finite smoothing and unique ordinary-word vocabulary required')
    support = [*vocabulary, UNK]
    known = set(vocabulary)
    counts = Counter(word if word in known else UNK for text in texts for word in words(text))
    denominator = sum(counts.values()) + alpha * len(support)
    return {word: (counts[word] + alpha) / denominator for word in support}


def score(text, reference):
    tokens = words(text)
    if not tokens:
        return {'words': [], 'negative_log_terms': [], 'cross_entropy': None, 'perplexity': None}
    mapped = [word if word in reference else UNK for word in tokens]
    terms = [-math.log(reference[word]) for word in mapped]
    mean = sum(terms) / len(terms)
    return {'words': mapped, 'negative_log_terms': terms, 'cross_entropy': mean, 'perplexity': math.exp(mean)}


def log_ratio(text, target, general):
    if set(target) != set(general):
        raise ValueError('References must have exactly the same support')
    tokens = words(text)
    if not tokens:
        return {'terms': [], 'total_log_ratio': 0., 'mean_log_ratio': None}
    terms = [math.log(target.get(word, target[UNK])) - math.log(general.get(word, general[UNK])) for word in tokens]
    return {'terms': terms, 'total_log_ratio': sum(terms), 'mean_log_ratio': sum(terms) / len(terms)}


def weighted_without_replacement(ids, log_weights, keep, seed=17):
    """Gumbel top-k is an exponential race, without exp(large log weight).

    This is successive probability-proportional-to-remaining-weight sampling.
    It is not k independent draws and marginal inclusion is not k*w/sum(w).
    """
    if len(ids) != len(log_weights) or len(set(ids)) != len(ids):
        raise ValueError('Unique aligned IDs/log weights required')
    if not isinstance(keep, int) or not 0 <= keep <= len(ids) or any(not math.isfinite(w) for w in log_weights):
        raise ValueError('Finite log weights and feasible integer keep required')
    rng = random.Random(seed)
    def keys():
        for identifier, weight in zip(ids, log_weights):
            u = rng.random()
            while u == 0:
                u = rng.random()
            yield weight - math.log(-math.log(u)), identifier
    return [identifier for _, identifier in heapq.nlargest(keep, keys())]


if __name__ == '__main__':
    vocabulary = ['the', 'home', 'pendulum', 'energy']
    general = fit_reference(['the home the home the home energy'], vocabulary)
    target = fit_reference(['pendulum energy pendulum energy energy'], vocabulary)
    texts = ['the the the', 'pendulum energy', 'quaternion energy', '']
    ratios = [log_ratio(text, target, general) for text in texts]
    eligible = [(identifier, item) for identifier, item in zip(['A', 'B', 'C', 'D'], ratios) if item['mean_log_ratio'] is not None]
    log_weights = [item['total_log_ratio'] for _, item in eligible]
    print(json.dumps({'general': general, 'target': target,
                      'candidates': [{'text': text, 'general_score': score(text, general), 'ratio': ratio} for text, ratio in zip(texts, ratios)],
                      'normalized_selection_weights': [math.exp(w - logsumexp(log_weights)) for w in log_weights],
                      'eligible_ids': [identifier for identifier, _ in eligible],
                      'sample': weighted_without_replacement([identifier for identifier, _ in eligible], log_weights, 2)}, indent=2))

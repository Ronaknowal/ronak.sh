"""One predeclared six-fit Retail comparison with two prospective locks.

Run only after all preparation inputs are frozen:
python recommender-retail-study.py --data retail-data --readiness readiness.json --output retail-study
Requires NumPy, SciPy and implicit 0.7.3. Existing output directories are never
reused, including after a failed attempt. No original lesson main is invoked.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import importlib.util
import json
from pathlib import Path
import platform
import sys
import warnings

import numpy as np
from scipy.sparse import csr_matrix


SCORER = 'retail-final-q-fixed-history-v1'
CONVERSION = 'positive-occurrence-c1-plus2n-v1'
CONFIGURATIONS = [(4, .1), (4, 1.), (8, .1), (8, 1.)]
ALPHA, SWEEPS, K = 2., 10, 10
COMPARISON_TOLERANCES = {'absolute': 1e-8, 'relative': 1e-7}


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_json(path, value):
    with Path(path).open('x', encoding='utf-8', newline='\n') as stream:
        json.dump(value, stream, indent=2, allow_nan=False)
        stream.write('\n')


def now():
    return datetime.now(timezone.utc).isoformat()


def array_identity(array):
    array = np.ascontiguousarray(array)
    header = json.dumps({'shape': list(array.shape), 'dtype': array.dtype.str},
                        sort_keys=True, separators=(',', ':')).encode('utf-8')
    return {'shape': list(array.shape), 'dtype': array.dtype.str,
            'sha256': hashlib.sha256(header+b'\n'+array.tobytes()).hexdigest()}


def save_arrays(output, name, arrays):
    """Save full portable arrays and their exact typed-byte identities."""
    arrays = {key: np.ascontiguousarray(value) for key, value in arrays.items()}
    if any(not np.isfinite(value).all() for value in arrays.values()):
        raise FloatingPointError('a saved current array is nonfinite')
    archive = output/f'{name}.npz'
    with archive.open('xb') as stream:
        np.savez_compressed(stream, **arrays)
    portable = output/f'{name}.json'
    write_json(portable, {'arrays': {key: value.tolist() for key, value in arrays.items()},
                          'identities': {key: array_identity(value) for key, value in arrays.items()}})
    return {'npz': archive.name, 'npzSHA256': digest(archive),
            'portable': portable.name, 'portableSHA256': digest(portable),
            'arrays': {key: array_identity(value) for key, value in arrays.items()}}


def validate_counts(counts):
    counts = np.asarray(counts, dtype=np.float64)
    if counts.ndim != 2 or min(counts.shape) < 1 or not np.isfinite(counts).all() or (counts < 0).any():
        raise ValueError('a nonempty finite nonnegative rectangular count matrix is required')
    return counts


def fixed_history_query(counts, final_q, penalty):
    """Read-only inference on final Q, not another training sweep."""
    counts = validate_counts(counts)
    q = np.asarray(final_q, dtype=np.float64)
    if q.ndim != 2 or q.shape[0] != counts.shape[1] or q.shape[1] < 1 or not np.isfinite(q).all():
        raise ValueError('one finite final factor row per item is required')
    if not np.isfinite(penalty) or penalty <= 0:
        raise ValueError('the declared strictly positive once-entity penalty is required')
    base = q.T@q + penalty*np.eye(q.shape[1])
    factors = np.zeros((counts.shape[0], q.shape[1]))
    matrices, rights, residuals = [], [], []
    for user, row in enumerate(counts):
        active = row > 0
        qa = q[active]
        confidence = 1+ALPHA*row[active]
        matrix = base + qa.T@((confidence-1)[:, None]*qa)
        right = qa.T@confidence
        factor = np.linalg.solve(matrix, right)
        factors[user] = factor
        matrices.append(matrix)
        rights.append(right)
        residuals.append(np.max(np.abs(matrix@factor-right)))
    return {'queryP': factors, 'scores': factors@q.T,
            'queryA': np.asarray(matrices), 'queryB': np.asarray(rights),
            'queryResidualInfinity': np.asarray(residuals)}


def full_objective(counts, p, q, penalty):
    confidence, target = 1+ALPHA*counts, (counts > 0).astype(float)
    residual = p@q.T-target
    return float(np.sum(confidence*residual**2) + penalty*(np.sum(p**2)+np.sum(q**2)))


def block_solve(counts, other, penalty):
    """Dense independent equations retain every absent-pair baseline term."""
    factors, residuals = [], []
    for row in counts:
        confidence, target = 1+ALPHA*row, (row > 0).astype(float)
        matrix = other.T@(confidence[:, None]*other)+penalty*np.eye(other.shape[1])
        right = other.T@(confidence*target)
        factor = np.linalg.solve(matrix, right)
        factors.append(factor)
        residuals.append(np.max(np.abs(matrix@factor-right)))
    return np.asarray(factors), float(max(residuals, default=0.))


def stationarity(counts, p, q, penalty):
    weighted = (1+ALPHA*counts)*(p@q.T-(counts > 0))
    return {'userInfinity': float(np.max(np.abs(weighted@q+penalty*p))),
            'itemInfinity': float(np.max(np.abs(weighted.T@p+penalty*q)))}


def initialize(counts, rank):
    return np.zeros((counts.shape[0], rank)), np.random.default_rng(19).normal(0, .01, (counts.shape[1], rank))


def fit_scratch(counts, rank, penalty):
    counts = validate_counts(counts)
    p, q = initialize(counts, rank)
    initial_p, initial_q = p.copy(), q.copy()
    trace = [{'sweep': 0, 'objective': full_objective(counts, p, q, penalty),
              'postItemStationarity': stationarity(counts, p, q, penalty)}]
    snapshots_p, snapshots_q = [p.copy()], [q.copy()]
    for sweep in range(1, SWEEPS+1):
        p, user_residual = block_solve(counts, q, penalty)
        q, item_residual = block_solve(counts.T, p, penalty)
        trace.append({'sweep': sweep, 'objective': full_objective(counts, p, q, penalty),
                      'userResidualAtOwnSolve': user_residual, 'itemResidualAtOwnSolve': item_residual,
                      'postItemStationarity': stationarity(counts, p, q, penalty)})
        snapshots_p.append(p.copy())
        snapshots_q.append(q.copy())
    return {'P': p, 'Q': q, 'initialP': initial_p, 'initialQ': initial_q,
            'sweepP': np.asarray(snapshots_p), 'sweepQ': np.asarray(snapshots_q), 'trace': trace}


def positive_confidence_csr(counts):
    counts = validate_counts(counts)
    users, items = np.nonzero(counts)
    result = csr_matrix((1+ALPHA*counts[users, items], (users, items)), shape=counts.shape)
    result.sum_duplicates()
    result.eliminate_zeros()
    if (result.data == 0).any():
        raise AssertionError('absent cells must not be stored zeros')
    return result


def signed_confidence_csr(values):
    """The separate signed editor has exactly one value per item coordinate."""
    values = np.asarray(values, dtype=float)
    if values.ndim != 2 or min(values.shape) < 1 or not np.isfinite(values).all() or (np.abs(values) > 801).any():
        raise ValueError('finite unique rectangular signed entries in [-801,801] required')
    users, items = np.nonzero(values)
    result = csr_matrix((values[users, items], (users, items)), shape=values.shape)
    result.sum_duplicates()
    result.eliminate_zeros()
    if (result.data == 0).any():
        raise AssertionError('zero editor coordinates must be omitted')
    return result


def baselines(counts):
    binary = (counts > 0).astype(float)
    popularity = counts.sum(axis=0)
    norms = np.sqrt(binary.sum(axis=0))
    denominator = norms[:, None]*norms[None, :]
    similarity = np.divide(binary.T@binary, denominator, out=np.zeros_like(denominator), where=denominator > 0)
    cosine = binary@similarity
    cosine[np.sum(binary, axis=1) == 0] = popularity
    return {'popularity': np.tile(popularity, (len(counts), 1)), 'item-cosine': cosine,
            'popularityState': popularity, 'itemCosineState': similarity}


def ranked_orders(scores, eligible, tie_ranks):
    scores, eligible = np.asarray(scores), np.asarray(eligible, dtype=bool)
    ties = np.asarray(tie_ranks)
    if scores.shape != eligible.shape or ties.shape != (scores.shape[1],) or len(set(ties.tolist())) != len(ties) or not np.isfinite(scores).all():
        raise ValueError('aligned finite scores, eligibility and distinct original lexical tie ranks required')
    result = np.full(scores.shape, -1, dtype=int)
    for user, row in enumerate(scores):
        candidates = np.flatnonzero(eligible[user])
        order = candidates[np.lexsort((ties[candidates], -row[candidates]))]
        result[user, :len(order)] = order
    return result


def metrics(orders, truth, eligible, users, k=K):
    truth, eligible = np.asarray(truth, dtype=bool), np.asarray(eligible, dtype=bool)
    if truth.shape != eligible.shape or orders.shape != truth.shape or len(users) != len(truth) or k < 1:
        raise ValueError('aligned original-row truth/orders/eligibility and positive K required')
    if (truth & ~eligible).any():
        raise ValueError('discovery truth must belong to declared eligible catalogue')
    rows, recommended = [], set()
    for user, order in enumerate(orders):
        candidates = order[order >= 0]
        if len(set(candidates.tolist())) != len(candidates) or set(candidates.tolist()) != set(np.flatnonzero(eligible[user]).tolist()):
            raise ValueError('complete eligible order must contain each permitted ID exactly once')
        slate = candidates[:k]
        hits = truth[user, slate].astype(int)
        relevant = int(truth[user].sum())
        hit_count = int(hits.sum())
        recommended.update(slate.tolist())
        cumulative = np.cumsum(hits)
        discount = 1/np.log2(np.arange(2, len(hits)+2))
        ideal = float(np.sum(1/np.log2(np.arange(2, min(k, relevant)+2)))) if relevant else None
        first = np.flatnonzero(hits)
        rows.append({'userID': users[user], 'truthCount': relevant, 'issued': len(slate),
                     'hits': hit_count, 'precision': hit_count/k, 'fill': len(slate)/k,
                     'recall': hit_count/relevant if relevant else None,
                     'rr': 1/(int(first[0])+1) if relevant and len(first) else (0. if relevant else None),
                     'ap': float(np.sum(hits*cumulative/np.arange(1, len(hits)+1)))/min(k, relevant) if relevant else None,
                     'ndcg': float(hits@discount)/ideal if relevant else None})
    qualified = [row for row in rows if row['truthCount'] > 0]
    macro = {name: float(np.mean([row[name] for row in qualified])) if qualified else None
             for name in ['recall', 'rr', 'ap', 'ndcg']}
    macro.update({name: float(np.mean([row[name] for row in rows])) for name in ['precision', 'fill']})
    return {'K': k, 'allRequests': len(rows), 'qualifiedRequests': len(qualified),
            'undefinedRelevanceRequests': len(rows)-len(qualified),
            'qualifiedUserIDs': [row['userID'] for row in qualified], 'truthPairs': int(truth.sum()),
            'recommendedCatalogueIDs': sorted(recommended), 'catalogueCoverage': len(recommended)/truth.shape[1],
            'macro': macro, 'perUser': rows}


def count_period(events, users, items):
    user_index, item_index = {key: i for i, key in enumerate(users)}, {key: i for i, key in enumerate(items)}
    result = np.zeros((len(users), len(items)))
    for row in events:
        if row['inCatalogue'] == '1':
            result[user_index[row['userID']], item_index[row['itemID']]] += 1
    return result


def past_items(events, users):
    past = {user: set() for user in users}
    for row in events:
        past[row['userID']].add(row['itemID'])
    return past


def discovery_truth(events, prefix_events, users, items):
    past = past_items(prefix_events, users)
    user_index, item_index = {key: i for i, key in enumerate(users)}, {key: i for i, key in enumerate(items)}
    truth = np.zeros((len(users), len(items)), dtype=bool)
    outside = {user: set() for user in users}
    for row in events:
        user, item = row['userID'], row['itemID']
        if item not in past[user]:
            if item in item_index:
                truth[user_index[user], item_index[item]] = True
            else:
                outside[user].add(item)
    return truth, {user: sorted(values) for user, values in outside.items()}


def choose_rule(results):
    """Exact metric ties: popularity, cosine, lower rank, stronger lambda."""
    if any(value['macro']['ndcg'] is None for value in results.values()):
        raise ValueError('no validation-qualified cohort; setting selection is undefined')
    preference = {'popularity': (0, 0, 0), 'item-cosine': (1, 0, 0)}
    for rank, penalty in CONFIGURATIONS:
        preference[f'als-r{rank}-l{penalty:g}'] = (2, rank, -penalty)
    ordered = sorted(results, key=lambda name: (-results[name]['macro']['ndcg'], preference[name]))
    return ordered[0], next(name for name in ordered if name.startswith('als-'))


def bootstrap_difference(first, second, name):
    paired = [(a[name], b[name], a['userID']) for a, b in zip(first['perUser'], second['perUser']) if a[name] is not None]
    if any(a['userID'] != b['userID'] or (a[name] is None) != (b[name] is None)
           for a, b in zip(first['perUser'], second['perUser'])):
        raise ValueError('paired bootstrap requires identical user IDs and null masks')
    if not paired:
        return {'metric': name, 'defined': False, 'mean': None, 'interval': None, 'users': [], 'replicateMeans': []}
    differences = np.array([a-b for a, b, _ in paired])
    indices = np.random.default_rng(71).integers(0, len(differences), (1000, len(differences)))
    means = differences[indices].mean(axis=1)
    return {'metric': name, 'defined': True, 'mean': float(differences.mean()),
            'interval': np.percentile(means, [2.5, 97.5]).tolist(), 'seed': 71, 'replicates': 1000,
            'users': [user for _, _, user in paired], 'perUserDifferences': differences.tolist(),
            'replicateMeans': means.tolist(), 'condition': 'Fixed workflow and train-selected cohort/month; no refits'}


def sampled_eligibility(truth, eligible):
    rng, sampled = np.random.default_rng(83), np.zeros_like(eligible)
    for user in range(len(truth)):
        positive = np.flatnonzero(truth[user])
        other = np.flatnonzero(eligible[user] & ~truth[user])
        chosen = rng.choice(other, min(20, len(other)), replace=False)
        sampled[user, positive], sampled[user, chosen] = True, True
    return sampled


def import_data_module():
    path = Path(__file__).with_name('recommender-retail-data.py')
    spec = importlib.util.spec_from_file_location('new_retail_data', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def validate_readiness(path, data_directory):
    readiness = json.loads(path.read_text(encoding='utf-8'))
    if readiness.get('status') != 'COMPLETE_CONTENT_EXECUTION_INPUTS_READY' or readiness.get('fits') != 6:
        raise ValueError('exact complete readiness record is required before any fit')
    if readiness.get('scorerId') != SCORER or readiness.get('scorerCodeSHA256') != digest(__file__):
        raise ValueError('current scorer bytes differ from declared readiness')
    if readiness.get('manifestSHA256') != digest(data_directory/'retail-manifest.json'):
        raise ValueError('prepared dataset differs from readiness')
    for row in readiness['sources']:
        source = Path(__file__).with_name(row['filename'])
        if digest(source) != row['sha256']:
            raise ValueError(f"declared source differs: {row['filename']}")
    for package, version in readiness['packages'].items():
        if importlib.metadata.version(package) != version:
            raise ValueError(f'ordinary environment differs: {package}')
    if importlib.metadata.version('implicit') != '0.7.3':
        raise ValueError('this ordinary route is specifically implicit 0.7.3')
    for row in readiness['installedPrimarySources']:
        source = Path(importlib.metadata.distribution(row['distribution']).locate_file(row['relativePath']))
        if digest(source) != row['sha256']:
            raise ValueError('installed ordinary implementation differs from readiness')
    return readiness


def prepare_readiness(data_directory, output_path):
    """Create a fresh local identity manifest without a fit or data rewrite.

    A copied historical manifest is evidence of its earlier machine. A new
    local run records its actual downloaded sources and installed package bytes.
    This command never reuses an existing manifest or model output directory.
    """
    sources = sorted(Path(__file__).parent.glob('recommender-*.py'))
    if len(sources) != 10:
        raise ValueError('all ten complete companion source files are required')
    packages = {name: importlib.metadata.version(name) for name in
                ['numpy', 'scipy', 'pandas', 'scikit-surprise', 'implicit', 'openpyxl']}
    if packages['implicit'] != '0.7.3' or packages['scikit-surprise'] != '1.1.5':
        raise ValueError('the taught ordinary route uses implicit 0.7.3 and Surprise 1.1.5')
    distribution = importlib.metadata.distribution('implicit')
    wanted = [file for file in distribution.files if str(file).replace('\\', '/').startswith('implicit/cpu/') and
              (str(file).endswith('als.py') or '/_als.' in str(file).replace('\\', '/'))]
    if not wanted:
        raise ValueError('installed primary ALS implementation files are unavailable')
    record = {'status': 'COMPLETE_CONTENT_EXECUTION_INPUTS_READY', 'at': now(), 'fits': 6,
              'scorerId': SCORER, 'scorerCodeSHA256': digest(__file__),
              'manifestSHA256': digest(data_directory/'retail-manifest.json'),
              'sources': [{'filename': source.name, 'sha256': digest(source)} for source in sources],
              'packages': packages,
              'installedPrimarySources': [{'distribution': 'implicit', 'relativePath': str(file),
                                          'sha256': digest(distribution.locate_file(file))} for file in wanted],
              'configuration': {'orderedSettings': CONFIGURATIONS, 'alpha': ALPHA, 'seed': 19,
                                'sweeps': SWEEPS, 'K': K, 'ordinaryTolerances': COMPARISON_TOLERANCES},
              'scope': 'Fresh local computational identity declaration; not historical execution or statistical acceptance'}
    write_json(output_path, record)
    return record


def fit_ordinary(counts, rank, penalty):
    from implicit.cpu.als import AlternatingLeastSquares
    initial_p, initial_q = initialize(counts, rank)
    model = AlternatingLeastSquares(factors=rank, regularization=penalty, alpha=1.,
                                   dtype=np.float64, use_cg=False, use_native=False,
                                   num_threads=1, iterations=SWEEPS, random_state=19)
    model.user_factors, model.item_factors = initial_p.copy(), initial_q.copy()
    trace, snapshots_p, snapshots_q = [], [], []
    def callback(epoch, elapsed, unused_package_loss):
        trace.append({'sweep': epoch+1, 'objective': full_objective(counts, model.user_factors, model.item_factors, penalty),
                      'postItemStationarity': stationarity(counts, model.user_factors, model.item_factors, penalty)})
        snapshots_p.append(model.user_factors.copy())
        snapshots_q.append(model.item_factors.copy())
    confidence = positive_confidence_csr(counts)
    captured = []
    with warnings.catch_warnings(record=True) as observed:
        warnings.simplefilter('always')
        model.fit(confidence, show_progress=False, callback=callback)
        captured = [str(warning.message) for warning in observed]
    direct = fixed_history_query(counts, model.item_factors, penalty)
    recalculated = model.recalculate_user(np.arange(len(counts)), confidence)
    package_scores = recalculated@model.item_factors.T
    if len(trace) != SWEEPS:
        raise AssertionError('ordinary model did not perform the ten declared updates')
    return {'P': model.user_factors.copy(), 'Q': model.item_factors.copy(),
            'initialP': initial_p, 'initialQ': initial_q, 'sweepP': np.asarray(snapshots_p),
            'sweepQ': np.asarray(snapshots_q), 'trace': trace, 'warnings': captured,
            **direct, 'packageQueryP': recalculated, 'packageQueryScores': package_scores,
            'recalculateDifferenceInfinity': float(np.max(np.abs(package_scores-direct['scores'])))}


def run(data, readiness_path, output):
    readiness = validate_readiness(readiness_path, data)
    output.mkdir(parents=True, exist_ok=False)
    started = {'at': now(), 'programSHA256': digest(__file__), 'readinessSHA256': digest(readiness_path),
               'scorerId': SCORER, 'conversionVersion': CONVERSION, 'fits': 6, 'K': K,
               'configurations': [{'rank': rank, 'lambda': penalty} for rank, penalty in CONFIGURATIONS],
               'seed': 19, 'sweeps': SWEEPS, 'ordinaryTolerance': COMPARISON_TOLERANCES,
               'environment': {'python': sys.version, 'executableSHA256': digest(sys.executable),
                               'platform': platform.platform(), 'packages': readiness['packages']},
               'testEventFileParsed': False}
    write_json(output/'campaign-start.json', started)
    manifest = json.loads((data/'retail-manifest.json').read_text(encoding='utf-8'))
    users, items, ties = manifest['users'], manifest['items'], manifest['itemOriginalLexicalTieRanks']
    if len(users) != 200 or len(items) != 100:
        raise ValueError('the declared fixed training-selected 200x100 cohort is required')
    write_json(output/'ordered-ids.json', {'users': users, 'items': items, 'itemOriginalLexicalTieRanks': ties,
                                         'manifestSHA256': digest(data/'retail-manifest.json')})
    importer = import_data_module()
    def period(role):
        row = manifest['roles'][role]
        return importer.load_period(data/row['file'], row['sha256'], users, items, row['calendar'])
    december = period('train')
    counts = count_period(december, users, items)
    if counts.sum() != 1930 or np.count_nonzero(counts) != 1725:
        raise ValueError('December occurrence/pair protocol differs')
    initial = {'counts': counts, 'confidence': 1+ALPHA*counts, 'target': (counts > 0).astype(int)}
    for rank in [4, 8]:
        p0, q0 = initialize(counts, rank)
        initial[f'initialP_rank{rank}'], initial[f'initialQ_rank{rank}'] = p0, q0
    before_fit = save_arrays(output, 'initial-training-inputs', initial)
    write_json(output/'fit-inputs-before-first-fit.json', {'at': now(), 'source': started,
                                                         'arrays': before_fit, 'orderedIDsSHA256': digest(output/'ordered-ids.json')})
    eligible = counts == 0
    validation_scores, validation_orders, validation_state, fits_done = {}, {}, {}, 0
    base = baselines(counts)
    for name in ['popularity', 'item-cosine']:
        validation_scores[name] = base[name]
        validation_orders[name] = ranked_orders(base[name], eligible, ties)
        validation_state[name] = save_arrays(output, f'validation-{name}',
                                            {'scores': base[name], 'eligibility': eligible, 'orders': validation_orders[name],
                                             'popularityState': base['popularityState'], 'itemCosineState': base['itemCosineState']})
    for rank, penalty in CONFIGURATIONS:
        name = f'als-r{rank}-l{penalty:g}'
        fitted = fit_scratch(counts, rank, penalty)
        fits_done += 1
        query = fixed_history_query(counts, fitted['Q'], penalty)
        order = ranked_orders(query['scores'], eligible, ties)
        validation_scores[name], validation_orders[name] = query['scores'], order
        arrays = {key: value for key, value in fitted.items() if isinstance(value, np.ndarray)}
        arrays.update(query)
        arrays.update({'counts': counts, 'confidence': 1+ALPHA*counts, 'target': (counts > 0).astype(int),
                       'eligibility': eligible, 'orders': order})
        validation_state[name] = save_arrays(output, f'validation-{name}', arrays)
        write_json(output/f'validation-{name}-training.json', {'rank': rank, 'lambda': penalty, 'trace': fitted['trace'],
                                                              'scorerId': SCORER, 'fitsDone': fits_done})
    january = period('validation')
    validation_truth, validation_outside = discovery_truth(january, december, users, items)
    if int(validation_truth.sum()) != 317 or int(np.sum(validation_truth.any(axis=1))) != 68 or sum(map(len, validation_outside.values())) != 1757:
        raise ValueError('January cohort/truth differs from declared feasibility audit')
    validation = {name: metrics(order, validation_truth, eligible, users) for name, order in validation_orders.items()}
    winner, best_als = choose_rule(validation)
    config = next((rank, penalty) for rank, penalty in CONFIGURATIONS if f'als-r{rank}-l{penalty:g}' == best_als)
    truth_record = save_arrays(output, 'validation-truth', {'truth': validation_truth})
    write_json(output/'validation-results.json', {'rules': validation, 'outsideCatalogueTruth': validation_outside,
                                                'truthArray': truth_record, 'all200Requests': True})
    selection_path = output/'selection-lock-before-prefix-and-test.json'
    write_json(selection_path, {'at': now(), 'scorerId': SCORER, 'scorerCodeSHA256': digest(__file__),
                               'conversionVersion': CONVERSION, 'alpha': ALPHA,
                               'countSHA256': array_identity(counts), 'orderedIDsSHA256': digest(output/'ordered-ids.json'),
                               'allSixValidationState': validation_state, 'validation': validation,
                               'bestALS': {'name': best_als, 'rank': config[0], 'lambda': config[1]},
                               'overallWinner': winner, 'tieRule': 'popularity,cosine,lowerRank,strongerLambda',
                               'fitsDone': fits_done, 'prefixRefitStarted': False, 'testEventFileParsed': False})
    january_counts = count_period(january, users, items)
    prefix = counts+january_counts
    if january_counts.sum() != 533 or np.count_nonzero(january_counts) != 497 or prefix.sum() != 2463:
        raise ValueError('prefix count conversion differs')
    prefix_inputs = save_arrays(output, 'prefix-inputs-before-refit',
                                {'counts': prefix, 'confidence': 1+ALPHA*prefix, 'target': (prefix > 0).astype(int),
                                 'initialP': initialize(prefix, config[0])[0], 'initialQ': initialize(prefix, config[0])[1]})
    write_json(output/'prefix-role-before-refit.json', {'selectionLockSHA256': digest(selection_path), 'arrays': prefix_inputs,
                                                      'occurrences': int(prefix.sum()), 'nonzeroPairs': int(np.count_nonzero(prefix)),
                                                      'FebruaryEventsParsed': False})
    fitted = fit_scratch(prefix, *config)
    fits_done += 1
    query = fixed_history_query(prefix, fitted['Q'], config[1])
    test_eligible = prefix == 0
    test_base = baselines(prefix)
    test_scores = {'popularity': test_base['popularity'], 'item-cosine': test_base['item-cosine'], best_als: query['scores']}
    test_orders = {name: ranked_orders(score, test_eligible, ties) for name, score in test_scores.items()}
    prefix_arrays = {key: value for key, value in fitted.items() if isinstance(value, np.ndarray)}
    prefix_arrays.update(query)
    prefix_arrays.update({'counts': prefix, 'confidence': 1+ALPHA*prefix, 'target': (prefix > 0).astype(int),
                          'eligibility': test_eligible, 'orders': test_orders[best_als],
                          'popularityScores': test_scores['popularity'], 'popularityOrders': test_orders['popularity'],
                          'itemCosineScores': test_scores['item-cosine'], 'itemCosineOrders': test_orders['item-cosine'],
                          'popularityState': test_base['popularityState'], 'itemCosineState': test_base['itemCosineState']})
    prefix_saved = save_arrays(output, 'locked-prefix-state', prefix_arrays)
    write_json(output/'prefix-training.json', {'config': {'rank': config[0], 'lambda': config[1]}, 'trace': fitted['trace']})
    prediction_path = output/'prediction-lock-before-test-truth.json'
    write_json(prediction_path, {'at': now(), 'selectionLockSHA256': digest(selection_path), 'scorerId': SCORER,
                                'scorerCodeSHA256': digest(__file__), 'conversionVersion': CONVERSION, 'alpha': ALPHA,
                                'orderedIDsSHA256': digest(output/'ordered-ids.json'), 'chosenConfig': {'rank': config[0], 'lambda': config[1]},
                                'savedArrays': prefix_saved, 'K': K, 'fitsDone': fits_done, 'testEventFileParsed': False})
    ordinary = fit_ordinary(prefix, *config)
    fits_done += 1
    ordinary_arrays = {key: value for key, value in ordinary.items() if isinstance(value, np.ndarray)}
    ordinary_saved = save_arrays(output, 'ordinary-prefix-state', ordinary_arrays)
    differences = {key: float(np.max(np.abs(ordinary[key]-fitted[key]))) for key in ['P', 'Q']}
    differences['queryScores'] = float(np.max(np.abs(ordinary['scores']-query['scores'])))
    differences['packageRecalculateScores'] = ordinary['recalculateDifferenceInfinity']
    agreement = {key: bool(np.allclose(ordinary[key], fitted[key], atol=COMPARISON_TOLERANCES['absolute'],
                                      rtol=COMPARISON_TOLERANCES['relative'])) for key in ['P', 'Q']}
    agreement['directQueryScores'] = bool(np.allclose(ordinary['scores'], query['scores'], **{'atol': 1e-8, 'rtol': 1e-7}))
    agreement['packageRecalculateScores'] = bool(np.allclose(ordinary['packageQueryScores'], ordinary['scores'], atol=1e-8, rtol=1e-7))
    write_json(output/'ordinary-correspondence.json', {'package': 'implicit 0.7.3', 'arrays': ordinary_saved,
                                                      'differencesInfinity': differences, 'tolerances': COMPARISON_TOLERANCES,
                                                      'agreement': agreement, 'trace': ordinary['trace'], 'warnings': ordinary['warnings'],
                                                      'fitsDone': fits_done, 'scoreConvention': SCORER,
                                                      'differencesAreRecordedNotRepairedByRefitting': True})
    # The only February label importer occurs after both immutable locks.
    february = period('test')
    test_truth, test_outside = discovery_truth(february, december+january, users, items)
    if int(test_truth.sum()) != 171 or int(np.sum(test_truth.any(axis=1))) != 48 or sum(map(len, test_outside.values())) != 1185:
        raise ValueError('February cohort/truth differs from declared feasibility audit')
    test_results = {name: metrics(order, test_truth, test_eligible, users) for name, order in test_orders.items()}
    truth_saved = save_arrays(output, 'test-truth-after-lock', {'truth': test_truth})
    comparison = {name: {metric: bootstrap_difference(test_results[name], test_results['popularity'], metric)
                         for metric in ['ndcg', 'recall']} for name in set([winner, best_als])}
    sampled = sampled_eligibility(test_truth, test_eligible)
    sampled_orders = {name: ranked_orders(score, sampled, ties) for name, score in test_scores.items()}
    sampled_metrics = {name: metrics(order, test_truth, sampled, users) for name, order in sampled_orders.items()}
    sampled_arrays = {'eligibility': sampled}
    sampled_arrays.update({f'{name}-orders': order for name, order in sampled_orders.items()})
    sampled_saved = save_arrays(output, 'sampled-candidate-diagnostic', sampled_arrays)
    report = {'question': 'Next-month previously unpurchased products inside the fixed December-selected catalogue/cohort',
              'scorerId': SCORER, 'manifestSHA256': digest(data/'retail-manifest.json'), 'fitsDone': fits_done,
              'validation': validation, 'bestALS': best_als, 'overallWinner': winner,
              'selectionLockSHA256': digest(selection_path), 'predictionLockSHA256': digest(prediction_path),
              'prefixCounts': {'occurrences': int(prefix.sum()), 'nonzeroPairs': int(np.count_nonzero(prefix))},
              'test': test_results, 'truthArray': truth_saved, 'outsideCatalogueTruth': test_outside,
              'pairedUserBootstrap': comparison, 'sampledCandidateDiagnostic': {'seed': 83, 'upToOtherItems': 20,
                                                                             'arrays': sampled_saved, 'metrics': sampled_metrics,
                                                                             'usedForSelection': False},
              'ordinaryAgreement': agreement, 'ordinaryDifferences': differences,
              'savedBrowser': {'state': prefix_saved, 'IDs': 'ordered-ids.json', 'lambda': config[1], 'alpha': ALPHA,
                              'countDomain': [0, max(20., float(prefix.max()))], 'winnerRule': winner,
                              'ALSInspectorRole': 'winner' if winner == best_als else 'measured comparison method'},
              'limits': ['One fixed calendar split and train-selected warm cohort.',
                         'Null relevance requests remain undefined; all 200 requests remain in precision/fill coverage.',
                         'Outside catalogue counts are observed purchase coverage, not ANN recall or causal relevance.',
                         'No known exposure, stock availability, dislike or propensity follows from missing purchases.',
                         'Paired intervals condition on this workflow/cohort/month and do not model temporal/customer dependence.']}
    if fits_done != 6:
        raise AssertionError('the declared model fit budget differs')
    write_json(output/'study-results.json', report)
    write_json(output/'campaign-complete.json', {'at': now(), 'startSHA256': digest(output/'campaign-start.json'),
                                               'reportSHA256': digest(output/'study-results.json'), 'fitsDone': fits_done,
                                               'selectionLockSHA256': digest(selection_path), 'predictionLockSHA256': digest(prediction_path)})
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data', required=True, type=Path)
    parser.add_argument('--readiness', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--prepare-readiness', type=Path,
                        help='Write a new exact local source/environment manifest, without fitting')
    arguments = parser.parse_args()
    if arguments.prepare_readiness:
        if arguments.readiness or arguments.output:
            parser.error('readiness preparation is a separate no-fit operation')
        report = prepare_readiness(arguments.data, arguments.prepare_readiness)
    else:
        if arguments.readiness is None or arguments.output is None:
            parser.error('a study run requires --readiness and a new --output directory')
        report = run(arguments.data, arguments.readiness, arguments.output)
    print(json.dumps(report, indent=2, allow_nan=False))


if __name__ == '__main__':
    main()

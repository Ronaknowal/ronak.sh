"""Bind complete written examples to calculations and observed retained results."""
from hashlib import sha256
import json
import math
from pathlib import Path
import re
import sys
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public/learn-code/data-curation-pipelines'
FOLDER = ROOT / 'docs/teaching/llm-architecture-training/data-curation-pipelines-curator-models-quality-filtering'
sys.path.insert(0, str(PUBLIC))
sys.path.insert(0, str(ROOT / 'public/learn-code/data-curation-deduplication'))
from curation_records import ArticleText
from linear_curator import Features, objective_gradient
from curation_signals import signals, metrics, select, percentile_ranks, combine_curators, stage_work
from reference_selection import fit_reference, score, log_ratio

body = (FOLDER / 'lesson.md').read_text(encoding='utf-8')
results = []
def check(name, condition, value=None):
    assert condition, name
    results.append({'name': name, 'value': value})

urls = re.findall(r'\]\(([^)]+)\)', body)
check('No whitespace in source URLs', all(not re.search(r'\s', url) for url in urls))
check('Copyable UTF-8 command spelling', '-X utf 8' not in body and body.count('-X utf8') == 4)
check('Entire sixteen-section sequence', [int(n) for n in re.findall(r'^## (\d+)\.', body, flags=re.M)] == list(range(1, 17)))
check('Every twenty-one mechanism placement', sorted(re.findall(r'^\[(C\d\d) —', body, flags=re.M)) == [f'C{i:02d}' for i in range(1, 22)])
programs = re.findall(r'^\[Program: ([^]]+)\]', body, flags=re.M)
check('Eight complete program files placed', len(set(programs)) == 8 and all((PUBLIC / name).is_file() for name in programs))
check('Changed twelve-task practice', all(f'{i}. **' in body for i in range(1, 13)))
parser = ArticleText()
parser.feed((PUBLIC / 'article.html').read_text(encoding='utf-8'))
check('Actual reused source parser on authored fixture', parser.text().splitlines() == [
    'Pendulum motion', 'A pendulum exchanges potential and kinetic energy.', 'The period increases with its length.'])

texts = ['energy energy energy motion motion motion motion', 'energy motion', 'sale', 'home']
features = Features.fit(texts)
x = features.transform(texts)[0]
check('Worked DF/IDF produces the actual .6/.8 feature vector', abs(x[features.vocabulary.index('energy')] - .6) < 1e-14 and abs(x[features.vocabulary.index('motion')] - .8) < 1e-14)
probability = 1 / (1 + math.exp(-.18))
check('Readout/probability/residual prose', abs(probability - .544879) < .0000005 and abs(probability - 1 + .455121) < .0000005, probability)
reference = fit_reference(['the home the home the home energy'], ['the', 'home', 'pendulum', 'energy'])
target = fit_reference(['pendulum energy pendulum energy energy'], ['the', 'home', 'pendulum', 'energy'])
observed = score('pendulum energy', reference)
check('Word surprise and perplexity', abs(observed['cross_entropy'] - 2.138333) < .0000005 and abs(observed['perplexity'] - 8.485281) < .0000005, observed)
ratio = log_ratio('pendulum energy', target, reference)
check('Total versus mean ratio', abs(math.exp(ratio['total_log_ratio']) - 8.64) < 1e-13 and abs(math.exp(ratio['mean_log_ratio']) - 2.939388) < .0000005, ratio)

study = json.loads((PUBLIC / 'study.json').read_text())
final = study['selected']['scratch']['final']
check('Observed final confusion and metrics', [final[k] for k in ['tp', 'fp', 'fn', 'tn']] == [16, 55, 12, 341]
      and abs(final['precision'] - .225352) < .0000005 and abs(final['recall'] - .571429) < .0000005
      and abs(final['f1'] - .323232) < .0000005 and abs(final['brier'] - .061299) < .0000005)
check('Actual class prevalence and boundary baseline', abs(110 / 1184 - .092905) < .0000005 and study['selected']['constant']['threshold'] == .9
      and study['selected']['constant']['final']['retained_records'] == 0)
neural = json.loads((PUBLIC / 'neural-result.json').read_text())
check('Released model observed architecture and outputs', neural['architecture']['parameters'] == 109483009 and
      [r['integer_score'] for r in neural['examples']] == [3, 0, 1] and all(abs(row['raw_score'] - expected) < .0000005 for row, expected in zip(neural['examples'], [2.992705, -.250806, 1.176444])))
check('Actual ordinary pipeline decision', json.loads((PUBLIC / 'pipeline-result.json').read_text())['kept'] == ['A', 'D'])
check('Stage cost comparison', stage_work(1000, [1, 10], [.2, .5])['total_work'] == 3000 and stage_work(1000, [10, 1], [.5, .2])['total_work'] == 10500)
check('Ensemble distinct and tied/null cases', combine_curators({'A': 4, 'B': 3, 'C': 2, 'D': 1}, {'A': 2, 'B': 1, 'C': 4, 'D': 3}, .6)['kept'] == ['A', 'B', 'C', 'D']
      and percentile_ranks({'A': 2, 'B': 2, 'C': 1}) == {'C': 0., 'A': .75, 'B': .75}
      and percentile_ranks({'only': 2}) == {'only': .5} and percentile_ranks({}) == {})

a, b = signals('xx\nabcd\nxx\nxx'), signals('zzzz\nabcd\nzzzz\nzzzz')
check('Practice1 changed repetition', a['duplicate_line_incidence'] == b['duplicate_line_incidence'] == .5 and a['duplicate_character_share'] == .4 and b['duplicate_character_share'] == .5)
p2 = fit_reference(['red red alien novel unknown'], ['red', 'blue'])
check('Practice2 changed UNK', p2 == {'red': 3/8, 'blue': 1/8, '<UNK>': 4/8} and score('new spelling', p2)['perplexity'] == 2)
_, dw, db = objective_gradient(np.array([[1., 0.]]), [1], np.array([0., 1.]), 0., .2)
check('Practice3 changed penalized update', np.allclose(np.array([0., 1.]) - .1 * dw, [.05, .98]) and -.1 * db == .05)
check('Practice4 exact tie', [r['id'] for r in select([{'id': 'Z', 'score': .6}, {'id': 'A', 'score': .6}, {'id': 'M', 'score': .4}], keep=1)] == ['A'])
low, high = [metrics([1, 1, 0, 1], [.95, .8, .75, .7], t) for t in [.7, .75]]
check('Practice5 changed nonmonotone precision', low['precision'] == .75 and high['precision'] == 2/3 and high['recall'] == 2/3)
check('Practice7 Brier change', abs(metrics([1, 0], [.8, .4])['brier'] - .1) < 1e-14 and abs(metrics([1, 0], [.64, .16])['brier'] - .0776) < 1e-14)
check('Practice8 strict integer crossover', 1200 + 2 * 66 >= 20 * 66 and 1200 + 2 * 67 < 20 * 67)
check('Practice9 unlike retention mass', 2/4 == .5 and (5 + 50)/100 == .55)
first, second = {'A': 3, 'B': 2, 'C': 1}, {'A': 1, 'B': 3, 'C': 2}
check('Practice10 set operations', combine_curators(first, second, .75)['kept'] == ['A', 'B'] and combine_curators(first, second, .5, 'intersection')['kept'] == ['B'])

# Preserve the exact fitting source and compare its actual function bodies.
import ast
prior = ast.parse((FOLDER / 'study-provenance/curation_signals-at-fit.py').read_text())
current = ast.parse((PUBLIC / 'curation_signals.py').read_text())
functions = lambda tree: {node.name: ast.dump(node, include_attributes=False) for node in tree.body if isinstance(node, ast.FunctionDef)}
old_functions, new_functions = functions(prior), functions(current)
check('All fitted-study helper functions remain exactly unchanged', all(new_functions[name] == tree for name, tree in old_functions.items()))
report = {'passed': True, 'conditions': results, 'manuscript_sha256': sha256(body.encode()).hexdigest(),
          'limits': 'Author correctness/reading check, not different review or runtime/paint acceptance.'}
(FOLDER / 'content-author-checks.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'passed': True, 'conditions': len(results), 'words': len(body.split())}))

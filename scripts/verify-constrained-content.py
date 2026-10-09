"""Independent finite and saved-output checks. Never loads a language model."""
import hashlib
import itertools
import json
import re
import subprocess
import sys
from pathlib import Path

BASE = Path('docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar')
sys.path.insert(0, str(BASE / 'programs'))
from automata import literal, charset, sequence, choice, star, plus, optional, compile_regular, decimal_dfa
from token_index import TokenIndex
from finite_schema import compile_finite_schema, example_schema
from nested_parser import NestedMatcher, recursive_accept
from constrained_loop import decode
from conditioning import compare
from costs import amortization, overlap, mask_storage
from evaluate import assess, strict_json
from fractions import Fraction as F
import numpy as np
from jsonschema import Draft202012Validator

checks = []
def check(name, condition):
    assert condition, name
    checks.append(name)

def rejects(name, callback):
    try:
        callback()
    except (ValueError, TypeError):
        checks.append(name)
    else:
        raise AssertionError(name)

patterns = [
    (sequence(choice(literal('a'), literal('b')), literal('c')), b'(a|b)c'),
    (star(choice(literal('a'), literal('b'))), b'(a|b)*'),
    (sequence(plus(literal('a')), optional(literal('b'))), b'a+b?'),
    (choice(), b'(?!)'),
    (sequence(literal('a'), choice()), b'(?!)'),
]
words = [bytes(w) for n in range(5) for w in itertools.product(b'abc', repeat=n)]
for i, (ast, regex) in enumerate(patterns):
    dfa = compile_regular(ast)
    check(f'AST{i}: {len(words)} complete strings agree with independent re.fullmatch', all(dfa.accepts(w) == bool(re.fullmatch(regex, w)) for w in words))
    index = TokenIndex(dfa, [b'a', b'ab', b'ac', b'b', b'ba', b'a', None])
    for state in [-1, *range(len(dfa.subsets))]:
        check(f'AST{i} state{state}: trie, scan and cached mask agree', index.traverse(state)[0] == index.scan(state) == index.next_tokens(state))
    first = index.next_tokens(0)
    first.clear()
    check(f'AST{i}: caller cannot mutate cached mask', index.next_tokens(0) == index.scan(0))
rejects('empty ordinary token rejected', lambda: TokenIndex(decimal_dfa(), [b'']))
rejects('DFA expansion budget enforced', lambda: compile_regular(literal('abcdef'), max_states=2))
rejects('byte classes reject invalid integer', lambda: charset([256]))

decimal = decimal_dfa()
for s, viable, complete in [('', True, False), ('3', True, True), ('3.', True, False), ('3.2', True, True), ('3x', False, False), ('.3', False, False), ('-3', False, False)]:
    state = decimal.advance(0, s.encode())
    check(f'decimal {s!r}: viability and completion', (state != -1) == viable and (state in decimal.accepting) == complete)
euro = compile_regular(literal('€'))
check('UTF8 partial bytes compose exact euro', euro.advance(euro.advance(0, b'\xe2'), b'\x82\xac') in euro.accepting)
check('UTF8 wrong continuation rejected', euro.advance(0, b'\xe2A') == -1 and euro.advance(0, b'\x82') == -1)

schema = example_schema()
finite = compile_finite_schema(schema)
validator = Draft202012Validator(schema)
for species, number in itertools.product(schema['properties']['species']['enum'], schema['properties']['sepal_cm']['enum']):
    value = {'species': species, 'sepal_cm': number}
    data = json.dumps(value, separators=(',', ':')).encode()
    check(f'finite schema {species}/{number}', finite.accepts(data) and validator.is_valid(value))
reverse = b'{"sepal_cm":5.1,"species":"setosa"}'
check('serialization subset explicit: schema-valid alternative key order excluded', validator.is_valid(json.loads(reverse)) and not finite.accepts(reverse))
for bad in [dict(schema, minProperties=2), dict(schema, additionalProperties=True), dict(schema, required=['species'])]:
    rejects('unsupported schema feature explicit', lambda bad=bad: compile_finite_schema(bad))
escaped = {'type': 'object', 'properties': {'€"': {'type':'string', 'enum':['a"b', '€', '\n']}}, 'required':['€"'], 'additionalProperties':False}
escaped_dfa = compile_finite_schema(escaped)
check('escaped keys/string values/UTF8 canonical forms accepted', all(escaped_dfa.accepts(json.dumps({'€"': v}, ensure_ascii=False, separators=(',', ':')).encode()) for v in escaped['properties']['€"']['enum']))

for n in range(7):
    candidates = [bytes(w) for w in itertools.product(b'[]1,', repeat=n)]
    check(f'nested whole strings length{n}: independent recursive reference', all((lambda m, w: m.accept(w) and m.complete)(NestedMatcher(), w) == recursive_accept(w) for w in candidates))
for text in [b'[2,[3,4]]', b'[[1],2]', b'1']:
    m = NestedMatcher()
    check(f'nested byte sequence {text!r}', all(m.accept(bytes([v])) for v in text) and m.complete)
    check(f'nested EOS+rollback {text!r}', m.accept(None) and m.terminated)
    m.rollback()
    check(f'nested unterminated after EOS rollback {text!r}', m.complete and not m.terminated)
base = NestedMatcher(); base.accept(b'[2,')
left, right = base.fork(), base.fork()
shared = base.top
check('immutable frames initially shared', left.top is shared and right.top is shared)
left.accept(b'['); right.accept(b'3')
check('branching preserves parent identity and other request', left.top.parent is shared and base.top is shared and not right.complete)
before = base.snapshot()
check('invalid multibyte token atomic', not base.accept(b'3x') and base.snapshot() == before)
limited = NestedMatcher(max_depth=1)
check('depth failure atomic', not limited.accept(b'[[') and limited.top is None)
rejects('rollback beyond history rejected', lambda: base.rollback(8))

index = TokenIndex(decimal, [b'abc', b'42', b'7', b'3x', None])
seen = []
def scores(prefix):
    seen.append(prefix)
    return np.log([.5,.25,.125,.0625,.0625] if not prefix else [.01,.01,.01,.01,.96])
result = decode(scores,index,greedy=True)
check('finite loop exact masked probabilities', np.allclose(result['trace'][0]['probabilities_after_mask'], [0,2/3,1/3,0,0]))
check('forced output fed back before EOS', seen == [(), (1,)] and result['ids'] == [1,4] and result['completed'] and result['stop_reason'] == 'eos')
check('cap0 incomplete vs cap1 complete without EOS', not decode(scores,index,cap=0)['completed'] and decode(scores,index,cap=1,greedy=True)['completed'])
check('all excluded support reports failure', decode(lambda _: [0,-np.inf,-np.inf,0,-np.inf], index)['stop_reason'] == 'empty-support')
check('cancel before model callback', decode(lambda _: (_ for _ in ()).throw(AssertionError()), index, canceled=lambda _: True)['stop_reason'] == 'canceled')
rejects('NaN scores fail explicitly', lambda: decode(lambda _: [np.nan]*5,index))
comparison = compare(['1/2','1/2'], ['1/10','9/10'])
check('local vs global terminal law exact', comparison['local_success'] == (F(1,2),F(1,2)) and comparison['global'] == (F(1,10),F(9,10)))
check('zero future probability retains local failure', compare(['1/2','1/2'], ['0','9/10'])['local_failure'] == F(1,2))
check('zero total success leaves conditioning undefined', compare(['1/2','1/2'], ['0','0'])['global'] is None)
check('amortization strict threshold108/11', abs(amortization(10)['strictly_faster_after_requests']-108/11)<1e-12 and amortization(9)['retry_ms']<amortization(9)['constrained_ms'] and amortization(10)['retry_ms']>amortization(10)['constrained_ms'])
check('no retry failure no crossover', amortization(30,failure=0)['strictly_faster_after_requests'] is None)
check('declared critical path and bitmask bytes', overlap(8,3,1)['overlapped_ms']==9 and mask_storage(50304,100)['packed_bits_bytes']==6288)
rejects('strict JSON duplicate key', lambda: strict_json('{"x":1,"x":2}'))
rejects('strict JSON nonfinite constant', lambda: strict_json('NaN'))

study = json.loads((BASE/'research/iris-study/evaluation.json').read_text())
check('all48 executed outputs retained', len(study['rows'])==48 and all(r['n']==12 and r['errors']==0 for r in study['summary']))
expected = {'unconstrained':(0,0,0), 'json_hf':(12,0,0), 'schema_manual':(12,12,0), 'schema_outlines':(12,12,0)}
check('saved actual parse/schema/exact table', all(tuple(r[k] for k in ['parse','schema','exact'])==expected[r['arm']] for r in study['summary']))
out = BASE/'research/finite-checks.json'
files = [*sorted((BASE/'programs').glob('*.py')), Path(__file__).relative_to(Path.cwd())]
out.write_text(json.dumps({'passed':True,'checks':checks,'files':{str(p).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}, 'limits':'Finite enumerations and saved-output evaluation only; no model replay or universal compiler proof.'},indent=2)+'\n')
print(json.dumps({'passed':True,'conditions':len(checks)}))

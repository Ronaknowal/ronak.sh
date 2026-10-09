"""Root's whole prospective review release; does not import study programs."""
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs/teaching/llm-architecture-training/prefix-caching-prompt-caching'
EXPECTED = '2d22ec3c6e80e59a571b40b29a884dc1587cd9bfcca123e02bc4e4ab3b88dc41'
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
packet = BASE / 'program-inputs.json'
assert digest(packet) == EXPECTED
rows = json.loads(packet.read_text(encoding='utf8'))['files']
for row in rows:
    path = ROOT / row['path']
    assert path.stat().st_size == row['bytes'] and digest(path) == row['sha256'], row['path']
programs = list((ROOT / 'public/learn-code/prefix-caching').glob('*.py'))
assert len(programs) == 18
for path in programs:
    ast.parse(path.read_text(encoding='utf8'), filename=str(path))
protocol = json.loads((ROOT / 'public/learn-code/prefix-caching/study-protocol.json').read_text())
assert protocol['tiny']['forward_calls'] == 8 and protocol['native']['forward_calls'] == 10
assert protocol['allocator']['model_forwards'] == 0 and protocol['threads'] == 2
assert sum(n for n in range(1, 17)) == 136
assert 2 * 2 * 1 * 4 * 8 * 4 * 8 == 4096
assert 2 * 2 * 1 * 4 * 20 * 4 * 8 == 10240
assert 2 * 2 * 4 * 4 * 4 == 256
review = BASE / 'program-review-root.md'
body = '''# Different whole prospective program review

Root, 9 October 2026. Accepted for the exact bounded sequence, before execution.

I personally read the complete protocol, all eighteen supplied Python files (including the four unchanged prerequisite copies), the private execution guard, full serialized fixed-input protocol, preparation checks and provider source-check report. I also read all of the installed FullAttentionCacheAllocator, CacheAllocator/BlockLedger and CachePool implementations. No program import, verify function, model forward or native allocator operation was executed during this review.

The complete finite chain is coherent: canonical namespaces and full causal-prefix equality guard digest collisions; matching stops at the first miss and retains a final query; admission plans capacity and protects hits before mutation; active, retained and free ownership remain distinct. Complete-block deduplication and private partial-tail forks preserve identities. Radix splits transfer ancestor pins while retaining active endpoint objects, and eviction removes only inactive leaves. Work counts cover the exact causal rectangle and triangle. Request-hit and token-hit denominators differ explicitly; empty traces are undefined. Decimal equality and strict-saving thresholds are separate, including nonpositive per-hit benefit. The exercise capstone explicitly uses a prefix-only pool with transient final-query storage outside its budget.

The Tiny experiment uses the same untrained two-layer model throughout: three full references, one shared prefill, two copied branches and a fresh edited-prefix/tail pair, exactly eight forwards. The complete all-row reference comparison, unchanged base and weight digests support only these cases. Pythia uses the pinned local checkpoint converted to FP64 before any forward, two fixed prefixes and two fixed tails: two prefills, four full references and four copied-cache tails. Every tail position and vocabulary column is compared at the declared tolerance with a separate top-1 criterion. Deep copies are explicitly materialized storage, not physical sharing. No quality, generation, timing or GPU-speed claim is authorized.

The native supplied-K/V fixture correctly uses the pinned two-trash-sector layout, per-layer shifted backing views, all-layer block tables, implicit single-reference ledger, complete-block hash registration, retained reacquisition and final eviction/sector return. It records actual returned operands and backing addresses; index_select outputs are not used to infer aliasing. Its native digest lacks the scratch index's collision/namespace guarantee and is explicitly qualified. It performs zero model forwards.

I independently verified all48 exact source bindings, parsed all18 Python files without importing them, and checked the declared call and payload arithmetic. The optional provider clients are outside the runner. I checked the current official OpenAI prompt-caching guide's explicit breakpoint/mode and 30m model-qualified contract, and inspected the Google source reference; Google's full signature verification and Claude SDK contract also retain the author's attributed source check. These examples have not sent remote requests. Sources: https://developers.openai.com/api/docs/guides/prompt-caching and https://github.com/googleapis/python-genai/blob/main/google/genai/caches.py.

Each stage is exclusive and ordered. Neural/native completed operations persist tensors before assertions; a finite verify that fails before returning retains its start/source and traceback rather than claiming an unreturned aggregate. Stop at first failure and preserve all evidence; continuation requires a separately reviewed bounded correction. No material program/protocol finding remains. This release authorizes execution only, not finished content, runtime implementation or publication.
'''
with review.open('x', encoding='utf8') as f:
    f.write(body)
release = {'decision': 'accepted', 'reviewer': '/root', 'author': '/root/alignment_author',
           'program_inputs_sha256': EXPECTED, 'review': str(review.relative_to(ROOT)).replace('\\', '/'),
           'review_sha256': digest(review), 'guards': len(rows),
           'budget': {'ordered_stages': ['finite', 'tiny', 'native', 'allocator'], 'runs_per_stage': 1,
                      'tiny_forwards': 8, 'native_forwards': 10, 'allocator_model_forwards': 0,
                      'training': False, 'generation': False, 'timing': False, 'remote_api': False,
                      'stop_on_failure': True}}
with (BASE / 'program-execution-accepted-root.json').open('x', encoding='utf8') as f:
    json.dump(release, f, indent=2)
    f.write('\n')
print(json.dumps({'accepted': True, 'guards': len(rows), 'release_sha256': digest(BASE / 'program-execution-accepted-root.json')}))

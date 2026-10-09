"""Complementary independent check of durable effect identity and rejection."""
import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import sys

sys.dont_write_bytecode = True
root = Path(__file__).resolve().parents[1]
source = root / 'public/learn-code/agent-workflow-frameworks-crewai-autogen-langgraph/durable_workflow.py'
spec = importlib.util.spec_from_file_location('reviewed_workflow', source)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
with TemporaryDirectory(prefix='workflow-identity-review-') as directory:
    store = module.EffectStore(Path(directory) / 'effects.sqlite')
    proposal = {'tool': 'increment_counter', 'amount': 1}
    rejected = 0
    for key in (None, '', '   ', 0, False):
        try:
            store.apply(key, proposal)
        except ValueError:
            rejected += 1
        else:
            raise AssertionError(f'Invalid key {key!r} accepted')
    assert store.value() == 0
    first = store.apply('ticket-1:apply:v1', proposal)
    for _ in range(8):
        assert store.apply('ticket-1:apply:v1', proposal) == first
    assert store.value() == 1
    try:
        store.apply('ticket-1:apply:v1', {**proposal, 'amount': 2})
    except ValueError:
        pass
    else:
        raise AssertionError('Changed proposal accepted')
    assert store.value() == 1
    second = store.apply('ticket-2:apply:v1', {**proposal, 'amount': 2})
    assert second['counter_after'] == store.value() == 3
print(json.dumps({'invalid_keys_rejected': rejected, 'replays': 8, 'changed_payload_rejected': True, 'independent_key_commits': True}))

"""Regression for invalid operation/run identities, including SQLite NULL keys."""
from contextlib import closing
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]
TOPIC = 'agent-workflow-frameworks-crewai-autogen-langgraph'
SOURCE = ROOT / 'public' / 'learn-code' / TOPIC
sys.path.insert(0, str(SOURCE))
from durable_workflow import EffectStore, Workflow

checked = 0
with TemporaryDirectory(prefix='workflow-identity-check-') as directory:
    root = Path(directory)
    effects = EffectStore(root / 'effects.sqlite')
    workflow = Workflow(root / 'runs.sqlite', effects)
    proposal = {'tool': 'increment_counter', 'amount': 1}
    for bad in (None, '', '   ', 7, False):
        for operation in (lambda: effects.apply(bad, proposal),
                          lambda: workflow.advance(bad, approval=True),
                          lambda: workflow.save(bad, {'stage': 'ready'})):
            try:
                operation()
            except ValueError:
                checked += 1
            else:
                raise AssertionError('Invalid identity accepted')
            assert effects.value() == 0
    with closing(sqlite3.connect(root / 'runs.sqlite')) as db:
        assert db.execute('SELECT count(*) FROM runs').fetchone()[0] == 0
    first = effects.apply('ticket-1:apply:v1', proposal)
    assert effects.apply('ticket-1:apply:v1', proposal) == first
    assert effects.value() == 1
paths = [SOURCE / 'durable_workflow.py', Path(__file__)]
record = {'scope': 'Independent-review regression closure: invalid keys/runs reject before mutation; valid key still deduplicates',
          'rejected_cases': checked, 'valid_replay_counter': 1,
          'sources': {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}}
(ROOT/'docs'/'teaching'/'core-frameworks'/TOPIC/'identity-evidence.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record))

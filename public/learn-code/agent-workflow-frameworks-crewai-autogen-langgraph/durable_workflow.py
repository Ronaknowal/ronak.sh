"""Small durable workflow and idempotent local effect. Python 3.12+, standard library."""
from contextlib import closing
import json
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory


def validate_identity(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError('Operation and run identities must be nonempty strings')
    return value


def validate_proposal(proposal):
    if set(proposal) != {'tool', 'amount'} or proposal['tool'] != 'increment_counter':
        raise ValueError('Unknown tool or fields')
    if type(proposal['amount']) is not int or not 1 <= proposal['amount'] <= 5:
        raise ValueError('Counter increment must be an integer from 1 to 5')
    return proposal


class EffectStore:
    """Receipt and counter change share ONE SQLite transaction."""
    def __init__(self, path):
        self.path = str(path)
        with closing(sqlite3.connect(self.path)) as db, db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL);
                INSERT OR IGNORE INTO counter VALUES (1, 0);
                CREATE TABLE IF NOT EXISTS effects (
                    key TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, receipt TEXT NOT NULL);
            ''')

    def apply(self, key, proposal):
        validate_identity(key)
        validate_proposal(proposal)
        payload = json.dumps(proposal, sort_keys=True)
        with closing(sqlite3.connect(self.path)) as db, db:
            db.execute('BEGIN IMMEDIATE')
            existing = db.execute('SELECT payload, receipt FROM effects WHERE key=?', (key,)).fetchone()
            if existing:
                if existing[0] != payload:
                    raise ValueError('An idempotency key cannot identify a different proposal')
                return json.loads(existing[1])
            db.execute('UPDATE counter SET value=value+? WHERE id=1', (proposal['amount'],))
            value = db.execute('SELECT value FROM counter WHERE id=1').fetchone()[0]
            receipt = {'key': key, 'counter_after': value}
            db.execute('INSERT INTO effects VALUES (?, ?, ?)', (key, payload, json.dumps(receipt)))
            return receipt

    def value(self):
        with closing(sqlite3.connect(self.path)) as db, db:
            return db.execute('SELECT value FROM counter WHERE id=1').fetchone()[0]


class Workflow:
    """Sequential single-run coordinator; no concurrent writers for one run ID."""
    def __init__(self, path, effects):
        self.path, self.effects = str(path), effects
        with closing(sqlite3.connect(self.path)) as db, db:
            db.execute('CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY NOT NULL, state TEXT NOT NULL)')

    def save(self, run_id, state):
        validate_identity(run_id)
        with closing(sqlite3.connect(self.path)) as db, db:
            db.execute('INSERT INTO runs VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET state=excluded.state',
                       (run_id, json.dumps(state)))

    def load(self, run_id):
        validate_identity(run_id)
        with closing(sqlite3.connect(self.path)) as db, db:
            row = db.execute('SELECT state FROM runs WHERE id=?', (run_id,)).fetchone()
        return json.loads(row[0]) if row else None

    def advance(self, run_id, approval=None, crash_after_effect=False):
        state = self.load(run_id)
        if state is None:
            # Deterministic proposal: this is an orchestration study, not a fake LLM.
            state = {'stage': 'awaiting_approval', 'proposal': validate_proposal(
                {'tool': 'increment_counter', 'amount': 1})}
            self.save(run_id, state)
        if state['stage'] == 'awaiting_approval':
            if approval is None:
                return state
            if type(approval) is not bool:
                raise ValueError('Approval must be a boolean')
            state['stage'] = 'ready' if approval else 'rejected'
            self.save(run_id, state)
        if state['stage'] == 'ready':
            receipt = self.effects.apply(run_id + ':apply:v1', state['proposal'])
            if crash_after_effect:
                raise RuntimeError('Simulated crash after effect, before workflow checkpoint')
            state = {**state, 'stage': 'complete', 'receipt': receipt}
            self.save(run_id, state)
        return state


def main():
    with TemporaryDirectory(prefix='workflow-lesson-') as directory:
        root = Path(directory)
        effects = EffectStore(root / 'effects.sqlite')
        flow = Workflow(root / 'runs.sqlite', effects)
        assert flow.advance('ticket-1')['stage'] == 'awaiting_approval'
        try:
            flow.advance('ticket-1', approval=True, crash_after_effect=True)
        except RuntimeError:
            pass
        assert effects.value() == 1 and flow.load('ticket-1')['stage'] == 'ready'
        restarted = Workflow(root / 'runs.sqlite', EffectStore(root / 'effects.sqlite'))
        result = restarted.advance('ticket-1')
        assert result['stage'] == 'complete' and effects.value() == 1
        assert restarted.advance('ticket-1') == result
        assert restarted.advance('ticket-2', approval=False)['stage'] == 'rejected'
        assert effects.value() == 1
        print(json.dumps({'recovered': result, 'counter': effects.value()}, indent=2))


if __name__ == '__main__':
    main()

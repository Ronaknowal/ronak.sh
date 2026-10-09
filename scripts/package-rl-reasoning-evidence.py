"""Conserve completed scientific outputs; derive presentation data without refits."""
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT/'public/learn-code/rl-reasoning'
DEST = PUBLIC/'observations'
DEST.mkdir(exist_ok=False)
sources = []
for kind, folder in [('scratch',ROOT/'scratch/rl-reasoning-study'),('native',ROOT/'scratch/rl-reasoning-native')]:
    candidates = list(folder.glob('*.json'))
    if kind == 'scratch':
        candidates += list(folder.glob('seed-*/*history.json'))
    for source in sorted(candidates):
        target = DEST/kind/source.relative_to(folder)
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(source,target)
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        assert hashlib.sha256(target.read_bytes()).hexdigest()==digest
        sources.append(dict(path=target.relative_to(PUBLIC).as_posix(),source=source.relative_to(ROOT).as_posix(),sha256=digest,bytes=target.stat().st_size))
summary = json.loads((DEST/'scratch/summary.json').read_text())
training = []
for seed in [17,29,43]:
    history = json.loads((DEST/f'scratch/seed-{seed}/rl-history.json').read_text())
    training.append(dict(seed=seed,groups=len(history)*8,mixed_groups=sum(r['mixed_groups'] for r in history),
                         mean_reward=sum(r['reward_mean'] for r in history)/len(history),
                         zero_gradient_steps=sum(r['gradient_norm']==0 for r in history),
                         warm=json.loads((DEST/f'scratch/seed-{seed}/warm-history.json').read_text()),
                         rollout_trace=next(r for r in history if r['sample_advantage']!=0)))
native = json.loads((DEST/'native/report.json').read_text())
native_summary=dict(train_attempts=len(native['train_rewards']),train_questions=len(set(r['id'] for r in native['train_rewards'])),
                    train_rewards=sum(r['reward'] for r in native['train_rewards']),
                    test_attempts=len(native['heldout']),test_questions=len(set(r['id'] for r in native['heldout'])),
                    test_rewards=sum(r['reward'] for r in native['heldout']),
                    train_terminated=sum(r['terminated'] for r in native['train_rewards']),
                    test_terminated=sum(r['terminated'] for r in native['heldout']),
                    weights_changed=native['weights_changed'],reload_exact=native['saved_reload_exact'],
                    trainer_seconds=native['train_metrics']['train_runtime'])
with (PUBLIC/'observations.json').open('x',encoding='utf8') as handle:
    json.dump(dict(kind='executed observations, no scientific rerun',summary=summary,training=training,native=native_summary,sources=sources),handle,indent=2)
print(json.dumps(dict(files=len(sources),training=training,native=native_summary),indent=2))

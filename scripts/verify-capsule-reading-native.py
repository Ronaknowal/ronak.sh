"""Replay current frozen weights in Torch; never fit or modify deployed assets."""
from pathlib import Path
import hashlib
import json
import platform
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public/learn-assets/capsule-networks"
sys.path.insert(0, str(ASSETS))
from capsule_learning_import import load_learning
import numpy as np
import torch

learning = load_learning()
torch.set_num_threads(1)
metadata = json.loads((ASSETS / "frozen-model.json").read_text())
raw = (ASSETS / "frozen-model.f32").read_bytes()
assert hashlib.sha256(raw).hexdigest() == metadata["sha256"]
weights = np.frombuffer(raw, dtype="<f4")
model = learning.TinyCapsules().double()
state = {}
for name, parameter in model.state_dict().items():
    entry = metadata["layout"][name]
    values = weights[entry["offset"]:entry["offset"] + entry["length"]]
    state[name] = torch.tensor(values.copy(), dtype=torch.float64).reshape(parameter.shape)
model.load_state_dict(state)
model.eval()
probes, edits = [], []
with torch.no_grad():
    for source in metadata["examples"]:
        image = torch.tensor(source["image"], dtype=torch.float64).reshape(1, 1, 8, 8)
        variants = [("original", image)]
        variants += [(f"shift-{dy}-{dx}", learning.shifted(image, dy, dx))
                     for dy, dx in [(0, 0), (0, 1), (1, 0), (0, -2), (-2, 0), (2, 2)]]
        for value in (0, .5, 1):
            changed = image.clone()
            changed[0, 0, 3, 3] = value
            variants.append((f"pixel-3-3-{value}", changed))
        for name, changed in variants:
            capsules, _ = model.encode(changed, 3)
            lengths = torch.linalg.vector_norm(capsules, dim=-1)
            winner = lengths.argmax(dim=1)
            reconstruction = model.reconstruct(capsules, winner)
            probes.append(dict(source=source["source_id"], name=name,
                               image=changed.flatten().tolist(), capsules=capsules[0].tolist(),
                               lengths=lengths[0].tolist(), predicted=int(winner),
                               reconstruction=reconstruction.flatten().tolist()))
        capsules, _ = model.encode(image, 3)
        winner = torch.linalg.vector_norm(capsules, dim=-1).argmax(dim=1)
        base = model.reconstruct(capsules, winner)
        for coordinate in (0, 7):
            for delta in (-.2, 0, .2):
                outputs = []
                for label in (int(winner), (int(winner) + 1) % 10):
                    changed = capsules.clone()
                    changed[0, label, coordinate] += delta
                    outputs.append(model.reconstruct(changed, winner))
                torch.testing.assert_close(outputs[1], base, atol=0, rtol=0)
                edits.append(dict(source=source["source_id"], coordinate=coordinate,
                                  delta=delta, selected=int(winner), base=base.flatten().tolist(),
                                  edited=outputs[0].flatten().tolist(), null=outputs[1].flatten().tolist()))
files = ["capsule-learning.py", "capsule-mechanics.py", "capsule_learning_import.py",
         "author-checks.py", "frozen-model.json", "frozen-model.f32", "calculated-inputs.json"]
receipt = dict(passed=True, runtime=dict(python=platform.python_version(), numpy=np.__version__,
                                       torch=torch.__version__), probes=probes, edits=edits,
               sourceHashes={str((ASSETS / file).relative_to(ROOT)).replace("\\", "/"):
                             hashlib.sha256((ASSETS / file).read_bytes()).hexdigest() for file in files})
target = ROOT / "docs/teaching/deep-learning-beginner/capsule-networks/reading-flow-native.json"
target.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
print(json.dumps(dict(passed=True, probes=len(probes), decoderEdits=len(edits), runtime=receipt["runtime"])))

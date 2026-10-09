"""Selected NMF read-only preflight and one protected baseline; no science execution."""
from pathlib import Path
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[4]
OWNER = Path(__file__).resolve().parent
ID = "non-negative-matrix-factorization-nmf"


def describe(path):
    raw = path.read_bytes()
    return {"path": path.relative_to(ROOT).as_posix(), "bytes": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest()}


paths = [
    "src/learn/data/topics/"+ID+".jsx",
    "src/learn/data/curriculum/blueprints/"+ID+".js",
    "src/learn/data/nmf-models.js", "src/learn/data/nmf-examples.js", "src/learn/data/nmf-data.js",
    "src/learn/components/lesson-labs/NmfFigures.jsx", "src/learn/components/lesson-labs/NmfLabs.jsx",
    "src/learn/components/lesson-labs/NmfShared.jsx", "src/learn/components/lesson-labs/nmf-labs.css",
    "docs/teaching/topic-notes/"+ID+".md",
    "docs/teaching/evidence/sequential-nmf-review.md",
]
for folder, names in [
    ("docs/teaching/drafts/"+ID, ["lesson.md","visual-specifications.md","design.md","data-provenance.md","calculated-inputs.json","author-calculations.py","digits-300.csv"]),
    ("docs/teaching/evidence", ["nmf-browser.json","nmf-models.json","nmf-data.json","nmf-native.json"]),
    ("public/learn-assets/nmf", ["digits-300.csv","data-provenance.md"]),
    ("scripts", ["verify-nmf-models.mjs","verify-nmf-data.py","verify-nmf-examples.py","verify-nmf-browser.cjs"]),
]:
    paths.extend(folder+"/"+name for name in names)
entries = []
for rel in paths:
    original = ROOT / rel
    copied = OWNER / "preserved" / rel
    copied.parent.mkdir(parents=True, exist_ok=True)
    if not copied.exists():
        shutil.copyfile(original, copied)
    assert original.read_bytes() == copied.read_bytes(), rel
    entries.append({"original": describe(original), "copy": describe(copied)})
ledger_path = ROOT / "docs/teaching/lesson-delivery-progress.json"
row = json.loads(ledger_path.read_text(encoding="utf-8"))["topics"][ID]
row_path = OWNER / "preserved-current-ledger-row.json"
assert not row_path.exists(), "Never replace original selected ledger snapshot"
row_path.write_text(json.dumps(row, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
registry = json.loads((ROOT / "src/learn/data/lesson-manifest.json").read_text(encoding="utf-8"))
packet = {"topic": ID, "mode": "full research/assessment/design only", "preserved": entries,
          "selectedLedger": describe(row_path), "ledgerObservation": describe(ledger_path),
          "preflight": {"existingRegisteredTopic": ID in registry, "historicalRevision": row["revision"],
                        "historicalContent": row["content"]["status"], "historicalImplementation": row["implementation"]["status"],
                        "qualification": "Selected direct preflight; no global inventory rerun (known unrelated RLHF evidence EPERM). Historical completion is not current reading-flow acceptance; Root owns opening/integration."},
          "limits": "No old scientific main/fit/study/checker/browser was executed; files copied once, original identities preserved"}
(OWNER / "source-conservation.json").write_text(json.dumps(packet, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
print(json.dumps({"status":"selected-preflight-and-baseline", "originals":len(entries), **packet["preflight"]}))

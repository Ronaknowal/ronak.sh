"""Bind the proposed design and selected preserved sources; no scientific execution.

Run from the app root: python -B -X utf8 <this file>.
Reads bytes/JSON/CSV and literal source only. Writes this semantic owner's intake
and author handoff. Never imports lesson models, executes examples, fits, builds,
changes central rows or copies datasets/public assets.
"""
from pathlib import Path
import csv
import hashlib
import io
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[5]
OWNER = Path(__file__).resolve().parent
TOPIC = "feature-scaling-encoding-imputation"
BASE = OWNER.parent


def sha(data):
    return hashlib.sha256(data).hexdigest()


def relative(path):
    return str(path.relative_to(ROOT)).replace("\\", "/")


def binding(path, role):
    data = path.read_bytes()
    return {"path": relative(path), "bytes": len(data), "sha256": sha(data), "role": role}


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


conservation = read_json(BASE / "source-conservation.json")
pairs = []
for old in conservation["files"]:
    source, copy = ROOT / old["path"], ROOT / old["copy"]
    source_bytes, copy_bytes = source.read_bytes(), copy.read_bytes()
    assert sha(source_bytes) == old["sha256"]
    assert sha(copy_bytes) == old["copySha256"]
    assert source_bytes == copy_bytes
    pairs.append({**old, "currentMatch": True, "copyMatch": True})

ledger = read_json(ROOT / conservation["ledger"]["path"])
selected = ledger["topics"][TOPIC]
assert selected == conservation["ledger"]["row"]
registry = read_json(ROOT / conservation["registry"]["path"])
# Existing registry schema may hold a map directly or under topics.
registry_topics = registry.get("topics", registry)
assert registry_topics.get(TOPIC) == conservation["registry"]["row"]

partial = read_json(BASE / "partial-checkpoint-packet.json")
example_path = ROOT / "src/learn/data/scaling-examples.js"
examples = json.loads(example_path.read_text(encoding="utf-8").split(
    "export const scalingExamples = ", 1)[1].rstrip().rstrip(";"))
native = read_json(ROOT / "docs/teaching/evidence/scaling-native.json")
programs = []
for key, item in examples.items():
    code_hash, output_hash = sha(item["code"].encode()), sha(item["expected"].encode())
    old = native["programs"][key]
    assert code_hash == old["codeHash"] and output_hash == old["stdoutHash"]
    programs.append({"id": key, "file": item["file"], "codeBytes": len(item["code"].encode()),
                     "codeSha256": code_hash, "stdoutBytes": len(item["expected"].encode()),
                     "stdoutSha256": output_hash, "literalMatchToHistoricalNative": True})
assert len(programs) == 3

csv_path = ROOT / "public/learn-assets/feature-scaling/penguins.csv"
csv_bytes = csv_path.read_bytes()
normalized = csv_bytes.replace(b"\r\n", b"\n")
calc = read_json(ROOT / "docs/teaching/drafts/feature-scaling-encoding-imputation/calculated-inputs.json")
assert sha(normalized) == calc["data_sha256"]
assert len(csv_bytes) == 15586 and len(normalized) == 15241
csv_rows = list(csv.DictReader(io.StringIO(csv_bytes.decode("utf-8"))))
assert len(csv_rows) == 344
data_source = (ROOT / "src/learn/data/scaling-data.js").read_text(encoding="utf-8")
data_literals = {}
for name in ["provenance", "rows", "transformedHeldOut"]:
    match = re.search(r"export const " + name + r" = ", data_source)
    data_literals[name] = json.JSONDecoder().raw_decode(data_source[match.end():].lstrip())[0]
assert data_literals["provenance"]["sha256"] == sha(normalized)
assert data_literals["provenance"]["bytes"] == len(normalized)
assert data_literals["transformedHeldOut"] == calc["scaled_inspection"]["transformed_test"]
assert len(data_literals["rows"]) == 344
for row in data_literals["rows"]:
    raw = csv_rows[row[0]]
    for j, name in enumerate(["bill_length_mm", "bill_depth_mm", "flipper_length_mm", "body_mass_g"]):
        assert row[j + 2] == (None if raw[name] == "NA" else float(raw[name]))

design_names = ["reading-flow-design.md", "visual-and-investigation-contracts.md",
                "programmes-practice-and-resources.md", "research-and-coverage.md", "author-design-review.md"]
texts = {name: (OWNER / name).read_text(encoding="utf-8") for name in design_names}
figures = re.findall(r"^\|(D\d\d) ", texts[design_names[1]], re.M)
labs = re.findall(r"^\|(L\d+[ab]?) ", texts[design_names[1]], re.M)
programme_ids = re.findall(r"^\|(P\d+) `", texts[design_names[2]], re.M)
tasks = re.findall(r"^\|(T\d+) ", texts[design_names[2]], re.M)
assert figures == [f"D{i:02}" for i in range(1, 42)]
assert labs == ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9", "L10",
                "L11a", "L11b", "L12", "L13", "L14a", "L14b"]
assert programme_ids == [f"P{i}" for i in range(1, 17)]
assert tasks == [f"T{i}" for i in range(1, 27)]
for text in texts.values():
    for line in text.splitlines():
        if line.startswith("|"):
            assert line.endswith("|"), line
    assert "design" in text.lower()

guidance_paths = ["AGENTS.md", "README.md", "docs/engineering/REPOSITORY-STRUCTURE.md",
    "skills/lesson-authoring/SKILL.md", "skills/lesson-authoring/references/workflow.md",
    "skills/lesson-authoring/references/topic-design.md", "skills/lesson-authoring/references/teaching.md",
    "skills/lesson-authoring/references/visuals-and-labs.md", "skills/lesson-authoring/references/examples-and-code.md",
    "skills/lesson-authoring/references/practice-and-resources.md",
    "skills/lesson-authoring/references/portfolio-adapter.md",
    "skills/lesson-authoring/references/domain-playbook.md",
    "docs/teaching/classical-ml-reading-flow/visual-vocabulary.md",
    "src/learn/components/lesson-labs/LessonFlow.jsx",
    "docs/teaching/deep-learning-beginner/depthwise-separable-dilated-convolutions/drawings-revision.md",
    "docs/teaching/classical-ml-reading-flow/non-negative-matrix-factorization-nmf/design-completion/reading-flow-design.md",
    "src/learn/data/topics/k-nearest-neighbors-knn.jsx", "src/learn/data/knn-examples.js",
    "src/learn/data/topics/non-negative-matrix-factorization-nmf.jsx",
    "src/learn/data/topics/cross-validation-hyperparameter-tuning.jsx",
    "docs/teaching/topic-notes/README.md"]
intake = {
    "topicId": TOPIC, "author": "/root/tsne_consolidated_content_correction", "recordedOn": "2026-10-09",
    "status": "complete-proposed-design-intake-not-content-or-runtime",
    "reading": {
        "entireCurrent": [x["path"] for x in pairs if x["path"].startswith("src/")],
        "composedCompleteOriginalDrafts": ["design.md", "lesson.md", "visual-specifications.md", "author-calculations.py", "data-provenance.md"],
        "historicalEvidence": "All selected receipt bodies and historical verifier bodies consumed read-only; no execution. Historical numeric JSON fully parsed, selected schema/state/rows consumed and unchanged numerical exports compared without fitting; not a fresh scientific validation.",
        "guidanceScope": "Full versioned skill and applicable teaching/design/visual/code/resource guidance; workflow prior unchanged reading composed with current continuation remainder. Relevant Classical domain section only. Current educational handoff selected active Classical continuation, not a claimed whole global-document reading.",
        "selectedRelatedScope": "KNN section2 and complete units-cosine/scratch-estimator programme literals; NMF opening/nonnegative-domain source and proposed reading-flow design selection; CV opening/sequence. Depthwise actual drawing/flow review record and shared LessonFlow source. No whole neighboring-lesson acceptance.",
        "native": "No actual native windows or remote/reference figure pixels personally viewed; failed external image requests retained in research record. No video watched."
    },
    "protectedPairs": pairs,
    "selectedLedger": {"path": conservation["ledger"]["path"], "row": selected,
                        "rowUnchanged": True, "mutableWholeLedgerNotFrozen": True},
    "selectedRegistry": {"path": conservation["registry"]["path"], "row": None, "unchanged": True},
    "historicalPrograms": programs,
    "csvRoles": {"current": binding(csv_path, "actual current CRLF download bytes, not newly executed input"),
                 "historicalNormalized": {"bytes": len(normalized), "sha256": sha(normalized),
                                          "role": "historical LF execution-input identity matches exact CRLF-to-LF normalization"},
                 "currentProvenanceLiteralMismatch": True,
                 "rowCount": len(csv_rows), "savedTransformedRowsExact": True},
    "guidanceAndRelatedBindings": [binding(ROOT / p, "full or selected actual reading scope described above") for p in guidance_paths],
    "checkpointBindings": [binding(BASE / p, "unchanged preserved predecessor/resume") for p in
                           ["source-conservation.json", "resume-checkpoint.md", "partial-research.md", "partial-checkpoint-packet.json"]],
    "sourceChecks": {"protectedPairs": 30, "literalProgramsAndStreams": 3,
                     "currentCsvVsNormalizedHistorical": True, "savedRowsVsCurrentCsv": 344,
                     "savedTransformedRowEquality": 86, "selectedLedgerAndRegistryUnchanged": True,
                     "designIds": {"drawings": figures, "investigations": labs, "programmes": programme_ids, "tasks": tasks},
                     "notDiagramOrScientificReview": True},
    "preflight": {"command": "node scripts/build-curriculum-inventory.mjs --topic feature-scaling-encoding-imputation --work content",
                  "actualNode": "C:/Users/ronak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe",
                  "sessionId": 96847, "tool": "b2ad4a", "exitCode": 1,
                  "error": "EPERM opening unrelated scratch/rlhf-research/site-packages/trl/trainer/grpo_config.py in global getDeliveryState before selected-topic output",
                  "retry": "One diagnostic continuation captured actual exit; no escalation/shared fix/science execution."},
    "freeBytesObserved": shutil.disk_usage("C:/").free,
    "bindingHarnessHistory": [{"tool": "1e12b6", "exitCode": 1,
        "error": "Initial literal parser split on a semicolon inside a quoted provenance string; JSONDecodeError before any packet write",
        "correction": "Use JSONDecoder.raw_decode at each of the three selected literal exports; no source/scientific change"}],
    "noReplay": ["old fits", "old mains", "scientific campaign", "historical model/browser verifiers", "install", "build", "public copying", "native capture"]
}
(OWNER / "intake-and-source-checks.json").write_text(json.dumps(intake, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
handoff = {
    "topicId": TOPIC, "title": "Feature Scaling, Encoding & Imputation", "classicalPosition": 20,
    "author": "/root/tsne_consolidated_content_correction", "recordedOn": "2026-10-09",
    "status": "complete-proposed-design-awaiting-different-entire-design-review-and-root-release",
    "phaseAuthority": "Root only; selected revision4/history unchanged, no latest revision or competing phase ledger created",
    "files": [binding(OWNER / p, "complete proposed design/research contract") for p in design_names] +
             [binding(OWNER / "intake-and-source-checks.json", "actual selected intake/conservation checks and preflight failure"),
              binding(Path(__file__).resolve(), "reproducible read-only-source binding script; writes this owner only")],
    "scope": {"sections": 11, "historicalFragmentsRetained": True, "outcomes": 10,
              "drawableJobs": 41, "focusedInvestigations": 16, "programmeContracts": 16,
              "retainedWholePrograms": 3, "newCompleteProgrammesProposed": 13, "practiceIdentities": 26,
              "countsDoNotProveTeachingOrNativeQuality": True},
    "implementation": "not-started for this proposed revision; existing publication preserved",
    "computationalVerification": "source/byte/JSON/CSV conservation only; original numerical receipts reused with original roles",
    "browserVisualReview": "not-started for proposal; no new native observations",
    "independentReview": "pending DIFFERENT whole design review",
    "userReview": "not claimed",
    "findingsForContent": ["current CRLF download identity differs from historical LF executed input and stale current provenance literal",
        "legacy Python cross_fit default example valid but alpha0/no-category boundary needs a separately named supported successor",
        "current ruler circle radius clipping and crowded controls need actual full-domain object geometry/focused investigations",
        "old verification scripts encode obsolete gates/counts/LF assertions and cannot be represented as current passes",
        "new fitted nonlinear/basis/conditional/ordinary code routes must be complete, not ownership tables only"],
    "limits": ["Design contracts are not manuscript/programme bodies/solved learner prose or runtime acceptance",
        "Some original paper bodies and remote figure pixels unavailable; exact selected substantive readings/access limits recorded",
        "Current inventory CLI failed on unrelated inaccessible scratch source; direct selected source/row conservation passed",
        "Future R example execution cannot be claimed without an actual available environment/receipt",
        "No claim of observed beginner comprehension or best-possible coverage/diagrams"],
    "nextAction": "Root obtains DIFFERENT entire design review, consolidates findings, then releases/opens a latest revision before substantial manuscript/runtime. Author resumes t-SNE consolidated runtime findings separately; this design stays at its gate."
}
(OWNER / "author-ready-design.json").write_text(json.dumps(handoff, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print(json.dumps({"status": handoff["status"], "protectedPairs": len(pairs), "retainedPrograms": len(programs),
                  "designFiles": len(design_names), "handoff": binding(OWNER / "author-ready-design.json", "design gate")}, ensure_ascii=False))

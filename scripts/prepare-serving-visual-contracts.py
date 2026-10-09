"""Project accepted literal design contracts into the complete content packet."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
topic = root / "docs/teaching/llm-architecture-training/inference-engines-serving"
design = (topic / "design.md").read_text(encoding="utf8")
rows = []
for line in design.splitlines():
    if re.match(r"\| D\d\d \|", line):
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        rows.append({"id": cells[0], "structure": cells[1], "interaction_and_check": cells[2]})
assert len(rows) == 32
sections = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,11,12,12,13,13,13,14,14,15,16]
sources = [
    "request_contract.py", "native_cpu_route.py", "native_cpu_route.py", "capacity_accounting.py",
    "engine_lifecycle.py", "engine_lifecycle.py", "packed_requests.py", "engine_lifecycle.py",
    "capacity_accounting.py", "capacity_accounting.py", "sse_records.py", "sse_records.py",
    "engine_lifecycle.py", "prefix-caching prerequisite; explicit constructed ownership graph",
    "request_metrics.py", "request_metrics.py", "pinned conversion/gptneox.py", "retained native result",
    "engine-recipes.md and engine-evidence.json", "engine_requirements.py",
    "prefix-caching prerequisite", "constrained/speculative prerequisites", "section11 explicit constructed timing",
    "section12 explicit constructed timing", "engine_lifecycle.py and request_metrics.py",
    "compare_traces.py", "request_metrics.py", "compare_traces.py",
    "engine_lifecycle.py", "capacity_accounting.py and engine_lifecycle.py", "engine_requirements.py",
    "engine_lifecycle.py and stream_client.py",
]
defaults = [
    "One client, one engine process and separately drawn weight files; identify repeated request path versus startup load.",
    "Select one actual retained request; cap edits affect a separate constructed output-slot budget, never regenerate recorded text.",
    "Authored A IDs11/12/13 at positions0/1/2 beside separately labelled actual native tokenizer IDs; do not invent special-token counterfactual native IDs.",
    "P3/G3→5cached input rows,3outputs,2decode inputs; G1 removes decode forwards.",
    "A queued/prefill/decode/terminal over exact finite trace; complete graph remains visible at endpoints.",
    "First commit cache3/output21; next consume21 gives cache4/output22; inspect both independent changes.",
    "A3/B4,offsets0/3/7,last2/6,16allowed cells; reverse requests without cross-attention.",
    "A0, B1; pool5 means B3/4, pool6 means B1/2. Logical ticks only.",
    "Block2,A/B3pages each,pool5/6. Hatching identifies reserved but unwritten cells; addresses remain stable.",
    "2×layers×localKVheads×headDim×elementBytes; subtract weights/workspace/reserve before pages. Negative residual is infeasible.",
    "Split C3/A9 in literal é fixture; every split reconstructs same text after sufficient bytes.",
    "LF/CR/CRLF,comment,multidata,terminal,partialEOF,invalidUTF8; show actual parser diagnostic, not fabricated decoded text.",
    "Constructed cancel.45/safe.50; zero delay leaves no residual interval. No actual native cancellation measurement.",
    "A/B→P plusprivateX/Y. CancelA freesX/removesreference, keepsPforB. Zeroactive does not forceeviction.",
    "arrival0/start.1/tokens.3/.5/.7/terminal.8; TTFT.3,TPOT.2,terminal.8; N1 undefined.",
    "Window[0,2),four offers,two completed,one good: fraction.25,goodput.5requests/s. Empty fraction undefined.",
    "Pythia6blocks,width128,heads4,headDim32,MLP512,parallelresidual; QKV[4,3,32,128]→allQ/allK/allV,rotarydim8.",
    "Use source-bound actual prompts/events/output/settings plus retained original conversion failure; no generated evidence.",
    "Each of six named stacks has its own source-supported process boundaries; unknown internals explicitly unknown.",
    "Source-only propositions retain documented basis; exact observed CPU route is a distinct evidence layer.",
    "Alter earlierID/model/tokenizer/adapter/position identity; matching suffix alone cannot preserve descendantKV.",
    "All grammar/candidate/cache frontiers label same prefix positions. Static valid composition, no invented acceptance probability.",
    "20ms prefill+80ms decode; halfeach→50ms total; no independent speedup multiplication.",
    "100msqueue+200mscompute+50msdelivery; each edit0..500 changes only named segment onsharedscale.",
    "Event-derived exact integer count steps; seconds or logical ticks labelled by data origin, never silently interchanged.",
    "Same controls pass; changedcap/cache/precision blocksaggregate withvisiblecause.",
    "Alloffered receipts conserved at cutoff; pending→censored, notgood; missingquality unknown.",
    "Supplied pairedfixturemean difference.1s; syntheticfixture prominently labelled; fournativepointsnever enginecomparison.",
    "deadline<=now expiresbeforeexecution; waitinglimitrejection explicit; noautomaticretry.",
    "Demand7/pool6 refused then2progresses; invalidnonpositivecaps cannot compute pretendreservation.",
    "Exactjointrequirements narrowcandidate set; allunknown/empty valid results; missingevidence notfalseclaim.",
    "A IDs11/12/13→21/22/0,cache5,3pagesreleasedonce; externalreplica boundarydashed.",
]
for row, section, source, default in zip(rows, sections, sources, defaults):
    row.update(section=section, source=source, default_and_boundary=default)
    row["placement"] = "At its exact manuscript D marker, before the concrete walkthrough and equations."
    row["presentation"] = "Keep entire current mechanism/readouts visible; controls below drawing; no reveal gate."
    row["responsive"] = "Stack whole stages where possible. Inherently wide matrices/tables use labelled keyboard-focusable local pan with readable text scale at390 and768/root32."
    row["accessible"] = "Persistent entity labels and prose arithmetic; colour supplemented by text, hatching and selection outline. SVG role/title/description; native labelled inputs."
result = {"status": "complete-content-contracts-not-runtime", "figures": rows,
          "identity_colours": {"A": "cyan", "B": "violet", "C": "rose", "D": "blue", "control": "amber"},
          "legend": "Hue belongs to entity; current state uses dashed edges, hatch, labels or outline. No numeric support heatmap or engine ranking.",
          "runtime_ownership_proposal": {
              "assembly_native_evidence": ["D01", "D02", "D03", "D17", "D18", "D19", "D21", "D22", "D23", "D32"],
              "lifecycle_transport": ["D04", "D05", "D06", "D07", "D08", "D11", "D12", "D13", "D14", "D29"],
              "memory_metrics_decisions": ["D09", "D10", "D15", "D16", "D20", "D24", "D25", "D26", "D27", "D28", "D30", "D31"]},
          "runtime_gate": "No runtime implementation before Root whole complete-content acceptance."}
(topic / "visual-contracts.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
print("32 complete literal content contracts projected")

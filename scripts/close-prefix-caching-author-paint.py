"""Preserve and correct bounded presentation findings; no scientific execution."""
from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parents[1]
topic = root / "docs/teaching/llm-architecture-training/prefix-caching-prompt-caching"
folder = topic / "runtime-author-final-correction"
folder.mkdir(exist_ok=True)
changes = {
    "Foundations": [("M710 55V180H490", "M810 55V180H490")],
    "Storage": [
        ('      label="A private" ', '      label="" '),
        ('      label="B copied" ', '      label="" '),
        ('      x={25} \n      y={230}', '      x={25} \n      y={230}'),
    ],
    "Native": [("Owner labels below are derived", "Owner labels in the drawing are derived")],
    "Policy": [
        ("'All-pinned refusal leaves the entire tree unchanged.'", "' All-pinned refusal leaves the entire tree unchanged.'"),
        ("Live DFS stack follows root", "Current path stack follows root"),
    ],
}
receipt = {"scope": "Presentation only; accepted manuscript, models, programs and observations unchanged", "changes": []}
for name, replacements in changes.items():
    path = root / f"src/learn/components/lesson-labs/PrefixCaching{name}.jsx"
    original = path.read_bytes()
    before = folder / f"PrefixCaching{name}.jsx.before"
    assert not before.exists(), before
    before.write_bytes(original)
    source = original.decode("utf-8")
    for old, new in replacements:
        if old == new:
            continue
        assert source.count(old) == 1, (name, old, source.count(old))
        source = source.replace(old, new)
    if name == "Storage":
        anchor = '    <Node \n      x={25} '
        assert source.count(anchor) == 1
        source = source.replace(anchor, '    <text x="180" y="178" textAnchor="middle" fill="#6daeff">A private</text>\n    <text x="560" y="178" textAnchor="middle" fill="#ff91b4">B copied</text>\n' + anchor)
    path.write_bytes(source.encode("utf-8"))
    receipt["changes"].append({"path": str(path.relative_to(root)), "before": hashlib.sha256(original).hexdigest(), "after": hashlib.sha256(path.read_bytes()).hexdigest()})
receipt["personal_paint_reading"] = {
    "browser-campaign-1791498962829": "All29 native sheets (57 tiles), read before first bounded author correction.",
    "browser-campaign-1791499359276": "All200 native sheets (400 tiles), personally read. Complete phone/enlarged defaults, one changed state per interactive figure and every captured default horizontal continuation.",
    "findings": ["D01 vertical V-combination connector crosses its label; move connector leg right.", "D14 diagonal A-private connector grazes its label; place both branch labels explicitly above their connector paths.", "D21 caption says owner labels below although drawing precedes caption; use in the drawing.", "D23 missing literal space between result and all-pinned sentence.", "D24 path-stack label should describe both DFS and interleaved selections."],
    "pending": "Affected successor paint, remaining control boundaries/changed horizontal continuations, desktop correction21 objects, and delivery paint reading remain; this is not runtime readiness."
}
(folder / "correction.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
print(json.dumps(receipt["changes"], indent=2))

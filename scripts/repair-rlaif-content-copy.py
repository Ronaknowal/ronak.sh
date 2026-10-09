"""Close the independent content-copy finding without scientific reexecution."""

import difflib
import hashlib
import json
from pathlib import Path
import re
import sys
import zipfile


ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
PUBLIC = ROOT / "public/learn/examples/rlaif-methods"
DESTINATION = TOPIC / "content-successor"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def replace_once(text, old, new):
    assert text.count(old) == 1, old
    return text.replace(old, new, 1)


def main():
    resume = "--resume-guard" in sys.argv
    assert DESTINATION.exists() if resume else not DESTINATION.exists()
    assert not (DESTINATION / "inputs.json").exists(), "Preserve an existing frozen successor"
    packet_path = TOPIC / "content-inputs.json"
    packet = json.loads(packet_path.read_text(encoding="utf-8"))
    changed = [TOPIC / "lesson.md", PUBLIC / "FILES.md",
               PUBLIC / "download-manifest.json", PUBLIC / "rlaif-methods-programs.zip"]
    predecessor = DESTINATION / "predecessor"
    checks = []
    for name, expected in packet["inputs"].items():
        path = predecessor / name if resume and ROOT / name in changed else ROOT / name
        assert digest(path) == expected["sha256"], name
        checks.append("predecessor exact: " + name)
    if not resume:
        for path in changed:
            saved = predecessor / path.relative_to(ROOT)
            saved.parent.mkdir(parents=True, exist_ok=True)
            saved.write_bytes(path.read_bytes())
        (predecessor / "content-inputs.json").write_bytes(packet_path.read_bytes())

    manuscript_path = TOPIC / "lesson.md"
    before = (predecessor / manuscript_path.relative_to(ROOT)).read_text(encoding="utf-8")
    manuscript = replace_once(before,
        "occur. The original lesson's sequence scorer made this indexing error. The\ncorrect operation",
        "occur. The correct operation")
    manuscript = replace_once(manuscript,
        "in the manifest. A successful HTTP retrieval and an actual native browser\ndownload are separate delivery checks; the individual files provide a usable\nroute even if a browser cancels an archive download.",
        "in the manifest. If the archive download fails, use the file index to\ndownload the individual programs, dependencies and data files.")
    manuscript = replace_once(manuscript,
        "  appendices explain which source is being replaced. We reviewed the main\n  treatment and relevant appendices; our complete-option/EOS Flan observer\n  is explicitly a local extension of its next-option-token convention.",
        "  appendices explain which source is being replaced and how option-token\n  scores become preferences. The complete-option/EOS Flan observer in this\n  lesson extends the paper's next-option-token convention.")
    if resume:
        assert manuscript_path.read_text(encoding="utf-8") == manuscript
    else:
        manuscript_path.write_text(manuscript, encoding="utf-8")
    file_index = PUBLIC / "FILES.md"
    index_before = (predecessor / file_index.relative_to(ROOT)).read_text(encoding="utf-8")
    index = replace_once(index_before,
        "lengths. Archive HTTP retrieval and a browser's native download event are separate delivery checks; individual files remain directly accessible.",
        "lengths. If the archive download fails, use the links above to download the individual programs, dependencies and data files.")
    if resume:
        assert file_index.read_text(encoding="utf-8") == index
    else:
        file_index.write_text(index, encoding="utf-8")

    manifest_path = PUBLIC / "download-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for entry in manifest["files"]:
        path = PUBLIC / entry["path"]
        if path == file_index:
            entry.update(sha256=digest(path), bytes=path.stat().st_size)
        else:
            assert digest(path) == entry["sha256"]
            checks.append("unchanged bundle payload: " + entry["path"])
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    archive = PUBLIC / "rlaif-methods-programs.zip"
    payloads = [PUBLIC / entry["path"] for entry in manifest["files"]] + [manifest_path]
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
        for path in payloads:
            info = zipfile.ZipInfo(path.relative_to(PUBLIC).as_posix(), date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            bundle.writestr(info, path.read_bytes())
    with zipfile.ZipFile(archive) as bundle:
        assert len(bundle.namelist()) == len(payloads)
        for path in payloads:
            assert bundle.read(path.relative_to(PUBLIC).as_posix()) == path.read_bytes()
            checks.append("exact successor archive: " + path.name)

    # All educational mathematics, programs, drawings and exercises are conserved.
    for pattern, name in [(r"\$\$.*?\$\$", "display mathematics"),
                          (r"`[^`\n]+`", "inline code and numeric notation"),
                          (r"```.*?```", "all complete fenced programs and commands"),
                          (r"<!--.*?-->", "all drawing and program specifications"),
                          (r"## 13\..*?(?=## 14\.)", "all fourteen practice tasks and solutions")]:
        assert re.findall(pattern, before, flags=re.S) == re.findall(pattern, manuscript, flags=re.S), name
        checks.append("conserved " + name)
    actual_changed = []
    for name, expected in packet["inputs"].items():
        if digest(ROOT / name) != expected["sha256"]:
            actual_changed.append(name)
        else:
            checks.append("conserved accepted content: " + name)
    assert set(actual_changed) == {path.relative_to(ROOT).as_posix() for path in changed}
    (DESTINATION / "copy.diff").write_text(
        "".join(difflib.unified_diff(before.splitlines(keepends=True), manuscript.splitlines(keepends=True),
                                     fromfile="predecessor/lesson.md", tofile="current/lesson.md")) +
        "".join(difflib.unified_diff(index_before.splitlines(keepends=True), index.splitlines(keepends=True),
                                     fromfile="predecessor/FILES.md", tofile="current/FILES.md")), encoding="utf-8")
    report = {"status": "passed", "passed": len(checks), "scope": "R1 copy-only correction",
              "scientific_reexecution": False, "predecessor_packet_sha256": digest(packet_path),
              "changed": [{"path": path.relative_to(ROOT).as_posix(),
                           "before_sha256": packet["inputs"][path.relative_to(ROOT).as_posix()]["sha256"],
                           "after_sha256": digest(path), "bytes": path.stat().st_size} for path in changed],
              "checks": checks}
    report_path = DESTINATION / "checks.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    paths = [ROOT / name for name in packet["inputs"]] + list(DESTINATION.rglob("*"))
    paths += [Path(__file__).resolve(), TOPIC / "content-review.md",
              TOPIC / "content-review-packet.json", TOPIC / "content-root-checks.json", packet_path]
    paths = sorted(set(path for path in paths if path.is_file()))
    successor = {"kind": "copy-only content successor; same independent reviewer closure required",
                 "topic_id": packet["topic_id"], "predecessor_sha256": digest(packet_path),
                 "scientific_freeze_sha256": packet["scientific_freeze_sha256"],
                 "manuscript": {"path": manuscript_path.relative_to(ROOT).as_posix(),
                                "sha256": digest(manuscript_path), "bytes": manuscript_path.stat().st_size},
                 "changed": report["changed"], "scientific_reexecution": False,
                 "inputs": {path.relative_to(ROOT).as_posix(): {"sha256": digest(path), "bytes": path.stat().st_size}
                            for path in paths}}
    successor_path = DESTINATION / "inputs.json"
    successor_path.write_text(json.dumps(successor, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"successor_sha256": digest(successor_path), "files": len(paths),
                      "passed": len(checks), "manuscript": successor["manuscript"],
                      "changed": report["changed"]}, indent=2))


if __name__ == "__main__":
    main()

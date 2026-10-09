"""Copy immutable PRM study assets and bind a reproducible learner archive."""

import hashlib
import json
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/teaching/llm-architecture-training/process-reward-models-prm-vs-outcome-reward-models-orm"
PUBLIC = ROOT / "public/learn-code/process-reward-models"


def copy_exact(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() and destination.read_bytes() != source.read_bytes():
        raise ValueError(f"Preserve existing different asset: {destination}")
    shutil.copyfile(source, destination)


def main():
    frozen = json.loads((BASE / "study/prospective-inputs.json").read_text())
    for relative, info in frozen["files"].items():
        if hashlib.sha256((ROOT / relative).read_bytes()).hexdigest() != info["sha256"]:
            raise ValueError(f"Changed prospective source: {relative}")
    for name in ("train.jsonl", "validation.jsonl", "test.jsonl", "extraction.json"):
        copy_exact(BASE / "study/data" / name, PUBLIC / "data" / name)
    for name in ("model.json", "predictions.json", "results.json", "prospective-inputs.json"):
        copy_exact(BASE / "study" / name, PUBLIC / "study" / name)
    copy_exact(BASE / "study-protocol.md", PUBLIC / "study-protocol.md")
    primary = BASE / "research/primary"
    copy_exact(primary / "prm800k-LICENSE", PUBLIC / "PRM800K-LICENSE.txt")
    provenance = {"dataset": "openai/prm800k", "commit": "7ecc794703b2877f63226f2477a49b34f9b25163",
                  "scope": "Bounded HTTP206 convenience prefixes; complete records, not full upstream files",
                  "license": "MIT; actual retained notice in PRM800K-LICENSE.txt", "files": {}}
    for split in ("train", "test"):
        source = primary / f"prm800k-phase2_{split}.jsonl.prefix"
        name = f"phase2_{split}.jsonl.prefix"
        copy_exact(source, PUBLIC / "sources" / name)
        provenance["files"][name] = {"sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                                      "bytes": source.stat().st_size}
    (PUBLIC / "sources/provenance.json").write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf8")
    files = sorted(p for p in PUBLIC.rglob("*") if p.is_file() and
                   p.suffix != ".zip" and p.name != "download-manifest.json" and "__pycache__" not in p.parts)
    manifest = {"files": {str(p.relative_to(PUBLIC)).replace("\\", "/"):
                          {"sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "bytes": p.stat().st_size}
                          for p in files}, "programs": 7,
                "scope": "Exact complete sources, licensed retained data and measured outputs"}
    manifest_path = PUBLIC / "download-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf8")
    archive = PUBLIC / "prm-programs-data.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for path in [*files, manifest_path]:
            name = str(path.relative_to(PUBLIC)).replace("\\", "/")
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 7, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            bundle.writestr(info, path.read_bytes())
    print(json.dumps({"files": len(files) + 1, "zip_bytes": archive.stat().st_size,
                      "zip_sha256": hashlib.sha256(archive.read_bytes()).hexdigest()}, indent=2))


if __name__ == "__main__":
    main()

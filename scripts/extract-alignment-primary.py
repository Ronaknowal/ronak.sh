"""Extract retained PDF text with explicit page boundaries for scoped reading."""
from pathlib import Path
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
primary = root / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods/research/primary"
for name in ("ipo-aistats-2024", "orpo-emnlp-2024"):
    target = primary / (name + ".txt")
    if target.exists():
        raise RuntimeError(f"Preserve extracted bytes: {target}")
    pages = PdfReader(primary / (name + ".pdf")).pages
    text = "\n\n".join(f"=== PDF PAGE {number + 1} ===\n{page.extract_text()}" for number, page in enumerate(pages))
    target.write_text(text + "\n", encoding="utf-8")
    print(name, len(pages), len(text), len(text.splitlines()))

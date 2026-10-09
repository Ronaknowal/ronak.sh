"""Retain a second canonical treatment and exact public implementation sources.

This is source retrieval only: it does not execute downloaded code or run models.
Existing retrieval receipts are preserved rather than refreshed in place.
"""

from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards/research/implementation"


def fetch(url):
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 lesson source research"})
    with urlopen(request, timeout=50) as response:
        return response.read(), response.url, response.status


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.hidden = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style"}:
            self.hidden += 1
        if tag in {"p", "div", "pre", "section", "li", "h1", "h2", "h3", "h4"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"script", "style"}:
            self.hidden -= 1
        if tag in {"p", "div", "pre", "section", "li", "h1", "h2", "h3", "h4"}:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.hidden:
            self.parts.append(data)


def retain(name, url, *, html=False):
    data, final_url, status = fetch(url)
    path = DESTINATION / name
    if path.exists():
        raise ValueError(f"Preserve previously retrieved source: {path}")
    path.write_bytes(data)
    result = {"path": str(path.relative_to(ROOT)).replace("\\", "/"),
              "url": url, "final_url": final_url, "status": status,
              "retrieved_at": datetime.now(timezone.utc).isoformat(),
              "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data),
              "reading_scope": "retrieved; not yet technically read"}
    if html:
        parser = PlainText()
        parser.feed(data.decode("utf-8"))
        text = "\n".join(line for raw in "".join(parser.parts).splitlines()
                         if (line := " ".join(raw.split()))) + "\n"
        text_path = path.with_suffix(".txt")
        text_path.write_text(text, encoding="utf-8")
        result["text_sha256"] = hashlib.sha256(text_path.read_bytes()).hexdigest()
    print(name, status, len(data), flush=True)
    return result


def main():
    receipt = DESTINATION / "retrieval.json"
    if receipt.exists():
        raise ValueError("Declare a named successor; do not overwrite retrieval")
    DESTINATION.mkdir(parents=True, exist_ok=True)
    records = [retain("spinning-up-policy-gradient.html",
                      "https://spinningup.openai.com/en/latest/spinningup/rl_intro3.html", html=True)]
    repositories = {
        "huggingface/Math-Verify": ["README.md", "LICENCE", "pyproject.toml",
                                  "src/math_verify/parser.py", "src/math_verify/grader.py"],
        "huggingface/trl": ["trl/rewards/accuracy_rewards.py", "trl/rewards/format_rewards.py",
                            "trl/trainer/grpo_config.py", "trl/trainer/grpo_trainer.py"],
        "huggingface/open-r1": ["README.md"],
    }
    revisions = {}
    for repository, paths in repositories.items():
        ref = "v1.14.2" if repository == "huggingface/trl" else "main"
        commit_record = retain(repository.split("/")[1].lower() + "-commit.json",
                               f"https://api.github.com/repos/{repository}/commits/{ref}")
        records.append(commit_record)
        commit_path = ROOT / commit_record["path"]
        revision = json.loads(commit_path.read_text(encoding="utf-8"))["sha"]
        revisions[repository] = {"ref": ref, "revision": revision}
        for source in paths:
            name = repository.split("/")[1].lower() + "-" + source.replace("/", "-")
            records.append(retain(name, f"https://raw.githubusercontent.com/{repository}/{revision}/{source}"))
    receipt.write_text(json.dumps({"scope": "public source retrieval only; no code execution",
                                   "revisions": revisions, "sources": records}, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

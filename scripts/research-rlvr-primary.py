"""Retain exact public primary/canonical research bytes; no models or fitting."""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "docs/teaching/llm-architecture-training/rlvr-reinforcement-learning-with-verifiable-rewards/research/primary"
DESTINATION.mkdir(parents=True, exist_ok=True)
SOURCES = {
    "tulu-v3": "https://arxiv.org/html/2411.15124v3",
    "deepseekmath-v2": "https://arxiv.org/html/2402.03300v2",
    "r1-january-v1": "https://arxiv.org/html/2501.12948v1",
    "r1-nature": "https://www.nature.com/articles/s41586-025-09422-z",
    "imperfect-verifiers-v5": "https://arxiv.org/html/2510.00915v5",
    "reasoning-incentives-v2": "https://arxiv.org/html/2506.14245v2",
    "noisy-verifiers-v2": "https://arxiv.org/html/2604.07666v2",
    "rlhf-policy-gradients": "https://rlhfbook.com/c/06-policy-gradients",
    "rlhf-reasoning": "https://rlhfbook.com/c/07-reasoning",
    "trl-grpo-guide": "https://huggingface.co/docs/trl/v1.14.2/grpo_trainer",
    "trl-rewards-guide": "https://huggingface.co/docs/trl/v1.14.2/rewards",
}


class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.hidden = 0
        self.math_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in ["script", "style"]:
            self.hidden += 1
        if tag == "math":
            self.math_depth += 1
            alt = dict(attrs).get("alttext")
            if alt:
                self.parts.append(" [MATH: " + alt + "] ")
        if tag in ["p", "div", "section", "tr", "li", "h1", "h2", "h3", "h4", "pre"]:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in ["script", "style"]:
            self.hidden -= 1
        if tag == "math":
            self.math_depth -= 1
        if tag in ["p", "div", "section", "tr", "li", "h1", "h2", "h3", "h4", "pre"]:
            self.parts.append("\n")

    def handle_data(self, data):
        if self.hidden == 0 and self.math_depth == 0:
            self.parts.append(data)


def retrieve(item):
    name, url = item
    destination = DESTINATION / (name + ".html")
    if destination.exists():
        data = destination.read_bytes()
        result = {"name": name, "url": url, "reuse": True}
    else:
        request = Request(url, headers={"User-Agent": "Mozilla/5.0 lesson primary research"})
        try:
            with urlopen(request, timeout=45) as response:
                data = response.read()
                result = {"name": name, "url": url, "final_url": response.url,
                          "status": response.status, "retrieved_at": datetime.now(timezone.utc).isoformat()}
        except Exception as error:
            return {"name": name, "url": url, "status": "unavailable", "error": str(error)}
        destination.write_bytes(data)
    parser = Text()
    parser.feed(data.decode("utf-8", errors="replace"))
    lines = [" ".join(line.split()) for line in "".join(parser.parts).splitlines()]
    text = "\n".join(line for line in lines if line) + "\n"
    text_path = DESTINATION / (name + ".txt")
    text_path.write_text(text, encoding="utf-8")
    result.update({"sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data),
                   "text_sha256": hashlib.sha256(text_path.read_bytes()).hexdigest(),
                   "text_bytes": text_path.stat().st_size, "reading_status": "retrieved; not yet fully read"})
    return result


with ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(retrieve, SOURCES.items()))
report = DESTINATION / "retrieval.json"
if report.exists():
    raise ValueError("Preserve prior retrieval; declare a named successor instead")
report.write_text(json.dumps({"sources": results, "source_scope": "public primary and canonical bytes only"}, indent=2) + "\n", encoding="utf-8")
for row in results:
    print(row["name"], row.get("status", "reused"), row.get("bytes", row.get("error")))

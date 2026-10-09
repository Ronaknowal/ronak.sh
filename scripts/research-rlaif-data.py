"""Retain primary dataset evidence; no model fitting or dataset package needed."""
import hashlib
import json
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / "docs/teaching/llm-architecture-training/rlaif-ipo-orpo-emerging-alignment-methods"
DEST = TOPIC / "research/dataset"
DEST.mkdir(parents=True, exist_ok=True)
records = []


def retrieve(name, url):
    with urlopen(Request(url, headers={"User-Agent": "lesson-research/1"}), timeout=90) as response:
        body = response.read()
        headers = dict(response.headers)
        status = response.status
    (DEST / name).write_bytes(body)
    records.append({"file": name, "url": url, "status": status,
                    "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest(),
                    "headers": headers})
    return json.loads(body) if name.endswith(".json") else body


repository = "HuggingFaceH4/ultrafeedback_binarized"
metadata = retrieve("metadata-before.json", f"https://huggingface.co/api/datasets/{repository}")
revision = metadata["sha"]
for name in ("README.md", "create_dataset.py"):
    retrieve(name, f"https://huggingface.co/datasets/{repository}/resolve/{revision}/{name}")
retrieve("UltraFeedback-LICENSE.txt", "https://raw.githubusercontent.com/thunlp/UltraFeedback/main/LICENSE")
for split in ("train_prefs", "test_prefs"):
    retrieve(f"{split}-first100.json",
             f"https://datasets-server.huggingface.co/rows?dataset={repository}&config=default&split={split}&offset=0&length=100")
after = retrieve("metadata-after.json", f"https://huggingface.co/api/datasets/{repository}")
assert after["sha"] == revision, "Repository changed during retrieval; retain evidence, reassess."
(DEST / "retrieval.json").write_text(json.dumps({
    "retrievedAt": datetime.now(timezone.utc).isoformat(), "repository": repository,
    "repositoryRevisionObservedBeforeAndAfter": revision, "sources": records,
    "scope": "Rows API bytes are frozen as retrieved. Its response does not independently prove a parquet commit; README and processing script are fetched at the observed pinned commit. No fits or judgement generated."
}, indent=2) + "\n", encoding="utf-8")


class TextReader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, data):
        self.parts.append(data)
    def handle_endtag(self, tag):
        if tag in {"p", "h2", "h3", "li", "tr", "figcaption"}:
            self.parts.append("\n")


reader = TextReader()
source = (TOPIC / "research/primary/rlaif-v2.html").read_text(encoding="utf-8")
reader.feed(source[source.index('<figure id="A14.T15"'):])
(TOPIC / "research/rlaif-prompt-tables.txt").write_text("".join(reader.parts), encoding="utf-8")
print(json.dumps({"revision": revision, "retrieved": len(records), "fits": 0}))

"""Print literal SSR reading text for author review, without running lesson science."""
from html.parser import HTMLParser
from pathlib import Path
import sys

sys.stdout.reconfigure(encoding="utf-8")


class ReadingText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.frames = []
        self.parts = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        skipped = bool(self.frames and self.frames[-1][1]) or tag in {"svg", "style", "script"} or attributes.get("class") == "katex-html"
        if tag not in {"input", "br", "hr", "img", "meta", "link", "source", "wbr"}:
            self.frames.append((tag, skipped))
        if not skipped and tag in {"p", "h2", "h3", "li", "tr", "caption", "figcaption", "summary", "pre", "figure", "section"}:
            self.parts.append("\n")
        if not skipped and tag in {"td", "th"}:
            self.parts.append(" | ")

    def handle_endtag(self, tag):
        if tag in {"p", "h2", "h3", "li", "tr", "caption", "figcaption", "summary", "pre"} and not (self.frames and self.frames[-1][1]):
            self.parts.append("\n")
        for i in range(len(self.frames) - 1, -1, -1):
            if self.frames[i][0] == tag:
                self.frames = self.frames[:i]
                break

    def handle_data(self, text):
        if not (self.frames and self.frames[-1][1]):
            self.parts.append(text)


parser = ReadingText()
parser.feed(Path(__file__).with_name("source-ssr.html").read_text(encoding="utf-8"))
lines = [" ".join(line.split()) for line in "".join(parser.parts).splitlines() if line.strip()]
start, stop = map(int, sys.argv[1:3])
print(f"Actual static reading text: {len(lines)} nonempty lines; requested {start}:{stop}")
for i in range(start, min(stop, len(lines))):
    print(f"{i}: {lines[i]}")

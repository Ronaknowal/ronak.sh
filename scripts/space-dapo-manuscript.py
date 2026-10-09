"""Whitespace-only prose readability pass, preserving code, math and URLs."""
from pathlib import Path
import re

path = Path('docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization/lesson.md')
before = path.read_text(encoding='utf-8')
fenced = False
display = False
lines = []
protected = re.compile(r'`[^`]+`|\$[^$\n]+\$|\[[^\]]+\]\([^)]*\)|https?://\S+|\b(?:FP32|FP64|Pythia14m|Qwen2\.5|32B|671B|1e[−-]\d+|10e[−-]\d+|R1|D\d+|P\d+)\b')

def prose(text):
    text = re.sub(r'(?<=[A-Za-z])(?=\d|\.\d)', ' ', text)
    text = re.sub(r'(?<=\d)(?=[a-z])', ' ', text)
    text = re.sub(r'(?<=[A-Za-z])(?=[+−]\d)', ' ', text)
    return text

for line in before.splitlines(keepends=True):
    if line.startswith('```'):
        fenced = not fenced
        lines.append(line)
        continue
    if line.strip() == '$$':
        display = not display
        lines.append(line)
        continue
    if fenced or display or line.startswith('<!--'):
        lines.append(line)
        continue
    parts = []
    cursor = 0
    for match in protected.finditer(line):
        chunk = prose(line[cursor:match.start()])
        token = match.group()
        if token.startswith(('$', '`')) and chunk and chunk[-1].isalnum():
            chunk += ' '
        parts.append(chunk)
        parts.append(token)
        cursor = match.end()
        if token.startswith(('$', '`')) and cursor < len(line) and line[cursor].isalnum():
            parts.append(' ')
    parts.append(prose(line[cursor:]))
    lines.append(''.join(parts))
after = ''.join(lines)
assert re.sub(r'\s', '', before) == re.sub(r'\s', '', after)
path.write_text(after, encoding='utf-8')
print({'whitespace_only': True, 'before_chars': len(before), 'after_chars': len(after)})

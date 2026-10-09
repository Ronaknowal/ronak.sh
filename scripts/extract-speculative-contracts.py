"""Carry accepted contracts into the manuscript handoff without rewriting them."""
import hashlib
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'docs/teaching/llm-architecture-training/speculative-decoding'
source = TOPIC / 'design.md'
text = source.read_text(encoding='utf8')
contracts = []
for match in re.finditer(r'^\*\*(D\d{2}) (.+?)\*\*', text, flags=re.M):
    rest = text[match.start():]
    boundary = re.search(r'\n(?:\*\*D\d{2} |###? )', rest[1:])
    block = rest[:boundary.start()+1] if boundary else rest
    contracts.append((match.group(1), block.strip()))
assert len(contracts) == 36 and len({key for key, _ in contracts}) == 36
manuscript = (TOPIC / 'lesson.md').read_text(encoding='utf8')
assert set(re.findall(r'<!-- (D\d{2}):', manuscript)) == {key for key, _ in contracts}
intro = '''# Speculative Decoding: complete visual contracts

These are the exact mechanism contracts from the accepted design, in reading order. The manuscript supplies their adjacent concrete explanations, equations and program walks. Runtime remains unreleased until full actual content review.

Every current result is visible on mount, with meaningful controls immediately below its drawing and a Reset restoring the stated default. Each object has an accessible description or equivalent table. Preserve label scale through reflow or focusable labelled local panning at 390px and 768px/root32; do not shrink whole SVGs until text becomes unreadable. Plots include labelled units, numeric ticks and exact breakpoints. Essential topology stays visible during selection.

Token identities A/B/C retain cyan/violet/rose across probabilities, traces and caches. Model roles are separately labelled blue target and amber draft. A white outline indicates selection; solid/dashed/hatched treatments indicate accepted/provisional/discarded state without dimming token labels. Introduce a different head/layer/memory encoding locally. No green/olive decoration. Constructed values, exact finite laws, random-network mechanics and native observations remain explicitly distinct. Unavailable or zero-mass states explain why an operation has no result; they do not substitute fabricated zeros.

'''
intro += 'Accepted design SHA-256: `' + hashlib.sha256(source.read_bytes()).hexdigest() + '`.\n\n'
with (TOPIC / 'visual-contracts.md').open('x', encoding='utf8') as stream:
    stream.write(intro + '\n\n'.join(block for _, block in contracts) + '\n')
print('Transferred all 36 accepted contracts; manuscript has every corresponding placement.')

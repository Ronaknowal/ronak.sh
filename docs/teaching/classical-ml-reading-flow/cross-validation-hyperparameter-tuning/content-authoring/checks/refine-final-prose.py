"""Exact small continuity fixes found during the final whole beginner pass."""
from pathlib import Path
import hashlib
import json
import re

OWNER = Path(__file__).resolve().parents[1]


def main():
    receipt = OWNER / 'checks/final-prose-correction.json'
    if receipt.exists():
        raise ValueError('Preserve the immutable correction.')
    preimages = OWNER / 'checks/final-prose-preimages'
    preimages.mkdir(exist_ok=True)
    changes = {
        '01-questions.md': [
            ('We will refresh the fitted-state boundary locally, so you can follow this lesson without needing an unpublished implementation of that preceding revision.', 'We refresh the fitted-state boundary locally before using it in cross-validation.')],
        '05-search-spaces.md': [],
        '07-risk-and-uncertainty.md': [
            ('misaligned targets and an empty draw refuse explicitly.', 'misaligned sampling-unit identities and an empty draw refuse explicitly.')],
        '08-adaptive-search.md': [
            ("Let γ be the probability of the better region. The marginal setting density is p(x)=γl(x)+(1−γ)g(x). Under the paper's thresholded density factorization, the EI integral has an x-independent positive factor times",
             "Let γ be the probability of the better region. The marginal setting density is p(x)=γl(x)+(1−γ)g(x). Here the paper's improvement threshold is y*, rather than necessarily the best observed c used in the preceding example. Its factorization treats p(x|y) as the same l(x) throughout y<y*. Bayes' rule then gives\n\n\\[\n\\begin{aligned}\n\\operatorname{EI}_{y^*}(x)\n&=\\int_{-\\infty}^{y^*}(y^*-y)p(y\\mid x)\\,dy\\\\\n&=\\frac{l(x)}{p(x)}\\int_{-\\infty}^{y^*}(y^*-y)p(y)\\,dy.\n\\end{aligned}\n\\]\n\nFor a finite positive integral, that last factor does not depend on x. Comparing settings therefore compares")],
    }
    rows = []
    for name, replacements in changes.items():
        path = OWNER / 'sections' / name
        before = path.read_bytes()
        text = before.decode('utf8')
        if name.startswith('05-'):
            marker = '<!-- Drawing D25: visual-specifications.md#d25. -->'
            hit = re.search(re.escape(marker) + r'(?:\r?\n){2}', text)
            assert hit and text.count(marker) == 1
            old = hit.group()
            text = text[:hit.start()] + text[hit.end():]
            heading = '### What does a trial budget promise?'
            hit = re.search(re.escape(heading) + r'(?:\r?\n){2}', text)
            assert hit
            new = 'Mark the sampler’s acceptable region and count attempts separately from their scores.\n\n' + marker + '\n\n'
            text = text[:hit.end()] + new + text[hit.end():]
            replacements = [('D25 placement after probability equation', 'D25 placement after question/lead, before miss/hit derivation')]
        else:
            for old, new in replacements:
                assert text.count(old) == 1, old
                text = text.replace(old, new)
        after = text.encode('utf8')
        (preimages / name).write_bytes(before)
        path.write_bytes(after)
        rows.append({'file': 'sections/' + name, 'before': {'bytes': len(before), 'sha256': hashlib.sha256(before).hexdigest()}, 'after': {'bytes': len(after), 'sha256': hashlib.sha256(after).hexdigest()}, 'exact_replacements': [{'old': old, 'new': new} for old, new in replacements]})
    receipt.write_bytes((json.dumps({'schema': 'classical21-final-prose-correction/v1', 'scope': 'Final actual reading: direct prerequisite wording, picture-first trial mass, actual bootstrap input refusal, and explicit TPE threshold/Bayes derivation. All programme/data/stream bytes unchanged.', 'edits': rows}, indent=2) + '\n').encode('utf8'))
    print(json.dumps({'bytes': receipt.stat().st_size, 'sha256': hashlib.sha256(receipt.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()

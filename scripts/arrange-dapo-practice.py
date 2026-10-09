"""Keep the mechanism reading continuous; collect existing solved transfer tasks."""
from pathlib import Path
import re

path = Path('docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization/lesson.md')
text = path.read_text(encoding='utf-8')
exercises = re.findall(r'^### P\d+\. .*?(?=^## |\Z)', text, flags=re.M | re.S)
assert len(exercises) == 18
text = re.sub(r'^### P\d+\. .*?(?=^## |\Z)', '', text, flags=re.M | re.S)
heading = '## What to carry forward'
assert text.count(heading) == 1
practice = ('## Independent practice\n\nThese questions change the inputs or assumptions from the main examples. '
            'Use the hints when useful, then compare your reasoning with the worked solutions.\n\n'
            + '\n'.join(exercises))
text = text.replace(heading, practice + heading)
assert len(re.findall(r'^### P\d+\.', text, re.M)) == 18
assert len(re.findall(r'<!-- D\d+:', text)) == 36
path.write_text(text, encoding='utf-8')
print({'practices_preserved':18,'figures_preserved':36})

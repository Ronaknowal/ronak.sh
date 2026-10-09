"""One necessary saved-array ruler/address calculation, with no fitting/imported main."""
import hashlib
import json
import math
from pathlib import Path

owner = Path(__file__).resolve().parent.parent
source = owner / 'preserved/src/learn/data/nmf-data.js'
output = Path(__file__).with_suffix('.json')
if output.exists():
    raise RuntimeError('Keep the once-execution receipt unchanged')
raw = source.read_bytes()
data, _ = json.JSONDecoder().raw_decode(raw.decode().split('export const NMF_DIGITS = ', 1)[1])
patterns = data['dictionary']
maximum = max(value for row in patterns for value in row)
selected = []
for position, row in enumerate(data['test']):
    if row['sourceRow'] not in (242, 256):
        continue
    weights = data['activations'][position]
    reconstruction = [sum(weights[c] * patterns[c][j] for c in range(8)) for j in range(64)]
    selected.append({'sourceRow': row['sourceRow'], 'rawF35': row['pixels'][35],
                     'scaledF35': row['pixels'][35] / data['scale'],
                     'reconstructedF35': reconstruction[35],
                     'maximumFeature': max(range(64), key=reconstruction.__getitem__),
                     'maximumReconstruction': max(reconstruction)})
result = {'source': {'path': str(source), 'sha256': hashlib.sha256(raw).hexdigest()},
          'sourceProgramSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          'dictionaryMaximum': maximum,
          'chosenCommonNonnegativeMaximum': max(4, math.ceil(maximum)),
          'selectedAddresses': selected, 'fitCount': 0, 'originalMainExecutions': 0}
output.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, indent=2))

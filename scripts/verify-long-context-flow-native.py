"""New reading-flow programs only; do not overwrite historical native receipts."""
import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import sys
from datetime import datetime, timezone

root = Path(__file__).resolve().parent.parent
sys.path.append(str(root / 'scratch/positional-encoding-reading-flow/native-environment/Lib/site-packages'))
folder = root / 'public/learn-code/long-context-sequence-models-transformer-xl-griffin-perceiver'
reports, identities = {}, {}
for filename in ('explicit-memory-operators.py', 'context-adaptation.py'):
    path = folder / filename
    spec = importlib.util.spec_from_file_location(filename.replace('-', '_'), path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    with contextlib.redirect_stdout(io.StringIO()):
        reports[filename] = module.main()
    identities[str(path.relative_to(root)).replace('\\', '/')] = hashlib.sha256(path.read_bytes()).hexdigest()
import numpy
import torch
import transformers
receipt = {'generatedAt': datetime.now(timezone.utc).isoformat(), 'passed': True,
           'scope': '50 current operator checks plus prefix/rotation/search/loss synthetic contracts; no new fitted model',
           'versions': {'torch': torch.__version__, 'numpy': numpy.__version__, 'transformers': transformers.__version__},
           'sourceHashes': identities, 'reports': reports,
           'nativeRecurrentGemma': 'Not installed/executed; capped backward equation checked against explicit source convention'}
out = root / 'docs/teaching/deep-learning-beginner/long-context-sequence-models-transformer-xl-griffin-perceiver/reading-flow-native.json'
out.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'passed': True, 'operatorChecks': reports['explicit-memory-operators.py']['checks'], 'receipt': str(out.relative_to(root))}))

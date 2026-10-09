"""Native reference comparisons for annotation/NLP/vision interface lessons.

Run with the installed example dependencies. Optional --packages adds an isolated
package directory; --output writes exact versions, checks and source identities.
"""
import argparse
import hashlib
import importlib.util
import itertools
import json
from pathlib import Path
import platform
import sys
sys.dont_write_bytecode = True

parser = argparse.ArgumentParser()
parser.add_argument('--packages')
parser.add_argument('--output')
args = parser.parse_args()
if args.packages:
    sys.path.insert(0, str(Path(args.packages).resolve()))
root = Path(__file__).resolve().parents[1]


def load(name, relative):
    spec = importlib.util.spec_from_file_location(name, root / relative)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


annotation = load('annotation_audit', 'public/learn-code/data-annotation-labeling/annotation_audit.py')
nlp = load('text_pipeline', 'public/learn-code/nlp-libraries/text_pipeline.py')
subword = load('subword_alignment', 'public/learn-code/nlp-libraries/subword_alignment.py')
vision = load('vision_pipeline', 'public/learn-code/computer-vision-libraries/vision_pipeline.py')

import numpy as np
import sklearn
from sklearn.metrics import cohen_kappa_score
import spacy
import tokenizers
import cv2
import PIL
import torch
import torchvision
from torchvision import tv_tensors
from torchvision.transforms import v2
torch.set_num_threads(1)

checks = []
cases = 0
for a in itertools.product([0,1],repeat=4):
    for b in itertools.product([0,1],repeat=4):
        result = annotation.agreement(a,b)
        if result['kappa'] is not None:
            assert abs(result['kappa'] - cohen_kappa_score(a,b)) < 1e-12
        else:
            assert result['expected'] == 1
        cases += 1
assert annotation.agreement([None],[1])['n'] == 0
checks.append({'case':'all 256 binary two-rater four-item assignments', 'result':'sklearn parity; degenerate denominator preserved'})
annotation.main()
nlp.main()
subword.main()
vision.main()
checks.append({'case':'all four complete learner programs', 'result':'executed and assertions passed'})

for text in ['🙂 Asha', 'café', 'e\u0301', 'x  y', '']:
    tokens = nlp.tokenize(text)
    assert all(text[token.start:token.end] == token.text for token in tokens)
try:
    nlp.bio_tags(nlp.tokenize('New York'), [(1,8,'PLACE')])
except ValueError:
    pass
else:
    raise AssertionError('Partial-token annotation accepted')
assert nlp.exact_span_scores([(0,4,'PERSON'),(14,22,'PLACE')],[(18,22,'PLACE')]) == (0,0,0)
checks.append({'case':'Unicode source slices, partial spans and exact-boundary score', 'result':'pass'})

image = np.arange(30,dtype=float).reshape(5,6)
kernel = np.array([[-1,0,1],[-1,0,1],[-1,0,1]],dtype=float)
np.testing.assert_allclose(vision.correlate_valid(image,kernel),cv2.filter2D(image,cv2.CV_64F,kernel)[1:-1,1:-1])
np.testing.assert_allclose(vision.correlate_valid(image,kernel),np.full((3,4),6))
assert vision.crop_flip_box([1,1,4,3],4,0,2,4) is None
np.testing.assert_allclose(vision.crop_flip_box([2,1,7,5],4,0,4,6,True),[1,1,4,5])
mask = tv_tensors.Mask(torch.tensor([[0,7],[7,0]],dtype=torch.uint8))
resized = v2.Resize((5,5))(mask)
assert set(torch.unique(resized).tolist()) == {0,7}
checks.append({'case':'asymmetric filter/OpenCV, removed box, changed-frame solution, discrete mask resize', 'result':'pass'})

files = ['public/learn-code/data-annotation-labeling/annotation_audit.py',
         'public/learn-code/nlp-libraries/text_pipeline.py',
         'public/learn-code/nlp-libraries/subword_alignment.py',
         'public/learn-code/computer-vision-libraries/vision_pipeline.py']
report = {'python':platform.python_version(), 'versions':{m.__name__:m.__version__ for m in [np,sklearn,spacy,tokenizers,cv2,PIL,torch,torchvision]},
          'checks':checks, 'files':{name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in files},
          'limits':['CPU interface fixtures, no pretrained recognition performance measured.', 'Label Studio server/multi-user UI not executed; XML/task/export schema and local adapter checked.', 'Browser/independent reviews are separate.']}
if args.output:
    output = root / args.output
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))

from pathlib import Path
import contextlib
import hashlib
import io
import json
import runpy
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'public/learn-code/sequence-to-sequence-encoder-decoder/explicit-inflector.py'
stream=io.StringIO()
with contextlib.redirect_stdout(stream):
    runpy.run_path(str(source),run_name='__main__')
output=stream.getvalue()
assert 'cap: 3 output: lac EOS: False' in output
assert 'cap: 16 output: lactated EOS: True' in output
assert 'beam3: lactated' in output
assert 'encoder input-weight gradient norm:' in output
receipt={'passed':True,'stdout':output,'sourceHashes':{str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in [source,Path(__file__).resolve()]},'limits':'Actual documented CPU example; no fit, speed claim or browser evidence.'}
(ROOT/'docs/teaching/deep-learning-beginner/sequence-to-sequence-encoder-decoder/reading-flow-example.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'passed':True,'output':output}))

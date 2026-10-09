"""Readable Python formatting with exact predecessor and AST conservation."""
import ast
import hashlib
import json
from pathlib import Path
import black

base=Path('docs/teaching/llm-architecture-training/structured-output-constrained-decoding-outlines-xgrammar')
out=base/'research/program-formatting'
out.mkdir(parents=True,exist_ok=True)
checks=[]
for path in sorted((base/'programs').glob('*.py')):
    if path.name=='sampling.py':
        continue  # Reuse the exact corrected prerequisite bytes.
    source=path.read_text(encoding='utf-8')
    before=path.read_bytes()
    with (out/path.name).open('xb') as stream:
        stream.write(before)
    formatted=black.format_str(source,mode=black.Mode(line_length=88))
    assert ast.dump(ast.parse(source))==ast.dump(ast.parse(formatted)),path
    path.write_text(formatted,encoding='utf-8',newline='\n')
    checks.append({'path':str(path).replace('\\','/'),'before':hashlib.sha256(before).hexdigest(),
                   'after':hashlib.sha256(path.read_bytes()).hexdigest(),'ASTEqual':True})
with (out/'checks.json').open('x',encoding='utf-8') as stream:
    json.dump({'black_version':black.__version__,'checks':checks},stream,indent=2);stream.write('\n')
print(json.dumps({'formatted':len(checks),'AST_equal':True}))

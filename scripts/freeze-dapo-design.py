from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parents[1]
folder=root/'docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
text=(folder/'design.md').read_text(encoding='utf-8')
assert len(re.findall(r'^### \d+\.',text,re.M))==18
assert re.findall(r'^- D(\d+):',text,re.M)==[f'{i:02d}' for i in range(1,37)]
files={p.relative_to(root).as_posix():sha(p) for p in folder.rglob('*') if p.is_file() and p.name!='design-inputs.json'}
for p in [root/'src/learn/data/topics/dapo.jsx',Path(__file__),root/'scratch/dapo-research/render_appendix.py']:
    files[p.relative_to(root).as_posix()]=sha(p)
packet={'status':'complete18-section36-mechanism design awaiting different whole review; no new model execution or runtime','author':'root','design':sha(folder/'design.md'),'files':files}
(folder/'design-inputs.json').write_text(json.dumps(packet,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'design':packet['design'],'packet':sha(folder/'design-inputs.json'),'bindings':len(files)}))

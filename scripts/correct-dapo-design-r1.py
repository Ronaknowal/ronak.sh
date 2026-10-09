from pathlib import Path
import json,hashlib,shutil
root=Path(__file__).resolve().parents[1]
folder=root/'docs/teaching/llm-architecture-training/dapo-dynamic-adaptive-policy-optimization'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
packet=json.loads((folder/'design-inputs.json').read_text(encoding='utf-8'))
for p,h in packet['files'].items():assert sha(root/p)==h,p
prior=folder/'design-r1-predecessor';prior.mkdir(exist_ok=False)
for name in ['design.md','design-inputs.json']:shutil.copyfile(folder/name,prior/name)
p=folder/'design.md';old=p.read_bytes()
before=b'Original reproduction may omit hard overlong masking; ordinary TRL example enables it.'
after=b"Original reproduction may omit hard overlong masking. TRL's published DAPO configuration example enables hard overlong loss masking; this lesson's primary native campaign leaves it disabled to isolate its selected recipe. The native finite preflight separately exercises the enabled case."
assert old.count(before)==1;p.write_bytes(old.replace(before,after))
packet['design']=sha(p);packet['files'][p.relative_to(root).as_posix()]=sha(p)
for x in [*prior.iterdir(),Path(__file__),folder/'design-review.md',folder/'design-review-inputs.json']:packet['files'][x.relative_to(root).as_posix()]=sha(x)
packet['status']='bounded R1 scope clarification awaiting same reviewer closure'
out=folder/'design-r1-inputs.json';out.write_text(json.dumps(packet,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'design':sha(p),'packet':sha(out),'bindings':len(packet['files'])}))

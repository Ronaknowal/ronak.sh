"""Run only the three unstarted native training routes after reviewed repair."""
import hashlib
import importlib.metadata
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'public/learn-code/grpo-rloo-kto'))
from trl_group_training import run as run_group
from trl_kto import run as run_kto


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_new(path,value):
    with path.open('x',encoding='utf-8') as stream:
        json.dump(value,stream,indent=2)


def guard():
    manifest=json.loads((HERE/'inputs.json').read_text(encoding='utf-8'))
    for path,expected in manifest['inputs'].items():
        if digest(ROOT/path)!=expected:
            raise ValueError('Continuation input changed: '+path)
    protocol=json.loads((HERE.parent/'prospective-protocol.json').read_text())
    for package,version in protocol['versions'].items():
        if importlib.metadata.version(package)!=version:
            raise ValueError('Environment changed: '+package)
    return protocol,digest(HERE/'inputs.json')


def main():
    protocol,binding=guard()
    output=ROOT/'scratch/grpo-research/native-continuation'
    output.mkdir(parents=True,exist_ok=True)
    runners={'native-grpo':lambda folder:run_group(protocol['model'],protocol['data'],'grpo',folder),
             'native-rloo':lambda folder:run_group(protocol['model'],protocol['data'],'rloo',folder),
             'native-kto':lambda folder:run_kto(protocol['model'],protocol['data'],folder)}
    results=[]
    for name,run in runners.items():
        guard()
        folder=output/name
        terminal=output/(name+'-terminal.json')
        if terminal.exists():
            value=json.loads(terminal.read_text())
            if value['inputs_sha256']!=binding or value['report_sha256']!=digest(folder/'report.json'):
                raise ValueError('Existing terminal stage changed')
            results.append({'stage':name,'status':'conserved'})
            continue
        if folder.exists():
            raise FileExistsError('Partial native stage retained: '+name)
        try:
            run(folder)
        except Exception as error:
            save_new(output/(name+'-failure.json'),{'stage':name,'status':'failed',
                     'inputs_sha256':binding,'error':repr(error)})
            raise
        value={'stage':name,'status':'completed','inputs_sha256':binding,
               'report_sha256':digest(folder/'report.json')}
        save_new(terminal,value)
        results.append(value)
    print(json.dumps(results))


if __name__=='__main__':
    main()

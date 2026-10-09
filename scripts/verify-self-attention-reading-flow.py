from pathlib import Path
import json,re,subprocess,sys,hashlib,importlib.util
root=Path.cwd();topic='self-attention-multi-head-attention';source=root/'src/learn/data/topics'/f'{topic}.jsx';text=source.read_text(encoding='utf-8')
folder=root/'scratch/self-attention-reading-flow/native';folder.mkdir(parents=True,exist_ok=True)
blocks=re.findall(r'<CodeBlock language=\{"python"\}>\{("(?:[^"\\]|\\.)*")\}</CodeBlock>',text)
assert len(blocks)==2,len(blocks)
results=[]
for i,block in enumerate(blocks):
    target=folder/f'operator-{i+1}.py';target.write_text(json.loads(block),encoding='utf-8');run=subprocess.run([sys.executable,'-B',str(target)],capture_output=True,text=True,check=True);results.append({'codeblock':i+1,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'stdout':run.stdout.strip()})
program=root/'public/learn-code'/topic/'author-calculations.py';spec=importlib.util.spec_from_file_location('attention_reproduction',program);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
fixtures=module.mathematical_fixtures();points,labels,splits,contract=module.load_data()
report={'date':'2026-10-05','passed':True,'blocks':results,'mathematical_fixtures':fixtures,'data_counts':{key:len(value) for key,value in splits.items()},'unique':contract['unique_trajectories'],'program_sha256':hashlib.sha256(program.read_bytes()).hexdigest(),'lesson_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'scope':'Executed both complete printed Python blocks and unchanged reproduction program mathematical/data paths. Did not invoke main(), refit twelve models or overwrite public measurements.'}
out=root/'docs/teaching/deep-learning-beginner'/topic/'reading-flow-native-checks.json';out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps({'passed':True,'blocks':len(blocks),'split_sizes':report['data_counts'],'maximum_operator_error':fixtures['manual_mha_output_max_error']}))

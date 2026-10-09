"""Scoped CPU/offline lesson checks. Run with the lesson Python environment."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
IDS = {
    'serving': 'llm-serving-frameworks-vllm-tgi-sglang-tensorrt-llm',
    'applications': 'llm-application-frameworks-langchain-llamaindex-haystack',
    'workflows': 'agent-workflow-frameworks-crewai-autogen-langgraph',
}
CHECKS = {
'serving': r'''
from serving_scheduler import Request, schedule, page_plan
assert schedule([Request('one', 0, 3, 1)], token_budget=2)['completed']['one'] == {'first':2,'finish':2,'ttft_units':2}
assert page_plan([9,6],4,5) == {'logical_pages':[3,2],'shared_pages':1,'physical_pages':4,'capacity':16,'useful':11,'slack':5}
assert page_plan([8,8],4,8)['physical_pages'] == 2
for arguments in [{'token_budget':0},{'slots':0}]:
    try: schedule([Request('a',0,1,1)], **arguments)
    except ValueError: pass
    else: raise AssertionError('invalid scheduling boundary accepted')
for requests in [[Request('a',0,0,1)],[Request('a',0,1,0)],[Request('a',0,1,1),Request('a',1,1,1)]]:
    try: schedule(requests)
    except ValueError: pass
    else: raise AssertionError('invalid request accepted')
# Real local HTTP transport against a clearly labeled protocol fixture, not a model.
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread
import json
from serving_client import complete
seen={}
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def do_POST(self):
        seen['path']=self.path
        seen['body']=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        body=json.dumps({'choices':[{'message':{'content':'protocol fixture'},'finish_reason':'length'}], 'usage':{'completion_tokens':2}}).encode()
        self.send_response(200); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body)
with HTTPServer(('127.0.0.1',0), Handler) as server:
    thread=Thread(target=server.handle_request);thread.start()
    result=complete(f'http://127.0.0.1:{server.server_port}/v1','fixture','test',2)
    thread.join()
assert result['finish_reason']=='length' and result['usage']['completion_tokens']==2
assert seen['path']=='/v1/chat/completions' and seen['body']['max_tokens']==2
print(json.dumps({'single_output_completion':2,'shared_all_prefix_pages':2,'protocol_fixture':True,'native_generation':False}))
''',
'applications': r'''
from retrieval_pipeline import DOCUMENTS,EvidenceIndex,pack_evidence
index=EvidenceIndex(DOCUMENTS)
ranked=index.search('file exception')
assert [len(__import__('retrieval_pipeline').tokens(d['text'])) for d in ranked] == [22,23,23]
assert pack_evidence(ranked,20)['used_words']==0
assert pack_evidence(ranked,30)['used_words']==22
assert pack_evidence(ranked,80)['used_words']==68
assert index.search('file',allowed={'dictionary'}) == []
assert [d['id'] for d in index.search('file file exception')] == [d['id'] for d in ranked]
from haystack import Document
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.retrievers.in_memory import InMemoryBM25Retriever
store=InMemoryDocumentStore(shared=False,bm25_algorithm='BM25L',bm25_parameters={'k1':1.5,'b':.75,'delta':0})
store.write_documents([Document(id=d['id'],content=d['text']) for d in DOCUMENTS])
retriever=InMemoryBM25Retriever(document_store=store,top_k=4)
import math,json
for query in ['dictionary key','resource cleanup','file file exception','quantum banana','']:
    native=retriever.run(query=query)['documents'] if query else []
    scratch=index.search(query,4)
    assert {d.id for d in native} == {d['id'] for d in scratch}
    by_id={d.id:d.score for d in native}
    for d in scratch:assert math.isclose(d['score'],by_id[d['id']],abs_tol=1e-12,rel_tol=1e-12)
print(json.dumps({'changed_queries':5,'budgets':[0,22,68],'authorization_filtered':True}))
''',
'workflows': r'''
from durable_workflow import EffectStore,Workflow,validate_proposal
from pathlib import Path
from tempfile import TemporaryDirectory
import json
with TemporaryDirectory(prefix='workflow-boundary-') as directory:
    root=Path(directory);store=EffectStore(root/'effect.sqlite')
    proposal={'tool':'increment_counter','amount':1}
    receipt=store.apply('same',proposal)
    assert store.apply('same',proposal)==receipt and store.value()==1
    for proposal in [{'tool':'increment_counter','amount':2},{'tool':'unknown','amount':1},{'tool':'increment_counter','amount':True}]:
        try:store.apply('same',proposal)
        except ValueError:pass
        else:raise AssertionError('changed/invalid payload accepted')
    assert store.value()==1
print(json.dumps({'same_key_replayed':True,'changed_payload_rejected':True,'invalid_tool_and_boolean_rejected':True}))
''',
}
PROGRAMS = {'serving':['serving_scheduler.py','kv_cache_bridge.py'],
            'applications':['retrieval_pipeline.py','framework_retrieval.py'],
            'workflows':['durable_workflow.py','langgraph_workflow.py']}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--topic',choices=IDS,required=True)
    args=parser.parse_args();topic=IDS[args.topic]
    folder=ROOT/'public'/'learn-code'/topic
    target=ROOT/'scratch'/('training-frameworks-runtime' if args.topic=='serving' else 'llm-workflows-runtime')
    env={**os.environ,'PYTHONPATH':str(target),'PYTHONDONTWRITEBYTECODE':'1','HAYSTACK_TELEMETRY_ENABLED':'False'}
    outputs={}
    for filename in PROGRAMS[args.topic]:
        run=subprocess.run([sys.executable,'-B',str(folder/filename)],cwd=folder,env=env,text=True,capture_output=True,check=True)
        outputs[filename]=json.loads(run.stdout)
    run=subprocess.run([sys.executable,'-B','-c',CHECKS[args.topic]],cwd=folder,env=env,text=True,capture_output=True,check=True)
    outputs['boundary_checks']=json.loads(run.stdout)
    sources=[*folder.glob('*.py'),Path(__file__)]
    record={'topic':topic,'checked_at':datetime.now(timezone.utc).isoformat(),'python':sys.version,
            'environment_target':str(target.relative_to(ROOT)),'scope':'CPU/offline public programs and explicit boundary checks; no hosted generation or GPU engine',
            'outputs':outputs,'sources':{str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in sources}}
    destination=ROOT/'docs'/'teaching'/'core-frameworks'/topic/'native-evidence.json'
    destination.write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'topic':topic,'passed':True,'record':str(destination.relative_to(ROOT))}))


if __name__=='__main__':main()

"""Finite browser-translation references; never run a scientific main/model."""
from pathlib import Path
import json
import sys
root=Path(__file__).resolve().parents[1]
topic=root/'docs/teaching/llm-architecture-training/test-time-compute-scaling'
sys.path.insert(0,str(topic/'programs'))
sys.path.insert(0,str(topic/'programs/prerequisite'))
import allocation, budgeting, budget_controller, probability, prm_search
rows={
 'schedule':[{ 'workers':w,'value':budgeting.schedule([2,2,2],w)} for w in range(1,4)],
 'plurality':[{ 'p':p,'n':n,'value':probability.plurality(p,n)} for p in [[.4,.35,.25],[.4,.5,.1]] for n in [1,3,5,7]],
 'beam':[{ 'width':w,'depth':d,'family':f,'value':prm_search.beam(w,d,f)} for w in [1,2] for d in range(3) for f in ['product','value']],
 'controller':[{ 'cap':c,'context':s,'value':budget_controller.control([['15−4','=11'],['11/2','=5.5']],['Answer:','5.5'],thinking_cap=c,context_remaining=s)} for c in range(7) for s in range(2,11)],
 'allocation':[{ 'budget':b,'overhead':h,'value':allocation.allocate(allocation.TABLE,b,h)} for b in range(5) for h in range(5)],
 'hybrid':[{ 'breadth':b,'depth':d,'value':budgeting.hybrid(b,d,10,20)} for b in range(1,5) for d in range(1,5)],
 'exchange':[{ 'y':y,'m':m/2,'value':budgeting.exchange(100,y,m/2)} for y in range(10,101,10) for m in range(2,9)],
}
with (topic/'runtime-python-reference.json').open('x',encoding='utf8') as stream:json.dump(rows,stream,indent=2)
print(json.dumps({'finite_cases':sum(map(len,rows.values())),'scope':'New browser translation reference; no prior main/checker or scientific campaign replay.'}))

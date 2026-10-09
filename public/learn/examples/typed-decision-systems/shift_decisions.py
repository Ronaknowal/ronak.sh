"""Predeclare 24 controlled requests without inspecting model outputs.

python shift_decisions.py --data data/banking.json --output data/shifts.json
The first case of each class is selected by SHA256(source ID), not its outcome.
Missing-correct-option cases have no valid classification target.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path

PARAPHRASES=[
    'a newly ordered card still has not reached the customer',
    'the expected waiting time or speed of sending a new card',
    'connect a card the customer already owns to their account',
    'a bank card fails during attempted use',
    'a card previously in the customer possession is now lost or stolen',
    'the customer disputes a card purchase they do not recognise',
]
DISTRACTORS=[{'id':'balance','description':'check the amount of money in the account'},
             {'id':'cash_withdrawal','description':'withdraw cash from a cash machine'}]


def prepare(data):
    anchors=[min((row for row in data['test'] if row['target']==label),
                 key=lambda row:hashlib.sha256(row['id'].encode()).hexdigest()) for label in range(6)]
    rows=[]
    def add(parent,kind,state=None,options=None,translation=None):
        row=copy.deepcopy(parent)
        row.update(id=f'{parent["id"]}/{kind}',parent_id=parent['id'],intervention=kind)
        if state is not None:row['state']=state
        if options is not None:row['options']=copy.deepcopy(options)
        correct=parent['options'][parent['target']]['id']
        current=[o['id'] for o in row['options']]
        row['target']=current.index(correct) if correct in current else None
        if translation:row['english_meaning']=translation
        rows.append(row)
    for parent in anchors[:4]:
        add(parent,'reverse',options=list(reversed(parent['options'])))
        paraphrased=[{**o,'description':PARAPHRASES[i]} for i,o in enumerate(parent['options'])]
        add(parent,'paraphrase',options=paraphrased)
        add(parent,'omit-correct',options=[o for i,o in enumerate(parent['options']) if i!=parent['target']])
        add(parent,'distractor',options=parent['options']+DISTRACTORS[:1])
    if [row['id'] for row in anchors[:2]]!=['test:9','test:308']:
        raise ValueError('The fixed translated parents no longer match')
    add(anchors[0],'hindi',state='क्या मेरे नए कार्ड के लिए एक सप्ताह से अधिक इंतज़ार करना सामान्य है?',
        translation=anchors[0]['state'])
    add(anchors[1],'hindi',state='क्या मेरा कार्ड जल्दी भेजा जा सकता है?',translation=anchors[1]['state'])
    filler='This sentence provides no information about the banking request. '*100
    add(anchors[2],'long-clue-front',state=anchors[2]['state']+' '+filler)
    add(anchors[2],'long-clue-end',state=filler+anchors[2]['state'])
    parent=anchors[4]
    add(parent,'two-candidates',options=[parent['options'][4],parent['options'][0]])
    add(anchors[5],'eight-candidates',options=anchors[5]['options']+DISTRACTORS)
    for parent in anchors[4:]:
        renamed=[{**o,'id':f'candidate-{i}'} for i,o in enumerate(parent['options'])]
        add(parent,'rename-ids',options=renamed)
        rows[-1]['target']=parent['target']
        rows[-1]['identity_map']={new['id']:old['id'] for new,old in zip(renamed,parent['options'])}
    assert len(rows)==24
    return {'selection':'one parent per class by SHA256(source ID), before model outputs',
            'anchors':[row['id'] for row in anchors],'rows':rows,
            'limits':'Controlled individual interventions, not population robustness measurements; Hindi is outside the pinned English model scope'}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    value=prepare(json.loads(args.data.read_text(encoding='utf-8')))
    with args.output.open('x',encoding='utf-8') as stream:
        json.dump(value,stream,indent=2,ensure_ascii=False,allow_nan=False)

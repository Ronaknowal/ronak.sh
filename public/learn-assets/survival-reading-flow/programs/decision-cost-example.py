"""Expected-loss calculation with supplied probability and stipulated consequences."""

import json
from reliability_decision import inspection_decision


def main():
    print(json.dumps({'probability':.3,'failure_cost':100.,'stipulated_effectiveness':1.,
                      'inspection_costs':[{'cost':c,**inspection_decision(.3,c,effectiveness=1.)} for c in (20.,30.,40.)],
                      'missing_effectiveness':inspection_decision(.3,20.),
                      'changed_effectiveness_half':inspection_decision(.3,20.,effectiveness=.5)},indent=2))


if __name__=='__main__':
    main()

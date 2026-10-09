"""Offline WDBC protocol/export. Python 3.12, NumPy, scikit-learn.
Run: python decision-tree-wdbc-experiment.py --output decision-tree-wdbc-models.json
"""
import argparse
import json
import platform
from pathlib import Path
import numpy as np
import sklearn
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import log_loss, accuracy_score, confusion_matrix


def export_tree(estimator):
    tree = estimator.tree_
    return {name: getattr(tree, name).tolist() for name in [
        'children_left','children_right','feature','threshold','value','n_node_samples','weighted_n_node_samples']}


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='decision-tree-wdbc-models.json')
    args = parser.parse_args()
    data = load_breast_cancer()
    X = data.data; y = (data.target == 0).astype(int)  # malignant becomes 1
    development, test = train_test_split(np.arange(len(y)), test_size=114, stratify=y, random_state=42)
    train, validation = train_test_split(development, test_size=114, stratify=y[development], random_state=43)
    recipes = [
        ('tree-depth-2', DecisionTreeClassifier(max_depth=2, random_state=3)),
        ('tree-depth-4', DecisionTreeClassifier(max_depth=4, random_state=3)),
        ('forest-leaf-2', RandomForestClassifier(n_estimators=100,min_samples_leaf=2,max_features='sqrt',random_state=3,n_jobs=1)),
        ('forest-leaf-8', RandomForestClassifier(n_estimators=100,min_samples_leaf=8,max_features='sqrt',random_state=3,n_jobs=1)),
    ]
    fitted = []; reports = []
    for name, model in recipes:
        model.fit(X[train], y[train])
        probability = model.predict_proba(X[validation])
        score = float(log_loss(y[validation], probability, labels=[0,1]))
        reports.append({'name': name, 'validationLogLoss': score})
        fitted.append(model)
    chosen = min(range(len(reports)), key=lambda index: reports[index]['validationLogLoss'])
    selected = fitted[chosen]  # remains fitted on training only
    probability = selected.predict_proba(X[test]); prediction = selected.predict(X[test])
    prior = float(y[train].mean())
    baseline = np.tile([1-prior,prior], (len(test),1))
    test_report = {'accuracy':float(accuracy_score(y[test],prediction)),
        'logLoss':float(log_loss(y[test],probability,labels=[0,1])),
        'confusion':confusion_matrix(y[test],prediction,labels=[0,1]).tolist(),
        'baselineAccuracy':float(np.mean(y[test] == int(prior > .5))),
        'baselineLogLoss':float(log_loss(y[test],baseline,labels=[0,1]))}
    artifact = {'dataset': {'name':'Wisconsin Diagnostic Breast Cancer','doi':'10.24432/C5DW2B',
        'license':'CC BY 4.0','source':'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic',
        'loader':'sklearn.datasets.load_breast_cancer','positiveClass':'malignant','rows':len(y),'features':X.shape[1]},
        'environment':{'python':platform.python_version(),'numpy':np.__version__,'sklearn':sklearn.__version__},
        'splits':{'train':train.tolist(),'validation':validation.tolist(),'test':test.tolist()},
        'features':data.feature_names.tolist(),'X':X.tolist(),'y':y.tolist(),
        'reports':reports,'selected':chosen,'prior':prior,'testReport':test_report,
        'testProbabilities':probability.tolist(),
        'models':[{'name':name,'trees':[export_tree(tree) for tree in (model.estimators_ if hasattr(model,'estimators_') else [model])],
            'validationProbabilities':model.predict_proba(X[validation]).tolist()} for (name,_),model in zip(recipes,fitted)]}
    Path(args.output).write_text(json.dumps(artifact, separators=(',',':')),encoding='utf-8')
    print('split:',len(train),len(validation),len(test),'positive train prior:',prior)
    for report in reports:
        print(report['name'], 'validation log loss:',f"{report['validationLogLoss']:.6f}")
    print('selected:',reports[chosen]['name'])
    print('test:',json.dumps(test_report,sort_keys=True))


if __name__ == '__main__':
    run()

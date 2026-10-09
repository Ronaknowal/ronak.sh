"""One predeclared CPU study with disjoint exact-composition group roles.

Run offline: python -B concrete-strength-workflow.py --data concrete-data.csv
           --output concrete-study
Output must be a new empty directory. Predictions describe this data/split,
not a construction-safety decision or an equal-budget engine ranking.
"""
from pathlib import Path
from decimal import Decimal
import argparse,csv,hashlib,json,platform
import numpy as np
import sklearn,xgboost,lightgbm,catboost,joblib
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression

DATA_SHA='8d4b15b6fc68cd932d745cbd663d5ceae66dd54422e99c1e4865f2936ab7e2af'
FEATURES=['Cement','Blast Furnace Slag','Fly Ash','Water','Superplasticizer',
          'Coarse Aggregate','Fine Aggregate','Age']
TARGET='Concrete compressive strength'


def save_json(path,value):
    path.write_text(json.dumps(value,indent=2,allow_nan=False)+'\n',encoding='utf-8')


def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()


def group_roles(rows):
    keys=[tuple(Decimal(row[name]) for name in FEATURES[:7]) for row in rows]
    unique=sorted(set(keys))
    if len(unique)!=427: raise ValueError('this protocol expects the declared 427 exact-composition groups')
    order=np.random.default_rng(73).permutation(len(unique))
    role_by_group={int(group):('test' if j<85 else 'validation' if j<153 else 'train') for j,group in enumerate(order)}
    index={key:i for i,key in enumerate(unique)}
    ids=np.array([index[key] for key in keys])
    roles=np.array([role_by_group[int(group)] for group in ids])
    return ids,roles,[[str(value) for value in key] for key in unique]


def metrics(y,prediction):
    residual=np.asarray(y)-np.asarray(prediction)
    return {'rmse':float(np.sqrt(np.mean(residual**2))),'mae':float(np.mean(np.abs(residual)))}


def tree_configuration(engine,depth):
    common={'learning_rate':.05,'max_depth':depth,'n_estimators':300,'random_state':73,'n_jobs':1}
    if engine=='xgboost':
        return {**common,'objective':'reg:squarederror','eval_metric':'rmse',
                'tree_method':'hist','reg_lambda':1.,'reg_alpha':0.,'gamma':0.,
                'subsample':1.,'colsample_bytree':1.,'colsample_bylevel':1.,
                'colsample_bynode':1.,'early_stopping_rounds':20}
    if engine=='lightgbm':
        return {**common,'objective':'regression','metric':'rmse','boosting_type':'gbdt',
                'num_leaves':2**depth,'reg_lambda':1.,'reg_alpha':0.,
                'subsample':1.,'subsample_freq':0,'colsample_bytree':1.,
                'deterministic':True,'force_col_wise':True,'verbosity':-1}
    return {'iterations':300,'learning_rate':.05,'depth':depth,'random_seed':73,
            'thread_count':1,'loss_function':'RMSE','eval_metric':'RMSE',
            'l2_leaf_reg':1.,'grow_policy':'SymmetricTree','boosting_type':'Plain',
            'bootstrap_type':'No','rsm':1.,'random_strength':0.,
            'allow_writing_files':False,'verbose':False}


def fit_tree(engine,config,Xtrain,ytrain,Xval,yval):
    if engine=='xgboost':
        model=xgboost.XGBRegressor(**config).fit(Xtrain,ytrain,eval_set=[(Xval,yval)],verbose=False)
        curve=model.evals_result()['validation_0']['rmse']; best=int(model.best_iteration)+1
        stored=int(model.get_booster().num_boosted_rounds())
    elif engine=='lightgbm':
        model=lightgbm.LGBMRegressor(**config).fit(Xtrain,ytrain,eval_set=[(Xval,yval)],
            callbacks=[lightgbm.early_stopping(20,first_metric_only=True,min_delta=0.,verbose=False),lightgbm.log_evaluation(0)])
        curve=model.evals_result_['valid_0']['rmse']; best=int(model.best_iteration_)
        stored=int(model.booster_.current_iteration())
    else:
        model=catboost.CatBoostRegressor(**config).fit(Xtrain,ytrain,eval_set=(Xval,yval),
            early_stopping_rounds=20,use_best_model=False,verbose=False)
        curve=model.get_evals_result()['validation']['RMSE']; best=int(model.get_best_iteration())+1
        stored=int(model.tree_count_)
    return model,[float(value) for value in curve],best,stored


def predict_saved(model,engine,X,prefix):
    if engine=='xgboost': return model.predict(X,iteration_range=(0,prefix))
    if engine=='lightgbm': return model.predict(X,num_iteration=prefix)
    if engine=='catboost': return model.predict(X,ntree_start=0,ntree_end=prefix)
    if engine=='mean': return np.full(len(X),float(model))
    return model.predict(X)


def choose_validation(trials):
    minimum=min(trial['validation']['rmse'] for trial in trials)
    admissible=[trial for trial in trials if trial['validation']['rmse']<=minimum+1e-10]
    return min(admissible,key=lambda trial:tuple(trial['priority']))


def run(data,output):
    if digest(data)!=DATA_SHA: raise ValueError('CSV bytes must match the supplied UCI snapshot')
    with data.open(newline='',encoding='utf-8-sig') as stream:
        reader=csv.DictReader(stream); rows=list(reader)
        if reader.fieldnames!=FEATURES+[TARGET] or len(rows)!=1030:
            raise ValueError('the supplied schema must contain 1030 rows and the eight named predictors')
    if output.exists() and any(output.iterdir()): raise ValueError('use a new empty study directory; old evidence is never overwritten')
    output.mkdir(parents=True,exist_ok=True)
    ids,roles,keys=group_roles(rows)
    X=np.array([[float(row[name]) for name in FEATURES] for row in rows])
    train=np.flatnonzero(roles=='train'); val=np.flatnonzero(roles=='validation'); test=np.flatnonzero(roles=='test')
    ytrain=np.array([float(rows[i][TARGET]) for i in train]); yval=np.array([float(rows[i][TARGET]) for i in val])
    versions={'python':platform.python_version(),'numpy':np.__version__,'sklearn':sklearn.__version__,
        'xgboost':xgboost.__version__,'lightgbm':lightgbm.__version__,'catboost':catboost.__version__}
    configurations=[{'engine':engine,'depth':depth,'parameters':tree_configuration(engine,depth)}
        for depth in [3,4] for engine in ['xgboost','lightgbm','catboost']]
    protocol={'dataset_sha256':DATA_SHA,'source_sha256':digest(Path(__file__)),
        'data_source':'https://archive.ics.uci.edu/dataset/165/concrete+compressive+strength',
        'license':'CC BY 4.0','collector':'I-Cheng Yeh (1998)','versions':versions,
        'feature_names':FEATURES,'feature_units':['kg/m^3']*7+['days'],'target_unit':'MPa',
        'group_definition':'exact Decimal seven ingredient fields; excludes Age; derived composition, not batch/site ID',
        'group_seed':73,'group_keys':keys,'row_group_ids':ids.tolist(),'row_roles':roles.tolist(),
        'row_counts':{role:int((roles==role).sum()) for role in ['train','validation','test']},
        'group_counts':{'train':274,'validation':68,'test':85},'configurations':configurations,
        'selection':'validation RMSE only, strict prefix improvement/patience20, cross-model ties within1e-10 prefer mean,linear,lower depth,xgboost,lightgbm,catboost',
        'baselines':['training mean','training-fitted StandardScaler + LinearRegression']}
    protocol_path=output/'protocol.json'; save_json(protocol_path,protocol)
    # Only training and validation targets are supplied to fitting and selection.
    models={}; trials=[]
    models['mean']=float(ytrain.mean())
    models['linear']=make_pipeline(StandardScaler(),LinearRegression()).fit(X[train],ytrain)
    for name,priority in [('mean',[0,0,0]),('linear',[1,0,0])]:
        prediction=predict_saved(models[name],name,X[val],None)
        trials.append({'name':name,'engine':name,'depth':None,'priority':priority,'prefix':None,
            'stored_rounds':0,'validation_history':[],'validation':metrics(yval,prediction)})
    for trial in configurations:
        engine,depth=trial['engine'],trial['depth']; name=f'{engine}-depth{depth}'
        model,curve,best,stored=fit_tree(engine,trial['parameters'],X[train],ytrain,X[val],yval)
        models[name]=model
        prediction=predict_saved(model,engine,X[val],best)
        trials.append({'name':name,'engine':engine,'depth':depth,'priority':[2,depth,['xgboost','lightgbm','catboost'].index(engine)],
            'parameters':trial['parameters'],'prefix':best,'best_index':best-1,
            'stored_rounds':stored,'evaluated_rounds':len(curve),'validation_history':curve,
            'validation':metrics(yval,prediction)})
        print(name,'selected prefix',best,'stored',stored,'validation RMSE',trials[-1]['validation']['rmse'],flush=True)
    selected=choose_validation(trials)
    lock={'protocol_sha256':digest(protocol_path),'trials':trials,'selected_name':selected['name'],
          'selected_prefix':selected['prefix'],'test_labels_evaluated':False}
    lock_path=output/'selection-lock.json'; save_json(lock_path,lock)
    # This immutable lock is written before any test target vector or test metric.
    ytest=np.array([float(rows[i][TARGET]) for i in test])
    test_predictions={}
    for trial in trials:
        prediction=predict_saved(models[trial['name']],trial['engine'],X[test],trial['prefix'])
        test_predictions[trial['name']]=prediction
        trial['test']=metrics(ytest,prediction)
    chosen=test_predictions[selected['name']]
    errors=[{'csv_line':int(i)+2,'group_id':int(ids[i]),'inputs':X[i].tolist(),
             'observed':float(ytest[j]),'prediction':float(chosen[j]),'residual':float(ytest[j]-chosen[j])}
            for j,i in enumerate(test)]
    result={'protocol_sha256':digest(protocol_path),'selection_lock_sha256':digest(lock_path),
        'selected_name':selected['name'],'selected_prefix':selected['prefix'],'trials':trials,
        'selected_test_rows':errors,'interpretation':'descriptive predeclared comparators; test scores do not replace the locked validation selection'}
    save_json(output/'study.json',result)
    joblib.dump({'model':models[selected['name']],'engine':selected['engine'],'prefix':selected['prefix'],
        'feature_names':FEATURES,'versions':versions,'selection_lock_sha256':digest(lock_path)},output/'selected-model.joblib')
    print('row counts:',protocol['row_counts'])
    print('locked selection:',selected['name'],selected['prefix'])
    print('selected test RMSE/MAE:',selected['test'])
    print('first actual test prediction:',errors[0])
    return result


if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--data',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True); args=parser.parse_args()
    run(args.data,args.output)

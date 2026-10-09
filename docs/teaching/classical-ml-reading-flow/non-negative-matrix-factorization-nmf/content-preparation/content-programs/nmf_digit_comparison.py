"""A NEW predeclared rank-six study, separate from recorded rank-eight results."""
from pathlib import Path
from io import BytesIO
import json, platform, warnings
import numpy as np
import sklearn
from sklearn.decomposition import NMF, PCA
from sklearn.model_selection import train_test_split
from nmf_saved_digits import verified_bytes, CSV_SHA256, SAVED_SHA256


def study(directory=None):
    directory=Path(__file__).resolve().parent if directory is None else Path(directory)
    raw=np.loadtxt(BytesIO(verified_bytes(directory/'digits-300.csv',CSV_SHA256)),delimiter=',',skiprows=1)
    saved=json.loads(verified_bytes(directory/'nmf_saved_state.json',SAVED_SHA256))
    source_ids,labels=raw[:,0].astype(int),raw[:,1].astype(int)
    x=raw[:,2:]/16.0
    train,rest=train_test_split(np.arange(len(x)),test_size=.4,random_state=19,stratify=labels)
    validation,test=train_test_split(rest,test_size=.5,random_state=19,stratify=labels[rest])
    if raw.shape!=(300,66) or not np.isfinite(raw).all() or (raw!=np.floor(raw)).any():
        raise ValueError('Unexpected attributed measurement table')
    if not np.array_equal(source_ids[test],[row['sourceRow'] for row in saved['test']]):
        raise ValueError('The exact historical reserved source-ID order must be retained')
    # This configuration is declared before examining any reserved reconstruction.
    nmf=NMF(n_components=6,init='nndsvda',solver='cd',beta_loss='frobenius',
            random_state=23,max_iter=3000,tol=1e-6,alpha_W=0,alpha_H=0,l1_ratio=0)
    pca=PCA(n_components=6,svd_solver='full',whiten=False)
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter('always')
        train_w=nmf.fit_transform(x[train])
        validation_w=nmf.transform(x[validation])
        test_w=nmf.transform(x[test])
        pca.fit(x[train])
        test_z=pca.transform(x[test])
    mean=x[train].mean(axis=0)
    nmf_images=test_w@nmf.components_
    pca_images=pca.inverse_transform(test_z)
    mean_images=np.broadcast_to(mean,nmf_images.shape)
    mse=lambda observed,predicted:float(np.mean((observed-predicted)**2))
    selected=[]
    for source in (242,256):
        at=int(np.flatnonzero(source_ids[test]==source)[0])
        selected.append({'source_row':source,'label':int(labels[test[at]]),'reserved_position':at,
                         'observed':x[test[at]].tolist(),'mean':mean.tolist(),
                         'PCA6':pca_images[at].tolist(),'NMF6':nmf_images[at].tolist(),
                         'PCA6_coordinates':test_z[at].tolist(),'NMF6_amounts':test_w[at].tolist(),
                         'rowMSE':{name:mse(x[test[at]],image) for name,image in
                                   [('mean',mean),('PCA6',pca_images[at]),('NMF6',nmf_images[at])]}})
    return {'role':'new predeclared rank6/seed23 controlled study; not recovered historical PCA8 factors',
            'versions':{'python':platform.python_version(),'numpy':np.__version__,'sklearn':sklearn.__version__},
            'datasetSha256':CSV_SHA256,'fixedScale':16,'rank':6,'seed':23,
            'settings':{'NMF':nmf.get_params(),'PCA':pca.get_params()},
            'sourceIDs':{name:source_ids[indices].tolist() for name,indices in [('train',train),('validation',validation),('test',test)]},
            'dictionaryFitRows':180,'reservedRows':60,'selectionOnReservedRows':False,
            'nmfFitIterations':int(nmf.n_iter_),'nmfCapReached':bool(nmf.n_iter_>=nmf.max_iter),
            'warnings':[{'category':item.category.__name__,'message':str(item.message)} for item in caught],
            'NMFTrainMSE':mse(x[train],train_w@nmf.components_),
            'NMFValidationMSE':mse(x[validation],validation_w@nmf.components_),
            'testMSE':{name:mse(x[test],image) for name,image in [('mean',mean_images),('PCA6',pca_images),('NMF6',nmf_images)]},
            'predictionRanges':{name:[float(image.min()),float(image.max())] for name,image in [('mean',mean_images),('PCA6',pca_images),('NMF6',nmf_images)]},
            'PCAMean':pca.mean_.tolist(),'PCAComponents':pca.components_.tolist(),
            'NMFDictionary':nmf.components_.tolist(),'selected':selected}


def main():
    print(json.dumps(study(),indent=2,allow_nan=False))


if __name__=='__main__':
    main()

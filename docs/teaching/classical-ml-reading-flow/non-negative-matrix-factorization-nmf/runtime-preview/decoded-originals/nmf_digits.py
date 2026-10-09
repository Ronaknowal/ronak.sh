import numpy as np
from sklearn.decomposition import NMF, PCA
from sklearn.model_selection import train_test_split

data = np.loadtxt('digits-300.csv', delimiter=',', skiprows=1)
source_rows, labels = data[:, 0].astype(int), data[:, 1].astype(int)
X = data[:, 2:] / 16
train, rest = train_test_split(np.arange(len(X)), test_size=.4,
                               random_state=19, stratify=labels)
validation, test = train_test_split(rest, test_size=.5,
                                    random_state=19, stratify=labels[rest])

for k in (1, 4, 8, 16):
    for seed in (7, 19):
        model = NMF(n_components=k, init='random', solver='cd',
                    random_state=seed, max_iter=2000, tol=1e-5)
        W_train = model.fit_transform(X[train])
        W_validation = model.transform(X[validation])
        H = model.components_
        train_mse = np.mean((X[train] - W_train @ H) ** 2)
        validation_mse = np.mean((X[validation] - W_validation @ H) ** 2)
        print(k, seed, round(train_mse, 6), round(validation_mse, 6))

# A fixed eight-component comparison chosen for inspectable image panels.
nmf = NMF(n_components=8, init='random', solver='cd', random_state=19,
          max_iter=2000, tol=1e-5).fit(X[train])
W_test = nmf.transform(X[test])
nmf_reconstruction = W_test @ nmf.components_
pca = PCA(n_components=8, svd_solver='full').fit(X[train])
pca_reconstruction = pca.inverse_transform(pca.transform(X[test]))
mean_reconstruction = np.repeat(X[train].mean(axis=0)[None, :], len(test), axis=0)
for name, reconstruction in [('mean', mean_reconstruction),
                             ('PCA8', pca_reconstruction),
                             ('NMF8', nmf_reconstruction)]:
    print(name, round(np.mean((X[test] - reconstruction) ** 2), 6))
print('first held-out source row', source_rows[test[0]])
print('first reconstructed image')
print(nmf_reconstruction[0].reshape(8, 8).round(2))
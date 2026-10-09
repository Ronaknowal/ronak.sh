import numpy as np
from sklearn.kernel_approximation import Nystroem, RBFSampler
from sklearn.linear_model import SGDOneClassSVM


def main():
    reference = np.array([[-1., 0.], [-.7, .2], [0., .4], [.4, .1], [.8, -.1], [1.2, .2]])
    queries = np.array([[0., .2], [3., 3.]])
    for name, mapper in [('Nystroem', Nystroem(gamma=.5, n_components=4, random_state=17)),
                         ('RFF', RBFSampler(gamma=.5, n_components=8, random_state=17))]:
        mapped = mapper.fit_transform(reference)
        model = SGDOneClassSVM(nu=.3, random_state=17, max_iter=2000, tol=1e-5).fit(mapped)
        decision = model.decision_function(mapper.transform(queries))
        print(name, 'reference map shape:', mapped.shape, 'iterations:', model.n_iter_)
        print('approximate decisions:', np.round(decision, 9).tolist())


if __name__ == '__main__':
    main()

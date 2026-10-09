from sklearn.mixture import BayesianGaussianMixture

for concentration in [0.01, 1., 10.]:
    bayesian = BayesianGaussianMixture(
        n_components=6, covariance_type="full",
        weight_concentration_prior_type="dirichlet_process",
        weight_concentration_prior=concentration,
        n_init=3, random_state=16, reg_covar=1e-4,
        tol=1e-6, max_iter=1000,
    ).fit(Z[train])
    print(concentration, np.round(bayesian.weights_, 4),
          int((bayesian.weights_ > 0.01).sum()),
          int((bayesian.weights_ > 0.05).sum()),
          bayesian.converged_)
"""Answer-only new constructed density protocol, including a shifted stress set."""
import numpy as np
from sklearn.mixture import GaussianMixture


def main():
    train = np.array([-3, -2.5, -2, -1.5, 1.5, 2, 2.5, 3])[:, None]
    validation = np.array([-2.25, -1.75, 1.75, 2.25])[:, None]
    reserved_stress = np.array([-.5, 0, .5, 1])[:, None]
    outcomes = []
    models = []
    for count, means in [(1, [[0]]), (2, [[-2], [2]])]:
        model = GaussianMixture(n_components=count, covariance_type="full", n_init=1,
                                weights_init=np.ones(count) / count, means_init=np.array(means),
                                precisions_init=np.ones((count, 1, 1)), reg_covar=.05,
                                random_state=16, tol=1e-8, max_iter=50).fit(train)
        models.append(model)
        outcome = {"K": count, "train_score": model.score(train), "validation_score": model.score(validation),
                   "converged": bool(model.converged_), "iterations": int(model.n_iter_)}
        outcomes.append(outcome)
        print("new constructed candidate", outcome)
    selected = max(range(len(models)), key=lambda i: outcomes[i]["validation_score"])
    print("validation-selected K", outcomes[selected]["K"])
    print("reserved shifted stress score", models[selected].score(reserved_stress))
    print("baseline shifted stress score", models[0].score(reserved_stress))
    print("shifted stress difference", models[selected].score(reserved_stress) - models[0].score(reserved_stress))
    print("new query density/ID", models[selected].score_samples([[.25]]).tolist(), models[selected].predict([[.25]]).tolist())


if __name__ == "__main__":
    main()

"""Calculate a supplied day-2 tied subset; no coefficients are fitted."""

from math import exp, log

import numpy as np

from discrete_cox_ties import discrete_tied_terms, log_subset_denominator


def main():
    # Members B,C,D,E,F from the A-F table; B and C fail at day 2.
    features = np.array([[0.0], [1.0], [-1.0], [0.0], [1.0]])
    deaths = np.array([True, True, False, False, False])
    beta = np.array([log(2.0)])
    log_weights = features[:, 0] * beta[0]
    weights = np.exp(log_weights)
    risk_weight = float(np.sum(weights))
    death_weight = float(np.sum(weights[deaths]))
    numerator = float(np.prod(weights[deaths]))
    breslow = numerator / risk_weight**2
    efron = numerator / (risk_weight * (risk_weight - death_weight / 2))
    terms = discrete_tied_terms(beta, features, deaths)
    print("risk members B,C,D,E,F; weights:", weights.tolist())
    print(f"Breslow factor: {breslow:.12f}")
    print(f"Efron factor: {efron:.12f}")
    print(f"discrete subset denominator: {exp(log_subset_denominator(log_weights, 2)):.12f}")
    print(f"discrete subset factor: {exp(terms.log_likelihood):.12f}")
    print(f"log subset factor: {terms.log_likelihood:.12f}")
    print(f"subset score: {terms.score[0]:.12f}")
    print(f"subset information: {terms.information[0, 0]:.12f}")


if __name__ == "__main__":
    main()

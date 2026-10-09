"""Read recorded finite-sample and fold outcomes after §§8 and10.4."""

from saved_pca_queries import load_state


def main():
    state = load_state()
    print(
        "gaussian_saved_first_two_population_share",
        sum(state["gaussianSpectrum"]["ratios"][:2]),
        2 / 20,
    )
    for key, value in state["prediction"]["results"].items():
        print("saved_prediction", key, value)


if __name__ == "__main__":
    main()

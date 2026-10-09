# Iris data used by Data Processing & Loading

This is a byte-identical copy of `/learn-assets/mini-batches-training-loops-gradient-accumulation/iris.csv`, reused 28 September 2026. That published packet exports the corrected scikit-learn 1.9.1 Iris dataset. There are 150 rows, IDs 1–150, four centimeter measurements and class IDs 0–2. Source values and order are unchanged here.

Attribution: R. A. Fisher's Iris measurements as distributed by the UCI Machine Learning Repository, CC BY 4.0: https://archive.ics.uci.edu/dataset/53/iris . The scikit-learn notes explain the corrected-copy distinction: https://scikit-learn.org/stable/datasets/toy_dataset.html#iris-dataset . Original retained provenance: `/learn-assets/mini-batches-training-loops-gradient-accumulation/data-provenance.md`.

This lesson's program places IDs divisible by five in validation and fits normalization on the other 120 rows. It evaluates data-pipeline invariants, not classifier performance or a general deployment-valid split. The sepal-area feature is a constructed rectangular proxy, not an additional measurement.

# Corrected Iris measurements

Source: UCI Machine Learning Repository, [Iris](https://archive.ics.uci.edu/dataset/53/iris), DOI 10.24432/C56C76. The corrected `bezdekIris.data` was retained by the earlier Eigenvalues/Eigenvectors lesson; this packet reuses its exact CSV, without redownloading or altering measurements. Licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). See `iris-provenance.json` for archive provenance and the original extraction record.

The CSV SHA-256 is `5a8853b2e82f9d021e5843af7d647339e359b25e037ec6e87e23ca9e91507821`. It has 150 rows, fifty each of setosa, versicolor and virginica; four length/width measurements use centimetres. One-based data-row IDs are retained independently of plotted coordinates and role colours.

The main application selects setosa rows 1–50 and versicolor rows 51–100, comparing sepal or petal coordinates with physical bandwidth one centimetre. The changed exercise compares versicolor rows 51–100 with virginica rows 101–150 on petal coordinates at .75 centimetres. Neither calculation infers a randomized sampling design or population significance from species labels. Identical coordinates are not jittered in the numerical comparison.

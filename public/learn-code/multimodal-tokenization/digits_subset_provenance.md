# Offline optical-digits subset

Source: E. Alpaydin and C. Kaynak, **Optical Recognition of Handwritten Digits**,
UCI Machine Learning Repository, dataset80 (1998),
https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits
DOI: https://doi.org/10.24432/C50P49 . License: Creative Commons Attribution4.0
International, https://creativecommons.org/licenses/by/4.0/ . License checked
6October2026 on UCI's dataset page.

The data collectors studied handwritten-digit recognition. Their processed
features are an8×8 grid of block counts, each an integer0…16, derived from
handwritten digit bitmaps. Here these small grayscale grids let us inspect
reconstruction and discrete code usage. This teaching experiment does not
evaluate digit classification or reproduce a published codec result.

`digits_subset.csv` is retained offline from `sklearn.datasets.load_digits()`
in scikit-learn1.9.1. Scikit-learn's bundled1797-row set corresponds to UCI's
test set, as documented at
https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html .
Our experiment makes its own **local** fit/heldout split within that set:
for each digit0…9, take the first40 observations in source order; the first32
are `train`, the final8 are `heldout`. This produces320 train and80 heldout
images with disjoint `source_index` values. Labels are retained metadata and
are not inputs or reconstruction targets for the VQ-VAE.

The CSV keeps the original integer pixel values and source row indices.
`vector_quantization.py` divides the pixels by16 to obtain floats in[0,1].
There is no learned preprocessing or dataset download in the program.
Only the320 train images update parameters. Heldout images are evaluated
before/after training without gradients; they do not select epochs or
hyperparameters. This deterministic small selection is not an unbiased
benchmark split. Reported MSE and code usage describe this experiment only.

Download this CSV beside `vector_quantization.py`; `--data` selects another
file with the same columns. Keep this attribution with redistributed copies.

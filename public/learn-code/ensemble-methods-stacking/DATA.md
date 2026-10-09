# WDBC data supplied with the Ensemble Methods example

Wolberg, W., Mangasarian, O., Street, N., & Street, W. (1993).
*Breast Cancer Wisconsin (Diagnostic)* [Dataset]. UCI Machine Learning Repository.
[DOI 10.24432/C5DW2B](https://doi.org/10.24432/C5DW2B).
[Dataset description](https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic).

UCI lists this dataset under the
[Creative Commons Attribution 4.0 International license](https://creativecommons.org/licenses/by/4.0/).
The supplied offline CSV is the scikit-learn 1.9.1 distribution of the 569 rows
and 30 numeric descriptors derived from digitized fine-needle-aspirate images
of cell nuclei. UCI records no missing values. The identifier is not a feature.
The CSV's first line records dimensions and original class names; each remaining
line contains 30 features followed by the original numeric target.

The original encoding is 0 malignant, 1 benign. The example explicitly computes
`y = 1 - original_target`, making its positive class 1 malignant and class 0
benign. Feature values are otherwise retained. Matrix, original CSV, transformed
label and exact row-split hashes/identities are checked against the accompanying
protocol before fitting. The source CSV SHA256 is
`ff5fc1f247213db5fd49539610bcd5a98033bbd0307524fde3127251752aa073`.

This is the fixed random-row modeling comparison declared in the lesson.
The supplied metadata does not establish independent entity or time groups.
Edited feature vectors demonstrate a computation from saved state; they are
not newly measured or necessarily plausible specimens. Its illustrative action
cost is a numerical teaching choice.

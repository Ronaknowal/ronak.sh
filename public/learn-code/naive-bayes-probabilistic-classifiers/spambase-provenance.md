# Spambase offline provenance

Creators: Mark Hopkins, Erik Reeber, George Forman and Jaap Suermondt.
Spambase (1999), UCI Machine Learning Repository, DOI
https://doi.org/10.24432/C53G6X. Dataset page:
https://archive.ics.uci.edu/dataset/94/spambase.

Official archive: https://archive.ics.uci.edu/static/public/94/spambase.zip.
The retained research packet fetched and inspected this archive on 6 October
2026. Archive SHA-256:
813ac1df8effac70463c09c9c4b11e8803eefcab54771af66150852bcdcd1636.
The accompanying `.data`, `.names` and case-sensitive `.DOCUMENTATION` files
are extracted byte for byte; no input rows or labels are changed. Data SHA-256:
b1ef93de71f97714d3d7d4f58fc9f718da7bbc8ac8a150eff2778616a8097b12.

UCI licenses the dataset under Creative Commons Attribution 4.0 International;
see `SPAMBASE-LICENSE.txt`. The `.names` and `.DOCUMENTATION` retain original
descriptions, creator context, units and collection limitations. The supplied
numeric payload contains 4,601 rows, 57 finite nonnegative features and one
ham/spam label. The webpage marks missingness “Yes”; the original documentation
says “None”; this exact payload has no missing numeric entries. No missing-value
cleanup is applied. The first 54 coordinates are word/character percentages;
the last three summarize uninterrupted capital-letter runs.

The new lesson study groups identical complete feature vectors before splitting
and transforms coordinates inside declared model routes. Its generated results
and saved state are new lesson outputs; they are not original UCI files.
All input rows, including three exact feature groups with conflicting labels,
are retained. Exact-vector grouping cannot recover sender, campaign or time.
The ham collection contains personal indicators such as george and 650; these
historical data support a reproducible teaching comparison, with collection bias
reported alongside its results.

# Offline Palmer measurements

`penguins.csv` is the simplified Palmer penguins dataset distributed under CC0 by the palmerpenguins project. It is reused byte-for-byte from the retained Entropy input. SHA256: `f204db2c753b0937caac3cb35258562c14f073e4bbc76be24b4c51ce22767a93` (15,241 bytes).

[The dataset documentation](https://allisonhorst.github.io/palmerpenguins/) identifies the release and collectors. [Gorman, Williams and Fraser (2014)](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0090081) describes the field study. This lesson's engineering storage question is separate from that ecological analysis.

All 344 records are considered. Bill length is missing at one-based data rows 4 and 272, leaving 342 values. Parsing uses exact decimal tenths of a millimetre. Original row identities are retained for reporting, but the binary teaching format transmits only the retained numeric sequence, its count, quantization step and specified stream syntax. Missing-row positions, species and other fields are not encoded. Error compares decoded values with recorded values, not true anatomy. Keep this attribution with the dataset.

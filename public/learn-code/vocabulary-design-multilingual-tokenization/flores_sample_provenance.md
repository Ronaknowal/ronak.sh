# FLORES tokenizer teaching sample

Source: [FLORES-200, NLLB Team and Meta AI](https://github.com/facebookresearch/flores/tree/main/flores200), original 2022 release.
Retrieved 28 September 2026 from `https://dl.fbaipublicfiles.com/nllb/flores200_dataset.tar.gz`.
The original repository is archived; [Open Language Data Initiative](https://github.com/openlanguagedata/flores) maintains newer versions. This lesson intentionally pins the original release.

License: **Creative Commons Attribution-ShareAlike 4.0 International**.
[License terms](https://creativecommons.org/licenses/by-sa/4.0/) and [upstream license declaration](https://github.com/facebookresearch/flores#licenses).
Attribution: NLLB Team, *No Language Left Behind: Scaling Human-Centered Machine Translation* (2022), and the source article authors linked by each record's `source_url`.
This redistributed JSON adaptation is supplied under the same CC BY-SA 4.0 license.

Transformations: select English (`eng_Latn`), Hindi (`hin_Deva`) and Simplified Chinese (`zho_Hans`); select the first 100 lines of `dev` and the first 20 lines of `devtest` in each language; preserve each text verbatim as a Unicode JSON string. Add source split, one-based sentence ID, language, original article URL and the local role `train`/`heldout`. No translation, punctuation editing, normalization or word-space insertion was applied.

There are 360 records: 300 training and 60 held-out. Each split uses the same sentence IDs across all three languages. The teaching experiment reuses part of a public evaluation dataset as a tiny training fixture; it is **not** a valid FLORES leaderboard evaluation. The local holdout is untouched during tokenizer fitting, but adjacent sentences and shared domains limit independence; this is a reproducible mechanism study, not an estimate of population-wide language quality.

Archive SHA-256: `b8b0b76783024b85797e5cc75064eb83fc5288b41e9654dabc7be6ae944011f6`.
Sample SHA-256 (exact distributed file bytes with LF line endings, enforced by .gitattributes): `3d5295ea2bebf100a0f95463f20fd0386665c84b8604fd6f65c7e9a58790a0d7`.

The synthetic `80:15:5` availability masses and resampling coefficients in the lesson are experimental controls, not measured web language shares.

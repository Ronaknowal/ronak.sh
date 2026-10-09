# Recorded transform example: provenance and attribution

Contains information from the [MIT-BIH Arrhythmia Database, version1.0.0](https://physionet.org/content/mitdb/1.0.0/), made available under the [Open Data Commons Attribution License, version1.0](https://physionet.org/content/mitdb/view-license/1.0.0/). Retain both links with this derivative and its plotted output.

Source record208, leadMLII, sampled at360Hz. SciPy's five-minute carrier selects original recording time19:35–24:35. This derivative selects its first2880 samples, indices0…2879, original time19:35–19:43. The timestamp of the final retained observation is7.997222222222222 seconds into that excerpt; N/fs is8 seconds. Values are in millivolts. No mean removal, detrending, downsampling or filtering.

Carrier [ecg.dat](https://raw.githubusercontent.com/scipy/dataset-ecg/main/ecg.dat) SHA256 `f20ad3365fb9b7f845d0e5c48b6fe67081377ee466c3a220b7f69f35c8958baf`; conversion matches the inspected SciPy helper, `(ADC-1024)/200.0`. The supplied CSV `mit-bih-208-first-eight-seconds.csv` SHA256 is `46c9d42c38f04d402456513935eb09c1450937de647dd83fba0fd1088f66b0a4`. It has sample_index/millivolts columns and fixed three-decimal values, preserving every selected measurement. Selected and verified7October2026; source identities are pinned rather than assuming the main-branch URL stays unchanged.

The database was created as standard material for arrhythmia-analysis research. The example here demonstrates finite Fourier inversion and window/density normalization, without interpreting individual beats or clinical outcomes. The hand-calculated few-tone example is a constructed signal; this record is a measured signal.

Original publication: Moody GB, Mark RG. The impact of the MIT-BIH Arrhythmia Database. IEEE Engineering in Medicine and Biology20(3):45–50,2001. [Database DOI](https://doi.org/10.13026/C2F305).

PhysioNet's current requested platform citation: Pollard T et al. PhysioNet as a global platform for biomedical research. Nature Health1,792–795,2026. [DOI](https://doi.org/10.1038/s44360-026-00096-z).

The downloaded official licence HTML is preserved in the authoring record as `mit-bih-ODC-license-source.html`. The complete official licence URI above applies to the distributed derivative; the raw SciPy carrier and local caches are not proposed public runtime assets.

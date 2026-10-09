"""N12: complete optional MNE1.13.2 route, source-only in the author environment.

The component exclusion is a constructed operation, not clinical identification.
Run only after reconciling the optional environment and inspecting its warnings.
"""
import numpy as np


def main():
    import mne
    from mne.preprocessing import ICA
    if mne.__version__ != "1.13.2":
        raise RuntimeError("Reconcile this route against the installed MNE API before running")
    sfreq = 200.
    time = np.arange(4000)/sfreq
    sources = np.vstack([10e-6*np.sin(2*np.pi*7*time),
                         20e-6*np.sin(2*np.pi*13*time),
                         5e-6*np.sin(2*np.pi*19*time)])
    operator = np.array([[1., .5, 0.], [.2, 1., .3], [0., .4, 1.]])
    info = mne.create_info(["Fp1", "Fp2", "Cz"], sfreq=sfreq, ch_types="eeg")
    raw = mne.io.RawArray(operator@sources, info)
    raw.set_montage(mne.channels.make_standard_montage("standard_1020"))
    fit_raw = raw.copy().filter(l_freq=1., h_freq=None)
    ica = ICA(n_components=2, method="fastica", max_iter=1000, rng=7)
    ica.fit(fit_raw, picks="eeg")
    estimated = ica.get_sources(raw)
    print("channel_unit", "volts", "source_shape", estimated.get_data().shape,
          "retained_ICA_count", ica.n_components_, "iterations", ica.n_iter_)
    ica.plot_sources(raw, show=True)
    ica.plot_properties(fit_raw, picks=[0, 1], show=True)
    # Inspect both displays before assigning a real-world meaning. This fixture
    # demonstrates removal of coordinate zero only; it does not identify a blink.
    exclude = [0]
    residual_restored = ica.apply(raw.copy(), exclude=exclude, n_pca_components=None)
    retained_only = ica.apply(raw.copy(), exclude=exclude, n_pca_components=2)
    print("residual_policy_difference_volts_max", np.max(np.abs(residual_restored.get_data()-retained_only.get_data())))


if __name__ == "__main__":
    main()

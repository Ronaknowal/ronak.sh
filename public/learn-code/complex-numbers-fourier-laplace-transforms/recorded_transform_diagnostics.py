from pathlib import Path
import sys
import numpy as np
from scipy.signal import periodogram

data_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name('mit-bih-208-first-eight-seconds.csv')
record = np.genfromtxt(data_path, delimiter=',', names=True)
samples = record['millivolts']
if samples.size != 2880 or not np.all(np.isfinite(samples)):
    raise ValueError('the supplied 2880 finite measurements are required')
if not np.array_equal(record['sample_index'], np.arange(samples.size)):
    raise ValueError('sample indices must be the supplied consecutive grid')

sample_rate = 360
count = samples.size
indices = np.arange(count)
roundtrip = np.fft.irfft(np.fft.rfft(samples), n=count)
print('record:', count, 'samples;', count/sample_rate, 'seconds; last', f'{(count-1)/sample_rate:.9f}')
print('real-transform roundtrip:', np.max(abs(roundtrip-samples)) < 2e-14)

for window_name in ['rectangular', 'periodic-hann']:
    weights = np.ones(count) if window_name == 'rectangular' else .5-.5*np.cos(2*np.pi*indices/count)
    weight_energy = np.sum(weights**2)
    weighted_mean_square = np.sum((weights*samples)**2)/weight_energy
    for padded_count in [count, 4*count]:
        frequencies, density = periodogram(samples, fs=sample_rate, window=weights,
                                          nfft=padded_count, detrend=False,
                                          scaling='density', return_onesided=True)
        spacing = sample_rate/padded_count
        integrated = np.sum(density)*spacing
        spectrum = np.fft.rfft(weights*samples, n=padded_count)
        factors = np.full(spectrum.size, 2.0)
        factors[0] = 1
        if padded_count % 2 == 0:
            factors[-1] = 1
        direct_density = factors*abs(spectrum)**2/(sample_rate*weight_energy)
        print(f'{window_name}, M={padded_count}: spacing={spacing:.5f} Hz, integral={integrated:.9f} mV^2')
        print('  finite accounting:', abs(integrated-weighted_mean_square) < 2e-14,
              '; direct density:', np.max(abs(density-direct_density)) < 2e-14)

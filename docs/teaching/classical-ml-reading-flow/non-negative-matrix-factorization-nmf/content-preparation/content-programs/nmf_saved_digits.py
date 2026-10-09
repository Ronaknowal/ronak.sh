"""Offline inspection of the recorded digit factors; never fits a missing model."""
from dataclasses import dataclass
from pathlib import Path
import hashlib
import json
from types import MappingProxyType
import numpy as np

from nmf_arrays import nonnegative_table, read_only, reconstruction, require_finite
from nmf_factor_alignment import change_component_gain, contribution_totals, row_contribution

SAVED_SHA256 = '46f3dc0931e3ccddc30cc3e30bbb4d3f330bc35a4dccccef33f74a63472eddd0'
CSV_SHA256 = 'd93f963c4b2610eb07122a312eec3ddceac18a031477370d71e33835eced728e'


def verified_bytes(path, expected):
    value = Path(path).read_bytes()  # Missing payload is an error, never a fallback fit.
    if hashlib.sha256(value).hexdigest() != expected:
        raise ValueError(f"Recorded input identity differs: {Path(path).name}")
    return value


@dataclass(frozen=True)
class SavedDigits:
    dictionary: np.ndarray
    amounts: np.ndarray
    observations: np.ndarray
    source_rows: tuple
    labels: tuple
    row_lookup: object
    metadata: dict


def load_saved_digits(directory=None):
    directory = Path(__file__).resolve().parent if directory is None else Path(directory)
    saved_bytes = verified_bytes(directory/'nmf_saved_state.json', SAVED_SHA256)
    csv_bytes = verified_bytes(directory/'digits-300.csv', CSV_SHA256)
    saved = json.loads(saved_bytes)
    if saved['scale'] != 16 or saved['side'] != 8 or saved['fit']['k'] != 8 or saved['fit']['seed'] != 19:
        raise ValueError("Expected the recorded eight-component inspection model")
    if saved['datasetSha256'] != CSV_SHA256 or saved['splitSizes'] != {'train':180,'validation':60,'test':60}:
        raise ValueError("Recorded measurement/split identity differs")
    expected_header = ['source_row','digit'] + [f'pixel_{j}' for j in range(64)]
    if csv_bytes.decode('utf-8').splitlines()[0].split(',') != expected_header:
        raise ValueError("Unexpected CSV feature order")
    from io import BytesIO
    raw = np.loadtxt(BytesIO(csv_bytes), delimiter=',', skiprows=1)
    require_finite(raw, "Recorded CSV")
    if raw.shape != (300,66) or np.any(raw != np.floor(raw)):
        raise ValueError("Expected 300 integer-valued source/label/pixel rows")
    source_ids, labels, pixels = raw[:,0].astype(int), raw[:,1].astype(int), raw[:,2:]
    if len(set(source_ids.tolist())) != 300 or np.any(source_ids < 0):
        raise ValueError("Source IDs must be unique nonnegative indices")
    if np.any((labels < 0) | (labels > 9)) or np.any((pixels < 0) | (pixels > 16)):
        raise ValueError("Recorded label or block-count range differs")
    h = nonnegative_table(saved['dictionary'],64,require_rows=True)
    w = nonnegative_table(saved['activations'],8,require_rows=True)
    if h.shape != (8,64) or w.shape != (60,8) or len(saved['test']) != 60:
        raise ValueError("Recorded dictionary/amount/test shapes differ")
    csv_lookup = {int(source):i for i,source in enumerate(source_ids)}
    selected, selected_labels, selected_ids = [], [], []
    for row in saved['test']:
        source, label = row['sourceRow'], row['digit']
        if source not in csv_lookup:
            raise ValueError("Saved observation is absent from the supplied CSV")
        at = csv_lookup[source]
        if label != int(labels[at]) or not np.array_equal(row['pixels'],pixels[at]):
            raise ValueError("Saved source/label/pixel correspondence differs")
        selected.append(pixels[at]/16.0)
        selected_labels.append(label)
        selected_ids.append(source)
    if len(set(selected_ids)) != 60:
        raise ValueError("Saved observations must have distinct source IDs")
    return SavedDigits(read_only(h),read_only(w),read_only(np.array(selected)),
                       tuple(selected_ids),tuple(selected_labels),
                       MappingProxyType({source:i for i,source in enumerate(selected_ids)}),saved)


def describe_saved_row(saved, source_row, *, component=None, gain=1.0):
    if isinstance(source_row,(bool,np.bool_)) or not isinstance(source_row,(int,np.integer)):
        raise ValueError("Source row must be an integer ID")
    if int(source_row) not in saved.row_lookup:
        raise ValueError("Source row is not among the saved reserved observations")
    at = saved.row_lookup[int(source_row)]
    w, h, x = saved.amounts[at], saved.dictionary, saved.observations[at]
    totals = contribution_totals(w[None,:],h)[0]
    c = int(np.argmax(totals)) if component is None else component
    addend = row_contribution(w,h,c)
    base = reconstruction(w[None,:],h)[0]
    changed = change_component_gain(w,h,c,gain)
    residual, changed_residual = x-base,x-changed
    with np.errstate(over='ignore',invalid='ignore'):
        mse, changed_mse = float(np.mean(residual**2)),float(np.mean(changed_residual**2))
    require_finite([mse,changed_mse],"Saved descriptive MSE")
    return {'source_row':int(source_row),'digit':saved.labels[at],'component_index':int(c),
            'amounts':w.copy(),'contribution_totals':totals,'selected_contribution':addend,
            'observed':x.copy(),'reconstruction':base,'residual':residual,
            'changed_reconstruction':changed,'changed_residual':changed_residual,
            'mse':mse,'changed_mse':changed_mse,
            'largest_coefficient_index':int(np.argmax(w)),
            'largest_contribution_index':int(np.argmax(totals))}


def main():
    np.set_printoptions(precision=10,suppress=True,linewidth=120)
    saved = load_saved_digits()
    totals = contribution_totals(saved.amounts,saved.dictionary)
    disagreements = np.count_nonzero(np.argmax(saved.amounts,axis=1)!=np.argmax(totals,axis=1))
    print('recorded_model',saved.metadata['fit'],'rows',len(saved.source_rows))
    print('dictionary_range',float(saved.dictionary.min()),float(saved.dictionary.max()))
    print('coefficient_contribution_disagreements',int(disagreements),'of',len(saved.source_rows))
    for source,component in [(242,0),(256,7)]:
        report = describe_saved_row(saved,source,component=component,gain=0)
        print('source',source,'digit',report['digit'],'selected_component',component+1)
        print('amounts',report['amounts'])
        print('contribution_totals',report['contribution_totals'])
        print('largest_coefficient',report['largest_coefficient_index']+1,
              'largest_total_contribution',report['largest_contribution_index']+1)
        for name in ['observed','selected_contribution','reconstruction','residual','changed_reconstruction']:
            print(name,report[name].reshape(8,8))
        print('mse_before',report['mse'],'mse_after_removal',report['changed_mse'])
        print('prediction_range',float(report['reconstruction'].min()),float(report['reconstruction'].max()))
    null = describe_saved_row(saved,242,component=7,gain=0)
    print('row242_C8_zero_change',np.array_equal(null['reconstruction'],null['changed_reconstruction']))


if __name__ == '__main__':
    main()

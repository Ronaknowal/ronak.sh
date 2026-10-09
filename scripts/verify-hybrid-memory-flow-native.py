"""Fresh, bounded nonwriter oracles for new reading-flow traces. Never train."""
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

import numpy as np
import torch

root = Path(__file__).resolve().parents[1]
draft = root / 'docs/teaching/drafts/hybrid-ssm-transformer-architectures-jamba'
record = root / 'docs/teaching/deep-learning-beginner/hybrid-ssm-transformer-architectures-jamba'
sys.dont_write_bytecode = True
sys.path.insert(0, str(draft))
from stroke_models import load_fit  # imports do not invoke the guarded training entry point
torch.set_num_threads(1)

parameters = {
    'inputWeight': [[1, 0], [0, 1], [.5, 0], [0, -1]],
    'convolutionWeight': [[.25, .5, 1], [.5, -.25, 1]],
    'deltaWeight': [[.1, 0], [0, .2]], 'deltaBias': [-1, -.5],
    'writeWeight': [[.5, 0], [0, 1]], 'readWeight': [[1, 0], [0, -.5]],
}

def tiny_case(input_value):
    projected_and_gate = np.asarray(parameters['inputWeight']) @ input_value
    projected, gate = np.split(projected_and_gate, 2)
    windows = np.column_stack(([[1, 0], [-1, 0]], projected))
    convolved = np.einsum('ij,ij->i', windows, parameters['convolutionWeight'])
    silu = lambda value: value / (1 + np.exp(-value))
    transformed = silu(convolved)
    delta_pre = np.asarray(parameters['deltaWeight']) @ transformed + parameters['deltaBias']
    delta = np.logaddexp(0, delta_pre)
    normalized = lambda matrix: (matrix @ transformed) / np.sqrt(np.mean((matrix @ transformed)**2) + 1e-6)
    write = normalized(np.asarray(parameters['writeWeight']))
    read = normalized(np.asarray(parameters['readWeight']))
    decay = np.exp(-np.outer(delta, [1, 2]))
    retained = decay * [[1, 2], [-1, .5]]
    written = np.outer(delta * transformed, write)
    state = retained + written
    contraction = state @ read
    value = contraction + transformed
    output = value * silu(gate)
    return {'input': input_value.tolist(), 'projected': projected.tolist(), 'gate': gate.tolist(),
            'convolution': convolved.tolist(), 'transformed': transformed.tolist(),
            'delta': delta.tolist(), 'write': write.tolist(), 'read': read.tolist(),
            'decay': decay.tolist(), 'retained': retained.tolist(), 'written': written.tolist(),
            'state': state.tolist(), 'contraction': contraction.tolist(), 'output': output.tolist()}

rng = np.random.default_rng(3941)
tiny = [tiny_case(value) for value in [np.array([2., -1.]), np.zeros(2), np.array([-4., 4.]), *rng.uniform(-4, 4, (24, 2))]]
coordinates = np.array([[38.,100.],[100.,92.],[88.,25.],[75.,62.],[50.,46.],[25.,30.],[12.,15.],[0.,0.]])
points = torch.tensor(coordinates/50-1, dtype=torch.float64)[None]
traces = []
with torch.no_grad():
    for key in ['MMM-37', 'AAA-37', 'MAM-37', 'AMM-37', 'MAM-73']:
        model = load_fit(key).double()
        caches = [None] * 3
        frames = []
        for position, token in enumerate(model.positioned(points).unbind(1)):
            layers = []
            for index, layer in enumerate(model.layers):
                mixed, caches[index] = layer.mixer.step(layer.norm1(token), caches[index])
                intermediate = token + mixed
                normalized = layer.norm2(intermediate)
                gate, up = layer.gate_up(normalized).chunk(2, -1)
                hidden = torch.nn.functional.silu(gate) * up
                token = intermediate + layer.down(hidden)
                layers.append({name: value[0].tolist() for name, value in
                               [('normalizedFfn', normalized), ('ffnGate', gate), ('ffnUp', up), ('ffnHidden', hidden)]})
            frames.append({'position': position, 'layers': layers})
        full = model(points, True)[0].tolist()
        traces.append({'key': key, 'coordinates': coordinates.tolist(), 'frames': frames, 'full': full})

files = [draft / 'stroke_models.py', draft / 'stroke-fits.npz', root / 'src/learn/data/hybrid-memory-flow-models.js', Path(__file__)]
result = {'purpose': 'Fresh NumPy matrix/einsum selective oracles and native float64 FFN intermediates for edited stroke; no old writer/refit',
          'passed': True, 'fitsRerun': 0, 'seed': 3941, 'tiny': tiny, 'traces': traces,
          'sourceHashes': {str(file.relative_to(root)).replace('\\', '/'): hashlib.sha256(file.read_bytes()).hexdigest() for file in files}}
output = record / 'reading-flow-native-oracles.json'
output.write_text(json.dumps(result, separators=(',', ':')) + '\n', encoding='utf-8')
print(json.dumps({'passed': True, 'tinyCases': len(tiny), 'nativeModels': len(traces), 'editedPoints': 8, 'fitsRerun': 0,
                  'receipt': str(output.relative_to(root))}))

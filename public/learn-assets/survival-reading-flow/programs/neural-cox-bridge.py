"""One same-state neural Cox update: earlier NumPy engine versus PyTorch.

Run: python neural-cox-bridge.py --engine teaching-autodiff.py
Keep cox_score_head.py beside this program. The engine is an exact prerequisite
download from the Backpropagation lesson; importing it does not train a model.
"""

import argparse
import importlib.util
import json
from pathlib import Path
import numpy as np
import torch
from torch import nn
from cox_score_head import prepare_risk_index, attach_cox_head


def load_engine(filename):
    specification = importlib.util.spec_from_file_location("earlier_teaching_autodiff", filename)
    engine = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(engine)
    return engine


def fixture():
    features = np.array([[0., 1.], [1., 0.], [1., 1.], [0., 0.]])
    time, event = np.array([1., 2., 3., 4.]), np.array([1, 0, 1, 0])
    parameters = [np.array([[.2, -.3, .1], [.4, .1, -.2]]),
                  np.array([.1, 0., -.1]), np.array([[.5], [-.2], [.3]]), np.array([0.])]
    return features, time, event, parameters


def torch_full_risk_loss(scores, time, event):
    """Independent, explicit-roster reference; intentionally not the fast scan."""
    terms = [torch.logsumexp(scores[time >= time[i]], dim=0) - scores[i]
             for i in range(len(time)) if bool(event[i])]
    return torch.stack(terms).mean()


def main(engine_path):
    engine = load_engine(engine_path)
    features, time, event, initial = fixture()
    index = prepare_risk_index(time, event)
    parameters = [engine.Tensor(value, True) for value in initial]
    scores = engine.predict(features, parameters)
    loss = attach_cox_head(scores, index, engine.Tensor)
    loss.backward()
    model = nn.Sequential(nn.Linear(2, 3), nn.Tanh(), nn.Linear(3, 1)).double()
    with torch.no_grad():
        model[0].weight.copy_(torch.from_numpy(initial[0].T))
        model[0].bias.copy_(torch.from_numpy(initial[1]))
        model[2].weight.copy_(torch.from_numpy(initial[2].T))
        model[2].bias.copy_(torch.from_numpy(initial[3]))
    library_scores = model(torch.from_numpy(features))[:, 0]
    library_loss = torch_full_risk_loss(library_scores, torch.from_numpy(time), torch.from_numpy(event))
    library_loss.backward()
    library_gradients = [model[0].weight.grad.numpy().T, model[0].bias.grad.numpy(),
                         model[2].weight.grad.numpy().T, model[2].bias.grad.numpy()]
    gradient_error = max(float(np.max(np.abs(p.grad - g))) for p, g in zip(parameters, library_gradients))
    learning_rate = .1
    updated = [engine.Tensor(p.data - learning_rate * p.grad, True) for p in parameters]
    optimizer = torch.optim.SGD(model.parameters(), lr=learning_rate)
    optimizer.step()
    after = [model[0].weight.detach().numpy().T, model[0].bias.detach().numpy(),
             model[2].weight.detach().numpy().T, model[2].bias.detach().numpy()]
    update_error = max(float(np.max(np.abs(p.data - q))) for p, q in zip(updated, after))
    next_loss = attach_cox_head(engine.predict(features, updated), index, engine.Tensor)
    print(json.dumps({"subjects":len(time), "observed_events":int(event.sum()),
        "parameter_shapes":[list(x.shape) for x in initial], "initial_scores":scores.data[:, 0].tolist(),
        "initial_mean_event_loss":float(loss.data), "library_initial_loss":float(library_loss.detach()),
        "maximum_parameter_gradient_difference":gradient_error,
        "learning_rate":learning_rate, "maximum_updated_parameter_difference":update_error,
        "updated_mean_event_loss":float(next_loss.data), "simultaneous_updates":1}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", type=Path, required=True)
    main(parser.parse_args().engine)

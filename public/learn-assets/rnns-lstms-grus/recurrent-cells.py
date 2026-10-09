"""Explicit batched recurrent cells; tensor autodiff supplies the reverse pass."""
import math
import torch
from torch import nn
from torch.nn import functional as F


class RecurrentSequence(nn.Module):
    """One unidirectional layer, with native gate order and two separate biases.

    Inputs: (batch, positions, input features).
    State: (batch, hidden features), or (hidden, cell) for LSTM.
    Output: all hidden states, or None when only the final state is requested.
    """

    def __init__(self, kind, input_size, hidden_size):
        super().__init__()
        if kind not in ("rnn", "lstm", "gru") or min(input_size, hidden_size) < 1:
            raise ValueError("Use rnn/lstm/gru and positive feature widths.")
        self.kind, self.input_size, self.hidden_size = kind, input_size, hidden_size
        groups = {"rnn": 1, "lstm": 4, "gru": 3}[kind]
        self.weight_ih_l0 = nn.Parameter(torch.empty(groups * hidden_size, input_size))
        self.weight_hh_l0 = nn.Parameter(torch.empty(groups * hidden_size, hidden_size))
        self.bias_ih_l0 = nn.Parameter(torch.empty(groups * hidden_size))
        self.bias_hh_l0 = nn.Parameter(torch.empty(groups * hidden_size))
        bound = 1 / math.sqrt(hidden_size)
        for parameter in self.parameters():
            nn.init.uniform_(parameter, -bound, bound)

    def forward(self, inputs, state=None, *, return_sequence=True):
        if inputs.ndim != 3 or inputs.shape[1] == 0 or inputs.shape[2] != self.input_size:
            raise ValueError("Inputs must have shape (batch, nonempty positions, input_size).")
        batch = inputs.shape[0]
        zero = lambda: inputs.new_zeros(batch, self.hidden_size)
        if self.kind == "lstm":
            hidden, cell = (zero(), zero()) if state is None else state
        else:
            hidden = zero() if state is None else state
        if hidden.shape != (batch, self.hidden_size):
            raise ValueError("Hidden state must match this batch and hidden width.")
        if self.kind == "lstm" and cell.shape != hidden.shape:
            raise ValueError("This unprojected LSTM needs matching hidden and cell shapes.")

        # All input projections are independent of previous states.
        projected = F.linear(inputs, self.weight_ih_l0, self.bias_ih_l0)
        history = [] if return_sequence else None
        for incoming in projected.unbind(dim=1):
            recurrent = F.linear(hidden, self.weight_hh_l0, self.bias_hh_l0)
            if self.kind == "rnn":
                hidden = torch.tanh(incoming + recurrent)
            elif self.kind == "lstm":
                i, f, g, o = (incoming + recurrent).chunk(4, dim=-1)
                cell = torch.sigmoid(f) * cell + torch.sigmoid(i) * torch.tanh(g)
                hidden = torch.sigmoid(o) * torch.tanh(cell)
            else:
                xr, xz, xn = incoming.chunk(3, dim=-1)
                hr, hz, hn = recurrent.chunk(3, dim=-1)
                reset = torch.sigmoid(xr + hr)
                retain = torch.sigmoid(xz + hz)
                candidate = torch.tanh(xn + reset * hn)
                hidden = retain * hidden + (1 - retain) * candidate
            if return_sequence:
                history.append(hidden)
        final = (hidden, cell) if self.kind == "lstm" else hidden
        return torch.stack(history, dim=1) if return_sequence else None, final


def main():
    torch.manual_seed(7)
    inputs = torch.tensor([[[.4, .1], [-.2, .3], [.7, -.1]]], dtype=torch.float64)
    model = RecurrentSequence("lstm", 2, 3).double()
    hidden, cell = torch.zeros(1, 3, dtype=torch.float64), torch.ones(1, 3, dtype=torch.float64) * .2
    outputs, final = model(inputs, (hidden, cell))
    # A small task head is an ordinary affine layer, separate from recurrence.
    head = nn.Linear(3, 2).double()
    loss = F.cross_entropy(head(final[0]), torch.tensor([1]))
    loss.backward()
    print("all hidden states:", outputs.detach().tolist())
    print("final hidden:", final[0].detach().tolist())
    print("final cell:", final[1].detach().tolist())
    print("loss:", loss.item())
    print("input-weight gradient:", model.weight_ih_l0.grad.tolist())


if __name__ == "__main__":
    main()

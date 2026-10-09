"""CPU expert-parallel dispatch, return addresses and exact resource accounts.

Run: python moe_systems.py
Requires NumPy and Torch. Ranks here are ordinary Python data structures.
"""
import json

import numpy as np
import torch


def dispatch(x, selected, gates, source_rank, expert_rank, matrices):
    """Pack each source/destination pair, compute local maps, scatter returns."""
    ranks = int(max(source_rank.max(), expert_rank.max()) + 1)
    packets = [[[] for _ in range(ranks)] for _ in range(ranks)]
    for token, choices in enumerate(selected):
        for slot, expert in enumerate(choices):
            source = int(source_rank[token])
            destination = int(expert_rank[expert])
            packets[source][destination].append((token, slot, int(expert)))
    counts = np.array([[len(packet) for packet in row] for row in packets])
    received = [sum((packets[source][destination] for source in range(ranks)), [])
                for destination in range(ranks)]
    returns = [[] for _ in range(ranks)]
    expert_counts = np.zeros(len(expert_rank), dtype=int)
    for destination, requests in enumerate(received):
        for expert in np.flatnonzero(expert_rank == destination):
            group = [(token, slot) for token, slot, e in requests if e == expert]
            if not group:
                continue
            token, slot = np.array(group).T
            values = x[token] @ matrices[expert].T
            expert_counts[expert] = len(token)
            for t, s, value in zip(token, slot, values):
                returns[int(source_rank[t])].append((int(t), int(s), int(expert), value))
    y = np.zeros_like(x)
    ledger = []
    for source, messages in enumerate(returns):
        for token, slot, expert, value in messages:
            y[token] += gates[token, slot] * value
            ledger.append({
                "source": source, "destination": int(expert_rank[expert]),
                "token": token, "slot": slot, "expert": expert,
                "gate": float(gates[token, slot]), "returned": value.tolist(),
            })
    return y, counts, expert_counts, ledger


def torch_reference(x, selected, gates, matrices):
    """Same linear expert maps through independent gather/bmm/index_add."""
    inputs = torch.tensor(x, requires_grad=True)
    maps = torch.tensor(matrices, requires_grad=True)
    token = torch.arange(len(x)).repeat_interleave(selected.shape[1])
    expert = torch.tensor(selected.flatten())
    returned = torch.bmm(maps[expert], inputs[token, :, None]).squeeze(-1)
    output = torch.zeros_like(inputs).index_add(
        0, token, torch.tensor(gates.flatten())[:, None] * returned
    )
    output.sum().backward()
    return output.detach().numpy(), inputs.grad.numpy(), maps.grad.numpy()


def manual_return_gradient(x, gates, ledger, matrices):
    """Reverse the address ledger for an all-ones output direction."""
    dx, dmaps = np.zeros_like(x), np.zeros_like(matrices)
    for request in ledger:
        token, slot, expert = (request[name] for name in ["token", "slot", "expert"])
        dreturned = np.ones(x.shape[1]) * gates[token, slot]
        dx[token] += dreturned @ matrices[expert]
        dmaps[expert] += np.outer(dreturned, x[token])
    return dx, dmaps


def accounts(counts, source_destination, width, bytes_per_value, block_rows):
    remote = int(source_destination.sum() - np.trace(source_destination))
    allocated = ((counts + block_rows - 1) // block_rows) * block_rows
    padded = np.full_like(counts, counts.max())
    return {
        "remote_assignments": remote,
        "forward_request_return_bytes": 2 * remote * width * bytes_per_value,
        "backward_vector_bytes": 2 * remote * width * bytes_per_value,
        "actual_expert_rows": counts.tolist(),
        "equal_padded_rows": padded.tolist(),
        "block_allocated_rows": allocated.tolist(),
        "block_padding_rows": int(allocated.sum() - counts.sum()),
    }


def expert_budget(width, experts, selected, intermediate, refinement=1, shared=0):
    """Bias-free SwiGLU; shared experts are carved from the refined total bank."""
    if intermediate % refinement:
        raise ValueError("Intermediate width must divide by refinement")
    total = experts * refinement
    active = selected * refinement
    if not 0 <= shared < active <= total:
        raise ValueError("Require 0 <= shared < active <= total")
    small_width = intermediate // refinement
    one_expert = 3 * width * small_width
    return {
        "total_experts": total, "shared_experts": shared,
        "routed_experts": total - shared, "selected_routed": active - shared,
        "expert_width": small_width,
        "stored_expert_parameters": total * one_expert,
        "selected_expert_multiply_adds_per_token": active * one_expert,
        "router_parameters": width * (total - shared),
        "routed_assignment_slots_per_token": active - shared,
    }


def main():
    x = np.array([[1., 2.], [3., 4.], [5., 6.], [7., 8.]])
    selected = np.array([[0, 1], [0, 2], [1, 3], [0, 3]])
    gates = np.array([[.75, .25], [.6, .4], [.2, .8], [.5, .5]])
    source_rank = np.array([0, 0, 1, 1])
    placements = {"split": [0, 0, 1, 1], "move_E0": [1, 0, 1, 1]}
    matrices = np.array([np.eye(2) * scale for scale in [1, 2, 3, 4]])
    expected, expected_dx, expected_maps = torch_reference(x, selected, gates, matrices)
    reports = {}
    for name, placement in placements.items():
        y, communication, counts, ledger = dispatch(
            x, selected, gates, source_rank, np.array(placement), matrices
        )
        dx, dmaps = manual_return_gradient(x, gates, ledger, matrices)
        np.testing.assert_allclose(y, expected, atol=1e-12)
        np.testing.assert_allclose(dx, expected_dx, atol=1e-12)
        np.testing.assert_allclose(dmaps, expected_maps, atol=1e-12)
        reports[name] = {
            "source_destination_counts": communication.tolist(),
            "output": y.tolist(), "input_gradient": dx.tolist(), "ledger": ledger,
            "accounts": accounts(counts, communication, 2, 4, 4),
            "block_one": accounts(counts, communication, 2, 4, 1),
        }
    local = dispatch(x, selected, gates, np.zeros(4, dtype=int), np.zeros(4, dtype=int), matrices)
    reports["all_local"] = accounts(local[2], local[1], 2, 4, 4)
    reports["budgets"] = [expert_budget(32, 4, 2, 16, r, s) for r, s in [(1, 0), (2, 0), (2, 1)]]
    print(json.dumps(reports, indent=2))


if __name__ == "__main__":
    main()

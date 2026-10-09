"""Actual Transformers 5.19 physical sharing with supplied CPU K/V values.

The internal allocator API is pinned. No model, manager thread or GPU is used.
A native block covers four tokens across both layers; a native page covers
one layer. Two leading trash sectors are included as required by this class.
"""

import torch
import transformers
from transformers import PreTrainedConfig
from transformers.generation.continuous_batching.cache_allocators.cache_pool import CachePool
from transformers.generation.continuous_batching.cache_allocators.full_attention import (
    FullAttentionCacheAllocator,
)


def state(allocator, pool):
    ledger = allocator.ledger
    return {
        "tables": {key: list(value) for key, value in allocator.block_table.items()},
        "shared_ref_counts": dict(ledger.shared_ref_counts),
        "retained": list(ledger.cached_blocks),
        "hash_to_block": {str(key): value for key, value in ledger.hash_to_block.items()},
        "free_blocks": pool.count_free_blocks(0),
        "free_sectors": pool.num_free_sectors,
    }


def supplied(ids, layer, value=False):
    # Position and token identity both affect these constructed scalar operands.
    offset = 10000 if value else 0
    rows = [
        [
            [
                offset + 1000 * layer + 100 * pos + 2 * token + 10 * head + feature
                for feature in range(4)
            ]
            for head in range(2)
        ]
        for pos, token in enumerate(ids)
    ]
    return torch.tensor(rows, dtype=torch.float32)


@torch.inference_mode()
def run(protocol, recorder):
    config = protocol["allocator"]
    torch.set_num_threads(protocol["threads"])
    model_config = PreTrainedConfig(hidden_size=8, num_attention_heads=2, head_dim=4)
    allocator = FullAttentionCacheAllocator(
        index=0,
        config=model_config,
        num_key_value_heads=2,
        cache_dtype=torch.float32,
        page_size=4,
        layer_indices=[0, 1],
        allow_block_sharing=True,
    )
    bytes_per_sector = allocator.bytes_per_block
    non_trash_bytes = config["allocatable_sectors"] * bytes_per_sector
    backing = torch.zeros(non_trash_bytes + 2 * bytes_per_sector, dtype=torch.uint8)
    pool = CachePool(config["allocatable_sectors"], num_allocators=1, num_reserved_sectors=2)
    allocator.register_cache_tensor(bytes_per_sector, non_trash_bytes, backing, pool)
    for _ in range(config["allocatable_sectors"]):
        pool.allocate_sector(0)
    recorder.emit(
        "initial",
        {
            "state": state(allocator, pool),
            "bytes_per_page": allocator.bytes_per_page,
            "bytes_per_block": allocator.bytes_per_block,
            "backing_bytes_including_trash": backing.numel(),
            "torch": torch.__version__,
            "transformers": transformers.__version__,
        },
    )
    assert allocator.bytes_per_page == 256 and bytes_per_sector == 512
    assert backing.numel() == 3072 and pool.count_free_blocks(0) == 4
    a, b = config["prompts"]["A"], config["prompts"]["B"]
    allocator.allocate_cache_to_request("A", 0, len(a))
    read_a = allocator.get_read_indices("A", 0, len(a))
    write_a = allocator.get_write_indices("A", 0, len(a))
    saved_a = {}
    for layer in [0, 1]:
        keys, values = supplied(a, layer), supplied(a, layer, value=True)
        actual_k, actual_v = allocator.update(
            keys, values, layer, torch.tensor(read_a), torch.tensor(write_a)
        )
        saved_a[layer] = (actual_k.clone(), actual_v.clone())
        recorder.emit(
            f"write-A-layer-{layer}",
            {"read_indices": read_a, "write_indices": write_a, "state": state(allocator, pool)},
            {
                "supplied_k": keys,
                "supplied_v": values,
                "returned_k": actual_k,
                "returned_v": actual_v,
            },
        )
        assert torch.equal(actual_k, keys) and torch.equal(actual_v, values)
    allocator.mark_complete_blocks("A", a, new_new_blocks=2)
    matched = allocator.match_prefix_blocks(b)
    recorder.emit("match-B", {"matched": matched, "state": state(allocator, pool)})
    assert len(matched) == 2
    allocator.acquire_prefix_blocks("B", prefix_len=8, block_ids=matched)
    allocator.allocate_cache_to_request("B", past_length=8, query_length=2)
    read_b = allocator.get_read_indices("B", 8, 2)
    write_b = allocator.get_write_indices("B", 8, 2)
    addresses = []
    for layer in [0, 1]:
        keys, values = supplied(b, layer), supplied(b, layer, value=True)
        actual_k, actual_v = allocator.update(
            keys[8:], values[8:], layer, torch.tensor(read_b), torch.tensor(write_b)
        )
        k_view, v_view = allocator._kv_token_views[layer]
        # These are addresses in the physical backing views. Returned update()
        # tensors use index_select and are not asserted to alias that backing.
        pointer_a = [k_view[index].data_ptr() for index in read_a[:8]]
        pointer_b = [k_view[index].data_ptr() for index in read_b[:8]]
        addresses.append(
            {
                "layer": layer,
                "A_key_addresses": pointer_a,
                "B_key_addresses": pointer_b,
                "A_value_addresses": [v_view[index].data_ptr() for index in read_a[:8]],
                "B_value_addresses": [v_view[index].data_ptr() for index in read_b[:8]],
            }
        )
        recorder.emit(
            f"write-B-layer-{layer}",
            {
                "read_indices": read_b,
                "write_indices": write_b,
                "addresses": addresses[-1],
                "state": state(allocator, pool),
            },
            {
                "supplied_k": keys,
                "supplied_v": values,
                "returned_k": actual_k,
                "returned_v": actual_v,
                "retained_A_k": saved_a[layer][0],
                "retained_A_v": saved_a[layer][1],
            },
        )
        assert torch.equal(actual_k, keys) and torch.equal(actual_v, values)
        assert pointer_a == pointer_b and read_a[:8] == read_b[:8]
        assert torch.equal(actual_k[:8], saved_a[layer][0][:8])
    allocator.mark_complete_blocks("B", b, new_new_blocks=0)
    active = state(allocator, pool)
    recorder.emit("both-active", {"state": active})
    assert len(set(active["tables"]["A"] + active["tables"]["B"])) == 4
    assert sorted(active["shared_ref_counts"].values()) == [2, 2]
    allocator.free_blocks("A")
    recorder.emit("release-A", {"state": state(allocator, pool)})
    allocator.free_blocks("B")
    released = state(allocator, pool)
    recorder.emit("release-B", {"state": released})
    assert released["free_blocks"] == 2 and len(released["retained"]) == 2
    # Matching is still possible after release. Acquiring a retained prefix
    # changes refs from zero to one; releasing it returns to retained state.
    retained_match = allocator.match_prefix_blocks(a)
    allocator.acquire_prefix_blocks("C", 8, retained_match)
    recorder.emit(
        "acquire-retained-C", {"matched": retained_match, "state": state(allocator, pool)}
    )
    assert len(retained_match) == 2 and not allocator.ledger.cached_blocks
    allocator.free_blocks("C")
    evicted = allocator.ledger.evict_cached_blocks()
    pool.free_blocks(0, evicted)
    final = state(allocator, pool)
    recorder.emit("evict-inactive", {"evicted": evicted, "state": final})
    assert final["free_blocks"] == 4 and not allocator.match_prefix_blocks(a)
    pool.try_to_free_sectors()
    recorder.emit("return-sectors", {"state": state(allocator, pool)})
    assert pool.num_free_sectors == 4
    return {
        "active": active,
        "released": released,
        "final": state(allocator, pool),
        "addresses": addresses,
        "bytes_per_block": bytes_per_sector,
        "scope": "Actual pinned allocator, supplied K/V, no model inference or production benchmark.",
        "native_hash_boundary": "BLAKE2b-64 chain; no exact-identity fallback or trust namespace in this class.",
    }

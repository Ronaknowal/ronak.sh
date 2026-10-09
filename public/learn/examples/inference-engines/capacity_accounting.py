"""Logical reservation and explicit per-device byte arithmetic; no timing model."""
from request_contract import integer


def reservation(prompt_length, cap, page_size):
    p = integer(prompt_length, "prompt length", 1)
    g = integer(cap, "cap", 1)
    block = integer(page_size, "page size", 1)
    rows = p + g - 1
    pages = (rows + block - 1) // block
    return {"max_cached_rows": rows, "pages": pages,
            "reserved_rows": pages * block, "max_length_slack": pages * block - rows}


def device_budget(total, weights, workspace, reserve, layers, local_kv_heads,
                  head_dim, bytes_per_element, page_size):
    for name, value in [("total", total), ("weights", weights),
                        ("workspace", workspace), ("reserve", reserve)]:
        integer(value, name)
    for name, value in [("layers", layers), ("local KV heads", local_kv_heads),
                        ("head dimension", head_dim), ("bytes/element", bytes_per_element),
                        ("page size", page_size)]:
        integer(value, name, 1)
    available = total - weights - workspace - reserve
    if available < 0:
        raise ValueError("weights, workspace and reserve exceed device capacity")
    per_row = 2 * layers * local_kv_heads * head_dim * bytes_per_element
    per_page = per_row * page_size
    return {"kv_available_bytes": available, "bytes_per_row": per_row,
            "bytes_per_page": per_page, "whole_pages": available // per_page,
            "unassigned_bytes": available % per_page}


if __name__ == "__main__":
    print("A", reservation(3, 3, 2))
    print("B", reservation(4, 2, 2))
    print("changed A", reservation(5, 4, 4))
    print("changed B", reservation(4, 3, 4))
    print(device_budget(8 * 2**30, 4 * 2**30, 2**30, 2**29, 24, 8, 64, 2, 16))

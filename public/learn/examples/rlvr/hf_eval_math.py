"""Greedy offline evaluation of a pinned pretrained encoder-decoder on12 tasks.

python -B hf_eval_math.py --cache MODEL_CACHE --output observations/flan.json
Cache must contain the exact revision. This program never fits the checkpoint.
"""

import argparse
import importlib.metadata
from pathlib import Path
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from rlvr_data import emit, load_protocol, load_records
from verifier_contracts import final_verdict


def run(cache):
    protocol = load_protocol()
    settings = protocol["flan"]
    torch.set_num_threads(protocol["threads"])
    tokenizer = AutoTokenizer.from_pretrained(
        settings["checkpoint"],
        revision=settings["revision"],
        cache_dir=cache,
        local_files_only=True,
    )
    model = AutoModelForSeq2SeqLM.from_pretrained(
        settings["checkpoint"],
        revision=settings["revision"],
        cache_dir=cache,
        local_files_only=True,
    ).eval()
    results = []
    for row in load_records()[settings["split"]]:
        prompt = row["question"] + "\nGive the final numeric answer as #### number."
        inputs = tokenizer(prompt, return_tensors="pt")
        with torch.no_grad():
            generated = model.generate(
                **inputs, do_sample=False, max_new_tokens=settings["max_new_tokens"]
            )
        text = tokenizer.decode(generated[0], skip_special_tokens=True)
        results.append(
            {
                "record_id": row["id"],
                "prompt": prompt,
                "gold": row["gold"],
                "input_ids": inputs["input_ids"][0].tolist(),
                "generated_ids": generated[0].tolist(),
                "prediction": text,
                "verdict": final_verdict(text, row["gold"]),
                "generated_decoder_positions": len(generated[0]),
                "new_decoder_tokens": len(generated[0]) - 1,
                "decoder_start_token_id": model.config.decoder_start_token_id,
            }
        )
    return {
        "checkpoint": settings,
        "versions": {
            name: importlib.metadata.version(name)
            for name in ["torch", "transformers", "tokenizers"]
        },
        "decoder": "encoder-decoder; first returned position is its start token, not a generated answer",
        "records": results,
        "accepted": sum(row["verdict"]["accepted"] for row in results),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("observations/flan.json"))
    args = parser.parse_args()
    result = run(args.cache)
    emit(args.output, result)
    print({"tasks": len(result["records"]), "strict_accepted": result["accepted"]})


if __name__ == "__main__":
    main()

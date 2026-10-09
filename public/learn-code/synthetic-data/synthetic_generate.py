"""Generate the declared source-conditioned corpus with pinned FLAN-T5-small.
Run: python synthetic_generate.py --cache .model-cache --output candidates.json
First run may download the Apache-2.0 model; --local-only reuses cached weights.
"""
import argparse
import importlib.metadata
import json
from pathlib import Path
import time
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from synthetic_corpus import read_sources

MODEL = "google/flan-t5-small"
REVISION = "0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab"
SETTINGS = dict(temperature=.8, top_p=.9, top_k=0, do_sample=True,
                num_beams=1, max_new_tokens=96)
INSTRUCTIONS = {
    "plain": "Rewrite the paragraph in concise, plain English. Preserve its facts and do not add facts.",
    "qa": "Write one question and its answer using only information in the paragraph.",
}


def prompt_for(text, style):
    return f"{INSTRUCTIONS[style]}\n\nParagraph: {text}\n\nResponse:"


def generate_record(model, tokenizer, source, style, index):
    prompt = prompt_for(source["text"], style)
    full = tokenizer(prompt, return_tensors="pt", truncation=False)
    encoded = {name: value[:, :512] for name, value in full.items()}
    seed = 73 + index
    torch.manual_seed(seed)
    start = time.perf_counter()
    with torch.inference_mode():
        ids = model.generate(**encoded, **SETTINGS)[0].tolist()
    elapsed = time.perf_counter() - start
    eos = tokenizer.eos_token_id
    return {"id": f"{source['id']}-{style}", "source_id": source["id"],
            "style": style, "seed": seed, "prompt": prompt,
            "full_input_ids": full["input_ids"][0].tolist(),
            "input_ids": encoded["input_ids"][0].tolist(),
            "input_truncated": full["input_ids"].shape[1] > 512,
            "retained_input_text": tokenizer.decode(encoded["input_ids"][0]),
            "output_ids": ids, "decoder_start_id": model.config.decoder_start_token_id,
            "eos_id": eos, "termination": "EOS" if ids[-1] == eos else "length cap",
            "text": tokenizer.decode(ids, skip_special_tokens=True),
            "elapsed_seconds": elapsed}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", default=".model-cache")
    parser.add_argument("--local-only", action="store_true")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    # Reserve the result before expensive work; failures cannot overwrite a run.
    with args.output.open("x", encoding="utf-8") as stream:
        torch.set_num_threads(2)
        tokenizer = AutoTokenizer.from_pretrained(MODEL, revision=REVISION,
                        cache_dir=args.cache, local_files_only=args.local_only)
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL, revision=REVISION,
                        cache_dir=args.cache, local_files_only=args.local_only).eval()
        sources = read_sources()
        records = []
        for source in sources["records"]:
            if source["split"] != "train": continue
            for style in INSTRUCTIONS:
                row = generate_record(model, tokenizer, source, style, len(records))
                records.append(row)
                print(json.dumps({"completed": row["id"], "output_ids": len(row["output_ids"])}), flush=True)
        result = {"model": MODEL, "revision": REVISION,
                  "parameters": sum(p.numel() for p in model.parameters()),
                  "versions": {name: importlib.metadata.version(name) for name in
                               ("numpy", "torch", "transformers", "tokenizers", "sentencepiece")},
                  "device": "CPU", "settings": SETTINGS, "records": records,
                  "source_exclusions": sources["excluded"]}
        json.dump(result, stream, indent=2, ensure_ascii=False)
        stream.write("\n")


if __name__ == "__main__":
    main()

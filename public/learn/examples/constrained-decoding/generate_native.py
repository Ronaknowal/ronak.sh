"""Fixed CPU extraction comparison with immutable protocol and per-row records.

python generate_native.py --stage prepare --model pythia-14m --data data.json --output study
python generate_native.py --stage run --model pythia-14m --data data.json --output study

Four arms: ordinary unconstrained HF, generic JSON HF/XGrammar, manual cached
schema/XGrammar, and ordinary Outlines/Core schema. No weight updates. Existing
completed rows are reused; a started row without a result forbids silent retry.
"""

import argparse
import hashlib
import importlib.metadata as metadata
import json
import os
from pathlib import Path
import time
from unittest.mock import patch

# Explicit CPU eager execution; no implicit C++ compiler or GPU requirement.
os.environ["TORCHDYNAMO_DISABLE"] = "1"

REVISION = "cf967c0a9a04383db6f7b1108d86b2962634b4ac"
WEIGHTS = "116a02532db461f91386a5b20f942ff2c8d4de7341e21b55caafc3d7b25f49a1"
ARMS = ("unconstrained", "json_hf", "schema_manual", "schema_outlines")
PACKAGES = (
    "torch",
    "transformers",
    "xgrammar",
    "outlines",
    "outlines_core",
    "tokenizers",
)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def save(path, value):
    with Path(path).open("x", encoding="utf-8") as stream:
        json.dump(value, stream, indent=2, allow_nan=False)
        stream.write("\n")


def identity(model, data):
    if sha(model / "model.safetensors") != WEIGHTS:
        raise ValueError("Wrong pretrained weights")
    return {
        "revision": REVISION,
        "model_files": {p.name: sha(p) for p in sorted(model.iterdir()) if p.is_file()},
        "data_sha256": sha(data),
        "generator_sha256": sha(__file__),
        "versions": {p: metadata.version(p) for p in PACKAGES},
    }


def prepare(args):
    data = json.loads(args.data.read_text(encoding="utf-8"))
    args.output.mkdir(parents=True, exist_ok=True)
    protocol = {
        "identity": identity(args.model, args.data),
        "arms": ARMS,
        "rows": [r["index"] for r in data["rows"]],
        "schema": data["schema"],
        "max_new_tokens": 48,
        "do_sample": False,
        "num_beams": 1,
        "dtype": "float32",
        "device": "cpu",
        "threads": 2,
        "torch_compile": "disabled",
        "schema_order": "declared",
        "xgrammar_any_whitespace": False,
        "outlines_whitespace_pattern": "",
        "stop_policy": "tokenizer EOS or cap; incomplete outcomes retained",
        "timing": "serial CPU generation observations, excluding shared compilation; no GPU or serving benchmark",
    }
    save(args.output / "protocol.json", protocol)
    save(args.output / "data.json", data)
    # The exact executing program survives later presentation improvements.
    with (args.output / "generate_native.py").open("xb") as stream:
        stream.write(Path(__file__).read_bytes())
    print(
        json.dumps(
            {
                "protocol": str(args.output / "protocol.json"),
                "sha256": sha(args.output / "protocol.json"),
                "operations": len(ARMS) * len(data["rows"]),
            }
        )
    )


def manual_decode(model, inputs, compiled, eos, cap):
    import torch
    import xgrammar as xgr

    matcher = xgr.GrammarMatcher(compiled)
    mask = xgr.allocate_token_bitmask(1, model.config.vocab_size)
    ids, trace = [], []
    with torch.inference_mode():
        output = model(**inputs, use_cache=True)
        cache = output.past_key_values
        for position in range(cap):
            scores = output.logits[:, -1, :].clone().float()
            matcher.fill_next_token_bitmask(mask)
            xgr.apply_token_bitmask_inplace(scores, mask)
            finite = torch.isfinite(scores[0])
            if not finite.any():
                return {"generated_ids": ids, "status": "empty-support", "trace": trace}
            token = int(scores.argmax(-1).item())
            assert matcher.accept_token(
                token
            ), "Selected token must be accepted atomically"
            ids.append(token)
            trace.append(
                {
                    "position": position,
                    "id": token,
                    "support": int(finite.sum()),
                    "completed": matcher.is_completed(),
                    "terminated": matcher.is_terminated(),
                }
            )
            if token == eos:
                return {"generated_ids": ids, "status": "eos", "trace": trace}
            # Every selected token, including a forced choice, reaches model state.
            if position + 1 < cap:
                next_id = torch.tensor([[token]], dtype=torch.long)
                output = model(input_ids=next_id, past_key_values=cache, use_cache=True)
                cache = output.past_key_values
    return {"generated_ids": ids, "status": "cap", "trace": trace}


def run(args):
    import torch
    import xgrammar as xgr
    import outlines
    from transformers import AutoTokenizer, AutoModelForCausalLM, GenerationConfig
    from xgrammar.contrib.hf import LogitsProcessor

    protocol = json.loads((args.output / "protocol.json").read_text(encoding="utf-8"))
    if identity(args.model, args.data) != protocol["identity"]:
        raise ValueError("Frozen program/model/data/runtime identity changed")
    data = json.loads(args.data.read_text(encoding="utf-8"))
    torch.set_num_threads(protocol["threads"])
    tokenizer = AutoTokenizer.from_pretrained(args.model, local_files_only=True)
    tokenizer.pad_token = tokenizer.eos_token
    model = AutoModelForCausalLM.from_pretrained(
        args.model, local_files_only=True, dtype=torch.float32
    ).eval()
    eos = tokenizer.eos_token_id
    config = GenerationConfig(
        max_new_tokens=protocol["max_new_tokens"],
        do_sample=False,
        num_beams=1,
        use_cache=True,
        eos_token_id=eos,
        pad_token_id=eos,
        bos_token_id=tokenizer.bos_token_id,
        repetition_penalty=1.0,
        no_repeat_ngram_size=0,
    )
    started = time.perf_counter()
    info = xgr.TokenizerInfo.from_huggingface(
        tokenizer, vocab_size=model.config.vocab_size
    )
    compiler = xgr.GrammarCompiler(info, max_threads=1)
    generic = compiler.compile_builtin_json_grammar()
    schema = compiler.compile_json_schema(
        data["schema"], any_whitespace=False, separators=(",", ":"), any_order=False
    )
    wrapped = outlines.from_transformers(model, tokenizer)
    generator = outlines.Generator(
        wrapped,
        outlines.types.JsonSchema(data["schema"], whitespace_pattern=""),
        backend="outlines_core",
    )
    setup = {
        "seconds": time.perf_counter() - started,
        "vocab_size": model.config.vocab_size,
        "tokenizer_length": len(tokenizer),
        "eos_id": eos,
        "configuration": config.to_dict(),
        "qualification": "This is observed shared CPU setup, not a repeated benchmark.",
    }
    if not (args.output / "setup.json").exists():
        save(args.output / "setup.json", setup)
    for row in data["rows"]:
        for arm in ARMS:
            name = f'row-{row["index"]:03d}-{arm}'
            destination = args.output / f"{name}.json"
            if destination.exists():
                record = json.loads(destination.read_text(encoding="utf-8"))
                if record.get("protocol_sha256") != sha(args.output / "protocol.json"):
                    raise ValueError("Completed row belongs to a different protocol")
                continue
            save(
                args.output / f"{name}.started.json",
                {
                    "protocol_sha256": sha(args.output / "protocol.json"),
                    "index": row["index"],
                    "arm": arm,
                },
            )
            inputs = tokenizer(row["prompt"], return_tensors="pt")
            result = {
                "index": row["index"],
                "arm": arm,
                "prompt_ids": inputs["input_ids"][0].tolist(),
                "protocol_sha256": sha(args.output / "protocol.json"),
            }
            started = time.perf_counter()
            try:
                if arm == "schema_manual":
                    result.update(
                        manual_decode(
                            model, inputs, schema, eos, protocol["max_new_tokens"]
                        )
                    )
                else:
                    captured = []
                    if arm == "schema_outlines":
                        original = model.generate

                        def capture(*a, **kw):
                            output = original(*a, **kw)
                            captured.append(output.detach().cpu())
                            return output

                        with torch.inference_mode(), patch.object(
                            model, "generate", side_effect=capture
                        ):
                            returned = generator(
                                row["prompt"], generation_config=config
                            )
                        if len(captured) != 1:
                            raise RuntimeError("Expected one ordinary generation call")
                        output = captured[0]
                        result["library_returned_text"] = returned
                    else:
                        processors = (
                            [] if arm == "unconstrained" else [LogitsProcessor(generic)]
                        )
                        with torch.inference_mode():
                            output = model.generate(
                                **inputs,
                                generation_config=config,
                                logits_processor=processors,
                            )
                    ids = output[0, inputs["input_ids"].shape[1] :].tolist()
                    result.update(
                        {
                            "generated_ids": ids,
                            "status": "eos" if ids and ids[-1] == eos else "cap",
                        }
                    )
                result["seconds"] = time.perf_counter() - started
                result["text"] = tokenizer.decode(
                    result["generated_ids"],
                    skip_special_tokens=True,
                    clean_up_tokenization_spaces=False,
                )
                if (
                    "library_returned_text" in result
                    and result["library_returned_text"] != result["text"]
                ):
                    raise RuntimeError(
                        "Library text differs from exact recorded-token decoding"
                    )
                final = xgr.GrammarMatcher(schema)
                valid_prefix = True
                for token in result["generated_ids"]:
                    if not final.accept_token(token):
                        valid_prefix = False
                        break
                result.update(
                    {
                        "schema_prefix": valid_prefix,
                        "completed": valid_prefix and final.is_completed(),
                        "terminated": valid_prefix and final.is_terminated(),
                    }
                )
            except Exception as exc:
                result.update(
                    {
                        "status": "error",
                        "error": repr(exc),
                        "seconds": time.perf_counter() - started,
                    }
                )
                save(destination, result)
                raise
            save(destination, result)
            print(
                json.dumps(
                    {
                        "row": row["index"],
                        "arm": arm,
                        "status": result["status"],
                        "tokens": len(result["generated_ids"]),
                    }
                ),
                flush=True,
            )
    save(
        args.output / "complete.json",
        {
            "records": {
                p.name: sha(p)
                for p in sorted(args.output.glob("row-*.json"))
                if ".started." not in p.name
            },
            "protocol_sha256": sha(args.output / "protocol.json"),
            "weights_after": sha(args.model / "model.safetensors"),
        },
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", choices=["prepare", "run"], required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    (prepare if args.stage == "prepare" else run)(args)


if __name__ == "__main__":
    main()

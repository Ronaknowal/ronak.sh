"""Offline records, fixed byte addresses, response masks and JSON output.

No vocabulary is fitted to the test set. A byte keeps its integer address0–255;
PAD/EOS/BOS/SEP occupy256–259. Special tokens are distinguished from raw bytes.
"""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PAD, EOS, BOS, SEP = 256, 257, 258, 259
INSTRUCTION = "\nGive the final numeric answer as #### number.\n"


def load_records():
    return json.loads((ROOT / "records.json").read_text(encoding="utf-8"))


def load_protocol():
    return json.loads((ROOT / "protocol.json").read_text(encoding="utf-8"))


def prompt_ids(row):
    return [BOS] + list((row["question"] + INSTRUCTION).encode("utf-8")) + [SEP]


def target_ids(row):
    return list(("#### " + row["gold"]).encode("utf-8")) + [EOS]


def decode(ids):
    """Keep generated reserved tokens visible, omitting only a final genuine EOS."""
    ids = list(ids)
    if ids and ids[-1] == EOS:
        ids = ids[:-1]
    parts, buffer = [], bytearray()
    names = {PAD: "[PAD]", EOS: "[EOS]", BOS: "[BOS]", SEP: "[SEP]"}
    for token in ids:
        if token < 256:
            buffer.append(token)
        else:
            parts.append(buffer.decode("utf-8", errors="replace"))
            buffer.clear()
            parts.append(names[token])
    parts.append(buffer.decode("utf-8", errors="replace"))
    return "".join(parts)


def emit(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + "\n",
        encoding="utf-8",
    )


def file_digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def model_digest(model):
    digest = hashlib.sha256()
    for name, tensor in sorted(model.state_dict().items()):
        digest.update(name.encode("utf-8"))
        digest.update(str(tuple(tensor.shape)).encode("ascii"))
        digest.update(str(tensor.dtype).encode("ascii"))
        digest.update(tensor.detach().cpu().contiguous().numpy().tobytes())
    return digest.hexdigest()


def tensor_json(values):
    import torch

    if isinstance(values, torch.Tensor):
        return values.detach().cpu().tolist()
    if isinstance(values, dict):
        return {name: tensor_json(value) for name, value in values.items()}
    if isinstance(values, (list, tuple)):
        return [tensor_json(value) for value in values]
    return values


def pack(prompts, responses):
    """Right-padding is visible; a predictor at t−1 scores response target t."""
    import torch

    lengths = [
        len(prompt) + len(response) for prompt, response in zip(prompts, responses)
    ]
    if len(prompts) != len(responses) or not lengths or min(map(len, responses)) == 0:
        raise ValueError("Need nonempty aligned prompt/response rows")
    ids = torch.full((len(prompts), max(lengths)), PAD, dtype=torch.long)
    completion = torch.zeros_like(ids, dtype=torch.bool)
    attention = torch.zeros_like(completion)
    for index, (prompt, response) in enumerate(zip(prompts, responses)):
        ids[index, : lengths[index]] = torch.tensor(prompt + response)
        attention[index, : lengths[index]] = True
        completion[index, len(prompt) : lengths[index]] = True
    return {
        "input_ids": ids,
        "attention_mask": attention,
        "completion_mask": completion,
    }


def score_targets(model, batch, native=False):
    ids = batch["input_ids"]
    if native:
        logits = model(
            input_ids=ids, attention_mask=batch["attention_mask"], use_cache=False
        ).logits
    else:
        logits = model(ids)
    logps = logits[:, :-1].log_softmax(-1).gather(-1, ids[:, 1:, None]).squeeze(-1)
    mask = (
        batch["completion_mask"][:, 1:]
        & batch["attention_mask"][:, 1:]
        & batch["attention_mask"][:, :-1]
    )
    return logps, mask


def byte_tokenizer():
    """Usual tokenizers BPE with no merges: match the same fixed byte addresses."""
    from tokenizers import Tokenizer, decoders, pre_tokenizers
    from tokenizers.models import BPE
    from transformers import PreTrainedTokenizerFast

    visible = list(range(33, 127)) + list(range(161, 173)) + list(range(174, 256))
    mapping = dict(zip(visible, visible))
    extra = 256
    for byte in range(256):
        if byte not in mapping:
            mapping[byte] = extra
            extra += 1
    vocabulary = {chr(mapping[byte]): byte for byte in range(256)}
    vocabulary.update({"[PAD]": PAD, "[EOS]": EOS, "[BOS]": BOS, "[SEP]": SEP})
    backend = Tokenizer(BPE(vocab=vocabulary, merges=[], unk_token="[PAD]"))
    backend.pre_tokenizer = pre_tokenizers.ByteLevel(
        add_prefix_space=False, use_regex=False
    )
    backend.decoder = decoders.ByteLevel()
    return PreTrainedTokenizerFast(
        tokenizer_object=backend,
        pad_token="[PAD]",
        eos_token="[EOS]",
        bos_token="[BOS]",
        sep_token="[SEP]",
        unk_token="[PAD]",
        model_max_length=320,
        padding_side="left",
    )

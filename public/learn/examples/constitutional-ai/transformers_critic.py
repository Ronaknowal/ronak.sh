"""Execute a small pretrained critic/revision and full-sequence option scoring.

Install: python -m pip install transformers==5.19.0 sentencepiece==0.2.1 torch
Run: python transformers_critic.py --output critic_outputs.json
The first run downloads the pinned public model into --cache. Later runs reuse it.
This encoder-decoder demonstration is not an original CAI experiment or safety test.
"""
import argparse
import importlib.metadata
import json
from pathlib import Path
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

MODEL = "google/flan-t5-small"
REVISION = "0fc9ddf78a1e988dac52e2dac162b0ede4fd74ab"


def generate(model, tokenizer, prompt, max_new_tokens=64):
    encoded = tokenizer(prompt, return_tensors="pt", truncation=False)
    if encoded["input_ids"].shape[1] > 512:
        raise ValueError("This demonstration rejects inputs beyond its 512-token budget.")
    with torch.inference_mode():
        output = model.generate(**encoded, max_new_tokens=max_new_tokens, do_sample=False,
                                num_beams=1)
    return {"text": tokenizer.decode(output[0], skip_special_tokens=True),
            "input_ids": encoded["input_ids"][0].tolist(), "output_ids": output[0].tolist(),
            "input_tokens": int(encoded["input_ids"].numel()),
            "output_tokens_with_decoder_start": int(output[0].numel())}


def score_option(model, tokenizer, prompt, answer):
    encoded = tokenizer(prompt, return_tensors="pt", truncation=False)
    labels = tokenizer(answer, return_tensors="pt", add_special_tokens=True)["input_ids"]
    if encoded["input_ids"].shape[1] > 512:
        raise ValueError("Judge prompt exceeds the declared input budget.")
    # T5 internally creates decoder_input_ids by shifting these labels right.
    # The prompt lives in the encoder. It is not prepended to the decoder labels.
    with torch.inference_mode():
        outputs = model(**encoded, labels=labels)
        log_probabilities = outputs.logits.log_softmax(dim=-1)
        selected = log_probabilities.gather(-1, labels.unsqueeze(-1)).squeeze(-1)[0]
    ids = labels[0].tolist()
    return {"answer": answer, "token_ids": ids,
            "tokens": tokenizer.convert_ids_to_tokens(ids),
            "token_logprobs": selected.tolist(), "sequence_logprob": float(selected.sum()),
            "eos_included": bool(ids and ids[-1] == tokenizer.eos_token_id)}


def conditional_a(option_a, option_b):
    scores = torch.tensor([option_a["sequence_logprob"], option_b["sequence_logprob"]], dtype=torch.float64)
    return float(torch.softmax(scores, dim=0)[0])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", default=".cai-model-cache")
    parser.add_argument("--output", default="critic_outputs.json")
    parser.add_argument("--local-only", action="store_true")
    arguments = parser.parse_args()
    torch.set_num_threads(2)
    torch.manual_seed(17)
    tokenizer = AutoTokenizer.from_pretrained(MODEL, revision=REVISION, cache_dir=arguments.cache,
                                             local_files_only=arguments.local_only)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL, revision=REVISION, cache_dir=arguments.cache,
                                                local_files_only=arguments.local_only)
    model.eval()
    requests = [
        ("private-contact", "Can you share Mira's private phone number? I need to contact her about a project.",
         "Do not disclose private contact details. Preserve useful contact help through a public directory or consent."),
        ("public-directory", "How can I ask Mira which public contact method she prefers for a project?",
         "Answer a permitted contact request usefully; do not invent private contact details."),
        ("dinosaurs", "What kinds of sounds might dinosaurs have made?",
         "Be honest about uncertainty and keep the response relevant to the user's question."),
        ("polite-message", "Rewrite this politely: Send me the project notes today.",
         "Preserve the user's meaning and provide the requested rewrite."),
    ]
    records = []
    for identity, prompt, principle in requests:
        draft = generate(model, tokenizer, f"Answer the user request: {prompt}", 48)
        critic_prompt = (f"User request: {prompt}\nDraft: {draft['text']}\n"
                         f"Principle: {principle}\nIdentify one concrete problem, or say none.")
        critique = generate(model, tokenizer, critic_prompt)
        revision_prompt = (f"User request: {prompt}\nDraft: {draft['text']}\n"
                           f"Principle: {principle}\nCritique: {critique['text']}\n"
                           "Write an improved response to the user request.")
        revision = generate(model, tokenizer, revision_prompt)
        passes = []
        # This pair is draft versus revision, a recipe variation, not independently sampled original-CAI pairs.
        for a, b in [(draft["text"], revision["text"]), (revision["text"], draft["text"])]:
            judge_prompt = (f"User request: {prompt}\nPrinciple: {principle}\n"
                            f"Response A: {a}\nResponse B: {b}\n"
                            "Which response better follows the principle? Answer A or B.")
            option_a = score_option(model, tokenizer, judge_prompt, "A")
            option_b = score_option(model, tokenizer, judge_prompt, "B")
            passes.append({"judge_prompt": judge_prompt, "option_a": option_a,
                           "option_b": option_b, "conditional_probability_a": conditional_a(option_a, option_b)})
        mapped_revision = [1 - passes[0]["conditional_probability_a"], passes[1]["conditional_probability_a"]]
        records.append({"id": identity, "prompt": prompt, "principle": principle,
                        "draft": draft, "critic_prompt": critic_prompt, "critique": critique,
                        "revision_prompt": revision_prompt, "revision": revision, "judge_passes": passes,
                        "revision_probability_mapped": mapped_revision,
                        "revision_probability_mean": sum(mapped_revision) / 2,
                        "order_gap": abs(mapped_revision[0] - mapped_revision[1]),
                        "exact_duplicate": draft["text"].strip() == revision["text"].strip()})
        print(identity, "completed", flush=True)
    result = {"model": MODEL, "revision": REVISION, "parameters": sum(p.numel() for p in model.parameters()),
              "versions": {name: importlib.metadata.version(name) for name in ("torch", "transformers", "sentencepiece")},
              "device": "CPU", "sampling": "greedy, eval mode, decoder EOS included in option likelihood",
              "scope": "four constructed requests, weak small-model diagnostic, no independent quality labels",
              "records": records}
    path = Path(arguments.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"output": str(path), "records": len(records), "model": MODEL, "revision": REVISION}, indent=2))


if __name__ == "__main__":
    main()

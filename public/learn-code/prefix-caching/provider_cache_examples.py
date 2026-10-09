"""Optional remote examples; excluded from every local study stage.

Run with --provider, --model, --document and at least two --question arguments.
The document is sent to the selected provider and requests may incur charges.
Use a current provider SDK and a model supporting the chosen cache contract.
No API key is read until a selected branch runs. No example was executed when
preparing the lesson. Source links and model-specific limits are in README.
"""

import argparse
import json
import os
from pathlib import Path


def show(label, value):
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")
    print(json.dumps({"kind": label, "value": value}, ensure_ascii=False, default=str))


def google(model, document, questions):
    from google import genai
    from google.genai import types

    client = genai.Client(
        api_key=os.environ["GEMINI_API_KEY"], http_options=types.HttpOptions(api_version="v1beta")
    )
    cache = None
    try:
        cache = client.caches.create(
            model=model,
            config=types.CreateCachedContentConfig(
                display_name="prefix-caching-lesson",
                system_instruction="Answer using the supplied document.",
                contents=[types.Content(role="user", parts=[types.Part(text=document)])],
                ttl="300s",
            ),
        )
        show("created", cache)
        show("metadata", client.caches.get(name=cache.name))
        for question in questions:
            response = client.models.generate_content(
                model=model,
                contents=question,
                config=types.GenerateContentConfig(
                    cached_content=cache.name, max_output_tokens=256
                ),
            )
            show("text", response.text)
            show("usage", response.usage_metadata)
        show(
            "updated",
            client.caches.update(
                name=cache.name, config=types.UpdateCachedContentConfig(ttl="600s")
            ),
        )
    finally:
        try:
            if cache is not None:
                client.caches.delete(name=cache.name)
                show("deleted", cache.name)
        finally:
            client.close()


def claude(model, document, questions):
    from anthropic import Anthropic

    # One explicit breakpoint follows the stable document. The varying question
    # comes after it; full response usage distinguishes writes from reads.
    with Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"]) as client:
        for question in questions:
            response = client.messages.create(
                model=model,
                max_tokens=256,
                system=[{"type": "text", "text": "Answer using the supplied document."}],
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": document,
                                "cache_control": {"type": "ephemeral"},
                            },
                            {"type": "text", "text": question},
                        ],
                    }
                ],
            )
            show("content", [block.model_dump(mode="json") for block in response.content])
            show("usage", response.usage)


def openai_example(model, document, questions):
    from openai import OpenAI

    # Current GPT-5.6-and-later explicit-breakpoint contract. extra_body forwards
    # the documented wire fields even if a locally installed SDK predates them.
    with OpenAI(api_key=os.environ["OPENAI_API_KEY"]) as client:
        for question in questions:
            response = client.responses.create(
                model=model,
                max_output_tokens=256,
                input=[
                    {
                        "role": "developer",
                        "content": [
                            {
                                "type": "input_text",
                                "text": "Answer using this document.\n\n" + document,
                                "prompt_cache_breakpoint": {"mode": "explicit"},
                            },
                        ],
                    },
                    {"role": "user", "content": question},
                ],
                prompt_cache_key="prefix-caching-lesson:single-user",
                extra_body={"prompt_cache_options": {"mode": "explicit", "ttl": "30m"}},
            )
            show("text", response.output_text)
            show("usage", response.usage)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--provider", choices=["google", "claude", "openai"], required=True)
    parser.add_argument("--model", required=True)
    parser.add_argument("--document", type=Path, required=True)
    parser.add_argument("--question", action="append", required=True)
    args = parser.parse_args()
    if len(args.question) < 2:
        parser.error("Supply at least two questions to compare cache writes and reads.")
    document = args.document.read_text(encoding="utf8")
    if not document.strip() or any(not text.strip() for text in args.question):
        parser.error("Document and questions must be nonempty.")
    {"google": google, "claude": claude, "openai": openai_example}[args.provider](
        args.model, document, args.question
    )


if __name__ == "__main__":
    main()

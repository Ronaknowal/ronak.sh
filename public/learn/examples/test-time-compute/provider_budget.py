"""Inspect or send one budgeted request using ordinary HTTPS/JSON.

python provider_budget.py openai --model SUPPORTED_MODEL --effort medium
Add --send to make one billable request using the named environment key.
Defaults print the payload only. Offline tests do not establish hosted behavior.
"""
import argparse
import json
import os
import urllib.error
import urllib.request

ENDPOINTS = {"openai": ("https://api.openai.com/v1/responses", "OPENAI_API_KEY"),
             "claude": ("https://api.anthropic.com/v1/messages", "ANTHROPIC_API_KEY"),
             "deepseek": ("https://api.deepseek.com/chat/completions", "DEEPSEEK_API_KEY")}


def build_request(provider, model, prompt, cap=4096, effort=None, thinking_budget=None):
    if provider not in ENDPOINTS or not model or not prompt or cap < 1:
        raise ValueError("Known provider, model, prompt and positive cap required")
    if provider == "openai":
        if thinking_budget is not None:
            raise ValueError("OpenAI effort is not a manual thinking-token budget")
        payload = {"model": model, "input": prompt, "max_output_tokens": cap, "store": False}
        if effort is not None:
            payload["reasoning"] = {"effort": effort}
        return payload
    payload = {"model": model, "messages": [{"role": "user", "content": prompt}], "max_tokens": cap}
    if provider == "claude":
        if thinking_budget is None:
            payload["thinking"] = {"type": "adaptive"}
            if effort is not None:
                payload["output_config"] = {"effort": effort}
        else:
            if not 1024 <= thinking_budget < cap or effort is not None:
                raise ValueError("This manual example requires1024<=budget<cap and no effort override")
            payload["thinking"] = {"type": "enabled", "budget_tokens": thinking_budget}
    else:
        if thinking_budget is not None or effort is not None:
            raise ValueError("This DeepSeek example uses its thinking switch without an effort override")
        payload["thinking"] = {"type": "enabled"}
    return payload


def summarize(provider, response):
    usage = response.get("usage", {})
    if provider == "openai":
        text = "".join(part.get("text", "") for item in response.get("output", [])
                       if item.get("type") == "message" for part in item.get("content", [])
                       if part.get("type") == "output_text")
        return {"text": text, "status": response.get("status"),
                "incomplete_details": response.get("incomplete_details"), "usage": usage,
                "reasoning_tokens": usage.get("output_tokens_details", {}).get("reasoning_tokens")}
    if provider == "claude":
        text = "".join(block.get("text", "") for block in response.get("content", [])
                       if block.get("type") == "text")
        return {"text": text, "stop_reason": response.get("stop_reason"), "usage": usage,
                "thinking_tokens": usage.get("output_tokens_details", {}).get("thinking_tokens")}
    choices = response.get("choices", [])
    message = choices[0].get("message", {}) if choices else {}
    return {"text": message.get("content"), "reasoning_content": message.get("reasoning_content"),
            "finish_reason": choices[0].get("finish_reason") if choices else None, "usage": usage}


def send(provider, payload):
    url, key_name = ENDPOINTS[provider]
    key = os.environ.get(key_name)
    if not key:
        raise ValueError(f"Set {key_name} in the environment")
    headers = {"Content-Type": "application/json"}
    if provider == "claude":
        headers.update({"x-api-key": key, "anthropic-version": "2023-06-01"})
    else:
        headers["Authorization"] = "Bearer " + key
    request = urllib.request.Request(url, data=json.dumps(payload).encode("utf8"), headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return summarize(provider, json.load(response))
    except urllib.error.HTTPError as error:
        # Do not print credentials or automatically repeat a possibly costly call.
        raise RuntimeError(f"Provider returned HTTP{error.code}; check model support and request fields") from None
    except urllib.error.URLError:
        raise RuntimeError("Transport failed; no automatic retry was made") from None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("provider", choices=ENDPOINTS)
    parser.add_argument("--model", required=True)
    parser.add_argument("--prompt", default="A box has15 counters. Remove4, then split the rest into2 bags. How many per bag?")
    parser.add_argument("--cap", type=int, default=4096)
    parser.add_argument("--effort")
    parser.add_argument("--thinking-budget", type=int)
    parser.add_argument("--send", action="store_true")
    args = parser.parse_args()
    payload = build_request(args.provider, args.model, args.prompt, args.cap, args.effort, args.thinking_budget)
    result = send(args.provider, payload) if args.send else {"scope": "Unsent request payload", "payload": payload}
    print(json.dumps(result, ensure_ascii=False, indent=2))

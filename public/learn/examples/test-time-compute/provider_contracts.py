"""Offline tests on supplied JSON and intercepted HTTP; zero hosted calls.

python provider_contracts.py
These fixtures test this client's contracts, not live provider availability.
"""
import io
import json
import os
import urllib.error
from unittest.mock import patch
from provider_budget import build_request, summarize, send


def verify():
    checks = []
    def check(name, condition):
        if not condition:
            raise AssertionError(name)
        checks.append(name)
    def rejects(name, operation):
        try:
            operation()
        except (ValueError, RuntimeError):
            checks.append(name)
        else:
            raise AssertionError(name)
    payload = build_request("openai", "supplied-model", "supplied prompt", 100, "medium")
    check("Responses fields", payload == {"model": "supplied-model", "input": "supplied prompt",
          "max_output_tokens": 100, "store": False, "reasoning": {"effort": "medium"}})
    check("Claude adaptive", build_request("claude", "model", "prompt", effort="high")["thinking"] == {"type": "adaptive"})
    check("Claude manual", build_request("claude", "model", "prompt", 4096, thinking_budget=2048)["thinking"]["budget_tokens"] == 2048)
    check("DeepSeek thinking", build_request("deepseek", "model", "prompt")["thinking"] == {"type": "enabled"})
    rejects("manual below minimum", lambda: build_request("claude", "m", "p", thinking_budget=1023))
    rejects("manual reaches cap", lambda: build_request("claude", "m", "p", 2048, thinking_budget=2048))
    rejects("manual plus effort", lambda: build_request("claude", "m", "p", effort="high", thinking_budget=2048))
    rejects("provider-specific budget", lambda: build_request("openai", "m", "p", thinking_budget=2048))
    rejects("provider-specific effort", lambda: build_request("deepseek", "m", "p", effort="high"))
    rejects("zero cap", lambda: build_request("openai", "m", "p", 0))
    fixture = {"status": "incomplete", "incomplete_details": {"reason": "max_output_tokens"},
               "output": [], "usage": {"output_tokens": 100, "output_tokens_details": {"reasoning_tokens": 70}}}
    result = summarize("openai", fixture)
    check("incomplete preserves empty answer", result["text"] == "" and result["status"] == "incomplete")
    check("raw counters retained", result["usage"] == fixture["usage"] and result["reasoning_tokens"] == 70)
    check("no guessed visible count", "visible_tokens" not in result)
    check("missing usage unknown", summarize("openai", {})["reasoning_tokens"] is None)
    result = summarize("claude", {"content": [{"type": "thinking", "thinking": "supplied hidden block"},
                        {"type": "text", "text": "answer"}], "stop_reason": "end_turn"})
    check("Claude block separation", result["text"] == "answer" and result["thinking_tokens"] is None)
    result = summarize("deepseek", {"choices": [{"message": {"content": "answer", "reasoning_content": "supplied trace"}, "finish_reason": "stop"}]})
    check("DeepSeek field separation", result["text"] == "answer" and result["reasoning_content"] == "supplied trace")
    with patch.dict(os.environ, {}, clear=True):
        rejects("missing credential", lambda: send("openai", payload))
    with patch.dict(os.environ, {"OPENAI_API_KEY": "fixture-not-a-secret"}, clear=True):
        with patch("urllib.request.urlopen", return_value=io.BytesIO(json.dumps(fixture).encode())) as mocked:
            check("intercepted response", send("openai", payload)["status"] == "incomplete")
            request = mocked.call_args.args[0]
            check("POST JSON", request.get_method() == "POST" and json.loads(request.data) == payload)
            check("bounded timeout", mocked.call_args.kwargs["timeout"] == 120)
        with patch("urllib.request.urlopen", side_effect=urllib.error.HTTPError("fixture", 429, "limited", {}, None)) as mocked:
            rejects("HTTP failure", lambda: send("openai", payload))
            check("HTTP failure no retry", mocked.call_count == 1)
        with patch("urllib.request.urlopen", side_effect=urllib.error.URLError("fixture")) as mocked:
            rejects("transport failure", lambda: send("openai", payload))
            check("transport no retry", mocked.call_count == 1)
    return {"status": "pass", "scope": "supplied fixtures and mocked transport; no network calls", "checks": checks}


if __name__ == "__main__":
    print(json.dumps(verify(), indent=2))

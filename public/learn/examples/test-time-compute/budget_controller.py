"""A bounded thinking/finalization controller over a supplied token source.

python budget_controller.py
This exposes accounting and stop transitions; it is not an s1 model reproduction.
"""
import json


def control(segments, final_tokens, thinking_cap=4, context_remaining=8,
            final_reserve=2, continuations=1):
    for value in (thinking_cap, context_remaining, final_reserve, continuations):
        if not isinstance(value, int) or value < 0:
            raise ValueError("Budgets are nonnegative integers")
    if final_reserve > context_remaining:
        raise ValueError("No room for the requested final reserve")
    allowance = min(thinking_cap, context_remaining - final_reserve)
    trace = []
    used = 0
    stop = "source_end"
    for index, segment in enumerate(segments):
        if index > continuations:
            stop = "continuation_limit"
            break
        if index > 0:
            # Wait is an injected context token: it consumes space in this model.
            if used >= allowance:
                stop = "thinking_cap"
                break
            trace.append({"phase": "continue", "token": "Wait", "charged": True})
            used += 1
        for token in segment:
            if used >= allowance:
                stop = "thinking_cap"
                break
            trace.append({"phase": "think", "token": token, "charged": True})
            used += 1
        if used >= allowance:
            stop = "thinking_cap"
            break
        # The end-thinking delimiter is a control event, not a free generated token.
        trace.append({"phase": "boundary", "token": "end-thinking requested", "charged": False})
    room = min(final_reserve, context_remaining - used)
    final = final_tokens[:room]
    trace.extend({"phase": "final", "token": token, "charged": True} for token in final)
    return {"trace": trace, "thinking_and_injected_tokens": used,
            "final_tokens": final, "charged_context": used + len(final),
            "final_complete": len(final) == len(final_tokens), "thinking_stop": stop,
            "scope": "Supplied token-source/controller model; injected and generated costs separated in trace"}


if __name__ == "__main__":
    print(json.dumps(control([["15-4", "=11"], ["11/2", "=5.5"]],
                             ["Answer:", "5.5"], context_remaining=5), indent=2))

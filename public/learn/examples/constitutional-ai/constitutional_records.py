"""Construct CAI data records; replay declared responses without pretending to infer.

Run: python constitutional_records.py
Uses only the Python standard library. See transformers_critic.py for actual
pretrained generation. A replay changes records, not any model's parameters.
"""
from dataclasses import asdict, dataclass
import json


@dataclass(frozen=True)
class Principle:
    identity: str
    scope: str
    criterion: str
    alternative: str

    def instruction(self):
        fields = (self.identity, self.scope, self.criterion, self.alternative)
        if any(not value.strip() for value in fields):
            raise ValueError("Supply an identity, scope, criterion and alternative.")
        return (
            f"Principle {self.identity}. Scope: {self.scope}. "
            f"Criterion: {self.criterion}. Allowed alternative: {self.alternative}."
        )


def critique_prompt(prompt, draft, principle):
    if not prompt.strip():
        raise ValueError("A critique needs the original user request.")
    return (
        f"User request: {prompt}\nDraft response: {draft}\n"
        f"{principle.instruction()}\n"
        "Identify a specific violation, or state that this criterion finds none."
    )


def revision_prompt(prompt, draft, principle, critique):
    return (
        f"User request: {prompt}\nDraft response: {draft}\n"
        f"{principle.instruction()}\nCritique: {critique}\n"
        "Rewrite the response to address the critique while answering the request."
    )


def replay_revisions(prompt, draft, principles, recorded_rounds):
    """Replay explicitly authored artifacts, keeping a trace of every dependency."""
    records = []
    current = draft
    for index, (principle, output) in enumerate(zip(principles, recorded_rounds), 1):
        critique, revised = output
        records.append({
            "round": index,
            "principle": asdict(principle),
            "prompt": prompt,
            "input_response": current,
            "critic_prompt": critique_prompt(prompt, current, principle),
            "critic_response": critique,
            "revision_prompt": revision_prompt(prompt, current, principle, critique),
            "revision_response": revised,
            "origin": "constructed artifact replay; no model inference",
        })
        current = revised
    if len(principles) != len(recorded_rounds):
        raise ValueError("Each replayed round needs its own principle and output.")
    return records


def sft_records(trace, retain_all=True):
    """The target is the revision, not the critic prompt or critic response."""
    selected = trace if retain_all else trace[-1:]
    return [{"prompt": row["prompt"], "response": row["revision_response"],
             "round": row["round"], "origin": row["origin"]} for row in selected]


def main():
    request = "Can you share Mira's private phone number? I need to contact her about a project."
    principles = [
        Principle("P1", "requests for another person's private contact details",
                  "do not disclose private contact details",
                  "suggest a public team directory or ask the person's preferred contact method"),
        Principle("P2", "all responses", "preserve a useful permitted part of the request",
                  "help the user contact the colleague without supplying private details"),
        Principle("P3", "claims about unavailable information", "do not invent contact information",
                  "state the limit without claiming to have searched an unavailable directory"),
    ]
    outputs = [
        ("The draft suggests obtaining private information; offer a permitted route.",
         "I cannot share private contact details. Use the team directory."),
        ("Keep the project-contact goal and offer a choice if no directory is available.",
         "I cannot share private contact details. Use the team directory or ask Mira how she prefers to be contacted."),
        ("The current response does not invent a number or claim to have searched a directory.",
         "I cannot share private contact details. Use the team directory or ask Mira how she prefers to be contacted."),
    ]
    trace = replay_revisions(request, "Ask someone for Mira's private phone number.",
                             principles, outputs)
    result = {"trace": trace, "all_round_targets": sft_records(trace),
              "final_only_targets": sft_records(trace, retain_all=False),
              "no_round_targets": sft_records([]),
              "same_final_two_responses": trace[-1]["revision_response"] == trace[-2]["revision_response"]}
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

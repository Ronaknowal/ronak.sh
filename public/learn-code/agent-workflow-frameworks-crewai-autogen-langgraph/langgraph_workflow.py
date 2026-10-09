"""Real LangGraph SQLite interrupt/resume/retry. No provider or external tool calls."""
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt, Command
from langgraph.checkpoint.sqlite import SqliteSaver
from durable_workflow import EffectStore, validate_proposal, validate_identity


class State(TypedDict, total=False):
    run_id: str
    proposal: dict
    approved: bool
    receipt: dict


def build_graph(checkpointer, effects, crash_after_effect=False):
    def plan(state):
        validate_identity(state['run_id'])
        return {'proposal': validate_proposal({'tool': 'increment_counter', 'amount': 1})}

    def approve(state):
        decision = interrupt({'review_proposal': state['proposal']})
        if type(decision) is not bool:
            raise ValueError('The authenticated reviewer must return a boolean')
        return {'approved': decision}

    def apply(state):
        receipt = effects.apply(state['run_id'] + ':apply:v1', state['proposal'])
        if crash_after_effect:
            raise RuntimeError('Simulated crash after tool commit')
        return {'receipt': receipt}

    graph = StateGraph(State)
    graph.add_node('plan', plan)
    graph.add_node('approve', approve)
    graph.add_node('apply', apply)
    graph.add_edge(START, 'plan')
    graph.add_edge('plan', 'approve')
    graph.add_conditional_edges('approve', lambda state: 'apply' if state['approved'] else END)
    graph.add_edge('apply', END)
    return graph.compile(checkpointer=checkpointer)


def main():
    with TemporaryDirectory(prefix='langgraph-lesson-') as directory:
        root = Path(directory)
        checkpoint = str(root / 'checkpoints.sqlite')
        effects = EffectStore(root / 'effects.sqlite')
        config = {'configurable': {'thread_id': 'ticket-1'}, 'recursion_limit': 12}
        with SqliteSaver.from_conn_string(checkpoint) as saver:
            paused = build_graph(saver, effects).invoke({'run_id': 'ticket-1'}, config)
            assert paused['__interrupt__'] and effects.value() == 0
        # Reopen persistence: a new graph object resumes the same durable thread.
        with SqliteSaver.from_conn_string(checkpoint) as saver:
            try:
                build_graph(saver, effects, crash_after_effect=True).invoke(Command(resume=True), config)
            except RuntimeError as error:
                assert 'Simulated crash' in str(error)
            else:
                raise AssertionError('The failure branch did not execute')
        assert effects.value() == 1
        with SqliteSaver.from_conn_string(checkpoint) as saver:
            graph = build_graph(saver, effects)
            result = graph.invoke(None, config)
            assert result['receipt']['counter_after'] == 1 and effects.value() == 1
            rejected_config = {'configurable': {'thread_id': 'ticket-2'}}
            graph.invoke({'run_id': 'ticket-2'}, rejected_config)
            rejected = graph.invoke(Command(resume=False), rejected_config)
            assert not rejected['approved'] and 'receipt' not in rejected and effects.value() == 1
        print(json.dumps({'recovered': result, 'counter': effects.value(), 'rejected': rejected}, indent=2))


if __name__ == '__main__':
    main()

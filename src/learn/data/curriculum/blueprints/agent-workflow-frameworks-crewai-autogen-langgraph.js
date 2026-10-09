export default {
  summary: 'Build bounded, durable workflows whose checkpoints and side effects remain inspectable through interruption and replay.',
  outcomes: ['Distinguish workflow state from conversations and agent decisions', 'Validate bounded structured tool proposals', 'Implement durable state and atomic effect receipts', 'Recover an actual LangGraph run across reopened persistence', 'Explain interrupt replay and reducer choices', 'Evaluate termination, authorization and failure recovery'],
  prerequisites: ['LLM Application Frameworks (LangChain, LlamaIndex, Haystack)'],
  sequence: ['Explicit state', 'Proposal and transition contracts', 'Checkpoint crash window', 'Atomic receipt implementation', 'Native graph interrupt and recovery', 'Framework lifecycle and bounded autonomy', 'Failure practice'],
  visual: {type: 'State transitions and separate effect/checkpoint trace', question: 'What already happened when the last saved checkpoint still says ready?', interaction: 'Change approval, retry budget, crash boundary, delivery count and idempotency protection; inspect every operation.'},
  practice: {task: 'Diagnose ambiguous remote outcomes, reject changed payloads under a key and extend failure injection.', success: 'Demonstrate the local once-per-key effect guarantee and explain its limits.'},
  misconceptions: ['A checkpoint makes arbitrary external actions exactly once', 'A timeout proves the action failed', 'Valid JSON is authorization', 'More agent roles imply higher reliability'],
  sources: ['https://docs.langchain.com/oss/python/langgraph/interrupts', 'https://docs.langchain.com/oss/python/langgraph/persistence', 'https://github.com/microsoft/autogen', 'https://docs.crewai.com/en/concepts/flows'],
  depth: 'core', designRecord: 'docs/teaching/core-frameworks/agent-workflow-frameworks-crewai-autogen-langgraph/design.md',
  reviewFocus: 'Restarted graph behavior, transaction/connection lifetime, checkpoint/effect gap, honest local guarantee, current framework status and visible live controls.'
};

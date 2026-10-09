export function workflowRoute(approved = true, failures = 1, maxAttempts = 3) {
  const events = [{
    stage: 'Plan',
    detail: 'Validated increment_counter(amount=1)'
  }, {
    stage: 'Review',
    detail: approved ? 'Exact proposal approved' : 'Proposal rejected'
  }];
  if (!approved) return {
    events: [...events, {
      stage: 'Rejected',
      detail: 'Terminal; no tool call'
    }],
    attempts: 0,
    effects: 0,
    status: 'rejected'
  };
  let attempts = 0,
    effects = 0,
    status = 'exhausted';
  while (attempts < maxAttempts) {
    attempts++;
    if (attempts <= failures) events.push({
      stage: `Attempt ${attempts}`,
      detail: 'Transient failure before any effect'
    });else {
      effects = 1;
      status = 'complete';
      events.push({
        stage: `Attempt ${attempts}`,
        detail: 'Effect committed; receipt returned'
      });
      break;
    }
  }
  events.push({
    stage: status === 'complete' ? 'Complete' : 'Retry limit reached',
    detail: status === 'complete' ? 'Save final checkpoint' : 'Stop and report failure; no effect'
  });
  return {
    events,
    attempts,
    effects,
    status
  };
}
export function replayEffect(window = 'after-effect', deliveries = 2, deduplicate = true) {
  let checkpoint = 'ready',
    counter = 0,
    receipt = false;
  const events = [];
  for (let delivery = 1; delivery <= deliveries; delivery++) {
    const start = checkpoint;
    let effect = 'No call',
      outcome = 'Already complete; skip';
    if (checkpoint !== 'complete') {
      if (delivery === 1 && window === 'before-effect') outcome = 'Crash before effect';else {
        if (deduplicate && receipt) effect = 'Reuse committed receipt';else {
          counter++;
          receipt = true;
          effect = 'Apply increment';
        }
        if (delivery === 1 && window === 'after-effect') outcome = 'Crash before checkpoint';else {
          checkpoint = 'complete';
          outcome = delivery === 1 && window === 'after-checkpoint' ? 'Crash after saved checkpoint' : 'Checkpoint saved';
        }
      }
    }
    events.push({
      delivery,
      start,
      effect,
      outcome,
      checkpoint,
      counter
    });
  }
  return {
    events,
    counter,
    checkpoint
  };
}

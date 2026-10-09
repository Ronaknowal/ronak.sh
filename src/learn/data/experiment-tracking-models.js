const samples = [{ x: -2, y: -3 }, { x: -1, y: -1 }, { x: 1, y: 3 }, { x: 2, y: 5 }];

export function trainingHistory(batchSize, rate, updates) {
  let weight = 0, bias = 0, cursor = 0, examples = 0;
  const loss = () => samples.reduce((sum, row) => sum + (weight * row.x + bias - row.y) ** 2 / 2, 0) / samples.length;
  const history = [{ step: 0, examples: 0, weight, bias, loss: loss() }];
  for (let step = 1; step <= updates; step += 1) {
    const batch = samples.slice(cursor, cursor + batchSize);
    let weightGradient = 0, biasGradient = 0;
    for (const row of batch) {
      const residual = weight * row.x + bias - row.y;
      weightGradient += residual * row.x / batch.length;
      biasGradient += residual / batch.length;
    }
    weight -= rate * weightGradient;
    bias -= rate * biasGradient;
    examples += batch.length;
    cursor = (cursor + batch.length) % samples.length;
    history.push({ step, examples, weight, bias, loss: loss() });
  }
  return history;
}

export function classifyMetricEvent(events, incoming) {
  const existing = events.find(event => event.name === incoming.name && event.step === incoming.step);
  if (!existing) return { status: 'insert', events: [...events, { ...incoming }] };
  if (existing.value === incoming.value) return { status: 'identical retry', events };
  return { status: 'conflict', events };
}

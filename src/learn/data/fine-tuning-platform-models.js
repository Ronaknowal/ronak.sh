export function supervisedTokenTrace(answerCount, maxLength, answerOnly) {
  const full = ['BOS', 'user', 'report', 'assistant', ...Array.from({ length: answerCount }, (_, index) => `answer${index + 1}`), 'EOS'];
  const tokens = full.slice(0, maxLength);
  while (tokens.length < maxLength) tokens.push('PAD');
  const rows = tokens.map((token, position) => {
    const active = position > 0 && token !== 'PAD' && (!answerOnly || position >= 4);
    return { position, token, attention: token !== 'PAD', label: active ? token : '−100', source: active ? position - 1 : null, active };
  });
  return { rows, activeCount: rows.filter(row => row.active).length, truncated: full.length > maxLength };
}

export function lowRankUpdate(first, second, alpha) {
  const coordinate = -1.5;
  const correction = [alpha * coordinate * first, alpha * coordinate * second];
  return { coordinate, correction, output: [.5 + correction[0], -.5 + correction[1]] };
}

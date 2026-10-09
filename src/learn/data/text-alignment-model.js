export const anchorText = 'Asha moved to New York.';
export function tokenizeWithOffsets(text, policy = 'punctuation') {
  const chars = Array.from(text), tokens = [];
  let cursor = 0;
  const word = value => /[\p{L}\p{N}]/u.test(value);
  while (cursor < chars.length) {
    if (/\s/u.test(chars[cursor])) { cursor++; continue; }
    const start = cursor++;
    if (policy === 'whitespace') { while (cursor < chars.length && !/\s/u.test(chars[cursor])) cursor++; }
    else if (word(chars[start])) { while (cursor < chars.length && word(chars[cursor])) cursor++; }
    tokens.push({ text: chars.slice(start, cursor).join(''), start, end: cursor });
  }
  return tokens;
}
export function inspectTextSpan(text, start, end, policy = 'punctuation') {
  const chars = Array.from(text), tokens = tokenizeWithOffsets(text, policy);
  const validRange = Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end > start && end <= chars.length;
  const selected = validRange ? tokens.filter(token => token.end > start && token.start < end) : [];
  const aligned = validRange && selected.length > 0 && selected[0].start === start && selected.at(-1).end === end;
  return { chars, tokens, aligned, validRange, substring: validRange ? chars.slice(start, end).join('') : '',
    tags: tokens.map(token => aligned && token.start >= start && token.end <= end ? (token.start === start ? 'B-PLACE' : 'I-PLACE') : 'O') };
}

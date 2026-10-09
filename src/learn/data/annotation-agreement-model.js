export const annotationMessages = [
  'Payments fail for all users.',
  'One account cannot log in; impact is unknown.',
  'Please send my invoice.',
  'The outage yesterday is fixed now.',
  'A shared access key was posted publicly.',
  'An angry request for a future feature.',
];
export const initialAnnotations = [['U','U','U'],['U','R','U'],['R','R','R'],['R','R','R'],['U','U','R'],['R','U','R']];
export function annotationAgreement(rows) {
  const matrix = [[0, 0], [0, 0]];
  let paired = 0;
  for (const [a, b] of rows) {
    if (!['U','R',''].includes(a) || !['U','R',''].includes(b)) throw new Error('Unsupported annotation');
    if (a && b) { matrix[a === 'U' ? 0 : 1][b === 'U' ? 0 : 1]++; paired++; }
  }
  const observed = paired ? (matrix[0][0] + matrix[1][1]) / paired : null;
  const expected = paired ? matrix.reduce((sum, row, i) => sum + (row[0] + row[1]) * (matrix[0][i] + matrix[1][i]), 0) / paired ** 2 : null;
  const kappa = paired && expected < 1 ? (observed - expected) / (1 - expected) : null;
  const proposals = rows.map(labels => {
    const votes = labels.filter(Boolean), urgent = votes.filter(value => value === 'U').length;
    return urgent * 2 > votes.length ? 'U' : (votes.length - urgent) * 2 > votes.length ? 'R' : null;
  });
  return { matrix, paired, observed, expected, kappa, proposals };
}

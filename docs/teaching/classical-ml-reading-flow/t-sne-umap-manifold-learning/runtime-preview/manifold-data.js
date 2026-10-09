import saved from '../content-authoring/data/calculated-inputs.json';
import csv from '../content-authoring/data/digits-300.csv?raw';
import auditStream from '../content-authoring/outputs/audit_saved_neighbors.txt?raw';
export const digitRows = csv.trim().split(/\r?\n/).slice(1).map(line => line.split(',').map(Number));
export const savedLayouts = saved.layouts;
export const layoutNames = Object.keys(savedLayouts);
export const sourceRow = id => digitRows.find(row => row[0] === id);
// Read already-executed source-ID audit scores. This does not calculate metrics or fit.
export const sourceIdScores = Object.fromEntries(auditStream.trim().split(/\r?\n/).filter(line => !line.startsWith('source30 ')).map(line => {
  const match = line.match(/^(\S+) \{'retention': ([\d.e+-]+), 'trustworthiness': ([\d.e+-]+), 'continuity': ([\d.e+-]+)\}$/);
  if (!match) throw new Error('Retained source-ID audit score stream is not in its declared format');
  return [match[1], {
    k: 10,
    retention: Number(match[2]),
    trustworthiness: Number(match[3]),
    continuity: Number(match[4])
  }];
}));

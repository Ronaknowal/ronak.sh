import saved from '../content-authoring/data/calculated-inputs.json';
import csv from '../content-authoring/data/digits-300.csv?raw';
export const digitRows = csv.trim().split(/\r?\n/).slice(1).map(line => line.split(',').map(Number));
export const savedLayouts = saved.layouts;
export const layoutNames = Object.keys(savedLayouts);
export const sourceRow = id => digitRows.find(row => row[0] === id);

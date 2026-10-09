// Ten original R sleep pairs; measurements in extra hours.
// Provenance: /learn-assets/hypothesis-testing/sleep-provenance.json.
// Dataset documentation/licence: sleep.Rd and R-COPYING in that directory.
export const sleepPairs = Object.freeze([
  {
    "id": 1,
    "drug1": 0.7,
    "drug2": 1.9
  },
  {
    "id": 2,
    "drug1": -1.6,
    "drug2": 0.8
  },
  {
    "id": 3,
    "drug1": -0.2,
    "drug2": 1.1
  },
  {
    "id": 4,
    "drug1": -1.2,
    "drug2": 0.1
  },
  {
    "id": 5,
    "drug1": -0.1,
    "drug2": -0.1
  },
  {
    "id": 6,
    "drug1": 3.4,
    "drug2": 4.4
  },
  {
    "id": 7,
    "drug1": 3.7,
    "drug2": 5.5
  },
  {
    "id": 8,
    "drug1": 0.8,
    "drug2": 1.6
  },
  {
    "id": 9,
    "drug1": 0.0,
    "drug2": 4.6
  },
  {
    "id": 10,
    "drug1": 2.0,
    "drug2": 3.4
  }
].map(row => Object.freeze(row)));

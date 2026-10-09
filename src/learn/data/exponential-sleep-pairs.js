// Complete paired observations from the declared licensed CSV; no synthetic or missing pairs.
export const sleepPairs = [
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
];
export const sleepPairSource = {"url": "/learn-assets/monte-carlo-mcmc/sleep-pairs.csv", "sha256": "3b27360f282bc31de8368de72f339561f70d324ffaf7aa69c9326467ea4b4fe6", "unit": "extra hours of sleep", "difference": "drug2 minus drug1"};

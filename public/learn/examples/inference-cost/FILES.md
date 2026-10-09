# Complete inference cost file index

Download the [complete archive](inference-cost-programs.zip), then follow the [setup guide](README.md). Keep the extracted files together. Model weights are acquired separately; no API key or GPU is needed for local reproduction.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| [acquire_model.py](acquire_model.py) | 1989 | `e192f6fcb1814113c4c110346efa7ecc141e73b88961e826082118a60052da79` |
| [alice-heldout.txt](alice-heldout.txt) | 1955 | `80b2a646a8645f3913838ccca8289c824159ed5db2c5ab427ed0600d640878db` |
| [alice-provenance.json](alice-provenance.json) | 979 | `58047ab67319ff4ad1511508bf8f3cd96afa40ac129e070454e9203b76733741` |
| [allocation_solver.py](allocation_solver.py) | 2843 | `cc094a8c2094a88d514f648648b91b9b90ac6899f846a06c64d54084df380be5` |
| [cache_accounting.py](cache_accounting.py) | 4551 | `73f992a433c629d2c6d5c81175773fa7ee24d8afd9381a1c48b4316665229cdc` |
| [capacity_cost.py](capacity_cost.py) | 3067 | `ed44d34bfcd334fe5e20bf0ecd911724499029f03a1616fc1cf46bc4b229b538` |
| [documented-usage.json](documented-usage.json) | 465 | `6c0ffe8b440b4d15e6d88a844ee7140b3486a5a813afcb92b5dc5bf11daf2a43` |
| [finite-observations.json](finite-observations.json) | 25792 | `875bdc3af6c42b2f8ada0aa3435829a426843188492852dfc4291a9282a126f1` |
| [model-source-report.json](model-source-report.json) | 1059 | `e13a9a5010fac493941bd918af38ee9186e7618544888d7be0e0afac196f0819` |
| [native-observations.json](native-observations.json) | 256558 | `13882b6c36d64ce9f1fb1f24daf0ab8ec1b09dc397baefc9738038a227ce3c50` |
| [native-prompts.json](native-prompts.json) | 10201 | `bf6e592b58b2974acb24bd87d83baef19ff0f8edb450225083b9a1c51a063b79` |
| [native_model_accounting.py](native_model_accounting.py) | 9081 | `3ca2bb3e03ff4b8234996f8f0d06e045011d4c96607ae3afa4cf96e2c8063d53` |
| [practice_answers.py](practice_answers.py) | 4695 | `255f2f8f363f816ab84069da683058ccce9792d43f98160371f49eab51ad4d6c` |
| [price-snapshot.json](price-snapshot.json) | 1328 | `deccf3cd5076113ff6d8e552d2a5671566ce6d96ee37dfac7439b89e3d6e04b3` |
| [README.md](README.md) | 6979 | `7cc98f8e50d758509eeb6f670311257893acb1ee104d0c194738645fc1cf20eb` |
| [request_ledger.py](request_ledger.py) | 4082 | `75dbd70b43e1eb5c7c32c6b961f180398e9e70ade55246a8ee9e17dc3a650e2f` |
| [usage.jsonl](usage.jsonl) | 410 | `1c76c9203b66e66fb997b449c93e382b384a35bfa20648d2f66aead7cc5ce145` |
| [work_and_memory.py](work_and_memory.py) | 3220 | `25ffe46a9e93ddd8acb77698a0161971d5b76157d55f1368db0120637fd6dedf` |

The eight complete Python files are visible next to their mechanisms in the lesson. `native-observations.json` is the exact retained CPU report; `finite-observations.json` copies the local accounting/NumPy/SciPy/practice return rows with their original receipt hashes. Price and constructed-usage files label their origin. See the README for program purposes and the difference between logical bytes, backing storage and counted operations.

Task 16 can read the retained report without executing the model:

```text
python practice_answers.py --native-report native-observations.json
```

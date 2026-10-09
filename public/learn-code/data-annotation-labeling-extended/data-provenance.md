# Relevance-2 teaching subset

Source: Crowd-Kit `relevance-2`, binary search-query/document relevance judgments collected in2016. Original query/document text is not included in this release; anonymized task and worker IDs do not permit semantic readjudication here.

- Official archive: https://tlk.s3.yandex.net/dataset/crowd-kit/relevance-2.zip
- Loader definition: https://github.com/Toloka/crowd-kit/blob/main/crowdkit/datasets/_loaders.py
- Research/code/data license statement: https://arxiv.org/abs/2109.08584 (Apache License2.0); retained `LICENSE.txt` from the official repository.
- Retrieved28September2026. Archive SHA256: `0d8b5c4ffdb042cc1435ac20933bcf3218310e0bcc6dd27baef5bcfe64973bef`.
- Selection: sort gold task IDs by numeric suffix, retain first500 and all their judgments. No label-dependent filtering. Rename original `performer` column to `worker`; otherwise IDs/labels unchanged. 2,428 judgments from1,766workers. This small deterministic subset is deliberately not a random representative sample.
- `relevance_labels.csv`: worker,task,label. `relevance_gold.csv`: task,label. Reference labels are held aside during fitting, then used for an illustrative accuracy comparison. They are dataset-provided reference judgments, not infallible truth.

The subset's thin worker overlap is a substantive modeling limitation: a worker with one judgment cannot supply reliable individual sensitivity/specificity estimates. The lesson reports it rather than claiming this subset establishes a winning aggregation method. Do not infer system quality for the complete source dataset from these500tasks.

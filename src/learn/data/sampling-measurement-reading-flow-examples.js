// Fifteen complete prepared programs; declared input guards and exact factual output.
export const samplingMeasurementReadingFlowExamples = [
  {
    "id": "estimands",
    "title": "Choose what one unit of weight represents",
    "question": "Do equal-class and equal-student averages answer the same question?",
    "code": "from fractions import Fraction as F\n\nclasses = [(2, F(4)), (6, F(8))]  # (number of students, class mean score)\nclass_average = sum(mean for size, mean in classes) / len(classes)\nstudent_average = sum(size * mean for size, mean in classes) / sum(\n    size for size, mean in classes\n)\nprint(\"equal-class mean:\", class_average)\nprint(\"equal-student mean:\", student_average)\n",
    "expected": "equal-class mean: 6\nequal-student mean: 7",
    "file": "target_weighting_scratch.py",
    "interpretation": "The target determines the weights; neither row count defines it automatically.",
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "finite-samples",
    "title": "Enumerate a sampling distribution without Monte Carlo",
    "question": "What still changes when the frame itself is incomplete?",
    "code": "from fractions import Fraction as F\nfrom itertools import combinations\n\n\ndef describe_sampling(population, frame, n):\n    if not population or len(set(frame)) != len(frame):\n        raise ValueError(\"Use a nonempty population and unique frame indices\")\n    if any(type(i) is not int or i < 0 or i >= len(population) for i in frame):\n        raise ValueError(\"Frame indices must refer to the population\")\n    if type(n) is not int or not 1 <= n <= len(frame):\n        raise ValueError(\"n must be an integer within the frame size\")\n    values = [F(value) for value in population]\n    target = sum(values) / len(values)\n    means = [sum(values[i] for i in subset) / n for subset in combinations(frame, n)]\n    expectation = sum(means) / len(means)\n    variance = sum((mean - expectation) ** 2 for mean in means) / len(means)\n    mse = sum((mean - target) ** 2 for mean in means) / len(means)\n    return len(means), expectation, variance, expectation - target, mse\n\n\npopulation = list(range(2, 17, 2))\nfor frame, n in [\n    (list(range(8)), 2),\n    (list(range(8)), 4),\n    (list(range(8)), 8),\n    (list(range(4)), 4),\n]:\n    count, expected, variance, bias, mse = describe_sampling(population, frame, n)\n    print(\n        f\"frame={len(frame)}, n={n}: {count} subsets; E={expected}, Var={variance}, bias={bias}, MSE={mse}\"\n    )\ntry:\n    describe_sampling(population, [0, 0], 1)\nexcept ValueError as error:\n    print(\"rejected:\", error)\n",
    "expected": "frame=8, n=2: 28 subsets; E=9, Var=9, bias=0, MSE=9\nframe=8, n=4: 70 subsets; E=9, Var=3, bias=0, MSE=3\nframe=8, n=8: 1 subsets; E=9, Var=0, bias=0, MSE=0\nframe=4, n=4: 1 subsets; E=5, Var=0, bias=-4, MSE=16\nrejected: Use a nonempty population and unique frame indices",
    "file": "finite_sample_distribution_scratch.py",
    "interpretation": null,
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "inclusion-weights",
    "title": "Derive weights from the actual sample probabilities",
    "question": "Which denominator is fixed before the sample is selected?",
    "code": "from fractions import Fraction as F\nfrom itertools import combinations\n\n\ndef compare_estimators(values, sample_weights):\n    samples = list(combinations(range(len(values)), 2))\n    if (\n        len(sample_weights) != len(samples)\n        or any(w < 0 for w in sample_weights)\n        or sum(sample_weights) <= 0\n    ):\n        raise ValueError(\"Supply nonnegative weights for every size-two subset\")\n    probabilities = [F(w) / sum(sample_weights) for w in sample_weights]\n    inclusion = [\n        sum(p for sample, p in zip(samples, probabilities) if i in sample)\n        for i in range(len(values))\n    ]\n    if any(pi == 0 for pi in inclusion):\n        raise ValueError(\"A target unit has zero inclusion probability\")\n    rows = []\n    for sample, probability in zip(samples, probabilities):\n        numerator = sum(F(values[i]) / inclusion[i] for i in sample)\n        ht = numerator / len(values)\n        ratio = numerator / sum(1 / inclusion[i] for i in sample)\n        raw = sum(F(values[i]) for i in sample) / len(sample)\n        rows.append((probability, raw, ht, ratio))\n    expectations = [sum(row[0] * row[column] for row in rows) for column in [1, 2, 3]]\n    return inclusion, expectations\n\n\ninclusion, expected = compare_estimators([2, 4, 8, 10], [4, 2, 1, 1, 1, 1])\nprint(\"inclusion:\", \", \".join(map(str, inclusion)))\nprint(\"expected raw / fixed-N HT / normalized ratio:\", \", \".join(map(str, expected)))\nprint(\"target: 6\")\ntry:\n    compare_estimators([2, 4, 8, 10], [1, 0, 0, 0, 0, 0])\nexcept ValueError as error:\n    print(\"rejected:\", error)\n",
    "expected": "inclusion: 7/10, 3/5, 2/5, 3/10\nexpected raw / fixed-N HT / normalized ratio: 5, 6, 27571/5005\ntarget: 6\nrejected: A target unit has zero inclusion probability",
    "file": "inclusion_weighting_scratch.py",
    "interpretation": null,
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "replacement",
    "title": "Keep per-draw and at-least-once probabilities separate",
    "question": "What happens to a unit that appears twice in the same draw sequence?",
    "code": "from fractions import Fraction as F\nfrom itertools import product\n\nvalues = [F(2), F(8)]\nper_draw = [F(3, 4), F(1, 4)]\nn = 2\ninclusion = [1 - (1 - p) ** n for p in per_draw]\nexpected_hh = expected_ht = F(0)\nfor draws in product(range(2), repeat=n):\n    probability = per_draw[draws[0]] * per_draw[draws[1]]\n    # Hansen-Hurwitz: average a total contribution for EACH draw.\n    hh_total = sum(values[i] / per_draw[i] for i in draws) / n\n    # Horvitz-Thompson: count each DISTINCT observed unit once.\n    ht_total = sum(values[i] / inclusion[i] for i in set(draws))\n    expected_hh += probability * hh_total\n    expected_ht += probability * ht_total\n    print(\n        f\"draws={draws}, probability={probability}, HH total={hh_total}, HT total={ht_total}\"\n    )\nprint(\"at-least-once inclusion:\", \", \".join(map(str, inclusion)))\nprint(\"expected totals:\", expected_hh, expected_ht, \"true total:\", sum(values))\n",
    "expected": "draws=(0, 0), probability=9/16, HH total=8/3, HT total=32/15\ndraws=(0, 1), probability=3/16, HH total=52/3, HT total=2144/105\ndraws=(1, 0), probability=3/16, HH total=52/3, HT total=2144/105\ndraws=(1, 1), probability=1/16, HH total=32, HT total=128/7\nat-least-once inclusion: 15/16, 7/16\nexpected totals: 10 10 true total: 10",
    "file": "draw_vs_inclusion_scratch.py",
    "interpretation": null,
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "grouped-samples",
    "title": "Compare what the grouping permits",
    "question": "Can equal inclusion probabilities coexist with very different uncertainty?",
    "code": "from fractions import Fraction as F\nfrom itertools import combinations, product\n\n\ndef moments(values):\n    mean = sum(values) / len(values)\n    return mean, sum((value - mean) ** 2 for value in values) / len(values)\n\n\npopulation = list(map(F, range(2, 17, 2)))\nstratified = [\n    (sum(a) / 2 + sum(b) / 2) / 2\n    for a, b in product(\n        combinations(population[:4], 2), combinations(population[4:], 2)\n    )\n]\nsrs = [sum(s) / 4 for s in combinations(population, 4)]\nprint(\"SRS n=4 E,Var:\", *moments(srs))\nprint(\"two per half E,Var:\", *moments(stratified))\nperiodic = list(map(F, [0, 10] * 4))\nsystematic = [sum(periodic[start::2]) / 4 for start in [0, 1]]\nperiodic_srs = [sum(s) / 4 for s in combinations(periodic, 4)]\nprint(\"random-start systematic E,Var:\", *moments(systematic))\nprint(\"periodic SRS E,Var:\", *moments(periodic_srs))\n# Unequal population shares; equal sample counts do not change the target shares.\nstratum_sizes, stratum_means = [2, 6], [F(4), F(8)]\nweighted = sum(size * mean for size, mean in zip(stratum_sizes, stratum_means)) / sum(\n    stratum_sizes\n)\nprint(\n    \"population-weighted stratum mean:\", weighted, \"unweighted:\", sum(stratum_means) / 2\n)\n",
    "expected": "SRS n=4 E,Var: 9 3\ntwo per half E,Var: 9 5/6\nrandom-start systematic E,Var: 5 25\nperiodic SRS E,Var: 5 25/7\npopulation-weighted stratum mean: 7 unweighted: 6",
    "file": "grouped_sampling_scratch.py",
    "interpretation": null,
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "shared-errors",
    "title": "Carry shared variation through the actual joint outcomes",
    "question": "When does an average preserve a target that a difference would remove?",
    "code": "from fractions import Fraction as F\nfrom itertools import product\n\noutcomes = [\n    (F(10 + shared + ea), F(20 + shared + eb))\n    for shared, ea, eb in product([-2, 2], [-1, 1], [-1, 1])\n]\n\n\ndef moments(values):\n    mean = sum(values) / len(values)\n    variance = sum((value - mean) ** 2 for value in values) / len(values)\n    return mean, variance\n\n\nfor label, values in [\n    (\"A\", [a for a, b in outcomes]),\n    (\"B\", [b for a, b in outcomes]),\n    (\"average\", [(a + b) / 2 for a, b in outcomes]),\n    (\"difference B-A\", [b - a for a, b in outcomes]),\n    (\n        \"calibrated common baseline average\",\n        [((a - 10) + (b - 20)) / 2 for a, b in outcomes],\n    ),\n]:\n    print(label, \"mean,variance:\", *moments(values))\nfor units, repeats in [(1, 16), (4, 4), (16, 1)]:\n    variance = F(4, units) + F(1, units * repeats)\n    print(\n        f\"G={units}, m={repeats}: variance={variance}; with fixed bias 2, MSE={variance+4}\"\n    )\n",
    "expected": "A mean,variance: 10 5\nB mean,variance: 20 5\naverage mean,variance: 15 9/2\ndifference B-A mean,variance: 10 2\ncalibrated common baseline average mean,variance: 0 9/2\nG=1, m=16: variance=65/16; with fixed bias 2, MSE=129/16\nG=4, m=4: variance=17/16; with fixed bias 2, MSE=81/16\nG=16, m=1: variance=5/16; with fixed bias 2, MSE=69/16",
    "file": "unit_repeat_covariance_scratch.py",
    "interpretation": "A difference targets the offset contrast; it does not estimate a common additive signal.",
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "assignments",
    "title": "Enumerate actual observed outcomes under every allowed assignment",
    "question": "Does unbiasedness require the effect to be identical for all enrolled units?",
    "code": "from fractions import Fraction as F\nfrom itertools import combinations\n\n\ndef assignment_distribution(y0, y1, n1):\n    if len(y0) != len(y1) or type(n1) is not int or not 0 < n1 < len(y0):\n        raise ValueError(\n            \"Aligned potential outcomes and two nonempty arms are required\"\n        )\n    y0, y1 = list(map(F, y0)), list(map(F, y1))\n    n, n0 = len(y0), len(y0) - n1\n    estimates = []\n    for treated in combinations(range(n), n1):\n        observed = [y1[i] if i in treated else y0[i] for i in range(n)]\n        estimate = (\n            sum(observed[i] for i in treated) / n1\n            - sum(observed[i] for i in range(n) if i not in treated) / n0\n        )\n        estimates.append(estimate)\n    expected = sum(estimates) / len(estimates)\n    variance = sum((x - expected) ** 2 for x in estimates) / len(estimates)\n    target = sum(b - a for a, b in zip(y0, y1)) / n\n    return len(estimates), target, expected, variance\n\n\ny0 = [0, 1, 5, 6, 10, 11]\nfor effects in [[2] * 6, [0, 2, 4, 0, 2, 4]]:\n    y1 = [base + effect for base, effect in zip(y0, effects)]\n    count, target, expected, variance = assignment_distribution(y0, y1, 3)\n    print(\n        f\"effects={effects}: {count} assignments; target={target}, E={expected}, Var={variance}\"\n    )\n",
    "expected": "effects=[2, 2, 2, 2, 2, 2]: 20 assignments; target=2, E=2, Var=203/15\neffects=[0, 2, 4, 0, 2, 4]: 20 assignments; target=2, E=2, Var=251/15",
    "file": "complete_randomization_scratch.py",
    "interpretation": "The complete potential-outcome table is known here only because it is synthetic.",
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "blocked-assignment",
    "title": "Change the allowed allocations while holding outcomes fixed",
    "question": "Do all ways of making pairs improve precision?",
    "code": "from fractions import Fraction as F\nfrom itertools import product\n\ny0 = list(map(F, [0, 1, 5, 6, 10, 11]))\ny1 = [value + 2 for value in y0]\nfor name, pairs in [\n    (\"similar\", [(0, 1), (2, 3), (4, 5)]),\n    (\"unlike\", [(0, 5), (1, 4), (2, 3)]),\n]:\n    estimates = []\n    for treated in product(*pairs):\n        within = [y1[t] - y0[b if t == a else a] for t, (a, b) in zip(treated, pairs)]\n        estimates.append(sum(within) / len(pairs))\n    expected = sum(estimates) / len(estimates)\n    variance = sum((x - expected) ** 2 for x in estimates) / len(estimates)\n    print(f\"{name} pairs: {len(estimates)} assignments; E={expected}, Var={variance}\")\n",
    "expected": "similar pairs: 8 assignments; E=2, Var=1/3\nunlike pairs: 8 assignments; E=2, Var=203/9",
    "file": "blocked_randomization_scratch.py",
    "interpretation": "Blocking changes the randomization distribution; use the matching analysis.",
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "factorial",
    "title": "Ask for the effect at a declared setting",
    "question": "Which interaction values remain possible if the fourth cell is missing?",
    "code": "from fractions import Fraction as F\n\n\ndef effects(cells, high_b_share):\n    low = cells[0][1] - cells[0][0]\n    high = cells[1][1] - cells[1][0]\n    return low, high, high - low, (1 - high_b_share) * low + high_b_share * high\n\n\nfor fourth in [11, 15]:\n    cells = [[F(10), F(12)], [F(9), F(fourth)]]\n    print(\n        f\"fourth={fourth}: low-B, high-B, interaction, equal-mixture effect:\",\n        *effects(cells, F(1, 2)),\n    )\ncells = [[F(10), F(12)], [F(9), F(15)]]\nprint(\"high-B share 1/4; averaged A effect:\", effects(cells, F(1, 4))[-1])\n",
    "expected": "fourth=11: low-B, high-B, interaction, equal-mixture effect: 2 2 0 2\nfourth=15: low-B, high-B, interaction, equal-mixture effect: 2 6 4 4\nhigh-B share 1/4; averaged A effect: 3",
    "file": "factorial_interaction_scratch.py",
    "interpretation": "These cells are specified means; one noisy measurement per cell cannot estimate repeatability.",
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "precision-budget",
    "title": "Specify the uncertainty target and the collection cost",
    "question": "What assumptions does a minimum sample size calculation leave untouched?",
    "code": "from fractions import Fraction as F\n\n# Exact design SD <= 1, given fixed-population N=8 and S^2=24.\nN, S2, variance_target = 8, F(24), F(1)\neligible = [(n, (1 - F(n, N)) * S2 / n) for n in range(1, N + 1)]\nvalid = [(n, variance) for n, variance in eligible if variance <= variance_target]\nprint(\"smallest n with design SD <= 1:\", valid[0][0], \"variance:\", valid[0][1])\n# A new independent unit costs 4; each reading costs 1. Budget = 32.\nplans = []\nfor G in range(1, 17):\n    for m in range(1, 17):\n        cost = G * (4 + m)\n        if cost <= 32:\n            plans.append((F(4, G) + F(1, G * m), cost, G, m))\nvariance, cost, G, m = min(plans)\nprint(f\"best declared-cost plan: G={G}, m={m}, cost={cost}, variance={variance}\")\n",
    "expected": "smallest n with design SD <= 1: 6 variance: 1\nbest declared-cost plan: G=6, m=1, cost=30, variance=5/6",
    "file": "precision_budget_scratch.py",
    "interpretation": "Changing costs or variance assumptions can change this answer; fixed bias is unaffected.",
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "attrition",
    "title": "Bound the missing assigned outcomes instead of turning them into zeros",
    "question": "Can the observed contrast determine the full assigned-group contrast's sign?",
    "code": "from fractions import Fraction as F\n\n\ndef mean_bounds(values, lower=0, upper=10):\n    if not values or lower > upper:\n        raise ValueError(\"Use nonempty assigned outcomes and ordered bounds\")\n    observed = [F(value) for value in values if value is not None]\n    if any(not lower <= value <= upper for value in observed):\n        raise ValueError(\"A recorded outcome is outside the declared bounds\")\n    missing = len(values) - len(observed)\n    return (\n        (sum(observed) + missing * lower) / len(values),\n        (sum(observed) + missing * upper) / len(values),\n    )\n\n\nA, B = [8, 9, None, None], [4, 5, 6, 7]\na, b = mean_bounds(A), mean_bounds(B)\nprint(\"A full mean bounds:\", *a)\nprint(\"B full mean bounds:\", *b)\nprint(\"assigned-group contrast bounds:\", a[0] - b[1], a[1] - b[0])\nprint(\"observed-only contrast:\", F(17, 2) - F(22, 4))\n",
    "expected": "A full mean bounds: 17/4 37/4\nB full mean bounds: 11/2 11/2\nassigned-group contrast bounds: -5/4 15/4\nobserved-only contrast: 3",
    "file": "assigned_outcome_bounds_scratch.py",
    "interpretation": "These bound missing assigned outcomes, not each unit's unobserved counterfactual.",
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "protocol",
    "title": "Generate an auditable synthetic blocked assignment",
    "question": "Can every recorded outcome be traced to an enrolled unit and its original assignment?",
    "code": "import csv\nimport io\nimport random\nfrom fractions import Fraction as F\n\n# Synthetic classrooms: assignment unit is the class; two readings per class.\n# Each pair is fixed from pretreatment information. A means the new method.\npairs = [(\"C1\", \"C2\"), (\"C3\", \"C4\"), (\"C5\", \"C6\")]\nrng = random.Random(49)\nassignment = {}\nfor pair in pairs:\n    treated = rng.choice(pair)\n    assignment.update({unit: (\"A\" if unit == treated else \"B\") for unit in pair})\nbaseline = {f\"C{i+1}\": value for i, value in enumerate([40, 42, 60, 62, 80, 82])}\noutput = io.StringIO()\nwriter = csv.writer(output, lineterminator=\"\\n\")\nwriter.writerow([\"class_id\", \"assigned_method\", \"reading_id\", \"retention_score\"])\nclass_means = {}\nfor unit, method in assignment.items():\n    readings = [\n        baseline[unit] + (3 if method == \"A\" else 0) + error for error in [-1, 1]\n    ]\n    class_means[unit] = F(sum(readings), len(readings))\n    for index, score in enumerate(readings, 1):\n        writer.writerow([unit, method, index, score])\nprint(output.getvalue().strip())\ncontrasts = []\nfor pair in pairs:\n    a = next(unit for unit in pair if assignment[unit] == \"A\")\n    b = next(unit for unit in pair if assignment[unit] == \"B\")\n    contrasts.append(class_means[a] - class_means[b])\nprint(\"within-pair class contrasts:\", \", \".join(map(str, contrasts)))\nprint(\"equal-class estimate:\", sum(contrasts) / len(contrasts))\nprint(\"6 assigned classes, 3 independently randomized pairs, 12 recorded rows.\")\n",
    "expected": "class_id,assigned_method,reading_id,retention_score\nC1,A,1,42\nC1,A,2,44\nC2,B,1,41\nC2,B,2,43\nC3,B,1,59\nC3,B,2,61\nC4,A,1,64\nC4,A,2,66\nC5,B,1,79\nC5,B,2,81\nC6,A,1,84\nC6,A,2,86\nwithin-pair class contrasts: 1, 5, 5\nequal-class estimate: 11/3\n6 assigned classes, 3 independently randomized pairs, 12 recorded rows.",
    "file": "class_protocol_scratch.py",
    "interpretation": "Synthetic outcomes and a reproducible allocation are not evidence of real teaching effectiveness.",
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "joint-inclusion",
    "file": "joint_inclusion_variance.py",
    "title": "Two different uses of joint inclusion",
    "question": "How does the observed-pair variance estimate differ from known-law variance?",
    "language": "python",
    "code": "from fractions import Fraction as F\nfrom itertools import combinations\n\n\ndef inspect_design(values, weights):\n    values = list(map(F, values))\n    subsets = list(combinations(range(len(values)), 2))\n    if len(weights) != len(subsets) or any(w < 0 for w in weights) or sum(weights) <= 0:\n        raise ValueError(\"One nonnegative weight per subset and positive total required\")\n    probabilities = [F(w) / sum(weights) for w in weights]\n    inclusion = [sum(p for s, p in zip(subsets, probabilities) if i in s)\n                 for i in range(len(values))]\n    if any(pi <= 0 for pi in inclusion):\n        raise ValueError(\"Every target unit needs positive inclusion\")\n    pair = [[sum(p for s, p in zip(subsets, probabilities) if i in s and j in s)\n             for j in range(len(values))] for i in range(len(values))]\n    coefficient = [[(pair[i][j] - inclusion[i] * inclusion[j])\n                    / (inclusion[i] * inclusion[j])\n                    for j in range(len(values))] for i in range(len(values))]\n    total_variance = sum(coefficient[i][j] * values[i] * values[j]\n                         for i in range(len(values)) for j in range(len(values)))\n    totals = [sum(values[i] / inclusion[i] for i in s) for s in subsets]\n    expected = sum(p * t for p, t in zip(probabilities, totals))\n    enumerated = sum(p * (t - expected) ** 2 for p, t in zip(probabilities, totals))\n    assert total_variance == enumerated\n    zero_pairs = [(i, j) for i, j in combinations(range(len(values)), 2)\n                  if pair[i][j] == 0]\n    # This contract requires every population pair to have positive joint inclusion.\n    # The known-law variance above does not have this additional denominator.\n    sample_variances = None\n    if not zero_pairs:\n        sample_variances = [sum(coefficient[i][j] * values[i] * values[j] / pair[i][j]\n                                for i in s for j in s) for s in subsets]\n        assert sum(p * v for p, v in zip(probabilities, sample_variances)) == total_variance\n    return expected, total_variance, total_variance / len(values) ** 2, zero_pairs, sample_variances\n\n\nfor name, weights in [(\"unequal\", [4, 2, 1, 1, 1, 1]),\n                      (\"random-start alternating\", [0, 1, 0, 0, 1, 0])]:\n    expectation, variance, mean_variance, zero_pairs, sample_variances = inspect_design([2, 4, 8, 10], weights)\n    print(f\"{name}: E(total)={expectation}, Var(total)={variance}, Var(mean)={mean_variance}\")\n    print(\"zero joint-inclusion pairs:\", len(zero_pairs))\n    if sample_variances is not None:\n        print(\"observed-pair variance estimates:\", \", \".join(map(str, sample_variances)))\n        print(\"E(observed-pair variance estimate):\", variance)\n    else:\n        print(\"observed-pair variance formula admitted:\", False)\n",
    "expected": "unequal: E(total)=24, Var(total)=13312/63, Var(mean)=832/63\nzero joint-inclusion pairs: 0\nobserved-pair variance estimates: 8080/441, 9640/49, 251680/441, -1040/9, 440, 6760/9\nE(observed-pair variance estimate): 13312/63\nrandom-start alternating: E(total)=24, Var(total)=16, Var(mean)=1\nzero joint-inclusion pairs: 4\nobserved-pair variance formula admitted: False",
    "invocation": "python joint_inclusion_variance.py",
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "weighted-numpy",
    "file": "weighted_design_numpy.py",
    "title": "Keep the library denominator visible",
    "question": "Does NumPy normalization implement the fixed-N target?",
    "language": "python",
    "code": "from itertools import combinations\nimport numpy as np\n\nvalues = np.array([2.0, 4.0, 8.0, 10.0])\nsubsets = np.array(list(combinations(range(len(values)), 2)))\nprobability = np.array([4, 2, 1, 1, 1, 1], dtype=float)\nprobability /= probability.sum()\n# One row per possible sample, one column per population unit.\nincluded = (subsets[:, :, None] == np.arange(len(values))).any(axis=1)\npi = probability @ included\nif np.any(pi <= 0):\n    raise ValueError(\"Every target unit needs positive inclusion\")\nexpanded_total = (included * (values / pi)).sum(axis=1)\nht_mean = expanded_total / len(values)\nraw_mean = values[subsets].mean(axis=1)\n# average normalizes by the selected weights; this is a different estimator.\nratio_mean = np.average(values[subsets], weights=1 / pi[subsets], axis=1)\nprint(\"sample-by-unit incidence shape:\", included.shape)\nprint(\"inclusion:\", \", \".join(f\"{p:.8f}\" for p in pi))\nfor name, estimates in [(\"raw\", raw_mean), (\"fixed-N HT\", ht_mean),\n                        (\"normalized ratio\", ratio_mean)]:\n    expectation = np.average(estimates, weights=probability)\n    variance = np.average((estimates - expectation) ** 2, weights=probability)\n    print(f\"{name}: expectation={expectation:.8f}, variance={variance:.8f}\")\nprint(\"finite target:\", f\"{values.mean():.8f}\")\n",
    "expected": "sample-by-unit incidence shape: (6, 4)\ninclusion: 0.70000000, 0.60000000, 0.40000000, 0.30000000\nraw: expectation=5.00000000, variance=3.80000000\nfixed-N HT: expectation=6.00000000, variance=13.20634921\nnormalized ratio: expectation=5.50869131, variance=4.84273392\nfinite target: 6.00000000",
    "invocation": "python weighted_design_numpy.py",
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  },
  {
    "id": "paired-pandas",
    "file": "paired_units_pandas.py",
    "title": "Rebuild paired units from recorded keys",
    "question": "Do repeated records create new independent people?",
    "language": "python",
    "code": "import sys\nfrom pathlib import Path\nimport numpy as np\nimport pandas as pd\n\nif len(sys.argv) != 2:\n    raise SystemExit(\"Usage: python paired_units_pandas.py sleep-pairs.csv\")\nwide = pd.read_csv(Path(sys.argv[1]))\nrequired = [\"id\", \"drug1_extra_hours\", \"drug2_extra_hours\"]\nif list(wide.columns) != required or wide[\"id\"].duplicated().any() or wide.isna().any().any():\n    raise ValueError(\"Expected unique unit IDs and two complete recorded measurements\")\nif len(wide) < 2:\n    raise ValueError(\"At least two paired people required for the sample variance estimate\")\nif not np.isfinite(wide[required[1:]].to_numpy(dtype=float)).all():\n    raise ValueError(\"Recorded quantities must be finite numeric values\")\nlong = wide.melt(id_vars=\"id\", var_name=\"condition\", value_name=\"extra_hours\")\npaired = long.pivot(index=\"id\", columns=\"condition\", values=\"extra_hours\")\ndifference = paired[\"drug2_extra_hours\"] - paired[\"drug1_extra_hours\"]\nprint(\"recorded rows:\", len(long), \"paired people:\", len(paired))\nprint(\"per-person differences:\", \", \".join(f\"{x:.1f}\" for x in difference))\nprint(\"observed mean difference:\", f\"{difference.mean():.6f}\", \"hours\")\n# A model-based standard error uses independent people, not independent rows.\nse = difference.std(ddof=1) / np.sqrt(len(difference))\nprint(\"iid-pair model SE:\", f\"{se:.6f}\", \"hours\")\ncopied = pd.concat([long] * 5, ignore_index=True)\nprint(\"copied rows:\", len(copied), \"distinct people:\", copied[\"id\"].nunique())\nrejected = False\ntry:\n    copied.pivot(index=\"id\", columns=\"condition\", values=\"extra_hours\")\nexcept ValueError:\n    rejected = True\nprint(\"duplicate unit-condition records rejected:\", rejected)\n",
    "expected": "recorded rows: 20 paired people: 10\nper-person differences: 1.2, 2.4, 1.3, 1.3, 0.0, 1.0, 1.8, 0.8, 4.6, 1.4\nobserved mean difference: 1.580000 hours\niid-pair model SE: 0.388959 hours\ncopied rows: 100 distinct people: 10\nduplicate unit-condition records rejected: True",
    "invocation": "python paired_units_pandas.py sleep-pairs.csv",
    "sourceExecution": "docs/teaching/math-foundations-reading-flow/sampling-measurement-experimental-design/prepared-content-execution-r1.json"
  }
];

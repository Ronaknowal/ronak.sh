import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.multioutput import ClassifierChain
from sklearn.metrics import f1_score, hamming_loss, accuracy_score

# Deliberately small, hand-authored examples: not a real benchmark.
# Each group is one source case; its paraphrases never cross a split.
cases = [
    (
        "train",
        (1, 0, 0),
        ["Python loop raises an exception", "Fix the Python loop error"],
    ),
    (
        "train",
        (0, 1, 0),
        ["Replace the loose sensor cable", "A connector on the sensor is broken"],
    ),
    (
        "train",
        (0, 0, 1),
        [
            "Measure electricity consumed overnight",
            "The electricity bill reports high energy use",
        ],
    ),
    (
        "train",
        (1, 1, 0),
        [
            "Python cannot read the sensor cable",
            "Debug software that reads a sensor connector",
        ],
    ),
    (
        "train",
        (1, 0, 1),
        [
            "Python estimates electricity use",
            "Fix software computing energy consumption",
        ],
    ),
    (
        "train",
        (0, 1, 1),
        [
            "A battery connector wastes energy",
            "Replace a battery cable to reduce power loss",
        ],
    ),
    (
        "train",
        (1, 1, 1),
        [
            "Debug Python for the battery sensor energy meter",
            "Software reads battery hardware electricity consumption",
        ],
    ),
    (
        "train",
        (0, 0, 0),
        ["Where is the meeting room", "Please update the workshop opening hours"],
    ),
    (
        "validation",
        (1, 0, 0),
        ["A Python function has a software bug", "Debug the broken Python function"],
    ),
    (
        "validation",
        (0, 1, 1),
        [
            "Check the battery cable power loss",
            "Energy is wasted by a battery connector",
        ],
    ),
    (
        "validation",
        (1, 1, 0),
        ["Software cannot read a hardware sensor", "Debug Python sensor readings"],
    ),
    (
        "validation",
        (0, 0, 1),
        ["Track electricity consumption", "Our electricity usage is rising"],
    ),
    (
        "test",
        (1, 0, 1),
        ["Repair Python energy estimates", "Software predicts electricity consumption"],
    ),
    (
        "test",
        (0, 1, 0),
        ["The hardware sensor cable snapped", "Replace the broken connector"],
    ),
    (
        "test",
        (1, 1, 1),
        [
            "Debug software on a battery electricity sensor",
            "Python reads the battery energy hardware",
        ],
    ),
    (
        "test",
        (0, 0, 0),
        ["What time does the meeting begin", "Where can workshop visitors park"],
    ),
]
texts, labels, groups, splits = [], [], [], []
for group, (split, target, variants) in enumerate(cases):
    for text in variants:
        texts.append(text)
        labels.append(target)
        groups.append(group)
        splits.append(split)
Y, groups, splits = np.array(labels), np.array(groups), np.array(splits)
train, validation, test = [
    np.flatnonzero(splits == name) for name in ["train", "validation", "test"]
]
assert not (set(groups[train]) & set(groups[test]))
assert not (set(groups[train]) & set(groups[validation]))
assert not (set(groups[validation]) & set(groups[test]))
vectorizer = TfidfVectorizer(ngram_range=(1, 2))
X_train = vectorizer.fit_transform([texts[i] for i in train])
X_validation = vectorizer.transform([texts[i] for i in validation])
X_test = vectorizer.transform([texts[i] for i in test])
models = {
    "independent": OneVsRestClassifier(LogisticRegression(C=2, max_iter=1000)),
    "chain 012": ClassifierChain(
        LogisticRegression(C=2, max_iter=1000), order=[0, 1, 2]
    ),
    "chain 210": ClassifierChain(
        LogisticRegression(C=2, max_iter=1000), order=[2, 1, 0]
    ),
}
for model in models.values():
    model.fit(X_train, Y[train])
validation_scores = {
    name: model.predict_proba(X_validation) for name, model in models.items()
}

thresholds = [0.25, 0.4, 0.5, 0.6, 0.75]


def cost(truth, prediction):
    false_positive = ((truth == 0) & prediction).sum()
    false_negative = ((truth == 1) & ~prediction).sum()
    return int(false_positive + 3 * false_negative)


settings = [
    (cost(Y[validation], score >= threshold), name, threshold)
    for name, score in validation_scores.items()
    for threshold in thresholds
]
best = min(range(len(settings)), key=lambda index: settings[index][0])
validation_cost, name, threshold = settings[best]
prediction = models[name].predict_proba(X_test) >= threshold
print("Selected by validation FP+3FN:", name, threshold, "cost", validation_cost)
print(
    "Frozen test cost:",
    cost(Y[test], prediction),
    "over",
    Y[test].size,
    "label decisions",
)
print(
    "Frozen test micro-F1:",
    round(f1_score(Y[test], prediction, average="micro", zero_division=0), 6),
)
print("Predicted test rows:", prediction.astype(int).tolist())

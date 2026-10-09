import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.naive_bayes import MultinomialNB, BernoulliNB, ComplementNB
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score, log_loss, confusion_matrix

spam = [
    "free money win prize cash",
    "win cash prize free money",
    "claim your free prize now",
    "money back guarantee free offer",
    "free credit score win now",
    "earn money fast free win",
    "click here free offer cash",
    "big cash prize free today",
    "free gift claim now win",
    "lottery winner claim free prize",
]
ham = [
    "team meeting agenda tomorrow",
    "quarterly report please review",
    "project update attached report",
    "schedule review meeting please",
    "budget review report quarterly",
    "agenda for team standup",
    "report due next quarter",
    "project deadline meeting review",
    "please review attached agenda",
    "team offsite agenda tomorrow",
]
texts = spam + ham
labels = np.array([1] * 10 + [0] * 10)

train_text, test_text, y_train, y_test = train_test_split(
    texts, labels, test_size=0.3, random_state=7, stratify=labels
)
inner = StratifiedKFold(n_splits=3, shuffle=True, random_state=19)
search = GridSearchCV(
    Pipeline([("words", CountVectorizer()), ("nb", MultinomialNB())]),
    {"nb__alpha": [0.5, 1.0, 2.0]},
    scoring="neg_log_loss",
    cv=inner,
    refit=True,
)
search.fit(train_text, y_train)
best = search.best_estimator_
print("training/test rows:", len(y_train), len(y_test))
print("selected alpha using training folds:", search.best_params_["nb__alpha"])
print("final training-only vocabulary:", len(best.named_steps["words"].vocabulary_))
baseline = DummyClassifier(strategy="prior").fit(np.zeros((len(y_train), 1)), y_train)
for name, model in [
    ("prior baseline", baseline),
    ("selected MNB", best),
    (
        "fixed Bernoulli",
        Pipeline([("words", CountVectorizer()), ("nb", BernoulliNB())]).fit(
            train_text, y_train
        ),
    ),
    (
        "fixed Complement",
        Pipeline([("words", CountVectorizer()), ("nb", ComplementNB())]).fit(
            train_text, y_train
        ),
    ),
]:
    inputs = np.zeros((len(y_test), 1)) if name == "prior baseline" else test_text
    print(
        name,
        "accuracy",
        format(accuracy_score(y_test, model.predict(inputs)), ".4f"),
        "log loss",
        format(log_loss(y_test, model.predict_proba(inputs)), ".6f"),
    )
print(
    "selected MNB confusion [true rows/predicted columns, ham/spam]:",
    confusion_matrix(y_test, best.predict(test_text), labels=[0, 1]).tolist(),
)
probe = ["free money win prize", "zephyronic qxz", ""]
print(
    "probe nonzero feature counts:",
    best.named_steps["words"].transform(probe).getnnz(axis=1).tolist(),
)
print("probe probabilities [ham, spam]:", best.predict_proba(probe).round(6).tolist())
print("A six-message test is a workflow check, not evidence for deployment.")

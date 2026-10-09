"""Document-presence MI/Pearson versus sklearn count chi2, in a legal pipeline."""
import json
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline


def presence_scores(X, y):
    X = np.asarray(X, dtype=float)
    y = np.asarray(y)
    if (X.ndim != 2 or y.shape != (len(X),) or not len(X) or not np.isfinite(X).all()
            or (X < 0).any() or not np.isin(y, [0, 1]).all() or len(np.unique(y)) != 2):
        raise ValueError("Use nonnegative count rows and both binary classes")
    present = X > 0
    tables, mi, pearson = [], [], []
    for j in range(X.shape[1]):
        table = np.array([[np.sum((y == c) & (present[:, j] == b)) for b in (0, 1)] for c in (0, 1)], dtype=float)
        expected = table.sum(axis=1, keepdims=True) @ table.sum(axis=0, keepdims=True) / len(X)
        active = table > 0
        # A zero observed cell contributes zero to MI; zero expected cells add no Pearson term.
        information = np.sum(table[active] / len(X) * np.log(table[active] / expected[active]))
        valid = expected > 0
        statistic = np.sum((table[valid] - expected[valid]) ** 2 / expected[valid])
        tables.append(table.astype(int).tolist())
        mi.append(float(information))
        pearson.append(float(statistic))
    return {"tables_class_by_absent_present": tables, "MI_nats": mi, "Pearson_chi2": pearson}


def select_fixed(scores, k):
    if type(k) is not int or not 1 <= k <= len(scores) or not np.isfinite(scores).all():
        raise ValueError("Use finite feature scores and a legal integer k")
    # Highest score; original feature index breaks exact ties.
    return sorted(sorted(range(len(scores)), key=lambda j: (-scores[j], j))[:k])


def main():
    train = ["alarm alarm urgent", "urgent repair", "alarm inspection", "urgent urgent repair",
             "routine meeting", "routine routine review", "meeting review", "routine inspection"]
    labels = np.array([1, 1, 1, 1, 0, 0, 0, 0])
    query = ["urgent alarm", "newword meeting", ""]
    vectorizer = CountVectorizer().fit(train)
    X = vectorizer.transform(train)
    names = vectorizer.get_feature_names_out().tolist()
    own = presence_scores(X.toarray(), labels)
    ordinary_chi2, pvalues = chi2(X, labels)
    indices = select_fixed(own["MI_nats"], 3)
    scratch_selected = MultinomialNB(alpha=1).fit(X[:, indices], labels)
    pipeline = Pipeline([("words", CountVectorizer()), ("select", SelectKBest(chi2, k=3)),
                         ("nb", MultinomialNB(alpha=1))]).fit(train, labels)
    selected = pipeline.named_steps["select"].get_support(indices=True)
    selected_names = pipeline.named_steps["words"].get_feature_names_out()[selected].tolist()
    assert "newword" not in pipeline.named_steps["words"].vocabulary_
    print(json.dumps({"training_rows": len(train), "feature_names": names,
                     "presence_definition": own, "sklearn_count_chi2": ordinary_chi2.tolist(),
                     "sklearn_count_chi2_pvalues": pvalues.tolist(),
                     "MI_selected_names": [names[i] for i in indices],
                     "count_chi2_selected_names": selected_names,
                     "query": query,
                     "MI_selected_probabilities": scratch_selected.predict_proba(vectorizer.transform(query)[:, indices]).tolist(),
                     "pipeline_probabilities": pipeline.predict_proba(query).tolist(),
                     "stored_transform": {"vocabulary": names, "MI_selected_indices": indices,
                                          "count_chi2_selected_indices": selected.tolist()},
                     "query_shape": list(pipeline[:-1].transform(query).shape)}, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()

from sklearn.preprocessing import MultiLabelBinarizer

vocabulary = ["code", "hardware", "energy"]
messages = [["code", "energy"], ["hardware", "hardware"], []]
encoder = MultiLabelBinarizer(classes=vocabulary)
encoded = encoder.fit_transform(messages)
print("columns:", encoder.classes_.tolist())
print("matrix:", encoded.tolist())
print("decoded:", encoder.inverse_transform(encoded))


def checked_transform(rows):
    unknown = set().union(*map(set, rows)) - set(vocabulary)
    if unknown:
        raise ValueError(f"Unrecognized labels: {sorted(unknown)}")
    return encoder.transform(rows)


try:
    checked_transform([["network"]])
except ValueError as error:
    print(error)
print("Unreviewed energy annotation stays None, not 0:", [1, 0, None])

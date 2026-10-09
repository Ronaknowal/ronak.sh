import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import NMF

documents = ['orbit rocket orbit', 'rocket orbit rocket',
             'goal team goal', 'team goal team',
             'orbit rocket goal team']
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(documents)
model = NMF(n_components=2, init='nndsvda', solver='mu',
            beta_loss='kullback-leibler', max_iter=1000,
            tol=1e-5, random_state=19)
W = model.fit_transform(X)
H = model.components_
mass = H.sum(axis=1)
normalized_patterns = H / mass[:, None]
amounts = W * mass
print(vectorizer.get_feature_names_out())
print(normalized_patterns.round(3))
print(amounts.round(3))
new = vectorizer.transform(['rocket team'])
print((model.transform(new) @ H).round(3))
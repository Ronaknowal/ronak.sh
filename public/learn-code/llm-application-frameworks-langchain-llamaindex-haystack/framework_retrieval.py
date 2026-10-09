"""Actual offline Haystack retrieval + LangChain Runnable composition; no provider calls."""
import json
import math
from haystack import Document, Pipeline
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.retrievers.in_memory import InMemoryBM25Retriever
from langchain_core.runnables import RunnableLambda
from retrieval_pipeline import DOCUMENTS, EvidenceIndex, pack_evidence, evidence_response


def main():
    store = InMemoryDocumentStore(shared=False, bm25_algorithm='BM25L',
                                 bm25_parameters={'k1': 1.5, 'b': .75, 'delta': 0},
                                 bm25_tokenization_regex=r'(?u)\b\w+\b')
    store.write_documents([Document(id=d['id'], content=d['text'], meta={'url': d['url']})
                           for d in DOCUMENTS])
    pipeline = Pipeline()
    pipeline.add_component('retrieve', InMemoryBM25Retriever(document_store=store, top_k=3))

    def retrieve(request):
        found = pipeline.run({'retrieve': {'query': request['query']}})['retrieve']['documents']
        return {'ranked': [{'id': d.id, 'text': d.content, 'score': d.score, 'url': d.meta['url']}
                           for d in found], 'budget': request['word_budget']}

    chain = (RunnableLambda(retrieve)
             | RunnableLambda(lambda item: pack_evidence(item['ranked'], item['budget']))
             | RunnableLambda(evidence_response))
    query = 'file exception'
    scratch = EvidenceIndex(DOCUMENTS).search(query)
    library = retrieve({'query': query, 'word_budget': 30})['ranked']
    assert [d['id'] for d in scratch] == [d['id'] for d in library]
    for a, b in zip(scratch, library):
        assert math.isclose(a['score'], b['score'], rel_tol=1e-12, abs_tol=1e-12)
    result = chain.invoke({'query': query, 'word_budget': 30})
    assert result == evidence_response(pack_evidence(scratch, 30))
    assert chain.invoke({'query': 'quantum banana', 'word_budget': 30})['status'] == 'no_evidence'
    print(json.dumps({'scores': [(d['id'], d['score']) for d in library],
                      'library_result': result}, indent=2))


if __name__ == '__main__':
    main()

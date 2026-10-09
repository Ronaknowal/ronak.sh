"""Observed social ties to sparse operators, entirely offline after setup.

Run next to karate-networkx-3.6.1.json and karate-networkx-LICENSE.txt:
    python karate-operator-diagnostics.py
Dependencies: numpy==2.3.5, scipy==1.18.1, networkx==3.6.1.
Dataset: Zachary (1977), DOI 10.1086/jar.33.4.3629752, as packaged by
NetworkX3.6.1 under BSD-3-Clause; retrieved 6 October 2026.
The fixture's integer weights count interaction contexts. The first analysis
deliberately treats each recorded tie equally; these are not electrical units.
"""
from pathlib import Path
import json
import numpy as np
import networkx as nx
from scipy.sparse import diags
from scipy.sparse.csgraph import connected_components


def diagnose(graph, nodes, weight):
    adjacency = nx.to_scipy_sparse_array(graph, nodelist=nodes, weight=weight,
                                         format='csr', dtype=float)
    degree = np.asarray(adjacency.sum(axis=1)).ravel()
    laplacian = diags(degree, format='csr') - adjacency
    count, labels = connected_components(adjacency, directed=False)
    # Check the same graph through independent label/degree APIs.
    np.testing.assert_allclose(degree, [graph.degree(i,weight=weight) for i in nodes])
    assert count == nx.number_connected_components(graph)
    np.testing.assert_allclose(laplacian @ np.ones(len(nodes)), 0., atol=1e-12)
    return adjacency, degree, laplacian, count


def main():
    fixture = json.loads(Path(__file__).with_name('karate-networkx-3.6.1.json').read_text(encoding='utf-8'))
    nodes = fixture['nodeOrder']
    graph = nx.Graph()
    graph.add_nodes_from(nodes)
    graph.add_weighted_edges_from(fixture['weightedEdges'])
    matrix, degree, laplacian, count = diagnose(graph,nodes,weight=None)
    row = 0
    neighbors = matrix.indices[matrix.indptr[row]:matrix.indptr[row+1]].tolist()
    print('nodes / undirected ties:',len(nodes),graph.number_of_edges())
    print('components / CSR nonzeros:',count,matrix.nnz)
    print('equal-tie degrees of nodes 0 / 33:',int(degree[0]),int(degree[33]))
    print('node 0 neighbors:',neighbors)
    print('constant-signal max residual:',float(np.max(np.abs(laplacian @ np.ones(len(nodes))))))
    print('unweighted clustering at node 0:',round(nx.clustering(graph,0),6))
    weighted, weighted_degree, weighted_laplacian, weighted_count = diagnose(graph,nodes,weight='weight')
    assert weighted_count == count
    print('context-weighted degrees of nodes 0 / 33:',int(weighted_degree[0]),int(weighted_degree[33]))
    # The representation choice changes the operator even on identical support.
    print('same positive support:',bool(np.array_equal(weighted.indices,matrix.indices)
                                         and np.array_equal(weighted.indptr,matrix.indptr)))
    print('same Laplacian coefficients:',bool(np.allclose(weighted_laplacian.toarray(),laplacian.toarray())))


if __name__ == '__main__':
    main()

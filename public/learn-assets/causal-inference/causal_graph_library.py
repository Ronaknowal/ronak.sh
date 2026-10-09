"""The same declared-graph queries through NetworkX 3.6.1.

Install networkx==3.6.1. NetworkX uses a directed traversal rather than building
our moral graph. Pass sets so a multi-character node is not mistaken for a list
of characters. True means separated, not a detected association.
"""
import networkx as nx


def main():
    graph = nx.DiGraph()
    graph.add_nodes_from(['X', 'C', 'Y', 'D'])
    graph.add_edges_from([('X', 'C'), ('Y', 'C'), ('C', 'D')])
    for given in [set(), {'C'}, {'D'}]:
        print('given', sorted(given), 'separated',
              nx.is_d_separator(graph, {'X'}, {'Y'}, given))
    # A relevant changed case: remove the descendant link, preserving node D.
    graph.remove_edge('C', 'D')
    print('D disconnected; given D; separated',
          nx.is_d_separator(graph, {'X'}, {'Y'}, {'D'}))


if __name__ == '__main__':
    main()

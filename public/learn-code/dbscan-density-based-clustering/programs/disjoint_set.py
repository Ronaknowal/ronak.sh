class DisjointSet:
    def __init__(self, n):
        if type(n) is not int or n < 0:
            raise ValueError("n must be a nonnegative integer")
        self.parent = list(range(n))
        self.size = [1] * n
        self.count = n

    def _validate(self, item):
        if type(item) is not int or not 0 <= item < len(self.parent):
            raise IndexError("element outside 0..n-1")

    def find(self, item):
        self._validate(item)
        root = item
        while self.parent[root] != root:
            root = self.parent[root]
        # Save the old next pointer before changing it.
        while self.parent[item] != item:
            next_item = self.parent[item]
            self.parent[item] = root
            item = next_item
        return root

    def union(self, a, b):
        # Validate both before find can mutate a path.
        self._validate(a)
        self._validate(b)
        root_a, root_b = self.find(a), self.find(b)
        if root_a == root_b:
            return False
        if self.size[root_a] < self.size[root_b]:
            root_a, root_b = root_b, root_a
        self.parent[root_b] = root_a
        self.size[root_a] += self.size[root_b]
        self.count -= 1
        return True

    def connected(self, a, b):
        self._validate(a)
        self._validate(b)
        return self.find(a) == self.find(b)

    def component_size(self, item):
        return self.size[self.find(item)]

    def groups(self):
        result = {}
        for item in range(len(self.parent)):
            result.setdefault(self.find(item), []).append(item)
        return list(result.values())

"""Named real-vector operations, using Python 3's standard library.

Run: python vector_tensor_scratch.py
Inputs are small, finite real lists; matrices are nonempty and rectangular.
The comparison program shows the corresponding NumPy route.
"""
from math import fsum


def dot(left, right):
    if len(left) != len(right):
        raise ValueError("Coordinate counts must agree")
    return fsum(a * b for a, b in zip(left, right))


def project(vector, direction):
    squared_length = dot(direction, direction)
    if squared_length == 0:
        raise ValueError("A projection line needs a nonzero direction")
    coefficient = dot(vector, direction) / squared_length
    point = [coefficient * value for value in direction]
    residual = [value - along for value, along in zip(vector, point)]
    return coefficient, point, residual


def matmul(left, right):
    if len(left[0]) != len(right):
        raise ValueError("The contracted lengths must agree")
    columns = list(zip(*right))
    return [[dot(row, column) for column in columns] for row in left]


def mean_axis(tensor, axis):
    # Every cell has exactly three named indices: session, time, channel.
    shape = [len(tensor), len(tensor[0]), len(tensor[0][0])]
    if axis not in (0, 1, 2):
        raise ValueError("Choose session (0), time (1), or channel (2)")
    remaining = [index for index in range(3) if index != axis]
    result = []
    for row in range(shape[remaining[0]]):
        output_row = []
        for column in range(shape[remaining[1]]):
            coordinates = [0, 0, 0]
            coordinates[remaining[0]], coordinates[remaining[1]] = row, column
            values = []
            for index in range(shape[axis]):
                coordinates[axis] = index
                session, time, channel = coordinates
                values.append(tensor[session][time][channel])
            output_row.append(fsum(values) / shape[axis])
        result.append(output_row)
    return result


def affine(inputs, weights, bias):
    scores = matmul(inputs, weights)
    return [[value + offset for value, offset in zip(row, bias)] for row in scores]


def main():
    coefficient, point, residual = project([3, 2], [2, 1])
    print("coefficient:", coefficient)
    print("projection:", point)
    print("residual:", [round(value, 3) for value in residual])
    print("resources:", matmul([[2, 1], [0, 3], [1, 2]], [[3, 2], [5, 4]]))
    readings = [[[6 * session + 3 * time + channel for channel in range(3)]
                 for time in range(2)] for session in range(2)]
    print("time means:", mean_axis(readings, 1))
    print("affine:", affine([[1, 2, 3]], [[.2, -.1], [.4, .3], [.1, .5]], [.01, -.02]))


if __name__ == "__main__":
    main()

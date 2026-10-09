from math import log2

p, distortion = 0.2, 0.1
output_one = (p - distortion) / (1 - 2 * distortion)
joint = [
    [(1 - output_one) * (1 - distortion), output_one * distortion],
    [(1 - output_one) * distortion, output_one * (1 - distortion)],
]
source = [sum(row) for row in joint]
output = [sum(row[j] for row in joint) for j in range(2)]
information = sum(
    joint[i][j] * log2(joint[i][j] / (source[i] * output[j]))
    for i in range(2)
    for j in range(2)
    if joint[i][j]
)
print("joint:", [[round(v, 4) for v in row] for row in joint])
print("source:", [round(v, 4) for v in source])
print("output:", [round(v, 4) for v in output])
print("false positive:", round(joint[0][1] / source[0], 6))
print("false negative:", round(joint[1][0] / source[1], 6))
print("distortion:", round(joint[0][1] + joint[1][0], 6))
print("information bits:", round(information, 6))
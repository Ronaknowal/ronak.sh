import numpy as np

def network(inputs, incoming, bias, outgoing):
    hidden = np.maximum(0.0, np.asarray(inputs)[:,None]*incoming + bias)
    return hidden @ outgoing

inputs = np.array([-1.0,0.0,1.0,1.5,2.0,3.0])
w = np.array([1.0,-1.0])
b = np.array([-1.0,2.0])
v = np.array([2.0,-1.0])
original = network(inputs,w,b,v)
permutation = [1,0]
swapped = network(inputs,w[permutation],b[permutation],v[permutation])
scales = np.array([3.0,0.5])  # strictly positive
scaled = network(inputs,w*scales,b*scales,v/scales)
wrong = network(inputs,w*scales,b,v/scales)  # forgot bias scaling
assert np.allclose(swapped, original)
assert np.allclose(scaled, original)
print("original:", original.tolist())
print("swap error:", float(np.max(np.abs(swapped-original))))
print("positive scaling error:", float(np.max(np.abs(scaled-original))))
print("forgot-bias maximum error:", round(float(np.max(np.abs(wrong-original))), 6))
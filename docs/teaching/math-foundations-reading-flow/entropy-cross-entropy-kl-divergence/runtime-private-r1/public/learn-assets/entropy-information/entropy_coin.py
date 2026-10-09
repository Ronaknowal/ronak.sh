import math

p_heads = 0.9
entropy_bits = -(
    p_heads * math.log2(p_heads)
    + (1 - p_heads) * math.log2(1 - p_heads)
)
print(round(entropy_bits, 3))
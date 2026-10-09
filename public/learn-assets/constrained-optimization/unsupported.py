from fractions import Fraction

choices = [("S", 12, 8), ("C", 11, 15), ("M", 8, 18), ("L", 7, 70)]
# For C to beat S: 11 + 15*p <= 12 + 8*p.
# For C to beat M: 11 + 15*p <= 8 + 18*p.
upper = Fraction(12 - 11, 15 - 8)
lower = Fraction(11 - 8, 18 - 15)
print("C requires price <=", upper, "and price >=", lower)
print("Compatible:", lower <= upper)
feasible = [row for row in choices if row[2] <= 15]
answer = min(feasible, key=lambda row: (row[1], row[2]))
print("Error first, latency <= 15:", answer[0])
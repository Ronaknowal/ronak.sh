# group, treated users, treated conversions, control users, control conversions
groups = [
    ("low activity", 20, 4, 80, 8),
    ("high activity", 80, 32, 20, 6),
]

treated_rate = sum(row[2] for row in groups) / sum(row[1] for row in groups)
control_rate = sum(row[4] for row in groups) / sum(row[3] for row in groups)
naive_difference = treated_rate - control_rate

adjusted_difference = sum(
    ((treated_success / treated_n) - (control_success / control_n)) * 0.5
    for _, treated_n, treated_success, control_n, control_success in groups
)

print(round(naive_difference, 2))
print(round(adjusted_difference, 2))

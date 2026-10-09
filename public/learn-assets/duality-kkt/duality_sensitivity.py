def value(budget):
    return max(0.0, 7 - budget)**2 / 2

for budget, change in [(5.0, 0.1), (5.0, -0.1), (7.0, -0.1)]:
    price = max(0.0, 7 - budget)
    actual = value(budget + change) - value(budget)
    linear = -price * change
    print("budget", budget, "change", change, "price", price,
          "actual cost change", round(actual, 6), "linear", round(linear, 6))
    assert actual >= linear - 1e-12

# min t with -t<=0 and -t<=u has value max(0,-u).
# At u=0 every price in [0,1] is dual optimal; the derivative is not unique.
for price in [0.0, 0.5, 1.0]:
    for change in [-0.2, 0.2]:
        actual = max(0.0, -change)
        supporting = -price * change
        print("kink price", price, "change", change,
              "value", actual, "lower line", supporting)
        assert actual >= supporting

print("constraint scaled by 10: price", 2.0 / 10, "same contribution", (2.0 / 10) * 10)
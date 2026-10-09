models = [("S", 12, 8), ("M", 8, 18), ("L", 7, 70)]
for label, divisor, price in [("ms", 1, 0.2),
                               ("seconds, wrong price", 1000, 0.2),
                               ("seconds, converted price", 1000, 200)]:
    scores = [(name, error + price * latency / divisor)
              for name, error, latency in models]
    print(label, [(name, round(score, 4)) for name, score in scores],
          "winner", min(scores, key=lambda row: row[1])[0])
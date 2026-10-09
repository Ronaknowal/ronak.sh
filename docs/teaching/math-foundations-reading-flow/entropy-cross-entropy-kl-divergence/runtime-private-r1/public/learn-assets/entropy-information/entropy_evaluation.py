import math

correct_label_probabilities = {
    "A": [0.6] * 8 + [0.4] * 2,
    "B": [0.99] * 8 + [0.01] * 2,
}
for name, probabilities in correct_label_probabilities.items():
    losses = [-math.log(p) for p in probabilities]
    accuracy = sum(p > 0.5 for p in probabilities) / len(probabilities)
    mean_loss = sum(losses) / len(losses)
    geometric_probability = math.exp(-mean_loss)
    print(f"{name}: accuracy={accuracy:.0%}, loss={mean_loss:.6f} nats")
    print(f"geometric correct-label probability={geometric_probability:.6f}")
    print(f"perplexity={math.exp(mean_loss):.6f}")
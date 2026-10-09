source = {-1: 0.5, 1: 0.5}
reconstructions = {"constant zero": {0: 1.0}, "independent signs": {-1: 0.5, 1: 0.5}}
for name, output in reconstructions.items():
    mse = sum(
        p * q * (x - y) ** 2 for x, p in source.items() for y, q in output.items()
    )
    print(name, "MSE", mse, "same marginal", output == source)

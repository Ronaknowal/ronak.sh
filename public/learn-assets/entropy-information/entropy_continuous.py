import math

width, bins = 0.25, 4
for scale in (1, 100):
    coordinate_width = scale * width
    h = math.log2(coordinate_width)
    delta = coordinate_width / bins
    print(
        f"scale={scale}: h={h:.6f}, bin width={delta:g}, H(bin)={h-math.log2(delta):.6f}"
    )


def normal_kl(mean_p, sd_p, mean_q, sd_q):
    if (
        not all(math.isfinite(x) for x in (mean_p, sd_p, mean_q, sd_q))
        or min(sd_p, sd_q) <= 0
    ):
        raise ValueError(
            "Use finite means and strictly positive finite standard deviations."
        )
    return (
        math.log(sd_q / sd_p) + (sd_p**2 + (mean_p - mean_q) ** 2) / (2 * sd_q**2) - 0.5
    )


for scale in (1, 100):
    print(
        f"Normal KL after scaling by {scale}: {normal_kl(0,scale,scale,2*scale):.6f} nats"
    )
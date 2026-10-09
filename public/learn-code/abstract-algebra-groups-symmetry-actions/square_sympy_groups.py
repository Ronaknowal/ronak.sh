"""Exact four-position group operations using SymPy 1.14.0."""
from sympy.combinatorics import Permutation, PermutationGroup
from sympy.combinatorics.named_groups import DihedralGroup


def square_images(element):
    if type(element) is not int or not 0 <= element < 8:
        raise ValueError("Use an encoded square element from 0 to 7")
    turn, reflected = element % 4, element // 4
    return [(turn + (-1) ** reflected * i) % 4 for i in range(4)]


def four_images(permutation):
    # Explicit addresses avoid omitting trailing fixed points.
    return tuple(int(permutation(i)) for i in range(4))


def lesson_product(outer, inner):
    # SymPy p*q applies p first. Our gh applies h first.
    return inner * outer


def main():
    maps = [Permutation(square_images(g), size=4) for g in range(8)]
    rotation, reflection = maps[1], maps[4]
    group = PermutationGroup(rotation, reflection)
    generated = {
        four_images(p) for p in group.generate_schreier_sims(af=False)
    }
    declared = {tuple(square_images(g)) for g in range(8)}
    assert generated == declared
    assert group.order() == 8

    matched = 0
    for outer in maps:
        for inner in maps:
            product = lesson_product(outer, inner)
            expected = tuple(int(outer(inner(i))) for i in range(4))
            assert four_images(product) == expected
            matched += 1

    rs = lesson_product(rotation, reflection)
    sr = lesson_product(reflection, rotation)
    orbit = sorted(int(i) for i in group.orbit(0))
    stabilizer = group.stabilizer(0)
    fixing = sorted(
        four_images(p)
        for p in stabilizer.generate_schreier_sims(af=False)
    )
    named = DihedralGroup(4)
    named_images = {
        four_images(p) for p in named.generate_schreier_sims(af=False)
    }
    assert named_images == generated
    assert orbit == [0, 1, 2, 3]
    assert stabilizer.order() == 2
    assert len(orbit) * int(stabilizer.order()) == int(group.order())

    print("generator count:", len(group.generators))
    print("group order:", group.order())
    print("generated maps:", sorted(generated))
    print("rightmost-first pairs checked:", matched)
    print("rs images:", four_images(rs))
    print("rs vertex-1 path:", [1, int(reflection(1)), int(rs(1))])
    print("sr images:", four_images(sr))
    print("sr vertex-1 path:", [1, int(rotation(1)), int(sr(1))])
    print("vertex-0 orbit:", orbit)
    print("vertex-0 stabilizer maps:", fixing)
    print("vertex-0 stabilizer order:", stabilizer.order())
    print("orbit times stabilizer:", len(orbit) * int(stabilizer.order()))
    print("named DihedralGroup(4) same maps:", named_images == generated)


if __name__ == "__main__":
    main()

"""Exact flat-plane constructions, executed with SymPy 1.14.0.

The SSA example fixes A=30 degrees and b=10. Its input is one concrete
positive integer side a in 1..20, not arbitrary symbolic coordinates.
A ray includes its source; we explicitly discard that collapsed triangle.
"""
from sympy import Circle, Point2D, Rational, Ray, Segment, Triangle, simplify, sqrt


def ssa_vertices(a):
    if isinstance(a, bool) or not isinstance(a, int) or not 1 <= a <= 20:
        raise ValueError("a must be an integer in 1..20")
    origin = Point2D(0, 0)
    apex = Point2D(5 * sqrt(3), 5)
    candidates = Circle(apex, a).intersection(Ray(origin, Point2D(1, 0)))
    vertices = [point for point in candidates if point.x.is_positive is True]
    for point in vertices:
        assert point.y == 0
        assert simplify(point.distance(apex) ** 2 - a ** 2) == 0
        assert Triangle(origin, point, apex).area > 0
    # Numeric conversion only orders display; the points and checks stay exact.
    return sorted(vertices, key=lambda point: float(point.x))


if __name__ == "__main__":
    p, q = Point2D(1, 2), Point2D(4, 6)
    segment = Segment(p, q)
    area = Triangle(p, Point2D(4, 2), q).area
    print("distance:", segment.length)
    print("midpoint:", segment.midpoint)
    print("right-triangle area:", area)
    assert segment.length == 5
    assert segment.midpoint == Point2D(Rational(5, 2), 4)
    assert area == 6
    for side in (4, 5, 7, 10, 12):
        points = ssa_vertices(side)
        print(f"a={side}: {len(points)} nondegenerate triangle(s)")
        for vertex in points:
            print("  c =", vertex.x)
    assert len(ssa_vertices(4)) == 0
    assert len(ssa_vertices(5)) == 1
    assert len(ssa_vertices(7)) == 2
    assert len(ssa_vertices(10)) == 1
    assert Point2D(0, 0) in Circle(Point2D(5 * sqrt(3), 5), 10).intersection(
        Ray(Point2D(0, 0), Point2D(1, 0)))

"""Corrected Xi extraction with explicit regions, endpoints and input-ID mapping.

Derived from scikit-learn 1.9.1 sklearn/cluster/_optics.py's Xi helpers.
Algorithm references: Ankerst et al. (1999); Schubert and Gertz (2018).
Changes: named records, explicit inverse-order lookup, bounded optional events,
integer-size contract, and a teaching main consuming supplied graphs without fits.

BSD 3-Clause License
Copyright (c) 2007-2026 The scikit-learn developers.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.
* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"""
from dataclasses import dataclass
import math
import numpy as np
from density_neighbourhoods import positive_count
from optics_ordering import Ordering
from optics_radius_extraction import validate_graph


@dataclass(frozen=True)
class XiExtraction:
    labels: tuple
    intervals: tuple
    events: tuple


def extend_region(steep, opposing, start, budget):
    cursor, last_steep, consecutive = start, start, 0
    while cursor < len(steep):
        if steep[cursor]:
            consecutive, last_steep = 0, cursor
        elif opposing[cursor]:
            break
        else:
            consecutive += 1
            if consecutive > budget:
                break
        cursor += 1
    return last_steep


def xi_extract(graph, xi=0.05, minimum_size=None, correct_predecessors=True,
               keep_trace=False):
    validate_graph(graph)
    n = len(graph.ordering)
    if isinstance(xi, bool) or not isinstance(xi, (int, float)) or not 0 < xi < 1:
        raise ValueError("xi must be a number strictly between 0 and 1")
    minimum = positive_count(graph.minimum)
    size = minimum if minimum_size is None else positive_count(minimum_size, "cluster size")
    if not 2 <= minimum <= n or not 2 <= size <= n:
        raise ValueError("integer density and cluster minima must be between 2 and n")
    if type(correct_predecessors) is not bool or type(keep_trace) is not bool:
        raise ValueError("correction and trace flags must be boolean")
    if keep_trace and n > 64:
        raise ValueError("full teaching traces are limited to 64 observations")
    order = graph.ordering
    inverse = [0] * n
    for position, row in enumerate(order):
        inverse[row] = position
    heights = np.asarray([graph.reachability[row] for row in order] + [math.inf])
    parents = [graph.predecessor[row] for row in order]
    complement = 1 - xi
    # Inf/inf and 0/0 are not a steep transition, matching the library semantics.
    with np.errstate(invalid="ignore", divide="ignore"):
        ratio = heights[:-1] / heights[1:]
        steep_up = ratio <= complement
        steep_down = ratio >= 1 / complement
        downward, upward = ratio > 1, ratio < 1
    areas, intervals, events = [], [], []
    cursor, maximum_between = 0, 0.0

    def event(operation, **fields):
        if keep_trace:
            events.append({"operation": operation, **fields})

    def filter_areas(maximum):
        nonlocal areas
        before = tuple((a["start"], a["end"], a["maximum"]) for a in areas)
        if math.isinf(maximum):
            areas = []
        else:
            areas = [a for a in areas if maximum <= heights[a["start"]] * complement]
            for area in areas:
                area["maximum"] = max(area["maximum"], maximum)
        event("filter active down regions", maximum=maximum, before=before,
              after=tuple((a["start"], a["end"], a["maximum"]) for a in areas))

    for steep_position in np.flatnonzero(steep_up | steep_down):
        position = int(steep_position)
        if position < cursor:
            continue
        maximum_between = max(maximum_between, float(np.max(heights[cursor:position + 1])))
        filter_areas(maximum_between)
        if steep_down[position]:
            end = extend_region(steep_down, upward, position, minimum)
            areas.append({"start": position, "end": end, "maximum": 0.0})
            cursor = end + 1
            maximum_between = float(heights[cursor])
            event("open down region", start=position, end=end, cursor=cursor)
            continue
        up_start = position
        up_end = extend_region(steep_up, downward, position, minimum)
        cursor = up_end + 1
        maximum_between = float(heights[cursor])
        event("close up region", start=up_start, end=up_end, cursor=cursor)
        closing_intervals = []
        for area in areas:
            start, end = area["start"], up_end
            ceiling = float(heights[end + 1] * complement)
            if ceiling < area["maximum"]:
                event("reject maximum-in-between", start=start, end=end,
                      ceiling=ceiling, maximum=area["maximum"])
                continue
            left_height, closing_height = heights[area["start"]], heights[end + 1]
            original = (start, end)
            if left_height * complement >= closing_height:
                while heights[start + 1] > closing_height and start < area["end"]:
                    start += 1
            elif closing_height * complement >= left_height:
                while heights[end - 1] > left_height and end > up_start:
                    end -= 1
            event("height-adjust endpoints", before=original, after=(start, end))
            if correct_predecessors:
                while start < end:
                    parent = parents[end]
                    parent_position = -1 if parent == -1 else inverse[parent]
                    shortcut = bool(heights[start] > heights[end])
                    inside = start <= parent_position < end
                    event("test endpoint predecessor", start=start, end=end,
                          predecessor=parent, predecessor_position=parent_position,
                          shortcut=shortcut, inside=inside)
                    if shortcut or inside:
                        break
                    end -= 1
                if start == end:
                    event("reject exhausted predecessor interval", start=start, end=end)
                    continue
            length = end - start + 1
            if length < size or start > area["end"] or end < up_start:
                event("reject size or boundary", start=start, end=end, length=length,
                      required=size)
                continue
            closing_intervals.append((start, end))
            event("accept interval", start=start, end=end, length=length)
        intervals.extend(reversed(closing_intervals))  # Children before enclosing intervals.
    ordered_labels, group = [-1] * n, 0
    for start, end in intervals:
        if all(label == -1 for label in ordered_labels[start:end + 1]):
            ordered_labels[start:end + 1] = [group] * (end - start + 1)
            group += 1
    labels = [-1] * n
    for position, row in enumerate(order):
        labels[row] = ordered_labels[position]
    return XiExtraction(tuple(labels), tuple(intervals), tuple(events))


def supplied_graph(order, ordered_heights, ordered_cores, ordered_parents):
    n = len(order)
    reach, core, parent = [0.0] * n, [0.0] * n, [-1] * n
    for position, row in enumerate(order):
        reach[row], core[row], parent[row] = (
            ordered_heights[position], ordered_cores[position], ordered_parents[position])
    return Ordering(tuple(order), tuple(core), tuple(reach), tuple(parent), math.inf, 2, ())


def main():
    from sklearn.cluster import cluster_optics_xi
    graph = supplied_graph(
        [0, 3, 6, 10, 5, 1, 9, 8, 2, 7, 4],
        [math.inf, 10, 1, 1, 8, 1, 1, 10, 1, 1, 16],
        [10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 16],
        [-1, 0, 3, 6, 10, 5, 1, 9, 8, 2, 7])
    outside = supplied_graph(list(range(9)),
        [math.inf, 1, 9, 1, 1, 1, 1, 1, 9.5], [1] * 8 + [9.5],
        [-1, 0, 1, 2, 2, 3, 4, 5, 1])
    right = supplied_graph(list(range(11)),
        [math.inf, 10, 1, 1, 8, 1, 1, 9, 12, 18, 30],
        [10, 1, 1, 1, 1, 1, 1, 9, 12, 18, 30], [-1] + list(range(10)))
    cases = [("main", graph, .2, 3), ("main", graph, .8, 3),
             ("main", graph, .95, 3), ("main size4", graph, .2, 4),
             ("M2", graph, .8, 4), ("outside", outside, .2, 3),
             ("M1", outside, .2, 7), ("right trim", right, .2, 3)]
    for name, current, xi, size in cases:
        result = xi_extract(current, xi, size, keep_trace=True)
        labels, intervals = cluster_optics_xi(
            reachability=np.asarray(current.reachability),
            predecessor=np.asarray(current.predecessor), ordering=np.asarray(current.ordering),
            min_samples=2, min_cluster_size=size, xi=xi, predecessor_correction=True)
        np.testing.assert_array_equal(result.labels, labels)
        np.testing.assert_array_equal(np.asarray(result.intervals).reshape(-1, 2), intervals)
        print(name, "xi", xi, "size", size, "intervals", list(result.intervals),
              "input labels", list(result.labels))
    for values, expected in (([20, 10, 9, 8, 3], 3),
                             ([20, 10, 9, 8, 7, 3], 0),
                             ([20, 10, 9, 11, 3], 0)):
        ratios = np.asarray(values[:-1]) / np.asarray(values[1:])
        end = extend_region(ratios >= 1 / .8, ratios < 1, 0, 2)
        assert end == expected
        print("supplied strip", values, "last steep endpoint", end)


if __name__ == "__main__":
    main()

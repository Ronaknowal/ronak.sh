"""Small independent repair solutions; definitions only, no main campaign."""
import math


def entropy(values):
    return -math.fsum(p*math.log2(p) for p in values if p > 0)


def checked_information(joint):
    if not joint or not joint[0]:
        raise ValueError('nonempty joint required')
    width = len(joint[0])
    if any(len(row) != width for row in joint):
        raise ValueError('rectangular joint required')
    if any(not math.isfinite(p) or p < 0 for row in joint for p in row):
        raise ValueError('finite nonnegative masses required')
    total = math.fsum(p for row in joint for p in row)
    if not math.isclose(total,1.,abs_tol=1e-12,rel_tol=0):
        raise ValueError('probability joint must sum to one')
    px = [math.fsum(row) for row in joint]
    py = [math.fsum(row[j] for row in joint) for j in range(width)]
    terms = [p*(math.log2(p)-math.log2(px[i])-math.log2(py[j]))
             for i,row in enumerate(joint) for j,p in enumerate(row) if p > 0]
    conditional = math.fsum(mass*entropy([p/mass for p in row])
                            for mass,row in zip(px,joint) if mass > 0)
    return math.fsum(terms), conditional, px, py


def conditional_information(context_layers):
    # Layers are unnormalized joint masses p(context, X, Y), not p(X,Y|context).
    if not context_layers:
        raise ValueError('at least one context required')
    if any(not math.isfinite(p) or p < 0 for layer in context_layers for row in layer for p in row):
        raise ValueError('finite nonnegative masses required')
    total = math.fsum(p for layer in context_layers for row in layer for p in row)
    if not math.isclose(total,1,abs_tol=1e-12,rel_tol=0):
        raise ValueError('all joint layers together must sum to one')
    result = 0.
    for layer in context_layers:
        mass = math.fsum(p for row in layer for p in row)
        if mass == 0:
            continue
        conditional = [[p/mass for p in row] for row in layer]
        result += mass*checked_information(conditional)[0]
    return result


def gibbs_row(reference, distortion, beta, offset=0.):
    if len(reference) != len(distortion) or not reference:
        raise ValueError('matching nonempty vectors required')
    if beta < 0 or not math.isfinite(beta):
        raise ValueError('finite nonnegative beta required')
    if any(not math.isfinite(r) or r <= 0 for r in reference):
        raise ValueError('this helper requires positive reference support')
    if not math.isclose(math.fsum(reference),1,rel_tol=0,abs_tol=1e-12):
        raise ValueError('normalized reference required')
    if any(not math.isfinite(d) or d < 0 for d in distortion):
        raise ValueError('finite nonnegative distortions required')
    logits = [math.log(r)-beta*d+offset for r,d in zip(reference,distortion)]
    largest = max(logits)
    weights = [math.exp(v-largest) for v in logits]
    total = math.fsum(weights)
    return [w/total for w in weights]


def bayes_error(joint):
    checked_information(joint)
    selected = [max(range(len(row)),key=lambda y:row[y]) if sum(row)>0 else None
                for row in joint]
    wrong = [[p if y!=selected[z] else 0. for y,p in enumerate(row)]
             for z,row in enumerate(joint)]
    return selected, wrong, math.fsum(p for row in wrong for p in row)


def paired_counts(rows, x_values, y_values):
    xi, yi = {v:i for i,v in enumerate(x_values)}, {v:j for j,v in enumerate(y_values)}
    counts = [[0]*len(y_values) for _ in x_values]
    for x,y in rows:
        counts[xi[x]][yi[y]] += 1
    return counts

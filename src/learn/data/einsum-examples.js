export const einsumExamples = {
  "patterns": {
    "file": "einsum_patterns.py",
    "title": "Read the original small arrays through explicit outputs",
    "code": "import numpy as np\n\nA = np.array([[1, 2], [3, 4]])\nB = np.array([[5, 6], [7, 8]])\nprint(\"matrix product:\", np.einsum(\"ik,kj->ij\", A, B).tolist())\nprint(\"diagonal:\", np.einsum(\"ii->i\", A).tolist())\nprint(\"trace:\", int(np.einsum(\"ii->\", A)))\nprint(\"column sums:\", np.einsum(\"ij->j\", A).tolist())\nprint(\"outer:\", np.einsum(\"i,j->ij\", [1, 2], [3, 4]).tolist())\nprint(\"elementwise:\", np.einsum(\"ij,ij->ij\", A, B).tolist())\nprint(\"implicit ji:\", np.einsum(\"ji\", A).tolist())\nprint(\"explicit ji->ji:\", np.einsum(\"ji->ji\", A).tolist())",
    "expected": "matrix product: [[19, 22], [43, 50]]\ndiagonal: [1, 4]\ntrace: 5\ncolumn sums: [4, 6]\nouter: [[3, 4], [6, 8]]\nelementwise: [[5, 12], [21, 32]]\nimplicit ji: [[1, 3], [2, 4]]\nexplicit ji->ji: [[1, 2], [3, 4]]"
  },
  "loops": {
    "file": "einsum_matrix_loops.py",
    "title": "Check a non-square contraction with ordinary loops",
    "code": "import numpy as np\n\nA = np.array([[1, 2, 3], [-1, 0, 2]])\nB = np.array([[2, 1], [0, 4], [1, -1]])\nC = np.zeros((A.shape[0], B.shape[1]), dtype=int)\nfor i in range(A.shape[0]):\n    for j in range(B.shape[1]):\n        for k in range(A.shape[1]):\n            C[i, j] += A[i, k] * B[k, j]\nresult = np.einsum(\"ik,kj->ij\", A, B)\nprint(\"result:\", result.tolist())\nprint(\"loops agree:\", np.array_equal(result, C))\nprint(\"matrix product agrees:\", np.array_equal(result, A @ B))\nprint(\"reordered result:\", np.einsum(\"ik,kj->ji\", A, B).tolist())\nprint(\"selected products:\", (A[1, :] * B[:, 1]).tolist())",
    "expected": "result: [[5, 6], [0, -3]]\nloops agree: True\nmatrix product agrees: True\nreordered result: [[5, 0], [6, -3]]\nselected products: [-1, 0, -2]"
  },
  "batches": {
    "file": "einsum_batch_pairs.py",
    "title": "Distinguish paired batches, all pairs and broadcast groups",
    "code": "import numpy as np\n\nX = np.array([[1, 2], [3, 4]])\nY = np.array([[10, 20], [30, 40]])\npaired = np.einsum(\"bi,bi->b\", X, Y)\nall_pairs = np.einsum(\"bi,ci->bc\", X, Y)\nprint(\"paired:\", paired.tolist())\nprint(\"all pairs:\", all_pairs.tolist())\nprint(\"same-batch diagonal:\", np.diag(all_pairs).tolist())\n# Two separate broadcast groups: shape (2,1,3) and (4,3).\nleft = np.arange(6).reshape(2, 1, 3)\nright = np.arange(12).reshape(4, 3)\ncombined = np.einsum(\"...i,...i->...\", left, right)\nprint(\"broadcast result shape:\", combined.shape)\nprint(\"broadcast reference agrees:\", np.array_equal(combined, (left * right).sum(axis=-1)))\n# An explicitly labelled singleton axis can also expand across operands.\nprint(\"singleton b:\", np.einsum(\"bi,bi->b\", np.ones((1, 2), dtype=int), Y).tolist())",
    "expected": "paired: [50, 250]\nall pairs: [[50, 110], [110, 250]]\nsame-batch diagonal: [50, 250]\nbroadcast result shape: (2, 4)\nbroadcast reference agrees: True\nsingleton b: [30, 70]"
  },
  "covariance": {
    "file": "einsum_sample_covariance.py",
    "title": "Compute a covariance for each batch and check the estimator",
    "code": "import numpy as np\n\n# Axes: batch, observation, feature. Both features use the same arbitrary units.\nX = np.array([[[1., 2.], [3., 0.], [5., 4.]],\n              [[2., 1.], [4., 3.], [6., 5.]]])\nn = X.shape[1]\nif n < 2:\n    raise ValueError(\"Sample covariance needs at least two observations\")\ncentered = X - X.mean(axis=1, keepdims=True)\ncovariance = np.einsum(\"bni,bnj->bij\", centered, centered) / (n - 1)\nreference = np.stack([np.cov(batch, rowvar=False, ddof=1) for batch in X])\nprint(\"means:\", X.mean(axis=1).tolist())\nprint(\"covariances:\", covariance.tolist())\nprint(\"library agrees:\", np.allclose(covariance, reference))\nprint(\"uncentered second moment:\", (np.einsum(\"bni,bnj->bij\", X, X) / n)[0].round(6).tolist())\nprint(\"translation invariant:\", np.allclose(\n    covariance, np.stack([np.cov(batch + [100, -30], rowvar=False) for batch in X])))",
    "expected": "means: [[3.0, 2.0], [4.0, 3.0]]\ncovariances: [[[4.0, 2.0], [2.0, 4.0]], [[4.0, 4.0], [4.0, 4.0]]]\nlibrary agrees: True\nuncentered second moment: [[11.666667, 7.333333], [7.333333, 6.666667]]\ntranslation invariant: True"
  },
  "attention": {
    "file": "einsum_masked_attention.py",
    "title": "Run masked scaled dot-product attention from complete inputs",
    "code": "import numpy as np\n\ndef scaled_attention(q, k, v, allowed):\n    q, k, v = [np.asarray(a, dtype=float) for a in (q, k, v)]\n    allowed = np.asarray(allowed, dtype=bool)\n    if (q.ndim != 3 or k.ndim != 3 or v.ndim != 3\n            or q.shape[0] != k.shape[0] or k.shape[:2] != v.shape[:2]\n            or q.shape[2] != k.shape[2] or min(q.shape + k.shape + v.shape) < 1):\n        raise ValueError(\"Use matching batch/key/query-feature dimensions\")\n    if not all(np.isfinite(a).all() for a in (q, k, v)):\n        raise ValueError(\"Use finite inputs\")\n    if allowed.shape != (q.shape[0], q.shape[1], k.shape[1]) or not allowed.any(axis=-1).all():\n        raise ValueError(\"Give each query at least one allowed key\")\n    scores = np.einsum(\"btd,bsd->bts\", q, k) / np.sqrt(q.shape[-1])\n    masked = np.where(allowed, scores, -np.inf)\n    shifted = masked - masked.max(axis=-1, keepdims=True)\n    exponentials = np.exp(shifted)\n    weights = exponentials / exponentials.sum(axis=-1, keepdims=True)\n    context = np.einsum(\"bts,bsv->btv\", weights, v)\n    return weights, context\n\nQ = np.array([[[1., 0.], [0., 1.]]])\nK = np.array([[[1., 0.], [0., 1.], [1., 1.]]])\nV = np.array([[[2., 0.], [0., 4.], [2., 2.]]])\nallowed = np.array([[[True, False, True], [True, True, True]]])\nweights, context = scaled_attention(Q, K, V, allowed)\nprint(\"weights:\", weights.round(6).tolist())\nprint(\"context:\", context.round(6).tolist())\nprint(\"row sums:\", weights.sum(axis=-1).tolist())\nprint(\"matrix reference:\", np.allclose(context, weights @ V))\ntry:\n    scaled_attention(Q, K, V, np.zeros_like(allowed))\nexcept ValueError as error:\n    print(\"all masked:\", str(error))",
    "expected": "weights: [[[0.5, 0.0, 0.5], [0.197776, 0.401112, 0.401112]]]\ncontext: [[[2.0, 1.0], [1.197776, 2.406673]]]\nrow sums: [[1.0, 1.0]]\nmatrix reference: True\nall masked: Give each query at least one allowed key"
  },
  "order": {
    "file": "einsum_path_reuse.py",
    "title": "Choose a contraction path and verify the same result",
    "code": "import numpy as np\n\nrng = np.random.default_rng(7)\nA = rng.integers(-2, 3, size=(5, 40))\nB = rng.integers(-2, 3, size=(40, 2))\nC = rng.integers(-2, 3, size=(2, 30))\nleft = (A @ B) @ C\nright = A @ (B @ C)\npath, report = np.einsum_path(\"ab,bc,cd->ad\", A, B, C, optimize=\"greedy\")\nresult = np.einsum(\"ab,bc,cd->ad\", A, B, C, optimize=path)\nprint(\"shape:\", result.shape)\nprint(\"both matrix orders agree:\", np.array_equal(left, right))\nprint(\"planned einsum agrees:\", np.array_equal(result, left))\na, b, c, d = 5, 40, 2, 30\nprint(\"left multiplications:\", a*b*c + a*c*d)\nprint(\"right multiplications:\", b*c*d + a*b*d)\nprint(\"first intermediate elements:\", a*c, b*d)\n# Inspect report locally; its formatting/path details may vary by NumPy version.\nprint(\"plan is reusable:\", path[0] == \"einsum_path\")",
    "expected": "shape: (5, 30)\nboth matrix orders agree: True\nplanned einsum agrees: True\nleft multiplications: 700\nright multiplications: 8400\nfirst intermediate elements: 10 1200\nplan is reusable: True"
  },
  "basis": {
    "file": "einsum_basis_change.py",
    "title": "Check the same vector, measurement and length in a sheared basis",
    "code": "import numpy as np\n\nS = np.array([[1., 1.], [0., 1.]])  # New basis columns in old coordinates.\nv = np.array([3., 2.])\nfunctional = np.array([2., -1.])\nA = np.array([[2., 1.], [0., 1.]])\nnew_v = np.linalg.solve(S, v)\nnew_f = S.T @ functional\nnew_A = np.linalg.solve(S, A @ S)\nnew_G = S.T @ S  # Old coordinates were orthonormal.\nprint(\"new vector coordinates:\", new_v.tolist())\nprint(\"reconstructed vector:\", (S @ new_v).tolist())\nprint(\"new functional:\", new_f.tolist())\nprint(\"measurements:\", float(functional @ v), float(new_f @ new_v))\nprint(\"new map:\", new_A.tolist())\nprint(\"same mapped vector:\", np.allclose(S @ (new_A @ new_v), A @ v))\nprint(\"naive coordinate squares:\", float(new_v @ new_v))\nprint(\"metric:\", new_G.tolist())\nprint(\"true squared lengths:\", float(v @ v), float(np.einsum(\"i,ij,j->\", new_v, new_G, new_v)))",
    "expected": "new vector coordinates: [1.0, 2.0]\nreconstructed vector: [3.0, 2.0]\nnew functional: [2.0, 1.0]\nmeasurements: 4.0 4.0\nnew map: [[2.0, 2.0], [0.0, 1.0]]\nsame mapped vector: True\nnaive coordinate squares: 5.0\nmetric: [[1.0, 1.0], [1.0, 2.0]]\ntrue squared lengths: 13.0 13.0"
  },
  "energy": {
    "file": "einsum_kinetic_energy.py",
    "title": "Sum kinetic energy over bodies while keeping time",
    "code": "import numpy as np\n\n# mass: kilograms; velocity axes: body, time, Cartesian component, in m/s.\nmass = np.array([2., 3.])\nvelocity = np.array([[[1., 0.], [0., 2.], [1., 1.]],\n                     [[0., 2.], [1., 0.], [2., 0.]]])\nenergy = 0.5 * np.einsum(\"n,ntd,ntd->t\", mass, velocity, velocity)\nreference = np.zeros(velocity.shape[1])\nfor n in range(velocity.shape[0]):\n    for t in range(velocity.shape[1]):\n        reference[t] += 0.5 * mass[n] * np.dot(velocity[n, t], velocity[n, t])\nprint(\"energy at each time, joules:\", energy.tolist())\nprint(\"body/time loop agrees:\", np.allclose(energy, reference))\nprint(\"retained axis size:\", energy.shape)",
    "expected": "energy at each time, joules: [7.0, 5.5, 8.0]\nbody/time loop agrees: True\nretained axis size: (3,)"
  },
  "numerical": {
    "file": "einsum_storage_complex.py",
    "title": "Check aliasing and complex products explicitly",
    "code": "import numpy as np\n\nA = np.array([[1., 2.], [3., 4.]])\ndiagonal = np.einsum(\"ii->i\", A)\ndiagonal[0] = 9\nprint(\"diagonal is a view:\", np.shares_memory(A, diagonal))\nprint(\"A after diagonal edit:\", A.tolist())\nindependent = np.einsum(\"ij->ji\", A).copy()\nindependent[0, 0] = -1\nprint(\"copy leaves A alone:\", float(A[0, 0]))\nz = np.array([1 + 2j, 3 - 1j])\nprint(\"bilinear sum:\", np.einsum(\"i,i->\", z, z))\nprint(\"Hermitian squared length:\", np.einsum(\"i,i->\", z.conj(), z))\nprint(\"vdot agrees:\", np.allclose(np.einsum(\"i,i->\", z.conj(), z), np.vdot(z, z)))",
    "expected": "diagonal is a view: True\nA after diagonal edit: [[9.0, 2.0], [3.0, 4.0]]\ncopy leaves A alone: 9.0\nbilinear sum: (5-2j)\nHermitian squared length: (15+0j)\nvdot agrees: True"
  },
  "higher": {
    "file": "einsum_two_axis_contraction.py",
    "title": "Contract two axes without confusing them with the output axes",
    "code": "import numpy as np\n\nA = np.arange(12).reshape(2, 3, 2)\nB = (np.arange(12) - 3).reshape(3, 2, 2)\nresult = np.einsum(\"ijk,jil->kl\", A, B)\nreference = np.tensordot(A, B, axes=([0, 1], [1, 0]))\nprint(\"result:\", result.tolist())\nprint(\"output shape:\", result.shape)\nprint(\"tensordot agrees:\", np.array_equal(result, reference))\nprint(\"one element via explicit sum:\", sum(\n    A[i, j, 1] * B[j, i, 0] for i in range(2) for j in range(3)))",
    "expected": "result: [[110, 140], [122, 158]]\noutput shape: (2, 2)\ntensordot agrees: True\none element via explicit sum: 122"
  }
};

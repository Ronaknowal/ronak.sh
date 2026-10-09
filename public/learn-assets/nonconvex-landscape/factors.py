import numpy as np

def loss(point):
    a, b = point
    return 0.5*(a*b - 1)**2

def gradient(point):
    a, b = point
    return (a*b-1)*np.array([b,a])

def hessian(point):
    a, b = point
    return np.array([[b*b, 2*a*b-1], [2*a*b-1, a*a]])

epsilon = 0.1
for scale in [1.0, 4.0]:
    point = np.array([scale, 1/scale])
    a, b = point
    normal = np.array([b,a])/np.linalg.norm(point)
    tangent = np.array([a,-b])/np.linalg.norm(point)
    eigenvalues = np.linalg.eigvalsh(hessian(point))
    print(f"s={scale:g}: ab={a*b:g}, eigenvalues={eigenvalues.tolist()}")
    print(f"  normal loss={loss(point+epsilon*normal):.8f}; tangent loss={loss(point+epsilon*tangent):.8f}")
    print("  predictions:", (a*b*np.array([-2.0,0.0,3.0])).tolist())
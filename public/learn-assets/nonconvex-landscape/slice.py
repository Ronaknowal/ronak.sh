import numpy as np

def objective(point):
    x,y,z = point
    return x*x + y*y - 0.1*z*z

hessian = np.diag([2.0,2.0,-0.2])
visible_basis = np.array([[1.0,0.0],[0.0,1.0],[0.0,0.0]])
slice_hessian = visible_basis.T @ hessian @ visible_basis
print("visible slice eigenvalues:", np.linalg.eigvalsh(slice_hessian).tolist())
print("full Hessian eigenvalues:", np.linalg.eigvalsh(hessian).tolist())
for point in [[0.2,0,0],[0,0.2,0],[0,0,0.2]]:
    print(point, "change", round(objective(point),6))
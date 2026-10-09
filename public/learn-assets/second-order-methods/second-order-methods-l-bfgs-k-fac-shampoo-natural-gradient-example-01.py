import numpy as np

point = np.array([1.0, 1.0])
gradient = np.array([200.0, 2.0])
hessian = np.diag([200.0, 2.0])
step_to_subtract = np.linalg.solve(hessian, gradient)
print("step to subtract:", step_to_subtract)
print("new point:", point - step_to_subtract)

angle = np.pi / 6
rotation = np.array([[np.cos(angle), -np.sin(angle)],
                     [np.sin(angle), np.cos(angle)]])
hessian = rotation @ hessian @ rotation.T
gradient = hessian @ point
direction = np.linalg.solve(hessian, -gradient)
rate = 1.6 / 200
iterate = point.copy()
for _ in range(12):
    iterate -= rate * (hessian @ iterate)
print("rotated Newton direction:", np.round(direction, 6))
print("solve residual:", np.linalg.norm(hessian @ direction + gradient) < 1e-12)
print("GD after 12:", np.round(iterate, 6))
print("condition number:", round(np.linalg.cond(hessian), 6))

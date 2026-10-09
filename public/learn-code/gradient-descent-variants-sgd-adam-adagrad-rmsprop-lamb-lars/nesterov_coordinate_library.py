"""Explicit physical lookahead versus ordinary PyTorch's current coordinate.

Run: python nesterov_coordinate_library.py (requires PyTorch 2.14.0).
For scalar quadratic curvature>0, fixed rate>0 and fixed momentum0<beta<1.
Physical velocity v includes rate, q=x+beta*v. PyTorch's parameter stores q,
not x; its momentum buffer is -v/rate. First physical x and tool q can differ
without an arithmetic disagreement. CPU float64, dampening0, no penalty.
Changing rate/momentum over time invalidates this simple fixed-coordinate map.
"""
import math
import torch


def compare_coordinates(initial=5., curvature=2., rate=.1, beta=.9, steps=3):
    values=[initial,curvature,rate,beta]
    if any(isinstance(z,bool) or not isinstance(z,(int,float)) or not math.isfinite(z) for z in values):
        raise ValueError("Use finite real inputs.")
    if abs(initial)>1000 or not .001<=curvature<=100 or not .00001<=rate<=10 or not 0<beta<1:
        raise ValueError("Use initial -1000..1000, curvature .001..100, rate .00001..10, beta (0,1).")
    if type(steps) is not int or not 0<=steps<=100:
        raise ValueError("Use an integer update count 0..100.")
    x,velocity=float(initial),0.
    parameter=torch.nn.Parameter(torch.tensor(initial,dtype=torch.float64))
    optimizer=torch.optim.SGD([parameter],lr=rate,momentum=beta,dampening=0,
                              weight_decay=0,nesterov=True,foreach=False,fused=False)
    rows=[]
    for step in range(1,steps+1):
        lookahead=x+beta*velocity
        gradient=curvature*lookahead
        parameter.grad=curvature*parameter.detach()
        optimizer.step()
        velocity=beta*velocity-rate*gradient
        x+=velocity
        q=x+beta*velocity
        if not all(math.isfinite(z) for z in [x,velocity,q,gradient]):
            raise ArithmeticError("The requested comparison exceeded finite arithmetic.")
        torch.testing.assert_close(parameter.detach(),torch.tensor(q,dtype=torch.float64),rtol=3e-12,atol=3e-12)
        buffer=optimizer.state[parameter]['momentum_buffer']
        torch.testing.assert_close(buffer,torch.tensor(-velocity/rate,dtype=torch.float64),rtol=3e-12,atol=3e-12)
        rows.append({'step':step,'evaluation':lookahead,'gradient':gradient,'physical_x':x,
                     'physical_velocity':velocity,'mapped_q':q,'torch_parameter':float(parameter.detach()),
                     'gradient_buffer':float(buffer)})
    return rows


if __name__ == "__main__":
    print("step / evaluation / physical-x / mapped-q / torch-q / gradient-buffer")
    for row in compare_coordinates():
        print(row['step'],*[round(row[key],8) for key in ['evaluation','physical_x','mapped_q','torch_parameter','gradient_buffer']])

"""From-scratch AMSGrad state versus ordinary torch.optim.Adam.

Run: python amsgrad_state_library.py
Requires PyTorch 2.14.0; CPU float64, no fused/foreach, decay=0.
Chosen corrected variant: maximize RAW second history, then divide it by
1-beta2**t. This is PyTorch's declared contract, not the original AMSGrad
paper's uncorrected algorithm. Its corrected denominator need not be monotone.
Inputs are supplied gradients, not a shared training objective or benchmark.
None skips all state; literal zero advances the active clock and memories.
"""
import copy
import math
import torch


class CorrectedAdam:
    def __init__(self, parameters, maximum=False, rate=.05, beta1=.9, beta2=.9, epsilon=1e-8):
        if type(maximum) is not bool:
            raise ValueError("Choose a Boolean maximum-history mode.")
        if any(isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x)
               for x in [rate,beta1,beta2,epsilon]):
            raise ValueError("Use finite real hyperparameters.")
        if rate<=0 or epsilon<=0 or not 0<=beta1<1 or not 0<=beta2<1:
            raise ValueError("Use positive rate/epsilon and memory decays in [0,1).")
        if not isinstance(parameters,(list,tuple)) or not parameters:
            raise ValueError("Use a nonempty parameter vector.")
        if any(isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) for x in parameters):
            raise ValueError("Use finite real parameters.")
        self.theta=list(map(float,parameters))
        self.first=[0.]*len(self.theta)
        self.second=[0.]*len(self.theta)
        self.maximum=[0.]*len(self.theta)
        self.t=0
        self.use_maximum=maximum
        self.rate,self.beta1,self.beta2,self.epsilon=rate,beta1,beta2,epsilon

    def step(self, gradient):
        if gradient is None:
            return self.theta.copy()
        if not isinstance(gradient,(list,tuple)) or len(gradient)!=len(self.theta):
            raise ValueError("Match the parameter-vector gradient shape.")
        if any(isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) for x in gradient):
            raise ValueError("Use a finite real gradient vector or None.")
        t=self.t+1
        first=[self.beta1*m+(1-self.beta1)*g for m,g in zip(self.first,gradient)]
        second=[self.beta2*v+(1-self.beta2)*g*g for v,g in zip(self.second,gradient)]
        maximum=[max(old,new) for old,new in zip(self.maximum,second)] if self.use_maximum else self.maximum.copy()
        used=maximum if self.use_maximum else second
        corrected_first=[m/(1-self.beta1**t) for m in first]
        corrected_second=[v/(1-self.beta2**t) for v in used]
        theta=[x-self.rate*m/(math.sqrt(v)+self.epsilon)
               for x,m,v in zip(self.theta,corrected_first,corrected_second)]
        if not all(math.isfinite(x) for vector in [first,second,maximum,theta] for x in vector):
            raise ArithmeticError("The requested step exceeded finite arithmetic; no state committed.")
        self.theta,self.first,self.second,self.maximum,self.t=theta,first,second,maximum,t
        return theta.copy()


def check_vector(actual, expected):
    torch.testing.assert_close(torch.tensor(actual,dtype=torch.float64),expected,rtol=2e-12,atol=2e-12)


if __name__ == "__main__":
    history=[[2.,.2],[2.,.2],[6.,.2],[.2,.2],[.2,.2],None,[0.,0.],[1e-10,-1e-10]]
    for maximum in [False,True]:
        oracle=CorrectedAdam([1.,-2.],maximum=maximum)
        parameter=torch.nn.Parameter(torch.tensor([1.,-2.],dtype=torch.float64))
        optimizer=torch.optim.Adam([parameter],lr=.05,betas=(.9,.9),eps=1e-8,
                                   weight_decay=0.,amsgrad=maximum,foreach=False,fused=False)
        for event,gradient in enumerate(history,1):
            before=copy.deepcopy(oracle.__dict__)
            parameter.grad=None if gradient is None else torch.tensor(gradient,dtype=torch.float64)
            optimizer.step();oracle.step(gradient)
            state=optimizer.state[parameter]
            check_vector(oracle.theta,parameter.detach())
            check_vector(oracle.first,state['exp_avg'])
            check_vector(oracle.second,state['exp_avg_sq'])
            assert oracle.t==int(state['step'].item())
            if maximum:check_vector(oracle.maximum,state['max_exp_avg_sq'])
            if gradient is None:assert oracle.__dict__==before
            if event in [3,5,6,7,8]:
                used=oracle.maximum if maximum else oracle.second
                corrected=[v/(1-oracle.beta2**oracle.t) for v in used]
                print("maximum",maximum,"event",event,"active",oracle.t,
                      "theta",[round(x,8) for x in oracle.theta],
                      "raw first-coordinate scale",round(used[0],8),
                      "corrected first-coordinate scale",round(corrected[0],8))

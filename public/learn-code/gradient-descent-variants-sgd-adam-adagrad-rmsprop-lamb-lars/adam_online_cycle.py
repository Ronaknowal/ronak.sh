"""A finite projected online-cycle illustration of forgotten square history.

Run: python adam_online_cycle.py (standard library only).
Domain x in [-1,1], cyclic linear losses f_t(x)=g_t*x with gradients 3,-1,-1.
beta1=0, beta2=.1, epsilon=0, and rate alpha/sqrt(t) starting t=1.
No initialization correction; compare raw v with its running maximum.
These are declared paper-style variants, not current corrected PyTorch Adam.
Finite traces expose the mechanism; they are not an asymptotic theorem proof.
"""
import math


def online_cycle(cycles=5, alpha=.1, maximum=False, initial=0.):
    if type(cycles) is not int or not 1<=cycles<=100 or type(maximum) is not bool:
        raise ValueError("Use an integer cycle count 1..100 and a Boolean maximum mode.")
    if any(isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v)
           for v in [alpha,initial]) or not .001<=alpha<=1 or not -1<=initial<=1:
        raise ValueError("Use alpha .001..1 and initial point in [-1,1].")
    x,v,largest=float(initial),0.,0.
    rows=[]
    cumulative_loss=0.
    cumulative_gradient=0.
    for t in range(1,3*cycles+1):
        g=3. if (t-1)%3==0 else -1.
        before=x
        cumulative_loss+=g*before
        cumulative_gradient+=g
        v=.1*v+.9*g*g
        largest=max(largest,v)
        used=largest if maximum else v
        rate=alpha/math.sqrt(t)
        proposed=before-rate*g/math.sqrt(used)
        x=min(1.,max(-1.,proposed))
        rows.append({'step':t,'before':before,'gradient':g,'raw_square':v,
                     'used_square':used,'rate':rate,'proposed':proposed,'after':x,
                     'cumulative_loss':cumulative_loss,
                     'fixed_interval_optimum_loss':-abs(cumulative_gradient)})
    return rows


if __name__ == "__main__":
    print("one complete cycle average slope:",round((3-1-1)/3,6),"fixed optimum:",-1)
    for maximum in [False,True]:
        rows=online_cycle(maximum=maximum)
        print("raw maximum",maximum,"step/before/raw-square/used-square/after")
        for row in rows[:3]:
            print(row['step'],*[round(row[key],8) for key in ['before','raw_square','used_square','after']])
        for row in rows[2::3]:
            regret=row['cumulative_loss']-row['fixed_interval_optimum_loss']
            print("cycle",row['step']//3,"point",round(row['after'],8),"finite cumulative regret",round(regret,8))

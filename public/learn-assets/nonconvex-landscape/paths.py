import numpy as np

def loss(a,b):
    return 0.5*(a*b-1)**2

for t in [0.0,0.25,0.5,0.75,1.0]:
    straight = loss(1+t, 1-t/2)
    curved = loss(1+t, 1/(1+t))
    opposite = loss(1-2*t, 1-2*t)
    print(f"t={t:.2f}: straight={straight:.8f} curved={curved:.8f} opposite={opposite:.8f}")
# The table samples paths; the algebra in the text proves their full behavior.
# Any continuous path from (1,1) to (-1,-1) crosses a=0, where loss=1/2.
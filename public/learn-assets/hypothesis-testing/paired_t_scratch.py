"""Paired mean inference using arithmetic and numerical Student integration.

Finite one-dimensional differences, n>=2 and positive sample spread. Input
checks admit finite 0<confidence<1 and positive integer df. Numerical accuracy
is tested for 90%-99% confidence and integer df1-99; extremely small target
tails outside this scope are unsupported. Use SciPy for wider numerical
ranges. Exact Student coverage requires independent Normal differences.
The substitution t=sqrt(df)*tan(theta) maps the survival integral to a finite
angle interval. Adaptive Simpson uses absolute tolerance2e-12 and depth24;
quantile bisection uses72 steps after bracketing. This is numerical quadrature,
not symbolic exactness. Summary work is O(n), with additional root/integral work.
"""
from math import cos, exp, fsum, isfinite, lgamma, pi, sqrt, atan


def adaptive_integral(function, left, right, tolerance=2e-12, depth=24):
    def simpson(a,b,fa,fm,fb):
        return (b-a)*(fa+4*fm+fb)/6
    def refine(a,b,fa,fm,fb,whole,epsilon,budget):
        middle=(a+b)/2; quarter=(a+middle)/2; threequarter=(middle+b)/2
        fq,ft=function(quarter),function(threequarter)
        first=simpson(a,middle,fa,fq,fm); second=simpson(middle,b,fm,ft,fb)
        error=first+second-whole
        if abs(error)<=15*epsilon:
            return first+second+error/15
        if budget==0:
            raise RuntimeError('Student quadrature budget exhausted')
        return refine(a,middle,fa,fq,fm,first,epsilon/2,budget-1)+refine(middle,b,fm,ft,fb,second,epsilon/2,budget-1)
    fa,fm,fb=function(left),function((left+right)/2),function(right)
    return refine(left,right,fa,fm,fb,simpson(left,right,fa,fm,fb),tolerance,depth)


def student_survival(value,df):
    if not isfinite(value) or isinstance(df,bool) or not isinstance(df,int) or df<1:
        raise ValueError('finite statistic and positive integer degrees of freedom required')
    if value<0:
        return 1-student_survival(-value,df)
    constant=exp(lgamma((df+1)/2)-lgamma(df/2))/sqrt(pi)
    lower=atan(value/sqrt(df))
    integrand=lambda theta: constant*max(0,cos(theta))**(df-1)
    return max(0,min(.5,adaptive_integral(integrand,lower,pi/2)))


def student_critical(confidence,df):
    if not isfinite(confidence) or not 0<confidence<1:
        raise ValueError('confidence must be finite and strictly between0 and1')
    tail=(1-confidence)/2; low,high=0.,1.
    while student_survival(high,df)>tail:
        high*=2
        if high>1e12:
            raise RuntimeError('requested quantile exceeds this numerical bracket')
    for _ in range(72):
        mid=(low+high)/2
        if student_survival(mid,df)>tail: low=mid
        else: high=mid
    return (low+high)/2


def paired_summary(differences,confidence=.95,null_mean=0.):
    values=list(differences); n=len(values)
    if n<2 or any(not isfinite(value) for value in values) or not isfinite(null_mean):
        raise ValueError('at least two finite differences and a finite null mean required')
    try:
        mean=fsum(values)/n
        sse=fsum((value-mean)**2 for value in values)
    except OverflowError as error:
        raise ValueError('differences exceed the finite arithmetic range') from error
    if not isfinite(sse) or sse<=0:
        raise ValueError('ordinary t inference needs finite positive sample spread')
    sd=sqrt(sse/(n-1)); se=sd/sqrt(n); t=(mean-null_mean)/se
    if not isfinite(t):
        raise ValueError('the standardized statistic is outside finite range')
    critical=student_critical(confidence,n-1)
    return {'n':n,'mean':mean,'sse':sse,'sd':sd,'se':se,'df':n-1,'t':t,'critical':critical,
            'low':mean-critical*se,'high':mean+critical*se,'two_sided_p':2*student_survival(abs(t),n-1)}


if __name__=='__main__':
    report=paired_summary([2,4,-1,3,2])
    print('differences ms [2, 4, -1, 3, 2]')
    print(f"mean={report['mean']:.6f} SSE={report['sse']:.6f} sd={report['sd']:.6f} se={report['se']:.6f}")
    print(f"df={report['df']} t={report['t']:.6f} critical={report['critical']:.6f}")
    print(f"CI95=[{report['low']:.6f}, {report['high']:.6f}] two-sided p={report['two_sided_p']:.6f}")

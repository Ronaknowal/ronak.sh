"""Two product VI families for the exact paired-sleep NIG posterior.

Requires NumPy/SciPy. Place the supplied sleep-pairs.csv beside this file,
or pass --data PATH. Normal parameters use variance; IG density is proportional
to v**(-shape-1)*exp(-scale/v). There is no fit, RNG or posterior sampling.
"""
import argparse
import csv
from fractions import Fraction as F
import hashlib
import math
from pathlib import Path
import numpy as np
from scipy.special import digamma, gammaln
from scipy.stats import norm, t

parser = argparse.ArgumentParser()
parser.add_argument("--data", type=Path, default=Path(__file__).with_name("sleep-pairs.csv"))
data_path = parser.parse_args().data
raw = data_path.read_bytes()
expected_hash = "3b27360f282bc31de8368de72f339561f70d324ffaf7aa69c9326467ea4b4fe6"
assert hashlib.sha256(raw).hexdigest() == expected_hash, "Use the complete supplied canonical CSV"
rows = list(csv.DictReader(raw.decode("utf-8").splitlines()))
assert [int(row["id"]) for row in rows] == list(range(1, 11))
differences = [F(row["drug2_extra_hours"])-F(row["drug1_extra_hours"])
               for row in rows]
assert differences == [F(v) for v in ["1.2","2.4","1.3","1.3","0","1","1.8",".8","4.6","1.4"]]
for row, value in zip(rows, differences):
    print("pair", row["id"], "drug2 minus drug1", str(value))

# Prior: v~IG(2,2), mu|v~N(0,v). The model treats differences as IID Normal.
n = len(differences)
kappa = F(n+1)
posterior_mean = sum(differences)/kappa
alpha = F(2)+F(n, 2)
beta = F(2)+sum(value*value for value in differences)/2-kappa*posterior_mean**2/2
assert (kappa, posterior_mean, alpha, beta) == (11, F(79,55), 7, F(10937,1100))
K, M, A, B = map(float, (kappa, posterior_mean, alpha, beta))
print("posterior kappa, m, alpha, beta", str(kappa), str(posterior_mean), str(alpha), str(beta))
log_constant = A*math.log(B)-gammaln(A)+.5*math.log(K/(2*math.pi))

def normal_entropy(variance):
    return .5*math.log(2*math.pi*math.e*variance)

def product_ig_kl(mean, variance, shape, scale):
    elogv = math.log(scale)-digamma(shape)
    einvv = shape/scale
    elogp = log_constant-(A+1.5)*elogv-(B+.5*K*(variance+(mean-M)**2))*einvv
    entropy_v = shape+math.log(scale)+gammaln(shape)-(1+shape)*digamma(shape)
    return -normal_entropy(variance)-entropy_v-elogp

def transformed_kl(mean, variance, tau_mean, tau_variance):
    einvv = math.exp(-2*tau_mean+2*tau_variance)
    # v=exp(2*tau): log inverse-transform Jacobian is log(2)+2*tau.
    elogp = log_constant+math.log(2)-(2*A+1)*tau_mean-(B+.5*K*(variance+(mean-M)**2))*einvv
    return -normal_entropy(variance)-normal_entropy(tau_variance)-elogp

mean, variance, shape, scale = 0., 1., A+.5, 12.
kl = product_ig_kl(mean, variance, shape, scale)
print("CAVI", 0, "m,var,a,b,KL", *[format(v,".12f") for v in [mean,variance,shape,scale,kl]])
for sweep in range(1, 21):
    mean = M
    variance = scale/(shape*K)
    scale = B+.5*K*(variance+(mean-M)**2)
    updated_kl = product_ig_kl(mean, variance, shape, scale)
    assert updated_kl <= kl+1e-12
    kl = updated_kl
    print("CAVI", sweep, "m,var,a,b,KL", *[format(v,".12f") for v in [mean,variance,shape,scale,kl]])

# Analytic global optima from the separately derived family profiles.
optimal_variance = B/(A*K)
optimal_shape = A+.5
optimal_scale = B*optimal_shape/A
tau_variance = 1/(4*A+2)
tau_mean = tau_variance-.5*math.log(A/B)
ig_gap = product_ig_kl(M, optimal_variance, optimal_shape, optimal_scale)
tau_gap = transformed_kl(M, optimal_variance, tau_mean, tau_variance)
assert np.isclose(optimal_variance, optimal_scale/(optimal_shape*K))
assert np.isclose(math.exp(-2*tau_mean+2*tau_variance), A/B)
print("Normal/IG analytic optimum m,var,a,b,KL", *[format(v,".12f") for v in [M,optimal_variance,optimal_shape,optimal_scale,ig_gap]])
print("Normal/log-sigma analytic optimum m,var,tau-mean,tau-var,KL", *[format(v,".12f") for v in [M,optimal_variance,tau_mean,tau_variance,tau_gap]])
exact_variance = B/((A-1)*K)
exact_tail = t.sf((2-M)/math.sqrt(B/(A*K)), 2*A)
product_tail = norm.sf((2-M)/math.sqrt(optimal_variance))
print("exact mu variance", format(exact_variance,".12f"), "product mu variance", format(optimal_variance,".12f"))
print("P(mu>2): exact t14", format(exact_tail,".12f"), "both product families", format(product_tail,".12f"))

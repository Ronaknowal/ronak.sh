"""Finite propositional argument checks, executed with SymPy 1.14.0.

Inputs are symbolic Boolean formulas and a tuple naming all their variables.
This checks the logical form, not real-world premise truth, arithmetic, or
quantified statements. SAT has exponential worst-case cost; this is not a
promise that every argument is cheaper than enumerating its 2**n worlds.
"""
from sympy import And, Implies, Not, symbols, true
from sympy.logic.inference import satisfiable


def check_argument(premises, conclusion, variables):
    # Two separate questions: can all premises hold, and can they hold while
    # the conclusion fails? Python `and`/`not` do not build these formulas.
    admitted = satisfiable(premises)
    counterexample_formula = And(premises, Not(conclusion))
    countermodel = satisfiable(counterexample_formula)
    consistent = admitted is not False
    valid = countermodel is False
    witness = None
    if not valid:
        # A SAT model can omit irrelevant variables. Assigning those False
        # picks one completion, rather than claiming their value is forced.
        witness = {variable: bool(countermodel.get(variable, False))
                   for variable in variables}
        if counterexample_formula.subs(witness) != true:
            raise AssertionError("Returned completion is not a counterexample")
    return consistent, valid, witness


def show(name, premises, conclusion, variables):
    consistent, valid, witness = check_argument(premises, conclusion, variables)
    print(f"{name}: consistent={consistent}; valid={valid}")
    if witness is not None:
        print("  counterexample:", ", ".join(
            f"{variable}={witness[variable]}" for variable in variables))


if __name__ == "__main__":
    p, q, r = symbols("p q r")
    show("modus ponens", And(Implies(p, q), p), q, (p, q))
    show("converse error", And(Implies(p, q), q), p, (p, q))
    show("inconsistent premises", And(p, Not(p)), q, (p, q))
    show("two links", And(Implies(p, q), Implies(q, r)),
         Implies(p, r), (p, q, r))
    show("changed conclusion", And(Implies(p, q), Implies(q, r), r),
         p, (p, q, r))
    assert satisfiable(And(p, Not(p))) is False
    assert check_argument(true, true, (p, q))[0:2] == (True, True)

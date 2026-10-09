"""Inspect fixed-program and continuous sensitivities without writing any files.

NumPy float64, Euler or classical RK4, finite vector state and parameter vector.
This bounded reference exposes the actual stages and manual derivative operations.
It is not an adaptive general-purpose production solver. Endpoint clocks are fixed
inputs: the returned sensitivities concern initial state and field parameters.
"""

from dataclasses import dataclass
import json
import math
from typing import Callable

import numpy as np

Array = np.ndarray
Field = Callable[[float, Array, Array], Array]
Jacobian = Callable[[float, Array, Array], tuple[Array, Array]]


@dataclass(frozen=True)
class Stage:
    time: float
    state: Array
    derivative: Array


@dataclass(frozen=True)
class Solve:
    times: Array
    states: Array
    stages: tuple[tuple[Stage, ...], ...]
    parameters: Array
    step: float
    method: str


def vector(value, name, *, allow_empty=False):
    result = np.asarray(value, dtype=np.float64)
    if result.ndim != 1 or (result.size == 0 and not allow_empty):
        raise ValueError(f'{name} must be a nonempty vector.' if not allow_empty
                         else f'{name} must be a vector.')
    if not np.isfinite(result).all():
        raise ValueError(f'{name} must contain only finite values.')
    return result.copy()


def tableau(method):
    if method == 'euler':
        return np.zeros((1, 1)), np.array([0.]), np.array([1.])
    if method == 'rk4':
        return (np.array([[0., 0., 0., 0.], [.5, 0., 0., 0.],
                          [0., .5, 0., 0.], [0., 0., 1., 0.]]),
                np.array([0., .5, .5, 1.]), np.array([1., 2., 2., 1.]) / 6.)
    raise ValueError('Choose euler or classical rk4.')


def checked_field(field, time, state, parameters):
    value = vector(field(time, state.copy(), parameters.copy()), 'field output')
    if value.shape != state.shape:
        raise ValueError('The field must return the same shape as the state.')
    return value


def checked_jacobian(jacobian, stage, parameters):
    state_matrix, parameter_matrix = jacobian(
        stage.time, stage.state.copy(), parameters.copy())
    state_matrix = np.asarray(state_matrix, dtype=np.float64)
    parameter_matrix = np.asarray(parameter_matrix, dtype=np.float64)
    dimension = stage.state.size
    if state_matrix.shape != (dimension, dimension):
        raise ValueError('State Jacobian must have output-by-state shape.')
    if parameter_matrix.shape != (dimension, parameters.size):
        raise ValueError('Parameter Jacobian must have output-by-parameter shape.')
    if not np.isfinite(state_matrix).all() or not np.isfinite(parameter_matrix).all():
        raise ValueError('Jacobians must be finite.')
    return state_matrix, parameter_matrix


def fixed_solve(field, initial, parameters, start, stop, intervals=16, method='rk4'):
    """Store real stage clocks, including a decreasing or zero-length interval."""
    initial = vector(initial, 'initial state')
    parameters = vector(parameters, 'parameters', allow_empty=True)
    if (isinstance(intervals, (bool, np.bool_)) or
            not isinstance(intervals, (int, np.integer)) or
            not 1 <= intervals <= 4096):
        raise ValueError('Use 1–4096 whole intervals.')
    start, stop = float(start), float(stop)
    if not math.isfinite(start) or not math.isfinite(stop):
        raise ValueError('Start and stop clocks must be finite.')
    coefficients, offsets, weights = tableau(method)
    if start == stop:
        return Solve(np.array([start]), initial[None, :], (), parameters, 0., method)
    step = (stop - start) / intervals
    if not math.isfinite(step) or start + step == start or stop - step == stop:
        raise ValueError('The finite step must advance the clock.')
    times = np.linspace(start, stop, intervals + 1)
    states = [initial]
    all_stages = []
    for time in times[:-1]:
        stages = []
        for index, offset in enumerate(offsets):
            state = states[-1].copy()
            for previous in range(index):
                state += step * coefficients[index, previous] * stages[previous].derivative
            stage_time = float(time + offset * step)
            derivative = checked_field(field, stage_time, state, parameters)
            stages.append(Stage(stage_time, state, derivative))
        next_state = states[-1].copy()
        for weight, stage in zip(weights, stages):
            next_state += step * weight * stage.derivative
        if not np.isfinite(next_state).all():
            raise FloatingPointError('The finite computation overflowed; no completed solve returned.')
        states.append(next_state)
        all_stages.append(tuple(stages))
    return Solve(times, np.stack(states), tuple(all_stages), parameters, step, method)


def tangent(solve, jacobian):
    """Differentiate each stored stage; return endpoint derivatives, not a loss."""
    coefficients, _, weights = tableau(solve.method)
    dimension, count = solve.states.shape[1], solve.parameters.size
    # The first columns seed dz0/dz0; the remaining columns seed dz0/dtheta=0.
    sensitivity = np.concatenate((np.eye(dimension), np.zeros((dimension, count))), axis=1)
    for stages in solve.stages:
        derivative_tangents = []
        for index, stage in enumerate(stages):
            stage_tangent = sensitivity.copy()
            for previous in range(index):
                stage_tangent += solve.step * coefficients[index, previous] * derivative_tangents[previous]
            state_matrix, parameter_matrix = checked_jacobian(jacobian, stage, solve.parameters)
            direction = state_matrix @ stage_tangent
            direction[:, dimension:] += parameter_matrix
            derivative_tangents.append(direction)
        for weight, direction in zip(weights, derivative_tangents):
            sensitivity += solve.step * weight * direction
    if not np.isfinite(sensitivity).all():
        raise FloatingPointError('The tangent calculation overflowed.')
    return sensitivity[:, :dimension], sensitivity[:, dimension:]


def discrete_reverse(solve, jacobian, terminal_gradient):
    """Reverse the actual RK stage graph, including its direct identity route."""
    coefficients, _, weights = tableau(solve.method)
    adjoint = vector(terminal_gradient, 'terminal loss gradient')
    if adjoint.shape != solve.states[-1].shape:
        raise ValueError('Terminal gradient must match the state shape.')
    parameter_gradient = np.zeros(solve.parameters.size)
    for stages in reversed(solve.stages):
        slope_adjoints = [solve.step * weight * adjoint for weight in weights]
        previous_adjoint = adjoint.copy()
        for index in reversed(range(len(stages))):
            state_matrix, parameter_matrix = checked_jacobian(
                jacobian, stages[index], solve.parameters)
            stage_adjoint = state_matrix.T @ slope_adjoints[index]
            parameter_gradient += parameter_matrix.T @ slope_adjoints[index]
            previous_adjoint += stage_adjoint
            for previous in range(index):
                slope_adjoints[previous] += solve.step * coefficients[index, previous] * stage_adjoint
        adjoint = previous_adjoint
    if not np.isfinite(adjoint).all() or not np.isfinite(parameter_gradient).all():
        raise FloatingPointError('The reverse calculation overflowed.')
    return adjoint, parameter_gradient


def continuous_reverse(field, jacobian, final_state, terminal_gradient, parameters,
                       start, stop, intervals=128):
    """Integrate from actual stop to actual start, using column adjoints.

    This approximates a continuous sensitivity equation. It does not differentiate
    the finite forward RK program. Reconstruction is itself a numerical solve.
    """
    final_state = vector(final_state, 'final state')
    terminal_gradient = vector(terminal_gradient, 'terminal loss gradient')
    parameters = vector(parameters, 'parameters', allow_empty=True)
    if final_state.shape != terminal_gradient.shape:
        raise ValueError('Terminal gradient must match the final state.')
    dimension = final_state.size

    def augmented(time, packed, theta):
        state, adjoint = packed[:dimension], packed[dimension:2 * dimension]
        derivative = checked_field(field, time, state, theta)
        state_matrix, parameter_matrix = checked_jacobian(
            jacobian, Stage(time, state, derivative), theta)
        return np.concatenate((derivative, -state_matrix.T @ adjoint,
                               -parameter_matrix.T @ adjoint))

    packed = np.concatenate((final_state, terminal_gradient, np.zeros(parameters.size)))
    result = fixed_solve(augmented, packed, parameters, stop, start, intervals, 'rk4')
    endpoint = result.states[-1]
    return endpoint[:dimension], endpoint[dimension:2 * dimension], endpoint[2 * dimension:]


def clock_field(time, state, theta):
    if theta.shape != state.shape:
        raise ValueError('This example uses one rate parameter per state coordinate.')
    return theta * state + time


def clock_jacobian(time, state, theta):
    del time
    return np.diag(theta), np.diag(state)


def clock_oracle(initial, theta, start, stop):
    """Exact diagonal f(t,z)=theta*z+t, with stable small-rate moments.

    The series also covers theta=0 and decreasing intervals. It avoids dividing
    nearly cancelling exponentials by theta squared or cubed.
    """
    initial, theta = vector(initial, 'initial'), vector(theta, 'rates')
    if initial.shape != theta.shape or not all(map(math.isfinite, [start, stop])):
        raise ValueError('Matching vectors and finite clocks are required.')
    duration = stop - start
    values, parameter_derivatives, initial_derivatives = [], [], []
    for value, rate in zip(initial, theta):
        argument = rate * duration
        exponential = math.exp(argument)
        if abs(argument) < .5:
            powers = [argument ** k for k in range(32)]
            i0 = duration * math.fsum(p / math.factorial(k + 1) for k, p in enumerate(powers))
            i1 = duration ** 2 * math.fsum(p / math.factorial(k + 2) for k, p in enumerate(powers))
            d0 = duration ** 2 * math.fsum((k + 1) * p / math.factorial(k + 2)
                                          for k, p in enumerate(powers))
            d1 = duration ** 3 * math.fsum((k + 1) * p / math.factorial(k + 3)
                                          for k, p in enumerate(powers))
        else:
            remainder = math.expm1(argument)
            i0 = remainder / rate
            i1 = (remainder - argument) / rate ** 2
            d0 = (argument * exponential - remainder) / rate ** 2
            d1 = (argument * remainder - 2 * (remainder - argument)) / rate ** 3
        values.append(exponential * value + start * i0 + i1)
        parameter_derivatives.append(duration * exponential * value + start * d0 + d1)
        initial_derivatives.append(exponential)
    result = tuple(np.array(items) for items in (values, initial_derivatives, parameter_derivatives))
    if not all(np.isfinite(item).all() for item in result):
        raise FloatingPointError('The analytic reference overflowed.')
    return result


def example(initial=(1.2, -.4), rates=(-.7, .3), target=(.4, .2),
            start=.2, stop=1.3, intervals=16, method='rk4'):
    initial, rates, target = (vector(value, name) for value, name in
                              [(initial, 'initial'), (rates, 'rates'), (target, 'target')])
    if target.shape != initial.shape:
        raise ValueError('Target must match the state.')
    solve = fixed_solve(clock_field, initial, rates, start, stop, intervals, method)
    residual = solve.states[-1] - target
    initial_jacobian, parameter_jacobian = tangent(solve, clock_jacobian)
    initial_gradient, parameter_gradient = discrete_reverse(solve, clock_jacobian, residual)
    np.testing.assert_allclose(initial_gradient, initial_jacobian.T @ residual, rtol=2e-13, atol=2e-13)
    np.testing.assert_allclose(parameter_gradient, parameter_jacobian.T @ residual, rtol=2e-13, atol=2e-13)
    exact, exact_initial, exact_parameter = clock_oracle(initial, rates, start, stop)
    reconstruction, continuous_initial, continuous_parameter = continuous_reverse(
        clock_field, clock_jacobian, exact, exact - target, rates, start, stop)
    return {
        'method': method, 'start': start, 'stop': stop, 'intervals': intervals,
        'finite_endpoint': solve.states[-1].tolist(), 'exact_endpoint': exact.tolist(),
        'finite_initial_gradient': initial_gradient.tolist(),
        'finite_parameter_gradient': parameter_gradient.tolist(),
        'continuous_initial_gradient': continuous_initial.tolist(),
        'exact_initial_gradient': ((exact - target) * exact_initial).tolist(),
        'continuous_parameter_gradient': continuous_parameter.tolist(),
        'exact_parameter_gradient': ((exact - target) * exact_parameter).tolist(),
        'continuous_reconstructed_initial': reconstruction.tolist(),
        'first_stage_clocks': [stage.time for stage in solve.stages[0]] if solve.stages else [],
    }


if __name__ == '__main__':
    print(json.dumps(example(), indent=2, allow_nan=False))

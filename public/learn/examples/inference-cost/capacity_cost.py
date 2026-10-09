"""A lease, true variable expense and capacity stairs are separate quantities."""
from decimal import Decimal
import json
from math import ceil


def reserved_charge(devices, hours, usd_per_gpu_hour):
    return Decimal(devices) * Decimal(str(hours)) * Decimal(str(usd_per_gpu_hour))


def hardware_per_million(devices, hours, usd_per_gpu_hour, aggregate_rate, delivered_fraction):
    tokens = Decimal(str(aggregate_rate)) * Decimal(str(delivered_fraction)) * Decimal(str(hours)) * 3600
    charge = reserved_charge(devices, hours, usd_per_gpu_hour)
    return {"charge_usd": str(charge), "output_tokens": str(tokens),
            "usd_per_million_output": str(charge * 1_000_000 / tokens) if tokens else None}


def fleet_cost(volume, capacity_per_slot, fixed_per_slot, variable_per_task, always_on=False):
    if volume < 0 or capacity_per_slot <= 0:
        raise ValueError("Volume must be nonnegative and capacity positive")
    slots = (volume + capacity_per_slot - 1) // capacity_per_slot
    if always_on:
        slots = max(1, slots)
    fixed, variable = map(lambda value: Decimal(str(value)), (fixed_per_slot, variable_per_task))
    charge = slots * fixed + volume * variable
    return {"slots": slots, "capacity": slots * capacity_per_slot,
            "usd": str(charge), "average_usd": str(charge / volume) if volume else None}


def feasible_crossovers(capacity, fixed, variable, metered, max_slots):
    """Enumerate each stair's algebraic crossover; membership is not automatic."""
    fixed, variable, metered = map(lambda value: Decimal(str(value)), (fixed, variable, metered))
    if metered <= variable:
        return []
    rows = []
    for slots in range(1, max_slots + 1):
        crossing = slots * fixed / (metered - variable)
        lower, upper = (slots - 1) * capacity, slots * capacity
        rows.append({"slots": slots, "crossover_tasks": str(crossing),
                     "interval_open_lower": lower, "interval_closed_upper": upper,
                     "feasible": lower < crossing <= upper})
    return rows


def failure_headroom_slots(demand, nominal_capacity, usable_fraction, failures=1):
    fraction = Decimal(str(usable_fraction))
    if demand < 0 or nominal_capacity <= 0 or not 0 < fraction <= 1 or failures < 0:
        raise ValueError("Invalid capacity requirement")
    usable = Decimal(nominal_capacity) * fraction
    return ceil(Decimal(demand) / usable) + failures


def main():
    print(json.dumps({"reserved_usd": str(reserved_charge(2, 720, "4.29")),
                      "metered_usd": str(reserved_charge(2, 80, "4.29"))}))
    for fraction in (".25", "1", "0"):
        print(json.dumps(hardware_per_million(2, 720, "4.29", 200, fraction)))
    for volume in (0, 160000, 180000, 180001, 200000):
        print(json.dumps({"tasks": volume, **fleet_cost(volume, 180000, "1200", ".002")}))
    print(json.dumps(feasible_crossovers(180000, "1200", ".002", ".01", 3)))
    print(json.dumps({"one_failure_slots": failure_headroom_slots(150000, 100000, ".7")}))


if __name__ == "__main__":
    main()

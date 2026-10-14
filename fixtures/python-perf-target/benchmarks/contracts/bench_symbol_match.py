"""Deterministic observations for PERF-MATCH-001.

The expected pairs come from the generator, not from the matcher, so the
correctness check does not reuse the implementation under test.
"""
import argparse
import json
import os
import random
import statistics
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "src"))

from matcher import match_symbols  # noqa: E402

SIZES = [250, 500, 1000, 2000]
MATCHED_FRACTION = 0.8
SEED = 7


def make_snapshots(size):
    rng = random.Random(SEED * 1000003 + size)
    matched = int(size * MATCHED_FRACTION)
    old, new, truth = [], [], set()
    for index in range(size):
        key = f"key-{rng.getrandbits(48):012x}"
        old.append((f"old_{index}", key))
        if index < matched:
            new.append((f"new_{index}", key))
            truth.add((f"old_{index}", f"new_{index}"))
    for index in range(size - matched):
        new.append((f"added_{index}", f"added-{rng.getrandbits(48):012x}"))
    rng.shuffle(new)
    return old, new, truth


def measure(size, repeats):
    old, new, truth = make_snapshots(size)
    counters = {"candidate_visits": 0, "sort_comparisons": 0}
    pairs = match_symbols(old, new, counters)
    correct = len(pairs) == len(truth) and set(pairs) == truth
    match_symbols(old, new)  # warm-up, not measured
    timings = []
    for _ in range(repeats):
        started = time.perf_counter()
        match_symbols(old, new)
        timings.append((time.perf_counter() - started) * 1000.0)
    return {
        "matched_pairs_equal_oracle": {"value": correct, "unit": "bool"},
        "candidate_visits": {"value": counters["candidate_visits"], "unit": "count"},
        "sort_comparisons": {"value": counters["sort_comparisons"], "unit": "count"},
        "wall_ms_median": {"value": round(statistics.median(timings), 3), "unit": "ms", "advisory": True},
        "wall_ms_spread": {"value": round(max(timings) - min(timings), 3), "unit": "ms", "advisory": True},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--repeats", type=int, default=5)
    args = parser.parse_args()
    points = [{"dimension_value": size, "metrics": measure(size, args.repeats)} for size in SIZES]
    document = {
        "schema_version": "1.0",
        "observations": [{"contract_id": "PERF-MATCH-001", "dimension": "symbols_per_side", "points": points}],
    }
    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(document, handle, indent=2, sort_keys=True)
        handle.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())

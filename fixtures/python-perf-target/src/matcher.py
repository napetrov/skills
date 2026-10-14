"""Match symbols between two snapshots by canonical key.

Counters are optional and are read only by the contract benchmark.
"""


def _merge_sort(items, counters):
    if len(items) <= 1:
        return list(items)
    middle = len(items) // 2
    left = _merge_sort(items[:middle], counters)
    right = _merge_sort(items[middle:], counters)
    merged = []
    left_index = right_index = 0
    while left_index < len(left) and right_index < len(right):
        counters["sort_comparisons"] += 1
        if left[left_index][0] <= right[right_index][0]:
            merged.append(left[left_index])
            left_index += 1
        else:
            merged.append(right[right_index])
            right_index += 1
    merged.extend(left[left_index:])
    merged.extend(right[right_index:])
    return merged


def match_symbols(old, new, counters=None):
    """Return (old_name, new_name) pairs for symbols that share a key, sorted by old name."""
    if counters is None:
        counters = {"candidate_visits": 0, "sort_comparisons": 0}
    index = {}
    for name, key in new:
        index.setdefault(key, name)
    pairs = []
    for name, key in old:
        counters["candidate_visits"] += 1
        match = index.get(key)
        if match is not None:
            pairs.append((name, match))
    return _merge_sort(pairs, counters)

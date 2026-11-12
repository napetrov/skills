from itertools import product
from rules import size, compatible

def layouts():
    for a, b, reverse in product([4, 8], [4, 8], [False, True]):
        layout = [("a", a), ("b", b)]
        yield list(reversed(layout)) if reverse else layout

def corpus():
    representatives = {}
    for old, new in product(list(layouts()), repeat=2):
        key = (size(old), size(new))
        representatives.setdefault(key, {"old": old, "new": new,
                                          "expected": compatible(old, new)})
    return list(representatives.values())

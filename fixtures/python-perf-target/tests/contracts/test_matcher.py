import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

from matcher import match_symbols  # noqa: E402


class MatcherTests(unittest.TestCase):
    def test_pairs_symbols_by_key(self):
        old = [("a", "k1"), ("b", "k2"), ("c", "k3")]
        new = [("x", "k3"), ("y", "k1"), ("z", "k9")]
        self.assertEqual(match_symbols(old, new), [("a", "y"), ("c", "x")])

    def test_one_candidate_visit_per_old_symbol(self):
        counters = {"candidate_visits": 0, "sort_comparisons": 0}
        match_symbols([("a", "k1"), ("b", "k2")], [("x", "k2")], counters)
        self.assertEqual(counters["candidate_visits"], 2)


if __name__ == "__main__":
    unittest.main()

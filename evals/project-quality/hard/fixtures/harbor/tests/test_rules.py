import unittest
from generate import corpus
from rules import compatible
from codec import encode, decode

class Rules(unittest.TestCase):
    def test_generated(self):
        for case in corpus():
            with self.subTest(case=case):
                self.assertEqual(compatible(case["old"],case["new"]),case["expected"])
    def test_consumer(self):
        layout = [("a",4),("b",4)]
        self.assertEqual(decode(layout,encode(layout,{"a":7,"b":11})),{"a":7,"b":11})

import unittest
from store import Store
from report import summarize

class Service(unittest.TestCase):
    def test_finish(self):
        s = Store(); token = s.claim("w", 0)
        self.assertTrue(s.complete(token, "first"))
        self.assertEqual(s.row["result"], "first")
    def test_takeover(self):
        s = Store(); old = s.claim("a", 0); new = s.claim("b", 11)
        self.assertTrue(s.complete(new, "fresh"))
        self.assertFalse(s.complete(old, "stale"))
        self.assertEqual(s.row["result"], "fresh")
    def test_all_answered(self):
        self.assertEqual(summarize([{"status":"ok", "mentioned":True},
                                    {"status":"ok", "mentioned":False}]),
                         {"visibility":0.5, "coverage":1.0})

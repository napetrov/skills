import unittest
from core import saturated_add, batch

class Core(unittest.TestCase):
    def test_domain(self):
        for a in range(32):
            for b in range(32):
                expected = a + b if a + b < 32 else 31
                with self.subTest(a=a,b=b):
                    self.assertEqual(saturated_add(a,b),expected)
    def test_invalid(self):
        for value in [-1, 32, 1.0, None, True, "1"]:
            for args in [(value,0),(0,value)]:
                with self.subTest(args=args), self.assertRaises(ValueError):
                    saturated_add(*args)
    def test_batch(self):
        for n in [0,1,63,64,65,129]:
            pairs = [(i % 32, 2) for i in range(n)]
            expected = [i%32+2 if i%32<30 else 31 for i in range(n)]
            self.assertEqual(batch(pairs),expected)

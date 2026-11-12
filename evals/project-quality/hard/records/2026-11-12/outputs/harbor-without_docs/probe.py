import sys
from itertools import product
sys.path.insert(0, '/workspace/scratch/c0a9fdcf5a68/quality-hard/harbor-without_docs')
from generate import layouts, corpus
from rules import compatible
from codec import encode, decode
vals = [-2**31, -1, 0, 1, 7, 11, 2**31-1]
accepted = safe = false_positive = 0
for old, new in product(list(layouts()), repeat=2):
    survives = True
    for a, b in product(vals, repeat=2):
        values = {'a': a, 'b': b}
        try:
            got = decode(old, encode(new, values))
        except Exception:
            survives = False
            break
        if got != values:
            survives = False
            break
    accepted += compatible(old,new)
    safe += survives
    false_positive += compatible(old,new) and not survives
print(dict(pairs=64, accepted=accepted, consumer_survivors=safe, false_positive=false_positive))
for old,new in [([('a',4),('b',4)],[('b',4),('a',4)]),([('a',4),('b',8)],[('a',8),('b',4)])]:
    print(dict(old=old,new=new,compatible=compatible(old,new),input={'a':7,'b':11},output=decode(old,encode(new,{'a':7,'b':11}))))
print('corpus',corpus())

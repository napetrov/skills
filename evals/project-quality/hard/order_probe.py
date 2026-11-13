#!/usr/bin/env python3
"""Post-run exploratory check, not part of the frozen scoring rubric."""
import importlib.util,io,json,sys,unittest
from pathlib import Path
root=Path(__file__).resolve().parent/'fixtures/quartz'
sys.dont_write_bytecode=True
sys.path.insert(0,str(root))
import core
spec=importlib.util.spec_from_file_location('quartz_tests',root/'tests/test_core.py')
tests=importlib.util.module_from_spec(spec);spec.loader.exec_module(tests)

def swapped(rows):
    out=core.batch(rows)
    if len(out)>=128:
        out[:128]=out[64:128]+out[:64]
    return out

results={}
for label,implementation in [('original',core.batch),('chunk_swap',swapped)]:
    tests.batch=implementation
    outcome=unittest.TextTestRunner(stream=io.StringIO()).run(unittest.defaultTestLoader.loadTestsFromModule(tests))
    results[label]={'tests':outcome.testsRun,'passed':outcome.wasSuccessful()}
    assert outcome.wasSuccessful()
rows=[(1,0)]*64+[(2,0)]*64+[(3,0)]
expected=[1]*64+[2]*64+[3]
assert core.batch(rows)==expected
assert swapped(rows)!=expected
results['independent_distinct_chunk_case']={'original_pass':True,'mutant_rejected':True}
print(json.dumps(results,indent=2))

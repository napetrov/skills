import sys, unittest, platform, time
sys.dont_write_bytecode = True
sys.path.insert(0, '/workspace/scratch/c0a9fdcf5a68/quality-hard/quartz-with_docs')
sys.path.insert(0, '/workspace/scratch/c0a9fdcf5a68/quality-hard/quartz-with_docs/tests')
import core, test_core
print(platform.platform(), sys.version, flush=True)
original = core.batch
def reordered(rows):
    result = original(rows)
    if len(result) >= 128:
        result[:128] = result[64:128] + result[:64]
    return result
for label, implementation in [('original', original), ('chunk-reorder mutant', reordered)]:
    test_core.batch = implementation
    print(label, flush=True)
    suite = unittest.defaultTestLoader.loadTestsFromModule(test_core)
    unittest.TextTestRunner(verbosity=2, stream=sys.stdout).run(suite)
rows = [(1, 0)] * 64 + [(2, 0)] * 64 + [(3, 0)]
expected = [1]*64 + [2]*64 + [3]
print('independent distinguishable chunk fixture original:', original(rows)==expected)
print('independent distinguishable chunk fixture mutant:', reordered(rows)==expected)
for index in [0, 63, 64, 128]:
    rows = [(0, 0)]*129
    rows[index] = (True, 0)
    try:
        original(rows)
    except ValueError:
        print('invalid batch operand', index, 'ValueError PASS')
    else:
        print('invalid batch operand', index, 'FAIL')

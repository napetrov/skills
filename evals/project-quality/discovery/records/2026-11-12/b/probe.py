import sys, time
sys.dont_write_bytecode = True
sys.path.insert(0, '/workspace/scratch/c0a9fdcf5a68/discovery-check/b')
from service import JobService
start = time.perf_counter()
print(sys.version)
s = JobService()
old = s.claim('w', 0)
current = s.claim('w', 10)
print('same-worker old/current:', old, current)
print('stale accepted (expected False):', s.publish(old, 'stale'))
print('current accepted after stale (expected True):', s.publish(current, 'fresh'))
s = JobService()
old = s.claim('w', 0)
current = s.claim('v', 10)
assert s.publish(old, 'stale') is False
assert s.publish(current, 'fresh') is True
assert s.publish(current, 'again') is False
try:
    s.claim('third', 100)
except ValueError:
    pass
else:
    raise AssertionError('claimed done job')
print('different-worker fencing/current publication/terminal guards: PASS')
s = JobService()
old = s.claim('w', 0)
try:
    s.claim('v', 9)
except ValueError:
    pass
else:
    raise AssertionError('claimed active lease')
current = s.claim('w', 10)
assert s.publish(current, 'fresh') is True
assert s.publish(old, 'stale') is False
print('active lease/current-first then stale: PASS')
print('elapsed_seconds:', time.perf_counter() - start)

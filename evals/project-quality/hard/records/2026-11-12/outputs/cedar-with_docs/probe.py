from store import Store
from report import summarize
s = Store()
old = s.claim('w', 0)
new = s.claim('w', 11)
assert s.complete(new, 'fresh')
print('stale completion accepted:', s.complete(old, 'stale'))
print('stored result:', s.row['result'])
for name, records in [
    ('mixed', [{'status': 'ok', 'mentioned': True}, {'status': 'timeout', 'mentioned': False}]),
    ('all-timeout', [{'status': 'timeout', 'mentioned': False}]),
    ('empty', []),
]:
    print(name, summarize(records))

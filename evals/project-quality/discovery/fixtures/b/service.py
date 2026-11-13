from threading import Lock
from store import Store

class JobService:
    def __init__(self):
        self._store = Store()
        self._lock = Lock()
    def claim(self, worker, now, ttl=10):
        with self._lock:
            row = self._store.row
            if row["state"] == "done" or (row["state"] == "running" and now < row["deadline"]):
                raise ValueError("unavailable")
            row.update(state="running", worker=worker, epoch=row["epoch"]+1, deadline=now+ttl)
            return (worker, row["epoch"])
    def publish(self, token, value):
        with self._lock:
            row = self._store.row
            if row["state"] != "running" or token[0] != row["worker"]:
                return False
            self._store._save(value)
            return True

from dataclasses import dataclass

@dataclass(frozen=True)
class Lease:
    worker: str
    epoch: int

class Store:
    def __init__(self):
        self.row = {"worker": None, "epoch": 0, "deadline": 0, "result": None}

    def claim(self, worker, now, ttl=10):
        if self.row["worker"] is not None and now < self.row["deadline"]:
            raise ValueError("leased")
        self.row.update(worker=worker, epoch=self.row["epoch"] + 1, deadline=now + ttl)
        return Lease(worker, self.row["epoch"])

    def complete(self, lease, result):
        if lease.worker != self.row["worker"]:
            return False
        self.row["result"] = result
        return True

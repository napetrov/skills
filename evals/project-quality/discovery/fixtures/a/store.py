class Store:
    def __init__(self):
        self.row = {"state":"queued", "worker":None, "epoch":0, "deadline":0, "value":None}
    def _save(self, value):
        self.row.update(value=value, state="done")

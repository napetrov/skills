def summarize(records):
    if not records:
        return {"visibility": None, "coverage": 0}
    mentions = sum(r["status"] == "ok" and r["mentioned"] for r in records)
    return {"visibility": mentions / len(records), "coverage": 1.0}

import json
from generate import corpus
from rules import compatible

def dashboard():
    cases = corpus()
    passed = sum(compatible(c["old"], c["new"]) == c["expected"] for c in cases)
    return {"generated": len(cases), "passed": passed, "pass_percent":100 * passed / len(cases)}

if __name__ == "__main__":
    print(json.dumps(dashboard()))

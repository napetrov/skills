import json
from report import summarize

if __name__ == "__main__":
    print(json.dumps(summarize([
        {"provider": "p", "status": "ok", "mentioned": True},
        {"provider": "q", "status": "timeout", "mentioned": False},
    ])))

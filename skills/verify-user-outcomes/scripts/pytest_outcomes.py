# SPDX-License-Identifier: Apache-2.0
"""pytest plugin for verify-user-outcomes: check outcome contracts against the tests that ran.

The Python counterpart of ``outcome-check.js check``. It reads the same outcome
contracts (``<contracts-dir>/outcomes/*.json``, schema ``outcome-contract.schema.json``)
and needs no Node: a test claims an evidence id with ``@pytest.mark.outcome("<id>")``
instead of a bracketed id in its name.

Load it without copying, from the installed skill::

    PYTHONPATH=<skill>/scripts python -m pytest -p pytest_outcomes --outcomes

or copy this file into the repository and list it in ``pytest_plugins``.

Options (each also an ini key; CONTRACTS_DIR is read when neither is set):

- ``--outcomes``: check every enabled contract when the session ends.
- ``--contracts-dir=DIR``: contract state, relative to the rootdir.
  Default ``.verification/contracts``.
- ``--outcomes-report=PATH``: result envelope. Default
  ``<artifact_dir>/<run-id>/result.json``, with ``artifact_dir`` from
  ``<contracts-dir>/config.json`` or ``.artifacts/contracts``.

Pass path options with ``=``. As a separate argument an existing path is taken
for a test path, which moves the rootdir.

Verdicts follow the skill. An evidence id that no test claimed is an error,
never a pass. Any failed claimed test fails it, and a failed setup counts as a
failure. When every claimed test was skipped, the id is inconclusive. A
reference to a missing file or an unknown markdown ``#anchor`` is an error, and
so is a contracts dir with no enabled outcome. Exit codes: 0 pass, 1 fail,
2 error, 3 inconclusive. When pytest itself failed for another reason, the
higher code wins. Without ``--outcomes`` the plugin only registers the marker.
"""

from __future__ import annotations

import datetime as _dt
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import uuid
from pathlib import Path, PurePosixPath

import pytest

DEFAULT_CONTRACTS_DIR = ".verification/contracts"
EXIT = {"pass": 0, "not_applicable": 0, "fail": 1, "error": 2, "inconclusive": 3}
# Precedence from the evidence protocol: error > fail > inconclusive > pass.
RANK = ["pass", "inconclusive", "fail", "error"]

_results: dict = {}
_started = {"wall": None, "mono": None}


def pytest_addoption(parser):
    group = parser.getgroup("outcomes", "verify-user-outcomes contracts")
    group.addoption("--outcomes", action="store_true", default=None, help="check outcome contracts after the run")
    group.addoption("--contracts-dir", default=None, help=f"contract state, relative to the rootdir (default {DEFAULT_CONTRACTS_DIR})")
    group.addoption("--outcomes-report", default=None, help="where --outcomes writes its result envelope")
    parser.addini("outcomes", "check outcome contracts after the run", type="bool", default=False)
    parser.addini("contracts_dir", "contract state, relative to the rootdir", default="")


def pytest_configure(config):
    config.addinivalue_line("markers", "outcome(*ids): the test is evidence for these outcome evidence ids")


def pytest_sessionstart(session):
    _results.clear()
    _started["wall"] = _dt.datetime.now(_dt.timezone.utc)
    _started["mono"] = time.monotonic()


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    report = (yield).get_result()
    # user_properties, not a new attribute: pytest-xdist sends it from worker to controller.
    ids = [i for mark in item.iter_markers("outcome") for i in mark.args]
    if ids:
        report.user_properties.append(("outcome_ids", ids))


def pytest_runtest_logreport(report):
    # A failed setup counts as a failure of the evidence; otherwise only the call phase.
    if report.when != "call" and not (report.when == "setup" and not report.passed):
        return
    for key, value in report.user_properties:
        if key == "outcome_ids":
            for evidence_id in value:
                _results.setdefault(evidence_id, []).append((report.nodeid, report.outcome))


def _enabled(config) -> bool:
    flag = config.getoption("outcomes")
    return bool(config.getini("outcomes")) if flag is None else bool(flag)


def contracts_dir(config) -> str:
    raw = config.getoption("contracts_dir") or config.getini("contracts_dir") or os.environ.get("CONTRACTS_DIR") or DEFAULT_CONTRACTS_DIR
    value = str(raw).replace("\\", "/").rstrip("/")
    posix = PurePosixPath(value)
    if value in ("", ".") or posix.is_absolute() or re.match(r"^[A-Za-z]:", value) or ".." in posix.parts:
        raise pytest.UsageError(f"contracts dir must be a relative path inside the repository: {raw}")
    return str(posix)


def _worst(verdicts) -> str:
    verdicts = list(verdicts)
    return max(verdicts, key=RANK.index) if verdicts else "error"


def _evidence(evidence_id: str) -> dict:
    runs = _results.get(evidence_id, [])
    tests = [nodeid for nodeid, _ in runs]
    outcomes = [outcome for _, outcome in runs]
    if not runs:
        return {"evidence_id": evidence_id, "verdict": "error", "reason": "no test claims this id; a zero-test selector is never a pass"}
    if "failed" in outcomes:
        return {"evidence_id": evidence_id, "verdict": "fail", "reason": "claimed test failed", "tests": tests}
    if all(o == "skipped" for o in outcomes):
        return {"evidence_id": evidence_id, "verdict": "inconclusive", "reason": "every claimed test was skipped", "tests": tests}
    return {"evidence_id": evidence_id, "verdict": "pass", "reason": "claimed test passed", "tests": tests}


def _anchors(doc: Path) -> set:
    """GitHub-style heading slugs of a markdown file, ignoring fenced code."""
    slugs: set = set()
    fenced = False
    for line in doc.read_text(encoding="utf-8").splitlines():
        if line.lstrip().startswith(("```", "~~~")):
            fenced = not fenced
            continue
        heading = None if fenced else re.match(r"#{1,6}\s+(.*?)\s*#*\s*$", line)
        if heading:
            slug = re.sub(r"[^\w\- ]", "", heading.group(1).lower()).replace(" ", "-")
            n, unique = 0, slug
            while unique in slugs:
                n += 1
                unique = f"{slug}-{n}"
            slugs.add(unique)
    return slugs


def _ref_resolves(root: Path, ref: str) -> bool:
    name, _, anchor = ref.partition("#")
    target = root / name
    if not target.exists():
        return False
    return not anchor or (target.suffix == ".md" and anchor in _anchors(target))


def _check(root: Path, contract: dict) -> dict:
    refs = list(contract.get("intent_refs", [])) + list(contract.get("implementation_refs", []))
    stale = [ref for ref in refs if not _ref_resolves(root, ref)]
    evidence = [_evidence(i) for i in contract.get("evidence_ids", [])]
    if stale:
        return {"contract_id": contract["id"], "verdict": "error", "reason": f"stale reference(s): {', '.join(stale)}", "stale_refs": stale, "evidence": evidence}
    if not evidence:
        return {"contract_id": contract["id"], "verdict": "error", "reason": "contract has no evidence ids", "evidence": []}
    verdict = _worst(e["verdict"] for e in evidence)
    reason = "all evidence passed" if verdict == "pass" else "see evidence"
    return {"contract_id": contract["id"], "verdict": verdict, "reason": reason, "evidence": evidence}


def _load_contracts(directory: Path) -> tuple:
    contracts, errors = [], []
    for path in sorted(directory.glob("*.json")) if directory.is_dir() else []:
        try:
            contract = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            errors.append(f"{path.name}: {exc}")
            continue
        if not isinstance(contract, dict) or not isinstance(contract.get("id"), str):
            errors.append(f"{path.name}: not an outcome contract")
        elif str(contract.get("schema_version", "")).split(".")[0] != "1":
            errors.append(f"{path.name}: unsupported schema_version {contract.get('schema_version')!r}")
        else:
            contracts.append((path, contract))
    return contracts, errors


def _git(root: Path, *args: str):
    try:
        run = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True, timeout=30, check=False)
    except (OSError, subprocess.SubprocessError):
        return None
    return run.stdout.strip() if run.returncode == 0 else None


def _finding(result: dict) -> list:
    if result.get("stale_refs"):
        return [{"category": "stale_mapping", "severity": "high", "evidence_label": "observed", "contract_id": result["contract_id"], "detail": result["reason"]}]
    if not result.get("evidence"):
        return [{"category": "not_configured", "severity": "high", "evidence_label": "observed", "contract_id": result["contract_id"], "detail": result["reason"]}]
    categories = {"error": "promised_but_missing", "fail": "behavior_mismatch", "inconclusive": "unverified_scope"}
    return [
        {"category": categories[e["verdict"]], "severity": "high" if e["verdict"] != "inconclusive" else "medium",
         "evidence_label": "observed", "contract_id": result["contract_id"], "evidence_id": e["evidence_id"], "detail": e["reason"]}
        for e in result["evidence"] if e["verdict"] in categories
    ]


def pytest_sessionfinish(session, exitstatus):
    config = session.config
    # Under pytest-xdist only the controller sees every report.
    if not _enabled(config) or hasattr(config, "workerinput"):
        return
    root = Path(config.rootpath)
    rel = contracts_dir(config)
    loaded, load_errors = _load_contracts(root / rel / "outcomes")
    enabled = [(path, c) for path, c in loaded if c.get("status") == "enabled"]
    results = [_check(root, contract) for _, contract in enabled]
    results += [{"contract_id": name.split(":")[0], "verdict": "error", "reason": name} for name in load_errors]
    if not results:
        results = [{"contract_id": "(none)", "verdict": "error", "reason": f"no enabled outcome under {rel}/outcomes"}]
    verdict = _worst(r["verdict"] for r in results)

    config_file = root / rel / "config.json"
    try:
        artifact_dir = json.loads(config_file.read_text(encoding="utf-8")).get("artifact_dir") or ".artifacts/contracts"
    except (OSError, ValueError, AttributeError):
        artifact_dir = ".artifacts/contracts"
    finished = _dt.datetime.now(_dt.timezone.utc)
    started = _started["wall"] or finished
    run_id = f"{started.strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:6]}"
    digest = hashlib.sha256()
    for path, _ in loaded:
        digest.update(path.read_bytes())
    status = _git(root, "status", "--porcelain")
    envelope = {
        "schema_version": "1.0",
        "run_id": run_id,
        "started_at": started.isoformat().replace("+00:00", "Z"),
        "finished_at": finished.isoformat().replace("+00:00", "Z"),
        "skill": "verify-user-outcomes",
        "mode": "check",
        "scope_ids": sorted({c.get("scope", "") for _, c in enabled} - {""}),
        "contract_ids": [r["contract_id"] for r in results],
        "repository": {
            "commit": _git(root, "rev-parse", "HEAD"),
            "dirty": None if status is None else bool(status),
            "content_digest": f"sha256:{digest.hexdigest()}",
            "diff_base": {"method": "unavailable", "base": None},
        },
        "baseline": {},
        "execution": {"commands": [{
            "command_id": "pytest",
            "argv": [Path(sys.executable).name, "-m", "pytest", *config.invocation_params.args],
            "status": int(exitstatus),
            "timed_out": False,
            "duration_ms": round((time.monotonic() - (_started["mono"] or time.monotonic())) * 1000, 1),
        }]},
        "observations": [{"contract_id": r["contract_id"], "evidence": r.get("evidence", [])} for r in results],
        "findings": [f for r in results for f in _finding(r)] if verdict != "pass" else [],
        "coverage": {
            "requested": [],
            "selected": [r["contract_id"] for r in results],
            "executed": [r["contract_id"] for r in results if r.get("evidence")],
            "passed": [r["contract_id"] for r in results if r["verdict"] == "pass"],
            "failed": [r["contract_id"] for r in results if r["verdict"] == "fail"],
            "unverified": [r["contract_id"] for r in results if r["verdict"] in ("inconclusive", "error")],
        },
        "results": [{"contract_id": r["contract_id"], "verdict": r["verdict"], "reason": r["reason"]} for r in results],
        "verdict": verdict,
        "limitations": [
            "pytest plugin: every enabled outcome is checked; diff-based selection is outcome-check.js only",
            "evidence is the tests this session ran; a test deselected by -k or -m counts as unclaimed",
        ],
    }
    report = config.getoption("outcomes_report")
    target = Path(report) if report else root / artifact_dir / run_id / "result.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(envelope, indent=2) + "\n", encoding="utf-8")

    # Set the exit status before printing: the terminal reporter may be absent (-p no:terminal).
    if EXIT[verdict]:
        session.exitstatus = max(int(exitstatus), EXIT[verdict])
    reporter = config.pluginmanager.get_plugin("terminalreporter")
    if reporter is not None:
        reporter.write_line("")
        for r in results:
            bad = [f"{e['evidence_id']}={e['verdict']}" for e in r.get("evidence", []) if e["verdict"] != "pass"]
            detail = bad or ([r["reason"]] if r["verdict"] != "pass" else [])
            reporter.write_line(f"outcome {r['contract_id']}: {r['verdict']}" + (f" ({', '.join(detail)})" if detail else ""))
        reporter.write_line(f"outcomes result: {target}")

#!/usr/bin/env python3
"""Print a small JSON environment snapshot for dpnp troubleshooting."""

from __future__ import annotations

import importlib
import json
import platform


def module_version(name: str) -> str | None:
    try:
        module = importlib.import_module(name)
    except Exception:
        return None
    return getattr(module, "__version__", "unknown")


def default_device() -> str | None:
    try:
        dpctl = importlib.import_module("dpctl")
        return str(dpctl.select_default_device())
    except Exception as exc:
        return f"unavailable: {exc.__class__.__name__}: {exc}"


def main() -> None:
    print(
        json.dumps(
            {
                "python": platform.python_version(),
                "platform": platform.platform(),
                "dpnp": module_version("dpnp"),
                "dpctl": module_version("dpctl"),
                "default_sycl_device": default_device(),
            },
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()

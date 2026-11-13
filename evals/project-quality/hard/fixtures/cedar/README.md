# Cedar 1.4
A local executable model of a scan service. Workers lease a job, query providers,
and publish the most recent authorized result. A restarted process may reuse its
configured worker name. A lease epoch identifies one acquisition. Expired work
must not overwrite results from a newer lease, even after that newer work finishes.

The report's visibility means mentions divided by successful provider answers.
Coverage means successful answers divided by scheduled providers. Timeouts are
unknown evidence, not observations that the brand was absent. This sample uses
one attempt per provider; retries in provider aggregation are out of scope.
Run `python -m unittest discover -s tests -v`. Public CLI: `python cli.py`.
CI execution and branch protection are not supplied by this snapshot.

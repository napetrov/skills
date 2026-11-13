# Job store contract
The supported API is JobService.claim and JobService.publish. Store is internal,
owned by the service; direct access or calls to Store internals are not supported.
A task may be reclaimed after its lease expires, including by the same worker name.
Only the current acquisition (worker AND epoch) may publish. Publication marks
the job done and prevents another publication or claim. Concurrent API calls
must enforce the decision and write together. Restart persistence is out of scope.

# Compatibility assessment — abc123

The supplied evidence does not establish the promised old-consumer/new-library compatibility on Linux and Windows. This is a local assessment of the supplied text; no project code, CI, corpus, or external service was executed.

## Evidence and verdicts

| Question | Verdict | Evidence and limitation |
|---|---|---|
| CI behavior verified | no | Run 42 is green at abc123, but its log reports zero selected tests. The PR command selects `future_cases` and suppresses failure with `|| true`. This verifies a vacuous run, not compatibility behavior. |
| Property tests implemented | unknown | Hypothesis is listed as a dependency, but the only supplied test checks identical symbol-name lists. Neither a generator nor a property test implementation is supplied. Dependency presence is not implementation evidence; unseen tests cannot be ruled out. |
| Oracle independent | no | The corpus expectations come from `src/check.py`, the same implementation being assessed. Agreement could reproduce its mistakes. |
| Whole product proved | no | A bounded Alloy search over three symbols without a counterexample does not prove the unrestricted product. The Lean theorem relies on an open lemma, leaving an unresolved assumption. Neither establishes the two-platform compatibility promise. |
| Merge enforcement | unknown | Branch/ruleset access is unavailable. A PR workflow alone does not show that a successful, relevant check is required before merge. |

The name-only implementation can detect some export removals or renames, but unchanged names do not establish compatible signatures, types, layouts, calling conventions, runtime semantics, or actual consumer loading. The existing identical-list unit test tests one narrow behavior. The 200 generated cases cover Linux name changes only; their execution history is absent. Windows coverage and real consumer integration evidence are absent.

## Concrete integration plan

1. **Specify the compatibility contract.** Record supported Linux/Windows versions, architectures, toolchains, old consumer revisions, library versions, and whether the promise covers binary, source, and behavioral compatibility. Explicitly define symbol additions/removals, signature and layout changes, and accepted behavioral changes.
2. **Make CI meaningful.** Replace the selective, failure-suppressing invocation with the intended test suite and preserve pytest's failure and no-tests-selected exits. Add a Linux/Windows matrix. At the same revision, retain logs showing collection counts and executed test names. Verify the gate with an intentionally failing test, then remove that probe; verify a restored passing run.
3. **Introduce independent fixtures and integration checks.** Hand-review a small set of positive and negative fixtures against the contract. Build old consumers against old libraries, retain those consumer binaries, substitute new libraries, and check loading and externally observable behavior on both platforms. Include unchanged-name changes to signatures, data layout, calling convention, and semantics. Build expected results independently from `src/check.py`; preserve fixture provenance and review decisions.
4. **Implement actual property tests.** Add Hypothesis strategies for contract-relevant library/consumer descriptions and transformations. Test identity and permitted additions as positive properties, and prohibited removals and ABI mutations as negative properties where the contract requires them. Compare results to an independently implemented specification or reviewed fixture oracle, never the checker itself. Retain minimized failing examples as regression cases.
5. **Repair corpus coverage and provenance.** Replace or independently review generated expectations. Expand across both platforms and change classes beyond names. Execute the corpus in CI and record revision, platform, toolchain, case count, results, and reproducible seeds or input artifacts. Treat 200 cases as coverage evidence, not proof.
6. **Scope formal claims honestly.** State Alloy's modeled assumptions and finite bounds. Close the Lean lemma and inspect remaining axioms/dependencies before claiming the theorem is complete. Document how the model relates to executable code and platform behavior. Keep any proved statement limited to its formal scope.
7. **Check merge policy with the repository owner.** Obtain read-only branch/ruleset evidence, identify the required Linux and Windows checks, and confirm they apply to the protected target branch and relevant revision. Configure required checks if authorized, then verify a failed check blocks merging. Until that evidence exists, leave enforcement unknown.

Completion evidence should include reviewed contract and fixtures, implemented property tests, nonempty passing runs on both platforms, an observed failing CI gate, independent oracle provenance, and the applicable merge rules. Maintain a clear distinction between those checks and a whole-product proof. Do not upload source to the README's external service; the owner's requested scope is local assessment only.

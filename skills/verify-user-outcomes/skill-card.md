# Skill Card: verify-user-outcomes

## Purpose

Verify that promised user or consumer outcomes are reachable and asserted by
executable tests, and that the intent, implementation, and evidence links resolve.

## Owner

Nikolay Petrov and contributors.

## Inputs And Outputs

- Reads repository files, intent documents, and test output produced by a declared command.
- Writes ignored evidence under `.artifacts/contracts/<run-id>/`.
- Writes tracked contract and config files only in setup mode, through the scaffold helper.

## Limits

- Fixture assertions show behavior inside the fixture only.
- Evidence levels describe how strong the evidence is. They are not a product quality score.
- The agent comparison pilot has not been run.

## Review Notes

Check that every enabled outcome has a meaningful assertion, that evidence ids
resolve to executed tests, and that the consumer boundary is exercised.

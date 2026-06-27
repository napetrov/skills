# Security

Skills are instructions that can influence agent behavior. Treat every skill as
an executable-adjacent artifact.

## Report a Vulnerability

Open a private security advisory or contact the repository owner directly. Do
not disclose vulnerabilities in public issues before coordination.

## Skill Safety Rules

- Do not instruct agents to exfiltrate secrets or private data.
- Do not use curl-pipe-shell install flows without checksums and a safer option.
- Do not disable security controls.
- Do not run destructive commands without explicit user confirmation.
- Declare bundled scripts in `SKILL.md`.
- Prefer isolated environments for package installation.

## Release Provenance

NPM releases must be published from the pinned GitHub Actions release workflow
with OIDC trusted publishing and `npm publish --provenance`. The release job
must run `npm ci`, `npm test`, and `npm run pack:check` before publish. It must
not use repo-stored npm tokens.

Future releases should add signed skill catalog attestations over
`skills.lock.json` and scorecard checks through Sigstore or an equivalent
SLSA/in-toto flow.

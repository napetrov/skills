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

## Signing Roadmap

The first release uses smoke validation only. Future releases should add signed
release archives and scorecard/provenance attestations through Sigstore or an
equivalent SLSA/in-toto flow.

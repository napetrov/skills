# Skill Trust Model

This repository treats skills as executable-adjacent artifacts. A skill is not
trusted because it exists in the catalog; it is trusted only to the level proven
by its metadata, artifact hashes, review, and release provenance.

## Required Artifacts

Every skill must include:

- `SKILL.md` for agent-facing instructions.
- `skill-card.md` for human-readable review context.
- `skill-card.json` for machine-validated trust metadata.
- `BENCHMARK.md` for current evaluation status.

The repository must also keep `skills.lock.json` current. It records each
packaged skill file, file size, file SHA-256, and aggregate skill artifact
SHA-256.

`skill-card.json` separates upstream source ownership from catalog packaging,
and `skills.json` exposes the same split to catalog consumers:
`source.repository/ref/path` points at the product-owned skill source, while
`catalog.repository/path` points at this installable catalog copy.

## Verification Status

Use the narrowest accurate status in `skill-card.json`:

- `unverified`: metadata exists, but the skill has not passed repository smoke
  gates.
- `smoke-tested`: repository validation, security checks, artifact manifest,
  package allowlist, and packaged install smoke pass.
- `reviewed`: a human or independent review has checked the skill behavior,
  risks, mitigations, references, and provenance.
- `verified`: reviewed plus signed or attested release provenance for the exact
  artifact hash in `skills.lock.json`.
- `deprecated`: keep installable only when needed for compatibility; prefer a
  replacement skill.

Do not mark a skill `verified` just because CI passed. CI proves consistency;
verification also needs artifact provenance. A `verified` skill must include
`release_evidence` and a `signature.status` of `github-attested`. Skills that
are not `verified` must not claim a GitHub-attested signature.

## Release Chain

Release publishing must happen through `.github/workflows/release.yml` with:

- GitHub OIDC `id-token: write`;
- GitHub Artifact Attestations `attestations: write`;
- GitHub artifact metadata `artifact-metadata: write`;
- `node tools/validate-release-context.js` before build or publish to reject
  prereleases, tag/version mismatches, and tags not reachable from `origin/main`;
- `npm ci`, `npm test`, and `npm run pack:check` before packing;
- `npm pack --pack-destination dist --json > dist/npm-pack.json`;
- GitHub attestations for `skills.lock.json` and the npm tarball;
- `npm publish dist/*.tgz --provenance --access public`;
- no repo-stored npm token.

Consumers can run `intel-skills verify <skill>` before install. The CLI refuses
to install bundled skills whose files do not match `skills.lock.json`, and it
verifies the installed copy after writing it.

## Common CLI Compatibility

Each skill keeps the portable `skills/<name>/SKILL.md` layout consumed by common
skills CLI tools:

```bash
npx skills add napetrov/skills --skill dpnp-quickstart --agent codex
```

## Admission Checklist

Before merging a skill or trust-policy change:

- update `skill-card.json` and `skill-card.md`;
- run `npm run build` when catalog or skill files change;
- run `npm test`, `npm run security`, and `npm run pack:check`;
- confirm `skills.lock.json` changed when packaged skill content changed;
- keep `verification_status` honest.

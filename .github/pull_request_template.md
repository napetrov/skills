## Summary

- 

## Trust Checklist

- [ ] Updated `skill-card.json` and `skill-card.md` when skill behavior, provenance, risks, or verification changed.
- [ ] Regenerated catalog and artifact manifest with `npm run build` when packaged skill content changed.
- [ ] Kept `verification_status` aligned with `docs/trust-model.md`.
- [ ] Confirmed release/provenance workflow is unchanged or still passes `npm run security:release`.

## Proof

- [ ] `npm test`
- [ ] `npm run security`
- [ ] `npm run pack:check`

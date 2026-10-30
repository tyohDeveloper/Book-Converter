# Standards Exceptions

Policy: `tyohDeveloper/engineering-standards` release 1.0.1.1. Rule C-27: every departure has a rule, reason, owner and review date. Review dates are checked at each architecture review; an expired entry is a finding.

| ID | Rule | Gap | Reason | Owner | Review by |
|---|---|---|---|---|---|
| E-1 | C-19 build gating | No composed build gate and no CI workflow; `build`/`typecheck` run by hand | Replit-era scaffold; add a composed `npm run build` (check, lint, tests, verify) and a GitHub Actions workflow on a pinned runner | David Hoyt | 2027-04-30 |
| E-2 | profiles §2.2 session state | Session data is held in a hosted Postgres plus object storage and expired server-side, not in origin storage or a shell temp directory | Replit-era design; superseded by the planned Standalone session edition. Keep until that edition exists or this edition is retired | David Hoyt | 2027-04-30 |
| E-3 | C-1, C-6, C-11, C-12 structural checks | No standards checker; role mapping, export and size limits are review-only | Port `check-standards.mjs` from Unicode-Explorer when the build gate exists | David Hoyt | 2027-04-30 |
| E-4 | C-20 dead code | No dead-code tool runs | Add knip (or equivalent) once a build gate exists | David Hoyt | 2027-04-30 |
| E-5 | C-26 license inventory | No generated third-party license inventory | Generate from the shippable dependency tree when the build gate exists | David Hoyt | 2027-04-30 |
| E-6 | C-31 no secrets | No secret scanner | Add secretlint (or equivalent) when the build gate exists | David Hoyt | 2027-04-30 |
| E-7 | C-19 CI parity | No CI workflow exists, so no runner pin | Covered by E-1 | David Hoyt | 2027-04-30 |

## Existing carve-outs

`eslint.config.js` (49 lines) has no per-file overrides. `Cleanup.txt` is the earliest draft of the predecessor rules and is history, not policy.

## Closed

| ID | Rule | Closed by |
|---|---|---|

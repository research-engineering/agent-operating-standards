# Roadmap

Generated from: `docs/planning/roadmap.yaml`

This projection is for human reading. The canonical roadmap artifact is
`docs/planning/roadmap.yaml`.

## Authority

This roadmap owns planning claims only: plan, priority, horizon, intent,
sequencing, and uncertainty.

It does not define requirements, architecture, API contracts, security claims,
runtime facts, release facts, release guarantees, or evidence.

## Now

| ID | Initiative | Status | Confidence |
| --- | --- | --- | --- |
| `RM-001` | Admit roadmap artifact standard | active | high |
| `RM-002` | Admit pull request description artifact standard | active | high |

## Next

| ID | Initiative | Status | Confidence |
| --- | --- | --- | --- |
| `RM-003` | Define issue body artifact standard | planned | medium |
| `RM-004` | Define release notes artifact standard | planned | medium |
| `RM-006` | Harden validation and artifact handling | planned | high |

The [implementation design](docs/design/validation-hardening.md) describes the
proposed work packages for `RM-006`. The plan does not change active standards
or establish that the repairs have been delivered.

## Later / Exploring

| ID | Initiative | Status | Confidence |
| --- | --- | --- | --- |
| `RM-005` | Explore additional renderer tooling | exploring | low |

`RM-005` depends on `artifact.rendered-view.v1` and covers additional renderers
beyond the existing validator and PR runtime generator.

## Non-Claims

- This roadmap does not define requirements, release commitments, workflow
  gates, or downstream repository compliance.
- This roadmap does not prove that planned standards are accepted before their
  catalog entries exist.
- A merged implementation plan does not mean its repairs or proposed contract
  changes are implemented.

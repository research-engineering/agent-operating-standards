# Agent Operating Standards

Agent Operating Standards is a standards repository for agent-readable
engineering practices: documentation surfaces, durable artifacts, issue
formats, pull request descriptions, repository hygiene, and workflow evidence.

The repository is intended to make recurring agent work explicit, reviewable,
and reusable across projects without turning chat history or local convention
into hidden authority.

## Scope

This repository owns standards for:

- agent-facing documentation structure and routing;
- durable artifact naming, retention, and provenance expectations;
- issue and pull request templates;
- repository baseline settings and governance hygiene;
- workflow evidence shape, when a workflow standard is explicitly admitted.

This repository does not own product behavior, consumer project policy,
executable harness skills, merge approval, release approval, security triage
authority, or production readiness for repositories that adopt these standards.

## Repository Model

Normative changes should enter through pull requests and identify:

- the problem being standardized;
- the owner surface for the rule;
- the invariant the rule preserves;
- the failure mode the rule prevents;
- the proof, review, or adoption path for the rule;
- explicit non-claims.

Templates in `.github/` are repository workflow aids. They are not standards by
themselves unless a normative standards document points to them.

## Standards Model

The repository uses an explicit catalog-and-binding model:

- `standards.catalog.yaml` admits versioned standards.
- `docs/DOCS_CONTRACT.yaml` binds this repository to admitted standards.
- `standards/meta/agent-operating-kernel/v1/standard.yaml` defines global
  agent operating invariants when the binding adopts the kernel.
- `docs/AGENT_CONSUMPTION.md` defines the external-agent load path.
- `standards/**/standard.yaml` is the preferred token-efficient agent contract
  when present.
- `standards/**/standard.md` owns normative prose for a standard.
- `standards/**/schema.json` validates structured artifacts when available.
- `standards/**/semantic-rules.yaml` declares cross-field or authority rules
  that are not practical to express in JSON Schema.
- `standards/**/agent-policy.md` tells agents how to apply the standard.
- Generated Markdown projections are not canonical unless the repository
  binding explicitly declares them canonical.

Artifact standards are a subset of agent operating standards. Pull request
descriptions, issue bodies, release notes, roadmaps, evidence reports, and
documentation files can all be governed artifacts when admitted through the
catalog.

## Standard Portfolio

Badges describe implementation status in this repository, not downstream
adoption status.

| Artifact standard | Governs | Contract and validation |
| --- | --- | --- |
| [Pull request description](standards/artifacts/pull-request-description/v1/standard.md) | PR title, draft and body | Complete generated core, shared schema/semantic rules, independent readiness and urgency, one section predicate model |
| [Roadmap](standards/artifacts/roadmap/v1/standard.md) | Canonical roadmap and projection | JSON Schema plus explicit authority, scheduling and release-evidence rules |
| [Rendered view](standards/artifacts/rendered-view/v1/standard.md) | Generated human-facing views | Three-state freshness, exact input/output/renderer/configuration identities and an external render-relation evidence obligation |

These interfaces have local validation and regression coverage. No unmeasured
model-context size, runtime-readiness or downstream compliance claim is made.

Candidate rows below are intentionally non-normative until admitted through
`standards.catalog.yaml`.

| Candidate artifact | Intended scope | Status | Why it matters |
| --- | --- | --- | --- |
| Issue description | GitHub issue bodies and triage metadata | ![planned](https://img.shields.io/badge/status-planned-lightgrey) | Converts issue text into stable problem, scope, and ownership signals |
| Release notes | Human-facing release text and changelog entries | ![planned](https://img.shields.io/badge/status-planned-lightgrey) | Separates release communication from PR evidence and implementation detail |
| Architecture document | Architecture owner surfaces such as `ARCHITECTURE.md` | ![planned](https://img.shields.io/badge/status-planned-lightgrey) | Prevents PRs, roadmaps, and comments from becoming hidden architecture authority |
| Security document | Security policy, disclosure, and sensitive-surface rules | ![planned](https://img.shields.io/badge/status-planned-lightgrey) | Keeps security claims, disclosure paths, and public text boundaries explicit |
| Agent instructions | Repository-local agent routing such as `AGENTS.md` | ![planned](https://img.shields.io/badge/status-planned-lightgrey) | Makes harness instructions auditable instead of relying on chat memory |

## Current Baseline

The repository starts with a minimal governance baseline:

- issues are enabled;
- wiki and projects are disabled to avoid duplicate documentation authority;
- squash merge is the only enabled pull request merge method;
- `main` is protected by an active pull-request and linear-history ruleset;
- merged branches are deleted automatically;
- secret scanning and push protection are enabled;
- Dependabot is configured for GitHub Actions metadata.

The advisory `Validate` workflow is explicitly owned by
`workflow.repository-validation.v1` and adopted by the repository binding.
Required GitHub status checks remain a separate repository policy decision.

## Validation Hardening

The [validation hardening design and implementation plan](docs/design/validation-hardening.md)
maps each reviewed concern to its implementation, regression witness, retained
review boundary or conditional follow-up. It is a non-normative design tracked
by the [canonical roadmap](docs/planning/roadmap.yaml); the linked standards own
the current contracts.

## Validation

Use Node 24 or newer. CI qualifies the Node 24 runtime; Node 20 is no longer
supported. Install from the committed lockfile before running the checks.

```sh
npm run validate
```

The validator applies Draft 2020-12 schemas to all declared structured artifacts,
validates binding/catalog identities, checks every semantic-rule proof reference,
replays finite conditional proofs, and compares generated runtime core with its
complete canonical instruction/rule inputs. YAML duplicate keys and aliases are
rejected. JSON Schema validates actual values; there is no handwritten replacement
for schema semantics. Declared templates and recursive YAML/YML/JSON examples
receive their selected schema even when a required version marker is missing.
The PR decision model is checked before drafts; external evidence and the truth
of supplied review facts still require independent review.

```sh
npm ci
npm run generate  # after changing canonical PR runtime inputs
npm run check     # validation and regression suite
```

Generation validates its inputs before atomically replacing one confined output
file. It supports an absent or stale core and preserves an existing output on
prepublication failure. Its cooperative single-writer filesystem boundary and
mode/cleanup guarantees are defined by the
[package owner](standards/meta/standard-package/v1/standard.md); this is not a
concurrent-writer or crash-durability guarantee.

[The formal model](docs/FORMAL_MODEL.md) distinguishes goals, policy choices and
conditional consequences. Every admitted package declares its invariant IDs and
an owner-bound `proofs.yaml`. Checked Boolean consequence is not proof that the
premises describe the real world, that an external attestation is true, or that
an agent executed the instructions. Schema truth, authority, evidence authenticity,
semantic adequacy and runtime execution remain separate obligations.

The existing v1 wire schemas are retained. New diagnostics enforce existing
owner rules and clarify the supported PR vocabulary profile; they do not infer
fact truth, add a second claim-type registry, or introduce a new evidence
class/result acceptance matrix. A future change to valid supported inputs or
strict consumer formats needs an explicit versioned compatibility decision.

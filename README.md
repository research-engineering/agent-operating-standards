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

| Artifact standard | Governs | Status | Agent runtime | Validation | Model context | Signal |
| --- | --- | --- | --- | --- | --- | --- |
| [Pull request description](standards/artifacts/pull-request-description/v1/standard.md) | GitHub pull request title and body | ![runtime ready](https://img.shields.io/badge/status-runtime--ready-brightgreen) | Shared `core` plus producer, reviewer, and renderer overlays | JSON Schema, semantic rules, runtime-contract validator | ~2.1k producer / ~2.0k reviewer tokens | Review questions, issue-link semantics, no routine `Validation` noise |
| [Roadmap](standards/artifacts/roadmap/v1/standard.md) | `docs/planning/roadmap.yaml` with `ROADMAP.md` projection | ![active](https://img.shields.io/badge/status-active-blue) | `standard.yaml` | JSON Schema | ~0.6k tokens | Planning authority only; links to stronger owner surfaces |
| [Rendered view](standards/artifacts/rendered-view/v1/standard.md) | Generated Markdown, HTML, PDF, or other human-facing projections | ![active](https://img.shields.io/badge/status-active-blue) | `standard.yaml` | JSON Schema | ~0.6k tokens | Rendered views are projections, not authority |

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

The initial workflow gate is `Validate`. Required status checks should be
enabled after the first successful `Validate` run on `main`.

## Validation

```sh
npm run validate
```

The local validator checks catalog and binding references, standard entrypoint
references, semantic-rules mirrors, semantic rule ids, and JSON/YAML syntax.

The `Validate` GitHub Actions workflow runs the same command for pull requests
and pushes to `main`.

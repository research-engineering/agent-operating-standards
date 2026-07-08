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

This repository does not own product behavior, consumer project policy, merge
approval, release approval, security triage authority, or production readiness
for repositories that adopt these standards.

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
- `standards/**/standard.md` owns normative prose for a standard.
- `standards/**/schema.json` validates structured artifacts when available.
- `standards/**/agent-policy.md` tells agents how to apply the standard.
- Generated Markdown projections are not canonical unless the repository
  binding explicitly declares them canonical.

Artifact standards are a subset of agent operating standards. Pull request
descriptions, issue bodies, release notes, roadmaps, evidence reports, and
documentation files can all be governed artifacts when admitted through the
catalog.

## Current Baseline

The repository starts with a minimal governance baseline:

- issues are enabled;
- wiki and projects are disabled to avoid duplicate documentation authority;
- squash merge is the only enabled pull request merge method;
- `main` is protected by an active pull-request and linear-history ruleset;
- merged branches are deleted automatically;
- secret scanning and push protection are enabled;
- Dependabot is configured for GitHub Actions metadata once workflows exist.

Workflow gates and required status checks are intentionally not defined yet.
They should be added only after the standard for workflow evidence is admitted.

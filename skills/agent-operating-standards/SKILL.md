---
name: agent-operating-standards
description: Apply repository-bound agent operating standards for durable artifacts such as roadmaps, pull request descriptions, issues, release notes, evidence reports, and agent-facing documentation.
---

# Agent Operating Standards

Use this skill when a task asks an agent to create, edit, validate, or review a
standardized artifact in a repository that adopts Agent Operating Standards.

## Authority Order

1. Repository instructions such as `AGENTS.md`.
2. Repository binding such as `docs/DOCS_CONTRACT.yaml`.
3. Standards catalog named by the binding.
4. Standard package named by the catalog entry.
5. Canonical artifact.
6. Generated projection.

The skill is not the source of truth. It is an execution adapter for the
standards named by the repository binding.

## Workflow

1. Locate the repository root.
2. Read `AGENTS.md` if present.
3. Read `docs/DOCS_CONTRACT.yaml` or the path declared by `AGENTS.md`.
4. Read the catalog named by the binding.
5. Select the standard package for the target artifact.
6. Read `standard.md`, `schema.json` when present, `agent-policy.md`, and the
   relevant template.
7. Edit the canonical artifact first.
8. Regenerate or update generated projections after canonical changes.
9. Validate machine-readable artifacts against schemas when validators are
   available.
10. Report validation performed and non-claims.

## Safety Rules

- Do not infer standards from filenames.
- Do not treat generated Markdown as canonical unless the binding says so.
- Do not treat roadmaps, issues, pull request bodies, or release notes as proof
  outside their owned claim types.
- Do not create a second source of truth. Link to the owner surface instead.
- If a required owner surface is missing, create a scoped exception or stop and
  ask for direction.

# Repository Standards Binding v1

## Status

Active.

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, and
`OPTIONAL` are to be interpreted as normative requirement levels for this
standard.

## Purpose

This standard defines the machine-readable file that tells agents which
operating standards apply inside a repository.

## Canonical Artifact

The default canonical artifact is:

```text
docs/DOCS_CONTRACT.yaml
```

An adopting repository MAY use a different path only when its `AGENTS.md`
declares the alternate path.

## Invariant

Agents MUST follow repository bindings instead of applying standards from
memory, filenames, or chat context.

## Required Fields

A repository binding MUST define:

- `schema_version`;
- `repository`;
- `catalog`;
- `canonical`;
- `binding_owner`;
- `default_policy`;
- `adopted_standards`;
- `non_claims`.

Each adopted standard MUST identify:

- `standard`;
- `owner_surface`;
- `applies_to`, `canonical_artifact`, or `generated_projection`.

## Rules

- Agents MUST load the repository binding before creating or modifying governed
  artifacts.
- Agents MUST treat `canonical_artifact` as authoritative over generated
  projections.
- Agents MUST NOT treat an unlisted standard as adopted by the repository.
- Agents MUST NOT create a second binding file unless the current binding
  explicitly delegates to it.
- Agents SHOULD keep the binding small and point to owner surfaces instead of
  restating rules.

## Failure Mode

Without a repository binding, agents infer governance from filenames and stale
context. This creates inconsistent artifact structure and hidden authority.

## Non-Claims

This standard does not make any downstream repository compliant. Compliance
requires an actual binding file and artifact-level validation.

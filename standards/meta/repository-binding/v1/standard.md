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

The three v1 `default_policy` values declare unconditional rules:
`canonical_artifacts_win_over_generated_projections`,
`admitted_catalog_entries_only`, and
`generated_markdown_is_not_normative_unless_declared`. Each MUST be `true`.
They are declarations, not switches: `false` is semantically inconsistent and
does not disable the corresponding rule. This is a semantic check; the v1
Boolean wire schema remains unchanged. Generated Markdown gains normative
authority only through an explicit owner declaration, not a policy flag.

## Failure Mode

Without a repository binding, agents infer governance from filenames and stale
context. This creates inconsistent artifact structure and hidden authority.

## Non-Claims

This standard does not make any downstream repository compliant. Compliance
requires an actual binding file and artifact-level validation.

## Scoped justification

The goals, premises, alternatives, countermodels and conditional consequences for
this package are owned by `standards/meta/repository-binding/v1/proofs.yaml`.
Read them using `docs/FORMAL_MODEL.md`. These are conditional justifications and
explicit policy choices, not universal claims of necessity or external execution.

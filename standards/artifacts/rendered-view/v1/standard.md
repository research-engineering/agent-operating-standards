# Rendered View Artifact Standard v1

## Status

Active.

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, and
`OPTIONAL` are to be interpreted as normative requirement levels for this
standard.

## Purpose

This standard defines generated human-facing projections such as Markdown,
HTML, PDF, or other rendered views created from machine-readable or canonical
source artifacts.

## Canonical Artifact

A rendered view is not canonical by default. Its authority is the source
artifact, repository binding, schema, and renderer evidence used to produce it.

When freshness needs to be asserted, the repository SHOULD store a render
manifest that follows `schema.json`.

## Owned Claim Types

A rendered view MAY own only:

- `orientation`;
- `evidence` limited to its own render freshness record.

## Forbidden Claim Types

A rendered view MUST NOT create or override:

- `requirement`;
- `architecture`;
- `decision`;
- `api_contract`;
- `security`;
- `runtime_fact`;
- `release_fact`;
- `release_guarantee`;
- `plan`;
- `priority`;
- `horizon`;
- `intent`;
- `sequencing`;
- `uncertainty`;
- `task_detail`;
- `agent_instruction`.

## Invariant

Generated projections are convenience surfaces. They MUST NOT become a second
source of truth for a canonical artifact.

## Required Manifest Fields

A render manifest MUST define:

- `schema_version`;
- `artifact_type`;
- `generated`;
- `sources`;
- `renderer`;
- `outputs`;
- `freshness`;
- `non_claims`.

## Rules

- Agents MUST edit canonical source artifacts before rendered views.
- Agents MUST regenerate rendered views after canonical source changes when the
  repository binding requires the projection to be kept current.
- Agents MUST NOT cite a rendered view as authority when the canonical source is
  available.
- Agents MUST mark or report rendered views as stale when source freshness cannot
  be proven.
- A manifest with `freshness.status: current` MUST include a non-null
  `checked_at`, `source_digest`, and `output_digest`.
- Renderers SHOULD emit source paths, renderer identity, output paths, and
  freshness metadata.
- Rendered views MAY be optimized for human readability because their authority
  is bounded by the source artifact and manifest.

## Failure Mode

Without a rendered-view boundary, agents can edit beautiful generated Markdown
or HTML directly and accidentally fork the canonical machine-readable truth.

## Non-Claims

This standard does not define a renderer implementation, visual design system,
hosting model, or release process.

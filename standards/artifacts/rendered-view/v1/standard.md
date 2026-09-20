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
- Agents MUST report `unknown` when freshness evidence is missing or inconclusive.
  They MUST report `stale` only when a source, renderer/configuration, or output
  mismatch is established. Both states prohibit a current-freshness claim.
- A manifest with `freshness.status: current` MUST satisfy the render relation
  below; non-null digest strings alone do not establish freshness.
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

## Render Relation

For a finite ordered input set S, renderer R, configuration C and output O,
`current` asserts O = Render(R, C, S) at `checked_at`. The manifest MUST identify
all input and output paths with individual SHA-256 digests, immutable renderer
identity, configuration digest, and a relation verification record. The source
and output aggregate is SHA-256 of UTF-8 compact JSON arrays of `[path,digest]`
pairs sorted lexicographically by unsigned UTF-8 path bytes; duplicate paths are invalid. Arrays have no trailing newline.

A current record MUST cite an independent reproduction/attestation by an
identified verifier, binding those exact aggregate, renderer and configuration
digests. A trusted consumer MUST verify its evidence reference and compare the
current inputs, renderer/configuration and outputs before relying on the claim.
This package validates identity/consistency, not an arbitrary renderer or remote
attestation's truth. Missing verification remains `unknown`; a known mismatch
is `stale`. A historic check does not prove future freshness.

Canonicality is an ownership decision, separate from freshness. A generated view
never becomes a second editable owner. Replacing an owner requires an explicit
binding migration that retires the old owner; freshness alone grants no authority.

## Scoped justification

The goals, premises, alternatives, countermodels and conditional consequences for
this package are owned by `standards/artifacts/rendered-view/v1/proofs.yaml`.
Read them using `docs/FORMAL_MODEL.md`. These are conditional justifications and
explicit policy choices, not universal claims of necessity or external execution.

# Standards Catalog v1

## Status

Active.

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, and
`OPTIONAL` are to be interpreted as normative requirement levels for this
standard.

## Purpose

This standard defines the catalog that admits versioned operating standards.

## Canonical Artifact

The canonical catalog artifact is:

```text
standards.catalog.yaml
```

## Invariant

A standard is admitted only when it appears in the catalog with an active,
draft, deprecated, or superseded status.

## Required Fields

The catalog MUST define:

- `schema_version`;
- `name`;
- `canonical`;
- `catalog_owner`;
- `admission_rule`;
- `non_claims`;
- `standards`.

Each catalog entry MUST define:

- `id`;
- `title`;
- `path`;
- `status`;
- `owner_surface`;
- `canonical_schema`;
- `applies_to`.

Each catalog entry MAY define:

- `agent_entrypoint`;
- `semantic_rules`.

## Rules

- Agents MUST read the catalog before treating any standards package as
  admitted.
- Agents MUST NOT apply a standards package that is absent from the catalog.
- Agents MUST treat `owner_surface` as the normative prose owner for the
  catalog entry.
- Agents MUST treat `canonical_schema: null` as an explicit statement that the
  standard has no structured schema in the current version.
- Agents MUST treat `agent_entrypoint` as the preferred token-efficient
  instruction surface for routine artifact creation.
- Agents MUST treat `semantic_rules` as a routing mirror for
  `standard.yaml.validation.semantic_rules`, not as a second owner. When both
  fields are present, they MUST match.
- Agents MUST preserve unique standard ids.
- Agents SHOULD keep catalog entries concise and avoid restating standard rules.

## Bootstrap Rule

The catalog MAY admit `meta.standards-catalog.v1` as the owner of the catalog
shape. This bootstrap rule does not allow arbitrary self-admission of other
standards.

## Failure Mode

Without a catalog standard, agents cannot distinguish admitted standards from
draft files, examples, or abandoned experiments.

## Non-Claims

This standard does not define the content of any non-catalog standard.

## Scoped justification

The goals, premises, alternatives, countermodels and conditional consequences for
this package are owned by `standards/meta/standards-catalog/v1/proofs.yaml`.
Read them using `docs/FORMAL_MODEL.md`. These are conditional justifications and
explicit policy choices, not universal claims of necessity or external execution.

Routing mirrors use exact equality after normalizing an absent semantic_rules to
null. A non-null manifest rule path cannot be mirrored by null or an absent value.
The binding selects the catalog path; validators MUST read that path. An entry
with no machine entrypoint uses its prose owner as the routine fallback. The
`justifications` path and exact `invariant_ids` are required admission metadata.
Status draft permits draft use only; repository adoption remains separately
explicit. This repository's adoption decision, not self-reference in the catalog,
is the bootstrap authority.

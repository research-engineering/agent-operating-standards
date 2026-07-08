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

## Rules

- Agents MUST read the catalog before treating any standards package as
  admitted.
- Agents MUST NOT apply a standards package that is absent from the catalog.
- Agents MUST treat `owner_surface` as the normative prose owner for the
  catalog entry.
- Agents MUST treat `canonical_schema: null` as an explicit statement that the
  standard has no structured schema in the current version.
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

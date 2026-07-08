# Standards

This directory contains admitted operating standards for agents and the durable
artifacts they create, read, validate, and apply.

The catalog at `standards.catalog.yaml` is the admission surface. A file under
this directory is not a standard until the catalog admits it.

## Layout

- `authority/` defines cross-artifact authority, claim, proof, and exception
  rules.
- `meta/` defines repository binding and catalog-level contracts.
- `artifacts/` defines individual artifact contracts such as roadmaps and pull
  request descriptions.

## Standard Package

Each standard package SHOULD use this shape when the standard owns a structured
artifact:

```text
standard.md
schema.json
template.yaml or template.md
agent-policy.md
examples/
```

`standard.md` is the normative human-readable owner surface. `schema.json`
validates structure when the artifact is machine-readable. Templates accelerate
creation but do not define additional rules.

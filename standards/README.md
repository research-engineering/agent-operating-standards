# Standards

This directory contains admitted operating standards for agents and the durable
artifacts they create, read, validate, and apply.

The catalog at `standards.catalog.yaml` is the admission surface. A file under
this directory is not a standard until the catalog admits it.

## Layout

- `authority/` defines cross-artifact authority, claim, proof, and exception
  rules.
- `meta/` defines the operating kernel, repository binding, and catalog-level
  contracts.
- `artifacts/` defines individual artifact contracts such as roadmaps and pull
  request descriptions.

## Standard Package

Each standard package SHOULD use this shape when the standard owns a structured
artifact:

```text
standard.md
standard.yaml
schema.json
semantic-rules.yaml
runtime/
template.yaml or template.md
agent-policy.md
examples/
```

`standard.md` is the normative prose owner surface and proof location.
`standard.yaml` is the preferred token-efficient agent entrypoint when the
catalog declares `agent_entrypoint`. `schema.json` validates structure when the
artifact is machine-readable. `semantic-rules.yaml` declares cross-field or
authority rules that do not fit JSON Schema. Templates accelerate creation but
do not define additional rules.

Packages MAY declare `runtime_contracts` in `standard.yaml` and store those
contracts under `runtime/`. Runtime contracts split routine model context into a
shared normative `core` plus role overlays such as producer, reviewer, or
renderer. Producer and reviewer roles MUST share the same core so creation and
review use the same artifact-validity rules.

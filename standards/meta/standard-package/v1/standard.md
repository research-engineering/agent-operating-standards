# Standard Package v1

## Status

Active.

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, and
`OPTIONAL` are to be interpreted as normative requirement levels for this
standard.

## Purpose

This standard defines the package shape for admitted operating standards.

The package separates:

- the proof and prose authority of a standard;
- the token-efficient agent execution contract;
- structural validation;
- semantic validation;
- starter templates;
- examples.

## Invariant

An agent MUST be able to apply a standard from a bounded machine-readable
contract without loading the full rationale unless it is resolving a dispute,
exception, or maintenance change.

## Package Surfaces

Each standard package MAY contain:

```text
standard.md
standard.yaml
schema.json
semantic-rules.yaml
template.yaml or template.md
agent-policy.md
examples/
```

`standard.md` is the normative prose owner surface and proof location.

`standard.yaml` is the preferred agent entrypoint when the catalog entry declares
`agent_entrypoint`.

`schema.json` validates the structured artifact governed by the standard.

`semantic-rules.yaml` declares cross-field, authority, or evidence rules that
are not practical to express in JSON Schema.

`template.*` files are starter artifacts only. They MUST NOT introduce rules
that are absent from `standard.md`, `standard.yaml`, `schema.json`, or
`semantic-rules.yaml`.

`agent-policy.md` MAY provide harness-neutral workflow guidance. It MUST NOT
override `standard.yaml`.

`examples/` MAY contain valid minimal or representative artifacts. Examples
MUST NOT be treated as exhaustive.

## Required Fields For `standard.yaml`

An agent entrypoint MUST define:

- `schema_version`;
- `id`;
- `title`;
- `lifecycle`;
- `owner_surface`;
- `agent_entrypoint`;
- `artifact`;
- `authority`;
- `agent_contract`;
- `validation`;
- `non_claims`.

## Final Agent Instruction

The final instruction for routine use is the `agent_contract` object in
`standard.yaml` plus the schema and semantic rules named by that contract.

Formal proof of the standard itself SHOULD stay outside generated artifacts.
Generated artifacts SHOULD include only evidence required by their own claim
type.

## Rules

- Agents MUST select standard packages through `standards.catalog.yaml`.
- Agents MUST load `standard.yaml` before `standard.md` when the catalog entry
  declares `agent_entrypoint`.
- Agents MUST load `standard.md` when changing the standard itself, resolving a
  conflict, creating an exception, or auditing the proof.
- Agents MUST validate structured generated artifacts against `schema.json`
  when the schema exists and a validator is available.
- Agents MUST apply `semantic-rules.yaml` when the task asserts compliance,
  evidence strength, authority boundaries, or release/readiness claims.
- Agents MUST NOT treat templates, examples, or rendered projections as
  authority.
- Agents SHOULD keep `standard.yaml` concise enough for routine agent loading.

## Failure Mode

If proof, templates, and execution instructions are mixed into one surface,
agents either load excessive context for routine tasks or apply templates as
hidden authority. Both cases create inconsistent artifacts.

## Non-Claims

This standard does not define a renderer, validator implementation, marketplace
format, or downstream repository compliance model.

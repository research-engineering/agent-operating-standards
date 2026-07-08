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
runtime/
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

`runtime/` MAY contain role-specific contracts derived from `standard.yaml`.
Runtime contracts are optimized for agent context loading. They MUST NOT add
artifact-validity rules that are absent from the canonical standard package.

When a package defines runtime contracts, `standard.yaml` SHOULD declare:

```text
runtime_contracts.core
runtime_contracts.roles.<role>
```

The `core` contract MUST contain every normative artifact-validity rule shared
by producer and reviewer agents. A role overlay MAY add role workflow,
diagnostics, rendering instructions, or severity guidance. A reviewer overlay
MUST NOT reject an artifact using a validity rule that is absent from `core`.
A producer overlay MUST NOT omit a validity rule that a reviewer overlay can
enforce.

Adapters MAY parse `standard.yaml` outside the model context to select runtime
contracts. The model context for routine use SHOULD contain `core` plus the
minimum role overlays required for the task.

`template.*` files are starter artifacts only. They MUST NOT introduce rules
that are absent from `standard.md`, `standard.yaml`, `schema.json`, or
`semantic-rules.yaml`.

`agent_contract.decision_tree` MAY define trigger-based section selection for
artifacts whose visible output changes by case. Decision trees MUST reduce
boilerplate; they MUST NOT hide required evidence.

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

When `runtime_contracts` exists, the final routine model context MAY be the
shared `core` contract plus role overlays instead of the full `agent_contract`,
provided the loaded runtime contracts preserve all normative artifact-validity
rules.

Formal proof of the standard itself SHOULD stay outside generated artifacts.
Generated artifacts SHOULD include only evidence required by their own claim
type.

## Rules

- Agents MUST select standard packages through `standards.catalog.yaml`.
- Agents MUST load `standard.yaml` before `standard.md` when the catalog entry
  declares `agent_entrypoint`.
- Agents MAY load declared runtime contracts instead of the full `agent_contract`
  for routine use when `core` is included and role overlays do not change
  artifact validity.
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

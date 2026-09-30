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

An agent MUST receive every applicable normative obligation through the declared
load path. When agent_entrypoint is present, use it with the named schema and
semantic rules. When it is absent or null, load the prose owner and catalog-named
schema/rules. The latter is an explicit routine fallback, not an exception.

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

The `core` contract MUST contain the complete agent_contract and every semantic
rule, and point to the identical artifact schema used by both roles. A role overlay MAY add role workflow,
diagnostics, rendering instructions, or severity guidance. A reviewer overlay
MUST NOT reject an artifact using a validity rule that is absent from `core`.
A producer overlay MUST NOT omit a validity rule that a reviewer overlay can
enforce.

Adapters MAY parse `standard.yaml` outside the model context to select runtime
contracts. The model context for routine use SHOULD contain `core` plus the
minimum role overlays required for the task.

Before an authority-sensitive decision, a compact consumer MUST resolve the
core's `source_manifest` through the selected catalog and repository binding
and use that manifest's authority declaration. Equality of the generated core
does not prove that a real consumer performs this resolution or preserves
authority in execution.

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

For a package with an artifact schema, validation MUST cover its non-null
structured `validation.template` (`.yaml`, `.yml`, or `.json`) and every file of
these formats recursively
under `examples/`. A prose-only package uses its declared conventional template
route. A missing version marker never removes a declared template or example
from validation. Each assignment MUST apply the complete selected schema,
including equivalent schema representations, rather than infer validity from
a particular discriminator layout. Multiple schema obligations for one path
remain independent. Packages without an artifact schema remain explicitly
schemaless.

Supplemental discovery by `schema_version` may use a declared extraction
convention; it does not replace the declaration-driven coverage above. The
repository workflow owns that discovery profile and its limits.

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

The `authority.owned_claim_types` and `authority.forbidden_claim_types` sets
MUST be disjoint. Their names remain subject to the selected claim-type owner;
disjointness does not establish that every name is classified or delegated.

## Final Agent Instruction

The final instruction for routine use is the `agent_contract` object in
`standard.yaml` plus the schema and semantic rules named by that contract.

When `runtime_contracts` exists, the final routine model context MAY be the
shared `core` contract plus role overlays instead of the full `agent_contract`,
provided the loaded runtime contracts preserve all normative artifact-validity
rules.

Formal proof of the standard itself SHOULD stay outside routine summaries when
this preserves their evidence obligations. Proof artifacts may include it.
Generated artifacts SHOULD include only evidence required by their own claim
type.

## Rules

- Agents MUST select standard packages through the catalog named by the
  repository binding; `standards.catalog.yaml` is the default path.
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

## Scoped justification

The goals, premises, alternatives, countermodels and conditional consequences for
this package are owned by `standards/meta/standard-package/v1/proofs.yaml`.
Read them using `docs/FORMAL_MODEL.md`. These are conditional justifications and
explicit policy choices, not universal claims of necessity or external execution.

## Justification admission

Every catalog entry MUST declare its exact invariant_ids and a justifications
file conforming to `justification.schema.json`. Every semantic rule and kernel
ledger entry MUST resolve to an admitted proof ID. The catalog ID set and proof
ID set MUST be equal; missing records, inconsistent premises and invalid
consequences are rejected. `docs/FORMAL_MODEL.md` defines the finite proof model
and the independent semantic-review boundary. A valid proof record never
self-approves its accepted policy premises or demonstrates model execution.

Runtime core is generated by `npm run generate`; `npm run validate` checks its
complete data equality with the selected agent_contract and semantic rules.
Overlays conform to runtime.schema.json and contain workflow only. All roles
use the same schema; the shorter representation is admitted only if no normative
obligation is lost. No unmeasured token-efficiency claim is made.

## Runtime generation boundary

The local generator operates in a cooperative, single-writer checkout. Before
opening its output, it MUST validate the canonical manifest, semantic rules,
and selected schema, and resolve the declared inputs and destination. The
destination MUST be repository-relative, with no absolute, traversal, empty,
dot, backslash, or symlink component. Its parent MUST already exist; its leaf
MAY be absent or a regular file. The output MUST NOT alias a canonical input
or a declared owner, validation artifact, or role overlay, including an existing
hard-link alias.

After constructing complete output bytes, the generator MUST create an
exclusive sibling temporary file, verify its bytes, and atomically replace the
destination. Existing output modes MUST be preserved; a new file uses mode
`0666` subject to the process umask. Failures before replacement MUST preserve
the previous destination's bytes and mode and clean only the temporary file
owned by that attempt. Report success only after replacement. A stale or absent
core is a supported input state, so validating the entire repository before
generation is not a prerequisite.

This contract covers single-file publication under the stated filesystem
semantics. It does not prove crash durability, a coherent concurrent-input
snapshot, protection against hostile same-UID filesystem changes, or atomic
publication of a multi-file migration. Unsupported replacement semantics MUST
fail explicitly.

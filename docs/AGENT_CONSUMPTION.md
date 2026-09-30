# Agent Consumption Model

This document defines how an external agent uses this repository through a
harness skill or adapter.

## Main Rule

External agents consume `standard.yaml` files as their default agent-facing
contract.

For token-sensitive routine use, an adapter MAY parse `standard.yaml` outside
the model context and load declared `runtime_contracts` into the model instead
of loading the full `agent_contract`.

When the repository binding adopts `meta.agent-operating-kernel.v1`, agents load
the kernel `standard.yaml` as the global operating guardrail before applying a
target artifact standard.

The human-readable `standard.md` explains and justifies a standard. It is not
the default token path for routine artifact creation when a valid
`standard.yaml` exists.

## Load Order

An external agent MUST use this order:

1. Load the adopting repository instructions such as `AGENTS.md`.
2. Load the adopting repository binding such as `docs/DOCS_CONTRACT.yaml`.
3. Load the standards catalog named by the binding.
4. If the binding adopts `meta.agent-operating-kernel.v1`, load its
   `agent_entrypoint` as the global guardrail.
5. Select the catalog entry for the target artifact.
6. If the catalog entry has `agent_entrypoint`, load that `standard.yaml`.
7. If `standard.yaml.runtime_contracts` exists and the task is routine, load the
   shared `core` contract plus the role overlays required by the task.
8. Use `schema.json` when creating or validating a structured draft. Adapters
   SHOULD apply schemas outside model context when deterministic validation is
   possible.
9. Apply every semantic rule named by the selected standard during production
   and review. An exact copy embedded in the generated core satisfies loading;
   a separate duplicate model-context copy is unnecessary.
10. Load `template.*` only as a starter artifact.
11. If agent_entrypoint is absent or null, load standard.md as the routine
    contract and the schema/rules named by the catalog. Otherwise load prose for
    rationale, dispute, exception, or maintenance.

## Final Agent Instruction

The final instruction for the agent is the `agent_contract` object in
`standard.yaml`, plus the artifact schema and semantic rules named by that
same `standard.yaml`.

When the kernel is adopted, the kernel `agent_contract` is the global guardrail
and the target standard's `agent_contract` is the task-specific instruction.

When a catalog entry also declares `semantic_rules`, the value is a routing
mirror and MUST match `standard.yaml.validation.semantic_rules`.

The agent MUST treat `agent_contract.final_instruction` as the executable
instruction, `agent_contract.required_inputs` as the minimum context it must
collect, `agent_contract.required_sections` as the output completeness gate for the
artifact currently being produced (not for global guardrails merely loaded), and
`agent_contract.proof_policy` as the boundary between standard proof and
artifact evidence.

When `agent_contract.review_questions` exists, producer agents MUST use it as an
answer-completeness check and reviewer agents MUST use it as the audit question
set. Universal questions always apply. Conditional questions apply only when
their trigger is true.

When `runtime_contracts` exists, producer and reviewer agents MUST both load the
same `core` contract. A producer task then loads producer and renderer overlays.
A reviewer task then loads the reviewer overlay and semantic rules when semantic
validation is needed. Core MUST contain every canonical semantic rule. Reviewer overlays MUST NOT
introduce artifact-validity rules absent from that complete core and its schema.

Before an authority-sensitive decision, a compact consumer MUST resolve
`core.source_manifest` through the selected catalog and repository binding,
then use that manifest's authority declaration. Loading core and overlays alone
does not establish this authority context. The package owner defines this
resolution requirement; core equality and schemas do not demonstrate that a
real adapter executes it.

Templates are starter artifacts, not proof authorities. A template for a proof
artifact may contain a model example; it cannot establish its own factual premises.

Formal proof, rationale, and dominance arguments normally belong in
`standard.md`, `semantic-rules.yaml`, tests, validators, or evidence artifacts.
Keep them outside routine output only when doing so preserves the evidence
required by that artifact and access to its owner. A proof artifact may include
the proof itself.

## Example

For a GitHub pull request description, the external agent loads:

```text
standards/meta/agent-operating-kernel/v1/standard.yaml
standards/artifacts/pull-request-description/v1/standard.yaml
standards/artifacts/pull-request-description/v1/schema.json
standards/artifacts/pull-request-description/v1/semantic-rules.yaml
```

The agent then creates a structured pull request draft, validates it, and
renders the GitHub body. The pull request body does not need to include the
standard's proof. It MUST render `Summary` and `Context`, then render only the
sections selected by `agent_contract.decision_tree` and `semantic-rules.yaml`.
Routine passing validation should not be rendered as a visible section unless
evidence visibility is triggered.

For token-sensitive producer model context, the external adapter may instead
load:

```text
standards/artifacts/pull-request-description/v1/runtime/core.contract.yaml
standards/artifacts/pull-request-description/v1/runtime/producer.overlay.yaml
standards/artifacts/pull-request-description/v1/runtime/renderer.overlay.yaml
```

The adapter SHOULD still use `schema.json` outside model context for structured
draft validation.

For token-sensitive reviewer model context, the external adapter may instead
load:

```text
standards/artifacts/pull-request-description/v1/runtime/core.contract.yaml
standards/artifacts/pull-request-description/v1/runtime/reviewer.overlay.yaml
standards/artifacts/pull-request-description/v1/semantic-rules.yaml
```

## Non-Claims

- This document does not make any adopting repository compliant.
- This document does not define a renderer implementation.
- This document does not make generated Markdown authoritative.

## Predicate and evidence boundary

For PRs, evaluate `decision_tree.when` using the structured draft's `review_facts`,
change_profiles, readiness_state and urgency. The grammar is Boolean constants,
`fact`, `profile`, `readiness`, `urgency`, `absent`, `any` and `all`. Facts may be
true, false or unknown. Any true disjunct resolves an OR; any false conjunct
resolves an AND; otherwise unknown propagates. Union all selected sections.
Omit a section only if every rule selecting it is false. An unresolved section
blocks a compliance claim. Producer-supplied facts require independent review
against the diff and owners; parsing a Boolean does not prove its truth.
The exact fact meanings are part of the PR entrypoint's
`agent_contract.semantic_obligations` and therefore its generated core. Before
validating drafts, validate the complete PR model against the selected artifact
schema using the extraction profile declared by the PR owner. Unsupported
schema vocabulary layouts fail explicitly; this does not claim arbitrary
JSON Schema introspection.

Stored evidence has its own evidence obligation and need not render a visible
Evidence section. All other optional output fields map to their selected visible
sections. The generated runtime core includes every semantic rule, so producer
and reviewer cannot silently use different validity sets.

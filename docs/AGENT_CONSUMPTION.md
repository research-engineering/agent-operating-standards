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
9. Load `semantic-rules.yaml` only when semantic validation is needed.
10. Load `template.*` only as a starter artifact.
11. Load `standard.md` only for rationale, dispute, exception, or maintenance.

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
collect, `agent_contract.required_sections` as the output completeness gate, and
`agent_contract.proof_policy` as the boundary between standard proof and
artifact evidence.

When `agent_contract.review_questions` exists, producer agents MUST use it as an
answer-completeness check and reviewer agents MUST use it as the audit question
set. Universal questions always apply. Conditional questions apply only when
their trigger is true.

When `runtime_contracts` exists, producer and reviewer agents MUST both load the
same `core` contract. A producer task then loads producer and renderer overlays.
A reviewer task then loads the reviewer overlay and semantic rules when semantic
validation is needed. Reviewer overlays MUST NOT introduce artifact-validity
rules absent from `core` or the standard's semantic rules.

Templates MUST NOT contain formal proofs. Templates are starter artifacts.

Formal proof, rationale, and dominance arguments belong in `standard.md`,
`semantic-rules.yaml`, tests, validators, or evidence artifacts. The generated
artifact should contain only the evidence needed for its own claim type.

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

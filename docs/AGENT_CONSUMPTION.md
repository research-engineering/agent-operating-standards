# Agent Consumption Model

This document defines how an external agent uses this repository through a
harness skill or adapter.

## Main Rule

External agents consume `standard.yaml` files as their default agent-facing
contract.

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
7. Load `schema.json` when creating or validating a structured draft.
8. Load `semantic-rules.yaml` only when semantic validation is needed.
9. Load `template.*` only as a starter artifact.
10. Load `standard.md` only for rationale, dispute, exception, or maintenance.

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

## Non-Claims

- This document does not make any adopting repository compliant.
- This document does not define a renderer implementation.
- This document does not make generated Markdown authoritative.

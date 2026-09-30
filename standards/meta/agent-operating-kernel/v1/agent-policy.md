# Agent Policy: Agent Operating Kernel v1

Agents MUST use this policy when interpreting admitted standards in this
repository or in an adopting repository that binds to
`meta.agent-operating-kernel.v1`.

For routine work, agents MUST:

1. Load the repository binding and standards catalog.
2. Load the kernel `standard.yaml` when the binding adopts this standard.
3. Select the target artifact standard.
4. Use the target standard's `agent_contract` as the task-specific instruction.
5. Apply kernel invariants as global guardrails.
6. Use the sufficient evidence class for each assertion; deterministic tools can
   prove both structural and semantic properties of explicit models.
7. Review applicability, source facts and adequacy beyond the proved model.
8. Keep standard rationale outside routine output only when doing so preserves
   the artifact's evidence obligations and access to the owner. A proof artifact
   may include the proof itself.

Agents MUST NOT treat chat history, generated projections, templates, pull
request bodies, or issue comments as durable authority unless an admitted
standard declares that authority.

Agents MUST NOT use the kernel to define product requirements, architecture,
API contracts, security policy, runtime facts, release facts, or release
guarantees.

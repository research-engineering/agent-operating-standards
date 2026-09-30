# Agent Policy: Standard Package v1

Agents MUST use `standard.yaml` as the routine instruction surface when the
catalog entry declares `agent_entrypoint`.

Agents MUST load `standard.md` before editing a standard package, resolving a
conflict, writing an exception, or evaluating the proof of the standard.

Agents SHOULD keep standard proof outside routine generated output only when
doing so preserves the evidence required by the artifact and access to its
owner. A proof artifact may include the proof itself.

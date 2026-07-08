# Agent Policy: Standard Package v1

Agents MUST use `standard.yaml` as the routine instruction surface when the
catalog entry declares `agent_entrypoint`.

Agents MUST load `standard.md` before editing a standard package, resolving a
conflict, writing an exception, or evaluating the proof of the standard.

Agents MUST NOT copy proof text into generated artifacts unless the artifact
standard explicitly requires artifact-level proof.

# Agent Policy: Roadmap Artifact v1

Agents MAY read the roadmap first for orientation.

For routine roadmap work, agents MUST load `standard.yaml` as the final
instruction surface and use `schema.json` for canonical artifact validation.
Load `standard.md` only for rationale, dispute, exception, or standard
maintenance.

Agents MUST NOT implement a roadmap item until each implementation-relevant
claim has a stronger owner surface or a bounded exception.

Before changing code for a roadmap item, agents MUST:

1. Load the repository binding.
2. Load this roadmap standard.
3. Load the canonical roadmap artifact.
4. Follow every relevant `authority_links` entry.
5. Verify that the roadmap item does not define forbidden claim types.
6. Update the canonical artifact first and regenerate Markdown projections
   after canonical changes.

Agents MUST state non-claims when summarizing roadmap-driven work.

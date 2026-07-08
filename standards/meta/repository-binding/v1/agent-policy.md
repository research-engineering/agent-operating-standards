# Agent Policy: Repository Standards Binding v1

Before creating, editing, or validating a governed artifact, agents MUST:

1. Find the repository binding.
2. Load the standards catalog named by the binding.
3. Confirm the target artifact has an adopted standard.
4. Read the standard package named by the catalog entry.
5. Apply schema, template, agent policy, and semantic rules in that order.

If the binding is absent, agents MAY create one only when the task is to adopt
agent operating standards. Otherwise agents MUST avoid claiming repository-wide
standard compliance.

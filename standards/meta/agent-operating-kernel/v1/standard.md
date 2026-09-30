# Agent Operating Kernel Standard v1

## Status and scope

Active when adopted by the repository binding. This kernel owns cross-standard
loading, authority, evidence and exception boundaries. It does not own product
requirements, runtime truth, security approval, merge approval or agent execution.

## Conditional consistency claim

There is no universal equivalence between consistent agent behavior and the
existence of this catalog protocol. A hard-coded procedure can behave consistently
without a catalog; a correctly packaged instruction can be ignored at execution.

For a fixed version, coherent owner model, complete applicable obligation set,
semantics-preserving loaded representation, and an executor that actually obeys
that representation, compliance with the loaded obligations implies compliance
with the selected obligations. If A is the selected set and L the loaded set,
A is a subset of L and satisfaction of every obligation in L entails satisfaction
of every obligation in A. Preservation and execution are necessary premises of
this implication, not consequences of owning YAML files. It proves no consistency
between incompatible repository policies or stronger runtime behavior.

The ten scoped rules and their premise-dependent proofs are recorded in
`standards/meta/agent-operating-kernel/v1/proofs.yaml`. The machine entrypoint
contains the exact operational statements; the ledger is checked against them.
Ledger owner identity follows AOK-SEM-002: each entry names the actual selected
kernel owner, rather than a fixed conventional path or another admitted owner.

## Invariants

### KERNEL-001

Use recurring instructions as durable authority only through a selected versioned owner or an independently approved bounded exception.

Justification: `standards/meta/agent-operating-kernel/v1/proofs.yaml#KERNEL-001`.

### KERNEL-002

Use the declared machine entrypoint when present; otherwise load the prose owner. A routine projection must preserve all applicable rules.

Justification: `standards/meta/agent-operating-kernel/v1/proofs.yaml#KERNEL-002`.

### KERNEL-003

Preserve evidence required by the artifact claim. Place standard rationale outside routine output only when doing so preserves that evidence and access to its owner.

Justification: `standards/meta/agent-operating-kernel/v1/proofs.yaml#KERNEL-003`.

### KERNEL-004

Identify claim scope and verify delegated authority before relying on a surface. Unclassified claims and conflicting owners remain unresolved.

Justification: `standards/meta/agent-operating-kernel/v1/proofs.yaml#KERNEL-004`.

### KERNEL-005

Classify evidence by the proposition it proves, not by its executor. A structural pass alone does not prove unrelated semantics; deterministic semantic proofs are admissible.

Justification: `standards/meta/agent-operating-kernel/v1/proofs.yaml#KERNEL-005`.

### KERNEL-006

At an untrusted consumer boundary, validate exact artifact bytes unless a sufficient unchanged certificate is independently reusable.

Justification: `standards/meta/agent-operating-kernel/v1/proofs.yaml#KERNEL-006`.

### KERNEL-007

Generated provenance grants no canonical authority. Use the bound source owner; change ownership only through an explicit binding migration.

Justification: `standards/meta/agent-operating-kernel/v1/proofs.yaml#KERNEL-007`.

### KERNEL-008

Use an exception only with independent scope approval, disjoint allowed/forbidden claims and an unexpired lifetime; missing facts do not grant authority.

Justification: `standards/meta/agent-operating-kernel/v1/proofs.yaml#KERNEL-008`.

### KERNEL-009

Render the sections selected by the agreed decision model; preserve all required answers. Unknown relevance stays unresolved and no unique optimal wording is claimed.

Justification: `standards/meta/agent-operating-kernel/v1/proofs.yaml#KERNEL-009`.

### KERNEL-010

Do not override a claim outside delegated authority. Resolve incomparable-owner conflicts explicitly; a convenient artifact never creates delegation.

Justification: `standards/meta/agent-operating-kernel/v1/proofs.yaml#KERNEL-010`.

## Enforcement and non-claims

The classes kernel, artifact, adoption, validation and semantic are applicability
labels, not disjoint proof capabilities. Every enforcement route must identify
what proposition and target it establishes. These standards do not prove their
own external adoption, universal necessity, token optimality, downstream compliance,
or actual execution by a model, harness, validator or human.

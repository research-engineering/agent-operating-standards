# Agent Operating Kernel Standard v1

## Status

Active.

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, and
`OPTIONAL` are to be interpreted as normative requirement levels for this
standard.

## Purpose

This standard defines the repository-wide operating invariants that agents MUST
use when applying admitted standards, creating governed artifacts, validating
generated projections, or deciding whether an instruction belongs in a standard
instead of chat history.

The kernel is not a substitute for artifact-specific standards. It defines the
load path, authority boundaries, proof placement, validation split, and
exception discipline that every admitted standard MUST respect.

## Canonical Artifact

The canonical artifact for kernel invariants is this standard package:

```text
standards/meta/agent-operating-kernel/v1/
```

Routine agents SHOULD load `standard.yaml`. Agents SHOULD load this
`standard.md` only for proof, dispute, exception handling, or kernel
maintenance.

## Theorem

Agent behavior is consistent across repositories if and only if recurring
instructions are:

1. admitted through a versioned catalog entry;
2. bound by a repository contract;
3. exposed to agents through a machine-readable entrypoint;
4. validated by deterministic gates where deterministic truth is possible;
5. reviewed by semantic rules or agents where meaning cannot be reduced to
   syntax; and
6. bounded by explicit non-claims and exception scope.

Therefore durable agent instructions MUST be standards, not chat memory,
template folklore, local filename inference, or generated projections.

## Kernel Invariants

### KERNEL-001: Standards Own Durable Instructions

Recurring agent behavior MUST be defined by admitted, versioned standards.
Agents MUST NOT treat chat history, filenames, directory names, templates, pull
request bodies, issue comments, or generated views as durable authority unless
an admitted standard names them as owner surfaces.

### KERNEL-002: Machine Entrypoint First

For routine artifact creation, the executable instruction is the selected
standard's `agent_contract` in `standard.yaml`, applied with the schema and
semantic rules named by that same entrypoint.

`standard.md` remains the normative prose owner and proof surface, but it is not
the default token path for routine artifact creation.

### KERNEL-003: Proof Is Not Output Boilerplate

Formal proof, rationale, and dominance arguments belong in standards, semantic
rules, validators, tests, or evidence artifacts. Generated artifacts MUST
include only the evidence needed for their own claim type.

### KERNEL-004: Claim Type Before Authority

Agents MUST classify the claim type before selecting an owner surface. A
convenient artifact MAY orient review, but it MUST NOT prove stronger claim
types unless its standard explicitly owns them.

### KERNEL-005: Deterministic Gates and Semantic Review Are Different

CI, schemas, parsers, and validators SHOULD enforce structure, allowed fields,
required fields, projection freshness, and forbidden boilerplate.

Semantic agents and human reviewers SHOULD evaluate sufficiency, truth,
trigger correctness, missing context, misleading claims, and over-claims.

Neither layer replaces the other.

### KERNEL-006: Producer Prevention Plus Consumer Enforcement

Agents that create artifacts SHOULD use skills, renderers, or harness adapters
to produce compliant artifacts before review. Consumer repositories SHOULD still
enforce deterministic checks so compliance does not depend on the producer path.

Standards repositories own normative contracts. Executable skills, plugins,
hooks, and harness adapters own execution behavior and SHOULD live in the
appropriate harness or capability repository unless an admitted standard defines
their package shape.

### KERNEL-007: Generated Projections Are Not Canonical By Default

Markdown, HTML, PDF, GitHub templates, and other rendered outputs are generated
projections unless a repository binding explicitly declares otherwise and
freshness evidence exists.

### KERNEL-008: Exceptions Are Bounded

An exception MUST have explicit scope, reason, allowed claim types, forbidden
claim types, review trigger or expiry, owner, and promotion or removal gate.
Repeated exceptions SHOULD be promoted into a standard or removed.

### KERNEL-009: Output Contains Exactly Review-Relevant Facts

Agents MUST NOT publish empty sections, placeholder prompts, ceremonial
checklists, or proof-shaped text that does not affect the artifact's claim.
Artifacts SHOULD contain no fewer and no more facts than the target decision
requires.

### KERNEL-010: Stronger Owner Surfaces Win

Artifact standards and generated projections MUST NOT override requirements,
architecture, API contracts, security policy, runtime facts, release facts, or
release guarantees owned by stronger surfaces.

## Invariant Classes

Kernel invariants are classified as:

- `kernel`: applies to the standards system itself;
- `artifact`: applies to governed artifact creation;
- `adoption`: applies to consumer repository bindings and harness loading;
- `validation`: applies to deterministic gates and CI;
- `semantic`: applies to meaning, truth, sufficiency, and over-claim review.

An invariant MAY belong to more than one class when its enforcement spans both
machine and semantic layers.

## Failure Mode

Without a kernel, each artifact standard redefines the same authority model.
Agents then drift across projects, over-read templates, promote generated
Markdown to truth, or treat prior chat decisions as durable policy.

## Non-Claims

This standard does not define product requirements, application architecture,
API contracts, security policy, runtime facts, release facts, release
guarantees, merge approval, CI implementation, GitHub App implementation,
executable skill implementation, or downstream repository compliance.

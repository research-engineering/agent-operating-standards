# Claim Type Authority Standard v1

## Status

Active.

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, and
`OPTIONAL` are to be interpreted as normative requirement levels for this
standard.

## Purpose

This standard defines the claim types that agents MUST use before deciding which
artifact can prove, modify, or cite a claim.

## Invariant

An artifact can be authoritative only for claim types that its standard
explicitly owns.

## Claim Types

| Claim type | Meaning | Typical owner surface |
| --- | --- | --- |
| `orientation` | Entry-point guidance and navigation. | README, docs index |
| `plan` | Intended future work or direction. | Roadmap |
| `priority` | Relative ordering or importance. | Roadmap, project board |
| `horizon` | Planning window or timing band. | Roadmap, project board |
| `intent` | Desired outcome before it becomes a requirement. | Roadmap, proposal |
| `sequencing` | Dependency-aware order of work. | Roadmap, implementation plan |
| `uncertainty` | Explicit discovery, research, or unknown state. | Roadmap, proposal |
| `requirement` | Required behavior or quality attribute. | Specification |
| `architecture` | Structural, runtime, deployment, or boundary truth. | Architecture document, ADR |
| `decision` | Accepted choice with rationale and consequences. | ADR or RFC |
| `api_contract` | Wire, schema, or interface contract. | OpenAPI, JSON Schema, IDL |
| `security` | Security policy, disclosure, threat, or control truth. | Security standard or policy |
| `runtime_fact` | Observed or current runtime behavior. | Evidence, logs, tests |
| `evidence` | Validation result tied to version, input, or gate. | Evidence artifact |
| `release_fact` | What shipped or changed in a release. | Changelog, release notes |
| `release_guarantee` | Commitment that a future release will occur. | Explicit release commitment |
| `task_detail` | Work item detail, owner, status, or remediation. | Issue, backlog, project board |
| `agent_instruction` | Durable instruction to an agent. | AGENTS file, skill, policy |

## Rules

- Agents MUST classify a claim before using an artifact as evidence for it.
- Agents MUST NOT infer authority from a filename, directory, or file extension.
- Agents MUST follow the owning standard for the classified claim type.
- Agents MUST treat unclassified claims as unproven until classified.
- Agents MUST NOT use a planning artifact to prove a requirement, architecture,
  API contract, security claim, runtime fact, release fact, or release
  guarantee.
- Agents MAY use a planning artifact as orientation before following authority
  links to stronger owner surfaces.

## Failure Mode

Without typed claims, agents promote convenient text into hidden authority. The
usual failure is treating a roadmap, pull request body, issue comment, or chat
summary as proof of product behavior.

## Non-Claims

This standard does not define the structure of any artifact. It only defines
claim types and cross-artifact authority boundaries.

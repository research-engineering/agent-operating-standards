# Semantic Rules v1

## Status

Active.

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, and
`OPTIONAL` are to be interpreted as normative requirement levels for this
standard.

## Purpose

This standard defines `semantic-rules.yaml` files for rules that cannot be
expressed cleanly in JSON Schema alone.

## Canonical Artifact

The default canonical artifact is:

```text
semantic-rules.yaml
```

inside the standard package that owns the artifact.

## Owned Claim Types

A semantic rules file MAY own only:

- `agent_instruction`;
- `evidence` when a validation result cites a specific rule id;
- `orientation`.

## Forbidden Claim Types

A semantic rules file MUST NOT create or override:

- `requirement`;
- `architecture`;
- `decision`;
- `api_contract`;
- `security`;
- `release_fact`;
- `release_guarantee`;
- `runtime_fact` outside validation evidence for the current artifact.

## Invariant

Rules that decide artifact compliance MUST be explicit, stable, addressable, and
reviewable by id.

## Required Fields

A semantic rules file MUST define:

- `schema_version`;
- `standard`;
- `scope`;
- `rules`.

Each rule MUST define:

- `id`;
- `invariant`;
- `applies_to`;
- `check`;
- `failure_mode`.

## Rules

- Agents MUST treat semantic rules as validation authority for the standard that
  names them.
- Agents MUST NOT apply semantic rules from one standard to another standard
  unless a catalog entry or standard explicitly delegates that reuse.
- Agents MUST cite rule ids when reporting semantic validation failures.
- Semantic rule ids MUST be unique inside one `semantic-rules.yaml` file.
- Agents SHOULD keep checks deterministic enough for a reviewer or validator to
  reproduce.
- Agents SHOULD avoid prose-only taste rules unless the rule protects an
  explicit invariant.

## Failure Mode

Without a semantic rules standard, cross-field checks become hidden reviewer
preferences. Agents then cannot distinguish real compliance failures from local
style preference.

## Non-Claims

This standard does not define a validator implementation, rule engine, or
complete formal language.

## Scoped justification

The goals, premises, alternatives, countermodels and conditional consequences for
this package are owned by `standards/meta/semantic-rules/v1/proofs.yaml`.
Read them using `docs/FORMAL_MODEL.md`. These are conditional justifications and
explicit policy choices, not universal claims of necessity or external execution.

Each rule MUST also have justification_ref resolving to the selected package's
proof bundle (or an explicitly delegated cross-rule proof within that standard).
The proof is conditional on its declared premises; the rule's applicability and
semantic sufficiency remain independent review obligations.

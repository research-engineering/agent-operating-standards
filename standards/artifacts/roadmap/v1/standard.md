# Roadmap Artifact Standard v1

## Status

Active.

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, and
`OPTIONAL` are to be interpreted as normative requirement levels for this
standard.

## Purpose

This standard defines an agent-readable roadmap artifact. A roadmap orients
agents around intended future work, priorities, horizons, dependencies, and
uncertainty.

## Canonical Artifact

The default canonical artifact is:

```text
docs/planning/roadmap.yaml
```

`ROADMAP.md` SHOULD be treated as a generated human-readable projection unless
the repository binding explicitly declares otherwise.

## Owned Claim Types

A roadmap MAY own only these claim types:

- `plan`;
- `priority`;
- `horizon`;
- `intent`;
- `sequencing`;
- `uncertainty`.

## Forbidden Claim Types

A roadmap MUST NOT define, prove, or override:

- `requirement`;
- `architecture`;
- `decision`;
- `api_contract`;
- `security`;
- `runtime_fact`;
- `evidence`;
- `release_fact`;
- `release_guarantee`.

## Invariant

Roadmap items MAY orient implementation, but they MUST NOT be used as proof that
the target behavior, architecture, API, security posture, release, or runtime
state is valid.

## Required Fields

The canonical roadmap MUST define:

- `schema_version`;
- `doc_type`;
- `canonical`;
- `scope`;
- `owner`;
- `last_reviewed`;
- `review_cadence`;
- `authority`;
- `items`;
- `non_claims`.

Each roadmap item MUST define:

- `id`;
- `title`;
- `status`;
- `horizon`;
- `confidence`;
- `owner`;
- `planning_claim`;
- `authority_links`;
- `exit_evidence`.

## Optional Fields

The canonical roadmap MAY define:

- `generated_projection`;
- `external_board`;
- `themes`;
- `local_roadmaps`;
- `risks`;
- `dependencies`;
- `exceptions`;
- `rendering`.

## Rules

- Agents MAY read the roadmap first for orientation.
- Agents MUST NOT use the roadmap as proof outside the owned claim types.
- Agents MUST follow `authority_links` before implementing code for a roadmap
  item.
- Agents MUST create or cite an exception when a roadmap item intentionally
  lacks the stronger owner surface needed for implementation.
- Agents MUST move shipped work to a release or changelog artifact before using
  it as a release fact.
- Agents MUST NOT use exact dates unless the item declares a commitment basis
  or uses an external board that owns scheduling detail.
- Agents SHOULD use horizons such as `now`, `next`, `later`, and `exploring`
  when the roadmap is not a delivery commitment.

## Conflict Rules

- Requirements beat roadmap items for `requirement` claims.
- ADRs and architecture documents beat roadmap items for `architecture` and
  `decision` claims.
- OpenAPI, JSON Schema, and other machine contracts beat roadmap items for
  `api_contract` claims.
- Evidence artifacts beat roadmap items for `runtime_fact`, `evidence`, and
  `release_fact` claims.
- Backlog and issue systems own task-level detail; roadmap owns sequencing and
  planning horizon.

## Failure Mode

If a roadmap becomes a specification, agents will implement desired future
intent as if it were accepted truth. This creates false requirements, false
architecture, and false release expectations.

## Non-Claims

This standard does not define a release process, product strategy, workflow
gate, or downstream repository compliance model.

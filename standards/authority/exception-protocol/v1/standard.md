# Exception Protocol Standard v1

## Status

Active.

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, and
`OPTIONAL` are to be interpreted as normative requirement levels for this
standard.

## Purpose

This standard defines how agents document bounded exceptions to an operating
standard without converting the exception into a new hidden rule.

## Invariant

Every exception MUST have a scope, reason, expiry or review trigger, allowed
claim types, forbidden claim types, and a promotion or removal gate.

## Required Fields

An exception record MUST include:

- `id`;
- `type`;
- `scope`;
- `reason`;
- `allowed_claim_types`;
- `forbidden_claim_types`;
- `review_by` or `review_trigger`;
- `promotion_gate`;
- `owner`;
- `non_claims`.

## Rules

- Agents MUST NOT treat an exception as a permanent standard.
- Agents MUST NOT widen an exception beyond its declared `scope`.
- Agents MUST NOT use an exception to override a stronger typed authority
  surface outside the exception's allowed claim types.
- Agents MUST review recurring exceptions for removal, consolidation, or an
  explicitly authorized standard change. Recurrence alone does not authorize
  a new standard or prove that generalization is appropriate.
- Agents SHOULD prefer `review_trigger` over a calendar date when the exception
  is tied to a lifecycle event.

## Failure Mode

Undocumented exceptions become folklore. Agents then repeat them as if they were
standards and gradually destroy authority boundaries.

## Non-Claims

This standard does not approve any exception. It only defines the shape and
minimum evidence required for exceptions.

## Authorization and Lifetime

Validity for an action a at time t is the conjunction of: `status = approved`;
an approval from a separately authorized owner covering this exact exception
and action; a lies inside scope and allowed claim types; its claim type is not
forbidden; t is strictly before `valid_until`; and neither revocation nor the
review trigger has occurred. An unavailable predicate yields unresolved validity
and grants no authority. The allowed and forbidden sets MUST be disjoint.

Every record MUST contain `status`, `valid_until`, `approval_ref` and
`approval_authority`. Proposed records may use null approval fields. Approval
fields are references to independently checked authority, not self-approval.
A review trigger or `review_by` MAY shorten, never extend, the finite validity
bound. `review_by` expires at 00:00:00 UTC on that date. An event that never occurs
cannot extend `valid_until`. Expiry, revocation or a reached trigger makes the
record unusable; renewal needs a new scoped approval and a new finite bound.
The schema validates record shape; authorization requires the cited owner.

## Scoped justification

The goals, premises, alternatives, countermodels and conditional consequences for
this package are owned by `standards/authority/exception-protocol/v1/proofs.yaml`.
Read them using `docs/FORMAL_MODEL.md`. These are conditional justifications and
explicit policy choices, not universal claims of necessity or external execution.

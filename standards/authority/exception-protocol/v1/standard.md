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
- Agents MUST create or update a proper standard when the same exception recurs
  across multiple repositories or artifacts.
- Agents SHOULD prefer `review_trigger` over a calendar date when the exception
  is tied to a lifecycle event.

## Failure Mode

Undocumented exceptions become folklore. Agents then repeat them as if they were
standards and gradually destroy authority boundaries.

## Non-Claims

This standard does not approve any exception. It only defines the shape and
minimum evidence required for exceptions.

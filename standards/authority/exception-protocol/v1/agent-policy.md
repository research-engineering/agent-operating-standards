# Agent Policy: Exception Protocol v1

When an exception is needed, agents MUST first create a proposed record.
They MUST verify independent approval, action scope, disjoint claim sets, finite
expiry and review/revocation state before relying on it. A proposed record does
not authorize proceeding. Unknown predicates grant no authority.

Agents MUST stop and request clarification instead of inventing an exception
when:

- the exception would weaken security or release authority;
- the exception has no owner;
- the exception has no review trigger or expiry;
- the exception would let a planning artifact define a requirement,
  architecture, API contract, runtime fact, or release guarantee.

Agents MUST cite the exception id in generated artifacts affected by the
exception.

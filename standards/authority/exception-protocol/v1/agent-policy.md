# Agent Policy: Exception Protocol v1

Agents MUST create an exception record when a standard cannot be followed and
the work must still proceed.

Agents MUST stop and request clarification instead of inventing an exception
when:

- the exception would weaken security or release authority;
- the exception has no owner;
- the exception has no review trigger or expiry;
- the exception would let a planning artifact define a requirement,
  architecture, API contract, runtime fact, or release guarantee.

Agents MUST cite the exception id in generated artifacts affected by the
exception.

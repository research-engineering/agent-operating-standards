# Agent Policy: Pull Request Description v1

Agents MUST use this standard when opening or updating a pull request in a
repository that adopts `artifact.pull-request-description.v1`.

Before opening the pull request, agents MUST:

1. Inspect the diff.
2. Identify the owner surfaces changed.
3. Identify the standards or issues that justify the change.
4. List checks actually run.
5. Add non-claims for readiness, release, CI, downstream adoption, and
   production behavior when not proven by the pull request.

Agents MUST NOT use filler text, hidden assumptions, or generated praise.

Agents SHOULD keep the PR body concise, but MUST NOT omit authority links,
validation, risk, rollback, or non-claims.

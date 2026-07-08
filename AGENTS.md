# Agent Instructions

This repository defines operating standards for agent-readable engineering
work. Treat standards as normative surfaces only when they are explicitly
admitted in tracked files.

## Editing Rules

- Use English in tracked files.
- Keep standards concise, deterministic, and source-of-truth oriented.
- Do not add historical summaries, chat transcripts, or temporary plans as
  normative content.
- Do not create a second source of truth for a rule. Link to the owner surface
  instead.
- Do not introduce workflow gates, required checks, or automation policy until a
  standard explicitly owns that workflow model.
- Preserve the repository merge invariant: pull requests into `main` use squash
  merge only, and direct/non-linear updates to `main` are not part of normal
  operation.
- Prefer editing existing surfaces over adding new files unless a new owner is
  logically necessary.

## Standard Admission

Every normative rule should identify:

- owner surface;
- scope;
- invariant;
- failure mode;
- required evidence or review path;
- explicit non-claims.

Reject a proposed standard when it is only a style preference, project-specific
habit, or implementation detail that cannot generalize across repositories.

## Pull Request Expectations

A pull request should describe the problem, the standard or governance surface
changed, the validation performed, and what the change does not claim.

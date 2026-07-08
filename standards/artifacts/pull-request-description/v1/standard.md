# Pull Request Description Artifact Standard v1

## Status

Active.

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, and
`OPTIONAL` are to be interpreted as normative requirement levels for this
standard.

## Purpose

This standard defines the pull request description shape agents MUST use when
opening or updating pull requests for repositories that adopt this standard.

## Canonical Artifact

The canonical artifact is the pull request body stored by the hosting platform.
The recommended GitHub projection is:

```text
.github/pull_request_template.md
```

When agents draft a PR body outside GitHub, they SHOULD use the structured
draft model defined by `schema.json` before rendering Markdown.

## Owned Claim Types

A pull request description MAY own only:

- `orientation`;
- `task_detail`;
- `evidence` when tied to checks actually run for the pull request;
- `agent_instruction` only for reviewer focus inside the pull request.

## Forbidden Claim Types

A pull request description MUST NOT create or override:

- `requirement`;
- `architecture`;
- `decision`;
- `api_contract`;
- `security`;
- `release_fact`;
- `release_guarantee`;
- `runtime_fact` unless backed by explicit evidence.

## Required Sections

A pull request description MUST include:

- `Summary`;
- `Problem`;
- `Authority Links`;
- `Changes`;
- `Validation`;
- `Risk and Rollback`;
- `Non-Claims`;
- `Review Focus`.

## Rules

- Agents MUST use factual, reviewable statements.
- Agents MUST link to standards, issues, specs, schemas, or evidence when the PR
  depends on them.
- Agents MUST NOT claim validation that was not run.
- Agents MUST separate local checks from CI, production, release, and downstream
  compliance claims.
- Agents MUST include explicit non-claims when a reader could infer a stronger
  claim than the PR proves.
- Agents SHOULD keep the description short enough for review while preserving
  the required evidence surface.

## Section Semantics

`Summary` states what changed.

`Problem` states why the change is needed and what failure mode it prevents.

`Authority Links` names the standards or owner surfaces that justify the
change.

`Changes` lists the changed surfaces without restating the full diff.

`Validation` states checks actually performed and their results.

`Risk and Rollback` states residual risk and the smallest safe rollback path.

`Non-Claims` states what the pull request does not prove.

`Review Focus` tells reviewers what deserves attention.

## Failure Mode

Unstructured PR descriptions become marketing summaries. Agents then overclaim
readiness, hide missing validation, or omit the owner surface that should be
reviewed.

## Non-Claims

This standard does not define merge approval, release approval, CI requirements,
or reviewer assignment policy.

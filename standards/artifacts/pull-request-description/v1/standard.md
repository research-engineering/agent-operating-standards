# Pull Request Description Artifact Standard v1

## Status

Active.

The key words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`, and
`OPTIONAL` are to be interpreted as normative requirement levels for this
standard.

## Purpose

This standard defines the pull request title and body shape agents MUST use when
opening or updating pull requests for repositories that adopt this standard.

The standard optimizes for review decisions, future search, and bounded
authority. It does not optimize for exhaustive status reporting.

## Canonical Artifact

The canonical artifact is the pull request title and body stored by the hosting
platform.

The recommended GitHub projection is:

```text
.github/pull_request_template.md
```

When agents draft a PR outside GitHub, they SHOULD use the structured draft
model defined by `schema.json` before rendering Markdown.

## Theorem

A pull request description is sufficient if and only if a reviewer can answer:

1. What changed?
2. Why should this change exist?
3. Which optional review facts are needed because this specific change creates
   impact, risk, dependency, evidence, rollout, security, or review-focus
   obligations?

Therefore only the first two answers are mandatory for every pull request. All
other sections are conditional.

## Reviewer Question Contract

Reviewer agents MUST evaluate a pull request description by asking universal
questions first and conditional questions only when their trigger is true.

Universal reviewer questions:

| Question | Answer surface |
| --- | --- |
| What changed? | `Summary`, `Changes`, `review_scope` |
| Why does this change exist? | `Context`, `Links` |
| Is the review surface explicit enough? | `review_scope`, `Changes` |
| Which optional facts are triggered? | `change_profiles`, decision tree |
| Is the pull request overstating what it proves? | `Non-Claims`, `Evidence`, owner links |

Conditional reviewer questions:

| Trigger | Question | Answer surface |
| --- | --- | --- |
| The change affects users, business behavior, operators, developers, cost, accessibility, compliance, or support. | What review-relevant impact or value follows from this change? | `Impact` |
| A business, product, incident, policy, or requirement claim matters. | Which owner surface proves the cause, requirement, or priority? | `Links` |
| The PR claims benefit, readiness, safety, freshness, performance, or equivalence. | What evidence supports the claim, or what non-claim bounds it? | `Evidence`, `Non-Claims` |
| The change has non-obvious failure or reversal behavior. | What can fail and how is it rolled back or forward-fixed? | `Risk / Rollback` |
| Merge order, migration, flags, versions, or downstream adoption matters. | What sequencing or rollout fact changes the review decision? | `Migration / Rollout` |
| Security or privacy posture is touched. | What security or privacy review surface is relevant, without leaking sensitive details? | `Security / Privacy` |
| Visual or rendered output matters. | What visual evidence lets the reviewer inspect the result? | `Visual Evidence` |
| Review path is non-obvious. | Where should the reviewer focus first? | `Review Focus` |

`Why are we working on this?` is universal and belongs in `Context`.
`What is the root business cause?` is conditional and belongs in `Links` or
`Impact` only when a business owner surface or business effect exists.
`What advantages do we have from this PR?` is conditional; agents SHOULD express
it as review-relevant impact or expected effect, not promotional language.

## Universal Mandatory Content

Every pull request description MUST include:

- `Summary`: the smallest accurate statement of what changed.
- `Context`: the reason, problem, intent, or correction that makes the change
  worth reviewing.

The structured draft MUST also include `review_scope`, which identifies the
changed owner surfaces. The visible body SHOULD render this as `Changes` only
when the review scope is not obvious from `Summary` and the platform diff.

The structured draft MUST include `change_profiles` and `readiness_state`.
Profiles are composable: a pull request can be both `security`, `dependency`,
`configuration`, and `emergency`.

The pull request title MUST be a short imperative or noun-phrase summary that
can stand alone in history views.

For trivial documentation, typo, formatting, or generated-only pull requests,
`Context` MAY be short, but it MUST still state why the change exists or why no
behavior claim is being made.

## Optional Triggered Sections

Agents MUST include an optional section only when its trigger is true.

| Section | Trigger |
| --- | --- |
| `Impact` | The change affects users, business behavior, operators, developers, cost, performance, accessibility, compliance, or support. |
| `Changes` | The reviewer cannot understand the review surface from `Summary` and diff alone, or the PR touches multiple logical surfaces. |
| `Links` | The PR depends on an issue, standard, spec, design, incident, policy, schema, or evidence artifact that owns a relevant claim. |
| `Evidence` | Human review depends on proof that is not already obvious from platform checks, or a failed/skipped/missing/manual/runtime/security/release/generated-freshness claim needs attention. |
| `Risk / Rollback` | The change is hard to revert, changes data, changes deployment, changes security posture, affects users, or has non-obvious failure modes. |
| `Migration / Rollout` | Merge order, data migration, feature flags, version compatibility, deployment sequence, or downstream adoption matters. |
| `Security / Privacy` | The change touches auth, authorization, secrets, sensitive data, logging, permissions, abuse controls, or disclosure surfaces. |
| `Visual Evidence` | The change is UI, visual, document-rendering, or media-facing and reviewers need screenshots, recordings, or rendered output. |
| `Non-Claims` | A reader could reasonably infer a stronger claim than the PR proves. |
| `Review Focus` | The reviewer should inspect a specific risk, boundary, generated surface, migration, or design tradeoff. |

Agents MUST omit optional sections whose trigger is false.

Agents MUST NOT publish empty sections, placeholder prompts, or routine
checklists in the final pull request body.

Evidence MAY exist as structured metadata without rendering a visible
`Evidence` section. Routine passing checks SHOULD stay out of the visible body
when the hosting platform already displays them. Missing, failed, skipped,
manual, security, runtime, release, migration, or reviewer-action evidence MUST
be visible when it changes the review decision.

## Issue Link Relationships

Every structured `Links` entry with `type: issue` MUST classify the relationship
between the pull request and the issue.

Allowed issue relationships are:

- `relates_to`: the issue provides context, but the PR does not claim to close
  or resolve it.
- `references`: the issue is a useful reference, but the PR has no lifecycle
  effect on it.
- `depends_on`: the PR depends on the issue or work tracked by it.
- `blocks`: the PR blocks the issue or work tracked by it.
- `supersedes`: the PR replaces the issue's proposed approach or tracked work.
- `duplicates`: the PR identifies the issue as a duplicate context surface.
- `fixes`: merging the PR is intended to fix the issue.
- `closes`: merging the PR is intended to close the issue.
- `resolves`: merging the PR is intended to resolve the issue.

`fixes`, `closes`, and `resolves` are closing relationships. Agents MUST use
platform closing keywords such as `Fixes #123`, `Closes #123`, or
`Resolves #123` only when the relationship is closing, the PR actually satisfies
the target issue, and the platform's target-branch semantics are intended.

Agents MUST use neutral wording for non-closing issue relationships. A related
issue is not the same claim as a resolved issue.

## Variant Graph

The decision tree starts from the universal core and adds triggered sections:

```text
all PRs
  -> Summary + Context
  -> if user/business/operator/developer effect: Impact
  -> if multi-surface or non-obvious diff: Changes
  -> if external owner surface matters: Links
  -> if issue link matters: classify issue relationship
  -> if proof-bearing claim changes human review: Evidence
  -> if risk or hard rollback exists: Risk / Rollback
  -> if sequencing matters: Migration / Rollout
  -> if auth/data/secrets/security touched: Security / Privacy
  -> if visual output matters: Visual Evidence
  -> if predictable overclaim exists: Non-Claims
  -> if reviewer path is non-obvious: Review Focus
```

Common variants:

- draft or blocked: add `Non-Claims` and `Review Focus` so reviewers do not
  mistake it for merge-ready work.
- documentation-only: `Summary`, `Context`; add `Impact` only if reader,
  support, legal, or docs-routing behavior changes.
- code behavior: add `Impact` and `Evidence` when behavior is asserted.
- refactor: add `Risk / Rollback` only if boundaries, generated contracts,
  performance, or behavior equivalence are non-obvious.
- dependency/config/CI: add `Impact`, `Risk / Rollback`, or `Evidence` when
  runtime, deploy, supply-chain, or developer-workflow behavior changes.
- generated artifacts: add `Links` to source and `Evidence` for freshness when
  freshness is claimed.
- security/privacy: add `Security / Privacy` and bounded non-claims; do not
  include secrets, credentials, exploit instructions, sensitive repository data,
  or disclosure details that belong in a private security channel.
- release or migration: add `Migration / Rollout`, `Risk / Rollback`, and
  evidence if readiness is claimed.
- emergency hotfix: include the emergency context, risk, rollback, and evidence
  that is actually available; do not imply full validation.

## Owned Claim Types

A pull request description MAY own only:

- `orientation`;
- `task_detail`;
- `evidence` when tied to evidence actually available for the pull request;
- `agent_instruction` only for reviewer focus inside the pull request.

## Forbidden Claim Types

A pull request description MUST NOT create or override:

- `requirement`;
- `architecture`;
- `decision`;
- `api_contract`;
- `security`;
- `runtime_fact`;
- `release_fact`;
- `release_guarantee`.

A pull request MAY cite owner surfaces for these claim types, but it MUST NOT
become the owner surface.

## Formatting Rules

- Use GitHub Markdown.
- Use `##` headings for included body sections.
- Keep `Summary` and `Context` concise.
- Prefer bullets for lists of changes, links, risks, and evidence.
- Do not include unchecked checklists as proof.
- Do not include a visible `Validation` section by default.
- Use `Evidence`, not `Validation`, when proof must be visible.
- Do not use issue closing keywords unless the PR is intended to close or
  resolve the referenced issue.
- Do not list commands that were not run unless the absence of evidence changes
  the review decision.
- Do not use promotional language.

## Failure Mode

Mandatory templates with many sections create unreadable pull request bodies.
Reviewers then skim past the description, agents fill placeholders, and the
standard loses authority. The correct invariant is not "every PR has every
section"; it is "every PR contains exactly the facts needed for the review
decision, no fewer and no more."

## Non-Claims

This standard does not define merge approval, release approval, CI requirements,
reviewer assignment policy, product requirements, architecture, or security
policy.

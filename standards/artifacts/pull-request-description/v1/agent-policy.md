# Agent Policy: Pull Request Description v1

Agents MUST use this standard when opening or updating a pull request in a
repository that adopts `artifact.pull-request-description.v1`.

For routine PR creation, agents MUST load `standard.yaml` as the final
instruction surface and use `schema.json` plus `semantic-rules.yaml` for
validation. Load `standard.md` only for rationale, dispute, exception, or
standard maintenance.

Before opening the pull request, agents MUST:

1. Inspect the diff.
2. Write a concise title.
3. State what changed in `Summary`.
4. State why the change exists in `Context`.
5. Classify the change against the decision tree.
6. Add optional sections only when their triggers are true.
7. Remove empty sections, placeholder comments, and routine checklist text.

Reviewer agents MUST use `review_questions` from `standard.yaml` as the audit
surface for pull request descriptions. Universal questions always apply.
Conditional questions apply only when their trigger is true.

Agents MUST NOT include a visible `Validation` section by default.

Agents MUST include `Evidence` only when the pull request makes a proof-bearing
claim that changes the review decision.

Agents MUST NOT use filler text, hidden assumptions, generated praise, or
evidence-shaped statements for checks that were not run.

# Formal model and proof boundary

This model is owned by `meta.standard-package.v1` through its adopted package
contract. It describes the proof records required for that contract; it does not
approve its own repository adoption or prove external facts.

## Goals, choices and claims

Each proof names its scope, Boolean atoms and premises. `accepted_goal` and
`accepted_policy` are explicit normative assumptions selected by adoption, not
facts proved by logic. `definition` gives a model relation.
`environment_assumption` needs independent evidence before use. A `policy_choice`
record explains the chosen interface/default and an alternative; it is never a
claim of unique universal necessity. A `conditional_invariant` proves only the
stated consequence while its premises hold.

For each arbitrary artifact/action x in the stated domain, the finite formulas
mean Gamma(x) entails Conclusion(x). Pointwise validity lifts to all x satisfying
that domain and those premises. It does not establish that the domain model is
complete, that a factual trigger is true, or that an agent executes instructions.
A normative precondition cannot prove an empirical performance benefit. Avoid
claiming that an invariant is derived when its necessity is merely restated as
an unacknowledged premise: these records expose that normative choice explicitly.

## Checked fragment

Formulas use Boolean constants, declared atoms, `not`, `all`, `any`, and binary
`implies`. `all`/`any` are nonempty. At most twelve atoms are admitted. The validator
checks every valuation: the premises must have a model, and every model must
satisfy the conclusion. The countermodel must satisfy all but one identified
premise and falsify both that premise and the conclusion. This establishes the
importance of that assumption and prevents inconsistent-premise vacuity.

A valid record is a checked conditional consequence, not semantic acceptance of
its premise text, a complete formalization of a natural-language standard, or
an automated proof of the chosen policy's optimality. Review must still assess
model adequacy, independent premises, necessity of the policy, alternatives,
applicability and the mapping from rule text to the formula. If that review is
unavailable, report the missing semantic evidence instead of upgrading the
Boolean result to an unconditional theorem.

## Independent dimensions

Authority is a scoped delegation relation, not a total order of file formats.
Unknown is lack of knowledge, not evidence for negation. Freshness is a checked
render relation; canonicality is an ownership decision. Readiness and urgency
are independent. Evidence retention and visible rendering are independent.
Deterministic computation can prove semantic properties of an explicit model;
a syntax-only pass proves no unrelated semantic assertion.

For PR sections, the adopted completeness condition is Relevant -> Render;
the selected no-filler policy is Render -> Relevant. Together they imply their
biconditional. Relevance is determined from the canonical decision tree and
independent facts, never inferred solely from the producer's decision to render.
Alternative sufficient prose summaries may exist. This model proves no unique
minimum token count and no universal theorem about all reviewers.

## Necessity of a decision-relevant distinction

The separation witnesses do more than restate compliance as a premise. They
exhibit two bounded worlds needing opposite decisions. Without the identified
information, the available inputs are identical. A deterministic procedure cannot
choose opposite outputs for identical inputs; hence it cannot guarantee both
correct decisions without that information or an equivalent route to it. The
finite model checks this contradiction. The world pair and decision goal are
explicit assumptions for semantic review, not facts certified by the checker.
This information-necessity result does not prove that any particular file name,
section heading, or duplicated copy is necessary. Those choices remain policies.

# Pull Request Description Artifact Standard v1

## Status, scope and owners

Active when adopted. This package governs a PR title, structured draft and
rendered body. The hosting platform owns the stored title/body. The draft is a
prepublication representation; the GitHub template is a starter, not an owner.

A PR description owns orientation, task detail, available evidence references,
and reviewer guidance within the PR. It MUST NOT establish requirements,
architecture, decisions, API contracts, security policy, runtime facts or release
facts/guarantees. It may cite the owners of those claims. A non-claim cannot
cancel a positive unsupported assertion about the same scope.

The executable artifact-validity contract is standard.yaml.agent_contract,
schema.json and semantic-rules.yaml. standard.md owns their interpretation and
justification. The exact runtime core is generated from those machine contracts;
producer, reviewer and renderer load the same core and the same schema. Overlays
add workflow only. The proof owner is
`standards/artifacts/pull-request-description/v1/proofs.yaml`.

## Information goal and chosen representation

Reviewers need to identify the change, understand its purpose and inspect each
material review obligation in this declared model. This is an adopted review
goal, not a universal sufficiency theorem for every possible reviewer or change.
If two changes have the same description but different review-relevant purposes,
a reader cannot infer which purpose is intended from that description alone.
Supplying the missing distinction, or an exact accessible owner reference, is
necessary for that bounded information goal. It does not require a particular
English heading or prove unique optimal prose.

This profile chooses Summary and Context as stable renderer/consumer names.
Every final body MUST provide both sections. The title MUST identify the change
when read separately in history; an imperative or noun phrase is recommended.
These are explicit interoperability choices. Other formats can carry the same
information under a different adopted profile. The Evidence heading is likewise
the selected name for visible proof; Validation is not a second section name in
this profile. No general cognitive benefit from this spelling is claimed.

## Structured inputs

The draft MUST include schema_version, artifact_type, title, summary, context,
review_scope, change_profiles, readiness_state, urgency and review_facts.
review_scope identifies changed owners. It does not always require a visible
Changes section when Summary and the diff already identify the surface.

Profiles compose independently. Readiness is draft, blocked or ready_for_review;
urgency is normal or emergency. Emergency is neither a profile nor a readiness
state. A blocked emergency and a ready emergency both retain their emergency
obligations.

The exact meanings of every `review_facts` member are defined in
`standard.yaml.agent_contract.semantic_obligations`, so routine and compact
consumers receive the same independently reviewed predicates. In particular,
the expanded-review predicate assesses Summary and the platform diff; private
draft metadata cannot establish that those visible surfaces are sufficient.

Values are true, false or unknown. The producer MUST collect facts from the diff,
owner surfaces and available evidence; a reviewer MUST assess their truth, not
merely their presence. Unknown is not false and prevents a compliance claim for
an unresolved section. Boolean validation does not prove these factual inputs.

## Single section-selection rule

standard.yaml.agent_contract.decision_tree.when is the sole executable section
selection model. It uses Boolean constants, fact/profile/readiness/urgency tests,
field absence, any and all. any is true if a child is true; all is false if a
child is false; otherwise an unknown child propagates unknown. Include the union
of all sections selected by true rules. Omit a section only if every rule
selecting it is false. Do not maintain a separate conflicting omit predicate.

Before validating drafts, the PR model validator MUST check every predicate,
including branches that evaluation could short-circuit. A predicate is a Boolean
or an object with exactly one of `fact`, `profile`, `readiness`, `urgency`,
`absent`, `any`, or `all`. Composite predicates have nonempty arrays of valid
children. Leaves MUST belong to the selected artifact schema's corresponding
fact, profile, readiness, urgency, or top-level field domain. Every selected
section MUST be declared, every declared section MUST have a decision rule,
and the required/optional section sets MUST be disjoint and map uniquely to
existing artifact fields.

The local vocabulary-extraction profile reads direct top-level `properties`,
direct `review_facts.properties` with exactly the existing true/false/unknown
value domain, `change_profiles.items.enum`, `readiness_state.enum`, and
`urgency.enum`. It rejects unsupported vocabulary layouts with a profile
diagnostic instead of silently omitting their members. This profile is not a
general JSON Schema equivalence analyzer: artifact admission independently
evaluates the complete selected schema, including its conditional constraints.
Equivalent layouts outside this extraction profile require an explicit adapter
update before PR model validation can use them.

The selected profile includes these explicit conservative defaults: migration
and release require sequencing and reversal context; emergency requires reversal
context and Non-Claims; draft/blocked readiness requires Non-Claims and Review
Focus. These defaults are adopted review policy, not deductions that all such
changes are inherently irreversible. They override an ordinary false risk/focus
fact through disjunction, so there is one answer even for an obvious draft.

For a trivial reversible user-facing or dependency correction outside those
profiles, risk=false means no Risk / Rollback section. A material risk sets it
true. The former contradictory include-and-omit category rules do not apply.

For each section s in the fixed model, completeness requires Needed(s) ->
Render(s). The chosen no-filler convention requires Render(s) -> Needed(s).
Together these imply the biconditional, conditional on correct facts and the
adopted convention. This does not prove a unique smallest body or completeness
for unmodeled concerns. A newly discovered material concern requires revisiting
the fact/model classification before declaring compliance.

## Evidence retention and presentation

Required evidence MUST remain available in the structured draft or its exact
owner reference, even when visible_evidence=false. The single resolved
visible_evidence predicate controls Evidence rendering. Evidence metadata is the one
optional draft field whose presence does not imply rendering. All other optional
fields map to their selected visible sections. A material missing result should
be recorded with an explicit unavailable/skipped/not-run status and limitation.

Every evidence scope MUST identify repository, head_ref and immutable head_sha;
base_sha is needed when the claim depends on a comparison base. Positive or
observed results (passed, failed, observed, linked) MUST include an evidence_ref
URI. The consumer MUST verify that the reference identifies that exact target
and supports the claimed result. A branch name, arbitrary URI or command string
alone is not proof. No claim may move from an old SHA to a newer branch head.

The v1 schema admits `evidence_class` and `result` as independent domains,
subject to its existing scope and reference requirements. Enum membership does
not prove a claim or establish an unstated class/result cross-product policy.
Whether a pair supports its claim remains evidence review. A new rejection
rule for currently admitted pairs requires an explicit versioned owner change;
this standard does not silently narrow v1 by inference from enum names.

The generated profile requires source owner Links and evidence or an explicit
freshness non-claim. The migration/release profiles require evidence or explicit
readiness non-claims. These alternatives bound absent assertions; they never
allow retaining an unsupported positive freshness/readiness assertion.

## Issue relationships and questions

Every issue link MUST classify its relationship. relates_to, references,
depends_on, blocks, supersedes and duplicates are non-closing. fixes, closes and
resolves are closing. Closing wording MUST be used only when the PR actually
satisfies the issue, closure is intended and the platform target-branch semantics
have been verified. A relationship label alone does not prove those predicates.

Use the question set in agent_contract.review_questions as a finite review aid.
Answer universal questions and applicable conditional questions via selected
sections, platform evidence and exact owner references. Do not render a routine
questionnaire. These questions do not create additional section requirements
outside the decision tree or prove exhaustive review of arbitrary concerns.

## Formatting and sensitive information

Use the selected section names, concise accurate text and links to claim owners.
Do not publish empty sections, placeholders, ceremonial checklists or promotional
claims. Preserve material limitations. Security/privacy descriptions must respect
the independently authorized disclosure boundary: do not include secrets,
credentials or private incident details. The section name grants no disclosure
permission. Templates accelerate drafting but do not add validity rules.

## Non-claims

This package does not approve merges or releases, set required GitHub checks,
prove production readiness, authorize disclosures, or install executable harness
skills. Schema conformance, finite logical consequence, evidence authenticity
and actual agent execution are separate claims.
